import {
  RandomEventDefinition,
  RandomEventConfig,
  RandomEventResult,
  RandomEventCondition,
  RandomEffectOption,
  PlayerState,
  GameState,
  ResolvedEffect,
} from '../types';
import { EffectResolver, EffectContext } from '../card/EffectResolver';
import { EventBus } from '../event';

export interface RandomEventSystemOptions {
  eventDefinitions: RandomEventDefinition[];
  config: RandomEventConfig;
  effectResolver: EffectResolver;
  eventBus: EventBus;
  customHandlers?: Record<string, RandomEventCustomHandler>;
}

export type RandomEventCustomHandler = (
  event: RandomEventDefinition,
  player: PlayerState,
  gameState: GameState,
  context: EffectContext
) => ResolvedEffect[];

/**
 * RandomEventSystem manages random events that trigger periodically during gameplay
 *
 * Features:
 * - Configurable trigger interval (every N turns)
 * - Configurable trigger probability
 * - Random event selection with weights
 * - Conditional events based on player stats/resources
 * - Random effect outcomes within events
 * - Custom event handlers for complex logic
 */
export class RandomEventSystem {
  private eventDefinitions: Map<string, RandomEventDefinition> = new Map();
  private config: RandomEventConfig;
  private effectResolver: EffectResolver;
  private eventBus: EventBus;
  private customHandlers: Map<string, RandomEventCustomHandler> = new Map();

  // Track events per game
  private eventsTriggeredThisGame: number = 0;
  private eventHistory: RandomEventResult[] = [];

  constructor(options: RandomEventSystemOptions) {
    this.config = options.config;
    this.effectResolver = options.effectResolver;
    this.eventBus = options.eventBus;

    for (const event of options.eventDefinitions) {
      this.eventDefinitions.set(event.id, event);
    }

    if (options.customHandlers) {
      for (const [name, handler] of Object.entries(options.customHandlers)) {
        this.customHandlers.set(name, handler);
      }
    }
  }

  /**
   * Check if a random event should trigger at the end of a turn
   * Called at the end of each turn round (when all players have played)
   */
  shouldTrigger(turn: number): boolean {
    // Check interval
    if (turn % this.config.triggerInterval !== 0) {
      return false;
    }

    // Check max events limit
    if (
      this.config.maxEventsPerGame !== undefined &&
      this.eventsTriggeredThisGame >= this.config.maxEventsPerGame
    ) {
      return false;
    }

    // Roll probability
    return Math.random() < this.config.triggerProbability;
  }

  /**
   * Process a random event for a player
   * Returns the result of the event, or null if no event was triggered
   */
  processRandomEvent(
    playerId: string,
    player: PlayerState,
    gameState: GameState
  ): RandomEventResult | null {
    // Select a random event
    const selectedEvent = this.selectRandomEvent(player, gameState);
    if (!selectedEvent) {
      return null;
    }

    // Check event condition
    if (selectedEvent.condition) {
      const conditionMet = this.checkCondition(selectedEvent.condition, player, gameState);
      if (!conditionMet) {
        const result: RandomEventResult = {
          eventId: selectedEvent.id,
          eventName: selectedEvent.name,
          description: selectedEvent.description,
          effects: [],
          skipped: true,
          skipReason: 'Condition not met',
        };
        this.emitSkippedEvent(playerId, result, gameState);
        return result;
      }
    }

    // Resolve effects
    const context: EffectContext = {
      gameState,
      sourcePlayerId: playerId,
    };

    let resolvedEffects: ResolvedEffect[] = [];
    let selectedOptionDescription: string | undefined;

    // Check for custom handler
    if (selectedEvent.customHandler) {
      const handler = this.customHandlers.get(selectedEvent.customHandler);
      if (handler) {
        resolvedEffects = handler(selectedEvent, player, gameState, context);
      }
    } else if (selectedEvent.randomEffects && selectedEvent.randomEffects.length > 0) {
      // Select a random effect option
      const selectedOption = this.selectRandomOption(selectedEvent.randomEffects);
      if (selectedOption) {
        selectedOptionDescription = selectedOption.description;
        resolvedEffects = this.effectResolver.resolveAll(selectedOption.effects, context);
      }
    } else {
      // Apply standard effects
      resolvedEffects = this.effectResolver.resolveAll(selectedEvent.effects, context);
    }

    // Create result
    const result: RandomEventResult = {
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      description: selectedOptionDescription || selectedEvent.description,
      selectedOption: selectedOptionDescription,
      effects: resolvedEffects,
      skipped: false,
    };

    // Update tracking
    this.eventsTriggeredThisGame++;
    this.eventHistory.push(result);

    // Emit event
    this.emitTriggeredEvent(playerId, result, gameState);

    return result;
  }

