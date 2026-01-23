/**
 * ScenarioSystem - 场景系统
 * 管理场景切换、场景效果应用、角色场景适应性
 */

import {
  ScenarioDefinition,
  ScenarioState,
  ScenarioHistoryEntry,
  ScenarioSystemConfig,
  ScenarioCharacterModifier,
  ScenarioRule,
  CardEffect,
  ResolvedEffect,
  GameState,
  PlayerState,
  CustomScenarioRuleHandler,
  CustomScenarioTransitionChecker,
} from '../types';
import { EventBus } from '../event';
import { EffectResolver, EffectContext } from '../card/EffectResolver';

export interface ScenarioSystemOptions {
  /** 场景系统配置 */
  config: ScenarioSystemConfig;
  /** 效果解析器 */
  effectResolver: EffectResolver;
  /** 事件总线 */
  eventBus: EventBus;
  /** 自定义场景规则处理器 */
  customRuleHandlers?: Record<string, CustomScenarioRuleHandler>;
  /** 自定义场景转换检查器 */
  customTransitionCheckers?: Record<string, CustomScenarioTransitionChecker>;
}

/**
 * 场景系统
 */
export class ScenarioSystem {
  private scenarios: Map<string, ScenarioDefinition> = new Map();
  private config: ScenarioSystemConfig;
  private effectResolver: EffectResolver;
  private eventBus: EventBus;
  private customRuleHandlers: Record<string, CustomScenarioRuleHandler>;
  private customTransitionCheckers: Record<string, CustomScenarioTransitionChecker>;

  /** 场景状态 */
  private state: ScenarioState = {
    currentScenarioId: null,
    scenarioStartTurn: 0,
    scenarioTurnsElapsed: 0,
    scenarioHistory: [],
  };

  /** 取消订阅函数 */
  private unsubscribers: (() => void)[] = [];

  constructor(options: ScenarioSystemOptions) {
    this.config = options.config;
    this.effectResolver = options.effectResolver;
    this.eventBus = options.eventBus;
    this.customRuleHandlers = options.customRuleHandlers ?? {};
    this.customTransitionCheckers = options.customTransitionCheckers ?? {};

    // 注册场景定义
    for (const scenario of options.config.scenarios) {
      this.scenarios.set(scenario.id, scenario);
    }

    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听回合开始，处理每回合效果
    this.unsubscribers.push(
      this.eventBus.on('turn_started', (event) => {
        const gameState = event.data as unknown as GameState;
        this.processTurnEffects(gameState);
      })
    );

    // 监听游戏开始，初始化场景
    this.unsubscribers.push(
      this.eventBus.on('game_started', (event) => {
        const gameState = event.data as unknown as GameState;
        if (this.config.initialScenarioId) {
          this.changeScenario(this.config.initialScenarioId, gameState, 'game_start');
        }
      })
    );
  }

  // ============================================================================
  // 场景切换
  // ============================================================================

  /**
   * 切换到指定场景
   */
  changeScenario(scenarioId: string, gameState: GameState, reason: string = 'manual'): boolean {
    const newScenario = this.scenarios.get(scenarioId);
    if (!newScenario) {
      console.warn(`Scenario not found: ${scenarioId}`);
      return false;
    }

    const oldScenarioId = this.state.currentScenarioId;
    const oldScenario = oldScenarioId ? this.scenarios.get(oldScenarioId) : null;

    // 执行旧场景的退出效果
    if (oldScenario?.onExitEffects) {
      this.applyScenarioEffectsToAllPlayers(oldScenario.onExitEffects, gameState);

      this.eventBus.emitSimple(
        'scenario_exited',
        {
          scenarioId: oldScenarioId,
          scenarioName: oldScenario.name,
          turn: gameState.turn,
        },
        gameState
      );
    }

    // 记录历史
    if (oldScenarioId) {
      const historyEntry: ScenarioHistoryEntry = {
        scenarioId: oldScenarioId,
        startTurn: this.state.scenarioStartTurn,
        endTurn: gameState.turn,
        transitionReason: reason,
      };
      this.state.scenarioHistory.push(historyEntry);
    }

    // 更新状态
    this.state.currentScenarioId = scenarioId;
    this.state.scenarioStartTurn = gameState.turn;
    this.state.scenarioTurnsElapsed = 0;

    // 执行新场景的进入效果
    if (newScenario.onEnterEffects) {
      this.applyScenarioEffectsToAllPlayers(newScenario.onEnterEffects, gameState);
    }

    // 应用全局属性修正
    if (newScenario.globalStatModifiers) {
      this.applyGlobalStatModifiers(newScenario.globalStatModifiers, gameState);
    }

    // 发送事件
    this.eventBus.emitSimple(
      'scenario_entered',
      {
        scenarioId,
        scenarioName: newScenario.name,
        turn: gameState.turn,
        previousScenarioId: oldScenarioId,
      },
      gameState
    );

    return true;
  }

