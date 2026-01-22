/**
 * 濒死警告组件（健康<20）
 * - 屏幕边缘红色脉动
 * - 警告徽章显示
 * - 无限循环动画
 */
import React, { useEffect, memo } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DangerWarningProps {
  /** 是否激活警告（健康值 < 20） */
  isActive: boolean;
  /** 当前健康值（用于显示） */
  healthValue?: number;
  /** 警告消息 */
  message?: string;
  /** 警告图标 */
  icon?: string;
}

function DangerWarningComponent({
  isActive,
  healthValue,
  message = '危险！健康值过低',
  icon = '⚠️',
}: DangerWarningProps) {
  const pulseProgress = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const badgeOpacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      // 启动脉动动画（无限循环）
      pulseProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) })
        ),
        -1, // 无限循环
        false
      );

      // 显示警告徽章
      badgeOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
      badgeScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    } else {
      // 停止动画并隐藏
      cancelAnimation(pulseProgress);
      cancelAnimation(badgeScale);
      pulseProgress.value = withTiming(0, { duration: 200 });
      badgeOpacity.value = withTiming(0, { duration: 200 });
      badgeScale.value = 0;
    }

    return () => {
      cancelAnimation(pulseProgress);
      cancelAnimation(badgeScale);
    };
  }, [isActive]);

  // 边缘光晕动画样式
  const glowStyle = useAnimatedStyle(() => {
    const borderOpacity = interpolate(pulseProgress.value, [0, 1], [0.2, 0.6]);
    const borderWidth = interpolate(pulseProgress.value, [0, 1], [20, 40]);

    return {
      borderWidth,
      borderColor: `rgba(244, 67, 54, ${borderOpacity})`,
      opacity: pulseProgress.value > 0 ? 1 : 0,
    };
  });

  // 内部渐变动画（模拟脉动的内光）
  const innerGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(pulseProgress.value, [0, 0.5, 1], [0, 0.15, 0]);

    return {
      opacity,
    };
  });

  // 徽章动画样式
  const badgeContainerStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }));

  if (!isActive) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* 屏幕边缘红色光晕 */}
      <Animated.View style={[styles.edgeGlow, glowStyle]} />

      {/* 内部红色渐变遮罩 */}
      <Animated.View style={[styles.innerGlow, innerGlowStyle]} />

      {/* 警告徽章 */}
      <Animated.View style={[styles.badge, badgeContainerStyle]}>
        <Text style={styles.badgeIcon}>{icon}</Text>
        <View style={styles.badgeContent}>
          <Text style={styles.badgeText}>{message}</Text>
          {healthValue !== undefined && <Text style={styles.healthText}>HP: {healthValue}</Text>}
        </View>
      </Animated.View>

      {/* 角落装饰 */}
      <View style={[styles.cornerDecor, styles.topLeft]} />
      <View style={[styles.cornerDecor, styles.topRight]} />
      <View style={[styles.cornerDecor, styles.bottomLeft]} />
      <View style={[styles.cornerDecor, styles.bottomRight]} />
    </View>
  );
}

export const DangerWarning = memo(DangerWarningComponent);

const CORNER_SIZE = 30;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 900,
  },
  edgeGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F44336',
  },
  badge: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  badgeIcon: {
    fontSize: 20,
  },
  badgeContent: {
    alignItems: 'flex-start',
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  healthText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  cornerDecor: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#F44336',
    opacity: 0.6,
  },
  topLeft: {
    top: 8,
    left: 8,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 8,
    right: 8,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
});
