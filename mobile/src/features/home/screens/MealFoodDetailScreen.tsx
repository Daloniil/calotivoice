import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BowlFood, Cube, Drop, Leaf, OrangeSlice, WaveSine } from 'phosphor-react-native';
import { useEffect, useMemo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthGradientBackground } from '@/features/auth/components/AuthGradientBackground';
import { formatMacroCell, sumEntryKcal } from '@/features/home/lib/format-food-macros';
import { clearFoodDetailEntry, peekFoodDetailEntry } from '@/features/home/lib/food-detail-navigation';
import type { MealFoodPer100g } from '@/features/home/types/meal-food';
import { useAppTranslation } from '@/i18n';
import { useAppLanguageTopInset } from '@/shared/components/i18n/AppLanguageChrome';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

const MACRO_THEME = {
  protein: { fill: '#64B5F6', track: 'rgba(100, 181, 246, 0.22)', value: '#9DD4FF' },
  fat: { fill: '#F5C542', track: 'rgba(245, 197, 66, 0.22)', value: '#FFE08A' },
  carbs: { fill: AuthScreenTheme.accent, track: 'rgba(61, 214, 140, 0.22)', value: '#7AEBB8' },
} as const;

function macroBarRatio(value: number | null | undefined, max: number): number {
  const v = value ?? 0;
  if (max <= 0 || v <= 0) {
    return 0;
  }
  return Math.min(1, v / max);
}

function macroEnergySplit(per100g: MealFoodPer100g) {
  const p = (per100g.proteinG ?? 0) * 4;
  const f = (per100g.fatG ?? 0) * 9;
  const c = (per100g.carbsG ?? 0) * 4;
  const total = p + f + c;
  if (total <= 0) {
    return { p: 0, f: 0, c: 0, total: 0 };
  }
  return { p: p / total, f: f / total, c: c / total, total };
}

function formatNutrient(value: number | null | undefined, unit: string): string {
  if (value == null || Number.isNaN(value)) {
    return `~0 ${unit}`;
  }
  const rounded = Math.round(value * 10) / 10;
  const num = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return `~${num} ${unit}`;
}

function DetailMacroCard({
  label,
  valueG,
  barRatio,
  theme,
}: {
  label: string;
  valueG: string;
  barRatio: number;
  theme: (typeof MACRO_THEME)[keyof typeof MACRO_THEME];
}) {
  const fillFlex = barRatio > 0 ? Math.max(barRatio, 0.08) : 0;
  const emptyFlex = 1 - fillFlex;
  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroCardLabel}>{label}</Text>
      <Text style={[styles.macroCardValue, { color: theme.value }]}>{valueG}</Text>
      <View style={[styles.macroCardTrack, { backgroundColor: theme.track }]}>
        <View style={styles.macroCardFillRow}>
          {fillFlex > 0 ? (
            <View style={[styles.macroCardFill, { flex: fillFlex, backgroundColor: theme.fill }]} />
          ) : null}
          <View style={{ flex: emptyFlex > 0 ? emptyFlex : 1 }} />
        </View>
      </View>
    </View>
  );
}

function NutrientChip({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.nutrientChip}>
      <View style={styles.nutrientIcon}>{icon}</View>
      <Text style={styles.nutrientLabel}>{label}</Text>
      <Text style={styles.nutrientValue}>{value}</Text>
    </View>
  );
}

