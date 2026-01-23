/**
 * GameEndSystem - 游戏结束系统
 * 管理玩家淘汰、胜利判定、最终排名
 */

import { GameState, PlayerState, WinCondition, CompetitiveWinCondition } from '../types';
import { EventBus } from '../event';

export interface GameEndSystemOptions {
  /** 事件总线 */
  eventBus: EventBus;
  /** 胜利条件列表 */
  winConditions: WinCondition[];
  /** 竞争模式胜利条件 */
  competitiveWinCondition?: CompetitiveWinCondition;
  /** 自定义胜利检查器 */
  customWinCheckers?: Record<string, (state: GameState) => boolean>;
}

/**
 * 淘汰原因
 */
export type EliminationReason =
  | 'stat_zero' // 属性归零
  | 'resource_depleted' // 资源耗尽
  | 'scenario_rule' // 场景规则淘汰
  | 'player_action' // 玩家行动导致
  | 'turn_limit' // 回合限制
  | 'custom'; // 自定义原因

/**
 * 淘汰检查结果
 */
export interface EliminationCheckResult {
  /** 是否应该被淘汰 */
  shouldEliminate: boolean;
  /** 淘汰原因 */
  reason?: EliminationReason;
  /** 详细原因描述 */
  description?: string;
  /** 触发淘汰的属性或资源 */
  triggeredBy?: string;
}

/**
 * 最终排名信息
 */
export interface FinalRanking {
  /** 玩家 ID */
  playerId: string;
  /** 玩家名称 */
  playerName: string;
  /** 排名 (1 为冠军) */
  rank: number;
  /** 是否为胜利者 */
  isWinner: boolean;
  /** 是否被淘汰 */
  eliminated: boolean;
  /** 淘汰回合 (如果被淘汰) */
  eliminatedAtTurn?: number;
  /** 最终属性 */
  finalStats: Record<string, number>;
  /** 最终资源 */
  finalResources: Record<string, number>;
}

/**
 * 游戏结束系统
 */
export class GameEndSystem {
  private eventBus: EventBus;
  private winConditions: WinCondition[];
  private competitiveWinCondition?: CompetitiveWinCondition;
  private customWinCheckers: Record<string, (state: GameState) => boolean>;

  /** 淘汰顺序记录 (用于计算排名) */
  private eliminationOrder: string[] = [];
  /** 当前活跃玩家数 */
  private activePlayerCount: number = 0;

  constructor(options: GameEndSystemOptions) {
    this.eventBus = options.eventBus;
    this.winConditions = options.winConditions;
    this.competitiveWinCondition = options.competitiveWinCondition;
    this.customWinCheckers = options.customWinCheckers ?? {};

    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听属性变化，检查淘汰条件
    this.eventBus.on('stat_changed', (event) => {
      const gameState = event.data as unknown as GameState;
      const playerId = event.data.playerId as string;
      this.checkPlayerElimination(playerId, gameState);
    });

    // 监听资源变化，检查淘汰条件
    this.eventBus.on('resource_changed', (event) => {
      const gameState = event.data as unknown as GameState;
      const playerId = event.data.playerId as string;
      this.checkPlayerElimination(playerId, gameState);
    });

    // 监听回合结束，检查所有玩家
    this.eventBus.on('turn_ended', (event) => {
      const gameState = event.data as unknown as GameState;
      this.checkAllPlayersElimination(gameState);
      this.checkGameEnd(gameState);
    });
  }

  // ============================================================================
  // 淘汰检查
  // ============================================================================

  /**
   * 检查玩家是否应该被淘汰
   */
  checkPlayerElimination(playerId: string, gameState: GameState): EliminationCheckResult {
    const player = gameState.players[playerId];
    if (!player || player.eliminated) {
      return { shouldEliminate: false };
    }

    // 检查属性归零条件
    for (const condition of this.winConditions) {
      if (condition.type === 'stat_threshold' && condition.operator === '<=') {
        const statValue = player.stats[condition.stat!] ?? 0;
        if (statValue <= (condition.value ?? 0)) {
          return {
            shouldEliminate: true,
            reason: 'stat_zero',
            description: `${condition.stat} dropped to ${statValue}`,
            triggeredBy: condition.stat,
          };
        }
      }
    }

    // 检查健康值为 0 (常见淘汰条件)
    if (player.stats['health'] !== undefined && player.stats['health'] <= 0) {
      return {
        shouldEliminate: true,
        reason: 'stat_zero',
        description: 'Health dropped to 0',
        triggeredBy: 'health',
      };
    }

    return { shouldEliminate: false };
  }

