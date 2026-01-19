import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import {
  GameState,
  ThemeConfig,
  CardDefinition,
} from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';
import { PlayerStats } from './PlayerStats';
import { HandView } from './HandView';

interface GameBoardProps {
  gameState: GameState;
  themeConfig: ThemeConfig;
  currentPlayerId: string;
  onCardPlay?: (cardId: string) => void;
  onEndTurn?: () => void;
  style?: ViewStyle;
}

export function GameBoard({
  gameState,
  themeConfig,
  currentPlayerId,
  onCardPlay,
  onEndTurn,
  style,
}: GameBoardProps) {
  const { theme, t } = useTheme();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const player = gameState.players[currentPlayerId];
  const isMyTurn = gameState.currentPlayerId === currentPlayerId;

  // Create card definitions map
  const cardDefinitions = useMemo(() => {
    return new Map(themeConfig.cards.map((card) => [card.id, card]));
  }, [themeConfig.cards]);

  const handleCardSelect = (cardId: string) => {
    setSelectedCardId(cardId === selectedCardId ? null : cardId);
  };

  const handleCardPlay = (cardId: string) => {
    if (!isMyTurn) return;
    onCardPlay?.(cardId);
    setSelectedCardId(null);
  };

  const getPhaseText = (phase: string): string => {
    const phaseTexts: Record<string, string> = {
      setup: '准备中',
      draw: '抽牌阶段',
      main: '主要阶段',
      action: '行动阶段',
      resolve: '结算阶段',
      end: '结束阶段',
      game_over: '游戏结束',
    };
    return phaseTexts[phase] ?? phase;
  };

  if (!player) {
    return (
      <View style={[styles.container, style]}>
        <Text style={{ color: theme.colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }, style]}>
      {/* Turn Info Bar */}
      <View style={[styles.turnBar, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.turnInfo}>
          <Text style={[styles.turnText, { color: theme.colors.textSecondary }]}>
            回合 {gameState.turn}
          </Text>
          <Text style={[styles.phaseText, { color: theme.colors.primary }]}>
            {getPhaseText(gameState.phase)}
          </Text>
        </View>
        <View
          style={[
            styles.turnIndicator,
            {
              backgroundColor: isMyTurn ? theme.colors.success : theme.colors.warning,
            },
          ]}
        >
          <Text style={styles.turnIndicatorText}>
            {isMyTurn ? '你的回合' : '等待中'}
          </Text>
        </View>
      </View>

      {/* Player Stats */}
      <View style={styles.statsSection}>
        <PlayerStats
          player={player}
          statDefinitions={themeConfig.stats}
          resourceDefinitions={themeConfig.resources}
        />
      </View>

      {/* Play Area */}
      <View style={[styles.playArea, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.playAreaTitle, { color: theme.colors.textSecondary }]}>
          场上
        </Text>
        {player.playArea.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            暂无打出的卡牌
          </Text>
        ) : (
          <View style={styles.playAreaCards}>
            {player.playArea.slice(-3).map((card, index) => {
              const def = cardDefinitions.get(card.definitionId);
              return (
                <View
                  key={card.instanceId}
                  style={[
                    styles.playedCard,
                    { backgroundColor: theme.colors.background },
                  ]}
                >
                  <Text style={[styles.playedCardName, { color: theme.colors.text }]}>
                    {def?.name ?? '???'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Hand */}
      <View style={styles.handSection}>
        <HandView
          cards={player.hand}
          cardDefinitions={cardDefinitions}
          onCardSelect={handleCardSelect}
          onCardPlay={handleCardPlay}
          selectedCardId={selectedCardId}
          disabled={!isMyTurn}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: isMyTurn ? theme.colors.primary : theme.colors.background,
            },
          ]}
          onPress={onEndTurn}
          disabled={!isMyTurn}
        >
          <Text
            style={[
              styles.actionButtonText,
              { color: isMyTurn ? '#fff' : theme.colors.textSecondary },
            ]}
          >
            结束回合
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  turnBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  turnInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  turnText: {
    fontSize: 14,
  },
  phaseText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  turnIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  turnIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsSection: {
    padding: 12,
  },
  playArea: {
    flex: 1,
    margin: 12,
    borderRadius: 12,
    padding: 12,
  },
  playAreaTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 20,
  },
  playAreaCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  playedCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  playedCardName: {
    fontSize: 12,
  },
  handSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 120,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
