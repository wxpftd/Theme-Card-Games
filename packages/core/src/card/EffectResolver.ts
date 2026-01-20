import {
  CardEffect,
  EffectCondition,
  GameState,
  PlayerState,
  ResolvedEffect,
  EffectType,
  TargetSelectionRequest,
  EffectTarget,
} from '../types';
import { Card } from './Card';
import { generateId } from '../utils';

export interface EffectContext {
  gameState: GameState;
  sourceCard?: Card;
  sourcePlayerId: string;
  targetPlayerId?: string;
  targetCard?: Card;
  /** 选中的目标玩家 ID 列表 (用于 selected_opponent) */
  selectedTargets?: string[];
}

export type CustomEffectHandler = (
  effect: CardEffect,
  context: EffectContext
) => ResolvedEffect | null;

/**
 * EffectResolver handles the resolution of card effects
 */
export class EffectResolver {
  private customHandlers: Map<string, CustomEffectHandler> = new Map();

  /**
   * Register a custom effect handler
   */
  registerHandler(effectType: string, handler: CustomEffectHandler): void {
    this.customHandlers.set(effectType, handler);
  }

  /**
   * Resolve a single effect
   */
  resolve(effect: CardEffect, context: EffectContext): ResolvedEffect | null {
    // Check condition first
    if (effect.condition && !this.checkCondition(effect.condition, context)) {
      return null;
    }

    // Try custom handler first
    if (effect.type === 'custom' || this.customHandlers.has(effect.type)) {
      const handler = this.customHandlers.get(effect.type);
      if (handler) {
        return handler(effect, context);
      }
    }

    // Built-in effect handlers
    switch (effect.type) {
      case 'modify_stat':
        return this.resolveModifyStat(effect, context);
      case 'draw_cards':
        return this.resolveDrawCards(effect, context);
      case 'discard_cards':
        return this.resolveDiscardCards(effect, context);
      case 'gain_resource':
        return this.resolveGainResource(effect, context);
      case 'lose_resource':
        return this.resolveLoseResource(effect, context);
      case 'apply_status':
        return this.resolveApplyStatus(effect, context);
      case 'remove_status':
        return this.resolveRemoveStatus(effect, context);
      case 'trigger_event':
        return this.resolveTriggerEvent(effect, context);
      // 竞争模式效果
      case 'transfer_stat':
        return this.resolveTransferStat(effect, context);
      case 'steal_resource':
        return this.resolveStealResource(effect, context);
      case 'damage_stat':
        return this.resolveDamageStat(effect, context);
      case 'claim_shared':
        // claim_shared 需要外部系统处理，这里只返回意图
        return this.resolveClaimShared(effect, context);
      default:
        console.warn(`Unknown effect type: ${effect.type}`);
        return null;
    }
  }

  /**
   * Resolve multiple effects
   */
  resolveAll(effects: CardEffect[], context: EffectContext): ResolvedEffect[] {
    const results: ResolvedEffect[] = [];
    for (const effect of effects) {
      const result = this.resolve(effect, context);
      if (result) {
        results.push(result);
      }
    }
    return results;
  }

  /**
   * Check if a condition is met
   */
  checkCondition(condition: EffectCondition, context: EffectContext): boolean {
    const { gameState } = context;
    const player = this.getTargetPlayer(context);

    if (!player) return false;

    switch (condition.type) {
      case 'stat_check': {
        const statValue = player.stats[condition.target ?? ''] ?? 0;
        return this.compareValues(statValue, condition.operator, Number(condition.value));
      }
      case 'card_count': {
        const count = player.hand.length;
        return this.compareValues(count, condition.operator, Number(condition.value));
      }
      case 'turn_count': {
        return this.compareValues(gameState.turn, condition.operator, Number(condition.value));
      }
      case 'custom': {
        // Custom conditions should be handled by theme-specific handlers
        return true;
      }
      default:
        return true;
    }
  }

  private compareValues(
    actual: number,
    operator: EffectCondition['operator'],
    expected: number
  ): boolean {
    switch (operator) {
      case '>':
        return actual > expected;
      case '<':
        return actual < expected;
      case '==':
        return actual === expected;
      case '>=':
        return actual >= expected;
      case '<=':
        return actual <= expected;
      case '!=':
        return actual !== expected;
      default:
        return false;
    }
  }

