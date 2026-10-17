import { DarkTheme, type Theme } from 'expo-router';
import { Platform } from 'react-native';

import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';

/** Фон стека навигации = чёрный, без белой вспышки между экранами. */
export const CaloriVoiceNavigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: AuthScreenTheme.bg,
    card: AuthScreenTheme.bg,
    border: 'rgba(255, 255, 255, 0.08)',
  },
};

export const stackScreenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: AuthScreenTheme.bg },
  animation: Platform.select({
    ios: 'slide_from_right' as const,
    default: 'fade_from_bottom' as const,
  }),
  fullScreenGestureEnabled: true,
  gestureEnabled: true,
};
