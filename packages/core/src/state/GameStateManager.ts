import {
  GameState,
  GamePhase,
  PlayerState,
  GameConfig,
  GameAction,
  CardDefinition,
  ComboDefinition,
  StatusDefinition,
  CardUpgradeDefinition,
  RandomEventDefinition,
  RandomEventConfig,
  RandomEventResult,
  ResolvedEffect,
  AchievementDefinition,
  DifficultyDefinition,
  DailyChallengeConfig,
  DifficultyLevel,
  GameSessionStats,
  MilestoneWinConfig,
} from '../types';
import { EventBus } from '../event';
import { Card, Deck, Hand, EffectResolver } from '../card';
import { ComboSystem } from '../systems/ComboSystem';
import { StatusEffectSystem } from '../systems/StatusEffectSystem';
import { CardUpgradeSystem } from '../systems/CardUpgradeSystem';
import { RandomEventSystem, RandomEventCustomHandler } from '../systems/RandomEventSystem';
import { AchievementSystem, CustomAchievementChecker } from '../systems/AchievementSystem';
import { DifficultySystem, CustomDifficultyRuleHandler } from '../systems/DifficultySystem';
import { DailyChallengeSystem, CustomChallengeChecker } from '../systems/DailyChallengeSystem';
import { MilestoneSystem, CustomMilestoneChecker } from '../systems/MilestoneSystem';
import { generateId, deepClone } from '../utils';

export interface GameStateManagerOptions {
  config: GameConfig;
  cardDefinitions: CardDefinition[];
  comboDefinitions?: ComboDefinition[];
  statusDefinitions?: StatusDefinition[];
  cardUpgrades?: CardUpgradeDefinition[];
  randomEventDefinitions?: RandomEventDefinition[];
  randomEventConfig?: RandomEventConfig;
  randomEventCustomHandlers?: Record<string, RandomEventCustomHandler>;
  achievementDefinitions?: AchievementDefinition[];
  achievementCustomCheckers?: Record<string, CustomAchievementChecker>;
  difficultyDefinitions?: DifficultyDefinition[];
  difficultyCustomRuleHandlers?: Record<string, CustomDifficultyRuleHandler>;
  dailyChallengeConfig?: DailyChallengeConfig;
  dailyChallengeCustomCheckers?: Record<string, CustomChallengeChecker>;
  milestoneConfig?: MilestoneWinConfig;
  milestoneCustomCheckers?: Record<string, CustomMilestoneChecker>;
  eventBus?: EventBus;
  effectResolver?: EffectResolver;
}

/**
 * GameStateManager handles the central game state
 */
export class GameStateManager {
  private state: GameState;
  private cardDefinitions: Map<string, CardDefinition>;
  private eventBus: EventBus;
  private effectResolver: EffectResolver;
  private playerDecks: Map<string, Deck> = new Map();
  private playerHands: Map<string, Hand> = new Map();

  // Game systems
  private comboSystem: ComboSystem | null = null;
  private statusEffectSystem: StatusEffectSystem | null = null;
  private cardUpgradeSystem: CardUpgradeSystem | null = null;
  private randomEventSystem: RandomEventSystem | null = null;
  private achievementSystem: AchievementSystem | null = null;
  private difficultySystem: DifficultySystem | null = null;
  private dailyChallengeSystem: DailyChallengeSystem | null = null;
  private milestoneSystem: MilestoneSystem | null = null;

  /** State version counter for change detection */
  private stateVersion: number = 0;
  /** Cached shallow snapshot */
  private cachedSnapshot: GameState | null = null;
  private cachedSnapshotVersion: number = -1;

