import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { AchievementDefinition, AchievementProgress } from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';

interface AchievementListProps {
  achievements: AchievementDefinition[];
  progress: Record<string, AchievementProgress>;
  totalPoints: number;
  onAchievementPress?: (achievement: AchievementDefinition) => void;
  onClaimReward?: (achievementId: string) => void;
  style?: ViewStyle;
}

const rarityColors: Record<string, string> = {
  common: '#9E9E9E',
  uncommon: '#4CAF50',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FF9800',
};

export function AchievementList({
  achievements,
  progress,
  totalPoints,
  onAchievementPress,
  onClaimReward,
  style,
}: AchievementListProps) {
  const { theme } = useTheme();

  const unlockedCount = Object.values(progress).filter((p) => p.unlocked).length;

  const renderAchievement = (achievement: AchievementDefinition) => {
    const achievementProgress = progress[achievement.id];
    const isUnlocked = achievementProgress?.unlocked ?? false;
    const isClaimed = achievementProgress?.claimed ?? false;
    const isHidden = achievement.hidden && !isUnlocked;

    return (
      <TouchableOpacity
        key={achievement.id}
        style={[
          styles.achievementCard,
          {
            backgroundColor: isUnlocked ? theme.colors.surface : `${theme.colors.surface}80`,
            borderColor: isUnlocked ? rarityColors[achievement.rarity] : theme.colors.textSecondary,
          },
        ]}
        onPress={() => onAchievementPress?.(achievement)}
        disabled={isHidden}
      >
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isUnlocked
                ? `${rarityColors[achievement.rarity]}20`
                : theme.colors.background,
            },
          ]}
        >
          <Text style={[styles.icon, !isUnlocked && styles.lockedIcon]}>
            {isHidden ? '?' : achievement.icon}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.name,
                { color: isUnlocked ? theme.colors.text : theme.colors.textSecondary },
              ]}
            >
              {isHidden ? '???' : achievement.name}
            </Text>
            <View
              style={[
                styles.rarityBadge,
                { backgroundColor: rarityColors[achievement.rarity] },
              ]}
            >
              <Text style={styles.rarityText}>
                {achievement.rarity.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          <Text
            style={[styles.description, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
          >
            {isHidden ? '???' : achievement.description}
          </Text>

          {/* Points */}
          <View style={styles.pointsRow}>
            <Text style={[styles.points, { color: theme.colors.primary }]}>
              {achievement.points ?? 0} pts
            </Text>

            {/* Claim button */}
            {isUnlocked && !isClaimed && onClaimReward && (
              <TouchableOpacity
                style={[styles.claimButton, { backgroundColor: theme.colors.success }]}
                onPress={() => onClaimReward(achievement.id)}
              >
                <Text style={styles.claimButtonText}>Claim</Text>
              </TouchableOpacity>
            )}

            {isClaimed && (
              <Text style={[styles.claimedText, { color: theme.colors.success }]}>
                Claimed
              </Text>
            )}
          </View>
        </View>

        {/* Locked overlay */}
        {!isUnlocked && (
          <View style={styles.lockedOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Group achievements by category
  const categories = ['gameplay', 'challenge', 'milestone', 'hidden'];
  const categoryNames: Record<string, string> = {
    gameplay: '游戏成就',
    challenge: '挑战成就',
    milestone: '里程碑',
    hidden: '隐藏成就',
  };

  return (
    <ScrollView style={[styles.container, style]} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.headerTitle}>成就</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerStatText}>
            {unlockedCount}/{achievements.length} 解锁
          </Text>
          <Text style={styles.headerStatText}>{totalPoints} pts</Text>
        </View>
      </View>

      {/* Achievement categories */}
      {categories.map((category) => {
        const categoryAchievements = achievements.filter((a) => a.category === category);
        if (categoryAchievements.length === 0) return null;

        return (
          <View key={category} style={styles.categorySection}>
            <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
              {categoryNames[category]}
            </Text>
            {categoryAchievements.map(renderAchievement)}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  headerStatText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  categorySection: {
    padding: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 28,
  },
  lockedIcon: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rarityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 12,
    marginBottom: 8,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  points: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  claimButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  claimedText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  lockIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
});
