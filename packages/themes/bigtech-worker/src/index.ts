export {
  bigtechWorkerTheme,
  default,
  professions,
  personalities,
  defaultCharacters,
  allCharacterDefinitions,
  scenarios,
  defaultScenarioConfig,
  competitiveScenarioConfig,
} from './theme';
export { randomEventCustomHandlers } from './randomEventHandlers';
export { bigtechSummaryTemplates } from './summaryTemplates';

// 导出增强主题和趣味文案
export {
  enhancedUITheme,
  gameStateEmojis,
  feedbackMessages,
  getStateEmoji,
  getRandomFeedback,
} from './enhancedTheme';
export {
  loadingTips,
  turnStartMessages,
  turnEndMessages,
  cardPlayMessages,
  comboTriggerMessages,
  statChangeMessages,
  victoryMessages,
  defeatMessages,
  getRandomTip,
  getCardPlayMessage,
  getComboMessage,
  getStatChangeMessage,
} from './funTexts';

// 导出角色和场景模块
export * from './characters';
export * from './scenarios';

// 导出卡牌系列模块
export {
  allSeriesCards,
  cardsBySeries,
  seriesConfigs,
  getSeriesFocusBonuses,
  getCardsBySeries,
  getCardStats,
  findCardById,
  findCardsByTag,
  findCardsByRarity,
  // 各系列卡牌
  environmentCards,
  businessCards,
  healthCards,
  accidentCards,
  socialCards,
  growthCards,
  workCards,
} from './cards';

// 导出预构筑卡组模块
export {
  prebuiltDecks,
  starterDeck,
  hustlerDeck,
  balanceDeck,
  investorDeck,
  getPrebuiltDeckById,
  getPrebuiltDecksByTag,
  getRecommendedDecks,
} from './prebuiltDecks';
