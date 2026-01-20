import {
  ExtendedGameSessionStats,
  HighlightEvent,
  CompetitiveStats,
  PlayerBattleReport,
  BattleReport,
  SpecialTitle,
  GameModeType,
  GameState,
  CardDefinition,
} from '../types';
import { EventBus } from '../event';
import { generateId } from '../utils';

/**
 * 名场面检测阈值配置
 */
export interface HighlightThresholds {
  /** 濒死恢复: 健康值低于此值视为濒死 */
  nearDeathThreshold: number;
  /** 属性巨变: 单次变化超过此比例 */
  massiveChangeRatio: number;
  /** 资源横财: 单次获得资源超过此值 */
  resourceWindfallThreshold: number;
}

export interface GameStatsCollectorOptions {
  eventBus: EventBus;
  cardDefinitions: Map<string, CardDefinition>;
  /** 名场面检测阈值 */
  highlightThresholds?: Partial<HighlightThresholds>;
  /** 最大记录名场面数量 */
  maxHighlights?: number;
}

const DEFAULT_THRESHOLDS: HighlightThresholds = {
  nearDeathThreshold: 20,
  massiveChangeRatio: 0.3,
  resourceWindfallThreshold: 50,
};

/**
 * GameStatsCollector - 游戏统计收集器
 *
 * 监听 EventBus 事件，收集游戏数据，检测"名场面"事件，
 * 统计竞争行为，生成 BattleReport
 */
export class GameStatsCollector {
  private eventBus: EventBus;
  private cardDefinitions: Map<string, CardDefinition>;
  private thresholds: HighlightThresholds;
  private maxHighlights: number;

  // 当前会话数据
  private stats: Map<string, ExtendedGameSessionStats> = new Map();
  private currentTurn: number = 0;
  private gameStartTime: number = 0;
  private gameMode: GameModeType = 'single_player';
  private gameId: string = '';

  // 取消订阅函数
  private unsubscribers: (() => void)[] = [];

  constructor(options: GameStatsCollectorOptions) {
    this.eventBus = options.eventBus;
    this.cardDefinitions = options.cardDefinitions;
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...options.highlightThresholds };
    this.maxHighlights = options.maxHighlights ?? 20;

