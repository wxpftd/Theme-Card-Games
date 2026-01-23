/**
 * AI 图像生成提示词生成器
 */

import type { CardDefinition, CardType, CardRarity } from '@theme-card-games/core';
import type { ThemeStyleGuide } from '../types/index.js';

/** 生成的提示词结果 */
export interface GeneratedPrompt {
  cardId: string;
  cardName: string;
  prompt: string;
  negativePrompt: string;
  metadata: {
    type: CardType;
    rarity?: CardRarity;
    series?: string;
    tags?: string[];
  };
}

/**
 * 提示词生成器
 * 根据卡牌定义和主题风格指南生成 AI 图像提示词
 */
export class PromptGenerator {
  private styleGuide: ThemeStyleGuide;

  constructor(styleGuide: ThemeStyleGuide) {
    this.styleGuide = styleGuide;
  }

  /**
   * 为单张卡牌生成提示词
   */
  generatePrompt(card: CardDefinition): GeneratedPrompt {
    const { promptTemplate, visualSpec } = this.styleGuide;

    // 检查是否有自定义提示词覆盖
    if (this.styleGuide.customPrompts?.[card.id]) {
      return {
        cardId: card.id,
        cardName: card.name,
        prompt: this.styleGuide.customPrompts[card.id],
        negativePrompt: promptTemplate.negative,
        metadata: {
          type: card.type,
          rarity: card.rarity,
          tags: card.tags,
        },
      };
    }

    // 构建提示词各部分
    const parts: string[] = [];

    // 1. 基础风格
    parts.push(promptTemplate.base);

    // 2. 卡牌类型特定提示词
    const typePrompt = promptTemplate.byType[card.type];
    if (typePrompt) {
      parts.push(typePrompt);
    }

    // 3. 稀有度特定提示词
    if (card.rarity && promptTemplate.byRarity[card.rarity]) {
      parts.push(promptTemplate.byRarity[card.rarity]!);
    }

    // 4. 系列特定提示词（如果有）
    const series = (card as { series?: string }).series;
    if (series && promptTemplate.bySeries?.[series]) {
      parts.push(promptTemplate.bySeries[series]);
    }

    // 5. 卡牌内容视觉描述
    const contentPrompt = this.generateContentPrompt(card);
    if (contentPrompt) {
      parts.push(contentPrompt);
    }

    // 6. 艺术风格
    parts.push(visualSpec.artStyle);

    // 7. 色彩
    if (visualSpec.colorPalette.length > 0) {
      parts.push(`color palette: ${visualSpec.colorPalette.slice(0, 3).join(', ')}`);
    }

    // 8. 情绪基调
    parts.push(visualSpec.mood);

    // 9. 视角
    parts.push(visualSpec.perspective);

    // 10. 额外关键词
    if (visualSpec.keywords && visualSpec.keywords.length > 0) {
      parts.push(visualSpec.keywords.join(', '));
    }

    // 组合并清理
    const prompt = this.cleanPrompt(parts.filter(Boolean).join(', '));

    return {
      cardId: card.id,
      cardName: card.name,
      prompt,
      negativePrompt: promptTemplate.negative,
      metadata: {
        type: card.type,
        rarity: card.rarity,
        series,
        tags: card.tags,
      },
    };
  }

  /**
   * 批量生成提示词
   */
  generatePrompts(cards: CardDefinition[]): GeneratedPrompt[] {
    return cards.map((card) => this.generatePrompt(card));
  }

  /**
   * 根据卡牌内容生成视觉描述
   */
  private generateContentPrompt(card: CardDefinition): string {
    // 1. 先检查视觉映射表
    if (this.styleGuide.visualMappings?.[card.name]) {
      return this.styleGuide.visualMappings[card.name];
    }

    // 2. 从卡牌名称和描述提取视觉元素
    const visualElements: string[] = [];

    // 卡牌名称作为主题
    visualElements.push(`subject: ${card.name}`);

    // 从描述中提取关键词
    const descKeywords = this.extractKeywordsFromDescription(card.description);
    if (descKeywords.length > 0) {
      visualElements.push(`scene elements: ${descKeywords.join(', ')}`);
    }

    // 根据标签添加视觉提示
    if (card.tags && card.tags.length > 0) {
      const tagVisuals = this.tagsToVisuals(card.tags);
      if (tagVisuals) {
        visualElements.push(tagVisuals);
      }
    }

    return visualElements.join(', ');
  }

