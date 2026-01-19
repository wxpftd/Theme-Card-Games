import {
  StatusDefinition,
  PlayerStatus,
  PlayerState,
  GameState,
  CardEffect,
  ResolvedEffect,
  StatusTriggerCondition,
} from '../types';
import { EffectResolver, EffectContext } from '../card/EffectResolver';
import { EventBus } from '../event';

export interface StatusEffectSystemOptions {
  statusDefinitions: StatusDefinition[];
  effectResolver: EffectResolver;
  eventBus: EventBus;
}

/**
 * StatusEffectSystem manages persistent status effects on players
 */
export class StatusEffectSystem {
  private statusDefinitions: Map<string, StatusDefinition> = new Map();
  private effectResolver: EffectResolver;
  private eventBus: EventBus;

  constructor(options: StatusEffectSystemOptions) {
    this.effectResolver = options.effectResolver;
    this.eventBus = options.eventBus;

    for (const status of options.statusDefinitions) {
      this.statusDefinitions.set(status.id, status);
    }

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Status effects are managed through explicit calls from GameStateManager
    // to ensure proper ordering
  }

  /**
   * Apply a status effect to a player
   */
  applyStatus(
    playerId: string,
    statusId: string,
    player: PlayerState,
    gameState: GameState
  ): ResolvedEffect[] {
    const definition = this.statusDefinitions.get(statusId);
    if (!definition) {
      console.warn(`Unknown status: ${statusId}`);
      return [];
    }

    // Check if status already exists
    const existingIndex = player.statuses.findIndex((s) => s.id === statusId);

    if (existingIndex !== -1) {
      const existing = player.statuses[existingIndex];

      if (definition.stackable) {
        // Increment stack count
        existing.currentStacks = Math.min(
          (existing.currentStacks ?? 1) + 1,
          definition.maxStacks ?? Infinity
        );
        // Refresh duration
        existing.duration = definition.duration;
      } else {
        // Just refresh duration
        existing.duration = definition.duration;
      }

      return [];
    }

    // Create new status
    const status: PlayerStatus = {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      icon: definition.icon,
      duration: definition.duration,
      effects: definition.effects,
      stackable: definition.stackable,
      maxStacks: definition.maxStacks,
      currentStacks: 1,
      onApply: definition.onApply,
      onRemove: definition.onRemove,
      onTurnStart: definition.onTurnStart,
      onTurnEnd: definition.onTurnEnd,
    };

    player.statuses.push(status);

    // Emit event
    this.eventBus.emitSimple(
      'status_applied',
      {
        playerId,
        statusId,
        statusName: status.name,
        duration: status.duration,
      },
      gameState
    );

    // Execute onApply effects
    const results: ResolvedEffect[] = [];
    if (definition.onApply) {
      const context: EffectContext = {
        gameState,
        sourcePlayerId: playerId,
      };
      results.push(...this.effectResolver.resolveAll(definition.onApply, context));
    }

    return results;
  }

  /**
   * Remove a status effect from a player
   */
  removeStatus(
    playerId: string,
    statusId: string,
    player: PlayerState,
    gameState: GameState
  ): ResolvedEffect[] {
    const index = player.statuses.findIndex((s) => s.id === statusId);
    if (index === -1) return [];

    const status = player.statuses[index];
    player.statuses.splice(index, 1);

    // Emit event
    this.eventBus.emitSimple(
      'status_removed',
      {
        playerId,
        statusId,
        statusName: status.name,
      },
      gameState
    );

    // Execute onRemove effects
    const results: ResolvedEffect[] = [];
    if (status.onRemove) {
      const context: EffectContext = {
        gameState,
        sourcePlayerId: playerId,
      };
      results.push(...this.effectResolver.resolveAll(status.onRemove, context));
    }

    return results;
  }

  /**
   * Process status effects at turn start
   * Returns all triggered effects
   */
  processTurnStart(playerId: string, player: PlayerState, gameState: GameState): ResolvedEffect[] {
    const results: ResolvedEffect[] = [];
    const context: EffectContext = {
      gameState,
      sourcePlayerId: playerId,
    };

    // Apply turn start effects for each status
    for (const status of player.statuses) {
      if (status.onTurnStart) {
        const stacks = status.currentStacks ?? 1;
        for (let i = 0; i < stacks; i++) {
          results.push(...this.effectResolver.resolveAll(status.onTurnStart, context));
        }
      }
    }

    // Check for auto-trigger statuses
    results.push(...this.checkAutoTriggers(playerId, player, gameState));

    return results;
  }

