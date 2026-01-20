import { AIStrategyConfig, AIDifficulty } from '../types';

/**
 * AI 策略预设配置
 * 为不同难度的 AI 提供预设策略
 */

/** 简单难度 AI - 随机且被动 */
export const EASY_AI_STRATEGY: AIStrategyConfig = {
  difficulty: 'easy',
  aggressiveness: 0.2,
  defensiveness: 0.3,
  greed: 0.2,
  riskTolerance: 0.1,
  thinkingDelay: 500,
};

/** 中等难度 AI - 平衡策略 */
export const MEDIUM_AI_STRATEGY: AIStrategyConfig = {
  difficulty: 'medium',
  aggressiveness: 0.5,
  defensiveness: 0.5,
  greed: 0.5,
  riskTolerance: 0.4,
  thinkingDelay: 800,
};

/** 困难难度 AI - 有策略且积极 */
export const HARD_AI_STRATEGY: AIStrategyConfig = {
  difficulty: 'hard',
  aggressiveness: 0.7,
  defensiveness: 0.6,
  greed: 0.7,
  riskTolerance: 0.6,
  thinkingDelay: 1000,
};

/** 专家难度 AI - 最优策略 */
export const EXPERT_AI_STRATEGY: AIStrategyConfig = {
  difficulty: 'expert',
  aggressiveness: 0.85,
  defensiveness: 0.8,
  greed: 0.9,
  riskTolerance: 0.75,
  thinkingDelay: 1200,
};

/**
 * 根据难度获取预设策略
 */
export function getAIStrategyByDifficulty(difficulty: AIDifficulty): AIStrategyConfig {
  switch (difficulty) {
    case 'easy':
      return { ...EASY_AI_STRATEGY };
    case 'medium':
      return { ...MEDIUM_AI_STRATEGY };
    case 'hard':
      return { ...HARD_AI_STRATEGY };
    case 'expert':
      return { ...EXPERT_AI_STRATEGY };
    default:
      return { ...MEDIUM_AI_STRATEGY };
  }
}

/**
 * 创建自定义 AI 策略
 * 基于预设策略进行部分覆盖
 */
export function createCustomAIStrategy(
  baseDifficulty: AIDifficulty,
  overrides: Partial<AIStrategyConfig>
): AIStrategyConfig {
  const baseStrategy = getAIStrategyByDifficulty(baseDifficulty);
  return {
    ...baseStrategy,
    ...overrides,
  };
}

/**
 * 性格修饰符接口
 */
interface PersonalityModifier {
  aggressiveness?: number;
  defensiveness?: number;
  greed?: number;
  riskTolerance?: number;
}

/**
 * AI 性格预设 - 可以叠加在难度预设上
 */
export const AI_PERSONALITY_MODIFIERS: Record<string, PersonalityModifier> = {
  /** 卷王 - 高攻击性，低防御 */
  workaholic: {
    aggressiveness: 0.2,
    defensiveness: -0.2,
    greed: 0.1,
  },
  /** 摸鱼达人 - 低攻击性，高防御 */
  slacker: {
    aggressiveness: -0.2,
    defensiveness: 0.2,
    riskTolerance: -0.2,
  },
  /** 社交达人 - 平衡，稍高贪婪 */
  socialite: {
    aggressiveness: 0,
    defensiveness: 0,
    greed: 0.15,
  },
  /** 冒险家 - 高风险偏好 */
  risktaker: {
    aggressiveness: 0.1,
    riskTolerance: 0.3,
    defensiveness: -0.1,
  },
  /** 保守派 - 低风险，高防御 */
  conservative: {
    aggressiveness: -0.15,
    riskTolerance: -0.3,
    defensiveness: 0.2,
  },
};

/**
 * 应用性格修饰到策略上
 */
export function applyPersonalityModifier(
  strategy: AIStrategyConfig,
  personality: keyof typeof AI_PERSONALITY_MODIFIERS
): AIStrategyConfig {
  const modifier = AI_PERSONALITY_MODIFIERS[personality];
  return {
    ...strategy,
    aggressiveness: clamp(strategy.aggressiveness + (modifier.aggressiveness ?? 0), 0, 1),
    defensiveness: clamp(strategy.defensiveness + (modifier.defensiveness ?? 0), 0, 1),
    greed: clamp(strategy.greed + (modifier.greed ?? 0), 0, 1),
    riskTolerance: clamp(strategy.riskTolerance + (modifier.riskTolerance ?? 0), 0, 1),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
