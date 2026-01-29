# 娱乐化改进说明

本次更新为卡牌游戏增加了大量娱乐化素材和视觉效果，旨在减少"AI感"，提升游戏的趣味性和用户体验。

## 新增图片资源

### 应用图标和启动画面

| 资源     | 说明                                     | 位置                |
| -------- | ---------------------------------------- | ------------------- |
| 应用图标 | 卡通风格的大厂打工人，手持卡牌，活泼可爱 | `assets/icon.png`   |
| 启动画面 | 办公楼背景+打工人角色+浮动卡牌元素       | `assets/splash.png` |

### 游戏背景图片

| 资源     | 说明                             | 位置                           |
| -------- | -------------------------------- | ------------------------------ |
| 主页背景 | 浅蓝渐变，浮动卡牌，城市剪影     | `assets/images/home_bg.png`    |
| 游戏背景 | 办公桌面风格，木纹纹理           | `assets/images/game_bg.png`    |
| 胜利背景 | 金色庆祝风格，礼花彩带           | `assets/images/victory_bg.png` |
| 失败背景 | 蓝灰色反思风格，飘落的纸张和卡牌 | `assets/images/defeat_bg.png`  |
| 卡牌背面 | 深蓝金色艺术装饰风格             | `assets/images/card_back.png`  |

## 新增 UI 组件

### EnhancedCard 增强版卡牌

相比原版 Card 组件，新增以下特性：

- **稀有度发光效果**：根据卡牌稀有度显示不同颜色的光晕
- **入场动画**：卡牌出现时的弹性缩放和淡入效果
- **翻转动画**：卡牌正反面切换的 3D 翻转效果
- **选中状态**：选中时的脉动发光效果
- **稀有度角标**：传说/稀有/普通卡牌的视觉区分

```tsx
import { EnhancedCard } from '@theme-card-games/ui';

<EnhancedCard
  card={cardData}
  showGlow={true}
  animateEntry={true}
  cardBackImage={cardBackImageUrl}
  onPress={handleCardPress}
/>;
```

### EnhancedGameOverScreen 增强版结束界面

- **背景图片支持**：可配置胜利/失败不同的背景图
- **丰富的动画效果**：标题弹出、表情摇摆、统计数据滑入
- **彩带效果**：胜利时的彩带装饰
- **状态颜色**：根据数值显示不同颜色的状态条

```tsx
import { EnhancedGameOverScreen } from '@theme-card-games/ui';

<EnhancedGameOverScreen
  winner={winner}
  player={player}
  victoryBackground={victoryBgUrl}
  defeatBackground={defeatBgUrl}
  // ...其他属性
/>;
```

### FunEffects 趣味效果组件

| 组件                 | 说明         | 使用场景            |
| -------------------- | ------------ | ------------------- |
| `FloatingEmoji`      | 浮动表情动画 | 正面/负面反馈时显示 |
| `ComboExplosion`     | 连击爆炸效果 | 触发组合技时显示    |
| `LevelUpCelebration` | 晋升庆祝效果 | 角色升级/晋升时显示 |
| `DangerFlash`        | 危险闪烁警告 | 状态告急时显示      |
| `CoinCollect`        | 金币收集动画 | 获得资源时显示      |

## 新增配置模块

### enhancedStyles.ts - 增强样式配置

```typescript
// 卡牌稀有度样式
export const rarityStyles = {
  common: { borderColor: '#9E9E9E', glowColor: '...' },
  uncommon: { borderColor: '#4CAF50', glowColor: '...' },
  rare: { borderColor: '#2196F3', glowColor: '...' },
  legendary: { borderColor: '#FF9800', glowColor: '...' },
};

// 卡牌类型图标
export const cardTypeIcons = {
  action: { icon: '⚡', color: '#FFC107' },
  event: { icon: '📋', color: '#9C27B0' },
  // ...
};

// 状态颜色
export const gameStateColors = {
  health: { high: '#4CAF50', medium: '#FFC107', low: '#F44336', critical: '#B71C1C' },
  // ...
};
```

### funTexts.ts - 趣味文案配置

```typescript
// 加载提示
export const loadingTips = [
  '正在为你准备咖啡... ☕',
  '正在启动工位电脑... 💻',
  // ...
];

// 卡牌打出提示
export const cardPlayMessages = {
  overtime: ['又开始卷了！💪', '今晚的月亮真圆啊...'],
  slacking: ['摸鱼的艺术在于不被发现 🐟'],
  // ...
};

// 连击触发提示
export const comboTriggerMessages = {
  night_warrior: '熬夜战士觉醒！今晚注定不平凡！🦉',
  // ...
};
```

### enhancedTheme.ts - 增强主题配置

```typescript
// 状态表情
export const gameStateEmojis = {
  health: { high: '💪', medium: '😐', low: '😰', critical: '🤒' },
  happiness: { high: '😄', medium: '🙂', low: '😔', critical: '😢' },
  // ...
};

// 反馈消息
export const feedbackMessages = {
  positive: ['干得漂亮！ 👏', '这波操作666！ 🎉'],
  negative: ['哎呀，有点惨... 😅', '没关系，下次会更好！ 💪'],
  // ...
};
```

## 如何使用

### 1. 在应用中使用增强组件

```tsx
// 替换原有的 Card 组件
import { EnhancedCard } from '@theme-card-games/ui';

// 替换原有的 GameOverScreen 组件
import { EnhancedGameOverScreen } from '@theme-card-games/ui';
```

### 2. 使用趣味效果

```tsx
import { FloatingEmoji, ComboExplosion, LevelUpCelebration } from '@theme-card-games/ui';

// 显示浮动表情
<FloatingEmoji emoji="😄" startX={100} startY={200} onComplete={() => {}} />

// 显示连击爆炸
<ComboExplosion x={centerX} y={centerY} comboName="连击！" onComplete={() => {}} />

// 显示晋升庆祝
<LevelUpCelebration level="高级工程师" onComplete={() => {}} />
```

### 3. 使用趣味文案

```tsx
import {
  getRandomTip,
  getCardPlayMessage,
  getComboMessage,
} from '@theme-card-games/bigtech-worker';

// 获取随机加载提示
const tip = getRandomTip(loadingTips);

// 获取卡牌打出提示
const message = getCardPlayMessage('overtime');

// 获取连击提示
const comboMessage = getComboMessage('night_warrior');
```

## 后续改进建议

1. **添加音效**：为各种游戏事件添加音效（抽卡、出牌、胜利、失败等）
2. **添加背景音乐**：主菜单和游戏中的背景音乐
3. **添加震动反馈**：在移动设备上添加触觉反馈
4. **更多卡牌插画**：为每张卡牌添加独特的插画
5. **角色立绘**：为不同角色添加立绘图片
6. **场景背景**：为不同场景添加独特的背景图片
