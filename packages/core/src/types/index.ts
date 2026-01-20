/**
 * Core type definitions for the card game engine
 */

// ============================================================================
// Card Types
// ============================================================================

export interface CardDefinition {
  id: string;
  type: CardType;
  name: string;
  description: string;
  effects: CardEffect[];
  cost?: number;
  rarity?: CardRarity;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export type CardType = 'action' | 'event' | 'resource' | 'character' | 'modifier';

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface CardInstance {
  instanceId: string;
  definitionId: string;
  state: CardState;
  modifiers: CardModifier[];
}

export type CardState = 'in_deck' | 'in_hand' | 'in_play' | 'discarded' | 'removed';

export interface CardModifier {
  id: string;
  type: string;
  value: number | string | boolean;
  duration?: number; // turns remaining, -1 for permanent
  source?: string;
}

// ============================================================================
// Effect Types
// ============================================================================

export interface CardEffect {
  type: EffectType;
  target: EffectTarget;
  value?: number | string;
  condition?: EffectCondition;
  metadata?: Record<string, unknown>;
}

export type EffectType =
  | 'modify_stat'
  | 'draw_cards'
  | 'discard_cards'
  | 'gain_resource'
  | 'lose_resource'
  | 'trigger_event'
  | 'apply_status'
  | 'remove_status'
  | 'transfer_stat' // 竞争模式: 将自己的属性转移给对手 (甩锅)
  | 'steal_resource' // 竞争模式: 从对手偷取资源
  | 'claim_shared' // 竞争模式: 抢夺共享资源
  | 'damage_stat' // 竞争模式: 直接减少对手属性
  | 'custom';

export type EffectTarget =
  | 'self'
  | 'opponent'
  | 'all_players'
  | 'random_player'
  | 'selected_card'
  | 'all_cards'
  | 'game'
  | 'selected_opponent' // 竞争模式: 需要玩家选择的对手
  | 'all_opponents' // 竞争模式: 所有对手
  | 'weakest_opponent' // 竞争模式: 属性最低的对手
  | 'strongest_opponent'; // 竞争模式: 属性最高的对手

export interface EffectCondition {
  type: 'stat_check' | 'card_count' | 'turn_count' | 'custom';
  operator: '>' | '<' | '==' | '>=' | '<=' | '!=';
  value: number | string;
  target?: string;
}

// ============================================================================
// Player Types
// ============================================================================

export interface PlayerState {
  id: string;
  name: string;
  stats: Record<string, number>;
  resources: Record<string, number>;
  statuses: PlayerStatus[];
  hand: CardInstance[];
  deck: CardInstance[];
  discardPile: CardInstance[];
  playArea: CardInstance[];
}

export interface PlayerStatus {
  id: string;
  name: string;
  duration: number; // -1 for permanent
  effects: CardEffect[];
  description?: string;
  icon?: string;
  stackable?: boolean; // Whether multiple instances can stack
  maxStacks?: number;
  currentStacks?: number;
  onApply?: CardEffect[]; // Effects triggered when status is applied
  onRemove?: CardEffect[]; // Effects triggered when status is removed
  onTurnStart?: CardEffect[]; // Effects triggered at turn start
  onTurnEnd?: CardEffect[]; // Effects triggered at turn end
}

// ============================================================================
// Status Effect Definition (for theme configuration)
// ============================================================================

export interface StatusDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  duration: number; // -1 for permanent, 0 for until condition, positive for turns
  stackable?: boolean;
  maxStacks?: number;
  effects: CardEffect[]; // Passive effects while active
  onApply?: CardEffect[]; // Effects when first applied
  onRemove?: CardEffect[]; // Effects when removed
  onTurnStart?: CardEffect[]; // Effects at start of each turn
  onTurnEnd?: CardEffect[]; // Effects at end of each turn
  triggerCondition?: StatusTriggerCondition; // Auto-trigger condition
}

