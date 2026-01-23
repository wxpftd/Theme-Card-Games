/**
 * 卡牌素材制作流水线 - 类型定义
 */

import type { CardDefinition, CardType, CardRarity } from '@theme-card-games/core';

// ============================================
// 主题风格指南
// ============================================

/** 提示词模板配置 */
export interface PromptTemplate {
  /** 基础风格描述 */
  base: string;
  /** 按卡牌类型的提示词 */
  byType: Partial<Record<CardType, string>>;
  /** 按稀有度的提示词 */
  byRarity: Partial<Record<CardRarity, string>>;
  /** 按系列的提示词（可选） */
  bySeries?: Record<string, string>;
  /** 负面提示词（排除不想要的元素） */
  negative: string;
}

/** 视觉规范 */
export interface VisualSpec {
  /** 艺术风格（如 "flat illustration", "pixel art"） */
  artStyle: string;
  /** 主色调 */
  colorPalette: string[];
  /** 情绪基调 */
  mood: string;
  /** 视角（如 "isometric", "front-facing"） */
  perspective: string;
  /** 额外的风格关键词 */
  keywords?: string[];
}

/** 图片尺寸规格 */
export interface ImageSize {
  width: number;
  height: number;
}

/** 输出规格 */
export interface OutputSpec {
  /** 不同尺寸的输出 */
  sizes: {
    small: ImageSize;
    medium: ImageSize;
    large: ImageSize;
  };
  /** 输出格式 */
  format: 'png' | 'webp' | 'jpeg';
  /** 质量（1-100） */
  quality: number;
  /** 是否生成带边框的版本 */
  withFrame?: boolean;
}

/** 主题风格指南 */
export interface ThemeStyleGuide {
  /** 主题ID */
  id: string;
  /** 主题名称 */
  name: string;
  /** 主题描述 */
  description?: string;
  /** 提示词模板 */
  promptTemplate: PromptTemplate;
  /** 视觉规范 */
  visualSpec: VisualSpec;
  /** 输出规格 */
  outputSpec: OutputSpec;
  /** 视觉元素映射（卡牌名称 -> 视觉描述） */
  visualMappings?: Record<string, string>;
  /** 自定义提示词覆盖（卡牌ID -> 完整提示词） */
  customPrompts?: Record<string, string>;
}

// ============================================
// 生成任务
// ============================================

/** 任务状态 */
export type TaskStatus =
  | 'pending' // 等待中
  | 'generating' // 生成中
  | 'processing' // 处理中
  | 'review' // 待审核
  | 'approved' // 已通过
  | 'rejected' // 已拒绝
  | 'failed'; // 失败

/** 生成任务 */
export interface GenerationTask {
  /** 任务ID */
  id: string;
  /** 卡牌ID */
  cardId: string;
  /** 卡牌定义 */
  cardDefinition: CardDefinition;
  /** 主题ID */
  theme: string;
  /** 生成的提示词 */
  prompt: string;
  /** 负面提示词 */
  negativePrompt?: string;
  /** 任务状态 */
  status: TaskStatus;
  /** 尝试次数 */
  attempts: number;
  /** 最大尝试次数 */
  maxAttempts: number;
  /** 生成结果 */
  result?: GenerationResult;
  /** 错误信息 */
  error?: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/** 生成结果 */
export interface GenerationResult {
  /** 任务ID */
  taskId: string;
  /** 原始图片路径 */
  rawImagePath: string;
  /** 处理后的图片路径 */
  processedImages: {
    small: string;
    medium: string;
    large: string;
  };
  /** 带边框的图片路径（可选） */
  framedImages?: {
    small: string;
    medium: string;
    large: string;
  };
  /** 元数据 */
  metadata: {
    provider: string;
    model: string;
    generatedAt: string;
    prompt: string;
    seed?: number;
    revisedPrompt?: string;
  };
}

// ============================================
// AI Provider
// ============================================

/** AI Provider 类型 */
export type ProviderType = 'openai' | 'stability' | 'local-sd' | 'mock';

/** 生成选项 */
export interface GenerateOptions {
  /** 提示词 */
  prompt: string;
  /** 负面提示词 */
  negativePrompt?: string;
  /** 图片尺寸 */
  size?: ImageSize;
  /** 质量等级 */
  quality?: 'standard' | 'hd';
  /** 风格 */
  style?: 'vivid' | 'natural';
  /** 种子（用于复现） */
  seed?: number;
  /** 生成数量 */
  n?: number;
}

/** 生成的图片 */
export interface GeneratedImage {
  /** 图片数据（base64 或 URL） */
  data: string;
  /** 数据类型 */
  type: 'base64' | 'url';
  /** 修改后的提示词（如果 AI 修改了） */
  revisedPrompt?: string;
  /** 种子 */
  seed?: number;
}

/** AI Provider 接口 */
export interface ImageProvider {
  /** Provider 名称 */
  name: string;
  /** Provider 类型 */
  type: ProviderType;
  /** 生成图片 */
  generate(options: GenerateOptions): Promise<GeneratedImage>;
  /** 检查是否可用 */
  isAvailable(): Promise<boolean>;
  /** 获取模型信息 */
  getModelInfo(): { model: string; version?: string };
}

/** Provider 配置 */
export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  options?: Record<string, unknown>;
}

