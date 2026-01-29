/**
 * 增强的 UI 样式配置
 * 提供更丰富的视觉效果和娱乐化元素
 */

import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

/**
 * 卡牌稀有度样式配置
 */
export const rarityStyles = {
  common: {
    borderColor: '#9E9E9E',
    glowColor: 'rgba(158, 158, 158, 0.3)',
    headerGradient: ['#BDBDBD', '#9E9E9E'],
    shimmerColor: '#E0E0E0',
  },
  uncommon: {
    borderColor: '#4CAF50',
    glowColor: 'rgba(76, 175, 80, 0.4)',
    headerGradient: ['#66BB6A', '#43A047'],
    shimmerColor: '#A5D6A7',
  },
  rare: {
    borderColor: '#2196F3',
    glowColor: 'rgba(33, 150, 243, 0.5)',
    headerGradient: ['#42A5F5', '#1E88E5'],
    shimmerColor: '#90CAF9',
  },
  legendary: {
    borderColor: '#FF9800',
    glowColor: 'rgba(255, 152, 0, 0.6)',
    headerGradient: ['#FFB74D', '#F57C00'],
    shimmerColor: '#FFE082',
  },
};

/**
 * 卡牌类型图标配置 - 更有趣的图标
 */
export const cardTypeIcons: Record<string, { icon: string; color: string }> = {
  action: { icon: '⚡', color: '#FFC107' },
  event: { icon: '📋', color: '#9C27B0' },
  resource: { icon: '💎', color: '#00BCD4' },
  character: { icon: '👤', color: '#FF5722' },
  modifier: { icon: '🔧', color: '#607D8B' },
  work: { icon: '💼', color: '#1E88E5' },
  rest: { icon: '☕', color: '#8D6E63' },
  social: { icon: '🤝', color: '#E91E63' },
  growth: { icon: '📚', color: '#4CAF50' },
  life: { icon: '🏠', color: '#FF9800' },
};

/**
 * 状态变化动画配置
 */
export const statChangeAnimations = {
  positive: {
    color: '#4CAF50',
    icon: '↑',
    scale: 1.2,
    duration: 500,
  },
  negative: {
    color: '#F44336',
    icon: '↓',
    scale: 0.9,
    duration: 500,
  },
  neutral: {
    color: '#9E9E9E',
    icon: '→',
    scale: 1,
    duration: 300,
  },
};

/**
 * 按钮样式预设
 */
export const buttonPresets = StyleSheet.create({
  primary: {
    backgroundColor: '#1E88E5',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 28,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  } as ViewStyle,
  secondary: {
    backgroundColor: 'transparent',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 26,
  } as ViewStyle,
  accent: {
    backgroundColor: '#FF6B35',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 28,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  } as ViewStyle,
  success: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 28,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  } as ViewStyle,
  danger: {
    backgroundColor: '#F44336',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 28,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  } as ViewStyle,
});

/**
 * 文字样式预设
 */
export const textPresets = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  } as TextStyle,
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  } as TextStyle,
  body: {
    fontSize: 14,
    lineHeight: 22,
  } as TextStyle,
  caption: {
    fontSize: 12,
    opacity: 0.7,
  } as TextStyle,
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  } as TextStyle,
});

/**
 * 卡片容器样式
 */
export const cardContainerStyles = StyleSheet.create({
  elevated: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  } as ViewStyle,
  outlined: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  } as ViewStyle,
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  } as ViewStyle,
});

/**
 * 游戏状态颜色配置
 */
export const gameStateColors = {
  health: {
    high: '#4CAF50',
    medium: '#FFC107',
    low: '#F44336',
    critical: '#B71C1C',
  },
  happiness: {
    high: '#E91E63',
    medium: '#9C27B0',
    low: '#607D8B',
    critical: '#455A64',
  },
  performance: {
    high: '#2196F3',
    medium: '#03A9F4',
    low: '#00BCD4',
    critical: '#009688',
  },
  influence: {
    high: '#FF9800',
    medium: '#FF5722',
    low: '#795548',
    critical: '#5D4037',
  },
};

/**
 * 获取状态值对应的颜色
 */
export function getStatColor(statId: string, value: number, max: number = 100): string {
  const percentage = (value / max) * 100;
  const colors = gameStateColors[statId as keyof typeof gameStateColors] || gameStateColors.health;

  if (percentage >= 70) return colors.high;
  if (percentage >= 40) return colors.medium;
  if (percentage >= 20) return colors.low;
  return colors.critical;
}

/**
 * 粒子效果配置
 */
export const particleConfigs = {
  victory: {
    count: 50,
    colors: ['#FFD700', '#FFA500', '#FF6B35', '#4CAF50'],
    duration: 3000,
    spread: 360,
  },
  combo: {
    count: 20,
    colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#9B59B6'],
    duration: 1500,
    spread: 180,
  },
  levelUp: {
    count: 30,
    colors: ['#2196F3', '#03A9F4', '#00BCD4', '#4CAF50'],
    duration: 2000,
    spread: 270,
  },
  damage: {
    count: 15,
    colors: ['#F44336', '#E91E63', '#FF5722'],
    duration: 800,
    spread: 120,
  },
};
