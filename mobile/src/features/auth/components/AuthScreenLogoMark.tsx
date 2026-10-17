import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { CaloriVoiceLogo } from '@/shared/components/brand/CaloriVoiceLogo';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

type AuthScreenLogoMarkProps = {
  style?: StyleProp<ViewStyle>;
};

/** Лого + glow — как на экране входа (sign-in). */
export function AuthScreenLogoMark({ style }: AuthScreenLogoMarkProps) {
  return (
    <View style={[styles.logoBlock, style]}>
      <View style={styles.glow} />
      <CaloriVoiceLogo size={76} forceDark />
    </View>
  );
}

const styles = StyleSheet.create({
  logoBlock: {
    alignSelf: 'flex-start',
    marginTop: Spacing.three,
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AuthScreenTheme.glow,
    top: -18,
    left: -16,
    opacity: 0.55,
  },
});
