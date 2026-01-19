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
  | 'player_action'
  | 'custom';

export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  data: Record<string, unknown>;
}

export type GameEventHandler = (event: GameEvent, state: GameState) => void;

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

  // UI theming
  uiTheme: UITheme;

  // Localization
  localization: Record<string, Record<string, string>>;

  // Custom event handlers
  eventHandlers?: Record<string, GameEventHandler>;

  // Custom win condition checkers
  customWinCheckers?: Record<string, (state: GameState) => boolean>;
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
