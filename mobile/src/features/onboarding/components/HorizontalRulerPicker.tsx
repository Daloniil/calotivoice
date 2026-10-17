import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { playOnboardingWheelTick } from '@/shared/lib/onboarding-wheel-feedback';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';

const ITEM_WIDTH = 14;

type HorizontalRulerPickerProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  majorEvery?: number;
  /** Коммит в форму — по окончании скролла (и при программной синхронизации). */
  onChange: (value: number) => void;
  /** Живое число на экране — только при смене шага (0.1 кг / 1 см). */
  onValueChanging?: (value: number) => void;
  tickFeedback?: boolean;
  /** Без линейки — только место под неё (экономим тысячи tick-view вне активного шага). */
  mountRuler?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function stepDecimals(step: number) {
  const text = String(step);
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
}

/** Индекс меняется только после пересечения середины между делениями — меньше дёрганий на границе. */
function indexFromOffsetSticky(offsetX: number, anchorIndex: number, maxIndex: number) {
  const raw = offsetX / ITEM_WIDTH;
  if (raw >= anchorIndex + 0.5) {
    return clamp(Math.round(raw), 0, maxIndex);
  }
  if (raw <= anchorIndex - 0.5) {
    return clamp(Math.round(raw), 0, maxIndex);
  }
  return anchorIndex;
}

