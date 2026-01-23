import { useState, useCallback, useEffect, useRef } from 'react';
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
} from '@theme-card-games/core';

export interface UseGameEngineOptions {
  theme: ThemeConfig;
  playerId?: string;
  playerName?: string;
  autoStart?: boolean;
  /** 预选角色 ID (游戏开始前设置) */
  characterId?: string;
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

  // Actions
  startGame: () => void;
  playCard: (cardId: string, targets?: Record<string, string>) => boolean;
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
}

export function useGameEngine(options: UseGameEngineOptions): UseGameEngineReturn {
  const {
    theme,
    playerId = 'player1',
    playerName = '玩家',
    autoStart = false,
    characterId,
  } = options;

  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [finalRankings, setFinalRankings] = useState<FinalRanking[] | null>(null);
  const [lastEliminatedPlayer, setLastEliminatedPlayer] = useState<{
    playerId: string;
    playerName: string;
    reason?: string;
  } | null>(null);

  // Initialize engine
  useEffect(() => {
    const engine = new GameEngine({ theme });
    engineRef.current = engine;

    // Subscribe to state changes
    const unsubscribers: (() => void)[] = [];

    const updateState = () => {
      setGameState(engine.state);
    };

    // Subscribe to key events
    const eventTypes: GameEventType[] = [
      'game_started',
      'game_ended',
      'turn_started',
      'turn_ended',
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

    // Add player
    engine.addPlayer(playerId, playerName);

    // Select character if provided
    if (characterId) {
      engine.selectCharacter(playerId, characterId);
    }

    // Auto-start if configured
    if (autoStart) {
      engine.startGame();
    }

    updateState();

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [theme, playerId, playerName, autoStart, characterId]);

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
    engineRef.current?.addPlayer(playerId, playerName);
    setWinner(null);
    setFinalRankings(null);
    setLastEliminatedPlayer(null);
  }, [playerId, playerName]);

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

    // Actions
    startGame,
    playCard,
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
  };
}
