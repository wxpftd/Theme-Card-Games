/**
 * 大厂打工人主题 - 场景定义
 * Scenario definitions for bigtech-worker theme
 *
 * 场景代表游戏中的不同环境，会对游戏规则和角色产生影响
 */

import { ScenarioDefinition, ScenarioSystemConfig } from '@theme-card-games/core';

// ============================================================================
// 场景定义 (Scenario Definitions)
// ============================================================================

/**
 * 冲刺周 - Sprint Week
 * 高强度工作期间，精力消耗增加，但程序员可以发挥技术优势
 */
const sprintWeekScenario: ScenarioDefinition = {
  id: 'sprint_week',
  name: '冲刺周',
  description: '项目上线前的紧张时刻，所有人都在加班赶工',
  icon: '🏃',
  ambientColor: '#FF6B6B',

  // 全局效果：所有玩家精力消耗增加
  globalResourceModifiers: {
    energy: -1, // 每回合精力额外消耗
  },

  // 每回合效果
  perTurnEffects: [
    {
      type: 'lose_resource',
      target: 'self',
      metadata: { resource: 'energy' },
      value: 1,
    },
  ],

  // 角色差异化
  characterModifiers: {
    // 程序员在冲刺周有优势
    programmer: {
      isAdvantage: true,
      description: '程序员在冲刺周绩效产出+20%',
      perTurnStatChanges: {
        performance: 2,
      },
      passiveEffects: [
        {
          type: 'modify_stat',
          target: 'self',
          metadata: { stat: 'performance', multiplier: 1.2 },
          value: 0,
        },
      ],
    },
    // 测试工程师也有一定优势
    tester: {
      isAdvantage: true,
      description: '测试工程师在冲刺周健康损耗减少',
      perTurnStatChanges: {
        health: 1, // 减少健康损耗
      },
    },
    // 设计师在高压环境下表现不佳
    designer: {
      isAdvantage: false,
      description: '设计师在高压环境下创意受阻',
      perTurnStatChanges: {
        happiness: -2,
      },
    },
  },

  // 场景规则
  rules: [
    {
      type: 'effect_modifier',
      description: '工作类卡牌效果+30%',
      cardTags: ['work'],
      value: 1.3,
    },
  ],

  // 增强工作类卡牌
  enhancedCardTags: {
    work: 1.3,
  },

  // 场景持续
  duration: 5, // 持续5回合
  transitionCondition: {
    type: 'turn_count',
    turns: 5,
  },
};

/**
 * 年终评审 - Year-end Review
 * 绩效考核期间，所有人都在为KPI努力
 */
const yearEndReviewScenario: ScenarioDefinition = {
  id: 'year_end_review',
  name: '年终评审',
  description: '一年一度的绩效考核，表现不佳者将面临淘汰风险',
  icon: '📊',
  ambientColor: '#4ECDC4',

  // 全局效果
  globalStatModifiers: {
    influence: 5, // 影响力暂时提升
  },

  // 角色差异化
  characterModifiers: {
    // 产品经理在评审期间有优势
    product_manager: {
      isAdvantage: true,
      description: '产品经理汇报能力强，影响力效果+50%',
      passiveEffects: [
        {
          type: 'modify_stat',
          target: 'self',
          metadata: { stat: 'influence', multiplier: 1.5 },
          value: 0,
        },
      ],
    },
    // 运营也擅长展示成果
    operations: {
      isAdvantage: true,
      description: '运营擅长数据展示，绩效+10%',
      perTurnStatChanges: {
        performance: 1,
      },
    },
    // 程序员不擅长汇报
    programmer: {
      isAdvantage: false,
      description: '程序员不擅长PPT汇报',
      perTurnStatChanges: {
        influence: -1,
      },
    },
  },

  // 场景规则：每回合检查绩效
  rules: [
    {
      type: 'elimination_check',
      description: '绩效最低者警告',
      interval: 2, // 每2回合检查一次
      statId: 'performance',
    },
  ],

  // 增强社交类卡牌
  enhancedCardTags: {
    social: 1.3,
  },

  // 场景持续
  duration: 4,
  transitionCondition: {
    type: 'turn_count',
    turns: 4,
  },
};

/**
 * 团建活动 - Team Building
 * 轻松的团队活动，禁止谈工作
 */
