import {
  AIPlayerState,
  AIStrategyConfig,
  AIDecision,
  AIMemory,
  GameState,
  CardDefinition,
  CardInstance,
  PlayerState,
  EffectTarget,
} from '../types';
import { getAIStrategyByDifficulty } from '../ai/AIStrategyPresets';
import { EventBus } from '../event';

export interface AIPlayerSystemOptions {
  eventBus: EventBus;
  cardDefinitions: CardDefinition[];
}

/**
 * AI 玩家系统
 * 管理 AI 玩家的注册、决策和行动
 */
export class AIPlayerSystem {
  private aiPlayers: Map<string, AIPlayerState> = new Map();
  private eventBus: EventBus;
  private cardDefinitions: Map<string, CardDefinition>;

  constructor(options: AIPlayerSystemOptions) {
    this.eventBus = options.eventBus;
    this.cardDefinitions = new Map(options.cardDefinitions.map((c) => [c.id, c]));
  }

  /**
   * 注册一个 AI 玩家
   */
  registerAIPlayer(playerId: string, config: AIStrategyConfig): void {
    const aiState: AIPlayerState = {
      playerId,
      strategyConfig: config,
      memory: this.createEmptyMemory(),
    };
    this.aiPlayers.set(playerId, aiState);
  }

  /**
   * 使用难度预设注册 AI 玩家
   */
  registerAIPlayerWithDifficulty(
    playerId: string,
    difficulty: AIStrategyConfig['difficulty']
  ): void {
    const config = getAIStrategyByDifficulty(difficulty);
    this.registerAIPlayer(playerId, config);
  }

  /**
   * 检查玩家是否为 AI
   */
  isAIPlayer(playerId: string): boolean {
    return this.aiPlayers.has(playerId);
  }

  /**
   * 获取 AI 玩家状态
   */
  getAIPlayer(playerId: string): AIPlayerState | undefined {
    return this.aiPlayers.get(playerId);
  }

  /**
   * 获取所有 AI 玩家 ID
   */
  getAllAIPlayerIds(): string[] {
    return Array.from(this.aiPlayers.keys());
  }

  /**
   * 处理 AI 回合
   * 返回 AI 做出的决策
   */
  async processAITurn(playerId: string, gameState: GameState): Promise<AIDecision[]> {
    const aiState = this.aiPlayers.get(playerId);
    if (!aiState) {
      throw new Error(`Player ${playerId} is not an AI player`);
    }

    const player = gameState.players[playerId];
    if (!player) {
      throw new Error(`Player ${playerId} not found in game state`);
    }

    this.eventBus.emit(
      {
        type: 'ai_turn_started',
        timestamp: Date.now(),
        data: { playerId },
      },
      gameState
    );

    // 模拟思考时间
    await this.delay(aiState.strategyConfig.thinkingDelay);

    const decisions: AIDecision[] = [];
    let continuePlaying = true;

    // AI 循环决策，直到选择结束回合
    while (continuePlaying) {
      const decision = this.makeDecision(aiState, player, gameState);
      decisions.push(decision);

      this.eventBus.emit(
        {
          type: 'ai_decision_made',
          timestamp: Date.now(),
          data: { playerId, decision },
        },
        gameState
      );

      if (decision.action === 'end_turn') {
        continuePlaying = false;
      } else {
        // 添加短暂延迟使游戏更自然
        await this.delay(aiState.strategyConfig.thinkingDelay / 2);
      }
    }

    this.eventBus.emit(
      {
        type: 'ai_turn_ended',
        timestamp: Date.now(),
        data: { playerId, decisions },
      },
      gameState
    );

    return decisions;
  }

