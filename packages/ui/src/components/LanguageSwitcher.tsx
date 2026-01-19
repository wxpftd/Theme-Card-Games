import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useI18n, Locale } from '../i18n';

interface LanguageSwitcherProps {
  /** Display mode: 'full' shows buttons, 'compact' shows icon only */
  mode?: 'full' | 'compact';
  /** Custom style */
  style?: ViewStyle;
}

const languageLabels: Record<Locale, { native: string; flag: string }> = {
  'zh-CN': { native: '中文', flag: '🇨🇳' },
  'en-US': { native: 'English', flag: '🇺🇸' },
};

/**
 * Language switcher component
 *
 * Allows users to switch between available languages.
 *
 * @example
 * ```tsx
 * <LanguageSwitcher mode="full" />
 * ```
 */
export function LanguageSwitcher({ mode = 'full', style }: LanguageSwitcherProps) {
  const { theme } = useTheme();
  const { locale, setLocale, availableLocales, t } = useI18n();

  if (mode === 'compact') {
    // Compact mode: just toggle between languages
    const nextLocale = locale === 'zh-CN' ? 'en-US' : 'zh-CN';

    return (
      <TouchableOpacity
        style={[styles.compactButton, { backgroundColor: theme.colors.surface }, style]}
        onPress={() => setLocale(nextLocale)}
      >
        <Text style={styles.compactFlag}>{languageLabels[locale].flag}</Text>
      </TouchableOpacity>
    );
  }

  // Full mode: show all language options
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{t('language.title')}</Text>
      <View style={styles.buttonGroup}>
        {availableLocales.map((loc) => {
          const isActive = locale === loc;
          const { native, flag } = languageLabels[loc];

          return (
            <TouchableOpacity
              key={loc}
              style={[
                styles.languageButton,
                {
                  backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                  borderColor: isActive ? theme.colors.primary : theme.colors.textSecondary,
                },
              ]}
              onPress={() => setLocale(loc)}
            >
              <Text style={styles.flag}>{flag}</Text>
              <Text style={[styles.languageText, { color: isActive ? '#fff' : theme.colors.text }]}>
                {native}
              </Text>
              {isActive && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  flag: {
    fontSize: 20,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  compactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactFlag: {
    fontSize: 24,
  },
});
