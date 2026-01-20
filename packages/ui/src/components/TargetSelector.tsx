import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { TargetSelectionRequest, PlayerState } from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';

interface TargetSelectorProps {
  /** 是否显示 */
  visible: boolean;
  /** 目标选择请求 */
  request: TargetSelectionRequest | null;
  /** 玩家状态映射 */
  players: Record<string, PlayerState>;
  /** 选择目标回调 */
  onSelect: (targetIds: string[]) => void;
  /** 取消回调 */
  onCancel?: () => void;
}

function TargetSelectorComponent({
  visible,
  request,
  players,
  onSelect,
  onCancel,
}: TargetSelectorProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  const handleSelect = useCallback(
    (playerId: string) => {
      onSelect([playerId]);
    },
    [onSelect]
  );

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  if (!request) {
    return null;
  }

  const validPlayers = request.validTargets.map((id) => players[id]).filter(Boolean);

  const renderPlayer = ({ item: player }: { item: PlayerState }) => (
    <TouchableOpacity
      style={[styles.playerItem, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleSelect(player.id)}
      activeOpacity={0.7}
    >
      <View style={styles.playerInfo}>
        <Text style={[styles.playerName, { color: theme.colors.text }]}>{player.name}</Text>
        <View style={styles.playerStats}>
          <StatBadge
            label="绩效"
            value={player.stats['performance'] ?? 0}
            color={theme.colors.primary}
          />
          <StatBadge
            label="健康"
            value={player.stats['health'] ?? 0}
            color={theme.colors.success}
          />
          <StatBadge
            label="影响力"
            value={player.stats['influence'] ?? 0}
            color={theme.colors.accent}
          />
        </View>
      </View>
      <View style={[styles.selectArrow, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.arrowText}>→</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.header, { borderBottomColor: theme.colors.surface }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('competitive.selectTarget')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {request.reason}
            </Text>
          </View>

          <FlatList
            data={validPlayers}
            keyExtractor={(item) => item.id}
            renderItem={renderPlayer}
            contentContainerStyle={styles.list}
          />

          {request.allowCancel && (
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.colors.surface }]}
              onPress={handleCancel}
            >
              <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const StatBadge = memo(function StatBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={[styles.statBadge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
});

export const TargetSelector = memo(TargetSelectorComponent);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxHeight: '70%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  list: {
    padding: 12,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  playerStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    margin: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
  },
});
