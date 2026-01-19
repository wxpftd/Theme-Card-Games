import { zhCN } from './zh-CN';
import { enUS } from './en-US';

export { zhCN, enUS };

/**
 * Get all theme translations merged with base localization
 */
export function getThemeLocalization() {
  return {
    'zh-CN': zhCN,
    'en-US': enUS,
  };
}
