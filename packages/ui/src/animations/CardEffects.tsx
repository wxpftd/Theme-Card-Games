/**
 * 卡牌特效组件
 * 提供抽卡、出牌、连击等丰富的动画效果
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * 抽卡特效 - 卡牌从牌堆飞出
 */
interface DrawCardEffectProps {
  visible: boolean;
  cardCount?: number;
  onComplete?: () => void;
}

export function DrawCardEffect({ visible, cardCount = 1, onComplete }: DrawCardEffectProps) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const rotation = useSharedValue(-30);

  useEffect(() => {
    if (visible) {
      progress.value = 0;
      scale.value = 0.5;
      rotation.value = -30;

      progress.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.5)) });
      scale.value = withSpring(1, { damping: 8, stiffness: 100 });
      rotation.value = withSequence(
        withTiming(10, { duration: 200 }),
        withSpring(0, { damping: 10 })
      );

      if (onComplete) {
        setTimeout(() => runOnJS(onComplete)(), 700);
      }
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [100, 0]) },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  if (!visible) return null;

  return (
    <View style={styles.effectOverlay} pointerEvents="none">
      <Animated.View style={[styles.drawCardContainer, animatedStyle]}>
        <Text style={styles.drawCardEmoji}>🎴</Text>
        {cardCount > 1 && (
          <View style={styles.cardCountBadge}>
            <Text style={styles.cardCountText}>+{cardCount}</Text>
          </View>
        )}
        <Text style={styles.drawCardText}>抽卡!</Text>
      </Animated.View>
    </View>
  );
}

/**
 * 出牌特效 - 卡牌飞向场地
 */
interface PlayCardEffectProps {
  visible: boolean;
  cardName?: string;
  cardType?: string;
  onComplete?: () => void;
}

export function PlayCardEffect({ visible, cardName, cardType, onComplete }: PlayCardEffectProps) {
  const scale = useSharedValue(1.5);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-50);

  useEffect(() => {
    if (visible) {
      scale.value = 1.5;
      opacity.value = 0;
      translateY.value = -50;

      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(600, withTiming(0, { duration: 300 }))
      );
      scale.value = withSequence(
        withSpring(1, { damping: 8 }),
        withDelay(500, withTiming(0.8, { duration: 200 }))
      );
      translateY.value = withSequence(
        withSpring(0, { damping: 12 }),
        withDelay(500, withTiming(50, { duration: 200 }))
      );

      if (onComplete) {
        setTimeout(() => runOnJS(onComplete)(), 1100);
      }
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  if (!visible) return null;

  const typeEmoji =
    {
      action: '⚡',
      event: '📋',
      resource: '💎',
      work: '💼',
      rest: '☕',
      social: '🤝',
      growth: '📚',
    }[cardType || 'action'] || '🎴';

  return (
    <View style={styles.effectOverlay} pointerEvents="none">
      <Animated.View style={[styles.playCardContainer, animatedStyle]}>
        <Text style={styles.playCardEmoji}>{typeEmoji}</Text>
        {cardName && <Text style={styles.playCardName}>{cardName}</Text>}
      </Animated.View>
    </View>
  );
}

/**
 * 连击特效 - 连续出牌时的爆炸效果
 */
interface ComboEffectProps {
  visible: boolean;
  comboCount: number;
  onComplete?: () => void;
}

export function ComboEffect({ visible, comboCount, onComplete }: ComboEffectProps) {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible && comboCount >= 2) {
      scale.value = 0;
      rotation.value = 0;
      opacity.value = 0;

      scale.value = withSequence(
        withSpring(1.2, { damping: 6 }),
        withTiming(1, { duration: 200 }),
        withDelay(400, withTiming(0, { duration: 300 }))
      );
      rotation.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withSpring(0, { damping: 8 })
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withDelay(600, withTiming(0, { duration: 200 }))
      );

      if (onComplete) {
        setTimeout(() => runOnJS(onComplete)(), 950);
      }
    }
  }, [visible, comboCount]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  if (!visible || comboCount < 2) return null;

  const comboEmoji = comboCount >= 5 ? '🔥' : comboCount >= 3 ? '💥' : '✨';
  const comboColor = comboCount >= 5 ? '#FF6B6B' : comboCount >= 3 ? '#FFD93D' : '#6BCB77';

  return (
    <View style={styles.effectOverlay} pointerEvents="none">
      <Animated.View style={[styles.comboContainer, animatedStyle]}>
        <Text style={styles.comboEmoji}>{comboEmoji}</Text>
        <Text style={[styles.comboText, { color: comboColor }]}>{comboCount}连击!</Text>
        <View style={styles.comboStars}>
          {[...Array(Math.min(comboCount, 5))].map((_, i) => (
            <Text key={i} style={styles.comboStar}>
              ⭐
            </Text>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

/**
 * 属性变化特效
 */
interface StatChangeEffectProps {
  visible: boolean;
  statName: string;
  value: number;
  isPositive: boolean;
  onComplete?: () => void;
}

export function StatChangeEffect({
  visible,
  statName,
  value,
  isPositive,
  onComplete,
}: StatChangeEffectProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (visible) {
      translateY.value = 0;
      opacity.value = 0;
      scale.value = 0.5;

      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(800, withTiming(0, { duration: 300 }))
      );
      translateY.value = withTiming(-60, { duration: 1300, easing: Easing.out(Easing.ease) });
      scale.value = withSpring(1, { damping: 10 });

      if (onComplete) {
        setTimeout(() => runOnJS(onComplete)(), 1300);
      }
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (!visible) return null;

  const color = isPositive ? '#4CAF50' : '#F44336';
  const icon = isPositive ? '↑' : '↓';
  const prefix = isPositive ? '+' : '';

  return (
    <Animated.View style={[styles.statChangeContainer, animatedStyle]}>
      <Text style={[styles.statChangeText, { color }]}>
        {icon} {statName} {prefix}
        {value}
      </Text>
    </Animated.View>
  );
}

/**
 * 胜利烟花特效
 */
interface VictoryFireworksProps {
  visible: boolean;
  onComplete?: () => void;
}

export function VictoryFireworks({ visible, onComplete }: VictoryFireworksProps) {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    angle: (i / 20) * 360,
    delay: Math.random() * 500,
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#9B59B6', '#FF9800'][i % 5],
  }));

  useEffect(() => {
    if (visible && onComplete) {
      setTimeout(() => runOnJS(onComplete)(), 2500);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.fireworksContainer} pointerEvents="none">
      {particles.map((particle) => (
        <FireworkParticle key={particle.id} {...particle} />
      ))}
      <View style={styles.victoryTextContainer}>
        <Text style={styles.victoryEmoji}>🎉</Text>
        <Text style={styles.victoryText}>胜利!</Text>
        <Text style={styles.victoryEmoji}>🎉</Text>
      </View>
    </View>
  );
}

function FireworkParticle({
  angle,
  delay,
  color,
}: {
  angle: number;
  delay: number;
  color: string;
}) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) })
    );
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(800, withTiming(0, { duration: 500 }))
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const distance = interpolate(progress.value, [0, 1], [0, 150]);
    const radians = (angle * Math.PI) / 180;
    return {
      opacity: opacity.value,
      transform: [
        { translateX: Math.cos(radians) * distance },
        { translateY: Math.sin(radians) * distance },
        { scale: interpolate(progress.value, [0, 0.5, 1], [0.5, 1.2, 0.3]) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.fireworkParticle, { backgroundColor: color }, animatedStyle]} />
  );
}

