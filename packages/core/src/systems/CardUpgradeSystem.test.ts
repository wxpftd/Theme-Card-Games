import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CardUpgradeSystem } from './CardUpgradeSystem';
import { EventBus } from '../event/EventBus';
import { CardUpgradeDefinition, CardDefinition, PlayerState, GameState } from '../types';
import { Deck } from '../card/Deck';

describe('CardUpgradeSystem', () => {
  let upgradeSystem: CardUpgradeSystem;
  let eventBus: EventBus;
  let cardDefinitions: Map<string, CardDefinition>;
  let player: PlayerState;
  let gameState: GameState;
  let deck: Deck;

  const mockCards: CardDefinition[] = [
    {
      id: 'overtime',
      type: 'event',
      name: 'Overtime',
      description: 'Work overtime',
      effects: [
        { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 10 },
      ],
      tags: ['work'],
    },
    {
      id: 'overtime_efficient',
      type: 'event',
      name: 'Efficient Overtime',
      description: 'Efficient overtime',
      effects: [
        { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 10 },
      ],
      tags: ['work', 'upgraded'],
    },
    {
      id: 'slacking',
      type: 'action',
      name: 'Slacking',
      description: 'Slack off',
      effects: [],
      tags: ['rest'],
    },
    {
      id: 'slacking_pro',
      type: 'action',
      name: 'Pro Slacking',
      description: 'Professional slacking',
      effects: [],
      tags: ['rest', 'upgraded'],
    },
  ];

  const mockUpgrades: CardUpgradeDefinition[] = [
    {
      id: 'upgrade_overtime',
      sourceCardId: 'overtime',
      targetCardId: 'overtime_efficient',
      upgradeCondition: { type: 'use_count', count: 3 },
      description: 'Use overtime 3 times to upgrade',
    },
    {
      id: 'upgrade_slacking',
      sourceCardId: 'slacking',
      targetCardId: 'slacking_pro',
      upgradeCondition: { type: 'stat_threshold', stat: 'performance', operator: '>=', value: 70 },
      description: 'Upgrade when performance >= 70',
    },
  ];

  beforeEach(() => {
    eventBus = new EventBus();
    cardDefinitions = new Map(mockCards.map((c) => [c.id, c]));

    upgradeSystem = new CardUpgradeSystem({
      upgradeDefinitions: mockUpgrades,
      cardDefinitions,
      eventBus,
    });

    player = {
      id: 'player1',
      name: 'Test Player',
      stats: { performance: 50, health: 80 },
      resources: { energy: 5 },
      statuses: [],
      hand: [{ instanceId: 'card-1', definitionId: 'overtime', state: 'in_hand', modifiers: [] }],
      deck: [{ instanceId: 'card-2', definitionId: 'overtime', state: 'in_deck', modifiers: [] }],
      discardPile: [
        { instanceId: 'card-3', definitionId: 'overtime', state: 'discarded', modifiers: [] },
      ],
      playArea: [],
    };

    gameState = {
      id: 'test-game',
      phase: 'main',
      turn: 1,
      currentPlayerId: 'player1',
      players: { player1: player },
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

    // Create a mock deck
    deck = Deck.fromDefinitions([mockCards[0]]);

    upgradeSystem.initializePlayer('player1');
  });

  describe('use_count upgrade', () => {
    it('should track card usage', () => {
      upgradeSystem.onCardPlayed('player1', 'overtime', player, gameState, deck);
      expect(upgradeSystem.getCardUsageCount('player1', 'overtime')).toBe(1);

      upgradeSystem.onCardPlayed('player1', 'overtime', player, gameState, deck);
      expect(upgradeSystem.getCardUsageCount('player1', 'overtime')).toBe(2);
    });

    it('should upgrade card after reaching use count threshold', () => {
      // Play card 3 times
      upgradeSystem.onCardPlayed('player1', 'overtime', player, gameState, deck);
      upgradeSystem.onCardPlayed('player1', 'overtime', player, gameState, deck);
      const results = upgradeSystem.onCardPlayed('player1', 'overtime', player, gameState, deck);

      expect(results.length).toBe(1);
      expect(results[0].upgraded).toBe(true);
      expect(results[0].targetCardId).toBe('overtime_efficient');
    });

    it('should not upgrade again after already upgraded', () => {
      // Upgrade once
      upgradeSystem.onCardPlayed('player1', 'overtime', player, gameState, deck);
      upgradeSystem.onCardPlayed('player1', 'overtime', player, gameState, deck);
      upgradeSystem.onCardPlayed('player1', 'overtime', player, gameState, deck);

      // Try to use more
      const results = upgradeSystem.onCardPlayed('player1', 'overtime', player, gameState, deck);
      expect(results.length).toBe(0); // No new upgrades

      expect(upgradeSystem.isCardUpgraded('player1', 'overtime')).toBe(true);
    });

    it('should emit card_upgraded event', () => {
      const handler = vi.fn();
      eventBus.on('card_upgraded', handler);

      upgradeSystem.onCardPlayed('player1', 'overtime', player, gameState, deck);
      upgradeSystem.onCardPlayed('player1', 'overtime', player, gameState, deck);
      upgradeSystem.onCardPlayed('player1', 'overtime', player, gameState, deck);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'card_upgraded',
          data: expect.objectContaining({
            playerId: 'player1',
            sourceCardId: 'overtime',
            targetCardId: 'overtime_efficient',
          }),
        }),
        expect.anything()
      );
    });
  });

  describe('stat_threshold upgrade', () => {
    it('should upgrade when stat threshold is met', () => {
      player.stats.performance = 70; // Meet threshold
      // Add slacking cards to player state
      player.hand.push({
        instanceId: 'slacking-1',
        definitionId: 'slacking',
        state: 'in_hand',
        modifiers: [],
      });
      player.deck.push({
        instanceId: 'slacking-2',
        definitionId: 'slacking',
        state: 'in_deck',
        modifiers: [],
      });

      // Use deck with slacking cards
      const slackingDeck = Deck.fromDefinitions([mockCards[2]]); // slacking card

      const results = upgradeSystem.onCardPlayed(
        'player1',
        'slacking',
        player,
        gameState,
        slackingDeck
      );

      expect(results.some((r) => r.targetCardId === 'slacking_pro')).toBe(true);
    });

    it('should not upgrade when stat threshold is not met', () => {
      player.stats.performance = 50; // Below threshold
      player.hand.push({
        instanceId: 'slacking-1',
        definitionId: 'slacking',
        state: 'in_hand',
        modifiers: [],
      });

      const slackingDeck = Deck.fromDefinitions([mockCards[2]]); // slacking card

      const results = upgradeSystem.onCardPlayed(
        'player1',
        'slacking',
        player,
        gameState,
        slackingDeck
      );

      expect(results.some((r) => r.targetCardId === 'slacking_pro')).toBe(false);
    });
  });

  describe('getUpgradesForCard', () => {
    it('should return upgrades available for a card', () => {
      const upgrades = upgradeSystem.getUpgradesForCard('overtime');
      expect(upgrades.length).toBe(1);
      expect(upgrades[0].targetCardId).toBe('overtime_efficient');
    });

    it('should return empty array for cards with no upgrades', () => {
      const upgrades = upgradeSystem.getUpgradesForCard('nonexistent');
      expect(upgrades.length).toBe(0);
    });
  });

  describe('getPlayerUsage', () => {
    it('should return all usage trackers for a player', () => {
      upgradeSystem.onCardPlayed('player1', 'overtime', player, gameState, deck);
      upgradeSystem.onCardPlayed('player1', 'slacking', player, gameState, deck);

      const usage = upgradeSystem.getPlayerUsage('player1');
      expect(usage.length).toBe(2);
    });
  });

  describe('reset', () => {
    it('should clear all tracking data', () => {
      upgradeSystem.onCardPlayed('player1', 'overtime', player, gameState, deck);
      expect(upgradeSystem.getCardUsageCount('player1', 'overtime')).toBe(1);

      upgradeSystem.reset();
      expect(upgradeSystem.getCardUsageCount('player1', 'overtime')).toBe(0);
    });
  });
});
