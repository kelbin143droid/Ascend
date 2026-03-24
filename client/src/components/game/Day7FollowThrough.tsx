import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield } from "lucide-react";

const ACCENT = "#3b82f6";
const RESET_DURATION = 120;

const BREATHING_PHASES = [
  { label: "Inhale", seconds: 4 },
  { label: "Hold", seconds: 4 },
  { label: "Exhale", seconds: 6 },
];
const CYCLE_SECONDS = BREATHING_PHASES.reduce((s, p) => s + p.seconds, 0);

interface PlannedTime {
  slot: string;
  label: string;
  range: string;
  date: string;
}

function loadPlannedTime(): PlannedTime | null {
  try {
    const raw = localStorage.getItem("ascend_planned_action_time");
    if (!raw) return null;
    return JSON.parse(raw) as PlannedTime;
  } catch {
    return null;
  }
}

function BreathingCircle({ elapsed }: { elapsed: number }) {
  const cyclePos = elapsed % CYCLE_SECONDS;
  let cumulative = 0;
  let currentPhase = BREATHING_PHASES[0];
  let phaseProgress = 0;

  for (const phase of BREATHING_PHASES) {
    if (cyclePos < cumulative + phase.seconds) {
      currentPhase = phase;
      phaseProgress = (cyclePos - cumulative) / phase.seconds;
      break;
    }
    cumulative += phase.seconds;
  }

  const scale =
    currentPhase.label === "Inhale"
      ? 0.55 + 0.45 * phaseProgress
      : currentPhase.label === "Exhale"
      ? 1.0 - 0.45 * phaseProgress
      : 1.0;

  const mins = Math.floor((RESET_DURATION - elapsed) / 60);
  const secs = (RESET_DURATION - elapsed) % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 180, height: 180,
            background: `radial-gradient(circle, ${ACCENT}08 0%, transparent 70%)`,
            border: `1px solid ${ACCENT}15`,
          }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          style={{
            width: 120, height: 120,
            borderRadius: "50%",
            transform: `scale(${scale})`,
            transition: `transform ${currentPhase.seconds * 0.9}s ease-in-out`,
            background: `radial-gradient(circle, ${ACCENT}30 0%, ${ACCENT}10 55%, transparent 100%)`,
            border: `2px solid ${ACCENT}45`,
            boxShadow: `0 0 ${20 + scale * 20}px ${ACCENT}25`,
          }}
        />
        <div className="absolute flex flex-col items-center gap-1">
          <span
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: `${ACCENT}cc` }}
          >
            {currentPhase.label}
          </span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <div className="text-white/30 text-xs font-mono">{timeStr}</div>
        <div className="text-white/20 text-[10px] uppercase tracking-widest">2-Minute Reset</div>
      </div>
    </div>
  );
}

type Phase = "intro" | "breathing" | "complete";

export interface XpData {
  level: number;
  current: number;
  max: number;
}

interface Props {
  onComplete: () => void;
  onCancel?: () => void;
  xpData?: XpData;
}