  constructor(options: GameStateManagerOptions) {
    this.cardDefinitions = new Map(options.cardDefinitions.map((def) => [def.id, def]));
    this.eventBus = options.eventBus ?? new EventBus();
    this.effectResolver = options.effectResolver ?? new EffectResolver();

    this.state = this.createInitialState(options.config);

    // Initialize game systems
    if (options.comboDefinitions && options.comboDefinitions.length > 0) {
      this.comboSystem = new ComboSystem({
        comboDefinitions: options.comboDefinitions,
        cardDefinitions: this.cardDefinitions,
        effectResolver: this.effectResolver,
        eventBus: this.eventBus,
      });
    }

    if (options.statusDefinitions && options.statusDefinitions.length > 0) {
      this.statusEffectSystem = new StatusEffectSystem({
        statusDefinitions: options.statusDefinitions,
        effectResolver: this.effectResolver,
        eventBus: this.eventBus,
      });
    }

    if (options.cardUpgrades && options.cardUpgrades.length > 0) {
      this.cardUpgradeSystem = new CardUpgradeSystem({
        upgradeDefinitions: options.cardUpgrades,
        cardDefinitions: this.cardDefinitions,
        eventBus: this.eventBus,
      });
    }

    if (options.randomEventDefinitions && options.randomEventDefinitions.length > 0) {
      const defaultConfig: RandomEventConfig = {
        triggerInterval: 3,
        triggerProbability: 0.3,
        announceEvent: true,
      };
      this.randomEventSystem = new RandomEventSystem({
        eventDefinitions: options.randomEventDefinitions,
        config: options.randomEventConfig ?? defaultConfig,
        effectResolver: this.effectResolver,
        eventBus: this.eventBus,
        customHandlers: options.randomEventCustomHandlers,
      });
    }

    // Initialize achievement system
    if (options.achievementDefinitions && options.achievementDefinitions.length > 0) {
      this.achievementSystem = new AchievementSystem({
        achievementDefinitions: options.achievementDefinitions,
        cardDefinitions: this.cardDefinitions,
        eventBus: this.eventBus,
        customCheckers: options.achievementCustomCheckers,
      });
    }

    // Initialize difficulty system
    if (options.difficultyDefinitions && options.difficultyDefinitions.length > 0) {
      this.difficultySystem = new DifficultySystem({
        difficultyDefinitions: options.difficultyDefinitions,
        eventBus: this.eventBus,
        customRuleHandlers: options.difficultyCustomRuleHandlers,
      });
    }

    // Initialize daily challenge system
    if (options.dailyChallengeConfig && options.dailyChallengeConfig.challengePool.length > 0) {
      this.dailyChallengeSystem = new DailyChallengeSystem({
        challengeConfig: options.dailyChallengeConfig,
        cardDefinitions: this.cardDefinitions,
        eventBus: this.eventBus,
        customCheckers: options.dailyChallengeCustomCheckers,
      });
    }

    // Initialize milestone system
    if (options.milestoneConfig && options.milestoneConfig.milestones.length > 0) {
      this.milestoneSystem = new MilestoneSystem({
        milestoneConfig: options.milestoneConfig,
        effectResolver: this.effectResolver,
        eventBus: this.eventBus,
        customCheckers: options.milestoneCustomCheckers,
      });
    }

    this.setupSystemEventListeners();
  }

  /**
   * Setup event listeners for system integration
   */
  private setupSystemEventListeners(): void {
    // Process status effects at turn boundaries
    this.eventBus.on('turn_started', (event) => {
      const playerId = event.data.playerId as string;
      this.processStatusTurnStart(playerId);
    });

    this.eventBus.on('turn_ended', (event) => {
      const playerId = event.data.playerId as string;
      this.processStatusTurnEnd(playerId);
    });
  }

  /**
   * Process status effects at turn start
   */
  private processStatusTurnStart(playerId: string): void {
    if (!this.statusEffectSystem) return;

    const player = this.state.players[playerId];
    if (!player) return;

    const effects = this.statusEffectSystem.processTurnStart(playerId, player, this.state);
    if (effects.length > 0) {
      this.invalidateCache();
    }
  }

  /**
   * Process status effects at turn end
   */
  private processStatusTurnEnd(playerId: string): void {
    if (!this.statusEffectSystem) return;

    const player = this.state.players[playerId];
    if (!player) return;

    const effects = this.statusEffectSystem.processTurnEnd(playerId, player, this.state);
    if (effects.length > 0) {
      this.invalidateCache();
    }
  }

  /**
   * Increment state version to invalidate caches
   */
  private invalidateCache(): void {
    this.stateVersion++;
  }

  /**
   * Get current state version for change detection
   */
  get version(): number {
    return this.stateVersion;
  }

  // Getters
  /**
   * Returns a deep clone of the current state.
   * Use getStateSnapshot() for better performance when you only need to read the state.
   * @deprecated Consider using getStateSnapshot() for read-only access
   */
  get currentState(): GameState {
    return deepClone(this.state);
  }

