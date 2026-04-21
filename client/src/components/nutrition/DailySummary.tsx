import { useTheme } from "@/context/ThemeContext";
import type { NutritionTotals } from "@/lib/nutritionStore";

interface DailySummaryProps {
  totals: NutritionTotals;
  calorieGoal?: number;
}

export function DailySummary({ totals, calorieGoal = 2200 }: DailySummaryProps) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const primary = colors.primary;
  const pct = Math.min(100, Math.max(0, (totals.calories / calorieGoal) * 100));

  const macros: { key: string; label: string; value: number; color: string }[] = [
    { key: "p", label: "Protein", value: totals.protein, color: "#22c55e" },
    { key: "c", label: "Carbs",   value: totals.carbs,   color: "#f59e0b" },
    { key: "f", label: "Fat",     value: totals.fat,     color: "#ef4444" },
  ];

  return (
    <div
      data-testid="nutrition-daily-summary"
      className="w-full rounded-2xl p-4"
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.surfaceBorder}`,
        boxShadow: `0 0 24px ${colors.primaryGlow}18`,
      }}
    >
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: colors.textMuted }}>
            Today
          </p>
          <p className="text-2xl font-bold leading-none" style={{ color: primary }} data-testid="text-total-calories">
            {totals.calories}
            <span className="text-xs font-mono ml-1" style={{ color: colors.textMuted }}>kcal</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: colors.textMuted }}>Goal</p>
          <p className="text-sm font-mono" style={{ color: colors.text }}>{calorieGoal}</p>
        </div>
      </div>

      <div
        className="w-full h-1.5 rounded-full overflow-hidden mb-4"
        style={{ backgroundColor: `${primary}18` }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: primary,
            boxShadow: `0 0 8px ${colors.primaryGlow}`,
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {macros.map((m) => (
          <div
            key={m.key}
            className="rounded-lg px-2.5 py-2"
            style={{
              backgroundColor: `${m.color}10`,
              border: `1px solid ${m.color}28`,
            }}
            data-testid={`macro-${m.label.toLowerCase()}`}
          >
            <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: m.color }}>
              {m.label}
            </p>
            <p className="text-base font-mono font-bold" style={{ color: colors.text }}>
              {m.value}
              <span className="text-[10px] ml-0.5" style={{ color: colors.textMuted }}>g</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
