import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PrimaryButton } from '@/features/auth/components/PrimaryButton';
import { AppleHealthFillButton } from '@/features/onboarding/components/AppleHealthFillButton';
import { OnboardingBirthDateStep } from '@/features/onboarding/components/OnboardingBirthDateStep';
import { ActivityChoiceGroup } from '@/features/onboarding/components/ActivityChoiceGroup';
import { GoalChoiceGroup } from '@/features/onboarding/components/GoalChoiceGroup';
import { HeightWeightMetricsForm } from '@/features/onboarding/components/HeightWeightMetricsForm';
import { TargetWeightMetricsForm } from '@/features/onboarding/components/TargetWeightMetricsForm';
import { SexChoiceGroup } from '@/features/onboarding/components/SexChoiceGroup';
import { OnboardingShell } from '@/features/onboarding/components/OnboardingShell';
import type { OnboardingTransitionDirection } from '@/features/onboarding/components/OnboardingWizardCarousel';
import { ONBOARDING_CHOICE_ADVANCE_MS } from '@/features/onboarding/components/onboarding-timing';
import { defaultTargetWeightKg } from '@/features/onboarding/components/metrics-weight-bounds';
import { OnboardingWelcomeStep } from '@/features/onboarding/components/OnboardingWelcomeStep';
import { UnitsPreferencesForm } from '@/features/onboarding/components/UnitsPreferencesForm';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/contexts/profile-context';
import type {
  ActivityLevel,
  FitnessGoal,
  Sex,
  UnitPreferences,
  UserProfile,
} from '@/lib/profile/types';
const WELCOME_STEP = 0;
const SURVEY_STEPS = 7;
const TOTAL_PANELS = 1 + SURVEY_STEPS;

