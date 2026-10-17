export type FitnessGoal = 'lose_weight' | 'maintain' | 'gain_weight';

export type Sex = 'female' | 'male' | 'other' | 'prefer_not_to_say';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'active'
  | 'very_active'
  | 'athlete';

export type WeightUnit = 'kg' | 'lb';
export type HeightUnit = 'cm' | 'ft';
export type WaterUnit = 'ml' | 'fl_oz';
export type FoodMassUnit = 'g' | 'oz';
export type EnergyUnit = 'kcal' | 'kj';

export type UnitPreferences = {
  weight: WeightUnit;
  height: HeightUnit;
  water: WaterUnit;
  foodMass: FoodMassUnit;
  energy: EnergyUnit;
};

/** Канонические метрики + настройки; отправим на бэкенд позже. */
export type UserProfile = {
  goal: FitnessGoal;
  sex: Sex;
  /** ISO date YYYY-MM-DD */
  birthDate: string;
  units: UnitPreferences;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  onboardingCompletedAt: string;
};

export type OnboardingDraft = Partial<UserProfile>;
