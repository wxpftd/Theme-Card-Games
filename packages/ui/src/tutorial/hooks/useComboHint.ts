/**
 * 组合提示 Hook
 * 检测并提示玩家可能的组合机会
 */

import { useState, useCallback, useMemo } from 'react';
import { CardInstance, ComboDefinition, ComboTrigger } from '@theme-card-games/core';
import { ComboHint, UseComboHintReturn } from '../types';

/** 每局最大提示次数 */
const MAX_HINTS_PER_GAME = 3;

/** 每个组合最大提示次数 */
const MAX_HINTS_PER_COMBO = 1;

export function useComboHint(): UseComboHintReturn {
  const [currentHint, setCurrentHint] = useState<ComboHint | null>(null);
  const [hintCount, setHintCount] = useState(0);
  const [hintedComboIds, setHintedComboIds] = useState<Set<string>>(new Set());

  /**
   * 从触发条件中获取所需卡牌 ID 列表
   */
  const getRequiredCards = useCallback((trigger: ComboTrigger): string[] => {
    switch (trigger.type) {
      case 'sequence':
      case 'combination':
        return trigger.cards;
      default:
        // tag_sequence 和 tag_count 类型暂不支持提示
        return [];
    }
  }, []);

  /**
   * 检查组合机会
   * @param hand 当前手牌
   * @param playedThisTurn 本回合已打出的卡牌定义 ID
   * @param combos 所有组合定义
   * @returns 最接近触发的组合提示，或 null
   */
  const checkComboOpportunity = useCallback(
    (
      hand: CardInstance[],
      playedThisTurn: string[],
      combos: ComboDefinition[]
    ): ComboHint | null => {
      // 检查是否达到提示上限
      if (hintCount >= MAX_HINTS_PER_GAME) {
        return null;
      }

      // 手牌中的卡牌定义 ID 集合
      const handCardIds = new Set(hand.map((c) => c.definitionId));

      // 本回合已打出的卡牌定义 ID 集合
      const playedSet = new Set(playedThisTurn);

      let bestHint: ComboHint | null = null;
      let bestRemainingCount = Infinity;

      for (const combo of combos) {
        // 跳过已提示过的组合
        if (hintedComboIds.has(combo.id)) {
          continue;
        }

        const requiredCards = getRequiredCards(combo.trigger);
        if (requiredCards.length === 0) {
          continue;
        }

        // 统计已打出的属于该组合的卡牌
        const playedComboCards: string[] = [];
        const requiredRemaining: string[] = [];

        for (const cardId of requiredCards) {
          if (playedSet.has(cardId)) {
            playedComboCards.push(cardId);
          } else {
            requiredRemaining.push(cardId);
          }
        }

        // 必须已经打出至少一张组合卡牌
        if (playedComboCards.length === 0) {
          continue;
        }

        // 检查手牌中是否有剩余所需的卡牌
        const availableInHand = requiredRemaining.filter((cardId) => handCardIds.has(cardId));

        // 手牌中必须有至少一张所需卡牌
        if (availableInHand.length === 0) {
          continue;
        }

        // 计算还需要的卡牌数量
        const remainingCount = requiredRemaining.length;

        // 选择最接近完成的组合
        if (remainingCount < bestRemainingCount) {
          bestRemainingCount = remainingCount;
          bestHint = {
            combo,
            playedCards: playedComboCards,
            availableCards: availableInHand,
            remainingCount,
          };
        }
      }

      return bestHint;
    },
    [hintCount, hintedComboIds, getRequiredCards]
  );

  /**
   * 显示提示
   */
  const showHint = useCallback((hint: ComboHint) => {
    setCurrentHint(hint);
    setHintCount((prev) => prev + 1);
    setHintedComboIds((prev) => new Set([...prev, hint.combo.id]));
  }, []);

  /**
   * 关闭当前提示
   */
  const dismissHint = useCallback(() => {
    setCurrentHint(null);
  }, []);

  /**
   * 重置提示状态（新游戏开始时调用）
   */
  const resetHints = useCallback(() => {
    setCurrentHint(null);
    setHintCount(0);
    setHintedComboIds(new Set());
  }, []);

  /**
   * 包装后的检查函数，会自动显示提示
   */
  const checkAndShowHint = useCallback(
    (
      hand: CardInstance[],
      playedThisTurn: string[],
      combos: ComboDefinition[]
    ): ComboHint | null => {
      const hint = checkComboOpportunity(hand, playedThisTurn, combos);
      if (hint) {
        showHint(hint);
      }
      return hint;
    },
    [checkComboOpportunity, showHint]
  );

  return {
    currentHint,
    hintCount,
    hintedComboIds,
    dismissHint,
    checkComboOpportunity: checkAndShowHint,
    resetHints,
  };
}
