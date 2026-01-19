import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import {
  DailyChallengeDefinition,
  DailyChallengeInstance,
  AchievementReward,
} from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';

interface DailyChallengeProps {
  challenge: DailyChallengeDefinition | null;
  instance: DailyChallengeInstance | null;
  currentStreak: number;
  bestStreak: number;
  streakBonus: AchievementReward | null;
  onStartChallenge?: () => void;
  onViewRewards?: () => void;
  style?: ViewStyle;
}

export function DailyChallenge({
  challenge,
  instance,
  currentStreak,
  bestStreak,
  streakBonus,
  onStartChallenge,
  onViewRewards,
  style,
}: DailyChallengeProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  const getConditionText = useCallback(
    (condition: any): string => {
      switch (condition.type) {
        case 'no_card_tag':
          return t('condition.noCardTag', { tag: condition.tag });
        case 'max_resource_usage':
          return t('condition.maxResourceUsage', {
            resource: condition.resource,
            max: condition.max,
          });
        case 'min_stat_at_win':
          return t('condition.minStatAtWin', { stat: condition.stat, min: condition.min });
        case 'max_turns':
          return t('condition.maxTurns', { turns: condition.turns });
        case 'no_card_type':
          return t('condition.noCardType', { cardType: condition.cardType });
        case 'min_card_usage':
          return t('condition.minCardUsage', { count: condition.count, cardTag: condition.cardTag });
        default:
          return t('condition.special');
      }
    },
    [t]
  );

  if (!challenge || !instance) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }, style]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          {t('dailyChallenge.loading')}
        </Text>
      </View>
    );
  }

  const isCompleted = instance.completed;
  const difficultyStars = '★'.repeat(challenge.difficulty) + '☆'.repeat(5 - challenge.difficulty);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }, style]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.headerIcon}>{challenge.icon}</Text>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('dailyChallenge.title')}</Text>
          <Text style={styles.headerDate}>{instance.date}</Text>
        </View>
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedIcon}>✓</Text>
          </View>
        )}
      </View>

      {/* Challenge Info */}
      <View style={styles.challengeInfo}>
        <Text style={[styles.challengeName, { color: theme.colors.text }]}>{challenge.name}</Text>
        <Text style={[styles.challengeDescription, { color: theme.colors.textSecondary }]}>
          {challenge.description}
        </Text>

        {/* Difficulty */}
        <View style={styles.difficultyRow}>
          <Text style={[styles.difficultyLabel, { color: theme.colors.textSecondary }]}>
            {t('dailyChallenge.difficulty')}
          </Text>
          <Text style={[styles.difficultyStars, { color: theme.colors.warning }]}>
            {difficultyStars}
          </Text>
        </View>

        {/* Conditions */}
        <View style={styles.conditionsSection}>
          <Text style={[styles.conditionsLabel, { color: theme.colors.text }]}>
            {t('dailyChallenge.conditions')}
          </Text>
          {challenge.conditions.map((condition, index) => (
            <View
              key={index}
              style={[styles.conditionItem, { backgroundColor: theme.colors.background }]}
            >
              <Text style={[styles.conditionText, { color: theme.colors.text }]}>
                {getConditionText(condition)}
              </Text>
              {instance.bestAttempt && (
                <Text
                  style={[
                    styles.conditionStatus,
                    {
                      color: instance.bestAttempt.conditionsMet[index]
                        ? theme.colors.success
                        : theme.colors.error,
                    },
                  ]}
                >
                  {instance.bestAttempt.conditionsMet[index] ? '✓' : '✗'}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Rewards */}
        <View style={styles.rewardsSection}>
          <Text style={[styles.rewardsLabel, { color: theme.colors.text }]}>
            {t('dailyChallenge.rewards')}
          </Text>
          <View style={styles.rewardsList}>
            {challenge.rewards.map((reward, index) => (
              <View
                key={index}
                style={[styles.rewardItem, { backgroundColor: theme.colors.background }]}
              >
                <Text style={styles.rewardIcon}>{getRewardIcon(reward.type)}</Text>
                <Text style={[styles.rewardText, { color: theme.colors.text }]}>
                  {reward.description || `${reward.value}`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Streak Info */}
      <View style={[styles.streakSection, { backgroundColor: theme.colors.background }]}>
        <View style={styles.streakItem}>
          <Text style={[styles.streakValue, { color: theme.colors.primary }]}>{currentStreak}</Text>
          <Text style={[styles.streakLabel, { color: theme.colors.textSecondary }]}>
            {t('dailyChallenge.currentStreak')}
          </Text>
        </View>
        <View style={styles.streakDivider} />
        <View style={styles.streakItem}>
          <Text style={[styles.streakValue, { color: theme.colors.accent }]}>{bestStreak}</Text>
          <Text style={[styles.streakLabel, { color: theme.colors.textSecondary }]}>
            {t('dailyChallenge.bestStreak')}
          </Text>
        </View>
        <View style={styles.streakDivider} />
        <View style={styles.streakItem}>
          <Text style={[styles.streakValue, { color: theme.colors.text }]}>
            {instance.attemptCount}
          </Text>
          <Text style={[styles.streakLabel, { color: theme.colors.textSecondary }]}>
            {t('dailyChallenge.todayAttempts')}
          </Text>
        </View>
      </View>

      {/* Streak Bonus */}
      {streakBonus && (
        <View style={[styles.streakBonus, { backgroundColor: `${theme.colors.success}20` }]}>
          <Text style={styles.streakBonusIcon}>🎁</Text>
          <Text style={[styles.streakBonusText, { color: theme.colors.success }]}>
            {t('dailyChallenge.streakBonus')} {streakBonus.description || `${streakBonus.value}`}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {!isCompleted ? (
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
            onPress={onStartChallenge}
          >
            <Text style={styles.startButtonText}>
              {instance.attemptCount > 0 ? t('dailyChallenge.retry') : t('dailyChallenge.start')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.completedButton, { backgroundColor: theme.colors.success }]}
            onPress={onViewRewards}
          >
            <Text style={styles.completedButtonText}>{t('dailyChallenge.viewRewards')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function getRewardIcon(type: string): string {
  switch (type) {
    case 'points':
      return '🏆';
    case 'card_skin':
      return '🎨';
    case 'buff':
      return '⚡';
    case 'unlock_card':
      return '🃏';
    case 'title':
      return '📛';
    default:
      return '🎁';
  }
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    padding: 40,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  challengeInfo: {
    padding: 16,
  },
  challengeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  difficultyLabel: {
    fontSize: 12,
  },
  difficultyStars: {
    fontSize: 14,
  },
  conditionsSection: {
    marginBottom: 12,
  },
  conditionsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  conditionText: {
    flex: 1,
    fontSize: 13,
  },
  conditionStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  rewardsSection: {},
  rewardsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rewardsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  rewardIcon: {
    fontSize: 16,
  },
  rewardText: {
    fontSize: 12,
  },
  streakSection: {
    flexDirection: 'row',
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 11,
  },
  streakDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  streakBonus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
  },
  streakBonusIcon: {
    fontSize: 18,
  },
  streakBonusText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  actions: {
    padding: 16,
  },
  startButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completedButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  completedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
