import { Scales, TrendDown, TrendUp } from 'phosphor-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { OnboardingChoiceGroup } from '@/features/onboarding/components/OnboardingChoiceGroup';
import { GOAL_IDS } from '@/lib/profile/onboarding-options';
import type { FitnessGoal } from '@/lib/profile/types';

type GoalChoiceGroupProps = {
  onSelect: (goal: FitnessGoal) => void;
  selectedKey?: FitnessGoal | null;
};

const GOAL_ICONS = {
  lose_weight: TrendDown,
  maintain: Scales,
  gain_weight: TrendUp,
} satisfies Record<FitnessGoal, typeof TrendDown>;

export function GoalChoiceGroup({ onSelect, selectedKey = null }: GoalChoiceGroupProps) {
  const { t } = useTranslation();

  const items = useMemo(
    () =>
      GOAL_IDS.map((id) => ({
        key: id,
        label: t(`onboarding.goals.${id}.label`),
        hint: t(`onboarding.goals.${id}.hint`),
        icon: GOAL_ICONS[id],
      })),
    [t],
  );

  return (
    <OnboardingChoiceGroup
      items={items}
      selectedKey={selectedKey}
      onSelect={(key) => onSelect(key as FitnessGoal)}
    />
  );
}
