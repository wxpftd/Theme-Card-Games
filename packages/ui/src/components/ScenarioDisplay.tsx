/**
 * ScenarioDisplay - 场景显示组件
 * 显示当前游戏场景及其效果
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ViewStyle } from 'react-native';
import { ScenarioDefinition, ScenarioState } from '@theme-card-games/core';
import { useTheme } from '../theme/ThemeContext';

export interface ScenarioDisplayProps {
  /** 当前场景定义 */
  scenario: ScenarioDefinition | null;
  /** 场景状态 */
  scenarioState?: ScenarioState;
  /** 是否展开显示详情 */
  expanded?: boolean;
  /** 点击展开/收起回调 */
  onToggleExpand?: () => void;
  /** 自定义样式 */
  style?: ViewStyle;
  /** 是否显示剩余回合 */
  showRemainingTurns?: boolean;
}

/**
 * 场景显示组件
 */
export const ScenarioDisplay: React.FC<ScenarioDisplayProps> = ({
  scenario,
  scenarioState,
  expanded = false,
  onToggleExpand,
  style,
  showRemainingTurns = true,
}) => {
  const { theme } = useTheme();

  if (!scenario) {
    return null;
  }

  const remainingTurns =
    scenario.duration && scenario.duration > 0 && scenarioState
      ? scenario.duration - scenarioState.scenarioTurnsElapsed
      : null;

  const renderGlobalEffects = () => {
    const effects: { label: string; value: string; isPositive: boolean }[] = [];

    // 属性修正
    if (scenario.globalStatModifiers) {
      Object.entries(scenario.globalStatModifiers).forEach(([stat, value]) => {
        effects.push({
          label: stat,
          value: `${value >= 0 ? '+' : ''}${value}`,
          isPositive: value >= 0,
        });
      });
    }

    // 资源修正
    if (scenario.globalResourceModifiers) {
      Object.entries(scenario.globalResourceModifiers).forEach(([resource, value]) => {
        effects.push({
          label: resource,
          value: `${value >= 0 ? '+' : ''}${value}/回合`,
          isPositive: value >= 0,
        });
      });
    }

    if (effects.length === 0) return null;

    return (
      <View style={styles.effectsContainer}>
        <Text style={[styles.effectsTitle, { color: theme.colors.text }]}>全局效果</Text>
        <View style={styles.effectsList}>
          {effects.map((effect, index) => (
            <View
              key={index}
              style={[
                styles.effectBadge,
                { backgroundColor: effect.isPositive ? '#E8F5E9' : '#FFEBEE' },
              ]}
            >
              <Text
                style={[
                  styles.effectText,
                  { color: effect.isPositive ? theme.colors.success : theme.colors.error },
                ]}
              >
                {effect.label} {effect.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderCardRules = () => {
    const rules: { icon: string; text: string; type: 'ban' | 'enhance' | 'weaken' }[] = [];

    // 禁用的卡牌标签
    if (scenario.bannedCardTags && scenario.bannedCardTags.length > 0) {
      scenario.bannedCardTags.forEach((tag) => {
        rules.push({
          icon: '🚫',
          text: `禁用 [${tag}] 类卡牌`,
          type: 'ban',
        });
      });
    }

    // 增强的卡牌标签
    if (scenario.enhancedCardTags) {
      Object.entries(scenario.enhancedCardTags).forEach(([tag, multiplier]) => {
        rules.push({
          icon: '⬆️',
          text: `[${tag}] 类卡牌效果 ×${multiplier}`,
          type: 'enhance',
        });
      });
    }

    // 削弱的卡牌标签
    if (scenario.weakenedCardTags) {
      Object.entries(scenario.weakenedCardTags).forEach(([tag, multiplier]) => {
        rules.push({
          icon: '⬇️',
          text: `[${tag}] 类卡牌效果 ×${multiplier}`,
          type: 'weaken',
        });
      });
    }

    if (rules.length === 0) return null;

    return (
      <View style={styles.rulesContainer}>
        <Text style={[styles.effectsTitle, { color: theme.colors.text }]}>卡牌规则</Text>
        {rules.map((rule, index) => (
          <View key={index} style={styles.ruleItem}>
            <Text style={styles.ruleIcon}>{rule.icon}</Text>
            <Text
              style={[
                styles.ruleText,
                {
                  color:
                    rule.type === 'ban'
                      ? theme.colors.error
                      : rule.type === 'enhance'
                        ? theme.colors.success
                        : theme.colors.warning,
                },
              ]}
            >
              {rule.text}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderScenarioRules = () => {
    if (!scenario.rules || scenario.rules.length === 0) return null;

    return (
      <View style={styles.rulesContainer}>
        <Text style={[styles.effectsTitle, { color: theme.colors.text }]}>特殊规则</Text>
        {scenario.rules.map((rule, index) => (
          <View key={index} style={styles.ruleItem}>
            <Text style={styles.ruleIcon}>{rule.type === 'elimination_check' ? '⚠️' : '📋'}</Text>
            <Text style={[styles.ruleText, { color: theme.colors.text }]}>{rule.description}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: scenario.ambientColor
            ? `${scenario.ambientColor}20`
            : theme.colors.surface,
          borderLeftColor: scenario.ambientColor || theme.colors.primary,
        },
        style,
      ]}
      onPress={onToggleExpand}
      activeOpacity={0.8}
    >
      {/* 头部信息 */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{scenario.icon || '🌍'}</Text>
          <View style={styles.titleContainer}>
            <Text style={[styles.name, { color: theme.colors.text }]}>{scenario.name}</Text>
            {showRemainingTurns && remainingTurns !== null && (
              <Text style={[styles.remaining, { color: theme.colors.textSecondary }]}>
                剩余 {remainingTurns} 回合
              </Text>
            )}
          </View>
          <Text style={[styles.expandIndicator, { color: theme.colors.textSecondary }]}>
            {expanded ? '▼' : '▶'}
          </Text>
        </View>
        <Text
          style={[styles.description, { color: theme.colors.textSecondary }]}
          numberOfLines={expanded ? undefined : 1}
        >
          {scenario.description}
        </Text>
      </View>

      {/* 展开的详细信息 */}
      {expanded && (
        <View style={styles.detailsContainer}>
          {renderGlobalEffects()}
          {renderCardRules()}
          {renderScenarioRules()}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {},
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  remaining: {
    fontSize: 11,
    marginTop: 2,
  },
  expandIndicator: {
    fontSize: 12,
    marginLeft: 8,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  detailsContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 12,
  },
  effectsContainer: {
    marginBottom: 12,
  },
  effectsTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  effectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  effectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  effectText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rulesContainer: {
    marginBottom: 12,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  ruleIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  ruleText: {
    fontSize: 12,
  },
});

export default ScenarioDisplay;
