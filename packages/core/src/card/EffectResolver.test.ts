import { describe, it, expect, beforeEach } from 'vitest';
import { EffectResolver, EffectContext } from './EffectResolver';
import { CardEffect, GameState, PlayerState } from '../types';
import { Card } from './Card';

const createTestPlayer = (overrides: Partial<PlayerState> = {}): PlayerState => ({
  id: 'player1',
  name: 'Test Player',
  stats: { health: 100, performance: 50 },
  resources: { energy: 10, gold: 100 },
  statuses: [],
  hand: [],
  deck: [],
  discardPile: [],
  playArea: [],
  ...overrides,
});

const createTestState = (players: PlayerState[] = []): GameState => ({
  id: 'game_1',
  phase: 'main',
  turn: 3,
  currentPlayerId: 'player1',
  players: Object.fromEntries(players.map((p) => [p.id, p])),
  sharedState: {},
  history: [],
  config: {
    maxPlayers: 4,
    minPlayers: 1,
    initialHandSize: 5,
    maxHandSize: 10,
    winConditions: [],
    initialStats: { health: 100 },
    initialResources: { energy: 10 },
  },
});

const createTestContext = (overrides: Partial<EffectContext> = {}): EffectContext => {
  const player1 = createTestPlayer({ id: 'player1' });
  const player2 = createTestPlayer({ id: 'player2', name: 'Player 2' });

  return {
    gameState: createTestState([player1, player2]),
    sourcePlayerId: 'player1',
    ...overrides,
  };
};

