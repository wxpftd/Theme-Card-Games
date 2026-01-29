import {
  ComboDefinition,
  ComboState,
  CardDefinition,
  GameState,
  ResolvedEffect,
  ComboPreview,
} from '../types';
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
   * 获取当前可触发的 combo 预览信息
   * 分析手牌和本回合已打出的卡牌，返回哪些 combo 可以被触发以及还需要哪些卡牌
   */
  getAvailableCombos(
    playerId: string,
    handCards: { definitionId: string }[],
    gameState: GameState
  ): ComboPreview[] {
    const state = this.getOrCreateState(playerId);
    const previews: ComboPreview[] = [];

    // 手牌中的卡牌 definitionId 列表
    const handCardIds = handCards.map((c) => c.definitionId);
    // 手牌的标签列表
    const handTags: string[] = [];
    for (const defId of handCardIds) {
      const cardDef = this.cardDefinitions.get(defId);
      if (cardDef?.tags) {
        handTags.push(...cardDef.tags);
      }
    }

    for (const combo of this.combos.values()) {
      // 检查冷却
      const lastTriggered = state.triggeredCombos.get(combo.id);
      if (
        lastTriggered !== undefined &&
        combo.cooldown !== undefined &&
        combo.cooldown > 0 &&
        gameState.turn - lastTriggered < combo.cooldown
      ) {
        continue; // 还在冷却中
      }

      const preview = this.analyzeComboProgress(
        combo,
        state.playedCardsThisTurn,
        state.playedTagsThisTurn,
        handCardIds,
        handTags
      );

      if (preview) {
        previews.push(preview);
      }
    }

    // 按进度排序，进度高的在前
    return previews.sort((a, b) => b.progress - a.progress);
  }

  /**
   * 分析单个 combo 的进度
   */
  private analyzeComboProgress(
    combo: ComboDefinition,
    playedCards: string[],
    playedTags: string[],
    handCardIds: string[],
    handTags: string[]
  ): ComboPreview | null {
    const trigger = combo.trigger;

    switch (trigger.type) {
      case 'combination': {
        const requiredCards = trigger.cards;
        const playedSet = new Set(playedCards);
        const handSet = new Set(handCardIds);

        const alreadyPlayed = requiredCards.filter((c) => playedSet.has(c));
        const stillNeeded = requiredCards.filter((c) => !playedSet.has(c));
        const canComplete = stillNeeded.every((c) => handSet.has(c));

        if (alreadyPlayed.length === 0 && !canComplete) {
          return null; // 还没开始且手牌也不足，不显示
        }

        return {
          combo,
          progress: alreadyPlayed.length / requiredCards.length,
          alreadyPlayed,
          stillNeeded,
          canComplete,
        };
      }

      case 'sequence': {
        const requiredCards = trigger.cards;
        const playedMatch = this.getSequenceProgress(requiredCards, playedCards);
        const stillNeeded = requiredCards.slice(playedMatch.length);
        const handSet = new Set(handCardIds);
        const canComplete = stillNeeded.every((c) => handSet.has(c));

        if (playedMatch.length === 0 && !canComplete) {
          return null;
        }

        return {
          combo,
          progress: playedMatch.length / requiredCards.length,
          alreadyPlayed: playedMatch,
          stillNeeded,
          canComplete,
        };
      }

      case 'tag_count': {
        const requiredTag = trigger.tag;
        const requiredCount = trigger.count;
        const playedCount = playedTags.filter((t) => t === requiredTag).length;
        const handCount = handTags.filter((t) => t === requiredTag).length;
        const canComplete = playedCount + handCount >= requiredCount;

        if (playedCount === 0 && !canComplete) {
          return null;
        }

        return {
          combo,
          progress: playedCount / requiredCount,
          alreadyPlayed: [], // 标签类不列出具体卡牌
          stillNeeded: [],
          stillNeededCount: Math.max(0, requiredCount - playedCount),
          requiredTag,
          canComplete,
        };
      }

      case 'tag_sequence': {
        const requiredTags = trigger.tags;
        const minCount = trigger.count ?? requiredTags.length;
        let matchedCount = 0;
        let tagIndex = 0;

        for (const tag of playedTags) {
          if (tag === requiredTags[tagIndex]) {
            tagIndex++;
            matchedCount++;
            if (tagIndex >= requiredTags.length) break;
          }
        }

        // 检查手牌是否能补足
        const remainingTags = requiredTags.slice(tagIndex);
        const handTagSet = new Set(handTags);
        const canComplete = remainingTags.every((t) => handTagSet.has(t));

        if (matchedCount === 0 && !canComplete) {
          return null;
        }

        return {
          combo,
          progress: matchedCount / minCount,
          alreadyPlayed: [],
          stillNeeded: [],
          stillNeededCount: Math.max(0, minCount - matchedCount),
          requiredTags: remainingTags,
          canComplete,
        };
      }

      default:
        return null;
    }
  }

  /**
   * 获取顺序 combo 的进度（已匹配的前缀长度）
   */
  private getSequenceProgress(requiredCards: string[], playedCards: string[]): string[] {
    const matched: string[] = [];
    let reqIndex = 0;

    for (const played of playedCards) {
      if (played === requiredCards[reqIndex]) {
        matched.push(played);
        reqIndex++;
        if (reqIndex >= requiredCards.length) break;
      }
    }

    return matched;
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
