import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DiceSystem, DiceConfig, DiceChallengeConfig, StandardDiceType } from './DiceSystem';
import { EventBus } from '../event/EventBus';
import { GameState } from '../types';

describe('DiceSystem', () => {
  let diceSystem: DiceSystem;
  let eventBus: EventBus;
  let gameState: GameState;

  beforeEach(() => {
    eventBus = new EventBus();
    diceSystem = new DiceSystem({ eventBus });

    gameState = {
      id: 'test-game',
      phase: 'main',
      turn: 1,
      currentPlayerId: 'player1',
      players: {
        player1: {
          id: 'player1',
          name: 'Test Player',
          stats: { performance: 50, health: 80, happiness: 60 },
          resources: { energy: 5, connections: 3, money: 10 },
          statuses: [],
          hand: [],
          deck: [],
          discardPile: [],
          playArea: [],
        },
      },
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
  });

  describe('roll()', () => {
    it('应该掷出标准d6骰子', () => {
      const config: DiceConfig = { type: 'd6', count: 1 };
      const result = diceSystem.roll(config);

      expect(result.diceType).toBe('d6');
      expect(result.rolls).toHaveLength(1);
      expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
      expect(result.rolls[0]).toBeLessThanOrEqual(6);
      expect(result.rawTotal).toBe(result.rolls[0]);
      expect(result.total).toBe(result.rawTotal);
    });

    it('应该掷出多个骰子', () => {
      const config: DiceConfig = { type: 'd6', count: 3 };
      const result = diceSystem.roll(config);

      expect(result.rolls).toHaveLength(3);
      result.rolls.forEach((roll) => {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
      });
      expect(result.rawTotal).toBe(result.rolls.reduce((sum, r) => sum + r, 0));
    });

    it('应该正确应用修正值', () => {
      const config: DiceConfig = { type: 'd6', count: 1, modifier: 5 };
      const result = diceSystem.roll(config);

      expect(result.modifier).toBe(5);
      expect(result.total).toBe(result.rawTotal + 5);
    });

    it('应该正确处理负修正值', () => {
      const config: DiceConfig = { type: 'd6', count: 1, modifier: -2 };
      const result = diceSystem.roll(config);

      expect(result.modifier).toBe(-2);
      expect(result.total).toBe(result.rawTotal - 2);
    });

    it('应该正确处理优势掷骰', () => {
      const config: DiceConfig = { type: 'd6', count: 1, advantage: 'advantage' };
      const result = diceSystem.roll(config);

      expect(result.advantageMode).toBe('advantage');
      expect(result.allRolls).toHaveLength(2);
      // 优势应该取两次掷骰中较高的结果
      const firstTotal = result.allRolls![0].reduce((sum, r) => sum + r, 0);
      const secondTotal = result.allRolls![1].reduce((sum, r) => sum + r, 0);
      expect(result.rawTotal).toBe(Math.max(firstTotal, secondTotal));
    });

    it('应该正确处理劣势掷骰', () => {
      const config: DiceConfig = { type: 'd6', count: 1, advantage: 'disadvantage' };
      const result = diceSystem.roll(config);

      expect(result.advantageMode).toBe('disadvantage');
      expect(result.allRolls).toHaveLength(2);
      // 劣势应该取两次掷骰中较低的结果
      const firstTotal = result.allRolls![0].reduce((sum, r) => sum + r, 0);
      const secondTotal = result.allRolls![1].reduce((sum, r) => sum + r, 0);
      expect(result.rawTotal).toBe(Math.min(firstTotal, secondTotal));
    });

    it('应该支持所有标准骰子类型', () => {
      const diceTypes: StandardDiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

      diceTypes.forEach((type) => {
        const config: DiceConfig = { type, count: 1 };
        const result = diceSystem.roll(config);

        expect(result.diceType).toBe(type);
        const faces = parseInt(type.substring(1), 10);
        expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
        expect(result.rolls[0]).toBeLessThanOrEqual(faces);
      });
    });

    it('应该正确检测d20暴击', () => {
      // 使用固定随机数生成器测试暴击
      const fixedDiceSystem = new DiceSystem({
        randomGenerator: () => 0.999, // 将产生最高面
      });

      const config: DiceConfig = { type: 'd20', count: 1 };
      const result = fixedDiceSystem.roll(config);

      expect(result.rolls[0]).toBe(20);
      expect(result.isCritical).toBe(true);
      expect(result.isFumble).toBe(false);
    });

    it('应该正确检测d20大失败', () => {
      // 使用固定随机数生成器测试大失败
      const fixedDiceSystem = new DiceSystem({
        randomGenerator: () => 0.0, // 将产生1
      });

      const config: DiceConfig = { type: 'd20', count: 1 };
      const result = fixedDiceSystem.roll(config);

      expect(result.rolls[0]).toBe(1);
      expect(result.isFumble).toBe(true);
      expect(result.isCritical).toBe(false);
    });

    it('应该支持自定义骰子面', () => {
      const config: DiceConfig = {
        type: 'custom',
        customFaces: [1, 2, 3, 4, 5, 6, 7, 8],
        count: 1,
      };
      const result = diceSystem.roll(config);

      expect(result.diceType).toBe('custom');
      expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
      expect(result.rolls[0]).toBeLessThanOrEqual(8);
    });
  });

  describe('executeChallenge()', () => {
    it('应该执行骰子挑战并判定成功', () => {
      // 使用固定随机数生成器确保成功
      const fixedDiceSystem = new DiceSystem({
        eventBus,
        randomGenerator: () => 0.999, // 产生高结果
      });

      const challenge: DiceChallengeConfig = {
        id: 'test-challenge',
        name: '测试挑战',
        description: '测试描述',
        diceConfig: { type: 'd20', count: 1 },
        difficultyClass: 15,
        successEffects: [
          { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 10 },
        ],
        failureEffects: [
          { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -5 },
        ],
      };

      const result = fixedDiceSystem.executeChallenge(challenge, 'player1', gameState);

      expect(result.result.total).toBe(20);
      expect(result.success).toBe(true);
      expect(result.triggeredEffects).toHaveLength(1);
      expect(result.triggeredEffects[0].type).toBe('modify_stat');
    });

    it('应该执行骰子挑战并判定失败', () => {
      // 使用固定随机数生成器确保失败
      const fixedDiceSystem = new DiceSystem({
        eventBus,
        randomGenerator: () => 0.0, // 产生低结果
      });

      const challenge: DiceChallengeConfig = {
        id: 'test-challenge',
        name: '测试挑战',
        description: '测试描述',
        diceConfig: { type: 'd20', count: 1 },
        difficultyClass: 15,
        successEffects: [
          { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: 10 },
        ],
        failureEffects: [
          { type: 'modify_stat', target: 'self', metadata: { stat: 'performance' }, value: -5 },
        ],
      };

      const result = fixedDiceSystem.executeChallenge(challenge, 'player1', gameState);

      expect(result.result.total).toBe(1);
      expect(result.success).toBe(false);
      expect(result.triggeredEffects).toHaveLength(1);
      expect(result.triggeredEffects[0].type).toBe('modify_stat');
      expect(result.triggeredEffects[0].value).toBe(-5);
    });

    it('应该使用结果映射而非简单成功/失败', () => {
      const fixedDiceSystem = new DiceSystem({
        eventBus,
        randomGenerator: () => 0.5, // 产生中等结果 (d6 = 4)
      });

      const challenge: DiceChallengeConfig = {
        id: 'test-challenge',
        name: '测试挑战',
        description: '测试描述',
        diceConfig: { type: 'd6', count: 1 },
        resultMappings: [
          {
            range: [1, 2],
            description: '失败',
            outcomeType: 'failure',
            effects: [
              { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: -10 },
            ],
          },
          {
            range: [3, 4],
            description: '部分成功',
            outcomeType: 'partial',
            effects: [
              { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 5 },
            ],
          },
          {
            range: [5, 6],
            description: '完全成功',
            outcomeType: 'success',
            effects: [
              { type: 'modify_stat', target: 'self', metadata: { stat: 'health' }, value: 15 },
            ],
          },
        ],
      };

      const result = fixedDiceSystem.executeChallenge(challenge, 'player1', gameState);

      expect(result.result.total).toBe(4);
      expect(result.selectedMapping?.description).toBe('部分成功');
    });
  });

  describe('rollForPlayer()', () => {
    it('应该为玩家掷骰并记录历史', () => {
      const config: DiceConfig = { type: 'd6', count: 1 };
      const result = diceSystem.rollForPlayer('player1', config, 1, 'card', 'test-card', gameState);

      expect(result.diceType).toBe('d6');

      const history = diceSystem.getPlayerHistory('player1');
      expect(history).toHaveLength(1);
      expect(history[0].playerId).toBe('player1');
      expect(history[0].source).toBe('card');
      expect(history[0].sourceId).toBe('test-card');
    });

    it('应该发出骰子掷出事件', () => {
      const eventSpy = vi.fn();
      eventBus.on('dice_rolled', eventSpy);

      const config: DiceConfig = { type: 'd6', count: 1 };
      diceSystem.rollForPlayer('player1', config, 1, 'card', 'test-card', gameState);

      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('getPlayerStats()', () => {
    it('应该正确计算玩家骰子统计', () => {
      // 掷几次骰子
      const config: DiceConfig = { type: 'd6', count: 1 };
      diceSystem.rollForPlayer('player1', config, 1, 'card', undefined, gameState);
      diceSystem.rollForPlayer('player1', config, 2, 'card', undefined, gameState);
      diceSystem.rollForPlayer('player1', config, 3, 'card', undefined, gameState);

      const stats = diceSystem.getPlayerStats('player1');

      expect(stats.totalRolls).toBe(3);
      expect(stats.averageResult).toBeGreaterThanOrEqual(1);
      expect(stats.averageResult).toBeLessThanOrEqual(6);
    });

    it('应该返回空统计如果玩家没有掷骰历史', () => {
      const stats = diceSystem.getPlayerStats('nonexistent');

      expect(stats.totalRolls).toBe(0);
      expect(stats.averageResult).toBe(0);
      expect(stats.criticals).toBe(0);
      expect(stats.fumbles).toBe(0);
    });
  });

  describe('history management', () => {
    it('应该限制历史记录大小', () => {
      const smallHistorySystem = new DiceSystem({
        maxHistorySize: 3,
      });

      const config: DiceConfig = { type: 'd6', count: 1 };

      for (let i = 0; i < 5; i++) {
        smallHistorySystem.rollForPlayer('player1', config, i + 1, 'card');
      }

      const history = smallHistorySystem.getHistory();
      expect(history).toHaveLength(3);
      // 应该保留最近的记录
      expect(history[0].turn).toBe(3);
      expect(history[2].turn).toBe(5);
    });

    it('应该正确重置历史', () => {
      const config: DiceConfig = { type: 'd6', count: 1 };
      diceSystem.rollForPlayer('player1', config, 1, 'card');
      diceSystem.rollForPlayer('player1', config, 2, 'card');

      diceSystem.reset();

      expect(diceSystem.getHistory()).toHaveLength(0);
    });
  });

  describe('static methods', () => {
    it('应该正确解析骰子表达式', () => {
      expect(DiceSystem.parseDiceExpression('2d6')).toEqual({
        type: 'd6',
        count: 2,
        modifier: 0,
      });

      expect(DiceSystem.parseDiceExpression('1d20+5')).toEqual({
        type: 'd20',
        count: 1,
        modifier: 5,
      });

      expect(DiceSystem.parseDiceExpression('3d8-2')).toEqual({
        type: 'd8',
        count: 3,
        modifier: -2,
      });

      expect(DiceSystem.parseDiceExpression('d6')).toEqual({
        type: 'd6',
        count: 1,
        modifier: 0,
      });
    });

    it('应该返回null对于无效表达式', () => {
      expect(DiceSystem.parseDiceExpression('invalid')).toBeNull();
      expect(DiceSystem.parseDiceExpression('2x6')).toBeNull();
    });

    it('应该正确计算期望值', () => {
      // 1d6 期望值 = 3.5
      expect(DiceSystem.calculateExpectedValue({ type: 'd6', count: 1 })).toBe(3.5);

      // 2d6 期望值 = 7
      expect(DiceSystem.calculateExpectedValue({ type: 'd6', count: 2 })).toBe(7);

      // 1d6+3 期望值 = 6.5
      expect(DiceSystem.calculateExpectedValue({ type: 'd6', count: 1, modifier: 3 })).toBe(6.5);

      // 1d20 期望值 = 10.5
      expect(DiceSystem.calculateExpectedValue({ type: 'd20', count: 1 })).toBe(10.5);
    });

    it('应该正确计算结果范围', () => {
      // 1d6: min=1, max=6
      expect(DiceSystem.calculateRange({ type: 'd6', count: 1 })).toEqual({ min: 1, max: 6 });

      // 2d6: min=2, max=12
      expect(DiceSystem.calculateRange({ type: 'd6', count: 2 })).toEqual({ min: 2, max: 12 });

      // 2d6+3: min=5, max=15
      expect(DiceSystem.calculateRange({ type: 'd6', count: 2, modifier: 3 })).toEqual({
        min: 5,
        max: 15,
      });

      // 1d20-5: min=-4, max=15
      expect(DiceSystem.calculateRange({ type: 'd20', count: 1, modifier: -5 })).toEqual({
        min: -4,
        max: 15,
      });
    });
  });

  describe('event emission', () => {
    it('应该在暴击时发出dice_critical事件', () => {
      const criticalSpy = vi.fn();
      eventBus.on('dice_critical', criticalSpy);

      const fixedDiceSystem = new DiceSystem({
        eventBus,
        randomGenerator: () => 0.999, // 产生20
      });

      const config: DiceConfig = { type: 'd20', count: 1 };
      fixedDiceSystem.rollForPlayer('player1', config, 1, 'card', undefined, gameState);

      expect(criticalSpy).toHaveBeenCalled();
    });

    it('应该在大失败时发出dice_fumble事件', () => {
      const fumbleSpy = vi.fn();
      eventBus.on('dice_fumble', fumbleSpy);

      const fixedDiceSystem = new DiceSystem({
        eventBus,
        randomGenerator: () => 0.0, // 产生1
      });

      const config: DiceConfig = { type: 'd20', count: 1 };
      fixedDiceSystem.rollForPlayer('player1', config, 1, 'card', undefined, gameState);

      expect(fumbleSpy).toHaveBeenCalled();
    });
  });
});
