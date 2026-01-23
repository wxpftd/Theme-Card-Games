/**
 * 社交系列卡牌
 * Social Series Cards - 人际关系与职场政治
 */

import type { CardDefinitionV2 } from './types';

export const socialCards: CardDefinitionV2[] = [
  // ==================== 日常社交 ====================
  {
    id: 'water_cooler_chat',
    type: 'action',
    name: '茶水间八卦',
    description: '在茶水间闲聊收集信息，消耗精力1，随机获知一名对手的策略',
    series: 'social',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 1 },
      {
        type: 'custom',
        target: 'self',
        metadata: { handler: 'reveal_opponent_hand', count: 1 },
        value: 0,
      },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'connections' }, value: 1 },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['social', 'information'],
    flavorText: '消息灵通是职场生存的第一要素。',
  },
  {
    id: 'lunch_networking',
    type: 'action',
    name: '午餐社交',
    description: '和同事一起吃午饭，人脉+2，幸福感+3',
    series: 'social',
    effects: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'connections' }, value: 2 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 3 },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['social', 'networking'],
    flavorText: '吃饭的时候聊出来的合作比会议室里多。',
  },

  // ==================== 职场政治 ====================
  {
    id: 'form_alliance',
    type: 'action',
    name: '拉帮结派',
    description: '消耗人脉3，选择一名玩家结盟3回合，期间互相不能攻击',
    series: 'social',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'connections' }, value: 3 },
      {
        type: 'custom',
        target: 'selected_opponent',
        metadata: { handler: 'form_alliance', duration: 3 },
        value: 3,
      },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['social', 'alliance', 'competitive'],
    flavorText: '敌人的敌人就是朋友。',
  },
  {
    id: 'lone_wolf',
    type: 'modifier',
    name: '独狼策略',
    description: '放弃所有社交加成，但绩效+5/回合（持续到被移除）',
    series: 'social',
    effects: [
      { type: 'remove_status', target: 'self', metadata: { statusTag: 'social_bonus' }, value: 0 },
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'lone_wolf_mode' },
        value: -1,
      },
    ],
    cost: 1,
    rarity: 'rare',
    tags: ['social', 'strategy'],
    flavorText: '不搞关系，只看实力。',
  },
  {
    id: 'office_romance',
    type: 'event',
    name: '办公室恋情',
    description: '和同事发展出暧昧关系，幸福感+20，但被发现时双方绩效-15',
    series: 'social',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 20 },
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'office_romance_risk' },
        value: -1,
      },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['social', 'risk', 'relationship'],
    flavorText: '工作中的浪漫，小心处理。',
  },
  {
    id: 'pick_sides',
    type: 'action',
    name: '站队选择',
    description: '选择支持某位领导的派系，掷骰：1-3失败（影响力清零），4-6成功（影响力×2）',
    series: 'social',
    effects: [
      {
        type: 'roll_dice',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd6', count: 1 },
          resultMappings: [
            {
              range: [1, 3],
              description: '站错队了！被边缘化',
              effects: [
                {
                  type: 'custom',
                  target: 'self',
                  metadata: { handler: 'set_stat', stat: 'influence', value: 0 },
                  value: 0,
                },
              ],
            },
            {
              range: [4, 6],
              description: '站对了！跟对了人',
              effects: [
                {
                  type: 'custom',
                  target: 'self',
                  metadata: { handler: 'multiply_stat', stat: 'influence', multiplier: 2 },
                  value: 0,
                },
              ],
            },
          ],
        },
      },
    ],
    cost: 2,
    rarity: 'rare',
    tags: ['social', 'politics', 'high_risk', 'dice'],
    flavorText: '职场如战场，站队是门学问。',
  },

  // ==================== 特殊社交 ====================
  {
    id: 'whistleblower',
    type: 'action',
    name: '匿名举报',
    description: '揭露一名高绩效玩家的问题，其绩效-20，但你获得「风险」状态',
    series: 'social',
    effects: [
      {
        type: 'damage_stat',
        target: 'strongest_opponent',
        metadata: { stat: 'performance' },
        value: 20,
      },
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'whistleblower_risk' },
        value: 5,
      },
    ],
    cost: 2,
    rarity: 'rare',
    tags: ['social', 'attack', 'risk'],
    flavorText: '正义还是报复？只有你自己知道。',
  },
  {
    id: 'team_scapegoat',
    type: 'event',
    name: '团队背锅',
    description: '团队犯错需要有人承担，所有人绩效-5，但团队凝聚力提升：人脉+2',
    series: 'social',
    effects: [
      { type: 'modify_stat', target: 'all_players', metadata: { stat: 'performance' }, value: -5 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'connections' }, value: 2 },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['social', 'team', 'mixed'],
    flavorText: '有难同当，团队精神的体现。',
  },
  {
    id: 'mentor_appears',
    type: 'event',
    name: '贵人相助',
    description: '获得一位资深导师的青睐，接下来5回合技能点+2/回合',
    series: 'social',
    effects: [
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'mentor_guidance' },
        value: 5,
      },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 10 },
    ],
    cost: 0,
    rarity: 'rare',
    tags: ['social', 'mentor', 'positive'],
    flavorText: '千里马常有，伯乐不常有。',
  },

  // ==================== 社交技能 ====================
  {
    id: 'diplomatic_skill',
    type: 'action',
    name: '圆滑处世',
    description: '用高情商化解冲突，移除一个负面社交状态，影响力+5',
    series: 'social',
    effects: [
      {
        type: 'remove_status',
        target: 'self',
        metadata: { statusTag: 'social_negative' },
        value: 1,
      },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 5 },
    ],
    cost: 1,
    rarity: 'uncommon',
    tags: ['social', 'skill'],
    flavorText: '见人说人话，见鬼说鬼话。',
  },
  {
    id: 'public_praise',
    type: 'action',
    name: '公开表扬',
    description: '在公开场合表扬同事，消耗精力1，人脉+3，对方绩效+5',
    series: 'social',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 1 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'connections' }, value: 3 },
      {
        type: 'custom',
        target: 'selected_opponent',
        metadata: { handler: 'boost_ally', stat: 'performance', value: 5 },
        value: 5,
      },
    ],
    cost: 1,
    rarity: 'uncommon',
    tags: ['social', 'positive', 'team'],
    flavorText: '成就他人也是成就自己。',
  },
  {
    id: 'build_reputation',
    type: 'modifier',
    name: '口碑建设',
    description: '持续经营职场口碑，每回合影响力+1，但需要每回合消耗1人脉',
    series: 'social',
    effects: [
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'reputation_building' },
        value: -1,
      },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['social', 'long_term'],
    flavorText: '口碑是最好的广告。',
  },
];

export default socialCards;
