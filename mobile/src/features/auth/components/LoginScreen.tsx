import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppleSignInButton } from '@/features/auth/components/AppleSignInButton';
import { AuthGradientBackground } from '@/features/auth/components/AuthGradientBackground';
import { AuthSignInHeader } from '@/features/auth/components/AuthSignInHeader';
import { EmailOtpForm } from '@/features/auth/components/EmailOtpForm';
import { AuthScreenLogoMark } from '@/features/auth/components/AuthScreenLogoMark';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';
import { useAuth } from '@/contexts/auth-context';

export function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { requestEmailOtp, verifyEmailOtp, signInApple } = useAuth();
  const [appleError, setAppleError] = useState<string | null>(null);
  const [appleLoading, setAppleLoading] = useState(false);

  const goToOnboarding = () => {
    router.replace('/onboarding');
  };

  const handleVerifyOtp = async (email: string, code: string) => {
    await verifyEmailOtp(email, code);
    goToOnboarding();
  };

  const handleAppleSuccess = async (appleUserId: string, email: string | null) => {
    setAppleError(null);
    setAppleLoading(true);
    try {
      await signInApple(appleUserId, email);
      goToOnboarding();
    } catch {
      setAppleError(t('auth.sessionSaveError'));
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <AuthGradientBackground style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
          <View style={styles.content}>
            <AuthScreenLogoMark />

            <View style={styles.spacer} />

            <View style={styles.bottom}>
              <AuthSignInHeader />
              <EmailOtpForm onRequestOtp={requestEmailOtp} onVerifyOtp={handleVerifyOtp} />
              {appleLoading ? (
                <ActivityIndicator color={AuthScreenTheme.accent} />
              ) : (
                <AppleSignInButton
                  disabled={appleLoading}
                  tone="authDark"
                  onSuccess={handleAppleSuccess}
                  onError={setAppleError}
                />
              )}
              {appleError ? <Text style={styles.error}>{appleError}</Text> : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthGradientBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  spacer: {
    flex: 1,
    minHeight: Spacing.four,
  },
  bottom: {
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  error: {
    color: AuthScreenTheme.error,
    textAlign: 'center',
    fontSize: 14,
  },
});
