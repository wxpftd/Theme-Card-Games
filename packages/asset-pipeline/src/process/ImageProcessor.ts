/**
 * 图片处理器
 * 处理 AI 生成的原始图片：裁剪、缩放、合成边框
 */

import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import type { OutputSpec, ImageSize, ProcessingResult } from '../types/index.js';

/** 处理选项 */
export interface ProcessOptions {
  /** 输入图片路径 */
  inputPath: string;
  /** 输出目录 */
  outputDir: string;
  /** 卡牌ID */
  cardId: string;
  /** 输出规格 */
  outputSpec: OutputSpec;
  /** 边框模板目录（可选） */
  framesDir?: string;
  /** 稀有度（用于选择边框） */
  rarity?: string;
}

/** 裁剪区域 */
export interface CropRegion {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * 图片处理器
 */
export class ImageProcessor {
  private framesCache: Map<string, Buffer> = new Map();

  /**
   * 处理单张图片
   */
  async process(options: ProcessOptions): Promise<ProcessingResult> {
    const { inputPath, outputDir, cardId, outputSpec, framesDir, rarity } = options;

    // 确保输出目录存在
    await mkdir(outputDir, { recursive: true });

    // 读取原始图片
    const inputBuffer = await readFile(inputPath);
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error(`Cannot read image dimensions: ${inputPath}`);
    }

    // 计算裁剪区域（保持卡牌比例）
    const targetRatio = outputSpec.sizes.medium.width / outputSpec.sizes.medium.height;
    const cropRegion = this.calculateCropRegion(metadata.width, metadata.height, targetRatio);

    // 生成各尺寸的图片
    const outputPaths: Record<'small' | 'medium' | 'large', string> = {
      small: '',
      medium: '',
      large: '',
    };

    const framedPaths: Record<'small' | 'medium' | 'large', string> = {
      small: '',
      medium: '',
      large: '',
    };

    for (const size of ['small', 'medium', 'large'] as const) {
      const sizeSpec = outputSpec.sizes[size];
      const filename = `${cardId}-${size}.${outputSpec.format}`;
      const outputPath = join(outputDir, filename);

      // 裁剪并缩放
      await this.cropAndResize(
        inputBuffer,
        cropRegion,
        sizeSpec,
        outputPath,
        outputSpec.format,
        outputSpec.quality
      );

      outputPaths[size] = outputPath;

      // 如果需要生成带边框的版本
      if (outputSpec.withFrame && framesDir) {
        const framedFilename = `${cardId}-${size}-framed.${outputSpec.format}`;
        const framedPath = join(outputDir, framedFilename);

        await this.addFrame(
          outputPath,
          framedPath,
          framesDir,
          rarity || 'common',
          size,
          outputSpec
        );

        framedPaths[size] = framedPath;
      }
    }

    return {
      taskId: `process-${cardId}`,
      cardId,
      inputPath,
      outputPaths,
      framedPaths: outputSpec.withFrame ? framedPaths : undefined,
    };
  }

  /**
   * 批量处理图片
   */
  async processBatch(
    tasks: Array<{
      inputPath: string;
      cardId: string;
      rarity?: string;
    }>,
    outputDir: string,
    outputSpec: OutputSpec,
    framesDir?: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];

      try {
        const result = await this.process({
          inputPath: task.inputPath,
          outputDir,
          cardId: task.cardId,
          outputSpec,
          framesDir,
          rarity: task.rarity,
        });

        results.push(result);
      } catch (error) {
        console.error(`Failed to process ${task.cardId}:`, error);
        // 继续处理下一个
      }

