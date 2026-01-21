/**
 * "加班的代价"教学关卡页面
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  useGameEngine,
  GameBoard,
  useTheme,
  useTutorial,
  TutorialOverlay,
  overtimeLessonScenario,
} from '@theme-card-games/ui';
import { CardInstance } from '@theme-card-games/core';
import { bigtechWorkerTheme } from '@theme-card-games/theme-bigtech-worker';

/**
 * 创建固定手牌的 CardInstance 数组
 */
function createFixedHand(cardIds: string[]): CardInstance[] {
  return cardIds.map((definitionId, index) => ({
    instanceId: `fixed_${definitionId}_${index}`,
    definitionId,
    state: 'in_hand' as const,
    modifiers: [],
  }));
}

export default function TutorialGameScreen() {
  const { theme } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    gameState,
    currentPlayer,
    isGameOver,
    playCard,
    endTurn,
    resetGame,
    startGame,
    engine,
    t,
  } = useGameEngine({
    theme: bigtechWorkerTheme,
    playerId: 'player1',
    playerName: '学徒',
    autoStart: false, // 不自动开始，等初始化完成后手动开始
  });

  // 引导系统
  const tutorial = useTutorial({ engine });

  // 初始化教学关卡
  useEffect(() => {
    if (!engine || isInitialized) return;

    // 开始游戏
    startGame();

    // 获取当前状态
    const state = engine.state;
    if (!state) return;

    const player = state.players['player1'];
    if (!player) return;

    // 设置固定初始属性
    if (overtimeLessonScenario.initialStats) {
      Object.entries(overtimeLessonScenario.initialStats).forEach(([stat, value]) => {
        if (typeof value === 'number') {
          // 直接修改状态（教学模式特殊处理）
          player.stats[stat] = value;
        }
      });
    }

    // 设置固定初始资源
    if (overtimeLessonScenario.initialResources) {
      Object.entries(overtimeLessonScenario.initialResources).forEach(([resource, value]) => {
        if (typeof value === 'number') {
          player.resources[resource] = value;
        }
      });
    }

    // 设置固定手牌
    if (overtimeLessonScenario.fixedHand) {
      player.hand = createFixedHand(overtimeLessonScenario.fixedHand);
    }

    setIsInitialized(true);

    // 延迟启动引导
    setTimeout(() => {
      tutorial.startScenario(overtimeLessonScenario);
    }, 500);
  }, [engine, isInitialized, startGame, tutorial]);

  const handleCardPlay = useCallback(
    (cardId: string) => {
      const success = playCard(cardId);
      if (success) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [playCard]
  );

  const handleEndTurn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    endTurn();
  }, [endTurn]);

  const handleTutorialNext = useCallback(() => {
    // 检查是否是最后一步，如果是则返回首页
    if (tutorial.currentStep?.id === 'lesson_complete') {
      tutorial.completeScenario();
      tutorial.markOvertimeLessonCompleted();
      router.back();
      return;
    }
    tutorial.nextStep();
  }, [tutorial]);

  const handleTutorialSkip = useCallback(() => {
    tutorial.exitTutorial();
    router.back();
  }, [tutorial]);

  const handleMainMenu = useCallback(() => {
    tutorial.exitTutorial();
    router.back();
  }, [tutorial]);

  if (!gameState || !currentPlayer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} />
    );
  }

  // 教学关卡不显示游戏结束屏幕，而是通过引导步骤控制
  if (isGameOver && !tutorial.isActive) {
    // 如果游戏意外结束（健康降到0等），返回首页
    router.back();
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.gameContainer}>
        <GameBoard
          gameState={gameState}
          themeConfig={bigtechWorkerTheme}
          currentPlayerId="player1"
          onCardPlay={handleCardPlay}
          onEndTurn={handleEndTurn}
          style={styles.gameBoard}
        />

        {/* 引导覆盖层 */}
        <TutorialOverlay
          visible={tutorial.isActive && !!tutorial.currentStep}
          step={tutorial.currentStep}
          onNext={handleTutorialNext}
          onSkip={handleTutorialSkip}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gameContainer: {
    flex: 1,
  },
  gameBoard: {
    flex: 1,
  },
});
