/**
 * 卡牌系列索引
 * Card Series Index
 */

import type { CardDefinitionV2, CardSeriesConfig, SeriesFocusBonus } from './types';
import { seriesConfigs, getSeriesFocusBonuses } from './types';

// 导入各系列卡牌
import { environmentCards } from './environment';
import { businessCards } from './business';
import { healthCards } from './health';
import { accidentCards } from './accident';
import { socialCards } from './social';
import { growthCards } from './growth';
import { workCards } from './work';

// 导出各系列卡牌
export { environmentCards } from './environment';
export { businessCards } from './business';
export { healthCards } from './health';
export { accidentCards } from './accident';
export { socialCards } from './social';
export { growthCards } from './growth';
export { workCards } from './work';

// 导出类型和配置
export { seriesConfigs, getSeriesFocusBonuses };
export type { CardDefinitionV2, CardSeriesConfig, SeriesFocusBonus };

/**
 * 所有系列卡牌合集
 */
export const allSeriesCards: CardDefinitionV2[] = [
  ...environmentCards,
  ...businessCards,
  ...healthCards,
  ...accidentCards,
  ...socialCards,
  ...growthCards,
  ...workCards,
];

/**
 * 按系列分组的卡牌
 */
export const cardsBySeries: Record<string, CardDefinitionV2[]> = {
  environment: environmentCards,
  business: businessCards,
  health: healthCards,
  accident: accidentCards,
  social: socialCards,
  growth: growthCards,
  work: workCards,
  neutral: [], // 中立卡牌（暂无）
};

/**
 * 获取指定系列的所有卡牌
 */
export function getCardsBySeries(series: string): CardDefinitionV2[] {
  return cardsBySeries[series] ?? [];
}

/**
 * 获取卡牌总数统计
 */
export function getCardStats(): {
  total: number;
  bySeries: Record<string, number>;
  byRarity: Record<string, number>;
} {
  const bySeries: Record<string, number> = {};
  const byRarity: Record<string, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    legendary: 0,
  };

  for (const card of allSeriesCards) {
    // 统计系列
    bySeries[card.series] = (bySeries[card.series] ?? 0) + 1;
    // 统计稀有度
    const rarity = card.rarity ?? 'common';
    byRarity[rarity] = (byRarity[rarity] ?? 0) + 1;
  }

  return {
    total: allSeriesCards.length,
    bySeries,
    byRarity,
  };
}

/**
 * 按 ID 查找卡牌
 */
export function findCardById(cardId: string): CardDefinitionV2 | undefined {
  return allSeriesCards.find((card) => card.id === cardId);
}

/**
 * 按标签查找卡牌
 */
export function findCardsByTag(tag: string): CardDefinitionV2[] {
  return allSeriesCards.filter((card) => card.tags?.includes(tag));
}

/**
 * 按稀有度查找卡牌
 */
export function findCardsByRarity(rarity: string): CardDefinitionV2[] {
  return allSeriesCards.filter((card) => (card.rarity ?? 'common') === rarity);
}
