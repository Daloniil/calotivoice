import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';

const AnimatedView = Animated.createAnimatedComponent(View);

type DriftBlobProps = {
  size: number;
  top?: number;
  bottom?: number;
  right?: number;
  left?: number;
  colors: [string, string];
  durationMs: number;
  delayMs?: number;
  driftX: number;
  driftY: number;
};

function DriftBlob({
  size,
  top,
  bottom,
  right,
  left,
  colors,
  durationMs,
  delayMs = 0,
  driftX,
  driftY,
}: DriftBlobProps) {
  const phase = useSharedValue(0);

  useEffect(() => {
    phase.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(1, { duration: durationMs, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [delayMs, durationMs, phase]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(phase.value, [0, 1], [0.35, 0.7]),
    transform: [
      { translateX: interpolate(phase.value, [0, 1], [0, driftX]) },
      { translateY: interpolate(phase.value, [0, 1], [0, driftY]) },
      { scale: interpolate(phase.value, [0, 1], [1, 1.12]) },
    ],
  }));

  return (
    <AnimatedView
      pointerEvents="none"
      style={[
        styles.blob,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          top,
          bottom,
          right,
          left,
        },
        animatedStyle,
      ]}>
      <LinearGradient colors={colors} style={StyleSheet.absoluteFill} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
    </AnimatedView>
  );
}

export function AuthGradientBackground({ style, children, ...rest }: ViewProps) {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [drift]);

  const gradientShift = useAnimatedStyle(() => ({
    opacity: interpolate(drift.value, [0, 1], [0.92, 1]),
    transform: [{ scale: interpolate(drift.value, [0, 1], [1.02, 1.06]) }],
  }));

  return (
    <View style={[styles.root, style]} {...rest}>
      <AnimatedView style={[StyleSheet.absoluteFill, gradientShift]} pointerEvents="none">
        <LinearGradient
          colors={[AuthScreenTheme.gradientTop, AuthScreenTheme.gradientMid, AuthScreenTheme.bg]}
          locations={[0, 0.45, 1]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.2, y: 0.85 }}
          style={StyleSheet.absoluteFill}
        />
      </AnimatedView>

      <DriftBlob
        size={340}
        top={-100}
        right={-80}
        colors={['rgba(47, 158, 107, 0.35)', 'rgba(47, 158, 107, 0)']}
        durationMs={11000}
        driftX={-28}
        driftY={22}
      />
      <DriftBlob
        size={220}
        top={120}
        left={-90}
        colors={['rgba(32, 120, 95, 0.28)', 'rgba(32, 120, 95, 0)']}
        durationMs={15000}
        delayMs={800}
        driftX={36}
        driftY={-18}
      />
      <DriftBlob
        size={180}
        bottom={100}
        right={-40}
        colors={['rgba(61, 214, 140, 0.15)', 'transparent']}
        durationMs={9000}
        delayMs={400}
        driftX={-16}
        driftY={-24}
      />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AuthScreenTheme.bg,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
