import { describe, it, expect } from 'vitest';
import { Deck } from './Deck';
import { Card } from './Card';
import { CardDefinition } from '../types';

const createTestCardDefinition = (id: string, type: string = 'action'): CardDefinition => ({
  id,
  type: type as 'action' | 'event',
  name: `Card ${id}`,
  description: `Description for ${id}`,
  effects: [],
  cost: 1,
  rarity: 'common',
  tags: [],
});

describe('Deck', () => {
  describe('constructor', () => {
    it('should create an empty deck', () => {
      const deck = new Deck();
      expect(deck.size).toBe(0);
      expect(deck.isEmpty).toBe(true);
    });

    it('should create a deck from definitions', () => {
      const definitions = [createTestCardDefinition('card-1'), createTestCardDefinition('card-2')];

      const deck = new Deck(definitions);
      expect(deck.size).toBe(2);
      expect(deck.isEmpty).toBe(false);
    });
  });

  describe('addCard', () => {
    it('should add card to bottom by default', () => {
      const deck = new Deck();
      const card1 = new Card(createTestCardDefinition('card-1'));
      const card2 = new Card(createTestCardDefinition('card-2'));

      deck.addCard(card1);
      deck.addCard(card2);

      expect(deck.peek()?.definitionId).toBe('card-1');
    });

    it('should add card to top', () => {
      const deck = new Deck();
      const card1 = new Card(createTestCardDefinition('card-1'));
      const card2 = new Card(createTestCardDefinition('card-2'));

      deck.addCard(card1);
      deck.addCard(card2, 'top');

      expect(deck.peek()?.definitionId).toBe('card-2');
    });

    it('should set card state to in_deck', () => {
      const deck = new Deck();
      const card = new Card(createTestCardDefinition('card-1'));
      card.setState('in_hand');

      deck.addCard(card);
      expect(card.state).toBe('in_deck');
    });
  });

  describe('draw', () => {
    it('should draw card from top', () => {
      const deck = new Deck([
        createTestCardDefinition('card-1'),
        createTestCardDefinition('card-2'),
      ]);

      const drawn = deck.draw();
      expect(drawn?.definitionId).toBe('card-1');
      expect(deck.size).toBe(1);
    });

    it('should set drawn card state to in_hand', () => {
      const deck = new Deck([createTestCardDefinition('card-1')]);
      const drawn = deck.draw();
      expect(drawn?.state).toBe('in_hand');
    });

    it('should return null when deck is empty', () => {
      const deck = new Deck();
      const drawn = deck.draw();
      expect(drawn).toBeNull();
    });
  });

  describe('drawMultiple', () => {
    it('should draw multiple cards', () => {
      const deck = new Deck([
        createTestCardDefinition('card-1'),
        createTestCardDefinition('card-2'),
        createTestCardDefinition('card-3'),
      ]);

      const drawn = deck.drawMultiple(2);
      expect(drawn).toHaveLength(2);
      expect(deck.size).toBe(1);
    });

    it('should draw only available cards', () => {
      const deck = new Deck([createTestCardDefinition('card-1')]);

      const drawn = deck.drawMultiple(5);
      expect(drawn).toHaveLength(1);
      expect(deck.isEmpty).toBe(true);
    });
  });

  describe('peek', () => {
    it('should return top card without removing it', () => {
      const deck = new Deck([createTestCardDefinition('card-1')]);

      const peeked = deck.peek();
      expect(peeked?.definitionId).toBe('card-1');
      expect(deck.size).toBe(1);
    });

    it('should return null when deck is empty', () => {
      const deck = new Deck();
      expect(deck.peek()).toBeNull();
    });
  });

  describe('peekMultiple', () => {
    it('should return multiple cards without removing them', () => {
      const deck = new Deck([
        createTestCardDefinition('card-1'),
        createTestCardDefinition('card-2'),
        createTestCardDefinition('card-3'),
      ]);

      const peeked = deck.peekMultiple(2);
      expect(peeked).toHaveLength(2);
      expect(deck.size).toBe(3);
    });
  });

  describe('discard', () => {
    it('should add card to discard pile', () => {
      const deck = new Deck([createTestCardDefinition('card-1')]);
      const card = deck.draw()!;

      deck.discard(card);
      expect(deck.discardSize).toBe(1);
      expect(card.state).toBe('discarded');
    });
  });

  describe('reshuffleDiscard', () => {
    it('should move discard pile to deck', () => {
      const deck = new Deck([
        createTestCardDefinition('card-1'),
        createTestCardDefinition('card-2'),
      ]);

      const card1 = deck.draw()!;
      const card2 = deck.draw()!;
      deck.discard(card1);
      deck.discard(card2);

      expect(deck.isEmpty).toBe(true);
      expect(deck.discardSize).toBe(2);

      deck.reshuffleDiscard();

      expect(deck.size).toBe(2);
      expect(deck.discardSize).toBe(0);
    });

    it('should set reshuffled cards to in_deck state', () => {
      const deck = new Deck([createTestCardDefinition('card-1')]);
      const card = deck.draw()!;
      deck.discard(card);
      deck.reshuffleDiscard();

      const cards = deck.getCards();
      expect(cards[0].state).toBe('in_deck');
    });
  });

  describe('remove', () => {
    it('should remove card by ID', () => {
      const deck = new Deck([createTestCardDefinition('card-1')]);
      const cardId = deck.peek()!.id;

      const removed = deck.remove(cardId);
      expect(removed).not.toBeNull();
      expect(removed?.state).toBe('removed');
      expect(deck.isEmpty).toBe(true);
    });

    it('should return null for non-existent card', () => {
      const deck = new Deck([createTestCardDefinition('card-1')]);
      const removed = deck.remove('non-existent');
      expect(removed).toBeNull();
    });
  });

  describe('findCards', () => {
    it('should find cards matching filter', () => {
      const deck = new Deck([
        createTestCardDefinition('card-1', 'action'),
        createTestCardDefinition('card-2', 'event'),
        createTestCardDefinition('card-3', 'action'),
      ]);

      const actions = deck.findCards({ type: 'action' });
      expect(actions).toHaveLength(2);
    });
  });

  describe('totalCards', () => {
    it('should count cards in deck and discard pile', () => {
      const deck = new Deck([
        createTestCardDefinition('card-1'),
        createTestCardDefinition('card-2'),
        createTestCardDefinition('card-3'),
      ]);

      const card = deck.draw()!;
      deck.discard(card);

      expect(deck.totalCards).toBe(3);
      expect(deck.size).toBe(2);
      expect(deck.discardSize).toBe(1);
    });
  });

  describe('fromDefinitions', () => {
    it('should create deck with multiple copies', () => {
      const definitions = [createTestCardDefinition('card-1')];
      const deck = Deck.fromDefinitions(definitions, 3);

      expect(deck.size).toBe(3);
    });

    it('should create deck with per-card copies', () => {
      const definitions = [createTestCardDefinition('card-1'), createTestCardDefinition('card-2')];
      const deck = Deck.fromDefinitions(definitions, { 'card-1': 2, 'card-2': 3 });

      expect(deck.size).toBe(5);
    });
  });

  describe('clear', () => {
    it('should remove all cards', () => {
      const deck = new Deck([
        createTestCardDefinition('card-1'),
        createTestCardDefinition('card-2'),
      ]);
      const card = deck.draw()!;
      deck.discard(card);

      deck.clear();

      expect(deck.size).toBe(0);
      expect(deck.discardSize).toBe(0);
      expect(deck.totalCards).toBe(0);
    });
  });
});
