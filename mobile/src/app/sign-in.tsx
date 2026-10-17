import { Redirect } from 'expo-router';

import { LoginScreen } from '@/features/auth/components/LoginScreen';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/contexts/profile-context';

/** Экран входа; после OTP — replace на онбординг (welcome = шаг 0). */
export default function SignInRoute() {
  const { session, needsWelcome } = useAuth();
  const { onboardingComplete } = useProfile();

  if (session && !needsWelcome && onboardingComplete) {
    return <Redirect href="/home" />;
  }

  return <LoginScreen />;
}