export interface StatusTriggerCondition {
  type: 'stat_threshold' | 'resource_threshold' | 'card_played' | 'turn_count';
  stat?: string;
  resource?: string;
  operator: '>' | '<' | '==' | '>=' | '<=' | '!=';
  value: number;
  cardTag?: string;
}

// ============================================================================
// Combo System Types
// ============================================================================

export interface ComboDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  // Cards that trigger this combo (by ID or tag)
  trigger: ComboTrigger;
  // Effects to apply when combo is triggered
  effects: CardEffect[];
  // Optional: Status to apply
  applyStatus?: string;
  // Cooldown in turns (0 = can trigger every time)
  cooldown?: number;
}

export type ComboTrigger =
  | { type: 'sequence'; cards: string[] } // Play cards in exact sequence
  | { type: 'combination'; cards: string[] } // Play all cards (any order) in same turn
  | { type: 'tag_sequence'; tags: string[]; count?: number } // Sequence of tags
  | { type: 'tag_count'; tag: string; count: number }; // Play N cards with same tag in one turn

export interface ComboState {
  playedCardsThisTurn: string[]; // Card IDs played this turn
  playedTagsThisTurn: string[]; // Tags of cards played this turn
  recentCards: string[]; // Last N cards played (across turns)
  triggeredCombos: Map<string, number>; // Combo ID -> last triggered turn
}

// ============================================================================
// Card Upgrade System Types
// ============================================================================

export interface CardUpgradeDefinition {
  id: string;
  sourceCardId: string;
  targetCardId: string;
  upgradeCondition: UpgradeCondition;
  description?: string;
}

export type UpgradeCondition =
  | { type: 'use_count'; count: number } // Use card N times
  | { type: 'stat_threshold'; stat: string; operator: string; value: number }
  | { type: 'resource_threshold'; resource: string; operator: string; value: number }
  | { type: 'combo_triggered'; comboId: string; count?: number };

export interface CardUsageTracker {
  cardId: string;
  useCount: number;
  upgraded: boolean;
}

// ============================================================================
// Game State Types
// ============================================================================

export interface GameState {
  id: string;
  phase: GamePhase;
  turn: number;
  currentPlayerId: string;
  players: Record<string, PlayerState>;
  sharedState: Record<string, unknown>;
  history: GameAction[];
  config: GameConfig;
}

export type GamePhase = 'setup' | 'draw' | 'main' | 'action' | 'resolve' | 'end' | 'game_over';

export interface GameConfig {
  maxPlayers: number;
  minPlayers: number;
  initialHandSize: number;
  maxHandSize: number;
  turnTimeLimit?: number; // seconds
  winConditions: WinCondition[];
  initialStats: Record<string, number>;
  initialResources: Record<string, number>;
}

export interface WinCondition {
  type: 'stat_threshold' | 'resource_threshold' | 'turn_limit' | 'custom';
  stat?: string;
  operator?: '>' | '<' | '==' | '>=' | '<=';
  value?: number;
  customCheck?: string;
}

// ============================================================================
// Action Types
// ============================================================================

export interface GameAction {
  id: string;
  type: ActionType;
  playerId: string;
  timestamp: number;
  payload: Record<string, unknown>;
  result?: ActionResult;
}

export type ActionType =
  | 'play_card'
  | 'draw_card'
  | 'discard_card'
  | 'use_ability'
  | 'end_turn'
  | 'select_target'
  | 'respond'
  | 'pass'
  | 'custom';

export interface ActionResult {
  success: boolean;
  effects: ResolvedEffect[];
  message?: string;
}

export interface ResolvedEffect {
  type: EffectType;
  target: string;
  before: unknown;
  after: unknown;
}

// ============================================================================
// Event Types
// ============================================================================

