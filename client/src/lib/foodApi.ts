/**
 * Food data lookup. Uses USDA FoodData Central when an API key is provided
 * via `VITE_USDA_API_KEY`; otherwise falls back to a small mock catalogue so
 * the Nutrition screen always returns useful results.
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
  source: "usda" | "mock";
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

/** USDA returns nutrients per 100g for SR Legacy / Foundation foods, and per
 *  serving for Branded foods. We always normalize to the listed serving so the
 *  UI can multiply by the user-chosen quantity (1 serving = 1.0). */
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
  // For branded foods USDA reports per serving; for SR/Foundation it's per 100g.
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

export async function searchFoods(query: string, limit = 20): Promise<FoodSearchResult[]> {
  const key = getApiKey();
  if (!key) return mockSearch(query).slice(0, limit);

  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(key)}&query=${encodeURIComponent(query)}&pageSize=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`USDA ${res.status}`);
    const data = (await res.json()) as { foods?: UsdaFood[] };
    const foods = data.foods ?? [];
    return foods.map(parseUsdaFood);
  } catch (err) {
    console.warn("[foodApi] USDA fetch failed, falling back to mock", err);
    return mockSearch(query).slice(0, limit);
  }
}

export const isUsdaConfigured = (): boolean => !!getApiKey();
