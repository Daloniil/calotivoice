import type { MealFoodLogEntry } from '@/features/home/types/meal-food';

let pendingEntry: MealFoodLogEntry | null = null;

export function setFoodDetailEntry(entry: MealFoodLogEntry): void {
  pendingEntry = entry;
}

export function peekFoodDetailEntry(): MealFoodLogEntry | null {
  return pendingEntry;
}

export function clearFoodDetailEntry(): void {
  pendingEntry = null;
}
