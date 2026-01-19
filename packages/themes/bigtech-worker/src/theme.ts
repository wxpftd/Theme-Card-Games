import { ThemeConfig, CardDefinition, StatDefinition, ResourceDefinition, UITheme } from '@theme-card-games/core';

/**
 * 大厂打工主题配置
 * Big Tech Worker Theme Configuration
 */

// ============================================================================
// 统计数据定义 (Stats)
// ============================================================================
const stats: StatDefinition[] = [
  {
    id: 'performance',
    name: '绩效',
    description: '工作表现评分，达到100即可晋升',
    min: 0,
    max: 100,
    icon: '📈',
  },
  {
    id: 'health',
    name: '健康',
    description: '身心健康值，降到0会被迫离职',
    min: 0,
    max: 100,
    icon: '❤️',
  },
  {
    id: 'happiness',
    name: '幸福感',
    description: '工作生活平衡度',
    min: 0,
    max: 100,
    icon: '😊',
  },
  {
    id: 'influence',
    name: '影响力',
    description: '在公司的影响力和话语权',
    min: 0,
    max: 100,
    icon: '🎯',
  },
];

// ============================================================================
// 资源定义 (Resources)
// ============================================================================
const resources: ResourceDefinition[] = [
  {
    id: 'money',
    name: '薪资',
    description: '每月收入（万元）',
    icon: '💰',
  },
  {
    id: 'energy',
    name: '精力',
    description: '每回合可用的精力点数',
    icon: '⚡',
  },
  {
    id: 'connections',
    name: '人脉',
    description: '职场人脉资源',
    icon: '🤝',
  },
  {
    id: 'skills',
    name: '技能点',
    description: '可用于学习新技能',
    icon: '📚',
  },
];

// ============================================================================
// 卡牌定义 (Cards)
// ============================================================================
const cards: CardDefinition[] = [
  // ==================== 工作事件卡 ====================
  {
    id: 'overtime',
    type: 'event',
    name: '加班',
    description: '主动加班完成项目，绩效+10，健康-5，精力-2',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 10 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -5 },
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 2 },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['work', 'overtime'],
  },
  {
    id: 'bug_fix',
    type: 'action',
    name: '修复线上Bug',
    description: '紧急修复生产环境问题，绩效+15，健康-10',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 15 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -10 },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['work', 'urgent'],
  },
  {
    id: 'project_delivery',
    type: 'action',
    name: '项目交付',
    description: '成功交付重要项目，绩效+20，影响力+5',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 20 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 5 },
    ],
    cost: 3,
    rarity: 'rare',
    tags: ['work', 'project'],
  },
  {
    id: 'code_review',
    type: 'action',
    name: '代码评审',
    description: '帮同事做代码评审，影响力+3，人脉+1',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 3 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'connections' }, value: 1 },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['work', 'social'],
  },
  {
    id: 'ppt_presentation',
    type: 'action',
    name: 'PPT汇报',
    description: '向领导汇报工作，绩效+8，幸福感-3',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 8 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -3 },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['work', 'meeting'],
  },

  // ==================== 摸鱼卡 ====================
  {
    id: 'slacking',
    type: 'action',
    name: '摸鱼',
    description: '偷偷摸鱼休息，健康+5，幸福感+5，绩效-3',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 5 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 5 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -3 },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['rest', 'risk'],
  },
  {
    id: 'coffee_break',
    type: 'action',
    name: '咖啡时间',
    description: '去茶水间喝咖啡放松，健康+3，精力+1',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 3 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'energy' }, value: 1 },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['rest'],
  },

  // ==================== 社交卡 ====================
  {
    id: 'team_dinner',
    type: 'event',
    name: '团建聚餐',
    description: '参加团队聚餐，人脉+2，幸福感+5，健康-3',
    effects: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'connections' }, value: 2 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 5 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -3 },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['social'],
  },
  {
    id: 'mentor_meeting',
    type: 'action',
    name: '导师1对1',
    description: '和导师深度交流，影响力+5，技能点+2',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 5 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 2 },
    ],
    cost: 1,
    rarity: 'uncommon',
    tags: ['social', 'growth'],
  },
  {
    id: 'networking',
    type: 'action',
    name: '拓展人脉',
    description: '参加技术分享会，人脉+3，影响力+2',
    effects: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'connections' }, value: 3 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 2 },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['social', 'growth'],
  },

  // ==================== 成长卡 ====================
  {
    id: 'online_course',
    type: 'action',
    name: '在线学习',
    description: '学习新技术课程，技能点+3，精力-1',
    effects: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 3 },
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 1 },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['growth'],
  },
  {
    id: 'side_project',
    type: 'action',
    name: '业余项目',
    description: '开发个人项目，技能点+5，健康-5，幸福感+3',
    effects: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 5 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -5 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 3 },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['growth', 'personal'],
  },
  {
    id: 'certification',
    type: 'action',
    name: '考取证书',
    description: '获得专业认证，绩效+10，影响力+5，精力-3',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 10 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 5 },
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 3 },
    ],
    cost: 3,
    rarity: 'rare',
    tags: ['growth'],
  },

  // ==================== 突发事件卡 ====================
  {
    id: 'layoff_rumor',
    type: 'event',
    name: '裁员传闘',
    description: '公司传出裁员消息，幸福感-10，健康-5',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -10 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -5 },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['event', 'negative'],
  },
  {
    id: 'bonus',
    type: 'event',
    name: '年终奖',
    description: '获得丰厚年终奖，薪资+5，幸福感+15',
    effects: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'money' }, value: 5 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 15 },
    ],
    cost: 0,
    rarity: 'rare',
    tags: ['event', 'positive'],
  },
  {
    id: 'promotion',
    type: 'event',
    name: '晋升机会',
    description: '获得晋升机会，绩效+25，薪资+3，影响力+10',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 25 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'money' }, value: 3 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 10 },
    ],
    cost: 0,
    rarity: 'legendary',
    tags: ['event', 'positive'],
  },
  {
    id: 'system_crash',
    type: 'event',
    name: '系统崩溃',
    description: '线上系统崩溃需要紧急处理，健康-15，绩效-5，但成功修复后影响力+8',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -15 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -5 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 8 },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['event', 'urgent'],
  },

  // ==================== 生活卡 ====================
  {
    id: 'vacation',
    type: 'action',
    name: '年假',
    description: '使用年假休息，健康+20，幸福感+15，绩效-5',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 20 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 15 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -5 },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['life', 'rest'],
  },
  {
    id: 'gym',
    type: 'action',
    name: '健身',
    description: '下班后去健身房锻炼，健康+10，精力+1',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 10 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'energy' }, value: 1 },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['life', 'health'],
  },
  {
    id: 'family_time',
    type: 'action',
    name: '陪伴家人',
    description: '周末陪伴家人，幸福感+10，健康+5',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 10 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 5 },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['life', 'family'],
  },

  // ==================== 策略卡 ====================
  {
    id: 'job_hop',
    type: 'action',
    name: '跳槽面试',
    description: '尝试跳槽到其他公司，消耗3人脉，薪资+5，绩效重置为50',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'connections' }, value: 3 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'money' }, value: 5 },
    ],
    cost: 3,
    rarity: 'rare',
    tags: ['strategy'],
  },
  {
    id: 'internal_transfer',
    type: 'action',
    name: '内部转岗',
    description: '申请转到其他部门，绩效-10，幸福感+10，技能点+3',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -10 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 10 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 3 },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['strategy'],
  },
];

