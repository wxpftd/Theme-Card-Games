import { CardDefinition } from '../types';
import { Card, CardFilter } from './Card';

/**
 * Deck class manages a collection of cards
 */
export class Deck {
  private cards: Card[] = [];
  private discardPile: Card[] = [];

  constructor(definitions?: CardDefinition[]) {
    if (definitions) {
      this.cards = definitions.map((def) => new Card(def));
    }
  }

  // Getters
  get size(): number {
    return this.cards.length;
  }

  get discardSize(): number {
    return this.discardPile.length;
  }

  get isEmpty(): boolean {
    return this.cards.length === 0;
  }

  get totalCards(): number {
    return this.cards.length + this.discardPile.length;
  }

  /**
   * Add a card to the deck
   */
  addCard(card: Card, position: 'top' | 'bottom' | 'random' = 'bottom'): void {
    card.setState('in_deck');

    switch (position) {
      case 'top':
        this.cards.unshift(card);
        break;
      case 'bottom':
        this.cards.push(card);
        break;
      case 'random':
        const index = Math.floor(Math.random() * (this.cards.length + 1));
        this.cards.splice(index, 0, card);
        break;
    }
  }

  /**
   * Add multiple cards to the deck
   */
  addCards(cards: Card[], position: 'top' | 'bottom' | 'random' = 'bottom'): void {
    for (const card of cards) {
      this.addCard(card, position);
    }
  }

  /**
   * Draw a card from the top of the deck
   */
  draw(): Card | null {
    const card = this.cards.shift() ?? null;
    if (card) {
      card.setState('in_hand');
    }
    return card;
  }

  /**
   * Draw multiple cards from the deck
   */
  drawMultiple(count: number): Card[] {
    const drawn: Card[] = [];
    for (let i = 0; i < count && !this.isEmpty; i++) {
      const card = this.draw();
      if (card) {
        drawn.push(card);
      }
    }
    return drawn;
  }

  /**
   * Draw a specific card by filter
   */
  drawSpecific(filter: CardFilter): Card | null {
    const index = this.cards.findIndex((card) => card.matches(filter));
    if (index === -1) return null;

    const [card] = this.cards.splice(index, 1);
    card.setState('in_hand');
    return card;
  }

  /**
   * Peek at the top card without drawing
   */
  peek(): Card | null {
    return this.cards[0] ?? null;
  }

  /**
   * Peek at the top N cards
   */
  peekMultiple(count: number): Card[] {
    return this.cards.slice(0, count);
  }

  /**
   * Shuffle the deck
   */
  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /**
   * Shuffle the discard pile back into the deck
   */
  reshuffleDiscard(): void {
    for (const card of this.discardPile) {
      card.setState('in_deck');
    }
    this.cards.push(...this.discardPile);
    this.discardPile = [];
    this.shuffle();
  }

  /**
   * Add a card to the discard pile
   */
  discard(card: Card): void {
    card.setState('discarded');
    this.discardPile.push(card);
  }

  /**
   * Discard multiple cards
   */
  discardMultiple(cards: Card[]): void {
    for (const card of cards) {
      this.discard(card);
    }
  }

  /**
   * Remove a card from the deck (not to discard)
   */
  remove(cardId: string): Card | null {
    const index = this.cards.findIndex((c) => c.id === cardId);
    if (index === -1) return null;

    const [card] = this.cards.splice(index, 1);
    card.setState('removed');
    return card;
  }

  /**
   * Find cards matching a filter
   */
  findCards(filter: CardFilter): Card[] {
    return this.cards.filter((card) => card.matches(filter));
  }

  /**
   * Get all cards in the deck
   */
  getCards(): Card[] {
    return [...this.cards];
  }

  /**
   * Get all cards in the discard pile
   */
  getDiscardPile(): Card[] {
    return [...this.discardPile];
  }

  /**
   * Clear the deck
   */
  clear(): void {
    this.cards = [];
    this.discardPile = [];
  }

  /**
   * Create a deck from card definitions with multipliers
   */
  static fromDefinitions(
    definitions: CardDefinition[],
    copies: number | Record<string, number> = 1
  ): Deck {
    const deck = new Deck();

    for (const def of definitions) {
      const count = typeof copies === 'number' ? copies : (copies[def.id] ?? 1);
      for (let i = 0; i < count; i++) {
        deck.addCard(new Card(def));
      }
    }

    return deck;
  }
}
