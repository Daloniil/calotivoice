import type { WeightUnit } from '@/lib/profile/types';

const MIN_WEIGHT_KG = 35;
const TARGET_OFFSET_KG = 5;

/** Стартовое target при входе на шаг — current − 5 kg (не ниже глобального min). */
export function defaultTargetWeightKg(currentWeightKg: number) {
  const next = Math.round((currentWeightKg - TARGET_OFFSET_KG) * 10) / 10;
  return Math.max(MIN_WEIGHT_KG, next);
}

export function globalWeightBounds(unit: WeightUnit) {
  if (unit === 'kg') {
    return { min: 35, max: 200, step: 0.1, majorEvery: 10, decimals: 1 as const };
  }
  return { min: 80, max: 440, step: 0.1, majorEvery: 20, decimals: 1 as const };
}
