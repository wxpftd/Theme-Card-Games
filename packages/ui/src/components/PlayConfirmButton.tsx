import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';
import { useCardSelection } from '../contexts/CardSelectionContext';

interface PlayConfirmButtonProps {
  /** 打出卡牌后的回调 */
  onPlayed?: (success: boolean) => void;
}

/**
 * 确认打出按钮组件
 *
 * 显示选中卡牌数量、combo 预览，点击后打出所有选中卡牌。
 * 必须在 CardSelectionProvider 内使用。
 */
function PlayConfirmButtonComponent({ onPlayed }: PlayConfirmButtonProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { selectedCount, pendingCombo, confirmPlay, clearSelection, isPlaying } =
    useCardSelection();

  const handleConfirm = useCallback(async () => {
    const success = await confirmPlay();
    onPlayed?.(success);
  }, [confirmPlay, onPlayed]);

  const handleCancel = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // 没有选中卡牌时不显示
  if (selectedCount === 0) {
    return null;
  }

  return (
    <View testID="play-confirm-container" style={styles.container}>
      {/* Combo 预览 */}
      {pendingCombo && (
        <View
          testID="combo-preview"
          style={[styles.comboPreview, { backgroundColor: theme.colors.accent + '20' }]}
        >
          <Text style={[styles.comboIcon]}>{pendingCombo.icon || '!'}</Text>
          <View style={styles.comboInfo}>
            <Text testID="combo-name" style={[styles.comboName, { color: theme.colors.accent }]}>
              {pendingCombo.name}
            </Text>
            <Text
              style={[styles.comboDescription, { color: theme.colors.textSecondary }]}
              numberOfLines={1}
            >
              {pendingCombo.description}
            </Text>
          </View>
        </View>
      )}

      {/* 按钮区域 */}
      <View style={styles.buttons}>
        {/* 取消按钮 */}
        <TouchableOpacity
          testID="cancel-selection-button"
          style={[styles.cancelButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleCancel}
          disabled={isPlaying}
        >
          <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>
            {t('hand.cancel')}
          </Text>
        </TouchableOpacity>

        {/* 确认打出按钮 */}
        <TouchableOpacity
          testID="play-confirm-button"
          style={[
            styles.confirmButton,
            {
              backgroundColor: pendingCombo ? theme.colors.accent : theme.colors.primary,
              opacity: isPlaying ? 0.7 : 1,
            },
          ]}
          onPress={handleConfirm}
          disabled={isPlaying}
        >
          {isPlaying ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text testID="play-count" style={styles.confirmText}>
                {t('hand.play')} ({selectedCount})
              </Text>
              {pendingCombo && (
                <Text testID="combo-tag" style={styles.comboTag}>
                  COMBO
                </Text>
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const PlayConfirmButton = memo(PlayConfirmButtonComponent);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  comboPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  comboIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  comboInfo: {
    flex: 1,
  },
  comboName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  comboDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  comboTag: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
