import {
  CardUpgradeDefinition,
  CardUsageTracker,
  CardDefinition,
  PlayerState,
  GameState,
  UpgradeCondition,
} from '../types';
import { EventBus } from '../event';
import { Card } from '../card/Card';
import { Deck } from '../card/Deck';

export interface CardUpgradeSystemOptions {
  upgradeDefinitions: CardUpgradeDefinition[];
  cardDefinitions: Map<string, CardDefinition>;
  eventBus: EventBus;
}

export interface UpgradeResult {
  upgraded: boolean;
  sourceCardId: string;
  targetCardId: string;
  upgradeName?: string;
}

/**
 * CardUpgradeSystem manages card evolution based on usage
 */
export class CardUpgradeSystem {
  private upgrades: Map<string, CardUpgradeDefinition> = new Map();
  private cardDefinitions: Map<string, CardDefinition>;
  private eventBus: EventBus;

  // Per-player card usage tracking
  private playerUsage: Map<string, Map<string, CardUsageTracker>> = new Map();

  // Combo trigger tracking for upgrade conditions
  private comboTriggerCounts: Map<string, Map<string, number>> = new Map();

  constructor(options: CardUpgradeSystemOptions) {
    this.cardDefinitions = options.cardDefinitions;
    this.eventBus = options.eventBus;

    for (const upgrade of options.upgradeDefinitions) {
      this.upgrades.set(upgrade.id, upgrade);
    }

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for combo triggers to track for upgrade conditions
    this.eventBus.on('combo_triggered', (event) => {
      const playerId = event.data.playerId as string;
      const comboId = event.data.comboId as string;
      this.trackComboTrigger(playerId, comboId);
    });
  }

  /**
   * Initialize tracking for a player
   */
  initializePlayer(playerId: string): void {
    this.playerUsage.set(playerId, new Map());
    this.comboTriggerCounts.set(playerId, new Map());
  }

  /**
   * Track a combo trigger for a player
   */
  private trackComboTrigger(playerId: string, comboId: string): void {
    let playerCombos = this.comboTriggerCounts.get(playerId);
    if (!playerCombos) {
      playerCombos = new Map();
      this.comboTriggerCounts.set(playerId, playerCombos);
    }

    const current = playerCombos.get(comboId) ?? 0;
    playerCombos.set(comboId, current + 1);
  }

  /**
   * Record a card being played and check for upgrades
   */
  onCardPlayed(
    playerId: string,
    cardId: string,
    player: PlayerState,
    gameState: GameState,
    deck: Deck
  ): UpgradeResult[] {
    const tracker = this.getOrCreateTracker(playerId, cardId);
    tracker.useCount++;

    // Check all upgrades that apply to this card
    const upgrades: UpgradeResult[] = [];

    for (const upgrade of this.upgrades.values()) {
      if (upgrade.sourceCardId !== cardId) continue;
      if (tracker.upgraded) continue;

      if (this.checkUpgradeCondition(upgrade.upgradeCondition, playerId, player, gameState)) {
        // Perform the upgrade
        const result = this.performUpgrade(playerId, upgrade, player, deck, gameState);
        if (result.upgraded) {
          tracker.upgraded = true;
          upgrades.push(result);
        }
      }
    }

    return upgrades;
  }

  /**
   * Check if an upgrade condition is met
   */
  private checkUpgradeCondition(
    condition: UpgradeCondition,
    playerId: string,
    player: PlayerState,
    _gameState: GameState
  ): boolean {
    switch (condition.type) {
      case 'use_count': {
        // This is checked by the tracker in onCardPlayed
        const tracker = this.playerUsage.get(playerId);
        if (!tracker) return false;

        // Find the source card tracker
        for (const upgrade of this.upgrades.values()) {
          if (upgrade.upgradeCondition === condition) {
            const cardTracker = tracker.get(upgrade.sourceCardId);
            if (cardTracker && cardTracker.useCount >= condition.count) {
              return true;
            }
          }
        }
        return false;
      }

      case 'stat_threshold': {
        const value = player.stats[condition.stat] ?? 0;
        return this.compareValues(value, condition.operator, condition.value);
      }

      case 'resource_threshold': {
        const value = player.resources[condition.resource] ?? 0;
        return this.compareValues(value, condition.operator, condition.value);
      }

      case 'combo_triggered': {
        const playerCombos = this.comboTriggerCounts.get(playerId);
        if (!playerCombos) return false;

        const count = playerCombos.get(condition.comboId) ?? 0;
        return count >= (condition.count ?? 1);
      }

      default:
        return false;
    }
  }

  /**
   * Compare values with operator
   */
  private compareValues(actual: number, operator: string, expected: number): boolean {
    switch (operator) {
      case '>':
        return actual > expected;
      case '<':
        return actual < expected;
      case '==':
        return actual === expected;
      case '>=':
        return actual >= expected;
      case '<=':
        return actual <= expected;
      case '!=':
        return actual !== expected;
      default:
        return false;
    }
  }

