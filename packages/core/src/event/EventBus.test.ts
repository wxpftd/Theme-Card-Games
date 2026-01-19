import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from './EventBus';
import { GameEvent, GameState } from '../types';

const createMockState = (): GameState => ({
  id: 'game_1',
  phase: 'main',
  turn: 1,
  currentPlayerId: 'player1',
  players: {},
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
});

describe('EventBus', () => {
  let eventBus: EventBus;
  let mockState: GameState;

  beforeEach(() => {
    eventBus = new EventBus();
    mockState = createMockState();
  });

  describe('on/emit', () => {
    it('should subscribe to and receive events', () => {
      const handler = vi.fn();
      eventBus.on('card_played', handler);

      const event: GameEvent = {
        type: 'card_played',
        timestamp: Date.now(),
        data: { cardId: 'card_1' },
      };

      eventBus.emit(event, mockState);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event, mockState);
    });

    it('should allow multiple handlers for the same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on('turn_started', handler1);
      eventBus.on('turn_started', handler2);

      eventBus.emitSimple('turn_started', { turn: 1 }, mockState);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should not trigger handlers for different event types', () => {
      const handler = vi.fn();
      eventBus.on('card_played', handler);

      eventBus.emitSimple('turn_started', {}, mockState);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('should only trigger handler once', () => {
      const handler = vi.fn();
      eventBus.once('card_drawn', handler);

      eventBus.emitSimple('card_drawn', { cardId: '1' }, mockState);
      eventBus.emitSimple('card_drawn', { cardId: '2' }, mockState);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should remove listener after first trigger', () => {
      const handler = vi.fn();
      eventBus.once('game_started', handler);

      eventBus.emitSimple('game_started', {}, mockState);

      expect(eventBus.getListenerCount('game_started')).toBe(0);
    });
  });

  describe('off', () => {
    it('should unsubscribe from events', () => {
      const handler = vi.fn();
      eventBus.on('card_discarded', handler);

      eventBus.off('card_discarded', handler);
      eventBus.emitSimple('card_discarded', {}, mockState);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function from on()', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.on('stat_changed', handler);

      unsubscribe();
      eventBus.emitSimple('stat_changed', {}, mockState);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('wildcard listener (*)', () => {
    it('should receive all event types', () => {
      const handler = vi.fn();
      eventBus.on('*', handler);

      eventBus.emitSimple('card_played', {}, mockState);
      eventBus.emitSimple('turn_started', {}, mockState);
      eventBus.emitSimple('game_ended', {}, mockState);

      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('should work alongside specific listeners', () => {
      const wildcardHandler = vi.fn();
      const specificHandler = vi.fn();

      eventBus.on('*', wildcardHandler);
      eventBus.on('card_played', specificHandler);

      eventBus.emitSimple('card_played', {}, mockState);

      expect(wildcardHandler).toHaveBeenCalledTimes(1);
      expect(specificHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('priority', () => {
    it('should execute higher priority handlers first', () => {
      const order: number[] = [];

      eventBus.on('test', () => order.push(1), 1);
      eventBus.on('test', () => order.push(3), 3);
      eventBus.on('test', () => order.push(2), 2);

      eventBus.emitSimple('custom', {}, mockState);
      // Note: 'test' is not a valid GameEventType, so we use 'custom'
      order.length = 0;

      eventBus.on('custom', () => order.push(1), 1);
      eventBus.on('custom', () => order.push(3), 3);
      eventBus.on('custom', () => order.push(2), 2);

      eventBus.emitSimple('custom', {}, mockState);

      expect(order).toEqual([3, 2, 1]);
    });
  });

  describe('event history', () => {
    it('should store events in history', () => {
      eventBus.emitSimple('card_played', { cardId: '1' }, mockState);
      eventBus.emitSimple('card_drawn', { cardId: '2' }, mockState);

      const history = eventBus.getHistory();

      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('card_played');
      expect(history[1].type).toBe('card_drawn');
    });

    it('should limit history size', () => {
      eventBus.setMaxHistorySize(3);

      for (let i = 0; i < 5; i++) {
        eventBus.emitSimple('custom', { index: i }, mockState);
      }

      const history = eventBus.getHistory();

      expect(history).toHaveLength(3);
      expect(history[0].data.index).toBe(2);
      expect(history[2].data.index).toBe(4);
    });

    it('should filter history by event type', () => {
      eventBus.emitSimple('card_played', {}, mockState);
      eventBus.emitSimple('turn_started', {}, mockState);
      eventBus.emitSimple('card_played', {}, mockState);

      const cardPlayedEvents = eventBus.getEventsOfType('card_played');

      expect(cardPlayedEvents).toHaveLength(2);
    });

    it('should clear history', () => {
      eventBus.emitSimple('game_started', {}, mockState);
      eventBus.emitSimple('turn_started', {}, mockState);

      eventBus.clearHistory();

      expect(eventBus.getHistory()).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should continue executing handlers after one throws', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const handler1 = vi.fn(() => {
        throw new Error('Test error');
      });
      const handler2 = vi.fn();

      eventBus.on('custom', handler1, 2);
      eventBus.on('custom', handler2, 1);

      eventBus.emitSimple('custom', {}, mockState);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('emitSimple', () => {
    it('should create event with timestamp and emit', () => {
      const handler = vi.fn();
      eventBus.on('game_started', handler);

      const beforeTime = Date.now();
      eventBus.emitSimple('game_started', { foo: 'bar' }, mockState);
      const afterTime = Date.now();

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as GameEvent;
      expect(event.type).toBe('game_started');
      expect(event.data.foo).toBe('bar');
      expect(event.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(event.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('getListenerCount', () => {
    it('should return correct listener count', () => {
      expect(eventBus.getListenerCount('card_played')).toBe(0);

      eventBus.on('card_played', () => {});
      eventBus.on('card_played', () => {});

      expect(eventBus.getListenerCount('card_played')).toBe(2);
    });
  });

  describe('clearListeners', () => {
    it('should remove all listeners', () => {
      eventBus.on('card_played', () => {});
      eventBus.on('turn_started', () => {});

      eventBus.clearListeners();

      expect(eventBus.getListenerCount('card_played')).toBe(0);
      expect(eventBus.getListenerCount('turn_started')).toBe(0);
    });
  });
});