  /**
   * Returns a shallow snapshot of the current state.
   * This is more performant than currentState but modifications to nested objects
   * will affect the original state. Use for read-only access.
   */
  getStateSnapshot(): Readonly<GameState> {
    // Return cached snapshot if state hasn't changed
    if (this.cachedSnapshot && this.cachedSnapshotVersion === this.stateVersion) {
      return this.cachedSnapshot;
    }

    // Create shallow snapshot with shallow-cloned players
    this.cachedSnapshot = {
      ...this.state,
      players: { ...this.state.players },
      sharedState: { ...this.state.sharedState },
      history: [...this.state.history],
    };
    this.cachedSnapshotVersion = this.stateVersion;

    return this.cachedSnapshot;
  }

  get phase(): GamePhase {
    return this.state.phase;
  }

  get turn(): number {
    return this.state.turn;
  }

  get currentPlayerId(): string {
    return this.state.currentPlayerId;
  }

  get events(): EventBus {
    return this.eventBus;
  }

  get effects(): EffectResolver {
    return this.effectResolver;
  }

  /**
   * Create the initial game state
   */
  private createInitialState(config: GameConfig): GameState {
    return {
      id: generateId('game'),
      phase: 'setup',
      turn: 0,
      currentPlayerId: '',
      players: {},
      sharedState: {},
      history: [],
      config,
    };
  }

  /**
   * Add a player to the game
   */
  addPlayer(id: string, name: string): PlayerState | null {
    const { config } = this.state;

    if (Object.keys(this.state.players).length >= config.maxPlayers) {
      return null;
    }

    const playerState: PlayerState = {
      id,
      name,
      stats: { ...config.initialStats },
      resources: { ...config.initialResources },
      statuses: [],
      hand: [],
      deck: [],
      discardPile: [],
      playArea: [],
    };

    this.state.players[id] = playerState;
    this.invalidateCache();

    // Create deck and hand for player
    const deck = Deck.fromDefinitions(Array.from(this.cardDefinitions.values()));
    deck.shuffle();
    this.playerDecks.set(id, deck);

    const hand = new Hand(config.maxHandSize);
    this.playerHands.set(id, hand);

    // Set first player as current player
    if (!this.state.currentPlayerId) {
      this.state.currentPlayerId = id;
    }

    // Initialize player in game systems
    this.comboSystem?.initializePlayer(id);
    this.cardUpgradeSystem?.initializePlayer(id);
    this.milestoneSystem?.initializePlayer(id, playerState);

    this.eventBus.emitSimple(
      'custom',
      { subtype: 'player_joined', playerId: id, name },
      this.state
    );

    return playerState;
  }

  /**
   * Remove a player from the game
   */
  removePlayer(playerId: string): boolean {
    if (!this.state.players[playerId]) {
      return false;
    }

    delete this.state.players[playerId];
    this.playerDecks.delete(playerId);
    this.playerHands.delete(playerId);
    this.invalidateCache();

    return true;
  }

  /**
   * Get a player's state
   */
  getPlayer(playerId: string): PlayerState | null {
    return this.state.players[playerId] ?? null;
  }

  /**
   * Get all players
   */
  getAllPlayers(): PlayerState[] {
    return Object.values(this.state.players);
  }

  /**
   * Get a player's deck
   */
  getPlayerDeck(playerId: string): Deck | null {
    return this.playerDecks.get(playerId) ?? null;
  }

  /**
   * Get a player's hand
   */
  getPlayerHand(playerId: string): Hand | null {
    return this.playerHands.get(playerId) ?? null;
  }

  /**
   * Start the game
   */
  startGame(): boolean {
    const playerCount = Object.keys(this.state.players).length;
    const { minPlayers } = this.state.config;

    if (playerCount < minPlayers) {
      return false;
    }

    // Draw initial hands
    for (const playerId of Object.keys(this.state.players)) {
      this.drawCards(playerId, this.state.config.initialHandSize);
    }

    this.state.phase = 'draw';
    this.state.turn = 1;
    this.invalidateCache();

    this.eventBus.emitSimple('game_started', {}, this.state);
    this.eventBus.emitSimple(
      'turn_started',
      { turn: 1, playerId: this.state.currentPlayerId },
      this.state
    );

    return true;
  }

  /**
   * Change game phase
   */
  setPhase(phase: GamePhase): void {
    const previousPhase = this.state.phase;
    this.state.phase = phase;
    this.invalidateCache();

    this.eventBus.emitSimple('phase_changed', { from: previousPhase, to: phase }, this.state);
  }

