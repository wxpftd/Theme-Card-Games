# E2E 测试指南

本项目使用 [Maestro](https://maestro.mobile.dev/) 进行 E2E 测试。

## 安装 Maestro

```bash
# macOS / Linux
curl -Ls "https://get.maestro.mobile.dev" | bash

# 验证安装
maestro --version
```

## 运行测试

### 前提条件

1. 启动 iOS 模拟器
2. 启动开发服务器：
   ```bash
   pnpm app:bigtech
   ```

### 运行所有测试

```bash
pnpm e2e
```

### 运行冒烟测试（快速验证）

```bash
pnpm e2e:smoke
```

### 运行 P0 优先级测试

```bash
pnpm e2e:p0
```

### 运行单个特性测试

```bash
# 应用启动测试
pnpm e2e:feature .maestro/flows/01-app-launch.yaml

# 游戏开始测试
pnpm e2e:feature .maestro/flows/02-game-start.yaml

# 卡牌打出测试
pnpm e2e:feature .maestro/flows/03-card-play.yaml
```

### 使用 Maestro Studio 调试

```bash
pnpm e2e:studio
```

Maestro Studio 提供可视化界面，可以：

- 实时查看设备屏幕
- 点击元素自动生成测试代码
- 逐步调试测试流程

## 测试文件结构

```
.maestro/
├── config.yaml           # 全局配置
├── flows/               # 测试流程
│   ├── 01-app-launch.yaml    # P0: 应用启动
│   ├── 02-game-start.yaml    # P0: 游戏开始
│   ├── 03-card-play.yaml     # P0: 卡牌打出
│   ├── 04-combo-system.yaml  # P1: 组合系统
│   ├── 05-turn-flow.yaml     # P0: 回合流程
│   ├── 06-game-end.yaml      # P0: 游戏结束
│   ├── 07-navigation.yaml    # P0: 导航流程
│   └── helpers/             # 可复用片段
│       ├── start-app.yaml
│       └── start-game.yaml
└── README.md
```

## 测试优先级

| 标签    | 说明                   |
| ------- | ---------------------- |
| `smoke` | 冒烟测试，验证核心功能 |
| `p0`    | 最高优先级，必须通过   |
| `p1`    | 高优先级，重要功能     |
| `slow`  | 执行时间较长的测试     |

## 添加新测试

1. 在 `flows/` 目录创建新的 YAML 文件
2. 参考现有测试的格式
3. 使用 `testID` 定位元素
4. 添加适当的标签

### 示例模板

```yaml
appId: host.exp.Exponent
name: '测试名称'
tags:
  - p0
---
- runFlow: helpers/start-game.yaml

# 你的测试步骤
- tapOn:
    id: 'element-id'

- assertVisible:
    id: 'another-element'

- takeScreenshot: 'test-result'
```

## testID 命名规范

| 类型 | 格式                    | 示例                |
| ---- | ----------------------- | ------------------- |
| 按钮 | `{action}-button`       | `start-game-button` |
| 容器 | `{name}-container`      | `hand-container`    |
| 卡牌 | `card-{index}`          | `card-0`            |
| 文本 | `{name}-text` 或 无后缀 | `turn-counter`      |

## 常见问题

### 测试找不到元素

1. 确保应用已启动并加载完成
2. 使用 `maestro studio` 检查元素 ID
3. 添加适当的等待时间

### Expo Go 相关

配置使用 `host.exp.Exponent` 作为 appId，适用于 Expo Go 运行。
如果使用开发构建，需要修改 appId。
