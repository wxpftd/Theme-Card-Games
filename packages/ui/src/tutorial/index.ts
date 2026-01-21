/**
 * 新手引导模块
 */

// Types
export * from './types';

// Context & Provider
export { TutorialProvider, useTutorialContext } from './TutorialContext';

// Hooks
export { useTutorial } from './hooks/useTutorial';
export type { UseTutorialOptions, UseTutorialReturn } from './hooks/useTutorial';
export { useComboHint } from './hooks/useComboHint';

// Components
export { TutorialModal } from './TutorialModal';
export { TutorialOverlay } from './TutorialOverlay';
export { ComboHintBanner } from './ComboHintBanner';

// Scenarios
export { firstGameTutorial } from './scenarios/firstGameTutorial';
export { overtimeLessonScenario } from './scenarios/overtimeLesson';