  /**
   * 做出单个决策
   */
  private makeDecision(
    aiState: AIPlayerState,
    player: PlayerState,
    gameState: GameState
  ): AIDecision {
    const { strategyConfig } = aiState;
    const playableCards = this.getPlayableCards(player, gameState);

    // 如果没有可出的牌，结束回合
    if (playableCards.length === 0) {
      return {
        action: 'end_turn',
        confidence: 1.0,
        reason: 'No playable cards',
      };
    }

    // 评估每张牌的价值
    const cardScores = playableCards.map((card) => ({
      card,
      score: this.evaluateCard(card, aiState, player, gameState),
    }));

    // 按分数排序
    cardScores.sort((a, b) => b.score - a.score);

    const bestCard = cardScores[0];

    // 根据难度决定是否出牌
    // 简单 AI 有更大概率跳过好牌
    const playThreshold = this.getPlayThreshold(strategyConfig);

    if (bestCard.score < playThreshold) {
      return {
        action: 'end_turn',
        confidence: 0.8,
        reason: `Best card score ${bestCard.score.toFixed(2)} below threshold ${playThreshold.toFixed(2)}`,
      };
    }

    // 决定目标
    const cardDef = this.cardDefinitions.get(bestCard.card.definitionId);
    const targetPlayerId = this.selectTarget(cardDef, aiState, player, gameState);

    return {
      action: 'play_card',
      cardId: bestCard.card.instanceId,
      targetPlayerId,
      confidence: Math.min(bestCard.score / 100, 1.0),
      reason: `Playing ${cardDef?.name ?? 'unknown'} with score ${bestCard.score.toFixed(2)}`,
    };
  }

  /**
   * 获取可出的牌
   */
  private getPlayableCards(player: PlayerState, gameState: GameState): CardInstance[] {
    return player.hand.filter((card) => {
      const def = this.cardDefinitions.get(card.definitionId);
      if (!def) return false;

      // 检查精力消耗
      const energyCost = def.cost ?? 0;
      const energy = player.resources['energy'] ?? 0;
      return energy >= energyCost;
    });
  }

  /**
   * 评估卡牌价值
   */
  private evaluateCard(
    card: CardInstance,
    aiState: AIPlayerState,
    player: PlayerState,
    gameState: GameState
  ): number {
    const { strategyConfig } = aiState;
    const def = this.cardDefinitions.get(card.definitionId);
    if (!def) return 0;

    let score = 50; // 基础分

    // 分析卡牌效果
    for (const effect of def.effects) {
      const value = Number(effect.value ?? 0);

      switch (effect.type) {
        case 'modify_stat': {
          const stat = effect.metadata?.stat as string;
          const currentValue = player.stats[stat] ?? 0;

          if (value > 0) {
            // 正面效果
            if (stat === 'performance') {
              // 绩效越低，越需要提升
              score += value * (1 + (100 - currentValue) / 100);
            } else if (stat === 'health') {
              // 健康值越低，越需要恢复
              const healthFactor = currentValue < 30 ? 2 : currentValue < 50 ? 1.5 : 1;
              score += value * healthFactor * strategyConfig.defensiveness;
            } else if (stat === 'happiness') {
              score += value * 0.5;
            } else if (stat === 'influence') {
              score += value * 0.8;
            }
          } else {
            // 负面效果 - 根据当前状态评估风险
            if (stat === 'health' && currentValue < 40) {
              score += value * 3 * (1 - strategyConfig.riskTolerance);
            } else if (stat === 'performance' && currentValue < 30) {
              score += value * 2 * (1 - strategyConfig.riskTolerance);
            } else {
              score += value * (1 - strategyConfig.riskTolerance);
            }
          }
          break;
        }

        case 'gain_resource':
        case 'lose_resource': {
          const multiplier = effect.type === 'gain_resource' ? 1 : -1;
          score += value * multiplier * 3;
          break;
        }

        case 'transfer_stat':
        case 'damage_stat': {
          // 竞争卡牌 - 根据攻击性评估
          score += Math.abs(value) * strategyConfig.aggressiveness * 2;
          break;
        }

        case 'steal_resource': {
          // 偷取资源 - 根据贪婪度评估
          score += Math.abs(value) * strategyConfig.greed * 2.5;
          break;
        }

        case 'draw_cards': {
          score += value * 5;
          break;
        }
      }
    }

    // 根据卡牌稀有度微调
    const rarityBonus: Record<string, number> = {
      common: 0,
      uncommon: 3,
      rare: 6,
      legendary: 10,
    };
    score += rarityBonus[def.rarity ?? 'common'] ?? 0;

    // 根据标签调整
    if (def.tags?.includes('high_risk')) {
      score *= 0.5 + strategyConfig.riskTolerance * 0.5;
    }
    if (def.tags?.includes('competitive')) {
      score *= 0.5 + strategyConfig.aggressiveness * 0.5;
    }

    // 添加随机因素（难度越低，随机性越大）
    const randomFactor =
      1 -
      (strategyConfig.difficulty === 'easy'
        ? 0.3
        : strategyConfig.difficulty === 'medium'
          ? 0.15
          : 0.05);
    score *= randomFactor + Math.random() * (1 - randomFactor);

    return score;
  }

