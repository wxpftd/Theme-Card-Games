import React, { useEffect, memo, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const _dimensions = Dimensions.get('window');

// ============================================================================
// 浮动表情效果 - 用于正面/负面反馈
// ============================================================================

interface FloatingEmojiProps {
  emoji: string;
  startX: number;
  startY: number;
  onComplete?: () => void;
}

function FloatingEmojiComponent({ emoji, startX, startY, onComplete }: FloatingEmojiProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.5);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // 随机水平偏移
    const randomX = (Math.random() - 0.5) * 60;
    translateX.value = withTiming(randomX, { duration: 1500 });

    // 向上飘动
    translateY.value = withTiming(-120, { duration: 1500, easing: Easing.out(Easing.quad) });

    // 缩放和旋转
    scale.value = withSequence(
      withSpring(1.2, { damping: 8 }),
      withTiming(0.8, { duration: 1000 })
    );
    rotate.value = withSequence(
      withTiming(15, { duration: 200 }),
      withTiming(-15, { duration: 200 }),
      withTiming(10, { duration: 200 }),
      withTiming(-10, { duration: 200 }),
      withTiming(0, { duration: 200 })
    );

    // 淡出
    opacity.value = withDelay(
      1000,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.floatingEmoji, { left: startX, top: startY }, animatedStyle]}>
      <Text style={styles.emojiText}>{emoji}</Text>
    </Animated.View>
  );
}

export const FloatingEmoji = memo(FloatingEmojiComponent);

// ============================================================================
// 连击爆炸效果
// ============================================================================

interface ComboExplosionProps {
  x: number;
  y: number;
  comboName: string;
  onComplete?: () => void;
}

function ComboExplosionComponent({ x, y, comboName, onComplete }: ComboExplosionProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(1);

  useEffect(() => {
    // 主体爆炸
    scale.value = withSequence(
      withSpring(1.3, { damping: 6, stiffness: 200 }),
      withTiming(1, { duration: 200 }),
      withDelay(800, withTiming(0.8, { duration: 200 }))
    );

    // 光环扩散
    ringScale.value = withTiming(2.5, { duration: 800, easing: Easing.out(Easing.quad) });
    ringOpacity.value = withDelay(200, withTiming(0, { duration: 600 }));

    // 整体淡出
    opacity.value = withDelay(
      1200,
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={[styles.explosionContainer, { left: x - 75, top: y - 75 }]}>
      {/* 光环 */}
      <Animated.View style={[styles.explosionRing, ringStyle]} />

      {/* 主体 */}
      <Animated.View style={[styles.explosionMain, containerStyle]}>
        <Text style={styles.explosionIcon}>💥</Text>
        <Text style={styles.explosionText}>{comboName}</Text>
      </Animated.View>

      {/* 粒子 */}
      {[...Array(8)].map((_, i) => (
        <ExplosionParticle key={i} index={i} />
      ))}
    </View>
  );
}

function ExplosionParticle({ index }: { index: number }) {
  const angle = (index / 8) * Math.PI * 2;
  const distance = 60 + Math.random() * 30;
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateX.value = withTiming(Math.cos(angle) * distance, { duration: 600 });
    translateY.value = withTiming(Math.sin(angle) * distance, { duration: 600 });
    opacity.value = withDelay(300, withTiming(0, { duration: 300 }));
    scale.value = withTiming(0.3, { duration: 600 });
  }, []);

  const particleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const colors = [
    '#FFD700',
    '#FF6B6B',
    '#4ECDC4',
    '#9B59B6',
    '#FF9800',
    '#4CAF50',
    '#E91E63',
    '#00BCD4',
  ];

  return (
    <Animated.View
      style={[styles.particle, { backgroundColor: colors[index % colors.length] }, particleStyle]}
    />
  );
}

export const ComboExplosion = memo(ComboExplosionComponent);

// ============================================================================
// 晋升庆祝效果
// ============================================================================

interface LevelUpCelebrationProps {
  level: string;
  onComplete?: () => void;
}

