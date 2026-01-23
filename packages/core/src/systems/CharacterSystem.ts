/**
 * CharacterSystem - 角色系统
 * 管理角色选择、属性应用、被动/主动技能
 */

import {
  CharacterDefinition,
  PlayerState,
  PlayerCharacterState,
  GameState,
  CardEffect,
  ResolvedEffect,
  PassiveTrigger,
  PassiveAbility,
  ActiveAbility,
  CardDefinition,
} from '../types';
import { EventBus } from '../event';
import { EffectResolver, EffectContext } from '../card/EffectResolver';
import { Deck, Card } from '../card';

export interface CharacterSystemOptions {
  /** 角色定义列表 */
  characterDefinitions: CharacterDefinition[];
  /** 卡牌定义映射 */
  cardDefinitions: Map<string, CardDefinition>;
  /** 效果解析器 */
  effectResolver: EffectResolver;
  /** 事件总线 */
  eventBus: EventBus;
  /** 自定义被动处理器 */
  customPassiveHandlers?: Record<string, (playerId: string, state: GameState) => void>;
}

/**
 * 角色系统
 */
export class CharacterSystem {
  private characters: Map<string, CharacterDefinition> = new Map();
  private cardDefinitions: Map<string, CardDefinition>;
  private effectResolver: EffectResolver;
  private eventBus: EventBus;
  private customPassiveHandlers: Record<string, (playerId: string, state: GameState) => void>;

  /** 玩家角色选择状态 (玩家ID -> 角色ID) */
  private playerCharacters: Map<string, string> = new Map();

  /** 取消订阅函数 */
  private unsubscribers: (() => void)[] = [];

  constructor(options: CharacterSystemOptions) {
    this.cardDefinitions = options.cardDefinitions;
    this.effectResolver = options.effectResolver;
    this.eventBus = options.eventBus;
    this.customPassiveHandlers = options.customPassiveHandlers ?? {};

    // 注册角色定义
    for (const char of options.characterDefinitions) {
      this.characters.set(char.id, char);
    }

    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听回合开始事件，触发 turn_start 被动
    this.unsubscribers.push(
      this.eventBus.on('turn_started', (event) => {
        const playerId = event.data.playerId as string;
        const gameState = event.data as unknown as GameState;
        this.processPassiveTrigger(playerId, 'turn_start', gameState);
      })
    );

    // 监听回合结束事件，触发 turn_end 被动
    this.unsubscribers.push(
      this.eventBus.on('turn_ended', (event) => {
        const playerId = event.data.playerId as string;
        const gameState = event.data as unknown as GameState;
        this.processPassiveTrigger(playerId, 'turn_end', gameState);
      })
    );

    // 监听卡牌打出事件
    this.unsubscribers.push(
      this.eventBus.on('card_played', (event) => {
        const playerId = event.data.playerId as string;
        const gameState = event.data as unknown as GameState;
        this.processPassiveTrigger(playerId, 'card_played', gameState, event.data);
      })
    );

    // 监听抽牌事件
    this.unsubscribers.push(
      this.eventBus.on('card_drawn', (event) => {
        const playerId = event.data.playerId as string;
        const gameState = event.data as unknown as GameState;
        this.processPassiveTrigger(playerId, 'card_drawn', gameState, event.data);
      })
    );

    // 监听属性变化事件
    this.unsubscribers.push(
      this.eventBus.on('stat_changed', (event) => {
        const playerId = event.data.playerId as string;
        const gameState = event.data as unknown as GameState;
        this.processPassiveTrigger(playerId, 'stat_changed', gameState, event.data);
      })
    );

    // 监听资源变化事件
    this.unsubscribers.push(
      this.eventBus.on('resource_changed', (event) => {
        const playerId = event.data.playerId as string;
        const gameState = event.data as unknown as GameState;
        this.processPassiveTrigger(playerId, 'resource_changed', gameState, event.data);
      })
    );

    // 监听状态应用事件
    this.unsubscribers.push(
      this.eventBus.on('status_applied', (event) => {
        const playerId = event.data.playerId as string;
        const gameState = event.data as unknown as GameState;
        this.processPassiveTrigger(playerId, 'status_applied', gameState, event.data);
      })
    );

    // 监听状态移除事件
    this.unsubscribers.push(
      this.eventBus.on('status_removed', (event) => {
        const playerId = event.data.playerId as string;
        const gameState = event.data as unknown as GameState;
        this.processPassiveTrigger(playerId, 'status_removed', gameState, event.data);
      })
    );
  }

  // ============================================================================
  // 角色选择
  // ============================================================================

