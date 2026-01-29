import React, { useCallback, memo, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { CardDefinition, CardInstance } from '@theme-card-games/core';
import { Card } from './Card';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';
import { useCardSelectionOptional, useCardSelection } from '../contexts/CardSelectionContext';

interface HandViewProps {
  cards: CardInstance[];
  cardDefinitions: Map<string, CardDefinition>;
  /** @deprecated 使用 CardSelectionProvider 替代 */
  onCardSelect?: (cardId: string) => void;
  /** @deprecated 使用 CardSelectionProvider 替代 */
  onCardPlay?: (cardId: string) => void;
  /** @deprecated 使用 CardSelectionProvider 替代 */
  selectedCardId?: string | null;
  disabled?: boolean;
  maxVisible?: number;
  style?: ViewStyle;
  /** 因互斥标签被禁用的卡牌定义 ID 集合（旧版模式使用，新模式从 Context 获取） */
  disabledCardsByMutualExclusion?: Set<string>;
}

function HandViewComponent({
  cards,
  cardDefinitions,
  onCardSelect,
  onCardPlay,
  selectedCardId: legacySelectedCardId,
  disabled = false,
  maxVisible = 10,
  style,
  disabledCardsByMutualExclusion: legacyDisabledCards,
}: HandViewProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  // 尝试获取 CardSelectionContext（可选）
  const cardSelection = useCardSelectionOptional();

  // 判断是否使用新的多选模式
  const useMultiSelectMode = cardSelection !== null;

  const visibleCards = useMemo(() => cards.slice(0, maxVisible), [cards, maxVisible]);
  const hasMore = cards.length > maxVisible;

  const getCardDefinition = useCallback(
    (card: CardInstance): CardDefinition | null => {
      return cardDefinitions.get(card.definitionId) ?? null;
    },
    [cardDefinitions]
  );

  // 检查卡牌是否被选中
  const isCardSelected = useCallback(
    (instanceId: string): boolean => {
      if (useMultiSelectMode && cardSelection) {
        return cardSelection.isSelected(instanceId);
      }
      return legacySelectedCardId === instanceId;
    },
    [useMultiSelectMode, cardSelection, legacySelectedCardId]
  );

  // 获取选中卡牌的 z-index
  const getSelectedZIndex = useCallback(
    (instanceId: string, defaultIndex: number): number => {
      if (isCardSelected(instanceId)) {
        return 100;
      }
      return defaultIndex;
    },
    [isCardSelected]
  );

  return (
    <View testID="hand-container" style={[styles.container, style]}>
      <View style={styles.header}>
        <Text testID="hand-count" style={[styles.title, { color: theme.colors.text }]}>
          {t('hand.title')} ({cards.length})
        </Text>
        {hasMore && (
          <Text style={[styles.moreText, { color: theme.colors.textSecondary }]}>
            {t('hand.more', { count: cards.length - maxVisible })}
          </Text>
        )}
      </View>

      <ScrollView
        testID="hand-scroll"
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsContainer}
        keyboardShouldPersistTaps="always"
      >
        {visibleCards.map((card, index) => {
          const definition = getCardDefinition(card);
          if (!definition) return null;

          // 检查卡牌是否因互斥标签被禁用
          const isMutuallyExcluded = useMultiSelectMode
            ? (cardSelection?.disabledCardsByMutualExclusion.has(definition.id) ?? false)
            : (legacyDisabledCards?.has(definition.id) ?? false);

          // 检查是否因出牌限制被禁用（只在多选模式下）
          const isLimitReached =
            useMultiSelectMode &&
            cardSelection?.remainingCardPlays !== undefined &&
            cardSelection.remainingCardPlays <= 0;

          const isCardDisabled = disabled || isMutuallyExcluded || isLimitReached;

          return (
            <View
              key={card.instanceId}
              accessible={false}
              style={[
                styles.cardWrapper,
                {
                  marginLeft: index > 0 ? -30 : 0,
                  zIndex: getSelectedZIndex(card.instanceId, index),
                },
              ]}
            >
              <CardWithHandlers
                card={definition}
                cardId={card.instanceId}
                cardIndex={index}
                selected={isCardSelected(card.instanceId)}
                disabled={isCardDisabled}
                useMultiSelectMode={useMultiSelectMode}
                cardSelection={cardSelection}
                onCardSelect={onCardSelect}
                onCardPlay={onCardPlay}
                legacySelectedCardId={legacySelectedCardId}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* 选中提示 - 使用独立组件直接订阅 Context */}
      {useMultiSelectMode && <SelectionHint />}

      {/* 旧版单选提示 */}
      {!useMultiSelectMode && legacySelectedCardId && (
        <View style={[styles.hint, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
            {t('hand.hint')}
          </Text>
        </View>
      )}
    </View>
  );
}

/** Wrapper component to memoize card press handlers */
const CardWithHandlers = memo(
  function CardWithHandlers({
    card,
    cardId,
    cardIndex,
    selected,
    disabled,
    useMultiSelectMode,
    cardSelection,
    onCardSelect,
    onCardPlay,
    legacySelectedCardId,
  }: {
    card: CardDefinition;
    cardId: string;
    cardIndex: number;
    selected: boolean;
    disabled: boolean;
    useMultiSelectMode: boolean;
    cardSelection: ReturnType<typeof useCardSelectionOptional>;
    onCardSelect?: (cardId: string) => void;
    onCardPlay?: (cardId: string) => void;
    legacySelectedCardId?: string | null;
  }) {
    // 多选模式：点击切换选中状态
    const handlePressMultiSelect = useCallback(() => {
      if (disabled) return;
      cardSelection?.toggleCard(cardId);
    }, [disabled, cardSelection, cardId]);

    // 旧版模式：点击选中，双击打出
    const handlePressLegacy = useCallback(() => {
      if (disabled) return;
      if (legacySelectedCardId === cardId) {
        // 双击打出
        onCardPlay?.(cardId);
      } else {
        onCardSelect?.(cardId);
      }
    }, [disabled, legacySelectedCardId, cardId, onCardPlay, onCardSelect]);

    // 长按打出（旧版模式）
    const handleLongPressLegacy = useCallback(() => {
      if (disabled) return;
      onCardPlay?.(cardId);
    }, [disabled, onCardPlay, cardId]);

    const handlePress = useMultiSelectMode ? handlePressMultiSelect : handlePressLegacy;
    const handleLongPress = useMultiSelectMode ? undefined : handleLongPressLegacy;

    return (
      <Card
        card={card}
        testID={`card-${cardIndex}`}
        onPress={handlePress}
        onLongPress={handleLongPress}
        selected={selected}
        disabled={disabled}
        size="medium"
      />
    );
  },
  (prevProps, nextProps) => {
    // 自定义比较函数，避免不必要的重渲染
    return (
      prevProps.card.id === nextProps.card.id &&
      prevProps.cardId === nextProps.cardId &&
      prevProps.cardIndex === nextProps.cardIndex &&
      prevProps.selected === nextProps.selected &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.useMultiSelectMode === nextProps.useMultiSelectMode
      // 不比较回调函数引用
    );
  }
);

/**
 * 选中卡牌提示组件
 *
 * 独立组件直接订阅 CardSelectionContext，确保 context 变化时能正确重新渲染。
 * 这解决了父组件 memo 可能阻止 context 更新传播的问题。
 */
function SelectionHintComponent() {
  const { selectedCount, pendingCombo } = useCardSelection();
  const { theme } = useTheme();
  const { t } = useI18n();

  // 没有选中卡牌时不显示
  if (selectedCount === 0) {
    return null;
  }

  return (
    <View style={[styles.selectionHint, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.hintText, { color: theme.colors.primary }]}>
        {t('hand.selected', { count: selectedCount })}
        {pendingCombo && ` - ${pendingCombo.name}`}
      </Text>
    </View>
  );
}

const SelectionHint = memo(SelectionHintComponent);

/**
 * Memoized HandView component.
 * 使用默认浅比较，以确保 CardSelectionContext 变化时能正确重新渲染。
 */
export const HandView = memo(HandViewComponent);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  moreText: {
    fontSize: 12,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cardWrapper: {
    transform: [{ translateY: 0 }],
  },
  hint: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  selectionHint: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  hintText: {
    fontSize: 12,
  },
});
