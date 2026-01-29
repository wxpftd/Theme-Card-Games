/**
 * 带插画的增强版卡牌组件
 * 支持卡牌插画、动画效果和丰富的视觉反馈
 */
import React, { memo, useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Image,
  ImageBackground,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { CardDefinition } from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';
import { rarityStyles, cardTypeIcons } from '../theme/enhancedStyles';
import { getCardImagePath, getSeriesBackground, defaultCardBackPath } from '../assets/cardImages';

interface IllustratedCardProps {
  card: CardDefinition;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  faceDown?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  /** 是否显示发光效果 */
  showGlow?: boolean;
  /** 是否显示入场动画 */
  animateEntry?: boolean;
  /** 入场动画延迟（毫秒） */
  entryDelay?: number;
  /** 是否显示闪光效果 */
  showShimmer?: boolean;
  /** 是否显示插画 */
  showIllustration?: boolean;
  /** 用于 E2E 测试的标识符 */
  testID?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const _AnimatedImage = Animated.createAnimatedComponent(Image);

function IllustratedCardComponent({
  card,
  onPress,
  onLongPress,
  disabled = false,
  selected = false,
  faceDown = false,
  size = 'medium',
  style,
  showGlow = true,
  animateEntry = false,
  entryDelay = 0,
  showShimmer = true,
  showIllustration = true,
  testID,
}: IllustratedCardProps) {
  const { theme } = useTheme();
  const [isReady, setIsReady] = useState(!animateEntry);

  // 动画值
  const scale = useSharedValue(animateEntry ? 0 : 1);
  const opacity = useSharedValue(animateEntry ? 0 : 1);
  const rotateY = useSharedValue(faceDown ? 180 : 0);
  const rotateZ = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const shimmerPosition = useSharedValue(-1);
  const bounceY = useSharedValue(0);

  // 入场动画
  useEffect(() => {
    if (animateEntry) {
      const timeout = setTimeout(() => {
        scale.value = withSpring(1, { damping: 10, stiffness: 80 });
        opacity.value = withTiming(1, { duration: 400 });
        rotateZ.value = withSequence(
          withTiming(-5, { duration: 100 }),
          withSpring(0, { damping: 8 })
        );
        runOnJS(setIsReady)(true);
      }, entryDelay);
      return () => clearTimeout(timeout);
    }
  }, [animateEntry, entryDelay]);

  // 选中状态动画
  useEffect(() => {
    if (selected) {
      scale.value = withSequence(
        withSpring(1.08, { damping: 8 }),
        withSpring(1.05, { damping: 12 })
      );
      glowOpacity.value = withTiming(1, { duration: 200 });
      bounceY.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      scale.value = withSpring(1, { damping: 12 });
      glowOpacity.value = withTiming(0, { duration: 200 });
      bounceY.value = withTiming(0, { duration: 200 });
    }
  }, [selected]);

  // 翻转动画
  useEffect(() => {
    rotateY.value = withTiming(faceDown ? 180 : 0, {
      duration: 500,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [faceDown]);

  // 闪光动画
  useEffect(() => {
    if (showShimmer && !faceDown && isReady) {
      shimmerPosition.value = withRepeat(
        withTiming(2, { duration: 2500, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [showShimmer, faceDown, isReady]);

  // 计算样式
  const sizeStyles = useMemo(() => getSizeStyles(size, theme.cardStyles), [size, theme.cardStyles]);
  const rarity = card.rarity ?? 'common';
  const rarityStyle = rarityStyles[rarity];
  const typeConfig = cardTypeIcons[card.type] || cardTypeIcons.action;
  const cardImagePath = showIllustration ? getCardImagePath(card.id) : null;
  const seriesColors = getSeriesBackground(
    ((card as Record<string, unknown>).series as string) || 'neutral'
  );

  // 动画样式
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { perspective: 1000 },
      { rotateY: `${rotateY.value}deg` },
      { rotateZ: `${rotateZ.value}deg` },
      { translateY: bounceY.value },
    ],
    opacity: opacity.value,
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowOpacity.value, [0, 1], [0, 0.7]),
    transform: [{ scale: 1.1 }],
  }));

  const animatedShimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerPosition.value * 150 }],
    opacity: 0.4,
  }));

  // 卡牌背面
  if (faceDown) {
    return (
      <AnimatedTouchable
        testID={testID ? `${testID}-facedown` : undefined}
        style={[styles.card, sizeStyles.card, styles.faceDown, animatedContainerStyle, style]}
        disabled
      >
        <ImageBackground
          source={{ uri: defaultCardBackPath }}
          style={styles.cardBackImage}
          imageStyle={{ borderRadius: 12 }}
        >
          <View style={styles.cardBackOverlay}>
            <Text style={styles.faceDownEmoji}>🎴</Text>
            <View style={styles.cardBackPattern}>
              {[...Array(4)].map((_, i) => (
                <View
                  key={i}
                  style={[styles.patternStar, { transform: [{ rotate: `${i * 45}deg` }] }]}
                >
                  <Text style={styles.patternStarText}>✦</Text>
                </View>
              ))}
            </View>
          </View>
        </ImageBackground>
      </AnimatedTouchable>
    );
  }

  return (
    <View style={[styles.cardWrapper, sizeStyles.card]}>
      {/* 发光效果层 */}
      {showGlow && (
        <Animated.View
          style={[
            styles.glowLayer,
            sizeStyles.card,
            {
              backgroundColor: rarityStyle.glowColor,
              shadowColor: rarityStyle.borderColor,
            },
            animatedGlowStyle,
          ]}
        />
      )}

      <AnimatedTouchable
        testID={testID}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`卡牌 ${card.name}`}
        accessibilityState={{ disabled, selected }}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        activeOpacity={0.9}
        style={[
          styles.card,
          sizeStyles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: selected ? theme.colors.accent : rarityStyle.borderColor,
            borderWidth: selected ? 3 : 2,
            opacity: disabled ? 0.5 : 1,
          },
          animatedContainerStyle,
          style,
        ]}
      >
        {/* 插画区域 */}
        {cardImagePath ? (
          <View style={[styles.illustrationContainer, { height: sizeStyles.illustrationHeight }]}>
            <Image source={{ uri: cardImagePath }} style={styles.illustration} resizeMode="cover" />
            {/* 插画渐变遮罩 */}
            <View style={[styles.illustrationGradient, { backgroundColor: seriesColors[0] }]} />

            {/* 费用徽章 */}
            {card.cost !== undefined && card.cost > 0 && (
              <View style={[styles.costBadgeOverlay, { backgroundColor: rarityStyle.borderColor }]}>
                <Text style={styles.costText}>{card.cost}</Text>
                <Text style={styles.costIcon}>⚡</Text>
              </View>
            )}

            {/* 类型图标 */}
            <View style={[styles.typeIconOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <Text style={[styles.typeIconText, { color: typeConfig.color }]}>
                {typeConfig.icon}
              </Text>
            </View>
          </View>
        ) : (
          /* 无插画时的头部 */
          <View style={[styles.header, { backgroundColor: rarityStyle.borderColor }]}>
            <View style={styles.headerContent}>
              <Text style={[styles.typeIcon, sizeStyles.typeIcon, { color: typeConfig.color }]}>
                {typeConfig.icon}
              </Text>
              <Text style={[styles.typeName, { color: '#fff' }]}>{card.type}</Text>
            </View>
            {card.cost !== undefined && card.cost > 0 && (
              <View style={styles.costBadge}>
                <Text style={styles.costText}>{card.cost}</Text>
                <Text style={styles.costIcon}>⚡</Text>
              </View>
            )}
          </View>
        )}

        {/* 卡牌名称 */}
        <View style={[styles.nameContainer, cardImagePath && styles.nameContainerWithImage]}>
          <Text
            style={[
              styles.name,
              sizeStyles.name,
              { color: theme.colors.text },
              cardImagePath && styles.nameWithImage,
            ]}
            numberOfLines={2}
          >
            {card.name}
          </Text>
        </View>

        {/* 分隔线 */}
        <View style={[styles.divider, { backgroundColor: rarityStyle.borderColor }]} />

        {/* 描述 */}
        <View style={styles.descriptionContainer}>
          <Text
            style={[
              styles.description,
              sizeStyles.description,
              { color: theme.colors.textSecondary },
            ]}
            numberOfLines={size === 'small' ? 2 : 3}
          >
            {card.description}
          </Text>
        </View>

        {/* 风味文字 */}
        {(card as Record<string, unknown>).flavorText && size !== 'small' && (
          <View style={styles.flavorContainer}>
            <Text
              style={[styles.flavorText, { color: theme.colors.textSecondary }]}
              numberOfLines={1}
            >
              "{String((card as Record<string, unknown>).flavorText)}"
            </Text>
          </View>
        )}

        {/* 标签 */}
        {card.tags && card.tags.length > 0 && size !== 'small' && (
          <View style={styles.tags}>
            {card.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 稀有度指示条 */}
        <View style={styles.rarityBarContainer}>
          <View style={[styles.rarityBar, { backgroundColor: rarityStyle.borderColor }]} />
          {showShimmer && (
            <Animated.View
              style={[
                styles.rarityShimmer,
                { backgroundColor: rarityStyle.shimmerColor },
                animatedShimmerStyle,
              ]}
            />
          )}
        </View>

        {/* 稀有度角标 */}
        {rarity !== 'common' && (
          <View style={[styles.rarityBadge, { backgroundColor: rarityStyle.borderColor }]}>
            <Text style={styles.rarityBadgeText}>
              {rarity === 'legendary' ? '★' : rarity === 'rare' ? '◆' : '●'}
            </Text>
          </View>
        )}
      </AnimatedTouchable>
    </View>
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
      height: cardStyles.height * scale * 1.15, // 稍微增加高度以容纳插画
    } as ViewStyle,
    illustrationHeight: 70 * scale,
    typeIcon: {
      fontSize: 18 * scale,
    } as TextStyle,
    name: {
      fontSize: 12 * scale,
    } as TextStyle,
    description: {
      fontSize: 9 * scale,
    } as TextStyle,
  };
}

export const IllustratedCard = memo(IllustratedCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.faceDown === nextProps.faceDown &&
    prevProps.size === nextProps.size &&
    prevProps.testID === nextProps.testID &&
    prevProps.showGlow === nextProps.showGlow &&
    prevProps.animateEntry === nextProps.animateEntry &&
    prevProps.showShimmer === nextProps.showShimmer &&
    prevProps.showIllustration === nextProps.showIllustration
  );
});

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
  },
  glowLayer: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  faceDown: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceDownEmoji: {
    fontSize: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  cardBackPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternStar: {
    position: 'absolute',
  },
  patternStarText: {
    fontSize: 20,
    color: 'rgba(255, 215, 0, 0.4)',
  },
  illustrationContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  illustrationGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    opacity: 0.8,
  },
  costBadgeOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  typeIconOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIconText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  typeName: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 2,
  },
  costText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  costIcon: {
    fontSize: 10,
  },
  nameContainer: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  nameContainerWithImage: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  name: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  nameWithImage: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginHorizontal: 12,
    opacity: 0.3,
  },
  descriptionContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 13,
  },
  flavorContainer: {
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  flavorText: {
    fontSize: 8,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.7,
  },
  tags: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingBottom: 4,
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 8,
    fontWeight: '500',
  },
  rarityBarContainer: {
    height: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  rarityBar: {
    ...StyleSheet.absoluteFillObject,
  },
  rarityShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: '100%',
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  rarityBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default IllustratedCard;