  /**
   * 获取当前场景
   */
  getCurrentScenario(): ScenarioDefinition | null {
    if (!this.state.currentScenarioId) return null;
    return this.scenarios.get(this.state.currentScenarioId) ?? null;
  }

  /**
   * 获取场景状态
   */
  getScenarioState(): ScenarioState {
    return { ...this.state };
  }

  // ============================================================================
  // 每回合处理
  // ============================================================================

  /**
   * 处理每回合的场景效果
   */
  processTurnEffects(gameState: GameState): void {
    const scenario = this.getCurrentScenario();
    if (!scenario) return;

    this.state.scenarioTurnsElapsed++;

    // 处理每回合效果
    if (scenario.perTurnEffects) {
      this.applyScenarioEffectsToAllPlayers(scenario.perTurnEffects, gameState);
    }

    // 处理场景规则
    if (scenario.rules) {
      for (const rule of scenario.rules) {
        this.processScenarioRule(rule, gameState);
      }
    }

    // 检查场景转换
    if (this.config.enableAutoTransition) {
      this.checkScenarioTransition(gameState);
    }
  }

  /**
   * 处理场景规则
   */
  private processScenarioRule(rule: ScenarioRule, gameState: GameState): void {
    // 检查间隔
    if (rule.interval && this.state.scenarioTurnsElapsed % rule.interval !== 0) {
      return;
    }

    switch (rule.type) {
      case 'elimination_check':
        this.processEliminationCheckRule(rule, gameState);
        break;
      case 'custom':
        if (rule.customRuleId && this.customRuleHandlers[rule.customRuleId]) {
          this.customRuleHandlers[rule.customRuleId](rule, this.state, gameState, gameState.turn);
        }
        break;
      default:
        // 其他规则类型暂不处理
        break;
    }

    this.eventBus.emitSimple(
      'scenario_rule_triggered',
      {
        scenarioId: this.state.currentScenarioId,
        ruleType: rule.type,
        ruleDescription: rule.description,
        turn: gameState.turn,
      },
      gameState
    );
  }

  /**
   * 处理淘汰检查规则
   */
  private processEliminationCheckRule(rule: ScenarioRule, gameState: GameState): void {
    // 获取所有未淘汰玩家
    const activePlayers = Object.values(gameState.players).filter((p) => !p.eliminated);
    if (activePlayers.length <= 1) return;

    // 根据规则属性找出最低值的玩家
    const statId = rule.statId ?? 'performance';
    let lowestPlayer: PlayerState | null = null;
    let lowestValue = Infinity;

    for (const player of activePlayers) {
      const value = player.stats[statId] ?? 0;
      if (value < lowestValue) {
        lowestValue = value;
        lowestPlayer = player;
      }
    }

    // 标记为待淘汰（实际淘汰由 GameEndSystem 处理）
    if (lowestPlayer) {
      this.eventBus.emitSimple(
        'scenario_effect_applied',
        {
          scenarioId: this.state.currentScenarioId,
          effectType: 'elimination_candidate',
          targetPlayerId: lowestPlayer.id,
          statId,
          statValue: lowestValue,
        },
        gameState
      );
    }
  }

  // ============================================================================
  // 角色场景适应性
  // ============================================================================

  /**
   * 获取角色在当前场景的有效修正
   */
  getEffectiveModifiers(
    characterId: string,
    gameState: GameState
  ): ScenarioCharacterModifier | null {
    const scenario = this.getCurrentScenario();
    if (!scenario?.characterModifiers) return null;

    return scenario.characterModifiers[characterId] ?? null;
  }

