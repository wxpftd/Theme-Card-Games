/**
 * DiceSystem - 骰子系统
 *
 * 为游戏增加随机性和趣味性的骰子机制
 *
 * 功能:
 * - 支持多种骰子类型 (d4, d6, d8, d10, d12, d20, d100)
 * - 支持掷多个骰子
 * - 支持修正值 (如 2d6+3)
 * - 支持优势/劣势 (掷两次取高/低)
 * - 支持骰子结果与效果绑定
 * - 支持自定义骰子面
 * - 骰子历史记录
 * - 事件通知
 */

import { CardEffect, GameState, PlayerState, ResolvedEffect } from '../types';
import { EventBus } from '../event';
import { generateId } from '../utils';

// ============================================================================
// 骰子类型定义
// ============================================================================

/** 标准骰子类型 */
export type StandardDiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

/** 骰子配置 */
export interface DiceConfig {
  /** 骰子类型 */
  type: StandardDiceType | 'custom';
  /** 自定义骰子面 (仅当 type 为 'custom' 时使用) */
  customFaces?: number[];
  /** 骰子数量 */
  count?: number;
  /** 修正值 */
  modifier?: number;
  /** 优势/劣势模式 */
  advantage?: 'advantage' | 'disadvantage' | 'none';
}

/** 单次骰子掷出结果 */
export interface DiceRollResult {
  /** 骰子类型 */
  diceType: StandardDiceType | 'custom';
  /** 每个骰子的结果 */
  rolls: number[];
  /** 原始总和 (不含修正) */
  rawTotal: number;
  /** 修正值 */
  modifier: number;
  /** 最终总计 */
  total: number;
  /** 优势/劣势模式 */
  advantageMode: 'advantage' | 'disadvantage' | 'none';
  /** 如果有优势/劣势，所有掷骰结果 */
  allRolls?: number[][];
  /** 是否暴击 (最高面) */
  isCritical: boolean;
  /** 是否大失败 (1) */
  isFumble: boolean;
}

/** 骰子效果结果 - 根据骰子结果触发的效果 */
export interface DiceEffectMapping {
  /** 结果范围 (闭区间) */
  range: [number, number];
  /** 结果描述 */
  description: string;
  /** 触发的效果 */
  effects: CardEffect[];
  /** 结果类型标签 */
  outcomeType?: 'critical_success' | 'success' | 'partial' | 'failure' | 'critical_failure';
}

/** 骰子挑战配置 */
export interface DiceChallengeConfig {
  /** 挑战 ID */
  id: string;
  /** 挑战名称 */
  name: string;
  /** 挑战描述 */
  description: string;
  /** 骰子配置 */
  diceConfig: DiceConfig;
  /** 难度值 (需要达到的目标值) */
  difficultyClass?: number;
  /** 结果映射 */
  resultMappings?: DiceEffectMapping[];
  /** 成功效果 (当达到 DC 时) */
  successEffects?: CardEffect[];
  /** 失败效果 (当未达到 DC 时) */
  failureEffects?: CardEffect[];
}

/** 骰子事件历史记录 */
export interface DiceHistoryEntry {
  /** 记录 ID */
  id: string;
  /** 玩家 ID */
  playerId: string;
  /** 时间戳 */
  timestamp: number;
  /** 回合数 */
  turn: number;
  /** 骰子结果 */
  result: DiceRollResult;
  /** 触发来源 */
  source: 'card' | 'event' | 'challenge' | 'manual';
  /** 来源 ID (卡牌ID/事件ID/挑战ID) */
  sourceId?: string;
  /** 触发的效果 */
  triggeredEffects?: ResolvedEffect[];
}

/** 骰子系统选项 */
export interface DiceSystemOptions {
  /** 事件总线 */
  eventBus?: EventBus;
  /** 最大历史记录数 */
  maxHistorySize?: number;
  /** 自定义随机数生成器 (用于测试) */
  randomGenerator?: () => number;
}

// ============================================================================
// 骰子事件类型
// ============================================================================

export type DiceEventType =
  | 'dice_rolled'
  | 'dice_challenge_started'
  | 'dice_challenge_completed'
  | 'dice_critical'
  | 'dice_fumble';

