import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { clearProfile, loadProfile, saveProfile } from '@/lib/profile/profile-storage';
import type { UserProfile } from '@/lib/profile/types';

type ProfileContextValue = {
  profile: UserProfile | null;
  isLoading: boolean;
  onboardingComplete: boolean;
  completeOnboarding: (profile: UserProfile) => Promise<void>;
  clearProfileData: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadProfile().then((stored) => {
      if (mounted) {
        setProfile(stored);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const completeOnboarding = useCallback(async (next: UserProfile) => {
    await saveProfile(next);
    setProfile(next);
  }, []);

  const clearProfileData = useCallback(async () => {
    await clearProfile();
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      isLoading,
      onboardingComplete: Boolean(profile?.onboardingCompletedAt),
      completeOnboarding,
      clearProfileData,
    }),
    [profile, isLoading, completeOnboarding, clearProfileData],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return ctx;
}
