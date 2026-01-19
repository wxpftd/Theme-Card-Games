import { ThemeConfig } from '@theme-card-games/core';

/**
 * 创业主题 - TODO: 完善卡牌和配置
 * Startup Theme - Coming Soon
 */
export const startupTheme: ThemeConfig = {
  id: 'startup',
  name: '创业之路',
  description: '体验从0到1的创业历程，在资金、团队和市场之间寻找平衡',
  version: '0.1.0',

  gameConfig: {
    maxPlayers: 4,
    minPlayers: 1,
    initialHandSize: 5,
    maxHandSize: 10,
    winConditions: [
      { type: 'stat_threshold', stat: 'valuation', operator: '>=', value: 100 },
      { type: 'resource_threshold', stat: 'funding', operator: '<=', value: 0 },
    ],
    initialStats: {
      valuation: 10,
      teamMorale: 80,
      productQuality: 50,
      marketShare: 5,
    },
    initialResources: {
      funding: 10,
      engineers: 3,
      marketing: 2,
      connections: 2,
    },
  },

  cards: [
    // TODO: 添加创业主题卡牌
    {
      id: 'seed_funding',
      type: 'event',
      name: '种子轮融资',
      description: '获得天使投资，资金+10，估值+5',
      effects: [
        { type: 'gain_resource', target: 'self', metadata: { resource: 'funding' }, value: 10 },
        { type: 'modify_stat', target: 'self', metadata: { stat: 'valuation' }, value: 5 },
      ],
      rarity: 'uncommon',
    },
    {
      id: 'hire_engineer',
      type: 'action',
      name: '招聘工程师',
      description: '招聘一名工程师，工程师+1，资金-3',
      effects: [
        { type: 'gain_resource', target: 'self', metadata: { resource: 'engineers' }, value: 1 },
        { type: 'lose_resource', target: 'self', metadata: { resource: 'funding' }, value: 3 },
      ],
      cost: 1,
      rarity: 'common',
    },
  ],

  stats: [
    { id: 'valuation', name: '估值', description: '公司估值（百万）', icon: '📈' },
    { id: 'teamMorale', name: '团队士气', description: '团队的工作热情', icon: '💪' },
    { id: 'productQuality', name: '产品质量', description: '产品的成熟度', icon: '⭐' },
    { id: 'marketShare', name: '市场份额', description: '市场占有率', icon: '🥧' },
  ],

  resources: [
    { id: 'funding', name: '资金', description: '可用资金（百万）', icon: '💰' },
    { id: 'engineers', name: '工程师', description: '研发团队人数', icon: '👨‍💻' },
    { id: 'marketing', name: '市场团队', description: '市场人员数量', icon: '📢' },
    { id: 'connections', name: '人脉', description: '行业人脉资源', icon: '🤝' },
  ],

  uiTheme: {
    colors: {
      primary: '#6C5CE7',
      secondary: '#00B894',
      background: '#F8F9FA',
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
      'game.title': '创业之路',
      'game.subtitle': '从0到1的创业冒险',
    },
  },
};

export default startupTheme;
