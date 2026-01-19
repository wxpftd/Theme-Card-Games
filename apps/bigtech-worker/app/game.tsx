import React, { useCallback } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useGameEngine, GameBoard, GameOverScreen, useTheme } from '@theme-card-games/ui';
import { bigtechWorkerTheme } from '@theme-card-games/theme-bigtech-worker';

export default function GameScreen() {
  const { theme } = useTheme();

  const {
    gameState,
    currentPlayer,
    isGameOver,
    winner,
    startGame,
    playCard,
    endTurn,
    resetGame,
    engine,
  } = useGameEngine({
    theme: bigtechWorkerTheme,
    playerId: 'player1',
    playerName: '打工人',
    autoStart: true,
  });

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

  const handleRestart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    resetGame();
    startGame();
  }, [resetGame, startGame]);

  const handleMainMenu = useCallback(() => {
    router.back();
  }, []);

  if (!gameState || !currentPlayer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} />
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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GameBoard
        gameState={gameState}
        themeConfig={bigtechWorkerTheme}
        currentPlayerId="player1"
        onCardPlay={handleCardPlay}
        onEndTurn={handleEndTurn}
        style={styles.gameBoard}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gameBoard: {
    flex: 1,
  },
  gameOver: {
    flex: 1,
  },
});
