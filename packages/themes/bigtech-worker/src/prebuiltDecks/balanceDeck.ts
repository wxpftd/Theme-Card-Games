/**
 * 佛系打工卡组
 * Balance Deck - 追求工作生活平衡，稳健持久
 */

import type { DeckDefinition } from '@theme-card-games/core';

export const balanceDeck: DeckDefinition = {
  id: 'balance_deck',
  name: '佛系打工',
  description: '追求工作生活平衡的卡组，注重健康和幸福感。适合喜欢稳扎稳打的玩家。',
  icon: '☯️',
  primarySeries: 'health',
  isPrebuilt: true,
  tags: ['defensive', 'balanced', 'sustainable'],
  cards: [
    // 健康卡 (12张) - 核心
    { cardId: 'fitness_habit', count: 2 },
    { cardId: 'mindfulness', count: 3 },
    { cardId: 'power_nap', count: 3 },
    { cardId: 'healthy_meal', count: 2 },
    { cardId: 'sleep_schedule', count: 2 },

    // 工作卡 (8张) - 轻度工作
    { cardId: 'slacking', count: 3 },
    { cardId: 'slacking_pro', count: 2 },
    { cardId: 'coffee_break', count: 3 },

    // 社交卡 (6张)
    { cardId: 'lunch_networking', count: 2 },
    { cardId: 'public_praise', count: 2 },
    { cardId: 'diplomatic_skill', count: 2 },

    // 环境卡 (2张)
    { cardId: 'remote_work', count: 2 },

    // 成长卡 (2张)
    { cardId: 'read_technical_book', count: 2 },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export default balanceDeck;
