import { CardDefinition } from '@theme-card-games/core';

/**
 * 竞争模式专属卡牌
 * 这些卡牌只在竞争模式下生效，包含针对对手的互动效果
 */
export const competitiveCards: CardDefinition[] = [
  // ==================== 甩锅类卡牌 ====================
  {
    id: 'blame_shifting',
    type: 'action',
    name: '甩锅',
    description: '把你的 bug 转移给对手，将你 10 点绩效损失转移给目标对手',
    effects: [
      {
        type: 'transfer_stat',
        target: 'selected_opponent',
        value: 10,
        metadata: { stat: 'performance', direction: 'to_target' },
      },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['competitive', 'attack', 'blame'],
  },
  {
    id: 'blame_chain',
    type: 'action',
    name: '连环甩锅',
    description: '一口气把锅甩给所有对手！所有对手绩效 -5',
    effects: [
      {
        type: 'damage_stat',
        target: 'all_opponents',
        value: 5,
        metadata: { stat: 'performance' },
      },
    ],
    cost: 3,
    rarity: 'rare',
    tags: ['competitive', 'attack', 'blame'],
  },
  {
    id: 'subtle_blame',
    type: 'action',
    name: '暗中甩锅',
    description: '不动声色地把问题推给绩效最高的对手，目标绩效 -8',
    effects: [
      {
        type: 'damage_stat',
        target: 'strongest_opponent',
        value: 8,
        metadata: { stat: 'performance' },
      },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['competitive', 'attack', 'blame'],
  },

  // ==================== 抢功类卡牌 ====================
  {
    id: 'credit_stealing',
    type: 'action',
    name: '抢功',
    description: '抢夺对手的工作成果，从目标偷取 8 点绩效',
    effects: [
      {
        type: 'transfer_stat',
        target: 'selected_opponent',
        value: 8,
        metadata: { stat: 'performance', direction: 'from_target' },
      },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['competitive', 'attack', 'steal'],
  },
  {
    id: 'idea_theft',
    type: 'action',
    name: '偷创意',
    description: '偷取对手的创意，从绩效最高的对手偷取 5 点影响力',
    effects: [
      {
        type: 'transfer_stat',
        target: 'strongest_opponent',
        value: 5,
        metadata: { stat: 'influence', direction: 'from_target' },
      },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['competitive', 'attack', 'steal'],
  },

  // ==================== 资源抢夺类卡牌 ====================
  {
    id: 'poach_contact',
    type: 'action',
    name: '挖墙脚',
    description: '挖走对手的人脉资源，从目标偷取 2 人脉',
    effects: [
      {
        type: 'steal_resource',
        target: 'selected_opponent',
        value: 2,
        metadata: { resource: 'connections' },
      },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['competitive', 'attack', 'steal'],
  },
  {
    id: 'budget_grab',
    type: 'action',
    name: '抢预算',
    description: '在预算分配中争取更多资源，从目标偷取 1 薪资',
    effects: [
      {
        type: 'steal_resource',
        target: 'selected_opponent',
        value: 1,
        metadata: { resource: 'money' },
      },
    ],
    cost: 3,
    rarity: 'rare',
    tags: ['competitive', 'attack', 'steal'],
  },

  // ==================== 负面状态类卡牌 ====================
  {
    id: 'gossip',
    type: 'action',
    name: '背后说坏话',
    description: '在领导面前说对手坏话，降低目标 8 点影响力',
    effects: [
      {
        type: 'damage_stat',
        target: 'selected_opponent',
        value: 8,
        metadata: { stat: 'influence' },
      },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['competitive', 'attack', 'social'],
  },
  {
    id: 'workload_dump',
    type: 'action',
    name: '工作量转嫁',
    description: '把多余的工作甩给对手，目标健康 -10',
    effects: [
      {
        type: 'damage_stat',
        target: 'selected_opponent',
        value: 10,
        metadata: { stat: 'health' },
      },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['competitive', 'attack'],
  },
  {
    id: 'morale_attack',
    type: 'action',
    name: '打击士气',
    description: '用负面言论打击对手，目标幸福感 -12',
    effects: [
      {
        type: 'damage_stat',
        target: 'selected_opponent',
        value: 12,
        metadata: { stat: 'happiness' },
      },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['competitive', 'attack', 'social'],
  },

  // ==================== 共享资源抢夺类卡牌 ====================
  {
    id: 'claim_promotion',
    type: 'action',
    name: '争取晋升名额',
    description: '尝试抢夺仅有的晋升名额',
    effects: [
      {
        type: 'claim_shared',
        target: 'game',
        metadata: { resourceId: 'promotion_slots', ruleIndex: 0 },
      },
    ],
    cost: 3,
    rarity: 'rare',
    tags: ['competitive', 'shared_resource'],
  },
  {
    id: 'grab_project',
    type: 'action',
    name: '抢项目机会',
    description: '争取有限的优质项目机会',
    effects: [
      {
        type: 'claim_shared',
        target: 'game',
        metadata: { resourceId: 'project_opportunities', ruleIndex: 0 },
      },
      {
        type: 'modify_stat',
        target: 'self',
        value: 5,
        metadata: { stat: 'performance' },
      },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['competitive', 'shared_resource', 'work'],
  },

  // ==================== 防御类卡牌 ====================
  {
    id: 'firewall',
    type: 'action',
    name: '工作防火墙',
    description: '建立工作边界，下 2 回合免疫甩锅效果，并恢复 5 点健康',
    effects: [
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'blame_immunity', duration: 2 },
      },
      {
        type: 'modify_stat',
        target: 'self',
        value: 5,
        metadata: { stat: 'health' },
      },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['competitive', 'defense'],
  },
  {
    id: 'documentation',
    type: 'action',
    name: '留痕存档',
    description: '做好工作记录，防止被抢功。绩效 +5，影响力 +3',
    effects: [
      {
        type: 'modify_stat',
        target: 'self',
        value: 5,
        metadata: { stat: 'performance' },
      },
      {
        type: 'modify_stat',
        target: 'self',
        value: 3,
        metadata: { stat: 'influence' },
      },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['competitive', 'defense', 'work'],
  },

  // ==================== 反击类卡牌 ====================
  {
    id: 'counter_blame',
    type: 'action',
    name: '反甩锅',
    description: '把锅甩回去！对刚攻击你的对手造成 15 点绩效伤害',
    effects: [
      {
        type: 'damage_stat',
        target: 'opponent', // 最近攻击者，简化处理
        value: 15,
        metadata: { stat: 'performance' },
      },
    ],
    cost: 2,
    rarity: 'rare',
    tags: ['competitive', 'counter'],
  },

  // ==================== 高风险高收益卡牌 ====================
  {
    id: 'all_in_presentation',
    type: 'action',
    name: '孤注一掷汇报',
    description: '冒险在大会上汇报。50%概率绩效 +20、影响力 +10；50%概率绩效 -15',
    effects: [
      {
        type: 'custom',
        target: 'self',
        metadata: {
          handler: 'random_stat_gamble',
          stat: 'performance',
          successValue: 20,
          failValue: -15,
          failChance: 0.5,
          bonusStat: 'influence',
          bonusValue: 10,
        },
      },
    ],
    cost: 2,
    rarity: 'rare',
    tags: ['competitive', 'high_risk'],
  },
];

/**
 * 获取竞争卡牌 ID 列表
 */
export const competitiveCardIds = competitiveCards.map((card) => card.id);

export default competitiveCards;
