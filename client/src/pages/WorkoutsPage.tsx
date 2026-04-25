import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ChevronRight, Dumbbell, Flame, Repeat, TrendingUp } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import {
  applyProgression,
  caloriesPerRound,
  exerciseLabel,
  SEED_TEMPLATES,
  type WorkoutTemplate,
} from "@/lib/workoutTemplates";
import {
  readSessions,
  subscribeWorkouts,
  todayIso,
  totalSessionCalories,
  weeksElapsed,
  type WorkoutSession,
} from "@/lib/workoutStore";
import { readEnergySettings } from "@/lib/energySettingsStore";

export default function WorkoutsPage() {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [, navigate] = useLocation();

  const [todaySessions, setTodaySessions] = useState<WorkoutSession[]>(() => readSessions());

  useEffect(() => {
    const refresh = () => setTodaySessions(readSessions(todayIso()));
    refresh();
    return subscribeWorkouts(refresh);
  }, []);

  const weight = readEnergySettings().weightKg;
  const todayBurned = totalSessionCalories(todaySessions);

  return (
    <SystemLayout>
      <div
        className="flex flex-col gap-5 py-6 px-1 max-w-md mx-auto w-full"
        data-testid="workouts-page"
      >
        {/* Header */}
        <div className="px-1">
          <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: colors.textMuted }}>
            System · Training
          </p>
          <div className="flex items-center justify-between gap-2 mt-1">
            <h1 className="text-xl font-bold tracking-wide flex items-center gap-2" style={{ color: colors.text }}>
              <Dumbbell size={18} style={{ color: colors.primary }} />
              Workouts
            </h1>
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono tabular-nums"
              style={{
                backgroundColor: `${colors.primary}10`,
                color: colors.primary,
                border: `1px solid ${colors.primary}25`,
              }}
              data-testid="workouts-today-burned"
            >
              <Flame size={11} />
              {todayBurned} kcal today
            </div>
          </div>
          <p className="text-[11px] mt-1" style={{ color: colors.textMuted }}>
            Structured circuits. Targets scale every week.
          </p>
        </div>

        {/* Templates list */}
        <div className="flex flex-col gap-3">
          {SEED_TEMPLATES.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              weightKg={weight}
              onStart={() => navigate(`/workouts/${t.id}`)}
            />
          ))}
        </div>
      </div>
    </SystemLayout>
  );
}

function TemplateCard({
  template,
  weightKg,
  onStart,
}: {
  template: WorkoutTemplate;
  weightKg: number;
  onStart: () => void;
}) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

  // Live preview: progression-adjusted exercises and total session burn.
  const preview = useMemo(() => {
    const w = weeksElapsed(template.id);
    const adjusted = applyProgression(template, w);
    const burn = caloriesPerRound(adjusted, weightKg) * template.rounds;
    return { weeks: w, adjusted, burn };
  }, [template, weightKg]);

  return (
    <div
      data-testid={`template-card-${template.id}`}
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.surfaceBorder}`,
      }}
    >
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: colors.text }}>{template.name}</p>
          {template.description && (
            <p className="text-[11px] mt-0.5 leading-snug" style={{ color: colors.textMuted }}>
              {template.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-[10px] font-mono" style={{ color: colors.textMuted }}>
            <span className="inline-flex items-center gap-1"><Repeat size={10} /> {template.rounds} rounds</span>
            <span className="inline-flex items-center gap-1"><Flame size={10} /> ~{Math.round(preview.burn)} kcal</span>
            {preview.weeks > 0 && (
              <span className="inline-flex items-center gap-1" style={{ color: colors.primary }}>
                <TrendingUp size={10} /> wk {preview.weeks + 1}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onStart}
          data-testid={`button-start-${template.id}`}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
          style={{ backgroundColor: colors.primary, color: colors.background }}
        >
          Start <ChevronRight size={12} />
        </button>
      </div>

      <ul
        className="px-4 py-2 flex flex-col gap-1"
        style={{ borderTop: `1px solid ${colors.surfaceBorder}`, backgroundColor: `${colors.background}40` }}
      >
        {preview.adjusted.map((ex, i) => (
          <li key={i} className="flex items-center justify-between text-[11px]">
            <span style={{ color: colors.text }}>{exerciseLabel(ex.type)}</span>
            <span className="font-mono tabular-nums" style={{ color: colors.textMuted }}>
              {ex.mode === "reps" ? `${ex.value} reps` : `${ex.value}s`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
