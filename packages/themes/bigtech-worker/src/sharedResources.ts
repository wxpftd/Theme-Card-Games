import { SharedResourceDefinition } from '@theme-card-games/core';

/**
 * 大厂打工主题 - 共享竞争资源定义
 * 这些资源是所有玩家共同竞争的有限资源
 */
export const sharedResourceDefinitions: SharedResourceDefinition[] = [
  // 晋升名额 - 每局游戏只有 1 个
  {
    id: 'promotion_slots',
    name: '晋升名额',
    description: '本季度仅有的晋升机会，先到先得！获得后绩效直接 +30',
    icon: '🏆',
    totalAmount: 1,
    renewable: false,
    claimRules: [
      {
        type: 'highest_stat',
        statId: 'performance',
        description: '绩效最高者优先获得',
      },
    ],
    claimEffects: [
      {
        type: 'modify_stat',
        target: 'self',
        value: 30,
        metadata: { stat: 'performance' },
      },
      {
        type: 'gain_resource',
        target: 'self',
        value: 5,
        metadata: { resource: 'money' },
      },
    ],
  },

  // 项目机会 - 有限但可再生
  {
    id: 'project_opportunities',
    name: '项目机会',
    description: '优质项目机会，抢到就是赚到！获得后绩效 +10',
    icon: '📊',
    totalAmount: 3,
    renewable: true,
    renewalInterval: 5, // 每 5 回合再生
    renewalAmount: 1,
    claimRules: [
      {
        type: 'first_come',
        description: '先到先得',
      },
    ],
    claimEffects: [
      {
        type: 'modify_stat',
        target: 'self',
        value: 10,
        metadata: { stat: 'performance' },
      },
      {
        type: 'modify_stat',
        target: 'self',
        value: 3,
        metadata: { stat: 'influence' },
      },
    ],
  },

  // 导师资源 - 有限
  {
    id: 'mentor_slots',
    name: '导师指导',
    description: '资深导师的一对一指导机会，获得后技能点 +5',
    icon: '👨‍🏫',
    totalAmount: 2,
    renewable: false,
    claimRules: [
      {
        type: 'highest_stat',
        statId: 'influence',
        description: '影响力最高者优先',
      },
    ],
    claimEffects: [
      {
        type: 'gain_resource',
        target: 'self',
        value: 5,
        metadata: { resource: 'skills' },
      },
      {
        type: 'modify_stat',
        target: 'self',
        value: 5,
        metadata: { stat: 'influence' },
      },
    ],
  },

  // 年终奖池 - 根据表现分配
  {
    id: 'bonus_pool',
    name: '年终奖金池',
    description: '有限的年终奖金池，绩效越高分得越多',
    icon: '💰',
    totalAmount: 5, // 可分配 5 份
    renewable: false,
    claimRules: [
      {
        type: 'highest_stat',
        statId: 'performance',
        description: '按绩效高低依次分配',
      },
    ],
    claimEffects: [
      {
        type: 'gain_resource',
        target: 'self',
        value: 3,
        metadata: { resource: 'money' },
      },
      {
        type: 'modify_stat',
        target: 'self',
        value: 10,
        metadata: { stat: 'happiness' },
      },
    ],
  },

  // 培训名额 - 可再生
  {
    id: 'training_slots',
    name: '外派培训名额',
    description: '珍贵的外派培训机会，可学习新技能',
    icon: '🎓',
    totalAmount: 2,
    renewable: true,
    renewalInterval: 8,
    renewalAmount: 1,
    claimRules: [
      {
        type: 'random',
        description: '随机抽取幸运儿',
      },
    ],
    claimEffects: [
      {
        type: 'gain_resource',
        target: 'self',
        value: 4,
        metadata: { resource: 'skills' },
      },
      {
        type: 'modify_stat',
        target: 'self',
        value: 8,
        metadata: { stat: 'happiness' },
      },
    ],
  },
];

export default sharedResourceDefinitions;
