/**
 * 首局引导场景配置
 * 玩家第一次进入游戏时的强制引导
 */

import { TutorialScenario, TutorialStep } from '../types';

/**
 * 首局引导步骤
 */
const firstGameSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: '欢迎来到大厂！',
    description:
      '你是一名刚入职的大厂员工。在这里，你需要在保持身心健康的同时，努力提升绩效获得晋升！让我来带你熟悉一下游戏。',
    emoji: '🏢',
    highlight: 'none',
    trigger: { type: 'immediate' },
    allowSkip: true,
    blocking: true,
    buttonText: '开始了解',
  },
  {
    id: 'hand_intro',
    title: '这是你的手牌',
    description:
      '手牌区显示你当前可以打出的卡牌。每张卡牌都有不同的效果，有些能提升绩效，有些能恢复健康。点击卡牌可以查看详情，再次点击打出卡牌。',
    emoji: '🃏',
    highlight: 'hand',
    trigger: { type: 'immediate' },
    allowSkip: false,
    blocking: true,
    buttonText: '试着打出一张牌',
    autoAdvance: true,
  },
  {
    id: 'card_played',
    title: '干得漂亮！',
    description: '你成功打出了第一张卡牌！注意观察上方属性面板的变化，每张卡牌都会影响你的属性。',
    emoji: '✨',
    highlight: 'stats',
    trigger: { type: 'event', eventType: 'card_played' },
    allowSkip: false,
    blocking: true,
    buttonText: '了解属性',
  },
  {
    id: 'stats_intro',
    title: '关注你的属性',
    description:
      '📈 绩效：达到 100 即可晋升获胜\n❤️ 健康：降到 0 会被迫离职\n😊 幸福感：降到 0 会选择躺平\n🎯 影响力：提升你的话语权',
    emoji: '📊',
    highlight: 'stats',
    trigger: { type: 'immediate' },
    allowSkip: false,
    blocking: true,
    buttonText: '了解资源',
  },
  {
    id: 'resources_intro',
    title: '管理你的资源',
    description:
      '💰 薪资：你的收入\n⚡ 精力：每回合可用的行动力\n🤝 人脉：职场社交资源\n📚 技能点：学习和成长',
    emoji: '💼',
    highlight: 'resources',
    trigger: { type: 'immediate' },
    allowSkip: false,
    blocking: true,
    buttonText: '继续',
  },
  {
    id: 'health_warning',
    title: '注意平衡！',
    description:
      '过度加班会损害健康，过度摸鱼会影响绩效。找到适合自己的节奏，在大厂生存的关键是平衡！注意：健康降到 0 会导致游戏失败。',
    emoji: '⚖️',
    highlight: 'stats',
    trigger: { type: 'immediate' },
    allowSkip: false,
    blocking: true,
    buttonText: '明白了',
  },
  {
    id: 'end_turn_intro',
    title: '结束回合',
    description:
      '当你打完想打的牌后，点击"结束回合"按钮进入下一回合。每回合开始会自动抽牌补充手牌。现在试着结束这个回合吧！',
    emoji: '⏭️',
    highlight: 'end_turn_button',
    trigger: { type: 'immediate' },
    allowSkip: false,
    blocking: true,
    buttonText: '结束回合',
    autoAdvance: true,
  },
  {
    id: 'tutorial_complete',
    title: '准备好了！',
    description:
      '太棒了！你已经掌握了基本操作。记住：身体是革命的本钱，合理安排工作和生活，才能在大厂长久生存！祝你好运！',
    emoji: '🚀',
    highlight: 'none',
    trigger: { type: 'event', eventType: 'turn_started' },
    allowSkip: false,
    blocking: true,
    buttonText: '开始奋斗！',
  },
];

/**
 * 首局引导场景
 */
export const firstGameTutorial: TutorialScenario = {
  id: 'first_game',
  type: 'first_game',
  name: '新手引导',
  description: '学习游戏的基本操作',
  steps: firstGameSteps,
};
