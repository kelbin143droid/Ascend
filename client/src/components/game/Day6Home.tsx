import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Brain, Wind, Dumbbell, Heart, ChevronDown, ChevronUp, CheckCircle2, Zap, Shield, Sparkles, X, Palette, Flame } from "lucide-react";
import { CustomizePanel } from "./CustomizePanel";
import {
  shouldPromptAutoSwitch,
  setMode as setSleepMode,
  dismissAutoSwitchPrompt,
} from "@/lib/sleepModeStore";
import { useLocation } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { DailyFlowEngine } from "./DailyFlowEngine";
import { WorkoutBuilderSection } from "./WorkoutBuilderSection";
import { SystemLayout } from "./SystemLayout";
import { buildPhase1Activities, type CategoryTiers } from "@/lib/activityEngine";
import { buildWorkoutActivity, WORKOUT_PLANS } from "@/lib/workoutPlans";
import { getWorkoutLevel, getCardioPrefs } from "@/lib/workoutProgressStore";
import { getStats, recordSleepCheck, recordBreathingSession, getHPColor, getManaColor, getMaxHP, getMaxMana, initLevelBaseline, STATS_CHANGED_EVENT, type GameStats } from "@/lib/statsSystem";
import { markFlowCompleted } from "@/lib/userState";
import { computeXPState } from "@/lib/xpSystem";
import { clearFlow, clearSession } from "@/lib/sessionPersistenceStore";
import { assembleDailyProfile, getDailyRecommendation } from "@/lib/dailyRecommendationEngine";
import type { DailyRecommendation } from "@/lib/dailyRecommendationEngine";
import { DEFAULT_PROFILE } from "@/lib/breathingProgressionSystem";

// ── Display maps ───────────────────────────────────────────────────────────────

const REC_TYPE_LABELS: Record<string, string> = {
  MOMENTUM_RECOVERY:       "Welcome Back",
  RECOVERY_SESSION:        "Recovery Day",
  TRAINING_READINESS_HIGH: "Peak Readiness",
  CONTINUE_MOMENTUM:       "Momentum Active",
  BEGIN_DAILY_FLOW:        "Daily Mission",
};

const RECOVERY_COLORS: Record<string, string> = {
  energized: "#22c55e",
  normal:    "#3b82f6",
  fatigued:  "#f59e0b",
};

const QUICK_ACTION_ICONS: Record<string, React.ElementType> = {
  "Begin Flow":     Play,
  "Calm Breathing": Brain,
  "Light Stretch":  Wind,
  "Strength Focus": Dumbbell,
  "Mini Workout":   Dumbbell,
  "Push Cardio":    Zap,
  "Track Progress": Shield,
  "Review Path":    Heart,
  "Hydrate":        Sparkles,
};

// CTA label adapts to recommendation intent
const CTA_LABELS: Record<string, string> = {
  MOMENTUM_RECOVERY:       "Restart Your Flow",
  RECOVERY_SESSION:        "Begin Recovery Flow",
  TRAINING_READINESS_HIGH: "Begin Daily Flow",
  CONTINUE_MOMENTUM:       "Continue Flow",
  BEGIN_DAILY_FLOW:        "Begin Daily Flow",
};

// Guaranteed low-friction baseline actions always shown in the middle zone
const BASELINE_QUICK_ACTIONS = ["Calm Breathing", "Light Stretch", "Mini Workout"];

// ── Interfaces ────────────────────────────────────────────────────────────────

interface HomeData {
  phase: { number: number; name: string };
  insight: string;
  onboardingDay: number;
  isOnboardingComplete: boolean;
  streak: number;
  stability?: { consecutiveActiveDays?: number };
}

interface StatLevel {
  level: number;
  currentXP: number;
  xpForNext: number;
}

interface PlayerData {
  level: number;
  exp: number;
  maxExp: number;
  totalExp: number;
  name?: string;
  statLevels?: Record<string, StatLevel>;
  displayStats?: Record<string, number>;
}

interface Player {
  id: string;
}

interface ScalingData {
  trainingScaling?: Record<string, { tier: number }>;
}

interface Props {
  homeData: HomeData;
  playerData: PlayerData | null;
  player: Player;
  scalingData: ScalingData | null;
}

function buildSessionList(workoutLevel: string) {
  const plan = WORKOUT_PLANS[workoutLevel as keyof typeof WORKOUT_PLANS];
  const exerciseNames = plan ? plan.exercises.slice(0, 3).map(e => e.name).join(" · ") : "Push-ups · Plank · Cardio";
  return [
    { id: "phase1_meditation", label: "Calm Breathing", sublabel: "4-4-6 breathing rhythm · 2 min", icon: Brain, color: "#3b82f6", stat: "Mana" },
    { id: "phase1_agility", label: "Agility Flow", sublabel: "Stretch circuit · 3 min", icon: Wind, color: "#22c55e", stat: "Agility" },
    { id: "phase1_strength", label: `${plan?.label ?? "Foundation"} Workout`, sublabel: exerciseNames, icon: Dumbbell, color: plan?.color ?? "#ef4444", stat: "Strength" },
  ];
}

// ── Main component ─────────────────────────────────────────────────────────────

