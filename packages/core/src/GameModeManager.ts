import {
  GameModeConfig,
  PlayerConfig,
  AIDecision,
  TargetSelectionRequest,
  TargetSelectionResponse,
} from './types';
import { GameEngine } from './GameEngine';
import { AIPlayerSystem } from './systems/AIPlayerSystem';
import { SharedResourceSystem } from './systems/SharedResourceSystem';
import { getAIStrategyByDifficulty } from './ai/AIStrategyPresets';

export interface GameModeManagerOptions {
  engine: GameEngine;
  modeConfig: GameModeConfig;
}

/**
 * 游戏模式管理器
 * 管理多人竞争模式、AI 玩家和共享资源
 */
export class GameModeManager {
  private engine: GameEngine;
  private modeConfig: GameModeConfig;
  private aiSystem: AIPlayerSystem | null = null;
  private sharedResourceSystem: SharedResourceSystem | null = null;
  private unsubscribers: (() => void)[] = [];
  private pendingTargetSelection: TargetSelectionRequest | null = null;
  private targetSelectionResolver: ((response: TargetSelectionResponse) => void) | null = null;

  constructor(options: GameModeManagerOptions) {
    this.engine = options.engine;
    this.modeConfig = options.modeConfig;

    this.initializeMode();
    this.setupEventListeners();
  }

  /**
   * 初始化游戏模式
   */
  private initializeMode(): void {
    const { type, players, competitiveConfig } = this.modeConfig;

    // 添加所有玩家
    for (const playerConfig of players) {
      this.engine.addPlayer(playerConfig.id, playerConfig.name);
    }

    // 如果是竞争模式，初始化 AI 系统和共享资源系统
    if (type === 'competitive' || type === 'local_multiplayer') {
      this.initializeAIPlayers(players);

      if (competitiveConfig?.enableSharedResources) {
        this.initializeSharedResources();
      }
    }
  }

  /**
   * 初始化 AI 玩家
   */
  private initializeAIPlayers(players: PlayerConfig[]): void {
    const aiPlayers = players.filter((p) => p.isAI);
    if (aiPlayers.length === 0) return;

    this.aiSystem = new AIPlayerSystem({
      eventBus: this.engine.events,
      cardDefinitions: this.engine.getAllCardDefinitions(),
    });

    for (const player of aiPlayers) {
      const strategyConfig = player.aiConfig ?? getAIStrategyByDifficulty('medium');
      this.aiSystem.registerAIPlayer(player.id, strategyConfig);
    }
  }

  /**
   * 初始化共享资源系统
   */
  private initializeSharedResources(): void {
    const sharedResourceDefs = this.engine.themeConfig.sharedResourceDefinitions ?? [];
    if (sharedResourceDefs.length === 0) return;

    this.sharedResourceSystem = new SharedResourceSystem({
      definitions: sharedResourceDefs,
      eventBus: this.engine.events,
      customRules: this.engine.themeConfig.customSharedResourceRules,
    });
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听回合开始，触发 AI 行动
    this.unsubscribers.push(
      this.engine.on('turn_started', async (event) => {
        const currentPlayerId = this.engine.state.currentPlayerId;

        // 处理共享资源再生
        if (this.sharedResourceSystem) {
          this.sharedResourceSystem.processRegeneration(this.engine.state.turn, this.engine.state);
        }

        // 如果当前玩家是 AI，自动处理其回合
        if (this.aiSystem?.isAIPlayer(currentPlayerId)) {
          await this.processAITurn(currentPlayerId);
        }
      })
    );

    // 监听卡牌打出，更新 AI 记忆
    this.unsubscribers.push(
      this.engine.on('card_played', (event) => {
        if (!this.aiSystem) return;

        const { playerId, cardId } = event.data as { playerId: string; cardId: string };

        // 更新所有 AI 的记忆
        for (const aiId of this.aiSystem.getAllAIPlayerIds()) {
          if (aiId !== playerId) {
            this.aiSystem.updateMemory(aiId, playerId, cardId);
          }
        }
      })
    );

    // 监听竞争胜利条件
    if (this.modeConfig.competitiveConfig?.competitiveWinCondition) {
      this.unsubscribers.push(
        this.engine.on('stat_changed', () => {
          this.checkCompetitiveWinCondition();
        })
      );
    }
  }

  /**
   * 处理 AI 回合
   */
  private async processAITurn(playerId: string): Promise<void> {
    if (!this.aiSystem) return;

    try {
      const decisions = await this.aiSystem.processAITurn(playerId, this.engine.state);

      for (const decision of decisions) {
        await this.executeAIDecision(playerId, decision);
      }

      // AI 回合结束
      this.engine.endTurn();
    } catch (error) {
      console.error(`AI turn error for ${playerId}:`, error);
      // 发生错误时直接结束回合
      this.engine.endTurn();
    }
  }

