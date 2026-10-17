import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableStateCallbackType,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/shared/components/ui/themed-text';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Brand, Spacing } from '@/shared/constants/theme';

type PrimaryButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'authDark';
};

export function PrimaryButton({
  label,
  loading,
  variant = 'primary',
  disabled,
  style,
  ...rest
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  const resolveStyle = (state: PressableStateCallbackType): StyleProp<ViewStyle> => [
    styles.base,
    variant === 'authDark'
      ? isDisabled
        ? styles.authDarkDisabled
        : styles.authDarkEnabled
      : variant === 'primary'
        ? styles.primary
        : styles.secondary,
    state.pressed && !isDisabled && styles.pressed,
    isDisabled && styles.disabled,
    typeof style === 'function' ? style(state) : style,
  ];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={(state) => resolveStyle(state)}
      {...rest}>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <ThemedText
          type="smallBold"
          style={[
            styles.label,
            variant === 'primary' || (variant === 'authDark' && !isDisabled)
              ? styles.labelOnPrimary
              : variant === 'authDark'
                ? styles.labelDisabled
                : styles.labelSecondary,
          ]}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  primary: {
    backgroundColor: Brand.accent,
  },
  authDarkEnabled: {
    backgroundColor: Brand.accent,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  authDarkDisabled: {
    backgroundColor: AuthScreenTheme.surface,
    borderWidth: 1,
    borderColor: AuthScreenTheme.surfaceBorder,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Brand.accentMuted,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
  },
  labelOnPrimary: {
    color: '#fff',
  },
  labelSecondary: {
    color: Brand.accent,
  },
  labelDisabled: {
    color: AuthScreenTheme.textMuted,
  },
});
