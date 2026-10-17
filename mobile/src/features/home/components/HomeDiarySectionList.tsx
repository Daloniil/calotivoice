import {
  CaretDown,
  Cookie,
  ForkKnife,
  Drop,
  Moon,
  Ruler,
  SunHorizon,
} from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { MealFoodSearchPanel } from '@/features/home/components/MealFoodSearchPanel';
import { setFoodDetailEntry } from '@/features/home/lib/food-detail-navigation';
import { sumEntryKcal } from '@/features/home/lib/format-food-macros';
import type { MealFoodLogEntry } from '@/features/home/types/meal-food';
import { useAppTranslation } from '@/i18n';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

type DiarySectionId =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'water'
  | 'measurements';

type MealSectionId = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_SECTIONS = new Set<DiarySectionId>(['breakfast', 'lunch', 'dinner', 'snack']);

const ACCORDION_OPEN_MS = 280;
const ACCORDION_CLOSE_MS = 240;

const accordionEaseOut = Easing.out(Easing.cubic);
const accordionEaseIn = Easing.in(Easing.cubic);

function isMealSection(id: DiarySectionId): id is MealSectionId {
  return MEAL_SECTIONS.has(id);
}

type SectionRow = {
  id: DiarySectionId;
  titleKey: string;
  emptyKey: string;
  kcal?: number;
  rightText?: string;
};

type Props = {
  waterMl: number;
  waterGoalMl: number;
};

export function HomeDiarySectionList({ waterMl, waterGoalMl }: Props) {
  const router = useRouter();
  const { t } = useAppTranslation();
  const [expandedId, setExpandedId] = useState<DiarySectionId | null>(null);
  const [mealLogs, setMealLogs] = useState<Record<MealSectionId, MealFoodLogEntry[]>>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  });

  const waterPct = waterGoalMl > 0 ? Math.round((waterMl / waterGoalMl) * 100) : 0;

  const mealKcal = useMemo(() => {
    const sum = (id: MealSectionId) =>
      mealLogs[id].reduce((acc, entry) => acc + sumEntryKcal(entry.food.per100g, entry.grams), 0);
    return {
      breakfast: sum('breakfast'),
      lunch: sum('lunch'),
      dinner: sum('dinner'),
      snack: sum('snack'),
    };
  }, [mealLogs]);

  const addMealEntry = useCallback((sectionId: MealSectionId, entry: MealFoodLogEntry) => {
    setMealLogs((prev) => ({
      ...prev,
      [sectionId]: [...prev[sectionId], entry],
    }));
  }, []);

  const removeMealEntry = useCallback((sectionId: MealSectionId, index: number) => {
    setMealLogs((prev) => ({
      ...prev,
      [sectionId]: prev[sectionId].filter((_, i) => i !== index),
    }));
  }, []);

  const updateMealEntryGrams = useCallback((sectionId: MealSectionId, index: number, grams: number) => {
    setMealLogs((prev) => ({
      ...prev,
      [sectionId]: prev[sectionId].map((entry, i) => (i === index ? { ...entry, grams } : entry)),
    }));
  }, []);

  const openFoodDetail = useCallback(
    (entry: MealFoodLogEntry) => {
      setFoodDetailEntry(entry);
      router.push('/food/detail');
    },
    [router],
  );

  const sections = useMemo((): SectionRow[] => {
    return [
      {
        id: 'breakfast',
        titleKey: 'home.diary.sections.breakfast',
        emptyKey: 'home.diary.empty',
        kcal: mealKcal.breakfast,
      },
      { id: 'lunch', titleKey: 'home.diary.sections.lunch', emptyKey: 'home.diary.empty', kcal: mealKcal.lunch },
      { id: 'dinner', titleKey: 'home.diary.sections.dinner', emptyKey: 'home.diary.empty', kcal: mealKcal.dinner },
      { id: 'snack', titleKey: 'home.diary.sections.snack', emptyKey: 'home.diary.empty', kcal: mealKcal.snack },
      {
        id: 'water',
        titleKey: 'home.diary.sections.water',
        emptyKey: 'home.diary.waterProgress',
        rightText: t('home.diary.waterAmount', { amount: waterMl }),
      },
      {
        id: 'measurements',
        titleKey: 'home.diary.sections.measurements',
        emptyKey: 'home.diary.measurementsHint',
      },
    ];
  }, [t, waterMl, mealKcal.breakfast, mealKcal.lunch, mealKcal.dinner, mealKcal.snack]);

  return (
    <View style={styles.list}>
      {sections.map((section) => {
        const expanded = expandedId === section.id;
        const Icon = SECTION_ICON[section.id];
        const palette = SECTION_PALETTE[section.id];
        const mealId = isMealSection(section.id) ? section.id : null;
        const mealEntries = mealId ? mealLogs[mealId] : [];
        const subtitle =
          section.id === 'water'
            ? t(section.emptyKey, { percent: waterPct })
            : mealEntries.length > 0
              ? t('home.diary.foodSearch.loggedCount', { count: mealEntries.length })
              : t(section.emptyKey);

        return (
          <DiarySectionCard
            key={section.id}
            expanded={expanded}
            onToggle={() => setExpandedId((prev) => (prev === section.id ? null : section.id))}
            title={t(section.titleKey)}
            subtitle={subtitle}
            icon={<Icon color={palette.fg} size={22} weight="duotone" />}
            iconBackground={palette.bg}
            kcalPill={
              section.kcal !== undefined && section.kcal > 0 ? (
                <View style={styles.kcalPill}>
                  <Text style={styles.kcalPillText}>
                    {t('home.diary.sectionKcal', { count: section.kcal })}
                  </Text>
                </View>
              ) : section.rightText ? (
                <Text style={styles.trailingMeta}>{section.rightText}</Text>
              ) : null
            }>
            {mealId ? (
              <MealFoodSearchPanel
                entries={mealLogs[mealId]}
                onAdd={(entry) => addMealEntry(mealId, entry)}
                    onRemoveEntry={(index) => removeMealEntry(mealId, index)}
                    onUpdateEntryGrams={(index, grams) => updateMealEntryGrams(mealId, index, grams)}
                    onOpenEntryDetail={openFoodDetail}
                  />
            ) : (
              <Text style={styles.expandedHint}>{t('home.diary.expandedPlaceholder')}</Text>
            )}
          </DiarySectionCard>
        );
      })}
    </View>
  );
}

