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
          <span className="text-sm font-bold uppercase tracking-widest" style={{ color: `${ACCENT}cc` }}>
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

function AnimatedCheckmark() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: 0,
          backgroundColor: `${ACCENT}12`,
          border: `2px solid ${ACCENT}35`,
        }}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{ inset: -10, border: `1px solid ${ACCENT}15` }}
        animate={{ opacity: [0.5, 0.15, 0.5], scale: [1, 1.06, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <motion.path
          d="M8 18 L15 25 L28 11"
          stroke={ACCENT}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}

type ScreenPhase = "intro" | "breathing" | "complete";
type CompletionStep = 1 | 2 | 3 | 4;

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
  const [screenPhase, setScreenPhase] = useState<ScreenPhase>("intro");
  const [completionStep, setCompletionStep] = useState<CompletionStep>(1);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plannedTime = loadPlannedTime();

  const startBreathing = useCallback(() => {
    setScreenPhase("breathing");
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= RESET_DURATION) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setTimeout(() => {
            setScreenPhase("complete");
            setCompletionStep(1);
          }, 400);
          return RESET_DURATION;
        }
        return next;
      });
    }, 1000);
  }, []);

  // Auto-advance through completion steps 1→2→3 with delays; step 4 waits for CTA tap
  useEffect(() => {
    if (screenPhase !== "complete") return;

    if (completionStep === 1) {
      stepTimerRef.current = setTimeout(() => setCompletionStep(2), 1400);
    } else if (completionStep === 2) {
      stepTimerRef.current = setTimeout(() => setCompletionStep(3), 1400);
    } else if (completionStep === 3) {
      stepTimerRef.current = setTimeout(() => setCompletionStep(4), 2800);
    }

    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, [screenPhase, completionStep]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, []);

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
      {screenPhase === "breathing" && (
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
        {screenPhase === "intro" && onCancel && (
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

          {/* ── INTRO ── */}
          {screenPhase === "intro" && (
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
                  <div className="text-[9px] uppercase tracking-widest mb-2 font-bold" style={{ color: `${ACCENT}80` }}>
                    Your planned action
                  </div>
                  <div className="rounded-2xl p-5" style={{ backgroundColor: `${ACCENT}0e`, border: `1px solid ${ACCENT}25` }}>
                    <div className="text-white/50 text-xs mb-1">Today — {timeLabel}</div>
                    {timeRange && <div className="text-white/30 text-xs mb-3">{timeRange}</div>}
                    <div className="text-white font-bold text-xl">2-Minute Reset</div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="space-y-2"
                >
                  <p className="text-white text-lg font-bold leading-snug">You placed this yesterday.</p>
                  <p className="text-white/70 text-base leading-snug">Now you meet yourself there.</p>
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

          {/* ── BREATHING ── */}
          {screenPhase === "breathing" && (
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

          {/* ── COMPLETE — 4-step sequence ── */}
          {screenPhase === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center h-full gap-10 text-center px-2"
            >

              {/* STEP 1: Checkmark + "You followed through." */}
              <AnimatedCheckmark />

              <motion.div
                key="step1-text"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="space-y-1"
              >
                <p className="text-white text-2xl font-bold tracking-tight leading-snug">
                  You followed through.
                </p>
              </motion.div>

              {/* STEP 2: Identity message */}
              <AnimatePresence>
                {completionStep >= 2 && (
                  <motion.p
                    key="identity"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-base leading-relaxed px-2"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                    data-testid="identity-message"
                  >
                    This is how consistency is built.
                  </motion.p>
                )}
              </AnimatePresence>

              {/* STEP 3: XP reveal */}
              <AnimatePresence>
                {completionStep >= 3 && xpData && (
                  <motion.div
                    key="xp-reveal"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-[260px] space-y-4"
                    data-testid="xp-reveal"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[11px] uppercase tracking-wider font-bold"
                        style={{ color: `${ACCENT}99` }}
                      >
                        Level {xpData.level}
                      </span>
                      <motion.span
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        className="text-[11px] font-mono font-bold"
                        style={{ color: ACCENT }}
                        data-testid="xp-gain-label"
                      >
                        +15 XP
                      </motion.span>
                    </div>

                    <div
                      className="w-full h-[3px] rounded-full overflow-hidden"
                      style={{ backgroundColor: `${ACCENT}1a` }}
                      data-testid="xp-bar-track"
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: ACCENT }}
                        initial={{ width: 0 }}
                        animate={{ width: `${xpPct}%` }}
                        transition={{ delay: 0.4, duration: 1.4, ease: "easeOut" }}
                        data-testid="xp-bar-fill"
                      />
                    </div>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2, duration: 0.6 }}
                      className="text-[11px] italic text-center"
                      style={{ color: "rgba(255,255,255,0.22)" }}
                    >
                      This is the result of what you've already done.
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* STEP 4: Transition message + CTA */}
              <AnimatePresence>
                {completionStep >= 4 && (
                  <motion.div
                    key="transition"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65 }}
                    className="w-full max-w-[280px] flex flex-col items-center gap-6"
                    data-testid="transition-block"
                  >
                    <div
                      className="w-full rounded-2xl px-5 py-5 text-center space-y-2"
                      style={{
                        backgroundColor: `${ACCENT}08`,
                        border: `1px solid ${ACCENT}18`,
                      }}
                    >
                      <p className="text-white text-base font-bold leading-snug">
                        Your foundation is set.
                      </p>
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                        Now we build structure.
                      </p>
                    </div>

                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      onClick={onComplete}
                      className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-[0.12em] transition-all active:scale-[0.97]"
                      style={{
                        backgroundColor: ACCENT,
                        color: "#fff",
                        boxShadow: `0 0 28px ${ACCENT}35`,
                      }}
                      data-testid="button-finish-day7"
                    >
                      Enter Phase 1
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}
