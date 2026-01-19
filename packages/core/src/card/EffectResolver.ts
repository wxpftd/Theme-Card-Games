import {
  CardEffect,
  EffectCondition,
  GameState,
  PlayerState,
  ResolvedEffect,
  EffectType,
} from '../types';
import { Card } from './Card';

export interface EffectContext {
  gameState: GameState;
  sourceCard?: Card;
  sourcePlayerId: string;
  targetPlayerId?: string;
  targetCard?: Card;
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
    const { gameState, sourcePlayerId, targetPlayerId } = context;
    const players = Object.values(gameState.players);

    switch (effect.target) {
      case 'self':
        return [gameState.players[sourcePlayerId]].filter(Boolean);
      case 'opponent':
        return players.filter(p => p.id !== sourcePlayerId);
      case 'all_players':
        return players;
      case 'random_player':
        const randomIndex = Math.floor(Math.random() * players.length);
        return [players[randomIndex]];
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
      const index = player.statuses.findIndex(s => s.id === statusId);
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
}
