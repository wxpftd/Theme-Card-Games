/**
 * 游戏音效资源定义
 * 用于在 UI 组件中引用音效资源
 */

export interface GameSounds {
  // UI 交互音效
  /** 按钮点击 */
  buttonClick?: string;
  /** 按钮悬停 */
  buttonHover?: string;
  /** 菜单打开 */
  menuOpen?: string;
  /** 菜单关闭 */
  menuClose?: string;

  // 卡牌音效
  /** 抽卡 */
  cardDraw?: string;
  /** 出卡 */
  cardPlay?: string;
  /** 卡牌翻转 */
  cardFlip?: string;
  /** 洗牌 */
  cardShuffle?: string;
  /** 卡牌选中 */
  cardSelect?: string;

  // 游戏状态音效
  /** 回合开始 */
  turnStart?: string;
  /** 回合结束 */
  turnEnd?: string;
  /** 游戏胜利 */
  victory?: string;
  /** 游戏失败 */
  defeat?: string;
  /** 晋升/升级 */
  levelUp?: string;

  // 反馈音效
  /** 正面效果 */
  positiveEffect?: string;
  /** 负面效果 */
  negativeEffect?: string;
  /** 连击触发 */
  comboTrigger?: string;
  /** 警告 */
  warning?: string;
  /** 错误 */
  error?: string;

  // 背景音乐
  /** 主菜单背景音乐 */
  menuBgm?: string;
  /** 游戏中背景音乐 */
  gameBgm?: string;
  /** 胜利背景音乐 */
  victoryBgm?: string;
}

/**
 * 音效配置
 */
export interface SoundConfig {
  /** 是否启用音效 */
  enabled: boolean;
  /** 音效音量 (0-1) */
  sfxVolume: number;
  /** 背景音乐音量 (0-1) */
  bgmVolume: number;
  /** 是否启用震动反馈 */
  hapticEnabled: boolean;
}

/**
 * 默认音效配置
 */
export const defaultSoundConfig: SoundConfig = {
  enabled: true,
  sfxVolume: 0.7,
  bgmVolume: 0.5,
  hapticEnabled: true,
};

/**
 * 默认音效资源占位符
 * 实际音效由各主题 App 提供
 */
export const defaultGameSounds: GameSounds = {
  buttonClick: undefined,
  buttonHover: undefined,
  menuOpen: undefined,
  menuClose: undefined,
  cardDraw: undefined,
  cardPlay: undefined,
  cardFlip: undefined,
  cardShuffle: undefined,
  cardSelect: undefined,
  turnStart: undefined,
  turnEnd: undefined,
  victory: undefined,
  defeat: undefined,
  levelUp: undefined,
  positiveEffect: undefined,
  negativeEffect: undefined,
  comboTrigger: undefined,
  warning: undefined,
  error: undefined,
  menuBgm: undefined,
  gameBgm: undefined,
  victoryBgm: undefined,
};
