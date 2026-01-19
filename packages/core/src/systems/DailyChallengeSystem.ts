import {
  DailyChallengeDefinition,
  DailyChallengeState,
  DailyChallengeInstance,
  DailyChallengeAttempt,
  DailyChallengeConfig,
  ChallengeCondition,
  GameSessionStats,
  GameState,
  CardDefinition,
  AchievementReward,
} from '../types';
import { EventBus } from '../event';

export type CustomChallengeChecker = (stats: GameSessionStats, state: GameState) => boolean;

export interface DailyChallengeSystemOptions {
  challengeConfig: DailyChallengeConfig;
  cardDefinitions: Map<string, CardDefinition>;
  eventBus: EventBus;
  customCheckers?: Record<string, CustomChallengeChecker>;
}

/**
 * DailyChallengeSystem manages daily challenges with seeded randomization
 */
export class DailyChallengeSystem {
  private challengePool: Map<string, DailyChallengeDefinition> = new Map();
  private streakBonuses: DailyChallengeConfig['streakBonuses'];
  private cardDefinitions: Map<string, CardDefinition>;
  private eventBus: EventBus;
  private customCheckers: Record<string, CustomChallengeChecker>;

  // Persistent state
  private state: DailyChallengeState = {
    currentChallenge: null,
    completedChallenges: [],
    currentStreak: 0,
    bestStreak: 0,
  };

  // Current session tracking
  private sessionStats: GameSessionStats | null = null;
  private isInChallengeMode: boolean = false;

  constructor(options: DailyChallengeSystemOptions) {
    this.cardDefinitions = options.cardDefinitions;
    this.eventBus = options.eventBus;
    this.customCheckers = options.customCheckers ?? {};
    this.streakBonuses = options.challengeConfig.streakBonuses;

    for (const challenge of options.challengeConfig.challengePool) {
      this.challengePool.set(challenge.id, challenge);
    }

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Track card plays during challenge mode
    this.eventBus.on('card_played', (event) => {
      if (this.isInChallengeMode && this.sessionStats) {
        const cardId = event.data.cardId as string;
        const cardDef = this.cardDefinitions.get(cardId);
        if (cardDef) {
          this.sessionStats.cardsPlayed.push(cardId);
          if (cardDef.tags) {
            for (const tag of cardDef.tags) {
              this.sessionStats.cardUsage[tag] = (this.sessionStats.cardUsage[tag] || 0) + 1;
            }
          }
        }
      }
    });

    // Track resource usage
    this.eventBus.on('resource_changed', (event) => {
      if (this.isInChallengeMode && this.sessionStats) {
        const resource = event.data.resource as string;
        const delta = event.data.delta as number;
        if (delta < 0) {
          // Track resource consumption
          const key = `${resource}_used`;
          this.sessionStats.cardUsage[key] = (this.sessionStats.cardUsage[key] || 0) + Math.abs(delta);
        }
      }
    });

    // Track turn ends
    this.eventBus.on('turn_ended', () => {
      if (this.isInChallengeMode && this.sessionStats) {
        this.sessionStats.turnsPlayed++;
      }
    });

    // Track stat changes
    this.eventBus.on('stat_changed', (event) => {
      if (this.isInChallengeMode && this.sessionStats) {
        const stat = event.data.stat as string;
        const newValue = event.data.newValue as number;

        if (!this.sessionStats.statHistory[stat]) {
          this.sessionStats.statHistory[stat] = [];
        }
        this.sessionStats.statHistory[stat].push(newValue);

        this.sessionStats.maxStats[stat] = Math.max(
          this.sessionStats.maxStats[stat] ?? -Infinity,
          newValue
        );
        this.sessionStats.minStats[stat] = Math.min(
          this.sessionStats.minStats[stat] ?? Infinity,
          newValue
        );
      }
    });
  }

