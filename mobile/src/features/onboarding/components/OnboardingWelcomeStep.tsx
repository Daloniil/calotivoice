import { StyleSheet, View } from 'react-native';

import { AuthWelcomeTitle } from '@/features/auth/components/AuthWelcomeTitle';
import { Spacing } from '@/shared/constants/theme';

export function OnboardingWelcomeStep() {
  return (
    <View style={styles.root}>
      <View style={styles.spacer} />
      <AuthWelcomeTitle />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingBottom: Spacing.two,
  },
  spacer: {
    flex: 1,
  },
});
