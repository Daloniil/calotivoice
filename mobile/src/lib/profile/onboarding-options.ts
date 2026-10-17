import type { ActivityLevel, FitnessGoal, Sex } from '@/lib/profile/types';

export const GOAL_IDS: FitnessGoal[] = ['lose_weight', 'maintain', 'gain_weight'];

export const SEX_IDS: Sex[] = ['female', 'male', 'other', 'prefer_not_to_say'];

/** Варианты на экране выбора пола (без «Prefer not to say» — отдельная кнопка внизу). */
export const SEX_CHOICE_IDS = ['female', 'male'] as const satisfies readonly Sex[];

export const ACTIVITY_IDS: ActivityLevel[] = [
  'sedentary',
  'lightly_active',
  'active',
  'very_active',
  'athlete',
];
