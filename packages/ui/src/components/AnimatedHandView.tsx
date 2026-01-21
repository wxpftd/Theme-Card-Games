/**
 * 动画增强版手牌视图
 * 支持手势拖拽打出卡牌
 */
import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CardDefinition, CardInstance } from '@theme-card-games/core';
import { DraggableCard } from '../animations/DraggableCard';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';

interface AnimatedHandViewProps {
  cards: CardInstance[];
  cardDefinitions: Map<string, CardDefinition>;
  onCardSelect?: (cardId: string) => void;
  onCardPlay?: (cardId: string) => void;
  selectedCardId?: string | null;
  disabled?: boolean;
  maxVisible?: number;
  style?: ViewStyle;
}

function AnimatedHandViewComponent({
  cards,
  cardDefinitions,
  onCardSelect,
  onCardPlay,
  selectedCardId,
  disabled = false,
  maxVisible = 10,
  style,
}: AnimatedHandViewProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  const visibleCards = useMemo(() => cards.slice(0, maxVisible), [cards, maxVisible]);
  const hasMore = cards.length > maxVisible;

  const getCardDefinition = useCallback(
    (card: CardInstance): CardDefinition | null => {
      return cardDefinitions.get(card.definitionId) ?? null;
    },
    [cardDefinitions]
  );

  // 卡牌打出处理
  const handleCardPlay = useCallback(
    (cardId: string) => {
      if (disabled) return;
      onCardPlay?.(cardId);
    },
    [disabled, onCardPlay]
  );

  // 卡牌选中处理
  const handleCardSelect = useCallback(
    (cardId: string) => {
      if (disabled) return;
      onCardSelect?.(cardId);
    },
    [disabled, onCardSelect]
  );

  // 长按打出
  const handleLongPress = useCallback(
    (cardId: string) => {
      if (disabled) return;
      onCardPlay?.(cardId);
    },
    [disabled, onCardPlay]
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('hand.title')} ({cards.length})
        </Text>
        {hasMore && (
          <Text style={[styles.moreText, { color: theme.colors.textSecondary }]}>
            {t('hand.more', { count: cards.length - maxVisible })}
          </Text>
        )}
      </View>

      {/* 拖拽提示 */}
      {!disabled && cards.length > 0 && (
        <View style={[styles.dragHint, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.dragHintText, { color: theme.colors.textSecondary }]}>
            ⬆️ 向上拖动打出卡牌
          </Text>
        </View>
      )}

      <GestureHandlerRootView style={styles.gestureContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {visibleCards.map((card, index) => {
            const definition = getCardDefinition(card);
            if (!definition) return null;

            return (
              <View
                key={card.instanceId}
                style={[
                  styles.cardWrapper,
                  {
                    marginLeft: index > 0 ? -30 : 0,
                    zIndex: selectedCardId === card.instanceId ? 100 : index,
                  },
                ]}
              >
                <DraggableCard
                  card={definition}
                  cardInstanceId={card.instanceId}
                  onPlay={handleCardPlay}
                  onSelect={handleCardSelect}
                  onLongPress={handleLongPress}
                  selected={selectedCardId === card.instanceId}
                  disabled={disabled}
                  size="medium"
                />
              </View>
            );
          })}
        </ScrollView>
      </GestureHandlerRootView>

      {selectedCardId && (
        <View style={[styles.hint, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
            {t('hand.hint')}
          </Text>
        </View>
      )}
    </View>
  );
}

export const AnimatedHandView = memo(AnimatedHandViewComponent);

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
  dragHint: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  dragHintText: {
    fontSize: 11,
  },
  gestureContainer: {
    flex: 1,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 40, // 为拖拽动画留出空间
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
  hintText: {
    fontSize: 12,
  },
});
