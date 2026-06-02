import '@/global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TrackProvider } from '@/state/track-store';

export default function RootLayout() {
  // Follow system theme; fall back to dark when the platform doesn't report one.
  const system = useColorScheme();
  const isDark = (system ?? 'dark') === 'dark';

  return (
    <SafeAreaProvider>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <TrackProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </TrackProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
