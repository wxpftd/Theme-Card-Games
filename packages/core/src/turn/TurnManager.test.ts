import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TurnManager, TurnPhaseConfig } from './TurnManager';
import { GameStateManager } from '../state';
import { CardDefinition, GameConfig } from '../types';

const createTestConfig = (): GameConfig => ({
  maxPlayers: 4,
  minPlayers: 1,
  initialHandSize: 3,
  maxHandSize: 7,
  winConditions: [
    { type: 'stat_threshold', stat: 'score', operator: '>=', value: 100 },
  ],
  initialStats: { score: 0, health: 100 },
  initialResources: { energy: 5 },
});

const createTestCards = (): CardDefinition[] => [
  {
    id: 'card1',
    type: 'action',
    name: 'Test Card 1',
    description: 'A test card',
    effects: [],
    cost: 1,
    rarity: 'common',
  },
  {
    id: 'card2',
    type: 'action',
    name: 'Test Card 2',
    description: 'A test card',
    effects: [],
    cost: 1,
    rarity: 'common',
  },
  {
    id: 'card3',
    type: 'action',
    name: 'Test Card 3',
    description: 'A test card',
    effects: [],
    cost: 1,
    rarity: 'common',
  },
  {
    id: 'card4',
    type: 'action',
    name: 'Test Card 4',
    description: 'A test card',
    effects: [],
    cost: 1,
    rarity: 'common',
  },
  {
    id: 'card5',
    type: 'action',
    name: 'Test Card 5',
    description: 'A test card',
    effects: [],
    cost: 1,
    rarity: 'common',
  },
  {
    id: 'card6',
    type: 'action',
    name: 'Test Card 6',
    description: 'A test card',
    effects: [],
    cost: 1,
    rarity: 'common',
  },
  {
    id: 'card7',
    type: 'action',
    name: 'Test Card 7',
    description: 'A test card',
    effects: [],
    cost: 1,
    rarity: 'common',
  },
  {
    id: 'card8',
    type: 'action',
    name: 'Test Card 8',
    description: 'A test card',
    effects: [],
    cost: 1,
    rarity: 'common',
  },
];

