import { StyleSheet, Text, View } from 'react-native';
import { BowlFood, Fire } from 'phosphor-react-native';
import { useAppTranslation } from '@/i18n';

import type { IntakeResult } from '@/lib/intake-api';
import { parseMealIntake, totalCalories } from '@/lib/parse-meal-intake';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

type Props = {
  result: IntakeResult;
};

export function MealIntakeCard({ result }: Props) {
  const { t } = useAppTranslation();

  if (result.status === 'error') {
    return (
      <View style={styles.card}>
        <Text style={styles.errorTitle}>{t('home.voice.intakeErrorTitle')}</Text>
        <Text style={styles.errorBody}>{result.error ?? t('home.voice.unknownError')}</Text>
      </View>
    );
  }

  const meal = parseMealIntake(result.data);
  if (!meal) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorTitle}>{t('home.voice.intakeErrorTitle')}</Text>
        <Text style={styles.errorBody}>{t('home.voice.intakeBadShape')}</Text>
      </View>
    );
  }

  const total = totalCalories(meal.items);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <BowlFood size={22} color={AuthScreenTheme.accent} weight="fill" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('home.voice.mealTitle')}</Text>
          {total !== null ? (
            <View style={styles.totalRow}>
              <Fire size={16} color={AuthScreenTheme.accent} weight="fill" />
              <Text style={styles.totalKcal}>
                {t('home.voice.totalKcal', { count: total })}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.itemsList}>
        {meal.items.map((item, index) => (
          <View
            key={`${item.name}-${index}`}
            style={[styles.itemRow, index < meal.items.length - 1 && styles.itemRowBorder]}>
            <View style={styles.itemMain}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.portion ? <Text style={styles.itemPortion}>{item.portion}</Text> : null}
            </View>
            {item.calories_kcal !== undefined ? (
              <View style={styles.kcalCol}>
                <Text style={styles.itemKcal}>{Math.round(item.calories_kcal)}</Text>
                <Text style={styles.kcalUnit}>{t('home.voice.kcalUnit')}</Text>
              </View>
            ) : (
              <Text style={styles.itemKcalMuted}>—</Text>
            )}
          </View>
        ))}
      </View>

      {meal.summary ? (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>{t('home.voice.mealSummary')}</Text>
          <Text style={styles.summaryText}>{meal.summary}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: 16,
    backgroundColor: AuthScreenTheme.surface,
    borderWidth: 1,
    borderColor: AuthScreenTheme.surfaceBorder,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(61, 214, 140, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: AuthScreenTheme.text,
    fontSize: 18,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalKcal: {
    color: AuthScreenTheme.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  itemsList: {
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  itemRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AuthScreenTheme.surfaceBorder,
  },
  itemMain: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    color: AuthScreenTheme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  itemPortion: {
    color: AuthScreenTheme.textMuted,
    fontSize: 14,
  },
  kcalCol: {
    alignItems: 'flex-end',
    minWidth: 52,
  },
  itemKcal: {
    color: AuthScreenTheme.text,
    fontSize: 16,
    fontWeight: '700',
  },
  kcalUnit: {
    color: AuthScreenTheme.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  itemKcalMuted: {
    color: AuthScreenTheme.textMuted,
    fontSize: 16,
    minWidth: 48,
    textAlign: 'right',
  },
  summaryBox: {
    gap: Spacing.one,
    paddingTop: Spacing.one,
  },
  summaryLabel: {
    color: AuthScreenTheme.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    color: AuthScreenTheme.text,
    fontSize: 15,
    lineHeight: 22,
  },
  errorTitle: {
    color: AuthScreenTheme.error,
    fontSize: 16,
    fontWeight: '600',
  },
  errorBody: {
    color: AuthScreenTheme.textMuted,
    fontSize: 14,
  },
});
