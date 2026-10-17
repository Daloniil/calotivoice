import { LinearGradient } from 'expo-linear-gradient';
import { CaretDown } from 'phosphor-react-native';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { MacroTargets } from '@/features/home/lib/daily-energy-target';
import { useAppTranslation } from '@/i18n';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

type MacroKey = 'protein' | 'fat' | 'carbs' | 'water';

type Props = {
  eatenKcal: number;
  goalKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  waterMl: number;
  targets: MacroTargets;
};

type MacroItem = {
  key: MacroKey;
  current: number;
  goal: number;
  unit: string;
  shortLabel: string;
  titleLabel: string;
};

const MACRO_THEME: Record<
  MacroKey,
  { fill: string; track: string; tint: string; border: string; value: string }
> = {
  protein: {
    fill: '#64B5F6',
    track: 'rgba(100, 181, 246, 0.2)',
    tint: 'rgba(100, 181, 246, 0.1)',
    border: 'rgba(100, 181, 246, 0.22)',
    value: '#9DD4FF',
  },
  fat: {
    fill: '#F5C542',
    track: 'rgba(245, 197, 66, 0.2)',
    tint: 'rgba(245, 197, 66, 0.1)',
    border: 'rgba(245, 197, 66, 0.22)',
    value: '#FFE08A',
  },
  carbs: {
    fill: AuthScreenTheme.accent,
    track: 'rgba(61, 214, 140, 0.2)',
    tint: 'rgba(61, 214, 140, 0.1)',
    border: 'rgba(61, 214, 140, 0.22)',
    value: '#7AEBB8',
  },
  water: {
    fill: '#5BA3E8',
    track: 'rgba(91, 163, 232, 0.2)',
    tint: 'rgba(91, 163, 232, 0.1)',
    border: 'rgba(91, 163, 232, 0.22)',
    value: '#8EC5FF',
  },
};

const FADE_OUT_MS = 140;
const FADE_IN_MS = 220;

function macroRatio(current: number, goal: number): number {
  if (goal <= 0) {
    return 0;
  }
  return Math.min(1, current / goal);
}

function CompactMacroCell({
  shortLabel,
  current,
  theme,
}: {
  shortLabel: string;
  current: number;
  theme: (typeof MACRO_THEME)[MacroKey];
}) {
  return (
    <View style={[styles.pillCompact, { backgroundColor: theme.tint, borderColor: theme.border }]}>
      <Text style={styles.pillLabel} numberOfLines={1}>
        {shortLabel}
      </Text>
      <Text style={[styles.pillValue, { color: theme.value }]} numberOfLines={1} adjustsFontSizeToFit>
        {Math.round(current)}
      </Text>
    </View>
  );
}

