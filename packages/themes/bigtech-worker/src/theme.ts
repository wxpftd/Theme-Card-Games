import {
  ThemeConfig,
  CardDefinition,
  StatDefinition,
  ResourceDefinition,
  UITheme,
  ComboDefinition,
  StatusDefinition,
  CardUpgradeDefinition,
  RandomEventDefinition,
  RandomEventConfig,
  AchievementDefinition,
  DifficultyDefinition,
  DailyChallengeConfig,
  GameSessionStats,
  GameState,
  SharedResourceDefinition,
} from '@theme-card-games/core';
import { zhCN, enUS } from './locales';
import { competitiveCards, competitiveCardIds } from './competitiveCards';
import { sharedResourceDefinitions } from './sharedResources';

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

  // ==================== 升级版卡牌 ====================
  {
    id: 'overtime_efficient',
    type: 'event',
    name: '高效加班',
    description: '学会了高效加班，绩效+10，健康-3（减少消耗），精力-2',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 10 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -3 },
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 2 },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['work', 'overtime', 'upgraded'],
  },
  {
    id: 'slacking_pro',
    type: 'action',
    name: '花式摸鱼',
    description: '摸鱼技术登峰造极，健康+8，幸福感+8，绩效-2',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 8 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 8 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -2 },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['rest', 'risk', 'upgraded'],
  },
  {
    id: 'project_delivery_star',
    type: 'action',
    name: '明星项目',
    description: '交付了明星项目！绩效+30，影响力+10，解锁晋升快车道',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 30 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 10 },
    ],
    cost: 3,
    rarity: 'legendary',
    tags: ['work', 'project', 'upgraded'],
  },
  {
    id: 'online_course_advanced',
    type: 'action',
    name: '深度学习',
    description: '系统性学习高级课程，技能点+5，影响力+2，精力-1',
    effects: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 5 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 2 },
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 1 },
    ],
    cost: 1,
    rarity: 'uncommon',
    tags: ['growth', 'upgraded'],
  },
  {
    id: 'coffee_break_social',
    type: 'action',
    name: '咖啡社交',
    description: '咖啡时间变成社交时间，健康+3，精力+1，人脉+1',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 3 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'energy' }, value: 1 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'connections' }, value: 1 },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['rest', 'social', 'upgraded'],
  },

  // ==================== 反转类卡牌 ====================
  {
    id: 'slacking_caught',
    type: 'event',
    name: '摸鱼被抓',
    description: '摸鱼被领导发现了！绩效-15，但慌乱中抽2张卡',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -15 },
      { type: 'draw_cards', target: 'self', value: 2 },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['rest', 'risk', 'reversal'],
  },
  {
    id: 'manage_up',
    type: 'action',
    name: '向上管理',
    description: '运用人脉关系进行向上管理，消耗3人脉，绩效+15',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'connections' }, value: 3 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 15 },
    ],
    cost: 1,
    rarity: 'rare',
    tags: ['work', 'social', 'reversal'],
  },
  {
    id: 'paid_training',
    type: 'action',
    name: '带薪学习',
    description: '参加公司内部培训，技能+3，不消耗精力',
    effects: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 3 },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['growth', 'reversal'],
  },

  // ==================== 高风险高收益卡牌 ====================
  {
    id: 'startup_dream',
    type: 'event',
    name: '创业念头',
    description: '脑海中冒出创业想法！50%概率薪资翻倍，50%概率薪资归零',
    effects: [
      {
        type: 'custom',
        target: 'self',
        metadata: {
          handler: 'random_resource_gamble',
          resource: 'money',
          successMultiplier: 2,
          failMultiplier: 0,
          successChance: 0.5,
        },
        value: 0,
      },
    ],
    cost: 0,
    rarity: 'rare',
    tags: ['strategy', 'high_risk'],
  },
  {
    id: 'tech_speech',
    type: 'action',
    name: '演讲分享',
    description: '进行技术演讲分享，影响力+15，但有20%概率失败导致影响力-10',
    effects: [
      {
        type: 'custom',
        target: 'self',
        metadata: {
          handler: 'random_stat_gamble',
          stat: 'influence',
          successValue: 15,
          failValue: -10,
          failChance: 0.2,
        },
        value: 0,
      },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['work', 'social', 'high_risk'],
  },

  // ==================== 生存类卡牌 ====================
  {
    id: 'sick_leave',
    type: 'action',
    name: '请病假',
    description: '请一天病假休息，健康+15，绩效-8，下回合不能使用工作卡',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 15 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -8 },
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'sick_leave_debuff' },
        value: 1,
      },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['life', 'rest', 'survival'],
  },
  {
    id: 'therapy',
    type: 'action',
    name: '心理咨询',
    description: '预约心理咨询师，幸福感+20，消耗薪资2',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 20 },
      { type: 'lose_resource', target: 'self', metadata: { resource: 'money' }, value: 2 },
    ],
    cost: 1,
    rarity: 'uncommon',
    tags: ['life', 'survival'],
  },
];