export function Day6Home({ homeData, playerData, player, scalingData }: Props) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const isIronSovereign = backgroundTheme.id === "male";
  const isNeonEmpress = backgroundTheme.id === "female";

  const isHud = {
    cyan: "#22d3ee",
    cyanGlow: "rgba(34,211,238,0.55)",
    green: "#22c55e",
    greenGlow: "rgba(34,197,94,0.55)",
    purple: "#a855f7",
    purpleGlow: "rgba(168,85,247,0.45)",
  };

  const fae = {
    peach: "#fbcaad",
    peachStrong: "#f4845f",
    peachBorder: "#f4a78a",
    skyBlue: "#a9d3f0",
    mint: "#bce8c9",
    mintFill: "#7ed8a0",
    lavender: "#c8b9ee",
    lavenderDeep: "#8d75c4",
    purple: "#7c3aed",
    inkText: "#2d1b4e",
    gold: "#c89530",
    goldGlow: "rgba(200,149,48,0.55)",
  };

  const [, navigate] = useLocation();
  const [flowActive, setFlowActive] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [flowCompletedDate, setFlowCompletedDate] = useState(() =>
    localStorage.getItem("ascend_light_movement_completed") ?? ""
  );
  const [stats, setStats] = useState<GameStats>(() => getStats());
  const today = new Date().toISOString().split("T")[0];
  const flowCompletedToday = flowCompletedDate === today;
  const [isFirstMission, setIsFirstMission] = useState(
    () => localStorage.getItem("ascend_first_mission_done") !== "1"
  );

  // Progressive disclosure: show advanced sections once 5+ flows are completed.
  // Authoritative source: `ascend_total_flows_completed`, incremented in handleFlowComplete.
  //
  // Legacy migration: for users without the counter we seed to 1 if
  // `ascend_first_mission_done=1` — the only reliable binary signal that at least
  // one daily flow was done.  We intentionally do NOT use getAllSessions() here:
  // `recordTrackedSession` is called only by the Workout Builder (TrainPage), not
  // by daily flow completions in Day6Home, so session count ≠ flow count.
  // Seeding to 1 is the strictly correct lower bound; users need 4 more completions.
  const [completedFlowsEver, setCompletedFlowsEver] = useState(() => {
    try {
      const stored = localStorage.getItem("ascend_total_flows_completed");
      if (stored !== null) return parseInt(stored, 10) || 0;
      const seed = localStorage.getItem("ascend_first_mission_done") === "1" ? 1 : 0;
      if (seed > 0) {
        try { localStorage.setItem("ascend_total_flows_completed", "1"); } catch { /* ignore */ }
      }
      return seed;
    } catch { return 0; }
  });
  const showAdvanced = completedFlowsEver >= 5;

  // Daily recommendation — memoized by date so it doesn't recompute on every render
  const recommendation: DailyRecommendation = useMemo(() => {
    try {
      return getDailyRecommendation(assembleDailyProfile());
    } catch {
      return getDailyRecommendation({
        workoutSessions:  [],
        breathingProfile: { ...DEFAULT_PROFILE },
        streak:           0,
        missedDays:       0,
        lastFlowDate:     null,
        calibrationLevel: "beginner",
        fatigue:          "normal",
        readiness:        0,
      });
    }
  // Re-derive on day rollover AND when the user completes a flow mid-day so the
  // top card immediately reflects the new state (e.g. switches to "flow done" card).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, flowCompletedToday]);

  const tiers: CategoryTiers = {
    strength: scalingData?.trainingScaling?.strength?.tier ?? 1,
    agility: scalingData?.trainingScaling?.agility?.tier ?? 1,
    meditation: scalingData?.trainingScaling?.meditation?.tier ?? 1,
    vitality: scalingData?.trainingScaling?.vitality?.tier ?? 1,
  };
  const [currentWorkoutLevel] = useState(() => getWorkoutLevel());
  const activities = (() => {
    const raw = buildPhase1Activities(homeData.onboardingDay, tiers);
    const cardioPrefs = getCardioPrefs();
    return raw.map(a => {
      if (a.id === "phase1_strength") {
        const levelActivity = buildWorkoutActivity(currentWorkoutLevel, {
          intensity: cardioPrefs.intensity,
          position: cardioPrefs.position,
        });
        return { ...levelActivity, id: "phase1_strength" };
      }
      return a;
    });
  })();
  const totalMins = Math.ceil(activities.reduce((s, a) => s + a.duration, 0) / 60);

  const xp = computeXPState(
    playerData?.totalExp ?? 0,
    playerData?.level ?? 2,
    playerData?.exp ?? 0,
    playerData?.maxExp ?? 100
  );

  const refreshStats = useCallback(() => setStats(getStats()), []);
  const currentLevel = playerData?.level ?? 1;
  const maxHp = getMaxHP(currentLevel);
  const maxMana = getMaxMana(currentLevel);

  useEffect(() => { initLevelBaseline(currentLevel); }, [currentLevel]);

  useEffect(() => {
    const handler = () => setStats(getStats());
    window.addEventListener(STATS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(STATS_CHANGED_EVENT, handler);
  }, []);

  useEffect(() => {
    const sleepHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ sleptWell: boolean }>).detail;
      const updated = recordSleepCheck(detail.sleptWell);
      setStats(updated);
    };
    window.addEventListener("ascend:sleep-check", sleepHandler);
    return () => window.removeEventListener("ascend:sleep-check", sleepHandler);
  }, []);

  useEffect(() => {
    const resetHandler = () => setFlowCompletedDate("");
    window.addEventListener("ascend:sessions-reset", resetHandler);
    return () => window.removeEventListener("ascend:sessions-reset", resetHandler);
  }, []);

  const handleFlowComplete = (completedIds: string[], _bonus: boolean) => {
    if (completedIds.length > 0) {
      const newStats = markFlowCompleted(completedIds);
      setStats(newStats);
      if (completedIds.includes("phase1_meditation")) {
        const updated = recordBreathingSession(true);
        setStats(updated);
      }
      const dateStr = new Date().toISOString().split("T")[0];
      setFlowCompletedDate(dateStr);
      localStorage.setItem("ascend_first_mission_done", "1");
      setIsFirstMission(false);
      // Increment total flows counter for progressive disclosure
      const newCount = completedFlowsEver + 1;
      setCompletedFlowsEver(newCount);
      try { localStorage.setItem("ascend_total_flows_completed", String(newCount)); } catch { /* ignore */ }
    }
    setFlowActive(false);
    refreshStats();
  };

  const startFlow = () => { clearFlow(); clearSession(); setFlowActive(true); };

  const displayLevel = playerData?.level ?? 2;
  const hpColor = isIronSovereign
    ? isHud.green
    : isNeonEmpress
      ? "#22c55e"
      : getHPColor((stats.hp / maxHp) * 100);
  const manaColor = isIronSovereign
    ? isHud.purple
    : isNeonEmpress
      ? fae.purple
      : getManaColor((stats.mana / maxMana) * 100);
  const hpPct = Math.min(100, Math.max(0, (stats.hp / maxHp) * 100));
  const manaBarPct = Math.min(100, Math.max(0, (stats.mana / maxMana) * 100));

  // Adaptive CTA label driven by recommendation type
  const ctaLabel = CTA_LABELS[recommendation.type] ?? "Begin Daily Flow";

  // Quick actions: merge recommendation actions with guaranteed baseline set.
  // "Begin Flow" is always first when flow is not yet complete.
  const quickActions = (() => {
    const base = flowCompletedToday ? [] : ["Begin Flow"];
    const pool = [...recommendation.quickActions, ...BASELINE_QUICK_ACTIONS];
    const seen = new Set(base);
    for (const a of pool) {
      if (a !== "Begin Flow" && !seen.has(a)) {
        seen.add(a);
        base.push(a);
      }
    }
    return base;
  })();

  const snap = recommendation.progressSnapshot;
  const recoveryColor = RECOVERY_COLORS[snap.recoveryState] ?? "#3b82f6";

  return (
    <SystemLayout>
      <CustomizePanel open={showCustomize} onClose={() => setShowCustomize(false)} />
      <AnimatePresence>
        {flowActive && (
          <DailyFlowEngine
            activities={activities}
            playerId={player.id}
            onComplete={handleFlowComplete}
            onCancel={() => setFlowActive(false)}
            isOnboardingComplete={true}
          />
        )}
      </AnimatePresence>

      <div
        className="flex flex-col gap-4 py-6 px-1 max-w-md mx-auto w-full"
        data-testid="day6-home"
      >
        <AutoSwitchBanner navigate={navigate} />

        {/* ── HEADER: Level + XP ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="pt-1"
          data-testid="daily-status-section"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-col gap-1.5" />
            <div className="flex items-start gap-2">
              <button
                onClick={() => setShowCustomize(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
                style={{
                  backgroundColor: `${colors.primary}15`,
                  color: colors.primary,
                  border: `1px solid ${colors.primary}35`,
                  boxShadow: `0 0 10px ${colors.primaryGlow}`,
                }}
                data-testid="button-customize"
                aria-label="Customize"
              >
                <Palette size={15} />
              </button>
              {isIronSovereign ? (
                <div className="flex flex-col items-end gap-1" data-testid="text-player-level">
                  <span
                    className="font-extrabold leading-none"
                    style={{
                      color: isHud.cyan,
                      fontSize: 38,
                      letterSpacing: "0.02em",
                      textShadow: `0 0 14px ${isHud.cyanGlow}, 0 0 28px ${isHud.cyanGlow}`,
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    Lv {displayLevel}
                  </span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                    style={{
                      color: isHud.cyan,
                      border: `1px solid ${isHud.cyan}66`,
                      backgroundColor: `${isHud.cyan}10`,
                    }}
                  >
                    Lv {displayLevel}
                  </span>
                </div>
              ) : isNeonEmpress ? (
                <LaurelLevel level={displayLevel} gold={fae.gold} glow={fae.goldGlow} />
              ) : (
                <span
                  className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl"
                  style={{
                    backgroundColor: `${colors.primary}18`,
                    color: colors.primary,
                    border: `1px solid ${colors.primary}30`,
                  }}
                  data-testid="text-player-level"
                >
                  Lv {displayLevel}
                </span>
              )}
            </div>
          </div>

          {/* XP Bar */}
          <div data-testid="xp-progress-section">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>XP</span>
              <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>{xp.exp} / {xp.maxExp}</span>
            </div>
            {isIronSovereign ? (
              <SegmentedXpBar percent={xp.percent} fill={isHud.cyan} glow={isHud.cyanGlow} />
            ) : isNeonEmpress ? (
              <PastelGradientXpBar percent={xp.percent} />
            ) : (
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: `${colors.primary}18` }}
                data-testid="xp-bar-track"
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${xp.percent}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  style={{ backgroundColor: colors.primary, boxShadow: `0 0 8px ${colors.primaryGlow}` }}
                  data-testid="xp-bar-fill"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* ── FIRST MISSION BRIEFING (absolute first-timers only) ────── */}
        {isFirstMission && !flowCompletedToday && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="rounded-2xl p-5"
            style={{
              background: isIronSovereign
                ? `linear-gradient(135deg, rgba(34,211,238,0.12), rgba(34,211,238,0.04))`
                : isNeonEmpress
                  ? `linear-gradient(135deg, rgba(251,202,173,0.22), rgba(200,181,238,0.12))`
                  : `linear-gradient(135deg, ${colors.primary}14, ${colors.primary}05)`,
              border: isIronSovereign
                ? `1.5px solid rgba(34,211,238,0.30)`
                : isNeonEmpress
                  ? `1.5px solid rgba(244,132,95,0.38)`
                  : `1.5px solid ${colors.primary}28`,
            }}
            data-testid="card-first-mission"
          >
            <div className="flex items-center gap-2 mb-2.5">
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: isIronSovereign ? isHud.cyan : isNeonEmpress ? fae.peachStrong : colors.primary }}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
              <p
                className="text-[9px] uppercase tracking-[0.28em] font-bold"
                style={{ color: isIronSovereign ? isHud.cyan : isNeonEmpress ? fae.peachStrong : colors.primary }}
              >
                Mission 01 · Active
              </p>
            </div>
            <h3
              className="text-base font-extrabold mb-1.5 leading-snug"
              style={{ color: colors.text, fontFamily: "system-ui, sans-serif" }}
            >
              Complete Your First Daily Flow
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>
              {totalMins} min · Breath · Movement · Strength. Your progression system activates on completion.
            </p>
          </motion.div>
        )}

        {/* ── TOP ZONE: RECOMMENDATION CARD ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.10 }}
          data-testid="recommendation-card"
        >
          {flowCompletedToday ? (
            /* Completion state */
            <div
              className="w-full rounded-2xl px-5 py-6 flex flex-col items-center justify-center gap-2 text-center"
              style={{
                background: isIronSovereign
                  ? "linear-gradient(160deg, rgba(34,197,94,0.10) 0%, rgba(34,197,94,0.04) 100%)"
                  : isNeonEmpress
                    ? "linear-gradient(160deg, rgba(126,216,160,0.22) 0%, rgba(188,232,201,0.12) 100%)"
                    : "rgba(34,197,94,0.06)",
                border: isIronSovereign
                  ? `1.5px solid ${isHud.green}55`
                  : isNeonEmpress
                    ? `1.5px solid ${fae.mintFill}55`
                    : "1.5px solid rgba(34,197,94,0.28)",
                boxShadow: isIronSovereign
                  ? `0 0 30px ${isHud.greenGlow}30`
                  : "none",
              }}
              data-testid="text-flow-completed"
            >
              <CheckCircle2 size={26} style={{ color: "#22c55e" }} />
              <p className="text-base font-extrabold" style={{ color: "#22c55e" }}>Flow Complete</p>
              <p className="text-xs" style={{ color: colors.textMuted }}>{totalMins} min logged today</p>
            </div>
          ) : isIronSovereign ? (
            /* Iron Sovereign recommendation card */
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(160deg, rgba(34,211,238,0.10) 0%, rgba(14,165,233,0.04) 100%)",
                border: "1.5px solid rgba(34,211,238,0.32)",
                boxShadow: "0 0 40px rgba(34,211,238,0.10), inset 0 0 20px rgba(34,211,238,0.03)",
              }}
            >
              <div className="px-5 pt-5 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isHud.cyan }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <p
                    className="text-[9px] uppercase tracking-[0.30em] font-bold"
                    style={{ color: isHud.cyan }}
                  >
                    {REC_TYPE_LABELS[recommendation.type] ?? "Daily Mission"}
                  </p>
                </div>
                <h2
                  className="text-xl font-extrabold mb-1.5 leading-tight"
                  style={{
                    color: isHud.cyan,
                    textShadow: `0 0 14px ${isHud.cyanGlow}`,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {recommendation.headline}
                </h2>
                <p className="text-xs leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.42)" }}>
                  {recommendation.subtext}
                </p>
                <IronSovereignFlowButton onStart={startFlow} label={ctaLabel} />
              </div>
            </div>
          ) : isNeonEmpress ? (
            /* Neon Empress recommendation card */
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: `linear-gradient(160deg, rgba(251,202,173,0.28) 0%, rgba(200,181,238,0.18) 100%)`,
                border: `1.5px solid ${fae.peachBorder}55`,
                boxShadow: `0 0 28px rgba(244,132,95,0.10), 0 4px 18px rgba(140,117,196,0.08)`,
              }}
            >
              <div className="px-5 pt-5 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: fae.peachStrong }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <p
                    className="text-[9px] uppercase tracking-[0.30em] font-bold"
                    style={{ color: fae.peachStrong }}
                  >
                    {REC_TYPE_LABELS[recommendation.type] ?? "Daily Mission"}
                  </p>
                </div>
                <h2
                  className="text-xl font-extrabold mb-1.5 leading-tight"
                  style={{ color: fae.inkText, fontFamily: "system-ui, sans-serif" }}
                >
                  {recommendation.headline}
                </h2>
                <p className="text-xs leading-relaxed mb-5" style={{ color: `${fae.inkText}99` }}>
                  {recommendation.subtext}
                </p>
                <NeonEmpressFlowButton onStart={startFlow} fae={fae} label={ctaLabel} />
              </div>
            </div>
          ) : (
            /* Default recommendation card */
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: `linear-gradient(160deg, ${colors.primary}10 0%, ${colors.primary}04 100%)`,
                border: `1.5px solid ${colors.primary}30`,
              }}
            >
              <div className="px-5 pt-5 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <p
                    className="text-[9px] uppercase tracking-[0.30em] font-bold"
                    style={{ color: `${colors.primary}cc` }}
                  >
                    {REC_TYPE_LABELS[recommendation.type] ?? "Daily Mission"}
                  </p>
                </div>
                <h2
                  className="text-lg font-extrabold mb-1.5 leading-tight"
                  style={{ color: colors.text, fontFamily: "system-ui, sans-serif" }}
                >
                  {recommendation.headline}
                </h2>
                <p className="text-xs leading-relaxed mb-5" style={{ color: colors.textMuted }}>
                  {recommendation.subtext}
                </p>
                <button
                  data-testid="button-begin-flow"
                  onClick={startFlow}
                  className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-[0.18em] transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.background,
                    boxShadow: `0 0 28px ${colors.primaryGlow}40`,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Play size={15} />
                    {ctaLabel}
                  </span>
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── MIDDLE ZONE: QUICK ACTIONS ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16 }}
          data-testid="quick-actions-row"
        >
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => {
              const Icon = QUICK_ACTION_ICONS[action] ?? Zap;
              const isBeginFlow = action === "Begin Flow";
              const onClick = () => {
                if (isBeginFlow) { startFlow(); return; }
                switch (action) {
                  case "Calm Breathing": navigate("/guided-session/phase1_meditation"); break;
                  case "Light Stretch":  navigate("/guided-session/phase1_agility");    break;
                  case "Strength Focus": navigate("/guided-session/phase1_strength");   break;
                  case "Mini Workout":   navigate("/guided-session/phase1_strength");   break;
                  case "Push Cardio":    navigate("/train");                             break;
                  case "Track Progress": navigate("/profile");                           break;
                  case "Review Path":    navigate("/habits");                            break;
                  case "Hydrate":        navigate("/nutrition");                          break;
                  default: break;
                }
              };

              // Iron Sovereign chip
              if (isIronSovereign) {
                return (
                  <button
                    key={action}
                    onClick={onClick}
                    data-testid={`quick-action-${action.toLowerCase().replace(/\s+/g, "-")}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                    style={{
                      backgroundColor: isBeginFlow ? `${isHud.cyan}18` : "rgba(255,255,255,0.05)",
                      border: isBeginFlow ? `1px solid ${isHud.cyan}55` : "1px solid rgba(255,255,255,0.10)",
                      color: isBeginFlow ? isHud.cyan : "rgba(255,255,255,0.65)",
                      boxShadow: isBeginFlow ? `0 0 12px ${isHud.cyanGlow}30` : "none",
                    }}
                  >
                    <Icon size={12} />
                    {action}
                  </button>
                );
              }
              // Neon Empress chip
              if (isNeonEmpress) {
                return (
                  <button
                    key={action}
                    onClick={onClick}
                    data-testid={`quick-action-${action.toLowerCase().replace(/\s+/g, "-")}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all active:scale-95"
                    style={{
                      backgroundColor: isBeginFlow ? fae.peach + "cc" : fae.lavender + "99",
                      border: isBeginFlow ? `1px solid ${fae.peachBorder}88` : `1px solid ${fae.lavenderDeep}44`,
                      color: fae.inkText,
                      boxShadow: isBeginFlow ? `0 2px 8px rgba(244,132,95,0.18)` : "none",
                    }}
                  >
                    <Icon size={12} />
                    {action}
                  </button>
                );
              }
              // Default chip
              return (
                <button
                  key={action}
                  onClick={onClick}
                  data-testid={`quick-action-${action.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={{
                    backgroundColor: isBeginFlow ? `${colors.primary}18` : `${colors.primary}08`,
                    border: isBeginFlow ? `1px solid ${colors.primary}40` : `1px solid ${colors.primary}18`,
                    color: isBeginFlow ? colors.primary : `${colors.text}88`,
                  }}
                >
                  <Icon size={12} />
                  {action}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── SESSIONS TOGGLE ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: isFirstMission && !flowCompletedToday ? 0.38 : 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.22 }}
        >
          <button
            data-testid="button-toggle-sessions"
            onClick={() => setShowSessions(v => !v)}
            className={
              isNeonEmpress
                ? "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all active:scale-[0.99]"
                : "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all active:scale-[0.99]"
            }
            style={
              isNeonEmpress
                ? {
                    backgroundColor: fae.mint,
                    border: `1px solid ${fae.mintFill}66`,
                    boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset",
                  }
                : {
                    backgroundColor: `${colors.surface || colors.background}cc`,
                    border: `1px solid ${colors.surfaceBorder}`,
                  }
            }
          >
            <div className="flex items-center gap-2">
              <Zap
                size={isNeonEmpress ? 14 : 12}
                style={{ color: isNeonEmpress ? fae.inkText : colors.primary }}
                fill={isNeonEmpress ? fae.inkText : "none"}
              />
              <span
                className={
                  isNeonEmpress
                    ? "text-[11px] uppercase tracking-wider font-extrabold"
                    : "text-[10px] uppercase tracking-wider font-bold"
                }
                style={{ color: isNeonEmpress ? fae.inkText : colors.primary }}
              >
                Today's Sessions
              </span>
              <span
                className={
                  isNeonEmpress
                    ? "text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                    : "text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                }
                style={
                  isNeonEmpress
                    ? { backgroundColor: "rgba(45,27,78,0.10)", color: fae.inkText + "cc" }
                    : { backgroundColor: `${colors.primary}15`, color: `${colors.primary}90` }
                }
              >
                ~{totalMins} min
              </span>
            </div>
            {showSessions ? (
              <ChevronUp size={isNeonEmpress ? 16 : 14} style={{ color: isNeonEmpress ? fae.inkText : colors.textMuted }} />
            ) : (
              <ChevronDown size={isNeonEmpress ? 16 : 14} style={{ color: isNeonEmpress ? fae.inkText : colors.textMuted }} />
            )}
          </button>

          <AnimatePresence>
            {showSessions && (
              <motion.div
                key="sessions"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div
                  className="mt-1 rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: `${colors.surface || colors.background}bb`,
                    border: `1px solid ${colors.surfaceBorder}`,
                  }}
                >
                  {buildSessionList(currentWorkoutLevel).map((session, i) => {
                    const Icon = session.icon;
                    const done = flowCompletedToday;
                    const route = `/guided-session/${session.id}`;
                    return (
                      <button
                        type="button"
                        key={session.id}
                        onClick={() => navigate(route)}
                        data-testid={`session-item-${i}`}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 active:bg-white/10"
                        style={{
                          borderTop: i > 0 ? `1px solid ${colors.surfaceBorder}50` : "none",
                          backgroundColor: done ? `${session.color}04` : "transparent",
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: done ? "#22c55e18" : `${session.color}15` }}
                        >
                          {done ? (
                            <CheckCircle2 size={15} style={{ color: "#22c55e" }} />
                          ) : (
                            <Icon size={15} style={{ color: session.color }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight" style={{ color: done ? colors.textMuted : colors.text }}>
                            {session.label}
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: `${colors.textMuted}88` }}>
                            {session.sublabel}
                          </p>
                        </div>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: done ? "#22c55e15" : `${session.color}12`,
                            color: done ? "#22c55e" : `${session.color}cc`,
                          }}
                        >
                          {session.stat}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => navigate("/sleep-settings")}
                    data-testid="link-sleep-settings"
                    className="w-full text-left flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 active:bg-white/10"
                    style={{ borderTop: `1px solid ${colors.surfaceBorder}50` }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "#fbbf2415" }}
                    >
                      <Sparkles size={14} style={{ color: "#fbbf24" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight" style={{ color: colors.text }}>Sleep Optimization</p>
                      <p className="text-[10px] mt-0.5" style={{ color: `${colors.textMuted}88` }}>Choose how the night flow guides you</p>
                    </div>
                    <span className="text-[9px]" style={{ color: colors.textMuted }}>›</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── BOTTOM ZONE: PROGRESS STRIP (streak + readiness + HP/MP) ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: isFirstMission && !flowCompletedToday ? 0.35 : 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          data-testid="progress-strip"
        >
          <div
            className={isNeonEmpress ? "rounded-2xl px-4 py-4 space-y-3" : "rounded-xl px-4 py-3 space-y-3"}
            style={
              isIronSovereign
                ? {
                    backgroundColor: "rgba(0,0,0,0.55)",
                    border: `1.5px solid ${isHud.green}`,
                    boxShadow: `0 0 18px ${isHud.greenGlow}, inset 0 0 12px rgba(34,197,94,0.10)`,
                  }
                : isNeonEmpress
                  ? {
                      background: "linear-gradient(135deg, rgba(207,232,243,0.85) 0%, rgba(220,210,243,0.85) 55%, rgba(212,202,243,0.85) 100%)",
                      border: `2px solid ${fae.peachBorder}`,
                      boxShadow: `0 0 0 1px rgba(255,255,255,0.5) inset, 0 0 18px ${fae.peachStrong}40`,
                    }
                  : {
                      backgroundColor: `${colors.surface || colors.background}cc`,
                      border: `1px solid ${colors.surfaceBorder}`,
                    }
            }
          >
            {/* Row 1: Streak · Readiness bar · Recovery pill */}
            <div className="flex items-center gap-3" data-testid="streak-readiness-row">
              {/* Streak */}
              <div className="flex items-center gap-1 shrink-0">
                <Flame
                  size={12}
                  style={{ color: snap.streak > 0 ? "#f97316" : colors.textMuted }}
                  fill={snap.streak > 0 ? "#f97316" : "none"}
                />
                <span
                  className="text-[11px] font-bold font-mono"
                  style={{ color: snap.streak > 0 ? "#f97316" : colors.textMuted }}
                >
                  {snap.streak}d
                </span>
              </div>

              {/* Readiness bar + label */}
              <div className="flex-1 flex items-center gap-2">
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: isNeonEmpress ? "rgba(255,255,255,0.45)" : `${colors.primary}15` }}
                  data-testid="readiness-bar-track"
                >
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${snap.readinessPercent}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    style={{
                      backgroundColor: isIronSovereign ? isHud.cyan : isNeonEmpress ? fae.peachStrong : colors.primary,
                      boxShadow: isIronSovereign ? `0 0 6px ${isHud.cyanGlow}` : "none",
                    }}
                    data-testid="readiness-bar-fill"
                  />
                </div>
                <span
                  className="text-[10px] font-mono shrink-0"
                  style={{ color: isNeonEmpress ? fae.inkText : colors.textMuted }}
                >
                  {snap.readinessPercent}%
                </span>
              </div>

              {/* Recovery state pill */}
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 capitalize"
                style={{
                  backgroundColor: `${recoveryColor}18`,
                  color: isNeonEmpress ? fae.inkText : recoveryColor,
                  border: `1px solid ${recoveryColor}30`,
                }}
                data-testid="recovery-state-pill"
              >
                {snap.recoveryState}
              </span>
            </div>

            {/* Rows 2–3: HP + MP bars — hidden until 5 flows completed (progressive disclosure) */}
            {showAdvanced && (
              <>
                {/* Row 2: HP bar */}
                <div data-testid="hp-bar-section">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Shield size={9} style={{ color: hpColor }} />
                      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: hpColor }}>HP</span>
                      <span className="text-[9px] ml-0.5" style={{ color: isNeonEmpress ? `${fae.inkText}88` : colors.textMuted }}>Vitality</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold" style={{ color: hpColor }}>
                      {Math.round(stats.hp)} / {maxHp}
                    </span>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: isNeonEmpress ? "rgba(255,255,255,0.45)" : `${hpColor}18` }}
                    data-testid="hp-bar-track"
                  >
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${hpPct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      style={
                        isNeonEmpress
                          ? { background: `linear-gradient(90deg, #22c55e 0%, ${fae.peach} 100%)` }
                          : { backgroundColor: hpColor, boxShadow: `0 0 6px ${hpColor}60` }
                      }
                      data-testid="hp-bar-fill"
                    />
                  </div>
                </div>

                {/* Row 3: MP bar */}
                <div data-testid="mana-bar-section">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Zap size={9} style={{ color: manaColor }} />
                      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: manaColor }}>MP</span>
                      <span className="text-[9px] ml-0.5" style={{ color: isNeonEmpress ? `${fae.inkText}88` : colors.textMuted }}>Meditation</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold" style={{ color: manaColor }}>
                      {Math.round(stats.mana)} / {maxMana}
                    </span>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: isNeonEmpress ? "rgba(255,255,255,0.45)" : `${manaColor}18` }}
                    data-testid="mana-bar-track"
                  >
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${manaBarPct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
                      style={{ backgroundColor: manaColor, boxShadow: `0 0 6px ${manaColor}60` }}
                      data-testid="mana-bar-fill"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* ── COACH INSIGHT (post-5 flows progressive disclosure) ───────── */}
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={
              isNeonEmpress
                ? "rounded-xl px-4 py-3 flex items-start gap-3 relative overflow-hidden"
                : "rounded-xl px-4 py-3 flex items-start gap-3"
            }
            style={
              isNeonEmpress
                ? {
                    backgroundColor: fae.lavender,
                    border: `1px solid ${fae.lavenderDeep}33`,
                    backgroundImage:
                      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='white' stroke-opacity='0.45' stroke-width='1.2' stroke-linecap='round'><path d='M10 50 Q 25 25, 45 40 T 80 35 T 115 50'/><path d='M5 80 Q 30 65, 50 85 T 90 80 T 120 95'/><path d='M60 10 Q 75 25, 65 45 T 80 75'/><path d='M20 110 Q 35 95, 55 105'/></g></svg>\")",
                    backgroundSize: "180px 180px",
                    backgroundRepeat: "repeat",
                  }
                : { backgroundColor: `${colors.primary}08`, border: `1px solid ${colors.primary}15` }
            }
            data-testid="coach-insight-card"
          >
            <div
              className={
                isNeonEmpress
                  ? "w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  : "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              }
              style={
                isNeonEmpress
                  ? { backgroundColor: fae.lavenderDeep + "55", border: `1px solid ${fae.lavenderDeep}77` }
                  : { backgroundColor: `${colors.primary}20` }
              }
            >
              <Brain size={isNeonEmpress ? 16 : 12} style={{ color: isNeonEmpress ? fae.inkText : colors.primary }} />
            </div>
            <div>
              <p
                className={
                  isNeonEmpress
                    ? "text-[10px] uppercase tracking-[0.18em] font-extrabold mb-0.5"
                    : "text-[9px] uppercase tracking-[0.14em] font-bold mb-0.5"
                }
                style={{ color: isNeonEmpress ? fae.inkText : `${colors.primary}80` }}
              >
                Coach
              </p>
              <p
                className={isNeonEmpress ? "text-sm leading-relaxed" : "text-xs leading-relaxed"}
                style={{ color: isNeonEmpress ? fae.inkText : `${colors.text}cc` }}
              >
                {homeData.insight ?? "Consistency is becoming your baseline. Each session builds the next."}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── WORKOUT BUILDER (post-5 flows progressive disclosure) ───── */}
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <WorkoutBuilderSection playerId={player.id} />
          </motion.div>
        )}

      </div>
    </SystemLayout>
  );
}

