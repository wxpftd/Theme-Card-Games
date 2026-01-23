export { ComboSystem, type ComboSystemOptions } from './ComboSystem';
export { StatusEffectSystem, type StatusEffectSystemOptions } from './StatusEffectSystem';
export {
  CardUpgradeSystem,
  type CardUpgradeSystemOptions,
  type UpgradeResult,
} from './CardUpgradeSystem';
export {
  RandomEventSystem,
  type RandomEventSystemOptions,
  type RandomEventCustomHandler,
} from './RandomEventSystem';
export {
  AchievementSystem,
  type AchievementSystemOptions,
  type CustomAchievementChecker,
} from './AchievementSystem';
export {
  DifficultySystem,
  type DifficultySystemOptions,
  type CustomDifficultyRuleHandler,
} from './DifficultySystem';
export {
  DailyChallengeSystem,
  type DailyChallengeSystemOptions,
  type CustomChallengeChecker,
} from './DailyChallengeSystem';

// 竞争模式系统
export { AIPlayerSystem, type AIPlayerSystemOptions } from './AIPlayerSystem';
export { SharedResourceSystem, type SharedResourceSystemOptions } from './SharedResourceSystem';

// 分享卡系统
export {
  GameStatsCollector,
  type GameStatsCollectorOptions,
  type HighlightThresholds,
} from './GameStatsCollector';

// 角色系统
export { CharacterSystem, type CharacterSystemOptions } from './CharacterSystem';

// 场景系统
export { ScenarioSystem, type ScenarioSystemOptions } from './ScenarioSystem';

// 游戏结束系统
export {
  GameEndSystem,
  type GameEndSystemOptions,
  type EliminationReason,
  type EliminationCheckResult,
  type FinalRanking,
} from './GameEndSystem';

// 里程碑系统
export {
  MilestoneSystem,
  type MilestoneSystemOptions,
  type MilestoneCheckResult,
  type CustomMilestoneChecker,
} from './MilestoneSystem';

// 骰子系统
export {
  DiceSystem,
  type DiceSystemOptions,
  type DiceConfig,
  type DiceRollResult,
  type DiceChallengeConfig,
  type DiceEffectMapping,
  type DiceHistoryEntry,
  type DiceEffectMetadata,
  type StandardDiceType,
  type DiceEventType,
  type DiceEvent,
} from './DiceSystem';
