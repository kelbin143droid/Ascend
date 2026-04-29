/**
 * Food data lookup.
 *
 * Search priority:
 *   1. Open Food Facts (free, no key, great brand coverage) — always queried
 *   2. USDA FoodData Central (VITE_USDA_API_KEY) — queried when key is present
 *   3. Local mock catalogue — fallback when no API returns results
 *
 * All values are normalized to a single canonical `FoodSearchResult`:
 *   - calories / protein / carbs / fat are PER SERVING (the listed serving)
 *   - servingLabel is a short human-readable description
 */

export interface FoodSearchResult {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingLabel: string;
  source: "usda" | "off" | "mock";
}

const MOCK_FOODS: FoodSearchResult[] = [
  { id: "mock-chicken",  name: "Chicken Breast (cooked)", calories: 165, protein: 31, carbs: 0,  fat: 3.6, servingLabel: "100 g",       source: "mock" },
  { id: "mock-rice",     name: "White Rice (cooked)",     calories: 206, protein: 4.3, carbs: 45, fat: 0.4, servingLabel: "1 cup (158g)", source: "mock" },
  { id: "mock-egg",      name: "Egg (large)",             calories: 72,  protein: 6.3, carbs: 0.4, fat: 4.8, servingLabel: "1 egg (50g)",  source: "mock" },
  { id: "mock-apple",    name: "Apple",                   calories: 95,  protein: 0.5, carbs: 25, fat: 0.3, servingLabel: "1 medium (182g)", source: "mock" },
  { id: "mock-banana",   name: "Banana",                  calories: 105, protein: 1.3, carbs: 27, fat: 0.4, servingLabel: "1 medium (118g)", source: "mock" },
  { id: "mock-oats",     name: "Oats (dry)",              calories: 150, protein: 5,   carbs: 27, fat: 3,   servingLabel: "40 g",         source: "mock" },
  { id: "mock-salmon",   name: "Salmon (cooked)",         calories: 208, protein: 22,  carbs: 0,  fat: 13,  servingLabel: "100 g",        source: "mock" },
  { id: "mock-broccoli", name: "Broccoli (cooked)",       calories: 55,  protein: 3.7, carbs: 11, fat: 0.6, servingLabel: "1 cup (156g)", source: "mock" },
  { id: "mock-almonds",  name: "Almonds",                 calories: 164, protein: 6,   carbs: 6,  fat: 14,  servingLabel: "28 g (1 oz)",  source: "mock" },
  { id: "mock-yogurt",   name: "Greek Yogurt (plain)",    calories: 100, protein: 17,  carbs: 6,  fat: 0.7, servingLabel: "170 g (¾ cup)", source: "mock" },
  { id: "mock-bread",    name: "Whole Wheat Bread",       calories: 81,  protein: 4,   carbs: 14, fat: 1.1, servingLabel: "1 slice (32g)", source: "mock" },
  { id: "mock-milk",     name: "Milk (2%)",               calories: 122, protein: 8,   carbs: 12, fat: 5,   servingLabel: "1 cup (244g)", source: "mock" },
  { id: "mock-coffee",   name: "Coffee (black)",          calories: 2,   protein: 0.3, carbs: 0,  fat: 0,   servingLabel: "1 cup (240g)", source: "mock" },
  { id: "mock-avocado",  name: "Avocado",                 calories: 240, protein: 3,   carbs: 12, fat: 22,  servingLabel: "1 fruit (150g)", source: "mock" },
];

function getApiKey(): string | undefined {
  try {
    return (import.meta as any).env?.VITE_USDA_API_KEY as string | undefined;
  } catch {
    return undefined;
  }
}

function mockSearch(query: string): FoodSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return MOCK_FOODS.slice(0, 8);
  return MOCK_FOODS.filter((f) => f.name.toLowerCase().includes(q));
}

// ── Open Food Facts ────────────────────────────────────────────────────────

interface OFFNutriments {
  "energy-kcal_serving"?: number;
  "energy-kcal_100g"?: number;
  "proteins_serving"?: number;
  "proteins_100g"?: number;
  "carbohydrates_serving"?: number;
  "carbohydrates_100g"?: number;
  "fat_serving"?: number;
  "fat_100g"?: number;
}
interface OFFProduct {
  id?: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: OFFNutriments;
}

function parseOFFProduct(p: OFFProduct, idx: number): FoodSearchResult | null {
  const name = p.product_name?.trim();
  if (!name) return null;
  const n = p.nutriments ?? {};

  const hasSrv = n["energy-kcal_serving"] != null;
  const cal = hasSrv ? (n["energy-kcal_serving"] ?? 0) : (n["energy-kcal_100g"] ?? 0);
  const pro = hasSrv ? (n["proteins_serving"] ?? 0) : (n["proteins_100g"] ?? 0);
  const carb = hasSrv ? (n["carbohydrates_serving"] ?? 0) : (n["carbohydrates_100g"] ?? 0);
  const fat = hasSrv ? (n["fat_serving"] ?? 0) : (n["fat_100g"] ?? 0);

  if (cal === 0 && pro === 0 && carb === 0) return null;

  return {
    id: `off-${p.id ?? idx}`,
    name,
    brand: p.brands?.split(",")[0]?.trim(),
    calories: Math.round(cal),
    protein: +pro.toFixed(1),
    carbs: +carb.toFixed(1),
    fat: +fat.toFixed(1),
    servingLabel: p.serving_size ? p.serving_size : hasSrv ? "1 serving" : "100 g",
    source: "off",
  };
}

