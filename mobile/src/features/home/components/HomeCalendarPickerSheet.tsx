import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { CaretLeft, CaretRight, X } from 'phosphor-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  addDays,
  addMonths,
  appLocaleTag,
  canGoToNextMonth,
  daysOfWeek,
  formatDayNumber,
  formatMonthYear,
  formatSelectedDayTitle,
  formatWeekdayShort,
  getMonthGrid,
  isAfterDay,
  isSameDay,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeekMonday,
} from '@/features/home/lib/week-calendar';
import { useAppTranslation } from '@/i18n';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

type Props = {
  open: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
};

const OPEN_MS = 340;
const CLOSE_MS = 260;

export function HomeCalendarPickerSheet({ open, selectedDate, onClose, onSelectDate }: Props) {
  const { t, i18n } = useAppTranslation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const localeTag = appLocaleTag(i18n.language);
  const today = useMemo(() => startOfDay(new Date()), []);

  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(open);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selectedDate));

  const gridGap = Spacing.one;
  const cellSize = Math.floor((width - Spacing.four * 2 - gridGap * 6) / 7);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setViewMonth(startOfMonth(selectedDate));
    }
    progress.value = withTiming(
      open ? 1 : 0,
      {
        duration: open ? OPEN_MS : CLOSE_MS,
        easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished && !open) {
          runOnJS(setMounted)(false);
        }
      },
    );
  }, [open, progress, selectedDate]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [48, 0]) }],
  }));

  const weekdayHeaders = useMemo(() => {
    const monday = startOfWeekMonday(today);
    return daysOfWeek(monday).map((day) => formatWeekdayShort(day, localeTag).replace('.', ''));
  }, [localeTag, today]);

  const monthCells = useMemo(() => getMonthGrid(viewMonth), [viewMonth]);
  const monthLabel = formatMonthYear(viewMonth, localeTag);
  const canNextMonth = canGoToNextMonth(viewMonth, today);

  const pickDate = (date: Date) => {
    if (isAfterDay(date, today)) {
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectDate(startOfDay(date));
    onClose();
  };

  if (!mounted) {
    return null;
  }

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.host} pointerEvents={open ? 'auto' : 'box-none'}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home.dashboard.calendar.closeA11y')}
            onPress={onClose}
            style={styles.backdropPress}
          />
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetStyle, { paddingBottom: Spacing.four + insets.bottom }]}>
          <LinearGradient
            colors={['rgba(47, 158, 107, 0.22)', 'rgba(16, 16, 18, 0)']}
            style={styles.sheetGlow}
            pointerEvents="none"
          />

          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.kicker}>{t('home.dashboard.calendar.pickerTitle')}</Text>
              <Text style={styles.heroDate}>{formatSelectedDayTitle(selectedDate, localeTag)}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('home.dashboard.calendar.closeA11y')}
              hitSlop={10}
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
              <X color={AuthScreenTheme.textMuted} size={18} weight="bold" />
            </Pressable>
          </View>

          <View style={styles.quickRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => pickDate(today)}
              style={({ pressed }) => [styles.quickChip, pressed && styles.pressed]}>
              <Text style={styles.quickChipText}>{t('home.screenTitle')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => pickDate(addDays(today, -1))}
              style={({ pressed }) => [styles.quickChip, pressed && styles.pressed]}>
              <Text style={styles.quickChipText}>{t('home.dashboard.yesterday')}</Text>
            </Pressable>
          </View>

          <View style={styles.monthNav}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('home.dashboard.calendar.prevMonthA11y')}
              onPress={() => setViewMonth((m) => addMonths(m, -1))}
              style={({ pressed }) => [styles.monthNavBtn, pressed && styles.pressed]}>
              <CaretLeft color={AuthScreenTheme.text} size={18} weight="bold" />
            </Pressable>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('home.dashboard.calendar.nextMonthA11y')}
              disabled={!canNextMonth}
              onPress={() => {
                if (canNextMonth) {
                  setViewMonth((m) => addMonths(m, 1));
                }
              }}
              style={({ pressed }) => [
                styles.monthNavBtn,
                !canNextMonth && styles.monthNavBtnDisabled,
                pressed && canNextMonth && styles.pressed,
              ]}>
              <CaretRight
                color={canNextMonth ? AuthScreenTheme.text : AuthScreenTheme.textMuted}
                size={18}
                weight="bold"
              />
            </Pressable>
          </View>

          <View style={[styles.grid, { columnGap: gridGap, rowGap: gridGap }]}>
            {weekdayHeaders.map((label) => (
              <Text key={`head-${label}`} style={[styles.weekdayHead, { width: cellSize }]}>
                {label}
              </Text>
            ))}
            {monthCells.map(({ date, inMonth }) => {
              const selected = isSameDay(date, selectedDate);
              const todayCell = isToday(date);
              const disabled = !inMonth || isAfterDay(date, today);
              const dayNum = formatDayNumber(date, localeTag);

              return (
                <Pressable
                  key={date.toISOString()}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled }}
                  disabled={disabled}
                  onPress={() => pickDate(date)}
                  style={({ pressed }) => [
                    styles.cell,
                    { width: cellSize, height: cellSize },
                    pressed && !disabled && styles.pressed,
                  ]}>
                  <View
                    style={[
                      styles.cellBubble,
                      todayCell && !selected && styles.cellBubbleToday,
                      selected && styles.cellBubbleSelected,
                      !inMonth && styles.cellBubbleOutside,
                    ]}>
                    <Text
                      style={[
                        styles.cellDay,
                        !inMonth && styles.cellDayOutside,
                        disabled && inMonth && isAfterDay(date, today) && styles.cellDayFuture,
                        selected && styles.cellDaySelected,
                        todayCell && !selected && styles.cellDayToday,
                      ]}>
                      {dayNum}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  backdropPress: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'rgba(16, 16, 18, 0.98)',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  sheetGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    color: AuthScreenTheme.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  heroDate: {
    color: AuthScreenTheme.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    textTransform: 'capitalize',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pressed: {
    opacity: 0.86,
  },
  quickRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  quickChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickChipText: {
    color: AuthScreenTheme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  monthNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  monthNavBtnDisabled: {
    opacity: 0.35,
  },
  monthLabel: {
    color: AuthScreenTheme.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    textTransform: 'capitalize',
  },
  weekdayHead: {
    textAlign: 'center',
    color: AuthScreenTheme.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: Spacing.one,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.four,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellBubble: {
    width: '88%',
    aspectRatio: 1,
    maxWidth: 44,
    maxHeight: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellBubbleToday: {
    borderWidth: 2,
    borderColor: AuthScreenTheme.accent,
  },
  cellBubbleSelected: {
    backgroundColor: AuthScreenTheme.accent,
  },
  cellBubbleOutside: {
    opacity: 0.35,
  },
  cellDay: {
    color: AuthScreenTheme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  cellDayOutside: {
    color: AuthScreenTheme.textMuted,
  },
  cellDayFuture: {
    opacity: 0.28,
  },
  cellDaySelected: {
    color: '#0A0A0A',
    fontWeight: '800',
  },
  cellDayToday: {
    fontWeight: '700',
  },
});
