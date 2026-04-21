/**
 * Local nutrition log, persisted in localStorage and keyed by ISO date
 * (YYYY-MM-DD). Designed so the Nutrition screen, Vitality stat, or future
 * meal/barcode systems can all read from the same source of truth.
 *
 * A single CustomEvent (`ascend:nutrition-changed`) broadcasts mutations so
 * any subscribed view can re-render without a global store dependency.
 */

export interface NutritionEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;        // multiplier applied to the macros above
  servingLabel?: string;   // e.g. "1 cup (158g)" — display only
  addedAt: number;         // epoch ms
}

export interface NutritionDay {
  date: string;            // YYYY-MM-DD
  entries: NutritionEntry[];
}

const STORAGE_PREFIX = "ascend_nutrition_";
const CHANGE_EVENT = "ascend:nutrition-changed";

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function storageKey(date: string): string {
  return `${STORAGE_PREFIX}${date}`;
}

export function readDay(date: string = todayIso()): NutritionDay {
  try {
    const raw = localStorage.getItem(storageKey(date));
    if (!raw) return { date, entries: [] };
    const parsed = JSON.parse(raw) as NutritionDay;
    if (!parsed || !Array.isArray(parsed.entries)) return { date, entries: [] };
    return { date, entries: parsed.entries };
  } catch {
    return { date, entries: [] };
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

export function subscribeNutrition(handler: () => void): () => void {
  const listener = () => handler();
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}