const teamBuildingScenario: ScenarioDefinition = {
  id: 'team_building',
  name: '团建活动',
  description: '公司组织的团队建设活动，暂时放下工作享受生活',
  icon: '🎉',
  ambientColor: '#95E1D3',

  // 全局效果
  globalStatModifiers: {
    happiness: 10, // 幸福度提升
    health: 5, // 健康恢复
  },

  // 全局资源效果
  globalResourceModifiers: {
    connections: 1, // 每回合增加人脉
  },

  // 每回合效果
  perTurnEffects: [
    {
      type: 'gain_resource',
      target: 'self',
      metadata: { resource: 'connections' },
      value: 1,
    },
  ],

  // 角色差异化
  characterModifiers: {
    // 运营和产品经理擅长社交
    operations: {
      isAdvantage: true,
      description: '运营是社交达人，社交卡效果翻倍',
      passiveEffects: [
        {
          type: 'modify_stat',
          target: 'self',
          metadata: { stat: 'connections', multiplier: 2 },
          value: 0,
        },
      ],
    },
    product_manager: {
      isAdvantage: true,
      description: '产品经理善于团队协调，人脉增长+50%',
      perTurnResourceChanges: {
        connections: 1,
      },
    },
    // 程序员在社交场合不自在
    programmer: {
      isAdvantage: false,
      description: '程序员在社交场合有些尴尬',
      perTurnStatChanges: {
        happiness: -1,
      },
    },
    // 技术总监需要维持形象
    manager: {
      isAdvantage: false,
      description: '技术总监难以放松，需要维持威严',
      perTurnStatChanges: {
        health: -1,
      },
    },
  },

  // 禁用工作卡
  bannedCardTags: ['work'],

  // 增强社交和休息卡
  enhancedCardTags: {
    social: 2.0,
    rest: 1.5,
  },

  // 场景持续
  duration: 3,
  transitionCondition: {
    type: 'turn_count',
    turns: 3,
  },
};

/**
 * 裁员风暴 - Layoff Storm
 * 公司裁员期间，末位淘汰制生效
 */
const layoffStormScenario: ScenarioDefinition = {
  id: 'layoff_storm',
  name: '裁员风暴',
  description: '公司业务调整，正在进行裁员，绩效垫底者将被淘汰',
  icon: '⚡',
  ambientColor: '#A8A8A8',

  // 全局效果：压力增加
  globalStatModifiers: {
    happiness: -10,
    health: -5,
  },

  // 角色差异化
  characterModifiers: {
    // 技术总监有决策权
    manager: {
      isAdvantage: true,
      description: '技术总监参与裁员决策，自身安全',
      passiveEffects: [
        {
          type: 'apply_status',
          target: 'self',
          value: 'elimination_immunity',
        },
      ],
    },
    // 产品经理可以甩锅
    product_manager: {
      isAdvantage: true,
      description: '产品经理善于甩锅，可转移负面属性',
      perTurnStatChanges: {
        performance: 1,
      },
    },
    // 程序员技能可以抵消绩效
    programmer: {
      isAdvantage: false,
      description: '程序员的技术能力可部分抵消绩效压力',
      statModifiers: {
        performance: 5, // 技能转化为绩效
      },
    },
    // 测试和设计师较为脆弱
    tester: {
      isAdvantage: false,
      description: '测试岗位风险较高',
      perTurnStatChanges: {
        performance: -1,
      },
    },
    designer: {
      isAdvantage: false,
      description: '设计师岗位风险较高',
      perTurnStatChanges: {
        performance: -1,
      },
    },
  },

  // 场景规则：每3回合淘汰绩效最低者
  rules: [
    {
      type: 'elimination_check',
      description: '每3回合淘汰绩效最低的玩家',
      interval: 3,
      statId: 'performance',
      customRuleId: 'eliminate_lowest_performer',
    },
    {
      type: 'stat_modifier',
      description: '所有玩家压力增加',
      statId: 'happiness',
      value: -2,
    },
  ],

  // 削弱休息类卡牌
  weakenedCardTags: {
    rest: 0.5,
  },

  // 增强工作类卡牌
  enhancedCardTags: {
    work: 1.2,
    growth: 1.3,
  },

  // 场景持续到只剩一人或条件结束
  duration: -1,
  transitionCondition: {
    type: 'player_eliminated',
    count: 2, // 2人被淘汰后结束
  },
};

