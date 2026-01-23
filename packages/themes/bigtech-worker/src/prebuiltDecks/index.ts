/**
 * 预构筑卡组索引
 * Prebuilt Decks Index
 */

import type { DeckDefinition } from '@theme-card-games/core';

import { starterDeck } from './starterDeck';
import { hustlerDeck } from './hustlerDeck';
import { balanceDeck } from './balanceDeck';
import { investorDeck } from './investorDeck';

// 导出各预构筑卡组
export { starterDeck } from './starterDeck';
export { hustlerDeck } from './hustlerDeck';
export { balanceDeck } from './balanceDeck';
export { investorDeck } from './investorDeck';

/**
 * 所有预构筑卡组列表
 */
export const prebuiltDecks: DeckDefinition[] = [
  starterDeck,
  hustlerDeck,
  balanceDeck,
  investorDeck,
];

/**
 * 按 ID 获取预构筑卡组
 */
export function getPrebuiltDeckById(id: string): DeckDefinition | undefined {
  return prebuiltDecks.find((deck) => deck.id === id);
}

/**
 * 按标签过滤预构筑卡组
 */
export function getPrebuiltDecksByTag(tag: string): DeckDefinition[] {
  return prebuiltDecks.filter((deck) => deck.tags?.includes(tag));
}

/**
 * 获取推荐给新手的卡组
 */
export function getRecommendedDecks(): DeckDefinition[] {
  return prebuiltDecks.filter(
    (deck) => deck.tags?.includes('recommended') || deck.id === 'starter_deck'
  );
}

export default prebuiltDecks;
