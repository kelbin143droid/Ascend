import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { FoodItem } from "@/components/nutrition/FoodItem";
import {
  computeTotals,
  type MealType,
  type NutritionEntry,
} from "@/lib/nutritionStore";

interface MealGroupSectionProps {
  mealType: MealType;
  label: string;
  entries: NutritionEntry[];
  defaultOpen?: boolean;
  onAdd: (mealType: MealType) => void;
}

/**
 * Collapsible meal section showing per-meal calories and macros plus the
 * food items inside. The "+ Add food" button bubbles up the meal type so the
 * page-level add affordance can route the new entry into this bucket.
 */
export function MealGroupSection({
  mealType,
  label,
  entries,
  defaultOpen = true,
  onAdd,
}: MealGroupSectionProps) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [open, setOpen] = useState(defaultOpen);

  const totals = computeTotals(entries);
  const empty = entries.length === 0;

  return (
    <div
      data-testid={`meal-group-${mealType}`}
      className="w-full rounded-xl overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.surfaceBorder}`,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
        data-testid={`meal-group-toggle-${mealType}`}
      >
        <span style={{ color: colors.textMuted }}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight" style={{ color: colors.text }}>
            {label}
          </p>
          <p className="text-[10px] font-mono mt-0.5" style={{ color: colors.textMuted }}>
            {entries.length} {entries.length === 1 ? "item" : "items"}
            {!empty && (
              <>
                {" · "}P {totals.protein}g · C {totals.carbs}g · F {totals.fat}g
              </>
            )}
          </p>
        </div>
        <span
          className="text-sm font-mono font-bold tabular-nums shrink-0"
          style={{ color: empty ? colors.textMuted : colors.primary }}
          data-testid={`meal-group-cal-${mealType}`}
        >
          {totals.calories}
          <span className="text-[10px] ml-1" style={{ color: colors.textMuted }}>kcal</span>
        </span>
      </button>

      {open && (
        <div
          className="px-3 pb-3 pt-1 flex flex-col gap-2"
          style={{ borderTop: `1px solid ${colors.surfaceBorder}` }}
        >
          {empty ? (
            <p
              className="text-[11px] py-2 text-center"
              style={{ color: colors.textMuted }}
              data-testid={`meal-group-empty-${mealType}`}
            >
              Nothing logged yet.
            </p>
          ) : (
            entries.map((entry) => <FoodItem key={entry.id} entry={entry} />)
          )}
          <button
            type="button"
            onClick={() => onAdd(mealType)}
            data-testid={`meal-group-add-${mealType}`}
            className="self-start mt-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-colors"
            style={{
              color: colors.primary,
              backgroundColor: `${colors.primary}10`,
              border: `1px dashed ${colors.primary}40`,
            }}
          >
            <Plus size={11} /> Add food
          </button>
        </div>
      )}
    </div>
  );
}
