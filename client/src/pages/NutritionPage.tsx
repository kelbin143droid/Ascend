import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { DailySummary } from "@/components/nutrition/DailySummary";
import { FoodSearch } from "@/components/nutrition/FoodSearch";
import { QuickAdd } from "@/components/nutrition/QuickAdd";
import { FoodItem } from "@/components/nutrition/FoodItem";
import { HydrationCard } from "@/components/nutrition/HydrationCard";
import { SavedMealsList } from "@/components/nutrition/SavedMealsList";
import { CreateMealModal } from "@/components/nutrition/CreateMealModal";
import {
  computeTotals,
  readDay,
  subscribeNutrition,
  todayIso,
  type NutritionDay,
} from "@/lib/nutritionStore";

export default function NutritionPage() {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

  const [day, setDay] = useState<NutritionDay>(() => readDay());
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setDay(readDay(todayIso()));
    refresh();
    return subscribeNutrition(refresh);
  }, []);

  const totals = useMemo(() => computeTotals(day.entries), [day.entries]);

  return (
    <SystemLayout>
      <div
        className="flex flex-col gap-4 py-6 px-1 max-w-md mx-auto w-full"
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

        {/* Daily summary */}
        <DailySummary totals={totals} />

        {/* Hydration */}
        <HydrationCard waterIntake={day.waterIntake} waterGoal={day.waterGoal} />

        {/* Search */}
        <FoodSearch />

        {/* Quick add */}
        <QuickAdd />

        {/* Saved meals */}
        <SavedMealsList onCreate={() => setCreateOpen(true)} />

        {/* Food log */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <p
              className="text-[10px] uppercase tracking-[0.2em] font-bold"
              style={{ color: colors.textMuted }}
            >
              Today's Log
            </p>
            <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
              {totals.count} {totals.count === 1 ? "entry" : "entries"}
            </span>
          </div>

          {day.entries.length === 0 ? (
            <div
              className="rounded-xl px-4 py-8 text-center text-xs"
              style={{
                backgroundColor: colors.surface,
                border: `1px dashed ${colors.surfaceBorder}`,
                color: colors.textMuted,
              }}
              data-testid="nutrition-empty-state"
            >
              No food logged yet. Search above or quick-add calories to get started.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {day.entries.map((entry) => (
                <FoodItem key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateMealModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </SystemLayout>
  );
}
