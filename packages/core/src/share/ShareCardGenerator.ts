import {
  SurvivalReportShareCard,
  AchievementBadgeShareCard,
  BattleReportShareCard,
  BattleReport,
  ExtendedGameSessionStats,
  HighlightEvent,
  SummaryTemplate,
  SummaryCondition,
  AchievementDefinition,
  GameSessionStats,
  PlayerBattleReport,
} from '../types';

/**
 * 默认一句话总结模板 (中文)
 */
export const DEFAULT_SUMMARY_TEMPLATES: SummaryTemplate[] = [
  // 胜利 - 濒死逆袭
  {
    id: 'victory_near_death',
    type: 'victory',
    condition: { type: 'highlight_exists', highlightType: 'near_death_recovery' },
    template: '我在健康只剩{minHealth}的时候绝地反击，最终成功晋升！ 🦾 #大厂生存指南',
    priority: 100,
  },
  // 胜利 - 普通
  {
    id: 'victory_normal',
    type: 'victory',
    condition: { type: 'victory' },
    template: '历经{turnsPlayed}个回合的奋斗，我终于在大厂成功晋升！ 🎉 #大厂生存指南',
    priority: 10,
  },
  // 失败 - 健康归零
  {
    id: 'defeat_health_zero',
    type: 'defeat',
    condition: { type: 'defeat', reason: 'health_zero' },
    template:
      '我在第{turnsPlayed}回合因过度加班倒下了，临走前绩效还有{maxPerformance} 🥲 #大厂生存指南',
    priority: 50,
  },
  // 失败 - 普通
  {
    id: 'defeat_normal',
    type: 'defeat',
    condition: { type: 'defeat', reason: 'any' },
    template: '大厂生存第{turnsPlayed}回合，我光荣毕业了 📦 #大厂生存指南',
    priority: 10,
  },
  // 竞争胜利 - 甩锅王
  {
    id: 'competitive_win_blame_king',
    type: 'competitive_win',
    condition: { type: 'competitive_title', titleId: 'blame_king' },
    template: '凭借精湛的甩锅技术，我在{playerCount}人混战中笑到最后！ 🎯 #大厂生存指南',
    priority: 80,
  },
  // 竞争胜利 - 普通
  {
    id: 'competitive_win_normal',
    type: 'competitive_win',
    condition: { type: 'victory' },
    template: '在{playerCount}人的大厂生存战中，我成为了最后的赢家！ 🏆 #大厂生存指南',
    priority: 10,
  },
  // 竞争失败 - 被甩锅
  {
    id: 'competitive_lose_blamed',
    type: 'competitive_lose',
    condition: { type: 'competitive_title', titleId: 'blamed_most' },
    template: '被甩了{blamedCount}次锅，我成为了大厂的活靶子... 🎯 #大厂生存指南',
    priority: 70,
  },
  // 竞争失败 - 普通
  {
    id: 'competitive_lose_normal',
    type: 'competitive_lose',
    condition: { type: 'always' },
    template: '大厂生存战第{rank}名，下次一定卷死他们！ 💪 #大厂生存指南',
    priority: 10,
  },
];

export interface ShareCardGeneratorOptions {
  /** 一句话总结模板 (可覆盖默认模板) */
  summaryTemplates?: SummaryTemplate[];
  /** 默认玩家名称 */
  defaultPlayerName?: string;
}

/**
 * ShareCardGenerator - 分享卡数据生成器
 *
 * 根据游戏统计数据生成分享卡数据
 */
export class ShareCardGenerator {
  private templates: SummaryTemplate[];
  private defaultPlayerName: string;

