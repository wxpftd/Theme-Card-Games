import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComboSystem } from './ComboSystem';
import { EffectResolver } from '../card/EffectResolver';
import { EventBus } from '../event/EventBus';
import { ComboDefinition, CardDefinition, GameState } from '../types';

describe('ComboSystem', () => {
  let comboSystem: ComboSystem;
  let effectResolver: EffectResolver;
  let eventBus: EventBus;
  let cardDefinitions: Map<string, CardDefinition>;
  let gameState: GameState;

  const mockCards: CardDefinition[] = [
    {
      id: 'overtime',
      type: 'event',
      name: 'Overtime',
      description: 'Work overtime',
      effects: [],
      tags: ['work'],
    },
    {
      id: 'coffee_break',
      type: 'action',
      name: 'Coffee Break',
      description: 'Take a coffee break',
      effects: [],
      tags: ['rest'],
    },
    {
      id: 'code_review',
      type: 'action',
      name: 'Code Review',
      description: 'Review code',
      effects: [],
      tags: ['work'],
    },
    {
      id: 'bug_fix',
      type: 'action',
      name: 'Bug Fix',
      description: 'Fix a bug',
      effects: [],
      tags: ['work'],
    },
  ];

  const mockCombos: ComboDefinition[] = [
    {
      id: 'night_warrior',
      name: 'Night Warrior',
      description: 'Overtime + Coffee',
      trigger: { type: 'combination', cards: ['overtime', 'coffee_break'] },
      effects: [
        { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 5 },
      ],
    },
    {
      id: 'workaholic',
      name: 'Workaholic',
      description: 'Play 3 work cards',
      trigger: { type: 'tag_count', tag: 'work', count: 3 },
      effects: [
        { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 10 },
      ],
      cooldown: 2,
    },
  ];

  beforeEach(() => {
    effectResolver = new EffectResolver();
    eventBus = new EventBus();
    cardDefinitions = new Map(mockCards.map((c) => [c.id, c]));

    comboSystem = new ComboSystem({
      comboDefinitions: mockCombos,
      cardDefinitions,
      effectResolver,
      eventBus,
    });

    gameState = {
      id: 'test-game',
      phase: 'main',
      turn: 1,
      currentPlayerId: 'player1',
      players: {
        player1: {
          id: 'player1',
          name: 'Test Player',
          stats: { performance: 50, health: 80 },
          resources: { energy: 5 },
          statuses: [],
          hand: [],
          deck: [],
          discardPile: [],
          playArea: [],
        },
      },
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

    comboSystem.initializePlayer('player1');
  });

  describe('combination trigger', () => {
    it('should trigger combo when both cards are played in same turn', () => {
      // Play overtime
      let triggered = comboSystem.onCardPlayed('player1', 'overtime', gameState);
      expect(triggered.length).toBe(0);

      // Play coffee_break - should trigger night_warrior combo
      triggered = comboSystem.onCardPlayed('player1', 'coffee_break', gameState);
      expect(triggered.length).toBe(1);
      expect(triggered[0].combo.id).toBe('night_warrior');
    });

    it('should trigger combo regardless of play order', () => {
      // Play coffee_break first
      comboSystem.onCardPlayed('player1', 'coffee_break', gameState);

      // Play overtime - should trigger night_warrior combo
      const triggered = comboSystem.onCardPlayed('player1', 'overtime', gameState);
      expect(triggered.length).toBe(1);
      expect(triggered[0].combo.id).toBe('night_warrior');
    });

    it('should not trigger combo if cards are not all played', () => {
      // Only play overtime
      const triggered = comboSystem.onCardPlayed('player1', 'overtime', gameState);
      expect(triggered.length).toBe(0);
    });
  });

  describe('tag_count trigger', () => {
    it('should trigger combo when enough cards with tag are played', () => {
      // Play first work card
      let triggered = comboSystem.onCardPlayed('player1', 'overtime', gameState);
      expect(triggered.length).toBe(0);

      // Play second work card
      triggered = comboSystem.onCardPlayed('player1', 'code_review', gameState);
      expect(triggered.length).toBe(0);

      // Play third work card - should trigger workaholic combo
      triggered = comboSystem.onCardPlayed('player1', 'bug_fix', gameState);
      expect(triggered.length).toBe(1);
      expect(triggered[0].combo.id).toBe('workaholic');
    });
  });

  describe('cooldown', () => {
    it('should not trigger combo during cooldown', () => {
      // Play 3 work cards to trigger workaholic
      comboSystem.onCardPlayed('player1', 'overtime', gameState);
      comboSystem.onCardPlayed('player1', 'code_review', gameState);
      let triggered = comboSystem.onCardPlayed('player1', 'bug_fix', gameState);
      expect(triggered.some((t) => t.combo.id === 'workaholic')).toBe(true);

      // Still turn 1, try to trigger again
      triggered = comboSystem.onCardPlayed('player1', 'overtime', gameState);
      triggered = comboSystem.onCardPlayed('player1', 'code_review', gameState);
      triggered = comboSystem.onCardPlayed('player1', 'bug_fix', gameState);
      expect(triggered.some((t) => t.combo.id === 'workaholic')).toBe(false);

      // Move to turn 3 (past cooldown of 2)
      gameState.turn = 3;
      // Reset turn state
      eventBus.emitSimple('turn_started', { playerId: 'player1' }, gameState);

      // Should be able to trigger again
      comboSystem.onCardPlayed('player1', 'overtime', gameState);
      comboSystem.onCardPlayed('player1', 'code_review', gameState);
      triggered = comboSystem.onCardPlayed('player1', 'bug_fix', gameState);
      expect(triggered.some((t) => t.combo.id === 'workaholic')).toBe(true);
    });
  });

  describe('turn reset', () => {
    it('should reset played cards at turn start', () => {
      // Play cards
      comboSystem.onCardPlayed('player1', 'overtime', gameState);

      // Emit turn started event
      eventBus.emitSimple('turn_started', { playerId: 'player1' }, gameState);

      // State should be reset
      const state = comboSystem.getPlayerState('player1');
      expect(state?.playedCardsThisTurn.length).toBe(0);
    });
  });

  describe('event emission', () => {
    it('should emit combo_triggered event when combo triggers', () => {
      const handler = vi.fn();
      eventBus.on('combo_triggered', handler);

      comboSystem.onCardPlayed('player1', 'overtime', gameState);
      comboSystem.onCardPlayed('player1', 'coffee_break', gameState);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'combo_triggered',
          data: expect.objectContaining({
            playerId: 'player1',
            comboId: 'night_warrior',
          }),
        }),
        expect.anything()
      );
    });
  });
});
