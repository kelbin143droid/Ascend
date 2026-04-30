import { useState, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { GuidedActivityEngine } from "./GuidedActivityEngine";
import {
  WORKOUT_PLANS, LEVEL_COLORS, CARDIO_LABELS, WARMUP_EXERCISES,
  buildWorkoutActivity, getNextLevel, parseMaxReps,
  type WorkoutLevel, type CardioIntensity, type CardioPosition, type ExerciseDef,
} from "@/lib/workoutPlans";
import {
  getWorkoutLevel, setWorkoutLevel, getCardioPrefs, setCardioPrefs,
  recordTrackedSession, shouldSuggestLevelUp, getTotalCompleted,
  getMicroProgress, applyAndSaveMicroProgression, getRecentSessions,
} from "@/lib/workoutProgressStore";
import {
  getProgressionRecommendation, calculatePerformanceScore,
  ZONE_COLORS, ZONE_ICONS, DIFFICULTY_LABELS,
  type DifficultyRating, type ProgressionRecommendation,
} from "@/lib/workoutProgressionEngine";
import { Dumbbell, ChevronDown, ChevronUp, Flame, RotateCcw, TrendingUp, Star, ChevronRight } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVEL_ORDER: WorkoutLevel[] = ["entry", "beginner", "intermediate", "advanced"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeTargetReps(exercises: ExerciseDef[]): number {
  return exercises.reduce((sum, ex) => {
    if (ex.reps) return sum + parseMaxReps(ex.reps) * ex.sets;
    if (ex.durationSeconds) return sum + ex.durationSeconds * ex.sets;
    return sum;
  }, 0);
}

function computeTotalSets(exercises: ExerciseDef[]): number {
  return exercises.reduce((sum, ex) => sum + ex.sets, 0);
}

function adjustExercise(ex: ExerciseDef, repsBonus: number, setsBonus: number): ExerciseDef {
  const adj = { ...ex };
  if (adj.reps && repsBonus > 0) {
    const parts = adj.reps.split("-").map(Number);
    adj.reps = parts.length === 2
      ? `${parts[0] + repsBonus}-${parts[1] + repsBonus}`
      : `${parts[0] + repsBonus}`;
  }
  if (adj.durationSeconds && repsBonus > 0) adj.durationSeconds = adj.durationSeconds + repsBonus * 2;
  if (setsBonus > 0) adj.sets = adj.sets + setsBonus;
  return adj;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ExerciseRow({ ex, color, bonusReps = 0, bonusSets = 0 }: {
  ex: ExerciseDef; color: string; bonusReps?: number; bonusSets?: number;
}) {
  const adjusted = adjustExercise(ex, bonusReps, bonusSets);
  const hasAnim = !ex.isPlaceholder && !!ex.videoSrc;
  const detail = adjusted.durationSeconds
    ? `${adjusted.sets} × ${adjusted.durationSeconds}s hold`
    : `${adjusted.sets} × ${adjusted.reps ?? "?"} reps`;
  const isAdjusted = bonusReps > 0 || bonusSets > 0;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
      style={{ backgroundColor: `${color}08`, border: `1px solid ${isAdjusted ? color + "40" : color + "18"}` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
        style={{ backgroundColor: hasAnim ? `${color}20` : "#6b728018", color: hasAnim ? color : "#6b7280" }}>
        {hasAnim ? "▶" : "○"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold truncate" style={{ color: "#e2e8f0" }}>{adjusted.name}</div>
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

function WorkoutFeedbackModal({ onSubmit, planColor }: { onSubmit: (d: DifficultyRating) => void; planColor: string }) {
  const [selected, setSelected] = useState<DifficultyRating | null>(null);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
        className="w-full max-w-md rounded-t-3xl p-6 pb-10"
        style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>
        <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ backgroundColor: "#334155" }} />
        <div className="text-center mb-6">
          <div className="text-2xl mb-2">🏁</div>
          <div className="text-base font-bold text-white mb-1">Workout Complete!</div>
          <div className="text-sm" style={{ color: "#94a3b8" }}>How did that feel?</div>
        </div>
        <div className="flex flex-col gap-3 mb-6">
          {(["easy", "same", "hard"] as DifficultyRating[]).map((d) => (
            <button key={d} onClick={() => setSelected(d)}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              style={{
                backgroundColor: selected === d ? `${planColor}25` : "#1e293b",
                border: `2px solid ${selected === d ? planColor : "#334155"}`,
                color: selected === d ? planColor : "#cbd5e1",
              }}>
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
        <button onClick={() => selected && onSubmit(selected)} disabled={!selected}
          className="w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
          style={{ backgroundColor: selected ? planColor : "#334155", color: "#fff", opacity: selected ? 1 : 0.5 }}>
          See My Score
        </button>
      </motion.div>
    </motion.div>
  );
}

function RecommendationCard({ recommendation, onClose, onLevelUp, onLevelDown, nextLevel, prevLevel, planColor }: {
  recommendation: ProgressionRecommendation; onClose: () => void;
  onLevelUp: () => void; onLevelDown: () => void;
  nextLevel: WorkoutLevel | null; prevLevel: WorkoutLevel | null; planColor: string;
}) {
  const zoneColor = ZONE_COLORS[recommendation.zone];
  const zoneIcon = ZONE_ICONS[recommendation.zone];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.80)", backdropFilter: "blur(6px)" }}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        className="w-full max-w-md rounded-t-3xl pb-10"
        style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>
        <div className="p-6 pb-4">
          <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: "#334155" }} />
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#64748b" }}>Performance Score</div>
              <div className="text-4xl font-bold font-orbitron" style={{ color: zoneColor }}>{recommendation.scoreLabel}</div>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${zoneColor}15`, border: `1.5px solid ${zoneColor}40` }}>
              {zoneIcon}
            </div>
          </div>
          {recommendation.averageScore > 0 && (
            <div className="rounded-xl px-3 py-2 text-xs mb-4"
              style={{ backgroundColor: `${zoneColor}10`, color: zoneColor, border: `1px solid ${zoneColor}25` }}>
              3-session average: <strong>{recommendation.averageScore}</strong> / 100
            </div>
          )}
          <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #1e293b" }}>
            {recommendation.scoreBreakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5"
                style={{ backgroundColor: i % 2 === 0 ? "#0f172a" : "#111827", borderBottom: i < recommendation.scoreBreakdown.length - 1 ? "1px solid #1e293b" : "none" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                    style={{ backgroundColor: item.earned ? `${zoneColor}20` : "#1e293b", color: item.earned ? zoneColor : "#475569" }}>
                    {item.earned ? "✓" : "–"}
                  </div>
                  <span className="text-xs" style={{ color: item.earned ? "#cbd5e1" : "#475569" }}>{item.label}</span>
                </div>
                <span className="text-xs font-bold"
                  style={{ color: item.earned && item.points > 0 ? zoneColor : item.points < 0 ? "#f59e0b" : "#475569" }}>
                  {item.points > 0 ? `+${item.points}` : item.points}
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: `${zoneColor}12`, border: `1.5px solid ${zoneColor}35` }}>
            <div className="text-sm font-bold mb-1.5" style={{ color: zoneColor }}>{recommendation.headline}</div>
            <div className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{recommendation.message}</div>
          </div>
          {recommendation.action === "level_up" && nextLevel && (
            <button onClick={onLevelUp}
              className="w-full py-3 rounded-xl text-sm font-bold mb-3 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              style={{ backgroundColor: `${zoneColor}20`, color: zoneColor, border: `1.5px solid ${zoneColor}50` }}>
              Switch to {WORKOUT_PLANS[nextLevel].label} level <ChevronRight size={15} />
            </button>
          )}
          {recommendation.action === "level_down" && prevLevel && (
            <button onClick={onLevelDown}
              className="w-full py-3 rounded-xl text-sm font-bold mb-3 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              style={{ backgroundColor: "#f59e0b15", color: "#f59e0b", border: "1.5px solid #f59e0b40" }}>
              Switch to {WORKOUT_PLANS[prevLevel].label} level <ChevronRight size={15} />
            </button>
          )}
          <button onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ backgroundColor: "#1e293b", color: "#94a3b8" }}>
            Got it
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function WorkoutBuilderSection({ playerId }: { playerId: string }) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const queryClient = useQueryClient();

  const [expanded, setExpanded] = useState(false);
  const [workoutLevel, setWorkoutLevelState] = useState<WorkoutLevel>(() => getWorkoutLevel());
  const [cardioIntensity, setCardioIntensity] = useState<CardioIntensity>(() => getCardioPrefs().intensity);
  const [cardioPosition, setCardioPosition] = useState<CardioPosition>(() => getCardioPrefs().position);
  const [builderActivity, setBuilderActivity] = useState<ReturnType<typeof buildWorkoutActivity> | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [recommendation, setRecommendation] = useState<ProgressionRecommendation | null>(null);

  const pendingWorkoutRef = useRef<{ totalSets: number; targetReps: number; level: WorkoutLevel } | null>(null);

  const selectedPlan = WORKOUT_PLANS[workoutLevel];
  const planColor = LEVEL_COLORS[workoutLevel];
  const nextLevel = getNextLevel(workoutLevel);
  const prevLevel = useMemo(() => {
    const idx = LEVEL_ORDER.indexOf(workoutLevel);
    return idx > 0 ? LEVEL_ORDER[idx - 1] : null;
  }, [workoutLevel]);
  const micro = getMicroProgress(workoutLevel);
  const showLevelUpSuggestion = shouldSuggestLevelUp(workoutLevel);
  const totalCompleted = getTotalCompleted(workoutLevel);

  const adjustedExercises = useMemo(
    () => selectedPlan.exercises.map((ex) => adjustExercise(ex, micro.repsBonus, micro.setsBonus)),
    [selectedPlan, micro.repsBonus, micro.setsBonus],
  );

  const handleLevelChange = useCallback((level: WorkoutLevel) => {
    setWorkoutLevelState(level);
    setWorkoutLevel(level);
  }, []);

  const handleStartWorkout = () => {
    const adjustedPlan = { ...selectedPlan, exercises: adjustedExercises };
    const totalSets = computeTotalSets(adjustedPlan.exercises);
    const targetReps = computeTargetReps(adjustedPlan.exercises);
    pendingWorkoutRef.current = { totalSets, targetReps, level: workoutLevel };
    setBuilderActivity(buildWorkoutActivity(workoutLevel, { intensity: cardioIntensity, position: cardioPosition }));
  };

  const handleBuilderComplete = () => {
    setBuilderActivity(null);
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = (difficulty: DifficultyRating) => {
    setShowFeedbackModal(false);
    const pending = pendingWorkoutRef.current;
    if (!pending) return;
    const { totalSets, targetReps, level } = pending;
    const session = recordTrackedSession(level, true, totalSets, totalSets, targetReps, targetReps, difficulty);
    const { total } = calculatePerformanceScore(true, totalSets, totalSets, targetReps, targetReps, difficulty);
    const recentSessions = getRecentSessions(level, 5);
    const currentMicro = getMicroProgress(level);
    const rec = getProgressionRecommendation(recentSessions, currentMicro, level, total, difficulty);
    if (["increase_reps", "decrease_reps", "increase_sets", "decrease_sets"].includes(rec.action)) {
      applyAndSaveMicroProgression(level, rec.action as any);
    }
    setRecommendation(rec);
    queryClient.invalidateQueries({ queryKey: ["/api/player"] });
    pendingWorkoutRef.current = null;
  };

  const levelEmoji: Record<WorkoutLevel, string> = { entry: "🌱", beginner: "💪", intermediate: "🔥", advanced: "⚡" };

  return (
    <>
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
              Strength Training
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

        {/* ── Expanded builder ─────────────────────────────────────────── */}
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
                      Micro-progression:
                      {micro.repsBonus > 0 && ` +${micro.repsBonus} reps`}
                      {micro.setsBonus > 0 && ` +${micro.setsBonus} set${micro.setsBonus !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                )}

                {/* Level selector */}
                <div className="rounded-xl p-4"
                  style={{ backgroundColor: `${colors.background}cc`, border: `1px solid ${colors.surfaceBorder}` }}>
                  <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colors.textMuted }}>Workout Level</div>
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
                    <div className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>Cardio Module</div>
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

                {/* Exercise list */}
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
                </div>

                {/* Start button */}
                <button onClick={handleStartWorkout} data-testid="button-start-workout"
                  className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                  style={{ background: `linear-gradient(135deg, ${planColor}, ${planColor}cc)`, color: "#fff", boxShadow: `0 4px 20px ${planColor}40` }}>
                  <Dumbbell size={18} />
                  Start {selectedPlan.label} Workout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Portals ──────────────────────────────────────────────────────────── */}
      {builderActivity && createPortal(
        <GuidedActivityEngine
          activity={builderActivity}
          onComplete={handleBuilderComplete}
          onExit={() => setBuilderActivity(null)}
        />,
        document.body
      )}
      {createPortal(
        <AnimatePresence>
          {showFeedbackModal && (
            <WorkoutFeedbackModal onSubmit={handleFeedbackSubmit} planColor={planColor} />
          )}
          {recommendation && (
            <RecommendationCard
              recommendation={recommendation}
              onClose={() => setRecommendation(null)}
              onLevelUp={() => { if (nextLevel) handleLevelChange(nextLevel); setRecommendation(null); }}
              onLevelDown={() => { if (prevLevel) handleLevelChange(prevLevel); setRecommendation(null); }}
              nextLevel={nextLevel}
              prevLevel={prevLevel}
              planColor={planColor}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
