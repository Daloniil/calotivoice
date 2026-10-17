import type { Icon } from 'phosphor-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';

const SELECT_MS = 260;

type OnboardingChoiceRowProps = {
  label: string;
  hint?: string;
  icon: Icon;
  selected: boolean;
  withHintLayout?: boolean;
  onPress: () => void;
};

export function OnboardingChoiceRow({
  label,
  hint,
  icon: IconComponent,
  selected,
  withHintLayout,
  onPress,
}: OnboardingChoiceRowProps) {
  const selection = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    if (selected) {
      selection.value = withTiming(1, {
        duration: SELECT_MS,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }
    selection.value = 0;
  }, [selected, selection]);

  const rowAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      selection.value,
      [0, 1],
      ['rgba(61, 214, 140, 0)', 'rgba(61, 214, 140, 0.16)'],
    ),
  }));

  const iconWrapStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      selection.value,
      [0, 1],
      ['rgba(47, 158, 107, 0.16)', 'rgba(47, 158, 107, 0.34)'],
    ),
    borderColor: interpolateColor(
      selection.value,
      [0, 1],
      ['rgba(61, 214, 140, 0.22)', 'rgba(61, 214, 140, 0.48)'],
    ),
    transform: [{ scale: interpolate(selection.value, [0, 1], [1, 1.05]) }],
  }));

  const radioStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      selection.value,
      [0, 1],
      ['rgba(142, 142, 147, 0.85)', AuthScreenTheme.accent],
    ),
  }));

  const radioDotStyle = useAnimatedStyle(() => ({
    opacity: selection.value,
    transform: [{ scale: interpolate(selection.value, [0, 1], [0.35, 1]) }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.row, withHintLayout ? styles.rowWithHint : null]}>
      <Animated.View style={[styles.rowFill, rowAnimatedStyle]} pointerEvents="none" />
      <Animated.View style={[styles.iconCircle, iconWrapStyle]}>
        <IconComponent
          size={20}
          color={AuthScreenTheme.accent}
          weight={selected ? 'fill' : 'regular'}
        />
      </Animated.View>
      <View style={styles.textBlock}>
        <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Animated.View style={[styles.radio, radioStyle]}>
        <Animated.View style={[styles.radioDot, radioDotStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    overflow: 'hidden',
  },
  rowWithHint: {
    minHeight: 64,
  },
  rowFill: {
    ...StyleSheet.absoluteFill,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 3,
    justifyContent: 'center',
  },
  label: {
    color: AuthScreenTheme.text,
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  labelSelected: {
    fontWeight: '600',
  },
  hint: {
    color: AuthScreenTheme.textMuted,
    fontSize: 14,
    lineHeight: 18,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AuthScreenTheme.accent,
  },
});
