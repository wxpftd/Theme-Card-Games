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
  | 'custom';

export type EffectTarget =
  | 'self'
  | 'opponent'
  | 'all_players'
  | 'random_player'
  | 'selected_card'
  | 'all_cards'
  | 'game';

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
