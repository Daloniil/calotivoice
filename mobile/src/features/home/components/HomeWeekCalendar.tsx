import { CalendarBlank } from 'phosphor-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';

import { HomeCalendarPickerSheet } from '@/features/home/components/HomeCalendarPickerSheet';

import {
  appLocaleTag,
  daysOfWeek,
  formatDayNumber,
  formatWeekdayShort,
  isSameDay,
  isToday,
  mondayForWeekOffset,
  startOfDay,
  startOfWeekMonday,
  weekOffsetFromAnchor,
} from '@/features/home/lib/week-calendar';
import { useAppTranslation } from '@/i18n';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

const WEEKS_BEFORE = 52;
const WEEKS_AFTER = 12;
const WEEK_COUNT = WEEKS_BEFORE + WEEKS_AFTER + 1;
const CALENDAR_BUTTON = 40;

type Props = {
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
};

type WeekPage = { key: string; offset: number };

export function HomeWeekCalendar({ selectedDate, onSelectedDateChange }: Props) {
  const { t, i18n } = useAppTranslation();
  const localeTag = appLocaleTag(i18n.language);

  const anchorMonday = useMemo(() => startOfWeekMonday(new Date()), []);
  const today = useMemo(() => startOfDay(new Date()), []);
  const [stripWidth, setStripWidth] = useState(0);

  const pages = useMemo(
    () =>
      Array.from({ length: WEEK_COUNT }, (_, index) => {
        const offset = index - WEEKS_BEFORE;
        return { key: `w-${offset}`, offset };
      }),
    [],
  );

  const initialIndex = WEEKS_BEFORE + weekOffsetFromAnchor(selectedDate, new Date());

  const listRef = useRef<FlatList<WeekPage>>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const scrollToWeekOffset = useCallback(
    (offset: number, animated: boolean) => {
      const index = WEEKS_BEFORE + offset;
      if (index < 0 || index >= WEEK_COUNT) {
        return;
      }
      listRef.current?.scrollToIndex({ index, animated });
    },
    [],
  );

  useEffect(() => {
    if (stripWidth <= 0) {
      return;
    }
    scrollToWeekOffset(weekOffsetFromAnchor(selectedDate, new Date()), false);
  }, [scrollToWeekOffset, selectedDate, stripWidth]);

  const renderWeek = ({ item }: ListRenderItemInfo<WeekPage>) => {
    const monday = mondayForWeekOffset(anchorMonday, item.offset);
    const days = daysOfWeek(monday);

    return (
      <View style={[styles.weekPage, stripWidth > 0 && { width: stripWidth }]}>
        {days.map((day) => {
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const dayStart = startOfDay(day);
          const isFuture = dayStart.getTime() > startOfDay(new Date()).getTime();
          const weekday = formatWeekdayShort(day, localeTag);
          const dayNum = formatDayNumber(day, localeTag);

          return (
            <Pressable
              key={day.toISOString()}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: isFuture }}
              accessibilityLabel={t('home.dashboard.calendar.dayA11y', {
                weekday,
                date: dayNum,
              })}
              disabled={isFuture}
              onPress={() => onSelectedDateChange(dayStart)}
              style={({ pressed }) => [
                styles.dayCell,
                isFuture && styles.dayCellFuture,
                pressed && !isFuture && styles.dayCellPressed,
              ]}>
              <Text
                style={[
                  styles.weekdayLabel,
                  isFuture && styles.weekdayLabelFuture,
                  selected && styles.weekdayLabelSelected,
                ]}
                numberOfLines={1}>
                {weekday.replace('.', '')}
              </Text>
              <View
                style={[
                  styles.dayBubble,
                  today && !selected && styles.dayBubbleToday,
                  selected && styles.dayBubbleSelected,
                ]}>
                <Text
                  style={[
                    styles.dayNumber,
                    selected && styles.dayNumberSelected,
                    today && !selected && styles.dayNumberEmphasis,
                  ]}>
                  {dayNum}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const applyPickerDate = (date: Date) => {
    onSelectedDateChange(date);
    scrollToWeekOffset(weekOffsetFromAnchor(date, new Date()), true);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View
          style={styles.stripSlot}
          onLayout={(event) => {
            const next = Math.round(event.nativeEvent.layout.width);
            if (next > 0 && next !== stripWidth) {
              setStripWidth(next);
            }
          }}>
          {stripWidth > 0 ? (
            <FlatList
              ref={listRef}
              data={pages}
              horizontal
              pagingEnabled
              bounces
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.key}
              renderItem={renderWeek}
              getItemLayout={(_, index) => ({
                length: stripWidth,
                offset: stripWidth * index,
                index,
              })}
              initialScrollIndex={Math.max(0, Math.min(WEEK_COUNT - 1, initialIndex))}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  listRef.current?.scrollToIndex({ index: info.index, animated: false });
                }, 50);
              }}
              style={styles.strip}
            />
          ) : null}
        </View>
        <View style={styles.calendarColumn}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home.dashboard.calendar.openPickerA11y')}
            onPress={() => setPickerOpen(true)}
            style={({ pressed }) => [styles.calendarButton, pressed && styles.sideButtonPressed]}>
            <CalendarBlank color={AuthScreenTheme.textMuted} size={20} weight="duotone" />
          </Pressable>
        </View>
      </View>

      <HomeCalendarPickerSheet
        open={pickerOpen}
        selectedDate={selectedDate}
        onClose={() => setPickerOpen(false)}
        onSelectDate={applyPickerDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stripSlot: {
    flex: 1,
    minWidth: 0,
  },
  calendarColumn: {
    width: CALENDAR_BUTTON,
    height: CALENDAR_BUTTON,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarButton: {
    width: CALENDAR_BUTTON,
    height: CALENDAR_BUTTON,
    borderRadius: CALENDAR_BUTTON / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sideButtonPressed: {
    opacity: 0.85,
  },
  strip: {
    flexGrow: 0,
  },
  weekPage: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.two,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  dayCellPressed: {
    opacity: 0.88,
  },
  dayCellFuture: {
    opacity: 0.35,
  },
  weekdayLabel: {
    color: AuthScreenTheme.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  weekdayLabelSelected: {
    color: AuthScreenTheme.text,
  },
  weekdayLabelFuture: {
    opacity: 0.9,
  },
  dayBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubbleToday: {
    borderWidth: 2,
    borderColor: AuthScreenTheme.accent,
  },
  dayBubbleSelected: {
    backgroundColor: AuthScreenTheme.accent,
  },
  dayNumber: {
    color: AuthScreenTheme.text,
    fontSize: 15,
    fontWeight: '600',
  },
  dayNumberEmphasis: {
    fontWeight: '700',
  },
  dayNumberSelected: {
    color: '#0A0A0A',
    fontWeight: '800',
  },
});
