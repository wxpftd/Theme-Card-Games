import {
  MilestoneWinConfig,
  MilestoneDefinition,
  MilestoneRequirement,
  MilestoneFailureCondition,
  PlayerMilestoneState,
  MilestoneProgress,
  GameState,
  PlayerState,
  CardEffect,
  ResolvedEffect,
} from '../types';
import { EffectResolver, EffectContext } from '../card/EffectResolver';
import { EventBus } from '../event';

export type CustomMilestoneChecker = (playerId: string, state: GameState) => boolean;

export interface MilestoneSystemOptions {
  milestoneConfig: MilestoneWinConfig;
  effectResolver: EffectResolver;
  eventBus: EventBus;
  customCheckers?: Record<string, CustomMilestoneChecker>;
}

export interface MilestoneCheckResult {
  /** 是否达成胜利 */
  isVictory: boolean;
  /** 是否达成失败 */
  isFailure: boolean;
  /** 胜利/失败原因 */
  reason: string | null;
  /** 新达成的里程碑 */
  newlyAchievedMilestones: MilestoneDefinition[];
  /** 应用的奖励效果 */
  rewardEffects: ResolvedEffect[];
}

/**
 * MilestoneSystem 管理里程碑式的胜利条件
 * 提供更直观的游戏进度和目标
 */
export class MilestoneSystem {
  private config: MilestoneWinConfig;
  private milestones: Map<string, MilestoneDefinition> = new Map();
  private effectResolver: EffectResolver;
  private eventBus: EventBus;
  private customCheckers: Record<string, CustomMilestoneChecker>;

  constructor(options: MilestoneSystemOptions) {
    this.config = options.milestoneConfig;
    this.effectResolver = options.effectResolver;
    this.eventBus = options.eventBus;
    this.customCheckers = options.customCheckers ?? {};

    // 按顺序存储里程碑
    const sortedMilestones = [...options.milestoneConfig.milestones].sort(
      (a, b) => a.order - b.order
    );
    for (const milestone of sortedMilestones) {
      this.milestones.set(milestone.id, milestone);
    }

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // 监听属性变化以更新里程碑进度
    this.eventBus.on('stat_changed', (event) => {
      const playerId = event.data.playerId as string;
      this.onStatChanged(playerId, event.data as { playerId: string; stat: string });
    });

    this.eventBus.on('resource_changed', (event) => {
      const playerId = event.data.playerId as string;
      this.onResourceChanged(playerId, event.data as { playerId: string; resource: string });
    });

    this.eventBus.on('card_played', (event) => {
      const playerId = event.data.playerId as string;
      this.onCardPlayed(playerId, event.data as { playerId: string; cardId: string });
    });
  }

  /**
   * 为玩家初始化里程碑状态
   */
  initializePlayer(playerId: string, player: PlayerState): void {
    const firstMilestone = this.getFirstMilestone();
    if (!firstMilestone) return;

    const progress: Record<string, MilestoneProgress> = {};

    // 初始化所有里程碑的进度
    for (const milestone of this.milestones.values()) {
      progress[milestone.id] = {
        milestoneId: milestone.id,
        requirementsMet: milestone.requirements.map(() => false),
        achieved: false,
      };
    }

    player.milestoneState = {
      currentMilestoneId: firstMilestone.id,
      achievedMilestones: [],
      progress,
    };
  }

  /**
   * 获取第一个里程碑
   */
  private getFirstMilestone(): MilestoneDefinition | undefined {
    let first: MilestoneDefinition | undefined;
    let minOrder = Infinity;

    for (const milestone of this.milestones.values()) {
      if (milestone.order < minOrder && !milestone.isFailure) {
        minOrder = milestone.order;
        first = milestone;
      }
    }

    return first;
  }

  /**
   * 获取下一个里程碑
   */
  private getNextMilestone(currentId: string): MilestoneDefinition | undefined {
    const current = this.milestones.get(currentId);
    if (!current) return undefined;

    let next: MilestoneDefinition | undefined;
    let minOrder = Infinity;

    for (const milestone of this.milestones.values()) {
      if (milestone.order > current.order && milestone.order < minOrder && !milestone.isFailure) {
        minOrder = milestone.order;
        next = milestone;
      }
    }

    return next;
  }

