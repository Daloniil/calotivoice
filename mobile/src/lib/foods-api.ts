import Constants from 'expo-constants';
import * as Device from 'expo-device';

import {
  FOOD_SEARCH_PAGE_SIZE,
  type FoodSearchOptions,
  type FoodSearchResult,
} from '@/lib/food-search-types';
import { searchOpenFoodFacts } from '@/lib/open-food-facts-api';

export type { FoodSearchResult } from '@/lib/food-search-types';
export { FOOD_SEARCH_PAGE_SIZE } from '@/lib/food-search-types';

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

function metroHost(): string {
  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  if (debuggerHost) {
    return debuggerHost.split(':')[0];
  }
  return '127.0.0.1';
}

/** Foods microservice (:8084). Только mobile; voice pipeline не использует. */
export function getFoodsApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_FOODS_API_URL?.trim();
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, '');
  }

  if (__DEV__ && !Device.isDevice) {
    return 'http://127.0.0.1:8084';
  }

  if (__DEV__ && isExpoGo()) {
    return `http://${metroHost()}:8081/foods`;
  }

  return 'http://127.0.0.1:8084';
}

async function searchViaFoodsService(
  query: string,
  options?: FoodSearchOptions,
): Promise<FoodSearchResult> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? FOOD_SEARCH_PAGE_SIZE;
  const base = getFoodsApiBaseUrl();
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    page_size: String(pageSize),
  });
  const res = await fetch(`${base}/v1/foods/search?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error(`foods ${res.status}`);
  }

  const data = (await res.json()) as FoodSearchResult;
  return {
    items: data.items ?? [],
    total: data.total ?? 0,
    page: data.page ?? page,
    page_size: data.page_size ?? pageSize,
    has_more: data.has_more ?? false,
  };
}

/**
 * Поиск продуктов через backend `foods`. В dev при недоступности сервиса — прямой OFF.
 */
export async function searchFoods(
  query: string,
  options?: FoodSearchOptions,
): Promise<FoodSearchResult> {
  try {
    return await searchViaFoodsService(query, options);
  } catch (primary) {
    if (__DEV__) {
      return searchOpenFoodFacts(query, options);
    }
    throw primary;
  }
}
