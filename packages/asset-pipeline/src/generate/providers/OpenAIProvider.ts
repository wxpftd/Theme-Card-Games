/**
 * OpenAI DALL-E 图像生成 Provider
 */

import OpenAI from 'openai';
import type {
  ImageProvider,
  GenerateOptions,
  GeneratedImage,
  ProviderConfig,
} from '../../types/index.js';

/** OpenAI Provider 配置 */
export interface OpenAIProviderConfig extends ProviderConfig {
  type: 'openai';
  apiKey?: string;
  model?: 'dall-e-2' | 'dall-e-3';
  /** 默认质量 */
  defaultQuality?: 'standard' | 'hd';
  /** 默认风格 */
  defaultStyle?: 'vivid' | 'natural';
}

/**
 * OpenAI DALL-E 图像生成 Provider
 */
export class OpenAIProvider implements ImageProvider {
  readonly name = 'OpenAI DALL-E';
  readonly type = 'openai' as const;

  private client: OpenAI;
  private model: 'dall-e-2' | 'dall-e-3';
  private defaultQuality: 'standard' | 'hd';
  private defaultStyle: 'vivid' | 'natural';

  constructor(config: OpenAIProviderConfig = { type: 'openai' }) {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass apiKey in config.'
      );
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: config.baseUrl,
    });

    this.model = config.model || 'dall-e-3';
    this.defaultQuality = config.defaultQuality || 'standard';
    this.defaultStyle = config.defaultStyle || 'vivid';
  }

  /**
   * 生成图像
   */
  async generate(options: GenerateOptions): Promise<GeneratedImage> {
    const { prompt, size, quality, style, n = 1 } = options;

    // DALL-E 3 只支持特定尺寸
    const imageSize = this.mapSize(size);

    try {
      const response = await this.client.images.generate({
        model: this.model,
        prompt: this.preparePrompt(prompt),
        n: this.model === 'dall-e-3' ? 1 : n, // DALL-E 3 only supports n=1
        size: imageSize,
        quality: quality || this.defaultQuality,
        style: style || this.defaultStyle,
        response_format: 'b64_json',
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No image data in response');
      }

      const imageData = response.data[0];

      if (!imageData.b64_json) {
        throw new Error('No b64_json data in response');
      }

      return {
        data: imageData.b64_json,
        type: 'base64',
        revisedPrompt: imageData.revised_prompt,
      };
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API error: ${error.message} (${error.status})`);
      }
      throw error;
    }
  }

  /**
   * 检查是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      // 简单检查 API 连接
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取模型信息
   */
  getModelInfo(): { model: string; version?: string } {
    return {
      model: this.model,
      version: this.model === 'dall-e-3' ? '3.0' : '2.0',
    };
  }

  /**
   * 映射尺寸到 DALL-E 支持的尺寸
   */
  private mapSize(size?: {
    width: number;
    height: number;
  }): '1024x1024' | '1792x1024' | '1024x1792' | '512x512' | '256x256' {
    if (!size) {
      return '1024x1024';
    }

    // DALL-E 3 支持的尺寸
    if (this.model === 'dall-e-3') {
      const ratio = size.width / size.height;

      if (ratio > 1.5) {
        return '1792x1024'; // 横向
      } else if (ratio < 0.67) {
        return '1024x1792'; // 纵向
      } else {
        return '1024x1024'; // 方形
      }
    }

    // DALL-E 2 支持的尺寸
    if (size.width <= 256 || size.height <= 256) {
      return '256x256';
    } else if (size.width <= 512 || size.height <= 512) {
      return '512x512';
    } else {
      return '1024x1024';
    }
  }

  /**
   * 准备提示词（确保质量）
   */
  private preparePrompt(prompt: string): string {
    // DALL-E 3 有 4000 字符限制
    const maxLength = 4000;

    let prepared = prompt;

    // 确保有基本的质量描述
    if (!prompt.toLowerCase().includes('high quality')) {
      prepared = `high quality, ${prepared}`;
    }

    // 截断过长的提示词
    if (prepared.length > maxLength) {
      prepared = prepared.substring(0, maxLength - 3) + '...';
    }

    return prepared;
  }
}

export default OpenAIProvider;
