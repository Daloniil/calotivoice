import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthGradientBackground } from '@/features/auth/components/AuthGradientBackground';
import { ProfileListCard, ProfileListDivider } from '@/features/profile/components/ProfileListCard';
import { ProfileToolbar } from '@/features/profile/components/ProfileToolbar';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/contexts/profile-context';
import { formatHeight, formatWeight } from '@/lib/profile/units';
import { useAppLanguageTopInset } from '@/shared/components/i18n/AppLanguageChrome';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function ProfileGoalsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const languageTopInset = useAppLanguageTopInset();
  const { session, needsWelcome } = useAuth();
  const { profile, onboardingComplete } = useProfile();

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  if (needsWelcome || !onboardingComplete || !profile) {
    return <Redirect href="/onboarding" />;
  }

  const weightUnit = profile.units.weight;
  const heightUnit = profile.units.height;
  const currentWeight = formatWeight(profile.weightKg, weightUnit);
  const targetWeight = formatWeight(profile.targetWeightKg, weightUnit);
  const heightValue = formatHeight(profile.heightCm, heightUnit);
  const heightSuffix = t(`profile.units.${heightUnit}`);
  const weightSuffix = t(`profile.units.${weightUnit}`);

  return (
    <AuthGradientBackground style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={{ height: languageTopInset }} />
        <ProfileToolbar />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{t('profile.menu.goals')}</Text>

          <ProfileListCard>
            <MetricRow label={t('profile.fields.goal')} value={t(`onboarding.goals.${profile.goal}.label`)} />
            <ProfileListDivider />
            <MetricRow label={t('profile.fields.sex')} value={t(`onboarding.sex.${profile.sex}`)} />
            <ProfileListDivider />
            <MetricRow label={t('profile.fields.birthDate')} value={profile.birthDate} />
            <ProfileListDivider />
            <MetricRow
              label={t('profile.fields.activity')}
              value={t(`onboarding.activity.${profile.activityLevel}.label`)}
            />
          </ProfileListCard>

          <ProfileListCard style={styles.secondCard}>
            <MetricRow
              label={t('profile.metrics.height')}
              value={`${heightValue} ${heightSuffix}`}
            />
            <ProfileListDivider />
            <MetricRow
              label={t('profile.metrics.currentWeight')}
              value={`${currentWeight} ${weightSuffix}`}
            />
            <ProfileListDivider />
            <MetricRow
              label={t('profile.metrics.targetWeight')}
              value={`${targetWeight} ${weightSuffix}`}
            />
          </ProfileListCard>
        </ScrollView>

        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12} style={styles.backLink}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </Pressable>
      </SafeAreaView>
    </AuthGradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing.four },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },
  title: {
    color: AuthScreenTheme.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: Spacing.one,
  },
  secondCard: { marginTop: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  rowLabel: {
    flex: 1,
    color: AuthScreenTheme.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  rowValue: {
    flexShrink: 1,
    color: AuthScreenTheme.text,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
  },
  backText: {
    color: AuthScreenTheme.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
});
