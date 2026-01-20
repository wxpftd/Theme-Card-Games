import {
  SharedResourceDefinition,
  SharedResourceState,
  SharedResourceClaimResult,
  SharedResourceClaimHandler,
  GameState,
  ResolvedEffect,
} from '../types';
import { EventBus } from '../event';
import { EffectResolver, EffectContext } from '../card';

export interface SharedResourceSystemOptions {
  definitions: SharedResourceDefinition[];
  eventBus: EventBus;
  effectResolver?: EffectResolver;
  customRules?: Record<string, SharedResourceClaimHandler>;
}

/**
 * 共享竞争资源系统
 * 管理玩家之间共同竞争的有限资源
 */
export class SharedResourceSystem {
  private definitions: Map<string, SharedResourceDefinition>;
  private states: Map<string, SharedResourceState>;
  private eventBus: EventBus;
  private effectResolver?: EffectResolver;
  private customRules: Record<string, SharedResourceClaimHandler>;

  constructor(options: SharedResourceSystemOptions) {
    this.definitions = new Map(options.definitions.map((d) => [d.id, d]));
    this.states = new Map();
    this.eventBus = options.eventBus;
    this.effectResolver = options.effectResolver;
    this.customRules = options.customRules ?? {};

    // 初始化所有资源状态
    this.initializeStates();
  }

  /**
   * 初始化资源状态
   */
  private initializeStates(): void {
    for (const [id, def] of this.definitions) {
      this.states.set(id, {
        resourceId: id,
        currentAmount: def.totalAmount,
        claimedBy: {},
        lastRenewalTurn: 0,
      });
    }
  }

  /**
   * 获取资源定义
   */
  getDefinition(resourceId: string): SharedResourceDefinition | undefined {
    return this.definitions.get(resourceId);
  }

  /**
   * 获取资源状态
   */
  getState(resourceId: string): SharedResourceState | undefined {
    return this.states.get(resourceId);
  }

  /**
   * 获取所有资源状态
   */
  getAllStates(): SharedResourceState[] {
    return Array.from(this.states.values());
  }

  /**
   * 获取所有资源定义
   */
  getAllDefinitions(): SharedResourceDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * 尝试抢夺资源
   */
  claimResource(
    resourceId: string,
    playerId: string,
    gameState: GameState,
    ruleIndex: number = 0
  ): SharedResourceClaimResult {
    const definition = this.definitions.get(resourceId);
    const state = this.states.get(resourceId);

    if (!definition || !state) {
      return {
        success: false,
        amountClaimed: 0,
        failureReason: `Resource ${resourceId} not found`,
      };
    }

    // 检查资源是否还有剩余
    if (state.currentAmount <= 0) {
      return {
        success: false,
        amountClaimed: 0,
        failureReason: 'Resource depleted',
      };
    }

    // 获取抢夺规则
    const rule = definition.claimRules[ruleIndex];
    if (!rule) {
      return {
        success: false,
        amountClaimed: 0,
        failureReason: 'Invalid rule index',
      };
    }

    // 执行抢夺规则
    const result = this.executeClaimRule(definition, state, playerId, gameState, rule, ruleIndex);

    if (result.success) {
      // 更新资源状态
      state.currentAmount -= result.amountClaimed;
      state.claimedBy[playerId] = (state.claimedBy[playerId] ?? 0) + result.amountClaimed;

      // 发出事件
      this.eventBus.emit(
        {
          type: 'shared_resource_claimed',
          timestamp: Date.now(),
          data: {
            resourceId,
            playerId,
            amountClaimed: result.amountClaimed,
            remainingAmount: state.currentAmount,
          },
        },
        gameState
      );

      // 检查资源是否耗尽
      if (state.currentAmount <= 0) {
        this.eventBus.emit(
          {
            type: 'shared_resource_depleted',
            timestamp: Date.now(),
            data: { resourceId },
          },
          gameState
        );
      }

      // 应用抢夺后效果
      if (definition.claimEffects && this.effectResolver) {
        const context: EffectContext = {
          gameState,
          sourcePlayerId: playerId,
        };
        result.effects = this.effectResolver.resolveAll(definition.claimEffects, context);
      }
    }

    return result;
  }

