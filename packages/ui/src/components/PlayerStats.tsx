import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { PlayerState, StatDefinition, ResourceDefinition } from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';

interface PlayerStatsProps {
  player: PlayerState;
  statDefinitions: StatDefinition[];
  resourceDefinitions: ResourceDefinition[];
  compact?: boolean;
  style?: ViewStyle;
}

export function PlayerStats({
  player,
  statDefinitions,
  resourceDefinitions,
  compact = false,
  style,
}: PlayerStatsProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface },
        style,
      ]}
    >
      {/* Player Name */}
      <Text style={[styles.playerName, { color: theme.colors.text }]}>
        {player.name}
      </Text>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          状态
        </Text>
        <View style={styles.statsGrid}>
          {statDefinitions.map((stat) => {
            const value = player.stats[stat.id] ?? 0;
            const max = stat.max ?? 100;
            const percentage = Math.min((value / max) * 100, 100);

            return (
              <View key={stat.id} style={styles.statItem}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>{stat.icon}</Text>
                  <Text
                    style={[styles.statName, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {compact ? '' : stat.name}
                  </Text>
                  <Text
                    style={[styles.statValue, { color: theme.colors.text }]}
                  >
                    {value}
                  </Text>
                </View>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: theme.colors.background },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor: getStatColor(stat.id, percentage, theme.colors),
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Resources */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          资源
        </Text>
        <View style={styles.resourcesRow}>
          {resourceDefinitions.map((resource) => {
            const value = player.resources[resource.id] ?? 0;

            return (
              <View
                key={resource.id}
                style={[
                  styles.resourceItem,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <Text style={styles.resourceIcon}>{resource.icon}</Text>
                <Text style={[styles.resourceValue, { color: theme.colors.text }]}>
                  {value}
                </Text>
                {!compact && (
                  <Text
                    style={[
                      styles.resourceName,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {resource.name}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Active Statuses */}
      {player.statuses.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            状态效果
          </Text>
          <View style={styles.statusesRow}>
            {player.statuses.map((status, index) => (
              <View
                key={index}
                style={[
                  styles.statusBadge,
                  { backgroundColor: theme.colors.warning },
                ]}
              >
                <Text style={styles.statusText}>{status.name}</Text>
                {status.duration > 0 && (
                  <Text style={styles.statusDuration}>({status.duration})</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function getStatColor(
  statId: string,
  percentage: number,
  colors: { error: string; warning: string; success: string; primary: string }
): string {
  // Special handling for health and happiness - low is bad
  if (statId === 'health' || statId === 'happiness') {
    if (percentage <= 20) return colors.error;
    if (percentage <= 40) return colors.warning;
    return colors.success;
  }

  // For performance and influence - high is good
  if (percentage >= 80) return colors.success;
  if (percentage >= 50) return colors.primary;
  return colors.warning;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  statsGrid: {
    gap: 8,
  },
  statItem: {
    marginBottom: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statName: {
    fontSize: 12,
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  resourcesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  resourceIcon: {
    fontSize: 14,
  },
  resourceValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  resourceName: {
    fontSize: 10,
  },
  statusesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusDuration: {
    color: '#fff',
    fontSize: 10,
  },
});
