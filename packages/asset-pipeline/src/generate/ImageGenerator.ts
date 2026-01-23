/**
 * 图像生成器
 * 封装 AI Provider 的调用逻辑
 */

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import type {
  ImageProvider,
  ProviderConfig,
  GenerateOptions,
  GeneratedImage,
  ProviderType,
} from '../types/index.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';
import { MockProvider } from './providers/MockProvider.js';

/** 生成结果（带保存路径） */
export interface GenerationOutput {
  image: GeneratedImage;
  savedPath?: string;
}

/** 生成器选项 */
export interface ImageGeneratorOptions {
  /** Provider 配置 */
  provider: ProviderConfig;
  /** 输出目录 */
  outputDir?: string;
  /** 重试次数 */
  maxRetries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
}

/**
 * 图像生成器
 */
export class ImageGenerator {
  private provider: ImageProvider;
  private outputDir: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor(options: ImageGeneratorOptions) {
    this.provider = this.createProvider(options.provider);
    this.outputDir = options.outputDir || './output/raw';
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 2000;
  }

  /**
   * 根据配置创建 Provider
   */
  private createProvider(config: ProviderConfig): ImageProvider {
    switch (config.type) {
      case 'openai':
        return new OpenAIProvider({
          type: 'openai',
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          model: config.model as 'dall-e-2' | 'dall-e-3',
        });

      case 'mock':
        return new MockProvider({
          type: 'mock',
          ...config.options,
        });

      case 'stability':
        // TODO: 实现 Stability AI Provider
        throw new Error('Stability AI provider not implemented yet');

      case 'local-sd':
        // TODO: 实现本地 Stable Diffusion Provider
        throw new Error('Local Stable Diffusion provider not implemented yet');

      default:
        throw new Error(`Unknown provider type: ${config.type}`);
    }
  }

  /**
   * 生成单张图像
   */
  async generate(options: GenerateOptions, saveAs?: string): Promise<GenerationOutput> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const image = await this.provider.generate(options);

        // 保存图片
        let savedPath: string | undefined;
        if (saveAs) {
          savedPath = await this.saveImage(image, saveAs);
        }

        return { image, savedPath };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 如果是最后一次尝试，抛出错误
        if (attempt === this.maxRetries) {
          break;
        }

        // 等待后重试
        await this.sleep(this.retryDelay * attempt);
      }
    }

    throw lastError || new Error('Generation failed after retries');
  }

  /**
   * 保存图像到文件
   */
  async saveImage(image: GeneratedImage, filename: string): Promise<string> {
    const filePath = join(this.outputDir, filename);

    // 确保目录存在
    await mkdir(dirname(filePath), { recursive: true });

    if (image.type === 'base64') {
      // 将 base64 转为 Buffer 并保存
      const buffer = Buffer.from(image.data, 'base64');
      await writeFile(filePath, buffer);
    } else if (image.type === 'url') {
      // 从 URL 下载并保存
      const response = await fetch(image.data);
      const arrayBuffer = await response.arrayBuffer();
      await writeFile(filePath, Buffer.from(arrayBuffer));
    }

    return filePath;
  }

  /**
   * 检查 Provider 是否可用
   */
  async checkAvailability(): Promise<boolean> {
    return this.provider.isAvailable();
  }

  /**
   * 获取 Provider 信息
   */
  getProviderInfo(): {
    name: string;
    type: ProviderType;
    model: string;
    version?: string;
  } {
    const modelInfo = this.provider.getModelInfo();
    return {
      name: this.provider.name,
      type: this.provider.type,
      ...modelInfo,
    };
  }

  /**
   * 更新 Provider
   */
  setProvider(config: ProviderConfig): void {
    this.provider = this.createProvider(config);
  }

  /**
   * 获取当前 Provider
   */
  getProvider(): ImageProvider {
    return this.provider;
  }

  /**
   * 设置输出目录
   */
  setOutputDir(dir: string): void {
    this.outputDir = dir;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default ImageGenerator;
