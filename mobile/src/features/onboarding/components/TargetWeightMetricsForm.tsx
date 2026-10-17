import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MetricsRulerCard } from '@/features/onboarding/components/MetricsRulerCard';
import { globalWeightBounds } from '@/features/onboarding/components/metrics-weight-bounds';
import { Spacing } from '@/shared/constants/theme';
import type { UnitPreferences } from '@/lib/profile/types';
import { formatWeight, lbToKg } from '@/lib/profile/units';

type TargetWeightMetricsFormProps = {
  units: UnitPreferences;
  targetWeightKg: number;
  onTargetWeightKgChange: (kg: number) => void;
  mountRuler?: boolean;
};

function TargetWeightMetricsFormInner({
  units,
  targetWeightKg,
  onTargetWeightKgChange,
  mountRuler = false,
}: TargetWeightMetricsFormProps) {
  const { t } = useTranslation();
  const display = formatWeight(targetWeightKg, units.weight);
  const config = globalWeightBounds(units.weight);

  return (
    <View style={styles.stack}>
      <MetricsRulerCard
        label={t('onboarding.metrics.targetWeightLabel')}
        value={display}
        unitLabel={units.weight}
        min={config.min}
        max={config.max}
        step={config.step}
        majorEvery={config.majorEvery}
        decimals={config.decimals}
        tickFeedback
        mountRuler={mountRuler}
        onChange={(nextDisplay) => {
          const clampedDisplay = Math.min(config.max, Math.max(config.min, nextDisplay));
          const nextKg = units.weight === 'kg' ? clampedDisplay : lbToKg(clampedDisplay);
          onTargetWeightKgChange(Math.round(nextKg * 10) / 10);
        }}
      />
    </View>
  );
}

export const TargetWeightMetricsForm = memo(
  TargetWeightMetricsFormInner,
  (prev, next) =>
    prev.units === next.units &&
    prev.targetWeightKg === next.targetWeightKg &&
    prev.mountRuler === next.mountRuler &&
    prev.onTargetWeightKgChange === next.onTargetWeightKgChange,
);

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.three,
  },
});
