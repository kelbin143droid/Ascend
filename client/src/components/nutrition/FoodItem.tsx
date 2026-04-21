import { Trash2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import type { NutritionEntry } from "@/lib/nutritionStore";
import { removeEntry } from "@/lib/nutritionStore";

interface FoodItemProps {
  entry: NutritionEntry;
}

export function FoodItem({ entry }: FoodItemProps) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

  const cal = Math.round(entry.calories * entry.quantity);
  const p = +(entry.protein * entry.quantity).toFixed(1);
  const c = +(entry.carbs * entry.quantity).toFixed(1);
  const f = +(entry.fat * entry.quantity).toFixed(1);

  const qtyLabel =
    entry.quantity === 1
      ? entry.servingLabel ?? "1 serving"
      : `${entry.quantity}× ${entry.servingLabel ?? "serving"}`;

  return (
    <div
      data-testid={`food-item-${entry.id}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.surfaceBorder}`,
      }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: colors.text }}>
          {entry.name}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
          {qtyLabel} · P {p}g · C {c}g · F {f}g
        </p>
      </div>
      <span
        className="text-xs font-mono font-bold px-2 py-1 rounded-md shrink-0"
        style={{
          backgroundColor: `${colors.primary}18`,
          color: colors.primary,
        }}
      >
        {cal}
      </span>
      <button
        type="button"
        onClick={() => removeEntry(entry.id)}
        data-testid={`button-delete-${entry.id}`}
        className="p-1.5 rounded-md shrink-0 transition-colors hover:bg-white/5"
        style={{ color: colors.textMuted }}
        aria-label="Delete entry"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
