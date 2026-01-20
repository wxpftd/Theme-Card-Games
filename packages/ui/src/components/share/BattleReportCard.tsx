import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import {
  BattleReportShareCard,
  PlayerBattleReport,
  SpecialTitle,
  StatDefinition,
} from '@theme-card-games/core';
import { useTheme } from '../../theme/ThemeContext';
import { useI18n } from '../../i18n';
import { ShareCardContainer, ShareCardContainerRef } from './ShareCardContainer';

export interface BattleReportCardProps {
  /** 分享卡数据 */
  data: BattleReportShareCard;
  /** 属性定义 (用于显示图标) - 保留以便将来扩展 */
  statDefinitions?: StatDefinition[];
  /** 自定义样式 */
  style?: ViewStyle;
  /** 容器 ref (用于截图) */
  containerRef?: React.RefObject<ShareCardContainerRef | null>;
}

/**
 * BattleReportCard - 对战战报分享卡
 *
 * 显示多人竞争模式的战斗统计报告
 */
export function BattleReportCard({
  data,
  statDefinitions: _statDefinitions,
  style,
  containerRef,
}: BattleReportCardProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  const { battleReport, currentPlayerId } = data;
  const currentPlayer = battleReport.playerReports.find((p) => p.playerId === currentPlayerId);
  const isWinner = battleReport.winnerId === currentPlayerId;

  const headerColor = isWinner ? theme.colors.success : theme.colors.error;

  return (
    <ShareCardContainer ref={containerRef} backgroundColor={theme.colors.surface} style={style}>
      {/* 头部 - 战报标题 */}
      <View style={[styles.header, { backgroundColor: headerColor }]}>
        <Text style={styles.headerEmoji}>{isWinner ? '🏆' : '⚔️'}</Text>
        <Text style={styles.headerTitle}>{t('share.battleReport.title')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('share.battleReport.players', { count: battleReport.playerReports.length })} •{' '}
          {t('share.battleReport.turns', { turns: battleReport.totalTurns })}
        </Text>
      </View>

      {/* 玩家排名 */}
      <View style={styles.rankingSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          {t('share.battleReport.ranking')}
        </Text>
        {battleReport.playerReports
          .sort((a, b) => a.rank - b.rank)
          .map((player) => (
            <PlayerRankItem
              key={player.playerId}
              player={player}
              isCurrentPlayer={player.playerId === currentPlayerId}
              isWinner={player.playerId === battleReport.winnerId}
              theme={theme}
            />
          ))}
      </View>

      {/* 特殊称号 */}
      {battleReport.specialTitles.length > 0 && (
        <View style={styles.titlesSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            {t('share.battleReport.specialTitles')}
          </Text>
          <View style={styles.titlesGrid}>
            {battleReport.specialTitles.map((title) => (
              <TitleBadge
                key={title.titleId}
                title={title}
                isCurrentPlayer={title.playerId === currentPlayerId}
                theme={theme}
              />
            ))}
          </View>
        </View>
      )}

      {/* 当前玩家统计 */}
      {currentPlayer && (
        <View style={styles.myStatsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            {t('share.battleReport.myStats')}
          </Text>
          <View style={styles.statsGrid}>
            <StatBox
              icon="🎯"
              label={t('share.battleReport.blameShifted')}
              value={currentPlayer.competitiveStats.blameShiftSuccessCount}
              theme={theme}
            />
            <StatBox
              icon="💰"
              label={t('share.battleReport.resourcesStolen')}
              value={currentPlayer.competitiveStats.resourcesStolenAmount}
              theme={theme}
            />
            <StatBox
              icon="⚔️"
              label={t('share.battleReport.attacksInitiated')}
              value={currentPlayer.competitiveStats.attacksInitiated}
              theme={theme}
            />
            <StatBox
              icon="🛡️"
              label={t('share.battleReport.attacksReceived')}
              value={currentPlayer.competitiveStats.attacksReceived}
              theme={theme}
            />
          </View>
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

interface PlayerRankItemProps {
  player: PlayerBattleReport;
  isCurrentPlayer: boolean;
  isWinner: boolean;
  theme: ReturnType<typeof useTheme>['theme'];
}

function PlayerRankItem({ player, isCurrentPlayer, isWinner, theme }: PlayerRankItemProps) {
  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  return (
    <View
      style={[
        styles.rankItem,
        { backgroundColor: theme.colors.background },
        isCurrentPlayer && { borderColor: theme.colors.primary, borderWidth: 2 },
      ]}
    >
      <Text style={styles.rankEmoji}>{getRankEmoji(player.rank)}</Text>
      <View style={styles.rankInfo}>
        <Text
          style={[
            styles.rankName,
            { color: theme.colors.text },
            isCurrentPlayer && { fontWeight: '700' },
          ]}
        >
          {player.playerName}
          {isCurrentPlayer && ' (我)'}
        </Text>
        <Text style={[styles.rankStatus, { color: theme.colors.textSecondary }]}>
          {player.survived ? '存活' : `第${player.eliminatedAtTurn}回合淘汰`}
        </Text>
      </View>
      {isWinner && <Text style={styles.winnerBadge}>👑</Text>}
    </View>
  );
}

interface TitleBadgeProps {
  title: SpecialTitle;
  isCurrentPlayer: boolean;
  theme: ReturnType<typeof useTheme>['theme'];
}

function TitleBadge({ title, isCurrentPlayer, theme }: TitleBadgeProps) {
  return (
    <View
      style={[
        styles.titleBadge,
        { backgroundColor: theme.colors.background },
        isCurrentPlayer && { borderColor: theme.colors.primary, borderWidth: 1 },
      ]}
    >
      <Text style={styles.titleIcon}>{title.icon}</Text>
      <Text style={[styles.titleName, { color: theme.colors.text }]}>{title.titleName}</Text>
      <Text style={[styles.titlePlayer, { color: theme.colors.textSecondary }]}>
        {title.playerName}
      </Text>
    </View>
  );
}

interface StatBoxProps {
  icon: string;
  label: string;
  value: number;
  theme: ReturnType<typeof useTheme>['theme'];
}

function StatBox({ icon, label, value, theme }: StatBoxProps) {
  return (
    <View style={[styles.statBox, { backgroundColor: theme.colors.background }]}>
      <Text style={styles.statBoxIcon}>{icon}</Text>
      <Text style={[styles.statBoxValue, { color: theme.colors.primary }]}>{value}</Text>
      <Text style={[styles.statBoxLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
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
    fontSize: 36,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  rankingSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  rankEmoji: {
    fontSize: 20,
    width: 30,
  },
  rankInfo: {
    flex: 1,
    marginLeft: 8,
  },
  rankName: {
    fontSize: 14,
    fontWeight: '500',
  },
  rankStatus: {
    fontSize: 11,
    marginTop: 2,
  },
  winnerBadge: {
    fontSize: 18,
  },
  titlesSection: {
    marginBottom: 16,
  },
  titlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  titleBadge: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 80,
  },
  titleIcon: {
    fontSize: 18,
  },
  titleName: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  titlePlayer: {
    fontSize: 9,
    marginTop: 2,
  },
  myStatsSection: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    minWidth: 70,
    flex: 1,
  },
  statBoxIcon: {
    fontSize: 16,
  },
  statBoxValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statBoxLabel: {
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  summarySection: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 13,
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
