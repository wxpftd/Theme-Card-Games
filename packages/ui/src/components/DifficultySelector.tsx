import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { DifficultyDefinition, DifficultyLevel } from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';

interface DifficultySelectorProps {
  difficulties: DifficultyDefinition[];
  currentDifficulty: DifficultyLevel;
  unlockedDifficulties: DifficultyLevel[];
  onSelectDifficulty: (level: DifficultyLevel) => void;
  style?: ViewStyle;
}

const difficultyColors: Record<DifficultyLevel, string> = {
  easy: '#4CAF50',
  normal: '#2196F3',
  hard: '#FF9800',
  hell: '#D32F2F',
};

export function DifficultySelector({
  difficulties,
  currentDifficulty,
  unlockedDifficulties,
  onSelectDifficulty,
  style,
}: DifficultySelectorProps) {
  const { theme } = useTheme();

  const renderDifficultyCard = (difficulty: DifficultyDefinition) => {
    const isUnlocked = unlockedDifficulties.includes(difficulty.id);
    const isSelected = currentDifficulty === difficulty.id;
    const color = difficultyColors[difficulty.id];

    return (
      <TouchableOpacity
        key={difficulty.id}
        style={[
          styles.difficultyCard,
          {
            backgroundColor: isSelected ? color : theme.colors.surface,
            borderColor: isUnlocked ? color : theme.colors.textSecondary,
            opacity: isUnlocked ? 1 : 0.6,
          },
        ]}
        onPress={() => isUnlocked && onSelectDifficulty(difficulty.id)}
        disabled={!isUnlocked}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={[styles.icon, !isUnlocked && styles.lockedIcon]}>
            {isUnlocked ? difficulty.icon : '🔒'}
          </Text>
          <Text
            style={[
              styles.difficultyName,
              { color: isSelected ? '#fff' : theme.colors.text },
            ]}
          >
            {difficulty.name}
          </Text>
        </View>

        {/* Description */}
        <Text
          style={[
            styles.description,
            { color: isSelected ? '#fff' : theme.colors.textSecondary },
          ]}
          numberOfLines={2}
        >
          {isUnlocked ? difficulty.description : '完成更低难度以解锁'}
        </Text>

        {/* Modifiers */}
        {isUnlocked && (
          <View style={styles.modifiers}>
            {difficulty.initialStats && (
              <View style={styles.modifierSection}>
                <Text
                  style={[
                    styles.modifierLabel,
                    { color: isSelected ? '#fff' : theme.colors.textSecondary },
                  ]}
                >
                  初始数值:
                </Text>
                <View style={styles.modifierList}>
                  {Object.entries(difficulty.initialStats).map(([stat, value]) => (
                    <Text
                      key={stat}
                      style={[
                        styles.modifierItem,
                        { color: isSelected ? '#fff' : theme.colors.text },
                      ]}
                    >
                      {stat}: {value}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {difficulty.perTurnStatChanges && (
              <View style={styles.modifierSection}>
                <Text
                  style={[
                    styles.modifierLabel,
                    { color: isSelected ? '#fff' : theme.colors.textSecondary },
                  ]}
                >
                  每回合:
                </Text>
                <View style={styles.modifierList}>
                  {Object.entries(difficulty.perTurnStatChanges).map(([stat, delta]) => (
                    <Text
                      key={stat}
                      style={[
                        styles.modifierItem,
                        {
                          color: isSelected
                            ? '#fff'
                            : delta < 0
                              ? theme.colors.error
                              : theme.colors.success,
                        },
                      ]}
                    >
                      {stat}: {delta > 0 ? '+' : ''}{delta}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {difficulty.specialRules && difficulty.specialRules.length > 0 && (
              <View style={styles.modifierSection}>
                <Text
                  style={[
                    styles.modifierLabel,
                    { color: isSelected ? '#fff' : theme.colors.textSecondary },
                  ]}
                >
                  特殊规则:
                </Text>
                {difficulty.specialRules.map((rule, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.ruleText,
                      { color: isSelected ? '#fff' : theme.colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {rule.description}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Score multiplier */}
        {isUnlocked && difficulty.scoreMultiplier && (
          <View
            style={[
              styles.multiplierBadge,
              { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : color },
            ]}
          >
            <Text
              style={[
                styles.multiplierText,
                { color: isSelected ? '#fff' : '#fff' },
              ]}
            >
              {difficulty.scoreMultiplier}x
            </Text>
          </View>
        )}

        {/* Selected indicator */}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>选择难度</Text>
      <View style={styles.difficultyList}>
        {difficulties.map(renderDifficultyCard)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  difficultyList: {
    gap: 12,
  },
  difficultyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
  },
  lockedIcon: {
    opacity: 0.5,
  },
  difficultyName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  description: {
    fontSize: 13,
    marginBottom: 12,
  },
  modifiers: {
    gap: 8,
  },
  modifierSection: {
    gap: 4,
  },
  modifierLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  modifierList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modifierItem: {
    fontSize: 12,
  },
  ruleText: {
    fontSize: 12,
  },
  multiplierBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  multiplierText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