  /**
   * 检查单个里程碑条件是否满足
   */
  private checkRequirement(
    requirement: MilestoneRequirement,
    player: PlayerState,
    gameState: GameState,
    milestoneState: PlayerMilestoneState
  ): boolean {
    switch (requirement.type) {
      case 'stat_threshold': {
        const value = player.stats[requirement.stat] ?? 0;
        return this.compareValues(value, requirement.operator, requirement.value);
      }

      case 'resource_threshold': {
        const value = player.resources[requirement.resource] ?? 0;
        return this.compareValues(value, requirement.operator, requirement.value);
      }

      case 'previous_milestone': {
        return milestoneState.achievedMilestones.includes(requirement.milestoneId);
      }

      case 'turns_played': {
        return gameState.turn >= requirement.count;
      }

      case 'custom': {
        const checker = this.customCheckers[requirement.checkerId];
        if (checker) {
          return checker(player.id, gameState);
        }
        return false;
      }

      // TODO: 实现其他类型的条件检查
      case 'card_played':
      case 'combo_triggered':
      case 'status_acquired':
        // 这些需要额外的跟踪机制，暂时返回 false
        return false;

      default:
        return false;
    }
  }

  private compareValues(
    value: number,
    operator: '>=' | '<=' | '>' | '<' | '==',
    target: number
  ): boolean {
    switch (operator) {
      case '>=':
        return value >= target;
      case '<=':
        return value <= target;
      case '>':
        return value > target;
      case '<':
        return value < target;
      case '==':
        return value === target;
      default:
        return false;
    }
  }

  /**
   * 检查失败条件
   */
  private checkFailureConditions(
    player: PlayerState,
    gameState: GameState
  ): MilestoneFailureCondition | null {
    const failureConditions = this.config.failureConditions ?? [];

    for (const condition of failureConditions) {
      switch (condition.type) {
        case 'stat_zero': {
          if (condition.target) {
            const value = player.stats[condition.target] ?? 0;
            if (value <= 0) {
              return condition;
            }
          }
          break;
        }

        case 'resource_depleted': {
          if (condition.target) {
            const value = player.resources[condition.target] ?? 0;
            if (value <= 0) {
              return condition;
            }
          }
          break;
        }

        case 'custom': {
          if (condition.customCheckerId) {
            const checker = this.customCheckers[condition.customCheckerId];
            if (checker && checker(player.id, gameState)) {
              return condition;
            }
          }
          break;
        }
      }
    }

    return null;
  }

