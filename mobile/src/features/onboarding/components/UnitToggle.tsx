import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';

const SEGMENT_MS = 220;
const TRACK_PADDING = 4;

const TRACK_BG = 'rgba(255, 255, 255, 0.06)';
const TRACK_BORDER = 'rgba(61, 214, 140, 0.14)';
const THUMB_BG = 'rgba(61, 214, 140, 0.22)';
const THUMB_BORDER = 'rgba(61, 214, 140, 0.45)';
const LABEL_INACTIVE = 'rgba(174, 174, 178, 0.95)';

type UnitToggleProps<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

function SegmentLabel({ label, active }: { label: string; active: boolean }) {
  const emphasis = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    if (active) {
      emphasis.value = withTiming(1, {
        duration: SEGMENT_MS,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }
    emphasis.value = 0;
  }, [active, emphasis]);

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      emphasis.value,
      [0, 1],
      [LABEL_INACTIVE, AuthScreenTheme.accent],
    ),
  }));

  return (
    <Animated.Text style={[styles.segmentText, textStyle]} numberOfLines={1}>
      {label}
    </Animated.Text>
  );
}

export function UnitToggle<T extends string>({ label, value, options, onChange }: UnitToggleProps<T>) {
  const activeIndex = useMemo(
    () => Math.max(0, options.findIndex((opt) => opt.value === value)),
    [options, value],
  );

  const segmentWidth = useSharedValue(0);
  const activeSlot = useSharedValue(activeIndex);

  useEffect(() => {
    activeSlot.value = withTiming(activeIndex, {
      duration: SEGMENT_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [activeIndex, activeSlot]);

  const thumbStyle = useAnimatedStyle(() => ({
    width: Math.max(segmentWidth.value, 0),
    transform: [{ translateX: activeSlot.value * segmentWidth.value }],
  }));

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={styles.segmentTrack}
        accessibilityRole="tablist"
        onLayout={(e) => {
          const trackInner = e.nativeEvent.layout.width - TRACK_PADDING * 2;
          segmentWidth.value = trackInner / Math.max(options.length, 1);
        }}>
        <Animated.View style={[styles.thumb, thumbStyle]} pointerEvents="none" />
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(opt.value)}
              style={({ pressed }) => [styles.segment, pressed && !active && styles.segmentPressed]}>
              <SegmentLabel label={opt.label} active={active} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  label: {
    flex: 1,
    color: AuthScreenTheme.text,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  segmentTrack: {
    flexDirection: 'row',
    padding: TRACK_PADDING,
    borderRadius: 12,
    backgroundColor: TRACK_BG,
    borderWidth: 1,
    borderColor: TRACK_BORDER,
    minWidth: 136,
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    top: TRACK_PADDING,
    left: TRACK_PADDING,
    bottom: TRACK_PADDING,
    borderRadius: 9,
    backgroundColor: THUMB_BG,
    borderWidth: 1,
    borderColor: THUMB_BORDER,
    shadowColor: AuthScreenTheme.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
  },
  segment: {
    flex: 1,
    minWidth: 54,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentPressed: {
    opacity: 0.72,
  },
  segmentText: {
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
