import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { CardDefinition, CardRarity } from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';

interface CardProps {
  card: CardDefinition;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  faceDown?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const rarityColors: Record<CardRarity, string> = {
  common: '#9E9E9E',
  uncommon: '#4CAF50',
  rare: '#2196F3',
  legendary: '#FF9800',
};

const typeIcons: Record<string, string> = {
  action: '⚡',
  event: '📋',
  resource: '💎',
  character: '👤',
  modifier: '🔧',
};

export function Card({
  card,
  onPress,
  onLongPress,
  disabled = false,
  selected = false,
  faceDown = false,
  size = 'medium',
  style,
}: CardProps) {
  const { theme } = useTheme();

  const sizeStyles = getSizeStyles(size, theme.cardStyles);
  const rarityColor = rarityColors[card.rarity ?? 'common'];
  const typeIcon = typeIcons[card.type] ?? '📄';

  if (faceDown) {
    return (
      <View
        style={[
          styles.card,
          sizeStyles.card,
          styles.faceDown,
          { backgroundColor: theme.colors.primary },
          style,
        ]}
      >
        <Text style={styles.faceDownText}>🎴</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.card,
        sizeStyles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: selected ? theme.colors.accent : rarityColor,
          borderWidth: selected ? 3 : 2,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: rarityColor }]}>
        <Text style={[styles.typeIcon, sizeStyles.typeIcon]}>{typeIcon}</Text>
        {card.cost !== undefined && card.cost > 0 && (
          <View style={styles.costBadge}>
            <Text style={styles.costText}>{card.cost}</Text>
          </View>
        )}
      </View>

      {/* Name */}
      <Text
        style={[
          styles.name,
          sizeStyles.name,
          { color: theme.colors.text },
        ]}
        numberOfLines={2}
      >
        {card.name}
      </Text>

      {/* Description */}
      <Text
        style={[
          styles.description,
          sizeStyles.description,
          { color: theme.colors.textSecondary },
        ]}
        numberOfLines={size === 'small' ? 2 : 4}
      >
        {card.description}
      </Text>

      {/* Tags */}
      {card.tags && card.tags.length > 0 && size !== 'small' && (
        <View style={styles.tags}>
          {card.tags.slice(0, 2).map((tag, index) => (
            <View
              key={index}
              style={[styles.tag, { backgroundColor: theme.colors.background }]}
            >
              <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Rarity indicator */}
      <View style={[styles.rarityBar, { backgroundColor: rarityColor }]} />
    </TouchableOpacity>
  );
}

function getSizeStyles(
  size: 'small' | 'medium' | 'large',
  cardStyles: { width: number; height: number }
) {
  const scales = {
    small: 0.7,
    medium: 1,
    large: 1.3,
  };

  const scale = scales[size];

  return {
    card: {
      width: cardStyles.width * scale,
      height: cardStyles.height * scale,
    } as ViewStyle,
    typeIcon: {
      fontSize: 16 * scale,
    } as TextStyle,
    name: {
      fontSize: 12 * scale,
    } as TextStyle,
    description: {
      fontSize: 9 * scale,
    } as TextStyle,
  };
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  faceDown: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceDownText: {
    fontSize: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeIcon: {
    color: '#fff',
  },
  costBadge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  costText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  name: {
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  description: {
    paddingHorizontal: 6,
    textAlign: 'center',
    flex: 1,
  },
  tags: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingBottom: 4,
    flexWrap: 'wrap',
    gap: 2,
  },
  tag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 8,
  },
  rarityBar: {
    height: 3,
  },
});
