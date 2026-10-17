import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { OnboardingTransitionDirection } from '@/features/onboarding/components/OnboardingWizardCarousel';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';

type OnboardingStepDotsProps = {
  step: number;
  totalSteps: number;
  direction?: OnboardingTransitionDirection;
};

const FILL_MS = 300;
const EMPTY_MS = 260;

function StepDot({
  filled,
  direction,
}: {
  filled: boolean;
  direction: OnboardingTransitionDirection;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const fill = useSharedValue(filled ? 1 : 0);
  const skipAnimation = useRef(true);
  const wasFilled = useRef(filled);

  useEffect(() => {
    if (skipAnimation.current) {
      fill.value = filled ? 1 : 0;
      skipAnimation.current = false;
      wasFilled.current = filled;
      return;
    }

    if (filled === wasFilled.current) {
      return;
    }

    wasFilled.current = filled;
    const duration = filled ? FILL_MS : EMPTY_MS;
    const easing = filled ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic);

    fill.value = withTiming(filled ? 1 : 0, { duration, easing });
  }, [filled, direction, fill]);

  const fillStyle = useAnimatedStyle(() => ({
    width: Math.max(0, trackWidth * fill.value),
  }));

  return (
    <View
      style={styles.track}
      onLayout={(e) => {
        setTrackWidth(e.nativeEvent.layout.width);
      }}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

export function OnboardingStepDots({
  step,
  totalSteps,
  direction = 'forward',
}: OnboardingStepDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <StepDot key={i} filled={i + 1 <= step} direction={direction} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  track: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
    backgroundColor: AuthScreenTheme.accent,
  },
});
