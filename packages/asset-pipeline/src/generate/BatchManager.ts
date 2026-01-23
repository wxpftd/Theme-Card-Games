/**
 * 批量生成管理器
 * 管理大量卡牌图像的批量生成，支持并发控制、断点续传、进度追踪
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import type {
  GenerationTask,
  TaskStatus,
  ThemeStyleGuide,
  PipelineConfig,
} from '../types/index.js';
import type { CardDefinition } from '@theme-card-games/core';
import { ImageGenerator } from './ImageGenerator.js';
import { PromptGenerator } from '../extract/PromptGenerator.js';

/** 批量任务状态 */
export interface BatchStatus {
  total: number;
  pending: number;
  generating: number;
  completed: number;
  failed: number;
  progress: number; // 0-100
}

/** 批量管理器事件 */
export interface BatchManagerEvents {
  'task:start': (task: GenerationTask) => void;
  'task:complete': (task: GenerationTask) => void;
  'task:fail': (task: GenerationTask, error: Error) => void;
  'batch:progress': (status: BatchStatus) => void;
  'batch:complete': (tasks: GenerationTask[]) => void;
}

/**
 * 批量生成管理器
 */
export class BatchManager extends EventEmitter {
  private tasks: Map<string, GenerationTask> = new Map();
  private generator: ImageGenerator;
  private promptGenerator: PromptGenerator;
  private config: PipelineConfig;
  private stateFilePath: string;
  private isRunning = false;
  private shouldStop = false;

  constructor(styleGuide: ThemeStyleGuide, config: PipelineConfig) {
    super();
    this.config = config;
    this.promptGenerator = new PromptGenerator(styleGuide);
    this.generator = new ImageGenerator({
      provider: config.provider,
      outputDir: join(config.outputDir, styleGuide.id, 'raw'),
      maxRetries: config.maxRetries,
      retryDelay: config.retryDelay,
    });
    this.stateFilePath = join(config.outputDir, styleGuide.id, 'batch-state.json');
  }

  /**
   * 添加卡牌到批量任务
   */
  addCards(cards: CardDefinition[], theme: string): void {
    const now = new Date().toISOString();

    for (const card of cards) {
      // 检查是否已存在
      if (this.tasks.has(card.id)) {
        continue;
      }

      const prompt = this.promptGenerator.generatePrompt(card);

      const task: GenerationTask = {
        id: `task-${card.id}-${Date.now()}`,
        cardId: card.id,
        cardDefinition: card,
        theme,
        prompt: prompt.prompt,
        negativePrompt: prompt.negativePrompt,
        status: 'pending',
        attempts: 0,
        maxAttempts: this.config.maxRetries,
        createdAt: now,
        updatedAt: now,
      };

      this.tasks.set(card.id, task);
    }
  }

  /**
   * 开始批量生成
   */
  async run(): Promise<GenerationTask[]> {
    if (this.isRunning) {
      throw new Error('Batch is already running');
    }

    this.isRunning = true;
    this.shouldStop = false;

    // 尝试恢复之前的状态
    await this.loadState();

    // 获取待处理任务
    const pendingTasks = this.getPendingTasks();

    // 并发处理
    const concurrency = this.config.concurrency;
    const results: GenerationTask[] = [];

    // 分批处理
    for (let i = 0; i < pendingTasks.length && !this.shouldStop; i += concurrency) {
      const batch = pendingTasks.slice(i, i + concurrency);

      // 并发执行当前批次
      const batchResults = await Promise.all(batch.map((task) => this.processTask(task)));

      results.push(...batchResults);

      // 保存状态
      await this.saveState();

      // 发送进度事件
      this.emit('batch:progress', this.getStatus());
    }

    this.isRunning = false;
    this.emit('batch:complete', results);

    return results;
  }

  /**
   * 停止批量生成
   */
  stop(): void {
    this.shouldStop = true;
  }

