/**
 * 新手引导 Hook
 * 提供引导状态和控制方法
 */

import { useCallback, useEffect, useRef } from 'react';
import { GameEngine, GameEventType } from '@theme-card-games/core';
import { useTutorialContext } from '../TutorialContext';
import { TutorialScenario } from '../types';

export interface UseTutorialOptions {
  /** 游戏引擎实例 */
  engine: GameEngine | null;

  /** 是否自动启动首局引导 */
  autoStartFirstGame?: boolean;
}

export interface UseTutorialReturn {
  /** 是否在引导中 */
  isActive: boolean;

  /** 当前步骤 */
  currentStep: ReturnType<typeof useTutorialContext>['currentStep'];

  /** 当前步骤索引 */
  currentStepIndex: number;

  /** 总步骤数 */
  totalSteps: number;

  /** 是否已完成首局引导 */
  hasCompletedFirstGame: boolean;

  /** 是否已完成加班教学 */
  hasCompletedOvertimeLesson: boolean;

  /** 开始场景 */
  startScenario: (scenario: TutorialScenario) => void;

  /** 进入下一步 */
  nextStep: () => void;

  /** 跳过当前步骤 */
  skipStep: () => void;

  /** 完成场景 */
  completeScenario: () => void;

  /** 退出引导 */
  exitTutorial: () => void;

  /** 标记首局引导完成 */
  markFirstGameCompleted: () => void;

  /** 标记加班教学完成 */
  markOvertimeLessonCompleted: () => void;

  /** 重置引导状态 */
  resetTutorialState: () => Promise<void>;
}

export function useTutorial(options: UseTutorialOptions): UseTutorialReturn {
  const { engine, autoStartFirstGame = false } = options;

  const context = useTutorialContext();
  const subscribedRef = useRef(false);

  // 监听游戏事件，触发引导步骤
  useEffect(() => {
    if (!engine || !context.isActive || subscribedRef.current) return;

    subscribedRef.current = true;

    const eventTypes: GameEventType[] = [
      'game_started',
      'game_ended',
      'turn_started',
      'turn_ended',
      'card_played',
      'card_discarded',
      'stat_changed',
      'resource_changed',
      'combo_triggered',
    ];

    const unsubscribers: (() => void)[] = [];

    for (const eventType of eventTypes) {
      const unsub = engine.on(eventType, (event, state) => {
        // 构建事件数据
        const eventData: Record<string, unknown> = {
          ...event.data,
        };

        // 对于 stat_changed 事件，添加当前属性值
        if (eventType === 'stat_changed' && state) {
          const playerId = event.data.playerId as string;
          const player = state.players[playerId];
          if (player) {
            Object.entries(player.stats).forEach(([key, value]) => {
              eventData[key] = value;
            });
          }
        }

        // 对于 card_played 事件，统计本回合打出的卡牌数
        if (eventType === 'card_played' && state) {
          const playerId = event.data.playerId as string;
          const player = state.players[playerId];
          if (player) {
            eventData.totalPlayedThisTurn = player.playArea.length;
          }
        }

        context.checkTrigger(eventType, eventData);
      });

      unsubscribers.push(unsub);
    }

    return () => {
      subscribedRef.current = false;
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [engine, context.isActive, context.checkTrigger]);

  // 计算总步骤数
  const totalSteps = context.currentScenario?.steps.length ?? 0;

  return {
    isActive: context.isActive,
    currentStep: context.currentStep,
    currentStepIndex: context.currentStepIndex,
    totalSteps,
    hasCompletedFirstGame: context.hasCompletedFirstGame,
    hasCompletedOvertimeLesson: context.hasCompletedOvertimeLesson,
    startScenario: context.startScenario,
    nextStep: context.nextStep,
    skipStep: context.skipStep,
    completeScenario: context.completeScenario,
    exitTutorial: context.exitTutorial,
    markFirstGameCompleted: context.markFirstGameCompleted,
    markOvertimeLessonCompleted: context.markOvertimeLessonCompleted,
    resetTutorialState: context.resetTutorialState,
  };
}
