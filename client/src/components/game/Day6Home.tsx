import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Brain, Wind, Dumbbell, Shield, Zap, Sparkles,
  X, Palette, Flame, CheckCircle2,
} from "lucide-react";
import { CustomizePanel } from "./CustomizePanel";
import {
  shouldPromptAutoSwitch,
  setMode as setSleepMode,
  dismissAutoSwitchPrompt,
} from "@/lib/sleepModeStore";
import { useLocation } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { DailyFlowEngine } from "./DailyFlowEngine";
import { SystemLayout } from "./SystemLayout";
import { buildPhase1Activities, type CategoryTiers } from "@/lib/activityEngine";
import { buildWorkoutActivity } from "@/lib/workoutPlans";
import { getWorkoutLevel, getCardioPrefs } from "@/lib/workoutProgressStore";
import {
  getStats, recordSleepCheck, recordBreathingSession,
  getHPColor, getManaColor, getMaxHP, getMaxMana,
  initLevelBaseline, STATS_CHANGED_EVENT, type GameStats,
} from "@/lib/statsSystem";
import { markFlowCompleted } from "@/lib/userState";
import { computeXPState } from "@/lib/xpSystem";
import { clearFlow, clearSession } from "@/lib/sessionPersistenceStore";
import { assembleDailyProfile, getDailyRecommendation } from "@/lib/dailyRecommendationEngine";
import type { DailyRecommendation } from "@/lib/dailyRecommendationEngine";
import { DEFAULT_PROFILE } from "@/lib/breathingProgressionSystem";

// ── Flow module types + builder ────────────────────────────────────────────────

interface FlowModule {
  id:    string;
  label: string;
  mins:  number;
  color: string;
}

const ACTIVITY_COLORS: Record<string, string> = {
  phase1_meditation:       "#3b82f6",
  phase1_agility:          "#22c55e",
  phase1_recovery_stretch: "#22c55e",
};

function buildFlowModules(
  activities: Array<{ id: string; activityName: string; duration: number }>,
): FlowModule[] {
  return activities.map(a => ({
    id:    a.id,
    label: a.activityName,
    mins:  Math.max(1, Math.ceil(a.duration / 60)),
    color: ACTIVITY_COLORS[a.id] ?? "#ef4444",
  }));
}

// ── Fixed quick actions (always shown, low-friction standalone paths) ──────────

const FIXED_QUICK_ACTIONS = [
  { label: "Breathe", icon: Wind,     path: "/guided-session/phase1_meditation" },
  { label: "Stretch", icon: Sparkles, path: "/guided-session/phase1_agility"    },
  { label: "Train",   icon: Dumbbell, path: "/train"                             },
  { label: "Coach",   icon: Brain,    path: "/coach"                             },
] as const;

// ── CTA label adapts to recommendation type ────────────────────────────────────

const CTA_LABELS: Record<string, string> = {
  MOMENTUM_RECOVERY:       "Restart Your Flow",
  RECOVERY_SESSION:        "Begin Recovery Flow",
  TRAINING_READINESS_HIGH: "Begin Daily Flow",
  CONTINUE_MOMENTUM:       "Continue Flow",
  BEGIN_DAILY_FLOW:        "Begin Daily Flow",
};

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

// ── Flow module pill sub-component ────────────────────────────────────────────