  /**
   * Process status effects at turn end
   * Returns all triggered effects and decrements durations
   */
  processTurnEnd(playerId: string, player: PlayerState, gameState: GameState): ResolvedEffect[] {
    const results: ResolvedEffect[] = [];
    const context: EffectContext = {
      gameState,
      sourcePlayerId: playerId,
    };

    const expiredStatuses: string[] = [];

    // Apply turn end effects and decrement durations
    for (const status of player.statuses) {
      // Apply turn end effects
      if (status.onTurnEnd) {
        const stacks = status.currentStacks ?? 1;
        for (let i = 0; i < stacks; i++) {
          results.push(...this.effectResolver.resolveAll(status.onTurnEnd, context));
        }
      }

      // Decrement duration (if not permanent)
      if (status.duration > 0) {
        status.duration--;

        this.eventBus.emitSimple(
          'status_tick',
          {
            playerId,
            statusId: status.id,
            remainingDuration: status.duration,
          },
          gameState
        );

        if (status.duration === 0) {
          expiredStatuses.push(status.id);
        }
      }
    }

    // Remove expired statuses
    for (const statusId of expiredStatuses) {
      results.push(...this.removeStatus(playerId, statusId, player, gameState));
    }

    return results;
  }

  /**
   * Check for auto-trigger status conditions
   */
  checkAutoTriggers(playerId: string, player: PlayerState, gameState: GameState): ResolvedEffect[] {
    const results: ResolvedEffect[] = [];

    for (const definition of this.statusDefinitions.values()) {
      if (!definition.triggerCondition) continue;

      // Skip if player already has this status
      if (player.statuses.some((s) => s.id === definition.id)) continue;

      if (this.checkTriggerCondition(definition.triggerCondition, player, gameState)) {
        results.push(...this.applyStatus(playerId, definition.id, player, gameState));
      }
    }

    return results;
  }

  /**
   * Check if a trigger condition is met
   */
  private checkTriggerCondition(
    condition: StatusTriggerCondition,
    player: PlayerState,
    gameState: GameState
  ): boolean {
    switch (condition.type) {
      case 'stat_threshold': {
        if (!condition.stat) return false;
        const value = player.stats[condition.stat] ?? 0;
        return this.compareValues(value, condition.operator, condition.value);
      }

      case 'resource_threshold': {
        if (!condition.resource) return false;
        const value = player.resources[condition.resource] ?? 0;
        return this.compareValues(value, condition.operator, condition.value);
      }

      case 'turn_count': {
        return this.compareValues(gameState.turn, condition.operator, condition.value);
      }

      default:
        return false;
    }
  }

  /**
   * Compare two values with an operator
   */
  private compareValues(
    actual: number,
    operator: StatusTriggerCondition['operator'],
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

  /**
   * Get all status definitions
   */
  getStatusDefinitions(): StatusDefinition[] {
    return Array.from(this.statusDefinitions.values());
  }

  /**
   * Get a specific status definition
   */
  getStatusDefinition(statusId: string): StatusDefinition | undefined {
    return this.statusDefinitions.get(statusId);
  }

  /**
   * Check if a player has a specific status
   */
  hasStatus(player: PlayerState, statusId: string): boolean {
    return player.statuses.some((s) => s.id === statusId);
  }

  /**
   * Get a player's active status by ID
   */
  getStatus(player: PlayerState, statusId: string): PlayerStatus | undefined {
    return player.statuses.find((s) => s.id === statusId);
  }

  /**
   * Add a new status definition
   */
  addStatusDefinition(definition: StatusDefinition): void {
    this.statusDefinitions.set(definition.id, definition);
  }

  /**
   * Remove a status definition
   */
  removeStatusDefinition(statusId: string): boolean {
    return this.statusDefinitions.delete(statusId);
  }

  /**
   * Get effect modifiers from active statuses
   * Can be used to modify card effects based on active statuses
   */
  getEffectModifiers(
    player: PlayerState,
    effectType: string,
    metadata?: Record<string, unknown>
  ): number {
    let modifier = 0;

    for (const status of player.statuses) {
      const stacks = status.currentStacks ?? 1;

      // Check if any status effect modifies this type
      for (const effect of status.effects) {
        if (effect.type === 'custom' && effect.metadata?.modifierType === effectType) {
          if (metadata) {
            // Check if metadata matches
            const targetStat = effect.metadata.targetStat as string;
            const targetResource = effect.metadata.targetResource as string;

            if (targetStat && metadata.stat !== targetStat) continue;
            if (targetResource && metadata.resource !== targetResource) continue;
          }

          modifier += (Number(effect.value) ?? 0) * stacks;
        }
      }
    }

    return modifier;
  }
}
