import type { ActivityLevel, FitnessGoal, UserProfile } from '@/lib/profile/types';

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  active: 1.55,
  very_active: 1.725,
  athlete: 1.9,
};

function ageFromBirthDate(isoDate: string): number {
  const birth = new Date(isoDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return Math.max(1, age);
}

/** Грубая суточная цель ккал из онбординга (до бэкенда). */
export function estimateDailyKcalTarget(profile: UserProfile | null): number {
  if (!profile) {
    return 2000;
  }

  const age = ageFromBirthDate(profile.birthDate);
  const weight = profile.weightKg;
  const height = profile.heightCm;
  const sexOffset =
    profile.sex === 'male' ? 5 : profile.sex === 'female' ? -161 : -78;

  const bmr = 10 * weight + 6.25 * height - 5 * age + sexOffset;
  const tdee = bmr * ACTIVITY_FACTOR[profile.activityLevel];

  const goalDelta: Record<FitnessGoal, number> = {
    lose_weight: -400,
    maintain: 0,
    gain_weight: 350,
  };

  return Math.max(1200, Math.round(tdee + goalDelta[profile.goal]));
}

export type MacroTargets = {
  proteinG: number;
  fatG: number;
  carbsG: number;
  waterMl: number;
};

/** Ориентиры БЖУ и воды до персональных целей с бэкенда. */
export function estimateMacroTargets(profile: UserProfile | null, goalKcal: number): MacroTargets {
  const weightKg = profile?.weightKg ?? 70;
  const proteinG = Math.max(50, Math.round(weightKg * 1.6));
  const fatG = Math.max(40, Math.round((goalKcal * 0.28) / 9));
  const carbsG = Math.max(80, Math.round((goalKcal - proteinG * 4 - fatG * 9) / 4));
  const waterMl = Math.max(1500, Math.round(weightKg * 32));
  return { proteinG, fatG, carbsG, waterMl };
}
