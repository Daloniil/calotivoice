import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Brand, Spacing } from '@/shared/constants/theme';

const OTP_LENGTH = 6;
const CELL_SIZE = 54;

type OtpCodeInputProps = {
  value: string;
  onChange: (code: string) => void;
  error?: string | null;
  autoFocus?: boolean;
  onComplete?: (code: string) => void;
};

export function OtpCodeInput({ value, onChange, error, autoFocus, onComplete }: OtpCodeInputProps) {
  const { t } = useTranslation();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? '');
  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => inputRef.current?.focus(), 280);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  useEffect(() => {
    if (value.length === OTP_LENGTH) {
      onComplete?.(value);
    }
  }, [value, onComplete]);

  const handleChange = (text: string) => {
    onChange(text.replace(/\D/g, '').slice(0, OTP_LENGTH));
  };

  const handleKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (event.nativeEvent.key === 'Backspace' && value.length > 0 && value.length === activeIndex + 1) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.rowHost}>
        <Pressable
          accessibilityRole="none"
          accessibilityLabel={t('auth.otpInputA11y')}
          onPress={() => inputRef.current?.focus()}
          style={styles.row}>
          {digits.map((digit, index) => {
            const isActive = focused && index === activeIndex && value.length < OTP_LENGTH;
            const isFilled = digit.length > 0;
            const showCaret = isActive && !isFilled;

            return (
              <View
                key={index}
                style={[
                  styles.cell,
                  {
                    borderColor: error
                      ? AuthScreenTheme.error
                      : isActive
                        ? AuthScreenTheme.accent
                        : AuthScreenTheme.surfaceBorder,
                  },
                ]}>
                {isFilled ? (
                  <Text style={styles.digit}>{digit}</Text>
                ) : showCaret ? (
                  <View style={styles.caret} />
                ) : null}
              </View>
            );
          })}
        </Pressable>

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={OTP_LENGTH}
          caretHidden
          selectionColor="transparent"
          style={styles.hiddenInput}
          accessibilityLabel={t('auth.otpHiddenA11y')}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
  },
  rowHost: {
    position: 'relative',
    alignSelf: 'stretch',
    minHeight: CELL_SIZE,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    flexShrink: 0,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: AuthScreenTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontSize: 26,
    fontWeight: '600',
    color: AuthScreenTheme.text,
    fontVariant: ['tabular-nums'],
  },
  caret: {
    width: 2,
    height: 26,
    borderRadius: 1,
    backgroundColor: Brand.accent,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0,
    color: 'transparent',
  },
  error: {
    color: AuthScreenTheme.error,
    textAlign: 'center',
    marginTop: Spacing.two,
    fontSize: 14,
  },
});