// ============================================================================
// 组合定义 (Combo Definitions)
// ============================================================================
const comboDefinitions: ComboDefinition[] = [
  // 加班 + 咖啡时间 = 熬夜战士
  {
    id: 'night_warrior',
    name: '熬夜战士',
    description: '加班配咖啡，战斗力爆表！额外绩效+5',
    icon: '🦉',
    trigger: {
      type: 'combination',
      cards: ['overtime', 'coffee_break'],
    },
    effects: [{ type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 5 }],
    cooldown: 0,
  },
  // 代码评审 + 导师1对1 = 职场导师
  {
    id: 'workplace_mentor',
    name: '职场导师',
    description: '指导他人，提升自我！额外影响力+5',
    icon: '👨‍🏫',
    trigger: {
      type: 'combination',
      cards: ['code_review', 'mentor_meeting'],
    },
    effects: [{ type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 5 }],
    cooldown: 0,
  },
  // 在线学习 + 考取证书 = 高效学习
  {
    id: 'efficient_learning',
    name: '高效学习',
    description: '学以致用，事半功倍！获得额外技能点+3',
    icon: '📖',
    trigger: {
      type: 'combination',
      cards: ['online_course', 'certification'],
    },
    effects: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 3 },
    ],
    cooldown: 0,
  },
  // 连续3张工作类卡牌 = 卷王状态
  {
    id: 'workaholic_combo',
    name: '卷王降临',
    description: '连续工作触发卷王状态！绩效加成但健康持续下降',
    icon: '💪',
    trigger: {
      type: 'tag_count',
      tag: 'work',
      count: 3,
    },
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 10 },
    ],
    applyStatus: 'workaholic_mode',
    cooldown: 3, // 3回合冷却
  },
  // 健身 + 陪伴家人 = 生活平衡
  {
    id: 'life_balance',
    name: '生活平衡',
    description: '工作生活两不误！幸福感大幅提升',
    icon: '⚖️',
    trigger: {
      type: 'combination',
      cards: ['gym', 'family_time'],
    },
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 10 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 5 },
    ],
    cooldown: 0,
  },
  // 摸鱼 + 咖啡时间 = 带薪休息
  {
    id: 'paid_break',
    name: '带薪休息',
    description: '摸鱼的艺术！健康大幅恢复',
    icon: '☕',
    trigger: {
      type: 'combination',
      cards: ['slacking', 'coffee_break'],
    },
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 8 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 3 },
    ],
    cooldown: 0,
  },
  // 团建聚餐 + 拓展人脉 = 社交达人
  {
    id: 'social_butterfly',
    name: '社交达人',
    description: '人脉广布，左右逢源！人脉+3，影响力+3',
    icon: '🦋',
    trigger: {
      type: 'combination',
      cards: ['team_dinner', 'networking'],
    },
    effects: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'connections' }, value: 3 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 3 },
    ],
    cooldown: 0,
  },
];

