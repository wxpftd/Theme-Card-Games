/**
 * 组合提示横幅组件
 * 显示可触发组合的提示
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useTheme } from '../theme';
import { ComboHintBannerProps } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ComboHintBanner({ visible, hint, onDismiss, t }: ComboHintBannerProps) {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 滑入/滑出动画
  useEffect(() => {
    if (visible && hint) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // 脉冲动画
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, hint, slideAnim, pulseAnim]);

  if (!hint) return null;

  const translateFn = t ?? ((key: string) => key);
  const comboName = translateFn(`combo.${hint.combo.id}`) || hint.combo.name;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }, { scale: pulseAnim }],
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.warning,
        },
      ]}
    >
      {/* 组合图标 */}
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.warning + '20' }]}>
        <Text style={styles.icon}>{hint.combo.icon ?? '✨'}</Text>
      </View>

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
        onPress={onDismiss}
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
  },
  dismissText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
