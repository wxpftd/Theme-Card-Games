/**
 * 引导覆盖层组件
 * 用于高亮特定区域并显示引导提示
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
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

export function TutorialOverlay({ visible, step, onNext, onSkip }: TutorialOverlayProps) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 显示/隐藏动画
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  // 高亮脉冲动画
  useEffect(() => {
    if (visible && step?.highlight !== 'none') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [visible, step?.highlight, pulseAnim]);

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
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents="box-none">
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

      {/* 高亮边框 */}
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
              transform: [{ scale: pulseAnim }],
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* 提示框 */}
      <View
        style={[
          styles.tooltip,
          {
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.primary,
          },
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
              onPress={onSkip}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: theme.colors.textSecondary }]}>跳过</Text>
            </TouchableOpacity>
          )}

          {!step.autoAdvance && (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
              onPress={onNext}
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
      </View>
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
  },
  tooltip: {
    position: 'absolute',
    width: SCREEN_WIDTH - 48,
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
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
