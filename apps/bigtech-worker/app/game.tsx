import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  useGameEngine,
  GameBoard,
  GameOverScreen,
  useTheme,
  useTutorial,
  useComboHint,
  TutorialOverlay,
  TutorialModal,
  ComboHintBanner,
  firstGameTutorial,
} from '@theme-card-games/ui';
import { ComboDefinition } from '@theme-card-games/core';
import { bigtechWorkerTheme } from '@theme-card-games/theme-bigtech-worker';

export default function GameScreen() {
  const { theme } = useTheme();
  const playedCardsThisTurnRef = useRef<string[]>([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // 使用 useMemo 稳定化 multiplayer 配置，避免每次渲染创建新对象
  const multiplayerConfig = useMemo(
    () => ({
      enabled: true,
      aiOpponents: [{ id: 'ai1', name: 'AI 对手', difficulty: 'medium' as const }],
    }),
    []
  );

  const {
    gameState,
    currentPlayer,
    isGameOver,
    winner,
    startGame,
    endTurn,
    resetGame,
    engine,
    t,
    opponents,
    aiThinking,
    isAIPlayer,
  } = useGameEngine({
    theme: bigtechWorkerTheme,
    playerId: 'player1',
    playerName: '打工人',
    autoStart: true,
    multiplayer: multiplayerConfig,
  });

  // 引导系统
  const tutorial = useTutorial({ engine });

  // 组合提示系统
  const comboHint = useComboHint();

  // 首局引导检测
  useEffect(() => {
    if (gameState && !tutorial.hasCompletedFirstGame && !tutorial.isActive) {
      // 显示欢迎弹窗
      setShowWelcomeModal(true);
    }
  }, [gameState, tutorial.hasCompletedFirstGame, tutorial.isActive]);

  // 监听回合开始，重置本回合打出的卡牌记录
  useEffect(() => {
    if (!engine) return;

    const unsubscribe = engine.on('turn_started', () => {
      playedCardsThisTurnRef.current = [];
      comboHint.resetHints();
    });

    return unsubscribe;
  }, [engine, comboHint.resetHints]);

  // 监听游戏结束，标记首局引导完成
  useEffect(() => {
    if (isGameOver && !tutorial.hasCompletedFirstGame) {
      tutorial.markFirstGameCompleted();
    }
  }, [isGameOver, tutorial.hasCompletedFirstGame, tutorial.markFirstGameCompleted]);

  const handleStartTutorial = useCallback(() => {
    setShowWelcomeModal(false);
    tutorial.startScenario(firstGameTutorial);
  }, [tutorial]);

  const handleSkipTutorial = useCallback(() => {
    setShowWelcomeModal(false);
    tutorial.markFirstGameCompleted();
  }, [tutorial]);

  // 多卡打出后的回调（新接口）
  const handleCardsPlayed = useCallback(
    (cardIds: string[], triggeredCombo: ComboDefinition | null) => {
      // 触觉反馈
      if (triggeredCombo) {
        // combo 触发时使用更强的反馈
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (cardIds.length > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // 记录打出的卡牌
      for (const cardId of cardIds) {
        const playedCard = currentPlayer?.hand.find((c) => c.instanceId === cardId);
        if (playedCard) {
          playedCardsThisTurnRef.current.push(playedCard.definitionId);
        }
      }

      // 检查组合机会（仅在非引导模式下）
      if (!tutorial.isActive && currentPlayer && bigtechWorkerTheme.comboDefinitions) {
        // 使用新的手牌（排除刚打出的卡）
        const cardIdSet = new Set(cardIds);
        const newHand = currentPlayer.hand.filter((c) => !cardIdSet.has(c.instanceId));
        comboHint.checkComboOpportunity(
          newHand,
          playedCardsThisTurnRef.current,
          bigtechWorkerTheme.comboDefinitions
        );
      }
    },
    [currentPlayer, tutorial.isActive, comboHint]
  );

  const handleEndTurn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    endTurn();
  }, [endTurn]);

  const handleRestart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    resetGame();
    startGame();
    playedCardsThisTurnRef.current = [];
    comboHint.resetHints();
  }, [resetGame, startGame, comboHint]);

  const handleMainMenu = useCallback(() => {
    router.back();
  }, []);

  const handleTutorialNext = useCallback(() => {
    tutorial.nextStep();
  }, [tutorial]);

  const handleTutorialSkip = useCallback(() => {
    tutorial.exitTutorial();
    tutorial.markFirstGameCompleted();
  }, [tutorial]);

  if (!gameState || !currentPlayer) {
    return (
      <SafeAreaView
        testID="game-loading"
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      />
    );
  }

  if (isGameOver) {
    const winnerPlayer = winner ? (gameState.players[winner] ?? null) : null;

    let reason = '';
    if (currentPlayer.stats.performance >= 100) {
      reason = '绩效满分，成功晋升！';
    } else if (currentPlayer.stats.health <= 0) {
      reason = '身体扛不住了，被迫离职休养...';
    } else if (currentPlayer.stats.happiness <= 0) {
      reason = '太累了，选择躺平离开...';
    } else if (gameState.turn >= 30) {
      reason = '一年过去了，是时候总结一下了';
    }

    return (
      <SafeAreaView
        testID="game-over-screen"
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <GameOverScreen
          winner={winnerPlayer}
          reason={reason}
          player={currentPlayer}
          statDefinitions={bigtechWorkerTheme.stats}
          resourceDefinitions={bigtechWorkerTheme.resources}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
          style={styles.gameOver}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      testID="game-screen"
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View testID="game-container" style={styles.gameContainer}>
        <GameBoard
          gameState={gameState}
          themeConfig={bigtechWorkerTheme}
          currentPlayerId="player1"
          engine={engine}
          onCardsPlayed={handleCardsPlayed}
          onEndTurn={handleEndTurn}
          style={styles.gameBoard}
          opponents={opponents}
          isAIPlayer={isAIPlayer}
          aiThinking={aiThinking}
        />

        {/* 组合提示横幅 */}
        <ComboHintBanner
          visible={!!comboHint.currentHint && !tutorial.isActive}
          hint={comboHint.currentHint}
          onDismiss={comboHint.dismissHint}
          t={t}
        />

        {/* 引导覆盖层 */}
        <TutorialOverlay
          visible={tutorial.isActive && !!tutorial.currentStep}
          step={tutorial.currentStep}
          onNext={handleTutorialNext}
          onSkip={handleTutorialSkip}
        />
      </View>

      {/* 首局欢迎弹窗 */}
      <TutorialModal
        visible={showWelcomeModal}
        title="欢迎来到大厂！"
        description="这是你的第一局游戏，是否需要引导教程？教程会帮助你了解游戏的基本操作。"
        emoji="🎮"
        buttonText="开始引导"
        showSkip={true}
        onPress={handleStartTutorial}
        onSkip={handleSkipTutorial}
      />
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
  gameOver: {
    flex: 1,
  },
});