  private getTargetPlayer(context: EffectContext): PlayerState | null {
    const { gameState, targetPlayerId, sourcePlayerId } = context;
    const id = targetPlayerId ?? sourcePlayerId;
    return gameState.players[id] ?? null;
  }

  private getTargetPlayers(effect: CardEffect, context: EffectContext): PlayerState[] {
    const { gameState, sourcePlayerId, targetPlayerId, selectedTargets } = context;
    const players = Object.values(gameState.players);
    const opponents = players.filter((p) => p.id !== sourcePlayerId);

    switch (effect.target) {
      case 'self':
        return [gameState.players[sourcePlayerId]].filter(Boolean);
      case 'opponent':
        // 如果只有一个对手，直接返回
        if (opponents.length === 1) {
          return opponents;
        }
        // 如果有目标玩家 ID，使用它
        if (targetPlayerId) {
          return [gameState.players[targetPlayerId]].filter(Boolean);
        }
        // 否则返回第一个对手（或空）
        return opponents.slice(0, 1);
      case 'all_players':
        return players;
      case 'random_player':
        const randomIndex = Math.floor(Math.random() * players.length);
        return [players[randomIndex]];
      // 竞争模式目标
      case 'selected_opponent':
        // 使用选中的目标
        if (selectedTargets && selectedTargets.length > 0) {
          return selectedTargets.map((id) => gameState.players[id]).filter(Boolean);
        }
        if (targetPlayerId) {
          return [gameState.players[targetPlayerId]].filter(Boolean);
        }
        return [];
      case 'all_opponents':
        return opponents;
      case 'weakest_opponent': {
        const statId = (effect.metadata?.stat as string) ?? 'performance';
        const sorted = [...opponents].sort(
          (a, b) => (a.stats[statId] ?? 0) - (b.stats[statId] ?? 0)
        );
        return sorted.slice(0, 1);
      }
      case 'strongest_opponent': {
        const statId = (effect.metadata?.stat as string) ?? 'performance';
        const sorted = [...opponents].sort(
          (a, b) => (b.stats[statId] ?? 0) - (a.stats[statId] ?? 0)
        );
        return sorted.slice(0, 1);
      }
      default:
        if (targetPlayerId) {
          return [gameState.players[targetPlayerId]].filter(Boolean);
        }
        return [gameState.players[sourcePlayerId]].filter(Boolean);
    }
  }

  // Built-in effect resolvers

  private resolveModifyStat(effect: CardEffect, context: EffectContext): ResolvedEffect | null {
    const targets = this.getTargetPlayers(effect, context);
    const statName = effect.metadata?.stat as string;
    const value = Number(effect.value ?? 0);

    if (!statName) return null;

    for (const player of targets) {
      const before = player.stats[statName] ?? 0;
      player.stats[statName] = before + value;

      return {
        type: 'modify_stat',
        target: player.id,
        before,
        after: player.stats[statName],
      };
    }

    return null;
  }

  private resolveDrawCards(effect: CardEffect, context: EffectContext): ResolvedEffect | null {
    // Note: Actual drawing should be handled by the game engine
    // This just returns the intent
    const targets = this.getTargetPlayers(effect, context);
    const count = Number(effect.value ?? 1);

    return {
      type: 'draw_cards',
      target: targets[0]?.id ?? context.sourcePlayerId,
      before: null,
      after: { count },
    };
  }

  private resolveDiscardCards(effect: CardEffect, context: EffectContext): ResolvedEffect | null {
    const targets = this.getTargetPlayers(effect, context);
    const count = Number(effect.value ?? 1);

    return {
      type: 'discard_cards',
      target: targets[0]?.id ?? context.sourcePlayerId,
      before: null,
      after: { count },
    };
  }

  private resolveGainResource(effect: CardEffect, context: EffectContext): ResolvedEffect | null {
    const targets = this.getTargetPlayers(effect, context);
    const resourceName = effect.metadata?.resource as string;
    const value = Number(effect.value ?? 0);

    if (!resourceName) return null;

    for (const player of targets) {
      const before = player.resources[resourceName] ?? 0;
      player.resources[resourceName] = before + value;

      return {
        type: 'gain_resource',
        target: player.id,
        before,
        after: player.resources[resourceName],
      };
    }

    return null;
  }

