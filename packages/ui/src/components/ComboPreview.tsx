import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ComboPreview as ComboPreviewType, CardDefinition } from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';

interface ComboPreviewProps {
  /** 可触发的 combo 预览列表 */
  comboPreviews: ComboPreviewType[];
  /** 卡牌定义映射 */
  cardDefinitions: Map<string, CardDefinition>;
  /** 是否紧凑模式 */
  compact?: boolean;
}

/**
 * Combo 预览组件
 * 显示当前可触发的 combo 及其进度
 */
function ComboPreviewComponent({
  comboPreviews,
  cardDefinitions,
  compact = false,
}: ComboPreviewProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  // 只显示可以完成的 combo（手牌足够）或者已经有进度的
  const relevantCombos = useMemo(() => {
    return comboPreviews.filter((cp) => cp.canComplete || cp.progress > 0);
  }, [comboPreviews]);

  if (relevantCombos.length === 0) {
    return null;
  }

  const getCardName = (cardId: string): string => {
    const def = cardDefinitions.get(cardId);
    return def?.name ?? cardId;
  };

  return (
    <View
      testID="combo-preview-container"
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
    >
      <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
        {t('combo.available')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {relevantCombos.map((preview) => (
          <ComboPreviewCard
            key={preview.combo.id}
            preview={preview}
            getCardName={getCardName}
            compact={compact}
            colors={theme.colors}
            t={t}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface ComboPreviewCardProps {
  preview: ComboPreviewType;
  getCardName: (cardId: string) => string;
  compact: boolean;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
    accent: string;
    success: string;
    warning: string;
  };
  t: (key: string, params?: Record<string, string | number>) => string;
}

const ComboPreviewCard = memo(function ComboPreviewCard({
  preview,
  getCardName,
  compact,
  colors,
  t,
}: ComboPreviewCardProps) {
  const progressPercent = Math.round(preview.progress * 100);
  const isComplete = preview.progress >= 1;
  const canComplete = preview.canComplete;

  // 构建状态文本
  let statusText = '';
  if (isComplete) {
    statusText = t('combo.ready');
  } else if (preview.stillNeeded.length > 0) {
    const neededNames = preview.stillNeeded.map(getCardName).join(', ');
    statusText = t('combo.need', { cards: neededNames });
  } else if (preview.stillNeededCount !== undefined && preview.stillNeededCount > 0) {
    if (preview.requiredTag) {
      statusText = t('combo.needTagCount', {
        count: preview.stillNeededCount,
        tag: preview.requiredTag,
      });
    } else {
      statusText = t('combo.needCount', { count: preview.stillNeededCount });
    }
  }

  return (
    <View
      testID={`combo-preview-${preview.combo.id}`}
      style={[
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: isComplete
            ? colors.success
            : canComplete
              ? colors.accent
              : colors.textSecondary,
          borderWidth: isComplete || canComplete ? 2 : 1,
        },
      ]}
    >
      {/* Combo 图标和名称 */}
      <View style={styles.cardHeader}>
        {preview.combo.icon && <Text style={styles.comboIcon}>{preview.combo.icon}</Text>}
        <Text style={[styles.comboName, { color: colors.text }]} numberOfLines={1}>
          {preview.combo.name}
        </Text>
      </View>

      {/* 进度条 */}
      <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progressPercent}%`,
              backgroundColor: isComplete ? colors.success : colors.primary,
            },
          ]}
        />
      </View>

      {/* 状态文本 */}
      {!compact && statusText && (
        <Text style={[styles.statusText, { color: colors.textSecondary }]} numberOfLines={2}>
          {statusText}
        </Text>
      )}

      {/* 可完成标识 */}
      {canComplete && !isComplete && (
        <View style={[styles.canCompleteBadge, { backgroundColor: colors.accent + '20' }]}>
          <Text style={[styles.canCompleteText, { color: colors.accent }]}>
            {t('combo.canTrigger')}
          </Text>
        </View>
      )}

      {/* 已就绪标识 */}
      {isComplete && (
        <View style={[styles.readyBadge, { backgroundColor: colors.success + '20' }]}>
          <Text style={[styles.readyText, { color: colors.success }]}>{t('combo.ready')}</Text>
        </View>
      )}
    </View>
  );
});

export const ComboPreview = memo(ComboPreviewComponent);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 12,
    marginVertical: 4,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  scrollContent: {
    gap: 8,
  },
  card: {
    width: 140,
    padding: 8,
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  comboIcon: {
    fontSize: 14,
  },
  comboName: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  statusText: {
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 4,
  },
  canCompleteBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  canCompleteText: {
    fontSize: 9,
    fontWeight: '600',
  },
  readyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  readyText: {
    fontSize: 9,
    fontWeight: '600',
  },
});
