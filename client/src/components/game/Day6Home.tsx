import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Brain, Wind, Dumbbell, Heart, ChevronDown, ChevronUp, CheckCircle2, Zap, Shield, Gamepad2 } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { DailyFlowEngine } from "./DailyFlowEngine";
import { SystemLayout } from "./SystemLayout";
import { buildPhase1Activities, type CategoryTiers } from "@/lib/activityEngine";
import { getStats, recordSleepCheck, recordBreathingSession, getHPColor, getManaColor, MANA_MAX, type GameStats } from "@/lib/statsSystem";
import { markFlowCompleted, getFlowCompletedToday } from "@/lib/userState";
import { computeXPState } from "@/lib/xpSystem";

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

const GAME_STATS = [
  { label: "STR", name: "Strength", key: "strength", color: "#ef4444", source: "Training" },
  { label: "AGI", name: "Agility",  key: "agility",  color: "#22c55e", source: "Movement" },
  { label: "VIT", name: "Vitality", key: "vitality", color: "#f59e0b", source: "Wellness" },
  { label: "SEN", name: "Sense",    key: "sense",    color: "#a855f7", source: "Meditation" },
];

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

const SESSION_LIST = [
  { id: "phase1_vitality", label: "Vitality Check", sublabel: "Sleep · Hydration · Nutrition", icon: Heart, color: "#f59e0b", stat: "HP" },
  { id: "phase1_meditation", label: "Calm Breathing", sublabel: "4-4-6 breathing rhythm · 2 min", icon: Brain, color: "#3b82f6", stat: "Mana" },
  { id: "phase1_agility", label: "Agility Flow", sublabel: "Stretch circuit · 3 min", icon: Wind, color: "#22c55e", stat: "Agility" },
  { id: "phase1_strength", label: "Physical Circuit", sublabel: "Push-ups · Plank · Cardio", icon: Dumbbell, color: "#ef4444", stat: "Strength" },
];

