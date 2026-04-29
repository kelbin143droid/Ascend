import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageStageContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { GuidedActivityEngine } from "@/components/game/GuidedActivityEngine";
import { DailyFlowEngine } from "@/components/game/DailyFlowEngine";
import { buildPhase1Activities, TIER_XP_MULTIPLIERS, type ActivityDefinition, type CategoryTiers } from "@/lib/activityEngine";
import {
  WORKOUT_PLANS,
  LEVEL_COLORS,
  CARDIO_LABELS,
  WARMUP_EXERCISES,
  buildWorkoutActivity,
  getNextLevel,
  type WorkoutLevel,
  type CardioIntensity,
  type CardioPosition,
} from "@/lib/workoutPlans";
import {
  getWorkoutLevel,
  setWorkoutLevel,
  getCardioPrefs,
  setCardioPrefs,
  recordWorkoutSession,
  shouldSuggestLevelUp,
  getTotalCompleted,
} from "@/lib/workoutProgressStore";
import {
  Dumbbell, Wind, Brain, Heart, Play, CheckCircle2, TrendingUp, Shield,
  Zap, ListChecks, PlayCircle, ChevronUp, Flame, ArrowRight, Sparkles,
  Timer, RotateCcw, Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { loadFlow, loadSession, clearFlow, clearSession } from "@/lib/sessionPersistenceStore";

const CATEGORY_ICONS: Record<string, typeof Dumbbell> = {
  strength: Dumbbell,
  agility: Wind,
  meditation: Brain,
  vitality: Heart,
};

const TIER_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Building",
  3: "Steady",
  4: "Strong",
  5: "Peak",
};

const LEVEL_ORDER: WorkoutLevel[] = ["entry", "beginner", "intermediate", "advanced"];

// ── Sub-components ────────────────────────────────────────────────────────────

