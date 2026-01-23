/**
 * Mock 图像生成 Provider（用于测试和开发）
 */

import type {
  ImageProvider,
  GenerateOptions,
  GeneratedImage,
  ProviderConfig,
} from '../../types/index.js';

/** Mock Provider 配置 */
export interface MockProviderConfig extends ProviderConfig {
  type: 'mock';
  /** 模拟延迟（毫秒） */
  delay?: number;
  /** 失败率（0-1） */
  failureRate?: number;
  /** 固定返回的图片数据 */
  fixedImage?: string;
}

// 1x1 透明 PNG 的 base64
const PLACEHOLDER_IMAGE =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// 简单的彩色占位图生成（10x10 像素）
function generateColoredPlaceholder(seed: string): string {
  // 根据种子生成颜色
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }

  const r = (hash & 0xff0000) >> 16;
  const g = (hash & 0x00ff00) >> 8;
  const b = hash & 0x0000ff;

  // 生成简单的 BMP 头（用于调试可视化）
  // 这里简化处理，返回基础占位图
  return PLACEHOLDER_IMAGE;
}

/**
 * Mock 图像生成 Provider
 * 用于测试和开发，不调用真实 API
 */
export class MockProvider implements ImageProvider {
  readonly name = 'Mock Provider';
  readonly type = 'mock' as const;

  private delay: number;
  private failureRate: number;
  private fixedImage?: string;
  private callCount = 0;

  constructor(config: MockProviderConfig = { type: 'mock' }) {
    this.delay = config.delay ?? 100;
    this.failureRate = config.failureRate ?? 0;
    this.fixedImage = config.fixedImage;
  }

  /**
   * 生成图像（模拟）
   */
  async generate(options: GenerateOptions): Promise<GeneratedImage> {
    this.callCount++;

    // 模拟延迟
    if (this.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delay));
    }

    // 模拟随机失败
    if (this.failureRate > 0 && Math.random() < this.failureRate) {
      throw new Error('Mock provider simulated failure');
    }

    // 返回固定图片或生成占位图
    const imageData = this.fixedImage || generateColoredPlaceholder(options.prompt);

    return {
      data: imageData,
      type: 'base64',
      revisedPrompt: `[MOCK] ${options.prompt}`,
      seed: Math.floor(Math.random() * 1000000),
    };
  }

  /**
   * 检查是否可用
   */
  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * 获取模型信息
   */
  getModelInfo(): { model: string; version?: string } {
    return {
      model: 'mock-model',
      version: '1.0.0',
    };
  }

  /**
   * 获取调用次数（用于测试）
   */
  getCallCount(): number {
    return this.callCount;
  }

  /**
   * 重置计数器
   */
  resetCallCount(): void {
    this.callCount = 0;
  }
}

export default MockProvider;
