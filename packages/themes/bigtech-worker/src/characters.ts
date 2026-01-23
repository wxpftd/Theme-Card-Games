/**
 * 大厂打工人主题 - 角色定义
 * Character definitions for bigtech-worker theme
 *
 * 采用混合设计：职位 × 性格
 * 角色 = 职位基础 + 性格修正
 */

import {
  CharacterDefinition,
  ProfessionDefinition,
  PersonalityDefinition,
  PassiveAbility,
  ActiveAbility,
} from '@theme-card-games/core';

// ============================================================================
// 职位定义 (Profession Definitions)
// ============================================================================

/**
 * 产品经理 - 擅长沟通和影响力
 */
const productManagerProfession: ProfessionDefinition = {
  id: 'product_manager',
  name: '产品经理',
  description: '擅长需求管理和跨部门沟通',
  icon: '📋',
  statModifiers: {
    performance: 10,
    influence: 5,
    health: 0,
    happiness: 0,
  },
  resourceModifiers: {
    money: 0,
    energy: 0,
    connections: 2,
    skills: 0,
  },
  passiveAbility: {
    id: 'requirement_shield',
    name: '需求护盾',
    description: '需求变更时绩效不减少',
    icon: '🛡️',
    trigger: 'stat_changed',
    effects: [],
    triggerData: {
      statId: 'performance',
      changeDirection: 'decrease',
    },
  },
  activeAbility: {
    id: 'blame_shift',
    name: '甩锅术',
    description: '将一个负面状态转移给对手',
    icon: '🎯',
    maxUsesPerGame: 2,
    cooldown: 3,
    effects: [
      {
        type: 'transfer_stat',
        target: 'selected_opponent',
        metadata: { stat: 'performance', amount: -10 },
        value: -10,
      },
    ],
    needsTarget: true,
  },
  exclusiveCardIds: ['pm_requirement_doc', 'pm_roadmap'],
};

/**
 * 程序员 - 技术能力强
 */
const programmerProfession: ProfessionDefinition = {
  id: 'programmer',
  name: '程序员',
  description: '技术大牛，代码就是生命',
  icon: '💻',
  statModifiers: {
    performance: 0,
    influence: 0,
    health: -10,
    happiness: 0,
  },
  resourceModifiers: {
    money: 0,
    energy: 0,
    connections: 0,
    skills: 3,
  },
  passiveAbility: {
    id: 'code_master',
    name: '代码大师',
    description: '技术卡效果+30%',
    icon: '⚙️',
    trigger: 'card_played',
    effects: [],
    triggerData: {
      cardTags: ['work', 'growth'],
      effectMultiplier: 1.3,
    },
  },
  activeAbility: {
    id: 'refactor',
    name: '代码重构',
    description: '清除所有负面状态',
    icon: '🔧',
    maxUsesPerGame: 2,
    cooldown: 4,
    effects: [{ type: 'remove_status', target: 'self', value: 'all_negative' }],
  },
  exclusiveCardIds: ['dev_hotfix', 'dev_code_sprint'],
};

/**
 * 设计师 - 追求美感和创意
 */
const designerProfession: ProfessionDefinition = {
  id: 'designer',
  name: '设计师',
  description: '追求极致的视觉体验',
  icon: '🎨',
  statModifiers: {
    performance: 0,
    influence: 0,
    health: 0,
    happiness: 10,
  },
  resourceModifiers: {
    money: 0,
    energy: 0,
    connections: 2,
    skills: 0,
  },
  passiveAbility: {
    id: 'creative_slacking',
    name: '创意摸鱼',
    description: '摸鱼不扣绩效',
    icon: '✨',
    trigger: 'card_played',
    effects: [
      {
        type: 'modify_stat',
        target: 'self',
        metadata: { stat: 'performance' },
        value: 3,
      },
    ],
    triggerData: {
      cardTags: ['rest'],
    },
  },
  activeAbility: {
    id: 'inspiration_burst',
    name: '灵感爆发',
    description: '下回合卡牌效果翻倍',
    icon: '💡',
    maxUsesPerGame: 2,
    cooldown: 4,
    effects: [{ type: 'apply_status', target: 'self', value: 'inspiration_mode' }],
  },
  exclusiveCardIds: ['design_review', 'design_system'],
};

/**
 * 运营 - 人脉广泛
 */
