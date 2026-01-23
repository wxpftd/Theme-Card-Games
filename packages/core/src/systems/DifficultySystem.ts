import {
  DifficultyDefinition,
  DifficultyLevel,
  DifficultyConfig,
  DifficultyRule,
  GameState,
  GameConfig,
} from '../types';
import { EventBus } from '../event';

export type CustomDifficultyRuleHandler = (state: GameState, rule: DifficultyRule) => void;

export interface DifficultySystemOptions {
  difficultyDefinitions: DifficultyDefinition[];
  eventBus: EventBus;
  customRuleHandlers?: Record<string, CustomDifficultyRuleHandler>;
}

/**
 * DifficultySystem manages game difficulty settings and their effects
 */
export class DifficultySystem {
  private difficulties: Map<DifficultyLevel, DifficultyDefinition> = new Map();
  private eventBus: EventBus;
  private customRuleHandlers: Record<string, CustomDifficultyRuleHandler>;

  // Current difficulty configuration
  private config: DifficultyConfig = {
    currentDifficulty: 'normal',
    unlockedDifficulties: ['easy', 'normal'],
  };

  // Turn tracking for interval-based rules
  private currentTurn: number = 0;

  /** 取消订阅函数 */
  private unsubscribers: (() => void)[] = [];

  constructor(options: DifficultySystemOptions) {
    this.eventBus = options.eventBus;
    this.customRuleHandlers = options.customRuleHandlers ?? {};

    for (const difficulty of options.difficultyDefinitions) {
      this.difficulties.set(difficulty.id, difficulty);
    }

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Track turn starts for interval-based rules
    this.unsubscribers.push(
      this.eventBus.on('turn_started', (event, state) => {
        this.currentTurn = state.turn;
        this.processIntervalRules(state);
      })
    );

    // Apply per-turn stat/resource changes at turn end
    this.unsubscribers.push(
      this.eventBus.on('turn_ended', (_event, state) => {
        this.applyPerTurnChanges(state);
      })
    );
  }

  /**
   * Get the current difficulty definition
   */
  getCurrentDifficulty(): DifficultyDefinition | undefined {
    return this.difficulties.get(this.config.currentDifficulty);
  }

  /**
   * Set the current difficulty level
   */
  setDifficulty(level: DifficultyLevel): boolean {
    if (!this.config.unlockedDifficulties.includes(level)) {
      return false;
    }

    this.config.currentDifficulty = level;

    this.eventBus.emit(
      {
        type: 'difficulty_changed',
        timestamp: Date.now(),
        data: {
          difficulty: level,
          definition: this.difficulties.get(level),
        },
      },
      {} as any // State not available in this context
    );

    return true;
  }

  /**
   * Unlock a difficulty level
   */
  unlockDifficulty(level: DifficultyLevel): boolean {
    if (this.config.unlockedDifficulties.includes(level)) {
      return false;
    }

    this.config.unlockedDifficulties.push(level);

    this.eventBus.emit(
      {
        type: 'difficulty_unlocked',
        timestamp: Date.now(),
        data: {
          difficulty: level,
        },
      },
      {} as any // State not available in this context
    );

    return true;
  }

  /**
   * Check if a difficulty level is unlocked
   */
  isUnlocked(level: DifficultyLevel): boolean {
    return this.config.unlockedDifficulties.includes(level);
  }

  /**
   * Get all difficulty definitions
   */
  getDifficulties(): DifficultyDefinition[] {
    return Array.from(this.difficulties.values());
  }

  /**
   * Get unlocked difficulties
   */
  getUnlockedDifficulties(): DifficultyDefinition[] {
    return this.config.unlockedDifficulties
      .map((id) => this.difficulties.get(id))
      .filter((d): d is DifficultyDefinition => d !== undefined);
  }