const DEFAULT_UNITS: UnitPreferences = {
  weight: 'kg',
  height: 'cm',
  water: 'ml',
  foodMass: 'g',
  energy: 'kcal',
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function OnboardingFlow() {
  const { t } = useTranslation();
  const { needsWelcome, completeWelcome } = useAuth();
  const { completeOnboarding } = useProfile();
  const [step, setStep] = useState(() => (needsWelcome ? WELCOME_STEP : 1));
  const [transitionDirection, setTransitionDirection] =
    useState<OnboardingTransitionDirection>('forward');

  const [goal, setGoal] = useState<FitnessGoal | null>(null);
  const [sex, setSex] = useState<Sex | null>(null);
  const [birthDate, setBirthDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 25);
    return d;
  });
  const [units, setUnits] = useState<UnitPreferences>(DEFAULT_UNITS);
  const [unitsDraft, setUnitsDraft] = useState<UnitPreferences>(DEFAULT_UNITS);
  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState(70);
  const [targetWeightKg, setTargetWeightKg] = useState(() => defaultTargetWeightKg(70));
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [choiceLocked, setChoiceLocked] = useState(false);
  const choiceLockRef = useRef(false);
  const choiceAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const birthDateValid = birthDate.getFullYear() > 1900;

  useEffect(() => {
    if (step === 4) {
      setUnitsDraft(units);
    }
  }, [step, units]);

  useEffect(() => {
    choiceLockRef.current = false;
    setChoiceLocked(false);
    if (choiceAdvanceTimerRef.current) {
      clearTimeout(choiceAdvanceTimerRef.current);
      choiceAdvanceTimerRef.current = null;
    }
  }, [step]);

  useEffect(
    () => () => {
      if (choiceAdvanceTimerRef.current) {
        clearTimeout(choiceAdvanceTimerRef.current);
      }
    },
    [],
  );

  const runAfterChoicePause = useCallback((action: () => void) => {
    if (choiceLockRef.current) {
      return;
    }
    choiceLockRef.current = true;
    setChoiceLocked(true);
    if (choiceAdvanceTimerRef.current) {
      clearTimeout(choiceAdvanceTimerRef.current);
    }
    choiceAdvanceTimerRef.current = setTimeout(() => {
      choiceAdvanceTimerRef.current = null;
      choiceLockRef.current = false;
      setChoiceLocked(false);
      action();
    }, ONBOARDING_CHOICE_ADVANCE_MS);
  }, []);

  const applyHealth = useCallback(
    (data: { birthDate?: string; sex?: Sex; heightCm?: number; weightKg?: number }) => {
      if (data.birthDate) setBirthDate(new Date(`${data.birthDate}T12:00:00`));
      if (data.sex) setSex(data.sex);
      if (data.heightCm != null) setHeightCm(Math.round(data.heightCm));
      if (data.weightKg != null) setWeightKg(Math.round(data.weightKg * 10) / 10);
    },
    [],
  );

  const goToStep = useCallback((nextStep: number, direction: OnboardingTransitionDirection) => {
    setTransitionDirection(direction);
    setStep(nextStep);
  }, []);

  const advanceFromStep = useCallback(
    (fromStep: number) => {
      if (fromStep < SURVEY_STEPS) {
        goToStep(fromStep + 1, 'forward');
      }
    },
    [goToStep],
  );

  const beginSurvey = useCallback(() => {
    completeWelcome();
    goToStep(1, 'forward');
  }, [completeWelcome, goToStep]);

  const goBackOneStep = useCallback(() => {
    if (step <= WELCOME_STEP) {
      return;
    }
    choiceLockRef.current = false;
    setChoiceLocked(false);
    if (choiceAdvanceTimerRef.current) {
      clearTimeout(choiceAdvanceTimerRef.current);
      choiceAdvanceTimerRef.current = null;
    }
    goToStep(step - 1, 'back');
  }, [goToStep, step]);

  const selectGoalAndAdvance = useCallback(
    (value: FitnessGoal) => {
      setGoal(value);
      runAfterChoicePause(() => advanceFromStep(1));
    },
    [advanceFromStep, runAfterChoicePause],
  );

  const selectSexAndAdvance = useCallback(
    (value: Sex) => {
      setSex(value);
      runAfterChoicePause(() => advanceFromStep(2));
    },
    [advanceFromStep, runAfterChoicePause],
  );

  const goToUnitsStep = useCallback(() => {
    setUnitsDraft(units);
    goToStep(4, 'back');
  }, [goToStep, units]);

  const continueFromStep = useCallback(
    (fromStep: number) => {
      if (fromStep === 4) {
        setUnits(unitsDraft);
      }
      if (fromStep === 5) {
        setTargetWeightKg(defaultTargetWeightKg(weightKg));
      }
      advanceFromStep(fromStep);
    },
    [advanceFromStep, unitsDraft, weightKg],
  );

  const completeOnboardingWithActivity = useCallback(
    async (activity: ActivityLevel) => {
      const resolvedGoal = goal;
      const resolvedSex = sex;
      if (!resolvedGoal || !resolvedSex || !heightCm || !weightKg || !targetWeightKg) {
        return;
      }

      setSubmitting(true);
      try {
        const profile: UserProfile = {
          goal: resolvedGoal,
          sex: resolvedSex,
          birthDate: isoDate(birthDate),
          units,
          heightCm,
          weightKg,
          targetWeightKg,
          activityLevel: activity,
          onboardingCompletedAt: new Date().toISOString(),
        };
        await completeOnboarding(profile);
        router.dismissTo('/home');
      } finally {
        setSubmitting(false);
      }
    },
    [
      birthDate,
      completeOnboarding,
      goal,
      heightCm,
      sex,
      targetWeightKg,
      units,
      weightKg,
    ],
  );

  const selectActivityAndFinish = useCallback(
    (activity: ActivityLevel) => {
      if (submitting || choiceLockRef.current) {
        return;
      }
      setActivityLevel(activity);
      runAfterChoicePause(() => {
        void completeOnboardingWithActivity(activity);
      });
    },
    [completeOnboardingWithActivity, runAfterChoicePause, submitting],
  );

  const surveyStep = step >= 1 ? step : undefined;
  const stepKey = step >= 1 ? (`step${step}` as const) : null;
  const title = stepKey ? t(`onboarding.${stepKey}.title`) : undefined;
  const subtitle = stepKey ? t(`onboarding.${stepKey}.subtitle`) : undefined;

  const footer =
    step === WELCOME_STEP ? (
      <PrimaryButton label={t('common.begin')} variant="authDark" onPress={beginSurvey} />
    ) : step === 2 ? (
      <View pointerEvents={choiceLocked ? 'none' : 'auto'}>
        <Pressable
          accessibilityRole="button"
          onPress={() => selectSexAndAdvance('prefer_not_to_say')}
          hitSlop={12}
          style={styles.preferNotToSay}>
          <Text style={styles.preferNotToSayText}>{t('onboarding.sex.prefer_not_to_say')}</Text>
        </Pressable>
      </View>
    ) : step === 3 || step === 4 || step === 5 || step === 6 ? (
      <PrimaryButton
        label={t('common.continue')}
        variant="authDark"
        disabled={step === 3 && !birthDateValid}
        onPress={() => continueFromStep(step)}
      />
    ) : undefined;

  const mountHeightWeightRulers = step === 5;
  const mountTargetWeightRuler = step === 6;

  const wrapScroll = useCallback(
    (body: ReactNode) => (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {body}
      </ScrollView>
    ),
    [],
  );

  const lockChoicePresses = useCallback(
    (body: ReactNode, locked: boolean) => (
      <View pointerEvents={locked ? 'none' : 'auto'}>{body}</View>
    ),
    [],
  );

  const wizardPanels = useMemo(
    () => [
      <OnboardingWelcomeStep key="welcome" />,
      wrapScroll(
        lockChoicePresses(
          <GoalChoiceGroup selectedKey={goal} onSelect={selectGoalAndAdvance} />,
          choiceLocked,
        ),
      ),
      wrapScroll(
        <View style={styles.sexStep}>
          {lockChoicePresses(
            <SexChoiceGroup selectedKey={sex} onSelect={selectSexAndAdvance} />,
            choiceLocked,
          )}
          <AppleHealthFillButton
            onImported={(data) => {
              applyHealth(data);
              if (data.sex) {
                selectSexAndAdvance(data.sex);
              }
            }}
          />
        </View>,
      ),
      wrapScroll(
        <OnboardingBirthDateStep
          birthDate={birthDate}
          onBirthDateChange={setBirthDate}
          onHealthImported={(data) => applyHealth(data)}
        />,
      ),
      wrapScroll(<UnitsPreferencesForm units={unitsDraft} onChange={setUnitsDraft} />),
      wrapScroll(
        <HeightWeightMetricsForm
          units={units}
          heightCm={heightCm}
          weightKg={weightKg}
          mountRulers={mountHeightWeightRulers}
          onHeightCmChange={setHeightCm}
          onWeightKgChange={setWeightKg}
          onChangeUnits={goToUnitsStep}
          onHealthImported={(data) => applyHealth(data)}
        />,
      ),
      wrapScroll(
        <TargetWeightMetricsForm
          units={units}
          targetWeightKg={targetWeightKg}
          mountRuler={mountTargetWeightRuler}
          onTargetWeightKgChange={setTargetWeightKg}
        />,
      ),
      wrapScroll(
        lockChoicePresses(
          <ActivityChoiceGroup selectedKey={activityLevel} onSelect={selectActivityAndFinish} />,
          choiceLocked || submitting,
        ),
      ),
    ],
    [
      activityLevel,
      applyHealth,
      birthDate,
      choiceLocked,
      goal,
      goToUnitsStep,
      heightCm,
      lockChoicePresses,
      selectActivityAndFinish,
      selectGoalAndAdvance,
      selectSexAndAdvance,
      sex,
      submitting,
      mountHeightWeightRulers,
      mountTargetWeightRuler,
      targetWeightKg,
      units,
      unitsDraft,
      weightKg,
      wrapScroll,
    ],
  );

  return (
    <OnboardingShell
      step={step}
      totalSteps={TOTAL_PANELS}
      surveyStep={surveyStep}
      surveyTotalSteps={SURVEY_STEPS}
      transitionDirection={transitionDirection}
      title={title}
      subtitle={subtitle}
      onBack={step > WELCOME_STEP ? goBackOneStep : undefined}
      footer={footer}
      wizardPanels={wizardPanels}
    />
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: Spacing.four,
  },
  stack: {
    gap: Spacing.three,
  },
  sexStep: {
    gap: Spacing.three,
  },
  preferNotToSay: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  preferNotToSayText: {
    color: AuthScreenTheme.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
});
