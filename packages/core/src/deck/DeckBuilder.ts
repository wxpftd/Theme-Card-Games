/**
 * 卡组构建器
 * Deck Builder - 帮助玩家构建和管理卡组
 */

import type {
  CardDefinition,
  CardDefinitionV2,
  CardRarity,
  CardSeries,
  DeckBuildingRules,
  DeckCardEntry,
  DeckDefinition,
  DeckValidationResult,
  CardCollection,
  SeriesFocusBonus,
} from '../types';
import { DEFAULT_DECK_BUILDING_RULES } from '../types';
import { DeckValidator } from './DeckValidator';
import { generateId } from '../utils';

export interface DeckBuilderOptions {
  /** 卡牌定义列表 */
  cardDefinitions: (CardDefinition | CardDefinitionV2)[];
  /** 构建规则 */
  rules?: DeckBuildingRules;
  /** 系列专精加成配置 */
  seriesFocusBonuses?: SeriesFocusBonus[];
  /** 玩家卡牌收藏 */
  collection?: CardCollection;
}

export class DeckBuilder {
  private cardDefinitions: Map<string, CardDefinition | CardDefinitionV2>;
  private rules: DeckBuildingRules;
  private validator: DeckValidator;
  private currentDeck: DeckDefinition;

  constructor(options: DeckBuilderOptions) {
    this.cardDefinitions = new Map(options.cardDefinitions.map((c) => [c.id, c]));
    this.rules = options.rules ?? DEFAULT_DECK_BUILDING_RULES;

    this.validator = new DeckValidator({
      cardDefinitions: this.cardDefinitions,
      rules: this.rules,
      seriesFocusBonuses: options.seriesFocusBonuses,
      collection: options.collection,
    });

    // 初始化空卡组
    this.currentDeck = this.createEmptyDeck();
  }

  /**
   * 创建空卡组
   */
  createEmptyDeck(name?: string, description?: string): DeckDefinition {
    return {
      id: generateId(),
      name: name ?? '新卡组',
      description: description ?? '',
      cards: [],
      isPrebuilt: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * 加载卡组
   */
  loadDeck(deck: DeckDefinition): void {
    this.currentDeck = { ...deck };
  }

  /**
   * 获取当前卡组
   */
  getCurrentDeck(): DeckDefinition {
    return { ...this.currentDeck };
  }

  /**
   * 添加卡牌到卡组
   */
  addCard(cardId: string, count: number = 1): boolean {
    const cardDef = this.cardDefinitions.get(cardId);
    if (!cardDef) return false;

    const existingEntry = this.currentDeck.cards.find((e) => e.cardId === cardId);
    const maxCopies = (cardDef as CardDefinitionV2).maxCopies ?? this.rules.maxCopiesPerCard;

    if (existingEntry) {
      const newCount = existingEntry.count + count;
      if (newCount > maxCopies) return false;
      existingEntry.count = newCount;
    } else {
      if (count > maxCopies) return false;
      this.currentDeck.cards.push({ cardId, count });
    }

    this.currentDeck.updatedAt = Date.now();
    return true;
  }

  /**
   * 从卡组移除卡牌
   */
  removeCard(cardId: string, count: number = 1): boolean {
    const entryIndex = this.currentDeck.cards.findIndex((e) => e.cardId === cardId);
    if (entryIndex === -1) return false;

    const entry = this.currentDeck.cards[entryIndex];
    entry.count -= count;

    if (entry.count <= 0) {
      this.currentDeck.cards.splice(entryIndex, 1);
    }

    this.currentDeck.updatedAt = Date.now();
    return true;
  }

  /**
   * 设置卡牌数量
   */
  setCardCount(cardId: string, count: number): boolean {
    if (count < 0) return false;

    const cardDef = this.cardDefinitions.get(cardId);
    if (!cardDef) return false;

    const maxCopies = (cardDef as CardDefinitionV2).maxCopies ?? this.rules.maxCopiesPerCard;
    if (count > maxCopies) return false;

    const existingEntry = this.currentDeck.cards.find((e) => e.cardId === cardId);

    if (count === 0) {
      if (existingEntry) {
        const index = this.currentDeck.cards.indexOf(existingEntry);
        this.currentDeck.cards.splice(index, 1);
      }
    } else if (existingEntry) {
      existingEntry.count = count;
    } else {
      this.currentDeck.cards.push({ cardId, count });
    }

    this.currentDeck.updatedAt = Date.now();
    return true;
  }

  /**
   * 清空卡组
   */
  clearDeck(): void {
    this.currentDeck.cards = [];
    this.currentDeck.updatedAt = Date.now();
  }

  /**
   * 验证当前卡组
   */
  validate(): DeckValidationResult {
    return this.validator.validate(this.currentDeck);
  }

  /**
   * 设置卡组名称
   */
  setName(name: string): void {
    this.currentDeck.name = name;
    this.currentDeck.updatedAt = Date.now();
  }

  /**
   * 设置卡组描述
   */
  setDescription(description: string): void {
    this.currentDeck.description = description;
    this.currentDeck.updatedAt = Date.now();
  }

  /**
   * 设置卡组图标
   */
  setIcon(icon: string): void {
    this.currentDeck.icon = icon;
    this.currentDeck.updatedAt = Date.now();
  }

  /**
   * 获取所有可用卡牌
   */
  getAvailableCards(): (CardDefinition | CardDefinitionV2)[] {
    return Array.from(this.cardDefinitions.values());
  }

  /**
   * 按系列过滤卡牌
   */
  getCardsBySeries(series: CardSeries): (CardDefinition | CardDefinitionV2)[] {
    return Array.from(this.cardDefinitions.values()).filter(
      (card) => (card as CardDefinitionV2).series === series || series === 'neutral'
    );
  }

  /**
   * 按稀有度过滤卡牌
   */
  getCardsByRarity(rarity: CardRarity): (CardDefinition | CardDefinitionV2)[] {
    return Array.from(this.cardDefinitions.values()).filter(
      (card) => (card.rarity ?? 'common') === rarity
    );
  }

  /**
   * 搜索卡牌
   */
  searchCards(query: string): (CardDefinition | CardDefinitionV2)[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.cardDefinitions.values()).filter(
      (card) =>
        card.name.toLowerCase().includes(lowerQuery) ||
        card.description.toLowerCase().includes(lowerQuery) ||
        (card.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) ?? false)
    );
  }

