/**
 * 组合触发特效组件
 * - 震动反馈（Haptics）
 * - 卡片缩放 + 旋转 + 粒子效果
 * - 自动2秒消失
 */
import React, { useEffect, memo, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  withRepeat,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ComboTriggerData {
  id: string;
  comboName: string;
  comboIcon?: string;
  comboDescription?: string;
  bonusEffects?: string[];
}

interface ComboTriggerEffectProps {
  combo: ComboTriggerData;
  onComplete?: (id: string) => void;
}

const DISPLAY_DURATION = 2000;
const PARTICLE_COUNT = 12;

// 粒子组件
const Particle = memo(function Particle({
  index,
  totalCount,
  color,
}: {
  index: number;
  totalCount: number;
  color: string;
}) {
  const angle = (index / totalCount) * Math.PI * 2;
  const distance = 80 + Math.random() * 40;

  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 800 + Math.random() * 400,
      easing: Easing.out(Easing.quad),
    });
    opacity.value = withDelay(
      400,
      withTiming(0, { duration: 600, easing: Easing.in(Easing.quad) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const x = Math.cos(angle) * distance * progress.value;
    const y = Math.sin(angle) * distance * progress.value;
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.5, 1.2, 0.3]);

    return {
      opacity: opacity.value,
      transform: [{ translateX: x }, { translateY: y }, { scale }],
    };
  });

  return <Animated.View style={[styles.particle, { backgroundColor: color }, animatedStyle]} />;
});

function ComboTriggerEffectComponent({ combo, onComplete }: ComboTriggerEffectProps) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);
  const glowScale = useSharedValue(1);

  // 触发震动反馈
  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  useEffect(() => {
    // 触发震动
    triggerHaptic();

    // 主体动画
    opacity.value = withSequence(
      withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }),
      withDelay(
        DISPLAY_DURATION - 400,
        withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) })
      )
    );

    scale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }),
      withDelay(
        DISPLAY_DURATION - 600,
        withTiming(0.8, { duration: 200, easing: Easing.in(Easing.quad) })
      )
    );

    rotate.value = withSequence(
      withTiming(-5, { duration: 100 }),
      withTiming(5, { duration: 100 }),
      withTiming(-3, { duration: 80 }),
      withTiming(3, { duration: 80 }),
      withTiming(0, { duration: 60 })
    );

    // 光晕脉动
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 300, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.quad) })
      ),
      3,
      false
    );

    // 完成回调
    const timeout = setTimeout(() => {
      onComplete?.(combo.id);
    }, DISPLAY_DURATION);

    return () => clearTimeout(timeout);
  }, [combo.id, onComplete, triggerHaptic]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: interpolate(glowScale.value, [1, 1.3], [0.6, 0.2]),
  }));

  // 粒子颜色
  const particleColors = useMemo(() => ['#FFD700', '#FF6B6B', '#4ECDC4', '#9B59B6'], []);

  return (
    <View style={styles.overlay}>
      {/* 粒子效果 */}
      <View style={styles.particleContainer}>
        {Array.from({ length: PARTICLE_COUNT }).map((_, index) => (
          <Particle
            key={index}
            index={index}
            totalCount={PARTICLE_COUNT}
            color={particleColors[index % particleColors.length]}
          />
        ))}
      </View>

      {/* 光晕效果 */}
      <Animated.View style={[styles.glow, glowStyle]} />

      {/* 主体卡片 */}
      <Animated.View style={[styles.card, containerStyle]}>
        <Text style={styles.icon}>{combo.comboIcon || '✨'}</Text>
        <Text style={styles.title}>{combo.comboName}</Text>
        {combo.comboDescription && <Text style={styles.description}>{combo.comboDescription}</Text>}
        {combo.bonusEffects && combo.bonusEffects.length > 0 && (
          <View style={styles.bonusContainer}>
            {combo.bonusEffects.map((effect, index) => (
              <Text key={index} style={styles.bonusText}>
                {effect}
              </Text>
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

export const ComboTriggerEffect = memo(ComboTriggerEffectComponent);

/**
 * 组合触发特效容器
 */
interface ComboTriggerContainerProps {
  combos: ComboTriggerData[];
  onComboComplete?: (id: string) => void;
}

function ComboTriggerContainerComponent({ combos, onComboComplete }: ComboTriggerContainerProps) {
  if (combos.length === 0) return null;

  // 只显示最新的一个组合
  const latestCombo = combos[combos.length - 1];

  return <ComboTriggerEffect combo={latestCombo} onComplete={onComboComplete} />;
}

export const ComboTriggerContainer = memo(ComboTriggerContainerComponent);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  particleContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFD700',
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
    maxWidth: SCREEN_WIDTH * 0.8,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  bonusContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.3)',
  },
  bonusText: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    marginVertical: 2,
  },
});
