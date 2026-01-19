import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { PlayerState, StatDefinition, ResourceDefinition } from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';

interface GameOverScreenProps {
  winner: PlayerState | null;
  reason?: string;
  player: PlayerState;
  statDefinitions: StatDefinition[];
  resourceDefinitions: ResourceDefinition[];
  onRestart?: () => void;
  onMainMenu?: () => void;
  style?: ViewStyle;
}

export function GameOverScreen({
  winner,
  reason,
  player,
  statDefinitions,
  resourceDefinitions,
  onRestart,
  onMainMenu,
  style,
}: GameOverScreenProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  const isWinner = winner?.id === player.id;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }, style]}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        {/* Result Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: isWinner ? theme.colors.success : theme.colors.error,
            },
          ]}
        >
          <Text style={styles.emoji}>{isWinner ? '🎉' : '😢'}</Text>
          <Text style={styles.resultText}>
            {isWinner ? t('gameOver.victory') : t('gameOver.defeat')}
          </Text>
        </View>

        {/* Reason */}
        {reason && (
          <Text style={[styles.reason, { color: theme.colors.textSecondary }]}>{reason}</Text>
        )}

        {/* Final Stats */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('gameOver.finalStats')}
          </Text>

          <View style={styles.statsGrid}>
            {statDefinitions.map((stat) => {
              const value = player.stats[stat.id] ?? 0;
              return (
                <View key={stat.id} style={styles.statRow}>
                  <Text style={styles.statIcon}>{stat.icon}</Text>
                  <Text style={[styles.statName, { color: theme.colors.text }]}>{stat.name}</Text>
                  <Text style={[styles.statValue, { color: theme.colors.primary }]}>{value}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.resourcesGrid}>
            {resourceDefinitions.map((resource) => {
              const value = player.resources[resource.id] ?? 0;
              return (
                <View
                  key={resource.id}
                  style={[styles.resourceItem, { backgroundColor: theme.colors.background }]}
                >
                  <Text style={styles.resourceIcon}>{resource.icon}</Text>
                  <Text style={[styles.resourceValue, { color: theme.colors.text }]}>{value}</Text>
                  <Text style={[styles.resourceName, { color: theme.colors.textSecondary }]}>
                    {resource.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={onRestart}
          >
            <Text style={styles.primaryButtonText}>{t('gameOver.playAgain')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, { borderColor: theme.colors.primary }]}
            onPress={onMainMenu}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
              {t('gameOver.mainMenu')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  reason: {
    textAlign: 'center',
    fontSize: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  statsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsGrid: {
    gap: 8,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    fontSize: 16,
    width: 24,
  },
  statName: {
    flex: 1,
    fontSize: 14,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  resourceItem: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 70,
  },
  resourceIcon: {
    fontSize: 20,
  },
  resourceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resourceName: {
    fontSize: 10,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  primaryButton: {},
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
