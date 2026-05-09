import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Brain, Wind, Dumbbell, Heart, ChevronDown, ChevronUp,
  CheckCircle2, Zap, Sparkles, X, Palette, Target,
} from "lucide-react";
import { CustomizePanel } from "./CustomizePanel";
import {
  AvatarPickerSheet,
  getAvatarIcon,
  saveAvatarIcon,
} from "./AvatarPickerSheet";
import {
  shouldPromptAutoSwitch,
  setMode as setSleepMode,
  dismissAutoSwitchPrompt,
} from "@/lib/sleepModeStore";
import { useLocation } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { DailyFlowEngine } from "./DailyFlowEngine";
import { SystemLayout } from "./SystemLayout";
import { type CategoryTiers } from "@/lib/activityEngine";
import { type WorkoutLevel } from "@/lib/workoutPlans";
import { getWorkoutLevel } from "@/lib/workoutProgressStore";
import { getPathFlowConfig } from "@/lib/pathFlowConfig";
import { buildDailyFlowActivities } from "@/lib/dailyFlowBuilder";
import { getPathAwareRecommendation } from "@/lib/dailyRecommendationEngine";
import {
  getStats, recordSleepCheck, recordBreathingSession,
  initLevelBaseline, STATS_CHANGED_EVENT, type GameStats,
} from "@/lib/statsSystem";
import { markFlowCompleted } from "@/lib/userState";
import { computeXPState } from "@/lib/xpSystem";
import { clearFlow, clearSession } from "@/lib/sessionPersistenceStore";

// ── Quick actions config ──────────────────────────────────────────────────────

const QUICK_ACTIONS_CONFIG = [
  { label: "Breathe", Icon: Wind,     route: "/guided-session/phase1_meditation", color: "#3b82f6" },
  { label: "Stretch", Icon: Heart,    route: "/guided-session/phase1_agility",    color: "#22c55e" },
  { label: "Train",   Icon: Dumbbell, route: "/training",                          color: "#f59e0b" },
  { label: "Focus",   Icon: Brain,    route: "/coach",                             color: "#a855f7" },
  { label: "Tasks",   Icon: Target,   route: "/habits",                            color: "#ef4444" },
] as const;

// ── Icon map for session cards ────────────────────────────────────────────────

const ICON_MAP = { Brain, Wind, Dumbbell, Sparkles } as const;

function buildSessionList(workoutLevel: WorkoutLevel) {
  const config = getPathFlowConfig(workoutLevel);
  const mapped = config.sessionCards.map(card => ({
    ...card,
    icon: ICON_MAP[card.icon as keyof typeof ICON_MAP],
  }));
  return {
    flowCards:  mapped.filter(c => !c.isQuickLink),
    quickLinks: mapped.filter(c =>  c.isQuickLink),
  };
}

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

interface Player { id: string; }

interface ScalingData {
  trainingScaling?: Record<string, { tier: number }>;
}

interface Props {
  homeData: HomeData;
  playerData: PlayerData | null;
  player: Player;
  scalingData: ScalingData | null;
}

// ── Main component ────────────────────────────────────────────────────────────

