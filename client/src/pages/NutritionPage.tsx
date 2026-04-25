import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { DailySummary } from "@/components/nutrition/DailySummary";
import { FoodSearch } from "@/components/nutrition/FoodSearch";
import { QuickAdd } from "@/components/nutrition/QuickAdd";
import { HydrationCard } from "@/components/nutrition/HydrationCard";
import { SavedMealsList } from "@/components/nutrition/SavedMealsList";
import { CreateMealModal } from "@/components/nutrition/CreateMealModal";
import { MealGroupSection } from "@/components/nutrition/MealGroupSection";
import { EnergySettingsCard } from "@/components/nutrition/EnergySettingsCard";
import { ExerciseSection } from "@/components/nutrition/ExerciseSection";
import {
  computeTotals,
  defaultMealForNow,
  entryMealType,
  MEAL_LABEL,
  MEAL_TYPES,
  readDay,
  subscribeNutrition,
  todayIso,
  type MealType,
  type NutritionDay,
} from "@/lib/nutritionStore";
import {
  calculateTarget,
  readEnergySettings,
  subscribeEnergySettings,
} from "@/lib/energySettingsStore";
import {
  computeExerciseTotals,
  readExercises,
  subscribeExercises,
  type ExerciseEntry,
} from "@/lib/exerciseStore";
import {
  readSessions,
  subscribeWorkouts,
  totalSessionCalories,
  type WorkoutSession,
} from "@/lib/workoutStore";
import { calculateDailyEnergy } from "@/lib/energyEngine";

type Tab = "log" | "energy" | "meals";
const TABS: { id: Tab; label: string }[] = [
  { id: "log", label: "Log" },
  { id: "energy", label: "Energy" },
  { id: "meals", label: "Meals" },
];

