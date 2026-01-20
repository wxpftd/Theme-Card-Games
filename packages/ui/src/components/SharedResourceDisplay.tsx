import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SharedResourceDefinition, SharedResourceState, PlayerState } from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';

interface SharedResourceDisplayProps {
  /** 共享资源定义列表 */
  definitions: SharedResourceDefinition[];
  /** 共享资源状态列表 */
  states: SharedResourceState[];
  /** 所有玩家 */
  players: Record<string, PlayerState>;
  /** 当前玩家 ID */
  currentPlayerId: string;
  /** 点击资源回调 (用于抢夺) */
  onClaimResource?: (resourceId: string) => void;
  /** 是否可以抢夺 */
  canClaim?: boolean;
}

function SharedResourceDisplayComponent({
  definitions,
  states,
  players,
  currentPlayerId,
  onClaimResource,
  canClaim = false,
}: SharedResourceDisplayProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  if (definitions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
        {t('competitive.sharedResources')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {definitions.map((def) => {
          const state = states.find((s) => s.resourceId === def.id);
          return (
            <SharedResourceCard
              key={def.id}
              definition={def}
              state={state}
              players={players}
              currentPlayerId={currentPlayerId}
              onClaim={onClaimResource}
              canClaim={canClaim}
              colors={theme.colors}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

interface SharedResourceCardProps {
  definition: SharedResourceDefinition;
  state?: SharedResourceState;
  players: Record<string, PlayerState>;
  currentPlayerId: string;
  onClaim?: (resourceId: string) => void;
  canClaim: boolean;
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

const SharedResourceCard = memo(function SharedResourceCard({
  definition,
  state,
  players,
  currentPlayerId,
  onClaim,
  canClaim,
  colors,
}: SharedResourceCardProps) {
  const currentAmount = state?.currentAmount ?? definition.totalAmount;
  const isDepleted = currentAmount <= 0;
  const claimedByPlayer = state?.claimedBy[currentPlayerId] ?? 0;

  const handlePress = () => {
    if (canClaim && !isDepleted && onClaim) {
      onClaim(definition.id);
    }
  };

  // 获取抢夺排名
  const claimRanking = state
    ? Object.entries(state.claimedBy)
        .map(([playerId, amount]) => ({
          player: players[playerId],
          amount,
        }))
        .filter((item) => item.player)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3)
    : [];

  return (
    <TouchableOpacity
      style={[
        styles.resourceCard,
        { backgroundColor: colors.surface },
        isDepleted && styles.depletedCard,
      ]}
      onPress={handlePress}
      disabled={!canClaim || isDepleted}
      activeOpacity={canClaim && !isDepleted ? 0.7 : 1}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.resourceIcon}>{definition.icon ?? '📦'}</Text>
        <Text style={[styles.resourceName, { color: colors.text }]}>{definition.name}</Text>
      </View>

      {/* Amount */}
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: isDepleted ? colors.error : colors.primary }]}>
          {currentAmount}
        </Text>
        <Text style={[styles.totalAmount, { color: colors.textSecondary }]}>
          / {definition.totalAmount}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.textSecondary + '20' }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${(currentAmount / definition.totalAmount) * 100}%`,
              backgroundColor: isDepleted ? colors.error : colors.primary,
            },
          ]}
        />
      </View>

      {/* Renewable indicator */}
      {definition.renewable && (
        <Text style={[styles.renewableText, { color: colors.success }]}>
          🔄 每 {definition.renewalInterval} 回合再生
        </Text>
      )}

      {/* Claim ranking */}
      {claimRanking.length > 0 && (
        <View style={styles.rankingContainer}>
          <Text style={[styles.rankingTitle, { color: colors.textSecondary }]}>已抢夺:</Text>
          {claimRanking.map((item, index) => (
            <Text
              key={item.player.id}
              style={[
                styles.rankingItem,
                {
                  color: item.player.id === currentPlayerId ? colors.primary : colors.textSecondary,
                },
              ]}
            >
              {index + 1}. {item.player.name} ({item.amount})
            </Text>
          ))}
        </View>
      )}

      {/* Player claimed */}
      {claimedByPlayer > 0 && (
        <View style={[styles.claimedBadge, { backgroundColor: colors.success }]}>
          <Text style={styles.claimedText}>已获得 {claimedByPlayer}</Text>
        </View>
      )}

      {/* Depleted overlay */}
      {isDepleted && (
        <View style={styles.depletedOverlay}>
          <Text style={styles.depletedText}>已耗尽</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

export const SharedResourceDisplay = memo(SharedResourceDisplayComponent);

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
  resourceCard: {
    width: 150,
    marginHorizontal: 4,
    borderRadius: 12,
    padding: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  depletedCard: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  resourceIcon: {
    fontSize: 18,
  },
  resourceName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 14,
    marginLeft: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  renewableText: {
    fontSize: 10,
    marginTop: 4,
  },
  rankingContainer: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  rankingTitle: {
    fontSize: 10,
    marginBottom: 2,
  },
  rankingItem: {
    fontSize: 10,
  },
  claimedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  claimedText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  depletedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  depletedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
