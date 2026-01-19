import {
  ThemeConfig,
  GameState,
  CardDefinition,
  GameEventHandler,
  ComboDefinition,
  StatusDefinition,
  CardUpgradeDefinition,
  RandomEventDefinition,
  RandomEventConfig,
  AchievementDefinition,
  DifficultyDefinition,
  DifficultyLevel,
  DailyChallengeConfig,
  AchievementState,
  DifficultyConfig,
  DailyChallengeState,
  GameSessionStats,
} from './types';
import { GameStateManager } from './state';
import { TurnManager, TurnPhaseConfig } from './turn';
import { EventBus } from './event';
import { EffectResolver, CustomEffectHandler } from './card';
import {
  ComboSystem,
  StatusEffectSystem,
  CardUpgradeSystem,
  RandomEventSystem,
  RandomEventCustomHandler,
  AchievementSystem,
  CustomAchievementChecker,
  DifficultySystem,
  CustomDifficultyRuleHandler,
  DailyChallengeSystem,
  CustomChallengeChecker,
} from './systems';

export interface GameEngineOptions {
  theme: ThemeConfig;
  customPhases?: TurnPhaseConfig[];
  customEffectHandlers?: Record<string, CustomEffectHandler>;
  randomEventCustomHandlers?: Record<string, RandomEventCustomHandler>;
  achievementCustomCheckers?: Record<string, CustomAchievementChecker>;
  difficultyCustomRuleHandlers?: Record<string, CustomDifficultyRuleHandler>;
  dailyChallengeCustomCheckers?: Record<string, CustomChallengeChecker>;
}

/**
 * GameEngine is the main entry point for creating themed card games
 */
export class GameEngine {
  private theme: ThemeConfig;
  private stateManager: GameStateManager;
  private turnManager: TurnManager;
  private eventBus: EventBus;
  private effectResolver: EffectResolver;

  constructor(options: GameEngineOptions) {
    this.theme = options.theme;

    // Create event bus
    this.eventBus = new EventBus();

    // Create effect resolver
    this.effectResolver = new EffectResolver();

    // Register custom effect handlers
    if (options.customEffectHandlers) {
      for (const [type, handler] of Object.entries(options.customEffectHandlers)) {
        this.effectResolver.registerHandler(type, handler);
      }
    }

    // Create state manager with new game systems
    this.stateManager = new GameStateManager({
      config: this.theme.gameConfig,
      cardDefinitions: this.theme.cards,
      comboDefinitions: this.theme.comboDefinitions,
      statusDefinitions: this.theme.statusDefinitions,
      cardUpgrades: this.theme.cardUpgrades,
      randomEventDefinitions: this.theme.randomEventDefinitions,
      randomEventConfig: this.theme.randomEventConfig,
      randomEventCustomHandlers: options.randomEventCustomHandlers,
      achievementDefinitions: this.theme.achievementDefinitions,
      achievementCustomCheckers:
        options.achievementCustomCheckers ?? this.theme.customAchievementCheckers,
      difficultyDefinitions: this.theme.difficultyDefinitions,
      difficultyCustomRuleHandlers:
        options.difficultyCustomRuleHandlers ?? this.theme.customDifficultyRuleHandlers,
      dailyChallengeConfig: this.theme.dailyChallengeConfig,
      dailyChallengeCustomCheckers:
        options.dailyChallengeCustomCheckers ?? this.theme.customChallengeCheckers,
      eventBus: this.eventBus,
      effectResolver: this.effectResolver,
    });

    // Create turn manager
    this.turnManager = new TurnManager({
      stateManager: this.stateManager,
      phases: options.customPhases,
      autoDrawOnTurnStart: true,
      drawCount: 1,
    });

    // Register theme event handlers
    if (this.theme.eventHandlers) {
      for (const [eventType, handler] of Object.entries(this.theme.eventHandlers)) {
        this.eventBus.on(eventType as any, handler);
      }
    }
  }

  // Getters
  get state(): GameState {
    return this.stateManager.currentState;
  }

  get events(): EventBus {
    return this.eventBus;
  }

  get themeConfig(): ThemeConfig {
    return this.theme;
  }

  /**
   * Add a player to the game
   */
  addPlayer(id: string, name: string): boolean {
    return this.stateManager.addPlayer(id, name) !== null;
  }

  /**
   * Start the game
   */
  startGame(): boolean {
    return this.turnManager.startGame();
  }

  /**
   * Draw cards for a player
   */
  drawCards(playerId: string, count: number = 1): void {
    this.stateManager.drawCards(playerId, count);
  }

  /**
   * Play a card
   */
  playCard(playerId: string, cardId: string, targets?: Record<string, string>): boolean {
    if (this.stateManager.currentPlayerId !== playerId) {
      return false; // Not this player's turn
    }

    return this.stateManager.playCard(playerId, cardId, targets);
  }

  /**
   * Discard a card
   */
  discardCard(playerId: string, cardId: string): boolean {
    return this.stateManager.discardCard(playerId, cardId);
  }

  /**
   * End the current turn
   */
  endTurn(): void {
    this.turnManager.endTurn();
    this.turnManager.checkAndEndGame();
  }

