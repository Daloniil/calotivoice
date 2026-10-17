import * as Haptics from 'expo-haptics';
import { Check } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';

const BADGE = 88;
const SPIN_MS = 480;
const BURST_DELAY_MS = 300;
const BURST_MS = 420;
const FADE_OUT_MS = 220;
const VISIBLE_MS = 920;

type Props = {
  burstKey: number;
};

function fireAddedHaptics() {
  if (Platform.OS === 'web') {
    return;
  }
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  setTimeout(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, BURST_DELAY_MS);
}

export function MealFoodAddedCelebration({ burstKey }: Props) {
  const [visible, setVisible] = useState(false);
  const backdropOpacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const badgeScale = useSharedValue(0.2);
  const badgeOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.5);
  const ringOpacity = useSharedValue(0);
  const ring2Scale = useSharedValue(0.5);
  const ring2Opacity = useSharedValue(0);

  useEffect(() => {
    if (burstKey <= 0) {
      return;
    }

    setVisible(true);
    fireAddedHaptics();

    backdropOpacity.value = 0;
    rotation.value = 0;
    badgeScale.value = 0.2;
    badgeOpacity.value = 0;
    ringScale.value = 0.55;
    ringOpacity.value = 0;
    ring2Scale.value = 0.55;
    ring2Opacity.value = 0;

    backdropOpacity.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) });
    badgeOpacity.value = withTiming(1, { duration: 160 });

    rotation.value = withTiming(360, {
      duration: SPIN_MS,
      easing: Easing.out(Easing.cubic),
    });

    badgeScale.value = withSequence(
      withTiming(1.18, {
        duration: SPIN_MS * 0.72,
        easing: Easing.out(Easing.back(1.6)),
      }),
      withTiming(1, { duration: 140, easing: Easing.inOut(Easing.quad) }),
    );

    ringScale.value = withDelay(
      BURST_DELAY_MS,
      withTiming(2.6, { duration: BURST_MS, easing: Easing.out(Easing.cubic) }),
    );
    ringOpacity.value = withDelay(
      BURST_DELAY_MS,
      withSequence(
        withTiming(0.75, { duration: 60 }),
        withTiming(0, { duration: BURST_MS, easing: Easing.in(Easing.quad) }),
      ),
    );

    ring2Scale.value = withDelay(
      BURST_DELAY_MS + 50,
      withTiming(3.1, { duration: BURST_MS + 80, easing: Easing.out(Easing.cubic) }),
    );
    ring2Opacity.value = withDelay(
      BURST_DELAY_MS + 50,
      withSequence(
        withTiming(0.5, { duration: 60 }),
        withTiming(0, { duration: BURST_MS + 40, easing: Easing.in(Easing.quad) }),
      ),
    );

    const hideTimer = setTimeout(() => {
      backdropOpacity.value = withTiming(0, { duration: FADE_OUT_MS }, (finished) => {
        if (finished) {
          runOnJS(setVisible)(false);
        }
      });
      badgeOpacity.value = withTiming(0, { duration: FADE_OUT_MS });
    }, VISIBLE_MS);

    return () => clearTimeout(hideTimer);
  }, [
    backdropOpacity,
    badgeOpacity,
    badgeScale,
    burstKey,
    ring2Opacity,
    ring2Scale,
    ringOpacity,
    ringScale,
    rotation,
  ]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ rotate: `${rotation.value}deg` }, { scale: badgeScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: ring2Opacity.value,
    transform: [{ scale: ring2Scale.value }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent>
      <View style={styles.host} pointerEvents="none">
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <View style={styles.center}>
            <Animated.View style={[styles.ring, styles.ringOuter, ring2Style]} />
            <Animated.View style={[styles.ring, ringStyle]} />
            <Animated.View style={styles.badgeShadow}>
              <Animated.View style={[styles.badge, badgeStyle]}>
                <Check color="#08100c" size={46} weight="bold" />
              </Animated.View>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    width: BADGE * 3.2,
    height: BADGE * 3.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    borderWidth: 3,
    borderColor: AuthScreenTheme.accent,
  },
  ringOuter: {
    borderWidth: 2,
    borderColor: 'rgba(61, 214, 140, 0.55)',
  },
  badgeShadow: {
    shadowColor: AuthScreenTheme.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 24,
    elevation: 12,
  },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: AuthScreenTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
});