export function Day6Home({ homeData, playerData, player, scalingData }: Props) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const isIronSovereign = backgroundTheme.id === "male";
  const isNeonEmpress   = backgroundTheme.id === "female";

  const isHud = {
    cyan: "#22d3ee", cyanGlow: "rgba(34,211,238,0.55)",
    green: "#22c55e", greenGlow: "rgba(34,197,94,0.55)",
    purple: "#a855f7", purpleGlow: "rgba(168,85,247,0.45)",
  };
  const fae = {
    peach: "#fbcaad", peachStrong: "#f4845f", peachBorder: "#f4a78a",
    skyBlue: "#a9d3f0", mint: "#bce8c9", mintFill: "#7ed8a0",
    lavender: "#c8b9ee", lavenderDeep: "#8d75c4",
    purple: "#7c3aed", inkText: "#2d1b4e",
    gold: "#c89530", goldGlow: "rgba(200,149,48,0.55)",
  };

  const [, navigate] = useLocation();

  // ── Core state ──────────────────────────────────────────────────────────────
  const [flowActive,        setFlowActive]        = useState(false);
  const [showCustomize,     setShowCustomize]      = useState(false);
  const [showAvatar,        setShowAvatar]         = useState(false);
  const [avatarIcon,        setAvatarIconState]    = useState(() => getAvatarIcon());
  const [flowCompletedDate, setFlowCompletedDate]  = useState(
    () => localStorage.getItem("ascend_light_movement_completed") ?? ""
  );
  const [isFirstMission, setIsFirstMission] = useState(
    () => localStorage.getItem("ascend_first_mission_done") !== "1"
  );
  // Today's Focus accordion — open on first visit, closed on repeat
  const [showFocus, setShowFocus] = useState(
    () => localStorage.getItem("ascend_first_mission_done") !== "1"
  );

  const [stats, setStats] = useState<GameStats>(() => getStats());

  const today             = new Date().toISOString().split("T")[0];
  const flowCompletedToday = flowCompletedDate === today;

  // ── Derived data ────────────────────────────────────────────────────────────
  const tiers: CategoryTiers = {
    strength:  scalingData?.trainingScaling?.strength?.tier  ?? 1,
    agility:   scalingData?.trainingScaling?.agility?.tier   ?? 1,
    meditation: scalingData?.trainingScaling?.meditation?.tier ?? 1,
    vitality:  scalingData?.trainingScaling?.vitality?.tier  ?? 1,
  };
  const [currentWorkoutLevel] = useState(() => getWorkoutLevel());
  const pathConfig = getPathFlowConfig(currentWorkoutLevel);
  const pathRec    = getPathAwareRecommendation(currentWorkoutLevel);
  const activities = buildDailyFlowActivities(currentWorkoutLevel, {
    dayNumber: homeData.onboardingDay,
    tiers,
  });
  const totalMins = Math.ceil(activities.reduce((s, a) => s + a.duration, 0) / 60);

  // Map activity id → estimated minutes for session card duration chips
  const activityDurationMap = Object.fromEntries(
    activities.map(a => [a.id, Math.max(1, Math.round(a.duration / 60))])
  );

  const xp = computeXPState(
    playerData?.totalExp ?? 0,
    playerData?.level    ?? 2,
    playerData?.exp      ?? 0,
    playerData?.maxExp   ?? 100
  );
  const displayLevel = playerData?.level ?? 2;

  const refreshStats = useCallback(() => setStats(getStats()), []);

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => { initLevelBaseline(displayLevel); }, [displayLevel]);

  useEffect(() => {
    const h = () => setStats(getStats());
    window.addEventListener(STATS_CHANGED_EVENT, h);
    return () => window.removeEventListener(STATS_CHANGED_EVENT, h);
  }, []);

  useEffect(() => {
    const h = (e: Event) => {
      const detail = (e as CustomEvent<{ sleptWell: boolean }>).detail;
      setStats(recordSleepCheck(detail.sleptWell));
    };
    window.addEventListener("ascend:sleep-check", h);
    return () => window.removeEventListener("ascend:sleep-check", h);
  }, []);

  useEffect(() => {
    const h = () => setFlowCompletedDate("");
    window.addEventListener("ascend:sessions-reset", h);
    return () => window.removeEventListener("ascend:sessions-reset", h);
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleFlowComplete = (completedIds: string[], _bonus: boolean) => {
    if (completedIds.length > 0) {
      const newStats = markFlowCompleted(completedIds);
      setStats(newStats);
      if (completedIds.includes("phase1_meditation")) {
        setStats(recordBreathingSession(true));
      }
      setFlowCompletedDate(new Date().toISOString().split("T")[0]);
      localStorage.setItem("ascend_first_mission_done", "1");
      setIsFirstMission(false);
    }
    setFlowActive(false);
    refreshStats();
  };

  const handleStartFlow = () => { clearFlow(); clearSession(); setFlowActive(true); };

  const handleAvatarPick = (icon: string) => {
    saveAvatarIcon(icon);
    setAvatarIconState(icon);
    setShowAvatar(false);
  };

  // ── Snapshot for progress card ───────────────────────────────────────────────
  const snap = pathRec.progressSnapshot;
  const recoveryLabel =
    snap.recoveryState === "energized" ? "Good" :
    snap.recoveryState === "fatigued"  ? "Low"  : "Fair";
  const recoveryColor =
    snap.recoveryState === "energized" ? "#22c55e" :
    snap.recoveryState === "fatigued"  ? "#ef4444" : "#f59e0b";

  // ── Session list ─────────────────────────────────────────────────────────────
  const { flowCards, quickLinks } = buildSessionList(currentWorkoutLevel);

  // ── Theme helpers for cards/surfaces ─────────────────────────────────────────
  const surfaceBg    = `${colors.surface || colors.background}ee`;
  const surfaceBorder = colors.surfaceBorder;
  const primaryColor  = isIronSovereign ? isHud.cyan :
                        isNeonEmpress   ? fae.peachStrong :
                        colors.primary;
  const primaryGlow   = isIronSovereign ? isHud.cyanGlow :
                        isNeonEmpress   ? "rgba(244,132,95,0.45)" :
                        colors.primaryGlow;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SystemLayout>
      {/* Overlays */}
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
      <AvatarPickerSheet
        open={showAvatar}
        current={avatarIcon}
        playerName={playerData?.name ?? ""}
        onPick={handleAvatarPick}
        onClose={() => setShowAvatar(false)}
        isIronSovereign={isIronSovereign}
        isNeonEmpress={isNeonEmpress}
        colors={colors}
        fae={{ lavender: fae.lavender, lavenderDeep: fae.lavenderDeep, inkText: fae.inkText }}
        pathColor={pathConfig.primaryColor}
      />

      <div
        className="flex flex-col gap-4 py-3 px-1 max-w-md mx-auto w-full"
        data-testid="day6-home"
      >
        <AutoSwitchBanner navigate={navigate} />

        {/* ── SECTION 0: HEADER — Avatar + Level/XP ──────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          className="flex items-center gap-3"
          data-testid="daily-status-section"
        >
          {/* Avatar circle */}
          <button
            onClick={() => setShowAvatar(true)}
            data-testid="button-avatar"
            className="relative shrink-0 active:scale-95 transition-transform"
            aria-label="Change avatar"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{
                background: isIronSovereign
                  ? "linear-gradient(135deg, rgba(34,211,238,0.18), rgba(34,211,238,0.06))"
                  : isNeonEmpress
                    ? `linear-gradient(135deg, ${fae.lavender}, ${fae.lavenderDeep}44)`
                    : `linear-gradient(135deg, ${colors.primary}22, ${colors.primary}08)`,
                border: `2px solid ${pathConfig.primaryColor}`,
                boxShadow: `0 0 16px ${pathConfig.primaryColor}55, 0 0 32px ${pathConfig.primaryColor}22`,
              }}
            >
              {avatarIcon}
            </div>
            {/* Level badge overlay */}
            <div
              className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none"
              style={{
                backgroundColor: pathConfig.primaryColor,
                color: isNeonEmpress ? fae.inkText : "#000",
                border: "1.5px solid rgba(0,0,0,0.3)",
              }}
              data-testid="text-player-level"
            >
              {displayLevel}
            </div>
          </button>

          {/* XP bar + level info */}
          <div className="flex-1 min-w-0" data-testid="xp-progress-section">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[11px] font-bold"
                  style={{ color: isIronSovereign ? isHud.cyan : isNeonEmpress ? fae.inkText : colors.text }}
                >
                  {playerData?.name ?? "Hunter"}
                </span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-mono"
                  style={{
                    backgroundColor: `${pathConfig.primaryColor}20`,
                    color: pathConfig.primaryColor,
                    border: `1px solid ${pathConfig.primaryColor}40`,
                  }}
                >
                  Lv {displayLevel}
                </span>
              </div>
              <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>
                {xp.exp} / {xp.maxExp} XP
              </span>
            </div>

            {isIronSovereign ? (
              <SegmentedXpBar percent={xp.percent} fill={isHud.cyan} glow={isHud.cyanGlow} />
            ) : isNeonEmpress ? (
              <PastelGradientXpBar percent={xp.percent} />
            ) : (
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.1)" }}
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

            {/* Customize button inline */}
            <div className="flex items-center justify-between mt-1.5">
              <span
                className="text-[9px] uppercase tracking-[0.16em]"
                style={{ color: colors.textMuted }}
              >
                {pathConfig.displayLabel}
              </span>
              <button
                onClick={() => setShowCustomize(true)}
                data-testid="button-customize"
                className="flex items-center gap-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md active:scale-95 transition-transform"
                style={{ color: colors.textMuted, backgroundColor: `${colors.primary}10` }}
              >
                <Palette size={9} />
                Theme
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── SECTION 1: COACH CARD ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.08 }}
          className="rounded-2xl px-4 py-3.5 flex items-start gap-3 relative overflow-hidden"
          style={
            isNeonEmpress
              ? {
                  backgroundColor: fae.lavender,
                  border: `1px solid ${fae.lavenderDeep}88`,
                  backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='white' stroke-opacity='0.4' stroke-width='1.1' stroke-linecap='round'><path d='M10 50 Q 25 25, 45 40 T 80 35 T 115 50'/><path d='M5 80 Q 30 65, 50 85 T 90 80 T 120 95'/></g></svg>\")",
                  backgroundSize: "180px 180px",
                  backgroundRepeat: "repeat",
                }
              : {
                  backgroundColor: `${colors.primary}14`,
                  border: `1px solid ${colors.primary}38`,
                }
          }
          data-testid="coach-insight-card"
        >
          {/* Brain icon */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={
              isNeonEmpress
                ? { backgroundColor: fae.lavenderDeep + "44", border: `1px solid ${fae.lavenderDeep}bb` }
                : { backgroundColor: `${colors.primary}28`, border: `1px solid ${colors.primary}50` }
            }
          >
            <Brain size={15} style={{ color: isNeonEmpress ? fae.inkText : colors.primary }} />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p
              className="text-[9px] uppercase tracking-[0.18em] font-bold mb-1"
              style={{ color: isNeonEmpress ? fae.inkText : colors.primary }}
            >
              Coach · {pathConfig.tagline}
            </p>
            <p
              className="text-sm font-medium leading-snug"
              style={{ color: isNeonEmpress ? fae.inkText : colors.text }}
            >
              {homeData.insight ?? "Consistency is becoming your baseline."}
            </p>
            <p
              className="text-[10px] mt-1 leading-relaxed opacity-75"
              style={{ color: isNeonEmpress ? fae.inkText : colors.textMuted }}
              data-testid="path-recommendation-text"
            >
              {pathRec.headline}
            </p>
          </div>
        </motion.div>

        {/* ── SECTION 2: BEGIN DAILY FLOW CTA ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.14 }}
        >
          {flowCompletedToday ? (
            <div
              className="w-full py-4 px-5 rounded-2xl flex items-center justify-center gap-2.5"
              style={{ backgroundColor: "#22c55e0e", border: "1px solid #22c55e28" }}
              data-testid="text-flow-completed"
            >
              <CheckCircle2 size={18} style={{ color: "#22c55e" }} />
              <div>
                <p className="text-sm font-bold" style={{ color: "#22c55e" }}>Flow complete</p>
                <p className="text-[10px]" style={{ color: "#22c55e99" }}>{totalMins} min logged today</p>
              </div>
            </div>
          ) : isIronSovereign ? (
            <IronSovereignFlowButton
              onStart={handleStartFlow}
              totalMins={totalMins}
              pathLabel={pathConfig.displayLabel}
            />
          ) : isNeonEmpress ? (
            <NeonEmpressFlowButton
              onStart={handleStartFlow}
              fae={fae}
              totalMins={totalMins}
              pathLabel={pathConfig.displayLabel}
            />
          ) : (
            <button
              data-testid="button-begin-flow"
              onClick={handleStartFlow}
              className="w-full rounded-2xl font-bold text-sm uppercase tracking-[0.18em] transition-all active:scale-[0.98]"
              style={{
                padding: "18px 18px 14px",
                backgroundColor: colors.primary,
                color: colors.background,
                boxShadow: `0 0 28px ${colors.primaryGlow}40`,
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <Play size={15} />
                Begin Daily Flow
              </span>
              <p className="text-[10px] mt-1 opacity-70 normal-case tracking-normal font-normal">
                ~{totalMins} min · {pathConfig.displayLabel}
              </p>
            </button>
          )}
        </motion.div>

        {/* ── SECTION 3: TODAY'S FOCUS ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.20 }}
        >
          {/* Accordion header */}
          <button
            data-testid="button-toggle-sessions"
            onClick={() => setShowFocus(v => !v)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all active:scale-[0.99]"
            style={{
              backgroundColor: isNeonEmpress ? fae.mint : surfaceBg,
              border: `1.5px solid ${isNeonEmpress ? fae.mintFill + "66" : surfaceBorder}`,
            }}
          >
            <div className="flex items-center gap-2">
              <Zap size={12} style={{ color: isNeonEmpress ? fae.inkText : primaryColor }} />
              <span
                className="text-[10px] uppercase tracking-wider font-bold"
                style={{ color: isNeonEmpress ? fae.inkText : primaryColor }}
              >
                Today's Focus
              </span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: isNeonEmpress ? "rgba(45,27,78,0.1)" : `${primaryColor}15`,
                  color: isNeonEmpress ? fae.inkText + "bb" : primaryColor + "90",
                }}
              >
                ~{totalMins} min
              </span>
            </div>
            {showFocus
              ? <ChevronUp size={14} style={{ color: colors.textMuted }} />
              : <ChevronDown size={14} style={{ color: colors.textMuted }} />
            }
          </button>

          {/* Session cards */}
          <AnimatePresence>
            {showFocus && (
              <motion.div
                key="focus-list"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div
                  className="mt-1.5 rounded-xl overflow-hidden"
                  style={{ backgroundColor: surfaceBg, border: `1.5px solid ${surfaceBorder}` }}
                >
                  {flowCards.map((session, i) => {
                    const Icon = session.icon;
                    const done = flowCompletedToday && !session.route;
                    const dest = session.route ?? `/guided-session/${session.id}`;
                    const durMins = activityDurationMap[session.id] ?? 2;
                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => navigate(dest)}
                        data-testid={`session-item-${i}`}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 active:bg-white/10"
                        style={{
                          borderTop: i > 0 ? `1px solid ${surfaceBorder}` : "none",
                          opacity: session.optional ? 0.75 : 1,
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: done ? "#22c55e18" : `${session.color}20`,
                            border: `1px solid ${done ? "#22c55e40" : session.color + "35"}`,
                          }}
                        >
                          {done
                            ? <CheckCircle2 size={16} style={{ color: "#22c55e" }} />
                            : <Icon size={16} style={{ color: session.color }} />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-semibold leading-tight"
                            style={{ color: done ? colors.textMuted : colors.text }}
                          >
                            {session.label}
                            {session.optional && (
                              <span className="ml-1.5 text-[9px] font-normal opacity-55">(optional)</span>
                            )}
                          </p>
                          <p className="text-[10px] mt-0.5 truncate" style={{ color: colors.textMuted }}>
                            {session.sublabel}
                          </p>
                        </div>
                        <span
                          className="text-[9px] font-mono shrink-0 px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: done ? "#22c55e12" : `${session.color}10`,
                            color: done ? "#22c55e" : session.color,
                          }}
                        >
                          {durMins}m
                        </span>
                      </button>
                    );
                  })}

                  {/* Quick links divider */}
                  {quickLinks.length > 0 && (
                    <>
                      <div
                        className="px-4 py-1.5 flex items-center gap-2"
                        style={{
                          borderTop: `1px solid ${surfaceBorder}`,
                          backgroundColor: `${surfaceBorder}28`,
                        }}
                      >
                        <span
                          className="text-[9px] uppercase tracking-[0.14em] font-semibold"
                          style={{ color: colors.textMuted }}
                        >
                          Also today
                        </span>
                      </div>
                      {quickLinks.map((session, i) => {
                        const Icon = session.icon;
                        const dest = session.route ?? `/guided-session/${session.id}`;
                        return (
                          <button
                            key={session.id}
                            type="button"
                            onClick={() => navigate(dest)}
                            data-testid={`session-quicklink-${i}`}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5"
                            style={{ borderTop: `1px solid ${surfaceBorder}`, opacity: 0.85 }}
                          >
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${session.color}18`, border: `1px solid ${session.color}30` }}
                            >
                              <Icon size={16} style={{ color: session.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-tight" style={{ color: colors.text }}>
                                {session.label}
                              </p>
                              <p className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                                {session.sublabel}
                              </p>
                            </div>
                            <span className="text-[10px]" style={{ color: colors.textMuted }}>›</span>
                          </button>
                        );
                      })}
                    </>
                  )}

                  {/* Sleep link */}
                  <button
                    type="button"
                    onClick={() => navigate("/sleep-settings")}
                    data-testid="link-sleep-settings"
                    className="w-full text-left flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5"
                    style={{ borderTop: `1px solid ${surfaceBorder}` }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "#fbbf2415" }}
                    >
                      <Sparkles size={15} style={{ color: "#fbbf24" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: colors.text }}>Sleep Optimization</p>
                      <p className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                        Configure your night flow
                      </p>
                    </div>
                    <span className="text-[10px]" style={{ color: colors.textMuted }}>›</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── SECTION 4: QUICK ACTIONS ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.26 }}
        >
          <p
            className="text-[9px] uppercase tracking-[0.18em] font-bold mb-2 px-0.5"
            style={{ color: colors.textMuted }}
          >
            Quick Actions
          </p>
          <div className="overflow-x-auto -mx-1 pb-1">
            <div className="flex gap-2.5 px-1 min-w-max">
              {QUICK_ACTIONS_CONFIG.map(({ label, Icon, route, color }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate(route)}
                  data-testid={`quick-action-${label.toLowerCase()}`}
                  className="flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-2xl active:scale-95 transition-transform min-w-[60px]"
                  style={{
                    backgroundColor: isNeonEmpress ? fae.lavender : `${color}14`,
                    border: `1px solid ${isNeonEmpress ? fae.lavenderDeep + "55" : color + "30"}`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${color}22`, border: `1px solid ${color}40` }}
                  >
                    <Icon size={15} style={{ color }} />
                  </div>
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: isNeonEmpress ? fae.inkText : colors.text }}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── SECTION 5: PROGRESS SNAPSHOT ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.32 }}
          className="rounded-2xl px-4 py-3.5"
          style={{
            backgroundColor: isNeonEmpress
              ? "linear-gradient(135deg, rgba(207,232,243,0.70), rgba(220,210,243,0.70))"
              : surfaceBg,
            background: isNeonEmpress
              ? "linear-gradient(135deg, rgba(207,232,243,0.75), rgba(220,210,243,0.75))"
              : undefined,
            border: isIronSovereign
              ? `1.5px solid ${isHud.green}55`
              : `1.5px solid ${surfaceBorder}`,
            boxShadow: isIronSovereign
              ? `0 0 12px ${isHud.greenGlow}22`
              : undefined,
          }}
          data-testid="progress-snapshot-card"
        >
          <p
            className="text-[9px] uppercase tracking-[0.18em] font-bold mb-2.5"
            style={{ color: isNeonEmpress ? fae.inkText + "99" : colors.textMuted }}
          >
            Progress Snapshot
          </p>
          <div className="grid grid-cols-3 gap-2">
            {/* Streak */}
            <div className="flex flex-col items-center gap-1" data-testid="stat-streak">
              <span className="text-xl leading-none">🔥</span>
              <span
                className="text-base font-extrabold leading-none"
                style={{ color: isNeonEmpress ? fae.inkText : colors.text }}
              >
                {snap.streak}
              </span>
              <span className="text-[9px]" style={{ color: isNeonEmpress ? fae.inkText + "99" : colors.textMuted }}>
                Day Streak
              </span>
            </div>
            {/* Readiness */}
            <div className="flex flex-col items-center gap-1" data-testid="stat-readiness">
              <span className="text-xl leading-none">⚡</span>
              <span
                className="text-base font-extrabold leading-none"
                style={{ color: isNeonEmpress ? fae.inkText : colors.text }}
              >
                {snap.readinessPercent}%
              </span>
              <span className="text-[9px]" style={{ color: isNeonEmpress ? fae.inkText + "99" : colors.textMuted }}>
                Readiness
              </span>
            </div>
            {/* Recovery */}
            <div className="flex flex-col items-center gap-1" data-testid="stat-recovery">
              <span className="text-xl leading-none">💤</span>
              <span
                className="text-base font-extrabold leading-none"
                style={{ color: recoveryColor }}
              >
                {recoveryLabel}
              </span>
              <span className="text-[9px]" style={{ color: isNeonEmpress ? fae.inkText + "99" : colors.textMuted }}>
                Recovery
              </span>
            </div>
          </div>
        </motion.div>

      </div>
    </SystemLayout>
  );
}

