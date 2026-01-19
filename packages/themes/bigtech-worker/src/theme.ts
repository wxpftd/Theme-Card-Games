import {
  ThemeConfig,
  CardDefinition,
  StatDefinition,
  ResourceDefinition,
  UITheme,
  ComboDefinition,
  StatusDefinition,
  CardUpgradeDefinition,
} from '@theme-card-games/core';

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
  statusDefinitions,
  comboDefinitions,
  cardUpgrades,
  uiTheme,
  localization,
};

export default bigtechWorkerTheme;