  /**
   * Draw cards for a player
   */
  drawCards(playerId: string, count: number = 1): Card[] {
    const deck = this.playerDecks.get(playerId);
    const hand = this.playerHands.get(playerId);
    const player = this.state.players[playerId];

    if (!deck || !hand || !player) {
      return [];
    }

    const drawn: Card[] = [];

    for (let i = 0; i < count; i++) {
      // Reshuffle discard if deck is empty
      if (deck.isEmpty && deck.discardSize > 0) {
        deck.reshuffleDiscard();
      }

      if (deck.isEmpty) {
        break;
      }

      const card = deck.draw();
      if (card) {
        const overflow = hand.addCard(card) ? null : card;
        if (overflow) {
          // Hand is full, discard the card
          deck.discard(card);
          this.eventBus.emitSimple(
            'card_discarded',
            {
              playerId,
              cardId: card.id,
              reason: 'hand_full',
            },
            this.state
          );
        } else {
          drawn.push(card);
          // Sync to player state
          player.hand.push(card.getInstance());
          this.eventBus.emitSimple('card_drawn', { playerId, cardId: card.id }, this.state);
        }
      }
    }

    // Sync deck state
    player.deck = deck.getCards().map((c) => c.getInstance());
    this.invalidateCache();

    return drawn;
  }

  /**
   * Play a card from hand
   */
  playCard(playerId: string, cardId: string, targets?: Record<string, string>): boolean {
    const hand = this.playerHands.get(playerId);
    const deck = this.playerDecks.get(playerId);
    const player = this.state.players[playerId];

    if (!hand || !player || !deck) {
      return false;
    }

    const card = hand.playCard(cardId);
    if (!card) {
      return false;
    }

    // Resolve card effects
    const context = {
      gameState: this.state,
      sourceCard: card,
      sourcePlayerId: playerId,
      targetPlayerId: targets?.player,
    };

    const results = this.effectResolver.resolveAll(card.effects, context);

    // Check for combos
    const comboResults: ResolvedEffect[] = [];
    if (this.comboSystem) {
      const triggered = this.comboSystem.onCardPlayed(playerId, card.definitionId, this.state);
      for (const { effects } of triggered) {
        comboResults.push(...effects);
      }
    }

    // Check for card upgrades
    if (this.cardUpgradeSystem) {
      this.cardUpgradeSystem.onCardPlayed(playerId, card.definitionId, player, this.state, deck);
    }

    // Record action
    const action: GameAction = {
      id: generateId('action'),
      type: 'play_card',
      playerId,
      timestamp: Date.now(),
      payload: { cardId, targets },
      result: {
        success: true,
        effects: [...results, ...comboResults],
      },
    };
    this.state.history.push(action);

    // Move card to play area or discard
    player.playArea.push(card.getInstance());

    // Sync hand state
    player.hand = hand.getCards().map((c) => c.getInstance());
    this.invalidateCache();

    this.eventBus.emitSimple(
      'card_played',
      {
        playerId,
        cardId,
        effects: results,
        comboEffects: comboResults,
      },
      this.state
    );

    return true;
  }

  /**
   * Discard a card from hand
   */
  discardCard(playerId: string, cardId: string): boolean {
    const hand = this.playerHands.get(playerId);
    const deck = this.playerDecks.get(playerId);
    const player = this.state.players[playerId];

    if (!hand || !deck || !player) {
      return false;
    }

    const card = hand.discardCard(cardId);
    if (!card) {
      return false;
    }

    deck.discard(card);

    // Sync states
    player.hand = hand.getCards().map((c) => c.getInstance());
    player.discardPile = deck.getDiscardPile().map((c) => c.getInstance());
    this.invalidateCache();

    this.eventBus.emitSimple('card_discarded', { playerId, cardId }, this.state);

    return true;
  }

  /**
   * Modify a player's stat
   */
  modifyStat(playerId: string, stat: string, delta: number): boolean {
    const player = this.state.players[playerId];
    if (!player) return false;

    const before = player.stats[stat] ?? 0;
    player.stats[stat] = before + delta;
    this.invalidateCache();

    this.eventBus.emitSimple(
      'stat_changed',
      {
        playerId,
        stat,
        before,
        after: player.stats[stat],
      },
      this.state
    );

    return true;
  }

  /**
   * Set a player's stat
   */
  setStat(playerId: string, stat: string, value: number): boolean {
    const player = this.state.players[playerId];
    if (!player) return false;

    const before = player.stats[stat] ?? 0;
    player.stats[stat] = value;
    this.invalidateCache();

    this.eventBus.emitSimple(
      'stat_changed',
      {
        playerId,
        stat,
        before,
        after: value,
      },
      this.state
    );

    return true;
  }

