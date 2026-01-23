/**
 * 卷王养成卡组
 * Hustler Deck - 专注绩效提升，高风险高回报
 */

import type { DeckDefinition } from '@theme-card-games/core';

export const hustlerDeck: DeckDefinition = {
  id: 'hustler_deck',
  name: '卷王养成',
  description: '专注于快速提升绩效的卡组，适合激进玩家。高风险高回报，需要注意健康管理。',
  icon: '💪',
  primarySeries: 'work',
  isPrebuilt: true,
  tags: ['aggressive', 'work-focused', 'high-risk'],
  cards: [
    // 工作卡 (14张) - 核心
    { cardId: 'overtime', count: 3 },
    { cardId: 'overtime_efficient', count: 2 },
    { cardId: 'bug_fix', count: 2 },
    { cardId: 'project_delivery', count: 2 },
    { cardId: 'ppt_presentation', count: 2 },
    { cardId: 'sprint_planning', count: 2 },
    { cardId: 'project_delivery_star', count: 1 },

    // 成长卡 (8张)
    { cardId: 'bootcamp', count: 1 },
    { cardId: 'hackathon', count: 2 },
    { cardId: 'public_speaking', count: 2 },
    { cardId: 'deep_dive', count: 1 },
    { cardId: 'open_source_contribution', count: 2 },

    // 健康卡 (4张) - 最低限度维护
    { cardId: 'coffee_break', count: 2 },
    { cardId: 'power_nap', count: 2 },

    // 意外卡 (2张)
    { cardId: 'production_incident', count: 1 },
    { cardId: 'viral_post', count: 1 },

    // 营商卡 (2张)
    { cardId: 'salary_negotiation', count: 1 },
    { cardId: 'patent_bonus', count: 1 },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export default hustlerDeck;
