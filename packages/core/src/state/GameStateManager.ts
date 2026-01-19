import {
  GameState,
  GamePhase,
  PlayerState,
  GameConfig,
  GameAction,
  CardDefinition,
} from '../types';
import { EventBus } from '../event';
import { Card, Deck, Hand, EffectResolver } from '../card';
import { generateId, deepClone } from '../utils';

export interface GameStateManagerOptions {
  config: GameConfig;
  cardDefinitions: CardDefinition[];
  eventBus?: EventBus;
  effectResolver?: EffectResolver;
}

/**
 * GameStateManager handles the central game state
 */
export class GameStateManager {
  private state: GameState;
  private cardDefinitions: Map<string, CardDefinition>;
  private eventBus: EventBus;
  private effectResolver: EffectResolver;
  private playerDecks: Map<string, Deck> = new Map();
  private playerHands: Map<string, Hand> = new Map();

  constructor(options: GameStateManagerOptions) {
    this.cardDefinitions = new Map(options.cardDefinitions.map((def) => [def.id, def]));
    this.eventBus = options.eventBus ?? new EventBus();
    this.effectResolver = options.effectResolver ?? new EffectResolver();

    this.state = this.createInitialState(options.config);
  }

  // Getters
  get currentState(): GameState {
    return deepClone(this.state);
  }

  get phase(): GamePhase {
    return this.state.phase;
  }

  get turn(): number {
    return this.state.turn;
  }

  get currentPlayerId(): string {
    return this.state.currentPlayerId;
  }

  get events(): EventBus {
    return this.eventBus;
  }

  get effects(): EffectResolver {
    return this.effectResolver;
  }

  /**
   * Create the initial game state
   */
  private createInitialState(config: GameConfig): GameState {
    return {
      id: generateId('game'),
      phase: 'setup',
      turn: 0,
      currentPlayerId: '',
      players: {},
      sharedState: {},
      history: [],
      config,
    };
  }

  /**
   * Add a player to the game
   */
  addPlayer(id: string, name: string): PlayerState | null {
    const { config } = this.state;

    if (Object.keys(this.state.players).length >= config.maxPlayers) {
      return null;
    }

    const playerState: PlayerState = {
      id,
      name,
      stats: { ...config.initialStats },
      resources: { ...config.initialResources },
      statuses: [],
      hand: [],
      deck: [],
      discardPile: [],
      playArea: [],
    };

    this.state.players[id] = playerState;

    // Create deck and hand for player
    const deck = Deck.fromDefinitions(Array.from(this.cardDefinitions.values()));
    deck.shuffle();
    this.playerDecks.set(id, deck);

    const hand = new Hand(config.maxHandSize);
    this.playerHands.set(id, hand);

    // Set first player as current player
    if (!this.state.currentPlayerId) {
      this.state.currentPlayerId = id;
    }

    this.eventBus.emitSimple(
      'custom',
      { subtype: 'player_joined', playerId: id, name },
      this.state
    );

    return playerState;
  }

  /**
   * Remove a player from the game
   */
  removePlayer(playerId: string): boolean {
    if (!this.state.players[playerId]) {
      return false;
    }

    delete this.state.players[playerId];
    this.playerDecks.delete(playerId);
    this.playerHands.delete(playerId);

    return true;
  }

  /**
   * Get a player's state
   */
  getPlayer(playerId: string): PlayerState | null {
    return this.state.players[playerId] ?? null;
  }

  /**
   * Get all players
   */
  getAllPlayers(): PlayerState[] {
    return Object.values(this.state.players);
  }

  /**
   * Get a player's deck
   */
  getPlayerDeck(playerId: string): Deck | null {
    return this.playerDecks.get(playerId) ?? null;
  }

  /**
   * Get a player's hand
   */
  getPlayerHand(playerId: string): Hand | null {
    return this.playerHands.get(playerId) ?? null;
  }

  /**
   * Start the game
   */
  startGame(): boolean {
    const playerCount = Object.keys(this.state.players).length;
    const { minPlayers } = this.state.config;

    if (playerCount < minPlayers) {
      return false;
    }

    // Draw initial hands
    for (const playerId of Object.keys(this.state.players)) {
      this.drawCards(playerId, this.state.config.initialHandSize);
    }

    this.state.phase = 'draw';
    this.state.turn = 1;

    this.eventBus.emitSimple('game_started', {}, this.state);
    this.eventBus.emitSimple(
      'turn_started',
      { turn: 1, playerId: this.state.currentPlayerId },
      this.state
    );

    return true;
  }

