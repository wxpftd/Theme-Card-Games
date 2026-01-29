import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  GameEngine,
  GameState,
  ThemeConfig,
  GameEventType,
  PlayerState,
  CharacterDefinition,
  ScenarioDefinition,
  ScenarioState,
  FinalRanking,
  GameModeManager,
  createCompetitiveMode,
  AIDifficulty,
  TurnPlayState,
  ComboPreview,
} from '@theme-card-games/core';

/** 多人模式配置 */
export interface MultiplayerConfig {
  enabled: boolean;
  aiOpponents?: Array<{
    id: string;
    name: string;
    difficulty: AIDifficulty;
  }>;
}

export interface UseGameEngineOptions {
  theme: ThemeConfig;
  playerId?: string;
  playerName?: string;
  autoStart?: boolean;
  /** 预选角色 ID (游戏开始前设置) */
  characterId?: string;
  /** 多人模式配置 */
  multiplayer?: MultiplayerConfig;
}

export interface UseGameEngineReturn {
  // State
  gameState: GameState | null;
  currentPlayer: PlayerState | null;
  isMyTurn: boolean;
  isGameOver: boolean;
  winner: string | null;

  // Character state
  currentCharacter: CharacterDefinition | null;
  availableCharacters: CharacterDefinition[];

  // Scenario state
  currentScenario: ScenarioDefinition | null;
  scenarioState: ScenarioState | null;

  // Elimination state
  isEliminated: boolean;
  finalRankings: FinalRanking[] | null;
  lastEliminatedPlayer: { playerId: string; playerName: string; reason?: string } | null;

  // Multiplayer state
  opponents: PlayerState[];
  isMultiplayer: boolean;
  isAITurn: boolean;
  aiThinking: string | null;
  isAIPlayer: (playerId: string) => boolean;

  // Actions
  startGame: () => void;
  playCard: (cardId: string, targets?: Record<string, string>) => boolean;
  /** 批量打出多张卡牌（按顺序） */
  playCards: (
    cardIds: string[],
    delayMs?: number
  ) => Promise<{ success: boolean; playedCount: number }>;
  discardCard: (cardId: string) => boolean;
  drawCards: (count?: number) => void;
  endTurn: () => void;
  resetGame: () => void;

  // Character actions
  selectCharacter: (characterId: string) => boolean;
  useActiveAbility: (
    targetIds?: string[]
  ) => { success: boolean; effects: unknown[]; message?: string } | false;

  // Engine access
  engine: GameEngine | null;

  // Theme
  theme: ThemeConfig;
  t: (key: string) => string;

  // Turn play state (出牌限制)
  /** 获取玩家回合出牌状态 */
  getTurnPlayState: () => TurnPlayState;
  /** 获取当前回合剩余出牌数量，无限制时返回 undefined */
  remainingCardPlays: number | undefined;
  /** 每回合最大出牌数量，无限制时返回 undefined */
  maxCardsPerTurn: number | undefined;
  /** 检查指定卡牌是否可以打出（考虑数量限制和互斥标签） */
  canPlayCard: (cardId?: string) => boolean;
  /** 获取因互斥标签被禁用的卡牌定义 ID 集合 */
  disabledCardsByMutualExclusion: Set<string>;

  // Combo preview (组合预览)
  /** 获取当前可触发的 combo 预览列表 */
  comboPreviews: ComboPreview[];
}