  /**
   * 执行抢夺规则
   */
  private executeClaimRule(
    definition: SharedResourceDefinition,
    state: SharedResourceState,
    playerId: string,
    gameState: GameState,
    rule: SharedResourceDefinition['claimRules'][0],
    ruleIndex: number
  ): SharedResourceClaimResult {
    switch (rule.type) {
      case 'first_come':
        // 先到先得
        return {
          success: true,
          amountClaimed: 1,
        };

      case 'highest_stat':
        return this.checkStatBasedClaim(
          state,
          playerId,
          gameState,
          rule.statId ?? 'performance',
          'highest'
        );

      case 'lowest_stat':
        return this.checkStatBasedClaim(
          state,
          playerId,
          gameState,
          rule.statId ?? 'performance',
          'lowest'
        );

      case 'random':
        // 随机成功（50%概率）
        if (Math.random() > 0.5) {
          return {
            success: true,
            amountClaimed: 1,
          };
        }
        return {
          success: false,
          amountClaimed: 0,
          failureReason: 'Random chance failed',
        };

      case 'auction':
        // 拍卖模式需要外部实现
        return {
          success: false,
          amountClaimed: 0,
          failureReason: 'Auction mode requires external implementation',
        };

      case 'custom':
        if (rule.customRuleId && this.customRules[rule.customRuleId]) {
          return this.customRules[rule.customRuleId](
            definition,
            state,
            playerId,
            gameState,
            ruleIndex
          );
        }
        return {
          success: false,
          amountClaimed: 0,
          failureReason: `Custom rule ${rule.customRuleId} not found`,
        };

      default:
        return {
          success: false,
          amountClaimed: 0,
          failureReason: `Unknown rule type: ${rule.type}`,
        };
    }
  }

  /**
   * 基于属性的抢夺检查
   */
  private checkStatBasedClaim(
    state: SharedResourceState,
    playerId: string,
    gameState: GameState,
    statId: string,
    comparison: 'highest' | 'lowest'
  ): SharedResourceClaimResult {
    const players = Object.values(gameState.players);
    const playerStat = gameState.players[playerId]?.stats[statId] ?? 0;

    // 检查玩家是否满足条件
    let isEligible = true;
    for (const player of players) {
      if (player.id === playerId) continue;
      const otherStat = player.stats[statId] ?? 0;

      if (comparison === 'highest' && otherStat > playerStat) {
        isEligible = false;
        break;
      }
      if (comparison === 'lowest' && otherStat < playerStat) {
        isEligible = false;
        break;
      }
    }

    if (isEligible) {
      return {
        success: true,
        amountClaimed: 1,
      };
    }

    return {
      success: false,
      amountClaimed: 0,
      failureReason: `Player does not have the ${comparison} ${statId}`,
    };
  }

  /**
   * 处理资源再生
   */
  processRegeneration(currentTurn: number, gameState: GameState): void {
    for (const [resourceId, state] of this.states) {
      const definition = this.definitions.get(resourceId);
      if (!definition?.renewable) continue;

      const interval = definition.renewalInterval ?? 5;
      const amount = definition.renewalAmount ?? 1;

      // 检查是否到达再生时间
      if (currentTurn - state.lastRenewalTurn >= interval) {
        const oldAmount = state.currentAmount;
        state.currentAmount = Math.min(state.currentAmount + amount, definition.totalAmount);
        state.lastRenewalTurn = currentTurn;

        if (state.currentAmount > oldAmount) {
          this.eventBus.emit(
            {
              type: 'shared_resource_renewed',
              timestamp: Date.now(),
              data: {
                resourceId,
                renewedAmount: state.currentAmount - oldAmount,
                currentAmount: state.currentAmount,
              },
            },
            gameState
          );
        }
      }
    }
  }

  /**
   * 获取玩家已抢夺的资源数量
   */
  getPlayerClaimedAmount(resourceId: string, playerId: string): number {
    const state = this.states.get(resourceId);
    return state?.claimedBy[playerId] ?? 0;
  }

  /**
   * 获取所有玩家的抢夺排名
   */
  getClaimRanking(resourceId: string): Array<{ playerId: string; amount: number }> {
    const state = this.states.get(resourceId);
    if (!state) return [];

    return Object.entries(state.claimedBy)
      .map(([playerId, amount]) => ({ playerId, amount }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * 注册自定义规则
   */
  registerCustomRule(ruleId: string, handler: SharedResourceClaimHandler): void {
    this.customRules[ruleId] = handler;
  }

  /**
   * 重置系统
   */
  reset(): void {
    this.initializeStates();
  }
}
