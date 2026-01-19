import { describe, it, expect } from 'vitest';
import { Card } from './Card';
import { CardDefinition } from '../types';

const createTestCardDefinition = (overrides: Partial<CardDefinition> = {}): CardDefinition => ({
  id: 'test-card',
  type: 'action',
  name: 'Test Card',
  description: 'A test card for unit tests',
  effects: [],
  cost: 2,
  rarity: 'common',
  tags: ['test', 'basic'],
  ...overrides,
});

describe('Card', () => {
  describe('constructor', () => {
    it('should create a card with the given definition', () => {
      const definition = createTestCardDefinition();
      const card = new Card(definition);

      expect(card.definitionId).toBe('test-card');
      expect(card.name).toBe('Test Card');
      expect(card.description).toBe('A test card for unit tests');
      expect(card.type).toBe('action');
      expect(card.cost).toBe(2);
      expect(card.rarity).toBe('common');
    });

    it('should generate a unique instance ID', () => {
      const definition = createTestCardDefinition();
      const card1 = new Card(definition);
      const card2 = new Card(definition);

      expect(card1.id).not.toBe(card2.id);
      expect(card1.id).toMatch(/^card_/);
    });

    it('should start in "in_deck" state', () => {
      const card = new Card(createTestCardDefinition());
      expect(card.state).toBe('in_deck');
    });

    it('should start with no modifiers', () => {
      const card = new Card(createTestCardDefinition());
      expect(card.modifiers).toEqual([]);
    });
  });

  describe('state management', () => {
    it('should update state correctly', () => {
      const card = new Card(createTestCardDefinition());

      card.setState('in_hand');
      expect(card.state).toBe('in_hand');

      card.setState('in_play');
      expect(card.state).toBe('in_play');

      card.setState('discarded');
      expect(card.state).toBe('discarded');
    });
  });

  describe('modifier management', () => {
    it('should add modifiers', () => {
      const card = new Card(createTestCardDefinition());
      card.addModifier({
        id: 'mod-1',
        type: 'cost',
        value: -1,
        duration: 2,
      });

      expect(card.modifiers).toHaveLength(1);
      expect(card.modifiers[0].id).toBe('mod-1');
    });

    it('should remove modifiers by ID', () => {
      const card = new Card(createTestCardDefinition());
      card.addModifier({ id: 'mod-1', type: 'cost', value: -1 });
      card.addModifier({ id: 'mod-2', type: 'damage', value: 1 });

      const removed = card.removeModifier('mod-1');
      expect(removed).toBe(true);
      expect(card.modifiers).toHaveLength(1);
      expect(card.modifiers[0].id).toBe('mod-2');
    });

    it('should return false when removing non-existent modifier', () => {
      const card = new Card(createTestCardDefinition());
      const removed = card.removeModifier('non-existent');
      expect(removed).toBe(false);
    });

    it('should clear all modifiers', () => {
      const card = new Card(createTestCardDefinition());
      card.addModifier({ id: 'mod-1', type: 'cost', value: -1 });
      card.addModifier({ id: 'mod-2', type: 'damage', value: 1 });

      card.clearModifiers();
      expect(card.modifiers).toHaveLength(0);
    });

    it('should tick modifier durations and remove expired ones', () => {
      const card = new Card(createTestCardDefinition());
      card.addModifier({ id: 'mod-1', type: 'cost', value: -1, duration: 2 });
      card.addModifier({ id: 'mod-2', type: 'damage', value: 1, duration: 1 });
      card.addModifier({ id: 'mod-3', type: 'health', value: 5, duration: -1 }); // permanent

      let expired = card.tickModifiers();
      expect(expired).toHaveLength(1);
      expect(expired[0].id).toBe('mod-2');
      expect(card.modifiers).toHaveLength(2);

      expired = card.tickModifiers();
      expect(expired).toHaveLength(1);
      expect(expired[0].id).toBe('mod-1');
      expect(card.modifiers).toHaveLength(1);
      expect(card.modifiers[0].id).toBe('mod-3');
    });
  });

  describe('getModifiedValue', () => {
    it('should return base value when no modifiers', () => {
      const card = new Card(createTestCardDefinition({ cost: 3 }));
      expect(card.cost).toBe(3);
    });

    it('should apply cost modifiers', () => {
      const card = new Card(createTestCardDefinition({ cost: 3 }));
      card.addModifier({ id: 'mod-1', type: 'cost', value: -1 });
      card.addModifier({ id: 'mod-2', type: 'cost', value: 2 });

      expect(card.cost).toBe(4); // 3 - 1 + 2
    });
  });

  describe('tags', () => {
    it('should check for tags correctly', () => {
      const card = new Card(createTestCardDefinition({ tags: ['attack', 'fire'] }));

      expect(card.hasTag('attack')).toBe(true);
      expect(card.hasTag('fire')).toBe(true);
      expect(card.hasTag('water')).toBe(false);
    });

    it('should handle cards without tags', () => {
      const card = new Card(createTestCardDefinition({ tags: undefined }));
      expect(card.tags).toEqual([]);
      expect(card.hasTag('any')).toBe(false);
    });
  });

  describe('matches', () => {
    it('should match by type', () => {
      const card = new Card(createTestCardDefinition({ type: 'action' }));

      expect(card.matches({ type: 'action' })).toBe(true);
      expect(card.matches({ type: 'event' })).toBe(false);
    });

    it('should match by rarity', () => {
      const card = new Card(createTestCardDefinition({ rarity: 'rare' }));

      expect(card.matches({ rarity: 'rare' })).toBe(true);
      expect(card.matches({ rarity: 'common' })).toBe(false);
    });

    it('should match by tags', () => {
      const card = new Card(createTestCardDefinition({ tags: ['attack', 'fire'] }));

      expect(card.matches({ tags: ['attack'] })).toBe(true);
      expect(card.matches({ tags: ['attack', 'fire'] })).toBe(true);
      expect(card.matches({ tags: ['attack', 'water'] })).toBe(false);
    });

    it('should match by cost range', () => {
      const card = new Card(createTestCardDefinition({ cost: 3 }));

      expect(card.matches({ minCost: 2 })).toBe(true);
      expect(card.matches({ maxCost: 5 })).toBe(true);
      expect(card.matches({ minCost: 2, maxCost: 5 })).toBe(true);
      expect(card.matches({ minCost: 4 })).toBe(false);
      expect(card.matches({ maxCost: 2 })).toBe(false);
    });
  });

  describe('clone', () => {
    it('should create an independent copy', () => {
      const card = new Card(createTestCardDefinition());
      card.setState('in_hand');
      card.addModifier({ id: 'mod-1', type: 'cost', value: -1 });

      const cloned = card.clone();

      expect(cloned.id).not.toBe(card.id);
      expect(cloned.definitionId).toBe(card.definitionId);
      expect(cloned.name).toBe(card.name);
    });
  });

  describe('toJSON', () => {
    it('should serialize card to JSON', () => {
      const card = new Card(createTestCardDefinition());
      const json = card.toJSON();

      expect(json.instanceId).toBe(card.id);
      expect(json.definitionId).toBe('test-card');
      expect(json.state).toBe('in_deck');
      expect(json.definition.name).toBe('Test Card');
    });
  });
});