  /**
   * 为玩家选择角色
   */
  selectCharacter(
    playerId: string,
    characterId: string,
    player: PlayerState,
    gameState: GameState
  ): boolean {
    const character = this.characters.get(characterId);
    if (!character) {
      console.warn(`Character not found: ${characterId}`);
      return false;
    }

    // 检查角色是否已被其他玩家选择
    for (const [pId, cId] of this.playerCharacters.entries()) {
      if (pId !== playerId && cId === characterId) {
        console.warn(`Character ${characterId} already selected by player ${pId}`);
        return false;
      }
    }

    // 记录选择
    this.playerCharacters.set(playerId, characterId);

    // 初始化玩家角色状态
    const characterState: PlayerCharacterState = {
      characterId,
      activeAbilityUsesRemaining: character.activeAbility?.maxUsesPerGame ?? 0,
      activeAbilityCooldownRemaining: 0,
      passiveAbilityTriggerCounts: {},
    };

    player.character = characterState;

    // 发送角色选择事件
    this.eventBus.emitSimple(
      'character_selected',
      {
        playerId,
        characterId,
        characterName: character.name,
      },
      gameState
    );

    return true;
  }

  /**
   * 获取玩家的角色定义
   */
  getPlayerCharacter(playerId: string): CharacterDefinition | null {
    const characterId = this.playerCharacters.get(playerId);
    if (!characterId) return null;
    return this.characters.get(characterId) ?? null;
  }

  /**
   * 获取已被选择的角色 ID 列表
   */
  getSelectedCharacterIds(): string[] {
    return Array.from(this.playerCharacters.values());
  }

  /**
   * 获取可用角色列表 (排除已被选择的)
   */
  getAvailableCharacters(excludePlayerId?: string): CharacterDefinition[] {
    const selectedIds = new Set(
      Array.from(this.playerCharacters.entries())
        .filter(([pId]) => pId !== excludePlayerId)
        .map(([, cId]) => cId)
    );

    return Array.from(this.characters.values()).filter((c) => !selectedIds.has(c.id));
  }

  // ============================================================================
  // 属性应用
  // ============================================================================

  /**
   * 应用角色的初始属性修正
   */
  applyCharacterStats(playerId: string, player: PlayerState): void {
    const character = this.getPlayerCharacter(playerId);
    if (!character) return;

    // 应用属性修正
    for (const [statId, modifier] of Object.entries(character.statModifiers)) {
      if (player.stats[statId] !== undefined) {
        player.stats[statId] += modifier;
      }
    }

    // 应用资源修正
    for (const [resourceId, modifier] of Object.entries(character.resourceModifiers)) {
      if (player.resources[resourceId] !== undefined) {
        player.resources[resourceId] += modifier;
      }
    }
  }

  /**
   * 获取角色的专属卡牌定义
   */
  getExclusiveCards(characterId: string): CardDefinition[] {
    const character = this.characters.get(characterId);
    if (!character) return [];

    return character.exclusiveCardIds
      .map((cardId) => this.cardDefinitions.get(cardId))
      .filter((card): card is CardDefinition => card !== undefined);
  }

  /**
   * 获取角色的起始卡牌定义
   */
  getStartingCards(characterId: string): CardDefinition[] {
    const character = this.characters.get(characterId);
    if (!character) return [];

    return character.startingCardIds
      .map((cardId) => this.cardDefinitions.get(cardId))
      .filter((card): card is CardDefinition => card !== undefined);
  }

  /**
   * 检查卡牌是否被角色禁用
   */
  isCardBannedForCharacter(characterId: string, cardId: string): boolean {
    const character = this.characters.get(characterId);
    if (!character || !character.bannedCardIds) return false;

    return character.bannedCardIds.includes(cardId);
  }

  /**
   * 将角色专属卡牌添加到玩家牌组
   */
  addExclusiveCardsToDeck(playerId: string, deck: Deck): void {
    const character = this.getPlayerCharacter(playerId);
    if (!character) return;

    const exclusiveCards = this.getExclusiveCards(character.id);
    const startingCards = this.getStartingCards(character.id);

    // 添加专属卡和起始卡
    for (const cardDef of [...exclusiveCards, ...startingCards]) {
      deck.addCard(new Card(cardDef));
    }
  }

  // ============================================================================
  // 被动技能
  // ============================================================================

