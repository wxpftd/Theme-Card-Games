import {
  AchievementDefinition,
  AchievementState,
  AchievementProgress,
  AchievementCondition,
  GameSessionStats,
  GameState,
  CardDefinition,
} from '../types';
import { EventBus } from '../event';

export type CustomAchievementChecker = (stats: GameSessionStats, state: GameState) => boolean;

export interface AchievementSystemOptions {
  achievementDefinitions: AchievementDefinition[];
  cardDefinitions: Map<string, CardDefinition>;
  eventBus: EventBus;
  customCheckers?: Record<string, CustomAchievementChecker>;
  // Storage key for persistence (optional)
  storageKey?: string;
}

/**
 * AchievementSystem manages player achievements, tracking progress and unlocking rewards
 */
export class AchievementSystem {
  private achievements: Map<string, AchievementDefinition> = new Map();
  private cardDefinitions: Map<string, CardDefinition>;
  private eventBus: EventBus;
  private customCheckers: Record<string, CustomAchievementChecker>;

  // Global achievement state (persisted across games)
  private globalState: AchievementState = {
    unlockedAchievements: [],
    progress: {},
    totalPoints: 0,
    claimedRewards: [],
  };

  // Current game session stats
  private sessionStats: GameSessionStats | null = null;

  constructor(options: AchievementSystemOptions) {
    this.cardDefinitions = options.cardDefinitions;
    this.eventBus = options.eventBus;
    this.customCheckers = options.customCheckers ?? {};

    for (const achievement of options.achievementDefinitions) {
      this.achievements.set(achievement.id, achievement);
    }

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Track card plays
    this.eventBus.on('card_played', (event) => {
      if (this.sessionStats) {
        const cardId = event.data.cardId as string;
        const cardDef = this.cardDefinitions.get(cardId);
        if (cardDef) {
          this.sessionStats.cardsPlayed.push(cardId);
          // Track by tags
          if (cardDef.tags) {
            for (const tag of cardDef.tags) {
              this.sessionStats.cardUsage[tag] = (this.sessionStats.cardUsage[tag] || 0) + 1;
            }
          }
        }
      }
    });

    // Track stat changes
    this.eventBus.on('stat_changed', (event) => {
      if (this.sessionStats) {
        const stat = event.data.stat as string;
        const newValue = event.data.newValue as number;

        // Record history
        if (!this.sessionStats.statHistory[stat]) {
          this.sessionStats.statHistory[stat] = [];
        }
        this.sessionStats.statHistory[stat].push(newValue);

        // Track min/max
        this.sessionStats.minStats[stat] = Math.min(
          this.sessionStats.minStats[stat] ?? Infinity,
          newValue
        );
        this.sessionStats.maxStats[stat] = Math.max(
          this.sessionStats.maxStats[stat] ?? -Infinity,
          newValue
        );
      }
    });

    // Track turn ends
    this.eventBus.on('turn_ended', () => {
      if (this.sessionStats) {
        this.sessionStats.turnsPlayed++;
      }
    });

    // Track game end
    this.eventBus.on('game_ended', (event, state) => {
      if (this.sessionStats) {
        this.sessionStats.endTime = Date.now();
        this.sessionStats.won = event.data.winnerId !== null;
        this.checkAchievements(state);
      }
    });
  }

  /**
   * Start tracking a new game session
   */
  startSession(initialStats: Record<string, number>): void {
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

    // Initialize stat history with starting values
    for (const [stat, value] of Object.entries(initialStats)) {
      this.sessionStats.statHistory[stat] = [value];
    }
  }

  /**
   * End the current session and check achievements
   */
  endSession(gameState: GameState, won: boolean): AchievementDefinition[] {
    if (!this.sessionStats) return [];

    this.sessionStats.endTime = Date.now();
    this.sessionStats.won = won;

    return this.checkAchievements(gameState);
  }

