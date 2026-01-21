/**
 * 新手引导系统类型定义
 */

import { GameState, CardInstance, ComboDefinition } from '@theme-card-games/core';

// ==================== 引导步骤类型 ====================

/** 引导步骤状态 */
export type TutorialStepStatus = 'pending' | 'active' | 'completed' | 'skipped';

/** 高亮目标区域 */
export type HighlightTarget =
  | 'hand' // 手牌区
  | 'stats' // 属性面板
  | 'resources' // 资源面板
  | 'deck' // 牌库
  | 'discard' // 弃牌堆
  | 'end_turn_button' // 结束回合按钮
  | 'card' // 特定卡牌
  | 'combo_banner' // 组合提示横幅
  | 'none'; // 无高亮

/** 引导步骤触发条件 */
export interface TutorialTrigger {
  /** 触发类型 */
  type:
    | 'immediate' // 立即触发
    | 'event' // 事件触发
    | 'card_played' // 打出特定卡牌
    | 'stat_below' // 属性低于阈值
    | 'stat_above' // 属性高于阈值
    | 'combo_triggered' // 组合触发
    | 'turn_start' // 回合开始
    | 'cards_played_count'; // 打出卡牌数量

  /** 事件类型（当 type 为 'event' 时） */
  eventType?: string;

  /** 卡牌 ID（当 type 为 'card_played' 时） */
  cardId?: string;

  /** 属性名（当 type 为 'stat_below' 或 'stat_above' 时） */
  stat?: string;

  /** 阈值（当 type 为 'stat_below' 或 'stat_above' 时） */
  threshold?: number;

  /** 组合 ID（当 type 为 'combo_triggered' 时） */
  comboId?: string;

  /** 计数（当 type 为 'cards_played_count' 时） */
  count?: number;
}

/** 引导步骤配置 */
export interface TutorialStep {
  /** 步骤唯一标识 */
  id: string;

  /** 步骤标题 */
  title: string;

  /** 步骤描述 */
  description: string;

  /** 表情图标 */
  emoji?: string;

  /** 高亮目标 */
  highlight: HighlightTarget;

  /** 高亮特定卡牌 ID（当 highlight 为 'card' 时） */
  highlightCardId?: string;

  /** 触发条件 */
  trigger: TutorialTrigger;

  /** 是否允许跳过此步骤 */
  allowSkip?: boolean;

  /** 是否阻塞游戏操作 */
  blocking?: boolean;

  /** 按钮文本 */
  buttonText?: string;

  /** 完成后自动进入下一步 */
  autoAdvance?: boolean;

  /** 自动进入下一步的延迟（毫秒） */
  autoAdvanceDelay?: number;
}

// ==================== 引导场景类型 ====================

/** 引导场景类型 */
export type TutorialScenarioType = 'first_game' | 'overtime_lesson' | 'custom';

/** 引导场景配置 */
export interface TutorialScenario {
  /** 场景唯一标识 */
  id: string;

  /** 场景类型 */
  type: TutorialScenarioType;

  /** 场景名称 */
  name: string;

  /** 场景描述 */
  description: string;

  /** 引导步骤列表 */
  steps: TutorialStep[];

  /** 固定初始手牌（可选） */
  fixedHand?: string[];

  /** 固定初始属性（可选） */
  initialStats?: Record<string, number>;

  /** 固定初始资源（可选） */
  initialResources?: Record<string, number>;

  /** 完成后回调 */
  onComplete?: () => void;
}

// ==================== 引导状态类型 ====================

/** 引导上下文状态 */
export interface TutorialState {
  /** 当前是否在引导中 */
  isActive: boolean;

  /** 当前场景 */
  currentScenario: TutorialScenario | null;

  /** 当前步骤索引 */
  currentStepIndex: number;

  /** 当前步骤 */
  currentStep: TutorialStep | null;

  /** 已完成的步骤 ID */
  completedSteps: string[];

  /** 是否已完成首局引导 */
  hasCompletedFirstGame: boolean;

  /** 是否已完成加班教学 */
  hasCompletedOvertimeLesson: boolean;
}

/** 引导上下文动作 */
export interface TutorialActions {
  /** 开始场景 */
  startScenario: (scenario: TutorialScenario) => void;

  /** 进入下一步 */
  nextStep: () => void;

  /** 跳过当前步骤 */
  skipStep: () => void;

  /** 完成当前场景 */
  completeScenario: () => void;

  /** 退出引导 */
  exitTutorial: () => void;

  /** 检查事件触发 */
  checkTrigger: (eventType: string, data: Record<string, unknown>) => void;

  /** 标记首局引导完成 */
  markFirstGameCompleted: () => void;

  /** 标记加班教学完成 */
  markOvertimeLessonCompleted: () => void;

  /** 重置引导状态（用于测试） */
  resetTutorialState: () => Promise<void>;
}

/** 引导上下文 */
export interface TutorialContextValue extends TutorialState, TutorialActions {}

// ==================== 组合提示类型 ====================

/** 组合提示状态 */
export interface ComboHint {
  /** 提示的组合定义 */
  combo: ComboDefinition;

  /** 已打出的卡牌（属于该组合） */
  playedCards: string[];

  /** 手牌中可用的卡牌（属于该组合） */
  availableCards: string[];

  /** 还需要的卡牌数量 */
  remainingCount: number;
}

/** 组合提示 Hook 返回值 */
export interface UseComboHintReturn {
  /** 当前提示 */
  currentHint: ComboHint | null;

  /** 已提示次数（本局） */
  hintCount: number;

  /** 已提示的组合 ID 集合 */
  hintedComboIds: Set<string>;

  /** 关闭当前提示 */
  dismissHint: () => void;

  /** 检查组合机会 */
  checkComboOpportunity: (
    hand: CardInstance[],
    playedThisTurn: string[],
    combos: ComboDefinition[]
  ) => ComboHint | null;

  /** 重置提示状态 */
  resetHints: () => void;
}

// ==================== 组件 Props 类型 ====================

/** TutorialOverlay 组件 Props */
export interface TutorialOverlayProps {
  /** 是否可见 */
  visible: boolean;

  /** 当前步骤 */
  step: TutorialStep | null;

  /** 点击下一步回调 */
  onNext: () => void;

  /** 点击跳过回调 */
  onSkip: () => void;
}

/** TutorialModal 组件 Props */
export interface TutorialModalProps {
  /** 是否可见 */
  visible: boolean;

  /** 标题 */
  title: string;

  /** 描述 */
  description: string;

  /** 表情图标 */
  emoji?: string;

  /** 按钮文本 */
  buttonText?: string;

  /** 是否显示跳过按钮 */
  showSkip?: boolean;

  /** 点击按钮回调 */
  onPress: () => void;

  /** 点击跳过回调 */
  onSkip?: () => void;
}

/** ComboHintBanner 组件 Props */
export interface ComboHintBannerProps {
  /** 是否可见 */
  visible: boolean;

  /** 组合提示 */
  hint: ComboHint | null;

  /** 点击关闭回调 */
  onDismiss: () => void;

  /** 翻译函数 */
  t?: (key: string) => string;
}

// ==================== 存储键常量 ====================

export const TUTORIAL_STORAGE_KEYS = {
  FIRST_GAME_COMPLETED: 'tutorial_first_game_completed',
  OVERTIME_LESSON_COMPLETED: 'tutorial_overtime_lesson_completed',
} as const;
