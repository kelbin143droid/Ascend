/**
 * Energy / metabolic settings — drives the user's daily calorie target.
 * Persisted in localStorage. Mutations dispatch `ascend:energy-changed`
 * so subscribed views re-render. BMR uses Mifflin-St Jeor.
 */

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose" | "maintain" | "gain";

export interface EnergySettings {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activity: ActivityLevel;
  goal: Goal;
}

export interface EnergyResult {
  bmr: number;
  tdee: number;
  target: number;
}

const STORAGE_KEY = "ascend_energy_settings";
const CHANGE_EVENT = "ascend:energy-changed";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (little or no exercise)",
  light: "Lightly active (1–3 days/wk)",
  moderate: "Moderately active (3–5 days/wk)",
  active: "Very active (6–7 days/wk)",
  very_active: "Extra active (athlete / 2x daily)",
};

export const GOAL_LABEL: Record<Goal, string> = {
  lose: "Lose weight",
  maintain: "Maintain",
  gain: "Gain muscle",
};

export const GOAL_MULTIPLIER: Record<Goal, number> = {
  lose: 0.85,
  maintain: 1.0,
  gain: 1.15,
};

export const DEFAULT_ENERGY_SETTINGS: EnergySettings = {
  weightKg: 75,
  heightCm: 178,
  age: 28,
  sex: "male",
  activity: "moderate",
  goal: "maintain",
};

function readGenderFromTheme(): Sex | null {
  try {
    const g = localStorage.getItem("ascend_gender");
    if (g === "male" || g === "female") return g;
  } catch {}
  return null;
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function clampNumber(n: unknown, fallback: number, lo: number, hi: number): number {
  if (!isFiniteNumber(n)) return fallback;
  return Math.max(lo, Math.min(hi, n));
}

function isActivityLevel(v: unknown): v is ActivityLevel {
  return v === "sedentary" || v === "light" || v === "moderate" || v === "active" || v === "very_active";
}

function isGoal(v: unknown): v is Goal {
  return v === "lose" || v === "maintain" || v === "gain";
}

export function readEnergySettings(): EnergySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const sex = readGenderFromTheme() ?? DEFAULT_ENERGY_SETTINGS.sex;
      return { ...DEFAULT_ENERGY_SETTINGS, sex };
    }
    const parsed = JSON.parse(raw) as Partial<EnergySettings>;
    return {
      weightKg: clampNumber(parsed.weightKg, DEFAULT_ENERGY_SETTINGS.weightKg, 20, 400),
      heightCm: clampNumber(parsed.heightCm, DEFAULT_ENERGY_SETTINGS.heightCm, 80, 260),
      age: clampNumber(parsed.age, DEFAULT_ENERGY_SETTINGS.age, 10, 120),
      sex: parsed.sex === "female" ? "female" : "male",
      activity: isActivityLevel(parsed.activity) ? parsed.activity : DEFAULT_ENERGY_SETTINGS.activity,
      goal: isGoal(parsed.goal) ? parsed.goal : DEFAULT_ENERGY_SETTINGS.goal,
    };
  } catch {
    return { ...DEFAULT_ENERGY_SETTINGS };
  }
}

export function writeEnergySettings(s: EnergySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch (err) {
    console.warn("[energy] persist failed", err);
  }
}

export function subscribeEnergySettings(handler: () => void): () => void {
  const listener = () => handler();
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

/** Mifflin-St Jeor BMR. */
export function calculateBmr(s: EnergySettings): number {
  const base = 10 * s.weightKg + 6.25 * s.heightCm - 5 * s.age;
  return Math.round(s.sex === "male" ? base + 5 : base - 161);
}

export function calculateTdee(s: EnergySettings): number {
  const bmr = calculateBmr(s);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[s.activity]);
}

export function calculateTarget(s: EnergySettings): number {
  return Math.round(calculateTdee(s) * GOAL_MULTIPLIER[s.goal]);
}

export function calculateAll(s: EnergySettings): EnergyResult {
  return {
    bmr: calculateBmr(s),
    tdee: calculateTdee(s),
    target: calculateTarget(s),
  };
}