    this.setupEventListeners();
  }

  /**
   * 开始新的游戏会话统计
   */
  startSession(
    players: Array<{ id: string; name: string; initialStats: Record<string, number> }>,
    gameMode: GameModeType,
    gameId?: string
  ): void {
    this.stats.clear();
    this.currentTurn = 0;
    this.gameStartTime = Date.now();
    this.gameMode = gameMode;
    this.gameId = gameId ?? generateId();

    for (const player of players) {
      this.stats.set(player.id, {
        cardUsage: {},
        statHistory: {},
        minStats: { ...player.initialStats },
        maxStats: { ...player.initialStats },
        turnsPlayed: 0,
        cardsPlayed: [],
        won: false,
        startTime: this.gameStartTime,
        highlights: [],
        competitiveStats: this.createEmptyCompetitiveStats(),
        gameMode,
        playerName: player.name,
        playerId: player.id,
      });

      // 初始化属性历史
      for (const [stat, value] of Object.entries(player.initialStats)) {
        this.stats.get(player.id)!.statHistory[stat] = [value];
      }
    }
  }

  /**
   * 获取玩家统计数据
   */
  getPlayerStats(playerId: string): ExtendedGameSessionStats | null {
    return this.stats.get(playerId) ?? null;
  }

  /**
   * 获取所有玩家统计
   */
  getAllStats(): Map<string, ExtendedGameSessionStats> {
    return new Map(this.stats);
  }

  /**
   * 生成对战战报
   */
  generateBattleReport(
    winnerId: string | null,
    playerRankings: Array<{
      playerId: string;
      rank: number;
      survived: boolean;
      eliminatedAtTurn?: number;
    }>
  ): BattleReport {
    const endTime = Date.now();
    const playerReports: PlayerBattleReport[] = [];

    for (const ranking of playerRankings) {
      const stats = this.stats.get(ranking.playerId);
      if (!stats) continue;

      // 获取最终属性
      const finalStats: Record<string, number> = {};
      for (const [stat, history] of Object.entries(stats.statHistory)) {
        finalStats[stat] = history[history.length - 1] ?? 0;
      }

      playerReports.push({
        playerId: ranking.playerId,
        playerName: stats.playerName,
        rank: ranking.rank,
        survived: ranking.survived,
        eliminatedAtTurn: ranking.eliminatedAtTurn,
        finalStats,
        competitiveStats: stats.competitiveStats ?? this.createEmptyCompetitiveStats(),
        highlights: this.selectTopHighlights(stats.highlights, 3),
      });
    }

    // 计算特殊称号
    const specialTitles = this.calculateSpecialTitles(playerReports);

    return {
      gameId: this.gameId,
      totalTurns: this.currentTurn,
      winnerId,
      winnerName: winnerId ? this.stats.get(winnerId)?.playerName : undefined,
      playerReports,
      startTime: this.gameStartTime,
      endTime,
      gameMode: this.gameMode,
      specialTitles,
    };
  }

  /**
   * 清理资源
   */
  destroy(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    this.stats.clear();
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  private setupEventListeners(): void {
    // 回合变化
    this.unsubscribers.push(
      this.eventBus.on('turn_started', (event) => {
        this.currentTurn = (event.data.turn as number) ?? this.currentTurn + 1;
      })
    );

    // 属性变化 - 检测名场面
    this.unsubscribers.push(
      this.eventBus.on('stat_changed', (event, state) => {
        const playerId = event.data.playerId as string;
        const stat = event.data.stat as string;
        const oldValue = event.data.oldValue as number;
        const newValue = event.data.newValue as number;

        this.recordStatChange(playerId, stat, oldValue, newValue, state);
      })
    );

    // 卡牌打出
    this.unsubscribers.push(
      this.eventBus.on('card_played', (event) => {
        const playerId = event.data.playerId as string;
        const cardId = event.data.cardId as string;
        this.recordCardPlayed(playerId, cardId);
      })
    );

    // 连击触发
    this.unsubscribers.push(
      this.eventBus.on('combo_triggered', (event) => {
        const playerId = event.data.playerId as string;
        const comboName = event.data.comboName as string;
        this.addHighlight(playerId, {
          id: generateId(),
          type: 'combo_triggered',
          turn: this.currentTurn,
          description: `触发连击: ${comboName}`,
          icon: '🔥',
          data: { comboName },
          intensity: 6,
        });
      })
    );

    // 属性转移 (甩锅)
    this.unsubscribers.push(
      this.eventBus.on('stat_transferred', (event) => {
        const sourceId = event.data.sourcePlayerId as string;
        const targetId = event.data.targetPlayerId as string;
        const amount = event.data.amount as number;
        const stat = event.data.stat as string;

        this.recordBlameShift(sourceId, targetId, stat, amount);
      })
    );

    // 资源偷取 (抢功)
    this.unsubscribers.push(
      this.eventBus.on('resource_stolen', (event) => {
        const sourceId = event.data.sourcePlayerId as string;
        const targetId = event.data.targetPlayerId as string;
        const amount = event.data.amount as number;
        const resource = event.data.resource as string;

        this.recordResourceSteal(sourceId, targetId, resource, amount);
      })
    );

    // 共享资源抢夺
    this.unsubscribers.push(
      this.eventBus.on('shared_resource_claimed', (event) => {
        const playerId = event.data.playerId as string;
        const amount = event.data.amount as number;
        const resourceId = event.data.resourceId as string;

        this.recordSharedResourceClaim(playerId, resourceId, amount);
      })
    );

    // 玩家受到攻击
    this.unsubscribers.push(
      this.eventBus.on('effect_triggered', (event) => {
        const effectType = event.data.effectType as string;
        if (effectType === 'damage_stat') {
          const sourceId = event.data.sourcePlayerId as string;
          const targetId = event.data.targetPlayerId as string;
          this.recordAttack(sourceId, targetId);
        }
      })
    );
  }

  private recordStatChange(
    playerId: string,
    stat: string,
    oldValue: number,
    newValue: number,
    state: GameState
  ): void {
    const playerStats = this.stats.get(playerId);
    if (!playerStats) return;

    // 记录属性历史
    if (!playerStats.statHistory[stat]) {
      playerStats.statHistory[stat] = [];
    }
    playerStats.statHistory[stat].push(newValue);

    // 更新最大最小值
    playerStats.minStats[stat] = Math.min(playerStats.minStats[stat] ?? Infinity, newValue);
    playerStats.maxStats[stat] = Math.max(playerStats.maxStats[stat] ?? -Infinity, newValue);

    // 检测名场面事件
    this.detectHighlightFromStatChange(playerId, stat, oldValue, newValue, state);
  }

  private detectHighlightFromStatChange(
    playerId: string,
    stat: string,
    oldValue: number,
    newValue: number,
    state: GameState
  ): void {
    // 检测濒死逆袭
    if (stat === 'health' || stat === '健康') {
      const wasNearDeath = oldValue <= this.thresholds.nearDeathThreshold;
      const recovered = newValue > this.thresholds.nearDeathThreshold;

      if (wasNearDeath && recovered && newValue - oldValue > 0) {
        this.addHighlight(playerId, {
          id: generateId(),
          type: 'near_death_recovery',
          turn: this.currentTurn,
          description: `从濒死状态(${oldValue})恢复到${newValue}`,
          icon: '💪',
          data: { oldValue, newValue, stat },
          intensity: 8,
        });
      }
    }

    // 检测属性巨变
    const changeRatio = Math.abs(newValue - oldValue) / Math.max(oldValue, 1);
    if (changeRatio >= this.thresholds.massiveChangeRatio && Math.abs(newValue - oldValue) >= 10) {
      const isIncrease = newValue > oldValue;
      this.addHighlight(playerId, {
        id: generateId(),
        type: 'massive_stat_change',
        turn: this.currentTurn,
        description: `${stat}${isIncrease ? '暴涨' : '暴跌'}: ${oldValue} → ${newValue}`,
        icon: isIncrease ? '📈' : '📉',
        data: { stat, oldValue, newValue, change: newValue - oldValue },
        intensity: Math.min(10, Math.floor(changeRatio * 10) + 3),
      });
    }

    // 检测最终逆袭 (游戏结束时低健康但获胜)
    if (state.phase === 'game_over' && (stat === 'health' || stat === '健康')) {
      const playerStats = this.stats.get(playerId);
      if (playerStats && playerStats.won && newValue <= this.thresholds.nearDeathThreshold * 1.5) {
        this.addHighlight(playerId, {
          id: generateId(),
          type: 'final_comeback',
          turn: this.currentTurn,
          description: `以仅剩${newValue}的健康值绝地反击获胜!`,
          icon: '🏆',
          data: { finalHealth: newValue },
          intensity: 10,
        });
      }
    }
  }

  private recordCardPlayed(playerId: string, cardId: string): void {
    const playerStats = this.stats.get(playerId);
    if (!playerStats) return;

    playerStats.cardsPlayed.push(cardId);

    // 按标签统计
    const cardDef = this.cardDefinitions.get(cardId);
    if (cardDef?.tags) {
      for (const tag of cardDef.tags) {
        playerStats.cardUsage[tag] = (playerStats.cardUsage[tag] || 0) + 1;
      }
    }
  }

  private recordBlameShift(sourceId: string, targetId: string, stat: string, amount: number): void {
    const sourceStats = this.stats.get(sourceId);
    const targetStats = this.stats.get(targetId);

    if (sourceStats?.competitiveStats) {
      sourceStats.competitiveStats.blameShiftCount++;
      sourceStats.competitiveStats.blameShiftSuccessCount++;

      this.addHighlight(sourceId, {
        id: generateId(),
        type: 'blame_shifted',
        turn: this.currentTurn,
        description: `成功将${amount}点${stat}甩给对手`,
        icon: '🎯',
        data: { targetId, stat, amount },
        intensity: 5,
      });
    }

    if (targetStats?.competitiveStats) {
      targetStats.competitiveStats.blamedCount++;
    }
  }

  private recordResourceSteal(
    sourceId: string,
    targetId: string,
    resource: string,
    amount: number
  ): void {
    const sourceStats = this.stats.get(sourceId);
    const targetStats = this.stats.get(targetId);

    if (sourceStats?.competitiveStats) {
      sourceStats.competitiveStats.creditStealCount++;
      sourceStats.competitiveStats.resourcesStolenAmount += amount;

      this.addHighlight(sourceId, {
        id: generateId(),
        type: 'credit_stolen',
        turn: this.currentTurn,
        description: `抢夺了${amount}点${resource}`,
        icon: '💰',
        data: { targetId, resource, amount },
        intensity: 5,
      });
    }

    if (targetStats?.competitiveStats) {
      // 被偷取的一方也记录被攻击
      targetStats.competitiveStats.attacksReceived++;
    }
  }

  private recordSharedResourceClaim(playerId: string, resourceId: string, amount: number): void {
    const playerStats = this.stats.get(playerId);

    if (playerStats?.competitiveStats) {
      playerStats.competitiveStats.sharedResourceClaims++;

      if (amount >= this.thresholds.resourceWindfallThreshold) {
        this.addHighlight(playerId, {
          id: generateId(),
          type: 'resource_windfall',
          turn: this.currentTurn,
          description: `抢到大量资源: ${resourceId} x${amount}`,
          icon: '🎁',
          data: { resourceId, amount },
          intensity: 6,
        });
      }
    }
  }

  private recordAttack(sourceId: string, targetId: string): void {
    const sourceStats = this.stats.get(sourceId);
    const targetStats = this.stats.get(targetId);

    if (sourceStats?.competitiveStats) {
      sourceStats.competitiveStats.attacksInitiated++;
    }

    if (targetStats?.competitiveStats) {
      targetStats.competitiveStats.attacksReceived++;
    }
  }

  private addHighlight(playerId: string, highlight: HighlightEvent): void {
    const playerStats = this.stats.get(playerId);
    if (!playerStats) return;

    playerStats.highlights.push(highlight);

    // 限制数量
    if (playerStats.highlights.length > this.maxHighlights) {
      // 保留精彩程度最高的
      playerStats.highlights.sort((a, b) => b.intensity - a.intensity);
      playerStats.highlights = playerStats.highlights.slice(0, this.maxHighlights);
    }
  }

  private selectTopHighlights(highlights: HighlightEvent[], count: number): HighlightEvent[] {
    return [...highlights].sort((a, b) => b.intensity - a.intensity).slice(0, count);
  }

  private calculateSpecialTitles(playerReports: PlayerBattleReport[]): SpecialTitle[] {
    const titles: SpecialTitle[] = [];

    if (playerReports.length < 2) return titles;

    // 甩锅王 - 甩锅次数最多
    const blameKing = playerReports.reduce((max, p) =>
      p.competitiveStats.blameShiftCount > (max?.competitiveStats.blameShiftCount ?? 0) ? p : max
    );
    if (blameKing && blameKing.competitiveStats.blameShiftCount > 0) {
      titles.push({
        titleId: 'blame_king',
        titleName: '甩锅王',
        playerId: blameKing.playerId,
        playerName: blameKing.playerName,
        icon: '🎯',
        description: `成功甩锅 ${blameKing.competitiveStats.blameShiftSuccessCount} 次`,
      });
    }

    // 抢功王 - 抢夺资源最多
    const creditThief = playerReports.reduce((max, p) =>
      p.competitiveStats.resourcesStolenAmount > (max?.competitiveStats.resourcesStolenAmount ?? 0)
        ? p
        : max
    );
    if (creditThief && creditThief.competitiveStats.resourcesStolenAmount > 0) {
      titles.push({
        titleId: 'credit_thief',
        titleName: '抢功王',
        playerId: creditThief.playerId,
        playerName: creditThief.playerName,
        icon: '💰',
        description: `抢夺资源 ${creditThief.competitiveStats.resourcesStolenAmount}`,
      });
    }

    // 铁憨憨 - 被甩锅次数最多
    const blamedMost = playerReports.reduce((max, p) =>
      p.competitiveStats.blamedCount > (max?.competitiveStats.blamedCount ?? 0) ? p : max
    );
    if (blamedMost && blamedMost.competitiveStats.blamedCount > 0) {
      titles.push({
        titleId: 'blamed_most',
        titleName: '铁憨憨',
        playerId: blamedMost.playerId,
        playerName: blamedMost.playerName,
        icon: '🥴',
        description: `被甩锅 ${blamedMost.competitiveStats.blamedCount} 次`,
      });
    }

    // 拼命三郎 - 发起攻击最多
    const attacker = playerReports.reduce((max, p) =>
      p.competitiveStats.attacksInitiated > (max?.competitiveStats.attacksInitiated ?? 0) ? p : max
    );
    if (attacker && attacker.competitiveStats.attacksInitiated > 0) {
      titles.push({
        titleId: 'fierce_attacker',
        titleName: '拼命三郎',
        playerId: attacker.playerId,
        playerName: attacker.playerName,
        icon: '⚔️',
        description: `发起攻击 ${attacker.competitiveStats.attacksInitiated} 次`,
      });
    }

    // 韭菜王 - 被攻击最多但存活
    const survivor = playerReports
      .filter((p) => p.survived)
      .reduce(
        (max, p) =>
          p.competitiveStats.attacksReceived > (max?.competitiveStats.attacksReceived ?? 0)
            ? p
            : max,
        null as PlayerBattleReport | null
      );
    if (survivor && survivor.competitiveStats.attacksReceived >= 3) {
      titles.push({
        titleId: 'tough_survivor',
        titleName: '韭菜王',
        playerId: survivor.playerId,
        playerName: survivor.playerName,
        icon: '🌿',
        description: `被攻击 ${survivor.competitiveStats.attacksReceived} 次但存活`,
      });
    }

    return titles;
  }

  private createEmptyCompetitiveStats(): CompetitiveStats {
    return {
      blameShiftCount: 0,
      blameShiftSuccessCount: 0,
      creditStealCount: 0,
      resourcesStolenAmount: 0,
      attacksReceived: 0,
      attacksInitiated: 0,
      sharedResourceClaims: 0,
      blamedCount: 0,
    };
  }

  /**
   * 设置玩家胜利状态
   */
  setPlayerWon(playerId: string, won: boolean): void {
    const stats = this.stats.get(playerId);
    if (stats) {
      stats.won = won;
      stats.endTime = Date.now();
    }
  }

  /**
   * 更新回合计数
   */
  incrementTurn(playerId: string): void {
    const stats = this.stats.get(playerId);
    if (stats) {
      stats.turnsPlayed++;
    }
  }
}
