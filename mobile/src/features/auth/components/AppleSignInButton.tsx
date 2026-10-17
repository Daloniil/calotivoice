import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

type AppleSignInButtonProps = {
  onSuccess: (appleUserId: string, email: string | null) => void;
  onError: (message: string) => void;
  disabled?: boolean;
  tone?: 'default' | 'authDark';
};

/**
 * Нативный AppleAuthenticationButton не работает в Expo Go (нет view config).
 * Используем кастомную кнопку + signInAsync — так вход работает в Go и в dev build.
 */
export function AppleSignInButton({ onSuccess, onError, disabled, tone = 'authDark' }: AppleSignInButtonProps) {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(true);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (Platform.OS !== 'ios') {
      setChecking(false);
      return;
    }
    AppleAuthentication.isAvailableAsync()
      .then((ok) => {
        if (mounted) {
          setAvailable(ok);
          setChecking(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setAvailable(false);
          setChecking(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (Platform.OS !== 'ios') {
    return (
      <View style={styles.unavailable}>
        <Text style={styles.unavailableText}>{t('auth.appleOnlyIos')}</Text>
      </View>
    );
  }

  if (checking) {
    return <ActivityIndicator style={styles.loader} />;
  }

  if (!available) {
    const inExpoGo = Constants.appOwnership === 'expo';
    return (
      <View style={styles.unavailable}>
        <Text style={styles.unavailableText}>
          {inExpoGo ? t('auth.appleNeedsDevBuild') : t('auth.appleUnavailable')}
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('auth.signInWithApple')}
      disabled={disabled}
      onPress={async () => {
        if (disabled) return;
        try {
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });
          if (!credential.user) {
            onError(t('auth.appleNoUserId'));
            return;
          }
          onSuccess(credential.user, credential.email);
        } catch (e: unknown) {
          if (
            e &&
            typeof e === 'object' &&
            'code' in e &&
            e.code === 'ERR_REQUEST_CANCELED'
          ) {
            return;
          }
          onError(t('auth.appleSignInFailed'));
        }
      }}
      style={({ pressed }) => [
        styles.button,
        tone === 'authDark' ? styles.buttonDark : styles.buttonDefault,
        pressed && styles.buttonPressed,
        disabled && styles.disabled,
      ]}>
      <Text style={styles.appleGlyph}>{'\uF8FF'}</Text>
      <Text style={styles.buttonLabel}>{t('common.apple')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  buttonDark: {
    backgroundColor: AuthScreenTheme.surface,
    borderWidth: 1,
    borderColor: AuthScreenTheme.surfaceBorder,
  },
  buttonDefault: {
    backgroundColor: '#000',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  appleGlyph: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 22,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  loader: {
    marginVertical: Spacing.two,
  },
  unavailable: {
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  unavailableText: {
    textAlign: 'center',
    color: AuthScreenTheme.textMuted,
    fontSize: 14,
  },
});