  /**
   * 更新玩家的里程碑进度
   */
  updateProgress(player: PlayerState, gameState: GameState): MilestoneCheckResult {
    const result: MilestoneCheckResult = {
      isVictory: false,
      isFailure: false,
      reason: null,
      newlyAchievedMilestones: [],
      rewardEffects: [],
    };

    const milestoneState = player.milestoneState;
    if (!milestoneState) return result;

    // 首先检查失败条件
    const failureCondition = this.checkFailureConditions(player, gameState);
    if (failureCondition) {
      result.isFailure = true;
      result.reason = failureCondition.message;

      this.eventBus.emitSimple(
        'milestone_failure',
        {
          playerId: player.id,
          reason: failureCondition.message,
          condition: failureCondition,
        },
        gameState
      );

      return result;
    }

    // 检查当前及后续里程碑
    let currentMilestone = this.milestones.get(milestoneState.currentMilestoneId);

    while (currentMilestone) {
      const progress = milestoneState.progress[currentMilestone.id];
      if (!progress) break;

      // 检查所有条件
      let allMet = true;
      for (let i = 0; i < currentMilestone.requirements.length; i++) {
        const requirement = currentMilestone.requirements[i];
        const met = this.checkRequirement(requirement, player, gameState, milestoneState);
        progress.requirementsMet[i] = met;
        if (!met) allMet = false;
      }

      // 发送进度更新事件
      this.eventBus.emitSimple(
        'milestone_progress_updated',
        {
          playerId: player.id,
          milestoneId: currentMilestone.id,
          progress: progress,
        },
        gameState
      );

      // 如果所有条件都满足，达成里程碑
      if (allMet && !progress.achieved) {
        progress.achieved = true;
        progress.achievedAt = Date.now();
        progress.achievedAtTurn = gameState.turn;
        milestoneState.achievedMilestones.push(currentMilestone.id);
        milestoneState.lastMilestoneChangeAt = Date.now();

        result.newlyAchievedMilestones.push(currentMilestone);

        // 应用奖励
        if (currentMilestone.rewards && currentMilestone.rewards.length > 0) {
          const context: EffectContext = {
            gameState,
            sourcePlayerId: player.id,
          };
          const effects = this.effectResolver.resolveAll(currentMilestone.rewards, context);
          result.rewardEffects.push(...effects);
        }

        // 发送里程碑达成事件
        this.eventBus.emitSimple(
          'milestone_achieved',
          {
            playerId: player.id,
            milestone: currentMilestone,
            message: currentMilestone.unlockMessage ?? `达成里程碑: ${currentMilestone.name}`,
          },
          gameState
        );

        // 检查是否为最终里程碑
        if (currentMilestone.id === this.config.finalMilestoneId) {
          result.isVictory = true;
          result.reason = `达成最终目标: ${currentMilestone.name}`;
          return result;
        }

        // 移动到下一个里程碑
        const nextMilestone = this.getNextMilestone(currentMilestone.id);
        if (nextMilestone) {
          milestoneState.currentMilestoneId = nextMilestone.id;
          currentMilestone = nextMilestone;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return result;
  }

  /**
   * 获取玩家的当前里程碑
   */
  getCurrentMilestone(player: PlayerState): MilestoneDefinition | undefined {
    const milestoneState = player.milestoneState;
    if (!milestoneState) return undefined;
    return this.milestones.get(milestoneState.currentMilestoneId);
  }

  /**
   * 获取玩家的里程碑进度摘要
   */
  getProgressSummary(player: PlayerState): {
    current: MilestoneDefinition | undefined;
    achieved: MilestoneDefinition[];
    remaining: MilestoneDefinition[];
    progress: number; // 0-100 百分比
  } {
    const milestoneState = player.milestoneState;
    if (!milestoneState) {
      return {
        current: undefined,
        achieved: [],
        remaining: [],
        progress: 0,
      };
    }

    const current = this.milestones.get(milestoneState.currentMilestoneId);
    const achieved: MilestoneDefinition[] = [];
    const remaining: MilestoneDefinition[] = [];

    for (const milestone of this.milestones.values()) {
      if (milestone.isFailure) continue;

      if (milestoneState.achievedMilestones.includes(milestone.id)) {
        achieved.push(milestone);
      } else {
        remaining.push(milestone);
      }
    }

    // 计算总体进度
    const totalMilestones = achieved.length + remaining.length;
    const progress = totalMilestones > 0 ? (achieved.length / totalMilestones) * 100 : 0;

    return {
      current,
      achieved: achieved.sort((a, b) => a.order - b.order),
      remaining: remaining.sort((a, b) => a.order - b.order),
      progress,
    };
  }

  /**
   * 获取里程碑配置
   */
  getConfig(): MilestoneWinConfig {
    return this.config;
  }

  /**
   * 获取所有里程碑定义
   */
  getAllMilestones(): MilestoneDefinition[] {
    return Array.from(this.milestones.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * 获取最终里程碑
   */
  getFinalMilestone(): MilestoneDefinition | undefined {
    return this.milestones.get(this.config.finalMilestoneId);
  }

  // 事件处理器
  private onStatChanged(playerId: string, _data: { playerId: string; stat: string }): void {
    // 属性变化时可能影响里程碑进度，由外部调用 updateProgress
  }

  private onResourceChanged(playerId: string, _data: { playerId: string; resource: string }): void {
    // 资源变化时可能影响里程碑进度，由外部调用 updateProgress
  }

  private onCardPlayed(playerId: string, _data: { playerId: string; cardId: string }): void {
    // 卡牌打出时可能影响里程碑进度，由外部调用 updateProgress
  }

  /**
   * 重置系统状态
   */
  reset(): void {
    // 里程碑系统状态存储在 PlayerState 中，无需在此重置
  }
}
