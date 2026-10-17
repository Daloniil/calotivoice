import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

export function AuthSignInHeader() {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('auth.signInTitle')}</Text>
      <Text style={styles.subtitle}>{t('auth.signInSubtitle')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.one,
    alignSelf: 'stretch',
    marginBottom: Spacing.one,
  },
  title: {
    color: AuthScreenTheme.text,
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: AuthScreenTheme.textMuted,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
});