function ModulePill({
  m,
  isIronSovereign,
  isNeonEmpress,
  inkText,
}: {
  m: FlowModule;
  isIronSovereign: boolean;
  isNeonEmpress:   boolean;
  inkText:         string;
}) {
  if (isIronSovereign) {
    return (
      <span
        className="text-[10px] px-2.5 py-1 rounded-full font-medium"
        style={{
          backgroundColor: `${m.color}18`,
          border:          `1px solid ${m.color}33`,
          color:           `${m.color}dd`,
        }}
      >
        {m.label} · {m.mins}m
      </span>
    );
  }
  if (isNeonEmpress) {
    return (
      <span
        className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
        style={{
          backgroundColor: "rgba(255,255,255,0.55)",
          border:          "1px solid rgba(255,255,255,0.75)",
          color:           `${inkText}bb`,
        }}
      >
        {m.label} · {m.mins}m
      </span>
    );
  }
  return (
    <span
      className="text-[10px] px-2.5 py-1 rounded-full font-medium"
      style={{
        backgroundColor: `${m.color}12`,
        border:          `1px solid ${m.color}28`,
        color:           `${m.color}cc`,
      }}
    >
      {m.label} · {m.mins}m
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function Day6Home({ homeData, playerData, player, scalingData }: Props) {
  const { backgroundTheme } = useTheme();
  const colors          = backgroundTheme.colors;
  const isIronSovereign = backgroundTheme.id === "male";
  const isNeonEmpress   = backgroundTheme.id === "female";

  const isHud = {
    cyan:      "#22d3ee",
    cyanGlow:  "rgba(34,211,238,0.55)",
    green:     "#22c55e",
    greenGlow: "rgba(34,197,94,0.55)",
    purple:    "#a855f7",
    purpleGlow:"rgba(168,85,247,0.45)",
  };

  const fae = {
    peach:        "#fbcaad",
    peachStrong:  "#f4845f",
    peachBorder:  "#f4a78a",
    skyBlue:      "#a9d3f0",
    mint:         "#bce8c9",
    mintFill:     "#7ed8a0",
    lavender:     "#c8b9ee",
    lavenderDeep: "#8d75c4",
    purple:       "#7c3aed",
    inkText:      "#2d1b4e",
    gold:         "#c89530",
    goldGlow:     "rgba(200,149,48,0.55)",
  };

  const [, navigate] = useLocation();
  const [flowActive,        setFlowActive]        = useState(false);
  const [showCustomize,     setShowCustomize]     = useState(false);
  const [flowCompletedDate, setFlowCompletedDate] = useState(
    () => localStorage.getItem("ascend_light_movement_completed") ?? "",
  );
  const [stats, setStats] = useState<GameStats>(() => getStats());
  const today              = new Date().toISOString().split("T")[0];
  const flowCompletedToday = flowCompletedDate === today;

  // Progressive disclosure: advanced stats visible after 5 completed flows
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

  // Daily recommendation — memoized by date + flow-completion state
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, flowCompletedToday]);

  const tiers: CategoryTiers = {
    strength:   scalingData?.trainingScaling?.strength?.tier   ?? 1,
    agility:    scalingData?.trainingScaling?.agility?.tier    ?? 1,
    meditation: scalingData?.trainingScaling?.meditation?.tier ?? 1,
    vitality:   scalingData?.trainingScaling?.vitality?.tier   ?? 1,
  };
  const [currentWorkoutLevel] = useState(() => getWorkoutLevel());
  const flowVariant = recommendation.flowVariant;

  const activities = (() => {
    const raw = buildPhase1Activities(homeData.onboardingDay, tiers, flowVariant);
    // Recovery: no strength activity to replace.
    // Push: activityEngine already boosted the tier — preserve it.
    // Light / Full: replace phase1_strength with the Workout Builder activity.
    if (flowVariant === "recovery" || flowVariant === "push") return raw;
    const cardioPrefs = getCardioPrefs();
    return raw.map(a => {
      if (a.id === "phase1_strength") {
        const levelActivity = buildWorkoutActivity(currentWorkoutLevel, {
          intensity: cardioPrefs.intensity,
          position:  cardioPrefs.position,
        });
        return { ...levelActivity, id: "phase1_strength" };
      }
      return a;
    });
  })();

  const flowModules = buildFlowModules(activities);
  const totalMins   = Math.ceil(activities.reduce((s, a) => s + a.duration, 0) / 60);

  const xp = computeXPState(
    playerData?.totalExp ?? 0,
    playerData?.level    ?? 2,
    playerData?.exp      ?? 0,
    playerData?.maxExp   ?? 100,
  );

  const refreshStats = useCallback(() => setStats(getStats()), []);
  const currentLevel = playerData?.level ?? 1;
  const maxHp        = getMaxHP(currentLevel);
  const maxMana      = getMaxMana(currentLevel);
  const displayLevel = playerData?.level ?? 2;

  const hpColor    = isIronSovereign ? isHud.green  : isNeonEmpress ? "#22c55e"   : getHPColor((stats.hp / maxHp) * 100);
  const manaColor  = isIronSovereign ? isHud.purple : isNeonEmpress ? fae.purple  : getManaColor((stats.mana / maxMana) * 100);
  const hpPct      = Math.min(100, Math.max(0, (stats.hp   / maxHp)   * 100));
  const manaBarPct = Math.min(100, Math.max(0, (stats.mana / maxMana) * 100));

  const snap = recommendation.progressSnapshot;
  const RECOVERY_COLORS: Record<string, string> = {
    energized: "#22c55e",
    normal:    "#3b82f6",
    fatigued:  "#f59e0b",
  };
  const recoveryColor = RECOVERY_COLORS[snap.recoveryState] ?? "#3b82f6";
  const ctaLabel      = CTA_LABELS[recommendation.type] ?? "Begin Daily Flow";

  // ── Side effects ───────────────────────────────────────────────────────────
  useEffect(() => { initLevelBaseline(currentLevel); }, [currentLevel]);

  useEffect(() => {
    const handler = () => setStats(getStats());
    window.addEventListener(STATS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(STATS_CHANGED_EVENT, handler);
  }, []);

  useEffect(() => {
    const sleepHandler = (e: Event) => {
      const detail  = (e as CustomEvent<{ sleptWell: boolean }>).detail;
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

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleFlowComplete = (completedIds: string[], _bonus: boolean) => {
    if (completedIds.length > 0) {
      const newStats = markFlowCompleted(completedIds);
      setStats(newStats);
      if (completedIds.includes("phase1_meditation")) {
        const updated = recordBreathingSession(true);
        setStats(updated);
      }
      const dateStr  = new Date().toISOString().split("T")[0];
      setFlowCompletedDate(dateStr);
      localStorage.setItem("ascend_first_mission_done", "1");
      const newCount = completedFlowsEver + 1;
      setCompletedFlowsEver(newCount);
      try { localStorage.setItem("ascend_total_flows_completed", String(newCount)); } catch { /* ignore */ }
    }
    setFlowActive(false);
    refreshStats();
  };

  const startFlow = () => { clearFlow(); clearSession(); setFlowActive(true); };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SystemLayout>
      <CustomizePanel open={showCustomize} onClose={() => setShowCustomize(false)} />

      <AnimatePresence>
        {flowActive && (
          <DailyFlowEngine
            activities={activities}
            flowVariant={flowVariant}
            playerId={player.id}
            onComplete={handleFlowComplete}
            onCancel={() => setFlowActive(false)}
            isOnboardingComplete={true}
          />
        )}
      </AnimatePresence>

      <div
        className="flex flex-col gap-5 py-6 px-3 max-w-md mx-auto w-full"
        data-testid="day6-home"
      >
        <AutoSwitchBanner navigate={navigate} />

        {/* ── HEADER: Level badge + XP bar ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          data-testid="daily-status-section"
          className="pt-1"
        >
          <div className="flex items-start justify-between mb-2.5">
            <div />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCustomize(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
                style={{
                  backgroundColor: `${colors.primary}15`,
                  color:           colors.primary,
                  border:          `1px solid ${colors.primary}35`,
                  boxShadow:       `0 0 10px ${colors.primaryGlow}`,
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
                      color:         isHud.cyan,
                      fontSize:      38,
                      letterSpacing: "0.02em",
                      textShadow:    `0 0 14px ${isHud.cyanGlow}, 0 0 28px ${isHud.cyanGlow}`,
                      fontFamily:    "system-ui, sans-serif",
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
                    color:           colors.primary,
                    border:          `1px solid ${colors.primary}30`,
                  }}
                  data-testid="text-player-level"
                >
                  Lv {displayLevel}
                </span>
              )}
            </div>
          </div>

          <div data-testid="xp-progress-section">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>XP</span>
              <span className="text-[10px] font-mono"               style={{ color: colors.textMuted }}>{xp.exp} / {xp.maxExp}</span>
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

        {/* ═══════════════════════════════════════════════════════════════
            ZONE 1 — TODAY'S JOURNEY
            The dominant focal point. Calibration-path-aware journey title,
            state-aware subtext, flow module pills, and the main CTA.
        ════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.10 }}
          data-testid="recommendation-card"
        >
          {flowCompletedToday ? (

            /* ── Completion state ───────────────────────────────────── */
            <div
              className="w-full rounded-2xl px-5 py-8 flex flex-col items-center justify-center gap-3 text-center"
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
                boxShadow: isIronSovereign ? `0 0 30px ${isHud.greenGlow}30` : "none",
              }}
              data-testid="text-flow-completed"
            >
              <CheckCircle2 size={30} style={{ color: "#22c55e" }} />
              <div>
                <p className="text-base font-extrabold" style={{ color: "#22c55e" }}>Flow Complete</p>
                <p className="text-xs mt-0.5"           style={{ color: colors.textMuted }}>{totalMins} min logged today</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {flowModules.map(m => (
                  <ModulePill key={m.id} m={m} isIronSovereign={isIronSovereign} isNeonEmpress={isNeonEmpress} inkText={fae.inkText} />
                ))}
              </div>
            </div>

          ) : isIronSovereign ? (

            /* ── Iron Sovereign journey card ────────────────────────── */
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(160deg, rgba(34,211,238,0.10) 0%, rgba(14,165,233,0.04) 100%)",
                border:     "1.5px solid rgba(34,211,238,0.32)",
                boxShadow:  "0 0 40px rgba(34,211,238,0.10), inset 0 0 20px rgba(34,211,238,0.03)",
              }}
            >
              <div className="px-5 pt-6 pb-5 space-y-4">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isHud.cyan }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span
                    className="text-[9px] uppercase tracking-[0.30em] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      color:           isHud.cyan,
                      backgroundColor: `${isHud.cyan}12`,
                      border:          `1px solid ${isHud.cyan}30`,
                    }}
                  >
                    {recommendation.calibrationPath} Path
                  </span>
                </div>

                <div>
                  <h2
                    className="font-extrabold leading-none mb-1.5"
                    style={{
                      color:         isHud.cyan,
                      fontSize:      28,
                      textShadow:    `0 0 18px ${isHud.cyanGlow}`,
                      fontFamily:    "system-ui, sans-serif",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {recommendation.journeyTitle}
                  </h2>
                  <p
                    className="text-[11px] font-medium"
                    style={{ color: "rgba(34,211,238,0.60)" }}
                  >
                    {recommendation.headline}
                  </p>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
                  {recommendation.subtext}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {flowModules.map(m => (
                    <ModulePill key={m.id} m={m} isIronSovereign={isIronSovereign} isNeonEmpress={isNeonEmpress} inkText={fae.inkText} />
                  ))}
                </div>

                <IronSovereignFlowButton onStart={startFlow} label={ctaLabel} />
              </div>
            </div>

          ) : isNeonEmpress ? (

            /* ── Neon Empress journey card ───────────────────────────── */
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: `linear-gradient(160deg, rgba(251,202,173,0.28) 0%, rgba(200,181,238,0.18) 100%)`,
                border:     `1.5px solid ${fae.peachBorder}55`,
                boxShadow:  `0 0 28px rgba(244,132,95,0.10), 0 4px 18px rgba(140,117,196,0.08)`,
              }}
            >
              <div className="px-5 pt-6 pb-5 space-y-4">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: fae.peachStrong }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span
                    className="text-[9px] uppercase tracking-[0.30em] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      color:           fae.inkText,
                      backgroundColor: `${fae.peach}cc`,
                      border:          `1px solid ${fae.peachBorder}77`,
                    }}
                  >
                    {recommendation.calibrationPath} Path
                  </span>
                </div>

                <div>
                  <h2
                    className="font-extrabold leading-none mb-1.5"
                    style={{
                      color:         fae.inkText,
                      fontSize:      28,
                      fontFamily:    "system-ui, sans-serif",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {recommendation.journeyTitle}
                  </h2>
                  <p
                    className="text-[11px] font-medium"
                    style={{ color: `${fae.inkText}88` }}
                  >
                    {recommendation.headline}
                  </p>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: `${fae.inkText}77` }}>
                  {recommendation.subtext}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {flowModules.map(m => (
                    <ModulePill key={m.id} m={m} isIronSovereign={isIronSovereign} isNeonEmpress={isNeonEmpress} inkText={fae.inkText} />
                  ))}
                </div>

                <NeonEmpressFlowButton onStart={startFlow} fae={fae} label={ctaLabel} />
              </div>
            </div>

          ) : (

            /* ── Default journey card ────────────────────────────────── */
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: `linear-gradient(160deg, ${colors.primary}10 0%, ${colors.primary}04 100%)`,
                border:     `1.5px solid ${colors.primary}30`,
              }}
            >
              <div className="px-5 pt-6 pb-5 space-y-4">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span
                    className="text-[9px] uppercase tracking-[0.30em] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      color:           `${colors.primary}dd`,
                      backgroundColor: `${colors.primary}12`,
                      border:          `1px solid ${colors.primary}28`,
                    }}
                  >
                    {recommendation.calibrationPath} Path
                  </span>
                </div>

                <div>
                  <h2
                    className="font-extrabold leading-none mb-1.5"
                    style={{
                      color:         colors.text,
                      fontSize:      26,
                      fontFamily:    "system-ui, sans-serif",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {recommendation.journeyTitle}
                  </h2>
                  <p
                    className="text-[11px] font-medium"
                    style={{ color: `${colors.primary}99` }}
                  >
                    {recommendation.headline}
                  </p>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>
                  {recommendation.subtext}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {flowModules.map(m => (
                    <ModulePill key={m.id} m={m} isIronSovereign={isIronSovereign} isNeonEmpress={isNeonEmpress} inkText={fae.inkText} />
                  ))}
                </div>

                <button
                  data-testid="button-begin-flow"
                  onClick={startFlow}
                  className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-[0.18em] transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: colors.primary,
                    color:           colors.background,
                    boxShadow:       `0 0 28px ${colors.primaryGlow}40`,
                    fontFamily:      "system-ui, sans-serif",
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

        {/* ═══════════════════════════════════════════════════════════════
            ZONE 2 — QUICK ACTIONS
            4 fixed chips. Low-friction standalone paths.
            Always shown so the user can act independently of the full flow.
        ════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
          data-testid="quick-actions-row"
        >
          <div className="grid grid-cols-4 gap-2">
            {FIXED_QUICK_ACTIONS.map(({ label, icon: Icon, path }) => {
              if (isIronSovereign) {
                return (
                  <button
                    key={label}
                    onClick={() => navigate(path)}
                    data-testid={`quick-action-${label.toLowerCase()}`}
                    className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl transition-all active:scale-95"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      border:          "1px solid rgba(255,255,255,0.09)",
                    }}
                  >
                    <Icon size={18} style={{ color: isHud.cyan }} />
                    <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.50)" }}>{label}</span>
                  </button>
                );
              }
              if (isNeonEmpress) {
                return (
                  <button
                    key={label}
                    onClick={() => navigate(path)}
                    data-testid={`quick-action-${label.toLowerCase()}`}
                    className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl transition-all active:scale-95"
                    style={{
                      backgroundColor: `${fae.lavender}aa`,
                      border:          `1px solid ${fae.lavenderDeep}33`,
                    }}
                  >
                    <Icon size={18} style={{ color: fae.lavenderDeep }} />
                    <span className="text-[10px] font-semibold" style={{ color: `${fae.inkText}bb` }}>{label}</span>
                  </button>
                );
              }
              return (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  data-testid={`quick-action-${label.toLowerCase()}`}
                  className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl transition-all active:scale-95"
                  style={{
                    backgroundColor: `${colors.primary}08`,
                    border:          `1px solid ${colors.primary}18`,
                  }}
                >
                  <Icon size={18} style={{ color: colors.primary }} />
                  <span className="text-[10px] font-medium" style={{ color: `${colors.text}77` }}>{label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            ZONE 3 — STATUS SNAPSHOT
            Minimal passive information. Streak · Readiness · Recovery.
            HP/MP visible only after 5 flows (progressive disclosure).
        ════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.26 }}
          data-testid="progress-strip"
        >
          <div
            className={isNeonEmpress ? "rounded-2xl px-4 py-3.5 space-y-2.5" : "rounded-xl px-4 py-3 space-y-2.5"}
            style={
              isIronSovereign
                ? {
                    backgroundColor: "rgba(0,0,0,0.55)",
                    border:          `1.5px solid ${isHud.green}`,
                    boxShadow:       `0 0 18px ${isHud.greenGlow}, inset 0 0 12px rgba(34,197,94,0.10)`,
                  }
                : isNeonEmpress
                  ? {
                      background: "linear-gradient(135deg, rgba(207,232,243,0.85) 0%, rgba(220,210,243,0.85) 55%, rgba(212,202,243,0.85) 100%)",
                      border:     `2px solid ${fae.peachBorder}`,
                      boxShadow:  `0 0 0 1px rgba(255,255,255,0.5) inset, 0 0 18px ${fae.peachStrong}40`,
                    }
                  : {
                      backgroundColor: `${colors.surface || colors.background}cc`,
                      border:          `1px solid ${colors.surfaceBorder}`,
                    }
            }
          >
            {/* Streak · Readiness bar · Recovery pill */}
            <div className="flex items-center gap-3" data-testid="streak-readiness-row">
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
                      boxShadow:       isIronSovereign ? `0 0 6px ${isHud.cyanGlow}` : "none",
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

              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 capitalize"
                style={{
                  backgroundColor: `${recoveryColor}18`,
                  color:           isNeonEmpress ? fae.inkText : recoveryColor,
                  border:          `1px solid ${recoveryColor}30`,
                }}
                data-testid="recovery-state-pill"
              >
                {snap.recoveryState}
              </span>
            </div>

            {/* HP + MP (progressive disclosure: 5+ flows) */}
            {showAdvanced && (
              <>
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

                <div data-testid="mana-bar-section">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Zap  size={9} style={{ color: manaColor }} />
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

      </div>
    </SystemLayout>
  );
}

// ── Helper components ──────────────────────────────────────────────────────────

function SegmentedXpBar({
  percent, fill, glow, segments = 24,
}: {
  percent: number; fill: string; glow: string; segments?: number;
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
              boxShadow:       on ? `0 0 6px ${glow}` : "none",
              transition:      "background-color 0.4s ease, box-shadow 0.4s ease",
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
        padding:    "18px 18px",
        background: "linear-gradient(180deg, rgba(34,211,238,0.95) 0%, rgba(14,165,233,0.95) 100%)",
        border:     "2.5px solid #22c55e",
        boxShadow:
          "0 0 0 1px rgba(34,197,94,0.35), 0 0 22px rgba(34,197,94,0.55), 0 0 38px rgba(34,211,238,0.45), inset 0 0 18px rgba(255,255,255,0.18)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes ironWave {
          0%, 100% { transform: scaleY(0.6); }
          50%      { transform: scaleY(1); }
        }
      `}</style>
      <div className="flex items-center justify-center gap-3">
        <Waveform side="left" />
        <span
          className="flex items-center gap-2 font-extrabold uppercase"
          style={{
            color:         "#0a1f2c",
            fontSize:      16,
            letterSpacing: "0.14em",
            textShadow:    "0 0 10px rgba(255,255,255,0.45)",
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
          color:         gold,
          fontFamily:    "'Brush Script MT', 'Apple Chancery', 'Lucida Handwriting', cursive, serif",
          fontStyle:     "italic",
          fontWeight:    700,
          fontSize:      24,
          lineHeight:    1,
          textShadow:    `0 1px 0 rgba(255,255,255,0.65), 0 0 10px ${glow}`,
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
    { cx: 4,   cy: 28, rx: 1.6, ry: 3.6, rot: -55 },
    { cx: 5,   cy: 22, rx: 1.6, ry: 3.6, rot: -50 },
    { cx: 6,   cy: 16, rx: 1.6, ry: 3.4, rot: -45 },
    { cx: 7.5, cy: 10, rx: 1.5, ry: 3.2, rot: -38 },
    { cx: 9,   cy: 5,  rx: 1.4, ry: 2.8, rot: -28 },
    { cx: 7,   cy: 26, rx: 1.5, ry: 3.4, rot:  60 },
    { cx: 8,   cy: 19, rx: 1.5, ry: 3.2, rot:  55 },
    { cx: 9,   cy: 13, rx: 1.4, ry: 3.0, rot:  48 },
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
          boxShadow:  "0 0 6px rgba(180,150,240,0.55)",
        }}
        data-testid="xp-bar-fill"
      />
    </div>
  );
}

function NeonEmpressFlowButton({
  onStart, fae, label = "Begin Daily Flow",
}: {
  onStart: () => void;
  fae:     { peach: string; peachStrong: string; skyBlue: string; inkText: string };
  label?:  string;
}) {
  return (
    <button
      data-testid="button-begin-flow"
      onClick={onStart}
      className="group relative w-full rounded-2xl transition-all active:scale-[0.985]"
      style={{
        padding:    "18px 18px",
        background: `linear-gradient(180deg, ${fae.peach} 0%, #f7baa0 100%)`,
        border:     `2px solid ${fae.skyBlue}`,
        boxShadow:  `0 0 0 4px rgba(255,255,255,0.55), 0 0 0 6px ${fae.skyBlue}66, 0 8px 18px rgba(244,132,95,0.20)`,
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
  const bars    = side === "left" ? heights : [...heights].reverse();
  return (
    <div className="flex items-center gap-[3px] h-6 shrink-0" style={{ width: 56 }} aria-hidden>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width:           2,
            height:          h,
            backgroundColor: "#0a1f2c",
            borderRadius:    1,
            opacity:         0.85,
            transformOrigin: "center",
            animation:       `ironWave 1.1s ease-in-out ${i * 0.08}s infinite`,
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
    window.addEventListener("ascend:sleep-mode-changed",    handler);
    return () => {
      window.removeEventListener("ascend:vitality-flow-changed", handler);
      window.removeEventListener("ascend:sleep-mode-changed",    handler);
    };
  }, []);

  if (!show) return null;

  const accept  = () => { setSleepMode("adaptive"); setShow(false); navigate("/sleep-settings"); };
  const dismiss = () => { dismissAutoSwitchPrompt(); setShow(false); };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-3 flex items-start gap-3"
      style={{
        backgroundColor: "rgba(251,191,36,0.08)",
        border:          "1px solid rgba(251,191,36,0.35)",
        boxShadow:       "0 0 22px rgba(251,191,36,0.18)",
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
        <p className="text-sm font-bold"               style={{ color: "#fde68a" }}>You're doing great</p>
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
