/**
 * Energy engine — pure calorie ledger logic for the day. The engine
 * combines:
 *  - nutrition totals (calories consumed from the food log)
 *  - workout totals  (calories burned from completed Daily Flow circuits)
 *  - the user's calorie goal
 * into one coherent ledger. Every UI surface that needs an energy
 * number should ask this engine, never re-derive on its own.
 *
 * Workouts come from a single source — the workout log store — so
 * there's no double counting. Daily Flow circuits write one summary
 * entry per completion; the engine simply sums them.
 */

import { computeTotals, readDay, type NutritionTotals } from "./nutritionStore";
import { calculateTarget, readEnergySettings } from "./energySettingsStore";
import {
  readWorkouts,
  totalCaloriesBurned,
  type WorkoutEntry,
} from "./workoutLogStore";

export interface DailyEnergy {
  goalCalories: number;
  caloriesConsumed: number;
  caloriesBurned: number;
  /** consumed - burned (can be negative when burns exceed intake) */
  netCalories: number;
  /** goal - consumed + burned (positive = under goal, negative = over) */
  remainingCalories: number;
  /** if net intake exceeds the goal, by how much */
  overshootCalories: number;
}

export interface EnergyInput {
  nutritionTotals: NutritionTotals;
  workouts: WorkoutEntry[];
  goalCalories: number;
}

/**
 * Pure function — given totals and a goal, produce the daily energy
 * ledger. No I/O, easy to test.
 *
 * Formula (per spec):
 *   remaining = goal - consumed + burned
 */
export function calculateDailyEnergy(input: EnergyInput): DailyEnergy {
  const goal = Math.max(0, Math.round(input.goalCalories));
  const consumed = Math.max(0, input.nutritionTotals.calories);
  const burned = Math.max(0, totalCaloriesBurned(input.workouts));
  const net = consumed - burned;
  const balance = goal - consumed + burned; // > 0 means under goal
  // Round only at the boundary so small per-rep burns aren't erased.
  return {
    goalCalories: goal,
    caloriesConsumed: Math.round(consumed),
    caloriesBurned: Math.round(burned * 10) / 10,
    netCalories: Math.round(net),
    remainingCalories: Math.max(0, Math.round(balance)),
    overshootCalories: balance < 0 ? Math.round(-balance) : 0,
  };
}

/**
 * Convenience wrapper that pulls today's data from the various stores
 * and runs the engine. Useful for views that don't already have the
 * totals on hand.
 */
export function calculateDailyEnergyForDate(date?: string): DailyEnergy {
  const day = readDay(date);
  const workouts = readWorkouts(date);
  const goal = calculateTarget(readEnergySettings());
  return calculateDailyEnergy({
    nutritionTotals: computeTotals(day.entries),
    workouts,
    goalCalories: goal,
  });
}