// ============================================================================
// 状态效果定义 (Status Effect Definitions)
// ============================================================================
const statusDefinitions: StatusDefinition[] = [
  // 996模式：持续3回合，每回合绩效+5但健康-3
  {
    id: 'mode_996',
    name: '996模式',
    description: '工作到极致，但身体在透支',
    icon: '⏰',
    duration: 3,
    stackable: false,
    effects: [], // 被动效果（暂无）
    onTurnStart: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 5 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -3 },
    ],
  },
  // 卷王状态：由连击触发，持续2回合
  {
    id: 'workaholic_mode',
    name: '卷王状态',
    description: '疯狂内卷中，绩效飙升但健康告急',
    icon: '🔥',
    duration: 2,
    stackable: false,
    effects: [],
    onTurnStart: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 5 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -5 },
    ],
  },
  // 职业倦怠：幸福感<30时自动触发，所有行动消耗精力+1
  {
    id: 'burnout',
    name: '职业倦怠',
    description: '身心俱疲，做什么都提不起劲',
    icon: '😮‍💨',
    duration: -1, // 永久，直到条件解除
    stackable: false,
    effects: [
      // 标记效果，用于在卡牌消耗时检查
      {
        type: 'custom',
        target: 'self',
        metadata: { modifierType: 'energy_cost', value: 1 },
        value: 1,
      },
    ],
    onTurnStart: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -2 },
    ],
    triggerCondition: {
      type: 'stat_threshold',
      stat: 'happiness',
      operator: '<',
      value: 30,
    },
  },
  // 灵感爆发：技能点>8时触发，下2回合成长卡效果翻倍
  {
    id: 'inspiration_burst',
    name: '灵感爆发',
    description: '灵感如泉涌，学习效率翻倍！',
    icon: '💡',
    duration: 2,
    stackable: false,
    effects: [
      {
        type: 'custom',
        target: 'self',
        metadata: { modifierType: 'growth_bonus', value: 2 },
        value: 2,
      },
    ],
    onApply: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 2 },
    ],
    triggerCondition: {
      type: 'resource_threshold',
      resource: 'skills',
      operator: '>',
      value: 8,
    },
  },
  // 人脉网络：人脉>5时，社交卡额外+2影响力
  {
    id: 'network_effect',
    name: '人脉网络',
    description: '人脉广泛，社交更有影响力',
    icon: '🌐',
    duration: -1, // 永久，条件状态
    stackable: false,
    effects: [
      {
        type: 'custom',
        target: 'self',
        metadata: { modifierType: 'social_bonus', value: 2 },
        value: 2,
      },
    ],
    triggerCondition: {
      type: 'resource_threshold',
      resource: 'connections',
      operator: '>',
      value: 5,
    },
  },
  // 精力充沛：健康>80时触发
  {
    id: 'energized',
    name: '精力充沛',
    description: '身体健康，干劲十足！',
    icon: '⚡',
    duration: -1,
    stackable: false,
    effects: [],
    onTurnStart: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'energy' }, value: 1 },
    ],
    triggerCondition: {
      type: 'stat_threshold',
      stat: 'health',
      operator: '>',
      value: 80,
    },
  },
  // 压力山大：绩效<30时触发
  {
    id: 'stressed',
    name: '压力山大',
    description: '绩效压力让人喘不过气',
    icon: '😰',
    duration: -1,
    stackable: false,
    effects: [],
    onTurnEnd: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -3 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -2 },
    ],
    triggerCondition: {
      type: 'stat_threshold',
      stat: 'performance',
      operator: '<',
      value: 30,
    },
  },
  // 病假状态：请病假后触发，下回合不能使用工作卡
  {
    id: 'sick_leave_debuff',
    name: '病假中',
    description: '正在休病假，不能进行工作相关活动',
    icon: '🏥',
    duration: 1,
    stackable: false,
    effects: [
      {
        type: 'custom',
        target: 'self',
        metadata: { modifierType: 'block_tag', tag: 'work' },
        value: 1,
      },
    ],
  },
];

// ============================================================================
// 卡牌升级定义 (Card Upgrade Definitions)
// ============================================================================
const cardUpgrades: CardUpgradeDefinition[] = [
  // 加班 → 高效加班（使用3次后升级）
  {
    id: 'upgrade_overtime',
    sourceCardId: 'overtime',
    targetCardId: 'overtime_efficient',
    upgradeCondition: { type: 'use_count', count: 3 },
    description: '使用3次加班后升级为高效加班',
  },
  // 摸鱼 → 花式摸鱼（使用3次后升级）
  {
    id: 'upgrade_slacking',
    sourceCardId: 'slacking',
    targetCardId: 'slacking_pro',
    upgradeCondition: { type: 'use_count', count: 3 },
    description: '使用3次摸鱼后升级为花式摸鱼',
  },
  // 项目交付 → 明星项目（使用3次后升级）
  {
    id: 'upgrade_project_delivery',
    sourceCardId: 'project_delivery',
    targetCardId: 'project_delivery_star',
    upgradeCondition: { type: 'use_count', count: 3 },
    description: '使用3次项目交付后升级为明星项目',
  },
  // 在线学习 → 深度学习（使用3次后升级）
  {
    id: 'upgrade_online_course',
    sourceCardId: 'online_course',
    targetCardId: 'online_course_advanced',
    upgradeCondition: { type: 'use_count', count: 3 },
    description: '使用3次在线学习后升级为深度学习',
  },
  // 咖啡时间 → 咖啡社交（使用3次后升级）
  {
    id: 'upgrade_coffee_break',
    sourceCardId: 'coffee_break',
    targetCardId: 'coffee_break_social',
    upgradeCondition: { type: 'use_count', count: 3 },
    description: '使用3次咖啡时间后升级为咖啡社交',
  },
];

