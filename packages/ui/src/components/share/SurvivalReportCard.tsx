import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import {
  SurvivalReportShareCard,
  StatDefinition,
  ResourceDefinition,
  HighlightEvent,
} from '@theme-card-games/core';
import { useTheme } from '../../theme/ThemeContext';
import { useI18n } from '../../i18n';
import { ShareCardContainer, ShareCardContainerRef } from './ShareCardContainer';

export interface SurvivalReportCardProps {
  /** 分享卡数据 */
  data: SurvivalReportShareCard;
  /** 属性定义 */
  statDefinitions: StatDefinition[];
  /** 资源定义 */
  resourceDefinitions: ResourceDefinition[];
  /** 自定义样式 */
  style?: ViewStyle;
  /** 容器 ref (用于截图) */
  containerRef?: React.RefObject<ShareCardContainerRef | null>;
}

/**
 * SurvivalReportCard - 打工人生存报告分享卡
 *
 * 显示单人模式游戏结束后的战绩分享图
 */
export function SurvivalReportCard({
  data,
  statDefinitions,
  resourceDefinitions,
  style,
  containerRef,
}: SurvivalReportCardProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  const headerColor = data.isVictory ? theme.colors.success : theme.colors.error;

  return (
    <ShareCardContainer ref={containerRef} backgroundColor={theme.colors.surface} style={style}>
      {/* 头部 - 结果 */}
      <View style={[styles.header, { backgroundColor: headerColor }]}>
        <Text style={styles.headerEmoji}>{data.isVictory ? '🎉' : '😢'}</Text>
        <Text style={styles.headerTitle}>
          {data.isVictory ? t('share.survivalReport.victory') : t('share.survivalReport.defeat')}
        </Text>
        <Text style={styles.headerSubtitle}>
          {t('share.survivalReport.turns', { turns: data.turnsPlayed })}
        </Text>
      </View>

      {/* 玩家信息 */}
      <View style={styles.playerInfo}>
        <Text style={[styles.playerName, { color: theme.colors.text }]}>{data.playerName}</Text>
      </View>

      {/* 最终属性 */}
      <View style={styles.statsSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          {t('share.survivalReport.finalStats')}
        </Text>
        <View style={styles.statsGrid}>
          {statDefinitions.map((stat) => {
            const value = data.finalStats[stat.id] ?? 0;
            return (
              <View
                key={stat.id}
                style={[styles.statItem, { backgroundColor: theme.colors.background }]}
              >
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>{value}</Text>
                <Text style={[styles.statName, { color: theme.colors.textSecondary }]}>
                  {stat.name}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 资源 */}
      <View style={styles.resourcesRow}>
        {resourceDefinitions.map((resource) => {
          const value = data.finalResources[resource.id] ?? 0;
          return (
            <View key={resource.id} style={styles.resourceItem}>
              <Text style={styles.resourceIcon}>{resource.icon}</Text>
              <Text style={[styles.resourceValue, { color: theme.colors.text }]}>{value}</Text>
            </View>
          );
        })}
      </View>

      {/* 名场面 */}
      {data.highlights.length > 0 && (
        <View style={styles.highlightsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            {t('share.survivalReport.highlights')}
          </Text>
          {data.highlights.map((highlight) => (
            <HighlightItem key={highlight.id} highlight={highlight} theme={theme} />
          ))}
        </View>
      )}

      {/* 一句话总结 */}
      <View style={[styles.summarySection, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.summaryText, { color: theme.colors.text }]}>{data.summary}</Text>
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

interface HighlightItemProps {
  highlight: HighlightEvent;
  theme: ReturnType<typeof useTheme>['theme'];
}

function HighlightItem({ highlight, theme }: HighlightItemProps) {
  return (
    <View style={styles.highlightItem}>
      <Text style={styles.highlightIcon}>{highlight.icon}</Text>
      <View style={styles.highlightContent}>
        <Text style={[styles.highlightDesc, { color: theme.colors.text }]}>
          {highlight.description}
        </Text>
        <Text style={[styles.highlightTurn, { color: theme.colors.textSecondary }]}>
          回合 {highlight.turn}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 16,
  },
  headerEmoji: {
    fontSize: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  playerInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  statsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: 70,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statName: {
    fontSize: 10,
    marginTop: 2,
  },
  resourcesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resourceIcon: {
    fontSize: 16,
  },
  resourceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  highlightsSection: {
    marginBottom: 16,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  highlightIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  highlightContent: {
    flex: 1,
  },
  highlightDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  highlightTurn: {
    fontSize: 10,
    marginTop: 2,
  },
  summarySection: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 10,
  },
});