// ============================================================================
// UI主题 (UI Theme)
// ============================================================================
const uiTheme: UITheme = {
  colors: {
    primary: '#1E88E5',      // 科技蓝
    secondary: '#43A047',    // 成长绿
    background: '#F5F5F5',   // 浅灰背景
    surface: '#FFFFFF',      // 白色卡片
    text: '#212121',         // 深灰文字
    textSecondary: '#757575', // 次要文字
    accent: '#FF6B35',       // 强调橙
    error: '#D32F2F',        // 错误红
    success: '#388E3C',      // 成功绿
    warning: '#F57C00',      // 警告橙
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
    sm: 4,
    md: 8,
    lg: 16,
    card: 12,
  },
  cardStyles: {
    width: 140,
    height: 200,
    aspectRatio: 0.7,
  },
};

// ============================================================================
// 本地化 (Localization)
// ============================================================================
const localization: Record<string, Record<string, string>> = {
  'zh-CN': {
    'game.title': '大厂生存指南',
    'game.subtitle': '打工人的卡牌人生',
    'game.start': '开始游戏',
    'game.restart': '重新开始',
    'game.pause': '暂停',
    'game.resume': '继续',
    'turn.draw': '抽牌阶段',
    'turn.main': '主要阶段',
    'turn.end': '结束阶段',
    'action.play': '打出',
    'action.discard': '弃牌',
    'action.endTurn': '结束回合',
    'win.promotion': '恭喜晋升！你成功在大厂站稳脚跟！',
    'lose.health': '身体垮了...你选择了离职休养',
    'lose.happiness': '太累了...你选择了躺平',
  },
  'en-US': {
    'game.title': 'Big Tech Survival Guide',
    'game.subtitle': 'Card Game of a Tech Worker',
    'game.start': 'Start Game',
    'game.restart': 'Restart',
    'game.pause': 'Pause',
    'game.resume': 'Resume',
    'turn.draw': 'Draw Phase',
    'turn.main': 'Main Phase',
    'turn.end': 'End Phase',
    'action.play': 'Play',
    'action.discard': 'Discard',
    'action.endTurn': 'End Turn',
    'win.promotion': 'Congratulations! You got promoted!',
    'lose.health': 'Burned out... You decided to take a break',
    'lose.happiness': 'Too exhausted... You chose to lie flat',
  },
};

// ============================================================================
// 主题配置导出 (Theme Config Export)
// ============================================================================
export const bigtechWorkerTheme: ThemeConfig = {
  id: 'bigtech-worker',
  name: '大厂打工',
  description: '体验互联网大厂打工人的日常，在绩效、健康和幸福之间寻找平衡',
  version: '1.0.0',

  gameConfig: {
    maxPlayers: 4,
    minPlayers: 1,
    initialHandSize: 5,
    maxHandSize: 10,
    turnTimeLimit: 60,
    winConditions: [
      { type: 'stat_threshold', stat: 'performance', operator: '>=', value: 100 },
      { type: 'stat_threshold', stat: 'health', operator: '<=', value: 0 },
      { type: 'stat_threshold', stat: 'happiness', operator: '<=', value: 0 },
      { type: 'turn_limit', value: 30 },
    ],
    initialStats: {
      performance: 50,
      health: 80,
      happiness: 60,
      influence: 10,
    },
    initialResources: {
      money: 2,
      energy: 5,
      connections: 3,
      skills: 2,
    },
  },

  cards,
  stats,
  resources,
  uiTheme,
  localization,
};

export default bigtechWorkerTheme;
