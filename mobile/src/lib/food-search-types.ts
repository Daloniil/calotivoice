import type { MealFoodItem } from '@/features/home/types/meal-food';

export const FOOD_SEARCH_PAGE_SIZE = 10;

export type FoodSearchResult = {
  items: MealFoodItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
};

export type FoodSearchOptions = {
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
};
