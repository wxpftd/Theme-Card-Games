import { Card, CardFilter } from './Card';

/**
 * Hand class manages a player's hand of cards
 */
export class Hand {
  private cards: Card[] = [];
  private maxSize: number;

  constructor(maxSize: number = 10) {
    this.maxSize = maxSize;
  }

  // Getters
  get size(): number {
    return this.cards.length;
  }

  get isFull(): boolean {
    return this.cards.length >= this.maxSize;
  }

  get isEmpty(): boolean {
    return this.cards.length === 0;
  }

  get spaceRemaining(): number {
    return Math.max(0, this.maxSize - this.cards.length);
  }

  /**
   * Add a card to the hand
   * Returns false if hand is full
   */
  addCard(card: Card): boolean {
    if (this.isFull) {
      return false;
    }
    card.setState('in_hand');
    this.cards.push(card);
    return true;
  }

  /**
   * Add multiple cards to the hand
   * Returns cards that couldn't be added due to hand limit
   */
  addCards(cards: Card[]): Card[] {
    const overflow: Card[] = [];
    for (const card of cards) {
      if (!this.addCard(card)) {
        overflow.push(card);
      }
    }
    return overflow;
  }

  /**
   * Remove a specific card from the hand
   */
  removeCard(cardId: string): Card | null {
    const index = this.cards.findIndex(c => c.id === cardId);
    if (index === -1) return null;

    const [card] = this.cards.splice(index, 1);
    return card;
  }

  /**
   * Play a card from hand (removes and returns it)
   */
  playCard(cardId: string): Card | null {
    const card = this.removeCard(cardId);
    if (card) {
      card.setState('in_play');
    }
    return card;
  }

  /**
   * Discard a card from hand
   */
  discardCard(cardId: string): Card | null {
    const card = this.removeCard(cardId);
    if (card) {
      card.setState('discarded');
    }
    return card;
  }

  /**
   * Discard a random card
   */
  discardRandom(): Card | null {
    if (this.isEmpty) return null;

    const index = Math.floor(Math.random() * this.cards.length);
    const [card] = this.cards.splice(index, 1);
    card.setState('discarded');
    return card;
  }

  /**
   * Discard all cards
   */
  discardAll(): Card[] {
    const discarded = [...this.cards];
    discarded.forEach(c => c.setState('discarded'));
    this.cards = [];
    return discarded;
  }

  /**
   * Get a card by ID without removing it
   */
  getCard(cardId: string): Card | null {
    return this.cards.find(c => c.id === cardId) ?? null;
  }

  /**
   * Get a card by index
   */
  getCardAt(index: number): Card | null {
    return this.cards[index] ?? null;
  }

  /**
   * Get all cards
   */
  getCards(): Card[] {
    return [...this.cards];
  }

  /**
   * Find cards matching a filter
   */
  findCards(filter: CardFilter): Card[] {
    return this.cards.filter(card => card.matches(filter));
  }

  /**
   * Check if hand contains a card matching filter
   */
  hasCard(filter: CardFilter): boolean {
    return this.cards.some(card => card.matches(filter));
  }

  /**
   * Sort cards by a comparator
   */
  sort(comparator: (a: Card, b: Card) => number): void {
    this.cards.sort(comparator);
  }

  /**
   * Sort by cost (ascending)
   */
  sortByCost(): void {
    this.sort((a, b) => a.cost - b.cost);
  }

  /**
   * Sort by type
   */
  sortByType(): void {
    this.sort((a, b) => a.type.localeCompare(b.type));
  }

  /**
   * Set maximum hand size
   */
  setMaxSize(size: number): void {
    this.maxSize = size;
  }

  /**
   * Get maximum hand size
   */
  getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * Get cards that exceed hand limit
   */
  getOverflow(): Card[] {
    if (this.cards.length <= this.maxSize) {
      return [];
    }
    return this.cards.slice(this.maxSize);
  }

  /**
   * Remove cards that exceed hand limit
   */
  trimToLimit(): Card[] {
    if (this.cards.length <= this.maxSize) {
      return [];
    }
    const overflow = this.cards.splice(this.maxSize);
    overflow.forEach(c => c.setState('discarded'));
    return overflow;
  }

  /**
   * Tick all card modifiers
   */
  tickModifiers(): void {
    for (const card of this.cards) {
      card.tickModifiers();
    }
  }

  /**
   * Clear the hand
   */
  clear(): void {
    this.cards = [];
  }
}
