import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Bell,
  DownloadSimple,
  Heart,
  Lifebuoy,
  LockKey,
  ShieldCheck,
  Star,
  Trash,
  UserCircle,
  FileText,
  Pulse,
  Info,
} from 'phosphor-react-native';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthGradientBackground } from '@/features/auth/components/AuthGradientBackground';
import { ProfileIdentityCard } from '@/features/profile/components/ProfileIdentityCard';
import { ProfileLanguageRow } from '@/features/profile/components/ProfileLanguageRow';
import { ProfileListCard, ProfileListDivider } from '@/features/profile/components/ProfileListCard';
import {
  ProfileBadge,
  ProfileMenuRow,
  ProfileTrailingText,
} from '@/features/profile/components/ProfileMenuRow';
import { ProfileSectionHeader } from '@/features/profile/components/ProfileSectionHeader';
import { ProfileToolbar } from '@/features/profile/components/ProfileToolbar';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/contexts/profile-context';
import { useAppLanguageTopInset } from '@/shared/components/i18n/AppLanguageChrome';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

function displayNameFromSession(email: string | null, userId: string): string {
  if (email) {
    const local = email.split('@')[0]?.trim();
    if (local) return local;
  }
  return userId.slice(0, 12);
}

export function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const languageTopInset = useAppLanguageTopInset();
  const { session, needsWelcome, signOut } = useAuth();
  const { onboardingComplete, clearProfileData } = useProfile();

  const showComingSoon = (title: string) => {
    Alert.alert(title, t('profile.comingSoon'));
  };

  const handleDeleteAccount = () => {
    Alert.alert(t('profile.menu.deleteAccount'), t('profile.deleteConfirm'), [
      { text: t('profile.cancel'), style: 'cancel' },
      {
        text: t('profile.menu.deleteAccount'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await clearProfileData();
            await signOut();
          })();
        },
      },
    ]);
  };

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  if (needsWelcome || !onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  const email = session.email ?? session.userId;
  const displayName = displayNameFromSession(session.email, session.userId);

  return (
    <AuthGradientBackground style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={{ height: languageTopInset }} />

        <ProfileToolbar onSettingsPress={() => showComingSoon(t('profile.settingsA11y'))} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('profile.title')}</Text>

          <ProfileIdentityCard displayName={displayName} email={email} />

          <View style={styles.section}>
            <ProfileSectionHeader title={t('profile.sections.personal')} />
            <ProfileListCard>
              <ProfileMenuRow
                IconComponent={UserCircle}
                iconColor="#FF9F0A"
                iconTint="rgba(255, 159, 10, 0.18)"
                label={t('profile.menu.goals')}
                onPress={() => router.push('/profile/goals')}
              />
              <ProfileListDivider />
              <ProfileMenuRow
                IconComponent={Star}
                iconColor="#FFD60A"
                iconTint="rgba(255, 214, 10, 0.18)"
                label={t('profile.menu.subscription')}
                trailing={<ProfileBadge text={t('profile.upgrade')} />}
                onPress={() => showComingSoon(t('profile.menu.subscription'))}
              />
              <ProfileListDivider />
              <ProfileMenuRow
                IconComponent={Bell}
                iconColor="#FF453A"
                iconTint="rgba(255, 69, 58, 0.18)"
                label={t('profile.menu.notifications')}
                onPress={() => showComingSoon(t('profile.menu.notifications'))}
              />
              <ProfileListDivider />
              <ProfileMenuRow
                IconComponent={Heart}
                iconColor="#3DD68C"
                iconTint="rgba(61, 214, 140, 0.18)"
                label={t('profile.menu.healthSync')}
                trailing={<ProfileTrailingText text={t('profile.appleHealth')} />}
                onPress={() => showComingSoon(t('profile.menu.healthSync'))}
              />
              <ProfileListDivider />
              <ProfileLanguageRow />
            </ProfileListCard>
          </View>

          <View style={styles.section}>
            <ProfileSectionHeader title={t('profile.sections.info')} />
            <ProfileListCard>
              <ProfileMenuRow
                IconComponent={Lifebuoy}
                iconColor="#FF9F0A"
                iconTint="rgba(255, 159, 10, 0.18)"
                label={t('profile.menu.help')}
                onPress={() => showComingSoon(t('profile.menu.help'))}
              />
              <ProfileListDivider />
              <ProfileMenuRow
                IconComponent={Info}
                iconColor="#BF5AF2"
                iconTint="rgba(191, 90, 242, 0.18)"
                label={t('profile.menu.about')}
                onPress={() => showComingSoon(t('profile.menu.about'))}
              />
              <ProfileListDivider />
              <ProfileMenuRow
                IconComponent={ShieldCheck}
                iconColor="#3DD68C"
                iconTint="rgba(61, 214, 140, 0.18)"
                label={t('profile.menu.privacy')}
                onPress={() => showComingSoon(t('profile.menu.privacy'))}
              />
              <ProfileListDivider />
              <ProfileMenuRow
                IconComponent={FileText}
                iconColor="#5AC8FA"
                iconTint="rgba(90, 200, 250, 0.18)"
                label={t('profile.menu.terms')}
                onPress={() => showComingSoon(t('profile.menu.terms'))}
              />
              <ProfileListDivider />
              <ProfileMenuRow
                IconComponent={Pulse}
                iconColor="#FF375F"
                iconTint="rgba(255, 55, 95, 0.18)"
                label={t('profile.menu.medical')}
                onPress={() => showComingSoon(t('profile.menu.medical'))}
              />
            </ProfileListCard>
          </View>

          <View style={styles.section}>
            <ProfileSectionHeader title={t('profile.sections.account')} />
            <ProfileListCard>
              <ProfileMenuRow
                IconComponent={LockKey}
                iconColor="#3DD68C"
                iconTint="rgba(61, 214, 140, 0.18)"
                label={t('profile.menu.signInMethod')}
                onPress={() => showComingSoon(t('profile.menu.signInMethod'))}
              />
              <ProfileListDivider />
              <ProfileMenuRow
                IconComponent={DownloadSimple}
                iconColor="#5AC8FA"
                iconTint="rgba(90, 200, 250, 0.18)"
                label={t('profile.menu.downloadData')}
                showChevron={false}
                footer={
                  <View style={styles.downloadBlock}>
                    <Text style={styles.downloadHint}>{t('profile.downloadHint')}</Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => showComingSoon(t('profile.menu.downloadData'))}
                      style={({ pressed }) => [styles.prepareBtn, pressed && styles.prepareBtnPressed]}>
                      <Text style={styles.prepareBtnText}>{t('profile.prepareData')}</Text>
                    </Pressable>
                  </View>
                }
              />
              <ProfileListDivider />
              <ProfileMenuRow
                IconComponent={Trash}
                iconColor="#FF453A"
                iconTint="rgba(255, 69, 58, 0.18)"
                label={t('profile.menu.deleteAccount')}
                destructive
                onPress={handleDeleteAccount}
              />
            </ProfileListCard>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => void signOut()}
            style={styles.signOut}>
            <Text style={styles.signOutText}>{t('home.signOut')}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </AuthGradientBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  scrollContent: {
    flexGrow: 1,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  title: {
    color: AuthScreenTheme.text,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginBottom: Spacing.one,
  },
  section: {
    marginTop: Spacing.two,
  },
  downloadBlock: {
    marginTop: Spacing.one,
    gap: Spacing.two,
  },
  downloadHint: {
    color: AuthScreenTheme.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  prepareBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  prepareBtnPressed: {
    opacity: 0.88,
  },
  prepareBtnText: {
    color: AuthScreenTheme.text,
    fontSize: 15,
    fontWeight: '600',
  },
  signOut: {
    alignSelf: 'center',
    paddingVertical: Spacing.three,
  },
  signOutText: {
    color: AuthScreenTheme.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});