  /**
   * 执行 AI 决策
   */
  private async executeAIDecision(playerId: string, decision: AIDecision): Promise<void> {
    switch (decision.action) {
      case 'play_card':
        if (decision.cardId) {
          const targets = decision.targetPlayerId ? { target: decision.targetPlayerId } : undefined;
          this.engine.playCard(playerId, decision.cardId, targets);
        }
        break;

      case 'claim_resource':
        if (decision.resourceId && this.sharedResourceSystem) {
          this.sharedResourceSystem.claimResource(decision.resourceId, playerId, this.engine.state);
        }
        break;

      case 'end_turn':
        // 回合结束由调用方处理
        break;
    }
  }

  /**
   * 检查竞争胜利条件
   */
  private checkCompetitiveWinCondition(): void {
    const winCondition = this.modeConfig.competitiveConfig?.competitiveWinCondition;
    if (!winCondition) return;

    const players = this.engine.getAllPlayers();
    const state = this.engine.state;

    switch (winCondition.type) {
      case 'first_to_threshold': {
        const stat = winCondition.stat ?? 'performance';
        const threshold = winCondition.threshold ?? 100;

        for (const player of players) {
          if ((player.stats[stat] ?? 0) >= threshold) {
            this.engine.events.emit(
              {
                type: 'competitive_winner',
                timestamp: Date.now(),
                data: {
                  winnerId: player.id,
                  reason: `First to reach ${stat} ${threshold}`,
                },
              },
              state
            );
            this.engine.endGame(player.id, `达成竞争胜利条件: ${stat} >= ${threshold}`);
            return;
          }
        }
        break;
      }

      case 'last_standing': {
        const healthStat = 'health';
        const alivePlayers = players.filter((p) => (p.stats[healthStat] ?? 0) > 0);

        if (alivePlayers.length === 1) {
          this.engine.events.emit(
            {
              type: 'competitive_winner',
              timestamp: Date.now(),
              data: {
                winnerId: alivePlayers[0].id,
                reason: 'Last player standing',
              },
            },
            state
          );
          this.engine.endGame(alivePlayers[0].id, '最后幸存者');
        } else if (alivePlayers.length === 0) {
          this.engine.endGame(null, '所有玩家淘汰');
        }
        break;
      }
    }
  }

  /**
   * 请求目标选择
   * 返回 Promise，等待用户选择
   */
  requestTargetSelection(request: TargetSelectionRequest): Promise<TargetSelectionResponse> {
    this.pendingTargetSelection = request;

    this.engine.events.emit(
      {
        type: 'target_selection_requested',
        timestamp: Date.now(),
        data: { request },
      },
      this.engine.state
    );

    return new Promise((resolve) => {
      this.targetSelectionResolver = resolve;
    });
  }

  /**
   * 提交目标选择结果
   */
  submitTargetSelection(response: TargetSelectionResponse): void {
    if (this.targetSelectionResolver) {
      this.targetSelectionResolver(response);
      this.targetSelectionResolver = null;
      this.pendingTargetSelection = null;

      this.engine.events.emit(
        {
          type: 'target_selection_completed',
          timestamp: Date.now(),
          data: { response },
        },
        this.engine.state
      );
    }
  }

  /**
   * 获取当前待处理的目标选择请求
   */
  getPendingTargetSelection(): TargetSelectionRequest | null {
    return this.pendingTargetSelection;
  }

  /**
   * 检查玩家是否为 AI
   */
  isAIPlayer(playerId: string): boolean {
    return this.aiSystem?.isAIPlayer(playerId) ?? false;
  }

  /**
   * 获取 AI 系统
   */
  getAISystem(): AIPlayerSystem | null {
    return this.aiSystem;
  }

  /**
   * 获取共享资源系统
   */
  getSharedResourceSystem(): SharedResourceSystem | null {
    return this.sharedResourceSystem;
  }

  /**
   * 获取游戏模式配置
   */
  getModeConfig(): GameModeConfig {
    return this.modeConfig;
  }

  /**
   * 获取所有玩家配置
   */
  getPlayerConfigs(): PlayerConfig[] {
    return this.modeConfig.players;
  }

  /**
   * 获取人类玩家列表
   */
  getHumanPlayers(): PlayerConfig[] {
    return this.modeConfig.players.filter((p) => !p.isAI);
  }

  /**
   * 获取 AI 玩家列表
   */
  getAIPlayers(): PlayerConfig[] {
    return this.modeConfig.players.filter((p) => p.isAI);
  }

  /**
   * 重置
   */
  reset(): void {
    this.aiSystem?.reset();
    this.sharedResourceSystem?.reset();
    this.pendingTargetSelection = null;
    this.targetSelectionResolver = null;
  }

  /**
   * 销毁
   */
  destroy(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    this.reset();
  }
}
