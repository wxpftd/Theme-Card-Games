import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { GameEngine, ComboDefinition, CardInstance, CardDefinition } from '@theme-card-games/core';

export interface CardSelectionContextValue {
  /** 当前选中的卡牌 instanceId 集合 */
  selectedCardIds: Set<string>;
  /** 切换卡牌选中状态 */
  toggleCard: (cardId: string) => void;
  /** 清空选择 */
  clearSelection: () => void;
  /** 确认打出选中的卡牌 */
  confirmPlay: () => Promise<boolean>;
  /** 预览匹配的 combo（如果有） */
  pendingCombo: ComboDefinition | null;
  /** 选中的卡牌数量 */
  selectedCount: number;
  /** 检查卡牌是否被选中 */
  isSelected: (cardId: string) => boolean;
  /** 是否正在处理打出 */
  isPlaying: boolean;
}

const CardSelectionContext = createContext<CardSelectionContextValue | null>(null);

export interface CardSelectionProviderProps {
  children: ReactNode;
  /** 游戏引擎实例 */
  engine: GameEngine | null;
  /** 当前玩家 ID */
  playerId: string;
  /** 当前手牌 */
  hand: CardInstance[];
  /** 卡牌定义映射 */
  cardDefinitions: Map<string, CardDefinition>;
  /** combo 定义列表 */
  comboDefinitions?: ComboDefinition[];
  /** 是否禁用（非玩家回合） */
  disabled?: boolean;
  /** 打出卡牌后的回调 */
  onCardsPlayed?: (cardIds: string[], triggeredCombo: ComboDefinition | null) => void;
}

/**
 * 多卡选择状态管理 Provider
 *
 * 支持选中多张卡、切换选择、清空选择、确认打出，
 * 并在选中时检测可能触发的 combo。
 */
export function CardSelectionProvider({
  children,
  engine,
  playerId,
  hand,
  cardDefinitions,
  comboDefinitions = [],
  disabled = false,
  onCardsPlayed,
}: CardSelectionProviderProps) {
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const playingRef = useRef(false);

  // 切换卡牌选中状态
  const toggleCard = useCallback(
    (cardId: string) => {
      if (disabled || playingRef.current) return;

      setSelectedCardIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(cardId)) {
          newSet.delete(cardId);
        } else {
          newSet.add(cardId);
        }
        return newSet;
      });
    },
    [disabled]
  );

  // 清空选择
  const clearSelection = useCallback(() => {
    setSelectedCardIds(new Set());
  }, []);

  // 检查卡牌是否被选中
  const isSelected = useCallback(
    (cardId: string) => selectedCardIds.has(cardId),
    [selectedCardIds]
  );

  // 检测选中卡牌是否匹配某个 combo
  const pendingCombo = useMemo((): ComboDefinition | null => {
    if (selectedCardIds.size === 0 || comboDefinitions.length === 0) {
      return null;
    }

    // 获取选中卡牌的 definitionId 列表
    const selectedDefinitionIds: string[] = [];
    for (const instanceId of selectedCardIds) {
      const card = hand.find((c) => c.instanceId === instanceId);
      if (card) {
        selectedDefinitionIds.push(card.definitionId);
      }
    }

    // 遍历 combo 定义，查找匹配
    for (const combo of comboDefinitions) {
      const trigger = combo.trigger;

      if (trigger.type === 'combination') {
        // 检查是否包含所有需要的卡牌（任意顺序）
        const requiredCards = new Set(trigger.cards);
        const hasAllRequired = trigger.cards.every((cardId) =>
          selectedDefinitionIds.includes(cardId)
        );
        if (hasAllRequired && selectedDefinitionIds.length === requiredCards.size) {
          return combo;
        }
      } else if (trigger.type === 'sequence') {
        // 对于顺序 combo，只在选中卡牌数量匹配时才提示（用户需要按顺序打出）
        if (
          selectedDefinitionIds.length === trigger.cards.length &&
          trigger.cards.every((cardId) => selectedDefinitionIds.includes(cardId))
        ) {
          return combo;
        }
      } else if (trigger.type === 'tag_count') {
        // 检查选中的卡牌是否有足够的指定 tag
        let tagCount = 0;
        for (const defId of selectedDefinitionIds) {
          const cardDef = cardDefinitions.get(defId);
          if (cardDef?.tags?.includes(trigger.tag)) {
            tagCount++;
          }
        }
        if (tagCount >= trigger.count) {
          return combo;
        }
      } else if (trigger.type === 'tag_sequence') {
        // 检查选中的卡牌是否有足够的指定 tags
        const requiredCount = trigger.count ?? trigger.tags.length;
        const hasAllTags = trigger.tags.every((tag) =>
          selectedDefinitionIds.some((defId) => {
            const cardDef = cardDefinitions.get(defId);
            return cardDef?.tags?.includes(tag);
          })
        );
        if (hasAllTags && selectedDefinitionIds.length >= requiredCount) {
          return combo;
        }
      }
    }

    return null;
  }, [selectedCardIds, hand, comboDefinitions, cardDefinitions]);

  // 确认打出选中的卡牌
  const confirmPlay = useCallback(async (): Promise<boolean> => {
    if (!engine || disabled || selectedCardIds.size === 0 || playingRef.current) {
      return false;
    }

    playingRef.current = true;
    setIsPlaying(true);

    try {
      // 按选中顺序打出卡牌
      const cardIdsToPlay = Array.from(selectedCardIds);
      let allSuccess = true;

      for (const cardId of cardIdsToPlay) {
        const success = engine.playCard(playerId, cardId);
        if (!success) {
          allSuccess = false;
          // 如果打出失败，停止继续打出
          break;
        }
        // 短暂延迟，让动画和事件有时间处理
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // 清空选择
      setSelectedCardIds(new Set());

      // 回调通知
      if (onCardsPlayed && allSuccess) {
        onCardsPlayed(cardIdsToPlay, pendingCombo);
      }

      return allSuccess;
    } finally {
      playingRef.current = false;
      setIsPlaying(false);
    }
  }, [engine, playerId, selectedCardIds, disabled, pendingCombo, onCardsPlayed]);

  // 当禁用状态变化时清空选择
  React.useEffect(() => {
    if (disabled) {
      setSelectedCardIds(new Set());
    }
  }, [disabled]);

  const value = useMemo(
    (): CardSelectionContextValue => ({
      selectedCardIds,
      toggleCard,
      clearSelection,
      confirmPlay,
      pendingCombo,
      selectedCount: selectedCardIds.size,
      isSelected,
      isPlaying,
    }),
    [selectedCardIds, toggleCard, clearSelection, confirmPlay, pendingCombo, isSelected, isPlaying]
  );

  return <CardSelectionContext.Provider value={value}>{children}</CardSelectionContext.Provider>;
}

/**
 * 使用卡牌选择 Context 的 hook
 */
export function useCardSelection(): CardSelectionContextValue {
  const context = useContext(CardSelectionContext);
  if (!context) {
    throw new Error('useCardSelection must be used within a CardSelectionProvider');
  }
  return context;
}

/**
 * 可选的卡牌选择 hook（不在 Provider 内也不会报错）
 */
export function useCardSelectionOptional(): CardSelectionContextValue | null {
  return useContext(CardSelectionContext);
}