describe('TurnManager', () => {
  let stateManager: GameStateManager;
  let turnManager: TurnManager;

  beforeEach(() => {
    stateManager = new GameStateManager({
      config: createTestConfig(),
      cardDefinitions: createTestCards(),
    });
    turnManager = new TurnManager({ stateManager });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should use default phases', () => {
      expect(turnManager.currentPhaseName).toBe('draw');
    });

    it('should use stateManager currentPlayerId', () => {
      stateManager.addPlayer('player1', 'Alice');

      expect(turnManager.currentPlayerId).toBe('player1');
    });

    it('should accept custom phases', () => {
      const customPhases: TurnPhaseConfig[] = [
        { name: 'main', autoAdvance: false },
        { name: 'end', autoAdvance: true },
      ];

      const customTurnManager = new TurnManager({
        stateManager,
        phases: customPhases,
      });

      expect(customTurnManager.currentPhaseName).toBe('main');
    });
  });

  describe('startGame', () => {
    it('should delegate to stateManager', () => {
      stateManager.addPlayer('player1', 'Alice');

      const result = turnManager.startGame();

      expect(result).toBe(true);
      expect(stateManager.phase).toBe('draw');
    });

    it('should return false with insufficient players', () => {
      const strictConfig = { ...createTestConfig(), minPlayers: 2 };
      const strictStateManager = new GameStateManager({
        config: strictConfig,
        cardDefinitions: createTestCards(),
      });
      strictStateManager.addPlayer('player1', 'Alice');

      const strictTurnManager = new TurnManager({ stateManager: strictStateManager });

      expect(strictTurnManager.startGame()).toBe(false);
    });
  });

  describe('advancePhase', () => {
    beforeEach(() => {
      stateManager.addPlayer('player1', 'Alice');
      stateManager.startGame();
    });

    it('should move to next phase', () => {
      // Start at draw phase (index 0)
      expect(turnManager.currentPhaseName).toBe('draw');

      turnManager.advancePhase();

      // Should be at main phase (index 1)
      expect(turnManager.currentPhaseName).toBe('main');
    });

    it('should end turn when all phases complete', () => {
      const turnEndedHandler = vi.fn();
      stateManager.events.on('turn_ended', turnEndedHandler);

      // Advance through all phases
      turnManager.advancePhase(); // draw -> main
      turnManager.advancePhase(); // main -> action
      turnManager.advancePhase(); // action -> resolve
      turnManager.advancePhase(); // resolve -> end
      turnManager.advancePhase(); // end -> next turn

      expect(turnEndedHandler).toHaveBeenCalled();
    });

    it('should not advance when paused', () => {
      turnManager.pause();
      const initialPhase = turnManager.currentPhaseName;

      turnManager.advancePhase();

      expect(turnManager.currentPhaseName).toBe(initialPhase);
    });
  });

  describe('skipToPhase', () => {
    beforeEach(() => {
      stateManager.addPlayer('player1', 'Alice');
      stateManager.startGame();
    });

    it('should skip to specified phase', () => {
      const result = turnManager.skipToPhase('action');

      expect(result).toBe(true);
      expect(turnManager.currentPhaseName).toBe('action');
    });

    it('should return false for invalid phase', () => {
      const result = turnManager.skipToPhase('invalid_phase' as any);

      expect(result).toBe(false);
    });
  });

  describe('endTurn', () => {
    beforeEach(() => {
      stateManager.addPlayer('player1', 'Alice');
      stateManager.addPlayer('player2', 'Bob');
      stateManager.startGame();
    });

    it('should end current turn and start new one', () => {
      const turnStartedHandler = vi.fn();
      stateManager.events.on('turn_started', turnStartedHandler);

      turnManager.endTurn();

      expect(turnStartedHandler).toHaveBeenCalled();
      expect(stateManager.currentPlayerId).toBe('player2');
    });

    it('should reset phase index to 0', () => {
      turnManager.advancePhase(); // Move to different phase
      turnManager.endTurn();

      expect(turnManager.currentPhaseName).toBe('draw');
    });
  });

  describe('pause/resume', () => {
    beforeEach(() => {
      stateManager.addPlayer('player1', 'Alice');
      stateManager.startGame();
    });

    it('should pause turn flow', () => {
      turnManager.pause();

      expect(turnManager.paused).toBe(true);
    });

    it('should resume turn flow', () => {
      turnManager.pause();
      turnManager.resume();

      expect(turnManager.paused).toBe(false);
    });
  });

  describe('phase callbacks', () => {
    it('should call onEnter when entering phase', async () => {
      const onEnter = vi.fn();
      const phases: TurnPhaseConfig[] = [
        { name: 'draw', autoAdvance: false },
        { name: 'main', autoAdvance: false, onEnter },
      ];

      const customManager = new TurnManager({
        stateManager,
        phases,
      });

      stateManager.addPlayer('player1', 'Alice');
      stateManager.startGame();

      customManager.advancePhase();

      // Give time for promise to resolve
      await new Promise((r) => setTimeout(r, 10));

      expect(onEnter).toHaveBeenCalled();
    });

    it('should call onExit when leaving phase', async () => {
      const onExit = vi.fn();
      const phases: TurnPhaseConfig[] = [
        { name: 'draw', autoAdvance: false, onExit },
        { name: 'main', autoAdvance: false },
      ];

      const customManager = new TurnManager({
        stateManager,
        phases,
      });

      stateManager.addPlayer('player1', 'Alice');
      stateManager.startGame();

      customManager.advancePhase();

      await new Promise((r) => setTimeout(r, 10));

      expect(onExit).toHaveBeenCalled();
    });
  });

  describe('auto-draw', () => {
    it('should auto-draw cards on turn start by default', () => {
      // Create a fresh stateManager and turnManager pair for this test
      const localStateManager = new GameStateManager({
        config: createTestConfig(),
        cardDefinitions: createTestCards(),
      });
      // TurnManager subscribes to events during construction
      new TurnManager({ stateManager: localStateManager });

      localStateManager.addPlayer('player1', 'Alice');
      localStateManager.startGame();

      const initialHandSize = localStateManager.getPlayerHand('player1')!.size;

      // End turn to trigger new turn (turnManager listens to turn_started event)
      localStateManager.endTurn();

      const newHandSize = localStateManager.getPlayerHand('player1')!.size;
      expect(newHandSize).toBe(initialHandSize + 1);
    });

    it('should respect custom draw count', () => {
      const localStateManager = new GameStateManager({
        config: createTestConfig(),
        cardDefinitions: createTestCards(),
      });
      new TurnManager({
        stateManager: localStateManager,
        drawCount: 2,
      });

      localStateManager.addPlayer('player1', 'Alice');
      localStateManager.startGame();

      const initialHandSize = localStateManager.getPlayerHand('player1')!.size;

      localStateManager.endTurn();

      const newHandSize = localStateManager.getPlayerHand('player1')!.size;
      expect(newHandSize).toBe(initialHandSize + 2);
    });

    it('should disable auto-draw when configured', () => {
      const localStateManager = new GameStateManager({
        config: createTestConfig(),
        cardDefinitions: createTestCards(),
      });
      new TurnManager({
        stateManager: localStateManager,
        autoDrawOnTurnStart: false,
      });

      localStateManager.addPlayer('player1', 'Alice');
      localStateManager.startGame();

      const initialHandSize = localStateManager.getPlayerHand('player1')!.size;

      localStateManager.endTurn();

      // Hand size should remain the same (no auto-draw)
      expect(localStateManager.getPlayerHand('player1')!.size).toBe(initialHandSize);
    });
  });

  describe('timed phases', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should auto-advance after duration expires', () => {
      const phases: TurnPhaseConfig[] = [
        { name: 'draw', autoAdvance: false },
        { name: 'main', autoAdvance: false, duration: 1000 },
        { name: 'end', autoAdvance: false },
      ];

      const timedManager = new TurnManager({
        stateManager,
        phases,
      });

      stateManager.addPlayer('player1', 'Alice');
      stateManager.startGame();

      timedManager.advancePhase(); // Go to 'main'
      expect(timedManager.currentPhaseName).toBe('main');

      vi.advanceTimersByTime(1000);

      expect(timedManager.currentPhaseName).toBe('end');
    });

    it('should clear timer when manually advancing', () => {
      const phases: TurnPhaseConfig[] = [
        { name: 'draw', autoAdvance: false },
        { name: 'main', autoAdvance: false, duration: 5000 },
        { name: 'action', autoAdvance: false },
        { name: 'end', autoAdvance: false },
      ];

      const timedManager = new TurnManager({
        stateManager,
        phases,
      });

      stateManager.addPlayer('player1', 'Alice');
      stateManager.startGame();

      timedManager.advancePhase(); // Go to 'main' with timer
      timedManager.advancePhase(); // Manually advance to 'action'

      // Timer should be cleared, advancing time should not change phase
      vi.advanceTimersByTime(5000);

      expect(timedManager.currentPhaseName).toBe('action');
    });
  });

  describe('checkAndEndGame', () => {
    beforeEach(() => {
      stateManager.addPlayer('player1', 'Alice');
      stateManager.startGame();
    });

    it('should end game when win condition met', () => {
      stateManager.setStat('player1', 'score', 100);

      const result = turnManager.checkAndEndGame();

      expect(result).toBe(true);
      expect(stateManager.phase).toBe('game_over');
    });

    it('should return false when no win condition met', () => {
      const result = turnManager.checkAndEndGame();

      expect(result).toBe(false);
      expect(stateManager.phase).not.toBe('game_over');
    });
  });

  describe('phase configuration', () => {
    it('should set phases', () => {
      const newPhases: TurnPhaseConfig[] = [
        { name: 'main', autoAdvance: false },
        { name: 'resolve', autoAdvance: true },
      ];

      turnManager.setPhases(newPhases);

      expect(turnManager.currentPhaseName).toBe('main');
    });

    it('should add phase at index', () => {
      turnManager.addPhase({ name: 'resolve', autoAdvance: false }, 1);

      stateManager.addPlayer('player1', 'Alice');
      stateManager.startGame();

      turnManager.advancePhase(); // draw -> resolve (new)

      expect(turnManager.currentPhaseName).toBe('resolve');
    });

    it('should add phase at end', () => {
      turnManager.addPhase({ name: 'resolve', autoAdvance: false });

      // Phase should be added to the end
      expect(turnManager.currentPhase.name).toBe('draw');
    });

    it('should remove phase', () => {
      const result = turnManager.removePhase('action');

      expect(result).toBe(true);
    });

    it('should return false when removing non-existent phase', () => {
      const result = turnManager.removePhase('nonexistent' as any);

      expect(result).toBe(false);
    });
  });

  describe('getStateManager', () => {
    it('should return the state manager', () => {
      expect(turnManager.getStateManager()).toBe(stateManager);
    });
  });
});
