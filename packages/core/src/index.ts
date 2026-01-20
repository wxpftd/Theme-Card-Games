// Main exports
export { GameEngine, GameEngineOptions } from './GameEngine';

// Game mode management
export { GameModeManager, GameModeManagerOptions } from './GameModeManager';
export {
  createSinglePlayerMode,
  createCompetitiveMode,
  createLocalMultiplayerMode,
  createQuick1v1Mode,
  createQuick1v3Mode,
  createEliminationMode,
  type AIPlayerConfig,
  type HumanPlayerConfig,
  type CompetitiveModeOptions,
  type LocalMultiplayerOptions,
} from './gameModes';

// Card system
export {
  Card,
  CardFilter,
  Deck,
  Hand,
  EffectResolver,
  EffectContext,
  CustomEffectHandler,
} from './card';

// State management
export { GameStateManager, GameStateManagerOptions } from './state';

// Turn system
export { TurnManager, TurnPhaseConfig, TurnManagerOptions } from './turn';

// Event system
export { EventBus } from './event';

// Game systems
export {
  ComboSystem,
  ComboSystemOptions,
  StatusEffectSystem,
  StatusEffectSystemOptions,
  CardUpgradeSystem,
  CardUpgradeSystemOptions,
  UpgradeResult,
  RandomEventSystem,
  RandomEventSystemOptions,
  RandomEventCustomHandler,
  // 竞争模式系统
  AIPlayerSystem,
  AIPlayerSystemOptions,
  SharedResourceSystem,
  SharedResourceSystemOptions,
} from './systems';

// AI presets
export {
  EASY_AI_STRATEGY,
  MEDIUM_AI_STRATEGY,
  HARD_AI_STRATEGY,
  EXPERT_AI_STRATEGY,
  AI_PERSONALITY_MODIFIERS,
  getAIStrategyByDifficulty,
  createCustomAIStrategy,
  applyPersonalityModifier,
} from './ai';

// Types
export * from './types';

// Utilities
export * from './utils';
