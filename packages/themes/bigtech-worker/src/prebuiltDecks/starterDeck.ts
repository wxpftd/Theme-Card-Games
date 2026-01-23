/**
 * 新手入门卡组
 * Starter Deck - 平衡的入门卡组，适合新玩家
 */

import type { DeckDefinition } from '@theme-card-games/core';

export const starterDeck: DeckDefinition = {
  id: 'starter_deck',
  name: '新手入门',
  description: '平衡的入门卡组，包含各种类型的卡牌，适合新玩家熟悉游戏机制。',
  icon: '🎯',
  primarySeries: 'neutral',
  isPrebuilt: true,
  tags: ['starter', 'balanced', 'recommended'],
  cards: [
    // 工作卡 (10张)
    { cardId: 'overtime', count: 2 },
    { cardId: 'coffee_break', count: 3 },
    { cardId: 'slacking', count: 2 },
    { cardId: 'code_review', count: 2 },
    { cardId: 'standup_meeting', count: 1 },

    // 健康卡 (6张)
    { cardId: 'power_nap', count: 2 },
    { cardId: 'morning_jog', count: 2 },
    { cardId: 'healthy_meal', count: 2 },

    // 社交卡 (5张)
    { cardId: 'lunch_networking', count: 2 },
    { cardId: 'internal_sharing', count: 2 },
    { cardId: 'public_praise', count: 1 },

    // 成长卡 (5张)
    { cardId: 'read_technical_book', count: 2 },
    { cardId: 'knowledge_payment', count: 2 },
    { cardId: 'retrospective', count: 1 },

    // 意外卡 (2张)
    { cardId: 'random_bonus', count: 1 },
    { cardId: 'elevator_pitch', count: 1 },

    // 环境卡 (2张)
    { cardId: 'remote_work', count: 1 },
    { cardId: 'office_renovation', count: 1 },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export default starterDeck;