// ── SegmentedXpBar ────────────────────────────────────────────────────────────

function SegmentedXpBar({
  percent, fill, glow, segments = 20,
}: {
  percent: number; fill: string; glow: string; segments?: number;
}) {
  const filled = Math.round((Math.max(0, Math.min(100, percent)) / 100) * segments);
  return (
    <div className="w-full flex gap-[2px] h-2 items-center" data-testid="xp-bar-track">
      {Array.from({ length: segments }).map((_, i) => {
        const on = i < filled;
        return (
          <div
            key={i}
            className="flex-1 h-full rounded-[2px]"
            style={{
              backgroundColor: on ? fill : "rgba(255,255,255,0.08)",
              boxShadow: on ? `0 0 5px ${glow}` : "none",
              transition: "background-color 0.4s ease",
            }}
            data-testid={i === 0 ? "xp-bar-fill" : undefined}
          />
        );
      })}
    </div>
  );
}

// ── PastelGradientXpBar ───────────────────────────────────────────────────────

function PastelGradientXpBar({ percent }: { percent: number }) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="w-full h-2 rounded-full overflow-hidden"
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

// ── IronSovereignFlowButton ───────────────────────────────────────────────────

function IronSovereignFlowButton({
  onStart, totalMins, pathLabel,
}: {
  onStart: () => void; totalMins: number; pathLabel: string;
}) {
  return (
    <button
      data-testid="button-begin-flow"
      onClick={onStart}
      className="group relative w-full rounded-2xl transition-all active:scale-[0.985] overflow-hidden"
      style={{
        padding: "16px 18px 12px",
        background: "linear-gradient(180deg, rgba(34,211,238,0.95) 0%, rgba(14,165,233,0.95) 100%)",
        border: "2.5px solid #22c55e",
        boxShadow:
          "0 0 0 1px rgba(34,197,94,0.35), 0 0 22px rgba(34,197,94,0.55), 0 0 38px rgba(34,211,238,0.45), inset 0 0 18px rgba(255,255,255,0.18)",
      }}
    >
      <style>{`@keyframes ironWave { 0%,100%{transform:scaleY(0.6)} 50%{transform:scaleY(1)} }`}</style>
      <div className="flex items-center justify-center gap-3">
        <Waveform side="left" />
        <span
          className="flex items-center gap-2 font-extrabold uppercase"
          style={{ color: "#0a1f2c", fontSize: 16, letterSpacing: "0.14em", textShadow: "0 0 10px rgba(255,255,255,0.45)" }}
        >
          <Play size={16} fill="#0a1f2c" />
          Begin Daily Flow
        </span>
        <Waveform side="right" />
      </div>
      <p style={{ color: "rgba(10,31,44,0.65)", fontSize: 10, marginTop: 6, textAlign: "center", letterSpacing: "0.06em" }}>
        ~{totalMins} min · {pathLabel}
      </p>
    </button>
  );
}

