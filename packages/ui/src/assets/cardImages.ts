/**
 * 卡牌插画资源映射
 * 将卡牌 ID 映射到对应的插画资源路径
 */

// 卡牌插画路径映射表
export const cardImagePaths: Record<string, string> = {
  // 工作系列
  overtime: 'cards/overtime.png',
  bug_fix: 'cards/bug_fix.png',
  project_delivery: 'cards/project_delivery.png',
  code_review: 'cards/code_review.png',
  ppt_presentation: 'cards/ppt_presentation.png',

  // 健康系列
  gym_workout: 'cards/gym_workout.png',
  meditation: 'cards/meditation.png',

  // 社交系列
  coffee_break: 'cards/coffee_break.png',
  team_building: 'cards/team_building.png',
  networking: 'cards/networking.png',

  // 成长系列
  skill_training: 'cards/skill_training.png',
  promotion: 'cards/promotion.png',

  // 意外系列
  server_crash: 'cards/server_crash.png',

  // 营商系列
  stock_investment: 'cards/stock_investment.png',
  side_project: 'cards/side_project.png',

  // 环境系列
  market_boom: 'cards/market_boom.png',
  layoff_wave: 'cards/layoff_wave.png',
  new_policy: 'cards/new_policy.png',
  remote_work: 'cards/remote_work.png',
  office_politics: 'cards/office_politics.png',
};

// 卡牌系列背景颜色映射
export const seriesBackgroundColors: Record<string, string[]> = {
  work: ['#1E3A5F', '#2C5282'],
  health: ['#2D3748', '#4A5568'],
  social: ['#553C9A', '#6B46C1'],
  growth: ['#22543D', '#276749'],
  accident: ['#742A2A', '#9B2C2C'],
  business: ['#744210', '#975A16'],
  environment: ['#234E52', '#285E61'],
  neutral: ['#4A5568', '#718096'],
};

// 获取卡牌插画路径
export function getCardImagePath(cardId: string): string | null {
  return cardImagePaths[cardId] || null;
}

// 获取系列背景颜色
export function getSeriesBackground(series: string): string[] {
  return seriesBackgroundColors[series] || seriesBackgroundColors.neutral;
}

// 默认卡牌背面图片路径
export const defaultCardBackPath = 'card_back.png';

// 检查卡牌是否有插画
export function hasCardImage(cardId: string): boolean {
  return cardId in cardImagePaths;
}

// 获取所有有插画的卡牌 ID
export function getIllustratedCardIds(): string[] {
  return Object.keys(cardImagePaths);
}