function HorizontalRulerPickerInner({
  value,
  min,
  max,
  step = 1,
  majorEvery = 10,
  onChange,
  onValueChanging,
  tickFeedback = false,
  mountRuler = true,
}: HorizontalRulerPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [laneWidth, setLaneWidth] = useState(0);
  const userScrollingRef = useRef(false);
  const suppressFeedbackRef = useRef(true);
  const syncedIndexRef = useRef<number | null>(null);
  const lastEmittedIndexRef = useRef<number | null>(null);
  const lastLayoutWidthRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const onValueChangingRef = useRef(onValueChanging);
  onChangeRef.current = onChange;
  onValueChangingRef.current = onValueChanging;

  useEffect(() => {
    if (mountRuler) {
      syncedIndexRef.current = null;
      lastEmittedIndexRef.current = null;
      lastLayoutWidthRef.current = 0;
    }
  }, [mountRuler]);

  const dp = stepDecimals(step);
  const sidePadding = laneWidth > 0 ? laneWidth / 2 - ITEM_WIDTH / 2 : 0;
  const rulerReady = laneWidth > 0;

  const ticks = useMemo(() => {
    if (!mountRuler) {
      return [];
    }
    const count = Math.round((max - min) / step) + 1;
    return Array.from({ length: count }, (_, index) =>
      Number((min + index * step).toFixed(dp)),
    );
  }, [dp, max, min, mountRuler, step]);

  const indexFromValue = useCallback(
    (v: number) => Math.round((clamp(v, min, max) - min) / step),
    [max, min, step],
  );

  const scrollToIndex = useCallback((index: number, animated: boolean) => {
    scrollRef.current?.scrollTo({ x: index * ITEM_WIDTH, animated });
  }, []);

  const syncScrollToValue = useCallback(
    (v: number, animated: boolean) => {
      const index = indexFromValue(v);
      syncedIndexRef.current = index;
      lastEmittedIndexRef.current = index;
      scrollToIndex(index, animated);
    },
    [indexFromValue, scrollToIndex],
  );

  const applyScrollSync = useCallback(
    (animated: boolean) => {
      if (!mountRuler || !rulerReady || userScrollingRef.current) {
        return;
      }
      suppressFeedbackRef.current = true;
      syncScrollToValue(value, animated);
      requestAnimationFrame(() => {
        suppressFeedbackRef.current = false;
      });
    },
    [mountRuler, rulerReady, syncScrollToValue, value],
  );

  useLayoutEffect(() => {
    if (!mountRuler || !rulerReady || userScrollingRef.current) {
      return;
    }
    const index = indexFromValue(value);
    const widthChanged = lastLayoutWidthRef.current !== laneWidth;
    if (!widthChanged && syncedIndexRef.current === index) {
      return;
    }
    lastLayoutWidthRef.current = laneWidth;
    applyScrollSync(false);
  }, [applyScrollSync, indexFromValue, laneWidth, mountRuler, rulerReady, value]);

  const emitFromOffset = useCallback(
    (offsetX: number, fromUser: boolean, commit: boolean) => {
      const maxIndex = ticks.length - 1;
      const anchor =
        lastEmittedIndexRef.current ?? indexFromValue(value);
      const index = indexFromOffsetSticky(offsetX, anchor, maxIndex);
      const steppedValue = ticks[index];
      const indexChanged = index !== lastEmittedIndexRef.current;

      if (indexChanged) {
        lastEmittedIndexRef.current = index;
        syncedIndexRef.current = index;

        if (tickFeedback && fromUser && !suppressFeedbackRef.current) {
          playOnboardingWheelTick();
        }

        onValueChangingRef.current?.(steppedValue);
      }

      if (commit && fromUser) {
        onChangeRef.current(steppedValue);
      }
    },
    [indexFromValue, tickFeedback, ticks, value],
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!userScrollingRef.current) {
        return;
      }
      emitFromOffset(event.nativeEvent.contentOffset.x, true, false);
    },
    [emitFromOffset],
  );

  const settleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>, animated: boolean) => {
      emitFromOffset(event.nativeEvent.contentOffset.x, true, true);
      const index = lastEmittedIndexRef.current ?? indexFromValue(value);
      scrollToIndex(index, animated);
    },
    [emitFromOffset, indexFromValue, scrollToIndex, value],
  );

  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const velocityX = event.nativeEvent.velocity?.x ?? 0;
      settleScroll(event, Math.abs(velocityX) >= 0.05);
      if (Math.abs(velocityX) < 0.05) {
        userScrollingRef.current = false;
      }
    },
    [settleScroll],
  );

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      userScrollingRef.current = false;
      settleScroll(event, false);
    },
    [settleScroll],
  );

  return (
    <View
      style={styles.wrap}
      onLayout={(event) => {
        const width = Math.round(event.nativeEvent.layout.width);
        if (width > 0 && width !== laneWidth) {
          setLaneWidth(width);
        }
      }}>
      {mountRuler && rulerReady ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={ITEM_WIDTH}
          snapToAlignment="start"
          scrollEventThrottle={32}
          scrollEnabled
          contentContainerStyle={[styles.content, { paddingHorizontal: sidePadding }]}
          onContentSizeChange={() => {
            if (userScrollingRef.current) {
              return;
            }
            const index = indexFromValue(value);
            if (syncedIndexRef.current !== index) {
              applyScrollSync(false);
            }
          }}
          onScrollBeginDrag={() => {
            userScrollingRef.current = true;
            lastEmittedIndexRef.current = indexFromValue(value);
          }}
          onScroll={onScroll}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScrollEndDrag={onScrollEndDrag}>
          {ticks.map((tick, index) => {
            const major = index % majorEvery === 0;
            return (
              <View key={`${tick}-${index}`} style={styles.item}>
                <View style={[styles.tick, major ? styles.tickMajor : styles.tickMinor]} />
              </View>
            );
          })}
        </ScrollView>
      ) : null}
      <View style={styles.centerNeedle} pointerEvents="none" />
    </View>
  );
}

function rulerPickerPropsEqual(
  prev: HorizontalRulerPickerProps,
  next: HorizontalRulerPickerProps,
) {
  return (
    prev.value === next.value &&
    prev.min === next.min &&
    prev.max === next.max &&
    prev.step === next.step &&
    prev.majorEvery === next.majorEvery &&
    prev.tickFeedback === next.tickFeedback &&
    prev.mountRuler === next.mountRuler
  );
}

export const HorizontalRulerPicker = memo(HorizontalRulerPickerInner, rulerPickerPropsEqual);

const styles = StyleSheet.create({
  wrap: {
    height: 56,
    justifyContent: 'flex-end',
  },
  content: {
    alignItems: 'flex-end',
    paddingBottom: 4,
  },
  item: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tick: {
    width: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(142, 142, 147, 0.55)',
  },
  tickMinor: {
    height: 14,
  },
  tickMajor: {
    height: 26,
    backgroundColor: AuthScreenTheme.textMuted,
  },
  centerNeedle: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 4,
    width: 2,
    height: 32,
    borderRadius: 1,
    backgroundColor: AuthScreenTheme.accent,
  },
});
