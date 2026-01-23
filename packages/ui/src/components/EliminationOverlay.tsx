/**
 * EliminationOverlay - 淘汰动画覆盖层
 * 当玩家被淘汰时显示的动画效果
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Modal } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface EliminationOverlayProps {
  /** 是否显示 */
  visible: boolean;
  /** 被淘汰玩家名称 */
  playerName: string;
  /** 淘汰原因 */
  reason?: string;
  /** 排名 */
  rank?: number;
  /** 总玩家数 */
  totalPlayers?: number;
  /** 是否是当前玩家被淘汰 */
  isSelf?: boolean;
  /** 动画结束回调 */
  onAnimationEnd?: () => void;
  /** 显示持续时间 (ms) */
  duration?: number;
}

/**
 * 淘汰动画覆盖层组件
 */
export const EliminationOverlay: React.FC<EliminationOverlayProps> = ({
  visible,
  playerName,
  reason,
  rank,
  totalPlayers,
  isSelf = false,
  onAnimationEnd,
  duration = 3000,
}) => {
  const { theme } = useTheme();

  // 动画值
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const textSlideAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 重置动画值
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      textSlideAnim.setValue(50);
      shakeAnim.setValue(0);

      // 入场动画
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(textSlideAnim, {
          toValue: 0,
          duration: 400,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // 如果是自己被淘汰，添加震动效果
      if (isSelf) {
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
      }

      // 自动隐藏
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onAnimationEnd?.();
        });
      }, duration - 300);

      return () => clearTimeout(timer);
    }
  }, [visible, isSelf, duration, fadeAnim, scaleAnim, textSlideAnim, shakeAnim, onAnimationEnd]);

  if (!visible) {
    return null;
  }

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
            backgroundColor: isSelf ? 'rgba(139, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.75)',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.contentContainer,
            {
              transform: [{ scale: scaleAnim }, { translateX: shakeAnim }],
            },
          ]}
        >
          {/* 淘汰图标 */}
          <Animated.Text
            style={[
              styles.eliminationIcon,
              {
                transform: [{ translateY: textSlideAnim }],
              },
            ]}
          >
            {isSelf ? '💀' : '🚫'}
          </Animated.Text>

          {/* 标题 */}
          <Animated.Text
            style={[
              styles.title,
              {
                transform: [{ translateY: textSlideAnim }],
                color: isSelf ? '#FF6B6B' : '#FFD700',
              },
            ]}
          >
            {isSelf ? '你被淘汰了！' : '玩家被淘汰'}
          </Animated.Text>

          {/* 玩家名称 */}
          <Animated.Text
            style={[
              styles.playerName,
              {
                transform: [{ translateY: textSlideAnim }],
              },
            ]}
          >
            {playerName}
          </Animated.Text>

          {/* 淘汰原因 */}
          {reason && (
            <Animated.Text
              style={[
                styles.reason,
                {
                  transform: [{ translateY: textSlideAnim }],
                },
              ]}
            >
              原因: {reason}
            </Animated.Text>
          )}

          {/* 排名信息 */}
          {rank !== undefined && totalPlayers !== undefined && (
            <Animated.View
              style={[
                styles.rankContainer,
                {
                  transform: [{ translateY: textSlideAnim }],
                },
              ]}
            >
              <Text style={styles.rankLabel}>最终排名</Text>
              <Text style={styles.rankText}>
                第 {rank} 名 / {totalPlayers} 人
              </Text>
            </Animated.View>
          )}

          {/* 自己被淘汰时的额外提示 */}
          {isSelf && (
            <Animated.Text
              style={[
                styles.selfHint,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              游戏继续进行中...
            </Animated.Text>
          )}
        </Animated.View>

        {/* 装饰性粒子效果 */}
        <View style={styles.particlesContainer}>
          {[...Array(8)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  left: `${10 + index * 12}%`,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -100 - index * 20],
                      }),
                    },
                    {
                      rotate: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', `${index % 2 === 0 ? 45 : -45}deg`],
                      }),
                    },
                  ],
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1, 0.3],
                  }),
                },
              ]}
            >
              <Text style={styles.particleText}>{['❌', '💔', '📉', '😰'][index % 4]}</Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    padding: 32,
  },
  eliminationIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  playerName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  reason: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 20,
  },
  rankContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  rankLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 4,
  },
  rankText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  selfHint: {
    fontSize: 14,
    color: '#888888',
    marginTop: 24,
    fontStyle: 'italic',
  },
  particlesContainer: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    height: 200,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    bottom: 0,
  },
  particleText: {
    fontSize: 24,
  },
});

export default EliminationOverlay;
