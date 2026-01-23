/**
 * 成长系列卡牌
 * Growth Series Cards - 个人能力提升
 */

import type { CardDefinitionV2 } from './types';

export const growthCards: CardDefinitionV2[] = [
  // ==================== 技能学习 ====================
  {
    id: 'cross_learning',
    type: 'action',
    name: '跨界学习',
    description: '学习非本专业的技能，消耗精力2和薪资2，获得新技能标签，技能点+3',
    series: 'growth',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 2 },
      { type: 'lose_resource', target: 'self', metadata: { resource: 'money' }, value: 2 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 3 },
      {
        type: 'custom',
        target: 'self',
        metadata: { handler: 'add_skill_tag', tag: 'cross_domain' },
        value: 0,
      },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['growth', 'learning'],
    flavorText: 'T型人才是未来。',
  },
  {
    id: 'deep_dive',
    type: 'modifier',
    name: '技术深耕',
    description: '专注于技术深度，每使用3张「技术」卡，技能点+5',
    series: 'growth',
    effects: [
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'tech_deep_dive' },
        value: -1,
      },
    ],
    cost: 1,
    rarity: 'uncommon',
    tags: ['growth', 'tech', 'permanent'],
    flavorText: '一万小时定律，专注才能精通。',
  },
  {
    id: 'bootcamp',
    type: 'action',
    name: '训练营',
    description: '参加高强度技术训练营，消耗精力3和薪资3，技能点+10',
    series: 'growth',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 3 },
      { type: 'lose_resource', target: 'self', metadata: { resource: 'money' }, value: 3 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 10 },
    ],
    cost: 2,
    rarity: 'rare',
    tags: ['growth', 'intensive'],
    flavorText: '短期高强度，快速提升。',
  },

  // ==================== 职业发展 ====================
  {
    id: 'overseas_opportunity',
    type: 'event',
    name: '出海机会',
    description: '公司提供海外工作机会，可选择外派：薪资×1.5，但幸福感-10',
    series: 'growth',
    effects: [
      {
        type: 'custom',
        target: 'self',
        metadata: {
          handler: 'optional_choice',
          choiceId: 'overseas_transfer',
          acceptEffects: [
            {
              type: 'custom',
              target: 'self',
              metadata: { handler: 'multiply_resource', resource: 'money', multiplier: 1.5 },
              value: 0,
            },
            { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -10 },
            { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 5 },
          ],
          declineEffects: [],
        },
        value: 0,
      },
    ],
    cost: 0,
    rarity: 'rare',
    tags: ['growth', 'career', 'choice'],
    flavorText: '诗和远方，还是稳定的生活？',
  },
  {
    id: 'management_track',
    type: 'action',
    name: '管理转型',
    description: '当影响力≥60时可用，转向管理路线，改变胜利条件为「团队绩效」',
    series: 'growth',
    effects: [
      {
        type: 'custom',
        target: 'self',
        metadata: {
          handler: 'unlock_management_track',
          requirement: { stat: 'influence', operator: '>=', value: 60 },
        },
        value: 0,
      },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 10 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'connections' }, value: 3 },
    ],
    cost: 3,
    rarity: 'rare',
    tags: ['growth', 'career', 'management'],
    flavorText: '从做事到带人，不同的挑战。',
  },
  {
    id: 'rotation_experience',
    type: 'event',
    name: '轮岗体验',
    description: '参与公司轮岗计划，重置绩效为50，但获得2个新技能标签',
    series: 'growth',
    effects: [
      {
        type: 'custom',
        target: 'self',
        metadata: { handler: 'set_stat', stat: 'performance', value: 50 },
        value: 0,
      },
      {
        type: 'custom',
        target: 'self',
        metadata: { handler: 'add_skill_tag', tag: 'rotation_exp', count: 2 },
        value: 0,
      },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 5 },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['growth', 'career'],
    flavorText: '换个视角看问题。',
  },

  // ==================== 公开表现 ====================
  {
    id: 'public_speaking',
    type: 'action',
    name: '公开演讲',
    description: '在公司大会上做技术分享，消耗精力2，影响力+10，30%几率社死（幸福感-15）',
    series: 'growth',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 2 },
      {
        type: 'roll_dice',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd10', count: 1 },
          resultMappings: [
            {
              range: [1, 3],
              description: '演讲出了岔子，场面尴尬',
              effects: [
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'happiness' },
                  value: -15,
                },
                { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 5 },
              ],
            },
            {
              range: [4, 10],
              description: '演讲顺利，获得认可',
              effects: [
                { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 10 },
                { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 5 },
              ],
            },
          ],
        },
      },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['growth', 'social', 'risk', 'dice'],
    flavorText: '克服恐惧，展示自己。',
  },
  {
    id: 'publish_paper',
    type: 'action',
    name: '发表论文',
    description: '在技术期刊发表论文，消耗技能点10，影响力+20，获得「学术光环」状态',
    series: 'growth',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'skills' }, value: 10 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 20 },
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'academic_halo' },
        value: -1,
      },
    ],
    cost: 3,
    rarity: 'rare',
    tags: ['growth', 'academic', 'prestige'],
    flavorText: '学术成就，行业认可。',
  },
  {
    id: 'internal_sharing',
    type: 'action',
    name: '内部分享',
    description: '做一次团队内部技术分享，消耗精力1，影响力+3，技能点+1',
    series: 'growth',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 1 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 3 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 1 },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['growth', 'team'],
    flavorText: '教是最好的学。',
  },

  // ==================== 自我提升 ====================
  {
    id: 'read_technical_book',
    type: 'action',
    name: '阅读技术书',
    description: '系统学习技术知识，消耗精力1，技能点+4',
    series: 'growth',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 1 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 4 },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['growth', 'learning'],
    flavorText: '书中自有黄金屋。',
  },
  {
    id: 'open_source_contribution',
    type: 'action',
    name: '开源贡献',
    description: '为开源项目贡献代码，技能点+3，影响力+5，人脉+2',
    series: 'growth',
    effects: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 3 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 5 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'connections' }, value: 2 },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['growth', 'tech', 'social'],
    flavorText: '回馈社区，成就自己。',
  },
  {
    id: 'hackathon',
    type: 'action',
    name: '黑客马拉松',
    description: '参加公司黑客松，消耗精力4，技能点+6，影响力+8，健康-5',
    series: 'growth',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 4 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 6 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 8 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -5 },
    ],
    cost: 1,
    rarity: 'uncommon',
    tags: ['growth', 'tech', 'intensive'],
    flavorText: '48小时的创意风暴。',
  },
  {
    id: 'leadership_training',
    type: 'action',
    name: '领导力培训',
    description: '参加公司领导力培训项目，消耗精力2，影响力+8，人脉+3',
    series: 'growth',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 2 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 8 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'connections' }, value: 3 },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['growth', 'management', 'social'],
    flavorText: '领导力是可以培养的。',
  },
];

export default growthCards;
