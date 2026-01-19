import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameStateManager } from './GameStateManager';
import { CardDefinition, GameConfig } from '../types';

const createTestConfig = (overrides: Partial<GameConfig> = {}): GameConfig => ({
  maxPlayers: 4,
  minPlayers: 1,
  initialHandSize: 3,
  maxHandSize: 7,
  winConditions: [
    { type: 'stat_threshold', stat: 'performance', operator: '>=', value: 100 },
    { type: 'stat_threshold', stat: 'health', operator: '<=', value: 0 },
    { type: 'turn_limit', value: 10 },
  ],
  initialStats: { performance: 50, health: 100, happiness: 50 },
  initialResources: { energy: 5, gold: 100 },
  ...overrides,
});

const createTestCards = (): CardDefinition[] => [
  {
    id: 'work',
    type: 'action',
    name: 'Work Hard',
    description: 'Increase performance',
    effects: [{ type: 'modify_stat', target: 'self', value: 10, metadata: { stat: 'performance' } }],
    cost: 1,
    rarity: 'common',
    tags: ['work'],
  },
  {
    id: 'rest',
    type: 'action',
    name: 'Rest',
    description: 'Recover health',
    effects: [{ type: 'modify_stat', target: 'self', value: 5, metadata: { stat: 'health' } }],
    cost: 0,
    rarity: 'common',
    tags: ['rest'],
  },
  {
    id: 'party',
    type: 'event',
    name: 'Party',
    description: 'Have fun',
    effects: [
      { type: 'modify_stat', target: 'self', value: 10, metadata: { stat: 'happiness' } },
      { type: 'lose_resource', target: 'self', value: 2, metadata: { resource: 'energy' } },
    ],
    cost: 1,
    rarity: 'uncommon',
    tags: ['social'],
  },
  // Additional cards to ensure deck has enough cards for drawing tests
  {
    id: 'study',
    type: 'action',
    name: 'Study',
    description: 'Learn new skills',
    effects: [],
    cost: 1,
    rarity: 'common',
    tags: ['learning'],
  },
  {
    id: 'exercise',
    type: 'action',
    name: 'Exercise',
    description: 'Stay healthy',
    effects: [],
    cost: 0,
    rarity: 'common',
    tags: ['health'],
  },
  {
    id: 'network',
    type: 'action',
    name: 'Network',
    description: 'Build connections',
    effects: [],
    cost: 1,
    rarity: 'uncommon',
    tags: ['social'],
  },
  {
    id: 'invest',
    type: 'action',
    name: 'Invest',
    description: 'Grow wealth',
    effects: [],
    cost: 2,
    rarity: 'rare',
    tags: ['finance'],
  },
  {
    id: 'meditate',
    type: 'action',
    name: 'Meditate',
    description: 'Find peace',
    effects: [],
    cost: 0,
    rarity: 'common',
    tags: ['wellness'],
  },
];

