/**
 * Local nutrition log, persisted in localStorage and keyed by ISO date
 * (YYYY-MM-DD). Designed so the Nutrition screen, Vitality stat, or future
 * meal/barcode systems can all read from the same source of truth.
 *
 * A single CustomEvent (`ascend:nutrition-changed`) broadcasts mutations so
 * any subscribed view can re-render without a global store dependency.
 */

export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snacks"];
export const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

export interface NutritionEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;        // multiplier applied to the macros above
  servingLabel?: string;   // e.g. "1 cup (158g)" — display only
  mealType?: MealType;     // optional grouping; defaults to "snacks"
  addedAt: number;         // epoch ms
}

export interface NutritionDay {
  date: string;            // YYYY-MM-DD
  entries: NutritionEntry[];
  waterIntake: number;     // ml consumed today
  waterGoal: number;       // ml goal (default 3000)
  burnedCalories: number;  // optional manual / future-tracked exercise burn
}

/** Pick a sensible default meal bucket from current local time. */
export function defaultMealForNow(d: Date = new Date()): MealType {
  const h = d.getHours();
  if (h >= 4 && h < 11) return "breakfast";
  if (h >= 11 && h < 16) return "lunch";
  if (h >= 16 && h < 21) return "dinner";
  return "snacks";
}

/** Treat any legacy entry (no mealType) as a snack so it still renders. */
export function entryMealType(e: NutritionEntry): MealType {
  return e.mealType ?? "snacks";
}

const STORAGE_PREFIX = "ascend_nutrition_";
const CHANGE_EVENT = "ascend:nutrition-changed";

export const DEFAULT_WATER_GOAL = 3000;
export const MAX_WATER_INTAKE = 6000;

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function storageKey(date: string): string {
  return `${STORAGE_PREFIX}${date}`;
}

export function readDay(date: string = todayIso()): NutritionDay {
  const empty: NutritionDay = { date, entries: [], waterIntake: 0, waterGoal: DEFAULT_WATER_GOAL, burnedCalories: 0 };
  try {
    const raw = localStorage.getItem(storageKey(date));
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<NutritionDay>;
    if (!parsed || !Array.isArray(parsed.entries)) return empty;
    return {
      date,
      entries: parsed.entries,
      waterIntake: typeof parsed.waterIntake === "number" ? parsed.waterIntake : 0,
      waterGoal: typeof parsed.waterGoal === "number" ? parsed.waterGoal : DEFAULT_WATER_GOAL,
      burnedCalories: typeof parsed.burnedCalories === "number" ? parsed.burnedCalories : 0,
    };
  } catch {
    return empty;
  }
}

function writeDay(day: NutritionDay): void {
  try {
    localStorage.setItem(storageKey(day.date), JSON.stringify(day));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { date: day.date } }));
  } catch (err) {
    console.warn("[nutrition] persist failed", err);
  }
}

export function addEntry(entry: Omit<NutritionEntry, "id" | "addedAt">, date: string = todayIso()): NutritionEntry {
  const full: NutritionEntry = {
    ...entry,
    id: `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    addedAt: Date.now(),
  };
  const day = readDay(date);
  day.entries.unshift(full);
  writeDay(day);
  return full;
}

export function removeEntry(entryId: string, date: string = todayIso()): void {
  const day = readDay(date);
  day.entries = day.entries.filter((e) => e.id !== entryId);
  writeDay(day);
}

export function updateEntryQuantity(entryId: string, quantity: number, date: string = todayIso()): void {
  const day = readDay(date);
  const e = day.entries.find((x) => x.id === entryId);
  if (!e) return;
  e.quantity = Math.max(0.01, quantity);
  writeDay(day);
}

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  count: number;
}

export function computeTotals(entries: NutritionEntry[]): NutritionTotals {
  const totals = entries.reduce(
    (acc, e) => {
      acc.calories += e.calories * e.quantity;
      acc.protein += e.protein * e.quantity;
      acc.carbs += e.carbs * e.quantity;
      acc.fat += e.fat * e.quantity;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  return {
    calories: Math.round(totals.calories),
    protein: +totals.protein.toFixed(1),
    carbs: +totals.carbs.toFixed(1),
    fat: +totals.fat.toFixed(1),
    count: entries.length,
  };
}

/* ─────────────── Water tracking ─────────────── */
export function addWater(ml: number, date: string = todayIso()): NutritionDay {
  const day = readDay(date);
  day.waterIntake = Math.max(0, Math.min(MAX_WATER_INTAKE, day.waterIntake + ml));
  writeDay(day);
  return day;
}

export function setWaterIntake(ml: number, date: string = todayIso()): NutritionDay {
  const day = readDay(date);
  day.waterIntake = Math.max(0, Math.min(MAX_WATER_INTAKE, ml));
  writeDay(day);
  return day;
}

export function setWaterGoal(ml: number, date: string = todayIso()): NutritionDay {
  const day = readDay(date);
  day.waterGoal = Math.max(500, Math.min(MAX_WATER_INTAKE, ml));
  writeDay(day);
  return day;
}

/* ─────────────── Burned calories ─────────────── */
export function setBurnedCalories(kcal: number, date: string = todayIso()): NutritionDay {
  const day = readDay(date);
  day.burnedCalories = Math.max(0, Math.min(5000, Math.round(kcal)));
  writeDay(day);
  return day;
}

export function addBurnedCalories(kcal: number, date: string = todayIso()): NutritionDay {
  const day = readDay(date);
  const next = (day.burnedCalories ?? 0) + Math.round(kcal);
  day.burnedCalories = Math.max(0, Math.min(5000, next));
  writeDay(day);
  return day;
}

/* ─────────────── Vitality stat hook (stub) ─────────────── */
/**
 * Stub for the future Vitality stat. Returns a 0-100 score derived from
 * hydration %, calorie %, and protein %. Implementation intentionally
 * simple — wire into the stat system when ready.
 */
export function calculateVitalityScore(day: NutritionDay, opts?: { calorieGoal?: number; proteinGoal?: number }): number {
  const calorieGoal = opts?.calorieGoal ?? 2200;
  const proteinGoal = opts?.proteinGoal ?? 130;
  const totals = computeTotals(day.entries);
  const hydrationPct = Math.min(1, day.waterIntake / Math.max(1, day.waterGoal));
  const caloriePct = Math.min(1, totals.calories / Math.max(1, calorieGoal));
  const proteinPct = Math.min(1, totals.protein / Math.max(1, proteinGoal));
  // Equal-weighted blend, expressed as 0–100.
  return Math.round(((hydrationPct + caloriePct + proteinPct) / 3) * 100);
}

export function subscribeNutrition(handler: () => void): () => void {
  const listener = () => handler();
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}
