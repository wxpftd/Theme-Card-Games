/**
 * Character System Type Definitions
 * 角色系统类型定义
 */

import { CardEffect, EffectCondition } from './index';

// ============================================================================
// Passive Ability Types (被动技能类型)
// ============================================================================

/**
 * 被动技能触发时机
 */
export type PassiveTrigger =
  | 'turn_start' // 回合开始时
  | 'turn_end' // 回合结束时
  | 'card_played' // 打出卡牌时
  | 'card_drawn' // 抽牌时
  | 'stat_changed' // 属性变化时
  | 'resource_changed' // 资源变化时
  | 'attack_received' // 受到攻击时
  | 'attack_initiated' // 发起攻击时
  | 'status_applied' // 状态被应用时
  | 'status_removed' // 状态被移除时
  | 'game_start' // 游戏开始时
  | 'scenario_changed'; // 场景切换时

/**
 * 被动技能定义
 */
export interface PassiveAbility {
  /** 技能 ID */
  id: string;
  /** 技能名称 */
  name: string;
  /** 技能描述 */
  description: string;
  /** 技能图标 */
  icon?: string;
  /** 触发时机 */
  trigger: PassiveTrigger;
  /** 触发效果 */
  effects: CardEffect[];
  /** 触发条件 (可选) */
  condition?: EffectCondition;
  /** 额外触发数据 (用于特定触发类型) */
  triggerData?: PassiveTriggerData;
}

/**
 * 被动技能触发的额外数据
 */
export interface PassiveTriggerData {
  /** 用于 card_played: 匹配的卡牌标签 */
  cardTags?: string[];
  /** 用于 stat_changed: 属性名称 */
  statId?: string;
  /** 用于 stat_changed: 变化方向 ('increase' | 'decrease' | 'any') */
  changeDirection?: 'increase' | 'decrease' | 'any';
  /** 用于 resource_changed: 资源名称 */
  resourceId?: string;
  /** 效果修正倍率 */
  effectMultiplier?: number;
}

// ============================================================================
// Active Ability Types (主动技能类型)
// ============================================================================

/**
 * 主动技能定义
 */
export interface ActiveAbility {
  /** 技能 ID */
  id: string;
  /** 技能名称 */
  name: string;
  /** 技能描述 */
  description: string;
  /** 技能图标 */
  icon?: string;
  /** 每局游戏最大使用次数 */
  maxUsesPerGame: number;
  /** 使用后冷却回合数 */
  cooldown: number;
  /** 使用消耗的资源 (资源ID -> 消耗数量) */
  cost?: Record<string, number>;
  /** 使用消耗的属性 (属性ID -> 消耗数量) */
  statCost?: Record<string, number>;
  /** 技能效果 */
  effects: CardEffect[];
  /** 是否需要选择目标 */
  needsTarget?: boolean;
  /** 最大可选目标数 */
  maxTargets?: number;
  /** 使用条件 */
  condition?: EffectCondition;
}

// ============================================================================
// Character Definition (角色定义)
// ============================================================================

/**
 * 角色稀有度
 */
export type CharacterRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * 场景亲和度定义
 */
export interface ScenarioAffinity {
  /** 场景 ID */
  scenarioId: string;
  /** 属性修正 */
  statModifiers?: Record<string, number>;
  /** 每回合属性变化 */
  perTurnStatChanges?: Record<string, number>;
  /** 是否为优势场景 */
  isAdvantage: boolean;
  /** 亲和度描述 */
  description?: string;
}

/**
 * 角色定义
 */
export interface CharacterDefinition {
  /** 角色 ID */
  id: string;
  /** 角色名称 */
  name: string;
  /** 角色描述 */
  description: string;
  /** 角色图标 */
  icon: string;
  /** 角色头像图片 */
  avatar?: string;
  /** 角色稀有度 */
  rarity: CharacterRarity;

  // ==================== 职位基础 (适用于 bigtech-worker 主题) ====================
  /** 职位类型 (可选，用于混合设计) */
  profession?: string;
  /** 性格类型 (可选，用于混合设计) */
  personality?: string;

