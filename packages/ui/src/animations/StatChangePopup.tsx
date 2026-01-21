/**
 * 属性变化弹出动画组件
 * - 数字上浮 + 缩放动画
 * - 正数绿色，负数红色
 * - 使用 react-native-reanimated
 */
import React, { useEffect, memo } from 'react';
import { StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

export interface StatChange {
  id: string;
  statId: string;
  statName: string;
  icon?: string;
  delta: number;
  x: number;
  y: number;
}

interface StatChangePopupProps {
  change: StatChange;
  onComplete?: (id: string) => void;
  style?: ViewStyle;
}

const ANIMATION_DURATION = 800;
const FLOAT_DISTANCE = 60;

function StatChangePopupComponent({ change, onComplete, style }: StatChangePopupProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.5);

  const isPositive = change.delta > 0;
  const displayValue = isPositive ? `+${change.delta}` : `${change.delta}`;
  const color = isPositive ? '#4CAF50' : '#F44336';

  useEffect(() => {
    // 开始动画序列
    opacity.value = withSequence(
      withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) }),
      withDelay(
        ANIMATION_DURATION - 300,
        withTiming(0, { duration: 150, easing: Easing.in(Easing.quad) })
      )
    );

    translateY.value = withTiming(-FLOAT_DISTANCE, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.quad),
    });

    scale.value = withSequence(
      withTiming(1.2, { duration: 150, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 100, easing: Easing.inOut(Easing.quad) }),
      withDelay(
        ANIMATION_DURATION - 400,
        withTiming(0.8, { duration: 150, easing: Easing.in(Easing.quad) })
      )
    );

    // 动画完成后触发回调
    const timeout = setTimeout(() => {
      onComplete?.(change.id);
    }, ANIMATION_DURATION);

    return () => clearTimeout(timeout);
  }, [change.id, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: change.x,
          top: change.y,
        },
        animatedStyle,
        style,
      ]}
    >
      <Text style={[styles.icon]}>{change.icon}</Text>
      <Text style={[styles.value, { color }]}>{displayValue}</Text>
    </Animated.View>
  );
}

export const StatChangePopup = memo(StatChangePopupComponent);

/**
 * 属性变化弹出容器 - 管理多个同时显示的弹出
 */
interface StatChangePopupContainerProps {
  changes: StatChange[];
  onChangeComplete?: (id: string) => void;
}

function StatChangePopupContainerComponent({
  changes,
  onChangeComplete,
}: StatChangePopupContainerProps) {
  return (
    <>
      {changes.map((change) => (
        <StatChangePopup key={change.id} change={change} onComplete={onChangeComplete} />
      ))}
    </>
  );
}

export const StatChangePopupContainer = memo(StatChangePopupContainerComponent);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    zIndex: 1000,
  },
  icon: {
    fontSize: 16,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
