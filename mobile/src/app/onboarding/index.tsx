import { Redirect } from 'expo-router';

import { OnboardingFlow } from '@/features/onboarding/components/OnboardingFlow';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/contexts/profile-context';

export default function OnboardingRoute() {
  const { session } = useAuth();
  const { onboardingComplete } = useProfile();

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  if (onboardingComplete) {
    return <Redirect href="/home" />;
  }

  return <OnboardingFlow />;
}