// ── Helper components (unchanged) ─────────────────────────────────────────────

function SegmentedXpBar({
  percent,
  fill,
  glow,
  segments = 24,
}: {
  percent: number;
  fill: string;
  glow: string;
  segments?: number;
}) {
  const filled = Math.round((Math.max(0, Math.min(100, percent)) / 100) * segments);
  return (
    <div className="w-full flex gap-[2px] h-3 items-center" data-testid="xp-bar-track">
      {Array.from({ length: segments }).map((_, i) => {
        const on = i < filled;
        return (
          <div
            key={i}
            className="flex-1 h-full rounded-[2px]"
            style={{
              backgroundColor: on ? fill : "rgba(255,255,255,0.08)",
              boxShadow: on ? `0 0 6px ${glow}` : "none",
              transition: "background-color 0.4s ease, box-shadow 0.4s ease",
            }}
            data-testid={i === 0 ? "xp-bar-fill" : undefined}
          />
        );
      })}
    </div>
  );
}

function IronSovereignFlowButton({ onStart, label = "Begin Daily Flow" }: { onStart: () => void; label?: string }) {
  return (
    <button
      data-testid="button-begin-flow"
      onClick={onStart}
      className="group relative w-full rounded-2xl transition-all active:scale-[0.985] overflow-hidden"
      style={{
        padding: "18px 18px",
        background: "linear-gradient(180deg, rgba(34,211,238,0.95) 0%, rgba(14,165,233,0.95) 100%)",
        border: "2.5px solid #22c55e",
        boxShadow:
          "0 0 0 1px rgba(34,197,94,0.35), 0 0 22px rgba(34,197,94,0.55), 0 0 38px rgba(34,211,238,0.45), inset 0 0 18px rgba(255,255,255,0.18)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes ironWave {
          0%, 100% { transform: scaleY(0.6); }
          50%     { transform: scaleY(1); }
        }
      `}</style>
      <div className="flex items-center justify-center gap-3">
        <Waveform side="left" />
        <span
          className="flex items-center gap-2 font-extrabold uppercase"
          style={{
            color: "#0a1f2c",
            fontSize: 16,
            letterSpacing: "0.14em",
            textShadow: "0 0 10px rgba(255,255,255,0.45)",
          }}
        >
          <Play size={16} fill="#0a1f2c" />
          {label}
        </span>
        <Waveform side="right" />
      </div>
    </button>
  );
}

function LaurelLevel({ level, gold, glow }: { level: number; gold: string; glow: string }) {
  return (
    <div className="flex items-center gap-1" data-testid="text-player-level">
      <LaurelBranch side="left" gold={gold} />
      <span
        style={{
          color: gold,
          fontFamily: "'Brush Script MT', 'Apple Chancery', 'Lucida Handwriting', cursive, serif",
          fontStyle: "italic",
          fontWeight: 700,
          fontSize: 24,
          lineHeight: 1,
          textShadow: `0 1px 0 rgba(255,255,255,0.65), 0 0 10px ${glow}`,
          letterSpacing: "0.02em",
        }}
      >
        Lv {level}
      </span>
      <LaurelBranch side="right" gold={gold} />
    </div>
  );
}

function LaurelBranch({ side, gold }: { side: "left" | "right"; gold: string }) {
  const transform = side === "right" ? "scaleX(-1)" : undefined;
  const leaves = [
    { cx: 4,  cy: 28, rx: 1.6, ry: 3.6, rot: -55 },
    { cx: 5,  cy: 22, rx: 1.6, ry: 3.6, rot: -50 },
    { cx: 6,  cy: 16, rx: 1.6, ry: 3.4, rot: -45 },
    { cx: 7.5,cy: 10, rx: 1.5, ry: 3.2, rot: -38 },
    { cx: 9,  cy: 5,  rx: 1.4, ry: 2.8, rot: -28 },
    { cx: 7,  cy: 26, rx: 1.5, ry: 3.4, rot:  60 },
    { cx: 8,  cy: 19, rx: 1.5, ry: 3.2, rot:  55 },
    { cx: 9,  cy: 13, rx: 1.4, ry: 3.0, rot:  48 },
  ];
  return (
    <svg width={22} height={36} viewBox="0 0 22 36" style={{ transform, display: "block" }} aria-hidden>
      <path d="M3 34 Q 6 22 9 10 Q 10 6 11 3" stroke={gold} strokeWidth={1.3} fill="none" strokeLinecap="round" opacity={0.85} />
      <g fill={gold} opacity={0.92}>
        {leaves.map((l, i) => (
          <ellipse key={i} cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry} transform={`rotate(${l.rot} ${l.cx} ${l.cy})`} />
        ))}
      </g>
    </svg>
  );
}

function PastelGradientXpBar({ percent }: { percent: number }) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="w-full h-2.5 rounded-full overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.55)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.4)" }}
      data-testid="xp-bar-track"
    >
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{
          background: "linear-gradient(90deg, #f7e5b6 0%, #f4a6c8 50%, #b59cf2 100%)",
          boxShadow: "0 0 6px rgba(180,150,240,0.55)",
        }}
        data-testid="xp-bar-fill"
      />
    </div>
  );
}

function NeonEmpressFlowButton({
  onStart,
  fae,
  label = "Begin Daily Flow",
}: {
  onStart: () => void;
  fae: { peach: string; peachStrong: string; skyBlue: string; inkText: string };
  label?: string;
}) {
  return (
    <button
      data-testid="button-begin-flow"
      onClick={onStart}
      className="group relative w-full rounded-2xl transition-all active:scale-[0.985]"
      style={{
        padding: "18px 18px",
        background: `linear-gradient(180deg, ${fae.peach} 0%, #f7baa0 100%)`,
        border: `2px solid ${fae.skyBlue}`,
        boxShadow: `0 0 0 4px rgba(255,255,255,0.55), 0 0 0 6px ${fae.skyBlue}66, 0 8px 18px rgba(244,132,95,0.20)`,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <span
        className="flex items-center justify-center gap-3 font-extrabold uppercase"
        style={{ color: fae.inkText, fontSize: 16, letterSpacing: "0.18em" }}
      >
        <Play size={16} strokeWidth={2.4} />
        {label}
      </span>
    </button>
  );
}

function Waveform({ side }: { side: "left" | "right" }) {
  const heights = [6, 12, 18, 22, 14, 24, 10, 16];
  const bars = side === "left" ? heights : [...heights].reverse();
  return (
    <div className="flex items-center gap-[3px] h-6 shrink-0" style={{ width: 56 }} aria-hidden>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: 2,
            height: h,
            backgroundColor: "#0a1f2c",
            borderRadius: 1,
            opacity: 0.85,
            transformOrigin: "center",
            animation: `ironWave 1.1s ease-in-out ${i * 0.08}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function AutoSwitchBanner({ navigate }: { navigate: (to: string) => void }) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(shouldPromptAutoSwitch());
    const handler = () => setShow(shouldPromptAutoSwitch());
    window.addEventListener("ascend:vitality-flow-changed", handler);
    window.addEventListener("ascend:sleep-mode-changed", handler);
    return () => {
      window.removeEventListener("ascend:vitality-flow-changed", handler);
      window.removeEventListener("ascend:sleep-mode-changed", handler);
    };
  }, []);

  if (!show) return null;

  const accept = () => { setSleepMode("adaptive"); setShow(false); navigate("/sleep-settings"); };
  const dismiss = () => { dismissAutoSwitchPrompt(); setShow(false); };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-3 flex items-start gap-3"
      style={{
        backgroundColor: "rgba(251,191,36,0.08)",
        border: "1px solid rgba(251,191,36,0.35)",
        boxShadow: "0 0 22px rgba(251,191,36,0.18)",
      }}
      data-testid="auto-switch-banner"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: "rgba(251,191,36,0.18)" }}
      >
        <Sparkles size={16} style={{ color: "#fbbf24" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: "#fde68a" }}>You're doing great</p>
        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: colors.textMuted }}>
          Switch to Adaptive Mode? It'll quietly trim guidance you no longer need.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={accept}
            data-testid="button-accept-adaptive"
            className="text-[11px] font-bold px-3 py-1 rounded-md"
            style={{ backgroundColor: "#fbbf24", color: "#1a1208" }}
          >
            Switch to Adaptive
          </button>
          <button
            type="button"
            onClick={dismiss}
            data-testid="button-dismiss-adaptive"
            className="text-[11px] px-2 py-1 rounded-md"
            style={{ color: colors.textMuted }}
          >
            Not now
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 p-1 rounded-md"
        style={{ color: colors.textMuted }}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
