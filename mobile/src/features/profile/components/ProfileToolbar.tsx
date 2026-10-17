import { GearSix } from 'phosphor-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CaloriVoiceLogo } from '@/shared/components/brand/CaloriVoiceLogo';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

const BTN = 44;
const LOGO = 28;

type ProfileToolbarProps = {
  onSettingsPress?: () => void;
};

export function ProfileToolbar({ onSettingsPress }: ProfileToolbarProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      <View style={styles.iconBtn} pointerEvents="none">
        <CaloriVoiceLogo size={LOGO} forceDark />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('profile.settingsA11y')}
        hitSlop={8}
        onPress={onSettingsPress}
        style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
        <GearSix color={AuthScreenTheme.text} size={22} weight="duotone" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  iconBtn: {
    width: BTN,
    height: BTN,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
