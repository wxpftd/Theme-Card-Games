import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { UITheme, ThemeConfig } from '@theme-card-games/core';

interface ThemeContextValue {
  theme: UITheme;
  config: ThemeConfig;
  locale: string;
  /** Translate a theme-specific key (for game content like cards, achievements, etc.) */
  t: (key: string, params?: Record<string, string | number>) => string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  themeConfig: ThemeConfig;
  locale?: string;
  children: React.ReactNode;
}

export function ThemeProvider({ themeConfig, locale = 'zh-CN', children }: ThemeProviderProps) {
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let text = themeConfig.localization[locale]?.[key] ?? key;

      // Interpolate parameters
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
        });
      }

      return text;
    },
    [themeConfig.localization, locale]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themeConfig.uiTheme,
      config: themeConfig,
      locale,
      t,
    }),
    [themeConfig, locale, t]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useColors() {
  const { theme } = useTheme();
  return theme.colors;
}

export function useSpacing() {
  const { theme } = useTheme();
  return theme.spacing;
}

export function useBorderRadius() {
  const { theme } = useTheme();
  return theme.borderRadius;
}