  /**
   * Generate today's challenge based on date seed
   */
  generateTodayChallenge(): DailyChallengeInstance | null {
    const today = this.getTodayString();

    // Check if we already have today's challenge
    if (this.state.currentChallenge?.date === today) {
      return this.state.currentChallenge;
    }

    const challenges = Array.from(this.challengePool.values());
    if (challenges.length === 0) {
      return null;
    }

    // Use date-based seed for consistent daily selection
    const seed = this.dateToSeed(today);
    const index = seed % challenges.length;
    const selectedChallenge = challenges[index];

    const instance: DailyChallengeInstance = {
      definitionId: selectedChallenge.id,
      date: today,
      seed,
      completed: false,
      attemptCount: 0,
    };

    this.state.currentChallenge = instance;

    // Check and update streak
    this.updateStreak(today);

    this.eventBus.emit(
      {
        type: 'daily_challenge_generated',
        timestamp: Date.now(),
        data: {
          challenge: selectedChallenge,
          date: today,
        },
      },
      {} as any // State not available in this context
    );

    return instance;
  }

  /**
   * Start a challenge attempt
   */
  startChallengeAttempt(initialStats: Record<string, number>): boolean {
    if (!this.state.currentChallenge) {
      return false;
    }

    this.isInChallengeMode = true;
    this.state.currentChallenge.attemptCount++;

    this.sessionStats = {
      cardUsage: {},
      statHistory: {},
      minStats: { ...initialStats },
      maxStats: { ...initialStats },
      turnsPlayed: 0,
      cardsPlayed: [],
      won: false,
      startTime: Date.now(),
    };

    for (const [stat, value] of Object.entries(initialStats)) {
      this.sessionStats.statHistory[stat] = [value];
    }

    this.eventBus.emit(
      {
        type: 'daily_challenge_attempt_started',
        timestamp: Date.now(),
        data: {
          challengeId: this.state.currentChallenge.definitionId,
          attemptNumber: this.state.currentChallenge.attemptCount,
        },
      },
      {} as any // State not available in this context
    );

    return true;
  }

  /**
   * End the current challenge attempt and check conditions
   */
  endChallengeAttempt(gameState: GameState, won: boolean): DailyChallengeAttempt | null {
    if (!this.isInChallengeMode || !this.sessionStats || !this.state.currentChallenge) {
      return null;
    }

    this.sessionStats.endTime = Date.now();
    this.sessionStats.won = won;

    const challenge = this.challengePool.get(this.state.currentChallenge.definitionId);
    if (!challenge) {
      this.isInChallengeMode = false;
      return null;
    }

    // Check all conditions
    const conditionsMet = challenge.conditions.map((condition) =>
      this.checkCondition(condition, this.sessionStats!, gameState, won)
    );

    const success = won && conditionsMet.every((met) => met);

    const attempt: DailyChallengeAttempt = {
      timestamp: Date.now(),
      turnsPlayed: this.sessionStats.turnsPlayed,
      conditionsMet,
      success,
    };

    // Update best attempt if this one is better
    if (
      success ||
      !this.state.currentChallenge.bestAttempt ||
      conditionsMet.filter(Boolean).length >
        this.state.currentChallenge.bestAttempt.conditionsMet.filter(Boolean).length
    ) {
      this.state.currentChallenge.bestAttempt = attempt;
    }

    if (success) {
      this.completeChallenge();
    }

    this.eventBus.emitSimple('daily_challenge_attempt_ended', {
      challengeId: this.state.currentChallenge.definitionId,
      attempt,
      success,
    }, gameState);

    this.isInChallengeMode = false;
    this.sessionStats = null;

    return attempt;
  }

  /**
   * Mark the current challenge as completed
   */
  private completeChallenge(): void {
    if (!this.state.currentChallenge || this.state.currentChallenge.completed) {
      return;
    }

    this.state.currentChallenge.completed = true;

    const challengeId = this.state.currentChallenge.definitionId;
    if (!this.state.completedChallenges.includes(challengeId)) {
      this.state.completedChallenges.push(challengeId);
    }

    // Update streak
    this.state.lastCompletionDate = this.state.currentChallenge.date;
    this.state.currentStreak++;
    this.state.bestStreak = Math.max(this.state.bestStreak, this.state.currentStreak);

    const challenge = this.challengePool.get(challengeId);
    const streakBonus = this.getStreakBonus();

    this.eventBus.emit(
      {
        type: 'daily_challenge_completed',
        timestamp: Date.now(),
        data: {
          challengeId,
          rewards: challenge?.rewards ?? [],
          streak: this.state.currentStreak,
          streakBonus,
        },
      },
      {} as any // State not available in this context
    );
  }