// ── NeonEmpressFlowButton ─────────────────────────────────────────────────────

function NeonEmpressFlowButton({
  onStart, fae, totalMins, pathLabel,
}: {
  onStart: () => void;
  fae: { peach: string; peachStrong: string; skyBlue: string; inkText: string };
  totalMins: number;
  pathLabel: string;
}) {
  return (
    <button
      data-testid="button-begin-flow"
      onClick={onStart}
      className="group relative w-full rounded-2xl transition-all active:scale-[0.985]"
      style={{
        padding: "16px 18px 12px",
        background: `linear-gradient(180deg, ${fae.peach} 0%, #f7baa0 100%)`,
        border: `2px solid ${fae.skyBlue}`,
        boxShadow: `0 0 0 4px rgba(255,255,255,0.55), 0 0 0 6px ${fae.skyBlue}66, 0 8px 18px rgba(244,132,95,0.20)`,
      }}
    >
      <span
        className="flex items-center justify-center gap-3 font-extrabold uppercase"
        style={{ color: fae.inkText, fontSize: 16, letterSpacing: "0.18em" }}
      >
        <Play size={16} strokeWidth={2.4} />
        Begin Daily Flow
      </span>
      <p style={{ color: fae.inkText + "88", fontSize: 10, marginTop: 6, textAlign: "center" }}>
        ~{totalMins} min · {pathLabel}
      </p>
    </button>
  );
}

