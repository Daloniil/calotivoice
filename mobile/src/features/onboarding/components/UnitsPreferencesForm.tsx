import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  OnboardingGroupCard,
  OnboardingGroupDivider,
} from '@/features/onboarding/components/OnboardingGroupCard';
import { UnitToggle } from '@/features/onboarding/components/UnitToggle';
import type { UnitPreferences } from '@/lib/profile/types';

type UnitsPreferencesFormProps = {
  units: UnitPreferences;
  onChange: (units: UnitPreferences) => void;
};

export function UnitsPreferencesForm({ units, onChange }: UnitsPreferencesFormProps) {
  const { t } = useTranslation();

  return (
    <OnboardingGroupCard>
      <UnitToggle
        label={t('onboarding.units.bodyWeight')}
        value={units.weight}
        options={[
          { value: 'kg', label: 'kg' },
          { value: 'lb', label: 'lb' },
        ]}
        onChange={(weight) => onChange({ ...units, weight })}
      />
      <View>
        <OnboardingGroupDivider style={styles.divider} />
        <UnitToggle
          label={t('onboarding.units.height')}
          value={units.height}
          options={[
            { value: 'cm', label: 'cm' },
            { value: 'ft', label: 'in' },
          ]}
          onChange={(height) => onChange({ ...units, height })}
        />
      </View>
      <View>
        <OnboardingGroupDivider style={styles.divider} />
        <UnitToggle
          label={t('onboarding.units.water')}
          value={units.water}
          options={[
            { value: 'ml', label: 'ml' },
            { value: 'fl_oz', label: 'fl oz' },
          ]}
          onChange={(water) => onChange({ ...units, water })}
        />
      </View>
      <View>
        <OnboardingGroupDivider style={styles.divider} />
        <UnitToggle
          label={t('onboarding.units.foodPortions')}
          value={units.foodMass}
          options={[
            { value: 'g', label: 'g' },
            { value: 'oz', label: 'oz' },
          ]}
          onChange={(foodMass) => onChange({ ...units, foodMass })}
        />
      </View>
      <View>
        <OnboardingGroupDivider style={styles.divider} />
        <UnitToggle
          label={t('onboarding.units.energy')}
          value={units.energy}
          options={[
            { value: 'kcal', label: 'kcal' },
            { value: 'kj', label: 'kJ' },
          ]}
          onChange={(energy) => onChange({ ...units, energy })}
        />
      </View>
    </OnboardingGroupCard>
  );
}

const styles = StyleSheet.create({
  divider: {
    marginLeft: 16,
  },
});