export default function NutritionPage() {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

  const [activeTab, setActiveTab] = useState<Tab>("log");
  const [day, setDay] = useState<NutritionDay>(() => readDay());
  const [exercises, setExercises] = useState<ExerciseEntry[]>(() => readExercises());
  const [workouts, setWorkouts] = useState<WorkoutSession[]>(() => readSessions());
  const [createOpen, setCreateOpen] = useState(false);

  // Selected meal bucket for the next added entry — drives FoodSearch / QuickAdd
  const [selectedMeal, setSelectedMeal] = useState<MealType>(() => defaultMealForNow());
  const addPanelRef = useRef<HTMLDivElement>(null);

  // Daily calorie target derived from energy settings (live).
  const [calorieGoal, setCalorieGoal] = useState<number>(() => calculateTarget(readEnergySettings()));
  useEffect(() => {
    const refresh = () => setCalorieGoal(calculateTarget(readEnergySettings()));
    refresh();
    return subscribeEnergySettings(refresh);
  }, []);

  useEffect(() => {
    const refresh = () => setDay(readDay(todayIso()));
    refresh();
    return subscribeNutrition(refresh);
  }, []);

  useEffect(() => {
    const refresh = () => setExercises(readExercises(todayIso()));
    refresh();
    return subscribeExercises(refresh);
  }, []);

  useEffect(() => {
    const refresh = () => setWorkouts(readSessions(todayIso()));
    refresh();
    return subscribeWorkouts(refresh);
  }, []);

  const totals = useMemo(() => computeTotals(day.entries), [day.entries]);
  const exerciseTotals = useMemo(() => computeExerciseTotals(exercises), [exercises]);
  const workoutBurned = useMemo(() => totalSessionCalories(workouts), [workouts]);
  const energy = useMemo(
    () =>
      calculateDailyEnergy({
        nutritionTotals: totals,
        exerciseTotals,
        goalCalories: calorieGoal,
        workoutCaloriesBurned: workoutBurned,
      }),
    [totals, exerciseTotals, workoutBurned, calorieGoal],
  );

  const entriesByMeal = useMemo(() => {
    const groups: Record<MealType, typeof day.entries> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };
    for (const e of day.entries) {
      groups[entryMealType(e)].push(e);
    }
    return groups;
  }, [day.entries]);

  const handleAddFromMealGroup = (mealType: MealType) => {
    setSelectedMeal(mealType);
    // Scroll the add-food panel into view so the user sees the search box.
    requestAnimationFrame(() => {
      addPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <SystemLayout>
      <div
        className="flex flex-col gap-5 py-6 px-1 max-w-md mx-auto w-full"
        data-testid="nutrition-page"
      >
        {/* Header */}
        <div className="px-1">
          <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: colors.textMuted }}>
            System · Tools
          </p>
          <h1 className="text-xl font-bold tracking-wide" style={{ color: colors.text }}>
            Nutrition
          </h1>
        </div>

        {/* Tab nav */}
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{
            backgroundColor: `${colors.surface}80`,
            border: `1px solid ${colors.surfaceBorder}`,
          }}
          data-testid="nutrition-tabs"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                data-testid={`tab-nutrition-${tab.id}`}
                className="flex-1 py-2 rounded-lg text-sm font-semibold tracking-wide transition-colors"
                style={{
                  backgroundColor: isActive ? colors.primary : "transparent",
                  color: isActive ? colors.background : colors.textMuted,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─────────────── LOG ─────────────── */}
        {activeTab === "log" && (
          <div className="flex flex-col gap-4" data-testid="tab-panel-log">
            <DailySummary totals={totals} energy={energy} />

            {/* Add-food panel: meal selector + search + quick-add */}
            <div ref={addPanelRef} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: colors.textMuted }}>
                  Add to
                </p>
                <p className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                  {MEAL_LABEL[selectedMeal]}
                </p>
              </div>
              <div
                className="flex rounded-lg p-1 gap-1"
                style={{
                  backgroundColor: `${colors.surface}80`,
                  border: `1px solid ${colors.surfaceBorder}`,
                }}
                data-testid="meal-type-chips"
              >
                {MEAL_TYPES.map((m) => {
                  const isActive = m === selectedMeal;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMeal(m)}
                      data-testid={`chip-meal-${m}`}
                      className="flex-1 py-1.5 rounded-md text-[11px] font-bold transition-colors"
                      style={{
                        backgroundColor: isActive ? `${colors.primary}25` : "transparent",
                        color: isActive ? colors.primary : colors.textMuted,
                        border: `1px solid ${isActive ? `${colors.primary}55` : "transparent"}`,
                      }}
                    >
                      {MEAL_LABEL[m]}
                    </button>
                  );
                })}
              </div>
              <FoodSearch mealType={selectedMeal} />
              <QuickAdd mealType={selectedMeal} />
            </div>

            {/* Meal groups */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: colors.textMuted }}>
                  Today's Log
                </p>
                <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                  {totals.count} {totals.count === 1 ? "entry" : "entries"}
                </span>
              </div>
              {MEAL_TYPES.map((m) => (
                <MealGroupSection
                  key={m}
                  mealType={m}
                  label={MEAL_LABEL[m]}
                  entries={entriesByMeal[m]}
                  defaultOpen={entriesByMeal[m].length > 0 || m === selectedMeal}
                  onAdd={handleAddFromMealGroup}
                />
              ))}
            </div>

            {/* Exercise log — burns flow into the energy ledger above */}
            <ExerciseSection
              entries={exercises}
              totalCalories={exerciseTotals.totalCalories}
            />
          </div>
        )}

        {/* ─────────────── ENERGY ─────────────── */}
        {activeTab === "energy" && (
          <div className="flex flex-col gap-4" data-testid="tab-panel-energy">
            <HydrationCard waterIntake={day.waterIntake} waterGoal={day.waterGoal} />
            <EnergySettingsCard />
          </div>
        )}

        {/* ─────────────── MEALS ─────────────── */}
        {activeTab === "meals" && (
          <div className="flex flex-col gap-4" data-testid="tab-panel-meals">
            <SavedMealsList onCreate={() => setCreateOpen(true)} />
          </div>
        )}
      </div>

      <CreateMealModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </SystemLayout>
  );
}
