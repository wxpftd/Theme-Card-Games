/**
 * 投资理财卡组
 * Investor Deck - 专注财务增长和被动收入
 */

import type { DeckDefinition } from '@theme-card-games/core';

export const investorDeck: DeckDefinition = {
  id: 'investor_deck',
  name: '投资理财',
  description: '专注于财务增长和被动收入的卡组。通过投资和副业积累财富，实现财务自由。',
  icon: '💰',
  primarySeries: 'business',
  isPrebuilt: true,
  tags: ['financial', 'passive-income', 'long-term'],
  cards: [
    // 营商卡 (14张) - 核心
    { cardId: 'side_hustle_start', count: 2 },
    { cardId: 'freelance_gig', count: 3 },
    { cardId: 'stock_dip', count: 3 },
    { cardId: 'angel_investment', count: 1 },
    { cardId: 'knowledge_payment', count: 2 },
    { cardId: 'salary_negotiation', count: 2 },
    { cardId: 'partnership_offer', count: 1 },

    // 工作卡 (6张) - 维持基本绩效
    { cardId: 'overtime', count: 2 },
    { cardId: 'code_review', count: 2 },
    { cardId: 'ppt_presentation', count: 2 },

    // 社交卡 (4张) - 积累人脉资源
    { cardId: 'lunch_networking', count: 2 },
    { cardId: 'build_reputation', count: 2 },

    // 成长卡 (4张)
    { cardId: 'cross_learning', count: 2 },
    { cardId: 'read_technical_book', count: 2 },

    // 意外卡 (2张)
    { cardId: 'random_bonus', count: 1 },
    { cardId: 'lottery_win', count: 1 },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export default investorDeck;