export interface DiceEvent {
  type: DiceEventType;
  playerId: string;
  result?: DiceRollResult;
  challenge?: DiceChallengeConfig;
  success?: boolean;
  timestamp: number;
}

// ============================================================================
// DiceSystem 实现
// ============================================================================

/**
 * 骰子系统
 */
export class DiceSystem {
  private eventBus?: EventBus;
  private history: DiceHistoryEntry[] = [];
  private maxHistorySize: number;
  private randomGenerator: () => number;

  /** 标准骰子面数映射 */
  private static readonly DICE_FACES: Record<StandardDiceType, number> = {
    d4: 4,
    d6: 6,
    d8: 8,
    d10: 10,
    d12: 12,
    d20: 20,
    d100: 100,
  };

  constructor(options: DiceSystemOptions = {}) {
    this.eventBus = options.eventBus;
    this.maxHistorySize = options.maxHistorySize ?? 100;
    this.randomGenerator = options.randomGenerator ?? Math.random;
  }

  /**
   * 掷骰子
   */
  roll(config: DiceConfig): DiceRollResult {
    const diceType = config.type;
    const count = config.count ?? 1;
    const modifier = config.modifier ?? 0;
    const advantageMode = config.advantage ?? 'none';

    // 获取骰子面数
    const faces = this.getDiceFaces(config);

    // 根据优势/劣势模式掷骰
    let rolls: number[];
    let allRolls: number[][] | undefined;

    if (advantageMode === 'none') {
      rolls = this.rollDice(faces, count);
    } else {
      // 掷两次
      const firstRolls = this.rollDice(faces, count);
      const secondRolls = this.rollDice(faces, count);
      allRolls = [firstRolls, secondRolls];

      const firstTotal = firstRolls.reduce((sum, r) => sum + r, 0);
      const secondTotal = secondRolls.reduce((sum, r) => sum + r, 0);

      if (advantageMode === 'advantage') {
        rolls = firstTotal >= secondTotal ? firstRolls : secondRolls;
      } else {
        rolls = firstTotal <= secondTotal ? firstRolls : secondRolls;
      }
    }

    const rawTotal = rolls.reduce((sum, r) => sum + r, 0);
    const total = rawTotal + modifier;

    // 检测暴击和大失败 (仅对单个 d20 有意义)
    const isCritical = diceType === 'd20' && count === 1 && rolls[0] === 20;
    const isFumble = diceType === 'd20' && count === 1 && rolls[0] === 1;

    return {
      diceType,
      rolls,
      rawTotal,
      modifier,
      total,
      advantageMode,
      allRolls,
      isCritical,
      isFumble,
    };
  }

  /**
   * 执行骰子挑战
   */
  executeChallenge(
    challenge: DiceChallengeConfig,
    playerId: string,
    gameState: GameState
  ): {
    result: DiceRollResult;
    success: boolean;
    selectedMapping?: DiceEffectMapping;
    triggeredEffects: CardEffect[];
  } {
    // 掷骰子
    const result = this.roll(challenge.diceConfig);

    // 确定成功/失败
    let success = true;
    if (challenge.difficultyClass !== undefined) {
      success = result.total >= challenge.difficultyClass;
    }

    // 查找匹配的结果映射
    let selectedMapping: DiceEffectMapping | undefined;
    let triggeredEffects: CardEffect[] = [];

    if (challenge.resultMappings && challenge.resultMappings.length > 0) {
      for (const mapping of challenge.resultMappings) {
        if (result.total >= mapping.range[0] && result.total <= mapping.range[1]) {
          selectedMapping = mapping;
          triggeredEffects = mapping.effects;
          break;
        }
      }
    } else {
      // 使用简单的成功/失败效果
      triggeredEffects = success
        ? (challenge.successEffects ?? [])
        : (challenge.failureEffects ?? []);
    }

    // 发出事件
    this.emitChallengeEvent(playerId, challenge, result, success, gameState);

    return {
      result,
      success,
      selectedMapping,
      triggeredEffects,
    };
  }

  /**
   * 记录骰子掷出
   */
  recordRoll(
    playerId: string,
    result: DiceRollResult,
    turn: number,
    source: DiceHistoryEntry['source'],
    sourceId?: string,
    triggeredEffects?: ResolvedEffect[]
  ): DiceHistoryEntry {
    const entry: DiceHistoryEntry = {
      id: generateId(),
      playerId,
      timestamp: Date.now(),
      turn,
      result,
      source,
      sourceId,
      triggeredEffects,
    };

    this.history.push(entry);

    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    return entry;
  }

