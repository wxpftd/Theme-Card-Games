import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RandomEventSystem } from './RandomEventSystem';
import { EffectResolver } from '../card/EffectResolver';
import { EventBus } from '../event/EventBus';
import { RandomEventDefinition, RandomEventConfig, PlayerState, GameState } from '../types';

describe('RandomEventSystem', () => {
  let randomEventSystem: RandomEventSystem;
  let effectResolver: EffectResolver;
  let eventBus: EventBus;
  let player: PlayerState;
  let gameState: GameState;

  const mockEventDefinitions: RandomEventDefinition[] = [
    {
      id: 'performance_review',
      name: 'Performance Review',
      description: 'Quarterly performance review',
      icon: '📋',
      weight: 1,
      effects: [],
      randomEffects: [
        {
          weight: 50,
          description: 'Excellent performance! +20 performance',
          effects: [
            { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 20 },
          ],
        },
        {
          weight: 50,
          description: 'Needs improvement. -10 performance',
          effects: [
            { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -10 },
          ],
        },
      ],
    },
    {
      id: 'conditional_event',
      name: 'Conditional Event',
      description: 'Only triggers with enough connections',
      icon: '🔗',
      weight: 1,
      effects: [
        { type: 'gain_resource', target: 'self', metadata: { resource: 'money' }, value: 5 },
      ],
      condition: {
        type: 'resource_check',
        resource: 'connections',
        operator: '>=',
        value: 3,
      },
    },
    {
      id: 'simple_event',
      name: 'Simple Event',
      description: 'A simple event with direct effects',
      icon: '✨',
      weight: 1,
      effects: [
        { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 10 },
      ],
    },
    {
      id: 'custom_event',
      name: 'Custom Event',
      description: 'Uses a custom handler',
      icon: '🎯',
      weight: 1,
      effects: [],
      customHandler: 'test_handler',
    },
  ];

  const defaultConfig: RandomEventConfig = {
    triggerInterval: 3,
    triggerProbability: 0.3,
    maxEventsPerGame: 10,
    announceEvent: true,
  };

  beforeEach(() => {
    effectResolver = new EffectResolver();
    eventBus = new EventBus();

    randomEventSystem = new RandomEventSystem({
      eventDefinitions: mockEventDefinitions,
      config: defaultConfig,
      effectResolver,
      eventBus,
    });

    player = {
      id: 'player1',
      name: 'Test Player',
      stats: { performance: 50, health: 80, happiness: 60 },
      resources: { energy: 5, connections: 4, money: 10 },
      statuses: [],
      hand: [],
      deck: [],
      discardPile: [],
      playArea: [],
    };

    gameState = {
      id: 'test-game',
      phase: 'main',
      turn: 3, // Turn 3 should trigger (3 % 3 === 0)
      currentPlayerId: 'player1',
      players: { player1: player },
      sharedState: {},
      history: [],
      config: {
        maxPlayers: 4,
        minPlayers: 1,
        initialHandSize: 5,
        maxHandSize: 10,
        winConditions: [],
        initialStats: {},
        initialResources: {},
      },
    };
  });

  describe('shouldTrigger', () => {
    it('should return true when turn is divisible by interval and probability check passes', () => {
      // Mock Math.random to always return low value (trigger)
      vi.spyOn(Math, 'random').mockReturnValue(0.1);

      expect(randomEventSystem.shouldTrigger(3)).toBe(true);
      expect(randomEventSystem.shouldTrigger(6)).toBe(true);
      expect(randomEventSystem.shouldTrigger(9)).toBe(true);

      vi.restoreAllMocks();
    });

    it('should return false when turn is not divisible by interval', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1);

      expect(randomEventSystem.shouldTrigger(1)).toBe(false);
      expect(randomEventSystem.shouldTrigger(2)).toBe(false);
      expect(randomEventSystem.shouldTrigger(4)).toBe(false);

      vi.restoreAllMocks();
    });

    it('should return false when probability check fails', () => {
      // Mock Math.random to return high value (no trigger)
      vi.spyOn(Math, 'random').mockReturnValue(0.9);

      expect(randomEventSystem.shouldTrigger(3)).toBe(false);

      vi.restoreAllMocks();
    });

    it('should respect maxEventsPerGame limit', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1);

      // Create system with max 2 events
      const limitedSystem = new RandomEventSystem({
        eventDefinitions: mockEventDefinitions,
        config: { ...defaultConfig, maxEventsPerGame: 2 },
        effectResolver,
        eventBus,
      });

      // Trigger 2 events
      limitedSystem.processRandomEvent('player1', player, gameState);
      limitedSystem.processRandomEvent('player1', player, gameState);

      // Should not trigger more
      expect(limitedSystem.shouldTrigger(3)).toBe(false);

      vi.restoreAllMocks();
    });
  });

  describe('processRandomEvent', () => {
    it('should process a simple event with direct effects', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.9) // Select last event (simple_event)
        .mockReturnValueOnce(0.1); // Other random calls

      const initialHappiness = player.stats.happiness;

      // Force select simple_event by making it the only one
      const simpleOnlySystem = new RandomEventSystem({
        eventDefinitions: [mockEventDefinitions[2]], // simple_event
        config: defaultConfig,
        effectResolver,
        eventBus,
      });

      const result = simpleOnlySystem.processRandomEvent('player1', player, gameState);

      expect(result).not.toBeNull();
      expect(result!.eventId).toBe('simple_event');
      expect(result!.skipped).toBe(false);
      expect(player.stats.happiness).toBe(initialHappiness + 10);

      vi.restoreAllMocks();
    });

    it('should process event with random effects', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1) // Select first event
        .mockReturnValueOnce(0.2); // Select first random effect (< 0.5 weight boundary)

      const perfReviewOnlySystem = new RandomEventSystem({
        eventDefinitions: [mockEventDefinitions[0]], // performance_review
        config: defaultConfig,
        effectResolver,
        eventBus,
      });

      const initialPerformance = player.stats.performance;
      const result = perfReviewOnlySystem.processRandomEvent('player1', player, gameState);

      expect(result).not.toBeNull();
      expect(result!.eventId).toBe('performance_review');
      expect(result!.selectedOption).toBeDefined();
      // Either +20 or -10 performance
      expect(
        player.stats.performance === initialPerformance + 20 ||
          player.stats.performance === initialPerformance - 10
      ).toBe(true);

      vi.restoreAllMocks();
    });

    it('should skip event when condition is not met', () => {
      const conditionalOnlySystem = new RandomEventSystem({
        eventDefinitions: [mockEventDefinitions[1]], // conditional_event
        config: defaultConfig,
        effectResolver,
        eventBus,
      });

      // Set connections below threshold
      player.resources.connections = 1;

      const result = conditionalOnlySystem.processRandomEvent('player1', player, gameState);

      expect(result).not.toBeNull();
      expect(result!.skipped).toBe(true);
      expect(result!.skipReason).toBe('Condition not met');
    });

    it('should trigger event when condition is met', () => {
      const conditionalOnlySystem = new RandomEventSystem({
        eventDefinitions: [mockEventDefinitions[1]], // conditional_event
        config: defaultConfig,
        effectResolver,
        eventBus,
      });

      // Ensure connections meet threshold
      player.resources.connections = 5;
      const initialMoney = player.resources.money;

      const result = conditionalOnlySystem.processRandomEvent('player1', player, gameState);

      expect(result).not.toBeNull();
      expect(result!.skipped).toBe(false);
      expect(player.resources.money).toBe(initialMoney + 5);
    });

    it('should use custom handler when specified', () => {
      const customHandler = vi
        .fn()
        .mockReturnValue([{ type: 'modify_stat', target: 'player1', before: 50, after: 75 }]);

      const customSystem = new RandomEventSystem({
        eventDefinitions: [mockEventDefinitions[3]], // custom_event
        config: defaultConfig,
        effectResolver,
        eventBus,
        customHandlers: { test_handler: customHandler },
      });

      const result = customSystem.processRandomEvent('player1', player, gameState);

      expect(result).not.toBeNull();
      expect(customHandler).toHaveBeenCalled();
      expect(result!.effects.length).toBe(1);
    });

    it('should emit random_event_triggered event', () => {
      const handler = vi.fn();
      eventBus.on('random_event_triggered', handler);

      const simpleOnlySystem = new RandomEventSystem({
        eventDefinitions: [mockEventDefinitions[2]], // simple_event
        config: defaultConfig,
        effectResolver,
        eventBus,
      });

      simpleOnlySystem.processRandomEvent('player1', player, gameState);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'random_event_triggered',
          data: expect.objectContaining({
            playerId: 'player1',
            eventId: 'simple_event',
          }),
        }),
        expect.anything()
      );
    });

    it('should emit random_event_skipped event when condition not met', () => {
      const handler = vi.fn();
      eventBus.on('random_event_skipped', handler);

      const conditionalOnlySystem = new RandomEventSystem({
        eventDefinitions: [mockEventDefinitions[1]], // conditional_event
        config: defaultConfig,
        effectResolver,
        eventBus,
      });

      player.resources.connections = 1; // Below threshold

      conditionalOnlySystem.processRandomEvent('player1', player, gameState);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'random_event_skipped',
          data: expect.objectContaining({
            playerId: 'player1',
            eventId: 'conditional_event',
            skipReason: 'Condition not met',
          }),
        }),
        expect.anything()
      );
    });
  });

  describe('processTurnEnd', () => {
    it('should process events for all players when trigger condition is met', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1); // Always trigger

      const players = [player, { ...player, id: 'player2', name: 'Player 2' }];

      const results = randomEventSystem.processTurnEnd(3, players, gameState);

      expect(results.length).toBe(2);

      vi.restoreAllMocks();
    });

    it('should not process events when turn is not a trigger turn', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1);

      const results = randomEventSystem.processTurnEnd(1, [player], gameState);

      expect(results.length).toBe(0);

      vi.restoreAllMocks();
    });

    it('should not process events when probability check fails', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9); // Fail probability check

      const results = randomEventSystem.processTurnEnd(3, [player], gameState);

      expect(results.length).toBe(0);

      vi.restoreAllMocks();
    });
  });

  describe('event history and tracking', () => {
    it('should track events triggered this game', () => {
      expect(randomEventSystem.getEventsTriggeredCount()).toBe(0);

      const simpleOnlySystem = new RandomEventSystem({
        eventDefinitions: [mockEventDefinitions[2]],
        config: defaultConfig,
        effectResolver,
        eventBus,
      });

      simpleOnlySystem.processRandomEvent('player1', player, gameState);
      expect(simpleOnlySystem.getEventsTriggeredCount()).toBe(1);

      simpleOnlySystem.processRandomEvent('player1', player, gameState);
      expect(simpleOnlySystem.getEventsTriggeredCount()).toBe(2);
    });

    it('should maintain event history', () => {
      const simpleOnlySystem = new RandomEventSystem({
        eventDefinitions: [mockEventDefinitions[2]],
        config: defaultConfig,
        effectResolver,
        eventBus,
      });

      simpleOnlySystem.processRandomEvent('player1', player, gameState);
      simpleOnlySystem.processRandomEvent('player1', player, gameState);

      const history = simpleOnlySystem.getEventHistory();
      expect(history.length).toBe(2);
      expect(history[0].eventId).toBe('simple_event');
      expect(history[1].eventId).toBe('simple_event');
    });

    it('should clear history on reset', () => {
      const simpleOnlySystem = new RandomEventSystem({
        eventDefinitions: [mockEventDefinitions[2]],
        config: defaultConfig,
        effectResolver,
        eventBus,
      });

      simpleOnlySystem.processRandomEvent('player1', player, gameState);
      expect(simpleOnlySystem.getEventsTriggeredCount()).toBe(1);

      simpleOnlySystem.reset();

      expect(simpleOnlySystem.getEventsTriggeredCount()).toBe(0);
      expect(simpleOnlySystem.getEventHistory().length).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should return current configuration', () => {
      const config = randomEventSystem.getConfig();

      expect(config.triggerInterval).toBe(3);
      expect(config.triggerProbability).toBe(0.3);
      expect(config.maxEventsPerGame).toBe(10);
    });

    it('should update configuration', () => {
      randomEventSystem.updateConfig({ triggerProbability: 0.5 });

      const config = randomEventSystem.getConfig();
      expect(config.triggerProbability).toBe(0.5);
      expect(config.triggerInterval).toBe(3); // Unchanged
    });
  });

  describe('event definitions management', () => {
    it('should return all event definitions', () => {
      const definitions = randomEventSystem.getEventDefinitions();
      expect(definitions.length).toBe(4);
    });

    it('should return specific event definition', () => {
      const definition = randomEventSystem.getEventDefinition('performance_review');
      expect(definition).toBeDefined();
      expect(definition!.name).toBe('Performance Review');
    });

    it('should add new event definition', () => {
      const newEvent: RandomEventDefinition = {
        id: 'new_event',
        name: 'New Event',
        description: 'A new event',
        weight: 1,
        effects: [],
      };

      randomEventSystem.addEventDefinition(newEvent);

      const definition = randomEventSystem.getEventDefinition('new_event');
      expect(definition).toBeDefined();
      expect(randomEventSystem.getEventDefinitions().length).toBe(5);
    });

    it('should remove event definition', () => {
      expect(randomEventSystem.getEventDefinition('simple_event')).toBeDefined();

      const removed = randomEventSystem.removeEventDefinition('simple_event');

      expect(removed).toBe(true);
      expect(randomEventSystem.getEventDefinition('simple_event')).toBeUndefined();
    });
  });

  describe('condition checking', () => {
    it('should check stat_check condition', () => {
      const statCheckEvent: RandomEventDefinition = {
        id: 'stat_check_event',
        name: 'Stat Check',
        description: 'Requires high health',
        weight: 1,
        effects: [
          { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 5 },
        ],
        condition: {
          type: 'stat_check',
          stat: 'health',
          operator: '>',
          value: 70,
        },
      };

      const system = new RandomEventSystem({
        eventDefinitions: [statCheckEvent],
        config: defaultConfig,
        effectResolver,
        eventBus,
      });

      // Health is 80, should trigger
      player.stats.health = 80;
      let result = system.processRandomEvent('player1', player, gameState);
      expect(result!.skipped).toBe(false);

      // Reset and lower health
      system.reset();
      player.stats.health = 50;
      result = system.processRandomEvent('player1', player, gameState);
      expect(result!.skipped).toBe(true);
    });

    it('should check random_chance condition', () => {
      const randomChanceEvent: RandomEventDefinition = {
        id: 'random_chance_event',
        name: 'Random Chance',
        description: '50% chance',
        weight: 1,
        effects: [
          { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 5 },
        ],
        condition: {
          type: 'random_chance',
          probability: 0.5,
        },
      };

      const system = new RandomEventSystem({
        eventDefinitions: [randomChanceEvent],
        config: defaultConfig,
        effectResolver,
        eventBus,
      });

      // Mock random to succeed
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1) // Event selection
        .mockReturnValueOnce(0.3); // Condition check (< 0.5)

      let result = system.processRandomEvent('player1', player, gameState);
      expect(result!.skipped).toBe(false);

      vi.restoreAllMocks();

      // Mock random to fail
      system.reset();
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1) // Event selection
        .mockReturnValueOnce(0.7); // Condition check (> 0.5)

      result = system.processRandomEvent('player1', player, gameState);
      expect(result!.skipped).toBe(true);

      vi.restoreAllMocks();
    });
  });
});
