/**
 * 环境系列卡牌
 * Environment Series Cards - 关注外部环境对职场的影响
 */

import type { CardDefinitionV2 } from './types';

export const environmentCards: CardDefinitionV2[] = [
  // ==================== 经济环境 ====================
  {
    id: 'economic_downturn',
    type: 'event',
    name: '经济下行',
    description: '宏观经济不景气，所有人薪资-2，但求稳心态使健康+5',
    series: 'environment',
    effects: [
      { type: 'lose_resource', target: 'all_players', metadata: { resource: 'money' }, value: 2 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 5 },
    ],
    cost: 0,
    rarity: 'rare',
    tags: ['environment', 'economy', 'negative'],
    flavorText: '裁员潮来袭，能保住工作就是胜利。',
  },
  {
    id: 'policy_bonus',
    type: 'event',
    name: '政策红利',
    description: '所在行业获得政策扶持，绩效+8，薪资+1',
    series: 'environment',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 8 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'money' }, value: 1 },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['environment', 'economy', 'positive'],
    flavorText: '顺应时代潮流，风口上的猪也能飞。',
  },
  {
    id: 'industry_winter',
    type: 'event',
    name: '行业寒冬',
    description: '行业遭遇寒冬，本回合所有「工作」标签卡效果减半',
    series: 'environment',
    effects: [
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'industry_winter_debuff' },
        value: 1,
      },
    ],
    cost: 0,
    rarity: 'rare',
    tags: ['environment', 'economy', 'negative'],
    flavorText: '寒冬终将过去，但谁能撑到春天？',
  },
  {
    id: 'ai_wave',
    type: 'event',
    name: 'AI浪潮',
    description: 'AI技术革命来袭！若技能点≥15则绩效+20，否则绩效-15',
    series: 'environment',
    effects: [
      {
        type: 'custom',
        target: 'self',
        metadata: {
          handler: 'conditional_stat',
          condition: { type: 'resource_threshold', resource: 'skills', operator: '>=', value: 15 },
          successEffects: [
            { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 20 },
          ],
          failEffects: [
            { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -15 },
          ],
        },
        value: 0,
      },
    ],
    cost: 0,
    rarity: 'legendary',
    tags: ['environment', 'technology', 'high_risk'],
    flavorText: '拥抱变化，或被变化淘汰。',
  },

  // ==================== 工作环境 ====================
  {
    id: 'remote_work',
    type: 'modifier',
    name: '远程办公',
    description: '公司推行远程办公政策，持续3回合：健康+3/回合，但影响力-2/回合',
    series: 'environment',
    effects: [
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'remote_work_status' },
        value: 3,
      },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['environment', 'workplace'],
    flavorText: '在家办公真香，就是容易和社会脱节。',
  },
  {
    id: 'return_to_office',
    type: 'modifier',
    name: '返回办公室',
    description: '公司要求返回办公室，持续2回合：影响力+3/回合，幸福感-5/回合',
    series: 'environment',
    effects: [
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'return_office_status' },
        value: 2,
      },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['environment', 'workplace'],
    flavorText: '回到办公室，回到内卷。',
  },
  {
    id: 'commute_hell',
    type: 'event',
    name: '通勤地狱',
    description: '通勤路上遭遇堵车/地铁故障，健康-5，幸福感-5，精力-1',
    series: 'environment',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -5 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -5 },
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 1 },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['environment', 'commute', 'negative'],
    flavorText: '每天花3小时在路上，这就是大城市的代价。',
  },
  {
    id: 'move_near_office',
    type: 'resource',
    name: '搬到公司旁',
    description: '消耗薪资5，之后每回合精力+1（永久）',
    series: 'environment',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'money' }, value: 5 },
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'near_office_bonus' },
        value: -1,
      },
    ],
    cost: 2,
    rarity: 'uncommon',
    tags: ['environment', 'commute', 'investment'],
    flavorText: '用钱换时间，值得吗？',
  },

  // ==================== 社会环境 ====================
  {
    id: 'tech_layoff_news',
    type: 'event',
    name: '科技裁员潮',
    description: '各大公司纷纷裁员的新闻刷屏，幸福感-10，但危机感让绩效+5',
    series: 'environment',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -10 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 5 },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['environment', 'news', 'mixed'],
    flavorText: '看着同行被裁，你决定更加努力工作。',
  },
  {
    id: 'new_competitor',
    type: 'event',
    name: '新竞争对手',
    description: '行业出现强劲的新竞争对手，公司压力增大，所有人绩效要求+10',
    series: 'environment',
    effects: [
      {
        type: 'custom',
        target: 'all_players',
        metadata: { handler: 'raise_performance_threshold', value: 10 },
        value: 10,
      },
    ],
    cost: 0,
    rarity: 'rare',
    tags: ['environment', 'competition'],
    flavorText: '卷不死你，就让你更强大。',
  },
  {
    id: 'office_renovation',
    type: 'event',
    name: '办公室装修',
    description: '公司翻新办公室，环境改善，幸福感+8，但施工期间精力-1',
    series: 'environment',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 8 },
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 1 },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['environment', 'workplace', 'mixed'],
    flavorText: '新工位真不错，就是装修味道有点大。',
  },
  {
    id: 'company_merger',
    type: 'event',
    name: '公司并购',
    description: '公司被收购，组织架构调整。掷骰：1-3绩效-10，4-6绩效+15',
    series: 'environment',
    effects: [
      {
        type: 'roll_dice',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd6', count: 1 },
          resultMappings: [
            {
              range: [1, 3],
              description: '架构调整中被边缘化',
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
              range: [4, 6],
              description: '在新架构中获得重用',
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
    rarity: 'rare',
    tags: ['environment', 'corporate', 'dice'],
    flavorText: '变革中总有人出局，也有人出头。',
  },
];

export default environmentCards;