  /**
   * 从描述中提取关键视觉词汇
   */
  private extractKeywordsFromDescription(description: string): string[] {
    // 移除效果数值描述（如 "+10", "-5"）
    const cleanDesc = description.replace(/[+-]?\d+/g, '').trim();

    // 中文视觉关键词映射
    const visualKeywordMap: Record<string, string> = {
      // 动作
      加班: 'working overtime',
      工作: 'working',
      休息: 'resting',
      学习: 'studying',
      运动: 'exercising',
      社交: 'socializing',
      会议: 'meeting',
      汇报: 'presenting',
      摸鱼: 'slacking off',
      划水: 'coasting',

      // 物品
      电脑: 'computer',
      手机: 'smartphone',
      咖啡: 'coffee',
      文档: 'documents',
      代码: 'code on screen',

      // 状态
      疲惫: 'tired expression',
      开心: 'happy expression',
      焦虑: 'anxious mood',
      轻松: 'relaxed atmosphere',
      压力: 'stressed',
      成功: 'success celebration',
      失败: 'disappointment',

      // 场景
      办公室: 'office environment',
      公司: 'corporate building',
      家: 'home setting',
      户外: 'outdoor scene',

      // 人物
      同事: 'colleagues',
      老板: 'boss figure',
      领导: 'manager',
      团队: 'team members',
    };

    const keywords: string[] = [];

    for (const [chinese, english] of Object.entries(visualKeywordMap)) {
      if (cleanDesc.includes(chinese)) {
        keywords.push(english);
      }
    }

    return keywords.slice(0, 5); // 限制最多5个关键词
  }

  /**
   * 将标签转换为视觉提示
   */
  private tagsToVisuals(tags: string[]): string | null {
    const tagVisualMap: Record<string, string> = {
      work: 'professional office setting',
      rest: 'relaxation scene',
      risk: 'tension and uncertainty',
      overtime: 'late night work atmosphere',
      social: 'people interaction',
      growth: 'progress and improvement symbols',
      health: 'wellness and vitality',
      money: 'financial symbols',
      career: 'career advancement imagery',
      team: 'collaborative environment',
      solo: 'individual focused',
      urgent: 'time pressure elements',
      strategic: 'chess-like strategic thinking',
    };

    const visuals = tags.map((tag) => tagVisualMap[tag]).filter(Boolean);

    return visuals.length > 0 ? visuals.join(', ') : null;
  }

  /**
   * 清理和优化提示词
   */
  private cleanPrompt(prompt: string): string {
    return (
      prompt
        // 移除多余空格
        .replace(/\s+/g, ' ')
        // 移除重复的逗号
        .replace(/,\s*,/g, ',')
        // 移除开头和结尾的逗号
        .replace(/^,\s*/, '')
        .replace(/,\s*$/, '')
        // 规范化逗号后的空格
        .replace(/,\s*/g, ', ')
        .trim()
    );
  }

  /**
   * 更新风格指南
   */
  updateStyleGuide(styleGuide: ThemeStyleGuide): void {
    this.styleGuide = styleGuide;
  }

  /**
   * 添加视觉映射
   */
  addVisualMapping(cardName: string, visual: string): void {
    if (!this.styleGuide.visualMappings) {
      this.styleGuide.visualMappings = {};
    }
    this.styleGuide.visualMappings[cardName] = visual;
  }

  /**
   * 添加自定义提示词
   */
  addCustomPrompt(cardId: string, prompt: string): void {
    if (!this.styleGuide.customPrompts) {
      this.styleGuide.customPrompts = {};
    }
    this.styleGuide.customPrompts[cardId] = prompt;
  }

  /**
   * 获取当前风格指南
   */
  getStyleGuide(): ThemeStyleGuide {
    return this.styleGuide;
  }
}

export { PromptGenerator as default };