/**
 * 日常工作 - Normal Day
 * 普通的工作日，没有特殊效果
 */
const normalDayScenario: ScenarioDefinition = {
  id: 'normal_day',
  name: '日常工作',
  description: '平静的工作日，一切如常',
  icon: '☀️',
  ambientColor: '#87CEEB',

  // 无特殊效果
  duration: 3,
  transitionCondition: {
    type: 'turn_count',
    turns: 3,
  },
};

/**
 * 加班地狱 - Overtime Hell
 * 996工作制，高压环境
 */
const overtimeHellScenario: ScenarioDefinition = {
  id: 'overtime_hell',
  name: '加班地狱',
  description: '996福报降临，所有人都在疯狂加班',
  icon: '🔥',
  ambientColor: '#FF4757',

  // 全局效果
  globalStatModifiers: {
    health: -10,
    happiness: -15,
  },

  globalResourceModifiers: {
    energy: -2,
  },

  // 每回合效果
  perTurnEffects: [
    {
      type: 'modify_stat',
      target: 'self',
      metadata: { stat: 'health' },
      value: -2,
    },
    {
      type: 'modify_stat',
      target: 'self',
      metadata: { stat: 'performance' },
      value: 3, // 加班产出高
    },
  ],

  // 角色差异化
  characterModifiers: {
    programmer: {
      isAdvantage: false,
      description: '程序员加班最严重，健康损耗翻倍',
      perTurnStatChanges: {
        health: -3,
        performance: 5,
      },
    },
    tester: {
      isAdvantage: true,
      description: '测试工程师体力较好，能扛住加班',
      perTurnStatChanges: {
        health: 1, // 减少损耗
      },
    },
    manager: {
      isAdvantage: true,
      description: '技术总监可以早点下班',
      perTurnStatChanges: {
        health: 2,
        influence: 2,
      },
    },
  },

  // 禁用休息卡
  bannedCardTags: ['rest'],

  // 大幅增强工作卡
  enhancedCardTags: {
    work: 1.5,
  },

  duration: 4,
  transitionCondition: {
    type: 'turn_count',
    turns: 4,
  },
};

// ============================================================================
// 场景列表导出
// ============================================================================

/**
 * 所有场景定义
 */
export const scenarios: ScenarioDefinition[] = [
  normalDayScenario,
  sprintWeekScenario,
  yearEndReviewScenario,
  teamBuildingScenario,
  layoffStormScenario,
  overtimeHellScenario,
];

/**
 * 默认场景配置
 */
export const defaultScenarioConfig: ScenarioSystemConfig = {
  scenarios,
  initialScenarioId: 'normal_day',
  enableAutoTransition: true,
  transitionMode: 'sequential',
  sequentialScenarioIds: [
    'normal_day',
    'sprint_week',
    'team_building',
    'year_end_review',
    'overtime_hell',
    'layoff_storm', // 最终场景
  ],
  transitionInterval: 4, // 默认每4回合切换
};

/**
 * 竞争模式场景配置 (更激烈)
 */
export const competitiveScenarioConfig: ScenarioSystemConfig = {
  scenarios,
  initialScenarioId: 'sprint_week',
  enableAutoTransition: true,
  transitionMode: 'sequential',
  sequentialScenarioIds: ['sprint_week', 'year_end_review', 'overtime_hell', 'layoff_storm'],
  transitionInterval: 3, // 更快切换
};

/**
 * 休闲模式场景配置 (较轻松)
 */
export const casualScenarioConfig: ScenarioSystemConfig = {
  scenarios: [normalDayScenario, teamBuildingScenario, sprintWeekScenario],
  initialScenarioId: 'normal_day',
  enableAutoTransition: true,
  transitionMode: 'sequential',
  sequentialScenarioIds: ['normal_day', 'team_building', 'sprint_week'],
  transitionInterval: 5, // 较慢切换
};

// 导出单个场景供外部使用
export {
  normalDayScenario,
  sprintWeekScenario,
  yearEndReviewScenario,
  teamBuildingScenario,
  layoffStormScenario,
  overtimeHellScenario,
};
