import { ThemeConfig } from '@theme-card-games/core';

/**
 * 生育/育儿主题 - TODO: 完善卡牌和配置
 * Parenting Theme - Coming Soon
 */
export const parentingTheme: ThemeConfig = {
  id: 'parenting',
  name: '育儿之路',
  description: '体验新手父母的日常，在工作、家庭和孩子成长之间寻找平衡',
  version: '0.1.0',

  gameConfig: {
    maxPlayers: 2,
    minPlayers: 1,
    initialHandSize: 5,
    maxHandSize: 8,
    winConditions: [
      { type: 'stat_threshold', stat: 'childGrowth', operator: '>=', value: 100 },
      { type: 'stat_threshold', stat: 'parentHealth', operator: '<=', value: 0 },
      { type: 'stat_threshold', stat: 'relationship', operator: '<=', value: 0 },
    ],
    initialStats: {
      childGrowth: 0,
      childHealth: 100,
      parentHealth: 80,
      relationship: 70,
    },
    initialResources: {
      money: 10,
      time: 10,
      energy: 8,
      patience: 5,
    },
  },

  cards: [
    // TODO: 添加育儿主题卡牌
    {
      id: 'night_feeding',
      type: 'event',
      name: '夜间喂奶',
      description: '半夜起来喂宝宝，精力-3，孩子健康+5',
      effects: [
        { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 3 },
        { type: 'modify_stat', target: 'self', metadata: { stat: 'childHealth' }, value: 5 },
      ],
      rarity: 'common',
    },
    {
      id: 'quality_time',
      type: 'action',
      name: '亲子时光',
      description: '陪伴孩子玩耍，孩子成长+10，关系+5',
      effects: [
        { type: 'modify_stat', target: 'self', metadata: { stat: 'childGrowth' }, value: 10 },
        { type: 'modify_stat', target: 'self', metadata: { stat: 'relationship' }, value: 5 },
      ],
      cost: 2,
      rarity: 'common',
    },
    {
      id: 'date_night',
      type: 'action',
      name: '约会之夜',
      description: '安排夫妻约会时间，关系+15，金钱-5',
      effects: [
        { type: 'modify_stat', target: 'self', metadata: { stat: 'relationship' }, value: 15 },
        { type: 'lose_resource', target: 'self', metadata: { resource: 'money' }, value: 5 },
      ],
      cost: 3,
      rarity: 'uncommon',
    },
  ],

  stats: [
    { id: 'childGrowth', name: '孩子成长', description: '孩子的成长进度', icon: '👶' },
    { id: 'childHealth', name: '孩子健康', description: '孩子的健康状况', icon: '💚' },
    { id: 'parentHealth', name: '父母健康', description: '父母的身心健康', icon: '❤️' },
    { id: 'relationship', name: '夫妻关系', description: '家庭和谐程度', icon: '💕' },
  ],

  resources: [
    { id: 'money', name: '家庭收入', description: '家庭可支配收入', icon: '💰' },
    { id: 'time', name: '时间', description: '可自由支配的时间', icon: '⏰' },
    { id: 'energy', name: '精力', description: '日常可用的精力', icon: '⚡' },
    { id: 'patience', name: '耐心', description: '对待孩子的耐心', icon: '🧘' },
  ],

  uiTheme: {
    colors: {
      primary: '#FF6B81',
      secondary: '#70A1FF',
      background: '#FFF5F5',
      surface: '#FFFFFF',
      text: '#2D3436',
      textSecondary: '#636E72',
      accent: '#FFEAA7',
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
      'game.title': '育儿之路',
      'game.subtitle': '新手父母的日常',
    },
  },
};

export default parentingTheme;