function DetailMacroCell({
  titleLabel,
  current,
  goal,
  unit,
  theme,
}: {
  titleLabel: string;
  current: number;
  goal: number;
  unit: string;
  theme: (typeof MACRO_THEME)[MacroKey];
}) {
  const ratio = macroRatio(current, goal);
  const fillPct = `${Math.max(ratio * 100, current > 0 ? 6 : 0)}%`;
  const percent = Math.round(ratio * 100);

  return (
    <View style={[styles.pillExpanded, { backgroundColor: theme.tint, borderColor: theme.border }]}>
      <View style={styles.detailHead}>
        <Text style={styles.detailTitle}>{titleLabel}</Text>
        <Text style={styles.detailPercent}>{percent}%</Text>
      </View>

      <Text style={styles.detailAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
        <Text style={[styles.detailCurrent, { color: theme.value }]}>{Math.round(current)}</Text>
        <Text style={styles.detailSep}> / </Text>
        <Text style={styles.detailGoal}>
          {Math.round(goal)} {unit}
        </Text>
      </Text>

      <View style={[styles.detailTrack, { backgroundColor: theme.track }]}>
        <View style={[styles.detailFill, { width: fillPct, backgroundColor: theme.fill }]} />
      </View>
    </View>
  );
}

export function HomeNutritionPanel({
  eatenKcal,
  goalKcal,
  proteinG,
  fatG,
  carbsG,
  waterMl,
  targets,
}: Props) {
  const { t } = useAppTranslation();
  const [expanded, setExpanded] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const contentOpacity = useSharedValue(1);
  const expandProgress = useSharedValue(0);

  const over = eatenKcal > goalKcal && goalKcal > 0;
  const progress = goalKcal > 0 ? Math.min(1, eatenKcal / goalKcal) : 0;
  const fillWidth = `${Math.max(over ? 100 : progress * 100, progress > 0 ? 3 : 0)}%`;
  const kcalUnit = t('home.diary.kcalUnit');

  const unitG = t('home.diary.macroUnitG');
  const unitMl = t('home.diary.macroUnitMl');

  const macros: MacroItem[] = [
    {
      key: 'protein',
      current: proteinG,
      goal: targets.proteinG,
      unit: unitG,
      shortLabel: t('home.diary.macros.proteinShort'),
      titleLabel: t('home.diary.macros.proteinTitle'),
    },
    {
      key: 'fat',
      current: fatG,
      goal: targets.fatG,
      unit: unitG,
      shortLabel: t('home.diary.macros.fatShort'),
      titleLabel: t('home.diary.macros.fatTitle'),
    },
    {
      key: 'carbs',
      current: carbsG,
      goal: targets.carbsG,
      unit: unitG,
      shortLabel: t('home.diary.macros.carbsShort'),
      titleLabel: t('home.diary.macros.carbsTitle'),
    },
    {
      key: 'water',
      current: waterMl,
      goal: targets.waterMl,
      unit: unitMl,
      shortLabel: t('home.diary.macros.waterShort'),
      titleLabel: t('home.diary.macros.waterTitle'),
    },
  ];

  const finishFadeIn = useCallback(() => {
    setTransitioning(false);
  }, []);

  const swapAndFadeIn = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      expandProgress.value = withTiming(next ? 1 : 0, {
        duration: FADE_IN_MS,
        easing: Easing.out(Easing.cubic),
      });
      return next;
    });

    contentOpacity.value = withTiming(
      1,
      { duration: FADE_IN_MS, easing: Easing.out(Easing.cubic) },
      (done) => {
        if (done) {
          runOnJS(finishFadeIn)();
        }
      },
    );
  }, [contentOpacity, expandProgress, finishFadeIn]);

  const toggle = useCallback(() => {
    if (transitioning) {
      return;
    }
    setTransitioning(true);
    contentOpacity.value = withTiming(
      0,
      { duration: FADE_OUT_MS, easing: Easing.in(Easing.quad) },
      (done) => {
        if (done) {
          runOnJS(swapAndFadeIn)();
        }
      },
    );
  }, [contentOpacity, swapAndFadeIn, transitioning]);

  const caretStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(expandProgress.value, [0, 1], [0, 180])}deg` }],
  }));

  const macroContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: interpolate(contentOpacity.value, [0, 1], [6, 0]) }],
  }));

  return (
    <View style={styles.panel}>
      <View style={styles.topRow}>
        <View style={styles.kcalLineWrap}>
          <Text style={styles.kcalLine} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            <Text style={[styles.kcalCurrent, over && styles.kcalCurrentOver]}>{Math.round(eatenKcal)}</Text>
            <Text style={styles.kcalSep}> / </Text>
            <Text style={styles.kcalGoal}>{Math.round(goalKcal)}</Text>
            <Text style={styles.kcalUnit}> {kcalUnit}</Text>
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={
            expanded ? t('home.diary.nutrition.collapseA11y') : t('home.diary.nutrition.expandA11y')
          }
          onPress={toggle}
          disabled={transitioning}
          hitSlop={8}
          style={({ pressed }) => [styles.caretButton, pressed && styles.caretButtonPressed]}>
          <Animated.View style={caretStyle}>
            <CaretDown color="rgba(255,255,255,0.55)" size={16} weight="bold" />
          </Animated.View>
        </Pressable>
      </View>

      <View style={styles.barTrack}>
        {progress > 0 || over ? (
          <LinearGradient
            colors={over ? ['#FF9F0A', '#FF453A'] : ['#2F9E6B', AuthScreenTheme.accent]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.barFill, { width: fillWidth }]}
          />
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={
          expanded ? t('home.diary.nutrition.collapseA11y') : t('home.diary.nutrition.expandA11y')
        }
        onPress={toggle}
        disabled={transitioning}
        style={({ pressed }) => [pressed && !transitioning && styles.macroGridPressed]}>
        <Animated.View style={macroContentStyle}>
          {expanded ? (
            <View style={styles.macroGridExpanded}>
              {macros.map(({ key, current, goal, unit, titleLabel }) => (
                <DetailMacroCell
                  key={key}
                  titleLabel={titleLabel}
                  current={current}
                  goal={goal}
                  unit={unit}
                  theme={MACRO_THEME[key]}
                />
              ))}
            </View>
          ) : (
            <View style={styles.macroGridCompact}>
              {macros.map(({ key, current, shortLabel }) => (
                <CompactMacroCell
                  key={key}
                  shortLabel={shortLabel}
                  current={current}
                  theme={MACRO_THEME[key]}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 18,
    backgroundColor: 'rgba(28, 28, 30, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two + 2,
    paddingBottom: Spacing.three,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  kcalLineWrap: {
    flex: 1,
    minWidth: 0,
  },
  kcalLine: {
    fontVariant: ['tabular-nums'],
  },
  kcalCurrent: {
    color: AuthScreenTheme.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  kcalCurrentOver: {
    color: '#FF9F0A',
  },
  kcalSep: {
    color: 'rgba(255, 255, 255, 0.28)',
    fontSize: 22,
    fontWeight: '500',
  },
  kcalGoal: {
    color: 'rgba(255, 255, 255, 0.52)',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  kcalUnit: {
    color: 'rgba(255, 255, 255, 0.38)',
    fontSize: 15,
    fontWeight: '600',
  },
  caretButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  caretButtonPressed: {
    opacity: 0.85,
  },
  barTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
    minWidth: 3,
  },
  macroGridCompact: {
    flexDirection: 'row',
    gap: 6,
  },
  macroGridExpanded: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroGridPressed: {
    opacity: 0.98,
  },
  pillCompact: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  pillExpanded: {
    width: '48.5%',
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  pillLabel: {
    color: 'rgba(255, 255, 255, 0.48)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.45,
    marginBottom: 2,
  },
  pillValue: {
    fontSize: 17,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  detailHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  detailTitle: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.35,
    flex: 1,
  },
  detailPercent: {
    color: 'rgba(255, 255, 255, 0.38)',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  detailAmount: {
    fontVariant: ['tabular-nums'],
  },
  detailCurrent: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  detailSep: {
    color: 'rgba(255, 255, 255, 0.24)',
    fontSize: 18,
    fontWeight: '500',
  },
  detailGoal: {
    color: 'rgba(255, 255, 255, 0.46)',
    fontSize: 18,
    fontWeight: '600',
  },
  detailTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  detailFill: {
    height: '100%',
    borderRadius: 3,
  },
});
