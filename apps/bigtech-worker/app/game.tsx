import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, SafeAreaView, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  useGameEngine,
  EnhancedGameBoard,
  EnhancedGameOverScreen,
  useTheme,
  useTutorial,
  useComboHint,
  TutorialOverlay,
  TutorialModal,
  ComboHintBanner,
  firstGameTutorial,
} from '@theme-card-games/ui';
import { ComboDefinition } from '@theme-card-games/core';
import {
  bigtechWorkerTheme,
  getRandomTip,
  turnStartMessages,
  victoryMessages,
  defeatMessages,
} from '@theme-card-games/theme-bigtech-worker';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const gameBgImage = require('../assets/images/game_bg.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const victoryBgImage = require('../assets/images/victory_bg.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const defeatBgImage = require('../assets/images/defeat_bg.png');

// Force Metro to reload dependencies - timestamp: 2026-01-30T11:30

export default function GameScreen() {
  const { theme } = useTheme();
  const playedCardsThisTurnRef = useRef<string[]>([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [turnMessage, setTurnMessage] = useState<string | null>(null);

  // 使用 useMemo 稳定化 multiplayer 配置
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
      setShowWelcomeModal(true);
    }
  }, [gameState, tutorial.hasCompletedFirstGame, tutorial.isActive]);

  // 监听回合开始
  useEffect(() => {
    if (!engine) return;

    const unsubscribe = engine.on('turn_started', () => {
      playedCardsThisTurnRef.current = [];
      comboHint.resetHints();

      // 显示回合开始消息
      if (gameState?.currentPlayerId === 'player1') {
        setTurnMessage(getRandomTip(turnStartMessages));
        setTimeout(() => setTurnMessage(null), 2500);
      }
    });

    return unsubscribe;
  }, [engine, comboHint.resetHints, gameState?.currentPlayerId]);

  // 监听游戏结束
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

  // 多卡打出后的回调
  const handleCardsPlayed = useCallback(
    (cardIds: string[], triggeredCombo: ComboDefinition | null) => {
      // 触觉反馈
      if (triggeredCombo) {
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

      // 检查组合机会
      if (!tutorial.isActive && currentPlayer && bigtechWorkerTheme.comboDefinitions) {
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
      <ImageBackground
        source={gameBgImage}
        style={styles.loadingContainer}
        imageStyle={{ opacity: 0.3 }}
      >
        <SafeAreaView
          testID="game-loading"
          style={[styles.container, { backgroundColor: 'transparent' }]}
        />
      </ImageBackground>
    );
  }

  if (isGameOver) {
    const winnerPlayer = winner ? (gameState.players[winner] ?? null) : null;
    const isVictory = winnerPlayer?.id === currentPlayer.id;

    let reason = '';
    let _reasonType: 'health' | 'happiness' | 'turnLimit' = 'turnLimit';

    if (currentPlayer.stats.performance >= 100) {
      reason = getRandomTip(victoryMessages);
    } else if (currentPlayer.stats.health <= 0) {
      reason = getRandomTip(defeatMessages.health);
      _reasonType = 'health';
    } else if (currentPlayer.stats.happiness <= 0) {
      reason = getRandomTip(defeatMessages.happiness);
      _reasonType = 'happiness';
    } else if (gameState.turn >= 30) {
      reason = getRandomTip(defeatMessages.turnLimit);
      _reasonType = 'turnLimit';
    }

    return (
      <SafeAreaView
        testID="game-over-screen"
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <EnhancedGameOverScreen
          winner={winnerPlayer}
          reason={reason}
          player={currentPlayer}
          statDefinitions={bigtechWorkerTheme.stats}
          resourceDefinitions={bigtechWorkerTheme.resources}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
          style={styles.gameOver}
          victoryBackground={isVictory ? victoryBgImage : undefined}
          defeatBackground={!isVictory ? defeatBgImage : undefined}
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
        <EnhancedGameBoard
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
          turnStartMessage={turnMessage ?? undefined}
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
  loadingContainer: {
    flex: 1,
  },
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