function LevelUpCelebrationComponent({ level, onComplete }: LevelUpCelebrationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const starRotate = useSharedValue(0);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    // 主体弹出
    scale.value = withSequence(
      withSpring(1.2, { damping: 6, stiffness: 150 }),
      withTiming(1, { duration: 200 })
    );

    // 星星旋转
    starRotate.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    // 光晕脉动
    glowScale.value = withRepeat(
      withSequence(withTiming(1.2, { duration: 500 }), withTiming(1, { duration: 500 })),
      3,
      false
    );

    // 淡出
    opacity.value = withDelay(
      2500,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${starRotate.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <View style={styles.levelUpOverlay}>
      {/* 背景光晕 */}
      <Animated.View style={[styles.levelUpGlow, glowStyle]} />

      <Animated.View style={[styles.levelUpContainer, containerStyle]}>
        {/* 旋转星星 */}
        <Animated.View style={[styles.starContainer, starStyle]}>
          {[...Array(6)].map((_, i) => (
            <Text
              key={i}
              style={[
                styles.star,
                {
                  transform: [{ rotate: `${i * 60}deg` }, { translateY: -80 }],
                },
              ]}
            >
              ⭐
            </Text>
          ))}
        </Animated.View>

        {/* 主体内容 */}
        <View style={styles.levelUpContent}>
          <Text style={styles.levelUpIcon}>🎊</Text>
          <Text style={styles.levelUpTitle}>晋升了！</Text>
          <Text style={styles.levelUpLevel}>{level}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

export const LevelUpCelebration = memo(LevelUpCelebrationComponent);

// ============================================================================
// 警告闪烁效果
// ============================================================================

interface DangerFlashProps {
  message: string;
  onComplete?: () => void;
}

function DangerFlashComponent({ message, onComplete }: DangerFlashProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const borderOpacity = useSharedValue(0);

  useEffect(() => {
    // 闪烁效果
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0.7, { duration: 100 }),
      withTiming(1, { duration: 100 }),
      withTiming(0.7, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    scale.value = withSequence(withSpring(1.05, { damping: 10 }), withTiming(1, { duration: 200 }));

    // 边框脉动
    borderOpacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 })),
      3,
      false
    );

    // 淡出
    opacity.value = withDelay(
      2000,
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const borderStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  return (
    <Animated.View style={[styles.dangerContainer, containerStyle]}>
      <Animated.View style={[styles.dangerBorder, borderStyle]} />
      <View style={styles.dangerContent}>
        <Text style={styles.dangerIcon}>⚠️</Text>
        <Text style={styles.dangerText}>{message}</Text>
      </View>
    </Animated.View>
  );
}

export const DangerFlash = memo(DangerFlashComponent);

// ============================================================================
// 金币收集效果
// ============================================================================

interface CoinCollectProps {
  amount: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  onComplete?: () => void;
}

function CoinCollectComponent({
  amount,
  startX,
  startY,
  endX,
  endY,
  onComplete,
}: CoinCollectProps) {
  const coins = useMemo(() => {
    return [...Array(Math.min(amount, 10))].map((_, i) => ({
      id: i,
      delay: i * 50,
      offsetX: (Math.random() - 0.5) * 40,
      offsetY: (Math.random() - 0.5) * 40,
    }));
  }, [amount]);

  return (
    <View style={styles.coinContainer}>
      {coins.map((coin, index) => (
        <CoinParticle
          key={coin.id}
          startX={startX + coin.offsetX}
          startY={startY + coin.offsetY}
          endX={endX}
          endY={endY}
          delay={coin.delay}
          onComplete={index === coins.length - 1 ? onComplete : undefined}
        />
      ))}
    </View>
  );
}

function CoinParticle({
  startX,
  startY,
  endX,
  endY,
  delay,
  onComplete,
}: {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
  onComplete?: () => void;
}) {
  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // 弹出
    scale.value = withDelay(delay, withSpring(1, { damping: 8 }));

    // 飞向目标
    translateX.value = withDelay(
      delay + 200,
      withTiming(endX, { duration: 600, easing: Easing.inOut(Easing.quad) })
    );
    translateY.value = withDelay(
      delay + 200,
      withTiming(endY, { duration: 600, easing: Easing.inOut(Easing.quad) })
    );

    // 旋转
    rotate.value = withDelay(delay, withTiming(720, { duration: 800 }));

    // 到达后缩小消失
    scale.value = withDelay(
      delay + 700,
      withTiming(0, { duration: 200 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const coinStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.coin, coinStyle]}>
      <Text style={styles.coinEmoji}>💰</Text>
    </Animated.View>
  );
}

export const CoinCollect = memo(CoinCollectComponent);

// ============================================================================
// 样式定义
// ============================================================================

const styles = StyleSheet.create({
  // 浮动表情
  floatingEmoji: {
    position: 'absolute',
    zIndex: 1000,
  },
  emojiText: {
    fontSize: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // 连击爆炸
  explosionContainer: {
    position: 'absolute',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  explosionRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  explosionMain: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  explosionIcon: {
    fontSize: 28,
  },
  explosionText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // 晋升庆祝
  levelUpOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1000,
  },
  levelUpGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FFD700',
    opacity: 0.3,
  },
  levelUpContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  starContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  star: {
    position: 'absolute',
    fontSize: 24,
  },
  levelUpContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  levelUpIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  levelUpTitle: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  levelUpLevel: {
    color: '#fff',
    fontSize: 20,
    marginTop: 8,
  },

  // 危险警告
  dangerContainer: {
    position: 'absolute',
    top: '40%',
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  dangerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    borderColor: '#F44336',
    borderRadius: 16,
  },
  dangerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.95)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  dangerIcon: {
    fontSize: 28,
  },
  dangerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // 金币收集
  coinContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  coin: {
    position: 'absolute',
  },
  coinEmoji: {
    fontSize: 28,
  },
});