// ============================================================================
// 随机事件定义 (Random Event Definitions)
// ============================================================================
const randomEventDefinitions: RandomEventDefinition[] = [
  // 绩效评估：随机+20或-10绩效
  {
    id: 'performance_review',
    name: '绩效评估',
    description: '季度绩效评估来了！你的表现会被如何评价？',
    icon: '📋',
    weight: 1,
    effects: [], // 使用randomEffects
    randomEffects: [
      {
        weight: 50,
        description: '表现优秀！获得了主管的认可，绩效+20',
        effects: [
          { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 20 },
          { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 5 },
        ],
      },
      {
        weight: 50,
        description: '评估结果不太理想，绩效-10，需要更加努力',
        effects: [
          { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -10 },
          { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -5 },
        ],
      },
    ],
  },

  // 股票波动：薪资随机×0.5~2
  {
    id: 'stock_fluctuation',
    name: '股票波动',
    description: '公司股票价格发生了变化，你的期权价值也随之波动...',
    icon: '📈',
    weight: 1,
    effects: [],
    randomEffects: [
      {
        weight: 20,
        description: '股价暴涨！期权价值翻倍，薪资×2',
        effects: [
          {
            type: 'custom',
            target: 'self',
            metadata: { handler: 'multiply_resource', resource: 'money', multiplier: 2 },
            value: 2,
          },
          { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 15 },
        ],
      },
      {
        weight: 30,
        description: '股价上涨，期权增值，薪资×1.5',
        effects: [
          {
            type: 'custom',
            target: 'self',
            metadata: { handler: 'multiply_resource', resource: 'money', multiplier: 1.5 },
            value: 1.5,
          },
          { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 8 },
        ],
      },
      {
        weight: 30,
        description: '股价下跌，期权缩水，薪资×0.75',
        effects: [
          {
            type: 'custom',
            target: 'self',
            metadata: { handler: 'multiply_resource', resource: 'money', multiplier: 0.75 },
            value: 0.75,
          },
          { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -5 },
        ],
      },
      {
        weight: 20,
        description: '股价暴跌！期权大幅缩水，薪资×0.5',
        effects: [
          {
            type: 'custom',
            target: 'self',
            metadata: { handler: 'multiply_resource', resource: 'money', multiplier: 0.5 },
            value: 0.5,
          },
          { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -10 },
        ],
      },
    ],
  },

  // 猎头联系：消耗2人脉，50%概率跳槽成功（薪资+8）
  {
    id: 'headhunter_contact',
    name: '猎头联系',
    description: '有猎头联系你了！要不要考虑一下新机会？',
    icon: '📞',
    weight: 1,
    effects: [],
    condition: {
      type: 'resource_check',
      resource: 'connections',
      operator: '>=',
      value: 2,
    },
    randomEffects: [
      {
        weight: 50,
        description: '面试顺利，成功跳槽！消耗2人脉，薪资+8',
        effects: [
          {
            type: 'lose_resource',
            target: 'self',
            metadata: { resource: 'connections' },
            value: 2,
          },
          { type: 'gain_resource', target: 'self', metadata: { resource: 'money' }, value: 8 },
          { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 10 },
          { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -20 },
        ],
      },
      {
        weight: 50,
        description: '面试失败了，但积累了经验。消耗2人脉，获得2技能点',
        effects: [
          {
            type: 'lose_resource',
            target: 'self',
            metadata: { resource: 'connections' },
            value: 2,
          },
          { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 2 },
          { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 1 },
        ],
      },
    ],
  },

  // 体检报告：根据当前健康值触发不同效果
  {
    id: 'health_report',
    name: '体检报告',
    description: '年度体检报告出来了...',
    icon: '🏥',
    weight: 1,
    effects: [],
    customHandler: 'health_report_handler',
  },
];