export type GameEventType =
  | 'game_started'
  | 'game_ended'
  | 'turn_started'
  | 'turn_ended'
  | 'phase_changed'
  | 'card_drawn'
  | 'card_played'
  | 'card_discarded'
  | 'effect_triggered'
  | 'stat_changed'
  | 'resource_changed'
  | 'status_applied'
  | 'status_removed'
  | 'status_tick'
  | 'combo_triggered'
  | 'card_upgraded'
  | 'random_event_triggered'
  | 'random_event_skipped'
  | 'player_action'
  | 'achievement_unlocked'
  | 'achievement_rewards_claimed'
  | 'difficulty_changed'
  | 'difficulty_unlocked'
  | 'difficulty_per_turn_effects'
  | 'difficulty_layoff_check'
  | 'difficulty_energy_recovery'
  | 'difficulty_card_cost_modifier'
  | 'daily_challenge_generated'
  | 'daily_challenge_attempt_started'
  | 'daily_challenge_attempt_ended'
  | 'daily_challenge_completed'
  // 竞争模式事件
  | 'ai_turn_started'
  | 'ai_turn_ended'
  | 'ai_decision_made'
  | 'target_selection_requested'
  | 'target_selection_completed'
  | 'shared_resource_claimed'
  | 'shared_resource_renewed'
  | 'shared_resource_depleted'
  | 'stat_transferred'
  | 'resource_stolen'
  | 'player_eliminated'
  | 'competitive_winner'
  | 'custom';

export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  data: Record<string, unknown>;
}

export type GameEventHandler = (event: GameEvent, state: GameState) => void;

// ============================================================================
// Random Event System Types
// ============================================================================

export interface RandomEventDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  // Weight for random selection (higher = more likely)
  weight?: number;
  // Effects to resolve - can be random
  effects: CardEffect[];
  // Random effect options - system will pick one
  randomEffects?: RandomEffectOption[];
  // Condition to check before applying effects
  condition?: RandomEventCondition;
  // Custom handler for complex logic
  customHandler?: string;
}

export interface RandomEffectOption {
  // Probability weight for this option
  weight: number;
  // Description of this outcome
  description: string;
  // Effects if this option is selected
  effects: CardEffect[];
}

export interface RandomEventCondition {
  type: 'stat_check' | 'resource_check' | 'has_status' | 'turn_check' | 'random_chance';
  stat?: string;
  resource?: string;
  status?: string;
  operator?: '>' | '<' | '==' | '>=' | '<=' | '!=';
  value?: number;
  // For random_chance: probability between 0-1
  probability?: number;
}

export interface RandomEventConfig {
  // Trigger every N turns
  triggerInterval: number;
  // Probability of triggering (0-1)
  triggerProbability: number;
  // Maximum events per game (optional)
  maxEventsPerGame?: number;
  // Whether to announce the event before applying
  announceEvent?: boolean;
}

export interface RandomEventResult {
  eventId: string;
  eventName: string;
  description: string;
  selectedOption?: string;
  effects: ResolvedEffect[];
  skipped: boolean;
  skipReason?: string;
}

// ============================================================================
// Theme Types
// ============================================================================

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  version: string;

  // Game configuration
  gameConfig: GameConfig;

  // Card definitions
  cards: CardDefinition[];

  // Stat definitions
  stats: StatDefinition[];

  // Resource definitions
  resources: ResourceDefinition[];

  // Status effect definitions
  statusDefinitions?: StatusDefinition[];

  // Combo definitions
  comboDefinitions?: ComboDefinition[];

  // Card upgrade definitions
  cardUpgrades?: CardUpgradeDefinition[];

  // Random event definitions
  randomEventDefinitions?: RandomEventDefinition[];

  // Random event configuration
  randomEventConfig?: RandomEventConfig;

  // Achievement definitions
  achievementDefinitions?: AchievementDefinition[];

  // Difficulty definitions
  difficultyDefinitions?: DifficultyDefinition[];

  // Daily challenge configuration
  dailyChallengeConfig?: DailyChallengeConfig;

  // UI theming
  uiTheme: UITheme;

  // Localization
  localization: Record<string, Record<string, string>>;

  // Custom event handlers
  eventHandlers?: Record<string, GameEventHandler>;

  // Custom win condition checkers
  customWinCheckers?: Record<string, (state: GameState) => boolean>;

  // Custom achievement checkers
  customAchievementCheckers?: Record<
    string,
    (stats: GameSessionStats, state: GameState) => boolean
  >;

  // Custom challenge checkers
  customChallengeCheckers?: Record<string, (stats: GameSessionStats, state: GameState) => boolean>;

  // Custom difficulty rule handlers
  customDifficultyRuleHandlers?: Record<string, (state: GameState, rule: DifficultyRule) => void>;

  // ============================================================================
  // Competitive Mode Additions
  // ============================================================================

  /** 共享资源定义 (竞争模式) */
  sharedResourceDefinitions?: SharedResourceDefinition[];

  /** 自定义共享资源抢夺规则处理器 */
  customSharedResourceRules?: Record<string, SharedResourceClaimHandler>;

  /** 竞争卡牌 ID 列表 (用于区分竞争卡牌和普通卡牌) */
  competitiveCardIds?: string[];
}