  private resolveLoseResource(effect: CardEffect, context: EffectContext): ResolvedEffect | null {
    const targets = this.getTargetPlayers(effect, context);
    const resourceName = effect.metadata?.resource as string;
    const value = Number(effect.value ?? 0);

    if (!resourceName) return null;

    for (const player of targets) {
      const before = player.resources[resourceName] ?? 0;
      player.resources[resourceName] = Math.max(0, before - value);

      return {
        type: 'lose_resource',
        target: player.id,
        before,
        after: player.resources[resourceName],
      };
    }

    return null;
  }

  private resolveApplyStatus(effect: CardEffect, context: EffectContext): ResolvedEffect | null {
    const targets = this.getTargetPlayers(effect, context);
    const statusId = effect.metadata?.statusId as string;
    const statusName = effect.metadata?.statusName as string;
    const duration = Number(effect.metadata?.duration ?? -1);

    if (!statusId) return null;

    for (const player of targets) {
      const status = {
        id: statusId,
        name: statusName ?? statusId,
        duration,
        effects: (effect.metadata?.effects as CardEffect[]) ?? [],
      };

      player.statuses.push(status);

      return {
        type: 'apply_status',
        target: player.id,
        before: null,
        after: status,
      };
    }

    return null;
  }

  private resolveRemoveStatus(effect: CardEffect, context: EffectContext): ResolvedEffect | null {
    const targets = this.getTargetPlayers(effect, context);
    const statusId = effect.metadata?.statusId as string;

    if (!statusId) return null;

    for (const player of targets) {
      const index = player.statuses.findIndex((s) => s.id === statusId);
      if (index !== -1) {
        const removed = player.statuses.splice(index, 1)[0];
        return {
          type: 'remove_status',
          target: player.id,
          before: removed,
          after: null,
        };
      }
    }

    return null;
  }

  private resolveTriggerEvent(effect: CardEffect, context: EffectContext): ResolvedEffect | null {
    const eventType = effect.metadata?.eventType as string;
    const eventData = effect.metadata?.eventData as Record<string, unknown>;

    return {
      type: 'trigger_event',
      target: 'game',
      before: null,
      after: { eventType, eventData },
    };
  }

  // ============================================================================
  // 竞争模式效果解析器
  // ============================================================================

  /**
   * 转移属性效果 (甩锅)
   * 将自己的负面属性转移给对手，或将对手的正面属性转移给自己
   */
  private resolveTransferStat(effect: CardEffect, context: EffectContext): ResolvedEffect | null {
    const { gameState, sourcePlayerId } = context;
    const targets = this.getTargetPlayers(effect, context);
    const sourcePlayer = gameState.players[sourcePlayerId];

    const statName = effect.metadata?.stat as string;
    const value = Number(effect.value ?? 0);
    const direction = (effect.metadata?.direction as string) ?? 'to_target'; // 'to_target' 或 'from_target'

    if (!statName || !sourcePlayer || targets.length === 0) return null;

    const targetPlayer = targets[0];
    const results: { playerId: string; before: number; after: number }[] = [];

    if (direction === 'to_target') {
      // 将属性从源玩家转移到目标玩家
      const sourceBefore = sourcePlayer.stats[statName] ?? 0;
      const targetBefore = targetPlayer.stats[statName] ?? 0;

      sourcePlayer.stats[statName] = sourceBefore - value;
      targetPlayer.stats[statName] = targetBefore + value;

      results.push(
        { playerId: sourcePlayerId, before: sourceBefore, after: sourcePlayer.stats[statName] },
        { playerId: targetPlayer.id, before: targetBefore, after: targetPlayer.stats[statName] }
      );
    } else {
      // 将属性从目标玩家转移到源玩家
      const sourceBefore = sourcePlayer.stats[statName] ?? 0;
      const targetBefore = targetPlayer.stats[statName] ?? 0;

      targetPlayer.stats[statName] = targetBefore - value;
      sourcePlayer.stats[statName] = sourceBefore + value;

      results.push(
        { playerId: targetPlayer.id, before: targetBefore, after: targetPlayer.stats[statName] },
        { playerId: sourcePlayerId, before: sourceBefore, after: sourcePlayer.stats[statName] }
      );
    }

    return {
      type: 'transfer_stat',
      target: targetPlayer.id,
      before: { stat: statName, direction, results: results.map((r) => ({ ...r })) },
      after: { stat: statName, value, results },
    };
  }