  /**
   * Process random events for all players at end of turn round
   */
  processTurnEnd(turn: number, players: PlayerState[], gameState: GameState): RandomEventResult[] {
    const results: RandomEventResult[] = [];

    if (!this.shouldTrigger(turn)) {
      return results;
    }

    for (const player of players) {
      const result = this.processRandomEvent(player.id, player, gameState);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Select a random event based on weights
   */
  private selectRandomEvent(
    _player: PlayerState,
    _gameState: GameState
  ): RandomEventDefinition | null {
    const availableEvents = Array.from(this.eventDefinitions.values());
    if (availableEvents.length === 0) {
      return null;
    }

    // Calculate total weight
    const totalWeight = availableEvents.reduce((sum, event) => sum + (event.weight ?? 1), 0);

    // Select random event based on weight
    let random = Math.random() * totalWeight;
    for (const event of availableEvents) {
      random -= event.weight ?? 1;
      if (random <= 0) {
        return event;
      }
    }

    // Fallback to last event
    return availableEvents[availableEvents.length - 1];
  }

  /**
   * Select a random option from effect options based on weights
   */
  private selectRandomOption(options: RandomEffectOption[]): RandomEffectOption | null {
    if (options.length === 0) {
      return null;
    }

    const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
    let random = Math.random() * totalWeight;

    for (const option of options) {
      random -= option.weight;
      if (random <= 0) {
        return option;
      }
    }

    return options[options.length - 1];
  }

  /**
   * Check if an event condition is met
   */
  private checkCondition(
    condition: RandomEventCondition,
    player: PlayerState,
    gameState: GameState
  ): boolean {
    switch (condition.type) {
      case 'stat_check': {
        if (!condition.stat || condition.value === undefined || !condition.operator) {
          return true;
        }
        const value = player.stats[condition.stat] ?? 0;
        return this.compareValues(value, condition.operator, condition.value);
      }

      case 'resource_check': {
        if (!condition.resource || condition.value === undefined || !condition.operator) {
          return true;
        }
        const value = player.resources[condition.resource] ?? 0;
        return this.compareValues(value, condition.operator, condition.value);
      }

      case 'has_status': {
        if (!condition.status) {
          return true;
        }
        return player.statuses.some((s) => s.id === condition.status);
      }

      case 'turn_check': {
        if (condition.value === undefined || !condition.operator) {
          return true;
        }
        return this.compareValues(gameState.turn, condition.operator, condition.value);
      }

      case 'random_chance': {
        const probability = condition.probability ?? 0.5;
        return Math.random() < probability;
      }

      default:
        return true;
    }
  }

  /**
   * Compare two values with an operator
   */
  private compareValues(
    actual: number,
    operator: RandomEventCondition['operator'],
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
        return true;
    }
  }

  /**
   * Emit event when random event is triggered
   */
  private emitTriggeredEvent(
    playerId: string,
    result: RandomEventResult,
    gameState: GameState
  ): void {
    this.eventBus.emitSimple(
      'random_event_triggered',
      {
        playerId,
        eventId: result.eventId,
        eventName: result.eventName,
        description: result.description,
        selectedOption: result.selectedOption,
        effects: result.effects,
      },
      gameState
    );
  }

  /**
   * Emit event when random event is skipped
   */
  private emitSkippedEvent(
    playerId: string,
    result: RandomEventResult,
    gameState: GameState
  ): void {
    this.eventBus.emitSimple(
      'random_event_skipped',
      {
        playerId,
        eventId: result.eventId,
        eventName: result.eventName,
        skipReason: result.skipReason,
      },
      gameState
    );
  }

  /**
   * Register a custom event handler
   */
  registerCustomHandler(name: string, handler: RandomEventCustomHandler): void {
    this.customHandlers.set(name, handler);
  }

  /**
   * Add a new event definition
   */
  addEventDefinition(definition: RandomEventDefinition): void {
    this.eventDefinitions.set(definition.id, definition);
  }

  /**
   * Remove an event definition
   */
  removeEventDefinition(eventId: string): boolean {
    return this.eventDefinitions.delete(eventId);
  }

  /**
   * Get all event definitions
   */
  getEventDefinitions(): RandomEventDefinition[] {
    return Array.from(this.eventDefinitions.values());
  }

  /**
   * Get a specific event definition
   */
  getEventDefinition(eventId: string): RandomEventDefinition | undefined {
    return this.eventDefinitions.get(eventId);
  }

  /**
   * Get event history for this game
   */
  getEventHistory(): RandomEventResult[] {
    return [...this.eventHistory];
  }

  /**
   * Get number of events triggered this game
   */
  getEventsTriggeredCount(): number {
    return this.eventsTriggeredThisGame;
  }

  /**
   * Get current configuration
   */
  getConfig(): RandomEventConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RandomEventConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset the system for a new game
   */
  reset(): void {
    this.eventsTriggeredThisGame = 0;
    this.eventHistory = [];
  }
}