export function MealFoodDetailScreen() {
  const { t } = useAppTranslation();
  const languageTopInset = useAppLanguageTopInset();
  const entry = peekFoodDetailEntry();

  useEffect(() => {
    return () => clearFoodDetailEntry();
  }, []);

  const per100g = entry?.food.per100g;
  const grams = entry?.grams ?? 0;

  const macroMax = useMemo(() => {
    if (!per100g) {
      return 1;
    }
    return Math.max(per100g.proteinG ?? 0, per100g.fatG ?? 0, per100g.carbsG ?? 0, 1);
  }, [per100g]);

  const energySplit = useMemo(() => (per100g ? macroEnergySplit(per100g) : null), [per100g]);

  if (!entry || !per100g) {
    return <Redirect href="/home" />;
  }

  const { food } = entry;
  const kcal100 = formatMacroCell(per100g.kcal);
  const portionKcal = sumEntryKcal(per100g, grams);
  const gUnit = t('home.diary.macroUnitG');
  const mgUnit = 'mg';

  const categoryLabel = food.isDrink
    ? t('home.diary.foodDetail.categoryDrink')
    : t('home.diary.foodDetail.categoryFood');

  return (
    <AuthGradientBackground style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={{ height: languageTopInset }} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.crumb}>
            {t('home.diary.foodDetail.crumb', { category: categoryLabel })}
          </Text>
          <Text style={styles.title}>{food.name}</Text>

          {grams > 0 ? (
            <Text style={styles.portionLine}>
              {t('home.diary.foodDetail.loggedPortion', {
                grams,
                unit: gUnit,
                kcal: portionKcal,
              })}
            </Text>
          ) : null}

          <View style={styles.heroCard}>
            <View style={styles.kcalBlock}>
              <Text style={styles.kcalBig}>{kcal100}</Text>
              <Text style={styles.kcalUnit}>{t('home.diary.kcalUnit')}</Text>
            </View>
            <Text style={styles.per100Hint}>{t('home.diary.foodSearch.per100g')}</Text>

            <View style={styles.macroRow}>
              <DetailMacroCard
                label={t('home.diary.foodDetail.proteinShort')}
                valueG={`${formatMacroCell(per100g.proteinG)} ${gUnit}`}
                barRatio={macroBarRatio(per100g.proteinG, macroMax)}
                theme={MACRO_THEME.protein}
              />
              <DetailMacroCard
                label={t('home.diary.foodDetail.fatShort')}
                valueG={`${formatMacroCell(per100g.fatG)} ${gUnit}`}
                barRatio={macroBarRatio(per100g.fatG, macroMax)}
                theme={MACRO_THEME.fat}
              />
              <DetailMacroCard
                label={t('home.diary.foodDetail.carbsShort')}
                valueG={`${formatMacroCell(per100g.carbsG)} ${gUnit}`}
                barRatio={macroBarRatio(per100g.carbsG, macroMax)}
                theme={MACRO_THEME.carbs}
              />
            </View>

            {energySplit && energySplit.total > 0 ? (
              <View style={styles.energyBar}>
                <View
                  style={[
                    styles.energySegment,
                    { flex: energySplit.p, backgroundColor: MACRO_THEME.protein.fill },
                  ]}
                />
                <View
                  style={[styles.energySegment, { flex: energySplit.f, backgroundColor: MACRO_THEME.fat.fill }]}
                />
                <View
                  style={[styles.energySegment, { flex: energySplit.c, backgroundColor: MACRO_THEME.carbs.fill }]}
                />
              </View>
            ) : null}

            <View style={styles.nutrientGrid}>
              <NutrientChip
                icon={<Leaf color="#7AEBB8" size={18} weight="duotone" />}
                label={t('home.diary.foodSearch.fieldFiber')}
                value={formatNutrient(per100g.fiberG, gUnit)}
              />
              <NutrientChip
                icon={<OrangeSlice color="#FFB340" size={18} weight="duotone" />}
                label={t('home.diary.foodSearch.fieldSugars')}
                value={formatNutrient(per100g.sugarsG, gUnit)}
              />
              <NutrientChip
                icon={<Cube color="#FF6B6B" size={18} weight="duotone" />}
                label={t('home.diary.foodDetail.addedSugars')}
                value={formatNutrient(per100g.sugarsG, gUnit)}
              />
              <NutrientChip
                icon={<BowlFood color="rgba(255,255,255,0.55)" size={18} weight="duotone" />}
                label={t('home.diary.foodSearch.fieldSodium')}
                value={formatNutrient(per100g.sodiumMg, mgUnit)}
              />
              <NutrientChip
                icon={<WaveSine color="#FFB340" size={18} weight="duotone" />}
                label={t('home.diary.foodSearch.fieldSatFat')}
                value={formatNutrient(per100g.saturatedFatG, gUnit)}
              />
              {food.isDrink ? (
                <NutrientChip
                  icon={<Drop color="#64B5F6" size={18} weight="duotone" />}
                  label={t('home.diary.foodDetail.drinkHint')}
                  value={t('home.diary.foodDetail.drinkYes')}
                />
              ) : null}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </AuthGradientBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
  crumb: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  title: {
    color: AuthScreenTheme.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: Spacing.two,
  },
  portionLine: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginBottom: Spacing.three,
  },
  heroCard: {
    borderRadius: 20,
    padding: Spacing.three,
    backgroundColor: 'rgba(28, 28, 30, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: Spacing.three,
  },
  kcalBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  kcalBig: {
    color: AuthScreenTheme.text,
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    lineHeight: 58,
  },
  kcalUnit: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 18,
    fontWeight: '700',
    paddingBottom: 8,
  },
  per100Hint: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: -Spacing.two,
  },
  macroRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  macroCard: {
    flex: 1,
    borderRadius: 14,
    padding: Spacing.two,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  macroCardLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  macroCardValue: {
    fontSize: 17,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  macroCardTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  macroCardFillRow: {
    flexDirection: 'row',
    height: 4,
  },
  macroCardFill: {
    height: '100%',
    borderRadius: 2,
    minWidth: 4,
  },
  energyBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 2,
  },
  energySegment: {
    minWidth: 4,
    borderRadius: 2,
  },
  nutrientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  nutrientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    maxWidth: '100%',
  },
  nutrientIcon: {
    width: 22,
    alignItems: 'center',
  },
  nutrientLabel: {
    flex: 1,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '600',
  },
  nutrientValue: {
    color: AuthScreenTheme.text,
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
