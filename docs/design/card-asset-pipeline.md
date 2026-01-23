# 卡牌素材制作流水线设计方案

## 目录

1. [背景与目标](#背景与目标)
2. [整体架构](#整体架构)
3. [流水线工序](#流水线工序)
4. [技术实现方案](#技术实现方案)
5. [数据模型扩展](#数据模型扩展)
6. [工具链设计](#工具链设计)
7. [成本估算](#成本估算)
8. [实施计划](#实施计划)

---

## 背景与目标

### 当前状态

- 项目有 4 个主题（bigtech-worker, startup, travel, parenting）
- bigtech-worker 主题已有 100+ 张卡牌定义
- 当前使用 emoji 作为图标，无真实图片素材
- 卡牌尺寸标准：140×200 像素，宽高比 0.7

### 目标

构建自动化流水线，实现：

1. **低成本**：利用 AI 生成替代人工收集
2. **一致性**：同一主题风格统一
3. **可扩展**：支持快速新增主题
4. **批量处理**：一次处理整个主题的所有卡牌

---

## 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    卡牌素材制作流水线                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  Stage 1 │───▶│  Stage 2 │───▶│  Stage 3 │───▶│  Stage 4 │  │
│  │ 提示词生成 │    │ AI 图像生成 │    │ 图像后处理 │    │ 资源集成  │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │               │               │               │         │
│       ▼               ▼               ▼               ▼         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │卡牌定义   │    │ 原始图像   │    │ 适配图像   │    │ 资源清单  │  │
│  │→ 提示词   │    │ 512×512+  │    │ 140×200   │    │ + 代码    │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

存储结构:
assets/
├── raw/                    # 原始 AI 生成图像
│   └── {theme}/
│       └── {card_id}.png
├── processed/              # 处理后的图像
│   └── {theme}/
│       ├── cards/          # 卡牌插画
│       │   └── {card_id}.webp
│       ├── icons/          # 图标素材
│       │   └── {icon_id}.webp
│       └── backgrounds/    # 背景素材
│           └── {bg_id}.webp
└── manifest/               # 资源清单
    └── {theme}.json
```

---

## 流水线工序

### Stage 1: 提示词生成（Prompt Generation）

将卡牌定义转换为 AI 绘图提示词。

**输入**：
```typescript
{
  id: 'overtime',
  name: '加班',
  type: 'event',
  description: '被要求加班处理紧急项目...',
  tags: ['work', 'stress'],
  rarity: 'common',
  series: 'work'
}
```

**处理**：
```typescript
interface PromptTemplate {
  themeId: string;
  // 主题风格描述（所有卡牌共用）
  stylePrefix: string;
  // 类型特定提示
  typePrompts: Record<CardType, string>;
  // 稀有度视觉差异
  rarityModifiers: Record<CardRarity, string>;
  // 负面提示词
  negativePrompt: string;
}

// bigtech-worker 主题示例
const bigtechPromptTemplate: PromptTemplate = {
  themeId: 'bigtech-worker',
  stylePrefix: 'flat illustration, modern office style, clean lines, vibrant colors, digital art, minimalist, tech company aesthetic',
  typePrompts: {
    action: 'dynamic pose, motion blur effect',
    event: 'scene illustration, environmental storytelling',
    resource: 'iconic object, centered composition, glowing effect',
    character: 'portrait style, professional attire, friendly expression',
    modifier: 'abstract representation, geometric shapes, overlay effect'
  },
  rarityModifiers: {
    common: 'simple background, soft colors',
    uncommon: 'subtle gradient background, slightly vibrant',
    rare: 'dramatic lighting, rich colors, detailed background',
    legendary: 'golden accents, epic atmosphere, particle effects, highly detailed'
  },
  negativePrompt: 'blurry, low quality, text, watermark, signature, deformed, ugly, bad anatomy, realistic photo'
};
```

**输出**：
```json
{
  "cardId": "overtime",
  "prompt": "flat illustration, modern office style, clean lines, vibrant colors, digital art, minimalist, tech company aesthetic, scene illustration, environmental storytelling, office worker staying late at night, computer screens glowing, tired expression, coffee cups, simple background, soft colors",
  "negativePrompt": "blurry, low quality, text, watermark, signature, deformed, ugly, bad anatomy, realistic photo",
  "metadata": {
    "theme": "bigtech-worker",
    "cardType": "event",
    "rarity": "common"
  }
}
```

### Stage 2: AI 图像生成（Image Generation）

**支持的 AI 服务**（按优先级）：

| 服务 | 优势 | 成本 | API |
|------|------|------|-----|
| **DALL-E 3** | 高质量、理解力强 | ~$0.04/张 (1024×1024) | OpenAI API |
| **Stable Diffusion (本地)** | 免费、可控 | 仅硬件成本 | ComfyUI/A1111 API |
| **Midjourney** | 艺术风格强 | ~$0.02/张 (需爬虫) | 非官方 |
| **Leonardo.ai** | 性价比高 | ~$0.01/张 | 官方 API |

**推荐方案**：

- **开发阶段**：Stable Diffusion 本地部署（免费试错）
- **生产阶段**：DALL-E 3 或 Leonardo.ai（稳定高质量）

**批量处理策略**：

```typescript
interface GenerationConfig {
  provider: 'openai' | 'stable-diffusion' | 'leonardo';
  batchSize: number;        // 并发数
  retryAttempts: number;    // 失败重试
  outputFormat: 'png' | 'webp';
  outputSize: {
    width: number;          // 建议 1024
    height: number;         // 建议 1024
  };
  seedStrategy: 'random' | 'deterministic';  // 是否固定种子以保证可复现
}
```

### Stage 3: 图像后处理（Post-Processing）

**处理流程**：

```
原始图像 (1024×1024)
    │
    ▼
┌─────────────────┐
│  1. 质量检测    │  ← 模糊检测、异常检测
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. 智能裁剪    │  ← 主体检测、构图优化
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. 尺寸适配    │  ← 缩放至 140×200 (或 @2x: 280×400)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. 格式优化    │  ← WebP 压缩、多分辨率生成
└────────┬────────┘
         │
         ▼
最终资源 (@1x, @2x, @3x)
```

**关键技术**：

```typescript
interface PostProcessConfig {
  // 智能裁剪配置
  crop: {
    method: 'center' | 'smart' | 'face-aware';
    targetAspectRatio: number;  // 0.7 for cards
    padding: number;            // 保留边距百分比
  };

  // 输出配置
  output: {
    formats: ('webp' | 'png')[];
    scales: number[];           // [1, 2, 3] for @1x, @2x, @3x
    quality: number;            // 0-100
    baseSize: {
      width: number;            // 140
      height: number;           // 200
    };
  };

  // 质量检测阈值
  qualityCheck: {
    minSharpness: number;       // 模糊度阈值
    minContrast: number;        // 对比度阈值
    enabled: boolean;
  };
}
```

### Stage 4: 资源集成（Asset Integration）

**资源清单格式**：

```typescript
// assets/manifest/bigtech-worker.json
interface AssetManifest {
  themeId: string;
  version: string;
  generatedAt: string;
  cards: Record<string, CardAsset>;
  icons: Record<string, IconAsset>;
  backgrounds: Record<string, BackgroundAsset>;
}

interface CardAsset {
  id: string;
  files: {
    '@1x': string;  // 相对路径
    '@2x': string;
    '@3x': string;
  };
  blurhash: string;     // 占位模糊哈希
  dominantColor: string; // 主色调
  generatedFrom: {
    prompt: string;
    provider: string;
    seed?: number;
  };
}
```

**代码集成示例**：

```typescript
// packages/ui/src/hooks/useCardAsset.ts
export function useCardAsset(themeId: string, cardId: string) {
  const manifest = useAssetManifest(themeId);
  const asset = manifest?.cards[cardId];

  if (!asset) {
    return { type: 'fallback', emoji: getTypeEmoji(cardId) };
  }

  return {
    type: 'image',
    uri: resolveAssetPath(themeId, asset.files),
    blurhash: asset.blurhash,
    dominantColor: asset.dominantColor
  };
}
```

---

## 技术实现方案

### 新增包结构

```
packages/
└── asset-pipeline/          # 新增包
    ├── package.json
    ├── src/
    │   ├── index.ts
    │   ├── cli.ts           # CLI 入口
    │   ├── stages/
    │   │   ├── promptGenerator.ts
    │   │   ├── imageGenerator.ts
    │   │   ├── postProcessor.ts
    │   │   └── assetIntegrator.ts
    │   ├── providers/
    │   │   ├── openai.ts
    │   │   ├── stableDiffusion.ts
    │   │   └── leonardo.ts
    │   ├── templates/
    │   │   └── promptTemplates.ts
    │   └── utils/
    │       ├── imageUtils.ts
    │       └── manifestUtils.ts
    ├── templates/
    │   └── themes/          # 主题提示词模板
    │       ├── bigtech-worker.json
    │       ├── startup.json
    │       └── ...
    └── tests/
```

### CLI 命令设计

```bash
# 安装依赖
pnpm add -D sharp @anthropic-ai/sdk openai

# 生成单张卡牌素材
pnpm asset:generate --theme bigtech-worker --card overtime

# 批量生成主题所有卡牌
pnpm asset:generate --theme bigtech-worker --all

# 仅生成提示词（预览）
pnpm asset:prompts --theme bigtech-worker --output prompts.json

# 后处理已有图像
pnpm asset:process --input ./raw --output ./processed

# 生成资源清单
pnpm asset:manifest --theme bigtech-worker

# 质量检测
pnpm asset:validate --theme bigtech-worker

# 完整流水线
pnpm asset:pipeline --theme bigtech-worker --provider openai
```

### 配置文件

```typescript
// asset-pipeline.config.ts
export default {
  // 图像生成配置
  generation: {
    provider: 'openai',
    openai: {
      model: 'dall-e-3',
      size: '1024x1024',
      quality: 'standard',  // 'standard' | 'hd'
    },
    stableDiffusion: {
      endpoint: 'http://localhost:7860',
      model: 'sd_xl_base_1.0',
      steps: 30,
      cfg_scale: 7,
    },
  },

  // 后处理配置
  postProcess: {
    crop: {
      method: 'smart',
      targetAspectRatio: 0.7,
    },
    output: {
      formats: ['webp'],
      scales: [1, 2, 3],
      quality: 85,
      baseSize: { width: 140, height: 200 },
    },
  },

  // 输出配置
  output: {
    rawDir: './assets/raw',
    processedDir: './assets/processed',
    manifestDir: './assets/manifest',
  },

  // 并发控制
  concurrency: {
    batchSize: 5,
    delayBetweenBatches: 1000,  // ms
  },
};
```

---

## 数据模型扩展

### CardDefinition 扩展

```typescript
// 扩展现有 CardDefinition（向后兼容）
interface CardDefinitionV3 extends CardDefinitionV2 {
  // 素材相关字段（可选，向后兼容）
  asset?: CardAssetConfig;
}

interface CardAssetConfig {
  // 自定义提示词覆盖（可选）
  promptOverride?: string;
  // 手动指定图像路径（跳过生成）
  manualImagePath?: string;
  // 生成参数覆盖
  generationParams?: {
    style?: string;
    seed?: number;
    negativePrompt?: string;
  };
}
```

### ThemeConfig 扩展

```typescript
interface ThemeConfigV2 extends ThemeConfig {
  // 素材流水线配置
  assetConfig?: ThemeAssetConfig;
}

interface ThemeAssetConfig {
  // 提示词模板
  promptTemplate: PromptTemplate;
  // 资源基础路径
  assetBasePath: string;
  // CDN 配置（可选）
  cdn?: {
    baseUrl: string;
    fallbackToLocal: boolean;
  };
}
```

---

## 工具链设计

### 交互式审核工具

为了保证质量，提供 Web UI 审核工具：

```
┌─────────────────────────────────────────────────────┐
│  卡牌素材审核面板                          [主题: bigtech-worker] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │ 加班    │  │ 摸鱼    │  │ 跳槽    │  ...        │
│  │ [图像]  │  │ [图像]  │  │ [图像]  │             │
│  │ ✓ 通过  │  │ ✗ 拒绝  │  │ 🔄 重新生成           │
│  └─────────┘  └─────────┘  └─────────┘             │
│                                                     │
│  进度: 45/120 (37.5%)                               │
│  通过: 40  拒绝: 3  待审: 75  重新生成队列: 2        │
│                                                     │
│  [批量通过] [导出已通过] [继续生成]                   │
└─────────────────────────────────────────────────────┘
```

**功能**：
- 预览生成的图像
- 一键通过/拒绝
- 添加备注触发重新生成
- 手动上传替代图像
- 批量操作

---

## 成本估算

### 单主题成本（以 bigtech-worker 为例）

| 项目 | 数量 | 单价 | 总计 |
|------|------|------|------|
| 卡牌图像 (DALL-E 3) | 120张 | $0.04 | $4.80 |
| 重新生成 (预估 20%) | 24张 | $0.04 | $0.96 |
| 图标素材 | 30个 | $0.04 | $1.20 |
| **单主题总计** | | | **~$7** |

### 全项目成本

| 主题 | 卡牌数 | 预估成本 |
|------|--------|----------|
| bigtech-worker | ~120 | ~$7 |
| startup | ~100 | ~$6 |
| travel | ~100 | ~$6 |
| parenting | ~100 | ~$6 |
| **总计** | ~420 | **~$25** |

### 本地 Stable Diffusion 方案

- 硬件要求：8GB+ VRAM GPU
- 成本：仅电费
- 生成速度：~10秒/张
- 质量：需要更多调优

---

## 实施计划

### Phase 1: 基础设施（1-2天）

- [ ] 创建 `packages/asset-pipeline` 包
- [ ] 实现 CLI 框架
- [ ] 实现提示词生成器
- [ ] 编写 bigtech-worker 提示词模板

### Phase 2: 图像生成集成（1-2天）

- [ ] 集成 OpenAI DALL-E API
- [ ] 集成本地 Stable Diffusion（可选）
- [ ] 实现批量生成逻辑
- [ ] 实现错误处理和重试

### Phase 3: 后处理流程（1天）

- [ ] 集成 Sharp 图像处理
- [ ] 实现智能裁剪
- [ ] 实现多分辨率输出
- [ ] 实现 Blurhash 生成

### Phase 4: 集成与 UI（1天）

- [ ] 生成资源清单
- [ ] 更新 UI 组件支持图像
- [ ] 实现资源加载 Hook
- [ ] 添加占位符和加载态

### Phase 5: 审核工具（可选，1-2天）

- [ ] 实现 Web 审核界面
- [ ] 实现审核状态管理
- [ ] 实现重新生成队列

---

## 待确认问题

1. **图像风格偏好**：
   - 扁平插画风格？
   - 像素艺术风格？
   - 3D 渲染风格？
   - 手绘风格？

2. **AI 服务选择**：
   - 使用 OpenAI DALL-E（稳定但付费）？
   - 本地部署 Stable Diffusion（免费但需配置）？
   - 混合方案？

3. **资源托管方式**：
   - 打包进 App Bundle？
   - 使用 CDN 按需加载？
   - 混合方案（常用本地，其他 CDN）？

4. **优先级**：
   - 先完成哪个主题？
   - 是否需要审核工具？

---

## 下一步

请确认以上设计方案，特别是：

1. 整体架构是否符合预期？
2. 哪种 AI 服务更适合？
3. 图像风格偏好？
4. 实施优先级？

确认后我将开始实施。