export interface StatDefinition {
  id: string;
  name: string;
  description: string;
  min?: number;
  max?: number;
  icon?: string;
}

export interface ResourceDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface UITheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    accent: string;
    error: string;
    success: string;
    warning: string;
  };
  fonts: {
    regular: string;
    bold: string;
    heading: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    card: number;
  };
  cardStyles: {
    width: number;
    height: number;
    aspectRatio: number;
  };
}

// ============================================================================
// Achievement System Types
// ============================================================================

export type AchievementCategory = 'gameplay' | 'challenge' | 'milestone' | 'hidden';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  // Condition to unlock this achievement
  condition: AchievementCondition;
  // Rewards for unlocking
  rewards?: AchievementReward[];
  // Whether this is a hidden achievement (description hidden until unlocked)
  hidden?: boolean;
  // Points awarded for this achievement
  points?: number;
}

export type AchievementCondition =
  | { type: 'card_usage'; cardTag: string; count: number; inSingleGame?: boolean }
  | {
      type: 'stat_maintained';
      stat: string;
      operator: '>=' | '<=' | '>' | '<';
      value: number;
      forEntireGame: boolean;
    }
  | { type: 'stat_reached'; stat: string; operator: '>=' | '<=' | '>' | '<' | '=='; value: number }
  | { type: 'stat_recovered'; stat: string; fromBelow: number; toAbove: number }
  | { type: 'win_within_turns'; maxTurns: number }
  | { type: 'win_with_condition'; conditionId: string }
  | { type: 'custom'; checkerId: string };

export interface AchievementReward {
  type: 'card_skin' | 'buff' | 'title' | 'points' | 'unlock_card' | 'custom';
  value: string | number;
  description?: string;
}

export interface AchievementProgress {
  achievementId: string;
  currentValue: number;
  targetValue: number;
  unlocked: boolean;
  unlockedAt?: number;
  claimed?: boolean;
}

export interface AchievementState {
  // All unlocked achievements
  unlockedAchievements: string[];
  // Progress for in-progress achievements
  progress: Record<string, AchievementProgress>;
  // Total achievement points
  totalPoints: number;
  // Claimed rewards
  claimedRewards: string[];
}

// Tracking data collected during a game session
export interface GameSessionStats {
  cardUsage: Record<string, number>; // cardTag -> count
  statHistory: Record<string, number[]>; // stat -> history of values
  minStats: Record<string, number>; // stat -> minimum value reached
  maxStats: Record<string, number>; // stat -> maximum value reached
  turnsPlayed: number;
  cardsPlayed: string[]; // card IDs played in order
  won: boolean;
  startTime: number;
  endTime?: number;
}

// ============================================================================
// Difficulty System Types
// ============================================================================

export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'hell';

