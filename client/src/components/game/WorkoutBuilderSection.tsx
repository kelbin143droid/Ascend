import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import {
  WORKOUT_PLANS, LEVEL_COLORS, CARDIO_LABELS, WARMUP_EXERCISES,
  type WorkoutLevel, type CardioIntensity, type CardioPosition, type ExerciseDef,
} from "@/lib/workoutPlans";
import {
  getWorkoutLevel, setWorkoutLevel, getCardioPrefs, setCardioPrefs,
  shouldSuggestLevelUp, getTotalCompleted, getMicroProgress,
} from "@/lib/workoutProgressStore";
import { Dumbbell, ChevronDown, ChevronUp, Flame, RotateCcw, TrendingUp, Star, Info } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVEL_ORDER: WorkoutLevel[] = ["entry", "beginner", "intermediate", "advanced"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function adjustedDetail(ex: ExerciseDef, repsBonus: number, setsBonus: number): string {
  const sets = ex.sets + setsBonus;
  if (ex.durationSeconds) {
    const dur = ex.durationSeconds + repsBonus * 2;
    return `${sets} × ${dur}s`;
  }
  if (ex.reps) {
    const parts = ex.reps.split("-").map(Number);
    const adjusted = parts.length === 2
      ? `${parts[0] + repsBonus}-${parts[1] + repsBonus}`
      : `${parts[0] + repsBonus}`;
    return `${sets} × ${adjusted} reps`;
  }
  return `${sets} sets`;
}

// ── Exercise row (read-only preview) ─────────────────────────────────────────

function ExerciseRow({ ex, color, bonusReps = 0, bonusSets = 0 }: {
  ex: ExerciseDef; color: string; bonusReps?: number; bonusSets?: number;
}) {
  const hasAnim = !ex.isPlaceholder && !!ex.videoSrc;
  const detail = adjustedDetail(ex, bonusReps, bonusSets);
  const isAdjusted = bonusReps > 0 || bonusSets > 0;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
      style={{ backgroundColor: `${color}08`, border: `1px solid ${isAdjusted ? color + "40" : color + "18"}` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
        style={{ backgroundColor: hasAnim ? `${color}20` : "#6b728018", color: hasAnim ? color : "#6b7280" }}>
        {hasAnim ? "▶" : "○"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold truncate" style={{ color: "#e2e8f0" }}>{ex.name}</div>
        <div className="text-[10px]" style={{ color: isAdjusted ? color : "#94a3b8" }}>
          {detail}{isAdjusted ? " ★" : ""}
        </div>
      </div>
      {hasAnim
        ? <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: `${color}20`, color }}>ANIM</span>
        : <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: "#6b728018", color: "#6b7280" }}>SOON</span>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function WorkoutBuilderSection({ playerId: _playerId }: { playerId: string }) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

  const [expanded, setExpanded] = useState(false);
  const [workoutLevel, setWorkoutLevelState] = useState<WorkoutLevel>(() => getWorkoutLevel());
  const [cardioIntensity, setCardioIntensity] = useState<CardioIntensity>(() => getCardioPrefs().intensity);
  const [cardioPosition, setCardioPosition] = useState<CardioPosition>(() => getCardioPrefs().position);

  const selectedPlan = WORKOUT_PLANS[workoutLevel];
  const planColor = LEVEL_COLORS[workoutLevel];
  const nextLevel = useMemo(() => {
    const idx = LEVEL_ORDER.indexOf(workoutLevel);
    return idx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[idx + 1] : null;
  }, [workoutLevel]);
  const micro = getMicroProgress(workoutLevel);
  const showLevelUpSuggestion = shouldSuggestLevelUp(workoutLevel);
  const totalCompleted = getTotalCompleted(workoutLevel);

  const handleLevelChange = useCallback((level: WorkoutLevel) => {
    setWorkoutLevelState(level);
    setWorkoutLevel(level);
  }, []);

  const levelEmoji: Record<WorkoutLevel, string> = { entry: "🌱", beginner: "💪", intermediate: "🔥", advanced: "⚡" };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* ── Collapsible header ───────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        data-testid="button-toggle-workout-builder"
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
        style={{
          backgroundColor: `${colors.surface || colors.background}cc`,
          border: `1px solid ${expanded ? planColor + "50" : colors.surfaceBorder}`,
        }}
      >
        <div className="flex items-center gap-2">
          <Dumbbell size={13} style={{ color: planColor }} />
          <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: planColor }}>
            Workout Level
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${planColor}15`, color: `${planColor}90` }}>
            {levelEmoji[workoutLevel]} {selectedPlan.label}
          </span>
        </div>
        {expanded
          ? <ChevronUp size={14} style={{ color: colors.textMuted }} />
          : <ChevronDown size={14} style={{ color: colors.textMuted }} />}
      </button>

      {/* ── Expanded settings ────────────────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div key="builder-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-3">

              {/* Info banner */}
              <div className="rounded-xl px-4 py-2.5 flex items-start gap-2.5"
                style={{ backgroundColor: `${planColor}08`, border: `1px solid ${planColor}20` }}>
                <Info size={13} style={{ color: planColor }} className="shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed" style={{ color: colors.textMuted }}>
                  Your selected level sets the exercises that appear in the <strong style={{ color: colors.text }}>Daily Flow</strong> strength session. Change it here anytime.
                </p>
              </div>

              {/* Level-up suggestion */}
              {showLevelUpSuggestion && nextLevel && (
                <div className="rounded-xl p-3 flex items-center gap-3"
                  style={{ backgroundColor: "#f59e0b12", border: "1.5px solid #f59e0b50" }}>
                  <Star size={15} style={{ color: "#f59e0b" }} className="shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-bold" style={{ color: "#f59e0b" }}>Ready to level up!</div>
                    <div className="text-[10px]" style={{ color: "#94a3b8" }}>
                      Try {WORKOUT_PLANS[nextLevel].label}?
                    </div>
                  </div>
                  <button onClick={() => handleLevelChange(nextLevel)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0"
                    style={{ backgroundColor: "#f59e0b20", color: "#f59e0b" }}>
                    Switch
                  </button>
                </div>
              )}

              {/* Micro-progress pill */}
              {(micro.repsBonus > 0 || micro.setsBonus > 0) && (
                <div className="rounded-xl px-4 py-2.5 flex items-center gap-2.5"
                  style={{ backgroundColor: `${planColor}10`, border: `1px solid ${planColor}30` }}>
                  <TrendingUp size={13} style={{ color: planColor }} />
                  <span className="text-xs" style={{ color: planColor }}>
                    Micro-progression active:
                    {micro.repsBonus > 0 && ` +${micro.repsBonus} reps`}
                    {micro.setsBonus > 0 && ` +${micro.setsBonus} set${micro.setsBonus !== 1 ? "s" : ""}`}
                  </span>
                </div>
              )}

              {/* Level selector */}
              <div className="rounded-xl p-4"
                style={{ backgroundColor: `${colors.background}cc`, border: `1px solid ${colors.surfaceBorder}` }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colors.textMuted }}>Choose Level</div>
                <div className="grid grid-cols-4 gap-2">
                  {LEVEL_ORDER.map((level) => {
                    const plan = WORKOUT_PLANS[level];
                    const isActive = workoutLevel === level;
                    const lColor = LEVEL_COLORS[level];
                    return (
                      <button key={level} onClick={() => handleLevelChange(level)}
                        data-testid={`button-level-${level}`}
                        className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold transition-all active:scale-95"
                        style={{
                          backgroundColor: isActive ? `${lColor}20` : `${colors.textMuted}08`,
                          border: `1.5px solid ${isActive ? lColor : `${colors.textMuted}20`}`,
                          color: isActive ? lColor : colors.textMuted,
                        }}>
                        <span className="text-base">{levelEmoji[level]}</span>
                        {plan.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] mt-3 leading-relaxed" style={{ color: colors.textMuted }}>
                  {selectedPlan.description}
                  {totalCompleted > 0 && (
                    <span style={{ color: planColor }}> · {totalCompleted} session{totalCompleted !== 1 ? "s" : ""} done</span>
                  )}
                </p>
              </div>

              {/* Cardio module */}
              <div className="rounded-xl p-4"
                style={{ backgroundColor: `${colors.background}cc`, border: `1px solid ${colors.surfaceBorder}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <Flame size={13} style={{ color: "#ef4444" }} />
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>Cardio Add-on</div>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {(["off", "light", "moderate", "intense"] as CardioIntensity[]).map((lvl) => {
                    const active = cardioIntensity === lvl;
                    return (
                      <button key={lvl} onClick={() => { setCardioIntensity(lvl); setCardioPrefs({ intensity: lvl }); }}
                        data-testid={`button-cardio-${lvl}`}
                        className="py-2 rounded-lg text-[10px] font-semibold transition-all active:scale-95 capitalize"
                        style={{
                          backgroundColor: active ? "#ef444420" : `${colors.textMuted}08`,
                          border: `1.5px solid ${active ? "#ef4444" : `${colors.textMuted}20`}`,
                          color: active ? "#ef4444" : colors.textMuted,
                        }}>
                        {lvl === "off" ? "Off" : lvl === "light" ? "Light" : lvl === "moderate" ? "Mod." : "Intense"}
                      </button>
                    );
                  })}
                </div>
                {cardioIntensity !== "off" && (
                  <>
                    <p className="text-[10px] mb-3" style={{ color: "#ef4444" }}>{CARDIO_LABELS[cardioIntensity]}</p>
                    <div className="flex gap-2">
                      {(["before", "after"] as CardioPosition[]).map((pos) => (
                        <button key={pos} onClick={() => { setCardioPosition(pos); setCardioPrefs({ position: pos }); }}
                          data-testid={`button-cardio-position-${pos}`}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all active:scale-95"
                          style={{
                            backgroundColor: cardioPosition === pos ? "#ef444420" : `${colors.textMuted}08`,
                            border: `1.5px solid ${cardioPosition === pos ? "#ef4444" : `${colors.textMuted}20`}`,
                            color: cardioPosition === pos ? "#ef4444" : colors.textMuted,
                          }}>
                          {pos} Workout
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Warm-up preview */}
              <div className="rounded-xl p-4"
                style={{ backgroundColor: `${colors.background}cc`, border: `1px solid ${colors.surfaceBorder}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <RotateCcw size={13} style={{ color: "#22c55e" }} />
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                    Warm-up <span style={{ color: "#22c55e" }}>(auto)</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {WARMUP_EXERCISES.map((ex) => (
                    <div key={ex.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                      style={{ backgroundColor: "#22c55e08", border: "1px solid #22c55e18" }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0"
                        style={{ backgroundColor: ex.videoSrc ? "#22c55e20" : "#6b728018", color: ex.videoSrc ? "#22c55e" : "#6b7280" }}>
                        {ex.videoSrc ? "▶" : "○"}
                      </div>
                      <span className="text-xs" style={{ color: "#e2e8f0" }}>{ex.name}</span>
                      <span className="ml-auto text-[10px]" style={{ color: "#94a3b8" }}>{ex.durationSeconds}s</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exercise list preview */}
              <div className="rounded-xl p-4"
                style={{ backgroundColor: `${colors.background}cc`, border: `1px solid ${colors.surfaceBorder}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: planColor }} />
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                    {selectedPlan.label} Exercises
                  </div>
                  {(micro.repsBonus > 0 || micro.setsBonus > 0) && (
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${planColor}20`, color: planColor }}>★ Adjusted</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {selectedPlan.exercises.map((ex) => (
                    <ExerciseRow key={ex.id} ex={ex} color={planColor} bonusReps={micro.repsBonus} bonusSets={micro.setsBonus} />
                  ))}
                </div>
                <p className="text-[10px] mt-3" style={{ color: `${colors.textMuted}70` }}>
                  These exercises will appear in your Daily Flow strength session.
                </p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
