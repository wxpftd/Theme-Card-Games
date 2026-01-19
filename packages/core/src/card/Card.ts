import { CardDefinition, CardInstance, CardModifier, CardState, CardEffect } from '../types';
import { generateId } from '../utils';

/**
 * Card class represents a card instance in the game
 */
export class Card {
  private instance: CardInstance;
  private definition: CardDefinition;

  constructor(definition: CardDefinition, instanceId?: string) {
    this.definition = definition;
    this.instance = {
      instanceId: instanceId || generateId('card'),
      definitionId: definition.id,
      state: 'in_deck',
      modifiers: [],
    };
  }

  // Getters
  get id(): string {
    return this.instance.instanceId;
  }

  get definitionId(): string {
    return this.definition.id;
  }

  get name(): string {
    return this.definition.name;
  }

  get description(): string {
    return this.definition.description;
  }

  get type(): string {
    return this.definition.type;
  }

  get effects(): CardEffect[] {
    return this.definition.effects;
  }

  get cost(): number {
    const baseCost = this.definition.cost ?? 0;
    return this.getModifiedValue('cost', baseCost);
  }

  get rarity(): string | undefined {
    return this.definition.rarity;
  }

  get tags(): string[] {
    return this.definition.tags ?? [];
  }

  get state(): CardState {
    return this.instance.state;
  }

  get modifiers(): CardModifier[] {
    return [...this.instance.modifiers];
  }

  get metadata(): Record<string, unknown> {
    return this.definition.metadata ?? {};
  }

  // State management
  setState(state: CardState): void {
    this.instance.state = state;
  }

  // Modifier management
  addModifier(modifier: CardModifier): void {
    this.instance.modifiers.push(modifier);
  }

  removeModifier(modifierId: string): boolean {
    const index = this.instance.modifiers.findIndex(m => m.id === modifierId);
    if (index !== -1) {
      this.instance.modifiers.splice(index, 1);
      return true;
    }
    return false;
  }

  clearModifiers(): void {
    this.instance.modifiers = [];
  }

  /**
   * Tick modifier durations (call at end of turn)
   * Removes expired modifiers
   */
  tickModifiers(): CardModifier[] {
    const expired: CardModifier[] = [];

    this.instance.modifiers = this.instance.modifiers.filter(mod => {
      if (mod.duration === undefined || mod.duration === -1) {
        return true; // Permanent modifier
      }
      mod.duration--;
      if (mod.duration <= 0) {
        expired.push(mod);
        return false;
      }
      return true;
    });

    return expired;
  }

  /**
   * Get modified value considering all active modifiers
   */
  getModifiedValue(stat: string, baseValue: number): number {
    let value = baseValue;

    for (const mod of this.instance.modifiers) {
      if (mod.type === stat && typeof mod.value === 'number') {
        value += mod.value;
      }
    }

    return value;
  }

  /**
   * Check if card has a specific tag
   */
  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  /**
   * Check if card matches a filter
   */
  matches(filter: CardFilter): boolean {
    if (filter.type && this.type !== filter.type) return false;
    if (filter.rarity && this.rarity !== filter.rarity) return false;
    if (filter.tags && !filter.tags.every(t => this.hasTag(t))) return false;
    if (filter.state && this.state !== filter.state) return false;
    if (filter.minCost !== undefined && this.cost < filter.minCost) return false;
    if (filter.maxCost !== undefined && this.cost > filter.maxCost) return false;
    return true;
  }

  /**
   * Create a copy of this card
   */
  clone(): Card {
    const card = new Card(this.definition);
    card.instance = {
      ...this.instance,
      instanceId: generateId('card'),
      modifiers: [...this.instance.modifiers],
    };
    return card;
  }

  /**
   * Serialize to plain object
   */
  toJSON(): CardInstance & { definition: CardDefinition } {
    return {
      ...this.instance,
      definition: this.definition,
    };
  }

  /**
   * Get the raw definition
   */
  getDefinition(): CardDefinition {
    return this.definition;
  }

  /**
   * Get the raw instance
   */
  getInstance(): CardInstance {
    return { ...this.instance };
  }
}

export interface CardFilter {
  type?: string;
  rarity?: string;
  tags?: string[];
  state?: CardState;
  minCost?: number;
  maxCost?: number;
}