export interface DifficultyDefinition {
  id: DifficultyLevel;
  name: string;
  description: string;
  icon?: string;
  // Stat modifiers (override initial values)
  initialStats?: Record<string, number>;
  // Resource modifiers
  initialResources?: Record<string, number>;
  // Per-turn modifiers
  perTurnStatChanges?: Record<string, number>;
  perTurnResourceChanges?: Record<string, number>;
  // Special rules
  specialRules?: DifficultyRule[];
  // Score multiplier for achievements
  scoreMultiplier?: number;
  // Whether this difficulty needs to be unlocked
  unlockCondition?: AchievementCondition;
}

export interface DifficultyRule {
  type: 'layoff_check' | 'energy_recovery' | 'card_cost_modifier' | 'custom';
  // For layoff_check: check every N turns
  interval?: number;
  // Modifier value
  value?: number;
  // Custom rule ID
  customRuleId?: string;
  description?: string;
}

export interface DifficultyConfig {
  currentDifficulty: DifficultyLevel;
  unlockedDifficulties: DifficultyLevel[];
}

// ============================================================================
// Daily Challenge System Types
// ============================================================================

export interface DailyChallengeDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  // Conditions that must be met to complete the challenge
  conditions: ChallengeCondition[];
  // Rewards for completing
  rewards: AchievementReward[];
  // Difficulty rating (1-5)
  difficulty: number;
  // Tags for categorization
  tags?: string[];
}

export type ChallengeCondition =
  | { type: 'no_card_tag'; tag: string } // Cannot use cards with this tag
  | { type: 'max_resource_usage'; resource: string; max: number }
  | { type: 'min_stat_at_win'; stat: string; min: number }
  | { type: 'max_turns'; turns: number }
  | { type: 'no_card_type'; cardType: CardType }
  | { type: 'min_card_usage'; cardTag: string; count: number }
  | { type: 'custom'; checkerId: string };

export interface DailyChallengeState {
  // Current daily challenge (generated from seed based on date)
  currentChallenge: DailyChallengeInstance | null;
  // History of completed challenges
  completedChallenges: string[];
  // Current streak of consecutive days completing challenges
  currentStreak: number;
  // Best streak ever achieved
  bestStreak: number;
  // Last completion date (YYYY-MM-DD format)
  lastCompletionDate?: string;
}

export interface DailyChallengeInstance {
  definitionId: string;
  date: string; // YYYY-MM-DD
  seed: number;
  completed: boolean;
  attemptCount: number;
  bestAttempt?: DailyChallengeAttempt;
}

export interface DailyChallengeAttempt {
  timestamp: number;
  turnsPlayed: number;
  conditionsMet: boolean[];
  success: boolean;
}

export interface DailyChallengeConfig {
  // Available challenge pool
  challengePool: DailyChallengeDefinition[];
  // Streak bonuses
  streakBonuses?: StreakBonus[];
}

export interface StreakBonus {
  streakLength: number;
  bonus: AchievementReward;
}

// ============================================================================
// AI Player System Types
// ============================================================================

export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface AIStrategyConfig {
  /** AI 难度等级 */
  difficulty: AIDifficulty;
  /** 攻击性 (0-1): 越高越倾向于使用攻击性卡牌 */
  aggressiveness: number;
  /** 防御性 (0-1): 越高越倾向于保护自身属性 */
  defensiveness: number;
  /** 贪婪度 (0-1): 越高越倾向于抢夺共享资源 */
  greed: number;
  /** 风险偏好 (0-1): 越高越愿意使用高风险卡牌 */
  riskTolerance: number;
  /** 思考延迟 (ms): 模拟思考时间，提升用户体验 */
  thinkingDelay: number;
}

export interface AIPlayerState {
  /** 玩家 ID */
  playerId: string;
  /** AI 策略配置 */
  strategyConfig: AIStrategyConfig;
  /** AI 记忆: 记录对手行为模式 */
  memory: AIMemory;
}

