import { memo, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HorizontalRulerPicker } from '@/features/onboarding/components/HorizontalRulerPicker';
import { OnboardingGroupCard } from '@/features/onboarding/components/OnboardingGroupCard';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

type MetricsRulerCardProps = {
  label: string;
  value: number;
  unitLabel: string;
  min: number;
  max: number;
  step?: number;
  majorEvery?: number;
  decimals?: number;
  tickFeedback?: boolean;
  mountRuler?: boolean;
  onChange: (value: number) => void;
};

function formatDisplayValue(value: number, decimals?: number) {
  if (decimals != null) {
    return value.toFixed(decimals);
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

const MetricsValueDisplay = memo(function MetricsValueDisplay({
  value,
  unitLabel,
  decimals,
}: {
  value: number;
  unitLabel: string;
  decimals?: number;
}) {
  return (
    <View style={styles.valueRow}>
      <Text style={styles.value}>{formatDisplayValue(value, decimals)}</Text>
      <Text style={styles.unit}>{unitLabel}</Text>
    </View>
  );
});

export function MetricsRulerCard({
  label,
  value,
  unitLabel,
  min,
  max,
  step,
  majorEvery,
  decimals,
  tickFeedback,
  mountRuler = true,
  onChange,
}: MetricsRulerCardProps) {
  const [shownValue, setShownValue] = useState(value);

  useEffect(() => {
    setShownValue(value);
  }, [value]);

  return (
    <OnboardingGroupCard>
      <View style={styles.body}>
        <Text style={styles.caption}>{label}</Text>
        <MetricsValueDisplay value={shownValue} unitLabel={unitLabel} decimals={decimals} />
        <HorizontalRulerPicker
          value={value}
          min={min}
          max={max}
          step={step}
          majorEvery={majorEvery}
          tickFeedback={tickFeedback}
          mountRuler={mountRuler}
          onValueChanging={setShownValue}
          onChange={onChange}
        />
      </View>
    </OnboardingGroupCard>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.one,
  },
  caption: {
    color: AuthScreenTheme.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.one,
  },
  value: {
    color: AuthScreenTheme.text,
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    color: AuthScreenTheme.textMuted,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 6,
  },
});