export function Day6Home({ homeData, playerData, player, scalingData }: Props) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [, navigate] = useLocation();
  const [flowActive, setFlowActive] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [flowCompletedDate, setFlowCompletedDate] = useState(() =>
    localStorage.getItem("ascend_light_movement_completed") ?? ""
  );
  const [stats, setStats] = useState<GameStats>(() => getStats());
  const today = new Date().toISOString().split("T")[0];
  const flowCompletedToday = flowCompletedDate === today;

  const tiers: CategoryTiers = {
    strength: scalingData?.trainingScaling?.strength?.tier ?? 1,
    agility: scalingData?.trainingScaling?.agility?.tier ?? 1,
    meditation: scalingData?.trainingScaling?.meditation?.tier ?? 1,
    vitality: scalingData?.trainingScaling?.vitality?.tier ?? 1,
  };
  const activities = buildPhase1Activities(homeData.onboardingDay, tiers);
  const totalMins = Math.ceil(activities.reduce((s, a) => s + a.duration, 0) / 60);

  const xp = computeXPState(
    playerData?.totalExp ?? 0,
    playerData?.level ?? 2,
    playerData?.exp ?? 0,
    playerData?.maxExp ?? 100
  );

  const refreshStats = useCallback(() => setStats(getStats()), []);

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
    }
    setFlowActive(false);
    refreshStats();
  };

  const displayLevel = playerData?.level ?? 2;
  const hpColor = getHPColor(stats.hp);
  const manaColor = getManaColor(stats.mana);
  const hpPct = Math.min(100, Math.max(0, stats.hp));
  const manaBarPct = Math.min(100, Math.max(0, (stats.mana / MANA_MAX) * 100));

  const consecutiveDays = homeData?.stability?.consecutiveActiveDays ?? homeData?.streak ?? 0;

  return (
    <SystemLayout>
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
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="pt-1"
          data-testid="daily-status-section"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              {consecutiveDays > 0 && (
                <p className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                  Day {consecutiveDays} streak
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5">
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
            </div>
          </div>

          {/* XP Bar */}
          <div data-testid="xp-progress-section">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>
                XP
              </span>
              <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                {xp.exp} / {xp.maxExp}
              </span>
            </div>
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
          </div>
        </motion.div>

        {/* ── PRIMARY ACTION ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.13 }}
        >
          {flowCompletedToday ? (
            <div
              className="w-full py-4 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2"
              style={{ backgroundColor: "#22c55e10", color: "#22c55e", border: "1px solid #22c55e28" }}
              data-testid="text-flow-completed"
            >
              <CheckCircle2 size={16} />
              Flow completed today · {totalMins} min logged
            </div>
          ) : (
            <button
              data-testid="button-begin-flow"
              onClick={() => setFlowActive(true)}
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
                Begin Daily Flow
              </span>
            </button>
          )}
        </motion.div>

        {/* ── COACH MESSAGE ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
          className="rounded-xl px-4 py-3 flex items-start gap-3"
          style={{ backgroundColor: `${colors.primary}08`, border: `1px solid ${colors.primary}15` }}
          data-testid="coach-insight-card"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: `${colors.primary}20` }}
          >
            <Brain size={12} style={{ color: colors.primary }} />
          </div>
          <div>
            <p
              className="text-[9px] uppercase tracking-[0.14em] font-bold mb-0.5"
              style={{ color: `${colors.primary}80` }}
            >
              Coach
            </p>
            <p className="text-xs leading-relaxed" style={{ color: `${colors.text}cc` }}>
              {homeData.insight ?? "Consistency is becoming your baseline. Each session builds the next."}
            </p>
          </div>
        </motion.div>

        {/* ── SESSIONS TOGGLE ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.22 }}
        >
          <button
            data-testid="button-toggle-sessions"
            onClick={() => setShowSessions(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all active:scale-[0.99]"
            style={{
              backgroundColor: `${colors.surface || colors.background}cc`,
              border: `1px solid ${colors.surfaceBorder}`,
            }}
          >
            <div className="flex items-center gap-2">
              <Zap size={12} style={{ color: colors.primary }} />
              <span
                className="text-[10px] uppercase tracking-wider font-bold"
                style={{ color: colors.primary }}
              >
                Today's Sessions
              </span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: `${colors.primary}15`, color: `${colors.primary}90` }}
              >
                ~{totalMins} min
              </span>
            </div>
            {showSessions ? (
              <ChevronUp size={14} style={{ color: colors.textMuted }} />
            ) : (
              <ChevronDown size={14} style={{ color: colors.textMuted }} />
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
                  {SESSION_LIST.map((session, i) => {
                    const Icon = session.icon;
                    const done = flowCompletedToday;
                    return (
                      <div
                        key={session.id}
                        data-testid={`session-item-${i}`}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{
                          borderTop: i > 0 ? `1px solid ${colors.surfaceBorder}50` : "none",
                          backgroundColor: done ? `${session.color}04` : "transparent",
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: done ? "#22c55e18" : `${session.color}15`,
                          }}
                        >
                          {done ? (
                            <CheckCircle2 size={15} style={{ color: "#22c55e" }} />
                          ) : (
                            <Icon size={15} style={{ color: session.color }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium leading-tight"
                            style={{ color: done ? colors.textMuted : colors.text }}
                          >
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
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── STAT BARS ──────────────────────────────────────────────── */}
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-xl px-4 py-3 space-y-3"
            style={{ backgroundColor: `${colors.surface || colors.background}cc`, border: `1px solid ${colors.surfaceBorder}` }}
            data-testid="stat-bars-card"
          >
            {/* HP Bar */}
            <div data-testid="hp-bar-section">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Shield size={11} style={{ color: hpColor }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: hpColor }}>
                    HP
                  </span>
                  <span className="text-[9px] ml-0.5" style={{ color: colors.textMuted }}>
                    Vitality
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold" style={{ color: hpColor }}>
                  {hpPct.toFixed(0)} / 100
                </span>
              </div>
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: `${hpColor}18` }}
                data-testid="hp-bar-track"
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${hpPct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{ backgroundColor: hpColor, boxShadow: `0 0 6px ${hpColor}60` }}
                  data-testid="hp-bar-fill"
                />
              </div>
            </div>

            {/* Mana Bar */}
            <div data-testid="mana-bar-section">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Zap size={11} style={{ color: manaColor }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: manaColor }}>
                    MP
                  </span>
                  <span className="text-[9px] ml-0.5" style={{ color: colors.textMuted }}>
                    Meditation
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold" style={{ color: manaColor }}>
                  {Math.round(stats.mana)} / {MANA_MAX}
                </span>
              </div>
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: `${manaColor}18` }}
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
        </motion.div>

        {/* ── FUTURE GAME ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-xl overflow-hidden"
          style={{
            border: "1px solid rgba(34,211,238,0.22)",
            backgroundColor: "rgba(6,182,212,0.04)",
          }}
          data-testid="future-game-section"
        >
          {/* Section header */}
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ borderBottom: "1px solid rgba(34,211,238,0.12)" }}
          >
            <Gamepad2 size={14} style={{ color: "#22d3ee" }} />
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "#22d3ee" }}
            >
              Future Game
            </span>
            <span
              className="ml-auto text-[9px] px-2 py-0.5 rounded-full font-mono"
              style={{
                backgroundColor: "rgba(34,211,238,0.1)",
                color: "rgba(34,211,238,0.7)",
                border: "1px solid rgba(34,211,238,0.2)",
              }}
            >
              RPG CHARACTER
            </span>
          </div>

          <div className="px-4 py-3 space-y-3">
            <p
              className="text-[10px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Your daily habits shape your RPG character. Complete real-life activities to level up each stat.
            </p>

            {/* Stat bars */}
            {GAME_STATS.map((stat, i) => {
              const statData = playerData?.statLevels?.[stat.key];
              const level = statData?.level ?? 1;
              const currentXP = statData?.currentXP ?? 0;
              const xpForNext = statData?.xpForNext ?? 100;
              const pct = Math.min(100, xpForNext > 0 ? (currentXP / xpForNext) * 100 : 0);
              return (
                <div key={stat.key} data-testid={`game-stat-${stat.key}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${stat.color}18`,
                          color: stat.color,
                          border: `1px solid ${stat.color}30`,
                        }}
                      >
                        {stat.label}
                      </span>
                      <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                        {stat.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.28)" }}>
                        {stat.source}
                      </span>
                      <span
                        className="text-[10px] font-mono font-bold"
                        style={{ color: stat.color }}
                      >
                        Lv.{level}
                      </span>
                    </div>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut", delay: 0.06 * i }}
                      style={{
                        backgroundColor: stat.color,
                        boxShadow: `0 0 5px ${stat.color}50`,
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Start Game button */}
            <button
              onClick={() => navigate("/game3d")}
              className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 mt-1 transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(34,211,238,0.85), rgba(14,165,233,0.85))",
                color: "#000d14",
                letterSpacing: "0.08em",
                boxShadow: "0 4px 18px rgba(34,211,238,0.22)",
              }}
              data-testid="button-start-game"
            >
              <Gamepad2 size={13} />
              START GAME
            </button>
          </div>
        </motion.div>

      </div>
    </SystemLayout>
  );
}