// 随机事件配置
const randomEventConfig: RandomEventConfig = {
  triggerInterval: 3, // 每3回合
  triggerProbability: 0.3, // 30%概率触发
  maxEventsPerGame: 10, // 每局游戏最多10次随机事件
  announceEvent: true,
};

// ============================================================================
// 成就定义 (Achievement Definitions)
// ============================================================================
const achievementDefinitions: AchievementDefinition[] = [
  // 卷王之王：单局游戏使用10次工作类卡牌
  {
    id: 'workaholic_king',
    name: '卷王之王',
    description: '单局游戏使用10次工作类卡牌',
    icon: '👑',
    category: 'gameplay',
    rarity: 'rare',
    condition: {
      type: 'card_usage',
      cardTag: 'work',
      count: 10,
      inSingleGame: true,
    },
    rewards: [
      { type: 'card_skin', value: 'golden_overtime', description: '金色加班卡皮肤' },
      { type: 'points', value: 100 },
    ],
    points: 100,
  },
  // 养生达人：健康值始终保持60以上通关
  {
    id: 'health_master',
    name: '养生达人',
    description: '健康值始终保持60以上通关',
    icon: '🧘',
    category: 'challenge',
    rarity: 'epic',
    condition: {
      type: 'stat_maintained',
      stat: 'health',
      operator: '>=',
      value: 60,
      forEntireGame: true,
    },
    rewards: [
      { type: 'buff', value: 'start_health_bonus', description: '开局健康+10 buff' },
      { type: 'points', value: 150 },
    ],
    points: 150,
  },
  // 社交蝴蝶：人脉达到15
  {
    id: 'social_butterfly',
    name: '社交蝴蝶',
    description: '人脉达到15',
    icon: '🦋',
    category: 'milestone',
    rarity: 'uncommon',
    condition: {
      type: 'stat_reached',
      stat: 'connections',
      operator: '>=',
      value: 15,
    },
    rewards: [
      { type: 'card_skin', value: 'vip_networking', description: 'VIP人脉卡皮肤' },
      { type: 'points', value: 80 },
    ],
    points: 80,
  },
  // 躺平先锋：使用5次摸鱼卡后仍然晋升成功
  {
    id: 'slacker_champion',
    name: '躺平先锋',
    description: '使用5次摸鱼类卡牌后仍然晋升成功',
    icon: '🛋️',
    category: 'challenge',
    rarity: 'rare',
    condition: {
      type: 'custom',
      checkerId: 'slacker_champion_checker',
    },
    rewards: [
      { type: 'card_skin', value: 'zen_slacking', description: '禅意摸鱼卡皮肤' },
      { type: 'points', value: 120 },
    ],
    points: 120,
  },
  // 速通大师：15回合内晋升
  {
    id: 'speedrunner',
    name: '速通大师',
    description: '15回合内晋升',
    icon: '⚡',
    category: 'challenge',
    rarity: 'epic',
    condition: {
      type: 'win_within_turns',
      maxTurns: 15,
    },
    rewards: [
      { type: 'buff', value: 'fast_start', description: '开局抽牌+2 buff' },
      { type: 'points', value: 200 },
    ],
    points: 200,
  },
  // 铁人：健康值曾降到10以下但最终晋升
  {
    id: 'iron_will',
    name: '铁人',
    description: '健康值曾降到10以下但最终晋升成功',
    icon: '🦾',
    category: 'challenge',
    rarity: 'legendary',
    condition: {
      type: 'stat_recovered',
      stat: 'health',
      fromBelow: 10,
      toAbove: 0,
    },
    rewards: [
      { type: 'card_skin', value: 'legendary_survivor', description: '传奇幸存者皮肤' },
      { type: 'unlock_card', value: 'second_wind', description: '解锁特殊卡牌：绝地反击' },
      { type: 'points', value: 300 },
    ],
    points: 300,
  },
  // 影响力大师：影响力达到80
  {
    id: 'influence_master',
    name: '影响力大师',
    description: '影响力达到80',
    icon: '🎯',
    category: 'milestone',
    rarity: 'rare',
    condition: {
      type: 'stat_reached',
      stat: 'influence',
      operator: '>=',
      value: 80,
    },
    rewards: [
      { type: 'card_skin', value: 'executive_style', description: '高管风格皮肤' },
      { type: 'points', value: 100 },
    ],
    points: 100,
  },
  // 首次胜利（隐藏成就）
  {
    id: 'first_win',
    name: '职场新星',
    description: '首次成功晋升',
    icon: '⭐',
    category: 'hidden',
    rarity: 'common',
    hidden: true,
    condition: {
      type: 'win_with_condition',
      conditionId: 'any_win',
    },
    rewards: [
      { type: 'title', value: '职场新星', description: '解锁称号' },
      { type: 'points', value: 50 },
    ],
    points: 50,
  },
];

