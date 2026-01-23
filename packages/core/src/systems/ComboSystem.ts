import { ComboDefinition, ComboState, CardDefinition, GameState, ResolvedEffect } from '../types';
import { EffectResolver, EffectContext } from '../card/EffectResolver';
import { EventBus } from '../event';

export interface ComboSystemOptions {
  comboDefinitions: ComboDefinition[];
  cardDefinitions: Map<string, CardDefinition>;
  effectResolver: EffectResolver;
  eventBus: EventBus;
  recentCardsLimit?: number; // How many recent cards to track for cross-turn combos
}

/**
 * ComboSystem manages card combination detection and effects
 */
export class ComboSystem {
  private combos: Map<string, ComboDefinition> = new Map();
  private cardDefinitions: Map<string, CardDefinition>;
  private effectResolver: EffectResolver;
  private eventBus: EventBus;
  private recentCardsLimit: number;

  // Per-player combo state
  private playerStates: Map<string, ComboState> = new Map();

  /** 取消订阅函数 */
  private unsubscribers: (() => void)[] = [];

  constructor(options: ComboSystemOptions) {
    this.cardDefinitions = options.cardDefinitions;
    this.effectResolver = options.effectResolver;
    this.eventBus = options.eventBus;
    this.recentCardsLimit = options.recentCardsLimit ?? 10;

    for (const combo of options.comboDefinitions) {
      this.combos.set(combo.id, combo);
    }

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.unsubscribers.push(
      this.eventBus.on('turn_started', (event) => {
        const playerId = event.data.playerId as string;
        this.onTurnStart(playerId);
      })
    );
  }

  /**
   * Initialize combo state for a player
   */
  initializePlayer(playerId: string): void {
    this.playerStates.set(playerId, {
      playedCardsThisTurn: [],
      playedTagsThisTurn: [],
      recentCards: [],
      triggeredCombos: new Map(),
    });
  }

  /**
   * Reset turn-specific state at the start of a turn
   */
  private onTurnStart(playerId: string): void {
    const state = this.playerStates.get(playerId);
    if (state) {
      state.playedCardsThisTurn = [];
      state.playedTagsThisTurn = [];
    }
  }

  /**
   * Record a card play and check for combos
   * Returns triggered combo effects
   */
  onCardPlayed(
    playerId: string,
    cardId: string,
    gameState: GameState
  ): { combo: ComboDefinition; effects: ResolvedEffect[] }[] {
    const state = this.getOrCreateState(playerId);
    const cardDef = this.cardDefinitions.get(cardId);

    if (!cardDef) return [];

    // Record the card play
    state.playedCardsThisTurn.push(cardId);
    state.recentCards.push(cardId);

    // Keep recent cards limited
    while (state.recentCards.length > this.recentCardsLimit) {
      state.recentCards.shift();
    }

    // Record tags
    if (cardDef.tags) {
      state.playedTagsThisTurn.push(...cardDef.tags);
    }

    // Check for triggered combos
    const triggered: { combo: ComboDefinition; effects: ResolvedEffect[] }[] = [];

    for (const combo of this.combos.values()) {
      if (this.checkComboTrigger(combo, state, gameState)) {
        // Check cooldown
        const lastTriggered = state.triggeredCombos.get(combo.id);
        if (
          lastTriggered !== undefined &&
          combo.cooldown !== undefined &&
          combo.cooldown > 0 &&
          gameState.turn - lastTriggered < combo.cooldown
        ) {
          continue; // Still on cooldown
        }

        // Trigger the combo
        const context: EffectContext = {
          gameState,
          sourcePlayerId: playerId,
        };

        const effects = this.effectResolver.resolveAll(combo.effects, context);

        // Record trigger time
        state.triggeredCombos.set(combo.id, gameState.turn);

        triggered.push({ combo, effects });

        // Emit event
        this.eventBus.emitSimple(
          'combo_triggered',
          {
            playerId,
            comboId: combo.id,
            comboName: combo.name,
            effects,
          },
          gameState
        );
      }
    }

    return triggered;
  }

  /**
   * Check if a combo's trigger condition is met
   */
  private checkComboTrigger(
    combo: ComboDefinition,
    state: ComboState,
    _gameState: GameState
  ): boolean {
    const trigger = combo.trigger;

    switch (trigger.type) {
      case 'sequence':
        return this.checkSequenceTrigger(trigger.cards, state.playedCardsThisTurn);

      case 'combination':
        return this.checkCombinationTrigger(trigger.cards, state.playedCardsThisTurn);

      case 'tag_sequence':
        return this.checkTagSequenceTrigger(trigger.tags, state.playedTagsThisTurn, trigger.count);

      case 'tag_count':
        return this.checkTagCountTrigger(trigger.tag, trigger.count, state.playedTagsThisTurn);

      default:
        return false;
    }
  }

  /**
   * Check if cards were played in exact sequence (can be part of larger sequence)
   */
  private checkSequenceTrigger(requiredCards: string[], playedCards: string[]): boolean {
    if (playedCards.length < requiredCards.length) return false;

    // Check if the last N cards match the required sequence
    const lastN = playedCards.slice(-requiredCards.length);
    return requiredCards.every((card, index) => lastN[index] === card);
  }

  /**
   * Check if all required cards were played this turn (any order)
   */
  private checkCombinationTrigger(requiredCards: string[], playedCards: string[]): boolean {
    const playedSet = new Set(playedCards);
    return requiredCards.every((card) => playedSet.has(card));
  }

  /**
   * Check if tags were played in sequence
   */
  private checkTagSequenceTrigger(
    requiredTags: string[],
    playedTags: string[],
    count?: number
  ): boolean {
    const minCount = count ?? requiredTags.length;
    if (playedTags.length < minCount) return false;

    // Find subsequence matching tags in order
    let tagIndex = 0;
    for (const tag of playedTags) {
      if (tag === requiredTags[tagIndex]) {
        tagIndex++;
        if (tagIndex >= requiredTags.length) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if N cards with a specific tag were played this turn
   */
  private checkTagCountTrigger(tag: string, count: number, playedTags: string[]): boolean {
    const tagCount = playedTags.filter((t) => t === tag).length;
    return tagCount >= count;
  }

  /**
   * Get or create combo state for a player
   */
  private getOrCreateState(playerId: string): ComboState {
    let state = this.playerStates.get(playerId);
    if (!state) {
      state = {
        playedCardsThisTurn: [],
        playedTagsThisTurn: [],
        recentCards: [],
        triggeredCombos: new Map(),
      };
      this.playerStates.set(playerId, state);
    }
    return state;
  }

  /**
   * Get all combo definitions
   */
  getCombos(): ComboDefinition[] {
    return Array.from(this.combos.values());
  }

  /**
   * Get player's combo state
   */
  getPlayerState(playerId: string): ComboState | undefined {
    return this.playerStates.get(playerId);
  }

  /**
   * Add a new combo definition
   */
  addCombo(combo: ComboDefinition): void {
    this.combos.set(combo.id, combo);
  }

  /**
   * Remove a combo definition
   */
  removeCombo(comboId: string): boolean {
    return this.combos.delete(comboId);
  }

  /**
   * Reset all player states
   */
  reset(): void {
    this.playerStates.clear();
  }

  /**
   * 清理资源，移除所有事件监听器
   */
  destroy(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    this.playerStates.clear();
  }
}
