/**
 * 卡牌素材制作流水线
 *
 * 提供完整的卡牌图片生成工作流：
 * 1. 提取 (Extract): 从主题配置提取卡牌定义，生成 AI 提示词
 * 2. 生成 (Generate): 调用 AI 图像生成服务创建原始图片
 * 3. 处理 (Process): 裁剪、缩放、添加边框
 * 4. 集成 (Integrate): 更新资源清单，集成到主题包
 */

// 类型
export type {
  ThemeStyleGuide,
  PromptTemplate,
  VisualSpec,
  OutputSpec,
  ImageSize,
  GenerationTask,
  TaskStatus,
  GenerationResult,
  ImageProvider,
  ProviderType,
  ProviderConfig,
  GenerateOptions,
  GeneratedImage,
  AssetManifest,
  CardAssetEntry,
  PipelineConfig,
  PipelineEvent,
  PipelineEventType,
  ExtractionResult,
  ProcessingResult,
  IntegrationResult,
} from './types/index.js';

export { DEFAULT_PIPELINE_CONFIG } from './types/index.js';

// 提取模块
export { CardExtractor, type ExtractOptions } from './extract/CardExtractor.js';

export { PromptGenerator, type GeneratedPrompt } from './extract/PromptGenerator.js';

export {
  StyleGuideManager,
  PRESET_STYLE_GUIDES,
  DEFAULT_OUTPUT_SPEC,
} from './extract/StyleGuide.js';

// 生成模块
export {
  ImageGenerator,
  type ImageGeneratorOptions,
  type GenerationOutput,
} from './generate/ImageGenerator.js';

export {
  BatchManager,
  type BatchStatus,
  type BatchManagerEvents,
} from './generate/BatchManager.js';

export { OpenAIProvider, type OpenAIProviderConfig } from './generate/providers/OpenAIProvider.js';

export { MockProvider, type MockProviderConfig } from './generate/providers/MockProvider.js';

// 处理模块
export { ImageProcessor, type ProcessOptions, type CropRegion } from './process/ImageProcessor.js';

// 集成模块
export { AssetManager } from './integrate/AssetManager.js';

/**
 * 创建完整的流水线实例
 */
export function createPipeline(options: {
  theme: string;
  outputDir?: string;
  provider?: ProviderConfig;
}) {
  const {
    theme,
    outputDir = './asset-pipeline-output',
    provider = { type: 'mock' as const },
  } = options;

  return {
    extractor: new CardExtractor(outputDir + '/style-guides'),
    styleGuideManager: new StyleGuideManager(outputDir + '/style-guides'),
    generator: new ImageGenerator({
      provider,
      outputDir: `${outputDir}/${theme}/raw`,
    }),
    processor: new ImageProcessor(),
    assetManager: new AssetManager(outputDir),
  };
}

// 重新导出 ProviderConfig 以便使用
import type { ProviderConfig } from './types/index.js';
import { CardExtractor } from './extract/CardExtractor.js';
import { StyleGuideManager } from './extract/StyleGuide.js';
import { ImageGenerator } from './generate/ImageGenerator.js';
import { ImageProcessor } from './process/ImageProcessor.js';
import { AssetManager } from './integrate/AssetManager.js';