export interface AIMemory {
  /** 每个对手打出的卡牌历史 */
  opponentCardHistory: Record<string, string[]>;
  /** 每个对手的威胁评分 */
  threatScores: Record<string, number>;
  /** 已被抢夺的共享资源 */
  claimedResources: string[];
}

export interface AIDecision {
  /** 决策类型 */
  action: 'play_card' | 'end_turn' | 'claim_resource';
  /** 卡牌 ID (如果是出牌动作) */
  cardId?: string;
  /** 目标玩家 ID (如果卡牌需要目标) */
  targetPlayerId?: string;
  /** 共享资源 ID (如果是抢夺资源动作) */
  resourceId?: string;
  /** 决策置信度 (0-1) */
  confidence: number;
  /** 决策原因 (用于调试) */
  reason?: string;
}

// ============================================================================
// Shared Resource System Types
// ============================================================================

export interface SharedResourceDefinition {
  /** 资源唯一标识 */
  id: string;
  /** 资源名称 */
  name: string;
  /** 资源描述 */
  description: string;
  /** 资源图标 */
  icon?: string;
  /** 资源总量 */
  totalAmount: number;
  /** 是否可再生 */
  renewable: boolean;
  /** 再生间隔 (回合数) */
  renewalInterval?: number;
  /** 每次再生数量 */
  renewalAmount?: number;
  /** 资源抢夺规则 */
  claimRules: SharedResourceClaimRule[];
  /** 抢夺成功后的效果 */
  claimEffects?: CardEffect[];
  /** 资源耗尽时的事件 */
  onDepletedEvent?: string;
}

export interface SharedResourceClaimRule {
  /** 抢夺规则类型 */
  type: 'first_come' | 'highest_stat' | 'lowest_stat' | 'random' | 'auction' | 'custom';
  /** 用于比较的属性名 (用于 highest_stat/lowest_stat) */
  statId?: string;
  /** 自定义规则 ID */
  customRuleId?: string;
  /** 规则描述 */
  description?: string;
}

export interface SharedResourceState {
  /** 资源定义 ID */
  resourceId: string;
  /** 当前剩余数量 */
  currentAmount: number;
  /** 已抢夺记录: playerId -> 抢夺数量 */
  claimedBy: Record<string, number>;
  /** 上次再生的回合 */
  lastRenewalTurn: number;
}

export interface SharedResourceClaimResult {
  /** 是否抢夺成功 */
  success: boolean;
  /** 抢夺的数量 */
  amountClaimed: number;
  /** 失败原因 */
  failureReason?: string;
  /** 触发的效果 */
  effects?: ResolvedEffect[];
}

export type SharedResourceClaimHandler = (
  resourceDef: SharedResourceDefinition,
  resourceState: SharedResourceState,
  playerId: string,
  gameState: GameState,
  ruleIndex: number
) => SharedResourceClaimResult;

// ============================================================================
// Competitive Mode Types
// ============================================================================

export type GameModeType = 'single_player' | 'local_multiplayer' | 'competitive';

export interface GameModeConfig {
  /** 游戏模式类型 */
  type: GameModeType;
  /** 玩家配置列表 */
  players: PlayerConfig[];
  /** 竞争模式专属配置 */
  competitiveConfig?: CompetitiveConfig;
}

export interface PlayerConfig {
  /** 玩家 ID */
  id: string;
  /** 玩家名称 */
  name: string;
  /** 是否为 AI 玩家 */
  isAI: boolean;
  /** AI 策略配置 (仅 AI 玩家需要) */
  aiConfig?: AIStrategyConfig;
}

export interface CompetitiveConfig {
  /** 是否启用共享资源 */
  enableSharedResources: boolean;
  /** 是否启用竞争卡牌 */
  enableCompetitiveCards: boolean;
  /** 是否启用目标选择 (多对手时) */
  enableTargetSelection: boolean;
  /** 竞争胜利条件 */
  competitiveWinCondition?: CompetitiveWinCondition;
  /** 每回合可攻击次数限制 */
  attacksPerTurn?: number;
}

