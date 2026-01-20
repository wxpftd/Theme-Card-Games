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