  /**
   * 为玩家掷骰子并记录
   */
  rollForPlayer(
    playerId: string,
    config: DiceConfig,
    turn: number,
    source: DiceHistoryEntry['source'],
    sourceId?: string,
    gameState?: GameState
  ): DiceRollResult {
    const result = this.roll(config);

    // 记录历史
    this.recordRoll(playerId, result, turn, source, sourceId);

    // 发出事件
    if (this.eventBus && gameState) {
      this.emitRollEvent(playerId, result, gameState);
    }

    return result;
  }

  /**
   * 创建骰子效果卡牌效果
   * 根据掷骰结果修改属性
   */
  createDiceStatEffect(
    diceConfig: DiceConfig,
    statName: string,
    baseValue: number,
    perPoint: number = 1
  ): DiceChallengeConfig {
    return {
      id: generateId(),
      name: `掷骰子: ${statName}`,
      description: `掷${this.formatDiceConfig(diceConfig)}，根据结果修改${statName}`,
      diceConfig,
      resultMappings: this.createLinearMappings(diceConfig, statName, baseValue, perPoint),
    };
  }

  /**
   * 获取骰子历史
   */
  getHistory(): DiceHistoryEntry[] {
    return [...this.history];
  }

  /**
   * 获取玩家的骰子历史
   */
  getPlayerHistory(playerId: string): DiceHistoryEntry[] {
    return this.history.filter((entry) => entry.playerId === playerId);
  }

  /**
   * 获取最近的骰子结果
   */
  getLastRoll(playerId?: string): DiceHistoryEntry | undefined {
    if (playerId) {
      const playerHistory = this.getPlayerHistory(playerId);
      return playerHistory[playerHistory.length - 1];
    }
    return this.history[this.history.length - 1];
  }

  /**
   * 计算玩家的骰子统计
   */
  getPlayerStats(playerId: string): {
    totalRolls: number;
    averageResult: number;
    criticals: number;
    fumbles: number;
  } {
    const playerHistory = this.getPlayerHistory(playerId);
    const totalRolls = playerHistory.length;

    if (totalRolls === 0) {
      return { totalRolls: 0, averageResult: 0, criticals: 0, fumbles: 0 };
    }

    const totalSum = playerHistory.reduce((sum, entry) => sum + entry.result.total, 0);
    const criticals = playerHistory.filter((entry) => entry.result.isCritical).length;
    const fumbles = playerHistory.filter((entry) => entry.result.isFumble).length;

    return {
      totalRolls,
      averageResult: totalSum / totalRolls,
      criticals,
      fumbles,
    };
  }