      if (onProgress) {
        onProgress(i + 1, tasks.length);
      }
    }

    return results;
  }

  /**
   * 计算裁剪区域（居中裁剪）
   */
  private calculateCropRegion(
    sourceWidth: number,
    sourceHeight: number,
    targetRatio: number
  ): CropRegion {
    const sourceRatio = sourceWidth / sourceHeight;

    let cropWidth: number;
    let cropHeight: number;

    if (sourceRatio > targetRatio) {
      // 原图更宽，需要裁剪左右
      cropHeight = sourceHeight;
      cropWidth = Math.round(sourceHeight * targetRatio);
    } else {
      // 原图更高，需要裁剪上下
      cropWidth = sourceWidth;
      cropHeight = Math.round(sourceWidth / targetRatio);
    }

    // 居中裁剪
    const left = Math.round((sourceWidth - cropWidth) / 2);
    const top = Math.round((sourceHeight - cropHeight) / 2);

    return { left, top, width: cropWidth, height: cropHeight };
  }

  /**
   * 裁剪并缩放图片
   */
  private async cropAndResize(
    inputBuffer: Buffer,
    cropRegion: CropRegion,
    targetSize: ImageSize,
    outputPath: string,
    format: 'png' | 'webp' | 'jpeg',
    quality: number
  ): Promise<void> {
    let pipeline = sharp(inputBuffer)
      .extract({
        left: cropRegion.left,
        top: cropRegion.top,
        width: cropRegion.width,
        height: cropRegion.height,
      })
      .resize(targetSize.width, targetSize.height, {
        fit: 'fill',
        kernel: 'lanczos3',
      });

    // 应用格式和质量
    switch (format) {
      case 'png':
        pipeline = pipeline.png({ quality });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality });
        break;
    }

    await pipeline.toFile(outputPath);
  }

  /**
   * 添加边框
   */
  private async addFrame(
    inputPath: string,
    outputPath: string,
    framesDir: string,
    rarity: string,
    size: 'small' | 'medium' | 'large',
    outputSpec: OutputSpec
  ): Promise<void> {
    // 加载边框模板
    const framePath = join(framesDir, `${rarity}-${size}.png`);
    const fallbackFramePath = join(framesDir, `${rarity}.png`);
    const defaultFramePath = join(framesDir, `common-${size}.png`);
    const defaultFallbackPath = join(framesDir, `common.png`);

    let frameBuffer: Buffer | null = null;

    // 尝试加载边框（按优先级）
    for (const path of [framePath, fallbackFramePath, defaultFramePath, defaultFallbackPath]) {
      if (existsSync(path)) {
        const cacheKey = `${path}-${size}`;
        if (this.framesCache.has(cacheKey)) {
          frameBuffer = this.framesCache.get(cacheKey)!;
        } else {
          frameBuffer = await readFile(path);

          // 如果边框尺寸不匹配，缩放它
          const frameMeta = await sharp(frameBuffer).metadata();
          const targetSize = outputSpec.sizes[size];

          if (frameMeta.width !== targetSize.width || frameMeta.height !== targetSize.height) {
            frameBuffer = await sharp(frameBuffer)
              .resize(targetSize.width, targetSize.height, { fit: 'fill' })
              .png()
              .toBuffer();
          }

          this.framesCache.set(cacheKey, frameBuffer);
        }
        break;
      }
    }

    if (!frameBuffer) {
      // 没有边框，直接复制原图
      const inputBuffer = await readFile(inputPath);
      await writeFile(outputPath, inputBuffer);
      return;
    }

    // 合成边框
    const inputBuffer = await readFile(inputPath);

    await sharp(inputBuffer)
      .composite([
        {
          input: frameBuffer,
          blend: 'over',
        },
      ])
      .toFile(outputPath);
  }

  /**
   * 清除边框缓存
   */
  clearFramesCache(): void {
    this.framesCache.clear();
  }

  /**
   * 获取图片信息
   */
  async getImageInfo(imagePath: string): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    const buffer = await readFile(imagePath);
    const metadata = await sharp(buffer).metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: buffer.length,
    };
  }

  /**
   * 验证图片质量
   */
  async validateImage(
    imagePath: string,
    minWidth: number = 100,
    minHeight: number = 100
  ): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      const info = await this.getImageInfo(imagePath);

      if (info.width < minWidth) {
        issues.push(`Image width (${info.width}) is less than minimum (${minWidth})`);
      }

      if (info.height < minHeight) {
        issues.push(`Image height (${info.height}) is less than minimum (${minHeight})`);
      }

      if (info.size === 0) {
        issues.push('Image file is empty');
      }
    } catch (error) {
      issues.push(`Failed to read image: ${error}`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

export default ImageProcessor;