  /**
   * 获取卡牌在当前卡组中的数量
   */
  getCardCount(cardId: string): number {
    const entry = this.currentDeck.cards.find((e) => e.cardId === cardId);
    return entry?.count ?? 0;
  }

  /**
   * 获取当前卡组总卡牌数
   */
  getTotalCards(): number {
    return this.currentDeck.cards.reduce((sum, entry) => sum + entry.count, 0);
  }

  /**
   * 检查卡组是否可以保存 (满足最小要求)
   */
  canSave(): boolean {
    const result = this.validate();
    // 只要没有严重错误就可以保存
    const criticalErrors = result.errors.filter(
      (e) => e.type !== 'deck_too_small' && e.type !== 'deck_too_large'
    );
    return criticalErrors.length === 0;
  }

  /**
   * 检查卡组是否可以开始游戏 (完全有效)
   */
  canPlay(): boolean {
    return this.validate().valid;
  }

  /**
   * 获取推荐卡牌 (基于当前卡组系列分布)
   */
  getRecommendedCards(limit: number = 10): (CardDefinition | CardDefinitionV2)[] {
    const result = this.validate();
    const { seriesDistribution } = result;
    const totalCards = this.getTotalCards();

    // 找出主要系列
    let mainSeries: CardSeries = 'neutral';
    let maxCount = 0;
    for (const [series, count] of Object.entries(seriesDistribution)) {
      if (series !== 'neutral' && count > maxCount) {
        maxCount = count;
        mainSeries = series as CardSeries;
      }
    }

    // 获取该系列中未在卡组中或数量未满的卡牌
    const recommendations: (CardDefinition | CardDefinitionV2)[] = [];

    for (const card of this.cardDefinitions.values()) {
      const cardSeries = (card as CardDefinitionV2).series ?? 'neutral';
      if (cardSeries !== mainSeries && cardSeries !== 'neutral') continue;

      const currentCount = this.getCardCount(card.id);
      const maxCopies = (card as CardDefinitionV2).maxCopies ?? this.rules.maxCopiesPerCard;

      if (currentCount < maxCopies) {
        recommendations.push(card);
      }
    }

    // 按稀有度排序，稀有的优先
    const rarityOrder: Record<CardRarity, number> = {
      legendary: 4,
      rare: 3,
      uncommon: 2,
      common: 1,
    };

    recommendations.sort(
      (a, b) => rarityOrder[b.rarity ?? 'common'] - rarityOrder[a.rarity ?? 'common']
    );

    return recommendations.slice(0, limit);
  }

  /**
   * 从预构筑卡组复制
   */
  copyFromPrebuilt(prebuiltDeck: DeckDefinition): void {
    this.currentDeck = {
      ...prebuiltDeck,
      id: generateId(),
      name: `${prebuiltDeck.name} (复制)`,
      isPrebuilt: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * 导出卡组为字符串 (用于分享)
   * 使用 Base64 编码，兼容中文字符
   */
  exportDeck(): string {
    const exportData = {
      name: this.currentDeck.name,
      description: this.currentDeck.description,
      cards: this.currentDeck.cards,
    };
    const jsonStr = JSON.stringify(exportData);
    // 使用 Buffer 处理 UTF-8 字符
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(jsonStr, 'utf-8').toString('base64');
    }
    // 浏览器环境使用 encodeURIComponent + btoa
    return btoa(encodeURIComponent(jsonStr));
  }

  /**
   * 从字符串导入卡组
   */
  importDeck(encoded: string): boolean {
    try {
      let jsonStr: string;
      // 使用 Buffer 解码
      if (typeof Buffer !== 'undefined') {
        jsonStr = Buffer.from(encoded, 'base64').toString('utf-8');
      } else {
        // 浏览器环境
        jsonStr = decodeURIComponent(atob(encoded));
      }

      const data = JSON.parse(jsonStr);
      if (!data.name || !Array.isArray(data.cards)) return false;

      this.currentDeck = {
        id: generateId(),
        name: data.name,
        description: data.description ?? '',
        cards: data.cards as DeckCardEntry[],
        isPrebuilt: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return true;
    } catch {
      return false;
    }
  }
}