  /**
   * Change game phase
   */
  setPhase(phase: GamePhase): void {
    const previousPhase = this.state.phase;
    this.state.phase = phase;

    this.eventBus.emitSimple('phase_changed', { from: previousPhase, to: phase }, this.state);
  }

  /**
   * Draw cards for a player
   */
  drawCards(playerId: string, count: number = 1): Card[] {
    const deck = this.playerDecks.get(playerId);
    const hand = this.playerHands.get(playerId);
    const player = this.state.players[playerId];

    if (!deck || !hand || !player) {
      return [];
    }

    const drawn: Card[] = [];

    for (let i = 0; i < count; i++) {
      // Reshuffle discard if deck is empty
      if (deck.isEmpty && deck.discardSize > 0) {
        deck.reshuffleDiscard();
      }

      if (deck.isEmpty) {
        break;
      }

      const card = deck.draw();
      if (card) {
        const overflow = hand.addCard(card) ? null : card;
        if (overflow) {
          // Hand is full, discard the card
          deck.discard(card);
          this.eventBus.emitSimple(
            'card_discarded',
            {
              playerId,
              cardId: card.id,
              reason: 'hand_full',
            },
            this.state
          );
        } else {
          drawn.push(card);
          // Sync to player state
          player.hand.push(card.getInstance());
          this.eventBus.emitSimple('card_drawn', { playerId, cardId: card.id }, this.state);
        }
      }
    }

    // Sync deck state
    player.deck = deck.getCards().map((c) => c.getInstance());

    return drawn;
  }

  /**
   * Play a card from hand
   */
  playCard(playerId: string, cardId: string, targets?: Record<string, string>): boolean {
    const hand = this.playerHands.get(playerId);
    const player = this.state.players[playerId];

    if (!hand || !player) {
      return false;
    }

    const card = hand.playCard(cardId);
    if (!card) {
      return false;
    }

    // Resolve card effects
    const context = {
      gameState: this.state,
      sourceCard: card,
      sourcePlayerId: playerId,
      targetPlayerId: targets?.player,
    };

    const results = this.effectResolver.resolveAll(card.effects, context);

    // Record action
    const action: GameAction = {
      id: generateId('action'),
      type: 'play_card',
      playerId,
      timestamp: Date.now(),
      payload: { cardId, targets },
      result: {
        success: true,
        effects: results,
      },
    };
    this.state.history.push(action);

    // Move card to play area or discard
    player.playArea.push(card.getInstance());

    // Sync hand state
    player.hand = hand.getCards().map((c) => c.getInstance());

    this.eventBus.emitSimple(
      'card_played',
      {
        playerId,
        cardId,
        effects: results,
      },
      this.state
    );

    return true;
  }

  /**
   * Discard a card from hand
   */
  discardCard(playerId: string, cardId: string): boolean {
    const hand = this.playerHands.get(playerId);
    const deck = this.playerDecks.get(playerId);
    const player = this.state.players[playerId];

    if (!hand || !deck || !player) {
      return false;
    }

    const card = hand.discardCard(cardId);
    if (!card) {
      return false;
    }

    deck.discard(card);

    // Sync states
    player.hand = hand.getCards().map((c) => c.getInstance());
    player.discardPile = deck.getDiscardPile().map((c) => c.getInstance());

    this.eventBus.emitSimple('card_discarded', { playerId, cardId }, this.state);

    return true;
  }

  /**
   * Modify a player's stat
   */
  modifyStat(playerId: string, stat: string, delta: number): boolean {
    const player = this.state.players[playerId];
    if (!player) return false;

    const before = player.stats[stat] ?? 0;
    player.stats[stat] = before + delta;

    this.eventBus.emitSimple(
      'stat_changed',
      {
        playerId,
        stat,
        before,
        after: player.stats[stat],
      },
      this.state
    );

    return true;
  }

  /**
   * Set a player's stat
   */
  setStat(playerId: string, stat: string, value: number): boolean {
    const player = this.state.players[playerId];
    if (!player) return false;

    const before = player.stats[stat] ?? 0;
    player.stats[stat] = value;

    this.eventBus.emitSimple(
      'stat_changed',
      {
        playerId,
        stat,
        before,
        after: value,
      },
      this.state
    );

    return true;
  }