  // ==================== 属性修正 ====================
  /** 起始属性加成 (属性ID -> 加成值) */
  statModifiers: Record<string, number>;
  /** 起始资源加成 (资源ID -> 加成值) */
  resourceModifiers: Record<string, number>;

  // ==================== 卡牌配置 ====================
  /** 专属卡牌 ID 列表 (只有该角色能使用) */
  exclusiveCardIds: string[];
  /** 起始额外卡牌 ID 列表 (游戏开始时加入牌组) */
  startingCardIds: string[];
  /** 禁用卡牌 ID 列表 (该角色无法使用) */
  bannedCardIds?: string[];

  // ==================== 技能系统 ====================
  /** 被动技能列表 */
  passiveAbilities: PassiveAbility[];
  /** 主动技能 (可选，每个角色最多一个主动技能) */
  activeAbility?: ActiveAbility;

  // ==================== 场景适应性 ====================
  /** 场景亲和度配置 (场景ID -> 亲和度配置) */
  scenarioAffinities?: Record<string, ScenarioAffinity>;

  // ==================== 解锁条件 ====================
  /** 解锁条件 (可选) */
  unlockCondition?: CharacterUnlockCondition;
}

/**
 * 角色解锁条件
 */
export type CharacterUnlockCondition =
  | { type: 'achievement'; achievementId: string }
  | { type: 'win_count'; count: number }
  | { type: 'win_with_character'; characterId: string; count: number }
  | { type: 'always_unlocked' };

// ============================================================================
// Player Character State (玩家角色状态)
// ============================================================================

/**
 * 玩家角色状态 (运行时)
 */
export interface PlayerCharacterState {
  /** 角色定义 ID */
  characterId: string;
  /** 主动技能剩余使用次数 */
  activeAbilityUsesRemaining: number;
  /** 主动技能冷却剩余回合 */
  activeAbilityCooldownRemaining: number;
  /** 被动技能触发次数统计 */
  passiveAbilityTriggerCounts: Record<string, number>;
}

// ============================================================================
// Profession and Personality (职位和性格 - bigtech-worker 专用)
// ============================================================================

/**
 * 职位定义 (用于混合设计)
 */
export interface ProfessionDefinition {
  /** 职位 ID */
  id: string;
  /** 职位名称 */
  name: string;
  /** 职位描述 */
  description: string;
  /** 职位图标 */
  icon: string;
  /** 基础属性修正 */
  statModifiers: Record<string, number>;
  /** 基础资源修正 */
  resourceModifiers: Record<string, number>;
  /** 职位被动技能 */
  passiveAbility: PassiveAbility;
  /** 职位主动技能 */
  activeAbility: ActiveAbility;
  /** 专属卡牌 ID 列表 */
  exclusiveCardIds: string[];
}

/**
 * 性格定义 (用于混合设计)
 */
export interface PersonalityDefinition {
  /** 性格 ID */
  id: string;
  /** 性格名称 */
  name: string;
  /** 性格描述 */
  description: string;
  /** 属性修正 */
  statModifiers: Record<string, number>;
  /** 额外被动技能 */
  passiveAbility: PassiveAbility;
}

// ============================================================================
// Character Selection (角色选择)
// ============================================================================

/**
 * 角色选择请求
 */
export interface CharacterSelectionRequest {
  /** 请求 ID */
  requestId: string;
  /** 玩家 ID */
  playerId: string;
  /** 可选角色列表 */
  availableCharacters: CharacterDefinition[];
  /** 已被其他玩家选择的角色 ID 列表 */
  selectedByOthers: string[];
  /** 选择超时时间 (毫秒) */
  timeoutMs?: number;
}

/**
 * 角色选择响应
 */
export interface CharacterSelectionResponse {
  /** 请求 ID */
  requestId: string;
  /** 玩家 ID */
  playerId: string;
  /** 选择的角色 ID */
  selectedCharacterId: string;
  /** 是否超时自动选择 */
  isAutoSelected?: boolean;
}
