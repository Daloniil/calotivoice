import { GenderFemale, GenderMale } from 'phosphor-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { OnboardingChoiceGroup } from '@/features/onboarding/components/OnboardingChoiceGroup';
import { SEX_CHOICE_IDS } from '@/lib/profile/onboarding-options';
import type { Sex } from '@/lib/profile/types';

type SexChoiceGroupProps = {
  onSelect: (sex: Sex) => void;
  selectedKey?: Sex | null;
};

type SexChoiceId = (typeof SEX_CHOICE_IDS)[number];

const SEX_ICONS: Record<SexChoiceId, typeof GenderFemale> = {
  female: GenderFemale,
  male: GenderMale,
};

export function SexChoiceGroup({ onSelect, selectedKey = null }: SexChoiceGroupProps) {
  const { t } = useTranslation();

  const items = useMemo(
    () =>
      SEX_CHOICE_IDS.map((id) => ({
        key: id,
        label: t(`onboarding.sex.${id}`),
        icon: SEX_ICONS[id],
      })),
    [t],
  );

  return (
    <OnboardingChoiceGroup
      items={items}
      selectedKey={selectedKey}
      onSelect={(key) => onSelect(key as Sex)}
    />
  );
}
