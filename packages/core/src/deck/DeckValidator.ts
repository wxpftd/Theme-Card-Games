/**
 * 卡组验证器
 * Deck Validator - 验证卡组是否符合构建规则
 */

import type {
  CardDefinition,
  CardDefinitionV2,
  CardRarity,
  DeckBuildingRules,
  DeckCardEntry,
  DeckDefinition,
  DeckValidationError,
  DeckValidationResult,
  SeriesFocusBonus,
  CardSeries,
  CardCollection,
} from '../types';
import { DEFAULT_DECK_BUILDING_RULES } from '../types';

export interface DeckValidatorOptions {
  /** 卡牌定义映射 (id -> definition) */
  cardDefinitions: Map<string, CardDefinition | CardDefinitionV2>;
  /** 构建规则 */
  rules?: DeckBuildingRules;
  /** 系列专精加成配置 */
  seriesFocusBonuses?: SeriesFocusBonus[];
  /** 玩家卡牌收藏 (用于检查解锁状态) */
  collection?: CardCollection;
}

export class DeckValidator {
  private cardDefinitions: Map<string, CardDefinition | CardDefinitionV2>;
  private rules: DeckBuildingRules;
  private seriesFocusBonuses: SeriesFocusBonus[];
  private collection?: CardCollection;

  constructor(options: DeckValidatorOptions) {
    this.cardDefinitions = options.cardDefinitions;
    this.rules = options.rules ?? DEFAULT_DECK_BUILDING_RULES;
    this.seriesFocusBonuses = options.seriesFocusBonuses ?? [];
    this.collection = options.collection;
  }

  /**
   * 验证卡组
   */
  validate(deck: DeckDefinition): DeckValidationResult {
    const errors: DeckValidationError[] = [];
    const warnings: string[] = [];
    const seriesDistribution: Record<CardSeries, number> = {
      environment: 0,
      business: 0,
      health: 0,
      accident: 0,
      social: 0,
      growth: 0,
      work: 0,
      neutral: 0,
    };
    const rarityDistribution: Record<CardRarity, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      legendary: 0,
    };

    let totalCards = 0;

    // 统计卡牌数量和分布
    for (const entry of deck.cards) {
      const cardDef = this.cardDefinitions.get(entry.cardId);

      if (!cardDef) {
        errors.push({
          type: 'card_not_found',
          message: `卡牌 "${entry.cardId}" 不存在`,
          cardId: entry.cardId,
        });
        continue;
      }

      // 检查单卡数量限制
      const maxCopies = (cardDef as CardDefinitionV2).maxCopies ?? this.rules.maxCopiesPerCard;
      if (entry.count > maxCopies) {
        errors.push({
          type: 'card_over_limit',
          message: `卡牌 "${cardDef.name}" 数量超过限制 (${entry.count}/${maxCopies})`,
          cardId: entry.cardId,
        });
      }

      // 检查卡牌解锁状态
      if (this.collection) {
        const isUnlocked = this.isCardUnlocked(entry.cardId);
        if (!isUnlocked) {
          errors.push({
            type: 'card_locked',
            message: `卡牌 "${cardDef.name}" 尚未解锁`,
            cardId: entry.cardId,
          });
        }
      }

      totalCards += entry.count;

      // 统计系列分布
      const series = (cardDef as CardDefinitionV2).series ?? 'neutral';
      seriesDistribution[series] += entry.count;

      // 统计稀有度分布
      const rarity = cardDef.rarity ?? 'common';
      rarityDistribution[rarity] += entry.count;
    }

    // 检查卡组大小
    if (totalCards < this.rules.minDeckSize) {
      errors.push({
        type: 'deck_too_small',
        message: `卡组卡牌数量不足 (${totalCards}/${this.rules.minDeckSize})`,
      });
    }

    if (totalCards > this.rules.maxDeckSize) {
      errors.push({
        type: 'deck_too_large',
        message: `卡组卡牌数量超出限制 (${totalCards}/${this.rules.maxDeckSize})`,
      });
    }

    // 检查稀有度限制
    if (rarityDistribution.legendary > this.rules.rarityLimits.legendary) {
      errors.push({
        type: 'rarity_over_limit',
        message: `传奇卡数量超过限制 (${rarityDistribution.legendary}/${this.rules.rarityLimits.legendary})`,
      });
    }

    if (rarityDistribution.rare > this.rules.rarityLimits.rare) {
      errors.push({
        type: 'rarity_over_limit',
        message: `稀有卡数量超过限制 (${rarityDistribution.rare}/${this.rules.rarityLimits.rare})`,
      });
    }

    if (rarityDistribution.uncommon > this.rules.rarityLimits.uncommon) {
      errors.push({
        type: 'rarity_over_limit',
        message: `非凡卡数量超过限制 (${rarityDistribution.uncommon}/${this.rules.rarityLimits.uncommon})`,
      });
    }

    // 检查系列专精
    let focusBonus: SeriesFocusBonus | undefined;
    if (this.rules.enableSeriesFocus && totalCards > 0) {
      focusBonus = this.checkSeriesFocus(seriesDistribution, totalCards);
      if (focusBonus) {
        warnings.push(`触发 ${focusBonus.name} 加成: ${focusBonus.description}`);
      }
    }

    // 添加一些有用的警告
    if (totalCards > 0) {
      const avgCost = this.calculateAverageCost(deck);
      if (avgCost > 2) {
        warnings.push(`卡组平均消耗较高 (${avgCost.toFixed(1)})，可能导致精力不足`);
      }

      const lowRarityRatio = rarityDistribution.common / totalCards;
      if (lowRarityRatio > 0.8) {
        warnings.push('普通卡占比过高，卡组强度可能不足');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      seriesDistribution,
      rarityDistribution,
      focusBonus,
      totalCards,
    };
  }

  /**
   * 检查卡牌是否已解锁
   */
  private isCardUnlocked(cardId: string): boolean {
    if (!this.collection) return true;
    return this.collection.unlockedCards.includes(cardId);
  }

  /**
   * 检查是否触发系列专精
   */
  private checkSeriesFocus(
    distribution: Record<CardSeries, number>,
    totalCards: number
  ): SeriesFocusBonus | undefined {
    const threshold = this.rules.seriesFocusThreshold;

    for (const [series, count] of Object.entries(distribution)) {
      if (series === 'neutral') continue;

      const ratio = count / totalCards;
      if (ratio >= threshold) {
        const bonus = this.seriesFocusBonuses.find((b) => b.series === series);
        if (bonus) return bonus;
      }
    }

    return undefined;
  }

  /**
   * 计算卡组平均消耗
   */
  private calculateAverageCost(deck: DeckDefinition): number {
    let totalCost = 0;
    let totalCards = 0;

    for (const entry of deck.cards) {
      const cardDef = this.cardDefinitions.get(entry.cardId);
      if (cardDef) {
        totalCost += (cardDef.cost ?? 0) * entry.count;
        totalCards += entry.count;
      }
    }

    return totalCards > 0 ? totalCost / totalCards : 0;
  }

  /**
   * 获取卡组统计信息
   */
  getStats(deck: DeckDefinition): DeckValidationResult {
    return this.validate(deck);
  }

  /**
   * 更新构建规则
   */
  setRules(rules: DeckBuildingRules): void {
    this.rules = rules;
  }

  /**
   * 更新玩家收藏
   */
  setCollection(collection: CardCollection): void {
    this.collection = collection;
  }
}
