import { useCallback, useEffect, useRef, useState } from 'react';

import type { MealFoodItem } from '@/features/home/types/meal-food';
import { FOOD_SEARCH_PAGE_SIZE, searchFoods } from '@/lib/foods-api';

const DEBOUNCE_MS = 380;

function mergeFoodItems(prev: MealFoodItem[], next: MealFoodItem[]): MealFoodItem[] {
  if (next.length === 0) {
    return prev;
  }
  const seen = new Set(prev.map((item) => item.id));
  const appended = next.filter((item) => !seen.has(item.id));
  return appended.length > 0 ? [...prev, ...appended] : prev;
}

export function useOpenFoodSearch(query: string) {
  const [items, setItems] = useState<MealFoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const pageRef = useRef(1);
  const requestId = useRef(0);
  const queryRef = useRef(query);
  const loadingRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(false);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setItems([]);
      setLoading(false);
      setLoadingMore(false);
      setError(null);
      setHasMore(false);
      setTotal(0);
      pageRef.current = 1;
      return;
    }

    const controller = new AbortController();
    const id = ++requestId.current;
    pageRef.current = 1;
    setLoading(true);
    setLoadingMore(false);
    setError(null);

    const timer = setTimeout(() => {
      void searchFoods(trimmed, {
        page: 1,
        pageSize: FOOD_SEARCH_PAGE_SIZE,
        signal: controller.signal,
      })
        .then((result) => {
          if (id !== requestId.current) {
            return;
          }
          setItems(result.items);
          setTotal(result.total);
          setHasMore(result.has_more);
          pageRef.current = result.page;
        })
        .catch((e: unknown) => {
          if (id !== requestId.current || controller.signal.aborted) {
            return;
          }
          if (e instanceof Error && e.name === 'AbortError') {
            return;
          }
          setItems([]);
          setHasMore(false);
          setTotal(0);
          setError(e instanceof Error ? e.message : 'search_failed');
        })
        .finally(() => {
          if (id === requestId.current) {
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const loadMore = useCallback(() => {
    const trimmed = queryRef.current.trim();
    if (
      trimmed.length < 2 ||
      loadingRef.current ||
      loadingMoreRef.current ||
      !hasMoreRef.current
    ) {
      return;
    }

    const nextPage = pageRef.current + 1;
    const id = ++requestId.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError(null);

    void searchFoods(trimmed, {
      page: nextPage,
      pageSize: FOOD_SEARCH_PAGE_SIZE,
    })
      .then((result) => {
        if (id !== requestId.current) {
          return;
        }
        setItems((prev) => mergeFoodItems(prev, result.items));
        setTotal(result.total);
        setHasMore(result.has_more);
        pageRef.current = result.page;
      })
      .catch((e: unknown) => {
        if (id !== requestId.current) {
          return;
        }
        setError(e instanceof Error ? e.message : 'search_failed');
      })
      .finally(() => {
        if (id === requestId.current) {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        }
      });
  }, []);

  return { items, loading, loadingMore, error, hasMore, total, loadMore };
}