export function Day7FollowThrough({ onComplete, onCancel, xpData }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const plannedTime = loadPlannedTime();

  const startBreathing = useCallback(() => {
    setPhase("breathing");
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= RESET_DURATION) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setTimeout(() => setPhase("complete"), 400);
          return RESET_DURATION;
        }
        return next;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleFinish = () => {
    onComplete();
  };

  const timeLabel = plannedTime?.label ?? "your chosen time";
  const timeRange = plannedTime?.range ?? "";

  const xpPct = xpData && xpData.max > 0
    ? Math.min(100, Math.round((xpData.current / xpData.max) * 100))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "linear-gradient(160deg, #060d1a 0%, #0a1525 60%, #060d1a 100%)" }}
      data-testid="day7-follow-through"
    >
      {phase === "breathing" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <video
            src="/videos/calm-breathing.mp4"
            className="w-full h-full object-cover"
            autoPlay playsInline muted loop preload="auto"
            style={{ opacity: 0.12 }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.6) 100%)" }}
          />
        </div>
      )}

      <div className="flex items-center justify-between px-5 pt-safe pt-5 pb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Shield size={13} style={{ color: `${ACCENT}99` }} />
          <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: `${ACCENT}99` }}>
            Day 7 · Follow-Through
          </span>
        </div>
        {phase === "intro" && onCancel && (
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            data-testid="button-cancel-day7"
          >
            <X size={15} className="text-white/40" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col px-5 pb-safe pb-8 relative z-10 overflow-hidden">
        <AnimatePresence mode="wait">

          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
              className="flex flex-col h-full justify-between"
            >
              <div className="flex flex-col gap-8 mt-4">
                <div>
                  <div
                    className="text-[9px] uppercase tracking-widest mb-2 font-bold"
                    style={{ color: `${ACCENT}80` }}
                  >
                    Your planned action
                  </div>
                  <div
                    className="rounded-2xl p-5"
                    style={{
                      backgroundColor: `${ACCENT}0e`,
                      border: `1px solid ${ACCENT}25`,
                    }}
                  >
                    <div className="text-white/50 text-xs mb-1">Today — {timeLabel}</div>
                    {timeRange && (
                      <div className="text-white/30 text-xs mb-3">{timeRange}</div>
                    )}
                    <div className="text-white font-bold text-xl">2-Minute Reset</div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="space-y-2"
                >
                  <p className="text-white text-lg font-bold leading-snug">
                    You placed this yesterday.
                  </p>
                  <p className="text-white/70 text-base leading-snug">
                    Now you meet yourself there.
                  </p>
                </motion.div>
              </div>

              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                onClick={startBreathing}
                className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-[0.1em] transition-all active:scale-[0.97]"
                style={{ backgroundColor: ACCENT, color: "#fff" }}
                data-testid="button-begin-day7"
              >
                Begin Your Planned Step
              </motion.button>
            </motion.div>
          )}

          {phase === "breathing" && (
            <motion.div
              key="breathing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-center h-full gap-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-2"
              >
                <p className="text-white/50 text-sm">Breathe and be present.</p>
              </motion.div>

              <BreathingCircle elapsed={elapsed} />

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center text-white/25 text-xs px-8"
              >
                Follow the circle. Let everything else go.
              </motion.p>
            </motion.div>
          )}

          {phase === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center h-full gap-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 160, damping: 14 }}
                className="w-20 h-20 rounded-full flex items-center justify-center relative"
                style={{
                  backgroundColor: `${ACCENT}15`,
                  border: `2px solid ${ACCENT}45`,
                  boxShadow: `0 0 50px ${ACCENT}30`,
                }}
              >
                <motion.div
                  className="absolute rounded-full"
                  style={{ inset: -12, border: `1px solid ${ACCENT}18` }}
                  animate={{ opacity: [0.6, 0.2, 0.6], scale: [1, 1.08, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <Shield size={32} style={{ color: ACCENT }} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="space-y-3 px-4"
              >
                <p className="text-white text-xl font-bold leading-tight">
                  You followed through.
                </p>
                <p
                  className="text-base font-medium leading-snug"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  Every time you meet your intention,<br />you become someone who does.
                </p>
              </motion.div>

              {xpData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="w-full max-w-xs px-1"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[10px] uppercase tracking-wider font-medium"
                      style={{ color: `${ACCENT}80` }}
                    >
                      Level {xpData.level}
                    </span>
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      {xpData.current} / {xpData.max} XP
                    </span>
                  </div>
                  <div
                    className="w-full h-1 rounded-full overflow-hidden"
                    style={{ backgroundColor: `${ACCENT}20` }}
                    data-testid="xp-bar-track"
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: ACCENT, opacity: 0.8 }}
                      initial={{ width: 0 }}
                      animate={{ width: `${xpPct}%` }}
                      transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
                      data-testid="xp-bar-fill"
                    />
                  </div>
                  <p
                    className="text-[10px] mt-2 italic text-center"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    This is the result of what you've already done.
                  </p>
                </motion.div>
              )}

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                onClick={handleFinish}
                className="w-full max-w-xs py-4 rounded-2xl font-bold text-sm uppercase tracking-[0.08em] transition-all active:scale-[0.97]"
                style={{ backgroundColor: ACCENT, color: "#fff" }}
                data-testid="button-finish-day7"
              >
                Enter Phase 1
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}