  /**
   * 检查所有玩家的淘汰状态
   */
  checkAllPlayersElimination(gameState: GameState): void {
    for (const player of Object.values(gameState.players)) {
      if (player.eliminated) continue;

      const result = this.checkPlayerElimination(player.id, gameState);
      if (result.shouldEliminate) {
        this.eliminatePlayer(player.id, gameState, result.reason!, result.description);
      }
    }
  }

  /**
   * 执行玩家淘汰
   */
  eliminatePlayer(
    playerId: string,
    gameState: GameState,
    reason: EliminationReason,
    description?: string
  ): boolean {
    const player = gameState.players[playerId];
    if (!player || player.eliminated) {
      return false;
    }

    // 更新玩家状态
    player.eliminated = true;
    player.eliminatedAtTurn = gameState.turn;
    player.eliminationReason = description ?? reason;

    // 记录淘汰顺序
    this.eliminationOrder.push(playerId);

    // 更新活跃玩家数
    this.activePlayerCount = Object.values(gameState.players).filter((p) => !p.eliminated).length;

    // 计算排名 (倒序，最后淘汰的排名靠前)
    const totalPlayers = Object.keys(gameState.players).length;
    player.finalRank = totalPlayers - this.eliminationOrder.length + 1;

    // 发送淘汰事件
    this.eventBus.emitSimple(
      'player_eliminated',
      {
        playerId,
        playerName: player.name,
        reason,
        description,
        turn: gameState.turn,
        remainingPlayers: this.activePlayerCount,
        rank: player.finalRank,
      },
      gameState
    );

    return true;
  }

  /**
   * 强制淘汰玩家 (由场景规则等外部触发)
   */
  forceEliminatePlayer(playerId: string, gameState: GameState, reason: string): boolean {
    return this.eliminatePlayer(playerId, gameState, 'scenario_rule', reason);
  }

  // ============================================================================
  // 胜利判定
  // ============================================================================

  /**
   * 检查游戏是否结束
   */
  checkGameEnd(gameState: GameState): {
    ended: boolean;
    winnerId: string | null;
    reason: string | null;
  } {
    // 检查最后存活
    const activePlayers = Object.values(gameState.players).filter((p) => !p.eliminated);

    if (activePlayers.length === 0) {
      // 所有玩家都被淘汰，游戏结束，无胜者
      return { ended: true, winnerId: null, reason: 'All players eliminated' };
    }

    if (activePlayers.length === 1) {
      // 只剩一个玩家，该玩家胜利
      const winner = activePlayers[0];
      winner.finalRank = 1;
      return { ended: true, winnerId: winner.id, reason: 'Last player standing' };
    }

    // 检查竞争模式胜利条件
    if (this.competitiveWinCondition) {
      const result = this.checkCompetitiveWinCondition(gameState);
      if (result.ended) {
        return result;
      }
    }

    // 检查标准胜利条件
    for (const condition of this.winConditions) {
      for (const player of activePlayers) {
        const result = this.checkWinCondition(condition, player, gameState);
        if (result.won) {
          player.finalRank = 1;
          return { ended: true, winnerId: player.id, reason: result.reason };
        }
      }
    }

    return { ended: false, winnerId: null, reason: null };
  }

  /**
   * 检查标准胜利条件
   */
  private checkWinCondition(
    condition: WinCondition,
    player: PlayerState,
    gameState: GameState
  ): { won: boolean; reason: string } {
    switch (condition.type) {
      case 'stat_threshold':
        if (condition.stat && condition.value !== undefined && condition.operator) {
          const statValue = player.stats[condition.stat] ?? 0;
          // 只检查胜利条件 (>= 或 >)
          if (condition.operator === '>=' && statValue >= condition.value) {
            return { won: true, reason: `${condition.stat} reached ${condition.value}` };
          }
          if (condition.operator === '>' && statValue > condition.value) {
            return { won: true, reason: `${condition.stat} exceeded ${condition.value}` };
          }
        }
        break;

      case 'resource_threshold':
        if (condition.stat && condition.value !== undefined && condition.operator) {
          const resourceValue = player.resources[condition.stat] ?? 0;
          if (condition.operator === '>=' && resourceValue >= condition.value) {
            return { won: true, reason: `${condition.stat} reached ${condition.value}` };
          }
        }
        break;

      case 'turn_limit':
        if (condition.value !== undefined && gameState.turn >= condition.value) {
          // 回合限制时，找出最高分玩家
          return { won: false, reason: '' }; // 交给 checkGameEnd 处理
        }
        break;

      case 'custom':
        if (condition.customCheck && this.customWinCheckers[condition.customCheck]) {
          if (this.customWinCheckers[condition.customCheck](gameState)) {
            return { won: true, reason: 'Custom win condition met' };
          }
        }
        break;
    }

    return { won: false, reason: '' };
  }