export interface CompetitiveWinCondition {
  /** 胜利类型 */
  type: 'first_to_threshold' | 'highest_at_turn_limit' | 'last_standing' | 'custom';
  /** 阈值属性 */
  stat?: string;
  /** 阈值 */
  threshold?: number;
  /** 回合限制 */
  turnLimit?: number;
  /** 自定义检查器 ID */
  customCheckerId?: string;
}

// ============================================================================
// Target Selection Types
// ============================================================================

export interface TargetSelectionRequest {
  /** 请求 ID */
  requestId: string;
  /** 源卡牌 ID */
  sourceCardId: string;
  /** 源玩家 ID */
  sourcePlayerId: string;
  /** 可选目标玩家列表 */
  validTargets: string[];
  /** 目标选择原因/描述 */
  reason: string;
  /** 是否允许取消 */
  allowCancel: boolean;
  /** 最小选择数量 */
  minTargets: number;
  /** 最大选择数量 */
  maxTargets: number;
}

export interface TargetSelectionResponse {
  /** 请求 ID */
  requestId: string;
  /** 是否取消 */
  cancelled: boolean;
  /** 选中的目标玩家 ID 列表 */
  selectedTargets: string[];
}

// ============================================================================
// Share Card System Types (分享卡系统类型)
// ============================================================================

/** 名场面事件类型 */
export type HighlightEventType =
  | 'near_death_recovery' // 濒死逆袭
  | 'massive_stat_change' // 属性巨变
  | 'combo_triggered' // 连击触发
  | 'perfect_defense' // 完美防守
  | 'lucky_escape' // 幸运逃脱
  | 'resource_windfall' // 资源横财
  | 'blame_shifted' // 成功甩锅
  | 'credit_stolen' // 抢功成功
  | 'survived_attack' // 承受攻击
  | 'final_comeback'; // 绝地反击

/** 名场面事件 */
export interface HighlightEvent {
  /** 事件唯一标识 */
  id: string;
  /** 事件类型 */
  type: HighlightEventType;
  /** 发生回合 */
  turn: number;
  /** 事件描述 */
  description: string;
  /** 事件图标 */
  icon: string;
  /** 额外数据 */
  data: Record<string, unknown>;
  /** 精彩程度 (1-10) */
  intensity: number;
}

/** 竞争模式统计 */
export interface CompetitiveStats {
  /** 甩锅次数 */
  blameShiftCount: number;
  /** 成功甩锅次数 */
  blameShiftSuccessCount: number;
  /** 抢功次数 */
  creditStealCount: number;
  /** 抢夺资源总量 */
  resourcesStolenAmount: number;
  /** 受到攻击次数 */
  attacksReceived: number;
  /** 发起攻击次数 */
  attacksInitiated: number;
  /** 共享资源抢夺次数 */
  sharedResourceClaims: number;
  /** 被甩锅次数 */
  blamedCount: number;
}

/** 玩家对战报告 */
export interface PlayerBattleReport {
  /** 玩家 ID */
  playerId: string;
  /** 玩家名称 */
  playerName: string;
  /** 最终排名 */
  rank: number;
  /** 是否存活 */
  survived: boolean;
  /** 淘汰回合 (如被淘汰) */
  eliminatedAtTurn?: number;
  /** 最终属性 */
  finalStats: Record<string, number>;
  /** 竞争统计 */
  competitiveStats: CompetitiveStats;
  /** 名场面事件 */
  highlights: HighlightEvent[];
}

/** 对战战报 */
export interface BattleReport {
  /** 游戏 ID */
  gameId: string;
  /** 总回合数 */
  totalTurns: number;
  /** 赢家 ID */
  winnerId: string | null;
  /** 赢家名称 */
  winnerName?: string;
  /** 各玩家报告 */
  playerReports: PlayerBattleReport[];
  /** 游戏开始时间 */
  startTime: number;
  /** 游戏结束时间 */
  endTime: number;
  /** 游戏模式 */
  gameMode: GameModeType;
  /** 特殊称号 (甩锅王、抢功王等) */
  specialTitles: SpecialTitle[];
}

