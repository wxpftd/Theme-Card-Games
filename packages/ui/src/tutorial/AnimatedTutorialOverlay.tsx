/**
 * 动画增强版引导覆盖层组件
 * 使用 react-native-reanimated 提供更流畅的动画
 * 包含：
 * - 淡入淡出动画
 * - 高亮区域脉冲动画（带光晕效果）
 * - 提示框弹性动画
 * - 震动反馈
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme';
import { TutorialOverlayProps, HighlightTarget } from './types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 高亮区域位置配置（相对于屏幕）
const HIGHLIGHT_POSITIONS: Record<
  HighlightTarget,
  { top: number; left: number; width: number; height: number } | null
> = {
  hand: { top: SCREEN_HEIGHT * 0.65, left: 16, width: SCREEN_WIDTH - 32, height: 160 },
  stats: { top: 100, left: 16, width: (SCREEN_WIDTH - 48) / 2, height: 120 },
  resources: { top: 100, left: SCREEN_WIDTH / 2 + 8, width: (SCREEN_WIDTH - 48) / 2, height: 120 },
  deck: { top: SCREEN_HEIGHT * 0.45, left: 16, width: 60, height: 80 },
  discard: { top: SCREEN_HEIGHT * 0.45, left: SCREEN_WIDTH - 76, width: 60, height: 80 },
  end_turn_button: {
    top: SCREEN_HEIGHT * 0.55,
    left: SCREEN_WIDTH / 2 - 60,
    width: 120,
    height: 48,
  },
  card: null, // 动态计算
  combo_banner: { top: 60, left: 16, width: SCREEN_WIDTH - 32, height: 60 },
  none: null,
};

export function AnimatedTutorialOverlay({ visible, step, onNext, onSkip }: TutorialOverlayProps) {
  const { theme } = useTheme();

  // 动画值
  const overlayOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const pulseGlow = useSharedValue(0);
  const tooltipScale = useSharedValue(0.9);
  const tooltipOpacity = useSharedValue(0);

  // 触发震动反馈
  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, []);

  // 显示/隐藏动画
  useEffect(() => {
    if (visible) {
      // 显示动画
      overlayOpacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });

      // 提示框弹入
      tooltipOpacity.value = withTiming(1, { duration: 200 });
      tooltipScale.value = withSpring(1, {
        damping: 12,
        stiffness: 150,
      });

      triggerHaptic();
    } else {
      // 隐藏动画
      overlayOpacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.quad),
      });
      tooltipOpacity.value = withTiming(0, { duration: 150 });
      tooltipScale.value = withTiming(0.9, { duration: 150 });
    }
  }, [visible, triggerHaptic]);

  // 高亮脉冲动画
  useEffect(() => {
    if (visible && step?.highlight !== 'none') {
      // 脉冲缩放
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );

      // 光晕动画
      pulseGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseGlow);
      pulseScale.value = 1;
      pulseGlow.value = 0;
    }

    return () => {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseGlow);
    };
  }, [visible, step?.highlight]);

  // 动画样式
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const highlightBorderStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    shadowOpacity: interpolate(pulseGlow.value, [0, 1], [0.3, 0.8]),
    shadowRadius: interpolate(pulseGlow.value, [0, 1], [4, 12]),
  }));

  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
    transform: [{ scale: tooltipScale.value }],
  }));

  // 按钮点击处理
  const handleNext = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onNext?.();
  }, [onNext]);

  const handleSkip = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onSkip?.();
  }, [onSkip]);

  if (!visible || !step) return null;

  const highlightPosition = HIGHLIGHT_POSITIONS[step.highlight];
  const showHighlight = step.highlight !== 'none' && highlightPosition;

  // 计算提示框位置（在高亮区域附近）
  const getTooltipPosition = () => {
    if (!highlightPosition) {
      return { top: SCREEN_HEIGHT / 2 - 100, left: 24 };
    }

    // 如果高亮区域在屏幕下半部分，提示框显示在上方
    if (highlightPosition.top > SCREEN_HEIGHT / 2) {
      return { top: highlightPosition.top - 180, left: 24 };
    }

    // 否则显示在下方
    return { top: highlightPosition.top + highlightPosition.height + 20, left: 24 };
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="box-none">
      {/* 半透明遮罩 */}
      <View style={styles.mask} pointerEvents="none">
        {/* 使用多个 View 实现镂空效果 */}
        {showHighlight ? (
          <>
            {/* 上方遮罩 */}
            <View
              style={[
                styles.maskPart,
                {
                  top: 0,
                  left: 0,
                  right: 0,
                  height: highlightPosition.top,
                },
              ]}
            />
            {/* 左侧遮罩 */}
            <View
              style={[
                styles.maskPart,
                {
                  top: highlightPosition.top,
                  left: 0,
                  width: highlightPosition.left,
                  height: highlightPosition.height,
                },
              ]}
            />
            {/* 右侧遮罩 */}
            <View
              style={[
                styles.maskPart,
                {
                  top: highlightPosition.top,
                  right: 0,
                  left: highlightPosition.left + highlightPosition.width,
                  height: highlightPosition.height,
                },
              ]}
            />
            {/* 下方遮罩 */}
            <View
              style={[
                styles.maskPart,
                {
                  top: highlightPosition.top + highlightPosition.height,
                  left: 0,
                  right: 0,
                  bottom: 0,
                },
              ]}
            />
          </>
        ) : (
          <View style={[styles.maskPart, styles.fullMask]} />
        )}
      </View>

      {/* 高亮边框（带光晕） */}
      {showHighlight && (
        <Animated.View
          style={[
            styles.highlightBorder,
            {
              top: highlightPosition.top - 4,
              left: highlightPosition.left - 4,
              width: highlightPosition.width + 8,
              height: highlightPosition.height + 8,
              borderColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
            },
            highlightBorderStyle,
          ]}
          pointerEvents="none"
        />
      )}

      {/* 提示框（带弹性动画） */}
      <Animated.View
        style={[
          styles.tooltip,
          {
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.primary,
          },
          tooltipStyle,
        ]}
      >
        {/* Emoji */}
        {step.emoji && <Text style={styles.emoji}>{step.emoji}</Text>}

        {/* 标题 */}
        <Text style={[styles.title, { color: theme.colors.text }]}>{step.title}</Text>

        {/* 描述 */}
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          {step.description}
        </Text>

        {/* 按钮 */}
        <View style={styles.buttons}>
          {step.allowSkip && (
            <TouchableOpacity
              style={[styles.skipButton, { borderColor: theme.colors.textSecondary }]}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: theme.colors.textSecondary }]}>跳过</Text>
            </TouchableOpacity>
          )}

          {!step.autoAdvance && (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleNext}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>
                {step.buttonText ?? '下一步'}
              </Text>
            </TouchableOpacity>
          )}

          {step.autoAdvance && (
            <Text style={[styles.autoAdvanceText, { color: theme.colors.textSecondary }]}>
              请完成操作后继续...
            </Text>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  mask: {
    ...StyleSheet.absoluteFillObject,
  },
  maskPart: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  fullMask: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  highlightBorder: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 12,
    borderStyle: 'dashed',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  tooltip: {
    position: 'absolute',
    width: SCREEN_WIDTH - 48,
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  nextButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  autoAdvanceText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
