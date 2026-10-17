import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

type AuthTextFieldProps = TextInputProps & {
  error?: string | null;
  /** Без лейбла — только placeholder, тёмный стиль входа. */
  tone?: 'default' | 'authDark';
  label?: string;
};

export function AuthTextField({
  label,
  error,
  tone = 'authDark',
  style,
  placeholderTextColor,
  ...rest
}: AuthTextFieldProps) {
  const isDark = tone === 'authDark';

  return (
    <View style={styles.wrap}>
      {!isDark && label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={placeholderTextColor ?? AuthScreenTheme.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        style={[
          styles.input,
          isDark ? styles.inputDark : styles.inputDefault,
          error ? styles.inputError : null,
          style,
        ]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.one,
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AuthScreenTheme.textMuted,
  },
  input: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    fontSize: 17,
    fontWeight: '500',
  },
  inputDark: {
    color: AuthScreenTheme.text,
    backgroundColor: AuthScreenTheme.surface,
    borderWidth: 1,
    borderColor: AuthScreenTheme.surfaceBorder,
  },
  inputDefault: {
    color: '#000',
    backgroundColor: '#F0F0F3',
    borderWidth: 1,
    borderColor: '#E0E1E6',
  },
  inputError: {
    borderColor: AuthScreenTheme.error,
  },
  error: {
    color: AuthScreenTheme.error,
    fontSize: 14,
  },
});