  /**
   * Modify a player's resource
   */
  modifyResource(playerId: string, resource: string, delta: number): boolean {
    const player = this.state.players[playerId];
    if (!player) return false;

    const before = player.resources[resource] ?? 0;
    player.resources[resource] = Math.max(0, before + delta);

    this.eventBus.emitSimple(
      'resource_changed',
      {
        playerId,
        resource,
        before,
        after: player.resources[resource],
      },
      this.state
    );

    return true;
  }

  /**
   * End the current turn
   */
  endTurn(): void {
    const currentPlayer = this.state.currentPlayerId;

    this.eventBus.emitSimple(
      'turn_ended',
      {
        turn: this.state.turn,
        playerId: currentPlayer,
      },
      this.state
    );

    // Move to next player
    const playerIds = Object.keys(this.state.players);
    const currentIndex = playerIds.indexOf(currentPlayer);
    const nextIndex = (currentIndex + 1) % playerIds.length;

    this.state.currentPlayerId = playerIds[nextIndex];

    // Increment turn if we've gone around
    if (nextIndex === 0) {
      this.state.turn++;
    }

    // Tick modifiers
    const hand = this.playerHands.get(this.state.currentPlayerId);
    hand?.tickModifiers();

    this.setPhase('draw');

    this.eventBus.emitSimple(
      'turn_started',
      {
        turn: this.state.turn,
        playerId: this.state.currentPlayerId,
      },
      this.state
    );
  }

  /**
   * Check win conditions
   */
  checkWinConditions(): { winner: string | null; reason: string | null } {
    const { winConditions } = this.state.config;

    for (const condition of winConditions) {
      for (const player of Object.values(this.state.players)) {
        switch (condition.type) {
          case 'stat_threshold': {
            if (!condition.stat || condition.value === undefined || !condition.operator) break;
            const statValue = player.stats[condition.stat] ?? 0;
            if (this.checkThreshold(statValue, condition.operator, condition.value)) {
              return { winner: player.id, reason: `${condition.stat} reached ${condition.value}` };
            }
            break;
          }
          case 'resource_threshold': {
            if (!condition.stat || condition.value === undefined || !condition.operator) break;
            const resourceValue = player.resources[condition.stat] ?? 0;
            if (this.checkThreshold(resourceValue, condition.operator, condition.value)) {
              return { winner: player.id, reason: `${condition.stat} reached ${condition.value}` };
            }
            break;
          }
          case 'turn_limit': {
            if (condition.value !== undefined && this.state.turn >= condition.value) {
              // Find player with highest score (first stat)
              const statName = Object.keys(player.stats)[0];
              let highestPlayer = player;
              let highestValue = player.stats[statName] ?? 0;

              for (const p of Object.values(this.state.players)) {
                const val = p.stats[statName] ?? 0;
                if (val > highestValue) {
                  highestValue = val;
                  highestPlayer = p;
                }
              }

              return { winner: highestPlayer.id, reason: 'Turn limit reached' };
            }
            break;
          }
        }
      }
    }

    return { winner: null, reason: null };
  }

  private checkThreshold(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '>=':
        return value >= threshold;
      case '<=':
        return value <= threshold;
      case '==':
        return value === threshold;
      default:
        return false;
    }
  }

  /**
   * End the game
   */
  endGame(winnerId: string | null, reason: string): void {
    this.state.phase = 'game_over';

    this.eventBus.emitSimple(
      'game_ended',
      {
        winnerId,
        reason,
        finalState: deepClone(this.state),
      },
      this.state
    );
  }

  /**
   * Get action history
   */
  getHistory(): GameAction[] {
    return [...this.state.history];
  }

  /**
   * Set shared state value
   */
  setSharedState(key: string, value: unknown): void {
    this.state.sharedState[key] = value;
  }

  /**
   * Get shared state value
   */
  getSharedState<T>(key: string): T | undefined {
    return this.state.sharedState[key] as T | undefined;
  }

  /**
   * Reset the game
   */
  reset(): void {
    this.state = this.createInitialState(this.state.config);
    this.playerDecks.clear();
    this.playerHands.clear();
    this.eventBus.clearHistory();
  }
}
