# 游戏图片资源

本目录包含游戏的娱乐化图片素材：

## 背景图片

- `home_bg.png` - 主页背景，浅蓝色渐变配合浮动卡牌元素
- `game_bg.png` - 游戏界面背景，办公桌面风格
- `victory_bg.png` - 胜利界面背景，金色庆祝风格
- `defeat_bg.png` - 失败界面背景，蓝灰色反思风格

## 卡牌素材

- `card_back.png` - 卡牌背面设计，深蓝金色艺术装饰风格

## 使用说明

这些图片资源可以通过 React Native 的 Image 组件引用：

```tsx
import { Image } from 'react-native';

// 示例
<Image source={require('../assets/images/home_bg.png')} />;
```
