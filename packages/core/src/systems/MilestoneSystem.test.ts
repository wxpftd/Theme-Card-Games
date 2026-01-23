import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MilestoneSystem } from './MilestoneSystem';
import { EffectResolver } from '../card/EffectResolver';
import { EventBus } from '../event/EventBus';
import { MilestoneWinConfig, MilestoneDefinition, GameState, PlayerState } from '../types';

describe('MilestoneSystem', () => {
  let milestoneSystem: MilestoneSystem;
  let effectResolver: EffectResolver;
  let eventBus: EventBus;
  let gameState: GameState;
  let player: PlayerState;

  const mockMilestones: MilestoneDefinition[] = [
    {
      id: 'p5',
      name: 'P5 初级工程师',
      description: '起始职级',
      icon: '🌱',
      order: 1,
      requirements: [],
    },
    {
      id: 'p6',
      name: 'P6 工程师',
      description: '独立完成任务',
      icon: '💼',
      order: 2,
      requirements: [
        { type: 'previous_milestone', milestoneId: 'p5' },
        { type: 'stat_threshold', stat: 'performance', operator: '>=', value: 60 },
      ],
      rewards: [
        { type: 'gain_resource', target: 'self', metadata: { resource: 'money' }, value: 2 },
      ],
      unlockMessage: '恭喜晋升 P6！',
    },
    {
      id: 'p7',
      name: 'P7 高级工程师',
      description: '技术骨干',
      icon: '⭐',
      order: 3,
      requirements: [
        { type: 'previous_milestone', milestoneId: 'p6' },
        { type: 'stat_threshold', stat: 'performance', operator: '>=', value: 80 },
        { type: 'resource_threshold', resource: 'connections', operator: '>=', value: 5 },
      ],
      unlockMessage: '晋升 P7！',
    },
    {
      id: 'p8',
      name: 'P8 技术专家',
      description: '最终目标',
      icon: '👑',
      order: 4,
      requirements: [
        { type: 'previous_milestone', milestoneId: 'p7' },
        { type: 'stat_threshold', stat: 'performance', operator: '>=', value: 95 },
      ],
      unlockMessage: '恭喜晋升 P8！胜利！',
    },
  ];

  const mockConfig: MilestoneWinConfig = {
    milestones: mockMilestones,
    finalMilestoneId: 'p8',
    failureConditions: [
      {
        type: 'stat_zero',
        target: 'health',
        message: '健康值归零，游戏失败',
      },
    ],
  };

  beforeEach(() => {
    effectResolver = new EffectResolver();
    eventBus = new EventBus();

    milestoneSystem = new MilestoneSystem({
      milestoneConfig: mockConfig,
      effectResolver,
      eventBus,
    });

    player = {
      id: 'player1',
      name: 'Test Player',
      stats: { performance: 50, health: 80, influence: 10 },
      resources: { money: 2, energy: 5, connections: 3 },
      statuses: [],
      hand: [],
      deck: [],
      discardPile: [],
      playArea: [],
    };

    gameState = {
      id: 'test-game',
      phase: 'main',
      turn: 1,
      currentPlayerId: 'player1',
      players: { player1: player },
      sharedState: {},
      history: [],
      config: {
        maxPlayers: 4,
        minPlayers: 1,
        initialHandSize: 5,
        maxHandSize: 10,
        winConditions: [],
        initialStats: {},
        initialResources: {},
      },
    };

    milestoneSystem.initializePlayer('player1', player);
  });

  describe('initialization', () => {
    it('should initialize player milestone state', () => {
      expect(player.milestoneState).toBeDefined();
      expect(player.milestoneState?.currentMilestoneId).toBe('p5');
      expect(player.milestoneState?.achievedMilestones).toEqual([]);
    });

    it('should initialize progress for all milestones', () => {
      expect(player.milestoneState?.progress['p5']).toBeDefined();
      expect(player.milestoneState?.progress['p6']).toBeDefined();
      expect(player.milestoneState?.progress['p7']).toBeDefined();
      expect(player.milestoneState?.progress['p8']).toBeDefined();
    });
  });

  describe('milestone progression', () => {
    it('should achieve P5 immediately (no requirements)', () => {
      const result = milestoneSystem.updateProgress(player, gameState);

      expect(result.newlyAchievedMilestones.length).toBe(1);
      expect(result.newlyAchievedMilestones[0].id).toBe('p5');
      expect(player.milestoneState?.achievedMilestones).toContain('p5');
      expect(player.milestoneState?.currentMilestoneId).toBe('p6');
    });

    it('should achieve P6 when requirements are met', () => {
      // First achieve P5
      milestoneSystem.updateProgress(player, gameState);

      // Set performance to meet P6 requirement
      player.stats.performance = 60;

      const result = milestoneSystem.updateProgress(player, gameState);

      expect(result.newlyAchievedMilestones.some((m) => m.id === 'p6')).toBe(true);
      expect(player.milestoneState?.achievedMilestones).toContain('p6');
      expect(player.milestoneState?.currentMilestoneId).toBe('p7');
    });

    it('should not achieve P6 if performance is too low', () => {
      // First achieve P5
      milestoneSystem.updateProgress(player, gameState);

      // Performance is still 50, below 60 threshold
      const result = milestoneSystem.updateProgress(player, gameState);

      expect(result.newlyAchievedMilestones.some((m) => m.id === 'p6')).toBe(false);
      expect(player.milestoneState?.currentMilestoneId).toBe('p6');
    });

    it('should require all conditions to be met for P7', () => {
      // Achieve P5 and P6
      player.stats.performance = 60;
      milestoneSystem.updateProgress(player, gameState);

      // Set performance high but connections low
      player.stats.performance = 80;
      player.resources.connections = 3; // need 5

      let result = milestoneSystem.updateProgress(player, gameState);
      expect(result.newlyAchievedMilestones.some((m) => m.id === 'p7')).toBe(false);

      // Now set connections high enough
      player.resources.connections = 5;
      result = milestoneSystem.updateProgress(player, gameState);
      expect(result.newlyAchievedMilestones.some((m) => m.id === 'p7')).toBe(true);
    });
  });

  describe('victory condition', () => {
    it('should return victory when final milestone is achieved', () => {
      // Set up player to meet all requirements
      player.stats.performance = 95;
      player.resources.connections = 5;

      // Progress through all milestones
      const result = milestoneSystem.updateProgress(player, gameState);

      // Should have achieved P5, P6, P7, P8
      expect(result.isVictory).toBe(true);
      expect(result.reason).toContain('P8');
    });
  });

  describe('failure condition', () => {
    it('should return failure when health reaches zero', () => {
      player.stats.health = 0;

      const result = milestoneSystem.updateProgress(player, gameState);

      expect(result.isFailure).toBe(true);
      expect(result.reason).toBe('健康值归零，游戏失败');
    });

    it('should not return failure when health is above zero', () => {
      player.stats.health = 10;

      const result = milestoneSystem.updateProgress(player, gameState);

      expect(result.isFailure).toBe(false);
    });
  });

  describe('rewards', () => {
    it('should apply rewards when milestone is achieved', () => {
      // Achieve P5 first
      milestoneSystem.updateProgress(player, gameState);

      // Set up for P6
      player.stats.performance = 60;

      const result = milestoneSystem.updateProgress(player, gameState);

      expect(result.rewardEffects.length).toBeGreaterThan(0);
    });
  });

  describe('events', () => {
    it('should emit milestone_achieved event', () => {
      const handler = vi.fn();
      eventBus.on('milestone_achieved', handler);

      milestoneSystem.updateProgress(player, gameState);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'milestone_achieved',
          data: expect.objectContaining({
            playerId: 'player1',
            milestone: expect.objectContaining({ id: 'p5' }),
          }),
        }),
        expect.anything()
      );
    });

    it('should emit milestone_progress_updated event', () => {
      const handler = vi.fn();
      eventBus.on('milestone_progress_updated', handler);

      milestoneSystem.updateProgress(player, gameState);

      expect(handler).toHaveBeenCalled();
    });

    it('should emit milestone_failure event on failure', () => {
      const handler = vi.fn();
      eventBus.on('milestone_failure', handler);

      player.stats.health = 0;
      milestoneSystem.updateProgress(player, gameState);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'milestone_failure',
          data: expect.objectContaining({
            playerId: 'player1',
            reason: '健康值归零，游戏失败',
          }),
        }),
        expect.anything()
      );
    });
  });

  describe('getProgressSummary', () => {
    it('should return correct progress summary', () => {
      // Achieve P5
      milestoneSystem.updateProgress(player, gameState);

      const summary = milestoneSystem.getProgressSummary(player);

      expect(summary.current?.id).toBe('p6');
      expect(summary.achieved.length).toBe(1);
      expect(summary.achieved[0].id).toBe('p5');
      expect(summary.remaining.length).toBe(3); // p6, p7, p8
      expect(summary.progress).toBe(25); // 1/4 = 25%
    });
  });

  describe('getAllMilestones', () => {
    it('should return milestones sorted by order', () => {
      const milestones = milestoneSystem.getAllMilestones();

      expect(milestones.length).toBe(4);
      expect(milestones[0].id).toBe('p5');
      expect(milestones[1].id).toBe('p6');
      expect(milestones[2].id).toBe('p7');
      expect(milestones[3].id).toBe('p8');
    });
  });

  describe('custom checkers', () => {
    it('should use custom checker for requirements', () => {
      const customChecker = vi.fn().mockReturnValue(true);

      const customMilestones: MilestoneDefinition[] = [
        {
          id: 'custom_milestone',
          name: 'Custom Milestone',
          description: 'Uses custom checker',
          order: 1,
          requirements: [{ type: 'custom', checkerId: 'my_checker' }],
        },
      ];

      const customConfig: MilestoneWinConfig = {
        milestones: customMilestones,
        finalMilestoneId: 'custom_milestone',
      };

      const customSystem = new MilestoneSystem({
        milestoneConfig: customConfig,
        effectResolver,
        eventBus,
        customCheckers: { my_checker: customChecker },
      });

      customSystem.initializePlayer('player1', player);
      customSystem.updateProgress(player, gameState);

      expect(customChecker).toHaveBeenCalledWith('player1', gameState);
    });
  });
});
