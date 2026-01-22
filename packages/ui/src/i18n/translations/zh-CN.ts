/**
 * Chinese (Simplified) translations for UI components
 */
export const zhCN = {
  // Common
  'common.loading': '加载中...',
  'common.error': '出错了',
  'common.confirm': '确认',
  'common.cancel': '取消',
  'common.save': '保存',
  'common.close': '关闭',
  'common.back': '返回',
  'common.next': '下一步',
  'common.more': '更多',
  'common.tutorial': '新手教程',

  // Game phases
  'phase.setup': '准备中',
  'phase.draw': '抽牌阶段',
  'phase.main': '主要阶段',
  'phase.action': '行动阶段',
  'phase.resolve': '结算阶段',
  'phase.end': '结束阶段',
  'phase.game_over': '游戏结束',

  // Game board
  'game.turn': '回合 {turn}',
  'game.yourTurn': '你的回合',
  'game.waiting': '等待中',
  'game.playArea': '场上',
  'game.noCards': '暂无打出的卡牌',
  'game.endTurn': '结束回合',
  'game.dangerWarning': '危险！健康值过低',

  // Hand view
  'hand.title': '手牌',
  'hand.more': '+{count} 更多',
  'hand.hint': '点击打出 | 长按查看详情',

  // Player stats
  'stats.title': '状态',
  'stats.resources': '资源',
  'stats.statusEffects': '状态效果',

  // Game over screen
  'gameOver.victory': '游戏胜利！',
  'gameOver.defeat': '游戏结束',
  'gameOver.finalStats': '最终数据',
  'gameOver.playAgain': '再来一局',
  'gameOver.mainMenu': '返回主页',

  // Daily challenge
  'dailyChallenge.loading': '加载每日挑战中...',
  'dailyChallenge.title': '每日挑战',
  'dailyChallenge.difficulty': '难度:',
  'dailyChallenge.conditions': '挑战条件:',
  'dailyChallenge.rewards': '奖励:',
  'dailyChallenge.currentStreak': '当前连胜',
  'dailyChallenge.bestStreak': '最佳连胜',
  'dailyChallenge.todayAttempts': '今日尝试',
  'dailyChallenge.start': '开始挑战',
  'dailyChallenge.retry': '再次挑战',
  'dailyChallenge.viewRewards': '查看奖励',
  'dailyChallenge.streakBonus': '连胜奖励:',

  // Challenge conditions
  'condition.noCardTag': '不使用 "{tag}" 类卡牌',
  'condition.maxResourceUsage': '{resource} 消耗不超过 {max}',
  'condition.minStatAtWin': '通关时 {stat} 至少 {min}',
  'condition.maxTurns': '{turns} 回合内完成',
  'condition.noCardType': '不使用 {cardType} 类型卡牌',
  'condition.minCardUsage': '使用至少 {count} 张 "{cardTag}" 卡牌',
  'condition.special': '特殊条件',

  // Achievements
  'achievements.title': '成就',
  'achievements.unlocked': '解锁',
  'achievements.points': '{points} pts',
  'achievements.claim': '领取',
  'achievements.claimed': '已领取',
  'achievements.category.gameplay': '游戏成就',
  'achievements.category.challenge': '挑战成就',
  'achievements.category.milestone': '里程碑',
  'achievements.category.hidden': '隐藏成就',

  // Difficulty selector
  'difficulty.title': '选择难度',
  'difficulty.locked': '完成更低难度以解锁',
  'difficulty.initialStats': '初始数值:',
  'difficulty.perTurn': '每回合:',
  'difficulty.specialRules': '特殊规则:',

  // Language
  'language.title': '语言',
  'language.zh-CN': '简体中文',
  'language.en-US': 'English',

  // Share card
  'share.dialogTitle': '分享战绩',
  'share.share': '分享',
  'share.sharing': '分享中...',
  'share.saveToGallery': '保存到相册',
  'share.saving': '保存中...',
  'share.notAvailable': '分享功能暂不可用',
  'share.watermark': '大厂生存指南',

  // Game over - share
  'gameOver.shareResult': '分享战绩',
  'gameOver.sharePreview': '分享预览',

  // Survival report
  'share.survivalReport.victory': '成功晋升!',
  'share.survivalReport.defeat': '游戏结束',
  'share.survivalReport.turns': '历经 {turns} 回合',
  'share.survivalReport.finalStats': '最终数据',
  'share.survivalReport.highlights': '名场面',

  // Achievement badge
  'share.achievementBadge.unlockedBy': '解锁者',
  'share.achievementBadge.rarity.common': '普通',
  'share.achievementBadge.rarity.uncommon': '稀有',
  'share.achievementBadge.rarity.rare': '精良',
  'share.achievementBadge.rarity.epic': '史诗',
  'share.achievementBadge.rarity.legendary': '传说',

  // Battle report
  'share.battleReport.title': '对战战报',
  'share.battleReport.players': '{count}人对战',
  'share.battleReport.turns': '共{turns}回合',
  'share.battleReport.ranking': '排名',
  'share.battleReport.specialTitles': '特殊称号',
  'share.battleReport.myStats': '我的战绩',
  'share.battleReport.blameShifted': '甩锅成功',
  'share.battleReport.resourcesStolen': '抢夺资源',
  'share.battleReport.attacksInitiated': '发起攻击',
  'share.battleReport.attacksReceived': '承受攻击',
};

export type TranslationKey = keyof typeof zhCN;
