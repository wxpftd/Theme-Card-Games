/**
 * 动画增强版组合提示横幅组件
 * 使用 react-native-reanimated 提供更流畅的动画
 * 包含：
 * - 弹性滑入动画
 * - 脉冲光晕效果
 * - 震动反馈
 * - 图标旋转动画
 */

import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme';
import { ComboHintBannerProps } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function AnimatedComboHintBanner({ visible, hint, onDismiss, t }: ComboHintBannerProps) {
  const { theme } = useTheme();

  // 动画值
  const translateY = useSharedValue(-100);
  const scale = useSharedValue(1);
  const iconRotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  // 触发震动反馈
  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, []);

  // 滑入/滑出动画
  useEffect(() => {
    if (visible && hint) {
      // 滑入动画
      translateY.value = withSpring(0, {
        damping: 12,
        stiffness: 150,
        mass: 0.8,
      });

      // 脉冲动画
      scale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 600, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );

      // 图标旋转动画
      iconRotate.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 300, easing: Easing.inOut(Easing.quad) }),
          withTiming(-10, { duration: 600, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 300, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );

      // 光晕动画
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.2, { duration: 800, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );

      triggerHaptic();
    } else {
      // 滑出动画
      translateY.value = withTiming(-100, {
        duration: 200,
        easing: Easing.in(Easing.quad),
      });
      cancelAnimation(scale);
      cancelAnimation(iconRotate);
      cancelAnimation(glowOpacity);
      scale.value = 1;
      iconRotate.value = 0;
      glowOpacity.value = 0;
    }

    return () => {
      cancelAnimation(scale);
      cancelAnimation(iconRotate);
      cancelAnimation(glowOpacity);
    };
  }, [visible, hint, triggerHaptic]);

  // 动画样式
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotate.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // 关闭按钮处理
  const handleDismiss = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onDismiss?.();
  }, [onDismiss]);

  if (!hint) return null;

  const translateFn = t ?? ((key: string) => key);
  const comboName = translateFn(`combo.${hint.combo.id}`) || hint.combo.name;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.warning,
        },
        containerStyle,
      ]}
    >
      {/* 背景光晕 */}
      <Animated.View style={[styles.glow, { backgroundColor: theme.colors.warning }, glowStyle]} />

      {/* 组合图标（带旋转动画） */}
      <Animated.View
        style={[styles.iconContainer, { backgroundColor: theme.colors.warning + '20' }, iconStyle]}
      >
        <Text style={styles.icon}>{hint.combo.icon ?? '✨'}</Text>
      </Animated.View>

      {/* 提示内容 */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.warning }]}>组合机会!</Text>
        <Text style={[styles.comboName, { color: theme.colors.text }]}>{comboName}</Text>
        <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
          还需 {hint.remainingCount} 张卡牌触发组合
        </Text>
      </View>

      {/* 关闭按钮 */}
      <TouchableOpacity
        style={[styles.dismissButton, { backgroundColor: theme.colors.background }]}
        onPress={handleDismiss}
        activeOpacity={0.7}
      >
        <Text style={[styles.dismissText, { color: theme.colors.textSecondary }]}>知道了</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    zIndex: 900,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 20,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  comboName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  hint: {
    fontSize: 12,
    marginTop: 2,
  },
  dismissButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    zIndex: 1,
  },
  dismissText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