const operationsProfession: ProfessionDefinition = {
  id: 'operations',
  name: '运营',
  description: '用户增长专家，数据驱动',
  icon: '📊',
  statModifiers: {
    performance: 0,
    influence: 5,
    health: 0,
    happiness: 0,
  },
  resourceModifiers: {
    money: 0,
    energy: 0,
    connections: 5,
    skills: 0,
  },
  passiveAbility: {
    id: 'network_effect',
    name: '人脉网络',
    description: '社交卡抽额外1张牌',
    icon: '🌐',
    trigger: 'card_played',
    effects: [{ type: 'draw_cards', target: 'self', value: 1 }],
    triggerData: {
      cardTags: ['social'],
    },
  },
  activeAbility: {
    id: 'viral_marketing',
    name: '病毒营销',
    description: '全体玩家获得或失去2人脉',
    icon: '📢',
    maxUsesPerGame: 2,
    cooldown: 3,
    effects: [
      {
        type: 'gain_resource',
        target: 'all_players',
        metadata: { resource: 'connections' },
        value: 2,
      },
    ],
  },
  exclusiveCardIds: ['ops_campaign', 'ops_user_growth'],
};

/**
 * 测试 - 稳定可靠
 */
const testerProfession: ProfessionDefinition = {
  id: 'tester',
  name: '测试工程师',
  description: '质量守护者，bug终结者',
  icon: '🔍',
  statModifiers: {
    performance: 0,
    influence: 0,
    health: 10,
    happiness: 0,
  },
  resourceModifiers: {
    money: 0,
    energy: 2,
    connections: 0,
    skills: 0,
  },
  passiveAbility: {
    id: 'damage_reduction',
    name: '防御专家',
    description: '受到攻击时减免30%伤害',
    icon: '🛡️',
    trigger: 'attack_received',
    effects: [],
    triggerData: {
      effectMultiplier: 0.7,
    },
  },
  activeAbility: {
    id: 'bug_report',
    name: 'Bug报告',
    description: '揭示对手一张手牌',
    icon: '🐛',
    maxUsesPerGame: 3,
    cooldown: 2,
    effects: [
      {
        type: 'custom',
        target: 'selected_opponent',
        metadata: { handler: 'reveal_card' },
        value: 1,
      },
    ],
    needsTarget: true,
  },
  exclusiveCardIds: ['qa_automation', 'qa_stress_test'],
};

/**
 * 老板/管理层 - 权力大但压力也大
 */
const managerProfession: ProfessionDefinition = {
  id: 'manager',
  name: '技术总监',
  description: '技术团队的领导者',
  icon: '👔',
  statModifiers: {
    performance: 0,
    influence: 20,
    health: -20,
    happiness: 0,
  },
  resourceModifiers: {
    money: 3,
    energy: 0,
    connections: 3,
    skills: 0,
  },
  passiveAbility: {
    id: 'pressure_aura',
    name: '压力光环',
    description: '每回合对手绩效-2',
    icon: '⚡',
    trigger: 'turn_start',
    effects: [
      {
        type: 'damage_stat',
        target: 'all_opponents',
        metadata: { stat: 'performance' },
        value: 2,
      },
    ],
  },
  activeAbility: {
    id: 'layoff',
    name: '裁员决策',
    description: '淘汰绩效最低的玩家（需绩效差距>20）',
    icon: '✂️',
    maxUsesPerGame: 1,
    cooldown: 0,
    cost: { connections: 5 },
    effects: [
      {
        type: 'custom',
        target: 'weakest_opponent',
        metadata: { handler: 'eliminate_if_gap', gapRequired: 20 },
        value: 1,
      },
    ],
  },
  exclusiveCardIds: ['mgr_team_meeting', 'mgr_okr_review'],
};

// ============================================================================
// 性格定义 (Personality Definitions)
// ============================================================================

/**
 * 激进型
 */
const aggressivePersonality: PersonalityDefinition = {
  id: 'aggressive',
  name: '激进型',
  description: '进攻就是最好的防守',
  statModifiers: {
    performance: 5,
    health: -5,
    happiness: 0,
    influence: 0,
  },
  passiveAbility: {
    id: 'aggressive_bonus',
    name: '攻击加成',
    description: '攻击效果+20%',
    icon: '⚔️',
    trigger: 'attack_initiated',
    effects: [],
    triggerData: {
      effectMultiplier: 1.2,
    },
  },
};

/**
 * 保守型
 */
const conservativePersonality: PersonalityDefinition = {
  id: 'conservative',
  name: '保守型',
  description: '稳扎稳打，步步为营',
  statModifiers: {
    performance: -5,
    health: 5,
    happiness: 0,
    influence: 0,
  },
  passiveAbility: {
    id: 'defensive_bonus',
    name: '防御加成',
    description: '防御效果+20%',
    icon: '🛡️',
    trigger: 'attack_received',
    effects: [],
    triggerData: {
      effectMultiplier: 0.8,
    },
  },
};

