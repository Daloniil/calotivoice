import { useRouter } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';

const SIZE = 44;
const ICON = 22;

export function AppChromeBackButton() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      hitSlop={8}
      onPress={() => router.back()}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <CaretLeft color={AuthScreenTheme.text} size={ICON} weight="bold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: AuthScreenTheme.surface,
    borderWidth: 1,
    borderColor: AuthScreenTheme.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
});
