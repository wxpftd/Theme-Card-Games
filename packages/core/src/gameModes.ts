import {
  GameModeConfig,
  PlayerConfig,
  CompetitiveConfig,
  AIStrategyConfig,
  AIDifficulty,
  CompetitiveWinCondition,
} from './types';
import { getAIStrategyByDifficulty } from './ai/AIStrategyPresets';

/**
 * 创建单人游戏模式
 */
export function createSinglePlayerMode(
  playerId: string = 'player1',
  playerName: string = '玩家'
): GameModeConfig {
  return {
    type: 'single_player',
    players: [
      {
        id: playerId,
        name: playerName,
        isAI: false,
      },
    ],
  };
}

/**
 * AI 玩家配置简化接口
 */
export interface AIPlayerConfig {
  id: string;
  name: string;
  difficulty: AIDifficulty;
  customConfig?: Partial<AIStrategyConfig>;
}

/**
 * 人类玩家配置简化接口
 */
export interface HumanPlayerConfig {
  id: string;
  name: string;
}

/**
 * 创建竞争模式的选项
 */
export interface CompetitiveModeOptions {
  /** 人类玩家配置 */
  humanPlayer: HumanPlayerConfig;
  /** AI 玩家配置列表 */
  aiPlayers: AIPlayerConfig[];
  /** 是否启用共享资源 */
  enableSharedResources?: boolean;
  /** 是否启用竞争卡牌 */
  enableCompetitiveCards?: boolean;
  /** 是否启用目标选择 */
  enableTargetSelection?: boolean;
  /** 竞争胜利条件 */
  competitiveWinCondition?: CompetitiveWinCondition;
  /** 每回合攻击次数限制 */
  attacksPerTurn?: number;
}

/**
 * 创建竞争游戏模式 (人类 vs AI)
 */
export function createCompetitiveMode(options: CompetitiveModeOptions): GameModeConfig {
  const {
    humanPlayer,
    aiPlayers,
    enableSharedResources = true,
    enableCompetitiveCards = true,
    enableTargetSelection = true,
    competitiveWinCondition,
    attacksPerTurn,
  } = options;

  // 构建玩家配置
  const players: PlayerConfig[] = [
    {
      id: humanPlayer.id,
      name: humanPlayer.name,
      isAI: false,
    },
    ...aiPlayers.map((ai) => ({
      id: ai.id,
      name: ai.name,
      isAI: true,
      aiConfig: {
        ...getAIStrategyByDifficulty(ai.difficulty),
        ...ai.customConfig,
      },
    })),
  ];

  // 构建竞争配置
  const competitiveConfig: CompetitiveConfig = {
    enableSharedResources,
    enableCompetitiveCards,
    enableTargetSelection,
    competitiveWinCondition: competitiveWinCondition ?? {
      type: 'first_to_threshold',
      stat: 'performance',
      threshold: 100,
    },
    attacksPerTurn,
  };

  return {
    type: 'competitive',
    players,
    competitiveConfig,
  };
}

/**
 * 创建本地多人模式 (多个人类玩家)
 */
export interface LocalMultiplayerOptions {
  /** 玩家列表 */
  players: HumanPlayerConfig[];
  /** 是否启用共享资源 */
  enableSharedResources?: boolean;
  /** 是否启用竞争卡牌 */
  enableCompetitiveCards?: boolean;
  /** 竞争胜利条件 */
  competitiveWinCondition?: CompetitiveWinCondition;
}

/**
 * 创建本地多人游戏模式
 */
export function createLocalMultiplayerMode(options: LocalMultiplayerOptions): GameModeConfig {
  const {
    players: playerConfigs,
    enableSharedResources = false,
    enableCompetitiveCards = true,
    competitiveWinCondition,
  } = options;

  const players: PlayerConfig[] = playerConfigs.map((p) => ({
    id: p.id,
    name: p.name,
    isAI: false,
  }));

  const competitiveConfig: CompetitiveConfig = {
    enableSharedResources,
    enableCompetitiveCards,
    enableTargetSelection: true,
    competitiveWinCondition,
  };

  return {
    type: 'local_multiplayer',
    players,
    competitiveConfig,
  };
}

/**
 * 快速创建 1v1 竞争模式
 */
export function createQuick1v1Mode(
  humanName: string = '玩家',
  aiDifficulty: AIDifficulty = 'medium'
): GameModeConfig {
  return createCompetitiveMode({
    humanPlayer: { id: 'player1', name: humanName },
    aiPlayers: [{ id: 'ai1', name: 'AI 对手', difficulty: aiDifficulty }],
  });
}

/**
 * 快速创建 1v3 竞争模式 (不同难度 AI)
 */
export function createQuick1v3Mode(humanName: string = '玩家'): GameModeConfig {
  return createCompetitiveMode({
    humanPlayer: { id: 'player1', name: humanName },
    aiPlayers: [
      { id: 'ai1', name: 'AI-张三', difficulty: 'easy' },
      { id: 'ai2', name: 'AI-李四', difficulty: 'medium' },
      { id: 'ai3', name: 'AI-王五', difficulty: 'hard' },
    ],
  });
}

/**
 * 创建淘汰赛模式
 * 玩家被淘汰直到只剩一人
 */
export function createEliminationMode(
  humanName: string = '玩家',
  aiCount: number = 3,
  aiDifficulty: AIDifficulty = 'medium'
): GameModeConfig {
  const aiPlayers: AIPlayerConfig[] = [];
  for (let i = 1; i <= aiCount; i++) {
    aiPlayers.push({
      id: `ai${i}`,
      name: `AI-${i}`,
      difficulty: aiDifficulty,
    });
  }

  return createCompetitiveMode({
    humanPlayer: { id: 'player1', name: humanName },
    aiPlayers,
    competitiveWinCondition: {
      type: 'last_standing',
    },
  });
}
