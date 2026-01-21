/**
 * "加班的代价"教学关卡配置
 * 专门让玩家理解加班卡的利弊
 */

import { TutorialScenario, TutorialStep } from '../types';

/**
 * 加班教学关卡步骤
 */
const overtimeLessonSteps: TutorialStep[] = [
  {
    id: 'lesson_intro',
    title: '加班的代价',
    description:
      '在大厂，加班是绩效提升的捷径。但凡事都有代价。这节课将让你深刻理解加班的利与弊，以及如何聪明地使用加班。',
    emoji: '📚',
    highlight: 'none',
    trigger: { type: 'immediate' },
    allowSkip: true,
    blocking: true,
    buttonText: '开始学习',
  },
  {
    id: 'overtime_card_intro',
    title: '认识加班卡',
    description:
      '这是「加班」卡。效果：绩效+10，健康-5，精力-2。\n\n绩效提升很诱人，但健康和精力的消耗不容忽视！现在试着打出它。',
    emoji: '💼',
    highlight: 'hand',
    highlightCardId: 'overtime',
    trigger: { type: 'immediate' },
    allowSkip: false,
    blocking: true,
    buttonText: '打出加班卡',
    autoAdvance: true,
  },
  {
    id: 'overtime_played',
    title: '感受到代价了吗？',
    description:
      '绩效增加了 10 点，但健康下降了 5 点！\n\n健康是你的生命线，降到 0 就会被迫离职。所以不能无节制地加班！',
    emoji: '💔',
    highlight: 'stats',
    trigger: { type: 'card_played', cardId: 'overtime' },
    allowSkip: false,
    blocking: true,
    buttonText: '学习组合技',
  },
  {
    id: 'combo_intro',
    title: '组合系统',
    description:
      '好消息是，聪明的打工人知道如何减轻加班的副作用！\n\n现在打出「咖啡时间」卡，看看会发生什么。加班 + 咖啡 = 「熬夜战士」组合！',
    emoji: '☕',
    highlight: 'hand',
    highlightCardId: 'coffee_break',
    trigger: { type: 'immediate' },
    allowSkip: false,
    blocking: true,
    buttonText: '触发组合',
    autoAdvance: true,
  },
  {
    id: 'combo_triggered',
    title: '熬夜战士！',
    description:
      '恭喜触发「熬夜战士」组合！额外获得 5 点绩效奖励！\n\n组合是提升效率的关键。记住有效的卡牌搭配，让每次加班都物超所值！',
    emoji: '🦸',
    highlight: 'none',
    trigger: { type: 'combo_triggered', comboId: 'overtime_coffee_combo' },
    allowSkip: false,
    blocking: true,
    buttonText: '继续练习',
  },
  {
    id: 'practice_overtime',
    title: '再来一次',
    description: '现在再打出一张加班卡。注意观察健康值的变化，当健康低于 50 时要特别警惕！',
    emoji: '📋',
    highlight: 'hand',
    highlightCardId: 'overtime',
    trigger: { type: 'immediate' },
    allowSkip: false,
    blocking: true,
    buttonText: '打出加班卡',
    autoAdvance: true,
  },
  {
    id: 'health_warning',
    title: '健康警告！',
    description:
      '你的健康已经低于 50！这是危险区域。\n\n此时应该优先使用恢复健康的卡牌，如「健身」或「摸鱼」，而不是继续加班。',
    emoji: '⚠️',
    highlight: 'stats',
    trigger: { type: 'stat_below', stat: 'health', threshold: 50 },
    allowSkip: false,
    blocking: true,
    buttonText: '了解恢复手段',
  },
  {
    id: 'recovery_intro',
    title: '恢复健康',
    description:
      '「健身」卡可以恢复健康。「摸鱼」卡虽然会降低绩效，但能恢复健康和幸福感。\n\n现在打出「健身」卡恢复一些健康。',
    emoji: '💪',
    highlight: 'hand',
    highlightCardId: 'gym',
    trigger: { type: 'immediate' },
    allowSkip: false,
    blocking: true,
    buttonText: '恢复健康',
    autoAdvance: true,
  },
  {
    id: 'upgrade_hint',
    title: '卡牌升级',
    description:
      '提示：当你使用某张卡牌达到一定次数后，它会升级为更强版本！\n\n例如「加班」使用 3 次后会升级为「高效加班」，健康消耗从 -5 减少到 -3！',
    emoji: '⬆️',
    highlight: 'none',
    trigger: { type: 'card_played', cardId: 'gym' },
    allowSkip: false,
    blocking: true,
    buttonText: '完成课程',
  },
  {
    id: 'lesson_complete',
    title: '课程完成！',
    description:
      '恭喜你完成了「加班的代价」课程！\n\n关键要点：\n• 加班能快速提升绩效\n• 但会消耗健康和精力\n• 善用组合减轻副作用\n• 健康低时要及时恢复\n• 多次使用可升级卡牌',
    emoji: '🎓',
    highlight: 'none',
    trigger: { type: 'immediate' },
    allowSkip: false,
    blocking: true,
    buttonText: '返回首页',
  },
];

/**
 * 加班教学关卡场景
 */
export const overtimeLessonScenario: TutorialScenario = {
  id: 'overtime_lesson',
  type: 'overtime_lesson',
  name: '加班的代价',
  description: '学习加班卡的利与弊',
  steps: overtimeLessonSteps,
  // 固定初始手牌
  fixedHand: ['overtime', 'overtime', 'coffee_break', 'slacking', 'gym'],
  // 固定初始属性（便于体验健康下降）
  initialStats: {
    performance: 30,
    health: 70,
    happiness: 60,
    influence: 10,
  },
  // 固定初始资源
  initialResources: {
    money: 1000,
    energy: 10,
    connections: 5,
    skills: 0,
  },
};
