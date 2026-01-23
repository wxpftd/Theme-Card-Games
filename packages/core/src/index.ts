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
  // 角色系统
  CharacterSystem,
  CharacterSystemOptions,
  // 场景系统
  ScenarioSystem,
  ScenarioSystemOptions,
  // 游戏结束系统
  GameEndSystem,
  GameEndSystemOptions,
  EliminationReason,
  EliminationCheckResult,
  FinalRanking,
  // 骰子系统
  DiceSystem,
  DiceSystemOptions,
  DiceConfig,
  DiceRollResult,
  DiceChallengeConfig,
  DiceEffectMapping,
  DiceHistoryEntry,
  DiceEffectMetadata,
  StandardDiceType,
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

// Share card system
export {
  ShareCardGenerator,
  DEFAULT_SUMMARY_TEMPLATES,
  type ShareCardGeneratorOptions,
} from './share';
