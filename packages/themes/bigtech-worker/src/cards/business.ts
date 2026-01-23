/**
 * 营商系列卡牌
 * Business Series Cards - 商业机会与投资理财
 */

import type { CardDefinitionV2 } from './types';

export const businessCards: CardDefinitionV2[] = [
  // ==================== 副业 ====================
  {
    id: 'side_hustle_start',
    type: 'action',
    name: '副业启动',
    description: '开始经营副业，消耗技能点3，每回合额外获得薪资+1（永久）',
    series: 'business',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'skills' }, value: 3 },
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'side_hustle_income' },
        value: -1,
      },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['business', 'passive_income'],
    flavorText: '不要把所有鸡蛋放在一个篮子里。',
  },
  {
    id: 'freelance_gig',
    type: 'action',
    name: '接私活',
    description: '利用专业技能接外包项目，消耗精力3，薪资+3，但绩效-5（分心）',
    series: 'business',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 3 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'money' }, value: 3 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -5 },
    ],
    cost: 1,
    rarity: 'uncommon',
    tags: ['business', 'work', 'risk'],
    flavorText: '左手领工资，右手接私活，时间不够用啊。',
  },

  // ==================== 投资 ====================
  {
    id: 'angel_investment',
    type: 'action',
    name: '天使投资',
    description: '投资朋友的创业项目，消耗薪资10。掷骰：1-2全损，3-4回本，5-6翻倍',
    series: 'business',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'money' }, value: 10 },
      {
        type: 'roll_dice',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd6', count: 1 },
          resultMappings: [
            {
              range: [1, 2],
              description: '项目失败，血本无归',
              effects: [],
            },
            {
              range: [3, 4],
              description: '项目平稳，收回本金',
              effects: [
                {
                  type: 'gain_resource',
                  target: 'self',
                  metadata: { resource: 'money' },
                  value: 10,
                },
              ],
            },
            {
              range: [5, 6],
              description: '项目成功，投资翻倍！',
              effects: [
                {
                  type: 'gain_resource',
                  target: 'self',
                  metadata: { resource: 'money' },
                  value: 20,
                },
                { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 10 },
              ],
            },
          ],
        },
      },
    ],
    cost: 0,
    rarity: 'rare',
    tags: ['business', 'investment', 'high_risk', 'dice'],
    flavorText: '高风险高回报，投资需谨慎。',
  },
  {
    id: 'stock_dip',
    type: 'resource',
    name: '股票定投',
    description: '每回合消耗薪资1，5回合后返还薪资8',
    series: 'business',
    effects: [
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'stock_dip_active', duration: 5, returnAmount: 8 },
        value: 5,
      },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['business', 'investment', 'stable'],
    flavorText: '时间是最好的朋友，复利是第八大奇迹。',
  },
  {
    id: 'crypto_gamble',
    type: 'event',
    name: '币圈一日游',
    description: '消耗薪资5进入币圈。掷2d6：2-5亏损80%，6-9持平，10-12赚3倍',
    series: 'business',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'money' }, value: 5 },
      {
        type: 'roll_dice',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd6', count: 2 },
          resultMappings: [
            {
              range: [2, 5],
              description: '币价暴跌，血亏！',
              effects: [
                {
                  type: 'gain_resource',
                  target: 'self',
                  metadata: { resource: 'money' },
                  value: 1,
                },
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'happiness' },
                  value: -10,
                },
              ],
            },
            {
              range: [6, 9],
              description: '横盘震荡，保本出局',
              effects: [
                {
                  type: 'gain_resource',
                  target: 'self',
                  metadata: { resource: 'money' },
                  value: 5,
                },
              ],
            },
            {
              range: [10, 12],
              description: '牛市来了，大赚特赚！',
              effects: [
                {
                  type: 'gain_resource',
                  target: 'self',
                  metadata: { resource: 'money' },
                  value: 15,
                },
                { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 15 },
              ],
            },
          ],
        },
      },
    ],
    cost: 0,
    rarity: 'rare',
    tags: ['business', 'investment', 'high_risk', 'dice'],
    flavorText: '币圈一天，人间一年。',
  },

  // ==================== 理财 ====================
  {
    id: 'financial_crash',
    type: 'event',
    name: '理财暴雷',
    description: '理财产品出问题，失去一半薪资，幸福感-20',
    series: 'business',
    effects: [
      {
        type: 'custom',
        target: 'self',
        metadata: { handler: 'multiply_resource', resource: 'money', multiplier: 0.5 },
        value: 0.5,
      },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -20 },
    ],
    cost: 0,
    rarity: 'rare',
    tags: ['business', 'investment', 'negative'],
    flavorText: '承诺的收益呢？本金呢？',
  },
  {
    id: 'knowledge_payment',
    type: 'action',
    name: '知识付费',
    description: '购买专业课程，消耗薪资2，技能点+5',
    series: 'business',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'money' }, value: 2 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 5 },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['business', 'growth', 'investment'],
    flavorText: '投资自己永远是最好的投资。',
  },

  // ==================== 创业 ====================
  {
    id: 'startup_dream',
    type: 'event',
    name: '创业念头',
    description: '脑海中冒出创业想法！若选择创业：清空绩效和影响力，薪资×3',
    series: 'business',
    effects: [
      {
        type: 'custom',
        target: 'self',
        metadata: {
          handler: 'startup_mode',
          clearStats: ['performance', 'influence'],
          moneyMultiplier: 3,
        },
        value: 0,
      },
    ],
    cost: 0,
    rarity: 'legendary',
    tags: ['business', 'startup', 'life_changing'],
    flavorText: '打工是不可能打工的，这辈子不可能打工的。',
  },
  {
    id: 'partnership_offer',
    type: 'event',
    name: '合伙邀请',
    description: '朋友邀请你合伙创业，消耗人脉5，开启被动收入：每回合薪资+2',
    series: 'business',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'connections' }, value: 5 },
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'partnership_income' },
        value: -1,
      },
    ],
    cost: 2,
    rarity: 'rare',
    tags: ['business', 'startup', 'passive_income'],
    flavorText: '找对合伙人，事半功倍。',
  },

  // ==================== 收入提升 ====================
  {
    id: 'salary_negotiation',
    type: 'action',
    name: '薪资谈判',
    description: '与HR谈判加薪，消耗精力2。若绩效≥70则薪资+3，否则关系变差：影响力-5',
    series: 'business',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 2 },
      {
        type: 'custom',
        target: 'self',
        metadata: {
          handler: 'conditional_effect',
          condition: { type: 'stat_threshold', stat: 'performance', operator: '>=', value: 70 },
          successEffects: [
            { type: 'gain_resource', target: 'self', metadata: { resource: 'money' }, value: 3 },
          ],
          failEffects: [
            { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: -5 },
          ],
        },
        value: 0,
      },
    ],
    cost: 1,
    rarity: 'uncommon',
    tags: ['business', 'negotiation'],
    flavorText: '有实力才有谈判的资本。',
  },
  {
    id: 'patent_bonus',
    type: 'event',
    name: '专利奖金',
    description: '你的专利申请通过了！薪资+5，影响力+8',
    series: 'business',
    effects: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'money' }, value: 5 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 8 },
    ],
    cost: 0,
    rarity: 'rare',
    tags: ['business', 'reward', 'positive'],
    flavorText: '技术变现的正确姿势。',
  },
];

export default businessCards;
