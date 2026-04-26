import { Dumbbell, Flame, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { removeWorkout, type WorkoutEntry } from "@/lib/workoutLogStore";

interface ExerciseSectionProps {
  entries: WorkoutEntry[];
  totalCalories: number;
}

/**
 * Read-only display of completed Daily Flow workouts. All entries are
 * written by the Daily Flow engines (Physical Circuit, Cardio Circuit) —
 * Nutrition no longer logs exercises directly.
 */
export function ExerciseSection({ entries, totalCalories }: ExerciseSectionProps) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

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

      {/* Entries list */}
      <div className="px-4 py-3">
        {entries.length === 0 ? (
          <p
            className="text-[11px] text-center py-2"
            style={{ color: colors.textMuted }}
            data-testid="exercise-empty"
          >
            Complete a Daily Flow circuit to log calories burned.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((e) => (
              <li
                key={e.id}
                data-testid={`workout-entry-${e.id}`}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
                style={{
                  backgroundColor: `${colors.primary}08`,
                  border: `1px solid ${colors.surfaceBorder}`,
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight truncate" style={{ color: colors.text }}>
                    {e.name}
                  </p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: colors.textMuted }}>
                    {new Date(e.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-bold tabular-nums" style={{ color: colors.primary }}>
                    {e.calories.toFixed(1)}
                    <span className="text-[10px] ml-0.5" style={{ color: colors.textMuted }}>kcal</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeWorkout(e.id)}
                    data-testid={`button-remove-workout-${e.id}`}
                    className="p-1 rounded-md transition-colors"
                    style={{ color: colors.textMuted }}
                    aria-label="Remove workout"
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
