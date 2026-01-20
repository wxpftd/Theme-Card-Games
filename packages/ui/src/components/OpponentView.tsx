import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PlayerState, StatDefinition, ResourceDefinition } from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';

interface OpponentViewProps {
  /** 对手玩家列表 */
  opponents: PlayerState[];
  /** 当前回合的玩家 ID */
  currentTurnPlayerId: string;
  /** 属性定义 */
  statDefinitions: StatDefinition[];
  /** 资源定义 */
  resourceDefinitions: ResourceDefinition[];
  /** 是否为 AI 玩家的映射 */
  isAIPlayer?: (playerId: string) => boolean;
}

function OpponentViewComponent({
  opponents,
  currentTurnPlayerId,
  statDefinitions,
  resourceDefinitions,
  isAIPlayer,
}: OpponentViewProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  if (opponents.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
        {t('competitive.opponents')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {opponents.map((opponent) => (
          <OpponentCard
            key={opponent.id}
            opponent={opponent}
            isCurrentTurn={currentTurnPlayerId === opponent.id}
            isAI={isAIPlayer?.(opponent.id) ?? false}
            statDefinitions={statDefinitions}
            resourceDefinitions={resourceDefinitions}
            colors={theme.colors}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface OpponentCardProps {
  opponent: PlayerState;
  isCurrentTurn: boolean;
  isAI: boolean;
  statDefinitions: StatDefinition[];
  resourceDefinitions: ResourceDefinition[];
  colors: {
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
    success: string;
    warning: string;
    error: string;
    accent: string;
  };
}

const OpponentCard = memo(function OpponentCard({
  opponent,
  isCurrentTurn,
  isAI,
  statDefinitions,
  resourceDefinitions,
  colors,
}: OpponentCardProps) {
  const performance = opponent.stats['performance'] ?? 0;
  const health = opponent.stats['health'] ?? 0;
  const happiness = opponent.stats['happiness'] ?? 0;
  const influence = opponent.stats['influence'] ?? 0;

  return (
    <View
      style={[
        styles.opponentCard,
        { backgroundColor: colors.surface },
        isCurrentTurn && { borderColor: colors.primary, borderWidth: 2 },
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.nameRow}>
          <Text style={[styles.opponentName, { color: colors.text }]}>{opponent.name}</Text>
          {isAI && (
            <View style={[styles.aiBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          )}
        </View>
        {isCurrentTurn && (
          <Text style={[styles.turnIndicator, { color: colors.primary }]}>行动中</Text>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <StatRow icon="📈" label="绩效" value={performance} max={100} color={colors.primary} />
        <StatRow
          icon="❤️"
          label="健康"
          value={health}
          max={100}
          color={health < 30 ? colors.error : colors.success}
        />
        <StatRow
          icon="😊"
          label="幸福"
          value={happiness}
          max={100}
          color={happiness < 30 ? colors.warning : colors.success}
        />
        <StatRow icon="🎯" label="影响力" value={influence} max={100} color={colors.accent} />
      </View>

      {/* Hand count */}
      <View style={[styles.handInfo, { borderTopColor: colors.textSecondary + '30' }]}>
        <Text style={[styles.handCount, { color: colors.textSecondary }]}>
          🃏 {opponent.hand.length} 张手牌
        </Text>
      </View>
    </View>
  );
});

interface StatRowProps {
  icon: string;
  label: string;
  value: number;
  max: number;
  color: string;
}

const StatRow = memo(function StatRow({ icon, label, value, max, color }: StatRowProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <View style={styles.statRow}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statBarContainer}>
        <View style={[styles.statBarBg, { backgroundColor: color + '20' }]}>
          <View style={[styles.statBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
      </View>
      <Text style={[styles.statRowValue, { color }]}>{value}</Text>
    </View>
  );
});

export const OpponentView = memo(OpponentViewComponent);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 12,
  },
  scrollView: {
    paddingHorizontal: 8,
  },
  opponentCard: {
    width: 160,
    marginHorizontal: 4,
    borderRadius: 12,
    padding: 10,
  },
  cardHeader: {
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  opponentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  aiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  turnIndicator: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  statsContainer: {
    gap: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 10,
    width: 14,
  },
  statBarContainer: {
    flex: 1,
    height: 6,
  },
  statBarBg: {
    flex: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  statRowValue: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 24,
    textAlign: 'right',
  },
  handInfo: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  handCount: {
    fontSize: 11,
    textAlign: 'center',
  },
});
