import React, { useMemo, useState, useCallback, memo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  ImageBackground,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import {
  GameState,
  ThemeConfig,
  PlayerState,
  GameEngine,
  ComboDefinition,
  ComboPreview as ComboPreviewType,
} from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';
import { PlayerStats } from './PlayerStats';
import { HandView } from './HandView';
import { OpponentView } from './OpponentView';
import { PlayConfirmButton } from './PlayConfirmButton';
import { ComboPreview } from './ComboPreview';
import { CardSelectionProvider } from '../contexts/CardSelectionContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EnhancedGameBoardProps {
  gameState: GameState;
  themeConfig: ThemeConfig;
  currentPlayerId: string;
  engine?: GameEngine | null;
  onCardPlay?: (cardId: string) => void;
  onCardsPlayed?: (cardIds: string[], triggeredCombo: ComboDefinition | null) => void;
  onEndTurn?: () => void;
  style?: ViewStyle;
  opponents?: PlayerState[];
  isAIPlayer?: (playerId: string) => boolean;
  aiThinking?: string | null;
  maxCardsPerTurn?: number;
  remainingCardPlays?: number;
  disabledCardsByMutualExclusion?: Set<string>;
  comboPreviews?: ComboPreviewType[];
  /** 游戏背景图片 */
  backgroundImage?: string;
  /** 回合开始消息 */
  turnStartMessage?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function EnhancedGameBoardComponent({
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
  maxCardsPerTurn,
  remainingCardPlays,
  comboPreviews,
  backgroundImage,
  turnStartMessage,
}: EnhancedGameBoardProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [legacySelectedCardId, setLegacySelectedCardId] = useState<string | null>(null);
  const [showTurnMessage, setShowTurnMessage] = useState(false);

  const player = gameState.players[currentPlayerId];
  const isMyTurn = gameState.currentPlayerId === currentPlayerId;
  const useMultiSelectMode = engine !== null && engine !== undefined;

  // 动画值
  const endTurnScale = useSharedValue(1);
  const turnMessageOpacity = useSharedValue(0);

  // 回合开始消息动画
  useEffect(() => {
    if (isMyTurn && turnStartMessage) {
      setShowTurnMessage(true);
      turnMessageOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 300 })
      );
      setTimeout(() => setShowTurnMessage(false), 2600);
    }
  }, [isMyTurn, gameState.turn]);

  const turnMessageStyle = useAnimatedStyle(() => ({
    opacity: turnMessageOpacity.value,
  }));

  // Card definitions map
  const cardDefinitions = useMemo(() => {
    return new Map(themeConfig.cards.map((card) => [card.id, card]));
  }, [themeConfig.cards]);

  const comboDefinitions = useMemo(() => {
    return themeConfig.comboDefinitions ?? [];
  }, [themeConfig.comboDefinitions]);

  // Legacy mode callbacks
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

  const handleEndTurn = useCallback(() => {
    endTurnScale.value = withSequence(
      withSpring(0.9, { damping: 15 }),
      withSpring(1, { damping: 10 })
    );
    onEndTurn?.();
  }, [onEndTurn]);

  const endTurnButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: endTurnScale.value }],
  }));

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

  const phaseText = useMemo(() => getPhaseText(gameState.phase), [gameState.phase, getPhaseText]);
  const handCards = useMemo(() => player.hand, [player.hand]);

  const cardsPlayedThisTurn = useMemo(() => {
    if (maxCardsPerTurn === undefined || remainingCardPlays === undefined) {
      return undefined;
    }
    return maxCardsPerTurn - remainingCardPlays;
  }, [maxCardsPerTurn, remainingCardPlays]);

  const renderBoardContent = (isMultiSelectMode: boolean) => (
    <View
      testID="game-board"
      style={[styles.container, { backgroundColor: theme.colors.background }, style]}
    >
      {/* Turn Message Overlay */}
      {showTurnMessage && turnStartMessage && (
        <Animated.View style={[styles.turnMessageOverlay, turnMessageStyle]}>
          <View style={[styles.turnMessageBox, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.turnMessageText}>{turnStartMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* Enhanced Turn Info Bar */}
      <EnhancedTurnInfoBar
        turn={gameState.turn}
        phaseText={phaseText}
        isMyTurn={isMyTurn}
        colors={theme.colors}
        t={t}
        maxCardsPerTurn={maxCardsPerTurn}
        cardsPlayedThisTurn={cardsPlayedThisTurn}
      />

      {/* Opponents */}
      {opponents && opponents.length > 0 && (
        <Animated.View entering={FadeIn.duration(300)}>
          <OpponentView
            opponents={opponents}
            currentTurnPlayerId={gameState.currentPlayerId}
            statDefinitions={themeConfig.stats}
            resourceDefinitions={themeConfig.resources}
            isAIPlayer={isAIPlayer}
          />
        </Animated.View>
      )}

      {/* AI Thinking Indicator */}
      {aiThinking && (
        <Animated.View
          style={[styles.aiThinkingBanner, { backgroundColor: theme.colors.accent + '20' }]}
          entering={SlideInUp.duration(200)}
        >
          <Text style={styles.aiThinkingEmoji}>🤔</Text>
          <Text style={[styles.aiThinkingText, { color: theme.colors.accent }]}>
            {aiThinking} {t('competitive.thinking') || '思考中...'}
          </Text>
        </Animated.View>
      )}

      {/* Player Stats - Enhanced */}
      <View style={styles.statsSection}>
        <PlayerStats
          player={player}
          statDefinitions={themeConfig.stats}
          resourceDefinitions={themeConfig.resources}
        />
      </View>

      {/* Play Area - Enhanced */}
      <View
        testID="play-area"
        style={[styles.playArea, { backgroundColor: theme.colors.surface + 'E0' }]}
      >
        <View style={styles.playAreaHeader}>
          <Text style={[styles.playAreaTitle, { color: theme.colors.textSecondary }]}>
            {t('game.playArea')}
          </Text>
          {player.playArea.length > 0 && (
            <View style={[styles.playAreaBadge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.playAreaBadgeText, { color: theme.colors.primary }]}>
                {player.playArea.length} 张
              </Text>
            </View>
          )}
        </View>

        {player.playArea.length === 0 ? (
          <View style={styles.emptyPlayArea}>
            <Text style={styles.emptyPlayAreaEmoji}>🎴</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('game.noCards')}
            </Text>
          </View>
        ) : (
          <View style={styles.playAreaCards}>
            {player.playArea.slice(-5).map((card, index) => {
              const def = cardDefinitions.get(card.definitionId);
              return (
                <Animated.View
                  key={card.instanceId}
                  style={[styles.playedCard, { backgroundColor: theme.colors.background }]}
                  entering={SlideInUp.delay(index * 50).duration(200)}
                >
                  <Text style={styles.playedCardEmoji}>
                    {def?.type === 'action'
                      ? '⚡'
                      : def?.type === 'event'
                        ? '📋'
                        : def?.type === 'resource'
                          ? '💎'
                          : '🎴'}
                  </Text>
                  <Text
                    style={[styles.playedCardName, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {def?.name ?? '???'}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        )}
      </View>

      {/* Combo Preview */}
      {comboPreviews && comboPreviews.length > 0 && isMyTurn && (
        <Animated.View entering={FadeIn.duration(200)}>
          <ComboPreview
            comboPreviews={comboPreviews}
            cardDefinitions={cardDefinitions}
            compact={false}
          />
        </Animated.View>
      )}

      {/* Play Confirm Button */}
      {isMultiSelectMode && isMyTurn && <PlayConfirmButton onPlayed={undefined} />}

      {/* Hand Section */}
      <View style={[styles.handSection, { borderTopColor: theme.colors.primary + '30' }]}>
        <View style={styles.handHeader}>
          <Text style={[styles.handTitle, { color: theme.colors.textSecondary }]}>
            手牌 ({handCards.length})
          </Text>
          {isMyTurn && (
            <View style={[styles.yourTurnBadge, { backgroundColor: theme.colors.success + '20' }]}>
              <Text style={[styles.yourTurnText, { color: theme.colors.success }]}>轮到你了</Text>
            </View>
          )}
        </View>
        <HandView
          cards={handCards}
          cardDefinitions={cardDefinitions}
          onCardSelect={isMultiSelectMode ? undefined : handleLegacyCardSelect}
          onCardPlay={isMultiSelectMode ? undefined : handleLegacyCardPlay}
          selectedCardId={isMultiSelectMode ? undefined : legacySelectedCardId}
          disabled={!isMyTurn}
        />
      </View>

      {/* Action Buttons - Enhanced */}
      <View style={styles.actions}>
        <AnimatedTouchable
          testID="end-turn-button"
          style={[
            styles.actionButton,
            isMyTurn ? styles.actionButtonActive : styles.actionButtonDisabled,
            {
              backgroundColor: isMyTurn ? theme.colors.primary : theme.colors.background,
              borderColor: isMyTurn ? theme.colors.primary : theme.colors.textSecondary + '40',
            },
            endTurnButtonStyle,
          ]}
          onPress={handleEndTurn}
          disabled={!isMyTurn}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonIcon}>{isMyTurn ? '✅' : '⏳'}</Text>
          <Text
            style={[
              styles.actionButtonText,
              { color: isMyTurn ? '#fff' : theme.colors.textSecondary },
            ]}
          >
            {t('game.endTurn')}
          </Text>
        </AnimatedTouchable>
      </View>
    </View>
  );

  const content =
    useMultiSelectMode && engine ? (
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
    ) : (
      renderBoardContent(false)
    );

  // 如果有背景图片，使用 ImageBackground 包裹
  if (backgroundImage) {
    return (
      <ImageBackground
        source={{ uri: backgroundImage }}
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.15 }}
      >
        {content}
      </ImageBackground>
    );
  }

  return content;
}

/** Enhanced Turn Info Bar */
const EnhancedTurnInfoBar = memo(function EnhancedTurnInfoBar({
  turn,
  phaseText,
  isMyTurn,
  colors,
  t,
  maxCardsPerTurn,
  cardsPlayedThisTurn,
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
    text: string;
  };
  t: (key: string, params?: Record<string, string | number>) => string;
  maxCardsPerTurn?: number;
  cardsPlayedThisTurn?: number;
}) {
  const showCardLimit = maxCardsPerTurn !== undefined && cardsPlayedThisTurn !== undefined;
  const isAtLimit = showCardLimit && cardsPlayedThisTurn >= maxCardsPerTurn;

  return (
    <View testID="turn-info-bar" style={[styles.turnBar, { backgroundColor: colors.surface }]}>
      <View style={styles.turnInfoLeft}>
        <View style={[styles.turnBadge, { backgroundColor: colors.primary + '15' }]}>
          <Text style={styles.turnBadgeEmoji}>📅</Text>
          <Text testID="turn-counter" style={[styles.turnBadgeText, { color: colors.primary }]}>
            {t('game.turn', { turn })}
          </Text>
        </View>
        <View style={[styles.phaseBadge, { backgroundColor: colors.textSecondary + '15' }]}>
          <Text testID="phase-text" style={[styles.phaseBadgeText, { color: colors.text }]}>
            {phaseText}
          </Text>
        </View>
      </View>

      <View style={styles.turnInfoRight}>
        {showCardLimit && (
          <View
            testID="card-limit-indicator"
            style={[
              styles.cardLimitBadge,
              {
                backgroundColor: isAtLimit ? colors.warning + '20' : colors.success + '20',
              },
            ]}
          >
            <Text style={styles.cardLimitEmoji}>{isAtLimit ? '🚫' : '🎴'}</Text>
            <Text
              testID="card-limit-text"
              style={[styles.cardLimitText, { color: isAtLimit ? colors.warning : colors.success }]}
            >
              {cardsPlayedThisTurn}/{maxCardsPerTurn}
            </Text>
          </View>
        )}
        <View
          testID="turn-indicator"
          style={[
            styles.turnIndicator,
            {
              backgroundColor: isMyTurn ? colors.success : colors.warning,
            },
          ]}
        >
          <Text style={styles.turnIndicatorEmoji}>{isMyTurn ? '👆' : '⏳'}</Text>
          <Text style={styles.turnIndicatorText}>
            {isMyTurn ? t('game.yourTurn') : t('game.waiting')}
          </Text>
        </View>
      </View>
    </View>
  );
});

export const EnhancedGameBoard = memo(EnhancedGameBoardComponent);

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  turnMessageOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
  },
  turnMessageBox: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  turnMessageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  turnBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  turnInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  turnInfoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  turnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  turnBadgeEmoji: {
    fontSize: 14,
  },
  turnBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  phaseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  phaseBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  cardLimitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  cardLimitEmoji: {
    fontSize: 12,
  },
  cardLimitText: {
    fontSize: 12,
    fontWeight: '600',
  },
  turnIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  turnIndicatorEmoji: {
    fontSize: 12,
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
    borderRadius: 16,
    padding: 14,
  },
  playAreaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  playAreaTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  playAreaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  playAreaBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyPlayArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPlayAreaEmoji: {
    fontSize: 40,
    opacity: 0.3,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  playAreaCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  playedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    maxWidth: SCREEN_WIDTH * 0.4,
  },
  playedCardEmoji: {
    fontSize: 14,
  },
  playedCardName: {
    fontSize: 12,
    fontWeight: '500',
  },
  handSection: {
    borderTopWidth: 2,
    paddingTop: 8,
  },
  handHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  handTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  yourTurnBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  yourTurnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    minWidth: 140,
    gap: 8,
    borderWidth: 2,
  },
  actionButtonActive: {
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonIcon: {
    fontSize: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  aiThinkingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    gap: 8,
  },
  aiThinkingEmoji: {
    fontSize: 18,
  },
  aiThinkingText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default EnhancedGameBoard;