  constructor(options?: ShareCardGeneratorOptions) {
    this.templates = [...DEFAULT_SUMMARY_TEMPLATES, ...(options?.summaryTemplates ?? [])];
    this.defaultPlayerName = options?.defaultPlayerName ?? '打工人';
    // 按优先级排序
    this.templates.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 生成生存报告分享卡
   */
  generateSurvivalReport(
    stats: ExtendedGameSessionStats,
    finalStats: Record<string, number>,
    finalResources: Record<string, number>,
    unlockedAchievements?: string[]
  ): SurvivalReportShareCard {
    const highlights = this.selectTopHighlights(stats.highlights, 3);
    const summary = this.generateSummary(stats, stats.won ? 'victory' : 'defeat', finalStats);

    return {
      type: 'survival_report',
      playerName: stats.playerName || this.defaultPlayerName,
      isVictory: stats.won,
      turnsPlayed: stats.turnsPlayed,
      finalStats,
      finalResources,
      highlights,
      summary,
      unlockedAchievements,
      sessionStats: this.toGameSessionStats(stats),
      generatedAt: Date.now(),
    };
  }

  /**
   * 生成成就徽章分享卡
   */
  generateAchievementBadge(
    achievement: AchievementDefinition,
    playerName: string,
    stats?: GameSessionStats
  ): AchievementBadgeShareCard {
    const story = this.generateAchievementStory(achievement, stats);

    return {
      type: 'achievement_badge',
      playerName: playerName || this.defaultPlayerName,
      achievementId: achievement.id,
      achievementName: achievement.name,
      achievementDescription: achievement.description,
      achievementIcon: achievement.icon,
      achievementRarity: achievement.rarity,
      achievementStory: story,
      points: achievement.points ?? 0,
      unlockedAt: Date.now(),
      generatedAt: Date.now(),
    };
  }

  /**
   * 生成对战战报分享卡
   */
  generateBattleReport(battleReport: BattleReport, currentPlayerId: string): BattleReportShareCard {
    const currentPlayer = battleReport.playerReports.find((p) => p.playerId === currentPlayerId);
    const isWinner = battleReport.winnerId === currentPlayerId;

    const summaryType = isWinner ? 'competitive_win' : 'competitive_lose';
    const summary = this.generateBattleSummary(battleReport, currentPlayer, summaryType);

    return {
      type: 'battle_report',
      battleReport,
      currentPlayerId,
      summary,
      generatedAt: Date.now(),
    };
  }

  /**
   * 添加自定义总结模板
   */
  addSummaryTemplate(template: SummaryTemplate): void {
    this.templates.push(template);
    this.templates.sort((a, b) => b.priority - a.priority);
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  private selectTopHighlights(highlights: HighlightEvent[], count: number): HighlightEvent[] {
    return [...highlights].sort((a, b) => b.intensity - a.intensity).slice(0, count);
  }

  private generateSummary(
    stats: ExtendedGameSessionStats,
    type: 'victory' | 'defeat',
    finalStats: Record<string, number>
  ): string {
    // 构建变量上下文
    const context: Record<string, string | number> = {
      turnsPlayed: stats.turnsPlayed,
      minHealth: stats.minStats['health'] ?? stats.minStats['健康'] ?? 0,
      maxHealth: stats.maxStats['health'] ?? stats.maxStats['健康'] ?? 100,
      maxPerformance: stats.maxStats['performance'] ?? stats.maxStats['绩效'] ?? 0,
      cardsPlayed: stats.cardsPlayed.length,
      ...finalStats,
    };

    // 查找匹配的模板
    for (const template of this.templates) {
      if (template.type !== type && template.type !== 'special') continue;

      if (this.matchCondition(template.condition, stats)) {
        return this.interpolateTemplate(template.template, context);
      }
    }

    // 降级到默认
    return type === 'victory'
      ? `历经${stats.turnsPlayed}回合的奋斗，成功通关！ #大厂生存指南`
      : `大厂生存第${stats.turnsPlayed}回合结束 #大厂生存指南`;
  }

  private generateBattleSummary(
    report: BattleReport,
    currentPlayer: PlayerBattleReport | undefined,
    type: 'competitive_win' | 'competitive_lose'
  ): string {
    const context: Record<string, string | number> = {
      totalTurns: report.totalTurns,
      playerCount: report.playerReports.length,
      rank: currentPlayer?.rank ?? 0,
      blamedCount: currentPlayer?.competitiveStats.blamedCount ?? 0,
      blameShiftCount: currentPlayer?.competitiveStats.blameShiftCount ?? 0,
      resourcesStolen: currentPlayer?.competitiveStats.resourcesStolenAmount ?? 0,
    };

    // 查找匹配模板
    for (const template of this.templates) {
      if (template.type !== type) continue;

      // 检查竞争称号条件
      if (template.condition.type === 'competitive_title') {
        const titleId = template.condition.titleId;
        const hasTitle = report.specialTitles.some(
          (t) => t.titleId === titleId && t.playerId === currentPlayer?.playerId
        );
        if (hasTitle) {
          return this.interpolateTemplate(template.template, context);
        }
      } else if (this.matchConditionBasic(template.condition)) {
        return this.interpolateTemplate(template.template, context);
      }
    }

    return type === 'competitive_win'
      ? `在${context.playerCount}人对战中获得胜利！ #大厂生存指南`
      : `大厂对战第${context.rank}名 #大厂生存指南`;
  }

  private matchCondition(condition: SummaryCondition, stats: ExtendedGameSessionStats): boolean {
    switch (condition.type) {
      case 'victory':
        return stats.won;

      case 'defeat':
        if (!stats.won) {
          if (condition.reason === 'any') return true;
          // 检测失败原因
          const healthKey = stats.statHistory['health'] ? 'health' : '健康';
          const finalHealth = stats.statHistory[healthKey]?.slice(-1)[0] ?? 100;
          if (condition.reason === 'health_zero' && finalHealth <= 0) return true;
        }
        return false;

      case 'highlight_exists':
        return stats.highlights.some((h) => h.type === condition.highlightType);

      case 'stat_reached':
        const maxValue = stats.maxStats[condition.stat] ?? 0;
        const minValue = stats.minStats[condition.stat] ?? 0;
        const checkValue = condition.operator.includes('<') ? minValue : maxValue;
        return this.compareValues(checkValue, condition.operator, condition.value);

      case 'always':
        return true;

      default:
        return false;
    }
  }

  private matchConditionBasic(condition: SummaryCondition): boolean {
    return condition.type === 'always' || condition.type === 'victory';
  }

  private compareValues(value: number, operator: string, target: number): boolean {
    switch (operator) {
      case '>':
        return value > target;
      case '<':
        return value < target;
      case '>=':
        return value >= target;
      case '<=':
        return value <= target;
      default:
        return false;
    }
  }

  private interpolateTemplate(template: string, context: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      const value = context[key];
      return value !== undefined ? String(value) : `{${key}}`;
    });
  }

