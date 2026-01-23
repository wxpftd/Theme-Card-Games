import { describe, it, expect, beforeEach } from 'vitest';
import { DeckBuilder } from './DeckBuilder';
import { DeckValidator } from './DeckValidator';
import type { CardDefinition, CardDefinitionV2, DeckDefinition } from '../types';

// 测试用卡牌定义
const testCards: CardDefinitionV2[] = [
  {
    id: 'card_common_1',
    type: 'action',
    name: '普通卡1',
    description: '测试普通卡',
    series: 'work',
    effects: [],
    cost: 1,
    rarity: 'common',
    tags: ['test', 'work'],
  },
  {
    id: 'card_common_2',
    type: 'action',
    name: '普通卡2',
    description: '测试普通卡',
    series: 'work',
    effects: [],
    cost: 1,
    rarity: 'common',
    tags: ['test', 'work'],
  },
  {
    id: 'card_uncommon_1',
    type: 'action',
    name: '非凡卡1',
    description: '测试非凡卡',
    series: 'health',
    effects: [],
    cost: 2,
    rarity: 'uncommon',
    tags: ['test', 'health'],
  },
  {
    id: 'card_rare_1',
    type: 'action',
    name: '稀有卡1',
    description: '测试稀有卡',
    series: 'growth',
    effects: [],
    cost: 3,
    rarity: 'rare',
    tags: ['test', 'growth'],
  },
  {
    id: 'card_legendary_1',
    type: 'event',
    name: '传奇卡1',
    description: '测试传奇卡',
    series: 'accident',
    effects: [],
    cost: 0,
    rarity: 'legendary',
    tags: ['test', 'legendary'],
  },
];

describe('DeckBuilder', () => {
  let builder: DeckBuilder;

  beforeEach(() => {
    builder = new DeckBuilder({
      cardDefinitions: testCards,
    });
  });

  describe('createEmptyDeck', () => {
    it('应该创建一个空卡组', () => {
      const deck = builder.createEmptyDeck('测试卡组', '测试描述');
      expect(deck.name).toBe('测试卡组');
      expect(deck.description).toBe('测试描述');
      expect(deck.cards).toHaveLength(0);
      expect(deck.isPrebuilt).toBe(false);
    });
  });

  describe('addCard', () => {
    it('应该成功添加卡牌', () => {
      const result = builder.addCard('card_common_1', 2);
      expect(result).toBe(true);
      expect(builder.getCardCount('card_common_1')).toBe(2);
    });

    it('应该拒绝添加不存在的卡牌', () => {
      const result = builder.addCard('nonexistent_card', 1);
      expect(result).toBe(false);
    });

    it('应该拒绝超过最大数量的卡牌', () => {
      builder.addCard('card_common_1', 3);
      const result = builder.addCard('card_common_1', 1);
      expect(result).toBe(false);
      expect(builder.getCardCount('card_common_1')).toBe(3);
    });

    it('应该累加已存在卡牌的数量', () => {
      builder.addCard('card_common_1', 1);
      builder.addCard('card_common_1', 2);
      expect(builder.getCardCount('card_common_1')).toBe(3);
    });
  });

  describe('removeCard', () => {
    it('应该成功移除卡牌', () => {
      builder.addCard('card_common_1', 3);
      const result = builder.removeCard('card_common_1', 1);
      expect(result).toBe(true);
      expect(builder.getCardCount('card_common_1')).toBe(2);
    });

    it('应该完全移除数量为0的卡牌', () => {
      builder.addCard('card_common_1', 1);
      builder.removeCard('card_common_1', 1);
      expect(builder.getCardCount('card_common_1')).toBe(0);
    });

    it('应该拒绝移除不存在的卡牌', () => {
      const result = builder.removeCard('nonexistent_card', 1);
      expect(result).toBe(false);
    });
  });

  describe('setCardCount', () => {
    it('应该设置卡牌数量', () => {
      builder.setCardCount('card_common_1', 2);
      expect(builder.getCardCount('card_common_1')).toBe(2);
    });

    it('应该移除数量为0的卡牌', () => {
      builder.addCard('card_common_1', 2);
      builder.setCardCount('card_common_1', 0);
      expect(builder.getCardCount('card_common_1')).toBe(0);
    });
  });

  describe('getTotalCards', () => {
    it('应该正确计算总卡牌数', () => {
      builder.addCard('card_common_1', 3);
      builder.addCard('card_common_2', 2);
      builder.addCard('card_rare_1', 1);
      expect(builder.getTotalCards()).toBe(6);
    });
  });

  describe('searchCards', () => {
    it('应该按名称搜索卡牌', () => {
      const results = builder.searchCards('普通');
      expect(results).toHaveLength(2);
    });

    it('应该按标签搜索卡牌', () => {
      const results = builder.searchCards('legendary');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('card_legendary_1');
    });
  });

  describe('getCardsBySeries', () => {
    it('应该按系列过滤卡牌', () => {
      const workCards = builder.getCardsBySeries('work');
      expect(workCards).toHaveLength(2);
    });
  });

  describe('getCardsByRarity', () => {
    it('应该按稀有度过滤卡牌', () => {
      const rareCards = builder.getCardsByRarity('rare');
      expect(rareCards).toHaveLength(1);
    });
  });

  describe('exportDeck / importDeck', () => {
    it('应该正确导出和导入卡组', () => {
      builder.setName('导出测试');
      builder.setDescription('测试描述');
      builder.addCard('card_common_1', 3);
      builder.addCard('card_rare_1', 1);

      const exported = builder.exportDeck();
      expect(exported).toBeTruthy();

      // 创建新的 builder 来导入
      const newBuilder = new DeckBuilder({ cardDefinitions: testCards });
      const result = newBuilder.importDeck(exported);
      expect(result).toBe(true);

      const importedDeck = newBuilder.getCurrentDeck();
      expect(importedDeck.name).toBe('导出测试');
      expect(importedDeck.description).toBe('测试描述');
      expect(newBuilder.getCardCount('card_common_1')).toBe(3);
      expect(newBuilder.getCardCount('card_rare_1')).toBe(1);
    });

    it('应该拒绝无效的导入字符串', () => {
      const result = builder.importDeck('invalid_base64');
      expect(result).toBe(false);
    });
  });
});

