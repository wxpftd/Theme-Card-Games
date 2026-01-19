import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ViewStyle,
} from 'react-native';
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

export function HandView({
  cards,
  cardDefinitions,
  onCardSelect,
  onCardPlay,
  selectedCardId,
  disabled = false,
  maxVisible = 10,
  style,
}: HandViewProps) {
  const { theme, t } = useTheme();
  const [expandedView, setExpandedView] = useState(false);

  const visibleCards = cards.slice(0, maxVisible);
  const hasMore = cards.length > maxVisible;

  const getCardDefinition = (card: CardInstance): CardDefinition | null => {
    return cardDefinitions.get(card.definitionId) ?? null;
  };

  const handleCardPress = (cardId: string) => {
    if (disabled) return;

    if (selectedCardId === cardId) {
      // Double tap to play
      onCardPlay?.(cardId);
    } else {
      onCardSelect?.(cardId);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          手牌 ({cards.length})
        </Text>
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
              <Card
                card={definition}
                onPress={() => handleCardPress(card.instanceId)}
                onLongPress={() => onCardPlay?.(card.instanceId)}
                selected={selectedCardId === card.instanceId}
                disabled={disabled}
                size="medium"
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