describe('GameStateManager', () => {
  let manager: GameStateManager;

  beforeEach(() => {
    manager = new GameStateManager({
      config: createTestConfig(),
      cardDefinitions: createTestCards(),
    });
  });

  describe('initialization', () => {
    it('should create initial state in setup phase', () => {
      expect(manager.phase).toBe('setup');
      expect(manager.turn).toBe(0);
    });

    it('should have empty players initially', () => {
      expect(manager.getAllPlayers()).toHaveLength(0);
    });

    it('should generate unique game ID', () => {
      const manager2 = new GameStateManager({
        config: createTestConfig(),
        cardDefinitions: createTestCards(),
      });

      expect(manager.currentState.id).not.toBe(manager2.currentState.id);
    });
  });

  describe('addPlayer', () => {
    it('should add a player with initial stats', () => {
      const player = manager.addPlayer('player1', 'Alice');

      expect(player).not.toBeNull();
      expect(player!.id).toBe('player1');
      expect(player!.name).toBe('Alice');
      expect(player!.stats.performance).toBe(50);
      expect(player!.stats.health).toBe(100);
    });

    it('should set first player as current player', () => {
      manager.addPlayer('player1', 'Alice');

      expect(manager.currentPlayerId).toBe('player1');
    });

    it('should create deck for player', () => {
      manager.addPlayer('player1', 'Alice');

      const deck = manager.getPlayerDeck('player1');
      expect(deck).not.toBeNull();
      expect(deck!.size).toBeGreaterThan(0);
    });

    it('should create empty hand for player', () => {
      manager.addPlayer('player1', 'Alice');

      const hand = manager.getPlayerHand('player1');
      expect(hand).not.toBeNull();
      expect(hand!.size).toBe(0);
    });

    it('should emit player_joined event', () => {
      const handler = vi.fn();
      manager.events.on('custom', handler);

      manager.addPlayer('player1', 'Alice');

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].data.subtype).toBe('player_joined');
    });

    it('should reject player when max players reached', () => {
      const config = createTestConfig({ maxPlayers: 2 });
      const limitedManager = new GameStateManager({
        config,
        cardDefinitions: createTestCards(),
      });

      limitedManager.addPlayer('p1', 'Player 1');
      limitedManager.addPlayer('p2', 'Player 2');
      const result = limitedManager.addPlayer('p3', 'Player 3');

      expect(result).toBeNull();
    });
  });

  describe('removePlayer', () => {
    it('should remove player and their data', () => {
      manager.addPlayer('player1', 'Alice');
      manager.addPlayer('player2', 'Bob');

      const result = manager.removePlayer('player1');

      expect(result).toBe(true);
      expect(manager.getPlayer('player1')).toBeNull();
      expect(manager.getPlayerDeck('player1')).toBeNull();
      expect(manager.getPlayerHand('player1')).toBeNull();
    });

    it('should return false for non-existent player', () => {
      const result = manager.removePlayer('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('startGame', () => {
    it('should start game with enough players', () => {
      manager.addPlayer('player1', 'Alice');

      const result = manager.startGame();

      expect(result).toBe(true);
      expect(manager.phase).toBe('draw');
      expect(manager.turn).toBe(1);
    });

    it('should deal initial hands', () => {
      manager.addPlayer('player1', 'Alice');
      manager.startGame();

      const hand = manager.getPlayerHand('player1');
      expect(hand!.size).toBe(3); // initialHandSize
    });

    it('should reject start with too few players', () => {
      const config = createTestConfig({ minPlayers: 2 });
      const strictManager = new GameStateManager({
        config,
        cardDefinitions: createTestCards(),
      });
      strictManager.addPlayer('player1', 'Alice');

      const result = strictManager.startGame();

      expect(result).toBe(false);
    });

    it('should emit game_started and turn_started events', () => {
      const gameStartedHandler = vi.fn();
      const turnStartedHandler = vi.fn();

      manager.events.on('game_started', gameStartedHandler);
      manager.events.on('turn_started', turnStartedHandler);
      manager.addPlayer('player1', 'Alice');
      manager.startGame();

      expect(gameStartedHandler).toHaveBeenCalled();
      expect(turnStartedHandler).toHaveBeenCalled();
    });
  });

  describe('drawCards', () => {
    beforeEach(() => {
      manager.addPlayer('player1', 'Alice');
      manager.startGame();
    });

    it('should draw cards from deck to hand', () => {
      const initialHandSize = manager.getPlayerHand('player1')!.size;
      const drawn = manager.drawCards('player1', 2);

      expect(drawn).toHaveLength(2);
      expect(manager.getPlayerHand('player1')!.size).toBe(initialHandSize + 2);
    });

    it('should emit card_drawn events', () => {
      const handler = vi.fn();
      manager.events.on('card_drawn', handler);

      manager.drawCards('player1', 2);

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should not exceed max hand size', () => {
      // Draw many cards to try to exceed max
      for (let i = 0; i < 10; i++) {
        manager.drawCards('player1', 1);
      }

      expect(manager.getPlayerHand('player1')!.size).toBeLessThanOrEqual(7);
    });

    it('should return empty array for invalid player', () => {
      const drawn = manager.drawCards('nonexistent', 1);
      expect(drawn).toHaveLength(0);
    });
  });

  describe('playCard', () => {
    beforeEach(() => {
      manager.addPlayer('player1', 'Alice');
      manager.startGame();
    });

    it('should play card from hand', () => {
      const hand = manager.getPlayerHand('player1')!;
      const card = hand.getCards()[0];

      const result = manager.playCard('player1', card.id);

      expect(result).toBe(true);
      expect(manager.getPlayerHand('player1')!.size).toBe(2);
    });

    it('should add card to play area', () => {
      const hand = manager.getPlayerHand('player1')!;
      const card = hand.getCards()[0];

      manager.playCard('player1', card.id);

      const player = manager.getPlayer('player1')!;
      expect(player.playArea).toHaveLength(1);
    });

    it('should emit card_played event', () => {
      const handler = vi.fn();
      manager.events.on('card_played', handler);

      const hand = manager.getPlayerHand('player1')!;
      const card = hand.getCards()[0];
      manager.playCard('player1', card.id);

      expect(handler).toHaveBeenCalled();
    });

    it('should record action in history', () => {
      const hand = manager.getPlayerHand('player1')!;
      const card = hand.getCards()[0];

      manager.playCard('player1', card.id);

      const history = manager.getHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[history.length - 1].type).toBe('play_card');
    });

    it('should return false for invalid card', () => {
      const result = manager.playCard('player1', 'nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('discardCard', () => {
    beforeEach(() => {
      manager.addPlayer('player1', 'Alice');
      manager.startGame();
    });

    it('should discard card from hand', () => {
      const hand = manager.getPlayerHand('player1')!;
      const card = hand.getCards()[0];

      const result = manager.discardCard('player1', card.id);

      expect(result).toBe(true);
      expect(manager.getPlayerHand('player1')!.size).toBe(2);
    });

    it('should add card to discard pile', () => {
      const hand = manager.getPlayerHand('player1')!;
      const card = hand.getCards()[0];

      manager.discardCard('player1', card.id);

      const deck = manager.getPlayerDeck('player1')!;
      expect(deck.discardSize).toBeGreaterThan(0);
    });

    it('should emit card_discarded event', () => {
      const handler = vi.fn();
      manager.events.on('card_discarded', handler);

      const hand = manager.getPlayerHand('player1')!;
      const card = hand.getCards()[0];
      manager.discardCard('player1', card.id);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('modifyStat', () => {
    beforeEach(() => {
      manager.addPlayer('player1', 'Alice');
    });

    it('should modify player stat', () => {
      const result = manager.modifyStat('player1', 'performance', 15);

      expect(result).toBe(true);
      expect(manager.getPlayer('player1')!.stats.performance).toBe(65);
    });

    it('should handle negative modifications', () => {
      manager.modifyStat('player1', 'health', -30);

      expect(manager.getPlayer('player1')!.stats.health).toBe(70);
    });

    it('should emit stat_changed event', () => {
      const handler = vi.fn();
      manager.events.on('stat_changed', handler);

      manager.modifyStat('player1', 'performance', 10);

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].data.before).toBe(50);
      expect(handler.mock.calls[0][0].data.after).toBe(60);
    });

    it('should return false for invalid player', () => {
      const result = manager.modifyStat('nonexistent', 'health', 10);
      expect(result).toBe(false);
    });
  });

  describe('setStat', () => {
    beforeEach(() => {
      manager.addPlayer('player1', 'Alice');
    });

    it('should set stat to specific value', () => {
      manager.setStat('player1', 'performance', 75);

      expect(manager.getPlayer('player1')!.stats.performance).toBe(75);
    });
  });

  describe('modifyResource', () => {
    beforeEach(() => {
      manager.addPlayer('player1', 'Alice');
    });

    it('should modify player resource', () => {
      manager.modifyResource('player1', 'energy', 3);

      expect(manager.getPlayer('player1')!.resources.energy).toBe(8);
    });

    it('should not go below zero', () => {
      manager.modifyResource('player1', 'energy', -10);

      expect(manager.getPlayer('player1')!.resources.energy).toBe(0);
    });

    it('should emit resource_changed event', () => {
      const handler = vi.fn();
      manager.events.on('resource_changed', handler);

      manager.modifyResource('player1', 'gold', -50);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('endTurn', () => {
    beforeEach(() => {
      manager.addPlayer('player1', 'Alice');
      manager.addPlayer('player2', 'Bob');
      manager.startGame();
    });

    it('should switch to next player', () => {
      expect(manager.currentPlayerId).toBe('player1');

      manager.endTurn();

      expect(manager.currentPlayerId).toBe('player2');
    });

    it('should increment turn when going back to first player', () => {
      expect(manager.turn).toBe(1);

      manager.endTurn(); // player1 -> player2
      manager.endTurn(); // player2 -> player1

      expect(manager.turn).toBe(2);
    });

    it('should emit turn_ended and turn_started events', () => {
      const turnEndedHandler = vi.fn();
      const turnStartedHandler = vi.fn();

      manager.events.on('turn_ended', turnEndedHandler);
      manager.events.on('turn_started', turnStartedHandler);

      manager.endTurn();

      expect(turnEndedHandler).toHaveBeenCalled();
      expect(turnStartedHandler).toHaveBeenCalled();
    });

    it('should reset phase to draw', () => {
      manager.setPhase('action');
      manager.endTurn();

      expect(manager.phase).toBe('draw');
    });
  });

  describe('checkWinConditions', () => {
    beforeEach(() => {
      manager.addPlayer('player1', 'Alice');
      manager.startGame();
    });

    it('should detect stat threshold win (>=)', () => {
      manager.setStat('player1', 'performance', 100);

      const result = manager.checkWinConditions();

      expect(result.winner).toBe('player1');
      expect(result.reason).toContain('performance');
    });

    it('should detect stat threshold lose (<=)', () => {
      manager.setStat('player1', 'health', 0);

      const result = manager.checkWinConditions();

      expect(result.winner).toBe('player1');
      expect(result.reason).toContain('health');
    });

    it('should return null when no conditions met', () => {
      const result = manager.checkWinConditions();

      expect(result.winner).toBeNull();
      expect(result.reason).toBeNull();
    });
  });

  describe('endGame', () => {
    beforeEach(() => {
      manager.addPlayer('player1', 'Alice');
      manager.startGame();
    });

    it('should set phase to game_over', () => {
      manager.endGame('player1', 'Victory');

      expect(manager.phase).toBe('game_over');
    });

    it('should emit game_ended event', () => {
      const handler = vi.fn();
      manager.events.on('game_ended', handler);

      manager.endGame('player1', 'Victory');

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].data.winnerId).toBe('player1');
      expect(handler.mock.calls[0][0].data.reason).toBe('Victory');
    });
  });

  describe('sharedState', () => {
    it('should set and get shared state', () => {
      manager.setSharedState('roundBonus', 100);
      manager.setSharedState('specialEvent', { type: 'bonus' });

      expect(manager.getSharedState<number>('roundBonus')).toBe(100);
      expect(manager.getSharedState<{ type: string }>('specialEvent')).toEqual({ type: 'bonus' });
    });

    it('should return undefined for missing keys', () => {
      expect(manager.getSharedState('nonexistent')).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('should reset game to initial state', () => {
      manager.addPlayer('player1', 'Alice');
      manager.startGame();
      manager.modifyStat('player1', 'performance', 20);

      manager.reset();

      expect(manager.phase).toBe('setup');
      expect(manager.turn).toBe(0);
      expect(manager.getAllPlayers()).toHaveLength(0);
    });

    it('should clear event history', () => {
      manager.addPlayer('player1', 'Alice');
      manager.startGame();

      manager.reset();

      expect(manager.events.getHistory()).toHaveLength(0);
    });
  });

  describe('currentState getter', () => {
    it('should return deep clone of state', () => {
      manager.addPlayer('player1', 'Alice');

      const state1 = manager.currentState;
      const state2 = manager.currentState;

      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });

    it('should not allow external mutation of state', () => {
      manager.addPlayer('player1', 'Alice');

      const state = manager.currentState;
      state.turn = 999;

      expect(manager.turn).toBe(0);
    });
  });
});
