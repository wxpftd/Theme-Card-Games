import React, { createContext, useContext, useMemo } from 'react';
import { UITheme, ThemeConfig } from '@theme-card-games/core';

interface ThemeContextValue {
  theme: UITheme;
  config: ThemeConfig;
  t: (key: string, locale?: string) => string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  themeConfig: ThemeConfig;
  locale?: string;
  children: React.ReactNode;
}

export function ThemeProvider({ themeConfig, locale = 'zh-CN', children }: ThemeProviderProps) {
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themeConfig.uiTheme,
      config: themeConfig,
      t: (key: string, loc?: string) => {
        const l = loc ?? locale;
        return themeConfig.localization[l]?.[key] ?? key;
      },
    }),
    [themeConfig, locale]
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
