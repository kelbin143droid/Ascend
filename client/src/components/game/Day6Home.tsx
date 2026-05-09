import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, CheckCircle2, Sparkles, X, Palette,
  ArrowRight, Heart, Zap, Shield, Flame,
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
  insight: string; onboardingDay: number;
  isOnboardingComplete: boolean; streak: number;
  stability?: { consecutiveActiveDays?: number };
}
interface StatLevel { level: number; currentXP: number; xpForNext: number; }
interface PlayerData {
  level: number; exp: number; maxExp: number; totalExp: number;
  name?: string; statLevels?: Record<string, StatLevel>;
  hp?: number; maxHp?: number; mp?: number; maxMp?: number;
}
interface Player { id: string; }
interface ScalingData { trainingScaling?: Record<string, { tier: number }>; }
interface Props {
  homeData: HomeData; playerData: PlayerData | null;
  player: Player; scalingData: ScalingData | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Card definitions
// barType: "mp" | "hp" use living player stats; "xp" uses statLevels XP
// fallbackRoute: used when the activity is not in today's flow or is done
// ─────────────────────────────────────────────────────────────────────────────

const DASH_CARDS = [
  {
    id: "calm",       activityId: "phase1_meditation", statKey: "sense",
    label: "Calm Mind",  sub: "Focus & Recovery",
    icon: Brain,  color: "#818cf8", glow: "rgba(129,140,248,0.45)",
    barLabel: "MP", barType: "mp" as const, fallbackRoute: "/coach",
  },
  {
    id: "vitality",   activityId: "",                  statKey: "vitality",
    label: "Vitality",   sub: "Sleep & Recovery",
    icon: Heart,  color: "#f87171", glow: "rgba(248,113,113,0.45)",
    barLabel: "HP", barType: "hp" as const, fallbackRoute: "/sectograph",
  },
  {
    id: "strength",   activityId: "phase1_strength",   statKey: "strength",
    label: "Strength",   sub: "Power & Resilience",
    icon: Shield, color: "#fbbf24", glow: "rgba(251,191,36,0.45)",
    barLabel: "STR", barType: "xp" as const, fallbackRoute: "/train",
  },
  {
    id: "agility",    activityId: "phase1_agility",    statKey: "agility",
    label: "Agility",    sub: "Speed & Flow",
    icon: Zap,    color: "#34d399", glow: "rgba(52,211,153,0.45)",
    barLabel: "AGI", barType: "xp" as const, fallbackRoute: "/train",
  },
] as const;

// System card hint lines
const SYSTEM_HINTS: Record<string, string> = {
  phase1_meditation: "Mental recovery recommended today.",
  phase1_agility:    "Movement flow supports your rhythm.",
  phase1_strength:   "Strength training on the schedule.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared card style token
// ─────────────────────────────────────────────────────────────────────────────

const CARD_BASE = "rounded-2xl p-4 flex flex-col gap-3 w-full text-left";

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
  const fae = { peach: "#fbcaad", peachStrong: "#f4845f", lavender: "#c8b9ee", lavenderDeep: "#8d75c4", ink: "#2d1b4e" };

  const primary  = isIronSov ? hudCyan  : isNeonEmp ? fae.peachStrong : colors.primary;
  const textCol  = isNeonEmp ? fae.ink  : colors.text;
  const mutedCol = isNeonEmp ? fae.ink + "88" : colors.textMuted;

  const [, navigate] = useLocation();
  const [showCustomize, setShowCustomize] = useState(false);
  const [showAvatar,    setShowAvatar]    = useState(false);
  const [avatarIcon,    setAvatarState]   = useState(() => getAvatarIcon());
  const [flowActive,    setFlowActive]    = useState(false);

  const { completedIds, markComplete } = useSessionProgress();

  // Path + activity config
  const tiers: CategoryTiers = {
    strength:   scalingData?.trainingScaling?.strength?.tier   ?? 1,
    agility:    scalingData?.trainingScaling?.agility?.tier    ?? 1,
    meditation: scalingData?.trainingScaling?.meditation?.tier ?? 1,
    vitality:   scalingData?.trainingScaling?.vitality?.tier   ?? 1,
  };
  const [wlevel]   = useState(() => getWorkoutLevel());
  const pathCfg    = getPathFlowConfig(wlevel);
  const pathRec    = getPathAwareRecommendation(wlevel);
  const activities = buildDailyFlowActivities(wlevel, { dayNumber: homeData.onboardingDay, tiers });
  const totalMins  = Math.ceil(activities.reduce((s, a) => s + a.duration, 0) / 60);
  const actDurMap  = Object.fromEntries(activities.map(a => [a.id, Math.max(1, Math.round(a.duration / 60))]));

  // XP
  const xp  = computeXPState(playerData?.totalExp ?? 0, playerData?.level ?? 1, playerData?.exp ?? 0, playerData?.maxExp ?? 100);
  const lvl = playerData?.level ?? 1;
  const [xpFrom, setXpFrom] = useState(xp.percent);
  const xpRef = useRef(xp.percent);
  useEffect(() => {
    if (xp.percent !== xpRef.current) { setXpFrom(xpRef.current); xpRef.current = xp.percent; }
  }, [xp.percent]);

  // Mission sequencing
  const metaById   = Object.fromEntries(pathCfg.sessionCards.map(c => [c.id, c]));
  const seqCards   = activities.map(a => metaById[a.id] ?? null).filter(Boolean) as NonNullable<typeof metaById[string]>[];
  const pendingSeq = seqCards.filter(c => !completedIds.has(c.id));
  const doneSeq    = seqCards.filter(c =>  completedIds.has(c.id));
  const allDone    = pendingSeq.length === 0 && seqCards.length > 0;
  const currentAid = pendingSeq[0]?.id ?? null;
  const todayIds   = new Set(activities.map(a => a.id));

  // Living stats
  const hp    = playerData?.hp    ?? 100;
  const maxHp = playerData?.maxHp ?? 100;
  const mp    = playerData?.mp    ?? 10;
  const maxMp = playerData?.maxMp ?? 10;
  const hpPct = maxHp > 0 ? Math.min(100, (hp / maxHp) * 100) : 100;
  const mpPct = maxMp > 0 ? Math.min(100, (mp / maxMp) * 100) : 100;

  const snap   = pathRec.progressSnapshot;
  const streak = snap.streak;
  const hasStreak = streak >= 3;

  // System card
  const currentDashLabel = DASH_CARDS.find(d => d.activityId === currentAid)?.label ?? null;
  const systemMission = allDone ? "All missions complete."
    : currentDashLabel ? `Begin with ${currentDashLabel}.` : pathRec.headline;
  const systemHint = allDone ? "Rest well. You showed up today."
    : currentAid ? (SYSTEM_HINTS[currentAid] ?? "") : "";

  // Effects & handlers
  useEffect(() => { initLevelBaseline(lvl); }, [lvl]);
  useEffect(() => {
    const h = (e: Event) => recordSleepCheck((e as CustomEvent<{ sleptWell: boolean }>).detail.sleptWell);
    window.addEventListener("ascend:sleep-check", h);
    return () => window.removeEventListener("ascend:sleep-check", h);
  }, []);
  const handleFlowDone = useCallback((ids: string[], _b: boolean) => {
    if (ids.length > 0) {
      markFlowCompleted(ids);
      if (ids.includes("phase1_meditation")) recordBreathingSession(true);
      localStorage.setItem("ascend_first_mission_done", "1");
      ids.forEach(id => markComplete(id));
    }
    setFlowActive(false);
  }, [markComplete]);
  const handleAvatarPick = (icon: string) => { saveAvatarIcon(icon); setAvatarState(icon); setShowAvatar(false); };

  // Featured vs supporting
  const featuredCard = DASH_CARDS.find(d => d.activityId === currentAid) ?? null;
  const supportCards = DASH_CARDS.filter(d => d !== featuredCard);

  // Helper: resolve route for a support card
  const resolveRoute = (dc: (typeof DASH_CARDS)[number]) => {
    if (dc.activityId === "") return dc.fallbackRoute;
    const inFlow = todayIds.has(dc.activityId);
    const isDone = completedIds.has(dc.activityId);
    if (inFlow && !isDone) return metaById[dc.activityId]?.route ?? `/guided-session/${dc.activityId}`;
    return dc.fallbackRoute;
  };

  // Helper: task description for support card
  const taskDesc = (dc: (typeof DASH_CARDS)[number]) => {
    if (dc.id === "vitality") return hp >= maxHp ? "Full recovery · HP 100%" : `HP ${hp}/${maxHp} · Hydration check`;
    const meta = metaById[dc.activityId];
    if (meta?.sublabel) return meta.sublabel.split("·")[0].trim();
    return dc.sub;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SystemLayout>
      <CustomizePanel open={showCustomize} onClose={() => setShowCustomize(false)} />
      <AnimatePresence>
        {flowActive && (
          <DailyFlowEngine activities={activities} playerId={player.id}
            onComplete={handleFlowDone} onCancel={() => setFlowActive(false)}
            isOnboardingComplete={true} />
        )}
      </AnimatePresence>
      <AvatarPickerSheet
        open={showAvatar} current={avatarIcon} playerName={playerData?.name ?? ""}
        onPick={handleAvatarPick} onClose={() => setShowAvatar(false)}
        isIronSovereign={isIronSov} isNeonEmpress={isNeonEmp} colors={colors}
        fae={{ lavender: fae.lavender, lavenderDeep: fae.lavenderDeep, inkText: fae.ink }}
        pathColor={pathCfg.primaryColor}
      />

      {/* Streak glow keyframe */}
      <style>{`
        @keyframes streakRingPulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50%       { opacity: 0.90; transform: scale(1.06); }
        }
        @keyframes streakBarGlow {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1; }
        }
        @keyframes cardBorderPulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1; }
        }
      `}</style>

      <div className="flex flex-col gap-4 py-2 px-0.5 max-w-md mx-auto w-full" data-testid="day6-home">

        <AutoSwitchBanner navigate={navigate} colors={colors} primary={primary} />

        {/* ── PROFILE STRIP ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 px-0.5"
          data-testid="daily-status-section"
        >
          {/* Avatar with optional streak ring */}
          <button onClick={() => setShowAvatar(true)} data-testid="button-avatar"
            className="relative shrink-0 active:scale-95 transition-transform">
            {hasStreak && (
              <div
                className="absolute inset-[-5px] rounded-full pointer-events-none"
                style={{
                  border: `2px solid ${primary}`,
                  boxShadow: `0 0 16px ${primary}60`,
                  animation: "streakRingPulse 2.4s ease-in-out infinite",
                }}
              />
            )}
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-xl relative z-10"
              style={{
                background: `linear-gradient(135deg,${primary}22,${primary}08)`,
                border: `2px solid ${primary}44`,
                boxShadow: hasStreak ? `0 0 20px ${primary}50` : `0 0 10px ${primary}28`,
              }}
            >
              {avatarIcon}
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold leading-none z-20"
              style={{ backgroundColor: primary, color: isNeonEmp ? fae.ink : "#000" }}
              data-testid="text-player-level"
            >
              {lvl}
            </div>
          </button>

          {/* Name + XP + streak badge */}
          <div className="flex-1 min-w-0" data-testid="xp-progress-section">
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold" style={{ color: textCol }}>
                  {playerData?.name ?? "Hunter"}
                </span>
                {hasStreak && (
                  <span
                    className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${primary}1a`, color: primary, border: `1px solid ${primary}30` }}
                    data-testid="stat-streak"
                  >
                    <Flame size={8} /> {streak}
                  </span>
                )}
              </div>
              <span className="text-[9px]" style={{ color: mutedCol }}>
                {xp.exp}/{xp.maxExp} XP
              </span>
            </div>

            {/* XP bar — gets subtle glow underlay on streak */}
            <div className="relative">
              {hasStreak && (
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    boxShadow: `0 0 12px ${primary}35`,
                    animation: "streakBarGlow 2.4s ease-in-out infinite",
                  }}
                />
              )}
              {isIronSov ? (
                <SegBar fromPct={xpFrom} pct={xp.percent} fill={hudCyan} glow={hudCyanG} />
              ) : isNeonEmp ? (
                <PastelBar pct={xp.percent} />
              ) : (
                <div className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }} data-testid="xp-bar-track">
                  <motion.div className="h-full rounded-full"
                    initial={{ width: `${xpFrom}%` }} animate={{ width: `${xp.percent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ backgroundColor: colors.primary, boxShadow: `0 0 6px ${colors.primaryGlow}` }}
                    data-testid="xp-bar-fill" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[9px]" style={{ color: primary, opacity: 0.75 }}>
                {pathCfg.displayLabel}
              </span>
              <button onClick={() => setShowCustomize(true)} data-testid="button-customize"
                className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-lg active:scale-95 transition-transform"
                style={{ color: mutedCol, backgroundColor: `${primary}10` }}>
                <Palette size={9} /> Theme
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── SYSTEM CARD ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06 }}
          className="rounded-2xl px-4 py-3"
          style={{
            background: "rgba(6,8,20,0.90)",
            borderLeft: `3px solid ${primary}`,
            boxShadow: `0 0 20px ${primary}12, 0 4px 20px rgba(0,0,0,0.45)`,
            backdropFilter: "blur(16px)",
          }}
          data-testid="system-message"
        >
          <p className="text-[8px] font-bold tracking-[0.26em] mb-1" style={{ color: primary }}>
            SYSTEM
          </p>
          <p className="text-[13px] font-semibold leading-snug" style={{ color: textCol }}
            data-testid="path-recommendation-text">
            {systemMission}
          </p>
          {systemHint && (
            <p className="text-[10px] mt-0.5 leading-snug" style={{ color: mutedCol }}>{systemHint}</p>
          )}
        </motion.div>

        {/* ── ALL DONE ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {allDone && (
            <motion.div key="all-done"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.28 }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
              style={{
                background: "rgba(4,18,8,0.92)",
                boxShadow: "0 0 32px rgba(34,197,94,0.14), 0 4px 20px rgba(0,0,0,0.45)",
                backdropFilter: "blur(16px)",
              }}
              data-testid="text-flow-completed"
            >
              <CheckCircle2 size={22} style={{ color: "#22c55e", flexShrink: 0 }} />
              <div>
                <p className="text-[13px] font-bold" style={{ color: "#22c55e" }}>Daily ritual complete</p>
                <p className="text-[10px] mt-0.5" style={{ color: mutedCol }}>
                  Lv {lvl} · {xp.exp}/{xp.maxExp} XP · {totalMins} min today
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FEATURED MISSION CARD ─────────────────────────────────────── */}
        {!allDone && featuredCard && (() => {
          const dc    = featuredCard;
          const dur   = actDurMap[dc.activityId] ?? 2;
          const barPct = dc.barType === "mp" ? mpPct : dc.barType === "hp" ? hpPct
            : (() => { const sl = playerData?.statLevels?.[dc.statKey]; return sl ? Math.min(100, (sl.currentXP / sl.xpForNext) * 100) : 0; })();
          const dest  = metaById[dc.activityId]?.route ?? `/guided-session/${dc.activityId}`;

          return (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12 }}
            >
              {/* Animated glow ring — pulsing border effect */}
              <motion.div
                className="rounded-2xl"
                animate={{
                  boxShadow: [
                    `0 0 24px ${dc.glow.replace("0.45","0.18")}, 0 8px 32px rgba(0,0,0,0.5)`,
                    `0 0 48px ${dc.glow.replace("0.45","0.38")}, 0 8px 32px rgba(0,0,0,0.5)`,
                    `0 0 24px ${dc.glow.replace("0.45","0.18")}, 0 8px 32px rgba(0,0,0,0.5)`,
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.button
                  type="button"
                  onClick={() => navigate(dest)}
                  whileTap={{ scale: 0.985 }}
                  className={`${CARD_BASE} gap-4`}
                  style={{
                    background: `linear-gradient(140deg, rgba(8,10,26,0.97) 0%, rgba(12,14,32,0.95) 100%)`,
                    border: `1.5px solid ${dc.color}55`,
                    backdropFilter: "blur(18px)",
                    padding: "20px",
                  }}
                  data-testid="mission-card-current"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        animate={{
                          boxShadow: [
                            `0 0 12px ${dc.glow.replace("0.45","0.20")}`,
                            `0 0 28px ${dc.glow.replace("0.45","0.45")}`,
                            `0 0 12px ${dc.glow.replace("0.45","0.20")}`,
                          ],
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                          background: `linear-gradient(135deg, ${dc.color}22, ${dc.color}0a)`,
                          border: `1px solid ${dc.color}35`,
                        }}
                      >
                        <dc.icon size={24} style={{ color: dc.color }} />
                      </motion.div>
                      <div>
                        <p className="text-[17px] font-bold leading-none mb-1" style={{ color: textCol }}>
                          {dc.label}
                        </p>
                        <p className="text-[10px]" style={{ color: mutedCol }}>{dc.sub}</p>
                      </div>
                    </div>
                    <span
                      className="text-[7px] font-bold tracking-[0.22em] px-2 py-1 rounded-full shrink-0 uppercase"
                      style={{ background: `${dc.color}18`, color: dc.color, border: `1px solid ${dc.color}35` }}
                    >
                      Active
                    </span>
                  </div>

                  {/* Bar */}
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[9px]" style={{ color: mutedCol }}>{dc.barLabel}</span>
                      <span className="text-[9px] font-mono" style={{ color: mutedCol }}>{Math.round(barPct)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: `${dc.color}14` }}>
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
                        style={{ background: dc.color, boxShadow: `0 0 10px ${dc.glow}` }} />
                    </div>
                  </div>

                  {/* Begin button */}
                  <div
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-[13px]"
                    style={{
                      background: `linear-gradient(90deg, ${dc.color}ee, ${dc.color}cc)`,
                      color: "#000",
                      boxShadow: `0 4px 22px ${dc.glow.replace("0.45","0.40")}`,
                    }}
                  >
                    Begin · {dur} min <ArrowRight size={14} />
                  </div>
                </motion.button>
              </motion.div>
            </motion.div>
          );
        })()}

        {/* ── SUPPORTING CARDS ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: allDone ? 0.12 : 0.24 }}
          className={`grid gap-3 ${allDone ? "grid-cols-2" : "grid-cols-3"}`}
          data-testid="stat-grid"
        >
          {(allDone ? [...DASH_CARDS] : supportCards).map((dc, idx) => {
            const isDone     = dc.activityId !== "" && completedIds.has(dc.activityId);
            const inFlow     = dc.activityId !== "" && todayIds.has(dc.activityId);
            const isUpcoming = inFlow && !isDone;
            const route      = resolveRoute(dc);
            const desc       = taskDesc(dc);

            const sl     = playerData?.statLevels?.[dc.statKey];
            const sLvl   = sl?.level ?? 1;

            // HP/MP cards always show bar; XP cards show bar only in allDone 2×2 view
            const showBar = dc.barType === "hp" || dc.barType === "mp" || allDone;
            const barPct  = dc.barType === "mp" ? mpPct
              : dc.barType === "hp" ? hpPct
              : (sl ? Math.min(100, (sl.currentXP / sl.xpForNext) * 100) : 0);

            const cardBg    = isDone ? "rgba(4,18,8,0.90)" : "rgba(6,8,20,0.88)";
            const borderCol = isDone ? "rgba(34,197,94,0.30)" : `${dc.color}28`;
            const glowShadow = isDone
              ? "0 0 14px rgba(34,197,94,0.08), 0 4px 18px rgba(0,0,0,0.45)"
              : `0 0 14px ${dc.glow.replace("0.45","0.08")}, 0 4px 18px rgba(0,0,0,0.45)`;

            return (
              <motion.button
                key={dc.id}
                type="button"
                onClick={() => navigate(route)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: isUpcoming || !inFlow ? 0.82 : 1, y: 0 }}
                whileHover={{ scale: 1.025, transition: { duration: 0.18 } }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.3, delay: 0.24 + idx * 0.05 }}
                className={CARD_BASE}
                style={{
                  background: cardBg,
                  border: `1px solid ${borderCol}`,
                  boxShadow: glowShadow,
                  backdropFilter: "blur(16px)",
                  minHeight: allDone ? 145 : 130,
                }}
                data-testid={`mission-card-${dc.label.toLowerCase().replace(/\s/g,"-")}`}
              >
                {/* Icon row */}
                <div className="flex items-center justify-between">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: isDone ? "rgba(34,197,94,0.10)" : `${dc.color}14`,
                      border: `1px solid ${isDone ? "rgba(34,197,94,0.22)" : `${dc.color}22`}`,
                    }}
                  >
                    {isDone
                      ? <CheckCircle2 size={17} style={{ color: "#22c55e" }} />
                      : <dc.icon size={17} style={{ color: dc.color }} />}
                  </div>
                  <span
                    className="text-[7px] font-mono px-1.5 py-0.5 rounded-full"
                    style={{
                      background: isDone ? "rgba(34,197,94,0.10)" : `${dc.color}0e`,
                      color: isDone ? "#22c55e" : dc.color,
                    }}
                  >
                    Lv {sLvl}
                  </span>
                </div>

                {/* Label + desc */}
                <div className="flex-1">
                  <p className="text-[12px] font-bold leading-none mb-1"
                    style={{ color: isDone ? "#22c55e" : textCol }}>
                    {dc.label}
                  </p>
                  <p className="text-[9px] leading-snug" style={{ color: mutedCol }}>
                    {desc}
                  </p>
                </div>

                {/* Bar — HP/MP living stats always; XP only in 2×2 view */}
                {showBar && (
                  <div>
                    <div className="w-full h-1 rounded-full overflow-hidden"
                      style={{ background: isDone ? "rgba(34,197,94,0.10)" : `${dc.color}12` }}>
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.75, ease: "easeOut", delay: 0.3 + idx * 0.06 }}
                        style={{
                          background: isDone ? "#22c55e" : dc.color,
                          boxShadow: isDone ? "0 0 4px rgba(34,197,94,0.5)" : `0 0 5px ${dc.glow}`,
                        }} />
                    </div>
                  </div>
                )}

                {/* Tap hint */}
                <div className="flex items-center justify-end">
                  <span className="text-[7px] flex items-center gap-0.5" style={{ color: isDone ? "#22c55e88" : `${dc.color}70` }}>
                    {isDone ? "done" : "tap to open"} <ArrowRight size={7} />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

      </div>
    </SystemLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// XP bars