// ============================================
// 资源清单
// ============================================

/** 卡牌资源状态 */
export interface CardAssetEntry {
  /** 卡牌定义ID */
  definitionId: string;
  /** 图片路径 */
  images: {
    small: string;
    medium: string;
    large: string;
  };
  /** 带边框的图片路径 */
  framedImages?: {
    small: string;
    medium: string;
    large: string;
  };
  /** 状态 */
  status: 'approved' | 'pending' | 'rejected';
  /** 生成信息 */
  generatedAt?: string;
  /** 审核信息 */
  reviewedAt?: string;
  /** 版本号 */
  version: number;
}

/** 资源清单 */
export interface AssetManifest {
  /** 主题ID */
  theme: string;
  /** 清单版本 */
  version: string;
  /** 生成时间 */
  generatedAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 卡牌资源（cardId -> entry） */
  cards: Record<string, CardAssetEntry>;
  /** 统计信息 */
  stats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
}

// ============================================
// 流水线配置
// ============================================

/** 流水线配置 */
export interface PipelineConfig {
  /** 输出根目录 */
  outputDir: string;
  /** Provider 配置 */
  provider: ProviderConfig;
  /** 并发数 */
  concurrency: number;
  /** 重试次数 */
  maxRetries: number;
  /** 重试延迟（毫秒） */
  retryDelay: number;
  /** 是否启用审核 */
  enableReview: boolean;
  /** 审核服务器端口 */
  reviewPort?: number;
  /** 是否自动集成 */
  autoIntegrate: boolean;
}

/** 默认配置 */
export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  outputDir: './output',
  provider: {
    type: 'openai',
  },
  concurrency: 3,
  maxRetries: 3,
  retryDelay: 2000,
  enableReview: true,
  reviewPort: 3456,
  autoIntegrate: false,
};

// ============================================
// 事件
// ============================================

/** 流水线事件类型 */
export type PipelineEventType =
  | 'task:created'
  | 'task:started'
  | 'task:progress'
  | 'task:completed'
  | 'task:failed'
  | 'batch:started'
  | 'batch:progress'
  | 'batch:completed'
  | 'review:approved'
  | 'review:rejected';

/** 流水线事件 */
export interface PipelineEvent {
  type: PipelineEventType;
  timestamp: string;
  data: unknown;
}

// ============================================
// 工具函数类型
// ============================================

/** 提取结果 */
export interface ExtractionResult {
  theme: string;
  cards: CardDefinition[];
  styleGuide: ThemeStyleGuide;
  prompts: Array<{
    cardId: string;
    cardName: string;
    prompt: string;
    negativePrompt: string;
  }>;
}

/** 处理结果 */
export interface ProcessingResult {
  taskId: string;
  cardId: string;
  inputPath: string;
  outputPaths: {
    small: string;
    medium: string;
    large: string;
  };
  framedPaths?: {
    small: string;
    medium: string;
    large: string;
  };
}

/** 集成结果 */
export interface IntegrationResult {
  theme: string;
  cardsUpdated: number;
  filesGenerated: string[];
  manifestPath: string;
}
