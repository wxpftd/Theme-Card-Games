import { useEffect, useRef } from 'react';

/**
 * 测试调试 hook - 仅在开发环境下记录组件状态
 * 用于 E2E 测试时追踪组件的挂载、更新和卸载
 *
 * @param componentName - 组件名称，用于日志标识
 * @param debugInfo - 需要追踪的调试信息
 *
 * @example
 * ```tsx
 * function MyComponent({ count }: Props) {
 *   useTestDebug('MyComponent', { count });
 *   return <View>...</View>;
 * }
 * ```
 *
 * 日志格式：
 * - [E2E_DEBUG] MyComponent MOUNTED { count: 0 }
 * - [E2E_DEBUG] MyComponent UPDATED { count: 1 }
 * - [E2E_DEBUG] MyComponent UNMOUNTED
 */
export function useTestDebug(componentName: string, debugInfo?: Record<string, unknown>): void {
  const mountedRef = useRef(false);
  const renderCountRef = useRef(0);

  useEffect(() => {
    if (!__DEV__) return;

    renderCountRef.current += 1;
    const serializedInfo = debugInfo ? JSON.stringify(debugInfo) : '';

    if (!mountedRef.current) {
      console.log(
        `[E2E_DEBUG] ${componentName} MOUNTED (render #${renderCountRef.current})`,
        serializedInfo
      );
      mountedRef.current = true;
    } else {
      console.log(
        `[E2E_DEBUG] ${componentName} UPDATED (render #${renderCountRef.current})`,
        serializedInfo
      );
    }

    return () => {
      if (mountedRef.current) {
        console.log(`[E2E_DEBUG] ${componentName} UNMOUNTED`);
        mountedRef.current = false;
      }
    };
  });
}
