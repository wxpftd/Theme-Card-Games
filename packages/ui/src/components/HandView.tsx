import React, { useState, useCallback, memo, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { CardDefinition, CardInstance } from '@theme-card-games/core';
import { Card } from './Card';
import { useTheme } from '../theme/ThemeContext';

interface HandViewProps {
  cards: CardInstance[];
  cardDefinitions: Map<string, CardDefinition>;
  onCardSelect?: (cardId: string) => void;
  onCardPlay?: (cardId: string) => void;
  selectedCardId?: string | null;
  disabled?: boolean;
  maxVisible?: number;
  style?: ViewStyle;
}

function HandViewComponent({
  cards,
  cardDefinitions,
  onCardSelect,
  onCardPlay,
  selectedCardId,
  disabled = false,
  maxVisible = 10,
  style,
}: HandViewProps) {
  const { theme } = useTheme();

  const visibleCards = useMemo(() => cards.slice(0, maxVisible), [cards, maxVisible]);
  const hasMore = cards.length > maxVisible;

  const getCardDefinition = useCallback(
    (card: CardInstance): CardDefinition | null => {
      return cardDefinitions.get(card.definitionId) ?? null;
    },
    [cardDefinitions]
  );

  // Use useCallback to prevent creating new function references
  const handleCardPress = useCallback(
    (cardId: string) => {
      if (disabled) return;

      if (selectedCardId === cardId) {
        // Double tap to play
        onCardPlay?.(cardId);
      } else {
        onCardSelect?.(cardId);
      }
    },
    [disabled, selectedCardId, onCardPlay, onCardSelect]
  );

  const handleCardLongPress = useCallback(
    (cardId: string) => {
      onCardPlay?.(cardId);
    },
    [onCardPlay]
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>手牌 ({cards.length})</Text>
        {hasMore && (
          <Text style={[styles.moreText, { color: theme.colors.textSecondary }]}>
            +{cards.length - maxVisible} more
          </Text>
        )}
      </View>

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
              <CardWithHandlers
                card={definition}
                cardId={card.instanceId}
                onCardPress={handleCardPress}
                onCardLongPress={handleCardLongPress}
                selected={selectedCardId === card.instanceId}
                disabled={disabled}
              />
            </View>
          );
        })}
      </ScrollView>

      {selectedCardId && (
        <View style={[styles.hint, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
            点击打出 | 长按查看详情
          </Text>
        </View>
      )}
    </View>
  );
}

/** Wrapper component to memoize card press handlers */
const CardWithHandlers = memo(function CardWithHandlers({
  card,
  cardId,
  onCardPress,
  onCardLongPress,
  selected,
  disabled,
}: {
  card: CardDefinition;
  cardId: string;
  onCardPress: (cardId: string) => void;
  onCardLongPress: (cardId: string) => void;
  selected: boolean;
  disabled: boolean;
}) {
  const handlePress = useCallback(() => onCardPress(cardId), [onCardPress, cardId]);
  const handleLongPress = useCallback(() => onCardLongPress(cardId), [onCardLongPress, cardId]);

  return (
    <Card
      card={card}
      onPress={handlePress}
      onLongPress={handleLongPress}
      selected={selected}
      disabled={disabled}
      size="medium"
    />
  );
});

/**
 * Memoized HandView component to prevent unnecessary re-renders.
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
  hintText: {
    fontSize: 12,
  },
});
