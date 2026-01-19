import { GamePhase, GameState } from '../types';
import { GameStateManager } from '../state';
import { EventBus } from '../event';

export interface TurnPhaseConfig {
  name: GamePhase;
  onEnter?: (manager: TurnManager) => void | Promise<void>;
  onExit?: (manager: TurnManager) => void | Promise<void>;
  autoAdvance?: boolean;
  duration?: number; // milliseconds, for timed phases
}

export interface TurnManagerOptions {
  stateManager: GameStateManager;
  phases?: TurnPhaseConfig[];
  autoDrawOnTurnStart?: boolean;
  drawCount?: number;
}

/**
 * TurnManager handles turn flow and phase transitions
 */
export class TurnManager {
  private stateManager: GameStateManager;
  private phases: TurnPhaseConfig[];
  private currentPhaseIndex: number = 0;
  private autoDrawOnTurnStart: boolean;
  private drawCount: number;
  private phaseTimer: ReturnType<typeof setTimeout> | null = null;
  private isPaused: boolean = false;

  constructor(options: TurnManagerOptions) {
    this.stateManager = options.stateManager;
    this.autoDrawOnTurnStart = options.autoDrawOnTurnStart ?? true;
    this.drawCount = options.drawCount ?? 1;

    // Default phases
    this.phases = options.phases ?? [
      { name: 'draw', autoAdvance: true },
      { name: 'main', autoAdvance: false },
      { name: 'action', autoAdvance: false },
      { name: 'resolve', autoAdvance: true },
      { name: 'end', autoAdvance: true },
    ];

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const events = this.stateManager.events;

    events.on('turn_started', (event) => {
      this.onTurnStart();
    });

    events.on('phase_changed', (event) => {
      this.onPhaseChanged(event.data.to as GamePhase);
    });
  }

  /**
   * Get the current phase configuration
   */
  get currentPhase(): TurnPhaseConfig {
    return this.phases[this.currentPhaseIndex];
  }

  /**
   * Get the current phase name
   */
  get currentPhaseName(): GamePhase {
    return this.currentPhase.name;
  }

  /**
   * Get the current player ID
   */
  get currentPlayerId(): string {
    return this.stateManager.currentPlayerId;
  }

  /**
   * Start the game
   */
  startGame(): boolean {
    return this.stateManager.startGame();
  }

  /**
   * Advance to the next phase
   */
  advancePhase(): void {
    if (this.isPaused) return;

    this.clearPhaseTimer();

    // Execute onExit for current phase
    const currentConfig = this.currentPhase;
    if (currentConfig.onExit) {
      Promise.resolve(currentConfig.onExit(this));
    }

    // Move to next phase
    this.currentPhaseIndex = (this.currentPhaseIndex + 1) % this.phases.length;

    // If we've completed all phases, end turn
    if (this.currentPhaseIndex === 0) {
      this.stateManager.endTurn();
      return;
    }

    // Set the new phase
    this.stateManager.setPhase(this.currentPhase.name);
  }

  /**
   * Skip to a specific phase
   */
  skipToPhase(phaseName: GamePhase): boolean {
    const phaseIndex = this.phases.findIndex(p => p.name === phaseName);
    if (phaseIndex === -1) return false;

    this.clearPhaseTimer();

    // Execute onExit for current phase
    if (this.currentPhase.onExit) {
      Promise.resolve(this.currentPhase.onExit(this));
    }

    this.currentPhaseIndex = phaseIndex;
    this.stateManager.setPhase(phaseName);

    return true;
  }

  /**
   * End the current turn
   */
  endTurn(): void {
    this.clearPhaseTimer();
    this.currentPhaseIndex = 0;
    this.stateManager.endTurn();
  }

  /**
   * Pause the turn flow
   */
  pause(): void {
    this.isPaused = true;
    this.clearPhaseTimer();
  }

  /**
   * Resume the turn flow
   */
  resume(): void {
    this.isPaused = false;
    this.onPhaseChanged(this.currentPhaseName);
  }

  /**
   * Check if game is paused
   */
  get paused(): boolean {
    return this.isPaused;
  }

  /**
   * Handle turn start
   */
  private onTurnStart(): void {
    this.currentPhaseIndex = 0;

    // Auto-draw cards at turn start
    if (this.autoDrawOnTurnStart) {
      this.stateManager.drawCards(this.currentPlayerId, this.drawCount);
    }
  }

  /**
   * Handle phase change
   */
  private onPhaseChanged(phase: GamePhase): void {
    const config = this.phases.find(p => p.name === phase);
    if (!config) return;

    // Execute onEnter
    if (config.onEnter) {
      Promise.resolve(config.onEnter(this));
    }

    // Set up auto-advance timer if configured
    if (config.duration) {
      this.phaseTimer = setTimeout(() => {
        this.advancePhase();
      }, config.duration);
    }

    // Auto-advance if configured
    if (config.autoAdvance && !config.duration) {
      // Use microtask to allow event handlers to run first
      queueMicrotask(() => {
        if (!this.isPaused) {
          this.advancePhase();
        }
      });
    }
  }

  /**
   * Clear the phase timer
   */
  private clearPhaseTimer(): void {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
  }

  /**
   * Get the state manager
   */
  getStateManager(): GameStateManager {
    return this.stateManager;
  }

  /**
   * Check win conditions and end game if met
   */
  checkAndEndGame(): boolean {
    const { winner, reason } = this.stateManager.checkWinConditions();
    if (winner) {
      this.stateManager.endGame(winner, reason ?? 'Win condition met');
      return true;
    }
    return false;
  }

  /**
   * Configure phases
   */
  setPhases(phases: TurnPhaseConfig[]): void {
    this.phases = phases;
    this.currentPhaseIndex = 0;
  }

  /**
   * Add a phase
   */
  addPhase(phase: TurnPhaseConfig, index?: number): void {
    if (index !== undefined) {
      this.phases.splice(index, 0, phase);
    } else {
      this.phases.push(phase);
    }
  }

  /**
   * Remove a phase
   */
  removePhase(phaseName: GamePhase): boolean {
    const index = this.phases.findIndex(p => p.name === phaseName);
    if (index === -1) return false;

    this.phases.splice(index, 1);
    if (this.currentPhaseIndex >= this.phases.length) {
      this.currentPhaseIndex = 0;
    }
    return true;
  }
}