// ============================================================================
// 难度定义 (Difficulty Definitions)
// ============================================================================
const difficultyDefinitions: DifficultyDefinition[] = [
  // 简单模式
  {
    id: 'easy',
    name: '实习生模式',
    description: '初始绩效60，健康100，每回合精力恢复+1',
    icon: '🌱',
    initialStats: {
      performance: 60,
      health: 100,
      happiness: 70,
      influence: 15,
    },
    initialResources: {
      money: 3,
      energy: 6,
      connections: 4,
      skills: 3,
    },
    specialRules: [
      {
        type: 'energy_recovery',
        value: 1,
        description: '每回合额外恢复1点精力',
      },
    ],
    scoreMultiplier: 0.5,
  },
  // 普通模式
  {
    id: 'normal',
    name: '普通员工模式',
    description: '标准难度，体验真实的打工生活',
    icon: '💼',
    // 使用默认配置
    scoreMultiplier: 1.0,
  },
  // 困难模式
  {
    id: 'hard',
    name: '高压模式',
    description: '初始绩效40，每5回合触发一次裁员评估',
    icon: '🔥',
    initialStats: {
      performance: 40,
      health: 75,
      happiness: 50,
      influence: 5,
    },
    initialResources: {
      money: 2,
      energy: 4,
      connections: 2,
      skills: 1,
    },
    specialRules: [
      {
        type: 'layoff_check',
        interval: 5,
        description: '每5回合进行裁员评估，绩效最低者有风险',
      },
    ],
    scoreMultiplier: 1.5,
    unlockCondition: {
      type: 'win_with_condition',
      conditionId: 'normal_win',
    },
  },
  // 地狱模式
  {
    id: 'hell',
    name: '996地狱模式',
    description: '初始绩效30，健康和幸福每回合自动-2，体验真正的996',
    icon: '💀',
    initialStats: {
      performance: 30,
      health: 60,
      happiness: 40,
      influence: 0,
    },
    initialResources: {
      money: 1,
      energy: 3,
      connections: 1,
      skills: 0,
    },
    perTurnStatChanges: {
      health: -2,
      happiness: -2,
    },
    specialRules: [
      {
        type: 'layoff_check',
        interval: 3,
        description: '每3回合进行裁员评估',
      },
      {
        type: 'card_cost_modifier',
        value: 1,
        description: '所有卡牌精力消耗+1',
      },
    ],
    scoreMultiplier: 3.0,
    unlockCondition: {
      type: 'win_with_condition',
      conditionId: 'hard_win',
    },
  },
];

