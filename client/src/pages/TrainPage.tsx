import { useState, useMemo, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageStageContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { GuidedActivityEngine } from "@/components/game/GuidedActivityEngine";
import { DailyFlowEngine } from "@/components/game/DailyFlowEngine";
import { buildPhase1Activities, type ActivityDefinition, type CategoryTiers } from "@/lib/activityEngine";
import {
  WORKOUT_PLANS,
  LEVEL_COLORS,
  CARDIO_LABELS,
  WARMUP_EXERCISES,
  buildWorkoutActivity,
  getNextLevel,
  parseMaxReps,
  type WorkoutLevel,
  type CardioIntensity,
  type CardioPosition,
  type ExerciseDef,
} from "@/lib/workoutPlans";
import {
  getWorkoutLevel,
  setWorkoutLevel,
  getCardioPrefs,
  setCardioPrefs,
  recordTrackedSession,
  shouldSuggestLevelUp,
  getTotalCompleted,
  getMicroProgress,
  applyAndSaveMicroProgression,
  getRecentSessions,
} from "@/lib/workoutProgressStore";
import {
  getProgressionRecommendation,
  calculatePerformanceScore,
  ZONE_COLORS,
  ZONE_ICONS,
  DIFFICULTY_LABELS,
  type DifficultyRating,
  type ProgressionRecommendation,
} from "@/lib/workoutProgressionEngine";
import {
  Dumbbell, Wind, Brain, Heart, Play, CheckCircle2, TrendingUp, Shield,
  Zap, ListChecks, PlayCircle, Flame, RotateCcw, Star, X, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { loadFlow, loadSession, clearFlow, clearSession } from "@/lib/sessionPersistenceStore";

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, typeof Dumbbell> = {
  strength: Dumbbell, agility: Wind, meditation: Brain, vitality: Heart,
};

const TIER_LABELS: Record<number, string> = {
  1: "Beginner", 2: "Building", 3: "Steady", 4: "Strong", 5: "Peak",
};

const LEVEL_ORDER: WorkoutLevel[] = ["entry", "beginner", "intermediate", "advanced"];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Compute aggregate reps target from a plan's exercises. */
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

/** Apply micro-progression bonus to an ExerciseDef for display + build. */
function adjustExercise(ex: ExerciseDef, repsBonus: number, setsBonus: number): ExerciseDef {
  const adj = { ...ex };
  if (adj.reps && repsBonus > 0) {
    const parts = adj.reps.split("-").map(Number);
    adj.reps = parts.length === 2
      ? `${parts[0] + repsBonus}-${parts[1] + repsBonus}`
      : `${parts[0] + repsBonus}`;
  }
  if (adj.durationSeconds && repsBonus > 0) {
    adj.durationSeconds = adj.durationSeconds + repsBonus * 2;
  }
  if (setsBonus > 0) adj.sets = adj.sets + setsBonus;
  return adj;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ExerciseRow({ ex, color, bonusReps, bonusSets }: {
  ex: ExerciseDef; color: string; bonusReps?: number; bonusSets?: number;
}) {
  const adjusted = adjustExercise(ex, bonusReps ?? 0, bonusSets ?? 0);
  const hasAnim = !ex.isPlaceholder && !!ex.videoSrc;
  const detail = adjusted.durationSeconds
    ? `${adjusted.sets} × ${adjusted.durationSeconds}s hold`
    : `${adjusted.sets} × ${adjusted.reps ?? "?"} reps`;
  const isAdjusted = (bonusReps ?? 0) > 0 || (bonusSets ?? 0) > 0;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
      style={{ backgroundColor: `${color}08`, border: `1px solid ${isAdjusted ? color + "40" : color + "18"}` }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
        style={{ backgroundColor: hasAnim ? `${color}20` : "#6b728018", color: hasAnim ? color : "#6b7280" }}
      >
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

// ── Post-workout feedback modal ───────────────────────────────────────────────

function WorkoutFeedbackModal({
  onSubmit,
  planColor,
}: {
  onSubmit: (d: DifficultyRating) => void;
  planColor: string;
}) {
  const [selected, setSelected] = useState<DifficultyRating | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
        className="w-full max-w-md rounded-t-3xl p-6 pb-10"
        style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ backgroundColor: "#334155" }} />
        <div className="text-center mb-6">
          <div className="text-2xl mb-2">🏁</div>
          <div className="text-base font-bold text-white mb-1">Workout Complete!</div>
          <div className="text-sm" style={{ color: "#94a3b8" }}>How did that feel?</div>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          {(["easy", "same", "hard"] as DifficultyRating[]).map((d) => (
            <button
              key={d}
              onClick={() => setSelected(d)}
              data-testid={`button-difficulty-${d}`}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              style={{
                backgroundColor: selected === d ? `${planColor}25` : "#1e293b",
                border: `2px solid ${selected === d ? planColor : "#334155"}`,
                color: selected === d ? planColor : "#cbd5e1",
              }}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>

        <button
          onClick={() => selected && onSubmit(selected)}
          disabled={!selected}
          data-testid="button-submit-difficulty"
          className="w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
          style={{
            backgroundColor: selected ? planColor : "#334155",
            color: "#fff",
            opacity: selected ? 1 : 0.5,
          }}
        >
          See My Score
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Score breakdown + recommendation card ─────────────────────────────────────

function RecommendationCard({
  recommendation,
  onClose,
  onLevelUp,
  onLevelDown,
  nextLevel,
  prevLevel,
  planColor,
}: {
  recommendation: ProgressionRecommendation;
  onClose: () => void;
  onLevelUp: () => void;
  onLevelDown: () => void;
  nextLevel: WorkoutLevel | null;
  prevLevel: WorkoutLevel | null;
  planColor: string;
}) {
  const zoneColor = ZONE_COLORS[recommendation.zone];
  const zoneIcon = ZONE_ICONS[recommendation.zone];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.80)", backdropFilter: "blur(6px)" }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        className="w-full max-w-md rounded-t-3xl pb-10"
        style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: "#334155" }} />
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#64748b" }}>
                Performance Score
              </div>
              <div className="text-4xl font-bold font-orbitron" style={{ color: zoneColor }}>
                {recommendation.scoreLabel}
              </div>
            </div>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${zoneColor}15`, border: `1.5px solid ${zoneColor}40` }}
            >
              {zoneIcon}
            </div>
          </div>

          {/* Rolling average */}
          {recommendation.averageScore > 0 && (
            <div
              className="rounded-xl px-3 py-2 text-xs mb-4"
              style={{ backgroundColor: `${zoneColor}10`, color: zoneColor, border: `1px solid ${zoneColor}25` }}
            >
              3-session average: <strong>{recommendation.averageScore}</strong> / 100
            </div>
          )}

          {/* Score breakdown */}
          <div
            className="rounded-xl overflow-hidden mb-4"
            style={{ border: "1px solid #1e293b" }}
          >
            {recommendation.scoreBreakdown.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2.5"
                style={{
                  backgroundColor: i % 2 === 0 ? "#0f172a" : "#111827",
                  borderBottom: i < recommendation.scoreBreakdown.length - 1 ? "1px solid #1e293b" : "none",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                    style={{
                      backgroundColor: item.earned ? `${zoneColor}20` : "#1e293b",
                      color: item.earned ? zoneColor : "#475569",
                    }}
                  >
                    {item.earned ? "✓" : "–"}
                  </div>
                  <span className="text-xs" style={{ color: item.earned ? "#cbd5e1" : "#475569" }}>
                    {item.label}
                  </span>
                </div>
                <span
                  className="text-xs font-bold"
                  style={{ color: item.earned && item.points > 0 ? zoneColor : item.points < 0 ? "#f59e0b" : "#475569" }}
                >
                  {item.points > 0 ? `+${item.points}` : item.points}
                </span>
              </div>
            ))}
          </div>

          {/* Recommendation */}
          <div
            className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: `${zoneColor}12`, border: `1.5px solid ${zoneColor}35` }}
          >
            <div className="text-sm font-bold mb-1.5" style={{ color: zoneColor }}>
              {recommendation.headline}
            </div>
            <div className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
              {recommendation.message}
            </div>
          </div>

          {/* Action buttons for level change */}
          {recommendation.action === "level_up" && nextLevel && (
            <button
              onClick={onLevelUp}
              data-testid="button-confirm-level-up"
              className="w-full py-3 rounded-xl text-sm font-bold mb-3 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              style={{ backgroundColor: `${zoneColor}20`, color: zoneColor, border: `1.5px solid ${zoneColor}50` }}
            >
              Switch to {WORKOUT_PLANS[nextLevel].label} level
              <ChevronRight size={15} />
            </button>
          )}
          {recommendation.action === "level_down" && prevLevel && (
            <button
              onClick={onLevelDown}
              data-testid="button-confirm-level-down"
              className="w-full py-3 rounded-xl text-sm font-bold mb-3 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              style={{ backgroundColor: "#f59e0b15", color: "#f59e0b", border: "1.5px solid #f59e0b40" }}
            >
              Switch to {WORKOUT_PLANS[prevLevel].label} level
              <ChevronRight size={15} />
            </button>
          )}

          <button
            onClick={onClose}
            data-testid="button-close-recommendation"
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ backgroundColor: "#1e293b", color: "#94a3b8" }}
          >
            Got it
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TrainPage() {
  const { player } = useGame();
  const { backgroundTheme } = useTheme();
  const { t } = useLanguage();
  const colors = backgroundTheme.colors;
  const queryClient = useQueryClient();

  // ── Tab
  const [activeTab, setActiveTab] = useState<"daily" | "builder">("daily");

  // ── Daily Flow
  const [activeActivity, setActiveActivity] = useState<ActivityDefinition | null>(null);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [flowActive, setFlowActive] = useState(false);

  // ── Builder selections
  const [workoutLevel, setWorkoutLevelState] = useState<WorkoutLevel>(() => getWorkoutLevel());
  const [cardioIntensity, setCardioIntensity] = useState<CardioIntensity>(() => getCardioPrefs().intensity);
  const [cardioPosition, setCardioPosition] = useState<CardioPosition>(() => getCardioPrefs().position);
  const [builderActivity, setBuilderActivity] = useState<ActivityDefinition | null>(null);

  // ── Post-workout flow
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [recommendation, setRecommendation] = useState<ProgressionRecommendation | null>(null);
  // Store workout metrics when it completes, before feedback is collected
  const pendingWorkoutRef = useRef<{ totalSets: number; targetReps: number; level: WorkoutLevel } | null>(null);

  // ── Derived plan data
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

  // Adjusted exercises for the current level (micro-progression applied)
  const adjustedExercises = useMemo(
    () => selectedPlan.exercises.map((ex) => adjustExercise(ex, micro.repsBonus, micro.setsBonus)),
    [selectedPlan, micro.repsBonus, micro.setsBonus],
  );

  // ── Level / cardio handlers
  const handleLevelChange = useCallback((level: WorkoutLevel) => {
    setWorkoutLevelState(level);
    setWorkoutLevel(level);
  }, []);

  const handleCardioIntensity = (intensity: CardioIntensity) => {
    setCardioIntensity(intensity);
    setCardioPrefs({ intensity });
  };

  const handleCardioPosition = (position: CardioPosition) => {
    setCardioPosition(position);
    setCardioPrefs({ position });
  };

  // ── Start workout — build ActivityDefinition from adjusted exercises
  const handleStartWorkout = () => {
    // Use adjusted exercises so micro-progression is reflected in the actual workout
    const adjustedPlan = { ...selectedPlan, exercises: adjustedExercises };
    const totalSets = computeTotalSets(adjustedPlan.exercises);
    const targetReps = computeTargetReps(adjustedPlan.exercises);
    pendingWorkoutRef.current = { totalSets, targetReps, level: workoutLevel };

    const activity = buildWorkoutActivity(workoutLevel, {
      intensity: cardioIntensity,
      position: cardioPosition,
    });
    setBuilderActivity(activity);
  };

  // ── Called by GuidedActivityEngine when all steps complete
  const handleBuilderComplete = () => {
    setBuilderActivity(null);
    setShowFeedbackModal(true); // intercept — ask for difficulty before recording
  };

  // ── Called when the user submits their difficulty rating
  const handleFeedbackSubmit = (difficulty: DifficultyRating) => {
    setShowFeedbackModal(false);

    const pending = pendingWorkoutRef.current;
    if (!pending) return;

    const { totalSets, targetReps, level } = pending;

    // Record the full session
    const session = recordTrackedSession(
      level,
      true,           // workoutCompleted
      totalSets,      // setsCompleted (full completion assumed)
      totalSets,      // totalSets
      targetReps,     // repsCompleted
      targetReps,     // targetReps
      difficulty,
    );

    // Score for UI display
    const { total } = calculatePerformanceScore(
      true, totalSets, totalSets, targetReps, targetReps, difficulty,
    );

    // Get updated sessions (including the one just saved)
    const recentSessions = getRecentSessions(level, 5);
    const currentMicro = getMicroProgress(level);

    const rec = getProgressionRecommendation(
      recentSessions,
      currentMicro,
      level,
      total,
      difficulty,
    );

    // Apply micro-progression (reps/sets adjustments) immediately
    if (
      rec.action === "increase_reps" ||
      rec.action === "decrease_reps" ||
      rec.action === "increase_sets" ||
      rec.action === "decrease_sets"
    ) {
      applyAndSaveMicroProgression(level, rec.action);
    }

    setRecommendation(rec);
    queryClient.invalidateQueries({ queryKey: ["/api/player"] });
    pendingWorkoutRef.current = null;
  };

  // ── Close the recommendation card
  const handleCloseRecommendation = () => setRecommendation(null);

  const handleConfirmLevelUp = () => {
    if (nextLevel) handleLevelChange(nextLevel);
    setRecommendation(null);
  };

  const handleConfirmLevelDown = () => {
    if (prevLevel) handleLevelChange(prevLevel);
    setRecommendation(null);
  };

  // ── Queries
  const { data: homeData } = useQuery<{ onboardingDay: number; isOnboardingComplete: boolean }>({
    queryKey: ["home", player?.id],
    queryFn: async () => {
      if (!player?.id) throw new Error("No player");
      const res = await fetch(`/api/player/${player.id}/home`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!player?.id,
    staleTime: 30000,
  });

  const { data: scalingData } = useQuery<{
    trainingScaling: Record<string, { tier: number; completionStreak: number; missedDays: number; sessionsCompleted: number }>;
  }>({
    queryKey: ["training-scaling", player?.id],
    queryFn: async () => {
      if (!player?.id) throw new Error("No player");
      const res = await fetch(`/api/player/${player.id}/training-scaling`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!player?.id,
    staleTime: 10000,
  });

  const tiers: CategoryTiers = {
    strength:  scalingData?.trainingScaling?.strength?.tier  ?? 1,
    agility:   scalingData?.trainingScaling?.agility?.tier   ?? 1,
    meditation: scalingData?.trainingScaling?.meditation?.tier ?? 1,
    vitality:  scalingData?.trainingScaling?.vitality?.tier  ?? 1,
  };

  const dayNumber = homeData?.onboardingDay ?? 1;
  const activities = buildPhase1Activities(dayNumber, tiers);
  const totalTime = activities.reduce((sum, a) => sum + a.duration, 0);
  const totalMins = Math.ceil(totalTime / 60);

  const savedFlow = useMemo(() => loadFlow(), []);
  const hasSavedFlow = !!savedFlow;
  const savedSession = useMemo(() => loadSession(), []);
  const savedSessionActivity = useMemo(() => {
    if (!savedSession) return null;
    return activities.find((a) => a.id === savedSession.activityId) ?? null;
  }, [savedSession?.activityId]);

  const handleActivityComplete = (activityId: string) => {
    setCompletedToday((prev) => new Set(prev).add(activityId));
    setActiveActivity(null);
    queryClient.invalidateQueries({ queryKey: ["training-scaling", player?.id] });
  };

  const handleFlowComplete = (completedIds: string[], _bonus: boolean) => {
    setCompletedToday((prev) => {
      const next = new Set(prev);
      completedIds.forEach((id) => next.add(id));
      return next;
    });
    setFlowActive(false);
    queryClient.invalidateQueries({ queryKey: ["training-scaling", player?.id] });
    queryClient.invalidateQueries({ queryKey: ["/api/player"] });
  };

  const allComplete = completedToday.size === activities.length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SystemLayout>
      {/* ── Full-screen overlays ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeActivity && player && (
          <GuidedActivityEngine
            key={`activity-${activeActivity.id}`}
            activity={activeActivity}
            playerId={player.id}
            onComplete={() => handleActivityComplete(activeActivity.id)}
            onCancel={() => setActiveActivity(null)}
            isOnboardingComplete={homeData?.isOnboardingComplete}
          />
        )}
        {flowActive && player && (
          <DailyFlowEngine
            key="daily-flow"
            activities={activities}
            playerId={player.id}
            onComplete={handleFlowComplete}
            onCancel={() => setFlowActive(false)}
            isOnboardingComplete={homeData?.isOnboardingComplete}
          />
        )}
        {builderActivity && player && (
          <GuidedActivityEngine
            key={`builder-${builderActivity.id}`}
            activity={builderActivity}
            playerId={player.id}
            onComplete={handleBuilderComplete}
            onCancel={() => setBuilderActivity(null)}
            isOnboardingComplete={homeData?.isOnboardingComplete}
          />
        )}

        {/* Post-workout difficulty modal */}
        {showFeedbackModal && (
          <WorkoutFeedbackModal
            key="feedback-modal"
            onSubmit={handleFeedbackSubmit}
            planColor={planColor}
          />
        )}

        {/* Score + recommendation card */}
        {recommendation && (
          <RecommendationCard
            key="recommendation-card"
            recommendation={recommendation}
            onClose={handleCloseRecommendation}
            onLevelUp={handleConfirmLevelUp}
            onLevelDown={handleConfirmLevelDown}
            nextLevel={nextLevel}
            prevLevel={prevLevel}
            planColor={planColor}
          />
        )}
      </AnimatePresence>

      <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Dumbbell className="w-5 h-5" style={{ color: colors.primary }} />
          <h1
            className="text-lg font-bold font-orbitron tracking-wide"
            style={{ color: colors.text }}
            data-testid="text-train-title"
          >
            {t("Daily Training")}
          </h1>
        </div>

        {/* ── Tab selector ─────────────────────────────────────────────────── */}
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ backgroundColor: `${colors.textMuted}15` }}
        >
          {([
            { id: "daily" as const, label: "Daily Flow", icon: Zap },
            { id: "builder" as const, label: "Workout Builder", icon: Dumbbell },
          ]).map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                data-testid={`tab-${id}`}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: active ? colors.primary : "transparent",
                  color: active ? "#fff" : colors.textMuted,
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            DAILY FLOW TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "daily" && (
          <div className="space-y-4">
            {(hasSavedFlow || savedSessionActivity) && !allComplete && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${colors.secondary}25, ${colors.secondary}08)`,
                  border: `1.5px solid ${colors.secondary}50`,
                }}
                onClick={() => {
                  if (hasSavedFlow) setFlowActive(true);
                  else if (savedSessionActivity) setActiveActivity(savedSessionActivity);
                }}
                data-testid="button-continue-session"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${colors.secondary}20`, border: `1px solid ${colors.secondary}40` }}>
                  <PlayCircle size={24} style={{ color: colors.secondary }} />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold" style={{ color: colors.text }}>Continue Where You Left Off</div>
                  <div className="text-xs" style={{ color: colors.textMuted }}>
                    {hasSavedFlow
                      ? `Daily Flow — ${activities[savedFlow.activityIdx]?.activityName ?? "In progress"}`
                      : `${savedSessionActivity?.activityName ?? "Activity"} — step ${(savedSession?.stepIdx ?? 0) + 1}`}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: `${colors.secondary}20`, color: colors.secondary }}>▶</div>
              </motion.div>
            )}

            {!allComplete && (
              <button
                className="w-full rounded-xl p-4 flex items-center gap-4 transition-all active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}20, ${colors.primary}08)`,
                  border: `1px solid ${colors.primary}30`,
                }}
                onClick={() => { clearFlow(); clearSession(); setFlowActive(true); }}
                data-testid="button-start-daily-flow"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${colors.primary}20`, border: `1px solid ${colors.primary}40` }}>
                  <ListChecks size={24} style={{ color: colors.primary }} />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-base font-bold" style={{ color: colors.text }}>Start Daily Flow</div>
                  <div className="text-xs" style={{ color: colors.textMuted }}>
                    All {activities.length} activities in sequence · ~{totalMins} min · +5 bonus XP
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${colors.primary}20`, border: `1px solid ${colors.primary}40` }}>
                  <Play size={16} style={{ color: colors.primary }} />
                </div>
              </button>
            )}

            <div className="rounded-lg px-4 py-3"
              style={{ backgroundColor: `${colors.primary}08`, border: `1px solid ${colors.primary}15` }}>
              <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>
                Phase 1 — Build consistency with small daily rituals. Complete all {activities.length} activities (~{totalMins} min total) or run the Daily Flow.
              </p>
            </div>

            {allComplete && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-lg p-4 text-center"
                style={{ backgroundColor: "#22c55e15", border: "1px solid #22c55e40" }}
                data-testid="card-all-complete">
                <CheckCircle2 className="mx-auto mb-2" size={28} style={{ color: "#22c55e" }} />
                <div className="text-sm font-bold" style={{ color: colors.text }}>All training complete for today!</div>
                <div className="text-xs mt-1" style={{ color: colors.textMuted }}>Come back tomorrow to continue building your rhythm.</div>
              </motion.div>
            )}

            <div className="space-y-3">
              {activities.map((activity) => {
                const isDone = completedToday.has(activity.id);
                const actMins = Math.ceil(activity.duration / 60);
                const Icon = CATEGORY_ICONS[activity.category] || Dumbbell;
                const stepsNoCompletion = activity.steps.filter((s) => s.type !== "completion");
                const tier = activity.tier ?? 1;
                const multiplier = activity.xpMultiplier ?? 1.0;
                const catScaling = scalingData?.trainingScaling?.[activity.category];
                const streak = catScaling?.completionStreak ?? 0;
                return (
                  <div key={activity.id}
                    className={`rounded-lg overflow-hidden transition-all duration-300 ${isDone ? "opacity-60" : ""}`}
                    style={{ backgroundColor: `${colors.background}cc`, border: `1px solid ${isDone ? "#22c55e40" : colors.surfaceBorder}` }}
                    data-testid={`card-activity-${activity.id}`}>
                    <button
                      className="w-full p-4 flex items-center gap-4 transition-all"
                      onClick={() => !isDone && setActiveActivity(activity)}
                      disabled={isDone}
                      data-testid={`button-start-${activity.id}`}>
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: isDone ? "#22c55e20" : `${activity.color}20`, border: `1px solid ${isDone ? "#22c55e40" : activity.color + "40"}` }}>
                        {isDone ? <CheckCircle2 size={24} style={{ color: "#22c55e" }} /> : <Icon size={24} style={{ color: activity.color }} />}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold" style={{ color: isDone ? colors.textMuted : colors.text }}>{activity.activityName}</span>
                          {tier > 1 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `${activity.color}20`, color: activity.color }}>T{tier}</span>}
                        </div>
                        <div className="text-xs flex items-center gap-2" style={{ color: colors.textMuted }}>
                          {isDone ? "Completed" : (
                            <>
                              <span>{stepsNoCompletion.length} steps · ~{actMins} min</span>
                              {multiplier > 1 && <span style={{ color: activity.color }}>×{multiplier.toFixed(1)} XP</span>}
                            </>
                          )}
                        </div>
                      </div>
                      {!isDone && (
                        <div className="w-9 h-9 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${activity.color}20`, border: `1px solid ${activity.color}40` }}>
                          <Play size={16} style={{ color: activity.color }} />
                        </div>
                      )}
                    </button>
                    {!isDone && (
                      <div className="px-4 pb-3">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {stepsNoCompletion.map((step) => (
                            <span key={step.id} className="text-[10px] px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${activity.color}10`, color: activity.color, border: `1px solid ${activity.color}20` }}>
                              {step.label}
                            </span>
                          ))}
                        </div>
                        {streak > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: colors.textMuted }}>
                            <TrendingUp size={10} style={{ color: activity.color }} />
                            <span>{streak}/3 streak to next tier</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Adaptive scaling card */}
            <div className="rounded-lg p-4"
              style={{ backgroundColor: `${colors.background}cc`, border: `1px solid ${colors.surfaceBorder}` }}
              data-testid="card-progression-info">
              <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colors.textMuted }}>Adaptive Scaling</div>
              <div className="grid grid-cols-4 gap-2">
                {(["strength", "agility", "meditation", "vitality"] as const).map((cat) => {
                  const catTier = tiers[cat];
                  const catColor = { strength: "#ef4444", agility: "#22c55e", meditation: "#3b82f6", vitality: "#f59e0b" }[cat];
                  const catAbbr = { strength: "STR", agility: "AGI", meditation: "SEN", vitality: "VIT" }[cat];
                  return (
                    <div key={cat} className="text-center p-2 rounded-lg"
                      style={{ backgroundColor: `${catColor}10`, border: `1px solid ${catColor}20` }}>
                      <div className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: catColor }}>{catAbbr}</div>
                      <div className="text-lg font-bold" style={{ color: colors.text }}>T{catTier}</div>
                      <div className="text-[9px]" style={{ color: colors.textMuted }}>{TIER_LABELS[catTier] ?? "Beginner"}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-[10px] leading-relaxed" style={{ color: colors.textMuted }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={10} style={{ color: colors.primary }} />
                  <span>3 completions in a row → tier up</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield size={10} style={{ color: colors.textMuted }} />
                  <span>3 missed days → tier down · Phase 1 max: Tier 3</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            WORKOUT BUILDER TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "builder" && (
          <div className="space-y-4">

            {/* ── Level-up suggestion banner ─────────────────────────────────── */}
            {showLevelUpSuggestion && nextLevel && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl p-4 flex items-start gap-3"
                style={{ backgroundColor: "#f59e0b12", border: "1.5px solid #f59e0b50" }}
                data-testid="banner-level-up-suggestion"
              >
                <Star size={18} style={{ color: "#f59e0b" }} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-bold mb-0.5" style={{ color: "#f59e0b" }}>Ready to level up!</div>
                  <div className="text-xs" style={{ color: "#94a3b8" }}>
                    You've been crushing the {selectedPlan.label} level. Try {WORKOUT_PLANS[nextLevel].label}?
                  </div>
                </div>
                <button onClick={() => handleLevelChange(nextLevel)}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0"
                  style={{ backgroundColor: "#f59e0b20", color: "#f59e0b" }}
                  data-testid="button-accept-level-up">
                  Switch
                </button>
              </motion.div>
            )}

            {/* ── Micro-progress state pill ─────────────────────────────────── */}
            {(micro.repsBonus > 0 || micro.setsBonus > 0) && (
              <div
                className="rounded-xl px-4 py-2.5 flex items-center gap-2.5"
                style={{ backgroundColor: `${planColor}10`, border: `1px solid ${planColor}30` }}
              >
                <TrendingUp size={13} style={{ color: planColor }} />
                <span className="text-xs" style={{ color: planColor }}>
                  Micro-progression active:
                  {micro.repsBonus > 0 && ` +${micro.repsBonus} reps`}
                  {micro.setsBonus > 0 && ` +${micro.setsBonus} set${micro.setsBonus !== 1 ? "s" : ""}`}
                </span>
              </div>
            )}

            {/* ── Level selector ─────────────────────────────────────────────── */}
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
                      <span className="text-base">
                        {level === "entry" ? "🌱" : level === "beginner" ? "💪" : level === "intermediate" ? "🔥" : "⚡"}
                      </span>
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

            {/* ── Cardio module ───────────────────────────────────────────────── */}
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
                    <button key={lvl} onClick={() => handleCardioIntensity(lvl)}
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
                      <button key={pos} onClick={() => handleCardioPosition(pos)}
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

            {/* ── Warm-up preview ─────────────────────────────────────────────── */}
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

            {/* ── Exercise list (with micro-progression applied) ──────────────── */}
            <div className="rounded-xl p-4"
              style={{ backgroundColor: `${colors.background}cc`, border: `1px solid ${colors.surfaceBorder}` }}
              data-testid="card-exercise-list">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: planColor }} />
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                  {selectedPlan.label} Exercises
                </div>
                {(micro.repsBonus > 0 || micro.setsBonus > 0) && (
                  <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${planColor}20`, color: planColor }}>
                    ★ Adjusted
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {selectedPlan.exercises.map((ex) => (
                  <ExerciseRow
                    key={ex.id}
                    ex={ex}
                    color={planColor}
                    bonusReps={micro.repsBonus}
                    bonusSets={micro.setsBonus}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3 text-[10px]" style={{ color: colors.textMuted }}>
                <span><span style={{ color: planColor }}>▶ ANIM</span> — animated</span>
                <span><span style={{ color: "#6b7280" }}>○ SOON</span> — guide coming</span>
                {(micro.repsBonus > 0 || micro.setsBonus > 0) && (
                  <span><span style={{ color: planColor }}>★</span> — progression boost</span>
                )}
              </div>
            </div>

            {/* ── Start button ─────────────────────────────────────────────────── */}
            <button
              onClick={handleStartWorkout}
              data-testid="button-start-workout"
              className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${planColor}, ${planColor}cc)`,
                color: "#fff",
                boxShadow: `0 4px 20px ${planColor}40`,
              }}
            >
              <Dumbbell size={18} />
              Start {selectedPlan.label} Workout
              {cardioIntensity !== "off" && (
                <span className="text-xs font-normal opacity-80">+ {cardioIntensity} cardio</span>
              )}
            </button>

            {/* ── Scoring system info card ─────────────────────────────────────── */}
            <div className="rounded-xl p-4"
              style={{ backgroundColor: `${colors.background}cc`, border: `1px solid ${colors.surfaceBorder}` }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colors.textMuted }}>
                How Scoring Works
              </div>
              <div className="flex flex-col gap-1.5 text-[10px] leading-relaxed" style={{ color: colors.textMuted }}>
                {[
                  { label: "Workout completed", pts: "+20" },
                  { label: "All sets done",      pts: "+40" },
                  { label: "Target reps hit",    pts: "+30" },
                  { label: "Felt easy",          pts: "+10" },
                  { label: "Felt hard",          pts: "−15" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span>{row.label}</span>
                    <span className="font-bold" style={{ color: colors.text }}>{row.pts}</span>
                  </div>
                ))}
                <div className="pt-2 mt-1" style={{ borderTop: `1px solid ${colors.surfaceBorder}` }}>
                  <div className="flex items-center gap-1"><TrendingUp size={9} style={{ color: planColor }} />
                    <span>Avg ≥ 80 → more reps → more sets → level up</span></div>
                  <div className="flex items-center gap-1 mt-0.5"><Shield size={9} style={{ color: colors.textMuted }} />
                    <span>Avg {"<"} 60 or hard twice → scale back</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SystemLayout>
  );
}