/** 特殊称号 */
export interface SpecialTitle {
  /** 称号 ID */
  titleId: string;
  /** 称号名称 */
  titleName: string;
  /** 获得者 ID */
  playerId: string;
  /** 获得者名称 */
  playerName: string;
  /** 称号图标 */
  icon: string;
  /** 描述 */
  description: string;
}

/** 生存报告分享卡数据 */
export interface SurvivalReportShareCard {
  /** 卡片类型 */
  type: 'survival_report';
  /** 玩家名称 */
  playerName: string;
  /** 是否胜利 */
  isVictory: boolean;
  /** 存活回合数 */
  turnsPlayed: number;
  /** 最终属性 */
  finalStats: Record<string, number>;
  /** 最终资源 */
  finalResources: Record<string, number>;
  /** 名场面 (最多3个) */
  highlights: HighlightEvent[];
  /** 一句话总结 */
  summary: string;
  /** 成就徽章 (可选, 如果本局解锁) */
  unlockedAchievements?: string[];
  /** 游戏会话统计 */
  sessionStats: GameSessionStats;
  /** 生成时间 */
  generatedAt: number;
}

/** 成就徽章分享卡数据 */
export interface AchievementBadgeShareCard {
  /** 卡片类型 */
  type: 'achievement_badge';
  /** 玩家名称 */
  playerName: string;
  /** 成就 ID */
  achievementId: string;
  /** 成就名称 */
  achievementName: string;
  /** 成就描述 */
  achievementDescription: string;
  /** 成就图标 */
  achievementIcon?: string;
  /** 成就稀有度 */
  achievementRarity: AchievementRarity;
  /** 成就故事 (根据解锁情况生成的个性化文字) */
  achievementStory: string;
  /** 成就点数 */
  points: number;
  /** 解锁时间 */
  unlockedAt: number;
  /** 生成时间 */
  generatedAt: number;
}

/** 对战战报分享卡数据 */
export interface BattleReportShareCard {
  /** 卡片类型 */
  type: 'battle_report';
  /** 对战战报 */
  battleReport: BattleReport;
  /** 当前玩家 ID (分享视角) */
  currentPlayerId: string;
  /** 一句话总结 */
  summary: string;
  /** 生成时间 */
  generatedAt: number;
}

/** 分享卡联合类型 */
export type ShareCard = SurvivalReportShareCard | AchievementBadgeShareCard | BattleReportShareCard;

/** 扩展的游戏会话统计 (用于分享功能) */
export interface ExtendedGameSessionStats extends GameSessionStats {
  /** 名场面事件列表 */
  highlights: HighlightEvent[];
  /** 竞争模式统计 (仅多人模式) */
  competitiveStats?: CompetitiveStats;
  /** 游戏模式 */
  gameMode: GameModeType;
  /** 玩家名称 */
  playerName: string;
  /** 玩家 ID */
  playerId: string;
}

/** 一句话总结模板 */
export interface SummaryTemplate {
  /** 模板 ID */
  id: string;
  /** 模板类型 */
  type: 'victory' | 'defeat' | 'competitive_win' | 'competitive_lose' | 'special';
  /** 触发条件 */
  condition: SummaryCondition;
  /** 模板文本 (支持变量插值) */
  template: string;
  /** 优先级 (越高越优先匹配) */
  priority: number;
}

/** 总结模板条件 */
export type SummaryCondition =
  | { type: 'victory' }
  | { type: 'defeat'; reason: 'health_zero' | 'resource_depleted' | 'turn_limit' | 'any' }
  | { type: 'highlight_exists'; highlightType: HighlightEventType }
  | { type: 'stat_reached'; stat: string; operator: '>=' | '<=' | '>' | '<'; value: number }
  | { type: 'competitive_title'; titleId: string }
  | { type: 'always' };