  /**
   * Modify a player's resource
   */
  modifyResource(playerId: string, resource: string, delta: number): boolean {
    const player = this.state.players[playerId];
    if (!player) return false;

    const before = player.resources[resource] ?? 0;
    player.resources[resource] = Math.max(0, before + delta);
    this.invalidateCache();

    this.eventBus.emitSimple(
      'resource_changed',
      {
        playerId,
        resource,
        before,
        after: player.resources[resource],
      },
      this.state
    );

    return true;
  }

  /**
   * End the current turn
   */
  endTurn(): void {
    const currentPlayer = this.state.currentPlayerId;

    this.eventBus.emitSimple(
      'turn_ended',
      {
        turn: this.state.turn,
        playerId: currentPlayer,
      },
      this.state
    );

    // Move to next non-eliminated player
    const playerIds = Object.keys(this.state.players);
    const currentIndex = playerIds.indexOf(currentPlayer);
    let nextIndex = (currentIndex + 1) % playerIds.length;
    const startIndex = nextIndex;

    // Skip eliminated players
    while (this.state.players[playerIds[nextIndex]]?.eliminated) {
      nextIndex = (nextIndex + 1) % playerIds.length;
      // If we've looped back to the start, all players are eliminated
      if (nextIndex === startIndex) {
        break;
      }
    }

    this.state.currentPlayerId = playerIds[nextIndex];

    // Increment turn if we've gone around (complete round)
    if (nextIndex <= currentIndex || nextIndex === 0) {
      this.state.turn++;

      // Process random events at end of each complete round
      this.processRandomEvents();
    }
    this.invalidateCache();

    // Tick modifiers
    const hand = this.playerHands.get(this.state.currentPlayerId);
    hand?.tickModifiers();

    this.setPhase('draw');

    this.eventBus.emitSimple(
      'turn_started',
      {
        turn: this.state.turn,
        playerId: this.state.currentPlayerId,
      },
      this.state
    );
  }

  /**
   * Process random events for all players
   * Called at the end of each complete round
   */
  private processRandomEvents(): RandomEventResult[] {
    if (!this.randomEventSystem) {
      return [];
    }

    const players = Object.values(this.state.players);
    return this.randomEventSystem.processTurnEnd(this.state.turn, players, this.state);
  }

  /**
   * Check win conditions
   */
  checkWinConditions(): { winner: string | null; reason: string | null; isFailure?: boolean } {
    const { winConditions } = this.state.config;

    for (const condition of winConditions) {
      for (const player of Object.values(this.state.players)) {
        switch (condition.type) {
          case 'stat_threshold': {
            if (!condition.stat || condition.value === undefined || !condition.operator) break;
            const statValue = player.stats[condition.stat] ?? 0;
            if (this.checkThreshold(statValue, condition.operator, condition.value)) {
              // 检查是否为失败条件 (如 health <= 0)
              const isFailure = condition.operator === '<=' && condition.value === 0;
              return {
                winner: isFailure ? null : player.id,
                reason: `${condition.stat} reached ${condition.value}`,
                isFailure,
              };
            }
            break;
          }
          case 'resource_threshold': {
            if (!condition.stat || condition.value === undefined || !condition.operator) break;
            const resourceValue = player.resources[condition.stat] ?? 0;
            if (this.checkThreshold(resourceValue, condition.operator, condition.value)) {
              const isFailure = condition.operator === '<=' && condition.value === 0;
              return {
                winner: isFailure ? null : player.id,
                reason: `${condition.stat} reached ${condition.value}`,
                isFailure,
              };
            }
            break;
          }
          case 'turn_limit': {
            if (condition.value !== undefined && this.state.turn >= condition.value) {
              // Find player with highest score (first stat)
              const statName = Object.keys(player.stats)[0];
              let highestPlayer = player;
              let highestValue = player.stats[statName] ?? 0;

              for (const p of Object.values(this.state.players)) {
                const val = p.stats[statName] ?? 0;
                if (val > highestValue) {
                  highestValue = val;
                  highestPlayer = p;
                }
              }

              return { winner: highestPlayer.id, reason: 'Turn limit reached' };
            }
            break;
          }
          case 'milestone': {
            // 使用里程碑系统检查胜利条件
            if (this.milestoneSystem) {
              const result = this.milestoneSystem.updateProgress(player, this.state);
              if (result.isVictory) {
                return { winner: player.id, reason: result.reason };
              }
              if (result.isFailure) {
                return { winner: null, reason: result.reason, isFailure: true };
              }
            }
            break;
          }
        }
      }
    }

    return { winner: null, reason: null };
  }