  /**
   * Perform the actual card upgrade
   */
  private performUpgrade(
    playerId: string,
    upgrade: CardUpgradeDefinition,
    player: PlayerState,
    deck: Deck,
    gameState: GameState
  ): UpgradeResult {
    const targetDef = this.cardDefinitions.get(upgrade.targetCardId);
    if (!targetDef) {
      console.warn(`Target card definition not found: ${upgrade.targetCardId}`);
      return {
        upgraded: false,
        sourceCardId: upgrade.sourceCardId,
        targetCardId: upgrade.targetCardId,
      };
    }

    // Find and replace cards in deck, hand, and discard pile
    let replacedCount = 0;

    // Replace in deck
    const deckCards = deck.getCards();
    for (let i = 0; i < deckCards.length; i++) {
      const card = deckCards[i];
      if (card.definitionId === upgrade.sourceCardId) {
        // Create upgraded card with same instance ID
        const upgradedCard = new Card(targetDef, card.id);
        // Replace in array (deck exposes getCards as readonly, need to work around)
        (deckCards as Card[])[i] = upgradedCard;
        replacedCount++;
      }
    }

    // Replace in player's hand state
    for (let i = 0; i < player.hand.length; i++) {
      if (player.hand[i].definitionId === upgrade.sourceCardId) {
        player.hand[i] = {
          ...player.hand[i],
          definitionId: upgrade.targetCardId,
        };
        replacedCount++;
      }
    }

    // Replace in player's deck state
    for (let i = 0; i < player.deck.length; i++) {
      if (player.deck[i].definitionId === upgrade.sourceCardId) {
        player.deck[i] = {
          ...player.deck[i],
          definitionId: upgrade.targetCardId,
        };
      }
    }

    // Replace in discard pile
    for (let i = 0; i < player.discardPile.length; i++) {
      if (player.discardPile[i].definitionId === upgrade.sourceCardId) {
        player.discardPile[i] = {
          ...player.discardPile[i],
          definitionId: upgrade.targetCardId,
        };
        replacedCount++;
      }
    }

    // Replace in play area
    for (let i = 0; i < player.playArea.length; i++) {
      if (player.playArea[i].definitionId === upgrade.sourceCardId) {
        player.playArea[i] = {
          ...player.playArea[i],
          definitionId: upgrade.targetCardId,
        };
        replacedCount++;
      }
    }

    if (replacedCount > 0) {
      // Emit upgrade event
      this.eventBus.emitSimple(
        'card_upgraded',
        {
          playerId,
          sourceCardId: upgrade.sourceCardId,
          targetCardId: upgrade.targetCardId,
          upgradeName: targetDef.name,
          count: replacedCount,
        },
        gameState
      );
    }

    return {
      upgraded: replacedCount > 0,
      sourceCardId: upgrade.sourceCardId,
      targetCardId: upgrade.targetCardId,
      upgradeName: targetDef.name,
    };
  }

  /**
   * Get or create a usage tracker for a card
   */
  private getOrCreateTracker(playerId: string, cardId: string): CardUsageTracker {
    let playerTrackers = this.playerUsage.get(playerId);
    if (!playerTrackers) {
      playerTrackers = new Map();
      this.playerUsage.set(playerId, playerTrackers);
    }

    let tracker = playerTrackers.get(cardId);
    if (!tracker) {
      tracker = {
        cardId,
        useCount: 0,
        upgraded: false,
      };
      playerTrackers.set(cardId, tracker);
    }

    return tracker;
  }

  /**
   * Get usage stats for a player
   */
  getPlayerUsage(playerId: string): CardUsageTracker[] {
    const trackers = this.playerUsage.get(playerId);
    if (!trackers) return [];
    return Array.from(trackers.values());
  }

  /**
   * Get usage count for a specific card
   */
  getCardUsageCount(playerId: string, cardId: string): number {
    const trackers = this.playerUsage.get(playerId);
    if (!trackers) return 0;
    return trackers.get(cardId)?.useCount ?? 0;
  }

  /**
   * Check if a card has been upgraded
   */
  isCardUpgraded(playerId: string, cardId: string): boolean {
    const trackers = this.playerUsage.get(playerId);
    if (!trackers) return false;
    return trackers.get(cardId)?.upgraded ?? false;
  }

  /**
   * Get all upgrade definitions
   */
  getUpgradeDefinitions(): CardUpgradeDefinition[] {
    return Array.from(this.upgrades.values());
  }

  /**
   * Get upgrades available for a specific card
   */
  getUpgradesForCard(cardId: string): CardUpgradeDefinition[] {
    return Array.from(this.upgrades.values()).filter((u) => u.sourceCardId === cardId);
  }

  /**
   * Add a new upgrade definition
   */
  addUpgrade(upgrade: CardUpgradeDefinition): void {
    this.upgrades.set(upgrade.id, upgrade);
  }

  /**
   * Remove an upgrade definition
   */
  removeUpgrade(upgradeId: string): boolean {
    return this.upgrades.delete(upgradeId);
  }

  /**
   * Reset all player tracking
   */
  reset(): void {
    this.playerUsage.clear();
    this.comboTriggerCounts.clear();
  }
}
