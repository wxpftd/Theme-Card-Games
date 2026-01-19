import { useState, useCallback, useEffect, useRef } from 'react';
import {
  GameEngine,
  GameState,
  ThemeConfig,
  GameEventType,
  PlayerState,
} from '@theme-card-games/core';

export interface UseGameEngineOptions {
  theme: ThemeConfig;
  playerId?: string;
  playerName?: string;
  autoStart?: boolean;
}

export interface UseGameEngineReturn {
  // State
  gameState: GameState | null;
  currentPlayer: PlayerState | null;
  isMyTurn: boolean;
  isGameOver: boolean;
  winner: string | null;

  // Actions
  startGame: () => void;
  playCard: (cardId: string, targets?: Record<string, string>) => boolean;
  discardCard: (cardId: string) => boolean;
  drawCards: (count?: number) => void;
  endTurn: () => void;
  resetGame: () => void;

  // Engine access
  engine: GameEngine | null;

  // Theme
  theme: ThemeConfig;
  t: (key: string) => string;
}

export function useGameEngine(options: UseGameEngineOptions): UseGameEngineReturn {
  const { theme, playerId = 'player1', playerName = '玩家', autoStart = false } = options;

  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [winner, setWinner] = useState<string | null>(null);

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
    ];

    for (const eventType of eventTypes) {
      unsubscribers.push(
        engine.on(eventType, (event) => {
          updateState();

          if (eventType === 'game_ended') {
            setWinner(event.data.winnerId as string | null);
          }
        })
      );
    }

    // Add player
    engine.addPlayer(playerId, playerName);

    // Auto-start if configured
    if (autoStart) {
      engine.startGame();
    }

    updateState();

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [theme, playerId, playerName, autoStart]);

  // Get current player state
  const currentPlayer = gameState?.players[playerId] ?? null;

  // Check if it's my turn
  const isMyTurn = gameState?.currentPlayerId === playerId;

  // Check if game is over
  const isGameOver = gameState?.phase === 'game_over';

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
  }, [playerId, playerName]);

  // Localization helper
  const t = useCallback((key: string) => {
    return engineRef.current?.t(key) ?? key;
  }, []);

  return {
    gameState,
    currentPlayer,
    isMyTurn,
    isGameOver,
    winner,
    startGame,
    playCard,
    discardCard,
    drawCards,
    endTurn,
    resetGame,
    engine: engineRef.current,
    theme,
    t,
  };
}
