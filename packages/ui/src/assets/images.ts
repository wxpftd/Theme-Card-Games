/**
 * 游戏图片资源定义
 * 用于在 UI 组件中引用图片资源
 */

export interface GameImages {
  /** 主页背景 */
  homeBackground?: string;
  /** 游戏界面背景 */
  gameBackground?: string;
  /** 胜利界面背景 */
  victoryBackground?: string;
  /** 失败界面背景 */
  defeatBackground?: string;
  /** 卡牌背面 */
  cardBack?: string;
  /** 应用图标 */
  appIcon?: string;
  /** 启动画面 */
  splash?: string;
}

/**
 * 默认图片资源占位符
 * 实际图片由各主题 App 提供
 */
export const defaultGameImages: GameImages = {
  homeBackground: undefined,
  gameBackground: undefined,
  victoryBackground: undefined,
  defeatBackground: undefined,
  cardBack: undefined,
  appIcon: undefined,
  splash: undefined,
};