  /**
   * 偷取资源效果
   * 从对手偷取资源
   */
  private resolveStealResource(effect: CardEffect, context: EffectContext): ResolvedEffect | null {
    const { gameState, sourcePlayerId } = context;
    const targets = this.getTargetPlayers(effect, context);
    const sourcePlayer = gameState.players[sourcePlayerId];

    const resourceName = effect.metadata?.resource as string;
    const value = Number(effect.value ?? 0);

    if (!resourceName || !sourcePlayer || targets.length === 0) return null;

    const targetPlayer = targets[0];

    const targetBefore = targetPlayer.resources[resourceName] ?? 0;
    const sourceBefore = sourcePlayer.resources[resourceName] ?? 0;

    // 只能偷取对方拥有的数量
    const actualStolen = Math.min(value, targetBefore);

    targetPlayer.resources[resourceName] = targetBefore - actualStolen;
    sourcePlayer.resources[resourceName] = sourceBefore + actualStolen;

    return {
      type: 'steal_resource',
      target: targetPlayer.id,
      before: {
        resource: resourceName,
        targetAmount: targetBefore,
        sourceAmount: sourceBefore,
      },
      after: {
        resource: resourceName,
        stolenAmount: actualStolen,
        targetAmount: targetPlayer.resources[resourceName],
        sourceAmount: sourcePlayer.resources[resourceName],
      },
    };
  }

  /**
   * 伤害属性效果
   * 直接减少对手属性
   */
  private resolveDamageStat(effect: CardEffect, context: EffectContext): ResolvedEffect | null {
    const targets = this.getTargetPlayers(effect, context);
    const statName = effect.metadata?.stat as string;
    const value = Number(effect.value ?? 0);

    if (!statName) return null;

    const results: ResolvedEffect[] = [];

    for (const player of targets) {
      const before = player.stats[statName] ?? 0;
      player.stats[statName] = before - Math.abs(value);

      results.push({
        type: 'damage_stat',
        target: player.id,
        before,
        after: player.stats[statName],
      });
    }

    // 返回第一个结果（简化）
    return results[0] ?? null;
  }

  /**
   * 抢夺共享资源效果
   * 返回意图，实际抢夺由 SharedResourceSystem 处理
   */
  private resolveClaimShared(effect: CardEffect, context: EffectContext): ResolvedEffect | null {
    const resourceId = effect.metadata?.resourceId as string;
    const ruleIndex = Number(effect.metadata?.ruleIndex ?? 0);

    if (!resourceId) return null;

    return {
      type: 'claim_shared',
      target: 'game',
      before: null,
      after: {
        resourceId,
        ruleIndex,
        playerId: context.sourcePlayerId,
        // 实际结果由 SharedResourceSystem 填充
        pending: true,
      },
    };
  }

  // ============================================================================
  // 目标选择支持
  // ============================================================================

  /**
   * 检查效果是否需要目标选择
   */
  needsTargetSelection(
    effect: CardEffect,
    gameState: GameState,
    sourcePlayerId: string
  ): TargetSelectionRequest | null {
    // 只有 selected_opponent 需要用户选择
    if (effect.target !== 'selected_opponent') {
      return null;
    }

    const opponents = Object.values(gameState.players).filter((p) => p.id !== sourcePlayerId);

    // 如果只有一个对手，不需要选择
    if (opponents.length <= 1) {
      return null;
    }

    return {
      requestId: generateId(),
      sourceCardId: '', // 由调用方填充
      sourcePlayerId,
      validTargets: opponents.map((p) => p.id),
      reason: this.getTargetSelectionReason(effect),
      allowCancel: true,
      minTargets: 1,
      maxTargets: 1,
    };
  }

  /**
   * 检查卡牌的所有效果是否需要目标选择
   */
  needsTargetSelectionForCard(
    effects: CardEffect[],
    gameState: GameState,
    sourcePlayerId: string,
    cardId: string
  ): TargetSelectionRequest | null {
    for (const effect of effects) {
      const request = this.needsTargetSelection(effect, gameState, sourcePlayerId);
      if (request) {
        request.sourceCardId = cardId;
        return request;
      }
    }
    return null;
  }

  /**
   * 获取目标选择的原因描述
   */
  private getTargetSelectionReason(effect: CardEffect): string {
    switch (effect.type) {
      case 'transfer_stat':
        return '选择要将属性转移给的对手';
      case 'steal_resource':
        return '选择要偷取资源的对手';
      case 'damage_stat':
        return '选择要攻击的对手';
      case 'apply_status':
        return '选择要施加状态的对手';
      default:
        return '选择目标对手';
    }
  }
}
