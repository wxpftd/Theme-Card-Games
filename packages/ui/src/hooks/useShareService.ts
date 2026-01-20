import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import type { ShareCardContainerRef } from '../components/share';

// 注意: 这些依赖需要在 app 层级安装
// - react-native-view-shot (用于截图)
// - expo-sharing (用于分享)
// - expo-media-library (用于保存到相册)

export interface UseShareServiceOptions {
  /** 截图模块 (react-native-view-shot) */
  viewShot?: {
    captureRef: (
      ref: React.RefObject<unknown> | unknown,
      options?: { format?: string; quality?: number }
    ) => Promise<string>;
  };
  /** 分享模块 (expo-sharing) */
  sharing?: {
    isAvailableAsync: () => Promise<boolean>;
    shareAsync: (
      url: string,
      options?: { mimeType?: string; dialogTitle?: string }
    ) => Promise<void>;
  };
  /** 媒体库模块 (expo-media-library) */
  mediaLibrary?: {
    requestPermissionsAsync: () => Promise<{ granted: boolean }>;
    createAssetAsync: (uri: string) => Promise<{ uri: string }>;
  };
}

export interface UseShareServiceReturn {
  /** 是否正在分享中 */
  isSharing: boolean;
  /** 是否正在保存中 */
  isSaving: boolean;
  /** 错误信息 */
  error: string | null;
  /** 截图并分享 */
  captureAndShare: (
    containerRef: React.RefObject<ShareCardContainerRef | null>,
    dialogTitle?: string
  ) => Promise<boolean>;
  /** 保存到相册 */
  saveToGallery: (containerRef: React.RefObject<ShareCardContainerRef | null>) => Promise<boolean>;
  /** 清除错误 */
  clearError: () => void;
}

/**
 * useShareService - 分享服务 Hook
 *
 * 提供截图、分享和保存到相册的功能
 *
 * @example
 * ```tsx
 * // 在 app 层级提供依赖
 * import * as ViewShot from 'react-native-view-shot';
 * import * as Sharing from 'expo-sharing';
 * import * as MediaLibrary from 'expo-media-library';
 *
 * const shareService = useShareService({
 *   viewShot: { captureRef: ViewShot.captureRef },
 *   sharing: Sharing,
 *   mediaLibrary: MediaLibrary,
 * });
 *
 * // 在组件中使用
 * const containerRef = useRef<ShareCardContainerRef>(null);
 *
 * <SurvivalReportCard containerRef={containerRef} data={data} />
 *
 * <Button onPress={() => shareService.captureAndShare(containerRef)} />
 * ```
 */
export function useShareService(options: UseShareServiceOptions = {}): UseShareServiceReturn {
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { viewShot, sharing, mediaLibrary } = options;

  const captureAndShare = useCallback(
    async (
      containerRef: React.RefObject<ShareCardContainerRef | null>,
      dialogTitle = '分享战绩'
    ): Promise<boolean> => {
      if (!viewShot?.captureRef) {
        setError('截图功能不可用: 请确保已安装 react-native-view-shot');
        return false;
      }

      if (!sharing) {
        setError('分享功能不可用: 请确保已安装 expo-sharing');
        return false;
      }

      const viewRef = containerRef.current?.getViewRef?.();
      if (!viewRef) {
        setError('无法获取视图引用');
        return false;
      }

      setIsSharing(true);
      setError(null);

      try {
        // 检查分享是否可用
        const isAvailable = await sharing.isAvailableAsync();
        if (!isAvailable) {
          throw new Error('当前设备不支持分享功能');
        }

        // 截图
        const uri = await viewShot.captureRef(viewRef, {
          format: 'png',
          quality: 1,
        });

        // 分享
        await sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle,
        });

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : '分享失败';
        setError(message);
        return false;
      } finally {
        setIsSharing(false);
      }
    },
    [viewShot, sharing]
  );

  const saveToGallery = useCallback(
    async (containerRef: React.RefObject<ShareCardContainerRef | null>): Promise<boolean> => {
      if (!viewShot?.captureRef) {
        setError('截图功能不可用: 请确保已安装 react-native-view-shot');
        return false;
      }

      if (!mediaLibrary) {
        setError('相册功能不可用: 请确保已安装 expo-media-library');
        return false;
      }

      const viewRef = containerRef.current?.getViewRef?.();
      if (!viewRef) {
        setError('无法获取视图引用');
        return false;
      }

      setIsSaving(true);
      setError(null);

      try {
        // 请求相册权限
        const { granted } = await mediaLibrary.requestPermissionsAsync();
        if (!granted) {
          throw new Error('需要相册权限才能保存图片');
        }

        // 截图
        const uri = await viewShot.captureRef(viewRef, {
          format: 'png',
          quality: 1,
        });

        // 保存到相册
        await mediaLibrary.createAssetAsync(uri);

        // 提示成功
        if (Platform.OS !== 'web') {
          Alert.alert('保存成功', '图片已保存到相册');
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : '保存失败';
        setError(message);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [viewShot, mediaLibrary]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSharing,
    isSaving,
    error,
    captureAndShare,
    saveToGallery,
    clearError,
  };
}

/**
 * 创建一个无依赖的 mock 分享服务 (用于开发/测试)
 */
export function createMockShareService(): UseShareServiceReturn {
  return {
    isSharing: false,
    isSaving: false,
    error: null,
    captureAndShare: async () => {
      console.log('[MockShareService] captureAndShare called');
      Alert.alert('开发模式', '分享功能在开发模式下不可用');
      return false;
    },
    saveToGallery: async () => {
      console.log('[MockShareService] saveToGallery called');
      Alert.alert('开发模式', '保存功能在开发模式下不可用');
      return false;
    },
    clearError: () => {},
  };
}
