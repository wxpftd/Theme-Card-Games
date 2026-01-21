/**
 * 新手引导上下文
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TutorialState,
  TutorialContextValue,
  TutorialScenario,
  TutorialStep,
  TUTORIAL_STORAGE_KEYS,
} from './types';

// ==================== 初始状态 ====================

const initialState: TutorialState = {
  isActive: false,
  currentScenario: null,
  currentStepIndex: 0,
  currentStep: null,
  completedSteps: [],
  hasCompletedFirstGame: false,
  hasCompletedOvertimeLesson: false,
};

// ==================== Action 类型 ====================

type TutorialAction =
  | { type: 'START_SCENARIO'; scenario: TutorialScenario }
  | { type: 'NEXT_STEP' }
  | { type: 'SKIP_STEP' }
  | { type: 'COMPLETE_SCENARIO' }
  | { type: 'EXIT_TUTORIAL' }
  | { type: 'SET_FIRST_GAME_COMPLETED'; value: boolean }
  | { type: 'SET_OVERTIME_LESSON_COMPLETED'; value: boolean }
  | { type: 'ADVANCE_TO_STEP'; stepIndex: number }
  | { type: 'RESET_STATE' };

// ==================== Reducer ====================

function tutorialReducer(state: TutorialState, action: TutorialAction): TutorialState {
  switch (action.type) {
    case 'START_SCENARIO': {
      const scenario = action.scenario;
      const firstStep = scenario.steps[0] ?? null;
      return {
        ...state,
        isActive: true,
        currentScenario: scenario,
        currentStepIndex: 0,
        currentStep: firstStep,
        completedSteps: [],
      };
    }

    case 'NEXT_STEP': {
      if (!state.currentScenario) return state;

      const currentStep = state.currentStep;
      const nextIndex = state.currentStepIndex + 1;
      const nextStep = state.currentScenario.steps[nextIndex] ?? null;

      const newCompletedSteps = currentStep
        ? [...state.completedSteps, currentStep.id]
        : state.completedSteps;

      // 如果没有下一步，完成场景
      if (!nextStep) {
        return {
          ...state,
          isActive: false,
          currentStepIndex: nextIndex,
          currentStep: null,
          completedSteps: newCompletedSteps,
        };
      }

      return {
        ...state,
        currentStepIndex: nextIndex,
        currentStep: nextStep,
        completedSteps: newCompletedSteps,
      };
    }

    case 'SKIP_STEP': {
      if (!state.currentScenario || !state.currentStep) return state;

      const nextIndex = state.currentStepIndex + 1;
      const nextStep = state.currentScenario.steps[nextIndex] ?? null;

      // 如果没有下一步，完成场景
      if (!nextStep) {
        return {
          ...state,
          isActive: false,
          currentStepIndex: nextIndex,
          currentStep: null,
        };
      }

      return {
        ...state,
        currentStepIndex: nextIndex,
        currentStep: nextStep,
      };
    }

    case 'COMPLETE_SCENARIO': {
      return {
        ...state,
        isActive: false,
        currentStep: null,
      };
    }

    case 'EXIT_TUTORIAL': {
      return {
        ...state,
        isActive: false,
        currentScenario: null,
        currentStepIndex: 0,
        currentStep: null,
        completedSteps: [],
      };
    }

    case 'SET_FIRST_GAME_COMPLETED': {
      return {
        ...state,
        hasCompletedFirstGame: action.value,
      };
    }

    case 'SET_OVERTIME_LESSON_COMPLETED': {
      return {
        ...state,
        hasCompletedOvertimeLesson: action.value,
      };
    }

    case 'ADVANCE_TO_STEP': {
      if (!state.currentScenario) return state;

      const step = state.currentScenario.steps[action.stepIndex] ?? null;
      return {
        ...state,
        currentStepIndex: action.stepIndex,
        currentStep: step,
      };
    }

    case 'RESET_STATE': {
      return initialState;
    }

    default:
      return state;
  }
}

// ==================== Context ====================

const TutorialContext = createContext<TutorialContextValue | null>(null);

// ==================== Provider ====================

interface TutorialProviderProps {
  children: React.ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const [state, dispatch] = useReducer(tutorialReducer, initialState);

  // 加载持久化状态
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const [firstGameCompleted, overtimeLessonCompleted] = await Promise.all([
          AsyncStorage.getItem(TUTORIAL_STORAGE_KEYS.FIRST_GAME_COMPLETED),
          AsyncStorage.getItem(TUTORIAL_STORAGE_KEYS.OVERTIME_LESSON_COMPLETED),
        ]);

        if (firstGameCompleted === 'true') {
          dispatch({ type: 'SET_FIRST_GAME_COMPLETED', value: true });
        }

        if (overtimeLessonCompleted === 'true') {
          dispatch({ type: 'SET_OVERTIME_LESSON_COMPLETED', value: true });
        }
      } catch (error) {
        console.warn('Failed to load tutorial state:', error);
      }
    };

    loadPersistedState();
  }, []);

  // Actions
  const startScenario = useCallback((scenario: TutorialScenario) => {
    dispatch({ type: 'START_SCENARIO', scenario });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const skipStep = useCallback(() => {
    dispatch({ type: 'SKIP_STEP' });
  }, []);

  const completeScenario = useCallback(() => {
    dispatch({ type: 'COMPLETE_SCENARIO' });
  }, []);

  const exitTutorial = useCallback(() => {
    dispatch({ type: 'EXIT_TUTORIAL' });
  }, []);

  const checkTrigger = useCallback(
    (eventType: string, data: Record<string, unknown>) => {
      if (!state.isActive || !state.currentStep) return;

      const trigger = state.currentStep.trigger;

      switch (trigger.type) {
        case 'event':
          if (trigger.eventType === eventType) {
            if (state.currentStep.autoAdvance) {
              const delay = state.currentStep.autoAdvanceDelay ?? 500;
              setTimeout(() => dispatch({ type: 'NEXT_STEP' }), delay);
            }
          }
          break;

        case 'card_played':
          if (eventType === 'card_played' && data.cardId === trigger.cardId) {
            if (state.currentStep.autoAdvance) {
              const delay = state.currentStep.autoAdvanceDelay ?? 500;
              setTimeout(() => dispatch({ type: 'NEXT_STEP' }), delay);
            }
          }
          break;

        case 'stat_below':
          if (eventType === 'stat_changed' && trigger.stat && trigger.threshold !== undefined) {
            const statValue = data[trigger.stat] as number;
            if (statValue < trigger.threshold) {
              if (state.currentStep.autoAdvance) {
                const delay = state.currentStep.autoAdvanceDelay ?? 500;
                setTimeout(() => dispatch({ type: 'NEXT_STEP' }), delay);
              }
            }
          }
          break;

        case 'stat_above':
          if (eventType === 'stat_changed' && trigger.stat && trigger.threshold !== undefined) {
            const statValue = data[trigger.stat] as number;
            if (statValue > trigger.threshold) {
              if (state.currentStep.autoAdvance) {
                const delay = state.currentStep.autoAdvanceDelay ?? 500;
                setTimeout(() => dispatch({ type: 'NEXT_STEP' }), delay);
              }
            }
          }
          break;

        case 'combo_triggered':
          if (eventType === 'combo_triggered' && data.comboId === trigger.comboId) {
            if (state.currentStep.autoAdvance) {
              const delay = state.currentStep.autoAdvanceDelay ?? 500;
              setTimeout(() => dispatch({ type: 'NEXT_STEP' }), delay);
            }
          }
          break;

        case 'turn_start':
          if (eventType === 'turn_started') {
            if (state.currentStep.autoAdvance) {
              const delay = state.currentStep.autoAdvanceDelay ?? 500;
              setTimeout(() => dispatch({ type: 'NEXT_STEP' }), delay);
            }
          }
          break;

        case 'cards_played_count':
          if (eventType === 'card_played' && trigger.count !== undefined) {
            const playCount = (data.totalPlayedThisTurn as number) ?? 0;
            if (playCount >= trigger.count) {
              if (state.currentStep.autoAdvance) {
                const delay = state.currentStep.autoAdvanceDelay ?? 500;
                setTimeout(() => dispatch({ type: 'NEXT_STEP' }), delay);
              }
            }
          }
          break;
      }
    },
    [state.isActive, state.currentStep]
  );

  const markFirstGameCompleted = useCallback(async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEYS.FIRST_GAME_COMPLETED, 'true');
      dispatch({ type: 'SET_FIRST_GAME_COMPLETED', value: true });
    } catch (error) {
      console.warn('Failed to save first game completed state:', error);
    }
  }, []);

  const markOvertimeLessonCompleted = useCallback(async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEYS.OVERTIME_LESSON_COMPLETED, 'true');
      dispatch({ type: 'SET_OVERTIME_LESSON_COMPLETED', value: true });
    } catch (error) {
      console.warn('Failed to save overtime lesson completed state:', error);
    }
  }, []);

  const resetTutorialState = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(TUTORIAL_STORAGE_KEYS.FIRST_GAME_COMPLETED),
        AsyncStorage.removeItem(TUTORIAL_STORAGE_KEYS.OVERTIME_LESSON_COMPLETED),
      ]);
      dispatch({ type: 'RESET_STATE' });
    } catch (error) {
      console.warn('Failed to reset tutorial state:', error);
    }
  }, []);

  const contextValue: TutorialContextValue = {
    ...state,
    startScenario,
    nextStep,
    skipStep,
    completeScenario,
    exitTutorial,
    checkTrigger,
    markFirstGameCompleted,
    markOvertimeLessonCompleted,
    resetTutorialState,
  };

  return <TutorialContext.Provider value={contextValue}>{children}</TutorialContext.Provider>;
}

// ==================== Hook ====================

export function useTutorialContext(): TutorialContextValue {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorialContext must be used within a TutorialProvider');
  }
  return context;
}
