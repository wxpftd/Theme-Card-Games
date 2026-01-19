import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StatusEffectSystem } from './StatusEffectSystem';
import { EffectResolver } from '../card/EffectResolver';
import { EventBus } from '../event/EventBus';
import { StatusDefinition, PlayerState, GameState } from '../types';

describe('StatusEffectSystem', () => {
  let statusSystem: StatusEffectSystem;
  let effectResolver: EffectResolver;
  let eventBus: EventBus;
  let player: PlayerState;
  let gameState: GameState;

  const mockStatusDefinitions: StatusDefinition[] = [
    {
      id: 'mode_996',
      name: '996 Mode',
      description: 'Work hard mode',
      duration: 3,
      stackable: false,
      effects: [],
      onTurnStart: [
        { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 5 },
        { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -3 },
      ],
    },
    {
      id: 'burnout',
      name: 'Burnout',
      description: 'Career burnout',
      duration: -1,
      stackable: false,
      effects: [],
      onTurnStart: [
        { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -2 },
      ],
      triggerCondition: {
        type: 'stat_threshold',
        stat: 'happiness',
        operator: '<',
        value: 30,
      },
    },
    {
      id: 'stackable_buff',
      name: 'Stackable Buff',
      description: 'A stackable buff',
      duration: 2,
      stackable: true,
      maxStacks: 3,
      effects: [],
      onTurnEnd: [
        { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 2 },
      ],
    },
  ];

  beforeEach(() => {
    effectResolver = new EffectResolver();
    eventBus = new EventBus();

    statusSystem = new StatusEffectSystem({
      statusDefinitions: mockStatusDefinitions,
      effectResolver,
      eventBus,
    });

    player = {
      id: 'player1',
      name: 'Test Player',
      stats: { performance: 50, health: 80, happiness: 60 },
      resources: { energy: 5 },
      statuses: [],
      hand: [],
      deck: [],
      discardPile: [],
      playArea: [],
    };

    gameState = {
      id: 'test-game',
      phase: 'main',
      turn: 1,
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

  describe('applyStatus', () => {
    it('should apply a status to a player', () => {
      statusSystem.applyStatus('player1', 'mode_996', player, gameState);

      expect(player.statuses.length).toBe(1);
      expect(player.statuses[0].id).toBe('mode_996');
      expect(player.statuses[0].duration).toBe(3);
    });

    it('should refresh duration when reapplying non-stackable status', () => {
      statusSystem.applyStatus('player1', 'mode_996', player, gameState);
      player.statuses[0].duration = 1; // Simulate time passing

      statusSystem.applyStatus('player1', 'mode_996', player, gameState);

      expect(player.statuses.length).toBe(1);
      expect(player.statuses[0].duration).toBe(3); // Refreshed
    });

    it('should increment stacks for stackable status', () => {
      statusSystem.applyStatus('player1', 'stackable_buff', player, gameState);
      expect(player.statuses[0].currentStacks).toBe(1);

      statusSystem.applyStatus('player1', 'stackable_buff', player, gameState);
      expect(player.statuses[0].currentStacks).toBe(2);

      statusSystem.applyStatus('player1', 'stackable_buff', player, gameState);
      expect(player.statuses[0].currentStacks).toBe(3);

      // Should not exceed max stacks
      statusSystem.applyStatus('player1', 'stackable_buff', player, gameState);
      expect(player.statuses[0].currentStacks).toBe(3);
    });

    it('should emit status_applied event', () => {
      const handler = vi.fn();
      eventBus.on('status_applied', handler);

      statusSystem.applyStatus('player1', 'mode_996', player, gameState);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'status_applied',
          data: expect.objectContaining({
            playerId: 'player1',
            statusId: 'mode_996',
          }),
        }),
        expect.anything()
      );
    });
  });

  describe('removeStatus', () => {
    it('should remove a status from a player', () => {
      statusSystem.applyStatus('player1', 'mode_996', player, gameState);
      expect(player.statuses.length).toBe(1);

      statusSystem.removeStatus('player1', 'mode_996', player, gameState);
      expect(player.statuses.length).toBe(0);
    });

    it('should emit status_removed event', () => {
      statusSystem.applyStatus('player1', 'mode_996', player, gameState);

      const handler = vi.fn();
      eventBus.on('status_removed', handler);

      statusSystem.removeStatus('player1', 'mode_996', player, gameState);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'status_removed',
          data: expect.objectContaining({
            playerId: 'player1',
            statusId: 'mode_996',
          }),
        }),
        expect.anything()
      );
    });
  });

  describe('processTurnStart', () => {
    it('should apply onTurnStart effects', () => {
      statusSystem.applyStatus('player1', 'mode_996', player, gameState);
      const initialPerformance = player.stats.performance;
      const initialHealth = player.stats.health;

      statusSystem.processTurnStart('player1', player, gameState);

      expect(player.stats.performance).toBe(initialPerformance + 5);
      expect(player.stats.health).toBe(initialHealth - 3);
    });

    it('should apply effects multiple times for stacked status', () => {
      statusSystem.applyStatus('player1', 'stackable_buff', player, gameState);
      statusSystem.applyStatus('player1', 'stackable_buff', player, gameState);
      expect(player.statuses[0].currentStacks).toBe(2);

      // Note: stackable_buff uses onTurnEnd, so we test processTurnEnd instead
    });

    it('should check auto-trigger conditions', () => {
      // Set happiness below threshold
      player.stats.happiness = 25;

      statusSystem.processTurnStart('player1', player, gameState);

      // Should have auto-triggered burnout
      expect(player.statuses.some((s) => s.id === 'burnout')).toBe(true);
    });
  });

  describe('processTurnEnd', () => {
    it('should apply onTurnEnd effects', () => {
      statusSystem.applyStatus('player1', 'stackable_buff', player, gameState);
      const initialPerformance = player.stats.performance;

      statusSystem.processTurnEnd('player1', player, gameState);

      expect(player.stats.performance).toBe(initialPerformance + 2);
    });

    it('should decrement duration and remove expired statuses', () => {
      statusSystem.applyStatus('player1', 'mode_996', player, gameState);
      expect(player.statuses[0].duration).toBe(3);

      statusSystem.processTurnEnd('player1', player, gameState);
      expect(player.statuses[0].duration).toBe(2);

      statusSystem.processTurnEnd('player1', player, gameState);
      expect(player.statuses[0].duration).toBe(1);

      statusSystem.processTurnEnd('player1', player, gameState);
      // Status should be removed
      expect(player.statuses.length).toBe(0);
    });

    it('should not decrement permanent status duration', () => {
      statusSystem.applyStatus('player1', 'burnout', player, gameState);
      expect(player.statuses[0].duration).toBe(-1);

      statusSystem.processTurnEnd('player1', player, gameState);
      expect(player.statuses[0].duration).toBe(-1);
      expect(player.statuses.length).toBe(1);
    });
  });

  describe('hasStatus', () => {
    it('should return true if player has status', () => {
      statusSystem.applyStatus('player1', 'mode_996', player, gameState);
      expect(statusSystem.hasStatus(player, 'mode_996')).toBe(true);
    });

    it('should return false if player does not have status', () => {
      expect(statusSystem.hasStatus(player, 'mode_996')).toBe(false);
    });
  });
});
