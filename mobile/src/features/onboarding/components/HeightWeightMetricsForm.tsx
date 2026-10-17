import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppleHealthFillButton } from '@/features/onboarding/components/AppleHealthFillButton';
import { MetricsRulerCard } from '@/features/onboarding/components/MetricsRulerCard';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';
import { globalWeightBounds } from '@/features/onboarding/components/metrics-weight-bounds';
import type { HeightUnit, UnitPreferences } from '@/lib/profile/types';
import { formatHeight, formatWeight, inchesToCm, lbToKg } from '@/lib/profile/units';

type HeightWeightMetricsFormProps = {
  units: UnitPreferences;
  heightCm: number;
  weightKg: number;
  onHeightCmChange: (heightCm: number) => void;
  onWeightKgChange: (weightKg: number) => void;
  onChangeUnits: () => void;
  onHealthImported: (data: { heightCm?: number; weightKg?: number }) => void;
  mountRulers?: boolean;
};

function heightBounds(unit: HeightUnit) {
  if (unit === 'cm') {
    return { min: 120, max: 220, step: 1, majorEvery: 10 };
  }
  return { min: 47, max: 87, step: 1, majorEvery: 5 };
}

function HeightWeightMetricsFormInner({
  units,
  heightCm,
  weightKg,
  onHeightCmChange,
  onWeightKgChange,
  onChangeUnits,
  onHealthImported,
  mountRulers = false,
}: HeightWeightMetricsFormProps) {
  const { t } = useTranslation();

  const heightDisplay = formatHeight(heightCm, units.height);
  const weightDisplay = formatWeight(weightKg, units.weight);
  const heightConfig = heightBounds(units.height);
  const weightConfig = globalWeightBounds(units.weight);

  return (
    <View style={styles.stack}>
      <MetricsRulerCard
        label={t('onboarding.metrics.heightLabel')}
        value={heightDisplay}
        unitLabel={units.height === 'cm' ? 'cm' : 'in'}
        min={heightConfig.min}
        max={heightConfig.max}
        step={heightConfig.step}
        majorEvery={heightConfig.majorEvery}
        tickFeedback
        mountRuler={mountRulers}
        onChange={(display) => {
          const nextCm = units.height === 'cm' ? display : inchesToCm(display);
          onHeightCmChange(Math.round(nextCm));
        }}
      />

      <MetricsRulerCard
        label={t('onboarding.metrics.currentWeightLabel')}
        value={weightDisplay}
        unitLabel={units.weight}
        min={weightConfig.min}
        max={weightConfig.max}
        step={weightConfig.step}
        majorEvery={weightConfig.majorEvery}
        decimals={weightConfig.decimals}
        tickFeedback
        mountRuler={mountRulers}
        onChange={(display) => {
          const nextKg = units.weight === 'kg' ? display : lbToKg(display);
          onWeightKgChange(Math.round(nextKg * 10) / 10);
        }}
      />

      <AppleHealthFillButton onImported={onHealthImported} />

      <Pressable accessibilityRole="button" onPress={onChangeUnits} style={styles.changeUnits}>
        <Text style={styles.changeUnitsText}>{t('onboarding.metrics.changeUnits')}</Text>
      </Pressable>
    </View>
  );
}

export const HeightWeightMetricsForm = memo(
  HeightWeightMetricsFormInner,
  (prev, next) =>
    prev.units === next.units &&
    prev.heightCm === next.heightCm &&
    prev.weightKg === next.weightKg &&
    prev.mountRulers === next.mountRulers &&
    prev.onHeightCmChange === next.onHeightCmChange &&
    prev.onWeightKgChange === next.onWeightKgChange &&
    prev.onChangeUnits === next.onChangeUnits &&
    prev.onHealthImported === next.onHealthImported,
);

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.three,
  },
  changeUnits: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  changeUnitsText: {
    color: AuthScreenTheme.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});
