/** Нормализованный продукт (OFF или пользовательский). */
export type MealFoodPer100g = {
  kcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  fiberG?: number | null;
  sugarsG?: number | null;
  sodiumMg?: number | null;
  saturatedFatG?: number | null;
};

export type MealFoodItem = {
  id: string;
  name: string;
  per100g: MealFoodPer100g;
  source: 'open_food_facts' | 'custom';
  barcode?: string;
  isDrink?: boolean;
};

export type MealFoodLogEntry = {
  food: MealFoodItem;
  /** Масса порции в граммах (мл для напитков — позже). */
  grams: number;
};
