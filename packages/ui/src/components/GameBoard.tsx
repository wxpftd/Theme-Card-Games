import React, { useMemo, useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { GameState, ThemeConfig, CardDefinition } from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';
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

function GameBoardComponent({
  gameState,
  themeConfig,
  currentPlayerId,
  onCardPlay,
  onEndTurn,
  style,
}: GameBoardProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const player = gameState.players[currentPlayerId];
  const isMyTurn = gameState.currentPlayerId === currentPlayerId;

  // Create card definitions map - memoized to prevent recreation
  const cardDefinitions = useMemo(() => {
    return new Map(themeConfig.cards.map((card) => [card.id, card]));
  }, [themeConfig.cards]);

  // Memoize handlers to prevent child re-renders
  const handleCardSelect = useCallback((cardId: string) => {
    setSelectedCardId((prev) => (cardId === prev ? null : cardId));
  }, []);

  const handleCardPlay = useCallback(
    (cardId: string) => {
      if (!isMyTurn) return;
      onCardPlay?.(cardId);
      setSelectedCardId(null);
    },
    [isMyTurn, onCardPlay]
  );

  const getPhaseText = useCallback(
    (phase: string): string => {
      const phaseKeys: Record<string, string> = {
        setup: 'phase.setup',
        draw: 'phase.draw',
        main: 'phase.main',
        action: 'phase.action',
        resolve: 'phase.resolve',
        end: 'phase.end',
        game_over: 'phase.game_over',
      };
      return t(phaseKeys[phase] ?? phase);
    },
    [t]
  );

  if (!player) {
    return (
      <View style={[styles.container, style]}>
        <Text style={{ color: theme.colors.text }}>{t('common.loading')}</Text>
      </View>
    );
  }

  // Memoize phase text
  const phaseText = useMemo(() => getPhaseText(gameState.phase), [gameState.phase]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }, style]}>
      {/* Turn Info Bar */}
      <TurnInfoBar
        turn={gameState.turn}
        phaseText={phaseText}
        isMyTurn={isMyTurn}
        colors={theme.colors}
        t={t}
      />

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
          {t('game.playArea')}
        </Text>
        {player.playArea.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {t('game.noCards')}
          </Text>
        ) : (
          <View style={styles.playAreaCards}>
            {player.playArea.slice(-3).map((card, index) => {
              const def = cardDefinitions.get(card.definitionId);
              return (
                <View
                  key={card.instanceId}
                  style={[styles.playedCard, { backgroundColor: theme.colors.background }]}
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
            {t('game.endTurn')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Memoized turn info bar */
const TurnInfoBar = memo(function TurnInfoBar({
  turn,
  phaseText,
  isMyTurn,
  colors,
  t,
}: {
  turn: number;
  phaseText: string;
  isMyTurn: boolean;
  colors: {
    surface: string;
    textSecondary: string;
    primary: string;
    success: string;
    warning: string;
  };
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <View style={[styles.turnBar, { backgroundColor: colors.surface }]}>
      <View style={styles.turnInfo}>
        <Text style={[styles.turnText, { color: colors.textSecondary }]}>
          {t('game.turn', { turn })}
        </Text>
        <Text style={[styles.phaseText, { color: colors.primary }]}>{phaseText}</Text>
      </View>
      <View
        style={[
          styles.turnIndicator,
          {
            backgroundColor: isMyTurn ? colors.success : colors.warning,
          },
        ]}
      >
        <Text style={styles.turnIndicatorText}>
          {isMyTurn ? t('game.yourTurn') : t('game.waiting')}
        </Text>
      </View>
    </View>
  );
});

/**
 * Memoized GameBoard component.
 */
export const GameBoard = memo(GameBoardComponent);

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