  /**
   * 处理被动技能触发
   */
  processPassiveTrigger(
    playerId: string,
    trigger: PassiveTrigger,
    gameState: GameState,
    eventData?: Record<string, unknown>
  ): ResolvedEffect[] {
    const character = this.getPlayerCharacter(playerId);
    if (!character) return [];

    const player = gameState.players[playerId];
    if (!player || player.eliminated) return [];

    const results: ResolvedEffect[] = [];

    for (const passive of character.passiveAbilities) {
      if (passive.trigger !== trigger) continue;

      // 检查触发条件
      if (!this.checkPassiveCondition(passive, player, eventData)) continue;

      // 检查是否有额外触发数据匹配
      if (!this.checkPassiveTriggerData(passive, eventData)) continue;

      // 执行被动效果
      const context: EffectContext = {
        gameState,
        sourcePlayerId: playerId,
      };

      // 应用效果倍率
      const effectMultiplier = passive.triggerData?.effectMultiplier ?? 1;
      const modifiedEffects = this.applyEffectMultiplier(passive.effects, effectMultiplier);

      const effects = this.effectResolver.resolveAll(modifiedEffects, context);
      results.push(...effects);

      // 更新触发计数
      if (player.character) {
        player.character.passiveAbilityTriggerCounts[passive.id] =
          (player.character.passiveAbilityTriggerCounts[passive.id] ?? 0) + 1;
      }

      // 发送事件
      this.eventBus.emitSimple(
        'character_passive_triggered',
        {
          playerId,
          characterId: character.id,
          passiveId: passive.id,
          passiveName: passive.name,
          effects,
        },
        gameState
      );
    }

    return results;
  }

  /**
   * 检查被动技能条件
   */
  private checkPassiveCondition(
    passive: PassiveAbility,
    player: PlayerState,
    _eventData?: Record<string, unknown>
  ): boolean {
    if (!passive.condition) return true;

    const condition = passive.condition;
    switch (condition.type) {
      case 'stat_check': {
        const statValue = player.stats[condition.target ?? ''] ?? 0;
        return this.compareValue(statValue, condition.operator, Number(condition.value));
      }
      case 'card_count': {
        const count = player.hand.length;
        return this.compareValue(count, condition.operator, Number(condition.value));
      }
      default:
        return true;
    }
  }