  /**
   * 处理单个任务
   */
  private async processTask(task: GenerationTask): Promise<GenerationTask> {
    task.status = 'generating';
    task.attempts++;
    task.updatedAt = new Date().toISOString();

    this.emit('task:start', task);

    try {
      // 生成图像
      const filename = `${task.cardId}.png`;
      const result = await this.generator.generate(
        {
          prompt: task.prompt,
          negativePrompt: task.negativePrompt,
        },
        filename
      );

      // 更新任务状态
      task.status = this.config.enableReview ? 'review' : 'approved';
      task.result = {
        taskId: task.id,
        rawImagePath: result.savedPath || '',
        processedImages: {
          small: '',
          medium: '',
          large: '',
        },
        metadata: {
          provider: this.generator.getProviderInfo().name,
          model: this.generator.getProviderInfo().model,
          generatedAt: new Date().toISOString(),
          prompt: task.prompt,
          revisedPrompt: result.image.revisedPrompt,
          seed: result.image.seed,
        },
      };
      task.updatedAt = new Date().toISOString();

      this.emit('task:complete', task);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // 检查是否还可以重试
      if (task.attempts < task.maxAttempts) {
        task.status = 'pending';
      } else {
        task.status = 'failed';
        task.error = err.message;
      }
      task.updatedAt = new Date().toISOString();

      this.emit('task:fail', task, err);
    }

    this.tasks.set(task.cardId, task);
    return task;
  }

  /**
   * 获取待处理任务
   */
  private getPendingTasks(): GenerationTask[] {
    return Array.from(this.tasks.values()).filter((task) => task.status === 'pending');
  }

  /**
   * 获取当前状态
   */
  getStatus(): BatchStatus {
    const tasks = Array.from(this.tasks.values());
    const total = tasks.length;

    const pending = tasks.filter((t) => t.status === 'pending').length;
    const generating = tasks.filter((t) => t.status === 'generating').length;
    const completed = tasks.filter((t) => t.status === 'approved' || t.status === 'review').length;
    const failed = tasks.filter((t) => t.status === 'failed').length;

    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, pending, generating, completed, failed, progress };
  }

  /**
   * 获取所有任务
   */
  getTasks(): GenerationTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 获取特定状态的任务
   */
  getTasksByStatus(status: TaskStatus): GenerationTask[] {
    return Array.from(this.tasks.values()).filter((t) => t.status === status);
  }

  /**
   * 重试失败的任务
   */
  retryFailed(): void {
    for (const task of this.tasks.values()) {
      if (task.status === 'failed') {
        task.status = 'pending';
        task.attempts = 0;
        task.error = undefined;
        task.updatedAt = new Date().toISOString();
      }
    }
  }

  /**
   * 保存状态到文件（用于断点续传）
   */
  async saveState(): Promise<void> {
    const state = {
      savedAt: new Date().toISOString(),
      tasks: Array.from(this.tasks.entries()),
    };

    await mkdir(join(this.config.outputDir), { recursive: true });
    await writeFile(this.stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
  }

  /**
   * 从文件加载状态
   */
  async loadState(): Promise<boolean> {
    if (!existsSync(this.stateFilePath)) {
      return false;
    }

    try {
      const content = await readFile(this.stateFilePath, 'utf-8');
      const state = JSON.parse(content);

      this.tasks = new Map(state.tasks);

      // 将正在生成的任务重置为待处理
      for (const task of this.tasks.values()) {
        if (task.status === 'generating') {
          task.status = 'pending';
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * 清除状态
   */
  clearState(): void {
    this.tasks.clear();
  }

  /**
   * 更新任务状态（用于审核）
   */
  updateTaskStatus(cardId: string, status: TaskStatus): void {
    const task = this.tasks.get(cardId);
    if (task) {
      task.status = status;
      task.updatedAt = new Date().toISOString();
    }
  }
}

export default BatchManager;
