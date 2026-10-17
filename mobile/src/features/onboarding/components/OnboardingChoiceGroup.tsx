import { View } from 'react-native';

import { OnboardingChoiceRow } from '@/features/onboarding/components/OnboardingChoiceRow';
import {
  OnboardingGroupCard,
  OnboardingGroupDivider,
} from '@/features/onboarding/components/OnboardingGroupCard';

export type OnboardingChoiceItem = {
  key: string;
  label: string;
  hint?: string;
  icon: import('phosphor-react-native').Icon;
};

type OnboardingChoiceGroupProps = {
  items: OnboardingChoiceItem[];
  onSelect: (key: string) => void;
  selectedKey?: string | null;
};

export function OnboardingChoiceGroup({
  items,
  onSelect,
  selectedKey = null,
}: OnboardingChoiceGroupProps) {
  return (
    <OnboardingGroupCard>
      {items.map((item, index) => (
        <View key={item.key}>
          {index > 0 ? <OnboardingGroupDivider /> : null}
          <OnboardingChoiceRow
            label={item.label}
            hint={item.hint}
            icon={item.icon}
            selected={selectedKey === item.key}
            withHintLayout={Boolean(item.hint)}
            onPress={() => onSelect(item.key)}
          />
        </View>
      ))}
    </OnboardingGroupCard>
  );
}