describe('DeckValidator', () => {
  let validator: DeckValidator;
  const cardMap = new Map(testCards.map((c) => [c.id, c]));

  beforeEach(() => {
    validator = new DeckValidator({
      cardDefinitions: cardMap,
    });
  });

  describe('validate', () => {
    it('应该验证卡组大小不足', () => {
      const deck: DeckDefinition = {
        id: 'test',
        name: '测试卡组',
        description: '',
        cards: [{ cardId: 'card_common_1', count: 3 }],
      };

      const result = validator.validate(deck);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === 'deck_too_small')).toBe(true);
    });

    it('应该验证单卡数量超限', () => {
      const deck: DeckDefinition = {
        id: 'test',
        name: '测试卡组',
        description: '',
        cards: [{ cardId: 'card_common_1', count: 5 }],
      };

      const result = validator.validate(deck);
      expect(result.errors.some((e) => e.type === 'card_over_limit')).toBe(true);
    });

    it('应该验证传奇卡数量超限', () => {
      const deck: DeckDefinition = {
        id: 'test',
        name: '测试卡组',
        description: '',
        cards: [
          { cardId: 'card_legendary_1', count: 3 },
          { cardId: 'card_common_1', count: 3 },
          { cardId: 'card_common_2', count: 3 },
        ],
      };

      // 默认传奇卡限制是3张，这里刚好
      const result = validator.validate(deck);
      expect(result.errors.some((e) => e.type === 'rarity_over_limit')).toBe(false);
    });

    it('应该统计系列分布', () => {
      const deck: DeckDefinition = {
        id: 'test',
        name: '测试卡组',
        description: '',
        cards: [
          { cardId: 'card_common_1', count: 3 },
          { cardId: 'card_common_2', count: 3 },
          { cardId: 'card_uncommon_1', count: 2 },
        ],
      };

      const result = validator.validate(deck);
      expect(result.seriesDistribution.work).toBe(6);
      expect(result.seriesDistribution.health).toBe(2);
    });

    it('应该检测不存在的卡牌', () => {
      const deck: DeckDefinition = {
        id: 'test',
        name: '测试卡组',
        description: '',
        cards: [{ cardId: 'nonexistent_card', count: 1 }],
      };

      const result = validator.validate(deck);
      expect(result.errors.some((e) => e.type === 'card_not_found')).toBe(true);
    });
  });
});
