import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@theme-card-games/ui';
import { bigtechWorkerTheme } from '@theme-card-games/theme-bigtech-worker';

export default function RootLayout() {
  return (
    <ThemeProvider themeConfig={bigtechWorkerTheme} locale="zh-CN">
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </ThemeProvider>
  );
}
