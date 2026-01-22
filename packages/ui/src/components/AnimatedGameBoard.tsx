/**
 * 动画增强版游戏面板
 * 集成所有UI动效：
 * - 属性变化弹出动画
 * - 组合触发特效
 * - 濒死警告
 * - 卡牌拖拽打出
 */
import React, { useMemo, useState, useCallback, memo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  LayoutChangeEvent,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  GameState,
  ThemeConfig,
  CardDefinition,
  ComboDefinition,
  ResolvedEffect,
} from '@theme-card-games/core';

/** 组合触发结果类型 */
interface ComboTriggerResult {
  combo: ComboDefinition;
  effects: ResolvedEffect[];
}
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';
import { PlayerStats } from './PlayerStats';
import { AnimatedHandView } from './AnimatedHandView';
import {
  StatChangePopupContainer,
  ComboTriggerContainer,
  DangerWarning,
  useStatChanges,
  type StatChange,
  type ComboTriggerData,
} from '../animations';

interface AnimatedGameBoardProps {
  gameState: GameState;
  themeConfig: ThemeConfig;
  currentPlayerId: string;
  onCardPlay?: (cardId: string) => void;
  onEndTurn?: () => void;
  /** 组合触发事件 */
  triggeredCombos?: ComboTriggerResult[];
  style?: ViewStyle;
}

/** 健康濒死阈值 */
const DANGER_HEALTH_THRESHOLD = 20;

function AnimatedGameBoardComponent({
  gameState,
  themeConfig,
  currentPlayerId,
  onCardPlay,
  onEndTurn,
  triggeredCombos,
  style,
}: AnimatedGameBoardProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [combos, setCombos] = useState<ComboTriggerData[]>([]);
  const [statsPosition, setStatsPosition] = useState({ x: 100, y: 150 });

  const player = gameState.players[currentPlayerId];
  const isMyTurn = gameState.currentPlayerId === currentPlayerId;

  // 检查是否处于濒死状态
  const healthValue = player?.stats?.health ?? 100;
  const isDanger = healthValue < DANGER_HEALTH_THRESHOLD;

  // 属性变化追踪
  const { changes: statChanges, removeChange: removeStatChange } = useStatChanges({
    statDefinitions: themeConfig.stats,
    currentStats: player?.stats ?? {},
    statsPosition,
  });

  // Create card definitions map - memoized to prevent recreation
  const cardDefinitions = useMemo(() => {
    return new Map(themeConfig.cards.map((card) => [card.id, card]));
  }, [themeConfig.cards]);

  // 处理组合触发事件
  useEffect(() => {
    if (triggeredCombos && triggeredCombos.length > 0) {
      const newCombos: ComboTriggerData[] = triggeredCombos.map((result, index) => {
        return {
          id: `combo-${Date.now()}-${index}`,
          comboName: result.combo.name,
          comboIcon: result.combo.icon,
          comboDescription: result.combo.description,
          bonusEffects: result.effects.map((e: ResolvedEffect) => `${e.type}: ${e.target}`),
        };
      });
      setCombos((prev: ComboTriggerData[]) => [...prev, ...newCombos]);
    }
  }, [triggeredCombos]);

  // 组合动画完成回调
  const handleComboComplete = useCallback((id: string) => {
    setCombos((prev: ComboTriggerData[]) => prev.filter((c: ComboTriggerData) => c.id !== id));
  }, []);

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

  // 记录属性区域位置
  const handleStatsLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setStatsPosition({ x: x + width / 2, y: y + height / 2 });
  }, []);

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

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }, style]}>
        {/* 濒死警告 */}
        <DangerWarning
          isActive={isDanger}
          healthValue={healthValue}
          message={t('game.dangerWarning') ?? '危险！健康值过低'}
          icon="⚠️"
        />

        {/* 属性变化弹出动画 */}
        <StatChangePopupContainer changes={statChanges} onChangeComplete={removeStatChange} />

        {/* 组合触发特效 */}
        <ComboTriggerContainer combos={combos} onComboComplete={handleComboComplete} />

        {/* Turn Info Bar */}
        <TurnInfoBar
          turn={gameState.turn}
          phaseText={phaseText}
          isMyTurn={isMyTurn}
          colors={theme.colors}
          t={t}
        />

        {/* Player Stats */}
        <View style={styles.statsSection} onLayout={handleStatsLayout}>
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

        {/* Hand - 使用动画增强版 */}
        <View style={styles.handSection}>
          <AnimatedHandView
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
    </GestureHandlerRootView>
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
 * Memoized AnimatedGameBoard component.
 */
export const AnimatedGameBoard = memo(AnimatedGameBoardComponent);

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
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
