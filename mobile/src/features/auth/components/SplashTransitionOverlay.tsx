import * as Haptics from 'expo-haptics';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useLayoutEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AuthGradientBackground } from '@/features/auth/components/AuthGradientBackground';
import { CaloriVoiceLogo } from '@/shared/components/brand/CaloriVoiceLogo';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';

const LOGO_SIZE = 88;
const SPIN_MS = 760;
const SCALE_PEAK = 1.24;
const HOLD_MS = 180;
const FADE_MS = 420;

type SplashTransitionOverlayProps = {
  onFinish: () => void;
};

function pulseHaptic() {
  if (Platform.OS === 'web') {
    return;
  }
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function SplashTransitionOverlay({ onFinish }: SplashTransitionOverlayProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const overlayOpacity = useSharedValue(1);

  useLayoutEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    const finish = () => onFinish();

    rotation.value = withTiming(360, {
      duration: SPIN_MS,
      easing: Easing.out(Easing.cubic),
    });

    scale.value = withSequence(
      withTiming(SCALE_PEAK, {
        duration: SPIN_MS * 0.78,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(1.04, {
        duration: 220,
        easing: Easing.inOut(Easing.quad),
      }),
    );

    overlayOpacity.value = withDelay(
      HOLD_MS + SPIN_MS,
      withTiming(
        0,
        { duration: FADE_MS, easing: Easing.out(Easing.quad) },
        (finished) => {
          if (finished) {
            runOnJS(finish)();
          }
        },
      ),
    );

    const hapticTimer = setTimeout(() => {
      pulseHaptic();
    }, HOLD_MS + SPIN_MS - 80);

    return () => clearTimeout(hapticTimer);
  }, [onFinish, overlayOpacity, rotation, scale]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  const veilStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <Animated.View style={[styles.overlay, veilStyle]} pointerEvents="auto">
      <AuthGradientBackground style={styles.fill}>
        <View style={styles.center}>
          <View style={styles.glow} />
          <Animated.View style={logoStyle}>
            <CaloriVoiceLogo size={LOGO_SIZE} forceDark />
          </Animated.View>
        </View>
      </AuthGradientBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    elevation: 100,
  },
  fill: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: AuthScreenTheme.glow,
    opacity: 0.55,
  },
});
