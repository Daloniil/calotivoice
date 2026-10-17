import * as Haptics from 'expo-haptics';
import { ArrowUUpLeft } from 'phosphor-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { useAppTranslation } from '@/i18n';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';

const SIZE = 28;

type Props = {
  onPress: () => void;
};

/** «Вернуться к сегодня» — в полосе хедера справа, не сдвигает календарь. */
export function HomeTodayJumpButton({ onPress }: Props) {
  const { t } = useAppTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('home.dashboard.calendar.jumpToTodayA11y')}
      hitSlop={10}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <ArrowUUpLeft color={AuthScreenTheme.accent} size={16} weight="bold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 16, 18, 0.88)',
    borderWidth: 1.5,
    borderColor: AuthScreenTheme.accent,
  },
  pressed: {
    opacity: 0.88,
  },
});
