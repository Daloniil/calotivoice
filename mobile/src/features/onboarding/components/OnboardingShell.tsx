import type { ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthGradientBackground } from '@/features/auth/components/AuthGradientBackground';
import { AuthScreenLogoMark } from '@/features/auth/components/AuthScreenLogoMark';
import { useAppLanguageTopInset } from '@/shared/components/i18n/AppLanguageChrome';
import {
  OnboardingWizardCarousel,
  type OnboardingTransitionDirection,
} from '@/features/onboarding/components/OnboardingWizardCarousel';
import { OnboardingStepDots } from '@/features/onboarding/components/OnboardingStepDots';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

type OnboardingShellProps = ViewProps & {
  step: number;
  /** Число панелей в карусели (welcome + опрос). */
  totalSteps: number;
  /** Шаги опроса для индикатора «1 / 7» и точек (без welcome). */
  surveyStep?: number;
  surveyTotalSteps?: number;
  transitionDirection?: OnboardingTransitionDirection;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  wizardPanels: ReactNode[];
  footer?: React.ReactNode;
};

export function OnboardingShell({
  step,
  totalSteps,
  surveyStep,
  surveyTotalSteps,
  transitionDirection = 'forward',
  title,
  subtitle,
  onBack,
  wizardPanels,
  footer,
}: OnboardingShellProps) {
  const { t } = useTranslation();
  const languageTopInset = useAppLanguageTopInset();
  const showSurveyChrome =
    surveyStep != null && surveyTotalSteps != null && surveyStep >= 1;
  const showWelcomeLogo = step === 0;

  return (
    <AuthGradientBackground style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={{ height: languageTopInset }} />

        {showSurveyChrome ? (
          <View style={styles.stepperBlock}>
            <View style={styles.navRow}>
              {onBack ? (
                <Pressable accessibilityRole="button" onPress={onBack} hitSlop={12}>
                  <Text style={styles.back}>{t('common.back')}</Text>
                </Pressable>
              ) : (
                <View style={styles.backPlaceholder} />
              )}
            </View>

            <Text style={styles.stepLabel} accessibilityRole="text">
              {surveyStep} / {surveyTotalSteps}
            </Text>

            <OnboardingStepDots
              step={surveyStep}
              totalSteps={surveyTotalSteps}
              direction={transitionDirection}
            />
          </View>
        ) : onBack ? (
          <View style={styles.welcomeNavRow}>
            <Pressable accessibilityRole="button" onPress={onBack} hitSlop={12}>
              <Text style={styles.back}>{t('common.back')}</Text>
            </Pressable>
          </View>
        ) : null}

        {showWelcomeLogo ? <AuthScreenLogoMark /> : null}

        <View style={styles.survey}>
          {showSurveyChrome && title ? (
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
          ) : null}

          <OnboardingWizardCarousel
            step={step}
            totalSteps={totalSteps}
            direction={transitionDirection}
            panels={wizardPanels}
            style={styles.body}
          />

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </SafeAreaView>
    </AuthGradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing.four },
  stepperBlock: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 22,
    marginBottom: Spacing.two,
  },
  back: { color: AuthScreenTheme.textMuted, fontSize: 16, fontWeight: '600' },
  backPlaceholder: { height: 22 },
  stepLabel: {
    color: AuthScreenTheme.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  survey: {
    flex: 1,
  },
  titleBlock: { gap: Spacing.one, marginBottom: Spacing.three },
  title: {
    color: AuthScreenTheme.text,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: AuthScreenTheme.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  body: { flex: 1 },
  footer: { paddingVertical: Spacing.three },
});