// ── Waveform ──────────────────────────────────────────────────────────────────

function Waveform({ side }: { side: "left" | "right" }) {
  const heights = [6, 12, 18, 22, 14, 24, 10, 16];
  const bars = side === "left" ? heights : [...heights].reverse();
  return (
    <div className="flex items-center gap-[3px] h-6 shrink-0" style={{ width: 56 }} aria-hidden>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: 2, height: h,
            backgroundColor: "#0a1f2c",
            borderRadius: 1, opacity: 0.85,
            transformOrigin: "center",
            animation: `ironWave 1.1s ease-in-out ${i * 0.08}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── LaurelLevel / LaurelBranch (unused in new layout, kept for safety) ────────

function LaurelLevel({ level, gold, glow }: { level: number; gold: string; glow: string }) {
  return (
    <div className="flex items-center gap-1" data-testid="text-player-level">
      <LaurelBranch side="left" gold={gold} />
      <span style={{
        color: gold,
        fontFamily: "'Brush Script MT', cursive, serif",
        fontStyle: "italic", fontWeight: 700, fontSize: 24, lineHeight: 1,
        textShadow: `0 1px 0 rgba(255,255,255,0.65), 0 0 10px ${glow}`,
      }}>
        Lv {level}
      </span>
      <LaurelBranch side="right" gold={gold} />
    </div>
  );
}

function LaurelBranch({ side, gold }: { side: "left" | "right"; gold: string }) {
  const transform = side === "right" ? "scaleX(-1)" : undefined;
  const leaves = [
    { cx: 4, cy: 28, rx: 1.6, ry: 3.6, rot: -55 }, { cx: 5, cy: 22, rx: 1.6, ry: 3.6, rot: -50 },
    { cx: 6, cy: 16, rx: 1.6, ry: 3.4, rot: -45 }, { cx: 7.5, cy: 10, rx: 1.5, ry: 3.2, rot: -38 },
    { cx: 9, cy: 5, rx: 1.4, ry: 2.8, rot: -28 },  { cx: 7, cy: 26, rx: 1.5, ry: 3.4, rot: 60 },
    { cx: 8, cy: 19, rx: 1.5, ry: 3.2, rot: 55 },  { cx: 9, cy: 13, rx: 1.4, ry: 3.0, rot: 48 },
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

// ── AutoSwitchBanner ──────────────────────────────────────────────────────────

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
            type="button" onClick={accept} data-testid="button-accept-adaptive"
            className="text-[11px] font-bold px-3 py-1 rounded-md"
            style={{ backgroundColor: "#fbbf24", color: "#1a1208" }}
          >
            Switch to Adaptive
          </button>
          <button
            type="button" onClick={dismiss} data-testid="button-dismiss-adaptive"
            className="text-[11px] px-2 py-1 rounded-md" style={{ color: colors.textMuted }}
          >
            Not now
          </button>
        </div>
      </div>
      <button
        type="button" onClick={dismiss} aria-label="Dismiss"
        className="shrink-0 p-1 rounded-md" style={{ color: colors.textMuted }}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