  /**
   * Advance to the next phase
   */
  advancePhase(): void {
    this.turnManager.advancePhase();
  }

  /**
   * Get a player's state
   */
  getPlayer(playerId: string) {
    return this.stateManager.getPlayer(playerId);
  }

  /**
   * Get all players
   */
  getAllPlayers() {
    return this.stateManager.getAllPlayers();
  }

  /**
   * Get a player's hand
   */
  getPlayerHand(playerId: string) {
    return this.stateManager.getPlayerHand(playerId);
  }

  /**
   * Get a player's deck
   */
  getPlayerDeck(playerId: string) {
    return this.stateManager.getPlayerDeck(playerId);
  }

  /**
   * Modify a player's stat
   */
  modifyStat(playerId: string, stat: string, delta: number): boolean {
    return this.stateManager.modifyStat(playerId, stat, delta);
  }

  /**
   * Set a player's stat
   */
  setStat(playerId: string, stat: string, value: number): boolean {
    return this.stateManager.setStat(playerId, stat, value);
  }

  /**
   * Modify a player's resource
   */
  modifyResource(playerId: string, resource: string, delta: number): boolean {
    return this.stateManager.modifyResource(playerId, resource, delta);
  }

  /**
   * Subscribe to game events
   */
  on(eventType: string, handler: GameEventHandler): () => void {
    return this.eventBus.on(eventType as any, handler);
  }

  /**
   * Subscribe to game events (once)
   */
  once(eventType: string, handler: GameEventHandler): () => void {
    return this.eventBus.once(eventType as any, handler);
  }

  /**
   * Get shared state
   */
  getSharedState<T>(key: string): T | undefined {
    return this.stateManager.getSharedState<T>(key);
  }

  /**
   * Set shared state
   */
  setSharedState(key: string, value: unknown): void {
    this.stateManager.setSharedState(key, value);
  }

  /**
   * Check win conditions
   */
  checkWinConditions() {
    return this.stateManager.checkWinConditions();
  }

  /**
   * End the game
   */
  endGame(winnerId: string | null, reason: string): void {
    this.stateManager.endGame(winnerId, reason);
  }

  /**
   * Reset the game
   */
  reset(): void {
    this.stateManager.reset();
  }

  /**
   * Get localized string
   */
  t(key: string, locale: string = 'zh-CN'): string {
    return this.theme.localization[locale]?.[key] ?? key;
  }

  /**
   * Get card definition by ID
   */
  getCardDefinition(cardId: string): CardDefinition | undefined {
    return this.theme.cards.find((c) => c.id === cardId);
  }

  /**
   * Get all card definitions
   */
  getAllCardDefinitions(): CardDefinition[] {
    return [...this.theme.cards];
  }

  /**
   * Get stat definition
   */
  getStatDefinition(statId: string) {
    return this.theme.stats.find((s) => s.id === statId);
  }

  /**
   * Get resource definition
   */
  getResourceDefinition(resourceId: string) {
    return this.theme.resources.find((r) => r.id === resourceId);
  }

  /**
   * Get UI theme
   */
  getUITheme() {
    return this.theme.uiTheme;
  }

  /**
   * Pause the game
   */
  pause(): void {
    this.turnManager.pause();
  }

  /**
   * Resume the game
   */
  resume(): void {
    this.turnManager.resume();
  }

  /**
   * Check if game is paused
   */
  get isPaused(): boolean {
    return this.turnManager.paused;
  }

  /**
   * Get action history
   */
  getHistory() {
    return this.stateManager.getHistory();
  }

  // ============================================================================
  // Game Systems
  // ============================================================================

  /**
   * Get the combo system
   */
  getComboSystem(): ComboSystem | null {
    return this.stateManager.getComboSystem();
  }

  /**
   * Get the status effect system
   */
  getStatusEffectSystem(): StatusEffectSystem | null {
    return this.stateManager.getStatusEffectSystem();
  }

  /**
   * Get the card upgrade system
   */
  getCardUpgradeSystem(): CardUpgradeSystem | null {
    return this.stateManager.getCardUpgradeSystem();
  }

  /**
   * Get the random event system
   */
  getRandomEventSystem(): RandomEventSystem | null {
    return this.stateManager.getRandomEventSystem();
  }

  /**
   * Apply a status effect to a player
   */
  applyStatus(playerId: string, statusId: string): boolean {
    return this.stateManager.applyStatus(playerId, statusId);
  }

  /**
   * Remove a status effect from a player
   */
  removeStatus(playerId: string, statusId: string): boolean {
    return this.stateManager.removeStatus(playerId, statusId);
  }

  /**
   * Check if a player has a specific status
   */
  hasStatus(playerId: string, statusId: string): boolean {
    return this.stateManager.hasStatus(playerId, statusId);
  }

  /**
   * Get all active statuses for a player
   */
  getPlayerStatuses(playerId: string) {
    return this.stateManager.getPlayerStatuses(playerId);
  }

  /**
   * Get combo definitions
   */
  getComboDefinitions(): ComboDefinition[] {
    return this.theme.comboDefinitions ?? [];
  }

