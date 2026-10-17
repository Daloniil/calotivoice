import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

export function AuthWelcomeTitle() {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <Text style={styles.line}>{t('welcome.line')}</Text>
      <Text style={styles.brand}>{t('welcome.brand')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.half,
    alignSelf: 'stretch',
  },
  line: {
    color: AuthScreenTheme.text,
    fontSize: 34,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  brand: {
    color: AuthScreenTheme.accent,
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
});