type DiarySectionCardProps = {
  expanded: boolean;
  onToggle: () => void;
  title: string;
  subtitle: string;
  icon: ReactNode;
  iconBackground: string;
  kcalPill: ReactNode;
  children: ReactNode;
};

function DiarySectionCard({
  expanded,
  onToggle,
  title,
  subtitle,
  icon,
  iconBackground,
  kcalPill,
  children,
}: DiarySectionCardProps) {
  const progress = useSharedValue(expanded ? 1 : 0);
  const contentHeight = useSharedValue(0);
  const [bodyMounted, setBodyMounted] = useState(expanded);

  useEffect(() => {
    if (expanded) {
      setBodyMounted(true);
      progress.value = 0;
      return;
    }

    progress.value = withTiming(
      0,
      { duration: ACCORDION_CLOSE_MS, easing: accordionEaseIn },
      (finished) => {
        if (finished) {
          runOnJS(setBodyMounted)(false);
          contentHeight.value = 0;
        }
      },
    );
  }, [contentHeight, expanded, progress]);

  const bodyAnimatedStyle = useAnimatedStyle(() => {
    const measured = contentHeight.value;
    return {
      height: measured > 0 ? interpolate(progress.value, [0, 1], [0, measured]) : 0,
      opacity: interpolate(progress.value, [0, 0.45, 1], [0, 0.92, 1]),
    };
  });

  const dividerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.2, 1], [0, 0.6, 1]),
  }));

  const caretAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
  }));

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>{icon}</View>
        <View style={styles.textCol}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
        <View style={styles.trailing}>
          {kcalPill}
          <Animated.View style={caretAnimatedStyle}>
            <CaretDown color={AuthScreenTheme.textMuted} size={16} weight="bold" />
          </Animated.View>
        </View>
      </Pressable>

      {bodyMounted ? (
        <Animated.View style={[styles.expandedShell, bodyAnimatedStyle]}>
          <View
            collapsable={false}
            pointerEvents={expanded ? 'auto' : 'none'}
            style={styles.expandedMeasure}
            onLayout={(event) => {
              const nextHeight = event.nativeEvent.layout.height;
              if (nextHeight <= 0) {
                return;
              }
              const changed = Math.abs(nextHeight - contentHeight.value) > 0.5;
              contentHeight.value = nextHeight;
              if (expanded && changed && progress.value < 0.99) {
                progress.value = withTiming(1, {
                  duration: ACCORDION_OPEN_MS,
                  easing: accordionEaseOut,
                });
              }
            }}>
            <Animated.View style={[styles.expandedDivider, dividerAnimatedStyle]} />
            <View style={styles.expandedBody}>{children}</View>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const SECTION_ICON = {
  breakfast: SunHorizon,
  lunch: ForkKnife,
  dinner: Moon,
  snack: Cookie,
  water: Drop,
  measurements: Ruler,
} as const;

const SECTION_PALETTE = {
  breakfast: { fg: '#FFB340', bg: 'rgba(255, 179, 64, 0.16)' },
  lunch: { fg: '#FF6B6B', bg: 'rgba(255, 107, 107, 0.14)' },
  dinner: { fg: '#A78BFA', bg: 'rgba(167, 139, 250, 0.16)' },
  snack: { fg: '#F5C542', bg: 'rgba(245, 197, 66, 0.14)' },
  water: { fg: '#64B5F6', bg: 'rgba(100, 181, 246, 0.14)' },
  measurements: { fg: '#8E8E93', bg: 'rgba(142, 142, 147, 0.16)' },
} as const;

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  card: {
    borderRadius: 16,
    backgroundColor: 'rgba(28, 28, 30, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.two + 2,
    zIndex: 2,
    backgroundColor: 'rgba(28, 28, 30, 0.92)',
  },
  pressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  title: {
    color: AuthScreenTheme.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: AuthScreenTheme.textMuted,
    fontSize: 14,
    lineHeight: 19,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexShrink: 0,
  },
  kcalPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 197, 66, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 80, 0.35)',
  },
  kcalPillText: {
    color: '#FFE08A',
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  trailingMeta: {
    color: AuthScreenTheme.textMuted,
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  expandedShell: {
    overflow: 'hidden',
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  expandedMeasure: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  expandedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  expandedBody: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    paddingTop: Spacing.two,
  },
  expandedHint: {
    color: AuthScreenTheme.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
