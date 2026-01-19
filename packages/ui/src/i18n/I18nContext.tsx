import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { zhCN, enUS, TranslationKey } from './translations';

/**
 * Supported locales
 */
export type Locale = 'zh-CN' | 'en-US';

/**
 * Translation dictionary type
 */
type Translations = Record<string, string>;

/**
 * All translations by locale
 */
const translations: Record<Locale, Translations> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

/**
 * I18n context value
 */
interface I18nContextValue {
  /** Current locale */
  locale: Locale;
  /** Set the current locale */
  setLocale: (locale: Locale) => void;
  /** Translate a key with optional interpolation */
  t: (key: TranslationKey | string, params?: Record<string, string | number>) => string;
  /** List of available locales */
  availableLocales: Locale[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  /** Initial locale, defaults to 'zh-CN' */
  initialLocale?: Locale;
  /** Children components */
  children: ReactNode;
}

/**
 * I18n Provider component
 *
 * Provides internationalization context to the component tree.
 *
 * @example
 * ```tsx
 * <I18nProvider initialLocale="en-US">
 *   <App />
 * </I18nProvider>
 * ```
 */
export function I18nProvider({ initialLocale = 'zh-CN', children }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  /**
   * Translate a key with optional parameter interpolation
   *
   * @param key - Translation key
   * @param params - Optional parameters for interpolation, e.g., { turn: 5 }
   * @returns Translated string with interpolated values
   *
   * @example
   * t('game.turn', { turn: 5 }) // "Turn 5" or "回合 5"
   */
  const t = useCallback(
    (key: TranslationKey | string, params?: Record<string, string | number>): string => {
      const dict = translations[locale];
      let text = dict[key] ?? key;

      // Interpolate parameters
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
        });
      }

      return text;
    },
    [locale]
  );

  const availableLocales = useMemo<Locale[]>(() => ['zh-CN', 'en-US'], []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      availableLocales,
    }),
    [locale, t, availableLocales]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook to access i18n context
 *
 * @returns I18n context value
 * @throws Error if used outside I18nProvider
 *
 * @example
 * ```tsx
 * const { t, locale, setLocale } = useI18n();
 * return <Text>{t('game.turn', { turn: 5 })}</Text>;
 * ```
 */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

/**
 * Hook to get only the translation function
 *
 * @returns Translation function
 *
 * @example
 * ```tsx
 * const t = useTranslation();
 * return <Text>{t('game.endTurn')}</Text>;
 * ```
 */
export function useTranslation() {
  const { t } = useI18n();
  return t;
}

/**
 * Hook to get only the current locale
 *
 * @returns Current locale
 */
export function useLocale(): Locale {
  const { locale } = useI18n();
  return locale;
}
