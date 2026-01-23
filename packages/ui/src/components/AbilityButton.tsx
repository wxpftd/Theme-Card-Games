/**
 * AbilityButton - 主动技能按钮组件
 * 用于显示和触发角色的主动技能
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { ActiveAbility, PlayerCharacterState } from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';

export interface AbilityButtonProps {
  /** 主动技能定义 */
  ability: ActiveAbility;
  /** 角色状态 (用于获取冷却和使用次数) */
  characterState?: PlayerCharacterState;
  /** 是否可用 */
  enabled?: boolean;
  /** 是否是当前玩家的回合 */
  isPlayerTurn?: boolean;
  /** 使用技能回调 */
  onUse?: () => void;
  /** 自定义样式 */
  style?: ViewStyle;
  /** 紧凑模式 */
  compact?: boolean;
}

/**
 * 主动技能按钮组件
 */
export const AbilityButton: React.FC<AbilityButtonProps> = ({
  ability,
  characterState,
  enabled = true,
  isPlayerTurn = true,
  onUse,
  style,
  compact = false,
}) => {
  const { theme } = useTheme();

  const usesRemaining = characterState?.activeAbilityUsesRemaining ?? ability.maxUsesPerGame;
  const cooldownRemaining = characterState?.activeAbilityCooldownRemaining ?? 0;

  const isOnCooldown = cooldownRemaining > 0;
  const hasUsesLeft = usesRemaining > 0;
  const canUse = enabled && isPlayerTurn && !isOnCooldown && hasUsesLeft;

  const getStatusText = () => {
    if (!hasUsesLeft) {
      return '已用尽';
    }
    if (isOnCooldown) {
      return `冷却中 (${cooldownRemaining})`;
    }
    if (!isPlayerTurn) {
      return '等待回合';
    }
    return `${usesRemaining}/${ability.maxUsesPerGame}`;
  };

  const getButtonColor = () => {
    if (!canUse) {
      return theme.colors.textSecondary;
    }
    return theme.colors.primary;
  };

  const renderCostInfo = () => {
    if (!ability.cost || Object.keys(ability.cost).length === 0) {
      return null;
    }

    return (
      <View style={styles.costContainer}>
        {Object.entries(ability.cost).map(([resource, amount]) => (
          <Text key={resource} style={[styles.costText, { color: theme.colors.warning }]}>
            {resource}: -{amount}
          </Text>
        ))}
      </View>
    );
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactContainer,
          {
            backgroundColor: canUse ? `${theme.colors.primary}15` : '#F5F5F5',
            borderColor: getButtonColor(),
          },
          style,
        ]}
        onPress={onUse}
        disabled={!canUse}
        activeOpacity={0.7}
      >
        <Text style={styles.compactIcon}>{ability.icon || '⚡'}</Text>
        {isOnCooldown && (
          <View style={[styles.cooldownBadge, { backgroundColor: theme.colors.warning }]}>
            <Text style={styles.cooldownBadgeText}>{cooldownRemaining}</Text>
          </View>
        )}
        {!hasUsesLeft && (
          <View style={styles.disabledOverlay}>
            <Text style={styles.disabledText}>×</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: canUse ? `${theme.colors.primary}10` : '#F5F5F5',
          borderColor: getButtonColor(),
          opacity: canUse ? 1 : 0.7,
        },
        style,
      ]}
      onPress={onUse}
      disabled={!canUse}
      activeOpacity={0.7}
    >
      {/* 图标 */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{ability.icon || '⚡'}</Text>
        {isOnCooldown && (
          <View style={[styles.cooldownOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <Text style={styles.cooldownText}>{cooldownRemaining}</Text>
          </View>
        )}
      </View>

      {/* 信息 */}
      <View style={styles.infoContainer}>
        <Text style={[styles.name, { color: theme.colors.text }]}>{ability.name}</Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {ability.description}
        </Text>
        {renderCostInfo()}
      </View>

      {/* 状态 */}
      <View style={styles.statusContainer}>
        <Text
          style={[
            styles.statusText,
            {
              color: canUse
                ? theme.colors.success
                : isOnCooldown
                  ? theme.colors.warning
                  : theme.colors.error,
            },
          ]}
        >
          {getStatusText()}
        </Text>
        {ability.needsTarget && canUse && (
          <Text style={[styles.targetHint, { color: theme.colors.textSecondary }]}>需选择目标</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginVertical: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  icon: {
    fontSize: 24,
  },
  cooldownOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  cooldownText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  description: {
    fontSize: 11,
    lineHeight: 15,
  },
  costContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 8,
  },
  costText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  targetHint: {
    fontSize: 10,
    marginTop: 2,
  },
  // 紧凑模式样式
  compactContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  compactIcon: {
    fontSize: 24,
  },
  cooldownBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cooldownBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default AbilityButton;
