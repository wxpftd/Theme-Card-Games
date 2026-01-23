#!/usr/bin/env node
/**
 * 卡牌素材制作流水线 CLI
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { config as loadEnv } from 'dotenv';

import { CardExtractor } from './extract/CardExtractor.js';
import { StyleGuideManager, PRESET_STYLE_GUIDES } from './extract/StyleGuide.js';
import { ImageGenerator } from './generate/ImageGenerator.js';
import { BatchManager } from './generate/BatchManager.js';
import { ImageProcessor } from './process/ImageProcessor.js';
import { AssetManager } from './integrate/AssetManager.js';
import type {
  ThemeStyleGuide,
  PipelineConfig,
  DEFAULT_PIPELINE_CONFIG,
  ProviderType,
} from './types/index.js';
import type { CardDefinition } from '@theme-card-games/core';

// 加载环境变量
loadEnv();

const program = new Command();

program.name('asset-pipeline').description('卡牌素材制作流水线工具').version('0.1.0');

// ============================================
// init 命令：初始化主题风格指南
// ============================================
program
  .command('init')
  .description('初始化主题风格指南')
  .requiredOption('-t, --theme <theme>', '主题ID')
  .option('-o, --output <dir>', '输出目录', './asset-pipeline-output')
  .action(async (options) => {
    const spinner = ora('初始化风格指南...').start();

    try {
      const { theme, output } = options;

      // 检查是否有预置配置
      const styleGuideManager = new StyleGuideManager(join(output, 'style-guides'));
      let guide = await styleGuideManager.getStyleGuide(theme);

      if (!guide) {
        // 创建基础风格指南
        guide = styleGuideManager.createStyleGuide(theme, theme);
      }

      // 保存到文件
      const outputPath = join(output, 'style-guides', `${theme}.json`);
      await mkdir(join(output, 'style-guides'), { recursive: true });
      await writeFile(outputPath, JSON.stringify(guide, null, 2), 'utf-8');

      spinner.succeed(`风格指南已保存到: ${outputPath}`);

      console.log(chalk.cyan('\n预置的主题风格指南:'));
      for (const id of Object.keys(PRESET_STYLE_GUIDES)) {
        console.log(`  - ${id}`);
      }

      console.log(chalk.yellow('\n提示: 你可以编辑风格指南文件来自定义提示词模板'));
    } catch (error) {
      spinner.fail('初始化失败');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

// ============================================
// extract 命令：提取卡牌并生成提示词
// ============================================
program
  .command('extract')
  .description('提取卡牌定义并生成 AI 提示词')
  .requiredOption('-t, --theme <theme>', '主题ID')
  .option('-c, --cards <file>', '卡牌定义 JSON 文件')
  .option('-o, --output <file>', '输出文件', './prompts.json')
  .option('--preview', '仅预览，不保存')
  .action(async (options) => {
    const spinner = ora('提取卡牌定义...').start();

    try {
      const { theme, cards: cardsFile, output, preview } = options;

      // 加载卡牌定义
      let cards: CardDefinition[] | undefined;
      if (cardsFile && existsSync(cardsFile)) {
        const content = await readFile(cardsFile, 'utf-8');
        cards = JSON.parse(content);
      }

      // 提取
      const extractor = new CardExtractor();

      if (preview) {
        const previewResult = await extractor.preview({
          themeId: theme,
          cards,
        });

        spinner.succeed('提取完成');

        console.log(chalk.cyan('\n提取预览:'));
        console.log(`  总卡牌数: ${previewResult.totalCards}`);
        console.log(`  按类型分布:`, previewResult.byType);
        console.log(`  按稀有度分布:`, previewResult.byRarity);

        console.log(chalk.cyan('\n示例提示词:'));
        for (const sample of previewResult.samplePrompts) {
          console.log(chalk.yellow(`\n  [${sample.cardName}]`));
          console.log(`  ${sample.prompt.substring(0, 200)}...`);
        }
      } else {
        const result = await extractor.extract({
          themeId: theme,
          cards,
        });

        // 保存结果
        await writeFile(output, JSON.stringify(result.prompts, null, 2), 'utf-8');

        spinner.succeed(`提示词已保存到: ${output}`);
        console.log(`  共 ${result.prompts.length} 张卡牌`);
      }
    } catch (error) {
      spinner.fail('提取失败');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

// ============================================
// generate 命令：生成单张卡牌图片
// ============================================
program
  .command('generate')
  .description('生成单张卡牌图片（测试用）')
  .requiredOption('-t, --theme <theme>', '主题ID')
  .requiredOption('-c, --card <cardId>', '卡牌ID')
  .option('-p, --provider <provider>', 'AI Provider (openai, mock)', 'mock')
  .option('-o, --output <dir>', '输出目录', './asset-pipeline-output')
  .option('--prompt <prompt>', '自定义提示词')
  .action(async (options) => {
    const spinner = ora('生成图片...').start();

    try {
      const { theme, card: cardId, provider, output, prompt: customPrompt } = options;

      // 获取风格指南
      const styleGuideManager = new StyleGuideManager(join(output, 'style-guides'));
      const styleGuide = await styleGuideManager.getStyleGuide(theme);

      if (!styleGuide) {
        throw new Error(`找不到主题 "${theme}" 的风格指南，请先运行 init 命令`);
      }

      // 创建生成器
      const generator = new ImageGenerator({
        provider: {
          type: provider as ProviderType,
          apiKey: process.env.OPENAI_API_KEY,
        },
        outputDir: join(output, theme, 'raw'),
      });

      // 生成提示词
      let prompt = customPrompt;
      if (!prompt) {
        const { PromptGenerator } = await import('./extract/PromptGenerator.js');
        const promptGen = new PromptGenerator(styleGuide);
        const generated = promptGen.generatePrompt({
          id: cardId,
          type: 'action',
          name: cardId,
          description: '',
          effects: [],
        });
        prompt = generated.prompt;
      }

      spinner.text = `生成提示词: ${prompt.substring(0, 50)}...`;

      // 生成图片
      const result = await generator.generate({ prompt }, `${cardId}.png`);

      spinner.succeed('图片生成成功');
      console.log(`  保存路径: ${result.savedPath}`);

      if (result.image.revisedPrompt) {
        console.log(chalk.cyan('\nAI 修改后的提示词:'));
        console.log(`  ${result.image.revisedPrompt}`);
      }
    } catch (error) {
      spinner.fail('生成失败');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

// ============================================
// batch 命令：批量生成
// ============================================
program
  .command('batch')
  .description('批量生成卡牌图片')
  .requiredOption('-t, --theme <theme>', '主题ID')
  .option('-c, --cards <file>', '卡牌定义 JSON 文件')
  .option('-p, --provider <provider>', 'AI Provider (openai, mock)', 'mock')
  .option('-o, --output <dir>', '输出目录', './asset-pipeline-output')
  .option('--concurrency <n>', '并发数', '3')
  .option('--resume', '从断点续传')
  .action(async (options) => {
    const spinner = ora('准备批量生成...').start();

    try {
      const { theme, cards: cardsFile, provider, output, concurrency } = options;

      // 加载卡牌定义
      let cards: CardDefinition[] = [];
      if (cardsFile && existsSync(cardsFile)) {
        const content = await readFile(cardsFile, 'utf-8');
        cards = JSON.parse(content);
      } else {
        throw new Error('请提供卡牌定义文件 (--cards)');
      }

      // 获取风格指南
      const styleGuideManager = new StyleGuideManager(join(output, 'style-guides'));
      const styleGuide = await styleGuideManager.getStyleGuide(theme);

      if (!styleGuide) {
        throw new Error(`找不到主题 "${theme}" 的风格指南`);
      }

      // 创建批量管理器
      const config: PipelineConfig = {
        outputDir: output,
        provider: {
          type: provider as ProviderType,
          apiKey: process.env.OPENAI_API_KEY,
        },
        concurrency: parseInt(concurrency, 10),
        maxRetries: 3,
        retryDelay: 2000,
        enableReview: true,
        autoIntegrate: false,
      };

      const batchManager = new BatchManager(styleGuide, config);

      // 添加任务
      batchManager.addCards(cards, theme);

      // 监听事件
      batchManager.on('task:start', (task) => {
        spinner.text = `生成中: ${task.cardDefinition.name} (${task.attempts}/${task.maxAttempts})`;
      });

      batchManager.on('task:complete', (task) => {
        console.log(chalk.green(`  ✓ ${task.cardDefinition.name}`));
      });

      batchManager.on('task:fail', (task, error) => {
        console.log(chalk.red(`  ✗ ${task.cardDefinition.name}: ${error.message}`));
      });

      batchManager.on('batch:progress', (status) => {
        spinner.text = `进度: ${status.completed}/${status.total} (${status.progress}%)`;
      });

      spinner.succeed(`开始批量生成 ${cards.length} 张卡牌`);

      // 运行
      const results = await batchManager.run();

      // 统计
      const completed = results.filter(
        (t) => t.status === 'approved' || t.status === 'review'
      ).length;
      const failed = results.filter((t) => t.status === 'failed').length;

      console.log(chalk.cyan('\n批量生成完成:'));
      console.log(`  成功: ${chalk.green(completed)}`);
      console.log(`  失败: ${chalk.red(failed)}`);
      console.log(`  输出目录: ${output}`);
    } catch (error) {
      spinner.fail('批量生成失败');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

// ============================================
// process 命令：处理原始图片
// ============================================
program
  .command('process')
  .description('处理原始图片（裁剪、缩放、添加边框）')
  .requiredOption('-t, --theme <theme>', '主题ID')
  .option('-o, --output <dir>', '输出目录', './asset-pipeline-output')
  .option('--frames <dir>', '边框模板目录')
  .action(async (options) => {
    const spinner = ora('处理图片...').start();

    try {
      const { theme, output, frames } = options;

      // 获取风格指南
      const styleGuideManager = new StyleGuideManager(join(output, 'style-guides'));
      const styleGuide = await styleGuideManager.getStyleGuide(theme);

      if (!styleGuide) {
        throw new Error(`找不到主题 "${theme}" 的风格指南`);
      }

      // 扫描原始图片目录
      const rawDir = join(output, theme, 'raw');
      const processedDir = join(output, theme, 'processed');

      if (!existsSync(rawDir)) {
        throw new Error(`原始图片目录不存在: ${rawDir}`);
      }

      const { readdir } = await import('fs/promises');
      const files = await readdir(rawDir);
      const imageFiles = files.filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));

      if (imageFiles.length === 0) {
        spinner.warn('没有找到需要处理的图片');
        return;
      }

      // 创建处理器
      const processor = new ImageProcessor();

      // 准备任务
      const tasks = imageFiles.map((file) => ({
        inputPath: join(rawDir, file),
        cardId: file.replace(/\.(png|jpg|jpeg|webp)$/i, ''),
        rarity: 'common', // TODO: 从清单获取
      }));

      spinner.text = `处理 ${tasks.length} 张图片...`;

      // 处理
      const results = await processor.processBatch(
        tasks,
        processedDir,
        styleGuide.outputSpec,
        frames,
        (current, total) => {
          spinner.text = `处理中: ${current}/${total}`;
        }
      );

      // 更新清单
      const assetManager = new AssetManager(output);
      await assetManager.loadManifest(theme);

      for (const result of results) {
        assetManager.addCardAsset(result.cardId, result, 'pending');
      }

      await assetManager.saveManifest(theme);

      spinner.succeed(`处理完成: ${results.length} 张图片`);
      console.log(`  输出目录: ${processedDir}`);
    } catch (error) {
      spinner.fail('处理失败');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

// ============================================
// status 命令：查看状态
// ============================================
program
  .command('status')
  .description('查看流水线状态')
  .requiredOption('-t, --theme <theme>', '主题ID')
  .option('-o, --output <dir>', '输出目录', './asset-pipeline-output')
  .action(async (options) => {
    try {
      const { theme, output } = options;

      const assetManager = new AssetManager(output);
      const manifest = await assetManager.loadManifest(theme);

      console.log(chalk.cyan(`\n主题: ${theme}`));
      console.log(chalk.cyan('='.repeat(40)));

      const stats = assetManager.getStats();

      console.log(`\n资源统计:`);
      console.log(`  总数:    ${stats.total}`);
      console.log(`  已通过:  ${chalk.green(stats.approved)}`);
      console.log(`  待审核:  ${chalk.yellow(stats.pending)}`);
      console.log(`  已拒绝:  ${chalk.red(stats.rejected)}`);

      if (stats.total > 0) {
        const progress = Math.round((stats.approved / stats.total) * 100);
        console.log(`\n完成度: ${progress}%`);
      }

      console.log(`\n清单版本: ${manifest.version}`);
      console.log(`更新时间: ${manifest.updatedAt}`);
    } catch (error) {
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

// ============================================
// list-guides 命令：列出可用的风格指南
// ============================================
program
  .command('list-guides')
  .description('列出所有可用的风格指南')
  .action(async () => {
    console.log(chalk.cyan('\n可用的预置风格指南:\n'));

    for (const [id, guide] of Object.entries(PRESET_STYLE_GUIDES)) {
      console.log(chalk.yellow(`  ${id}`));
      console.log(`    名称: ${guide.name}`);
      if (guide.description) {
        console.log(`    描述: ${guide.description}`);
      }
      console.log(`    风格: ${guide.visualSpec.artStyle}`);
      console.log(`    情绪: ${guide.visualSpec.mood}`);
      console.log();
    }
  });

program.parse();