  /**
   * 应用角色场景修正
   */
  applyCharacterScenarioModifiers(
    playerId: string,
    characterId: string,
    player: PlayerState,
    gameState: GameState
  ): void {
    const modifiers = this.getEffectiveModifiers(characterId, gameState);
    if (!modifiers) return;

    // 应用属性修正
    if (modifiers.statModifiers) {
      for (const [statId, modifier] of Object.entries(modifiers.statModifiers)) {
        if (player.stats[statId] !== undefined) {
          player.stats[statId] += modifier;
        }
      }
    }

    // 应用资源修正
    if (modifiers.resourceModifiers) {
      for (const [resourceId, modifier] of Object.entries(modifiers.resourceModifiers)) {
        if (player.resources[resourceId] !== undefined) {
          player.resources[resourceId] += modifier;
        }
      }
    }

    // 应用被动效果
    if (modifiers.passiveEffects) {
      const context: EffectContext = {
        gameState,
        sourcePlayerId: playerId,
      };
      this.effectResolver.resolveAll(modifiers.passiveEffects, context);
    }
  }

  /**
   * 应用角色每回合场景效果
   */
  applyCharacterPerTurnScenarioEffects(
    playerId: string,
    characterId: string,
    player: PlayerState
  ): void {
    const scenario = this.getCurrentScenario();
    if (!scenario?.characterModifiers) return;

    const modifiers = scenario.characterModifiers[characterId];
    if (!modifiers) return;

    // 应用每回合属性变化
    if (modifiers.perTurnStatChanges) {
      for (const [statId, change] of Object.entries(modifiers.perTurnStatChanges)) {
        if (player.stats[statId] !== undefined) {
          player.stats[statId] += change;
        }
      }
    }

    // 应用每回合资源变化
    if (modifiers.perTurnResourceChanges) {
      for (const [resourceId, change] of Object.entries(modifiers.perTurnResourceChanges)) {
        if (player.resources[resourceId] !== undefined) {
          player.resources[resourceId] = Math.max(0, player.resources[resourceId] + change);
        }
      }
    }
  }

  // ============================================================================
  // 场景转换
  // ============================================================================

  /**
   * 检查场景转换条件
   */
  checkScenarioTransition(gameState: GameState): void {
    const scenario = this.getCurrentScenario();
    if (!scenario) return;

    let shouldTransition = false;
    let reason = '';

    // 检查持续时间
    if (scenario.duration && scenario.duration > 0) {
      if (this.state.scenarioTurnsElapsed >= scenario.duration) {
        shouldTransition = true;
        reason = 'duration_ended';
      }
    }

    // 检查转换条件
    if (!shouldTransition && scenario.transitionCondition) {
      const condition = scenario.transitionCondition;

      switch (condition.type) {
        case 'turn_count':
          if (this.state.scenarioTurnsElapsed >= condition.turns) {
            shouldTransition = true;
            reason = 'turn_count_reached';
          }
          break;
        case 'player_eliminated':
          const eliminatedCount = Object.values(gameState.players).filter(
            (p) => p.eliminated
          ).length;
          if (eliminatedCount >= condition.count) {
            shouldTransition = true;
            reason = 'players_eliminated';
          }
          break;
        case 'random_chance':
          if (Math.random() < condition.probability) {
            shouldTransition = true;
            reason = 'random_chance';
          }
          break;
        case 'custom':
          if (condition.checkerId && this.customTransitionCheckers[condition.checkerId]) {
            if (
              this.customTransitionCheckers[condition.checkerId](scenario, this.state, gameState)
            ) {
              shouldTransition = true;
              reason = 'custom_condition';
            }
          }
          break;
      }
    }

    // 执行转换
    if (shouldTransition) {
      const nextScenarioId = this.getNextScenarioId(scenario);
      if (nextScenarioId) {
        this.changeScenario(nextScenarioId, gameState, reason);
      }
    }
  }

  /**
   * 获取下一个场景 ID
   */
  private getNextScenarioId(currentScenario: ScenarioDefinition): string | null {
    // 链式场景
    if (currentScenario.nextScenarioId) {
      return currentScenario.nextScenarioId;
    }

    // 随机选择
    if (currentScenario.possibleNextScenarios && currentScenario.possibleNextScenarios.length > 0) {
      return this.selectWeightedScenario(currentScenario.possibleNextScenarios);
    }

    // 根据配置模式选择
    switch (this.config.transitionMode) {
      case 'sequential':
        return this.getNextSequentialScenarioId();
      case 'random':
        return this.getRandomScenarioId();
      default:
        return null;
    }
  }

