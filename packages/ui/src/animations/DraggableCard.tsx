/**
 * 可拖拽卡牌组件
 * - 手势拖拽（GestureDetector）
 * - 向上拖超过阈值 = 打出
 * - 飞出 + 缩小动画
 */
import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, ViewStyle, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CardDefinition, CardRarity } from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';

// 拖拽阈值（向上拖动超过此值触发打出）
const PLAY_THRESHOLD = -80;
// 回弹动画配置
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

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

interface DraggableCardProps {
  card: CardDefinition;
  cardInstanceId: string;
  onPlay?: (cardId: string) => void;
  onSelect?: (cardId: string) => void;
  onLongPress?: (cardId: string) => void;
  disabled?: boolean;
  selected?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

function DraggableCardComponent({
  card,
  cardInstanceId,
  onPlay,
  onSelect,
  onLongPress,
  disabled = false,
  selected = false,
  size = 'medium',
  style,
}: DraggableCardProps) {
  const { theme } = useTheme();

  // 拖拽状态
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const isPlaying = useSharedValue(false);
  const opacity = useSharedValue(1);

  // 计算尺寸
  const sizeStyles = useMemo(() => getSizeStyles(size, theme.cardStyles), [size, theme.cardStyles]);
  const rarityColor = rarityColors[card.rarity ?? 'common'];
  const typeIcon = typeIcons[card.type] ?? '📄';

  // 触发选中震动反馈
  const triggerSelectionHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, []);

  // 触发打出震动反馈
  const triggerPlayHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  // 打出卡牌回调
  const handlePlay = useCallback(() => {
    onPlay?.(cardInstanceId);
  }, [onPlay, cardInstanceId]);

  // 选中卡牌回调
  const handleSelect = useCallback(() => {
    onSelect?.(cardInstanceId);
  }, [onSelect, cardInstanceId]);

  // 长按回调
  const handleLongPress = useCallback(() => {
    onLongPress?.(cardInstanceId);
  }, [onLongPress, cardInstanceId]);

  // 拖拽手势
  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      scale.value = withSpring(1.05, SPRING_CONFIG);
      runOnJS(triggerSelectionHaptic)();
    })
    .onUpdate((event) => {
      if (isPlaying.value) return;

      translateX.value = event.translationX * 0.3; // 水平方向阻尼
      translateY.value = event.translationY;

      // 根据拖拽距离旋转卡牌
      rotate.value = interpolate(
        event.translationX,
        [-100, 0, 100],
        [-5, 0, 5],
        Extrapolation.CLAMP
      );

      // 接近阈值时的视觉提示
      if (event.translationY < PLAY_THRESHOLD * 0.5) {
        scale.value = withSpring(1.1, SPRING_CONFIG);
      }
    })
    .onEnd((event) => {
      if (isPlaying.value) return;

      // 检查是否达到打出阈值
      if (event.translationY < PLAY_THRESHOLD) {
        // 触发打出动画
        isPlaying.value = true;
        runOnJS(triggerPlayHaptic)();

        // 飞出 + 缩小动画
        translateY.value = withTiming(-500, {
          duration: 300,
          easing: Easing.in(Easing.quad),
        });
        scale.value = withTiming(0.5, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 }, () => {
          // 动画完成后回调
          runOnJS(handlePlay)();
        });
        rotate.value = withTiming(0, { duration: 300 });
      } else {
        // 回弹到原位
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
        scale.value = withSpring(selected ? 1.05 : 1, SPRING_CONFIG);
        rotate.value = withSpring(0, SPRING_CONFIG);

        // 轻触视为选中
        if (Math.abs(event.translationX) < 10 && Math.abs(event.translationY) < 10) {
          runOnJS(handleSelect)();
        }
      }
    });

  // 长按手势
  const longPressGesture = Gesture.LongPress()
    .enabled(!disabled)
    .minDuration(500)
    .onStart(() => {
      runOnJS(triggerPlayHaptic)();
      runOnJS(handleLongPress)();
    });

  // 组合手势
  const composedGesture = Gesture.Race(panGesture, longPressGesture);

  // 动画样式
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  // 选中状态样式
  const selectedStyle = useMemo(
    () =>
      selected
        ? {
            borderColor: theme.colors.accent,
            borderWidth: 3,
            shadowColor: theme.colors.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 8,
          }
        : {
            borderColor: rarityColor,
            borderWidth: 2,
          },
    [selected, theme.colors.accent, rarityColor]
  );

  // 拖拽提示区域（超过阈值显示）
  const hintStyle = useAnimatedStyle(() => {
    const shouldShow = translateY.value < PLAY_THRESHOLD * 0.5;
    return {
      opacity: shouldShow
        ? interpolate(translateY.value, [PLAY_THRESHOLD, PLAY_THRESHOLD * 0.5], [1, 0])
        : 0,
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.card,
          sizeStyles.card,
          {
            backgroundColor: theme.colors.surface,
            opacity: disabled ? 0.5 : 1,
          },
          selectedStyle,
          animatedStyle,
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
          style={[styles.name, sizeStyles.name, { color: theme.colors.text }]}
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
              <View key={index} style={[styles.tag, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Rarity indicator */}
        <View style={[styles.rarityBar, { backgroundColor: rarityColor }]} />

        {/* 拖拽提示（向上拖时显示） */}
        <Animated.View style={[styles.playHint, hintStyle]}>
          <Text style={styles.playHintText}>⬆️ 松开打出</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

export const DraggableCard = memo(DraggableCardComponent);

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
    },
    name: {
      fontSize: 12 * scale,
    },
    description: {
      fontSize: 9 * scale,
    },
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
  playHint: {
    position: 'absolute',
    top: -30,
    alignSelf: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  playHintText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
