/**
 * CharacterCard - 角色卡片组件
 * 显示角色信息，包括属性、技能等
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { CharacterDefinition, PassiveAbility, ActiveAbility } from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';

export interface CharacterCardProps {
  /** 角色定义 */
  character: CharacterDefinition;
  /** 是否被选中 */
  isSelected?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示详情 */
  showDetails?: boolean;
  /** 点击回调 */
  onPress?: () => void;
  /** 自定义样式 */
  style?: ViewStyle;
}

/**
 * 角色卡片组件
 */
export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isSelected = false,
  disabled = false,
  showDetails = false,
  onPress,
  style,
}) => {
  const { theme } = useTheme();

  const getRarityColor = () => {
    switch (character.rarity) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#9B59B6';
      case 'rare':
        return '#3498DB';
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderStatModifiers = () => {
    const modifiers = Object.entries(character.statModifiers || {});
    if (modifiers.length === 0) return null;

    return (
      <View style={styles.modifiersContainer}>
        {modifiers.map(([stat, value]) => (
          <Text
            key={stat}
            style={[
              styles.modifier,
              { color: value >= 0 ? theme.colors.success : theme.colors.error },
            ]}
          >
            {stat}: {value >= 0 ? '+' : ''}
            {value}
          </Text>
        ))}
      </View>
    );
  };

  const renderPassiveAbility = (ability: PassiveAbility) => (
    <View key={ability.id} style={styles.abilityContainer}>
      <Text style={[styles.abilityIcon]}>{ability.icon || '🔮'}</Text>
      <View style={styles.abilityInfo}>
        <Text style={[styles.abilityName, { color: theme.colors.text }]}>{ability.name}</Text>
        <Text style={[styles.abilityDesc, { color: theme.colors.textSecondary }]}>
          {ability.description}
        </Text>
      </View>
    </View>
  );

  const renderActiveAbility = (ability: ActiveAbility) => (
    <View style={[styles.abilityContainer, styles.activeAbility]}>
      <Text style={styles.abilityIcon}>{ability.icon || '⚡'}</Text>
      <View style={styles.abilityInfo}>
        <Text style={[styles.abilityName, { color: theme.colors.primary }]}>{ability.name}</Text>
        <Text style={[styles.abilityDesc, { color: theme.colors.textSecondary }]}>
          {ability.description}
        </Text>
        <Text style={[styles.abilityCooldown, { color: theme.colors.textSecondary }]}>
          次数: {ability.maxUsesPerGame} | 冷却: {ability.cooldown}回合
        </Text>
      </View>
    </View>
  );

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isSelected ? theme.colors.primary : theme.colors.textSecondary,
          borderWidth: isSelected ? 3 : 1,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {/* 头部：图标和名称 */}
      <View style={styles.header}>
        <Text style={styles.icon}>{character.icon}</Text>
        <View style={styles.titleContainer}>
          <Text style={[styles.name, { color: theme.colors.text }]}>{character.name}</Text>
          <Text style={[styles.rarity, { color: getRarityColor() }]}>
            {character.rarity === 'legendary'
              ? '传说'
              : character.rarity === 'epic'
                ? '史诗'
                : character.rarity === 'rare'
                  ? '稀有'
                  : '普通'}
          </Text>
        </View>
      </View>

      {/* 描述 */}
      <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={2}>
        {character.description}
      </Text>

      {/* 属性修正 */}
      {renderStatModifiers()}

      {/* 详细信息（展开时显示） */}
      {showDetails && (
        <View style={styles.detailsContainer}>
          {/* 被动技能 */}
          {character.passiveAbilities && character.passiveAbilities.length > 0 && (
            <View style={styles.abilitiesSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>被动技能</Text>
              {character.passiveAbilities.map(renderPassiveAbility)}
            </View>
          )}

          {/* 主动技能 */}
          {character.activeAbility && (
            <View style={styles.abilitiesSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>主动技能</Text>
              {renderActiveAbility(character.activeAbility)}
            </View>
          )}
        </View>
      )}

      {/* 选中指示器 */}
      {isSelected && (
        <View style={[styles.selectedBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.selectedText}>已选</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 32,
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rarity: {
    fontSize: 12,
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  modifiersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  modifier: {
    fontSize: 11,
    marginRight: 8,
    fontWeight: '600',
  },
  detailsContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  abilitiesSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  abilityContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 8,
  },
  activeAbility: {
    backgroundColor: '#E3F2FD',
  },
  abilityIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  abilityInfo: {
    flex: 1,
  },
  abilityName: {
    fontSize: 13,
    fontWeight: '600',
  },
  abilityDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  abilityCooldown: {
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
  selectedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default CharacterCard;
