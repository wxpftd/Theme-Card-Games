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
  CharacterDefinition,
  ScenarioDefinition,
  ScenarioSystemConfig,
  PlayerCharacterState,
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
  CharacterSystem,
  ScenarioSystem,
  GameEndSystem,
  FinalRanking,
} from './systems';

export interface GameEngineOptions {
  theme: ThemeConfig;
  customPhases?: TurnPhaseConfig[];
  customEffectHandlers?: Record<string, CustomEffectHandler>;
  randomEventCustomHandlers?: Record<string, RandomEventCustomHandler>;
  achievementCustomCheckers?: Record<string, CustomAchievementChecker>;
  difficultyCustomRuleHandlers?: Record<string, CustomDifficultyRuleHandler>;
  dailyChallengeCustomCheckers?: Record<string, CustomChallengeChecker>;
  /** 自定义角色被动处理器 */
  customPassiveHandlers?: Record<string, (playerId: string, state: GameState) => void>;
  /** 自定义场景规则处理器 */
  customScenarioRuleHandlers?: Record<string, unknown>;
  /** 自定义场景转换检查器 */
  customScenarioTransitionCheckers?: Record<string, unknown>;
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
  private characterSystem: CharacterSystem | null = null;
  private scenarioSystem: ScenarioSystem | null = null;
  private gameEndSystem: GameEndSystem | null = null;

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

    // Initialize character system
    if (this.theme.characterDefinitions && this.theme.characterDefinitions.length > 0) {
      this.characterSystem = new CharacterSystem({
        characterDefinitions: this.theme.characterDefinitions,
        cardDefinitions: new Map(this.theme.cards.map((c) => [c.id, c])),
        effectResolver: this.effectResolver,
        eventBus: this.eventBus,
        customPassiveHandlers: options.customPassiveHandlers ?? this.theme.customPassiveHandlers,
      });
    }

    // Initialize scenario system
    if (this.theme.scenarioDefinitions && this.theme.scenarioDefinitions.length > 0) {
      const defaultConfig: ScenarioSystemConfig = {
        scenarios: this.theme.scenarioDefinitions,
        initialScenarioId: this.theme.scenarioConfig?.initialScenarioId,
        enableAutoTransition: this.theme.scenarioConfig?.enableAutoTransition ?? true,
        transitionMode: this.theme.scenarioConfig?.transitionMode ?? 'sequential',
        sequentialScenarioIds: this.theme.scenarioConfig?.sequentialScenarioIds,
        transitionInterval: this.theme.scenarioConfig?.transitionInterval,
      };

      this.scenarioSystem = new ScenarioSystem({
        config: this.theme.scenarioConfig ?? defaultConfig,
        effectResolver: this.effectResolver,
        eventBus: this.eventBus,
        customRuleHandlers: options.customScenarioRuleHandlers as Record<
          string,
          (rule: unknown, state: unknown, gameState: unknown, turn: number) => void
        >,
        customTransitionCheckers: options.customScenarioTransitionCheckers as Record<
          string,
          (scenario: unknown, state: unknown, gameState: unknown) => boolean
        >,
      });
    }

    // Initialize game end system
    this.gameEndSystem = new GameEndSystem({
      eventBus: this.eventBus,
      winConditions: this.theme.gameConfig.winConditions,
      customWinCheckers: this.theme.customWinCheckers,
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

  /**
   * Get a cached snapshot of the current state (read-only).
   * More performant than the state getter for React integration.
   */
  getStateSnapshot(): Readonly<GameState> {
    return this.stateManager.getStateSnapshot();
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

  // ============================================================================
  // Character System
  // ============================================================================

  /**
   * Get the character system
   */
  getCharacterSystem(): CharacterSystem | null {
    return this.characterSystem;
  }

  /**
   * Get all character definitions
   */
  getCharacterDefinitions(): CharacterDefinition[] {
    return this.theme.characterDefinitions ?? [];
  }

  /**
   * Select a character for a player
   */
  selectCharacter(playerId: string, characterId: string): boolean {
    if (!this.characterSystem) return false;

    const player = this.getPlayer(playerId);
    if (!player) return false;

    return this.characterSystem.selectCharacter(playerId, characterId, player, this.state);
  }

  /**
   * Get a player's character definition
   */
  getPlayerCharacter(playerId: string): CharacterDefinition | null {
    if (!this.characterSystem) return null;
    return this.characterSystem.getPlayerCharacter(playerId);
  }

  /**
   * Get available characters (not yet selected)
   */
  getAvailableCharacters(excludePlayerId?: string): CharacterDefinition[] {
    if (!this.characterSystem) return [];
    return this.characterSystem.getAvailableCharacters(excludePlayerId);
  }

  /**
   * Use a player's active ability
   */
  useActiveAbility(
    playerId: string,
    targetPlayerIds?: string[]
  ): { success: boolean; effects: unknown[]; message?: string } {
    if (!this.characterSystem) {
      return { success: false, effects: [], message: 'Character system not available' };
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      return { success: false, effects: [], message: 'Player not found' };
    }

    return this.characterSystem.useActiveAbility(playerId, player, this.state, targetPlayerIds);
  }

  /**
   * Check if a player can use their active ability
   */
  canUseActiveAbility(playerId: string): boolean {
    if (!this.characterSystem) return false;
    const player = this.getPlayer(playerId);
    if (!player) return false;
    return this.characterSystem.canUseActiveAbility(playerId, player);
  }

  // ============================================================================
  // Scenario System
  // ============================================================================

  /**
   * Get the scenario system
   */
  getScenarioSystem(): ScenarioSystem | null {
    return this.scenarioSystem;
  }

  /**
   * Get all scenario definitions
   */
  getScenarioDefinitions(): ScenarioDefinition[] {
    return this.theme.scenarioDefinitions ?? [];
  }

  /**
   * Get current scenario
   */
  getCurrentScenario(): ScenarioDefinition | null {
    if (!this.scenarioSystem) return null;
    return this.scenarioSystem.getCurrentScenario();
  }

  /**
   * Change to a specific scenario
   */
  changeScenario(scenarioId: string, reason?: string): boolean {
    if (!this.scenarioSystem) return false;
    return this.scenarioSystem.changeScenario(scenarioId, this.state, reason);
  }

  /**
   * Get scenario state
   */
  getScenarioState() {
    if (!this.scenarioSystem) return null;
    return this.scenarioSystem.getScenarioState();
  }

  // ============================================================================
  // Game End System
  // ============================================================================

  /**
   * Get the game end system
   */
  getGameEndSystem(): GameEndSystem | null {
    return this.gameEndSystem;
  }

  /**
   * Eliminate a player
   */
  eliminatePlayer(playerId: string, reason: string): boolean {
    if (!this.gameEndSystem) return false;
    return this.gameEndSystem.forceEliminatePlayer(playerId, this.state, reason);
  }

  /**
   * Get final rankings
   */
  getFinalRankings(): FinalRanking[] {
    if (!this.gameEndSystem) return [];
    return this.gameEndSystem.getFinalRankings(this.state);
  }

  /**
   * Get active player count
   */
  getActivePlayerCount(): number {
    if (!this.gameEndSystem) {
      return Object.values(this.state.players).filter((p) => !p.eliminated).length;
    }
    return this.gameEndSystem.getActivePlayerCount();
  }

  /**
   * Check if a player is eliminated
   */
  isPlayerEliminated(playerId: string): boolean {
    const player = this.getPlayer(playerId);
    return player?.eliminated ?? false;
  }
}
