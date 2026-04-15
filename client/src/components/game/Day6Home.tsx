import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Brain, Wind, Dumbbell, Heart, ChevronDown, ChevronUp, CheckCircle2, Zap, Shield, ArrowRight, Clock, Lock } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { DailyFlowEngine } from "./DailyFlowEngine";
import { SystemLayout } from "./SystemLayout";
import { buildPhase1Activities, type CategoryTiers } from "@/lib/activityEngine";
import { getStats, recordSleepCheck, recordBreathingSession, getHPColor, getManaColor, MANA_MAX, type GameStats } from "@/lib/statsSystem";
import { markFlowCompleted, getFlowCompletedToday, isSectographTutorialDone } from "@/lib/userState";
import { getDisplayDay, isHabitsTutorialDone, isGameUnlocked, GAME_UNLOCK_EVENT } from "@/lib/progressionService";
import { computeXPState } from "@/lib/xpSystem";

interface HomeData {
  phase: { number: number; name: string };
  insight: string;
  onboardingDay: number;
  isOnboardingComplete: boolean;
  streak: number;
  stability?: { consecutiveActiveDays?: number };
}

interface PlayerData {
  level: number;
  exp: number;
  maxExp: number;
  totalExp: number;
  name?: string;
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
  const [tutorialDone, setTutorialDone] = useState(() => isSectographTutorialDone());
  const [habitsTutorialDone, setHabitsTutorialDone] = useState(() => isHabitsTutorialDone());
  const [gameUnlocked, setGameUnlocked] = useState(() => isGameUnlocked());

  const displayDay = getDisplayDay(player.id, homeData.onboardingDay, homeData.isOnboardingComplete);
  const habitsTutorialRequired = displayDay >= 7;
  const flowGatedByHabitsTutorial = habitsTutorialRequired && !habitsTutorialDone;
  const flowGatedByGameTutorial = displayDay >= 8 && !gameUnlocked;

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

  useEffect(() => {
    const tutorialHandler = () => setTutorialDone(true);
    window.addEventListener("ascend:sectograph-tutorial-done", tutorialHandler);
    return () => window.removeEventListener("ascend:sectograph-tutorial-done", tutorialHandler);
  }, []);

  useEffect(() => {
    const habitsHandler = () => setHabitsTutorialDone(true);
    window.addEventListener("ascend:habits-tutorial-done", habitsHandler);
    return () => window.removeEventListener("ascend:habits-tutorial-done", habitsHandler);
  }, []);

  useEffect(() => {
    const gameHandler = () => setGameUnlocked(true);
    window.addEventListener(GAME_UNLOCK_EVENT, gameHandler);
    return () => window.removeEventListener(GAME_UNLOCK_EVENT, gameHandler);
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

        {/* ── SECTOGRAPH SETUP PROMPT (shown until tutorial done) ──── */}
        {!tutorialDone && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06 }}
            data-testid="sectograph-setup-prompt"
          >
            <button
              onClick={() => navigate("/sectograph")}
              className="w-full rounded-xl p-4 flex items-start gap-3 transition-all active:scale-[0.99]"
              style={{
                backgroundColor: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.3)",
              }}
              data-testid="button-go-to-sectograph"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(139,92,246,0.18)" }}
              >
                <Clock size={17} style={{ color: "#8b5cf6" }} />
              </div>
              <div className="text-left flex-1">
                <p className="text-xs font-bold mb-0.5 uppercase tracking-wider" style={{ color: "#8b5cf6" }}>
                  Setup Required
                </p>
                <p className="text-sm font-medium leading-snug" style={{ color: colors.text }}>
                  Map your daily timeline to unlock your stats
                </p>
                <p className="text-[10px] mt-1" style={{ color: colors.textMuted }}>
                  Coach: Start with your Sleep block in the Sectograph.
                </p>
              </div>
              <ArrowRight size={16} style={{ color: "#8b5cf6", marginTop: 2 }} />
            </button>
          </motion.div>
        )}

        {/* ── DAY 8 PROFILE POINTER ──────────────────────────────────── */}
        {flowGatedByGameTutorial && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            data-testid="day8-profile-pointer"
          >
            <button
              onClick={() => navigate("/profile")}
              className="w-full rounded-xl p-4 flex items-center gap-3 transition-all active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))",
                border: "1px solid rgba(99,102,241,0.4)",
                boxShadow: "0 0 24px rgba(99,102,241,0.12)",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.25))", border: "1px solid rgba(99,102,241,0.4)" }}
              >
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{ fontSize: 18 }}
                >
                  ⚔️
                </motion.span>
              </div>
              <div className="text-left flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6366f1" }}>
                    Day 8 — Stats Activated
                  </p>
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(99,102,241,0.18)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.4)" }}
                  >
                    NEW
                  </motion.div>
                </div>
                <p className="text-sm font-medium leading-snug" style={{ color: colors.text }}>
                  Visit your Profile to unlock your HP, MP & game stats
                </p>
                <p className="text-[10px] mt-1" style={{ color: colors.textMuted }}>
                  Tap here → Profile tab
                </p>
              </div>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              >
                <ArrowRight size={18} style={{ color: "#6366f1" }} />
              </motion.div>
            </button>
          </motion.div>
        )}

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
          ) : !tutorialDone ? (
            <div
              data-testid="button-begin-flow-locked"
              className="w-full py-4 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2 select-none"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                color: colors.textMuted,
                border: `1px solid rgba(255,255,255,0.07)`,
                opacity: 0.55,
                cursor: "not-allowed",
              }}
            >
              <Lock size={13} style={{ opacity: 0.6 }} />
              Begin Daily Flow · Setup timeline first
            </div>
          ) : flowGatedByGameTutorial ? (
            <div
              data-testid="button-begin-flow-game-locked"
              className="w-full rounded-xl overflow-hidden select-none"
              style={{ cursor: "not-allowed" }}
            >
              <div
                className="w-full py-4 text-center text-sm font-bold flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "rgba(99,102,241,0.06)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  color: "rgba(99,102,241,0.55)",
                  opacity: 0.8,
                }}
              >
                <Lock size={13} style={{ opacity: 0.6 }} />
                Begin Daily Flow
              </div>
              <div
                className="py-2 text-center text-[10px]"
                style={{
                  backgroundColor: "rgba(99,102,241,0.04)",
                  color: "rgba(99,102,241,0.7)",
                }}
              >
                View your Profile tab to activate your game stats first
              </div>
            </div>
          ) : flowGatedByHabitsTutorial ? (
            <div
              data-testid="button-begin-flow-habits-locked"
              className="w-full rounded-xl overflow-hidden select-none"
              style={{ cursor: "not-allowed" }}
            >
              <div
                className="w-full py-4 text-center text-sm font-bold flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "rgba(167,139,250,0.06)",
                  border: "1px solid rgba(167,139,250,0.2)",
                  color: "rgba(167,139,250,0.55)",
                  opacity: 0.8,
                }}
              >
                <Lock size={13} style={{ opacity: 0.6 }} />
                Begin Daily Flow
              </div>
              <div
                className="py-2 text-center text-[10px]"
                style={{
                  backgroundColor: "rgba(167,139,250,0.04)",
                  color: "rgba(167,139,250,0.6)",
                }}
              >
                Complete the Habits tutorial first → visit Habits tab
              </div>
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

        {/* ── STAT BARS (hidden until Day 8 game tutorial done) ───── */}
        {displayDay >= 8 && gameUnlocked && (
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
        )}
      </div>
    </SystemLayout>
  );
}