/**
 * 社交型
 */
const socialPersonality: PersonalityDefinition = {
  id: 'social',
  name: '社交型',
  description: '人脉就是生产力',
  statModifiers: {
    performance: 0,
    health: 0,
    happiness: 0,
    influence: 0,
  },
  passiveAbility: {
    id: 'social_master',
    name: '社交达人',
    description: '社交卡每回合多用1张',
    icon: '🤝',
    trigger: 'turn_start',
    effects: [
      {
        type: 'gain_resource',
        target: 'self',
        metadata: { resource: 'connections' },
        value: 1,
      },
    ],
  },
};

/**
 * 专注型
 */
const focusedPersonality: PersonalityDefinition = {
  id: 'focused',
  name: '专注型',
  description: '心无旁骛，技术为先',
  statModifiers: {
    performance: 0,
    health: 0,
    happiness: 0,
    influence: 0,
  },
  passiveAbility: {
    id: 'work_focus',
    name: '工作专注',
    description: '工作卡效果+15%',
    icon: '🎯',
    trigger: 'card_played',
    effects: [],
    triggerData: {
      cardTags: ['work'],
      effectMultiplier: 1.15,
    },
  },
};

// ============================================================================
// 组合角色生成器
// ============================================================================

/**
 * 根据职位和性格生成组合角色
 */
function generateCombinedCharacter(
  profession: ProfessionDefinition,
  personality: PersonalityDefinition
): CharacterDefinition {
  const id = `${profession.id}_${personality.id}`;
  const name = `${personality.name}${profession.name}`;

  // 合并属性修正
  const statModifiers: Record<string, number> = {};
  for (const key of Object.keys(profession.statModifiers)) {
    statModifiers[key] =
      (profession.statModifiers[key] ?? 0) + (personality.statModifiers[key] ?? 0);
  }

  // 合并资源修正
  const resourceModifiers = { ...profession.resourceModifiers };

  // 合并被动技能
  const passiveAbilities: PassiveAbility[] = [
    profession.passiveAbility,
    personality.passiveAbility,
  ];

  return {
    id,
    name,
    description: `${profession.description}。${personality.passiveAbility.description}`,
    icon: profession.icon,
    rarity: 'common',
    profession: profession.id,
    personality: personality.id,
    statModifiers,
    resourceModifiers,
    exclusiveCardIds: profession.exclusiveCardIds,
    startingCardIds: [],
    passiveAbilities,
    activeAbility: profession.activeAbility,
  };
}

// ============================================================================
// 预定义角色列表
// ============================================================================

/**
 * 所有职位
 */
export const professions: ProfessionDefinition[] = [
  productManagerProfession,
  programmerProfession,
  designerProfession,
  operationsProfession,
  testerProfession,
  managerProfession,
];

/**
 * 所有性格
 */
export const personalities: PersonalityDefinition[] = [
  aggressivePersonality,
  conservativePersonality,
  socialPersonality,
  focusedPersonality,
];

/**
 * 生成所有组合角色
 */
export function generateAllCharacters(): CharacterDefinition[] {
  const characters: CharacterDefinition[] = [];

  for (const profession of professions) {
    for (const personality of personalities) {
      characters.push(generateCombinedCharacter(profession, personality));
    }
  }

  return characters;
}

/**
 * 默认角色列表（推荐的 6 个组合）
 */
export const defaultCharacters: CharacterDefinition[] = [
  // 激进的程序员 - 技术强但更脆弱
  generateCombinedCharacter(programmerProfession, aggressivePersonality),
  // 保守的产品经理 - 生存能力强
  generateCombinedCharacter(productManagerProfession, conservativePersonality),
  // 社交型运营 - 人脉大师
  generateCombinedCharacter(operationsProfession, socialPersonality),
  // 专注型设计师 - 创意与效率
  generateCombinedCharacter(designerProfession, focusedPersonality),
  // 保守的测试 - 铜墙铁壁
  generateCombinedCharacter(testerProfession, conservativePersonality),
  // 激进的技术总监 - 高风险高回报
  generateCombinedCharacter(managerProfession, aggressivePersonality),
];

/**
 * 所有角色定义（完整的 24 个组合）
 */
export const allCharacterDefinitions: CharacterDefinition[] = generateAllCharacters();

// 导出单个职位和性格供外部使用
export {
  productManagerProfession,
  programmerProfession,
  designerProfession,
  operationsProfession,
  testerProfession,
  managerProfession,
  aggressivePersonality,
  conservativePersonality,
  socialPersonality,
  focusedPersonality,
};