  /**
   * Get status definitions
   */
  getStatusDefinitions(): StatusDefinition[] {
    return this.theme.statusDefinitions ?? [];
  }

  /**
   * Get card upgrade definitions
   */
  getCardUpgradeDefinitions(): CardUpgradeDefinition[] {
    return this.theme.cardUpgrades ?? [];
  }

  /**
   * Get random event definitions
   */
  getRandomEventDefinitions(): RandomEventDefinition[] {
    return this.theme.randomEventDefinitions ?? [];
  }

  /**
   * Get random event configuration
   */
  getRandomEventConfig(): RandomEventConfig | undefined {
    return this.theme.randomEventConfig;
  }

  // ============================================================================
  // Achievement System
  // ============================================================================

  /**
   * Get the achievement system
   */
  getAchievementSystem(): AchievementSystem | null {
    return this.stateManager.getAchievementSystem();
  }

  /**
   * Get all achievement definitions
   */
  getAchievementDefinitions(): AchievementDefinition[] {
    return this.theme.achievementDefinitions ?? [];
  }

  /**
   * Start tracking achievements for a new game session
   */
  startAchievementTracking(): void {
    const system = this.getAchievementSystem();
    if (system) {
      const player = this.getAllPlayers()[0];
      if (player) {
        system.startSession(player.stats);
      }
    }
  }

  /**
   * End achievement tracking and return newly unlocked achievements
   */
  endAchievementTracking(won: boolean): AchievementDefinition[] {
    const system = this.getAchievementSystem();
    if (system) {
      return system.endSession(this.state, won);
    }
    return [];
  }

  /**
   * Get current achievement state
   */
  getAchievementState(): AchievementState | null {
    const system = this.getAchievementSystem();
    return system?.getGlobalState() ?? null;
  }

  /**
   * Load persisted achievement state
   */
  loadAchievementState(state: AchievementState): void {
    const system = this.getAchievementSystem();
    system?.loadState(state);
  }

  // ============================================================================
  // Difficulty System
  // ============================================================================

  /**
   * Get the difficulty system
   */
  getDifficultySystem(): DifficultySystem | null {
    return this.stateManager.getDifficultySystem();
  }

  /**
   * Get all difficulty definitions
   */
  getDifficultyDefinitions(): DifficultyDefinition[] {
    return this.theme.difficultyDefinitions ?? [];
  }

  /**
   * Get current difficulty level
   */
  getCurrentDifficulty(): DifficultyDefinition | undefined {
    const system = this.getDifficultySystem();
    return system?.getCurrentDifficulty();
  }

  /**
   * Set difficulty level
   */
  setDifficulty(level: DifficultyLevel): boolean {
    const system = this.getDifficultySystem();
    return system?.setDifficulty(level) ?? false;
  }

  /**
   * Get difficulty configuration
   */
  getDifficultyConfig(): DifficultyConfig | null {
    const system = this.getDifficultySystem();
    return system?.getConfig() ?? null;
  }

  /**
   * Load persisted difficulty configuration
   */
  loadDifficultyConfig(config: DifficultyConfig): void {
    const system = this.getDifficultySystem();
    system?.loadConfig(config);
  }

  /**
   * Unlock a difficulty level
   */
  unlockDifficulty(level: DifficultyLevel): boolean {
    const system = this.getDifficultySystem();
    return system?.unlockDifficulty(level) ?? false;
  }

  // ============================================================================
  // Daily Challenge System
  // ============================================================================

  /**
   * Get the daily challenge system
   */
  getDailyChallengeSystem(): DailyChallengeSystem | null {
    return this.stateManager.getDailyChallengeSystem();
  }

  /**
   * Get daily challenge configuration
   */
  getDailyChallengeConfig(): DailyChallengeConfig | undefined {
    return this.theme.dailyChallengeConfig;
  }

  /**
   * Generate today's daily challenge
   */
  generateTodayChallenge() {
    const system = this.getDailyChallengeSystem();
    return system?.generateTodayChallenge() ?? null;
  }

  /**
   * Start a daily challenge attempt
   */
  startChallengeAttempt(): boolean {
    const system = this.getDailyChallengeSystem();
    if (system) {
      const player = this.getAllPlayers()[0];
      if (player) {
        return system.startChallengeAttempt(player.stats);
      }
    }
    return false;
  }

  /**
   * End the current challenge attempt
   */
  endChallengeAttempt(won: boolean) {
    const system = this.getDailyChallengeSystem();
    if (system) {
      return system.endChallengeAttempt(this.state, won);
    }
    return null;
  }

  /**
   * Get daily challenge state
   */
  getDailyChallengeState(): DailyChallengeState | null {
    const system = this.getDailyChallengeSystem();
    return system?.getState() ?? null;
  }

  /**
   * Load persisted daily challenge state
   */
  loadDailyChallengeState(state: DailyChallengeState): void {
    const system = this.getDailyChallengeSystem();
    system?.loadState(state);
  }

  /**
   * Check if currently in a daily challenge
   */
  isInDailyChallenge(): boolean {
    const system = this.getDailyChallengeSystem();
    return system?.isInChallenge() ?? false;
  }
}
