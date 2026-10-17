import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';

const BAR_COUNT = 28;

type Props = {
  metering?: number;
  active: boolean;
};

function meteringToLevel(metering?: number): number {
  if (metering === undefined) {
    return 0.15;
  }
  const clamped = Math.min(0, Math.max(-60, metering));
  return Math.min(1, Math.max(0.08, (clamped + 60) / 60));
}

export function RecordingLevelMeter({ metering, active }: Props) {
  const level = useSharedValue(0.12);

  useEffect(() => {
    if (!active) {
      level.value = withTiming(0.1, { duration: 120 });
      return;
    }
    const target = meteringToLevel(metering);
    level.value = withTiming(target, { duration: 90 });
  }, [active, level, metering]);

  const indices = useMemo(() => Array.from({ length: BAR_COUNT }, (_, i) => i), []);

  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {indices.map((index) => (
        <MeterBar key={index} index={index} level={level} active={active} />
      ))}
    </View>
  );
}

function MeterBar({
  index,
  level,
  active,
}: {
  index: number;
  level: SharedValue<number>;
  active: boolean;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const center = (BAR_COUNT - 1) / 2;
    const dist = Math.abs(index - center) / center;
    const wave = 1 - dist * 0.55;
    const h = 6 + level.value * wave * 22;
    return {
      height: h,
      opacity: active ? 0.45 + level.value * 0.55 : 0.25,
    };
  });

  return <Animated.View style={[styles.bar, animatedStyle]} />;
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 28,
    paddingHorizontal: 4,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: AuthScreenTheme.text,
  },
});
