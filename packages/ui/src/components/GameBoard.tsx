import React, { useMemo, useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import {
  GameState,
  ThemeConfig,
  PlayerState,
  GameEngine,
  ComboDefinition,
} from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';
import { PlayerStats } from './PlayerStats';
import { HandView } from './HandView';
import { OpponentView } from './OpponentView';
import { PlayConfirmButton } from './PlayConfirmButton';
import { CardSelectionProvider } from '../contexts/CardSelectionContext';

interface GameBoardProps {
  gameState: GameState;
  themeConfig: ThemeConfig;
  currentPlayerId: string;
  /** 游戏引擎实例（启用多卡选择模式时必需） */
  engine?: GameEngine | null;
  /** @deprecated 使用 engine + onCardsPlayed 替代 */
  onCardPlay?: (cardId: string) => void;
  /** 多卡打出后的回调 */
  onCardsPlayed?: (cardIds: string[], triggeredCombo: ComboDefinition | null) => void;
  onEndTurn?: () => void;
  style?: ViewStyle;
  /** 对手玩家列表（多人模式） */
  opponents?: PlayerState[];
  /** 判断玩家是否为 AI */
  isAIPlayer?: (playerId: string) => boolean;
  /** AI 思考中提示 */
  aiThinking?: string | null;
}

function GameBoardComponent({
  gameState,
  themeConfig,
  currentPlayerId,
  engine,
  onCardPlay,
  onCardsPlayed,
  onEndTurn,
  style,
  opponents,
  isAIPlayer,
  aiThinking,
}: GameBoardProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  // 旧版单选状态（仅在没有 engine 时使用）
  const [legacySelectedCardId, setLegacySelectedCardId] = useState<string | null>(null);

  const player = gameState.players[currentPlayerId];
  const isMyTurn = gameState.currentPlayerId === currentPlayerId;

  // 是否使用新的多卡选择模式
  const useMultiSelectMode = engine !== null && engine !== undefined;

  // Create card definitions map - memoized to prevent recreation
  const cardDefinitions = useMemo(() => {
    return new Map(themeConfig.cards.map((card) => [card.id, card]));
  }, [themeConfig.cards]);

  // Memoize combo definitions
  const comboDefinitions = useMemo(() => {
    return themeConfig.comboDefinitions ?? [];
  }, [themeConfig.comboDefinitions]);

  // 旧版模式的回调（仅在没有 engine 时使用）
  const handleLegacyCardSelect = useCallback((cardId: string) => {
    setLegacySelectedCardId((prev) => (cardId === prev ? null : cardId));
  }, []);

  const handleLegacyCardPlay = useCallback(
    (cardId: string) => {
      if (!isMyTurn) return;
      onCardPlay?.(cardId);
      setLegacySelectedCardId(null);
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
  const phaseText = useMemo(() => getPhaseText(gameState.phase), [gameState.phase, getPhaseText]);

  // Memoize hand cards to prevent HandView re-renders
  const handCards = useMemo(() => player.hand, [player.hand]);

  // 内部渲染内容 - 用于共享两种模式的通用 UI
  const renderBoardContent = (isMultiSelectMode: boolean) => (
    <View
      testID="game-board"
      style={[styles.container, { backgroundColor: theme.colors.background }, style]}
    >
      {/* Turn Info Bar */}
      <TurnInfoBar
        turn={gameState.turn}
        phaseText={phaseText}
        isMyTurn={isMyTurn}
        colors={theme.colors}
        t={t}
      />

      {/* Opponents (Multiplayer) */}
      {opponents && opponents.length > 0 && (
        <OpponentView
          opponents={opponents}
          currentTurnPlayerId={gameState.currentPlayerId}
          statDefinitions={themeConfig.stats}
          resourceDefinitions={themeConfig.resources}
          isAIPlayer={isAIPlayer}
        />
      )}

      {/* AI Thinking Indicator */}
      {aiThinking && (
        <View style={[styles.aiThinkingBanner, { backgroundColor: theme.colors.accent + '20' }]}>
          <Text style={[styles.aiThinkingText, { color: theme.colors.accent }]}>
            {aiThinking} {t('competitive.thinking') || '思考中...'}
          </Text>
        </View>
      )}

      {/* Player Stats */}
      <View style={styles.statsSection}>
        <PlayerStats
          player={player}
          statDefinitions={themeConfig.stats}
          resourceDefinitions={themeConfig.resources}
        />
      </View>

      {/* Play Area */}
      <View testID="play-area" style={[styles.playArea, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.playAreaTitle, { color: theme.colors.textSecondary }]}>
          {t('game.playArea')}
        </Text>
        {player.playArea.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {t('game.noCards')}
          </Text>
        ) : (
          <View style={styles.playAreaCards}>
            {player.playArea.slice(-3).map((card) => {
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
          cards={handCards}
          cardDefinitions={cardDefinitions}
          onCardSelect={isMultiSelectMode ? undefined : handleLegacyCardSelect}
          onCardPlay={isMultiSelectMode ? undefined : handleLegacyCardPlay}
          selectedCardId={isMultiSelectMode ? undefined : legacySelectedCardId}
          disabled={!isMyTurn}
        />
      </View>

      {/* Play Confirm Button (多卡选择模式) */}
      {isMultiSelectMode && isMyTurn && <PlayConfirmButton onPlayed={undefined} />}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          testID="end-turn-button"
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

  // 如果有 engine，使用 CardSelectionProvider 包裹
  if (useMultiSelectMode && engine) {
    return (
      <CardSelectionProvider
        engine={engine}
        playerId={currentPlayerId}
        hand={handCards}
        cardDefinitions={cardDefinitions}
        comboDefinitions={comboDefinitions}
        disabled={!isMyTurn}
        onCardsPlayed={onCardsPlayed}
      >
        {renderBoardContent(true)}
      </CardSelectionProvider>
    );
  }

  // 旧版模式，直接返回内容
  return renderBoardContent(false);
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
    <View testID="turn-info-bar" style={[styles.turnBar, { backgroundColor: colors.surface }]}>
      <View style={styles.turnInfo}>
        <Text testID="turn-counter" style={[styles.turnText, { color: colors.textSecondary }]}>
          {t('game.turn', { turn })}
        </Text>
        <Text testID="phase-text" style={[styles.phaseText, { color: colors.primary }]}>
          {phaseText}
        </Text>
      </View>
      <View
        testID="turn-indicator"
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
  aiThinkingBanner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  aiThinkingText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
