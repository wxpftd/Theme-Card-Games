/**
 * 健康系列卡牌
 * Health Series Cards - 身心健康管理
 */

import type { CardDefinitionV2 } from './types';

export const healthCards: CardDefinitionV2[] = [
  // ==================== 体检与诊断 ====================
  {
    id: 'health_checkup',
    type: 'event',
    name: '体检报告',
    description: '年度体检，若健康<50则强制休息1回合但健康+15，否则健康+5',
    series: 'health',
    effects: [
      {
        type: 'custom',
        target: 'self',
        metadata: {
          handler: 'conditional_effect',
          condition: { type: 'stat_threshold', stat: 'health', operator: '<', value: 50 },
          successEffects: [
            { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 15 },
            {
              type: 'apply_status',
              target: 'self',
              metadata: { statusId: 'forced_rest' },
              value: 1,
            },
          ],
          failEffects: [
            { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 5 },
          ],
        },
        value: 0,
      },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['health', 'checkup'],
    flavorText: '身体是革命的本钱，别等到红灯才重视。',
  },
  {
    id: 'cervical_spondylosis',
    type: 'event',
    name: '颈椎病',
    description: '长期伏案工作导致颈椎问题，当健康<40时：健康-5/回合，持续3回合',
    series: 'health',
    effects: [
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'cervical_pain' },
        value: 3,
      },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['health', 'disease', 'negative'],
    flavorText: '程序员的职业病，没跑了。',
  },

  // ==================== 心理健康 ====================
  {
    id: 'therapy_session',
    type: 'action',
    name: '心理咨询',
    description: '预约心理咨询师，消耗薪资2，幸福感+15，移除1个负面状态',
    series: 'health',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'money' }, value: 2 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 15 },
      { type: 'remove_status', target: 'self', metadata: { removeNegative: true }, value: 1 },
    ],
    cost: 1,
    rarity: 'uncommon',
    tags: ['health', 'mental', 'healing'],
    flavorText: '照顾好自己的心理健康，和身体一样重要。',
  },
  {
    id: 'mindfulness',
    type: 'action',
    name: '正念冥想',
    description: '花时间冥想放松，精力+2，幸福感+5，解除「焦虑」状态',
    series: 'health',
    effects: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'energy' }, value: 2 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 5 },
      { type: 'remove_status', target: 'self', metadata: { statusId: 'anxiety' }, value: 1 },
    ],
    cost: 1,
    rarity: 'uncommon',
    tags: ['health', 'mental', 'rest'],
    flavorText: '每天15分钟，找回内心的平静。',
  },
  {
    id: 'burnout_syndrome',
    type: 'event',
    name: '职业倦怠',
    description: '当连续3回合出「工作」卡时触发，幸福感-25，下回合无法使用工作卡',
    series: 'health',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -25 },
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'burnout_block' },
        value: 1,
      },
    ],
    cost: 0,
    rarity: 'rare',
    tags: ['health', 'mental', 'negative'],
    flavorText: '不是不想努力，是真的累了。',
  },

  // ==================== 身体锻炼 ====================
  {
    id: 'fitness_habit',
    type: 'modifier',
    name: '健身习惯',
    description: '养成健身习惯，永久效果：每回合健康+2',
    series: 'health',
    effects: [
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'fitness_habit_bonus' },
        value: -1,
      },
    ],
    cost: 3,
    rarity: 'rare',
    tags: ['health', 'fitness', 'permanent'],
    flavorText: '坚持就是胜利，肌肉会记住你的努力。',
  },
  {
    id: 'morning_jog',
    type: 'action',
    name: '晨跑',
    description: '早起跑步，健康+8，精力+1，但需要牺牲睡眠：幸福感-3',
    series: 'health',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 8 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'energy' }, value: 1 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -3 },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['health', 'fitness'],
    flavorText: '早起的鸟儿有虫吃，早起的人儿有肌肉。',
  },

  // ==================== 休息恢复 ====================
  {
    id: 'late_night_overtime',
    type: 'action',
    name: '熬夜赶工',
    description: '通宵完成紧急任务，绩效+15，健康-10，下回合精力-2',
    series: 'health',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 15 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -10 },
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'sleep_deprived' },
        value: 1,
      },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['health', 'work', 'risk'],
    flavorText: '今晚熬夜，明天再说。',
  },
  {
    id: 'paid_sick_leave',
    type: 'action',
    name: '带薪病假',
    description: '跳过本回合的行动，健康+25，不损失绩效',
    series: 'health',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 25 },
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'on_sick_leave' },
        value: 1,
      },
    ],
    cost: 0,
    rarity: 'rare',
    tags: ['health', 'rest', 'recovery'],
    flavorText: '休息是为了走更长的路。',
  },
  {
    id: 'power_nap',
    type: 'action',
    name: '午休小憩',
    description: '午饭后小睡20分钟，精力+2，健康+3',
    series: 'health',
    effects: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'energy' }, value: 2 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 3 },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['health', 'rest'],
    flavorText: '充电20分钟，满血复活。',
  },

  // ==================== 饮食与生活 ====================
  {
    id: 'healthy_meal',
    type: 'action',
    name: '健康饮食',
    description: '坚持吃健康餐，消耗薪资1，健康+8，幸福感+3',
    series: 'health',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'money' }, value: 1 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 8 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 3 },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['health', 'lifestyle'],
    flavorText: '你就是你吃的东西。',
  },
  {
    id: 'sleep_schedule',
    type: 'modifier',
    name: '规律作息',
    description: '建立规律的睡眠习惯，持续效果：每回合健康+1，精力恢复+1',
    series: 'health',
    effects: [
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'good_sleep_schedule' },
        value: -1,
      },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['health', 'lifestyle', 'permanent'],
    flavorText: '早睡早起身体好，不是说说而已。',
  },
];

export default healthCards;
