import { GameEvent, GameEventType, GameEventHandler, GameState } from '../types';

type EventListener = {
  handler: GameEventHandler;
  once: boolean;
  priority: number;
};

/**
 * EventBus handles game event pub/sub
 */
export class EventBus {
  private listeners: Map<GameEventType | '*', EventListener[]> = new Map();
  private eventHistory: GameEvent[] = [];
  private maxHistorySize: number = 100;

  /**
   * Subscribe to an event type
   */
  on(
    eventType: GameEventType | '*',
    handler: GameEventHandler,
    priority: number = 0
  ): () => void {
    return this.addListener(eventType, handler, false, priority);
  }

  /**
   * Subscribe to an event type (fires once then unsubscribes)
   */
  once(
    eventType: GameEventType | '*',
    handler: GameEventHandler,
    priority: number = 0
  ): () => void {
    return this.addListener(eventType, handler, true, priority);
  }

  /**
   * Unsubscribe from an event type
   */
  off(eventType: GameEventType | '*', handler: GameEventHandler): void {
    const listeners = this.listeners.get(eventType);
    if (!listeners) return;

    const index = listeners.findIndex(l => l.handler === handler);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Emit an event
   */
  emit(event: GameEvent, state: GameState): void {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Get specific listeners
    const specificListeners = this.listeners.get(event.type) ?? [];
    // Get wildcard listeners
    const wildcardListeners = this.listeners.get('*') ?? [];

    // Combine and sort by priority (higher first)
    const allListeners = [...specificListeners, ...wildcardListeners].sort(
      (a, b) => b.priority - a.priority
    );

    // Track listeners to remove after execution
    const toRemove: { type: GameEventType | '*'; handler: GameEventHandler }[] = [];

    // Execute handlers
    for (const listener of allListeners) {
      try {
        listener.handler(event, state);
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }

      if (listener.once) {
        toRemove.push({
          type: specificListeners.includes(listener) ? event.type : '*',
          handler: listener.handler,
        });
      }
    }

    // Remove once listeners
    for (const { type, handler } of toRemove) {
      this.off(type, handler);
    }
  }

  /**
   * Emit a simple event
   */
  emitSimple(
    type: GameEventType,
    data: Record<string, unknown>,
    state: GameState
  ): void {
    this.emit(
      {
        type,
        timestamp: Date.now(),
        data,
      },
      state
    );
  }

  /**
   * Get event history
   */
  getHistory(): GameEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Get events of a specific type from history
   */
  getEventsOfType(type: GameEventType): GameEvent[] {
    return this.eventHistory.filter(e => e.type === type);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Clear all listeners
   */
  clearListeners(): void {
    this.listeners.clear();
  }

  /**
   * Set maximum history size
   */
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;
    while (this.eventHistory.length > size) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get listener count for an event type
   */
  getListenerCount(eventType: GameEventType | '*'): number {
    return this.listeners.get(eventType)?.length ?? 0;
  }

  private addListener(
    eventType: GameEventType | '*',
    handler: GameEventHandler,
    once: boolean,
    priority: number
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const listener: EventListener = { handler, once, priority };
    this.listeners.get(eventType)!.push(listener);

    // Return unsubscribe function
    return () => this.off(eventType, handler);
  }
}
