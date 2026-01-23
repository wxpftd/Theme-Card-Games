/**
 * 骰子主题卡牌定义
 * Dice-themed card definitions for Big Tech Worker theme
 *
 * 这些卡牌通过掷骰子机制增加游戏的随机性和趣味性
 */

import { CardDefinition } from '@theme-card-games/core';

/**
 * 骰子卡牌定义
 */
export const diceCards: CardDefinition[] = [
  // ==================== 骰子事件卡 ====================
  {
    id: 'dice_performance_review',
    type: 'event',
    name: '绩效考核',
    description: '掷1d6决定绩效评级：1-2差评(-10)，3-4中评(+5)，5-6好评(+15)',
    effects: [
      {
        type: 'roll_dice',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd6', count: 1 },
          resultMappings: [
            {
              range: [1, 2] as [number, number],
              description: '差评：绩效-10',
              outcomeType: 'failure',
              effects: [
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'performance' },
                  value: -10,
                },
              ],
            },
            {
              range: [3, 4] as [number, number],
              description: '中评：绩效+5',
              outcomeType: 'partial',
              effects: [
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'performance' },
                  value: 5,
                },
              ],
            },
            {
              range: [5, 6] as [number, number],
              description: '好评：绩效+15',
              outcomeType: 'success',
              effects: [
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'performance' },
                  value: 15,
                },
              ],
            },
          ],
        },
      },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['dice', 'work', 'review'],
  },

  {
    id: 'dice_team_building',
    type: 'event',
    name: '团建活动',
    description: '掷1d6决定团建效果：结果越高人脉和幸福感提升越多',
    effects: [
      {
        type: 'roll_dice',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd6', count: 1 },
          stat: 'happiness',
          baseValue: 2,
          perPoint: 1, // 每点骰子+1幸福感
        },
      },
      {
        type: 'roll_dice',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd6', count: 1 },
          resource: 'connections',
          baseValue: 0,
          perPoint: 0.5, // 每2点骰子+1人脉
        },
      },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['dice', 'social', 'team'],
  },

  {
    id: 'dice_code_roulette',
    type: 'action',
    name: '代码轮盘',
    description: '掷1d20决定代码提交结果：1大失败，2-10普通，11-19成功，20大成功',
    effects: [
      {
        type: 'roll_dice',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd20', count: 1 },
          resultMappings: [
            {
              range: [1, 1] as [number, number],
              description: '代码引入重大Bug！绩效-20，健康-10',
              outcomeType: 'critical_failure',
              effects: [
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'performance' },
                  value: -20,
                },
                { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -10 },
              ],
            },
            {
              range: [2, 10] as [number, number],
              description: '代码正常通过，绩效+5',
              outcomeType: 'partial',
              effects: [
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'performance' },
                  value: 5,
                },
              ],
            },
            {
              range: [11, 19] as [number, number],
              description: '代码质量优秀！绩效+12，影响力+3',
              outcomeType: 'success',
              effects: [
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'performance' },
                  value: 12,
                },
                { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 3 },
              ],
            },
            {
              range: [20, 20] as [number, number],
              description: '神级代码！老板亲自表扬！绩效+25，影响力+10',
              outcomeType: 'critical_success',
              effects: [
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'performance' },
                  value: 25,
                },
                { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 10 },
              ],
            },
          ],
        },
      },
    ],
    cost: 2,
    rarity: 'rare',
    tags: ['dice', 'work', 'coding'],
  },

  // ==================== 骰子挑战卡 ====================
  {
    id: 'dice_interview_challenge',
    type: 'action',
    name: '面试挑战',
    description: '掷2d6挑战面试（难度8）：成功获得Offer，薪资+3；失败信心受挫',
    effects: [
      {
        type: 'dice_challenge',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd6', count: 2 },
          difficultyClass: 8,
          successEffects: [
            { type: 'gain_resource', target: 'self', metadata: { resource: 'money' }, value: 3 },
            { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 10 },
          ],
          failureEffects: [
            { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -5 },
          ],
        },
      },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['dice', 'challenge', 'career'],
  },

  {
    id: 'dice_meeting_survival',
    type: 'event',
    name: '会议生存',
    description: '掷1d20挑战无聊会议（难度12）：成功保持清醒，失败被点名提问',
    effects: [
      {
        type: 'dice_challenge',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd20', count: 1 },
          difficultyClass: 12,
          successEffects: [
            { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 2 },
          ],
          failureEffects: [
            { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -5 },
            { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -3 },
          ],
        },
      },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['dice', 'challenge', 'meeting'],
  },

  {
    id: 'dice_promotion_lottery',
    type: 'action',
    name: '晋升抽签',
    description: '掷3d6挑战晋升（难度15）：成功晋升加薪，失败原地踏步',
    effects: [
      {
        type: 'dice_challenge',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd6', count: 3 },
          difficultyClass: 15,
          successEffects: [
            { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 20 },
            { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 15 },
            { type: 'gain_resource', target: 'self', metadata: { resource: 'money' }, value: 5 },
            { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 20 },
          ],
          failureEffects: [
            { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -10 },
          ],
        },
      },
    ],
    cost: 3,
    rarity: 'legendary',
    tags: ['dice', 'challenge', 'promotion'],
  },

  // ==================== 优势/劣势骰子卡 ====================
  {
    id: 'dice_lucky_day',
    type: 'event',
    name: '幸运日',
    description: '今天运气不错！掷1d6优势（掷两次取高），根据结果获得绩效',
    effects: [
      {
        type: 'roll_dice',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd6', count: 1, advantage: 'advantage' },
          stat: 'performance',
          baseValue: 0,
          perPoint: 3, // 每点骰子+3绩效
        },
      },
    ],
    cost: 1,
    rarity: 'rare',
    tags: ['dice', 'lucky', 'advantage'],
  },

  {
    id: 'dice_bad_luck',
    type: 'event',
    name: '倒霉日',
    description: '今天诸事不顺！掷1d6劣势（掷两次取低），失去对应健康值',
    effects: [
      {
        type: 'roll_dice',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd6', count: 1, advantage: 'disadvantage' },
          stat: 'health',
          baseValue: 0,
          perPoint: -2, // 每点骰子-2健康
        },
      },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['dice', 'unlucky', 'disadvantage'],
  },

  // ==================== 多骰子组合卡 ====================
  {
    id: 'dice_project_gamble',
    type: 'action',
    name: '项目豪赌',
    description: '掷2d6+3决定项目收益：根据结果获得绩效和薪资',
    effects: [
      {
        type: 'roll_dice',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd6', count: 2, modifier: 3 },
          resultMappings: [
            {
              range: [5, 7] as [number, number],
              description: '项目失败，亏损了',
              outcomeType: 'failure',
              effects: [
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'performance' },
                  value: -10,
                },
                {
                  type: 'lose_resource',
                  target: 'self',
                  metadata: { resource: 'money' },
                  value: 2,
                },
              ],
            },
            {
              range: [8, 10] as [number, number],
              description: '项目平稳完成',
              outcomeType: 'partial',
              effects: [
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'performance' },
                  value: 8,
                },
              ],
            },
            {
              range: [11, 13] as [number, number],
              description: '项目超额完成！',
              outcomeType: 'success',
              effects: [
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'performance' },
                  value: 15,
                },
                {
                  type: 'gain_resource',
                  target: 'self',
                  metadata: { resource: 'money' },
                  value: 2,
                },
              ],
            },
            {
              range: [14, 15] as [number, number],
              description: '项目大获成功！',
              outcomeType: 'critical_success',
              effects: [
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'performance' },
                  value: 25,
                },
                { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 10 },
                {
                  type: 'gain_resource',
                  target: 'self',
                  metadata: { resource: 'money' },
                  value: 5,
                },
              ],
            },
          ],
        },
      },
    ],
    cost: 3,
    rarity: 'rare',
    tags: ['dice', 'project', 'gamble'],
  },

  {
    id: 'dice_networking_event',
    type: 'action',
    name: '社交骰局',
    description: '参加行业社交活动，掷1d8决定收获的人脉数量',
    effects: [
      {
        type: 'roll_dice',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd8', count: 1 },
          resource: 'connections',
          baseValue: 1,
          perPoint: 0.5, // 基础1人脉，每2点骰子+1
        },
      },
      {
        type: 'modify_stat',
        target: 'self',
        metadata: { stat: 'happiness' },
        value: 3,
      },
    ],
    cost: 1,
    rarity: 'uncommon',
    tags: ['dice', 'social', 'networking'],
  },

  // ==================== 特殊骰子卡 ====================
  {
    id: 'dice_russian_roulette',
    type: 'action',
    name: '职场俄罗斯轮盘',
    description: '高风险高回报！掷1d6：1-2大损失，3-4小损失，5平局，6大奖励',
    effects: [
      {
        type: 'roll_dice',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd6', count: 1 },
          resultMappings: [
            {
              range: [1, 2] as [number, number],
              description: '被裁员警告！',
              outcomeType: 'critical_failure',
              effects: [
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'performance' },
                  value: -20,
                },
                { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -15 },
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'happiness' },
                  value: -15,
                },
              ],
            },
            {
              range: [3, 4] as [number, number],
              description: '被批评了',
              outcomeType: 'failure',
              effects: [
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'performance' },
                  value: -5,
                },
                { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -5 },
              ],
            },
            {
              range: [5, 5] as [number, number],
              description: '安全过关',
              outcomeType: 'partial',
              effects: [],
            },
            {
              range: [6, 6] as [number, number],
              description: '被老板赏识！',
              outcomeType: 'critical_success',
              effects: [
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'performance' },
                  value: 30,
                },
                { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 15 },
                { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 10 },
                {
                  type: 'gain_resource',
                  target: 'self',
                  metadata: { resource: 'money' },
                  value: 3,
                },
              ],
            },
          ],
        },
      },
    ],
    cost: 2,
    rarity: 'legendary',
    tags: ['dice', 'risk', 'gamble'],
  },
];

/**
 * 骰子卡牌 ID 列表
 */
export const diceCardIds = diceCards.map((card) => card.id);

/**
 * 获取所有骰子卡牌的标签
 */
export const diceCardTags = ['dice', 'challenge', 'gamble', 'lucky', 'unlucky', 'risk'];