  /**
   * 选择攻击目标
   */
  private selectTarget(
    cardDef: CardDefinition | undefined,
    aiState: AIPlayerState,
    player: PlayerState,
    gameState: GameState
  ): string | undefined {
    if (!cardDef) return undefined;

    // 检查卡牌效果是否需要目标
    const needsTarget = cardDef.effects.some((effect) =>
      this.isTargetSelectionNeeded(effect.target)
    );

    if (!needsTarget) return undefined;

    // 获取所有对手
    const opponents = Object.values(gameState.players).filter((p) => p.id !== player.id);
    if (opponents.length === 0) return undefined;
    if (opponents.length === 1) return opponents[0].id;

    // 根据策略选择目标
    return this.selectBestTarget(opponents, aiState, gameState);
  }

  /**
   * 判断效果目标是否需要选择
   */
  private isTargetSelectionNeeded(target: EffectTarget): boolean {
    return target === 'selected_opponent' || target === 'opponent';
  }

  /**
   * 选择最佳攻击目标
   */
  private selectBestTarget(
    opponents: PlayerState[],
    aiState: AIPlayerState,
    gameState: GameState
  ): string {
    const { strategyConfig, memory } = aiState;

    // 计算每个对手的威胁分数
    const targetScores = opponents.map((opponent) => {
      let score = 0;

      // 绩效越高的对手威胁越大
      const performance = opponent.stats['performance'] ?? 0;
      score += performance * strategyConfig.aggressiveness;

      // 健康值越低的对手越容易击败
      const health = opponent.stats['health'] ?? 100;
      score += (100 - health) * 0.3;

      // 考虑历史威胁评分
      const historicalThreat = memory.threatScores[opponent.id] ?? 0;
      score += historicalThreat * 0.2;

      // 添加一些随机性
      score += Math.random() * 10;

      return { opponent, score };
    });

    // 根据策略选择目标
    targetScores.sort((a, b) => b.score - a.score);

    // 高攻击性 AI 选择威胁最大的对手
    // 低攻击性 AI 可能选择较弱的对手
    if (strategyConfig.aggressiveness > 0.7) {
      return targetScores[0].opponent.id;
    } else if (strategyConfig.aggressiveness < 0.3) {
      // 选择最弱的对手
      return targetScores[targetScores.length - 1].opponent.id;
    } else {
      // 随机选择
      const randomIndex = Math.floor(Math.random() * targetScores.length);
      return targetScores[randomIndex].opponent.id;
    }
  }

  /**
   * 获取出牌阈值
   */
  private getPlayThreshold(config: AIStrategyConfig): number {
    switch (config.difficulty) {
      case 'easy':
        return 30;
      case 'medium':
        return 40;
      case 'hard':
        return 45;
      case 'expert':
        return 50;
      default:
        return 40;
    }
  }

  /**
   * 更新 AI 记忆
   */
  updateMemory(playerId: string, opponentId: string, cardId: string): void {
    const aiState = this.aiPlayers.get(playerId);
    if (!aiState) return;

    // 记录对手打出的牌
    if (!aiState.memory.opponentCardHistory[opponentId]) {
      aiState.memory.opponentCardHistory[opponentId] = [];
    }
    aiState.memory.opponentCardHistory[opponentId].push(cardId);

    // 更新威胁评分
    const cardDef = this.cardDefinitions.get(cardId);
    if (cardDef?.tags?.includes('competitive')) {
      aiState.memory.threatScores[opponentId] = (aiState.memory.threatScores[opponentId] ?? 0) + 5;
    }
  }

  /**
   * 重置 AI 玩家记忆
   */
  resetMemory(playerId: string): void {
    const aiState = this.aiPlayers.get(playerId);
    if (aiState) {
      aiState.memory = this.createEmptyMemory();
    }
  }

  /**
   * 重置所有 AI
   */
  reset(): void {
    for (const playerId of this.aiPlayers.keys()) {
      this.resetMemory(playerId);
    }
  }

  /**
   * 移除 AI 玩家
   */
  removeAIPlayer(playerId: string): boolean {
    return this.aiPlayers.delete(playerId);
  }

  /**
   * 创建空记忆
   */
  private createEmptyMemory(): AIMemory {
    return {
      opponentCardHistory: {},
      threatScores: {},
      claimedResources: [],
    };
  }

  /**
   * 延迟工具函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