  private generateAchievementStory(
    achievement: AchievementDefinition,
    stats?: GameSessionStats
  ): string {
    // 根据成就类型生成故事
    const rarityStories: Record<string, string> = {
      legendary: '传说中的成就已被解锁！你已经成为大厂的传奇！',
      epic: '史诗级成就达成！你的职场生涯将被载入史册！',
      rare: '稀有成就获得！你展现了非凡的能力！',
      uncommon: '不错的成就！继续保持！',
      common: '成就达成！每一步都是进步！',
    };

    let story = rarityStories[achievement.rarity] || '恭喜解锁新成就！';

    // 如果有统计数据，添加更多细节
    if (stats) {
      if (stats.turnsPlayed > 0) {
        story += ` 历经${stats.turnsPlayed}回合的努力。`;
      }
    }

    return story;
  }

  private toGameSessionStats(extended: ExtendedGameSessionStats): GameSessionStats {
    return {
      cardUsage: extended.cardUsage,
      statHistory: extended.statHistory,
      minStats: extended.minStats,
      maxStats: extended.maxStats,
      turnsPlayed: extended.turnsPlayed,
      cardsPlayed: extended.cardsPlayed,
      won: extended.won,
      startTime: extended.startTime,
      endTime: extended.endTime,
    };
  }
}
