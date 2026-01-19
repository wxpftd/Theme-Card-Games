import { ThemeConfig } from '@theme-card-games/core';

/**
 * 旅游主题 - TODO: 完善卡牌和配置
 * Travel Theme - Coming Soon
 */
export const travelTheme: ThemeConfig = {
  id: 'travel',
  name: '环游世界',
  description: '计划一场完美的旅行，在预算、时间和体验之间做出选择',
  version: '0.1.0',

  gameConfig: {
    maxPlayers: 4,
    minPlayers: 1,
    initialHandSize: 5,
    maxHandSize: 10,
    winConditions: [
      { type: 'stat_threshold', stat: 'experiences', operator: '>=', value: 100 },
      { type: 'resource_threshold', stat: 'budget', operator: '<=', value: 0 },
      { type: 'stat_threshold', stat: 'energy', operator: '<=', value: 0 },
    ],
    initialStats: {
      experiences: 0,
      energy: 100,
      happiness: 80,
      memories: 0,
    },
    initialResources: {
      budget: 50,
      time: 14,
      stamps: 0,
      souvenirs: 0,
    },
  },

  cards: [
    // TODO: 添加旅游主题卡牌
    {
      id: 'flight_booking',
      type: 'action',
      name: '预订机票',
      description: '预订航班前往新目的地，预算-10，经验+15',
      effects: [
        { type: 'lose_resource', target: 'self', metadata: { resource: 'budget' }, value: 10 },
        { type: 'modify_stat', target: 'self', metadata: { stat: 'experiences' }, value: 15 },
      ],
      cost: 1,
      rarity: 'common',
    },
    {
      id: 'local_cuisine',
      type: 'action',
      name: '品尝美食',
      description: '尝试当地特色美食，预算-3，幸福感+10',
      effects: [
        { type: 'lose_resource', target: 'self', metadata: { resource: 'budget' }, value: 3 },
        { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 10 },
      ],
      cost: 0,
      rarity: 'common',
    },
  ],

  stats: [
    { id: 'experiences', name: '旅行经验', description: '累计的旅行体验', icon: '🌍' },
    { id: 'energy', name: '精力', description: '旅途中的体力', icon: '⚡' },
    { id: 'happiness', name: '幸福感', description: '旅行的愉悦度', icon: '😊' },
    { id: 'memories', name: '回忆', description: '难忘的旅行记忆', icon: '📸' },
  ],

  resources: [
    { id: 'budget', name: '预算', description: '可用的旅行资金', icon: '💰' },
    { id: 'time', name: '假期', description: '剩余的旅行天数', icon: '📅' },
    { id: 'stamps', name: '签章', description: '护照上的签章数', icon: '📕' },
    { id: 'souvenirs', name: '纪念品', description: '收集的纪念品', icon: '🎁' },
  ],

  uiTheme: {
    colors: {
      primary: '#00CEC9',
      secondary: '#FD79A8',
      background: '#F0F8FF',
      surface: '#FFFFFF',
      text: '#2D3436',
      textSecondary: '#636E72',
      accent: '#FDCB6E',
      error: '#D63031',
      success: '#00B894',
      warning: '#FDCB6E',
    },
    fonts: {
      regular: 'System',
      bold: 'System',
      heading: 'System',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: { sm: 4, md: 8, lg: 16, card: 12 },
    cardStyles: { width: 140, height: 200, aspectRatio: 0.7 },
  },

  localization: {
    'zh-CN': {
      'game.title': '环游世界',
      'game.subtitle': '说走就走的旅行',
    },
  },
};

export default travelTheme;
