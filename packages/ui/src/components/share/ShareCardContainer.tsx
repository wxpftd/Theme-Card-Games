import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

// Use react-native's ReactNode to avoid type conflicts
type RNReactNode = React.ReactNode;

export interface ShareCardContainerRef {
  /** 获取容器视图引用 (用于截图) */
  getViewRef: () => View | null;
}

export interface ShareCardContainerProps {
  children: RNReactNode;
  style?: ViewStyle;
  /** 背景颜色 */
  backgroundColor?: string;
  /** 内边距 */
  padding?: number;
}

/**
 * ShareCardContainer - 分享卡截图容器
 *
 * 封装分享卡的容器，提供 ref 供截图使用
 * 配合 react-native-view-shot 或 expo-media-library 使用
 */
export const ShareCardContainer = forwardRef<ShareCardContainerRef | null, ShareCardContainerProps>(
  ({ children, style, backgroundColor = '#FFFFFF', padding = 16 }, ref) => {
    const viewRef = useRef<View>(null);

    useImperativeHandle(ref, () => ({
      getViewRef: () => viewRef.current,
    }));

    return (
      <View
        ref={viewRef}
        style={[styles.container, { backgroundColor, padding }, style]}
        collapsable={false}
        // @ts-expect-error - React/React Native type version mismatch
        children={children}
      />
    );
  }
);

ShareCardContainer.displayName = 'ShareCardContainer';

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
});
