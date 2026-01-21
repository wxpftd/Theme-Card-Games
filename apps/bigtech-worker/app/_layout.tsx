import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, I18nProvider, useI18n, TutorialProvider } from '@theme-card-games/ui';
import { bigtechWorkerTheme } from '@theme-card-games/theme-bigtech-worker';

/**
 * Inner layout component that uses the I18n context
 */
function InnerLayout() {
  const { locale } = useI18n();

  return (
    <ThemeProvider themeConfig={bigtechWorkerTheme} locale={locale}>
      <TutorialProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </TutorialProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <I18nProvider initialLocale="zh-CN">
      <InnerLayout />
    </I18nProvider>
  );
}
