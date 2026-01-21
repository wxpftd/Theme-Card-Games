/**
 * 引导弹窗组件
 * 用于显示引导步骤的模态框
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../theme';
import { TutorialModalProps } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function TutorialModal({
  visible,
  title,
  description,
  emoji,
  buttonText = '知道了',
  showSkip = false,
  onPress,
  onSkip,
}: TutorialModalProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={() => {}}>
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.container,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.primary,
              },
            ]}
          >
            {/* Emoji */}
            {emoji && <Text style={styles.emoji}>{emoji}</Text>}

            {/* Title */}
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>

            {/* Description */}
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {description}
            </Text>

            {/* Buttons */}
            <View style={styles.buttons}>
              {showSkip && onSkip && (
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.skipButton,
                    { borderColor: theme.colors.textSecondary },
                  ]}
                  onPress={onSkip}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.buttonText, { color: theme.colors.textSecondary }]}>
                    跳过引导
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  { backgroundColor: theme.colors.primary },
                  showSkip && { flex: 1 },
                ]}
                onPress={onPress}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>{buttonText}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    borderWidth: 1,
  },
  primaryButton: {
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