// ─────────────────────────────────────────────────────────────────────────────

function SegBar({ fromPct = 0, pct, fill, glow, segs = 20 }: {
  fromPct?: number; pct: number; fill: string; glow: string; segs?: number;
}) {
  const target = Math.round((Math.max(0, Math.min(100, pct))    / 100) * segs);
  const from   = Math.round((Math.max(0, Math.min(100, fromPct))/ 100) * segs);
  const newN   = Math.max(0, target - from);
  return (
    <div className="w-full flex gap-[2px] h-1.5 items-center" data-testid="xp-bar-track">
      {Array.from({ length: segs }).map((_, i) => {
        const on = i < target; const isN = i >= from && i < target;
        return (
          <motion.div key={i} className="flex-1 h-full rounded-[2px]"
            animate={{ backgroundColor: on ? fill : "rgba(255,255,255,0.07)", boxShadow: on ? `0 0 4px ${glow}` : "none" }}
            transition={{ duration: 0.10, ease: "easeOut", delay: isN ? ((i - from) / Math.max(newN, 1)) * 0.8 : 0 }}
            data-testid={i === 0 ? "xp-bar-fill" : undefined} />
        );
      })}
    </div>
  );
}

function PastelBar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.30)" }} data-testid="xp-bar-track">
      <motion.div className="h-full rounded-full"
        initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ background: "linear-gradient(90deg,#f7e5b6,#f4a6c8,#b59cf2)", boxShadow: "0 0 6px rgba(180,150,240,0.5)" }}
        data-testid="xp-bar-fill" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AutoSwitchBanner