  /**
   * Apply difficulty modifiers to game config
   */
  applyToGameConfig(baseConfig: GameConfig): GameConfig {
    const difficulty = this.getCurrentDifficulty();
    if (!difficulty) {
      return baseConfig;
    }

    const modifiedConfig = { ...baseConfig };

    // Apply initial stat overrides
    if (difficulty.initialStats) {
      modifiedConfig.initialStats = {
        ...baseConfig.initialStats,
        ...difficulty.initialStats,
      };
    }

    // Apply initial resource overrides
    if (difficulty.initialResources) {
      modifiedConfig.initialResources = {
        ...baseConfig.initialResources,
        ...difficulty.initialResources,
      };
    }

    return modifiedConfig;
  }

  /**
   * Process interval-based special rules
   */
  private processIntervalRules(state: GameState): void {
    const difficulty = this.getCurrentDifficulty();
    if (!difficulty?.specialRules) {
      return;
    }

    for (const rule of difficulty.specialRules) {
      if (rule.interval && this.currentTurn > 0 && this.currentTurn % rule.interval === 0) {
        this.executeRule(rule, state);
      }
    }
  }

  /**
   * Apply per-turn stat/resource changes
   */
  private applyPerTurnChanges(state: GameState): void {
    const difficulty = this.getCurrentDifficulty();
    if (!difficulty) {
      return;
    }

    const changes: { type: string; key: string; delta: number }[] = [];

    // Collect stat changes
    if (difficulty.perTurnStatChanges) {
      for (const [stat, delta] of Object.entries(difficulty.perTurnStatChanges)) {
        if (delta !== 0) {
          changes.push({ type: 'stat', key: stat, delta });
        }
      }
    }

    // Collect resource changes
    if (difficulty.perTurnResourceChanges) {
      for (const [resource, delta] of Object.entries(difficulty.perTurnResourceChanges)) {
        if (delta !== 0) {
          changes.push({ type: 'resource', key: resource, delta });
        }
      }
    }

    if (changes.length > 0) {
      this.eventBus.emitSimple(
        'difficulty_per_turn_effects',
        {
          difficulty: this.config.currentDifficulty,
          changes,
          turn: state.turn,
        },
        state
      );
    }
  }

  /**
   * Execute a special rule
   */
  private executeRule(rule: DifficultyRule, state: GameState): void {
    switch (rule.type) {
      case 'layoff_check':
        this.eventBus.emitSimple(
          'difficulty_layoff_check',
          {
            turn: this.currentTurn,
            rule,
          },
          state
        );
        break;

      case 'energy_recovery':
        this.eventBus.emitSimple(
          'difficulty_energy_recovery',
          {
            value: rule.value ?? 0,
            turn: this.currentTurn,
          },
          state
        );
        break;

      case 'card_cost_modifier':
        this.eventBus.emitSimple(
          'difficulty_card_cost_modifier',
          {
            modifier: rule.value ?? 0,
            turn: this.currentTurn,
          },
          state
        );
        break;

      case 'custom':
        if (rule.customRuleId) {
          const handler = this.customRuleHandlers[rule.customRuleId];
          if (handler) {
            handler(state, rule);
          }
        }
        break;
    }
  }

  /**
   * Get score multiplier for current difficulty
   */
  getScoreMultiplier(): number {
    const difficulty = this.getCurrentDifficulty();
    return difficulty?.scoreMultiplier ?? 1.0;
  }

  /**
   * Get difficulty configuration
   */
  getConfig(): DifficultyConfig {
    return { ...this.config };
  }

  /**
   * Load configuration (for persistence)
   */
  loadConfig(config: DifficultyConfig): void {
    this.config = {
      ...config,
      unlockedDifficulties: [...config.unlockedDifficulties],
    };
  }

  /**
   * Add a custom rule handler
   */
  addCustomRuleHandler(ruleId: string, handler: CustomDifficultyRuleHandler): void {
    this.customRuleHandlers[ruleId] = handler;
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = {
      currentDifficulty: 'normal',
      unlockedDifficulties: ['easy', 'normal'],
    };
    this.currentTurn = 0;
  }

  /**
   * 清理资源，移除所有事件监听器
   */
  destroy(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    this.currentTurn = 0;
  }
}