  /**
   * 加权随机选择场景
   */
  private selectWeightedScenario(options: { scenarioId: string; weight: number }[]): string {
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    let random = Math.random() * totalWeight;

    for (const option of options) {
      random -= option.weight;
      if (random <= 0) {
        return option.scenarioId;
      }
    }

    return options[options.length - 1].scenarioId;
  }

  /**
   * 获取顺序切换的下一个场景 ID
   */
  private getNextSequentialScenarioId(): string | null {
    if (!this.config.sequentialScenarioIds || this.config.sequentialScenarioIds.length === 0) {
      return null;
    }

    const currentId = this.state.currentScenarioId;
    if (!currentId) {
      return this.config.sequentialScenarioIds[0];
    }

    const currentIndex = this.config.sequentialScenarioIds.indexOf(currentId);
    const nextIndex = (currentIndex + 1) % this.config.sequentialScenarioIds.length;
    return this.config.sequentialScenarioIds[nextIndex];
  }

  /**
   * 获取随机场景 ID
   */
  private getRandomScenarioId(): string | null {
    const scenarioIds = Array.from(this.scenarios.keys());
    if (scenarioIds.length === 0) return null;

    // 排除当前场景
    const availableIds = scenarioIds.filter((id) => id !== this.state.currentScenarioId);
    if (availableIds.length === 0) return scenarioIds[0];

    const randomIndex = Math.floor(Math.random() * availableIds.length);
    return availableIds[randomIndex];
  }

  // ============================================================================
  // 卡牌规则
  // ============================================================================

  /**
   * 检查卡牌是否在当前场景被禁用
   */
  isCardBannedInCurrentScenario(cardTags: string[]): boolean {
    const scenario = this.getCurrentScenario();
    if (!scenario?.bannedCardTags) return false;

    return cardTags.some((tag) => scenario.bannedCardTags!.includes(tag));
  }

  /**
   * 获取卡牌效果倍率
   */
  getCardEffectMultiplier(cardTags: string[]): number {
    const scenario = this.getCurrentScenario();
    if (!scenario) return 1;

    let multiplier = 1;

    // 检查增强
    if (scenario.enhancedCardTags) {
      for (const tag of cardTags) {
        if (scenario.enhancedCardTags[tag]) {
          multiplier *= scenario.enhancedCardTags[tag];
        }
      }
    }

    // 检查减弱
    if (scenario.weakenedCardTags) {
      for (const tag of cardTags) {
        if (scenario.weakenedCardTags[tag]) {
          multiplier *= scenario.weakenedCardTags[tag];
        }
      }
    }

    return multiplier;
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  /**
   * 对所有玩家应用场景效果
   */
  private applyScenarioEffectsToAllPlayers(effects: CardEffect[], gameState: GameState): void {
    for (const player of Object.values(gameState.players)) {
      if (player.eliminated) continue;

      const context: EffectContext = {
        gameState,
        sourcePlayerId: player.id,
        targetPlayerId: player.id,
      };

      this.effectResolver.resolveAll(effects, context);
    }
  }

  /**
   * 应用全局属性修正
   */
  private applyGlobalStatModifiers(modifiers: Record<string, number>, gameState: GameState): void {
    for (const player of Object.values(gameState.players)) {
      if (player.eliminated) continue;

      for (const [statId, modifier] of Object.entries(modifiers)) {
        if (player.stats[statId] !== undefined) {
          player.stats[statId] += modifier;
        }
      }
    }
  }

  /**
   * 获取所有场景定义
   */
  getAllScenarios(): ScenarioDefinition[] {
    return Array.from(this.scenarios.values());
  }

  /**
   * 获取场景定义
   */
  getScenario(scenarioId: string): ScenarioDefinition | undefined {
    return this.scenarios.get(scenarioId);
  }

  /**
   * 添加场景定义
   */
  addScenario(scenario: ScenarioDefinition): void {
    this.scenarios.set(scenario.id, scenario);
  }

  /**
   * 重置系统状态
   */
  reset(): void {
    this.state = {
      currentScenarioId: null,
      scenarioStartTurn: 0,
      scenarioTurnsElapsed: 0,
      scenarioHistory: [],
    };
  }

  /**
   * 清理资源，移除所有事件监听器
   */
  destroy(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    this.state = {
      currentScenarioId: null,
      scenarioStartTurn: 0,
      scenarioTurnsElapsed: 0,
      scenarioHistory: [],
    };
  }
}
