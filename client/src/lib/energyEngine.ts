/**
 * Energy engine — single calculation pipeline that combines nutrition
 * (calories consumed), exercise (calories burned) and the user's daily
 * calorie target into one coherent ledger. Every UI surface that needs
 * an energy number should ask this engine, never re-derive on its own.
 */

import { computeTotals, readDay, type NutritionTotals } from "./nutritionStore";
import { calculateTarget, readEnergySettings } from "./energySettingsStore";
import {
  computeExerciseTotals,
  readExercises,
  type ExerciseTotals,
} from "./exerciseStore";

export interface DailyEnergy {
  goalCalories: number;
  caloriesConsumed: number;
  caloriesBurned: number;
  /** consumed minus burned — the actual net intake */
  netCalories: number;
  /** how many kcal are still available; clamped at 0 */
  remainingCalories: number;
  /** if net intake exceeds the goal, by how much */
  overshootCalories: number;
}

export interface EnergyInput {
  nutritionTotals: NutritionTotals;
  exerciseTotals: ExerciseTotals;
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
  const burned = Math.max(0, input.exerciseTotals.totalCalories);
  const net = consumed - burned;
  const balance = goal - consumed + burned; // > 0 means under goal
  // Round only at the boundary so small per-rep burns aren't erased.
  return {
    goalCalories: goal,
    caloriesConsumed: Math.round(consumed),
    caloriesBurned: Math.round(burned),
    netCalories: Math.round(net),
    remainingCalories: Math.max(0, Math.round(balance)),
    overshootCalories: Math.max(0, Math.round(-balance)),
  };
}

/**
 * Convenience wrapper that pulls today's data from the various stores
 * and runs the engine. Useful for views that don't already have the
 * totals on hand.
 */
export function calculateDailyEnergyForDate(date?: string): DailyEnergy {
  const day = readDay(date);
  const exercises = readExercises(date);
  const goal = calculateTarget(readEnergySettings());
  return calculateDailyEnergy({
    nutritionTotals: computeTotals(day.entries),
    exerciseTotals: computeExerciseTotals(exercises),
    goalCalories: goal,
  });
}
