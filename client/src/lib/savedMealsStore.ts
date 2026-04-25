/**
 * Reusable meal templates the user composes once and replays into the daily
 * nutrition log or schedules onto the Sectograph. Stored in localStorage as
 * a single collection (no date binding). Mutations dispatch
 * `ascend:saved-meals-changed` so subscribed views re-render without a
 * global store dependency.
 */

import { addEntry, computeTotals } from "./nutritionStore";

export interface SavedMealFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  servingLabel?: string;
}

export interface SavedMeal {
  id: string;
  name: string;
  foods: SavedMealFood[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  createdAt: number;
}

const STORAGE_KEY = "ascend_saved_meals";
const CHANGE_EVENT = "ascend:saved-meals-changed";

function read(): SavedMeal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(meals: SavedMeal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch (err) {
    console.warn("[savedMeals] persist failed", err);
  }
}

export function listSavedMeals(): SavedMeal[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getSavedMeal(id: string): SavedMeal | undefined {
  return read().find((m) => m.id === id);
}

function computeMealTotals(foods: SavedMealFood[]) {
  const totals = computeTotals(
    foods.map((f) => ({
      id: "",
      addedAt: 0,
      name: f.name,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      quantity: f.quantity,
    })),
  );
  return totals;
}

export function saveMeal(name: string, foods: SavedMealFood[]): SavedMeal {
  const totals = computeMealTotals(foods);
  const meal: SavedMeal = {
    id: `meal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || "Untitled Meal",
    foods,
    totalCalories: totals.calories,
    totalProtein: totals.protein,
    totalCarbs: totals.carbs,
    totalFat: totals.fat,
    createdAt: Date.now(),
  };
  const meals = read();
  meals.push(meal);
  write(meals);
  return meal;
}

export function deleteSavedMeal(id: string): void {
  const meals = read().filter((m) => m.id !== id);
  write(meals);
}

/** Add every food in a saved meal to today's nutrition log. */
export function logSavedMealToToday(mealId: string): number {
  const meal = getSavedMeal(mealId);
  if (!meal) return 0;
  for (const f of meal.foods) {
    addEntry({
      name: f.name,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      quantity: f.quantity,
      servingLabel: f.servingLabel,
    });
  }
  return meal.foods.length;
}

export function subscribeSavedMeals(handler: () => void): () => void {
  const listener = () => handler();
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

/* ─────────────── Sectograph hand-off ─────────────── */
/**
 * The Nutrition page writes a "pending schedule" intent here, then routes
 * the user to /sectograph. SectographPage reads + clears it on mount and
 * pre-fills its Add Block dialog with type=meal and the meal's name/macros.
 */
const PENDING_KEY = "ascend_pending_meal_schedule";

export interface PendingMealSchedule {
  mealId: string;
  name: string;
  description: string;
}

export function setPendingMealSchedule(p: PendingMealSchedule): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(p));
  } catch {}
}

export function consumePendingMealSchedule(): PendingMealSchedule | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    localStorage.removeItem(PENDING_KEY);
    return JSON.parse(raw) as PendingMealSchedule;
  } catch {
    return null;
  }
}