  /**
   * Check if a condition is met
   */
  private checkCondition(
    condition: ChallengeCondition,
    stats: GameSessionStats,
    gameState: GameState,
    won: boolean
  ): boolean {
    switch (condition.type) {
      case 'no_card_tag': {
        const count = stats.cardUsage[condition.tag] || 0;
        return count === 0;
      }

      case 'max_resource_usage': {
        const used = stats.cardUsage[`${condition.resource}_used`] || 0;
        return used <= condition.max;
      }

      case 'min_stat_at_win': {
        if (!won) return false;
        const history = stats.statHistory[condition.stat] || [];
        const finalValue = history[history.length - 1];
        return finalValue !== undefined && finalValue >= condition.min;
      }

      case 'max_turns': {
        return stats.turnsPlayed <= condition.turns;
      }

      case 'no_card_type': {
        for (const cardId of stats.cardsPlayed) {
          const cardDef = this.cardDefinitions.get(cardId);
          if (cardDef?.type === condition.cardType) {
            return false;
          }
        }
        return true;
      }

      case 'min_card_usage': {
        const count = stats.cardUsage[condition.cardTag] || 0;
        return count >= condition.count;
      }

      case 'custom': {
        const checker = this.customCheckers[condition.checkerId];
        if (checker) {
          return checker(stats, gameState);
        }
        return false;
      }

      default:
        return false;
    }
  }

  /**
   * Get current date string in YYYY-MM-DD format
   */
  private getTodayString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  /**
   * Convert date string to numeric seed
   */
  private dateToSeed(dateStr: string): number {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      const char = dateStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Update streak based on completion dates
   */
  private updateStreak(today: string): void {
    if (!this.state.lastCompletionDate) {
      return;
    }

    const lastDate = new Date(this.state.lastCompletionDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor(
      (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays > 1) {
      // Streak broken
      this.state.currentStreak = 0;
    }
  }

  /**
   * Get streak bonus rewards if applicable
   */
  getStreakBonus(): AchievementReward | null {
    if (!this.streakBonuses) return null;

    // Find highest applicable streak bonus
    let bonus: AchievementReward | null = null;
    for (const streakBonus of this.streakBonuses) {
      if (this.state.currentStreak >= streakBonus.streakLength) {
        bonus = streakBonus.bonus;
      }
    }

    return bonus;
  }

  /**
   * Get current challenge definition
   */
  getCurrentChallenge(): DailyChallengeDefinition | null {
    if (!this.state.currentChallenge) {
      return null;
    }
    return this.challengePool.get(this.state.currentChallenge.definitionId) ?? null;
  }

  /**
   * Get current challenge instance
   */
  getCurrentChallengeInstance(): DailyChallengeInstance | null {
    return this.state.currentChallenge;
  }

  /**
   * Get all challenge definitions
   */
  getChallenges(): DailyChallengeDefinition[] {
    return Array.from(this.challengePool.values());
  }

  /**
   * Get challenge state
   */
  getState(): DailyChallengeState {
    return { ...this.state };
  }

  /**
   * Load state (for persistence)
   */
  loadState(state: DailyChallengeState): void {
    this.state = {
      ...state,
      completedChallenges: [...state.completedChallenges],
    };
  }

  /**
   * Get current streak
   */
  getCurrentStreak(): number {
    return this.state.currentStreak;
  }

  /**
   * Get best streak
   */
  getBestStreak(): number {
    return this.state.bestStreak;
  }

  /**
   * Check if in challenge mode
   */
  isInChallenge(): boolean {
    return this.isInChallengeMode;
  }

  /**
   * Add a custom condition checker
   */
  addCustomChecker(checkerId: string, checker: CustomChallengeChecker): void {
    this.customCheckers[checkerId] = checker;
  }

  /**
   * Reset state (for testing)
   */
  reset(): void {
    this.state = {
      currentChallenge: null,
      completedChallenges: [],
      currentStreak: 0,
      bestStreak: 0,
    };
    this.sessionStats = null;
    this.isInChallengeMode = false;
  }
}
