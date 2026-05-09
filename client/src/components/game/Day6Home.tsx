import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Wind, Dumbbell, CheckCircle2, Sparkles, X, Palette, ArrowRight, Play,
} from "lucide-react";
import { CustomizePanel } from "./CustomizePanel";
import { AvatarPickerSheet, getAvatarIcon, saveAvatarIcon } from "./AvatarPickerSheet";
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
import { getWorkoutLevel } from "@/lib/workoutProgressStore";
import { getPathFlowConfig } from "@/lib/pathFlowConfig";
import { buildDailyFlowActivities } from "@/lib/dailyFlowBuilder";
import { getPathAwareRecommendation } from "@/lib/dailyRecommendationEngine";
import {
  recordSleepCheck, recordBreathingSession,
  initLevelBaseline,
} from "@/lib/statsSystem";
import { markFlowCompleted } from "@/lib/userState";
import { computeXPState } from "@/lib/xpSystem";
import { clearFlow, clearSession } from "@/lib/sessionPersistenceStore";
import { useSessionProgress } from "@/hooks/useSessionProgress";

// ── Icon map for session cards ────────────────────────────────────────────────

const ICON_MAP = { Brain, Wind, Dumbbell, Sparkles } as const;

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
  };
  const fae = {
    peach: "#fbcaad", peachStrong: "#f4845f",
    lavender: "#c8b9ee", lavenderDeep: "#8d75c4",
    inkText: "#2d1b4e",
  };

  const [, navigate] = useLocation();

  // ── Core state ──────────────────────────────────────────────────────────────
  const [showCustomize, setShowCustomize] = useState(false);
  const [showAvatar,    setShowAvatar]    = useState(false);
  const [avatarIcon,    setAvatarIconState] = useState(() => getAvatarIcon());
  const [flowActive,    setFlowActive]    = useState(false);

  // ── Session progress (per-activity localStorage tracking) ───────────────────
  const { completedIds, markComplete } = useSessionProgress();

  // ── Derived data ────────────────────────────────────────────────────────────
  const tiers: CategoryTiers = {
    strength:   scalingData?.trainingScaling?.strength?.tier   ?? 1,
    agility:    scalingData?.trainingScaling?.agility?.tier    ?? 1,
    meditation: scalingData?.trainingScaling?.meditation?.tier ?? 1,
    vitality:   scalingData?.trainingScaling?.vitality?.tier   ?? 1,
  };
  const [currentWorkoutLevel] = useState(() => getWorkoutLevel());
  const pathConfig = getPathFlowConfig(currentWorkoutLevel);
  const pathRec    = getPathAwareRecommendation(currentWorkoutLevel);
  const activities = buildDailyFlowActivities(currentWorkoutLevel, {
    dayNumber: homeData.onboardingDay,
    tiers,
  });
  const totalMins = Math.ceil(activities.reduce((s, a) => s + a.duration, 0) / 60);

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

  // ── XP animation — explicit from→to tracking ──────────────────────────────
  // Capture the previous XP percent so SegmentedXpBar can animate only the
  // newly-earned segments (old fill count → new fill count) over 0.8 s ease-out.
  const [xpAnimFrom, setXpAnimFrom] = useState(xp.percent);
  const xpPercentRef = useRef(xp.percent);
  useEffect(() => {
    if (xp.percent !== xpPercentRef.current) {
      setXpAnimFrom(xpPercentRef.current);   // remember where we started
      xpPercentRef.current = xp.percent;     // update ref to current
    }
  }, [xp.percent]);

  // ── Session lists ───────────────────────────────────────────────────────────
  // Drive the mission sequence from the *actual* daily flow activities so that
  // optional or external-route cards (e.g. phase1_cardio → /training) never
  // block the "Daily ritual complete" state.  pathConfig.sessionCards is only
  // used as a display-metadata lookup (label / sublabel / icon / color).
  const sessionCardMetaById = Object.fromEntries(
    pathConfig.sessionCards.map(c => [c.id, c])
  );
  const allCards = activities
    .map(a => {
      const meta = sessionCardMetaById[a.id];
      if (!meta) return null;
      return { ...meta, icon: ICON_MAP[meta.icon as keyof typeof ICON_MAP] };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const pendingCards  = allCards.filter(c => !completedIds.has(c.id));
  const doneCards     = allCards.filter(c =>  completedIds.has(c.id));
  const allDone       = pendingCards.length === 0 && allCards.length > 0;
  const currentCard   = pendingCards[0] ?? null;
  const upcomingCards = pendingCards.slice(1);

  // ── Theme helpers ───────────────────────────────────────────────────────────
  const primaryColor = isIronSovereign ? isHud.cyan :
                       isNeonEmpress   ? fae.peachStrong :
                       colors.primary;

  const snap = pathRec.progressSnapshot;

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => { initLevelBaseline(displayLevel); }, [displayLevel]);

  useEffect(() => {
    const h = (e: Event) => {
      const detail = (e as CustomEvent<{ sleptWell: boolean }>).detail;
      recordSleepCheck(detail.sleptWell);
    };
    window.addEventListener("ascend:sleep-check", h);
    return () => window.removeEventListener("ascend:sleep-check", h);
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleStartFlow = useCallback(() => {
    clearFlow();
    clearSession();
    setFlowActive(true);
  }, []);

  const handleFlowComplete = useCallback((ids: string[], _bonus: boolean) => {
    if (ids.length > 0) {
      markFlowCompleted(ids);
      if (ids.includes("phase1_meditation")) {
        recordBreathingSession(true);
      }
      localStorage.setItem("ascend_first_mission_done", "1");
      // Sync each completed ID into the per-activity localStorage key so the
      // mission sequencing UI (pending / done / allDone) stays consistent
      // whether the user ran individual cards or the full guided-flow overlay.
      ids.forEach(id => markComplete(id));
    }
    setFlowActive(false);
  }, [markComplete]);

  const handleAvatarPick = (icon: string) => {
    saveAvatarIcon(icon);
    setAvatarIconState(icon);
    setShowAvatar(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SystemLayout>
      <CustomizePanel open={showCustomize} onClose={() => setShowCustomize(false)} />

      {/* DailyFlowEngine — non-prominent fallback overlay */}
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
        className="flex flex-col gap-5 py-3 px-1 max-w-md mx-auto w-full"
        data-testid="day6-home"
      >
        <AutoSwitchBanner navigate={navigate} />

        {/* ── HEADER — Avatar + Level/XP ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          className="flex items-center gap-3"
          data-testid="daily-status-section"
        >
          {/* Avatar */}
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
              <SegmentedXpBar
                fromPercent={xpAnimFrom}
                percent={xp.percent}
                fill={isHud.cyan}
                glow={isHud.cyanGlow}
              />
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
                  initial={{ width: `${xpAnimFrom}%` }}
                  animate={{ width: `${xp.percent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ backgroundColor: colors.primary, boxShadow: `0 0 8px ${colors.primaryGlow}` }}
                  data-testid="xp-bar-fill"
                />
              </div>
            )}

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

        {/* ── SYSTEM MESSAGE ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.08 }}
          className="px-0.5"
          data-testid="system-message"
        >
          <p
            className="text-[9px] uppercase tracking-[0.22em] font-bold mb-1.5"
            style={{ color: primaryColor }}
          >
            SYSTEM
          </p>
          <p
            className="text-[17px] font-bold leading-snug mb-1"
            style={{ color: isNeonEmpress ? fae.inkText : colors.text }}
          >
            {pathRec.headline}
          </p>
          <p
            className="text-[11px] leading-relaxed"
            style={{ color: isNeonEmpress ? fae.inkText + "aa" : colors.textMuted }}
            data-testid="path-recommendation-text"
          >
            {pathRec.subtext}
          </p>
        </motion.div>

        {/* ── MISSION STACK ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, delay: 0.14 }}
          className="flex flex-col gap-3"
        >
          {/* All done state */}
          {allDone && (() => {
            const tomorrowFirst = allCards[0];
            const TomorrowIcon  = tomorrowFirst?.icon ?? Brain;
            return (
              <motion.div
                key="all-done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.32 }}
                className="flex flex-col items-center text-center gap-3 py-8 px-6 rounded-[22px]"
                style={{
                  background: "rgba(34,197,94,0.06)",
                  boxShadow: "0 0 40px rgba(34,197,94,0.10)",
                }}
                data-testid="text-flow-completed"
              >
                <CheckCircle2 size={34} style={{ color: "#22c55e" }} />
                <div>
                  <p className="text-base font-bold" style={{ color: "#22c55e" }}>
                    Daily ritual complete.
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: colors.textMuted }}>
                    ~{totalMins} min · {pathConfig.displayLabel}
                  </p>
                  <p className="text-[11px] mt-1.5 font-semibold" style={{ color: "#22c55e88" }}>
                    {xp.exp} / {xp.maxExp} XP · Lv {displayLevel}
                  </p>
                </div>

                {/* Tomorrow's first session preview — no border */}
                {tomorrowFirst && (
                  <div
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                    data-testid="tomorrow-preview"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${tomorrowFirst.color}18` }}
                    >
                      <TomorrowIcon size={13} style={{ color: tomorrowFirst.color, opacity: 0.65 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[9px] uppercase tracking-[0.16em] font-bold"
                        style={{ color: colors.textMuted }}
                      >
                        Tomorrow
                      </p>
                      <p
                        className="text-[12px] font-medium"
                        style={{ color: isNeonEmpress ? fae.inkText : colors.text, opacity: 0.70 }}
                      >
                        {tomorrowFirst.label}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })()}

          {/* Current mission card */}
          {currentCard && (() => {
            const Icon    = currentCard.icon;
            const durMins = activityDurationMap[currentCard.id] ?? 2;
            const dest    = currentCard.route ?? `/guided-session/${currentCard.id}`;
            return (
              <motion.button
                key={currentCard.id}
                data-testid="mission-card-current"
                onClick={() => navigate(dest)}
                whileTap={{ scale: 0.985 }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32 }}
                className="w-full text-left rounded-[22px] overflow-hidden flex flex-col gap-4"
                style={{
                  padding: "20px",
                  background: `linear-gradient(145deg, ${currentCard.color}1a 0%, rgba(0,0,0,0.06) 100%)`,
                  boxShadow: `0 0 44px ${currentCard.color}2a, 0 0 88px ${currentCard.color}0e, 0 8px 28px rgba(0,0,0,0.28)`,
                }}
              >
                <div className="flex items-start gap-3.5">
                  {/* Icon — no border, shadow only */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${currentCard.color}20` }}
                  >
                    <Icon size={22} style={{ color: currentCard.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[9px] uppercase tracking-[0.2em] font-bold mb-1"
                      style={{ color: `${currentCard.color}99` }}
                    >
                      Current Mission
                    </p>
                    <p
                      className="text-[18px] font-bold leading-tight"
                      style={{ color: isNeonEmpress ? fae.inkText : colors.text }}
                    >
                      {currentCard.label}
                    </p>
                    <p
                      className="text-[11px] mt-1 leading-relaxed"
                      style={{ color: isNeonEmpress ? fae.inkText + "88" : colors.textMuted }}
                    >
                      {currentCard.sublabel}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-mono px-2 py-1 rounded-full shrink-0 mt-1"
                    style={{
                      backgroundColor: `${currentCard.color}18`,
                      color: currentCard.color,
                    }}
                  >
                    {durMins}m
                  </span>
                </div>

                {/* Begin row */}
                <div
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[13px] uppercase tracking-[0.14em]"
                  style={{
                    backgroundColor: currentCard.color,
                    color: isNeonEmpress ? fae.inkText : "#000",
                  }}
                >
                  Begin
                  <ArrowRight size={14} />
                </div>
              </motion.button>
            );
          })()}

          {/* Upcoming sessions */}
          {upcomingCards.length > 0 && (
            <div>
              <p
                className="text-[9px] uppercase tracking-[0.2em] font-bold mb-2 px-0.5"
                style={{ color: colors.textMuted }}
              >
                Then
              </p>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                {upcomingCards.map((card, i) => {
                  const Icon    = card.icon;
                  const durMins = activityDurationMap[card.id] ?? 2;
                  const dest    = card.route ?? `/guided-session/${card.id}`;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => navigate(dest)}
                      data-testid={`mission-upcoming-${i}`}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/5 active:bg-white/10"
                      style={{
                        borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${card.color}12` }}
                      >
                        <Icon size={16} style={{ color: card.color, opacity: 0.65 }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium leading-tight"
                          style={{ color: isNeonEmpress ? fae.inkText + "bb" : colors.text, opacity: 0.70 }}
                        >
                          {card.label}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                          {card.sublabel}
                        </p>
                      </div>
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: `${card.color}0e`,
                          color: card.color,
                          opacity: 0.70,
                        }}
                      >
                        {durMins}m
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed sessions */}
          {doneCards.length > 0 && (
            <div>
              <p
                className="text-[9px] uppercase tracking-[0.2em] font-bold mb-2 px-0.5"
                style={{ color: "#22c55e99" }}
              >
                Done
              </p>
              <div className="flex flex-col gap-1">
                {doneCards.map(card => (
                  <div
                    key={card.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                    style={{ backgroundColor: "rgba(34,197,94,0.05)" }}
                    data-testid={`mission-done-${card.id}`}
                  >
                    <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
                    <span
                      className="text-[12px] font-medium"
                      style={{ color: "#22c55e", opacity: 0.75 }}
                    >
                      {card.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full-flow fallback — non-prominent, for users who prefer the guided overlay */}
          {pendingCards.length > 0 && (
            <button
              type="button"
              onClick={handleStartFlow}
              data-testid="button-begin-flow"
              className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] uppercase tracking-[0.14em] rounded-xl transition-colors hover:bg-white/5 active:bg-white/10"
              style={{ color: colors.textMuted }}
            >
              <Play size={9} />
              Start full guided flow
            </button>
          )}

        </motion.div>

        {/* ── PROGRESS STRIP — streak + readiness only ──────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.32, delay: 0.28 }}
          className="flex items-center justify-center gap-8 pt-1 pb-2"
          data-testid="progress-strip"
        >
          <div className="flex flex-col items-center gap-0.5" data-testid="stat-streak">
            <span className="text-lg leading-none">🔥</span>
            <span
              className="text-sm font-extrabold leading-none"
              style={{ color: isNeonEmpress ? fae.inkText : colors.text }}
            >
              {snap.streak}
            </span>
            <span className="text-[9px]" style={{ color: colors.textMuted }}>Streak</span>
          </div>
          <div
            className="w-px h-8"
            style={{ backgroundColor: "rgba(255,255,255,0.10)" }}
          />
          <div className="flex flex-col items-center gap-0.5" data-testid="stat-readiness">
            <span className="text-lg leading-none">⚡</span>
            <span
              className="text-sm font-extrabold leading-none"
              style={{ color: isNeonEmpress ? fae.inkText : colors.text }}
            >
              {snap.readinessPercent}%
            </span>
            <span className="text-[9px]" style={{ color: colors.textMuted }}>Ready</span>
          </div>
        </motion.div>

      </div>
    </SystemLayout>
  );
}

// ── SegmentedXpBar ────────────────────────────────────────────────────────────
// Animates only the newly-earned segments (fromPercent → percent) sequentially
// over 0.8 s ease-out. Previously-filled segments are stationary.

function SegmentedXpBar({
  fromPercent = 0, percent, fill, glow, segments = 20,
}: {
  fromPercent?: number; percent: number; fill: string; glow: string; segments?: number;
}) {
  const filledTarget = Math.round((Math.max(0, Math.min(100, percent))    / 100) * segments);
  const filledFrom   = Math.round((Math.max(0, Math.min(100, fromPercent)) / 100) * segments);
  const newCount     = Math.max(0, filledTarget - filledFrom);

  return (
    <div className="w-full flex gap-[2px] h-2 items-center" data-testid="xp-bar-track">
      {Array.from({ length: segments }).map((_, i) => {
        const isOn  = i < filledTarget;
        const isNew = i >= filledFrom && i < filledTarget;
        return (
          <motion.div
            key={i}
            className="flex-1 h-full rounded-[2px]"
            animate={{
              backgroundColor: isOn ? fill : "rgba(255,255,255,0.08)",
              boxShadow:       isOn ? `0 0 5px ${glow}` : "none",
            }}
            transition={{
              duration: 0.12,
              ease: "easeOut",
              // New segments stagger in from left to right over 0.8 s;
              // previously-filled and unfilled segments snap immediately.
              delay: isNew ? ((i - filledFrom) / Math.max(newCount, 1)) * 0.8 : 0,
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
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          background: "linear-gradient(90deg, #f7e5b6 0%, #f4a6c8 50%, #b59cf2 100%)",
          boxShadow: "0 0 6px rgba(180,150,240,0.55)",
        }}
        data-testid="xp-bar-fill"
      />
    </div>
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

  const accept  = () => { setSleepMode("adaptive"); setShow(false); navigate("/sleep-settings"); };
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
