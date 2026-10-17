import Constants from 'expo-constants';

import {
  FOOD_SEARCH_PAGE_SIZE,
  type FoodSearchOptions,
  type FoodSearchResult,
} from '@/lib/food-search-types';
import type { MealFoodItem, MealFoodPer100g } from '@/features/home/types/meal-food';

export type { FoodSearchResult } from '@/lib/food-search-types';
export { FOOD_SEARCH_PAGE_SIZE } from '@/lib/food-search-types';

/** Full-text search (рекомендуется OFF; legacy CGI часто отдаёт 503). */
const SEARCH_A_LICIOUS = 'https://search.openfoodfacts.org/search';
/** Запасной endpoint (может быть недоступен). */
const SEARCH_LEGACY = 'https://world.openfoodfacts.org/cgi/search.pl';

const USER_AGENT = `CaloriVoice/${Constants.expoConfig?.version ?? '1.0.0'} (dev; mobile; contact@calorivoice.app)`;

type OffNutriments = {
  'energy-kcal_100g'?: number;
  'energy-kcal'?: number;
  proteins_100g?: number;
  fat_100g?: number;
  carbohydrates_100g?: number;
  fiber_100g?: number;
  sugars_100g?: number;
  sodium_100g?: number;
  'saturated-fat_100g'?: number;
};

type OffProduct = {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string | string[];
  nutriments?: OffNutriments;
};

type OffLegacyResponse = {
  products?: OffProduct[];
  count?: number;
};

type OffSearchALiciousResponse = {
  hits?: OffProduct[];
  count?: number;
};

function num(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  return value;
}

function mapNutriments(n: OffNutriments | undefined): MealFoodPer100g {
  const kcal = num(n?.['energy-kcal_100g']) ?? num(n?.['energy-kcal']);
  return {
    kcal,
    proteinG: num(n?.proteins_100g),
    fatG: num(n?.fat_100g),
    carbsG: num(n?.carbohydrates_100g),
    fiberG: num(n?.fiber_100g),
    sugarsG: num(n?.sugars_100g),
    sodiumMg: n?.sodium_100g != null ? Math.round(n.sodium_100g * 1000) : null,
    saturatedFatG: num(n?.['saturated-fat_100g']),
  };
}

function brandsLabel(brands: OffProduct['brands']): string {
  if (Array.isArray(brands)) {
    return brands.filter(Boolean).join(', ');
  }
  return brands?.trim() ?? '';
}

function displayName(p: OffProduct): string {
  const name = p.product_name?.trim() || p.product_name_en?.trim();
  const brand = brandsLabel(p.brands);
  if (name && brand) {
    return `${name} ${brand}`.trim();
  }
  return name || brand || '';
}

function mapProduct(p: OffProduct): MealFoodItem | null {
  const name = displayName(p);
  if (!name) {
    return null;
  }
  const code = p.code?.trim();
  return {
    id: code ? `off-${code}` : `off-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    per100g: mapNutriments(p.nutriments),
    source: 'open_food_facts',
    barcode: code,
  };
}

function buildSearchResult(
  items: MealFoodItem[],
  total: number,
  page: number,
  pageSize: number,
): FoodSearchResult {
  const shown = (page - 1) * pageSize + items.length;
  const hasMore = items.length >= pageSize && (total === 0 || shown < total);
  return {
    items,
    total,
    page,
    page_size: pageSize,
    has_more: hasMore,
  };
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Open Food Facts HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

async function searchViaSearchALicious(
  query: string,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<FoodSearchResult> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    page_size: String(pageSize),
  });
  const data = await fetchJson<OffSearchALiciousResponse>(
    `${SEARCH_A_LICIOUS}?${params.toString()}`,
    signal,
  );
  const items = (data.hits ?? [])
    .map(mapProduct)
    .filter((item): item is MealFoodItem => item != null);

  return buildSearchResult(items, data.count ?? 0, page, pageSize);
}

async function searchViaLegacyCgi(
  query: string,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<FoodSearchResult> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page: String(page),
    page_size: String(pageSize),
    fields: 'code,product_name,product_name_en,brands,nutriments',
  });
  const data = await fetchJson<OffLegacyResponse>(`${SEARCH_LEGACY}?${params.toString()}`, signal);
  const items = (data.products ?? [])
    .map(mapProduct)
    .filter((item): item is MealFoodItem => item != null);

  return buildSearchResult(items, data.count ?? 0, page, pageSize);
}

/**
 * Текстовый поиск Open Food Facts (локальный MVP).
 * Ключ API не нужен — только HTTPS из приложения.
 */
export async function searchOpenFoodFacts(
  query: string,
  options?: FoodSearchOptions,
): Promise<FoodSearchResult> {
  const q = query.trim();
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? FOOD_SEARCH_PAGE_SIZE;
  const signal = options?.signal;

  if (q.length < 2) {
    return buildSearchResult([], 0, page, pageSize);
  }

  try {
    return await searchViaSearchALicious(q, page, pageSize, signal);
  } catch (primaryError) {
    try {
      return await searchViaLegacyCgi(q, page, pageSize, signal);
    } catch {
      throw primaryError;
    }
  }
}
