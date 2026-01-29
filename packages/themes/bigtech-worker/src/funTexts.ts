/**
 * 趣味性游戏文案配置
 * 增加游戏的娱乐性和代入感
 */

/**
 * 游戏加载提示 - 随机显示
 */
export const loadingTips = [
  '正在为你准备咖啡... ☕',
  '正在启动工位电脑... 💻',
  '正在整理今日待办... 📋',
  '正在查看钉钉消息... 📱',
  '正在假装很忙... 🎭',
  '正在思考人生... 🤔',
  '正在计算年终奖... 💰',
  '正在规划职业路径... 🛤️',
];

/**
 * 回合开始提示
 */
export const turnStartMessages = [
  '新的一天开始了！今天要做什么呢？',
  '又是元气满满的一天！',
  '打工人打工魂，打工都是人上人！',
  '今天也要加油鸭！🦆',
  '早安，打工人！',
  '新的挑战在等着你！',
];

/**
 * 回合结束提示
 */
export const turnEndMessages = [
  '今天的工作告一段落了~',
  '下班时间到！（才怪）',
  '休息一下，明天继续！',
  '今天也辛苦了！',
  '准备迎接新的挑战吧！',
];

/**
 * 卡牌打出时的趣味提示
 */
export const cardPlayMessages: Record<string, string[]> = {
  // 加班相关
  overtime: ['又开始卷了！💪', '今晚的月亮真圆啊...', '工位的灯永远为你亮着！'],
  // 摸鱼相关
  slacking: ['摸鱼的艺术在于不被发现 🐟', '偷得浮生半日闲~', '这不是摸鱼，这是战略性休息！'],
  // 咖啡相关
  coffee_break: ['续命咖啡来一杯！☕', '没有咖啡解决不了的问题！', '咖啡因注入中...'],
  // 会议相关
  ppt_presentation: ['又到了表演时间！🎭', 'PPT战士上线！', '让领导看看你的实力！'],
  // 学习相关
  online_course: ['学无止境！📚', '投资自己永远不亏！', '知识就是力量！'],
  // 社交相关
  team_dinner: ['团建走起！🍻', '吃饭皇帝大！', '社交达人上线！'],
  networking: ['人脉就是钱脉！🤝', '多个朋友多条路！', '社牛附体！'],
  // 健身相关
  gym: ['身体是革命的本钱！💪', '撸铁使我快乐！', '健康最重要！'],
  // 默认
  default: ['出牌！', '就决定是你了！', '看我的！'],
};

/**
 * 连击触发时的趣味提示
 */
export const comboTriggerMessages: Record<string, string> = {
  night_warrior: '熬夜战士觉醒！今晚注定不平凡！🦉',
  workplace_mentor: '职场导师模式开启！带飞全场！👨‍🏫',
  efficient_learning: '学霸附体！知识疯狂涌入！📖',
  workaholic_combo: '卷王降临！谁与争锋！💪',
  life_balance: '生活平衡大师！工作生活两不误！⚖️',
  paid_break: '带薪休息的艺术！老板看了都说好！☕',
  default: '组合技触发！效果翻倍！✨',
};

/**
 * 状态变化时的趣味提示
 */
export const statChangeMessages = {
  health: {
    increase: ['身体倍儿棒！', '元气恢复中~', '健康值UP！'],
    decrease: ['有点累了...', '身体在抗议！', '需要休息一下...'],
    critical: ['身体亮红灯了！', '快撑不住了！', '需要紧急休息！'],
  },
  happiness: {
    increase: ['心情美美哒！', '幸福感爆棚！', '今天真开心！'],
    decrease: ['有点emo...', '心情不太好...', '需要调节一下...'],
    critical: ['快要裸辞了！', '幸福感告急！', '需要正能量！'],
  },
  performance: {
    increase: ['绩效蹭蹭涨！', '领导看好你！', '升职有望！'],
    decrease: ['绩效下滑中...', '需要加把劲！', '小心被优化...'],
    critical: ['绩效危险！', 'PIP警告！', '需要紧急补救！'],
  },
  influence: {
    increase: ['影响力提升！', '越来越有话语权！', '大佬范儿！'],
    decrease: ['存在感降低...', '需要多露脸！', '别当透明人！'],
    critical: ['快被遗忘了！', '需要刷存在感！', '影响力告急！'],
  },
};

/**
 * 游戏胜利时的庆祝语
 */
export const victoryMessages = [
  '恭喜晋升！你已经是大厂的中流砥柱了！🎉',
  '职场巅峰！你就是传说中的卷王！👑',
  '成功上岸！财务自由指日可待！💰',
  '完美通关！你的职场故事将成为传奇！🏆',
  '大获全胜！打工人的终极胜利！🎊',
];

/**
 * 游戏失败时的安慰语
 */
export const defeatMessages = {
  health: [
    '身体是革命的本钱，下次记得多休息！',
    '996不是福报，健康才是！',
    '倒下了...但你的精神永存！',
  ],
  happiness: [
    '裸辞了...但这也是一种勇气！',
    '幸福比绩效更重要！',
    '人生不只有工作，下次平衡好生活吧！',
  ],
  turnLimit: [
    '时间到了...职场之路还很长！',
    '这次没能晋升，但经验值满满！',
    '下次一定能成功！加油！',
  ],
};

/**
 * 随机获取提示文案
 */
export function getRandomTip(tips: string[]): string {
  return tips[Math.floor(Math.random() * tips.length)];
}

/**
 * 获取卡牌打出提示
 */
export function getCardPlayMessage(cardId: string): string {
  const messages = cardPlayMessages[cardId] || cardPlayMessages.default;
  return getRandomTip(messages);
}

/**
 * 获取连击触发提示
 */
export function getComboMessage(comboId: string): string {
  return comboTriggerMessages[comboId] || comboTriggerMessages.default;
}

/**
 * 获取状态变化提示
 */
export function getStatChangeMessage(
  statId: string,
  changeType: 'increase' | 'decrease' | 'critical'
): string {
  const messages = statChangeMessages[statId as keyof typeof statChangeMessages];
  if (!messages) return '';
  return getRandomTip(messages[changeType]);
}
