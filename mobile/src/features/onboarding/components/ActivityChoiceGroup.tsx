import {
  Barbell,
  Couch,
  Fire,
  PersonSimpleRun,
  PersonSimpleWalk,
} from 'phosphor-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { OnboardingChoiceGroup } from '@/features/onboarding/components/OnboardingChoiceGroup';
import { ACTIVITY_IDS } from '@/lib/profile/onboarding-options';
import type { ActivityLevel } from '@/lib/profile/types';

type ActivityChoiceGroupProps = {
  onSelect: (level: ActivityLevel) => void;
  selectedKey?: ActivityLevel | null;
};

const ACTIVITY_ICONS = {
  sedentary: Couch,
  lightly_active: PersonSimpleWalk,
  active: PersonSimpleRun,
  very_active: Fire,
  athlete: Barbell,
} satisfies Record<ActivityLevel, typeof Couch>;

export function ActivityChoiceGroup({ onSelect, selectedKey = null }: ActivityChoiceGroupProps) {
  const { t } = useTranslation();

  const items = useMemo(
    () =>
      ACTIVITY_IDS.map((id) => ({
        key: id,
        label: t(`onboarding.activity.${id}.label`),
        hint: t(`onboarding.activity.${id}.hint`),
        icon: ACTIVITY_ICONS[id],
      })),
    [t],
  );

  return (
    <OnboardingChoiceGroup
      items={items}
      selectedKey={selectedKey}
      onSelect={(key) => onSelect(key as ActivityLevel)}
    />
  );
}