  /**
   * 检查竞争模式胜利条件
   */
  private checkCompetitiveWinCondition(gameState: GameState): {
    ended: boolean;
    winnerId: string | null;
    reason: string | null;
  } {
    const condition = this.competitiveWinCondition!;

    switch (condition.type) {
      case 'first_to_threshold':
        if (condition.stat && condition.threshold !== undefined) {
          for (const player of Object.values(gameState.players)) {
            if (player.eliminated) continue;
            const statValue = player.stats[condition.stat] ?? 0;
            if (statValue >= condition.threshold) {
              return {
                ended: true,
                winnerId: player.id,
                reason: `First to reach ${condition.stat} ${condition.threshold}`,
              };
            }
          }
        }
        break;

      case 'highest_at_turn_limit':
        if (condition.turnLimit && gameState.turn >= condition.turnLimit) {
          const winner = this.getHighestStatPlayer(gameState, condition.stat ?? 'performance');
          if (winner) {
            return {
              ended: true,
              winnerId: winner.id,
              reason: `Turn limit reached, highest ${condition.stat}`,
            };
          }
        }
        break;

      case 'last_standing':
        // 已在 checkGameEnd 中处理
        break;

      case 'custom':
        if (condition.customCheckerId && this.customWinCheckers[condition.customCheckerId]) {
          if (this.customWinCheckers[condition.customCheckerId](gameState)) {
            return { ended: true, winnerId: null, reason: 'Custom competitive condition' };
          }
        }
        break;
    }

    return { ended: false, winnerId: null, reason: null };
  }

  /**
   * 获取属性最高的玩家
   */
  private getHighestStatPlayer(gameState: GameState, statId: string): PlayerState | null {
    const activePlayers = Object.values(gameState.players).filter((p) => !p.eliminated);
    if (activePlayers.length === 0) return null;

    let highestPlayer = activePlayers[0];
    let highestValue = highestPlayer.stats[statId] ?? 0;

    for (const player of activePlayers.slice(1)) {
      const value = player.stats[statId] ?? 0;
      if (value > highestValue) {
        highestValue = value;
        highestPlayer = player;
      }
    }

    return highestPlayer;
  }

  // ============================================================================
  // 排名计算
  // ============================================================================

  /**
   * 获取最终排名
   */
  getFinalRankings(gameState: GameState): FinalRanking[] {
    const rankings: FinalRanking[] = [];
    const players = Object.values(gameState.players);
    const totalPlayers = players.length;

    // 先添加存活玩家 (按属性排序)
    const activePlayers = players.filter((p) => !p.eliminated);
    activePlayers.sort((a, b) => {
      const aScore = a.stats['performance'] ?? 0;
      const bScore = b.stats['performance'] ?? 0;
      return bScore - aScore;
    });

    let rank = 1;
    for (const player of activePlayers) {
      rankings.push({
        playerId: player.id,
        playerName: player.name,
        rank: rank++,
        isWinner: rank === 2, // 第一名是胜者
        eliminated: false,
        finalStats: { ...player.stats },
        finalResources: { ...player.resources },
      });
    }

    // 添加已淘汰玩家 (按淘汰顺序倒序)
    const eliminatedPlayers = players
      .filter((p) => p.eliminated)
      .sort((a, b) => (b.eliminatedAtTurn ?? 0) - (a.eliminatedAtTurn ?? 0));

    for (const player of eliminatedPlayers) {
      rankings.push({
        playerId: player.id,
        playerName: player.name,
        rank: rank++,
        isWinner: false,
        eliminated: true,
        eliminatedAtTurn: player.eliminatedAtTurn,
        finalStats: { ...player.stats },
        finalResources: { ...player.resources },
      });
    }

    // 更新玩家状态中的 finalRank
    for (const ranking of rankings) {
      const player = gameState.players[ranking.playerId];
      if (player) {
        player.finalRank = ranking.rank;
      }
    }

    return rankings;
  }

  /**
   * 获取活跃玩家数量
   */
  getActivePlayerCount(): number {
    return this.activePlayerCount;
  }

  /**
   * 获取淘汰顺序
   */
  getEliminationOrder(): string[] {
    return [...this.eliminationOrder];
  }

  /**
   * 初始化系统 (游戏开始时调用)
   */
  initialize(gameState: GameState): void {
    this.eliminationOrder = [];
    this.activePlayerCount = Object.keys(gameState.players).length;
  }

  /**
   * 重置系统状态
   */
  reset(): void {
    this.eliminationOrder = [];
    this.activePlayerCount = 0;
  }
}
