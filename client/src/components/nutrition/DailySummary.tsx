import { useTheme } from "@/context/ThemeContext";
import type { NutritionTotals } from "@/lib/nutritionStore";

interface DailySummaryProps {
  totals: NutritionTotals;
  calorieGoal?: number;
  burned?: number;
}

/**
 * Cronometer-style summary: Consumed / Remaining / Burned plus a clean macro
 * grid. Glow has been pulled back so numbers carry the visual weight.
 */
export function DailySummary({ totals, calorieGoal = 2200, burned = 0 }: DailySummaryProps) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const primary = colors.primary;

  const consumed = totals.calories;
  const remaining = Math.max(0, calorieGoal - consumed + burned);
  const overshoot = Math.max(0, consumed - burned - calorieGoal);
  const pct = Math.min(100, Math.max(0, ((consumed - burned) / Math.max(1, calorieGoal)) * 100));

  const macros: { key: string; label: string; value: number; color: string }[] = [
    { key: "p", label: "Protein", value: totals.protein, color: "#22c55e" },
    { key: "c", label: "Carbs",   value: totals.carbs,   color: "#f59e0b" },
    { key: "f", label: "Fat",     value: totals.fat,     color: "#ef4444" },
  ];

  return (
    <div
      data-testid="nutrition-daily-summary"
      className="w-full rounded-2xl p-5"
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.surfaceBorder}`,
      }}
    >
      <div className="flex items-baseline justify-between mb-1">
        <p className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: colors.textMuted }}>
          Today
        </p>
        <p className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
          Goal {calorieGoal} kcal
        </p>
      </div>

      {/* Three-column ledger: Consumed · Remaining · Burned */}
      <div className="grid grid-cols-3 gap-3 mt-2 mb-4">
        <div data-testid="summary-consumed">
          <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: colors.textMuted }}>
            Consumed
          </p>
          <p className="text-2xl font-bold leading-tight tabular-nums" style={{ color: colors.text }}>
            {consumed}
          </p>
          <p className="text-[10px] font-mono" style={{ color: colors.textMuted }}>kcal</p>
        </div>

        <div data-testid="summary-remaining" className="border-l border-r px-3" style={{ borderColor: colors.surfaceBorder }}>
          <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: colors.textMuted }}>
            {overshoot > 0 ? "Over" : "Remaining"}
          </p>
          <p
            className="text-2xl font-bold leading-tight tabular-nums"
            style={{ color: overshoot > 0 ? "#ef4444" : primary }}
          >
            {overshoot > 0 ? overshoot : remaining}
          </p>
          <p className="text-[10px] font-mono" style={{ color: colors.textMuted }}>kcal</p>
        </div>

        <div data-testid="summary-burned">
          <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: colors.textMuted }}>
            Burned
          </p>
          <p className="text-2xl font-bold leading-tight tabular-nums" style={{ color: colors.text }}>
            {burned}
          </p>
          <p className="text-[10px] font-mono" style={{ color: colors.textMuted }}>kcal</p>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-1.5 rounded-full overflow-hidden mb-4"
        style={{ backgroundColor: `${primary}14` }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: overshoot > 0 ? "#ef4444" : primary,
          }}
        />
      </div>

      {/* Macros */}
      <div className="grid grid-cols-3 gap-2">
        {macros.map((m) => (
          <div
            key={m.key}
            className="rounded-lg px-2.5 py-2"
            style={{
              backgroundColor: `${m.color}10`,
              border: `1px solid ${m.color}22`,
            }}
            data-testid={`macro-${m.label.toLowerCase()}`}
          >
            <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: m.color }}>
              {m.label}
            </p>
            <p className="text-base font-mono font-bold tabular-nums" style={{ color: colors.text }}>
              {m.value}
              <span className="text-[10px] ml-0.5" style={{ color: colors.textMuted }}>g</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
