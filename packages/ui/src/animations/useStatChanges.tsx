/**
 * 属性变化追踪 Hook
 * 用于追踪玩家属性的变化并生成动画数据
 */
import { useRef, useCallback, useState, useEffect } from 'react';
import { StatChange } from './StatChangePopup';

interface StatDefinition {
  id: string;
  name: string;
  icon?: string;
}

interface UseStatChangesOptions {
  /** 属性定义列表 */
  statDefinitions: StatDefinition[];
  /** 当前属性值 */
  currentStats: Record<string, number>;
  /** 属性显示区域的位置（用于定位弹出动画） */
  statsPosition?: { x: number; y: number };
}

interface UseStatChangesResult {
  /** 当前待显示的属性变化列表 */
  changes: StatChange[];
  /** 清除指定的属性变化（动画完成后调用） */
  removeChange: (id: string) => void;
  /** 手动添加一个属性变化 */
  addChange: (statId: string, delta: number, position?: { x: number; y: number }) => void;
}

let changeIdCounter = 0;

/**
 * 追踪属性变化并生成动画数据的 Hook
 *
 * @example
 * ```tsx
 * const { changes, removeChange } = useStatChanges({
 *   statDefinitions: theme.stats,
 *   currentStats: player.stats,
 *   statsPosition: { x: 100, y: 200 }
 * });
 *
 * return (
 *   <>
 *     <StatChangePopupContainer changes={changes} onChangeComplete={removeChange} />
 *     <PlayerStats player={player} ... />
 *   </>
 * );
 * ```
 */
export function useStatChanges({
  statDefinitions,
  currentStats,
  statsPosition = { x: 100, y: 100 },
}: UseStatChangesOptions): UseStatChangesResult {
  const [changes, setChanges] = useState<StatChange[]>([]);
  const previousStats = useRef<Record<string, number> | null>(null);
  const statDefMap = useRef<Map<string, StatDefinition>>(new Map());

  // 更新属性定义映射
  useEffect(() => {
    statDefMap.current = new Map(statDefinitions.map((def) => [def.id, def]));
  }, [statDefinitions]);

  // 监听属性变化
  useEffect(() => {
    if (previousStats.current === null) {
      // 首次渲染，记录初始值
      previousStats.current = { ...currentStats };
      return;
    }

    // 计算变化
    const newChanges: StatChange[] = [];
    let yOffset = 0;

    for (const statId of Object.keys(currentStats)) {
      const prevValue = previousStats.current[statId] ?? 0;
      const currValue = currentStats[statId] ?? 0;
      const delta = currValue - prevValue;

      if (delta !== 0) {
        const def = statDefMap.current.get(statId);
        newChanges.push({
          id: `change-${++changeIdCounter}`,
          statId,
          statName: def?.name ?? statId,
          icon: def?.icon,
          delta,
          x: statsPosition.x,
          y: statsPosition.y + yOffset,
        });
        yOffset += 40; // 多个变化垂直堆叠
      }
    }

    // 更新之前的状态
    previousStats.current = { ...currentStats };

    // 添加新变化
    if (newChanges.length > 0) {
      setChanges((prev) => [...prev, ...newChanges]);
    }
  }, [currentStats, statsPosition]);

  // 移除已完成的变化
  const removeChange = useCallback((id: string) => {
    setChanges((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // 手动添加变化（用于外部触发）
  const addChange = useCallback(
    (statId: string, delta: number, position?: { x: number; y: number }) => {
      const def = statDefMap.current.get(statId);
      const pos = position ?? statsPosition;

      setChanges((prev) => [
        ...prev,
        {
          id: `change-${++changeIdCounter}`,
          statId,
          statName: def?.name ?? statId,
          icon: def?.icon,
          delta,
          x: pos.x,
          y: pos.y,
        },
      ]);
    },
    [statsPosition]
  );

  return {
    changes,
    removeChange,
    addChange,
  };
}
