/**
 * 资源管理器
 * 管理生成的资源清单和元数据
 */

import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type {
  AssetManifest,
  CardAssetEntry,
  GenerationTask,
  ProcessingResult,
} from '../types/index.js';

/**
 * 资源管理器
 */
export class AssetManager {
  private outputDir: string;
  private manifest: AssetManifest | null = null;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  /**
   * 加载或创建清单
   */
  async loadManifest(theme: string): Promise<AssetManifest> {
    const manifestPath = this.getManifestPath(theme);

    if (existsSync(manifestPath)) {
      try {
        const content = await readFile(manifestPath, 'utf-8');
        this.manifest = JSON.parse(content);
        return this.manifest!;
      } catch {
        // 文件损坏，创建新的
      }
    }

    // 创建新清单
    this.manifest = {
      theme,
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cards: {},
      stats: {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      },
    };

    return this.manifest;
  }

  /**
   * 保存清单
   */
  async saveManifest(theme: string): Promise<void> {
    if (!this.manifest) {
      throw new Error('No manifest loaded');
    }

    // 更新统计
    this.updateStats();

    // 更新时间
    this.manifest.updatedAt = new Date().toISOString();

    const manifestPath = this.getManifestPath(theme);
    await mkdir(join(this.outputDir, theme), { recursive: true });
    await writeFile(manifestPath, JSON.stringify(this.manifest, null, 2), 'utf-8');
  }

  /**
   * 添加或更新卡牌资源
   */
  addCardAsset(
    cardId: string,
    result: ProcessingResult,
    status: 'approved' | 'pending' | 'rejected' = 'pending'
  ): void {
    if (!this.manifest) {
      throw new Error('No manifest loaded');
    }

    const existing = this.manifest.cards[cardId];
    const version = existing ? existing.version + 1 : 1;

    this.manifest.cards[cardId] = {
      definitionId: cardId,
      images: result.outputPaths,
      framedImages: result.framedPaths,
      status,
      generatedAt: new Date().toISOString(),
      version,
    };
  }

  /**
   * 从生成任务更新清单
   */
  updateFromTask(task: GenerationTask): void {
    if (!this.manifest || !task.result) {
      return;
    }

    const status =
      task.status === 'approved' ? 'approved' : task.status === 'rejected' ? 'rejected' : 'pending';

    const existing = this.manifest.cards[task.cardId];
    const version = existing ? existing.version + 1 : 1;

    this.manifest.cards[task.cardId] = {
      definitionId: task.cardId,
      images: task.result.processedImages,
      framedImages: task.result.framedImages,
      status,
      generatedAt: task.result.metadata.generatedAt,
      version,
    };
  }

  /**
   * 批量更新资源状态
   */
  updateStatus(cardIds: string[], status: 'approved' | 'pending' | 'rejected'): void {
    if (!this.manifest) {
      return;
    }

    for (const cardId of cardIds) {
      if (this.manifest.cards[cardId]) {
        this.manifest.cards[cardId].status = status;
        if (status === 'approved' || status === 'rejected') {
          this.manifest.cards[cardId].reviewedAt = new Date().toISOString();
        }
      }
    }
  }

  /**
   * 获取卡牌资源
   */
  getCardAsset(cardId: string): CardAssetEntry | undefined {
    return this.manifest?.cards[cardId];
  }

  /**
   * 获取所有卡牌资源
   */
  getAllCardAssets(): Record<string, CardAssetEntry> {
    return this.manifest?.cards || {};
  }

  /**
   * 获取指定状态的卡牌
   */
  getCardsByStatus(status: 'approved' | 'pending' | 'rejected'): CardAssetEntry[] {
    if (!this.manifest) {
      return [];
    }

    return Object.values(this.manifest.cards).filter((c) => c.status === status);
  }

  /**
   * 获取清单
   */
  getManifest(): AssetManifest | null {
    return this.manifest;
  }

  /**
   * 获取统计信息
   */
  getStats(): AssetManifest['stats'] {
    return (
      this.manifest?.stats || {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      }
    );
  }

  /**
   * 扫描输出目录并同步清单
   */
  async syncFromDirectory(theme: string): Promise<void> {
    const themeDir = join(this.outputDir, theme, 'processed');

    if (!existsSync(themeDir)) {
      return;
    }

    const files = await readdir(themeDir);

    // 按卡牌ID分组
    const cardFiles: Record<string, string[]> = {};

    for (const file of files) {
      // 解析文件名: cardId-size.format
      const match = file.match(/^(.+)-(small|medium|large)(-framed)?\.(\w+)$/);
      if (match) {
        const [, cardId] = match;
        if (!cardFiles[cardId]) {
          cardFiles[cardId] = [];
        }
        cardFiles[cardId].push(file);
      }
    }

    // 更新清单
    for (const [cardId, files] of Object.entries(cardFiles)) {
      if (!this.manifest!.cards[cardId]) {
        // 发现新的卡牌资源
        const images: Record<string, string> = {};
        const framedImages: Record<string, string> = {};

        for (const file of files) {
          const isFramed = file.includes('-framed');
          const sizeMatch = file.match(/-(small|medium|large)/);
          if (sizeMatch) {
            const size = sizeMatch[1] as 'small' | 'medium' | 'large';
            const path = join(themeDir, file);
            if (isFramed) {
              framedImages[size] = path;
            } else {
              images[size] = path;
            }
          }
        }

        this.manifest!.cards[cardId] = {
          definitionId: cardId,
          images: images as CardAssetEntry['images'],
          framedImages:
            Object.keys(framedImages).length > 0
              ? (framedImages as CardAssetEntry['images'])
              : undefined,
          status: 'pending',
          version: 1,
        };
      }
    }

    this.updateStats();
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    if (!this.manifest) {
      return;
    }

    const cards = Object.values(this.manifest.cards);

    this.manifest.stats = {
      total: cards.length,
      approved: cards.filter((c) => c.status === 'approved').length,
      pending: cards.filter((c) => c.status === 'pending').length,
      rejected: cards.filter((c) => c.status === 'rejected').length,
    };
  }

  /**
   * 获取清单路径
   */
  private getManifestPath(theme: string): string {
    return join(this.outputDir, theme, 'manifest.json');
  }

  /**
   * 导出为简化格式（用于前端加载）
   */
  exportSimplified(
    theme: string
  ): Record<string, { small: string; medium: string; large: string }> {
    if (!this.manifest) {
      return {};
    }

    const result: Record<string, { small: string; medium: string; large: string }> = {};

    for (const [cardId, entry] of Object.entries(this.manifest.cards)) {
      if (entry.status === 'approved') {
        result[cardId] = entry.images;
      }
    }

    return result;
  }
}

export default AssetManager;
