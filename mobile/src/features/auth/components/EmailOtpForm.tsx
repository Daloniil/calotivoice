import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { OtpCodeInput } from '@/features/auth/components/OtpCodeInput';
import { PrimaryButton } from '@/features/auth/components/PrimaryButton';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

type EmailOtpFormProps = {
  onRequestOtp: (email: string) => Promise<{ devCode?: string; emailSent?: boolean }>;
  onVerifyOtp: (email: string, code: string) => Promise<void>;
  visible?: boolean;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function EmailOtpForm({ onRequestOtp, onVerifyOtp, visible = true }: EmailOtpFormProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);
  const [emailSentHint, setEmailSentHint] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!visible) {
    return null;
  }

  const handleRequestCode = async () => {
    setSubmitError(null);
    setFieldError(null);
    setDevCodeHint(null);
    setEmailSentHint(false);

    if (!isValidEmail(email)) {
      setFieldError(t('auth.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      const result = await onRequestOtp(email);
      setStep('code');
      setCode('');
      if (result.emailSent) {
        setEmailSentHint(true);
      } else if (result.devCode) {
        setDevCodeHint(result.devCode);
      }
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : t('auth.sendCodeFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setSubmitError(null);
    setFieldError(null);

    if (!/^\d{6}$/.test(code.trim())) {
      setFieldError(t('auth.invalidOtp'));
      return;
    }

    setLoading(true);
    try {
      await onVerifyOtp(email, code);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : t('auth.wrongCode'));
    } finally {
      setLoading(false);
    }
  };

  const emailReady = isValidEmail(email);
  const codeReady = /^\d{6}$/.test(code);

  if (step === 'email') {
    return (
      <View style={styles.form}>
        <AuthTextField
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (fieldError) setFieldError(null);
            if (submitError) setSubmitError(null);
          }}
          placeholder={t('common.email')}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          error={fieldError ?? submitError}
        />
        <PrimaryButton
          label={t('common.continue')}
          variant="authDark"
          loading={loading}
          disabled={!emailReady}
          onPress={handleRequestCode}
        />
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <OtpCodeInput
        value={code}
        onChange={(next) => {
          setCode(next);
          if (fieldError) setFieldError(null);
          if (submitError) setSubmitError(null);
        }}
        error={fieldError ?? submitError}
        autoFocus
      />
      {emailSentHint ? <Text style={styles.devHint}>{t('auth.codeSentToEmail')}</Text> : null}
      {devCodeHint ? <Text style={styles.devHint}>{t('auth.devHint', { code: devCodeHint })}</Text> : null}
      <PrimaryButton
        label={t('common.continue')}
        variant="authDark"
        loading={loading}
        disabled={!codeReady}
        onPress={handleVerify}
      />
      <Pressable accessibilityRole="button" onPress={() => setStep('email')} hitSlop={8}>
        <Text style={styles.link}>{t('common.changeEmail')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.three,
    alignSelf: 'stretch',
  },
  devHint: {
    textAlign: 'center',
    color: AuthScreenTheme.textMuted,
    fontSize: 13,
  },
  link: {
    textAlign: 'center',
    color: AuthScreenTheme.textMuted,
    fontSize: 15,
  },
});