describe('EffectResolver', () => {
  let resolver: EffectResolver;

  beforeEach(() => {
    resolver = new EffectResolver();
  });

  describe('resolve - modify_stat', () => {
    it('should modify player stat', () => {
      const context = createTestContext();
      const effect: CardEffect = {
        type: 'modify_stat',
        target: 'self',
        value: 10,
        metadata: { stat: 'performance' },
      };

      const result = resolver.resolve(effect, context);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('modify_stat');
      expect(result!.before).toBe(50);
      expect(result!.after).toBe(60);
    });

    it('should handle negative stat modification', () => {
      const context = createTestContext();
      const effect: CardEffect = {
        type: 'modify_stat',
        target: 'self',
        value: -20,
        metadata: { stat: 'health' },
      };

      const result = resolver.resolve(effect, context);

      expect(result!.before).toBe(100);
      expect(result!.after).toBe(80);
    });

    it('should return null for missing stat name', () => {
      const context = createTestContext();
      const effect: CardEffect = {
        type: 'modify_stat',
        target: 'self',
        value: 10,
      };

      const result = resolver.resolve(effect, context);

      expect(result).toBeNull();
    });
  });

  describe('resolve - gain_resource', () => {
    it('should increase player resource', () => {
      const context = createTestContext();
      const effect: CardEffect = {
        type: 'gain_resource',
        target: 'self',
        value: 5,
        metadata: { resource: 'energy' },
      };

      const result = resolver.resolve(effect, context);

      expect(result!.type).toBe('gain_resource');
      expect(result!.before).toBe(10);
      expect(result!.after).toBe(15);
    });
  });

  describe('resolve - lose_resource', () => {
    it('should decrease player resource', () => {
      const context = createTestContext();
      const effect: CardEffect = {
        type: 'lose_resource',
        target: 'self',
        value: 3,
        metadata: { resource: 'energy' },
      };

      const result = resolver.resolve(effect, context);

      expect(result!.type).toBe('lose_resource');
      expect(result!.before).toBe(10);
      expect(result!.after).toBe(7);
    });

    it('should not go below zero', () => {
      const context = createTestContext();
      const effect: CardEffect = {
        type: 'lose_resource',
        target: 'self',
        value: 15, // More than current 10
        metadata: { resource: 'energy' },
      };

      const result = resolver.resolve(effect, context);

      expect(result!.after).toBe(0);
    });
  });

  describe('resolve - draw_cards', () => {
    it('should return draw intent', () => {
      const context = createTestContext();
      const effect: CardEffect = {
        type: 'draw_cards',
        target: 'self',
        value: 2,
      };

      const result = resolver.resolve(effect, context);

      expect(result!.type).toBe('draw_cards');
      expect(result!.target).toBe('player1');
      expect((result!.after as { count: number }).count).toBe(2);
    });
  });

  describe('resolve - discard_cards', () => {
    it('should return discard intent', () => {
      const context = createTestContext();
      const effect: CardEffect = {
        type: 'discard_cards',
        target: 'self',
        value: 1,
      };

      const result = resolver.resolve(effect, context);

      expect(result!.type).toBe('discard_cards');
      expect((result!.after as { count: number }).count).toBe(1);
    });
  });

  describe('resolve - apply_status', () => {
    it('should apply status to player', () => {
      const context = createTestContext();
      const effect: CardEffect = {
        type: 'apply_status',
        target: 'self',
        metadata: {
          statusId: 'buff_attack',
          statusName: 'Attack Buff',
          duration: 3,
        },
      };

      const result = resolver.resolve(effect, context);

      expect(result!.type).toBe('apply_status');
      const status = result!.after as { id: string; name: string; duration: number };
      expect(status.id).toBe('buff_attack');
      expect(status.name).toBe('Attack Buff');
      expect(status.duration).toBe(3);
    });

    it('should return null for missing statusId', () => {
      const context = createTestContext();
      const effect: CardEffect = {
        type: 'apply_status',
        target: 'self',
        metadata: {},
      };

      const result = resolver.resolve(effect, context);

      expect(result).toBeNull();
    });
  });

  describe('resolve - remove_status', () => {
    it('should remove existing status from player', () => {
      const player = createTestPlayer({
        statuses: [{ id: 'debuff_slow', name: 'Slow', duration: 2, effects: [] }],
      });
      const context = createTestContext({
        gameState: createTestState([player]),
      });

      const effect: CardEffect = {
        type: 'remove_status',
        target: 'self',
        metadata: { statusId: 'debuff_slow' },
      };

      const result = resolver.resolve(effect, context);

      expect(result!.type).toBe('remove_status');
      expect((result!.before as { id: string }).id).toBe('debuff_slow');
      expect(result!.after).toBeNull();
    });

    it('should return null if status not found', () => {
      const context = createTestContext();
      const effect: CardEffect = {
        type: 'remove_status',
        target: 'self',
        metadata: { statusId: 'nonexistent' },
      };

      const result = resolver.resolve(effect, context);

      expect(result).toBeNull();
    });
  });

  describe('resolve - trigger_event', () => {
    it('should return event trigger info', () => {
      const context = createTestContext();
      const effect: CardEffect = {
        type: 'trigger_event',
        target: 'game',
        metadata: {
          eventType: 'special_event',
          eventData: { bonus: 100 },
        },
      };

      const result = resolver.resolve(effect, context);

      expect(result!.type).toBe('trigger_event');
      expect(result!.target).toBe('game');
      const after = result!.after as { eventType: string; eventData: { bonus: number } };
      expect(after.eventType).toBe('special_event');
      expect(after.eventData.bonus).toBe(100);
    });
  });

  describe('resolveAll', () => {
    it('should resolve multiple effects', () => {
      const context = createTestContext();
      const effects: CardEffect[] = [
        { type: 'modify_stat', target: 'self', value: 5, metadata: { stat: 'health' } },
        { type: 'gain_resource', target: 'self', value: 2, metadata: { resource: 'energy' } },
      ];

      const results = resolver.resolveAll(effects, context);

      expect(results).toHaveLength(2);
      expect(results[0].type).toBe('modify_stat');
      expect(results[1].type).toBe('gain_resource');
    });

    it('should skip effects that return null', () => {
      const context = createTestContext();
      const effects: CardEffect[] = [
        { type: 'modify_stat', target: 'self', value: 5, metadata: { stat: 'health' } },
        { type: 'modify_stat', target: 'self', value: 5 }, // Missing stat, will return null
      ];

      const results = resolver.resolveAll(effects, context);

      expect(results).toHaveLength(1);
    });
  });

  describe('conditions', () => {
    it('should skip effect when stat_check condition fails', () => {
      const context = createTestContext();
      const effect: CardEffect = {
        type: 'modify_stat',
        target: 'self',
        value: 10,
        metadata: { stat: 'performance' },
        condition: {
          type: 'stat_check',
          target: 'health',
          operator: '>',
          value: 150, // Health is 100, so this fails
        },
      };

      const result = resolver.resolve(effect, context);

      expect(result).toBeNull();
    });

    it('should apply effect when stat_check condition passes', () => {
      const context = createTestContext();
      const effect: CardEffect = {
        type: 'modify_stat',
        target: 'self',
        value: 10,
        metadata: { stat: 'performance' },
        condition: {
          type: 'stat_check',
          target: 'health',
          operator: '>=',
          value: 100,
        },
      };

      const result = resolver.resolve(effect, context);

      expect(result).not.toBeNull();
    });

    it('should check turn_count condition', () => {
      const context = createTestContext();
      // gameState.turn is 3

      const effectPass: CardEffect = {
        type: 'modify_stat',
        target: 'self',
        value: 10,
        metadata: { stat: 'health' },
        condition: { type: 'turn_count', operator: '>=', value: 3 },
      };

      const effectFail: CardEffect = {
        type: 'modify_stat',
        target: 'self',
        value: 10,
        metadata: { stat: 'health' },
        condition: { type: 'turn_count', operator: '>', value: 5 },
      };

      expect(resolver.resolve(effectPass, context)).not.toBeNull();
      expect(resolver.resolve(effectFail, context)).toBeNull();
    });

    it('should support all comparison operators', () => {
      const testCases: Array<{ operator: '>' | '<' | '==' | '>=' | '<=' | '!='; value: number; expected: boolean }> = [
        { operator: '>', value: 40, expected: true },
        { operator: '>', value: 50, expected: false },
        { operator: '<', value: 60, expected: true },
        { operator: '<', value: 50, expected: false },
        { operator: '==', value: 50, expected: true },
        { operator: '==', value: 51, expected: false },
        { operator: '>=', value: 50, expected: true },
        { operator: '>=', value: 51, expected: false },
        { operator: '<=', value: 50, expected: true },
        { operator: '<=', value: 49, expected: false },
        { operator: '!=', value: 40, expected: true },
        { operator: '!=', value: 50, expected: false },
      ];

      for (const { operator, value, expected } of testCases) {
        // Create fresh player and context for each test case
        // to avoid state mutation from previous iterations
        const player = createTestPlayer({ stats: { value: 50 } });
        const context = createTestContext({
          gameState: createTestState([player]),
        });

        const effect: CardEffect = {
          type: 'modify_stat',
          target: 'self',
          value: 1,
          metadata: { stat: 'value' },
          condition: { type: 'stat_check', target: 'value', operator, value },
        };
        const result = resolver.resolve(effect, context);
        expect(result !== null, `Failed for operator ${operator} with value ${value}`).toBe(expected);
      }
    });
  });

  describe('target types', () => {
    it('should target self', () => {
      const player1 = createTestPlayer({ id: 'player1', stats: { hp: 100 } });
      const player2 = createTestPlayer({ id: 'player2', stats: { hp: 80 } });
      const context = createTestContext({
        gameState: createTestState([player1, player2]),
        sourcePlayerId: 'player1',
      });

      const effect: CardEffect = {
        type: 'modify_stat',
        target: 'self',
        value: 10,
        metadata: { stat: 'hp' },
      };

      const result = resolver.resolve(effect, context);

      expect(result!.target).toBe('player1');
    });

    it('should target opponent', () => {
      const player1 = createTestPlayer({ id: 'player1', stats: { hp: 100 } });
      const player2 = createTestPlayer({ id: 'player2', stats: { hp: 80 } });
      const context = createTestContext({
        gameState: createTestState([player1, player2]),
        sourcePlayerId: 'player1',
      });

      const effect: CardEffect = {
        type: 'modify_stat',
        target: 'opponent',
        value: -10,
        metadata: { stat: 'hp' },
      };

      const result = resolver.resolve(effect, context);

      expect(result!.target).toBe('player2');
    });
  });

  describe('custom handlers', () => {
    it('should use registered custom handler', () => {
      resolver.registerHandler('double_damage', (effect, context) => {
        const player = context.gameState.players[context.sourcePlayerId];
        const damage = Number(effect.value ?? 0) * 2;
        const before = player.stats.hp ?? 0;
        player.stats.hp = before - damage;

        return {
          type: 'custom',
          target: context.sourcePlayerId,
          before,
          after: player.stats.hp,
        };
      });

      const player = createTestPlayer({ id: 'player1', stats: { hp: 100 } });
      const context = createTestContext({
        gameState: createTestState([player]),
      });

      const effect: CardEffect = {
        type: 'custom',
        target: 'self',
        value: 10,
      };

      // Register as 'custom' type to trigger the handler
      resolver.registerHandler('custom', (eff, ctx) => ({
        type: 'custom',
        target: ctx.sourcePlayerId,
        before: 100,
        after: 80,
      }));

      const result = resolver.resolve(effect, context);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('custom');
    });
  });

  describe('unknown effect type', () => {
    it('should return null and warn for unknown effect type', () => {
      const context = createTestContext();
      const effect = {
        type: 'unknown_type' as const,
        target: 'self',
        value: 10,
      } as unknown as CardEffect;

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = resolver.resolve(effect, context);

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });
});
