/**
 * 意外系列卡牌
 * Accident Series Cards - 不可预测的突发状况
 */

import type { CardDefinitionV2 } from './types';

export const accidentCards: CardDefinitionV2[] = [
  // ==================== 工作意外 ====================
  {
    id: 'computer_crash',
    type: 'event',
    name: '电脑蓝屏',
    description: '工作电脑突然蓝屏，本回合工作无效，绩效-5',
    series: 'accident',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -5 },
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'work_blocked' },
        value: 1,
      },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['accident', 'work', 'negative'],
    flavorText: '保存了吗？保存了吗？保存了吗？',
  },
  {
    id: 'production_incident',
    type: 'event',
    name: '线上事故',
    description: '生产环境出现严重问题！掷骰决定责任：1-3背锅（绩效-20），4-6甩锅成功',
    series: 'accident',
    effects: [
      {
        type: 'roll_dice',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd6', count: 1 },
          resultMappings: [
            {
              range: [1, 3],
              description: '背锅！被认定为主要责任人',
              effects: [
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'performance' },
                  value: -20,
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
              range: [4, 6],
              description: '成功甩锅，还顺便展示了问题排查能力',
              effects: [
                { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 5 },
              ],
            },
          ],
        },
      },
    ],
    cost: 0,
    rarity: 'rare',
    tags: ['accident', 'work', 'dice', 'high_stakes'],
    flavorText: '这锅谁背？',
  },
  {
    id: 'code_deleted',
    type: 'event',
    name: '误删代码',
    description: '不小心删除了重要代码，绩效-10，精力-2（抢救代码）',
    series: 'accident',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -10 },
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 2 },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['accident', 'work', 'negative'],
    flavorText: 'rm -rf 的恐惧。',
  },
  {
    id: 'meeting_overrun',
    type: 'event',
    name: '会议超时',
    description: '无意义的会议占用了整个下午，精力-3，幸福感-5',
    series: 'accident',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'energy' }, value: 3 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -5 },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['accident', 'work', 'negative'],
    flavorText: '这个会议本可以是一封邮件。',
  },

  // ==================== 生活意外 ====================
  {
    id: 'lottery_win',
    type: 'event',
    name: '中彩票',
    description: '天降横财！薪资+50，可选择立即退休（游戏胜利）',
    series: 'accident',
    effects: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'money' }, value: 50 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 30 },
      // 可选择退休的逻辑需要自定义处理
    ],
    cost: 0,
    rarity: 'legendary',
    tags: ['accident', 'positive', 'life_changing'],
    flavorText: '财务自由了！但是...真的要离开职场吗？',
  },
  {
    id: 'family_emergency',
    type: 'event',
    name: '家庭急事',
    description: '家里有急事需要处理，强制休假2回合，幸福感-10',
    series: 'accident',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -10 },
      {
        type: 'apply_status',
        target: 'self',
        metadata: { statusId: 'family_leave' },
        value: 2,
      },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['accident', 'life', 'negative'],
    flavorText: '家人永远比工作重要。',
  },
  {
    id: 'apartment_leak',
    type: 'event',
    name: '房屋漏水',
    description: '出租屋漏水需要维修，消耗薪资3，幸福感-8',
    series: 'accident',
    effects: [
      { type: 'lose_resource', target: 'self', metadata: { resource: 'money' }, value: 3 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -8 },
    ],
    cost: 0,
    rarity: 'common',
    tags: ['accident', 'life', 'negative'],
    flavorText: '北漂沪漂的日常。',
  },

  // ==================== 职场变故 ====================
  {
    id: 'headhunted',
    type: 'event',
    name: '被挖角',
    description: '竞争对手开出双倍薪资邀请，可选择接受（薪资×2但绩效清零）',
    series: 'accident',
    effects: [
      {
        type: 'custom',
        target: 'self',
        metadata: {
          handler: 'optional_choice',
          choiceId: 'accept_headhunt',
          acceptEffects: [
            {
              type: 'custom',
              target: 'self',
              metadata: { handler: 'multiply_resource', resource: 'money', multiplier: 2 },
              value: 0,
            },
            {
              type: 'custom',
              target: 'self',
              metadata: { handler: 'set_stat', stat: 'performance', value: 0 },
              value: 0,
            },
          ],
          declineEffects: [
            { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 5 },
          ],
        },
        value: 0,
      },
    ],
    cost: 0,
    rarity: 'rare',
    tags: ['accident', 'career', 'choice'],
    flavorText: '是金子总会发光，但要不要换个地方发光呢？',
  },
  {
    id: 'project_cancelled',
    type: 'event',
    name: '项目取消',
    description: '负责的项目被突然取消，当前所有「项目」相关加成清零',
    series: 'accident',
    effects: [
      { type: 'remove_status', target: 'self', metadata: { statusTag: 'project' }, value: 0 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -10 },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['accident', 'work', 'negative'],
    flavorText: '几个月的努力，说没就没了。',
  },
  {
    id: 'viral_post',
    type: 'event',
    name: '意外走红',
    description: '你的技术分享意外火了！影响力+15，人脉+5',
    series: 'accident',
    effects: [
      { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 15 },
      { type: 'gain_resource', target: 'self', metadata: { resource: 'connections' }, value: 5 },
    ],
    cost: 0,
    rarity: 'rare',
    tags: ['accident', 'positive', 'social'],
    flavorText: '一夜成名的感觉真好。',
  },
  {
    id: 'data_breach',
    type: 'event',
    name: '数据泄露',
    description: '公司发生数据泄露事件，所有人绩效-10，但危机处理者绩效+20',
    series: 'accident',
    effects: [
      { type: 'modify_stat', target: 'all_players', metadata: { stat: 'performance' }, value: -10 },
      {
        type: 'roll_dice',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd6', count: 1 },
          resultMappings: [
            {
              range: [1, 3],
              description: '只是受影响的普通员工',
              effects: [],
            },
            {
              range: [4, 6],
              description: '成为危机处理的关键人物',
              effects: [
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'performance' },
                  value: 30,
                },
                { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 10 },
              ],
            },
          ],
        },
      },
    ],
    cost: 0,
    rarity: 'rare',
    tags: ['accident', 'work', 'dice'],
    flavorText: '危机也是机遇。',
  },

  // ==================== 随机惊喜 ====================
  {
    id: 'random_bonus',
    type: 'event',
    name: '意外奖金',
    description: '收到一笔意外的项目奖金，薪资+3，幸福感+8',
    series: 'accident',
    effects: [
      { type: 'gain_resource', target: 'self', metadata: { resource: 'money' }, value: 3 },
      { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: 8 },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['accident', 'positive', 'reward'],
    flavorText: '这种惊喜请多来一点。',
  },
  {
    id: 'elevator_pitch',
    type: 'event',
    name: '电梯偶遇',
    description: '在电梯里遇到了大老板！掷骰：1-2尴尬沉默，3-4普通寒暄，5-6留下深刻印象',
    series: 'accident',
    effects: [
      {
        type: 'roll_dice',
        target: 'self',
        metadata: {
          diceConfig: { type: 'd6', count: 1 },
          resultMappings: [
            {
              range: [1, 2],
              description: '尴尬的沉默...',
              effects: [
                { type: 'modify_stat', target: 'self', metadata: { stat: 'happiness' }, value: -3 },
              ],
            },
            {
              range: [3, 4],
              description: '普通的寒暄，老板点了点头',
              effects: [
                { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 2 },
              ],
            },
            {
              range: [5, 6],
              description: '完美的电梯演讲！老板记住了你',
              effects: [
                { type: 'modify_stat', target: 'self', metadata: { stat: 'influence' }, value: 10 },
                {
                  type: 'modify_stat',
                  target: 'self',
                  metadata: { stat: 'performance' },
                  value: 5,
                },
              ],
            },
          ],
        },
      },
    ],
    cost: 0,
    rarity: 'uncommon',
    tags: ['accident', 'social', 'dice'],
    flavorText: '机会总是留给有准备的人。',
  },
];

export default accidentCards;
