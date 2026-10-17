import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppleHealthIcon } from '@/features/onboarding/components/AppleHealthIcon';
import { OnboardingGroupCard } from '@/features/onboarding/components/OnboardingGroupCard';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { readAppleHealthProfile } from '@/lib/health/apple-health';
import type { AppleHealthSnapshot } from '@/lib/health/apple-health';

type AppleHealthFillButtonProps = {
  onImported: (data: AppleHealthSnapshot) => void;
};

export function AppleHealthFillButton({ onImported }: AppleHealthFillButtonProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  return (
    <OnboardingGroupCard>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('health.fillFromAppleHealth')}
        disabled={loading}
        onPress={async () => {
          setLoading(true);
          try {
            const data = await readAppleHealthProfile();
            onImported(data);
          } catch (e: unknown) {
            Alert.alert(
              t('health.alertTitle'),
              e instanceof Error ? e.message : t('health.importFailed'),
            );
          } finally {
            setLoading(false);
          }
        }}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed, loading && styles.disabled]}>
        <AppleHealthIcon size={36} variant="dark" />
        <Text style={styles.label}>{t('health.fillFromAppleHealth')}</Text>
        <View style={styles.trailing}>
          {loading ? <ActivityIndicator color="#8E8E93" size="small" /> : null}
        </View>
      </Pressable>
    </OnboardingGroupCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  rowPressed: {
    backgroundColor: 'rgba(61, 214, 140, 0.1)',
  },
  disabled: {
    opacity: 0.85,
  },
  label: {
    flex: 1,
    color: AuthScreenTheme.text,
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  trailing: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