function ExerciseRow({ ex, color }: { ex: { name: string; sets: number; reps?: string; durationSeconds?: number; isPlaceholder?: boolean; videoSrc?: string }; color: string }) {
  const hasAnim = !ex.isPlaceholder && !!ex.videoSrc;
  const detail = ex.durationSeconds
    ? `${ex.sets} × ${ex.durationSeconds}s hold`
    : `${ex.sets} × ${ex.reps ?? "?"} reps`;
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
      style={{ backgroundColor: `${color}08`, border: `1px solid ${color}18` }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
        style={{ backgroundColor: hasAnim ? `${color}20` : "#6b728018", color: hasAnim ? color : "#6b7280" }}
      >
        {hasAnim ? "▶" : "○"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold truncate" style={{ color: "#e2e8f0" }}>
          {ex.name}
        </div>
        <div className="text-[10px]" style={{ color: "#94a3b8" }}>{detail}</div>
      </div>
      {hasAnim ? (
        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: `${color}20`, color }}>ANIM</span>
      ) : (
        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: "#6b728018", color: "#6b7280" }}>SOON</span>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TrainPage() {
  const { player } = useGame();
  const { backgroundTheme } = useTheme();
  const { t } = useLanguage();
  const colors = backgroundTheme.colors;
  const queryClient = useQueryClient();

  // ── Tab state
  const [activeTab, setActiveTab] = useState<"daily" | "builder">("daily");

  // ── Daily Flow state
  const [activeActivity, setActiveActivity] = useState<ActivityDefinition | null>(null);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [flowActive, setFlowActive] = useState(false);

  // ── Workout Builder state
  const [workoutLevel, setWorkoutLevelState] = useState<WorkoutLevel>(() => getWorkoutLevel());
  const [cardioIntensity, setCardioIntensity] = useState<CardioIntensity>(() => getCardioPrefs().intensity);
  const [cardioPosition, setCardioPosition] = useState<CardioPosition>(() => getCardioPrefs().position);
  const [builderActivity, setBuilderActivity] = useState<ActivityDefinition | null>(null);

  const selectedPlan = WORKOUT_PLANS[workoutLevel];
  const planColor = LEVEL_COLORS[workoutLevel];
  const nextLevel = getNextLevel(workoutLevel);
  const showLevelUpSuggestion = shouldSuggestLevelUp(workoutLevel);
  const totalCompleted = getTotalCompleted(workoutLevel);

  const handleLevelChange = (level: WorkoutLevel) => {
    setWorkoutLevelState(level);
    setWorkoutLevel(level);
  };

  const handleCardioIntensity = (intensity: CardioIntensity) => {
    setCardioIntensity(intensity);
    setCardioPrefs({ intensity });
  };

  const handleCardioPosition = (position: CardioPosition) => {
    setCardioPosition(position);
    setCardioPrefs({ position });
  };

  const handleStartWorkout = () => {
    const activity = buildWorkoutActivity(workoutLevel, { intensity: cardioIntensity, position: cardioPosition });
    setBuilderActivity(activity);
  };

  const handleBuilderComplete = () => {
    recordWorkoutSession(workoutLevel, true);
    setBuilderActivity(null);
    queryClient.invalidateQueries({ queryKey: ["/api/player"] });
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

  const { data: scalingData } = useQuery<{ trainingScaling: Record<string, { tier: number; completionStreak: number; missedDays: number; sessionsCompleted: number }> }>({
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
    strength: scalingData?.trainingScaling?.strength?.tier ?? 1,
    agility: scalingData?.trainingScaling?.agility?.tier ?? 1,
    meditation: scalingData?.trainingScaling?.meditation?.tier ?? 1,
    vitality: scalingData?.trainingScaling?.vitality?.tier ?? 1,
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

  const handleFlowComplete = (completedIds: string[], _bonusAwarded: boolean) => {
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

  return (
    <SystemLayout>
      {/* ── Full-screen overlays ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeActivity && player && (
          <GuidedActivityEngine
            activity={activeActivity}
            playerId={player.id}
            onComplete={() => handleActivityComplete(activeActivity.id)}
            onCancel={() => setActiveActivity(null)}
            isOnboardingComplete={homeData?.isOnboardingComplete}
          />
        )}
        {flowActive && player && (
          <DailyFlowEngine
            activities={activities}
            playerId={player.id}
            onComplete={handleFlowComplete}
            onCancel={() => setFlowActive(false)}
            isOnboardingComplete={homeData?.isOnboardingComplete}
          />
        )}
        {builderActivity && player && (
          <GuidedActivityEngine
            activity={builderActivity}
            playerId={player.id}
            onComplete={handleBuilderComplete}
            onCancel={() => setBuilderActivity(null)}
            isOnboardingComplete={homeData?.isOnboardingComplete}
          />
        )}
      </AnimatePresence>

      <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-1">
          <Dumbbell className="w-5 h-5" style={{ color: colors.primary }} />
          <h1
            className="text-lg font-bold font-orbitron tracking-wide"
            style={{ color: colors.text }}
            data-testid="text-train-title"
          >
            {t("Daily Training")}
          </h1>
        </div>

        {/* ── Tab selector ────────────────────────────────────────────────────── */}
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ backgroundColor: `${colors.textMuted}15` }}
        >
          {([
            { id: "daily", label: "Daily Flow", icon: Zap },
            { id: "builder", label: "Workout Builder", icon: Dumbbell },
          ] as const).map(({ id, label, icon: Icon }) => {
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
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${colors.secondary}20`, border: `1px solid ${colors.secondary}40` }}
                >
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
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg p-4 text-center"
                style={{ backgroundColor: "#22c55e15", border: "1px solid #22c55e40" }}
                data-testid="card-all-complete"
              >
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
                const stepsWithoutCompletion = activity.steps.filter((s) => s.type !== "completion");
                const tier = activity.tier ?? 1;
                const multiplier = activity.xpMultiplier ?? 1.0;
                const catScaling = scalingData?.trainingScaling?.[activity.category];
                const streak = catScaling?.completionStreak ?? 0;
                return (
                  <div
                    key={activity.id}
                    className={`rounded-lg overflow-hidden transition-all duration-300 ${isDone ? "opacity-60" : ""}`}
                    style={{ backgroundColor: `${colors.background}cc`, border: `1px solid ${isDone ? "#22c55e40" : colors.surfaceBorder}` }}
                    data-testid={`card-activity-${activity.id}`}
                  >
                    <button
                      className="w-full p-4 flex items-center gap-4 transition-all"
                      onClick={() => !isDone && setActiveActivity(activity)}
                      disabled={isDone}
                      data-testid={`button-start-${activity.id}`}
                    >
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: isDone ? "#22c55e20" : `${activity.color}20`, border: `1px solid ${isDone ? "#22c55e40" : activity.color + "40"}` }}
                      >
                        {isDone ? <CheckCircle2 size={24} style={{ color: "#22c55e" }} /> : <Icon size={24} style={{ color: activity.color }} />}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold" style={{ color: isDone ? colors.textMuted : colors.text }}>{activity.activityName}</span>
                          {tier > 1 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: `${activity.color}20`, color: activity.color }}>T{tier}</span>
                          )}
                        </div>
                        <div className="text-xs flex items-center gap-2" style={{ color: colors.textMuted }}>
                          {isDone ? "Completed" : (
                            <>
                              <span>{stepsWithoutCompletion.length} steps · ~{actMins} min</span>
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
                          {stepsWithoutCompletion.map((step) => (
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
                  const catIcon = { strength: "STR", agility: "AGI", meditation: "SEN", vitality: "VIT" }[cat];
                  return (
                    <div key={cat} className="text-center p-2 rounded-lg"
                      style={{ backgroundColor: `${catColor}10`, border: `1px solid ${catColor}20` }}>
                      <div className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: catColor }}>{catIcon}</div>
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
                <button
                  onClick={() => handleLevelChange(nextLevel)}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0"
                  style={{ backgroundColor: "#f59e0b20", color: "#f59e0b" }}
                  data-testid="button-accept-level-up"
                >
                  Switch
                </button>
              </motion.div>
            )}

            {/* ── Level selector ─────────────────────────────────────────────── */}
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: `${colors.background}cc`, border: `1px solid ${colors.surfaceBorder}` }}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colors.textMuted }}>
                Workout Level
              </div>
              <div className="grid grid-cols-4 gap-2">
                {LEVEL_ORDER.map((level) => {
                  const plan = WORKOUT_PLANS[level];
                  const isActive = workoutLevel === level;
                  const lColor = LEVEL_COLORS[level];
                  return (
                    <button
                      key={level}
                      onClick={() => handleLevelChange(level)}
                      data-testid={`button-level-${level}`}
                      className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold transition-all active:scale-95"
                      style={{
                        backgroundColor: isActive ? `${lColor}20` : `${colors.textMuted}08`,
                        border: `1.5px solid ${isActive ? lColor : `${colors.textMuted}20`}`,
                        color: isActive ? lColor : colors.textMuted,
                      }}
                    >
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
                  <span style={{ color: planColor }}> · {totalCompleted} session{totalCompleted !== 1 ? "s" : ""} completed</span>
                )}
              </p>
            </div>

            {/* ── Cardio module ───────────────────────────────────────────────── */}
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: `${colors.background}cc`, border: `1px solid ${colors.surfaceBorder}` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Flame size={13} style={{ color: "#ef4444" }} />
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                  Cardio Module
                </div>
              </div>

              {/* Intensity selector */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {(["off", "light", "moderate", "intense"] as CardioIntensity[]).map((lvl) => {
                  const active = cardioIntensity === lvl;
                  return (
                    <button
                      key={lvl}
                      onClick={() => handleCardioIntensity(lvl)}
                      data-testid={`button-cardio-${lvl}`}
                      className="py-2 rounded-lg text-[10px] font-semibold transition-all active:scale-95 capitalize"
                      style={{
                        backgroundColor: active ? "#ef444420" : `${colors.textMuted}08`,
                        border: `1.5px solid ${active ? "#ef4444" : `${colors.textMuted}20`}`,
                        color: active ? "#ef4444" : colors.textMuted,
                      }}
                    >
                      {lvl === "off" ? "Off" : lvl === "light" ? "Light" : lvl === "moderate" ? "Moderate" : "Intense"}
                    </button>
                  );
                })}
              </div>

              {/* Duration label */}
              {cardioIntensity !== "off" && (
                <p className="text-[10px] mb-3" style={{ color: "#ef4444" }}>
                  {CARDIO_LABELS[cardioIntensity]}
                </p>
              )}

              {/* Before / After toggle */}
              {cardioIntensity !== "off" && (
                <div>
                  <div className="text-[10px] font-semibold mb-2 uppercase tracking-wider" style={{ color: colors.textMuted }}>
                    Cardio position
                  </div>
                  <div className="flex gap-2">
                    {(["before", "after"] as CardioPosition[]).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => handleCardioPosition(pos)}
                        data-testid={`button-cardio-position-${pos}`}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all active:scale-95"
                        style={{
                          backgroundColor: cardioPosition === pos ? "#ef444420" : `${colors.textMuted}08`,
                          border: `1.5px solid ${cardioPosition === pos ? "#ef4444" : `${colors.textMuted}20`}`,
                          color: cardioPosition === pos ? "#ef4444" : colors.textMuted,
                        }}
                      >
                        {pos} Workout
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Warm-up preview ─────────────────────────────────────────────── */}
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: `${colors.background}cc`, border: `1px solid ${colors.surfaceBorder}` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <RotateCcw size={13} style={{ color: "#22c55e" }} />
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                  Warm-up <span style={{ color: "#22c55e" }}>(auto)</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {WARMUP_EXERCISES.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: "#22c55e08", border: "1px solid #22c55e18" }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0"
                      style={{ backgroundColor: ex.videoSrc ? "#22c55e20" : "#6b728018", color: ex.videoSrc ? "#22c55e" : "#6b7280" }}
                    >
                      {ex.videoSrc ? "▶" : "○"}
                    </div>
                    <span className="text-xs" style={{ color: "#e2e8f0" }}>{ex.name}</span>
                    <span className="ml-auto text-[10px]" style={{ color: "#94a3b8" }}>{ex.durationSeconds}s</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Exercise list ────────────────────────────────────────────────── */}
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: `${colors.background}cc`, border: `1px solid ${colors.surfaceBorder}` }}
              data-testid="card-exercise-list"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: planColor }}
                />
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                  {selectedPlan.label} Exercises
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {selectedPlan.exercises.map((ex) => (
                  <ExerciseRow key={ex.id} ex={ex} color={planColor} />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3 text-[10px]" style={{ color: colors.textMuted }}>
                <span className="flex items-center gap-1">
                  <span style={{ color: planColor }}>▶ ANIM</span> — animated guide
                </span>
                <span className="flex items-center gap-1">
                  <span style={{ color: "#6b7280" }}>○ SOON</span> — guide coming soon
                </span>
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
                <span className="text-xs font-normal opacity-80">
                  + {cardioIntensity} cardio
                </span>
              )}
            </button>

            {/* ── Progression hint ─────────────────────────────────────────────── */}
            <div
              className="rounded-lg px-4 py-3"
              style={{ backgroundColor: `${colors.textMuted}06`, border: `1px solid ${colors.textMuted}15` }}
            >
              <p className="text-[10px] leading-relaxed" style={{ color: colors.textMuted }}>
                <TrendingUp size={9} className="inline mr-1" style={{ color: colors.primary }} />
                Complete workouts at max reps consistently → level-up suggestion appears. Use the feedback screen after Daily Flow to fine-tune difficulty.
              </p>
            </div>
          </div>
        )}
      </div>
    </SystemLayout>
  );
}