async function searchOpenFoodFacts(query: string, limit = 15): Promise<FoodSearchResult[]> {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl` +
    `?search_terms=${encodeURIComponent(query)}` +
    `&json=1&page_size=${limit}` +
    `&fields=id,product_name,brands,serving_size,nutriments`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`OFF ${res.status}`);
  const data = (await res.json()) as { products?: OFFProduct[] };
  return (data.products ?? [])
    .map((p, i) => parseOFFProduct(p, i))
    .filter((r): r is FoodSearchResult => r !== null);
}

// ── USDA FoodData Central ─────────────────────────────────────────────────

interface UsdaNutrient {
  nutrientName?: string;
  nutrientNumber?: string;
  value?: number;
}
interface UsdaFood {
  fdcId: number;
  description: string;
  brandName?: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: UsdaNutrient[];
}

function parseUsdaFood(f: UsdaFood): FoodSearchResult {
  const lookup = (numbers: string[], names: string[]) => {
    const arr = f.foodNutrients ?? [];
    for (const n of arr) {
      if (n.nutrientNumber && numbers.includes(n.nutrientNumber)) return n.value ?? 0;
      if (n.nutrientName && names.some((nm) => n.nutrientName!.toLowerCase().includes(nm))) {
        return n.value ?? 0;
      }
    }
    return 0;
  };

  const cal100 = lookup(["1008", "208"], ["energy"]);
  const pro100 = lookup(["1003", "203"], ["protein"]);
  const carb100 = lookup(["1005", "205"], ["carbohydrate"]);
  const fat100 = lookup(["1004", "204"], ["total lipid", "fat"]);

  const serving = f.servingSize && f.servingSize > 0 ? f.servingSize : 100;
  const isBranded = !!f.brandOwner || !!f.brandName;
  const factor = isBranded ? 1 : serving / 100;

  const servingLabel = f.householdServingFullText
    ? f.householdServingFullText
    : f.servingSize
    ? `${f.servingSize} ${f.servingSizeUnit ?? "g"}`
    : "100 g";

  return {
    id: `usda-${f.fdcId}`,
    name: f.description,
    brand: f.brandName ?? f.brandOwner,
    calories: Math.round(cal100 * factor),
    protein: +(pro100 * factor).toFixed(1),
    carbs: +(carb100 * factor).toFixed(1),
    fat: +(fat100 * factor).toFixed(1),
    servingLabel,
    source: "usda",
  };
}

async function searchUsda(query: string, limit = 15): Promise<FoodSearchResult[]> {
  const key = getApiKey();
  if (!key) return [];
  const url =
    `https://api.nal.usda.gov/fdc/v1/foods/search` +
    `?api_key=${encodeURIComponent(key)}` +
    `&query=${encodeURIComponent(query)}` +
    `&pageSize=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`USDA ${res.status}`);
  const data = (await res.json()) as { foods?: UsdaFood[] };
  return (data.foods ?? []).map(parseUsdaFood);
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function searchFoods(query: string, limit = 25): Promise<FoodSearchResult[]> {
  const [offResults, usdaResults] = await Promise.allSettled([
    searchOpenFoodFacts(query, Math.ceil(limit * 0.6)),
    searchUsda(query, Math.ceil(limit * 0.5)),
  ]);

  const off = offResults.status === "fulfilled" ? offResults.value : [];
  const usda = usdaResults.status === "fulfilled" ? usdaResults.value : [];

  if (offResults.status === "rejected") {
    console.warn("[foodApi] Open Food Facts failed", (offResults as PromiseRejectedResult).reason);
  }
  if (usdaResults.status === "rejected") {
    console.warn("[foodApi] USDA failed", (usdaResults as PromiseRejectedResult).reason);
  }

  if (off.length === 0 && usda.length === 0) {
    return mockSearch(query).slice(0, limit);
  }

  const seen = new Set<string>();
  const merged: FoodSearchResult[] = [];
  for (const item of [...off, ...usda]) {
    const key = item.name.toLowerCase().slice(0, 40);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
    if (merged.length >= limit) break;
  }

  if (merged.length < 5) {
    const mock = mockSearch(query).filter((m) => !seen.has(m.name.toLowerCase().slice(0, 40)));
    merged.push(...mock.slice(0, limit - merged.length));
  }

  return merged.slice(0, limit);
}

export const isUsdaConfigured = (): boolean => !!getApiKey();
