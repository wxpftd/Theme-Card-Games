/**
 * 工作系列卡牌
 * Work Series Cards - 日常工作事务
 * 这里包含从原有卡牌迁移过来的工作相关卡牌，并添加系列标识
 */

import type { CardDefinitionV2 } from './types';

export const workCards: CardDefinitionV2[] = [
  // ==================== 工作事件卡 ====================
  {
    id: 'overtime',
    type: 'event',
    name: '加班',
    description: '主动加班完成项目，绩效+10，健康-5，精力-2',
    series: 'work',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 10 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -5 },
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 2 },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['work', 'overtime'],
    flavorText: '996是福报？',
  },
  {
    id: 'bug_fix',
    type: 'action',
    name: '修复线上Bug',
    description: '紧急修复生产环境问题，绩效+15，健康-10',
    series: 'work',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 15 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -10 },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['work', 'urgent', 'tech'],
    flavorText: '凌晨3点的告警，你懂的。',
  },
  {
    id: 'project_delivery',
    type: 'action',
    name: '项目交付',
    description: '成功交付重要项目，绩效+20，影响力+5',
    series: 'work',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 20 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 5 },
    ],
    cost: 3,
    rarity: 'rare',
    tags: ['work', 'project'],
    flavorText: '上线那一刻，所有的努力都值了。',
  },
  {
    id: 'code_review',
    type: 'action',
    name: '代码评审',
    description: '帮同事做代码评审，影响力+3，人脉+1',
    series: 'work',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 3 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'connections' }, value: 1 },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['work', 'social', 'tech'],
    flavorText: '代码评审是最好的学习方式之一。',
  },
  {
    id: 'ppt_presentation',
    type: 'action',
    name: 'PPT汇报',
    description: '向领导汇报工作，绩效+8，幸福感-3',
    series: 'work',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 8 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -3 },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['work', 'meeting'],
    flavorText: '做PPT的时间比写代码还多。',
  },

  // ==================== 摸鱼卡 ====================
  {
    id: 'slacking',
    type: 'action',
    name: '摸鱼',
    description: '偷偷摸鱼休息，健康+5，幸福感+5，绩效-3',
    series: 'work',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 5 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 5 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -3 },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['work', 'rest', 'risk'],
    flavorText: '摸鱼一时爽，一直摸鱼一直爽。',
  },
  {
    id: 'coffee_break',
    type: 'action',
    name: '咖啡时间',
    description: '去茶水间喝咖啡放松，健康+3，精力+1',
    series: 'work',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 3 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'energy' }, value: 1 },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['work', 'rest'],
    flavorText: '续命咖啡，打工人必备。',
  },

  // ==================== 策略卡 ====================
  {
    id: 'job_hop',
    type: 'action',
    name: '跳槽面试',
    description: '尝试跳槽到其他公司，消耗3人脉，薪资+5，绩效重置为50',
    series: 'work',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'connections' }, value: 3 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'money' }, value: 5 },
      {
        type: 'custom',
        target: 'self',
        metadata: { handler: 'set_stat', stat: 'performance', value: 50 },
        value: 0,
      },
    ],
    cost: 3,
    rarity: 'rare',
    tags: ['work', 'strategy'],
    flavorText: '金三银四，跳槽季。',
  },
  {
    id: 'internal_transfer',
    type: 'action',
    name: '内部转岗',
    description: '申请转到其他部门，绩效-10，幸福感+10，技能点+3',
    series: 'work',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -10 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 10 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 3 },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['work', 'strategy'],
    flavorText: '换个环境，换个心情。',
  },

  // ==================== 升级版卡牌 ====================
  {
    id: 'overtime_efficient',
    type: 'event',
    name: '高效加班',
    description: '学会了高效加班，绩效+10，健康-3（减少消耗），精力-2',
    series: 'work',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 10 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -3 },
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 2 },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['work', 'overtime', 'upgraded'],
    flavorText: '加班也要讲效率。',
  },
  {
    id: 'slacking_pro',
    type: 'action',
    name: '花式摸鱼',
    description: '摸鱼技术登峰造极，健康+8，幸福感+8，绩效-2',
    series: 'work',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 8 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 8 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -2 },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['work', 'rest', 'risk', 'upgraded'],
    flavorText: '摸鱼界的王者。',
  },
  {
    id: 'project_delivery_star',
    type: 'action',
    name: '明星项目',
    description: '交付了明星项目！绩效+30，影响力+10',
    series: 'work',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 30 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 10 },
    ],
    cost: 3,
    rarity: 'legendary',
    tags: ['work', 'project', 'upgraded'],
    flavorText: '这个项目将成为你简历上的亮点。',
  },

  // ==================== 会议相关 ====================
  {
    id: 'standup_meeting',
    type: 'action',
    name: '站会',
    description: '参加每日站会，同步进度，绩效+3，精力-1',
    series: 'work',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 3 },
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 1 },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['work', 'meeting'],
    flavorText: '昨天做了什么，今天要做什么，有什么blocker。',
  },
  {
    id: 'sprint_planning',
    type: 'action',
    name: '冲刺规划',
    description: '参与Sprint规划会议，绩效+5，影响力+2，精力-2',
    series: 'work',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 5 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 2 },
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 2 },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['work', 'meeting', 'planning'],
    flavorText: '这个Sprint能完成吗？',
  },
  {
    id: 'retrospective',
    type: 'action',
    name: '回顾会议',
    description: '参加迭代回顾，反思改进，技能点+2，影响力+2',
    series: 'work',
    effects: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 2 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 2 },
    ],
    cost: 1,
    rarity: 'common',
    tags: ['work', 'meeting', 'growth'],
    flavorText: '不断改进，持续成长。',
  },
];

export default workCards;
