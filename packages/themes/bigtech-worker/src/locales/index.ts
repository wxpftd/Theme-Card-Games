export { zhCN } from './zh-CN';
export { enUS } from './en-US';

/**
 * Get all theme translations merged with base localization
 */
export function getThemeLocalization() {
  return {
    'zh-CN': require('./zh-CN').zhCN,
    'en-US': require('./en-US').enUS,
  };
}
