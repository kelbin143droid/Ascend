import { useEffect, useState } from "react";
import { Bookmark, CalendarPlus, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import {
  deleteSavedMeal,
  listSavedMeals,
  logSavedMealToToday,
  setPendingMealSchedule,
  subscribeSavedMeals,
  type SavedMeal,
} from "@/lib/savedMealsStore";

interface Props {
  onCreate: () => void;
}

export function SavedMealsList({ onCreate }: Props) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [meals, setMeals] = useState<SavedMeal[]>(() => listSavedMeals());

  useEffect(() => {
    const refresh = () => setMeals(listSavedMeals());
    refresh();
    return subscribeSavedMeals(refresh);
  }, []);

  const handleAddToToday = (meal: SavedMeal) => {
    const n = logSavedMealToToday(meal.id);
    toast({
      title: "Meal logged",
      description: `Added ${n} item${n === 1 ? "" : "s"} from ${meal.name} to today.`,
    });
  };

  const handleSchedule = (meal: SavedMeal) => {
    setPendingMealSchedule({
      mealId: meal.id,
      name: meal.name,
      description: `${meal.totalCalories} kcal · P${meal.totalProtein} C${meal.totalCarbs} F${meal.totalFat}`,
    });
    navigate("/sectograph");
  };

  return (
    <div className="flex flex-col gap-2" data-testid="saved-meals-section">
      <div className="flex items-center justify-between px-1">
        <p
          className="text-[10px] uppercase tracking-[0.2em] font-bold"
          style={{ color: colors.textMuted }}
        >
          Saved Meals
        </p>
        <button
          type="button"
          onClick={onCreate}
          data-testid="button-create-meal"
          className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
          style={{ color: colors.primary }}
        >
          <Plus size={11} /> New
        </button>
      </div>

      {meals.length === 0 ? (
        <div
          className="rounded-xl px-4 py-6 text-center text-xs"
          style={{
            backgroundColor: colors.surface,
            border: `1px dashed ${colors.surfaceBorder}`,
            color: colors.textMuted,
          }}
          data-testid="saved-meals-empty"
        >
          No saved meals yet. Compose a meal once, replay it any day.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className="rounded-xl p-3"
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.surfaceBorder}`,
              }}
              data-testid={`saved-meal-${meal.id}`}
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Bookmark size={11} style={{ color: colors.primary }} />
                    <p className="text-sm font-bold truncate" style={{ color: colors.text }}>
                      {meal.name}
                    </p>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                    {meal.foods.length} item{meal.foods.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-mono font-bold" style={{ color: colors.primary }}>
                    {meal.totalCalories}
                  </p>
                  <p className="text-[9px] uppercase font-mono" style={{ color: colors.textMuted }}>
                    kcal
                  </p>
                </div>
              </div>

              <div className="flex gap-2 text-[10px] font-mono mb-2" style={{ color: colors.textMuted }}>
                <span><span style={{ color: "#22c55e" }}>P</span> {meal.totalProtein}g</span>
                <span><span style={{ color: "#f59e0b" }}>C</span> {meal.totalCarbs}g</span>
                <span><span style={{ color: "#ef4444" }}>F</span> {meal.totalFat}g</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddToToday(meal)}
                  data-testid={`button-meal-add-today-${meal.id}`}
                  className="flex-1 rounded-lg py-1.5 text-[11px] font-bold flex items-center justify-center gap-1"
                  style={{ backgroundColor: colors.primary, color: colors.background }}
                >
                  <Plus size={11} /> Add to Today
                </button>
                <button
                  type="button"
                  onClick={() => handleSchedule(meal)}
                  data-testid={`button-meal-schedule-${meal.id}`}
                  className="flex-1 rounded-lg py-1.5 text-[11px] font-bold flex items-center justify-center gap-1"
                  style={{
                    backgroundColor: `${colors.primary}14`,
                    border: `1px solid ${colors.primary}40`,
                    color: colors.primary,
                  }}
                >
                  <CalendarPlus size={11} /> Schedule
                </button>
                <button
                  type="button"
                  onClick={() => deleteSavedMeal(meal.id)}
                  data-testid={`button-meal-delete-${meal.id}`}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#ef4444",
                  }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
