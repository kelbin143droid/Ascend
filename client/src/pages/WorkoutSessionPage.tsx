import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Check, ChevronRight, Flame, Pause, Play, Trophy } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import {
  applyProgression,
  caloriesForExercise,
  caloriesPerRound,
  exerciseLabel,
  getTemplate,
  type TemplateExercise,
} from "@/lib/workoutTemplates";
import { addSession, weeksElapsed } from "@/lib/workoutStore";
import { readEnergySettings } from "@/lib/energySettingsStore";

type Phase = "prep" | "active" | "done";

export default function WorkoutSessionPage() {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [, navigate] = useLocation();
  const [, params] = useRoute<{ id: string }>("/workouts/:id");
  const templateId = params?.id ?? "";

  const template = getTemplate(templateId);
  const weightKg = readEnergySettings().weightKg;

  // ── derive progression-adjusted exercises once per template/week ──
  const exercises = useMemo(() => {
    if (!template) return [];
    return applyProgression(template, weeksElapsed(template.id));
  }, [template]);

  const perRoundCalories = useMemo(
    () => caloriesPerRound(exercises, weightKg),
    [exercises, weightKg],
  );

  const [phase, setPhase] = useState<Phase>("prep");
  const [round, setRound] = useState(1); // 1-indexed
  // checked[round-1] = boolean[exercises.length]
  const [checked, setChecked] = useState<boolean[][]>(() => []);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  // Initialize checkbox grid the moment we go active.
  useEffect(() => {
    if (phase !== "active" || !template) return;
    if (checked.length === 0) {
      setChecked(
        Array.from({ length: template.rounds }, () =>
          Array.from({ length: exercises.length }, () => false),
        ),
      );
    }
  }, [phase, template, exercises.length, checked.length]);

  if (!template) {
    return (
      <SystemLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <p className="text-sm" style={{ color: colors.textMuted }}>Workout not found.</p>
          <button
            type="button"
            onClick={() => navigate("/workouts")}
            data-testid="button-back-workouts"
            className="px-3 py-2 rounded-md text-xs font-bold"
            style={{ backgroundColor: colors.primary, color: colors.background }}
          >
            Back to Workouts
          </button>
        </div>
      </SystemLayout>
    );
  }

  const currentRoundChecks = checked[round - 1] ?? [];
  // Require the row to be fully initialized before we let the user advance —
  // otherwise the empty-array case (`[].every` is `true`) briefly enables
  // "Next round" right after the active phase mounts.
  const allCurrentDone =
    exercises.length > 0 &&
    currentRoundChecks.length === exercises.length &&
    currentRoundChecks.every(Boolean);

  // ── derive completed totals from the checkbox grid ──
  const { roundsCompleted, totalCalories } = useMemo(() => {
    let rc = 0;
    let cal = 0;
    checked.forEach((row, rIdx) => {
      // A round counts as completed only if every exercise in it is checked.
      const fullyDone = row.length > 0 && row.every(Boolean);
      if (fullyDone) rc += 1;
      // For partial credit on calories, sum each checked exercise's burn.
      row.forEach((done, eIdx) => {
        if (done && exercises[eIdx]) {
          cal += caloriesForExercise(exercises[eIdx], weightKg);
        }
      });
    });
    return { roundsCompleted: rc, totalCalories: Math.round(cal * 10) / 10 };
  }, [checked, exercises, weightKg]);

  const toggleExercise = useCallback((rIdx: number, eIdx: number) => {
    setChecked((prev) => {
      const next = prev.map((row) => row.slice());
      if (next[rIdx]) next[rIdx][eIdx] = !next[rIdx][eIdx];
      return next;
    });
  }, []);

  const advanceRound = () => {
    if (round < template.rounds) {
      setRound((r) => r + 1);
    } else {
      finishSession();
    }
  };

  const finishSession = () => {
    const session = addSession({
      templateId: template.id,
      roundsCompleted,
      totalCalories,
    });
    setSavedSessionId(session.id);
    setPhase("done");
  };

  /* ─────────────────────────── PREP ─────────────────────────── */

  if (phase === "prep") {
    return (
      <SystemLayout>
        <div className="flex flex-col gap-5 py-6 px-1 max-w-md mx-auto w-full" data-testid="workout-prep">
          <button
            type="button"
            onClick={() => navigate("/workouts")}
            data-testid="button-back"
            className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider self-start"
            style={{ color: colors.textMuted }}
          >
            <ArrowLeft size={12} /> Workouts
          </button>

          <div>
            <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: colors.textMuted }}>
              Circuit
            </p>
            <h1 className="text-xl font-bold" style={{ color: colors.text }}>{template.name}</h1>
            {template.description && (
              <p className="text-[12px] mt-1 leading-snug" style={{ color: colors.textMuted }}>
                {template.description}
              </p>
            )}
          </div>

          <div
            className="grid grid-cols-3 gap-2"
            data-testid="workout-prep-stats"
          >
            <PrepStat label="Rounds" value={template.rounds.toString()} colors={colors} />
            <PrepStat label="Per round" value={`~${Math.round(perRoundCalories)} kcal`} colors={colors} />
            <PrepStat label="Total" value={`~${Math.round(perRoundCalories * template.rounds)} kcal`} colors={colors} accent />
          </div>

          {/* Exercise preview */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
          >
            <div
              className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold"
              style={{ borderBottom: `1px solid ${colors.surfaceBorder}`, color: colors.textMuted }}
            >
              Exercises (one round)
            </div>
            <ul>
              {exercises.map((ex, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between px-4 py-2"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${colors.surfaceBorder}` }}
                >
                  <span className="text-sm" style={{ color: colors.text }}>{exerciseLabel(ex.type)}</span>
                  <span className="text-xs font-mono tabular-nums" style={{ color: colors.primary }}>
                    {ex.mode === "reps" ? `${ex.value} reps` : `${ex.value}s`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setPhase("active")}
            data-testid="button-begin-workout"
            className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest"
            style={{ backgroundColor: colors.primary, color: colors.background }}
          >
            Begin Workout
          </button>
        </div>
      </SystemLayout>
    );
  }

  /* ─────────────────────────── ACTIVE ─────────────────────────── */

  if (phase === "active") {
    return (
      <SystemLayout>
        <div className="flex flex-col gap-4 py-6 px-1 max-w-md mx-auto w-full" data-testid="workout-active">
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => navigate("/workouts")}
              data-testid="button-cancel"
              className="text-[11px] uppercase tracking-wider"
              style={{ color: colors.textMuted }}
            >
              Cancel
            </button>
            <p className="text-[11px] font-mono tabular-nums" style={{ color: colors.textMuted }}>
              Round <span style={{ color: colors.primary }}>{round}</span> / {template.rounds}
            </p>
          </div>

          {/* Progress strip */}
          <div className="flex gap-1" data-testid="round-progress">
            {Array.from({ length: template.rounds }).map((_, i) => {
              const done = checked[i]?.every(Boolean) ?? false;
              const current = i + 1 === round;
              return (
                <div
                  key={i}
                  className="flex-1 h-1.5 rounded-full"
                  style={{
                    backgroundColor: done
                      ? colors.primary
                      : current
                      ? `${colors.primary}40`
                      : `${colors.primary}10`,
                  }}
                />
              );
            })}
          </div>

          <div>
            <h1 className="text-lg font-bold" style={{ color: colors.text }}>{template.name}</h1>
            <p className="text-[11px]" style={{ color: colors.textMuted }}>
              Tap each exercise as you finish it.
            </p>
          </div>

          <ul className="flex flex-col gap-2" data-testid="round-exercises">
            {exercises.map((ex, eIdx) => (
              <ExerciseRow
                // Key by round so each round mounts a fresh row — prevents
                // a running timer from leaking from one round into the next.
                key={`${round}-${eIdx}`}
                exercise={ex}
                checked={!!currentRoundChecks[eIdx]}
                rIdx={round - 1}
                eIdx={eIdx}
                onToggle={toggleExercise}
                weightKg={weightKg}
              />
            ))}
          </ul>

          <div
            className="flex items-center justify-between text-[11px] font-mono px-1"
            style={{ color: colors.textMuted }}
          >
            <span data-testid="active-rounds-completed">{roundsCompleted} / {template.rounds} rounds done</span>
            <span className="inline-flex items-center gap-1" data-testid="active-calories">
              <Flame size={11} /> {totalCalories} kcal
            </span>
          </div>

          <button
            type="button"
            onClick={advanceRound}
            disabled={!allCurrentDone}
            data-testid="button-next-round"
            className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-opacity disabled:opacity-40"
            style={{ backgroundColor: colors.primary, color: colors.background }}
          >
            {round < template.rounds ? (
              <span className="inline-flex items-center gap-1 justify-center">
                Next Round <ChevronRight size={14} />
              </span>
            ) : (
              "Finish Workout"
            )}
          </button>

          {!allCurrentDone && (
            <button
              type="button"
              onClick={finishSession}
              data-testid="button-finish-early"
              className="text-[11px] underline self-center"
              style={{ color: colors.textMuted }}
            >
              Finish session early
            </button>
          )}
        </div>
      </SystemLayout>
    );
  }

  /* ─────────────────────────── DONE ─────────────────────────── */

  return (
    <SystemLayout>
      <div className="flex flex-col gap-5 py-10 px-1 max-w-md mx-auto w-full items-center" data-testid="workout-done">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${colors.primary}20`, border: `2px solid ${colors.primary}` }}
        >
          <Trophy size={28} style={{ color: colors.primary }} />
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: colors.textMuted }}>
            Session Complete
          </p>
          <h1 className="text-xl font-bold mt-1" style={{ color: colors.text }}>{template.name}</h1>
        </div>

        <div
          className="grid grid-cols-2 gap-3 w-full"
          data-testid="done-stats"
        >
          <PrepStat label="Rounds" value={`${roundsCompleted} / ${template.rounds}`} colors={colors} />
          <PrepStat label="Burned" value={`${totalCalories} kcal`} colors={colors} accent />
        </div>

        <p className="text-[11px] text-center max-w-xs" style={{ color: colors.textMuted }}>
          Calories have been added to today's energy ledger in Nutrition.
        </p>

        <div className="flex gap-2 w-full">
          <button
            type="button"
            onClick={() => navigate("/workouts")}
            data-testid="button-done-back"
            className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest"
            style={{
              backgroundColor: "transparent",
              color: colors.text,
              border: `1px solid ${colors.surfaceBorder}`,
            }}
          >
            Workouts
          </button>
          <button
            type="button"
            onClick={() => navigate("/nutrition")}
            data-testid="button-done-nutrition"
            className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: colors.primary, color: colors.background }}
          >
            View Energy
          </button>
        </div>

        {savedSessionId && (
          <p className="text-[9px] font-mono opacity-50" style={{ color: colors.textMuted }}>
            #{savedSessionId.slice(-6)}
          </p>
        )}
      </div>
    </SystemLayout>
  );
}

/* ───────────────────────── Sub-components ───────────────────────── */

function PrepStat({
  label,
  value,
  colors,
  accent,
}: {
  label: string;
  value: string;
  colors: any;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{
        backgroundColor: accent ? `${colors.primary}10` : colors.surface,
        border: `1px solid ${accent ? `${colors.primary}30` : colors.surfaceBorder}`,
      }}
    >
      <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: accent ? colors.primary : colors.textMuted }}>
        {label}
      </p>
      <p className="text-sm font-mono font-bold tabular-nums" style={{ color: colors.text }}>
        {value}
      </p>
    </div>
  );
}

function ExerciseRow({
  exercise,
  checked,
  rIdx,
  eIdx,
  onToggle,
  weightKg,
}: {
  exercise: TemplateExercise;
  checked: boolean;
  rIdx: number;
  eIdx: number;
  onToggle: (rIdx: number, eIdx: number) => void;
  weightKg: number;
}) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

  // For time-mode exercises, offer a tiny in-line countdown so the user
  // doesn't have to count seconds in their head.
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const isTime = exercise.mode === "time";

  // Stash the latest `onToggle` + `checked` in a ref so the tick effect
  // doesn't re-subscribe on every parent render (keeps the cadence steady).
  const onToggleRef = useRef(onToggle);
  const checkedRef = useRef(checked);
  useEffect(() => { onToggleRef.current = onToggle; }, [onToggle]);
  useEffect(() => { checkedRef.current = checked; }, [checked]);

  // If the user manually ticks the box mid-timer, cancel the countdown
  // so it can't later flip the box back off when it hits zero.
  useEffect(() => {
    if (checked && secondsLeft !== null) setSecondsLeft(null);
  }, [checked, secondsLeft]);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      setSecondsLeft(null);
      if (!checkedRef.current) onToggleRef.current(rIdx, eIdx);
      return;
    }
    const handle = setTimeout(
      () => setSecondsLeft((s) => (s === null ? null : s - 1)),
      1000,
    );
    return () => clearTimeout(handle);
  }, [secondsLeft, rIdx, eIdx]);

  const startTimer = () => {
    if (checked) return;
    setSecondsLeft(exercise.value);
  };

  const cancelTimer = () => setSecondsLeft(null);
  const handleToggle = () => onToggle(rIdx, eIdx);

  const cal = caloriesForExercise(exercise, weightKg);

  return (
    <li
      className="rounded-xl px-3 py-3 flex items-center gap-3"
      style={{
        backgroundColor: checked ? `${colors.primary}12` : colors.surface,
        border: `1px solid ${checked ? `${colors.primary}40` : colors.surfaceBorder}`,
      }}
      data-testid={`exercise-row-${exercise.type}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        data-testid={`button-toggle-${exercise.type}`}
        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors"
        style={{
          backgroundColor: checked ? colors.primary : "transparent",
          border: `1.5px solid ${checked ? colors.primary : colors.surfaceBorder}`,
          color: checked ? colors.background : "transparent",
        }}
        aria-label={checked ? "Mark incomplete" : "Mark complete"}
      >
        <Check size={14} />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-tight" style={{ color: colors.text }}>
          {exerciseLabel(exercise.type)}
        </p>
        <p className="text-[10px] font-mono mt-0.5" style={{ color: colors.textMuted }}>
          Target: {exercise.mode === "reps" ? `${exercise.value} reps` : `${exercise.value}s`}
          {" · "}~{cal.toFixed(1)} kcal
        </p>
      </div>

      {isTime && !checked && (
        secondsLeft === null ? (
          <button
            type="button"
            onClick={startTimer}
            data-testid={`button-timer-${exercise.type}`}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0"
            style={{
              color: colors.primary,
              backgroundColor: `${colors.primary}10`,
              border: `1px dashed ${colors.primary}40`,
            }}
          >
            <Play size={10} /> Timer
          </button>
        ) : (
          <button
            type="button"
            onClick={cancelTimer}
            data-testid={`timer-active-${exercise.type}`}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-mono tabular-nums shrink-0"
            style={{
              color: colors.primary,
              backgroundColor: `${colors.primary}18`,
              border: `1px solid ${colors.primary}55`,
            }}
          >
            <Pause size={10} /> {secondsLeft}s
          </button>
        )
      )}
    </li>
  );
}