export function useGameEngine(options: UseGameEngineOptions): UseGameEngineReturn {
  const {
    theme,
    playerId = 'player1',
    playerName = '玩家',
    autoStart = false,
    characterId,
    multiplayer,
  } = options;

  const engineRef = useRef<GameEngine | null>(null);
  const modeManagerRef = useRef<GameModeManager | null>(null);

  // 使用 ref 存储初始配置，避免依赖项变化导致 useEffect 重新执行
  const initialConfigRef = useRef({
    theme,
    playerId,
    playerName,
    autoStart,
    characterId,
    multiplayer,
  });

  // 挂载状态检查，防止组件卸载后更新状态
  const isMountedRef = useRef(true);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [finalRankings, setFinalRankings] = useState<FinalRanking[] | null>(null);
  const [lastEliminatedPlayer, setLastEliminatedPlayer] = useState<{
    playerId: string;
    playerName: string;
    reason?: string;
  } | null>(null);
  const [aiThinking, setAiThinking] = useState<string | null>(null);

  // Initialize engine
  useEffect(() => {
    // 设置挂载状态
    isMountedRef.current = true;

    // 使用 ref 中的初始配置，避免依赖项变化
    const config = initialConfigRef.current;

    const engine = new GameEngine({ theme: config.theme });
    engineRef.current = engine;

    // Subscribe to state changes
    const unsubscribers: (() => void)[] = [];

    // 使用批量更新来避免每个事件都触发 setState，防止 React 无限循环
    let updateScheduled = false;
    const updateState = () => {
      // 检查组件是否仍然挂载
      if (updateScheduled || !isMountedRef.current) return;
      updateScheduled = true;

      // 使用 queueMicrotask 将同一事件循环中的多个事件合并为一次 setState
      queueMicrotask(() => {
        updateScheduled = false;
        // 再次检查挂载状态
        if (!isMountedRef.current) return;
        // 使用 getStateSnapshot() 利用缓存机制，避免每次都深拷贝
        setGameState(engine.getStateSnapshot() as GameState);
      });
    };

    // Subscribe to key events
    const eventTypes: GameEventType[] = [
      'game_started',
      'game_ended',
      'turn_started',
      'turn_ended',
      'phase_changed',
      'card_drawn',
      'card_played',
      'card_discarded',
      'stat_changed',
      'resource_changed',
      'character_selected',
      'character_passive_triggered',
      'character_active_ability_used',
      'scenario_entered',
      'scenario_exited',
      'scenario_effect_applied',
      'player_eliminated',
    ];

    for (const eventType of eventTypes) {
      unsubscribers.push(
        engine.on(eventType, (event) => {
          updateState();

          if (eventType === 'game_ended') {
            setWinner(event.data.winnerId as string | null);
            // 获取最终排名
            const rankings = engine.getFinalRankings();
            setFinalRankings(rankings);
          }

          if (eventType === 'player_eliminated') {
            setLastEliminatedPlayer({
              playerId: event.data.playerId as string,
              playerName: event.data.playerName as string,
              reason: event.data.description as string | undefined,
            });
            // 3 秒后清除淘汰提示
            setTimeout(() => setLastEliminatedPlayer(null), 3000);
          }
        })
      );
    }

    // 多人模式初始化
    if (
      config.multiplayer?.enabled &&
      config.multiplayer.aiOpponents &&
      config.multiplayer.aiOpponents.length > 0
    ) {
      // 使用 GameModeManager 初始化竞争模式
      const modeConfig = createCompetitiveMode({
        humanPlayer: { id: config.playerId, name: config.playerName },
        aiPlayers: config.multiplayer.aiOpponents.map((ai) => ({
          id: ai.id,
          name: ai.name,
          difficulty: ai.difficulty,
        })),
      });

      const modeManager = new GameModeManager({
        engine,
        modeConfig,
      });
      modeManagerRef.current = modeManager;

      // 监听 AI 回合开始和结束
      unsubscribers.push(
        engine.on('ai_turn_started' as GameEventType, (event) => {
          if (!isMountedRef.current) return;
          const aiPlayer = engine.state.players[event.data.playerId as string];
          setAiThinking(aiPlayer?.name ?? 'AI');
        })
      );

      unsubscribers.push(
        engine.on('ai_turn_ended' as GameEventType, () => {
          if (!isMountedRef.current) return;
          setAiThinking(null);
        })
      );

      // 选择角色
      if (config.characterId) {
        engine.selectCharacter(config.playerId, config.characterId);
      }
    } else {
      // 单人模式初始化
      engine.addPlayer(config.playerId, config.playerName);

      // Select character if provided
      if (config.characterId) {
        engine.selectCharacter(config.playerId, config.characterId);
      }
    }

    // Auto-start if configured
    if (config.autoStart) {
      engine.startGame();
    }

    updateState();

    return () => {
      // 标记组件已卸载
      isMountedRef.current = false;
      unsubscribers.forEach((unsub) => unsub());
      modeManagerRef.current?.destroy();
      modeManagerRef.current = null;
    };
  }, []); // 空依赖数组 - 只在挂载时执行一次

  // Get current player state
  const currentPlayer = gameState?.players[playerId] ?? null;

  // Check if it's my turn
  const isMyTurn = gameState?.currentPlayerId === playerId;

  // Check if game is over
  const isGameOver = gameState?.phase === 'game_over';

  // Check if eliminated
  const isEliminated = currentPlayer?.eliminated ?? false;

  // Get current character
  const currentCharacter = currentPlayer?.character
    ? (theme.characterDefinitions?.find((c) => c.id === currentPlayer.character?.characterId) ??
      null)
    : null;

  // Get available characters
  const availableCharacters = theme.characterDefinitions ?? theme.defaultCharacters ?? [];

  // Get current scenario
  const currentScenario = engineRef.current?.getCurrentScenario() ?? null;

  // Get scenario state
  const scenarioState =
    (gameState as unknown as { scenarioState?: ScenarioState })?.scenarioState ?? null;

  // Actions
  const startGame = useCallback(() => {
    engineRef.current?.startGame();
  }, []);

  const playCard = useCallback(
    (cardId: string, targets?: Record<string, string>) => {
      return engineRef.current?.playCard(playerId, cardId, targets) ?? false;
    },
    [playerId]
  );

  const playCards = useCallback(
    async (
      cardIds: string[],
      delayMs: number = 100
    ): Promise<{ success: boolean; playedCount: number }> => {
      if (!engineRef.current || cardIds.length === 0) {
        return { success: false, playedCount: 0 };
      }

      let playedCount = 0;
      for (const cardId of cardIds) {
        const success = engineRef.current.playCard(playerId, cardId);
        if (!success) {
          return { success: false, playedCount };
        }
        playedCount++;

        // 短暂延迟让动画和事件有时间处理
        if (delayMs > 0 && playedCount < cardIds.length) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      return { success: true, playedCount };
    },
    [playerId]
  );

  const discardCard = useCallback(
    (cardId: string) => {
      return engineRef.current?.discardCard(playerId, cardId) ?? false;
    },
    [playerId]
  );

  const drawCards = useCallback(
    (count: number = 1) => {
      engineRef.current?.drawCards(playerId, count);
    },
    [playerId]
  );

  const endTurn = useCallback(() => {
    engineRef.current?.endTurn();
  }, []);

  const resetGame = useCallback(() => {
    engineRef.current?.reset();
    modeManagerRef.current?.reset();

    // 重新初始化玩家
    if (multiplayer?.enabled && multiplayer.aiOpponents && multiplayer.aiOpponents.length > 0) {
      // 多人模式需要重新创建 GameModeManager
      const modeConfig = createCompetitiveMode({
        humanPlayer: { id: playerId, name: playerName },
        aiPlayers: multiplayer.aiOpponents.map((ai) => ({
          id: ai.id,
          name: ai.name,
          difficulty: ai.difficulty,
        })),
      });

      if (engineRef.current) {
        modeManagerRef.current = new GameModeManager({
          engine: engineRef.current,
          modeConfig,
        });
      }
    } else {
      engineRef.current?.addPlayer(playerId, playerName);
    }

    setWinner(null);
    setFinalRankings(null);
    setLastEliminatedPlayer(null);
    setAiThinking(null);
  }, [playerId, playerName, multiplayer]);

  // Character actions
  const selectCharacter = useCallback(
    (charId: string) => {
      return engineRef.current?.selectCharacter(playerId, charId) ?? false;
    },
    [playerId]
  );

  const useActiveAbility = useCallback(
    (targetIds?: string[]) => {
      return engineRef.current?.useActiveAbility(playerId, targetIds) ?? false;
    },
    [playerId]
  );

  // Localization helper
  const t = useCallback((key: string) => {
    return engineRef.current?.t(key) ?? key;
  }, []);

  // Multiplayer computed properties
  const isMultiplayer = multiplayer?.enabled ?? false;

  // Memoize opponents to prevent unnecessary re-renders
  const opponents = useMemo(() => {
    if (!gameState) return [];
    return Object.values(gameState.players).filter((p) => p.id !== playerId);
  }, [gameState?.players, playerId]);

  const isAITurn = isMultiplayer && aiThinking !== null;

  const isAIPlayer = useCallback((targetPlayerId: string): boolean => {
    return modeManagerRef.current?.isAIPlayer(targetPlayerId) ?? false;
  }, []);

  // Turn play state helpers
  const getTurnPlayState = useCallback((): TurnPlayState => {
    return (
      engineRef.current?.getTurnPlayState(playerId) ?? {
        cardsPlayedThisTurn: 0,
        tagsPlayedThisTurn: [],
      }
    );
  }, [playerId]);

  const remainingCardPlays = useMemo(() => {
    if (!gameState || !engineRef.current) return undefined;
    return engineRef.current.getRemainingCardPlays(playerId);
  }, [gameState, playerId]);

  const maxCardsPerTurn = useMemo(() => {
    return engineRef.current?.getMaxCardsPerTurn();
  }, []);

  const canPlayCardCheck = useCallback(
    (cardId?: string): boolean => {
      return engineRef.current?.canPlayCard(playerId, cardId) ?? false;
    },
    [playerId]
  );

  const disabledCardsByMutualExclusion = useMemo(() => {
    if (!gameState || !engineRef.current) return new Set<string>();
    return engineRef.current.getDisabledCardsByMutualExclusion(playerId);
  }, [gameState, playerId]);

  // Combo preview
  const comboPreviews = useMemo((): ComboPreview[] => {
    if (!gameState || !engineRef.current) return [];
    return engineRef.current.getAvailableCombos(playerId);
  }, [gameState, playerId]);

  return {
    // State
    gameState,
    currentPlayer,
    isMyTurn,
    isGameOver,
    winner,

    // Character state
    currentCharacter,
    availableCharacters,

    // Scenario state
    currentScenario,
    scenarioState,

    // Elimination state
    isEliminated,
    finalRankings,
    lastEliminatedPlayer,

    // Multiplayer state
    opponents,
    isMultiplayer,
    isAITurn,
    aiThinking,
    isAIPlayer,

    // Actions
    startGame,
    playCard,
    playCards,
    discardCard,
    drawCards,
    endTurn,
    resetGame,

    // Character actions
    selectCharacter,
    useActiveAbility,

    // Engine access
    engine: engineRef.current,

    // Theme
    theme,
    t,

    // Turn play state
    getTurnPlayState,
    remainingCardPlays,
    maxCardsPerTurn,
    canPlayCard: canPlayCardCheck,
    disabledCardsByMutualExclusion,

    // Combo preview
    comboPreviews,
  };
}
