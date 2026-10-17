import type { MealFoodPer100g } from '@/features/home/types/meal-food';

export function roundMacro(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) {
    return 0;
  }
  return Math.round(value * 10) / 10;
}

export function formatMacroCell(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function sumEntryKcal(per100g: MealFoodPer100g, grams: number): number {
  const kcal = per100g.kcal ?? 0;
  if (grams <= 0) {
    return 0;
  }
  return Math.round((kcal * grams) / 100);
}

export function scalePer100g(per100g: MealFoodPer100g, grams: number): MealFoodPer100g {
  const factor = grams > 0 ? grams / 100 : 0;
  const scale = (v: number | null | undefined) =>
    v == null || Number.isNaN(v) ? null : Math.round(v * factor * 10) / 10;
  return {
    kcal: scale(per100g.kcal),
    proteinG: scale(per100g.proteinG),
    fatG: scale(per100g.fatG),
    carbsG: scale(per100g.carbsG),
  };
}
