import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { AchievementBadgeShareCard, AchievementRarity } from '@theme-card-games/core';
import { useTheme } from '../../theme/ThemeContext';
import { useI18n } from '../../i18n';
import { ShareCardContainer, ShareCardContainerRef } from './ShareCardContainer';

export interface AchievementBadgeCardProps {
  /** 分享卡数据 */
  data: AchievementBadgeShareCard;
  /** 自定义样式 */
  style?: ViewStyle;
  /** 容器 ref (用于截图) */
  containerRef?: React.RefObject<ShareCardContainerRef>;
}

/**
 * 根据稀有度获取颜色
 */
const RARITY_COLORS: Record<AchievementRarity, { bg: string; border: string; text: string }> = {
  common: { bg: '#E8E8E8', border: '#B8B8B8', text: '#666666' },
  uncommon: { bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32' },
  rare: { bg: '#E3F2FD', border: '#2196F3', text: '#1565C0' },
  epic: { bg: '#F3E5F5', border: '#9C27B0', text: '#7B1FA2' },
  legendary: { bg: '#FFF8E1', border: '#FF9800', text: '#E65100' },
};

/**
 * 根据稀有度获取标签文字
 */
const RARITY_LABELS: Record<AchievementRarity, string> = {
  common: '普通',
  uncommon: '稀有',
  rare: '精良',
  epic: '史诗',
  legendary: '传说',
};

/**
 * AchievementBadgeCard - 成就徽章分享卡
 *
 * 显示成就解锁的分享图
 */
export function AchievementBadgeCard({ data, style, containerRef }: AchievementBadgeCardProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  const rarityColors = RARITY_COLORS[data.achievementRarity];
  const rarityLabel =
    t(`share.achievementBadge.rarity.${data.achievementRarity}`) ||
    RARITY_LABELS[data.achievementRarity];

  return (
    <ShareCardContainer ref={containerRef} backgroundColor={theme.colors.surface} style={style}>
      {/* 顶部装饰 */}
      <View style={[styles.topDecoration, { backgroundColor: rarityColors.border }]} />

      {/* 成就徽章 */}
      <View style={styles.badgeSection}>
        <View
          style={[
            styles.badgeContainer,
            {
              backgroundColor: rarityColors.bg,
              borderColor: rarityColors.border,
            },
          ]}
        >
          <Text style={styles.badgeIcon}>{data.achievementIcon || '🏆'}</Text>
        </View>

        {/* 稀有度标签 */}
        <View style={[styles.rarityBadge, { backgroundColor: rarityColors.border }]}>
          <Text style={styles.rarityText}>{rarityLabel}</Text>
        </View>
      </View>

      {/* 成就信息 */}
      <View style={styles.infoSection}>
        <Text style={[styles.achievementName, { color: rarityColors.text }]}>
          {data.achievementName}
        </Text>
        <Text style={[styles.achievementDesc, { color: theme.colors.textSecondary }]}>
          {data.achievementDescription}
        </Text>

        {/* 点数 */}
        <View style={[styles.pointsBadge, { backgroundColor: theme.colors.background }]}>
          <Text style={styles.pointsIcon}>⭐</Text>
          <Text style={[styles.pointsValue, { color: theme.colors.primary }]}>
            {data.points} pts
          </Text>
        </View>
      </View>

      {/* 成就故事 */}
      <View style={[styles.storySection, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.storyText, { color: theme.colors.text }]}>
          {data.achievementStory}
        </Text>
      </View>

      {/* 玩家信息 */}
      <View style={styles.playerSection}>
        <Text style={[styles.unlockedBy, { color: theme.colors.textSecondary }]}>
          {t('share.achievementBadge.unlockedBy')}
        </Text>
        <Text style={[styles.playerName, { color: theme.colors.text }]}>{data.playerName}</Text>
        <Text style={[styles.unlockedDate, { color: theme.colors.textSecondary }]}>
          {formatDate(data.unlockedAt)}
        </Text>
      </View>

      {/* 底部水印 */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          {t('share.watermark')}
        </Text>
      </View>
    </ShareCardContainer>
  );
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  topDecoration: {
    height: 6,
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  badgeSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeIcon: {
    fontSize: 36,
  },
  rarityBadge: {
    marginTop: -10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  rarityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  pointsIcon: {
    fontSize: 14,
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  storySection: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  storyText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  playerSection: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  unlockedBy: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 4,
  },
  unlockedDate: {
    fontSize: 11,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 10,
  },
});
