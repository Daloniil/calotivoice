export type MealItem = {
  name: string;
  portion?: string;
  calories_kcal?: number;
};

export type ParsedMeal = {
  items: MealItem[];
  summary?: string;
  raw_transcript?: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

function asNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return undefined;
}

function asString(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim().length > 0) {
    return v.trim();
  }
  return undefined;
}

export function parseMealIntake(data: unknown): ParsedMeal | null {
  const root = asRecord(data);
  if (!root) {
    return null;
  }

  const rawItems = root.items;
  if (!Array.isArray(rawItems)) {
    return null;
  }

  const items: MealItem[] = [];
  for (const row of rawItems) {
    const item = asRecord(row);
    if (!item) {
      continue;
    }
    const name = asString(item.name) ?? asString(item.title) ?? asString(item.food);
    if (!name) {
      continue;
    }
    items.push({
      name,
      portion: asString(item.portion) ?? asString(item.amount) ?? asString(item.quantity),
      calories_kcal: asNumber(item.calories_kcal) ?? asNumber(item.calories) ?? asNumber(item.kcal),
    });
  }

  if (items.length === 0) {
    return null;
  }

  return {
    items,
    summary: asString(root.summary),
    raw_transcript: asString(root.raw_transcript),
  };
}

export function totalCalories(items: MealItem[]): number | null {
  let sum = 0;
  let any = false;
  for (const item of items) {
    if (item.calories_kcal !== undefined) {
      sum += item.calories_kcal;
      any = true;
    }
  }
  return any ? Math.round(sum) : null;
}
