import { usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/auth-context';
import { HomeTodayJumpButton } from '@/features/home/components/HomeTodayJumpButton';
import { useHomeChromeBridgeOptional } from '@/features/home/context/home-chrome-bridge';
import { ProfileOpenButton } from '@/features/profile/components/ProfileOpenButton';
import { AppChromeBackButton } from '@/shared/components/i18n/AppChromeBackButton';
import { LanguageSwitcher } from '@/shared/components/i18n/LanguageSwitcher';
import { Spacing } from '@/shared/constants/theme';

/** Профиль и чип языка — одна высота строки. */
const TOP_BAR_CONTROL_SIZE = 44;

/** Высота полосы под верхние контролы (без safe area). */
export const APP_LANGUAGE_ROW_HEIGHT = TOP_BAR_CONTROL_SIZE;

function isProfileRoute(pathname: string): boolean {
  return pathname === '/profile' || pathname.startsWith('/profile/');
}

/** Экраны основного приложения после входа — одна высота верхней полосы. */
export function isLoggedInAppShellRoute(pathname: string): boolean {
  return pathname === '/home' || pathname === '/food/detail' || isProfileRoute(pathname);
}

function useTopChromeState() {
  const pathname = usePathname();
  const { session, isLoading } = useAuth();
  const loggedIn = !isLoading && !!session;
  const onHome = pathname === '/home';
  const showLanguage = !isLoading && !session;
  const inAppShell = loggedIn && isLoggedInAppShellRoute(pathname);
  const showProfile = loggedIn && onHome;
  const showAppBack = inAppShell && !onHome;
  const hasBar = showLanguage || inAppShell;
  const reserveTopChromeInset = showLanguage || inAppShell;
  return { showLanguage, showProfile, showAppBack, hasBar, reserveTopChromeInset };
}

export function useAppLanguageTopInset(): number {
  const insets = useSafeAreaInsets();
  const { reserveTopChromeInset } = useTopChromeState();
  return insets.top + (reserveTopChromeInset ? APP_LANGUAGE_ROW_HEIGHT : 0);
}

/**
 * Глобальная верхняя зона: язык до входа, профиль на home после входа.
 */
export function AppLanguageChrome() {
  const { showLanguage, showProfile, showAppBack, hasBar } = useTopChromeState();
  const homeChrome = useHomeChromeBridgeOptional();
  const todayJump = showProfile ? homeChrome?.todayJump : null;

  if (!hasBar) {
    return null;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.host} pointerEvents="box-none">
      <View
        style={[
          styles.toolbar,
          (showProfile || showAppBack) && !showLanguage && !todayJump && styles.toolbarLeadingOnly,
          showProfile && todayJump && styles.toolbarHome,
        ]}
        pointerEvents="auto">
        {showProfile ? (
          <ProfileOpenButton />
        ) : showAppBack ? (
          <AppChromeBackButton />
        ) : (
          <View style={styles.leadingSpacer} />
        )}
        {showLanguage ? <LanguageSwitcher /> : null}
        {todayJump ? <HomeTodayJumpButton onPress={todayJump.onPress} /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    zIndex: 200,
    elevation: 200,
    pointerEvents: 'box-none',
  },
  toolbar: {
    minHeight: TOP_BAR_CONTROL_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
  },
  toolbarLeadingOnly: {
    justifyContent: 'flex-start',
  },
  toolbarHome: {
    justifyContent: 'space-between',
  },
  leadingSpacer: {
    width: 1,
  },
});