// ============================================================================
// 每日挑战配置 (Daily Challenge Configuration)
// ============================================================================
const dailyChallengeConfig: DailyChallengeConfig = {
  challengePool: [
    // 无摸鱼挑战
    {
      id: 'no_slacking',
      name: '今日挑战：勤劳打工人',
      description: '不使用任何摸鱼类卡牌通关',
      icon: '💪',
      conditions: [{ type: 'no_card_tag', tag: 'rest' }],
      rewards: [
        { type: 'points', value: 50 },
        { type: 'card_skin', value: 'daily_diligent', description: '勤劳徽章' },
      ],
      difficulty: 3,
      tags: ['restriction'],
    },
    // 精力节约挑战
    {
      id: 'energy_saver',
      name: '今日挑战：精力管理大师',
      description: '精力消耗不超过20通关',
      icon: '🔋',
      conditions: [{ type: 'max_resource_usage', resource: 'energy', max: 20 }],
      rewards: [
        { type: 'points', value: 60 },
        { type: 'buff', value: 'energy_efficient', description: '下局游戏初始精力+2' },
      ],
      difficulty: 4,
      tags: ['resource'],
    },
    // 影响力挑战
    {
      id: 'influence_rush',
      name: '今日挑战：影响力冲刺',
      description: '影响力达到80后晋升',
      icon: '🎯',
      conditions: [{ type: 'min_stat_at_win', stat: 'influence', min: 80 }],
      rewards: [
        { type: 'points', value: 80 },
        { type: 'card_skin', value: 'daily_influencer', description: '影响者徽章' },
      ],
      difficulty: 4,
      tags: ['stat'],
    },
    // 速通挑战
    {
      id: 'speedrun_daily',
      name: '今日挑战：极速晋升',
      description: '20回合内完成晋升',
      icon: '⚡',
      conditions: [{ type: 'max_turns', turns: 20 }],
      rewards: [
        { type: 'points', value: 70 },
        { type: 'buff', value: 'quick_draw', description: '下局游戏首回合多抽1张牌' },
      ],
      difficulty: 3,
      tags: ['speed'],
    },
    // 社交达人挑战
    {
      id: 'social_master',
      name: '今日挑战：社交达人',
      description: '使用至少8次社交类卡牌通关',
      icon: '🤝',
      conditions: [{ type: 'min_card_usage', cardTag: 'social', count: 8 }],
      rewards: [
        { type: 'points', value: 55 },
        { type: 'card_skin', value: 'daily_social', description: '社交达人徽章' },
      ],
      difficulty: 2,
      tags: ['card_type'],
    },
    // 健康优先挑战
    {
      id: 'health_first',
      name: '今日挑战：健康第一',
      description: '保持健康值70以上完成晋升',
      icon: '❤️',
      conditions: [{ type: 'min_stat_at_win', stat: 'health', min: 70 }],
      rewards: [
        { type: 'points', value: 65 },
        { type: 'buff', value: 'healthy_start', description: '下局游戏初始健康+5' },
      ],
      difficulty: 3,
      tags: ['stat'],
    },
    // 纯工作挑战
    {
      id: 'pure_work',
      name: '今日挑战：专注工作',
      description: '只使用工作类卡牌通关（不使用社交和生活卡）',
      icon: '📊',
      conditions: [
        { type: 'no_card_tag', tag: 'social' },
        { type: 'no_card_tag', tag: 'life' },
      ],
      rewards: [
        { type: 'points', value: 100 },
        { type: 'card_skin', value: 'daily_focused', description: '专注徽章' },
      ],
      difficulty: 5,
      tags: ['restriction', 'hardcore'],
    },
  ],
  streakBonuses: [
    { streakLength: 3, bonus: { type: 'points', value: 30, description: '3天连续挑战奖励' } },
    { streakLength: 7, bonus: { type: 'points', value: 100, description: '7天连续挑战奖励' } },
    {
      streakLength: 14,
      bonus: { type: 'card_skin', value: 'streak_master', description: '连胜大师皮肤' },
    },
    {
      streakLength: 30,
      bonus: {
        type: 'unlock_card',
        value: 'challenge_champion',
        description: '解锁特殊卡牌：挑战冠军',
      },
    },
  ],
};

// ============================================================================
// UI主题 (UI Theme)
// ============================================================================
const uiTheme: UITheme = {
  colors: {
    primary: '#1E88E5', // 科技蓝
    secondary: '#43A047', // 成长绿
    background: '#F5F5F5', // 浅灰背景
    surface: '#FFFFFF', // 白色卡片
    text: '#212121', // 深灰文字
    textSecondary: '#757575', // 次要文字
    accent: '#FF6B35', // 强调橙
    error: '#D32F2F', // 错误红
    success: '#388E3C', // 成功绿
    warning: '#F57C00', // 警告橙
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
  'zh-CN': zhCN,
  'en-US': enUS,
};

// ============================================================================
// 主题配置导出 (Theme Config Export)
// ============================================================================
// 合并基础卡牌和竞争卡牌
const allCards: CardDefinition[] = [...cards, ...competitiveCards];

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

  cards: allCards,
  stats,
  resources,
  statusDefinitions,
  comboDefinitions,
  cardUpgrades,
  randomEventDefinitions,
  randomEventConfig,
  achievementDefinitions,
  difficultyDefinitions,
  dailyChallengeConfig,
  uiTheme,
  localization,

  // 竞争模式配置
  sharedResourceDefinitions,
  competitiveCardIds,

  // Custom achievement checker for "躺平先锋" achievement
  customAchievementCheckers: {
    slacker_champion_checker: (stats: GameSessionStats, _state: GameState) => {
      const restCardCount = stats.cardUsage['rest'] || 0;
      return stats.won && restCardCount >= 5;
    },
  },
};

export default bigtechWorkerTheme;
