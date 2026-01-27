import { useState, useEffect, useRef, useCallback } from 'react';
import { CardInstance, GameEngine, GameEventType } from '@theme-card-games/core';

export interface UseHandCardsOptions {
  engine: GameEngine | null;
  playerId: string;
}

export interface UseHandCardsReturn {
  /** 当前手牌 */
  cards: CardInstance[];
  /** 版本号，用于触发渲染 */
  version: number;
}

/**
 * 手牌专用订阅 hook
 *
 * 只订阅手牌相关事件（card_drawn, card_played, card_discarded），
 * 使用 useRef 存储手牌数组，通过 version 触发必要的更新。
 * 比较 instanceId 列表判断手牌是否真正变化，避免不必要的重渲染。
 */
export function useHandCards({ engine, playerId }: UseHandCardsOptions): UseHandCardsReturn {
  const cardsRef = useRef<CardInstance[]>([]);
  const [version, setVersion] = useState(0);

  // 检查手牌是否变化的辅助函数
  const getCardIds = useCallback((cards: CardInstance[]): string => {
    return cards.map((c) => c.instanceId).join(',');
  }, []);

  useEffect(() => {
    if (!engine) {
      cardsRef.current = [];
      setVersion((v) => v + 1);
      return;
    }

    // 更新手牌的函数
    const updateHand = () => {
      const player = engine.getPlayer(playerId);
      if (!player) {
        if (cardsRef.current.length > 0) {
          cardsRef.current = [];
          setVersion((v) => v + 1);
        }
        return;
      }

      const newIds = getCardIds(player.hand);
      const oldIds = getCardIds(cardsRef.current);

      // 只有手牌真正变化时才更新
      if (newIds !== oldIds) {
        cardsRef.current = [...player.hand];
        setVersion((v) => v + 1);
      }
    };

    // 初始化手牌
    updateHand();

    // 只订阅手牌相关事件
    const handEvents: GameEventType[] = ['card_drawn', 'card_played', 'card_discarded'];
    const unsubscribers = handEvents.map((eventType) =>
      engine.on(eventType, (event) => {
        // 只关心当前玩家的事件
        if (event.data.playerId === playerId) {
          updateHand();
        }
      })
    );

    // 也需要订阅游戏开始事件（初始发牌）
    const unsubGameStarted = engine.on('game_started', () => {
      updateHand();
    });

    // 订阅回合开始事件（抽牌阶段）
    const unsubTurnStarted = engine.on('turn_started', (event) => {
      if (event.data.playerId === playerId) {
        // 延迟更新，等待抽牌完成
        setTimeout(updateHand, 0);
      }
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      unsubGameStarted();
      unsubTurnStarted();
    };
  }, [engine, playerId, getCardIds]);

  return {
    cards: cardsRef.current,
    version,
  };
}
