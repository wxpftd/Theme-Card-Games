/**
 * UI 动效组件模块
 *
 * 包含：
 * - StatChangePopup: 属性变化弹出动画
 * - ComboTriggerEffect: 组合触发特效
 * - DangerWarning: 濒死警告
 * - DraggableCard: 可拖拽卡牌
 */

export { StatChangePopup, StatChangePopupContainer, type StatChange } from './StatChangePopup';

export {
  ComboTriggerEffect,
  ComboTriggerContainer,
  type ComboTriggerData,
} from './ComboTriggerEffect';

export { DangerWarning } from './DangerWarning';

export { DraggableCard } from './DraggableCard';

export { useStatChanges } from './useStatChanges';