  /**
   * Check all achievements and unlock any that are completed
   */
  private checkAchievements(gameState: GameState): AchievementDefinition[] {
    if (!this.sessionStats) return [];

    const newlyUnlocked: AchievementDefinition[] = [];

    for (const achievement of this.achievements.values()) {
      // Skip already unlocked
      if (this.globalState.unlockedAchievements.includes(achievement.id)) {
        continue;
      }

      if (this.checkCondition(achievement.condition, this.sessionStats, gameState)) {
        this.unlockAchievement(achievement);
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Check if a condition is met
   */
  private checkCondition(
    condition: AchievementCondition,
    stats: GameSessionStats,
    gameState: GameState
  ): boolean {
    switch (condition.type) {
      case 'card_usage': {
        const count = stats.cardUsage[condition.cardTag] || 0;
        return count >= condition.count;
      }

      case 'stat_maintained': {
        if (!stats.won && condition.forEntireGame) return false;

        const history = stats.statHistory[condition.stat] || [];
        if (history.length === 0) return false;

        return history.every((value) => {
          return this.compareValues(value, condition.operator, condition.value);
        });
      }

      case 'stat_reached': {
        const maxValue = stats.maxStats[condition.stat];
        const minValue = stats.minStats[condition.stat];

        if (condition.operator === '<' || condition.operator === '<=') {
          return (
            minValue !== undefined &&
            this.compareValues(minValue, condition.operator, condition.value)
          );
        }
        return (
          maxValue !== undefined &&
          this.compareValues(maxValue, condition.operator, condition.value)
        );
      }

      case 'stat_recovered': {
        // Check if stat went below threshold then recovered
        if (!stats.won) return false;

        const minValue = stats.minStats[condition.stat];
        const history = stats.statHistory[condition.stat] || [];
        const finalValue = history[history.length - 1];

        return (
          minValue !== undefined &&
          minValue < condition.fromBelow &&
          finalValue !== undefined &&
          finalValue >= condition.toAbove
        );
      }

      case 'win_within_turns': {
        return stats.won && stats.turnsPlayed <= condition.maxTurns;
      }

      case 'win_with_condition': {
        return stats.won;
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
   * Compare values with operator
   */
  private compareValues(value: number, operator: string, target: number): boolean {
    switch (operator) {
      case '>':
        return value > target;
      case '<':
        return value < target;
      case '>=':
        return value >= target;
      case '<=':
        return value <= target;
      case '==':
        return value === target;
      default:
        return false;
    }
  }

  /**
   * Unlock an achievement
   */
  private unlockAchievement(achievement: AchievementDefinition): void {
    if (this.globalState.unlockedAchievements.includes(achievement.id)) {
      return;
    }

    this.globalState.unlockedAchievements.push(achievement.id);
    this.globalState.totalPoints += achievement.points ?? 0;

    // Update progress
    this.globalState.progress[achievement.id] = {
      achievementId: achievement.id,
      currentValue: 1,
      targetValue: 1,
      unlocked: true,
      unlockedAt: Date.now(),
      claimed: false,
    };

    // Emit event (state will be provided by caller context)
    this.eventBus.emit(
      {
        type: 'achievement_unlocked',
        timestamp: Date.now(),
        data: {
          achievementId: achievement.id,
          achievementName: achievement.name,
          points: achievement.points ?? 0,
          rewards: achievement.rewards,
        },
      },
      {} as any // State not available in this context
    );
  }

  /**
   * Claim rewards for an achievement
   */
  claimRewards(achievementId: string): boolean {
    const progress = this.globalState.progress[achievementId];
    if (!progress || !progress.unlocked || progress.claimed) {
      return false;
    }

    progress.claimed = true;
    this.globalState.claimedRewards.push(achievementId);

    const achievement = this.achievements.get(achievementId);
    if (achievement) {
      this.eventBus.emit(
        {
          type: 'achievement_rewards_claimed',
          timestamp: Date.now(),
          data: {
            achievementId,
            rewards: achievement.rewards,
          },
        },
        {} as any // State not available in this context
      );
    }

    return true;
  }

  /**
   * Get all achievement definitions
   */
  getAchievements(): AchievementDefinition[] {
    return Array.from(this.achievements.values());
  }

  /**
   * Get achievements by category
   */
  getAchievementsByCategory(category: string): AchievementDefinition[] {
    return this.getAchievements().filter((a) => a.category === category);
  }

  /**
   * Get unlocked achievements
   */
  getUnlockedAchievements(): AchievementDefinition[] {
    return this.globalState.unlockedAchievements
      .map((id) => this.achievements.get(id))
      .filter((a): a is AchievementDefinition => a !== undefined);
  }

  /**
   * Get locked achievements
   */
  getLockedAchievements(): AchievementDefinition[] {
    return this.getAchievements().filter(
      (a) => !this.globalState.unlockedAchievements.includes(a.id)
    );
  }

  /**
   * Get achievement progress
   */
  getProgress(achievementId: string): AchievementProgress | undefined {
    return this.globalState.progress[achievementId];
  }

  /**
   * Get total achievement points
   */
  getTotalPoints(): number {
    return this.globalState.totalPoints;
  }

  /**
   * Get global achievement state
   */
  getGlobalState(): AchievementState {
    return { ...this.globalState };
  }

  /**
   * Load global state (for persistence)
   */
  loadState(state: AchievementState): void {
    this.globalState = {
      ...state,
      progress: { ...state.progress },
      unlockedAchievements: [...state.unlockedAchievements],
      claimedRewards: [...state.claimedRewards],
    };
  }

  /**
   * Get current session stats
   */
  getSessionStats(): GameSessionStats | null {
    return this.sessionStats;
  }

  /**
   * Check if an achievement is unlocked
   */
  isUnlocked(achievementId: string): boolean {
    return this.globalState.unlockedAchievements.includes(achievementId);
  }

  /**
   * Add a custom achievement checker
   */
  addCustomChecker(checkerId: string, checker: CustomAchievementChecker): void {
    this.customCheckers[checkerId] = checker;
  }

  /**
   * Reset all achievement progress (for testing)
   */
  reset(): void {
    this.globalState = {
      unlockedAchievements: [],
      progress: {},
      totalPoints: 0,
      claimedRewards: [],
    };
    this.sessionStats = null;
  }
}
