import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Wind, Dumbbell, CheckCircle2, Sparkles, X, Palette,
  ArrowRight, Play, Heart, Zap, Shield,
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
import { recordSleepCheck, recordBreathingSession, initLevelBaseline } from "@/lib/statsSystem";
import { markFlowCompleted } from "@/lib/userState";
import { computeXPState } from "@/lib/xpSystem";
import { clearFlow, clearSession } from "@/lib/sessionPersistenceStore";
import { useSessionProgress } from "@/hooks/useSessionProgress";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface HomeData {
  phase: { number: number; name: string };
  insight: string;
  onboardingDay: number;
  isOnboardingComplete: boolean;
  streak: number;
  stability?: { consecutiveActiveDays?: number };
}
interface StatLevel { level: number; currentXP: number; xpForNext: number; }
interface PlayerData {
  level: number; exp: number; maxExp: number; totalExp: number;
  name?: string;
  statLevels?: Record<string, StatLevel>;
  displayStats?: Record<string, number>;
  hp?: number; maxHp?: number; mp?: number; maxMp?: number;
}
interface Player { id: string; }
interface ScalingData { trainingScaling?: Record<string, { tier: number }>; }
interface Props {
  homeData: HomeData; playerData: PlayerData | null;
  player: Player; scalingData: ScalingData | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard card definitions — always shown as a 2×2 grid
// Each maps to a stat + optionally a daily activity
// ─────────────────────────────────────────────────────────────────────────────

const DASH_CARDS = [
  {
    id: "calm",
    activityId: "phase1_meditation",
    statKey: "sense",
    label: "Calm Mind",
    sub: "Focus & Recovery",
    icon: Brain,
    color: "#818cf8",      // indigo
    glow: "rgba(129,140,248,0.50)",
    barLabel: "MP",
  },
  {
    id: "vitality",
    activityId: "",           // no dedicated guided activity in current paths
    statKey: "vitality",
    label: "Vitality",
    sub: "Health & Endurance",
    icon: Heart,
    color: "#f87171",      // rose
    glow: "rgba(248,113,113,0.50)",
    barLabel: "HP",
  },
  {
    id: "strength",
    activityId: "phase1_strength",
    statKey: "strength",
    label: "Strength",
    sub: "Power & Resilience",
    icon: Shield,
    color: "#fbbf24",      // amber
    glow: "rgba(251,191,36,0.50)",
    barLabel: "STR",
  },
  {
    id: "agility",
    activityId: "phase1_agility",
    statKey: "agility",
    label: "Agility",
    sub: "Speed & Flow",
    icon: Zap,
    color: "#34d399",      // emerald
    glow: "rgba(52,211,153,0.50)",
    barLabel: "AGI",
  },
] as const;

type DashCardId = (typeof DASH_CARDS)[number]["id"];

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function Day6Home({ homeData, playerData, player, scalingData }: Props) {
  const { backgroundTheme } = useTheme();
  const colors    = backgroundTheme.colors;
  const isIronSov = backgroundTheme.id === "male";
  const isNeonEmp = backgroundTheme.id === "female";

  const hudCyan  = "#22d3ee";
  const hudCyanG = "rgba(34,211,238,0.55)";
  const fae = {
    peach: "#fbcaad", peachStrong: "#f4845f",
    lavender: "#c8b9ee", lavenderDeep: "#8d75c4",
    ink: "#2d1b4e",
  };

  const [, navigate] = useLocation();

  // state
  const [showCustomize, setShowCustomize] = useState(false);
  const [showAvatar,    setShowAvatar]    = useState(false);
  const [avatarIcon,    setAvatarState]   = useState(() => getAvatarIcon());
  const [flowActive,    setFlowActive]    = useState(false);

  const { completedIds, markComplete } = useSessionProgress();

  // derived config
  const tiers: CategoryTiers = {
    strength:   scalingData?.trainingScaling?.strength?.tier   ?? 1,
    agility:    scalingData?.trainingScaling?.agility?.tier    ?? 1,
    meditation: scalingData?.trainingScaling?.meditation?.tier ?? 1,
    vitality:   scalingData?.trainingScaling?.vitality?.tier   ?? 1,
  };
  const [wlevel] = useState(() => getWorkoutLevel());
  const pathCfg  = getPathFlowConfig(wlevel);
  const pathRec  = getPathAwareRecommendation(wlevel);
  const activities = buildDailyFlowActivities(wlevel, { dayNumber: homeData.onboardingDay, tiers });
  const totalMins  = Math.ceil(activities.reduce((s, a) => s + a.duration, 0) / 60);

  const actDurMap = Object.fromEntries(
    activities.map(a => [a.id, Math.max(1, Math.round(a.duration / 60))])
  );

  // XP
  const xp = computeXPState(
    playerData?.totalExp ?? 0,
    playerData?.level    ?? 2,
    playerData?.exp      ?? 0,
    playerData?.maxExp   ?? 100,
  );
  const lvl = playerData?.level ?? 2;
  const [xpFrom, setXpFrom] = useState(xp.percent);
  const xpRef = useRef(xp.percent);
  useEffect(() => {
    if (xp.percent !== xpRef.current) {
      setXpFrom(xpRef.current);
      xpRef.current = xp.percent;
    }
  }, [xp.percent]);

  // Mission lists — driven from actual activity sequence
  const metaById = Object.fromEntries(pathCfg.sessionCards.map(c => [c.id, c]));
  const seqCards = activities
    .map(a => { const m = metaById[a.id]; return m ?? null; })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const pendingSeq = seqCards.filter(c => !completedIds.has(c.id));
  const doneSeq    = seqCards.filter(c =>  completedIds.has(c.id));
  const allDone    = pendingSeq.length === 0 && seqCards.length > 0;
  const currentAid = pendingSeq[0]?.id ?? null;   // first pending activity ID

  // Activity IDs in today's flow
  const todayActivityIds = new Set(activities.map(a => a.id));

  // theme primary
  const primary = isIronSov ? hudCyan : isNeonEmp ? fae.peachStrong : colors.primary;

  const snap = pathRec.progressSnapshot;

  // System guidance line
  const currentDash = DASH_CARDS.find(d => d.activityId === currentAid);
  const systemLine = allDone
    ? "All missions complete. Rest and recover."
    : currentDash
      ? `Begin with ${currentDash.label}.`
      : pathRec.headline;

  // Effects
  useEffect(() => { initLevelBaseline(lvl); }, [lvl]);
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent<{ sleptWell: boolean }>).detail;
      recordSleepCheck(d.sleptWell);
    };
    window.addEventListener("ascend:sleep-check", h);
    return () => window.removeEventListener("ascend:sleep-check", h);
  }, []);

  // Handlers
  const handleStartFlow = useCallback(() => { clearFlow(); clearSession(); setFlowActive(true); }, []);
  const handleFlowDone  = useCallback((ids: string[], _b: boolean) => {
    if (ids.length > 0) {
      markFlowCompleted(ids);
      if (ids.includes("phase1_meditation")) recordBreathingSession(true);
      localStorage.setItem("ascend_first_mission_done", "1");
      ids.forEach(id => markComplete(id));
    }
    setFlowActive(false);
  }, [markComplete]);

  const handleAvatarPick = (icon: string) => {
    saveAvatarIcon(icon); setAvatarState(icon); setShowAvatar(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SystemLayout>
      <CustomizePanel open={showCustomize} onClose={() => setShowCustomize(false)} />

      <AnimatePresence>
        {flowActive && (
          <DailyFlowEngine
            activities={activities} playerId={player.id}
            onComplete={handleFlowDone} onCancel={() => setFlowActive(false)}
            isOnboardingComplete={true}
          />
        )}
      </AnimatePresence>

      <AvatarPickerSheet
        open={showAvatar} current={avatarIcon} playerName={playerData?.name ?? ""}
        onPick={handleAvatarPick} onClose={() => setShowAvatar(false)}
        isIronSovereign={isIronSov} isNeonEmpress={isNeonEmp} colors={colors}
        fae={{ lavender: fae.lavender, lavenderDeep: fae.lavenderDeep, inkText: fae.ink }}
        pathColor={pathCfg.primaryColor}
      />

      <div className="flex flex-col gap-3.5 py-3 px-1 max-w-md mx-auto w-full" data-testid="day6-home">

        <AutoSwitchBanner navigate={navigate} />

        {/* ── PROFILE STRIP ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="flex items-center gap-3"
          data-testid="daily-status-section"
        >
          {/* Avatar */}
          <button
            onClick={() => setShowAvatar(true)} data-testid="button-avatar"
            className="relative shrink-0 active:scale-95 transition-transform"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
              style={{
                background: isIronSov
                  ? "linear-gradient(135deg,rgba(34,211,238,0.22),rgba(34,211,238,0.06))"
                  : isNeonEmp
                    ? `linear-gradient(135deg,${fae.lavender}55,${fae.lavenderDeep}22)`
                    : `linear-gradient(135deg,${colors.primary}22,${colors.primary}06)`,
                border: `2px solid ${primary}55`,
                boxShadow: `0 0 16px ${primary}40`,
              }}
            >
              {avatarIcon}
            </div>
            <div
              className="absolute -bottom-1 -right-1 px-1.5 py-px rounded-full text-[8px] font-bold leading-none"
              style={{ backgroundColor: primary, color: isNeonEmp ? fae.ink : "#000", border: "1px solid rgba(0,0,0,0.3)" }}
              data-testid="text-player-level"
            >
              {lvl}
            </div>
          </button>

          {/* Name + XP */}
          <div className="flex-1 min-w-0" data-testid="xp-progress-section">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[12px] font-bold"
                  style={{ color: isNeonEmp ? fae.ink : colors.text }}
                >
                  {playerData?.name ?? "Hunter"}
                </span>
                <span
                  className="text-[8px] px-1.5 py-px rounded-full font-mono"
                  style={{
                    backgroundColor: `${primary}1a`, color: primary,
                    border: `1px solid ${primary}30`,
                  }}
                >
                  Lv {lvl}
                </span>
              </div>
              <span className="text-[8px] font-mono" style={{ color: colors.textMuted }}>
                {xp.exp}/{xp.maxExp} XP
              </span>
            </div>

            {isIronSov ? (
              <SegBar fromPct={xpFrom} pct={xp.percent} fill={hudCyan} glow={hudCyanG} />
            ) : isNeonEmp ? (
              <PastelBar pct={xp.percent} />
            ) : (
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.10)" }}
                data-testid="xp-bar-track"
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: `${xpFrom}%` }}
                  animate={{ width: `${xp.percent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ backgroundColor: colors.primary, boxShadow: `0 0 8px ${colors.primaryGlow}` }}
                  data-testid="xp-bar-fill"
                />
              </div>
            )}

            <div className="flex items-center justify-between mt-1">
              <span className="text-[8px] font-medium" style={{ color: primary, opacity: 0.7 }}>
                {pathCfg.displayLabel}
              </span>
              <button
                onClick={() => setShowCustomize(true)} data-testid="button-customize"
                className="flex items-center gap-0.5 text-[8px] px-1.5 py-px rounded active:scale-95 transition-transform"
                style={{ color: colors.textMuted, backgroundColor: `${colors.primary}0c` }}
              >
                <Palette size={8} /> Theme
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── SYSTEM LINE ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.28, delay: 0.06 }}
          className="flex items-center gap-2 px-1"
          data-testid="system-message"
        >
          <span
            className="text-[8px] font-bold tracking-[0.22em] shrink-0"
            style={{ color: primary }}
          >
            SYSTEM
          </span>
          <span className="text-[8px]" style={{ color: colors.textMuted, opacity: 0.5 }}>·</span>
          <span
            className="text-[11px] font-medium leading-none"
            style={{ color: isNeonEmp ? fae.ink : colors.text, opacity: 0.85 }}
            data-testid="path-recommendation-text"
          >
            {systemLine}
          </span>
        </motion.div>

        {/* ── ALL DONE STATE ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              key="all-done"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{
                background: "rgba(6,22,10,0.85)",
                border: "1px solid rgba(34,197,94,0.35)",
                boxShadow: "0 0 28px rgba(34,197,94,0.14)",
                backdropFilter: "blur(12px)",
              }}
              data-testid="text-flow-completed"
            >
              <CheckCircle2 size={22} style={{ color: "#22c55e", flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: "#22c55e" }}>
                  Daily ritual complete
                </p>
                <p className="text-[10px] mt-px" style={{ color: colors.textMuted }}>
                  {xp.exp}/{xp.maxExp} XP · Lv {lvl} · ~{totalMins} min
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 2×2 STAT DASHBOARD ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.10 }}
          className="grid grid-cols-2 gap-2.5"
          data-testid="stat-grid"
        >
          {DASH_CARDS.map((dc, idx) => {
            const statLevel = playerData?.statLevels?.[dc.statKey];
            const sLvl   = statLevel?.level    ?? 1;
            const curXP  = statLevel?.currentXP ?? 0;
            const nxtXP  = statLevel?.xpForNext  ?? 100;
            const barPct = nxtXP > 0 ? Math.min(100, (curXP / nxtXP) * 100) : 0;

            // Determine card state from today's activity sequence
            const hasActivity = dc.activityId !== "" && todayActivityIds.has(dc.activityId);
            const isDone      = dc.activityId !== "" && completedIds.has(dc.activityId);
            const isCurrent   = dc.activityId !== "" && dc.activityId === currentAid;
            const isUpcoming  = hasActivity && !isDone && !isCurrent;

            const dest = hasActivity
              ? (metaById[dc.activityId]?.route ?? `/guided-session/${dc.activityId}`)
              : undefined;

            const durMins = hasActivity ? (actDurMap[dc.activityId] ?? 2) : null;

            return (
              <DashCard
                key={dc.id}
                idx={idx}
                icon={<dc.icon size={isCurrent ? 22 : 18} style={{ color: dc.color }} />}
                label={dc.label}
                sub={dc.sub}
                color={dc.color}
                glow={dc.glow}
                barLabel={dc.barLabel}
                barPct={barPct}
                statLvl={sLvl}
                isCurrent={isCurrent}
                isDone={isDone}
                isUpcoming={isUpcoming}
                isInactive={!hasActivity}
                durMins={durMins}
                isNeonEmp={isNeonEmp}
                inkText={fae.ink}
                textColor={isNeonEmp ? fae.ink : colors.text}
                mutedColor={isNeonEmp ? fae.ink + "88" : colors.textMuted}
                onClick={dest ? () => navigate(dest) : undefined}
              />
            );
          })}
        </motion.div>

        {/* ── FALLBACK FLOW TRIGGER ────────────────────────────────────────── */}
        {pendingSeq.length > 0 && (
          <button
            type="button"
            onClick={handleStartFlow}
            data-testid="button-begin-flow"
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[8px] tracking-[0.18em] uppercase"
            style={{ color: colors.textMuted, opacity: 0.45 }}
          >
            <Play size={8} /> Start full guided flow
          </button>
        )}

        {/* ── PROGRESS BAR (streak / readiness / today) ───────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.28, delay: 0.22 }}
          className="flex items-stretch rounded-2xl overflow-hidden"
          style={{
            background: "rgba(8,10,24,0.80)",
            border: `1px solid ${primary}22`,
            backdropFilter: "blur(12px)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
          }}
          data-testid="progress-strip"
        >
          {[
            { emoji: "🔥", val: String(snap.streak), label: "Streak", tid: "stat-streak" },
            { emoji: "⚡", val: `${snap.readinessPercent}%`, label: "Ready", tid: "stat-readiness" },
            { emoji: "✓",  val: `${doneSeq.length}/${seqCards.length}`, label: "Today", tid: "stat-sessions" },
          ].map((s, i, arr) => (
            <div key={s.tid} className="flex-1 flex flex-col items-center py-3 gap-0.5" data-testid={s.tid}
              style={{ borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
            >
              <span className="text-sm leading-none">{s.emoji}</span>
              <span className="text-sm font-extrabold leading-none mt-0.5" style={{ color: isNeonEmp ? fae.ink : colors.text }}>
                {s.val}
              </span>
              <span className="text-[8px] mt-0.5" style={{ color: colors.textMuted }}>{s.label}</span>
            </div>
          ))}
        </motion.div>

      </div>
    </SystemLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DashCard — individual 2×2 stat + mission card
// ─────────────────────────────────────────────────────────────────────────────

interface DashCardProps {
  idx: number;
  icon: React.ReactNode;
  label: string; sub: string;
  color: string; glow: string;
  barLabel: string; barPct: number; statLvl: number;
  isCurrent: boolean; isDone: boolean; isUpcoming: boolean; isInactive: boolean;
  durMins: number | null;
  isNeonEmp: boolean; inkText: string; textColor: string; mutedColor: string;
  onClick?: () => void;
}

function DashCard({
  idx, icon, label, sub, color, glow, barLabel, barPct, statLvl,
  isCurrent, isDone, isUpcoming, isInactive,
  durMins, isNeonEmp, inkText, textColor, mutedColor, onClick,
}: DashCardProps) {
  const bg = isDone
    ? "rgba(6,20,10,0.84)"
    : isCurrent
      ? "rgba(8,10,26,0.92)"
      : "rgba(8,10,22,0.80)";

  const borderColor = isDone
    ? "rgba(34,197,94,0.40)"
    : isCurrent
      ? `${color}60`
      : `${color}22`;

  const shadow = isCurrent
    ? `0 0 32px ${glow.replace("0.50", "0.22")}, 0 0 64px ${glow.replace("0.50", "0.08")}, 0 6px 24px rgba(0,0,0,0.5)`
    : isDone
      ? "0 0 16px rgba(34,197,94,0.10), 0 4px 16px rgba(0,0,0,0.4)"
      : "0 2px 12px rgba(0,0,0,0.4)";

  const opacity = isUpcoming ? 0.75 : isInactive ? 0.60 : 1;

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity, y: 0 }}
      transition={{ duration: 0.32, delay: idx * 0.06 }}
      whileTap={onClick ? { scale: 0.97 } : {}}
      className="flex flex-col gap-2.5 p-3.5 rounded-2xl h-full"
      style={{
        background: bg,
        border: `1px solid ${borderColor}`,
        boxShadow: shadow,
        backdropFilter: "blur(14px)",
        minHeight: isCurrent ? "155px" : "138px",
      }}
    >
      {/* Top row: icon + level badge */}
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: isDone ? "rgba(34,197,94,0.12)" : `${color}14`,
            border: `1px solid ${isDone ? "rgba(34,197,94,0.25)" : `${color}28`}`,
          }}
        >
          {isDone
            ? <CheckCircle2 size={18} style={{ color: "#22c55e" }} />
            : icon}
        </div>
        <div className="flex flex-col items-end gap-1">
          {isCurrent && (
            <span
              className="text-[7px] font-bold uppercase tracking-[0.18em] px-1.5 py-px rounded-full"
              style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}35` }}
            >
              Active
            </span>
          )}
          {isDone && (
            <span
              className="text-[7px] font-bold uppercase tracking-[0.18em] px-1.5 py-px rounded-full"
              style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}
            >
              Done
            </span>
          )}
          <span
            className="text-[8px] font-mono px-1.5 py-px rounded-full"
            style={{
              backgroundColor: `${color}0e`,
              color: isDone ? "#22c55e" : color,
              border: `1px solid ${isDone ? "rgba(34,197,94,0.18)" : `${color}20`}`,
            }}
          >
            Lv {statLvl}
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="flex-1">
        <p
          className="text-[13px] font-bold leading-tight"
          style={{ color: isDone ? "#22c55e" : textColor }}
        >
          {label}
        </p>
        <p className="text-[9px] mt-0.5" style={{ color: mutedColor }}>
          {sub}
        </p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[7px] uppercase tracking-[0.14em]" style={{ color: mutedColor }}>{barLabel}</span>
          <span className="text-[7px] font-mono" style={{ color: mutedColor }}>{Math.round(barPct)}%</span>
        </div>
        <div
          className="w-full h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: isDone ? "rgba(34,197,94,0.12)" : `${color}12` }}
        >
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${barPct}%` }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 + idx * 0.06 }}
            style={{
              backgroundColor: isDone ? "#22c55e" : color,
              boxShadow: isDone ? "0 0 6px rgba(34,197,94,0.5)" : `0 0 6px ${glow}`,
            }}
          />
        </div>
      </div>

      {/* Begin button — only on current active mission */}
      {isCurrent && durMins && (
        <div
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-[0.12em]"
          style={{
            backgroundColor: color,
            color: "#000",
            boxShadow: `0 0 16px ${glow}`,
          }}
        >
          Begin · {durMins}m <ArrowRight size={11} />
        </div>
      )}
    </motion.div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        data-testid={isCurrent ? "mission-card-current" : `mission-card-${label.toLowerCase().replace(/\s/g, "-")}`}
        className="w-full text-left"
      >
        {inner}
      </button>
    );
  }
  return (
    <div data-testid={`mission-card-${label.toLowerCase().replace(/\s/g, "-")}`}>
      {inner}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// XP bars
// ─────────────────────────────────────────────────────────────────────────────

function SegBar({ fromPct = 0, pct, fill, glow, segs = 20 }: {
  fromPct?: number; pct: number; fill: string; glow: string; segs?: number;
}) {
  const target = Math.round((Math.max(0, Math.min(100, pct))     / 100) * segs);
  const from   = Math.round((Math.max(0, Math.min(100, fromPct)) / 100) * segs);
  const newN   = Math.max(0, target - from);
  return (
    <div className="w-full flex gap-[2px] h-1.5 items-center" data-testid="xp-bar-track">
      {Array.from({ length: segs }).map((_, i) => {
        const on  = i < target;
        const isN = i >= from && i < target;
        return (
          <motion.div
            key={i} className="flex-1 h-full rounded-[2px]"
            animate={{
              backgroundColor: on ? fill : "rgba(255,255,255,0.07)",
              boxShadow: on ? `0 0 4px ${glow}` : "none",
            }}
            transition={{ duration: 0.10, ease: "easeOut", delay: isN ? ((i - from) / Math.max(newN, 1)) * 0.8 : 0 }}
            data-testid={i === 0 ? "xp-bar-fill" : undefined}
          />
        );
      })}
    </div>
  );
}

function PastelBar({ pct }: { pct: number }) {
  return (
    <div
      className="w-full h-1.5 rounded-full overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.35)" }}
      data-testid="xp-bar-track"
    >
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ background: "linear-gradient(90deg,#f7e5b6,#f4a6c8,#b59cf2)", boxShadow: "0 0 6px rgba(180,150,240,0.5)" }}
        data-testid="xp-bar-fill"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AutoSwitchBanner
// ─────────────────────────────────────────────────────────────────────────────

function AutoSwitchBanner({ navigate }: { navigate: (to: string) => void }) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(shouldPromptAutoSwitch());
    const h = () => setShow(shouldPromptAutoSwitch());
    window.addEventListener("ascend:vitality-flow-changed", h);
    window.addEventListener("ascend:sleep-mode-changed", h);
    return () => {
      window.removeEventListener("ascend:vitality-flow-changed", h);
      window.removeEventListener("ascend:sleep-mode-changed", h);
    };
  }, []);

  if (!show) return null;
  const accept  = () => { setSleepMode("adaptive"); setShow(false); navigate("/sleep-settings"); };
  const dismiss = () => { dismissAutoSwitchPrompt(); setShow(false); };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-3 rounded-2xl"
      style={{
        background: "rgba(8,10,24,0.82)",
        border: "1px solid rgba(251,191,36,0.28)",
        boxShadow: "0 0 20px rgba(251,191,36,0.10)",
        backdropFilter: "blur(12px)",
      }}
      data-testid="auto-switch-banner"
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.22)" }}
      >
        <Sparkles size={14} style={{ color: "#fbbf24" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold" style={{ color: "#fde68a" }}>You're doing great</p>
        <p className="text-[10px] mt-px leading-snug" style={{ color: colors.textMuted }}>
          Switch to Adaptive Mode to trim guidance you no longer need.
        </p>
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={accept} data-testid="button-accept-adaptive"
            className="text-[10px] font-bold px-3 py-1 rounded-lg"
            style={{ backgroundColor: "#fbbf24", color: "#1a1208" }}
          >
            Switch
          </button>
          <button type="button" onClick={dismiss} data-testid="button-dismiss-adaptive"
            className="text-[10px] px-2 py-1 rounded-lg" style={{ color: colors.textMuted }}
          >
            Not now
          </button>
        </div>
      </div>
      <button type="button" onClick={dismiss} className="shrink-0 p-1" style={{ color: colors.textMuted }}>
        <X size={13} />
      </button>
    </motion.div>
  );
}