  /**
   * 重置系统
   */
  reset(): void {
    this.history = [];
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  /**
   * 获取骰子面数
   */
  private getDiceFaces(config: DiceConfig): number {
    if (config.type === 'custom' && config.customFaces && config.customFaces.length > 0) {
      return config.customFaces.length;
    }
    return DiceSystem.DICE_FACES[config.type as StandardDiceType] ?? 6;
  }

  /**
   * 掷指定数量的骰子
   */
  private rollDice(faces: number, count: number): number[] {
    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(this.randomGenerator() * faces) + 1);
    }
    return rolls;
  }

  /**
   * 格式化骰子配置为字符串
   */
  private formatDiceConfig(config: DiceConfig): string {
    const count = config.count ?? 1;
    const type = config.type === 'custom' ? `d${config.customFaces?.length ?? 6}` : config.type;
    const modifier = config.modifier ?? 0;

    let result = `${count}${type}`;
    if (modifier > 0) {
      result += `+${modifier}`;
    } else if (modifier < 0) {
      result += modifier.toString();
    }

    if (config.advantage === 'advantage') {
      result += ' (优势)';
    } else if (config.advantage === 'disadvantage') {
      result += ' (劣势)';
    }

    return result;
  }

  /**
   * 创建线性效果映射
   */
  private createLinearMappings(
    config: DiceConfig,
    statName: string,
    baseValue: number,
    perPoint: number
  ): DiceEffectMapping[] {
    const faces = this.getDiceFaces(config);
    const count = config.count ?? 1;
    const minRoll = count;
    const maxRoll = count * faces;

    return [
      {
        range: [minRoll, maxRoll] as [number, number],
        description: `根据骰子结果修改${statName}`,
        effects: [
          {
            type: 'modify_stat',
            target: 'self',
            // value 会在运行时被实际骰子结果替换
            value: baseValue,
            metadata: {
              stat: statName,
              diceMultiplier: perPoint,
              isDiceEffect: true,
            },
          },
        ],
      },
    ];
  }

  /**
   * 发出掷骰事件
   */
  private emitRollEvent(playerId: string, result: DiceRollResult, gameState: GameState): void {
    if (!this.eventBus) return;

    this.eventBus.emitSimple(
      'dice_rolled',
      {
        playerId,
        result,
        isCritical: result.isCritical,
        isFumble: result.isFumble,
      },
      gameState
    );

    // 额外的暴击/大失败事件
    if (result.isCritical) {
      this.eventBus.emitSimple('dice_critical', { playerId, result }, gameState);
    } else if (result.isFumble) {
      this.eventBus.emitSimple('dice_fumble', { playerId, result }, gameState);
    }
  }

  /**
   * 发出挑战事件
   */
  private emitChallengeEvent(
    playerId: string,
    challenge: DiceChallengeConfig,
    result: DiceRollResult,
    success: boolean,
    gameState: GameState
  ): void {
    if (!this.eventBus) return;

    this.eventBus.emitSimple(
      'dice_challenge_completed',
      {
        playerId,
        challengeId: challenge.id,
        challengeName: challenge.name,
        result,
        success,
        difficultyClass: challenge.difficultyClass,
      },
      gameState
    );
  }

  // ============================================================================
  // 静态工具方法
  // ============================================================================

  /**
   * 解析骰子表达式 (如 "2d6+3")
   */
  static parseDiceExpression(expression: string): DiceConfig | null {
    const match = expression.match(/^(\d+)?d(\d+)([+-]\d+)?$/i);
    if (!match) return null;

    const count = match[1] ? parseInt(match[1], 10) : 1;
    const faces = parseInt(match[2], 10);
    const modifier = match[3] ? parseInt(match[3], 10) : 0;

    // 检查是否为标准骰子类型
    const standardTypes: StandardDiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
    const typeKey = `d${faces}` as StandardDiceType;
    const isStandard = standardTypes.includes(typeKey);

    if (isStandard) {
      return {
        type: typeKey,
        count,
        modifier,
      };
    }

    // 自定义骰子
    return {
      type: 'custom',
      customFaces: Array.from({ length: faces }, (_, i) => i + 1),
      count,
      modifier,
    };
  }

  /**
   * 计算骰子期望值
   */
  static calculateExpectedValue(config: DiceConfig): number {
    const faces =
      config.type === 'custom' ? (config.customFaces?.length ?? 6) : this.DICE_FACES[config.type];
    const count = config.count ?? 1;
    const modifier = config.modifier ?? 0;

    // 期望值 = count * (1 + faces) / 2 + modifier
    return (count * (1 + faces)) / 2 + modifier;
  }

  /**
   * 计算骰子结果范围
   */
  static calculateRange(config: DiceConfig): { min: number; max: number } {
    const faces =
      config.type === 'custom' ? (config.customFaces?.length ?? 6) : this.DICE_FACES[config.type];
    const count = config.count ?? 1;
    const modifier = config.modifier ?? 0;

    return {
      min: count + modifier,
      max: count * faces + modifier,
    };
  }
}

// ============================================================================
// 导出骰子效果类型扩展
// ============================================================================

/** 骰子卡牌效果的 metadata 扩展 */
export interface DiceEffectMetadata {
  /** 骰子配置 */
  diceConfig: DiceConfig;
  /** 结果映射 */
  resultMappings?: DiceEffectMapping[];
  /** 目标属性 */
  stat?: string;
  /** 目标资源 */
  resource?: string;
  /** 基础值 */
  baseValue?: number;
  /** 每点骰子值的倍数 */
  perPoint?: number;
  /** 难度等级 (用于挑战) */
  difficultyClass?: number;
  /** 成功效果 */
  successEffects?: CardEffect[];
  /** 失败效果 */
  failureEffects?: CardEffect[];
}
