import { StyleSheet, Text } from 'react-native';

import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

export function ProfileSectionHeader({ title }: { title: string }) {
  return <Text style={styles.label}>{title}</Text>;
}

const styles = StyleSheet.create({
  label: {
    color: AuthScreenTheme.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.two,
    marginLeft: Spacing.one,
  },
});