  private checkThreshold(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '>=':
        return value >= threshold;
      case '<=':
        return value <= threshold;
      case '==':
        return value === threshold;
      default:
        return false;
    }
  }

  /**
   * End the game
   */
  endGame(winnerId: string | null, reason: string): void {
    this.state.phase = 'game_over';
    this.invalidateCache();

    this.eventBus.emitSimple(
      'game_ended',
      {
        winnerId,
        reason,
        finalState: deepClone(this.state),
      },
      this.state
    );
  }

  /**
   * Get action history
   */
  getHistory(): GameAction[] {
    return [...this.state.history];
  }

  /**
   * Set shared state value
   */
  setSharedState(key: string, value: unknown): void {
    this.state.sharedState[key] = value;
  }

  /**
   * Get shared state value
   */
  getSharedState<T>(key: string): T | undefined {
    return this.state.sharedState[key] as T | undefined;
  }

  /**
   * Reset the game
   */
  reset(): void {
    this.state = this.createInitialState(this.state.config);
    this.playerDecks.clear();
    this.playerHands.clear();
    this.eventBus.clearHistory();
    this.comboSystem?.reset();
    this.cardUpgradeSystem?.reset();
    this.randomEventSystem?.reset();
    this.milestoneSystem?.reset();
    this.invalidateCache();
  }

  // ============================================================================
  // Game Systems Access
  // ============================================================================

  /**
   * Get the combo system
   */
  getComboSystem(): ComboSystem | null {
    return this.comboSystem;
  }

  /**
   * Get the status effect system
   */
  getStatusEffectSystem(): StatusEffectSystem | null {
    return this.statusEffectSystem;
  }

  /**
   * Get the card upgrade system
   */
  getCardUpgradeSystem(): CardUpgradeSystem | null {
    return this.cardUpgradeSystem;
  }

  /**
   * Get the random event system
   */
  getRandomEventSystem(): RandomEventSystem | null {
    return this.randomEventSystem;
  }

  // ============================================================================
  // Status Effect Management
  // ============================================================================

  /**
   * Apply a status effect to a player
   */
  applyStatus(playerId: string, statusId: string): boolean {
    if (!this.statusEffectSystem) {
      console.warn('Status effect system not initialized');
      return false;
    }

    const player = this.state.players[playerId];
    if (!player) return false;

    this.statusEffectSystem.applyStatus(playerId, statusId, player, this.state);
    this.invalidateCache();
    return true;
  }

  /**
   * Remove a status effect from a player
   */
  removeStatus(playerId: string, statusId: string): boolean {
    if (!this.statusEffectSystem) {
      console.warn('Status effect system not initialized');
      return false;
    }

    const player = this.state.players[playerId];
    if (!player) return false;

    this.statusEffectSystem.removeStatus(playerId, statusId, player, this.state);
    this.invalidateCache();
    return true;
  }

  /**
   * Check if a player has a specific status
   */
  hasStatus(playerId: string, statusId: string): boolean {
    const player = this.state.players[playerId];
    if (!player) return false;
    return player.statuses.some((s) => s.id === statusId);
  }

  /**
   * Get all active statuses for a player
   */
  getPlayerStatuses(playerId: string): PlayerState['statuses'] {
    const player = this.state.players[playerId];
    if (!player) return [];
    return [...player.statuses];
  }

  // ============================================================================
  // Achievement, Difficulty, and Daily Challenge Systems Access
  // ============================================================================

  /**
   * Get the achievement system
   */
  getAchievementSystem(): AchievementSystem | null {
    return this.achievementSystem;
  }

  /**
   * Get the difficulty system
   */
  getDifficultySystem(): DifficultySystem | null {
    return this.difficultySystem;
  }

  /**
   * Get the daily challenge system
   */
  getDailyChallengeSystem(): DailyChallengeSystem | null {
    return this.dailyChallengeSystem;
  }

  /**
   * Get the milestone system
   */
  getMilestoneSystem(): MilestoneSystem | null {
    return this.milestoneSystem;
  }

  /**
   * Get modified game config based on current difficulty
   */
  getEffectiveConfig(): GameConfig {
    if (this.difficultySystem) {
      return this.difficultySystem.applyToGameConfig(this.state.config);
    }
    return this.state.config;
  }
}
