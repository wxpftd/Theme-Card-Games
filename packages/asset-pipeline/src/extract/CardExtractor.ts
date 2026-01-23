/**
 * 卡牌定义提取器
 * 从主题包中提取卡牌定义
 */

import type { CardDefinition, ThemeConfig } from '@theme-card-games/core';
import type { ThemeStyleGuide, ExtractionResult } from '../types/index.js';
import { PromptGenerator, type GeneratedPrompt } from './PromptGenerator.js';
import { StyleGuideManager } from './StyleGuide.js';

/** 提取选项 */
export interface ExtractOptions {
  /** 主题ID */
  themeId: string;
  /** 主题配置（如果已加载） */
  themeConfig?: ThemeConfig;
  /** 卡牌定义（如果已加载） */
  cards?: CardDefinition[];
  /** 风格指南目录 */
  styleGuidesDir?: string;
  /** 自定义风格指南 */
  customStyleGuide?: ThemeStyleGuide;
  /** 过滤器：只提取特定卡牌 */
  cardFilter?: (card: CardDefinition) => boolean;
}

/**
 * 卡牌提取器
 */
export class CardExtractor {
  private styleGuideManager: StyleGuideManager;

  constructor(styleGuidesDir: string = './templates/style-guides') {
    this.styleGuideManager = new StyleGuideManager(styleGuidesDir);
  }

  /**
   * 提取卡牌并生成提示词
   */
  async extract(options: ExtractOptions): Promise<ExtractionResult> {
    const { themeId, themeConfig, cards: providedCards, customStyleGuide, cardFilter } = options;

    // 1. 获取卡牌定义
    let cards: CardDefinition[];
    if (providedCards) {
      cards = providedCards;
    } else if (themeConfig) {
      cards = themeConfig.cards;
    } else {
      throw new Error(
        `No cards provided for theme "${themeId}". Please provide themeConfig or cards.`
      );
    }

    // 2. 应用过滤器
    if (cardFilter) {
      cards = cards.filter(cardFilter);
    }

    // 3. 获取风格指南
    let styleGuide: ThemeStyleGuide;
    if (customStyleGuide) {
      styleGuide = customStyleGuide;
    } else {
      const guide = await this.styleGuideManager.getStyleGuide(themeId);
      if (!guide) {
        throw new Error(
          `No style guide found for theme "${themeId}". ` +
            `Available guides: ${this.styleGuideManager.listAvailableGuides().join(', ')}`
        );
      }
      styleGuide = guide;
    }

    // 4. 生成提示词
    const promptGenerator = new PromptGenerator(styleGuide);
    const generatedPrompts: GeneratedPrompt[] = promptGenerator.generatePrompts(cards);

    // 5. 构建结果
    const result: ExtractionResult = {
      theme: themeId,
      cards,
      styleGuide,
      prompts: generatedPrompts.map((p) => ({
        cardId: p.cardId,
        cardName: p.cardName,
        prompt: p.prompt,
        negativePrompt: p.negativePrompt,
      })),
    };

    return result;
  }

  /**
   * 提取单张卡牌的提示词
   */
  async extractSingle(
    card: CardDefinition,
    themeId: string,
    customStyleGuide?: ThemeStyleGuide
  ): Promise<GeneratedPrompt> {
    // 获取风格指南
    let styleGuide: ThemeStyleGuide;
    if (customStyleGuide) {
      styleGuide = customStyleGuide;
    } else {
      const guide = await this.styleGuideManager.getStyleGuide(themeId);
      if (!guide) {
        throw new Error(`No style guide found for theme "${themeId}"`);
      }
      styleGuide = guide;
    }

    // 生成提示词
    const promptGenerator = new PromptGenerator(styleGuide);
    return promptGenerator.generatePrompt(card);
  }

  /**
   * 获取风格指南管理器
   */
  getStyleGuideManager(): StyleGuideManager {
    return this.styleGuideManager;
  }

  /**
   * 预览提取结果（不保存）
   */
  async preview(options: ExtractOptions): Promise<{
    totalCards: number;
    byType: Record<string, number>;
    byRarity: Record<string, number>;
    samplePrompts: Array<{ cardName: string; prompt: string }>;
  }> {
    const result = await this.extract(options);

    // 统计
    const byType: Record<string, number> = {};
    const byRarity: Record<string, number> = {};

    for (const card of result.cards) {
      byType[card.type] = (byType[card.type] || 0) + 1;
      if (card.rarity) {
        byRarity[card.rarity] = (byRarity[card.rarity] || 0) + 1;
      }
    }

    // 采样
    const samplePrompts = result.prompts.slice(0, 5).map((p) => ({
      cardName: p.cardName,
      prompt: p.prompt,
    }));

    return {
      totalCards: result.cards.length,
      byType,
      byRarity,
      samplePrompts,
    };
  }
}

export { CardExtractor as default };