// ─────────────────────────────────────────────────────────────────────────────

function AutoSwitchBanner({ navigate, colors, primary }: {
  navigate: (to: string) => void; colors: { textMuted: string }; primary: string;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(shouldPromptAutoSwitch());
    const h = () => setShow(shouldPromptAutoSwitch());
    window.addEventListener("ascend:vitality-flow-changed", h);
    window.addEventListener("ascend:sleep-mode-changed", h);
    return () => { window.removeEventListener("ascend:vitality-flow-changed", h); window.removeEventListener("ascend:sleep-mode-changed", h); };
  }, []);
  if (!show) return null;
  const accept  = () => { setSleepMode("adaptive"); setShow(false); navigate("/sleep-settings"); };
  const dismiss = () => { dismissAutoSwitchPrompt(); setShow(false); };
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-3.5 rounded-2xl"
      style={{ background: "rgba(6,8,20,0.92)", borderLeft: "3px solid rgba(251,191,36,0.60)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", backdropFilter: "blur(16px)" }}
      data-testid="auto-switch-banner">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(251,191,36,0.12)" }}>
        <Sparkles size={14} style={{ color: "#fbbf24" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold mb-0.5" style={{ color: "#fde68a" }}>You're doing great</p>
        <p className="text-[10px] leading-snug" style={{ color: colors.textMuted }}>
          Switch to Adaptive Mode for a lighter, personalised flow.
        </p>
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={accept} data-testid="button-accept-adaptive"
            className="text-[10px] font-bold px-3 py-1 rounded-lg"
            style={{ background: "#fbbf24", color: "#1a1208" }}>Switch</button>
          <button type="button" onClick={dismiss} data-testid="button-dismiss-adaptive"
            className="text-[10px] px-2 py-1 rounded-lg" style={{ color: colors.textMuted }}>Not now</button>
        </div>
      </div>
      <button type="button" onClick={dismiss} className="shrink-0 p-1" style={{ color: colors.textMuted }}>
        <X size={13} />
      </button>
    </motion.div>
  );
}
