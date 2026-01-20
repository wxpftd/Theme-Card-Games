import { SummaryTemplate } from '@theme-card-games/core';

/**
 * 大厂打工人主题的一句话总结模板
 *
 * 变量说明:
 * - {turnsPlayed} - 游戏回合数
 * - {minHealth} - 最低健康值
 * - {maxHealth} - 最高健康值
 * - {maxPerformance} - 最高绩效值
 * - {playerCount} - 玩家数量
 * - {rank} - 最终排名
 * - {blamedCount} - 被甩锅次数
 * - {blameShiftCount} - 甩锅次数
 * - {resourcesStolen} - 抢夺资源总量
 */
export const bigtechSummaryTemplates: SummaryTemplate[] = [
  // ============================================================================
  // 单人模式 - 胜利
  // ============================================================================
  {
    id: 'bt_victory_near_death',
    type: 'victory',
    condition: { type: 'highlight_exists', highlightType: 'near_death_recovery' },
    template: '健康只剩{minHealth}时绝地反击，我终于晋升了！ 🦾 #大厂生存指南',
    priority: 100,
  },
  {
    id: 'bt_victory_perfect',
    type: 'victory',
    condition: { type: 'stat_reached', stat: '健康', operator: '>=', value: 80 },
    template: '健康满格通关！这就是养生式打工的正确姿势 💪 #大厂生存指南',
    priority: 90,
  },
  {
    id: 'bt_victory_combo',
    type: 'victory',
    condition: { type: 'highlight_exists', highlightType: 'combo_triggered' },
    template: '神操作连击！{turnsPlayed}回合成功晋升 🔥 #大厂生存指南',
    priority: 85,
  },
  {
    id: 'bt_victory_fast',
    type: 'victory',
    condition: { type: 'stat_reached', stat: 'turnsPlayed', operator: '<=', value: 10 },
    template: '速通达成！只用{turnsPlayed}回合就晋升了 ⚡ #大厂生存指南',
    priority: 80,
  },
  {
    id: 'bt_victory_normal',
    type: 'victory',
    condition: { type: 'victory' },
    template: '历经{turnsPlayed}个回合的奋斗，我终于在大厂成功晋升！ 🎉 #大厂生存指南',
    priority: 10,
  },

  // ============================================================================
  // 单人模式 - 失败
  // ============================================================================
  {
    id: 'bt_defeat_health_zero',
    type: 'defeat',
    condition: { type: 'defeat', reason: 'health_zero' },
    template: '第{turnsPlayed}回合，我因过度加班倒下了...绩效还有{maxPerformance} 🥲 #大厂生存指南',
    priority: 50,
  },
  {
    id: 'bt_defeat_near_death_fail',
    type: 'defeat',
    condition: { type: 'highlight_exists', highlightType: 'near_death_recovery' },
    template: '曾经濒死逆袭过，最终还是倒在了第{turnsPlayed}回合... 😢 #大厂生存指南',
    priority: 45,
  },
  {
    id: 'bt_defeat_normal',
    type: 'defeat',
    condition: { type: 'defeat', reason: 'any' },
    template: '大厂生存第{turnsPlayed}回合，我光荣毕业了 📦 #大厂生存指南',
    priority: 10,
  },

  // ============================================================================
  // 竞争模式 - 胜利
  // ============================================================================
  {
    id: 'bt_comp_win_blame_king',
    type: 'competitive_win',
    condition: { type: 'competitive_title', titleId: 'blame_king' },
    template: '甩锅技术登峰造极！{playerCount}人混战我是最后赢家 🎯 #大厂生存指南',
    priority: 100,
  },
  {
    id: 'bt_comp_win_credit_thief',
    type: 'competitive_win',
    condition: { type: 'competitive_title', titleId: 'credit_thief' },
    template: '抢了{resourcesStolen}点功劳，这就是卷王的胜利！ 💰 #大厂生存指南',
    priority: 95,
  },
  {
    id: 'bt_comp_win_tough_survivor',
    type: 'competitive_win',
    condition: { type: 'competitive_title', titleId: 'tough_survivor' },
    template: '被针对却笑到最后！韭菜王的逆袭 🌿 #大厂生存指南',
    priority: 90,
  },
  {
    id: 'bt_comp_win_fierce',
    type: 'competitive_win',
    condition: { type: 'competitive_title', titleId: 'fierce_attacker' },
    template: '主动出击才是王道！{playerCount}人战我第一 ⚔️ #大厂生存指南',
    priority: 85,
  },
  {
    id: 'bt_comp_win_normal',
    type: 'competitive_win',
    condition: { type: 'victory' },
    template: '在{playerCount}人的大厂生存战中，我成为了最后的赢家！ 🏆 #大厂生存指南',
    priority: 10,
  },

  // ============================================================================
  // 竞争模式 - 失败
  // ============================================================================
  {
    id: 'bt_comp_lose_blamed',
    type: 'competitive_lose',
    condition: { type: 'competitive_title', titleId: 'blamed_most' },
    template: '被甩了{blamedCount}次锅，我成了大厂活靶子... 🎯 #大厂生存指南',
    priority: 80,
  },
  {
    id: 'bt_comp_lose_second',
    type: 'competitive_lose',
    condition: { type: 'stat_reached', stat: 'rank', operator: '<=', value: 2 },
    template: '差一点就赢了！第{rank}名，下次必胜 💪 #大厂生存指南',
    priority: 70,
  },
  {
    id: 'bt_comp_lose_normal',
    type: 'competitive_lose',
    condition: { type: 'always' },
    template: '大厂{playerCount}人生存战第{rank}名，下次一定卷死他们！ 💪 #大厂生存指南',
    priority: 10,
  },

  // ============================================================================
  // 特殊场景
  // ============================================================================
  {
    id: 'bt_special_final_comeback',
    type: 'special',
    condition: { type: 'highlight_exists', highlightType: 'final_comeback' },
    template: '以仅剩{minHealth}的健康绝地反击获胜！这就是打工人的意志！ 🔥 #大厂生存指南',
    priority: 200,
  },
];
