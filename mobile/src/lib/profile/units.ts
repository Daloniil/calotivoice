import type { HeightUnit, WeightUnit } from '@/lib/profile/types';

export function kgToLb(kg: number) {
  return kg * 2.2046226218;
}

export function lbToKg(lb: number) {
  return lb / 2.2046226218;
}

export function cmToInches(cm: number) {
  return cm / 2.54;
}

export function inchesToCm(inches: number) {
  return inches * 2.54;
}

export function formatWeight(kg: number, unit: WeightUnit) {
  const value = unit === 'kg' ? kg : kgToLb(kg);
  return Math.round(value * 10) / 10;
}

export function parseWeightInput(value: string, unit: WeightUnit) {
  const n = Number(value.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return unit === 'kg' ? n : lbToKg(n);
}

export function formatHeight(cm: number, unit: HeightUnit) {
  if (unit === 'cm') return Math.round(cm);
  const totalIn = cmToInches(cm);
  return Math.round(totalIn);
}

export function parseHeightInput(value: string, unit: HeightUnit) {
  const n = Number(value.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return unit === 'cm' ? n : inchesToCm(n);
}
