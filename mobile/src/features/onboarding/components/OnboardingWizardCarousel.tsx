import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export type OnboardingTransitionDirection = 'forward' | 'back';

const SLIDE_MS = 240;
/** Совпадает с paddingHorizontal: Spacing.four в OnboardingShell. */
const CAROUSEL_HORIZONTAL_INSET = 24 * 2;

function initialLaneWidth() {
  return Math.max(0, Math.round(Dimensions.get('window').width - CAROUSEL_HORIZONTAL_INSET));
}

type OnboardingWizardCarouselProps = {
  step: number;
  totalSteps: number;
  direction?: OnboardingTransitionDirection;
  panels: ReactNode[];
  style?: StyleProp<ViewStyle>;
};

export function OnboardingWizardCarousel({
  step,
  totalSteps,
  direction = 'forward',
  panels,
  style,
}: OnboardingWizardCarouselProps) {
  const [laneWidth, setLaneWidth] = useState(initialLaneWidth);
  const translateX = useSharedValue(-step * initialLaneWidth());
  const directionSign = useSharedValue(1);

  useEffect(() => {
    if (laneWidth <= 0) {
      return;
    }
    const index = Math.min(Math.max(step, 0), totalSteps - 1);
    directionSign.value = direction === 'forward' ? 1 : -1;
    translateX.value = withTiming(-index * laneWidth, {
      duration: SLIDE_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [direction, directionSign, laneWidth, step, totalSteps, translateX]);

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[styles.clip, style]}
      onLayout={(event) => {
        const width = Math.round(event.nativeEvent.layout.width);
        if (width > 0 && width !== laneWidth) {
          setLaneWidth(width);
          translateX.value = -step * width;
        }
      }}>
      {laneWidth > 0 ? (
        <Animated.View style={[styles.track, { width: laneWidth * totalSteps }, trackStyle]}>
          {panels.map((panel, index) => {
            const isActive = index === step;
            return (
              <View
                key={`wizard-step-${index}`}
                style={[styles.lane, { width: laneWidth }]}
                pointerEvents={isActive ? 'auto' : 'none'}
                accessibilityElementsHidden={!isActive}>
                {panel}
              </View>
            );
          })}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    flex: 1,
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
    flex: 1,
  },
  lane: {
    flex: 1,
  },
});