/**
 * 回合开始特效
 */
interface TurnStartEffectProps {
  visible: boolean;
  turnNumber: number;
  message?: string;
  onComplete?: () => void;
}

export function TurnStartEffect({
  visible,
  turnNumber,
  message,
  onComplete,
}: TurnStartEffectProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const slideX = useSharedValue(-SCREEN_WIDTH);

  useEffect(() => {
    if (visible) {
      scale.value = 0;
      opacity.value = 0;
      slideX.value = -SCREEN_WIDTH;

      slideX.value = withSequence(
        withSpring(0, { damping: 12 }),
        withDelay(1500, withTiming(SCREEN_WIDTH, { duration: 300 }))
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(1500, withTiming(0, { duration: 300 }))
      );
      scale.value = withSequence(
        withSpring(1, { damping: 8 }),
        withDelay(1500, withTiming(0.8, { duration: 200 }))
      );

      if (onComplete) {
        setTimeout(() => runOnJS(onComplete)(), 2000);
      }
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: slideX.value }, { scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.turnStartOverlay} pointerEvents="none">
      <Animated.View style={[styles.turnStartContainer, animatedStyle]}>
        <Text style={styles.turnStartEmoji}>📅</Text>
        <Text style={styles.turnStartText}>第 {turnNumber} 回合</Text>
        {message && <Text style={styles.turnStartMessage}>{message}</Text>}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  effectOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  drawCardContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 20,
  },
  drawCardEmoji: {
    fontSize: 64,
  },
  cardCountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF6B6B',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardCountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  drawCardText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  playCardContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 136, 229, 0.9)',
    paddingHorizontal: 40,
    paddingVertical: 24,
    borderRadius: 24,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  playCardEmoji: {
    fontSize: 56,
  },
  playCardName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  comboContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 36,
    paddingVertical: 20,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#FFD93D',
  },
  comboEmoji: {
    fontSize: 48,
  },
  comboText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  comboStars: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 4,
  },
  comboStar: {
    fontSize: 20,
  },
  statChangeContainer: {
    position: 'absolute',
    top: '40%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statChangeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  fireworksContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  fireworkParticle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  victoryTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    gap: 12,
  },
  victoryEmoji: {
    fontSize: 36,
  },
  victoryText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  turnStartOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  turnStartContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.95)',
    paddingHorizontal: 48,
    paddingVertical: 24,
    borderRadius: 20,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  turnStartEmoji: {
    fontSize: 40,
  },
  turnStartText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  turnStartMessage: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default {
  DrawCardEffect,
  PlayCardEffect,
  ComboEffect,
  StatChangeEffect,
  VictoryFireworks,
  TurnStartEffect,
};
