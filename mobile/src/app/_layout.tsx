import { ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useCallback, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { ProfileProvider, useProfile } from '@/contexts/profile-context';
import { SplashTransitionOverlay } from '@/features/auth/components/SplashTransitionOverlay';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { CaloriVoiceNavigationTheme, stackScreenOptions } from '@/shared/constants/navigation-theme';
import { HomeChromeBridgeProvider } from '@/features/home/context/home-chrome-bridge';
import { AppLanguageChrome } from '@/shared/components/i18n/AppLanguageChrome';
import { i18n, initI18n } from '@/i18n';

SplashScreen.preventAutoHideAsync();

function RootNavigation() {
  const { isLoading: authLoading } = useAuth();
  const { isLoading: profileLoading } = useProfile();
  const appReady = !authLoading && !profileLoading;
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
  }, []);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(AuthScreenTheme.bg);
  }, []);

  if (!appReady) {
    return (
      <View style={styles.appShell}>
        <HomeChromeBridgeProvider>
        <View style={styles.boot} />
        <AppLanguageChrome />
        </HomeChromeBridgeProvider>
      </View>
    );
  }

  return (
    <ThemeProvider value={CaloriVoiceNavigationTheme}>
      <View style={styles.appShell}>
        <HomeChromeBridgeProvider>
        <Stack screenOptions={stackScreenOptions}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="sign-in" options={{ animation: splashDone ? 'default' : 'none' }} />
          <Stack.Screen name="welcome" options={{ animation: splashDone ? 'default' : 'none' }} />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="home" />
          <Stack.Screen name="food/detail" />
          <Stack.Screen name="profile" />
        </Stack>
        <AppLanguageChrome />
        {!splashDone ? <SplashTransitionOverlay onFinish={handleSplashFinish} /> : null}
        </HomeChromeBridgeProvider>
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  if (!i18nReady) {
    return <View style={styles.boot} />;
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <ProfileProvider>
            <RootNavigation />
          </ProfileProvider>
        </AuthProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  appShell: {
    flex: 1,
  },
  boot: {
    flex: 1,
    backgroundColor: AuthScreenTheme.bg,
  },
});
