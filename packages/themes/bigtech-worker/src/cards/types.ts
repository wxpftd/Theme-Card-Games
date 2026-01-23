/**
 * 卡牌系列类型定义
 * Card Series Type Definitions
 */

import type { CardDefinitionV2, CardSeriesConfig, SeriesFocusBonus } from '@theme-card-games/core';

// Re-export for convenience
export type { CardDefinitionV2, CardSeriesConfig, SeriesFocusBonus };

/**
 * 系列配置
 */
export const seriesConfigs: CardSeriesConfig[] = [
  {
    id: 'environment',
    name: '环境',
    description: '关注外部环境对职场的影响',
    icon: '🌍',
    color: '#4CAF50',
    focusBonus: {
      series: 'environment',
      name: '环境敏感',
      description: '开局时额外查看1张环境事件',
      effects: [{ type: 'draw_cards', target: 'self', value: 1 }],
    },
  },
  {
    id: 'business',
    name: '营商',
    description: '商业机会与投资理财',
    icon: '💼',
    color: '#FF9800',
    focusBonus: {
      series: 'business',
      name: '商业头脑',
      description: '每回合薪资+1',
      effects: [
        { type: 'gain_resource', target: 'self', metadata: { resource: 'money' }, value: 1 },
      ],
    },
  },
  {
    id: 'health',
    name: '健康',
    description: '身心健康管理',
    icon: '💪',
    color: '#E91E63',
    focusBonus: {
      series: 'health',
      name: '养生达人',
      description: '起始健康+10',
      effects: [{ type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 10 }],
    },
  },
  {
    id: 'accident',
    name: '意外',
    description: '不可预测的突发状况',
    icon: '⚡',
    color: '#9C27B0',
    focusBonus: {
      series: 'accident',
      name: '危机处理',
      description: '意外事件卡正面效果+50%',
      effects: [],
    },
  },
  {
    id: 'social',
    name: '社交',
    description: '人际关系与职场政治',
    icon: '🤝',
    color: '#2196F3',
    focusBonus: {
      series: 'social',
      name: '社交达人',
      description: '起始人脉+2',
      effects: [
        { type: 'gain_resource', target: 'self', metadata: { resource: 'connections' }, value: 2 },
      ],
    },
  },
  {
    id: 'growth',
    name: '成长',
    description: '个人能力提升',
    icon: '📚',
    color: '#00BCD4',
    focusBonus: {
      series: 'growth',
      name: '学霸体质',
      description: '起始技能点+3',
      effects: [
        { type: 'gain_resource', target: 'self', metadata: { resource: 'skills' }, value: 3 },
      ],
    },
  },
  {
    id: 'work',
    name: '工作',
    description: '日常工作事务',
    icon: '💻',
    color: '#607D8B',
    focusBonus: {
      series: 'work',
      name: '卷王体质',
      description: '工作卡绩效效果+20%',
      effects: [],
    },
  },
  {
    id: 'neutral',
    name: '中立',
    description: '可放入任何卡组',
    icon: '⭐',
    color: '#9E9E9E',
  },
];

/**
 * 获取所有系列专精加成
 */
export function getSeriesFocusBonuses(): SeriesFocusBonus[] {
  return seriesConfigs.filter((config) => config.focusBonus).map((config) => config.focusBonus!);
}
