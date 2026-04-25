import { useState } from "react";
import { Dumbbell, Flame, Plus, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import {
  addExercise,
  caloriesForExercise,
  EXERCISE_LABEL,
  EXERCISE_TYPES,
  removeExercise,
  type ExerciseEntry,
  type ExerciseType,
} from "@/lib/exerciseStore";

interface ExerciseSectionProps {
  entries: ExerciseEntry[];
  totalCalories: number;
}

/**
 * Quick-log exercises (push-ups / sit-ups / squats) and view today's
 * list. Calorie totals here flow directly into the daily energy ledger
 * via `exerciseStore` → `energyEngine`.
 */
export function ExerciseSection({ entries, totalCalories }: ExerciseSectionProps) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

  const [type, setType] = useState<ExerciseType>("pushups");
  const [reps, setReps] = useState<string>("");

  const numericReps = Math.max(0, Math.floor(parseInt(reps, 10) || 0));
  const previewCalories = numericReps > 0 ? caloriesForExercise(type, numericReps) : 0;

  const handleAdd = () => {
    if (numericReps <= 0) return;
    addExercise(type, numericReps);
    setReps("");
  };

  return (
    <div
      data-testid="exercise-section"
      className="w-full rounded-2xl overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.surfaceBorder}`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${colors.surfaceBorder}` }}
      >
        <div className="flex items-center gap-2">
          <Dumbbell size={14} style={{ color: colors.primary }} />
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold" style={{ color: colors.text }}>
            Exercise
          </p>
        </div>
        <div className="flex items-center gap-1" style={{ color: colors.primary }}>
          <Flame size={12} />
          <span className="text-sm font-mono font-bold tabular-nums" data-testid="exercise-total-calories">
            {totalCalories}
            <span className="text-[10px] ml-1" style={{ color: colors.textMuted }}>kcal burned</span>
          </span>
        </div>
      </div>

      {/* Quick-log form */}
      <div className="px-4 py-3 flex flex-col gap-2" style={{ backgroundColor: `${colors.background}40` }}>
        <div className="flex rounded-lg p-1 gap-1" style={{ border: `1px solid ${colors.surfaceBorder}` }}>
          {EXERCISE_TYPES.map((t) => {
            const active = t === type;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                data-testid={`chip-exercise-${t}`}
                className="flex-1 py-1.5 rounded-md text-[11px] font-bold transition-colors"
                style={{
                  backgroundColor: active ? `${colors.primary}25` : "transparent",
                  color: active ? colors.primary : colors.textMuted,
                  border: `1px solid ${active ? `${colors.primary}55` : "transparent"}`,
                }}
              >
                {EXERCISE_LABEL[t]}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={1000}
            placeholder="Reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            data-testid="input-exercise-reps"
            className="flex-1 rounded-md px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: "transparent",
              border: `1px solid ${colors.surfaceBorder}`,
              color: colors.text,
            }}
          />
          <span
            className="text-[11px] font-mono w-20 text-right tabular-nums"
            style={{ color: colors.textMuted }}
            data-testid="exercise-preview-calories"
          >
            {previewCalories.toFixed(1)} kcal
          </span>
          <button
            type="button"
            onClick={handleAdd}
            disabled={numericReps <= 0}
            data-testid="button-add-exercise"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-opacity disabled:opacity-40"
            style={{
              backgroundColor: colors.primary,
              color: colors.background,
            }}
          >
            <Plus size={12} /> Log
          </button>
        </div>
      </div>

      {/* Entries list */}
      <div className="px-4 py-3">
        {entries.length === 0 ? (
          <p
            className="text-[11px] text-center py-2"
            style={{ color: colors.textMuted }}
            data-testid="exercise-empty"
          >
            No exercise logged yet. Drop in a quick set above.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((e) => (
              <li
                key={e.id}
                data-testid={`exercise-entry-${e.id}`}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
                style={{
                  backgroundColor: `${colors.primary}08`,
                  border: `1px solid ${colors.surfaceBorder}`,
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight" style={{ color: colors.text }}>
                    {EXERCISE_LABEL[e.type]}
                  </p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: colors.textMuted }}>
                    {e.reps} {e.reps === 1 ? "rep" : "reps"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-bold tabular-nums" style={{ color: colors.primary }}>
                    {e.calories.toFixed(1)}
                    <span className="text-[10px] ml-0.5" style={{ color: colors.textMuted }}>kcal</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExercise(e.id)}
                    data-testid={`button-remove-exercise-${e.id}`}
                    className="p-1 rounded-md transition-colors"
                    style={{ color: colors.textMuted }}
                    aria-label="Remove exercise"
                  >
                    <X size={12} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
