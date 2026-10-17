import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/contexts/profile-context';

export default function IndexRoute() {
  const { session, needsWelcome, isLoading: authLoading } = useAuth();
  const { onboardingComplete, isLoading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return <View style={styles.boot} />;
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  if (needsWelcome || !onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/home" />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: AuthScreenTheme.bg,
  },
});