  /**
   * 检查被动技能触发数据匹配
   */
  private checkPassiveTriggerData(
    passive: PassiveAbility,
    eventData?: Record<string, unknown>
  ): boolean {
    if (!passive.triggerData || !eventData) return true;

    // 检查卡牌标签匹配
    if (passive.triggerData.cardTags && passive.trigger === 'card_played') {
      const cardId = eventData.cardId as string;
      const cardDef = this.cardDefinitions.get(cardId);
      if (!cardDef?.tags) return false;

      const hasMatchingTag = passive.triggerData.cardTags.some((tag) =>
        cardDef.tags?.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }

    // 检查属性变化方向
    if (passive.triggerData.changeDirection && passive.trigger === 'stat_changed') {
      const delta = (eventData.after as number) - (eventData.before as number);
      if (passive.triggerData.changeDirection === 'increase' && delta <= 0) return false;
      if (passive.triggerData.changeDirection === 'decrease' && delta >= 0) return false;
    }

    return true;
  }

  /**
   * 应用效果倍率
   */
  private applyEffectMultiplier(effects: CardEffect[], multiplier: number): CardEffect[] {
    if (multiplier === 1) return effects;

    return effects.map((effect) => {
      if (typeof effect.value === 'number') {
        return {
          ...effect,
          value: Math.round(effect.value * multiplier),
        };
      }
      return effect;
    });
  }

  /**
   * 比较数值
   */
  private compareValue(value: number, operator: string, target: number): boolean {
    switch (operator) {
      case '>':
        return value > target;
      case '<':
        return value < target;
      case '>=':
        return value >= target;
      case '<=':
        return value <= target;
      case '==':
        return value === target;
      case '!=':
        return value !== target;
      default:
        return false;
    }
  }

  // ============================================================================
  // 主动技能
  // ============================================================================

  /**
   * 使用主动技能
   */
  useActiveAbility(
    playerId: string,
    player: PlayerState,
    gameState: GameState,
    targetPlayerIds?: string[]
  ): { success: boolean; effects: ResolvedEffect[]; message?: string } {
    const character = this.getPlayerCharacter(playerId);
    if (!character || !character.activeAbility) {
      return { success: false, effects: [], message: 'No active ability available' };
    }

    const ability = character.activeAbility;
    const charState = player.character;

    if (!charState) {
      return { success: false, effects: [], message: 'Character state not initialized' };
    }

    // 检查使用次数
    if (charState.activeAbilityUsesRemaining <= 0) {
      return { success: false, effects: [], message: 'No uses remaining' };
    }

    // 检查冷却
    if (charState.activeAbilityCooldownRemaining > 0) {
      return {
        success: false,
        effects: [],
        message: `On cooldown: ${charState.activeAbilityCooldownRemaining} turns remaining`,
      };
    }

    // 检查目标
    if (ability.needsTarget && (!targetPlayerIds || targetPlayerIds.length === 0)) {
      return { success: false, effects: [], message: 'Target required' };
    }

    // 检查资源消耗
    if (ability.cost) {
      for (const [resourceId, cost] of Object.entries(ability.cost)) {
        if ((player.resources[resourceId] ?? 0) < cost) {
          return { success: false, effects: [], message: `Not enough ${resourceId}` };
        }
      }
    }

    // 检查属性消耗
    if (ability.statCost) {
      for (const [statId, cost] of Object.entries(ability.statCost)) {
        if ((player.stats[statId] ?? 0) < cost) {
          return { success: false, effects: [], message: `Not enough ${statId}` };
        }
      }
    }

    // 检查使用条件
    if (ability.condition) {
      if (
        !this.checkPassiveCondition({ ...ability, trigger: 'game_start' } as PassiveAbility, player)
      ) {
        return { success: false, effects: [], message: 'Condition not met' };
      }
    }

    // 扣除消耗
    if (ability.cost) {
      for (const [resourceId, cost] of Object.entries(ability.cost)) {
        player.resources[resourceId] -= cost;
      }
    }

    if (ability.statCost) {
      for (const [statId, cost] of Object.entries(ability.statCost)) {
        player.stats[statId] -= cost;
      }
    }

    // 执行效果
    const results: ResolvedEffect[] = [];

    if (targetPlayerIds && targetPlayerIds.length > 0) {
      // 对每个目标执行效果
      for (const targetId of targetPlayerIds) {
        const context: EffectContext = {
          gameState,
          sourcePlayerId: playerId,
          targetPlayerId: targetId,
        };
        const effects = this.effectResolver.resolveAll(ability.effects, context);
        results.push(...effects);
      }
    } else {
      // 对自己执行效果
      const context: EffectContext = {
        gameState,
        sourcePlayerId: playerId,
      };
      const effects = this.effectResolver.resolveAll(ability.effects, context);
      results.push(...effects);
    }

    // 更新状态
    charState.activeAbilityUsesRemaining--;
    charState.activeAbilityCooldownRemaining = ability.cooldown;

    // 发送事件
    this.eventBus.emitSimple(
      'character_active_ability_used',
      {
        playerId,
        characterId: character.id,
        abilityId: ability.id,
        abilityName: ability.name,
        targetPlayerIds,
        effects: results,
      },
      gameState
    );

    return { success: true, effects: results };
  }

  /**
   * 减少主动技能冷却 (每回合调用)
   */
  tickActiveAbilityCooldown(playerId: string, player: PlayerState, gameState: GameState): void {
    if (!player.character) return;

    if (player.character.activeAbilityCooldownRemaining > 0) {
      player.character.activeAbilityCooldownRemaining--;

      if (player.character.activeAbilityCooldownRemaining === 0) {
        const character = this.getPlayerCharacter(playerId);
        this.eventBus.emitSimple(
          'character_active_ability_cooldown',
          {
            playerId,
            characterId: player.character.characterId,
            abilityId: character?.activeAbility?.id,
            cooldownEnded: true,
          },
          gameState
        );
      }
    }
  }

  /**
   * 检查主动技能是否可用
   */
  canUseActiveAbility(playerId: string, player: PlayerState): boolean {
    const character = this.getPlayerCharacter(playerId);
    if (!character?.activeAbility || !player.character) return false;

    if (player.character.activeAbilityUsesRemaining <= 0) return false;
    if (player.character.activeAbilityCooldownRemaining > 0) return false;

    const ability = character.activeAbility;

    // 检查资源
    if (ability.cost) {
      for (const [resourceId, cost] of Object.entries(ability.cost)) {
        if ((player.resources[resourceId] ?? 0) < cost) return false;
      }
    }

    // 检查属性
    if (ability.statCost) {
      for (const [statId, cost] of Object.entries(ability.statCost)) {
        if ((player.stats[statId] ?? 0) < cost) return false;
      }
    }

    return true;
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  /**
   * 获取所有角色定义
   */
  getAllCharacters(): CharacterDefinition[] {
    return Array.from(this.characters.values());
  }

  /**
   * 获取角色定义
   */
  getCharacter(characterId: string): CharacterDefinition | undefined {
    return this.characters.get(characterId);
  }

  /**
   * 添加角色定义
   */
  addCharacter(character: CharacterDefinition): void {
    this.characters.set(character.id, character);
  }

  /**
   * 重置系统状态
   */
  reset(): void {
    this.playerCharacters.clear();
  }

  /**
   * 清理资源，移除所有事件监听器
   */
  destroy(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    this.playerCharacters.clear();
  }
}
