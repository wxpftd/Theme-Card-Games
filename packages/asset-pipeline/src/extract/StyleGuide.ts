/**
 * 主题风格指南管理
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import type { ThemeStyleGuide, OutputSpec, VisualSpec, PromptTemplate } from '../types/index.js';

/** 默认输出规格 */
const DEFAULT_OUTPUT_SPEC: OutputSpec = {
  sizes: {
    small: { width: 98, height: 140 },
    medium: { width: 140, height: 200 },
    large: { width: 280, height: 400 },
  },
  format: 'webp',
  quality: 90,
  withFrame: true,
};

/** 预置的主题风格指南 */
const PRESET_STYLE_GUIDES: Record<string, ThemeStyleGuide> = {
  'bigtech-worker': {
    id: 'bigtech-worker',
    name: '大厂打工人',
    description: '互联网大厂职场生存主题，风格现代、略带幽默',
    promptTemplate: {
      base: 'minimalist flat illustration, modern tech office theme, clean vector art style, soft shadows',
      byType: {
        action: 'dynamic pose, motion elements, energetic composition',
        event: 'scene-based illustration, environmental storytelling, narrative moment',
        resource: 'iconic centered object, simple background, symbolic representation',
        character: 'portrait style, expressive character, professional attire',
        modifier: 'abstract glowing symbol, floating elements, magical effect',
      },
      byRarity: {
        common: 'simple clean design, muted pastel colors, minimal details',
        uncommon: 'subtle details, soft glow effect, slightly vibrant colors',
        rare: 'intricate details, vibrant colors, sparkle effects, premium feel',
        legendary: 'epic dramatic composition, golden accents, lens flare, mythical atmosphere',
      },
      bySeries: {
        work: 'office desk, computer, documents, professional setting',
        environment: 'cityscape, weather elements, global symbols',
        business: 'charts, money, business symbols, corporate imagery',
        health: 'wellness symbols, medical elements, lifestyle imagery',
        accident: 'warning signs, unexpected events, dramatic moment',
        social: 'people interaction, communication symbols, community',
        growth: 'upward arrows, learning symbols, achievement badges',
      },
      negative:
        'text, watermark, signature, blurry, low quality, realistic photo, 3D render, anime, cartoon face, ugly, deformed',
    },
    visualSpec: {
      artStyle: 'flat vector illustration with subtle gradients and soft shadows',
      colorPalette: ['#4A90D9', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#6366F1'],
      mood: 'modern, slightly humorous, relatable, professional yet approachable',
      perspective: 'isometric or front-facing, slightly elevated viewpoint',
      keywords: ['tech', 'startup', 'office', 'modern', 'digital', 'professional'],
    },
    outputSpec: DEFAULT_OUTPUT_SPEC,
    visualMappings: {
      加班: 'person working late at glowing computer screen, dark office, coffee cup',
      摸鱼: 'person secretly browsing phone behind monitor, sneaky expression',
      会议: 'conference room with multiple people, presentation screen',
      绩效: 'performance chart going up, golden star, achievement badge',
      裁员: 'office desk being cleared, cardboard box, dramatic lighting',
      跳槽: 'person walking through door towards bright light, new opportunity',
      内卷: 'multiple people working intensely, competitive atmosphere, pressure',
      躺平: 'person relaxing in office chair, peaceful expression, zen mode',
    },
  },

  startup: {
    id: 'startup',
    name: '创业公司',
    description: '初创公司创业主题，风格充满活力和不确定性',
    promptTemplate: {
      base: 'vibrant startup illustration, energetic and dynamic, bold colors, creative chaos',
      byType: {
        action: 'explosive energy, startup hustle, rapid movement',
        event: 'pivotal moment, breakthrough or setback, dramatic scene',
        resource: 'startup resources, funding symbols, growth indicators',
        character: 'diverse entrepreneur portrait, passionate expression',
        modifier: 'disruptive element, game-changer symbol',
      },
      byRarity: {
        common: 'simple idea sketch, napkin drawing style',
        uncommon: 'polished concept, investor-ready visual',
        rare: 'unicorn potential, magical startup moment',
        legendary: 'IPO moment, champagne celebration, ultimate success',
      },
      negative: 'text, watermark, corporate boring, realistic photo, 3D render, ugly, deformed',
    },
    visualSpec: {
      artStyle: 'energetic illustration with bold strokes and vibrant gradients',
      colorPalette: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'],
      mood: 'exciting, risky, innovative, youthful, disruptive',
      perspective: 'dynamic angles, unconventional viewpoints',
      keywords: ['startup', 'innovation', 'disruption', 'growth', 'venture'],
    },
    outputSpec: DEFAULT_OUTPUT_SPEC,
  },

  travel: {
    id: 'travel',
    name: '旅行冒险',
    description: '环球旅行探险主题，风格壮丽、充满冒险感',
    promptTemplate: {
      base: 'travel illustration, adventure aesthetic, wanderlust vibe, scenic beauty',
      byType: {
        action: 'explorer in action, adventure moment, journey scene',
        event: 'travel event, destination arrival, unexpected encounter',
        resource: 'travel gear, passport, map, souvenirs',
        character: 'traveler portrait, explorer outfit, adventurous spirit',
        modifier: 'magical travel element, enchanted destination',
      },
      byRarity: {
        common: 'local destination, simple journey',
        uncommon: 'popular tourist spot, memorable trip',
        rare: 'exotic destination, once-in-lifetime experience',
        legendary: 'world wonder, mythical location, dream destination',
      },
      negative: 'text, watermark, realistic photo, crowded tourist trap, ugly, deformed',
    },
    visualSpec: {
      artStyle: 'painterly travel poster style with rich colors and atmospheric depth',
      colorPalette: ['#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#3B1F2B'],
      mood: 'adventurous, wanderlust, discovery, freedom, awe',
      perspective: 'panoramic, cinematic wide shots, dramatic landscapes',
      keywords: ['travel', 'adventure', 'explore', 'destination', 'journey'],
    },
    outputSpec: DEFAULT_OUTPUT_SPEC,
  },

  parenting: {
    id: 'parenting',
    name: '育儿生活',
    description: '育儿成长主题，风格温馨、可爱、有童趣',
    promptTemplate: {
      base: 'warm family illustration, cute children style, heartwarming scene, soft colors',
      byType: {
        action: 'parenting activity, child interaction, family moment',
        event: 'family milestone, child development event, memorable moment',
        resource: 'baby items, toys, parenting tools, educational materials',
        character: 'adorable child portrait, loving parent, family member',
        modifier: 'magical childhood element, imagination spark',
      },
      byRarity: {
        common: 'everyday parenting moment, simple joy',
        uncommon: 'special family activity, bonding time',
        rare: 'precious milestone, unforgettable memory',
        legendary: 'magical family moment, dream come true',
      },
      negative: 'text, watermark, realistic photo, scary, dark, inappropriate, ugly, deformed',
    },
    visualSpec: {
      artStyle: 'soft watercolor illustration with rounded shapes and gentle colors',
      colorPalette: ['#FFB5BA', '#B5DEFF', '#FFFFC5', '#C5FFB5', '#E8D5FF'],
      mood: 'warm, loving, playful, nurturing, innocent',
      perspective: 'child-friendly viewpoint, cozy intimate scenes',
      keywords: ['family', 'children', 'parenting', 'growth', 'love', 'cute'],
    },
    outputSpec: DEFAULT_OUTPUT_SPEC,
  },
};

/**
 * 风格指南管理器
 */
export class StyleGuideManager {
  private guidesDir: string;
  private loadedGuides: Map<string, ThemeStyleGuide> = new Map();

  constructor(guidesDir: string) {
    this.guidesDir = guidesDir;
  }

  /**
   * 获取风格指南
   */
  async getStyleGuide(themeId: string): Promise<ThemeStyleGuide | null> {
    // 先检查缓存
    if (this.loadedGuides.has(themeId)) {
      return this.loadedGuides.get(themeId)!;
    }

    // 尝试从文件加载
    const filePath = join(this.guidesDir, `${themeId}.json`);
    if (existsSync(filePath)) {
      try {
        const content = await readFile(filePath, 'utf-8');
        const guide = JSON.parse(content) as ThemeStyleGuide;
        this.loadedGuides.set(themeId, guide);
        return guide;
      } catch (error) {
        console.error(`Failed to load style guide from ${filePath}:`, error);
      }
    }

    // 回退到预置配置
    if (PRESET_STYLE_GUIDES[themeId]) {
      const guide = PRESET_STYLE_GUIDES[themeId];
      this.loadedGuides.set(themeId, guide);
      return guide;
    }

    return null;
  }

  /**
   * 保存风格指南
   */
  async saveStyleGuide(guide: ThemeStyleGuide): Promise<void> {
    const filePath = join(this.guidesDir, `${guide.id}.json`);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(guide, null, 2), 'utf-8');
    this.loadedGuides.set(guide.id, guide);
  }

  /**
   * 列出所有可用的风格指南
   */
  listAvailableGuides(): string[] {
    return Object.keys(PRESET_STYLE_GUIDES);
  }

  /**
   * 创建新的风格指南（基于模板）
   */
  createStyleGuide(
    themeId: string,
    name: string,
    options: {
      baseTheme?: string;
      promptTemplate?: Partial<PromptTemplate>;
      visualSpec?: Partial<VisualSpec>;
      outputSpec?: Partial<OutputSpec>;
    } = {}
  ): ThemeStyleGuide {
    // 基于现有主题或默认值
    const baseGuide = options.baseTheme
      ? PRESET_STYLE_GUIDES[options.baseTheme]
      : PRESET_STYLE_GUIDES['bigtech-worker'];

    const guide: ThemeStyleGuide = {
      id: themeId,
      name,
      promptTemplate: {
        ...baseGuide.promptTemplate,
        ...options.promptTemplate,
      },
      visualSpec: {
        ...baseGuide.visualSpec,
        ...options.visualSpec,
      },
      outputSpec: {
        ...DEFAULT_OUTPUT_SPEC,
        ...options.outputSpec,
      },
    };

    return guide;
  }

  /**
   * 获取预置风格指南
   */
  getPresetGuide(themeId: string): ThemeStyleGuide | undefined {
    return PRESET_STYLE_GUIDES[themeId];
  }
}

export { PRESET_STYLE_GUIDES, DEFAULT_OUTPUT_SPEC };
