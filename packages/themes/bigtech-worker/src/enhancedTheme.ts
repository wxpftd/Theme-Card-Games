/**
 * 增强的主题视觉配置
 * 提供更丰富的娱乐化视觉效果
 */

import { UITheme } from '@theme-card-games/core';

/**
 * 增强版 UI 主题配置
 * 在原有主题基础上添加更多视觉细节
 */
export const enhancedUITheme: UITheme = {
  colors: {
    // 主色调 - 更鲜艳的科技蓝
    primary: '#1976D2',
    // 辅助色 - 活力绿
    secondary: '#43A047',
    // 背景 - 柔和的浅灰蓝
    background: '#F8FAFC',
    // 卡片表面 - 纯白带微妙阴影
    surface: '#FFFFFF',
    // 主文字 - 深灰
    text: '#1A1A2E',
    // 次要文字 - 中灰
    textSecondary: '#64748B',
    // 强调色 - 活力橙
    accent: '#FF6B35',
    // 错误/危险 - 鲜红
    error: '#EF4444',
    // 成功 - 翠绿
    success: '#10B981',
    // 警告 - 琥珀
    warning: '#F59E0B',
  },
  fonts: {
    regular: 'System',
    bold: 'System',
    heading: 'System',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 20,
    card: 16,
  },
  cardStyles: {
    width: 140,
    height: 200,
    aspectRatio: 0.7,
  },
};

/**
 * 游戏状态对应的表情符号
 */
export const gameStateEmojis = {
  // 健康状态
  health: {
    high: '💪', // 健康良好
    medium: '😐', // 一般
    low: '😰', // 不太好
    critical: '🤒', // 危险
  },
  // 幸福感状态
  happiness: {
    high: '😄', // 非常开心
    medium: '🙂', // 还行
    low: '😔', // 不开心
    critical: '😢', // 很沮丧
  },
  // 绩效状态
  performance: {
    high: '🌟', // 优秀
    medium: '📊', // 正常
    low: '📉', // 需要努力
    critical: '⚠️', // 危险
  },
  // 影响力状态
  influence: {
    high: '👑', // 很有影响力
    medium: '🎯', // 有一定影响
    low: '🔰', // 新人
    critical: '👤', // 透明人
  },
};

/**
 * 卡牌类型对应的有趣描述
 */
export const cardTypeDescriptions: Record<string, { title: string; subtitle: string }> = {
  action: {
    title: '行动卡',
    subtitle: '主动出击！',
  },
  event: {
    title: '事件卡',
    subtitle: '命运的安排~',
  },
  resource: {
    title: '资源卡',
    subtitle: '积少成多！',
  },
  character: {
    title: '角色卡',
    subtitle: '有人来帮忙了！',
  },
  modifier: {
    title: '修正卡',
    subtitle: '改变游戏规则！',
  },
};

/**
 * 游戏反馈消息配置
 */
export const feedbackMessages = {
  // 正面反馈
  positive: [
    '干得漂亮！ 👏',
    '这波操作666！ 🎉',
    '稳如老狗！ 🐕',
    '秀儿是你吗？ ✨',
    '这就是职场高手！ 💼',
  ],
  // 负面反馈
  negative: [
    '哎呀，有点惨... 😅',
    '没关系，下次会更好！ 💪',
    '职场如战场啊... ⚔️',
    '打工人不容易 😢',
    '坚持住！ 🙏',
  ],
  // 连击反馈
  combo: ['连击！太强了！ 🔥', 'Combo! 这操作太秀了！ ⚡', '组合技触发！ 💥', '这配合绝了！ 🎯'],
  // 晋升反馈
  levelUp: ['恭喜晋升！ 🎊', '升职加薪！ 💰', '你的努力得到了回报！ 🏆', '新的挑战在等着你！ 🚀'],
  // 危险警告
  danger: ['注意！状态告急！ ⚠️', '小心！要撑不住了！ 🆘', '危险！需要立即处理！ 🚨'],
};

/**
 * 获取状态对应的表情
 */
export function getStateEmoji(statId: string, value: number, max: number = 100): string {
  const percentage = (value / max) * 100;
  const emojis = gameStateEmojis[statId as keyof typeof gameStateEmojis] || gameStateEmojis.health;

  if (percentage >= 70) return emojis.high;
  if (percentage >= 40) return emojis.medium;
  if (percentage >= 20) return emojis.low;
  return emojis.critical;
}

/**
 * 获取随机反馈消息
 */
export function getRandomFeedback(type: keyof typeof feedbackMessages): string {
  const messages = feedbackMessages[type];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * 游戏音效事件类型
 */
export type SoundEventType =
  | 'card_draw'
  | 'card_play'
  | 'card_select'
  | 'turn_start'
  | 'turn_end'
  | 'combo_trigger'
  | 'level_up'
  | 'victory'
  | 'defeat'
  | 'positive_effect'
  | 'negative_effect'
  | 'warning'
  | 'button_click';

/**
 * 音效事件配置
 */
export const soundEventConfig: Record<SoundEventType, { priority: number; cooldown: number }> = {
  card_draw: { priority: 1, cooldown: 100 },
  card_play: { priority: 2, cooldown: 200 },
  card_select: { priority: 1, cooldown: 50 },
  turn_start: { priority: 3, cooldown: 500 },
  turn_end: { priority: 2, cooldown: 500 },
  combo_trigger: { priority: 4, cooldown: 1000 },
  level_up: { priority: 5, cooldown: 2000 },
  victory: { priority: 5, cooldown: 3000 },
  defeat: { priority: 5, cooldown: 3000 },
  positive_effect: { priority: 2, cooldown: 300 },
  negative_effect: { priority: 2, cooldown: 300 },
  warning: { priority: 4, cooldown: 1000 },
  button_click: { priority: 1, cooldown: 50 },
};
