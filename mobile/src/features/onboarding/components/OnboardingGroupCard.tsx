import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';

export function OnboardingGroupCard({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.outer, style]} {...rest}>
      <LinearGradient
        colors={['rgba(32, 44, 38, 0.88)', 'rgba(24, 26, 28, 0.94)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}>
        <View style={styles.innerHighlight} pointerEvents="none" />
        {children}
      </LinearGradient>
    </View>
  );
}

export function OnboardingGroupDivider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(61, 214, 140, 0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  card: {
    borderRadius: 19,
    overflow: 'hidden',
  },
  innerHighlight: {
    ...StyleSheet.absoluteFill,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: 64,
  },
});
