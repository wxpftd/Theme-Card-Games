/**
 * 卡组构建系统
 * Deck Building System
 */

export { DeckBuilder } from './DeckBuilder';
export type { DeckBuilderOptions } from './DeckBuilder';

export { DeckValidator } from './DeckValidator';
export type { DeckValidatorOptions } from './DeckValidator';

// Re-export types
export type {
  CardSeries,
  CardDefinitionV2,
  CardUnlockCondition,
  DeckCardEntry,
  DeckDefinition,
  DeckBuildingRules,
  SeriesFocusBonus,
  DeckValidationResult,
  DeckValidationError,
  CardCollection,
  CardSeriesConfig,
} from '../types';

export { DEFAULT_DECK_BUILDING_RULES } from '../types';
