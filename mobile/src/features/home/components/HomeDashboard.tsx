import { ScrollView, StyleSheet } from 'react-native';

import { HomeDiarySectionList } from '@/features/home/components/HomeDiarySectionList';
import { HomeNutritionPanel } from '@/features/home/components/HomeNutritionPanel';
import { HomeWeekCalendar } from '@/features/home/components/HomeWeekCalendar';
import { estimateDailyKcalTarget, estimateMacroTargets } from '@/features/home/lib/daily-energy-target';
import { useProfile } from '@/contexts/profile-context';
import { Spacing } from '@/shared/constants/theme';

type Props = {
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
};

/** Дневник дня: калории, БЖУ, приёмы пищи (данные — заглушки до бэкенда). */
export function HomeDashboard({ selectedDate, onSelectedDateChange }: Props) {
  const { profile } = useProfile();
  const goalKcal = estimateDailyKcalTarget(profile);
  const macroTargets = estimateMacroTargets(profile, goalKcal);

  // TODO: агрегировать по selectedDate из API / локального стора.
  const eatenKcal = 0;
  const proteinG = 0;
  const fatG = 0;
  const carbsG = 0;
  const waterMl = 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <HomeWeekCalendar selectedDate={selectedDate} onSelectedDateChange={onSelectedDateChange} />

      <HomeNutritionPanel
        eatenKcal={eatenKcal}
        goalKcal={goalKcal}
        proteinG={proteinG}
        fatG={fatG}
        carbsG={carbsG}
        waterMl={waterMl}
        targets={macroTargets}
      />

      <HomeDiarySectionList waterMl={waterMl} waterGoalMl={macroTargets.waterMl} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
});
