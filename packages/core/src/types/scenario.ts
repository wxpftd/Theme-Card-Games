/**
 * Scenario System Type Definitions
 * 场景/环境系统类型定义
 */

import { CardEffect, EffectCondition } from './index';

// ============================================================================
// Scenario Definition (场景定义)
// ============================================================================

/**
 * 场景规则类型
 */
export type ScenarioRuleType =
  | 'elimination_check' // 淘汰检查
  | 'card_restriction' // 卡牌限制
  | 'stat_modifier' // 属性修正
  | 'resource_modifier' // 资源修正
  | 'effect_modifier' // 效果修正
  | 'custom'; // 自定义规则

/**
 * 场景规则定义
 */
export interface ScenarioRule {
  /** 规则类型 */
  type: ScenarioRuleType;
  /** 规则描述 */
  description: string;
  /** 规则间隔 (回合数，用于 elimination_check 等) */
  interval?: number;
  /** 规则值 */
  value?: number | string;
  /** 自定义规则 ID */
  customRuleId?: string;
  /** 相关属性 ID */
  statId?: string;
  /** 相关资源 ID */
  resourceId?: string;
  /** 相关卡牌标签 */
  cardTags?: string[];
}

/**
 * 场景对角色的影响
 */
export interface ScenarioCharacterModifier {
  /** 属性修正 */
  statModifiers?: Record<string, number>;
  /** 每回合属性变化 */
  perTurnStatChanges?: Record<string, number>;
  /** 资源修正 */
  resourceModifiers?: Record<string, number>;
  /** 每回合资源变化 */
  perTurnResourceChanges?: Record<string, number>;
  /** 是否为优势场景 */
  isAdvantage: boolean;
  /** 效果描述 */
  description?: string;
  /** 额外被动效果 */
  passiveEffects?: CardEffect[];
}

/**
 * 场景转换条件
 */
export type ScenarioTransitionCondition =
  | { type: 'turn_count'; turns: number } // 固定回合数后切换
  | { type: 'stat_threshold'; statId: string; operator: string; value: number } // 属性达到阈值
  | { type: 'player_eliminated'; count: number } // 玩家淘汰数达到
  | { type: 'random_chance'; probability: number } // 随机概率
  | { type: 'custom'; checkerId: string }; // 自定义检查

/**
 * 场景定义
 */
export interface ScenarioDefinition {
  /** 场景 ID */
  id: string;
  /** 场景名称 */
  name: string;
  /** 场景描述 */
  description: string;
  /** 场景图标 */
  icon?: string;
  /** 场景背景图片 */
  backgroundImage?: string;
  /** 场景氛围颜色 (用于 UI 主题调整) */
  ambientColor?: string;

  // ==================== 全局效果 ====================
  /** 全局属性修正 (所有玩家) */
  globalStatModifiers?: Record<string, number>;
  /** 全局资源修正 (所有玩家) */
  globalResourceModifiers?: Record<string, number>;
  /** 每回合触发的效果 (所有玩家) */
  perTurnEffects?: CardEffect[];
  /** 场景开始时的效果 */
  onEnterEffects?: CardEffect[];
  /** 场景结束时的效果 */
  onExitEffects?: CardEffect[];

  // ==================== 角色差异化 ====================
  /** 角色修正配置 (角色ID -> 修正配置) */
  characterModifiers?: Record<string, ScenarioCharacterModifier>;

  // ==================== 场景规则 ====================
  /** 场景规则列表 */
  rules?: ScenarioRule[];

  // ==================== 场景持续 ====================
  /** 场景持续回合数 (-1 表示持续到手动切换或条件触发) */
  duration?: number;
  /** 场景转换条件 */
  transitionCondition?: ScenarioTransitionCondition;
  /** 下一个场景 ID (用于链式场景) */
  nextScenarioId?: string;
  /** 可能的下一个场景列表 (用于随机选择) */
  possibleNextScenarios?: {
    scenarioId: string;
    weight: number;
  }[];

  // ==================== 卡牌规则 ====================
  /** 禁用的卡牌标签 */
  bannedCardTags?: string[];
  /** 效果增强的卡牌标签 (标签 -> 增强倍率) */
  enhancedCardTags?: Record<string, number>;
  /** 效果减弱的卡牌标签 (标签 -> 减弱倍率) */
  weakenedCardTags?: Record<string, number>;
}

// ============================================================================
// Scenario State (场景状态)
// ============================================================================

/**
 * 场景运行时状态
 */
export interface ScenarioState {
  /** 当前场景 ID */
  currentScenarioId: string | null;
  /** 场景开始的回合数 */
  scenarioStartTurn: number;
  /** 场景已持续回合数 */
  scenarioTurnsElapsed: number;
  /** 场景历史记录 */
  scenarioHistory: ScenarioHistoryEntry[];
}

/**
 * 场景历史记录条目
 */
export interface ScenarioHistoryEntry {
  /** 场景 ID */
  scenarioId: string;
  /** 开始回合 */
  startTurn: number;
  /** 结束回合 */
  endTurn: number;
  /** 转换原因 */
  transitionReason: string;
}

// ============================================================================
// Scenario Events (场景事件)
// ============================================================================

/**
 * 场景事件类型
 */
export type ScenarioEventType =
  | 'scenario_entered' // 进入场景
  | 'scenario_exited' // 离开场景
  | 'scenario_effect_applied' // 场景效果应用
  | 'scenario_rule_triggered'; // 场景规则触发

/**
 * 场景事件数据
 */
export interface ScenarioEventData {
  /** 事件类型 */
  type: ScenarioEventType;
  /** 场景 ID */
  scenarioId: string;
  /** 场景名称 */
  scenarioName: string;
  /** 回合数 */
  turn: number;
  /** 额外数据 */
  extra?: Record<string, unknown>;
}

// ============================================================================
// Scenario Configuration (场景配置)
// ============================================================================

/**
 * 场景系统配置
 */
export interface ScenarioSystemConfig {
  /** 场景定义列表 */
  scenarios: ScenarioDefinition[];
  /** 初始场景 ID */
  initialScenarioId?: string;
  /** 是否启用自动场景切换 */
  enableAutoTransition: boolean;
  /** 场景切换规则类型 */
  transitionMode: 'sequential' | 'random' | 'conditional';
  /** 顺序切换的场景 ID 列表 */
  sequentialScenarioIds?: string[];
  /** 切换间隔 (回合数，用于 sequential 模式) */
  transitionInterval?: number;
}

// ============================================================================
// Custom Scenario Handlers (自定义场景处理器)
// ============================================================================

/**
 * 自定义场景规则处理器类型
 */
export type CustomScenarioRuleHandler = (
  rule: ScenarioRule,
  scenarioState: ScenarioState,
  gameState: unknown, // GameState - 避免循环依赖
  turn: number
) => void;

/**
 * 自定义场景转换检查器类型
 */
export type CustomScenarioTransitionChecker = (
  scenario: ScenarioDefinition,
  scenarioState: ScenarioState,
  gameState: unknown // GameState - 避免循环依赖
) => boolean;
