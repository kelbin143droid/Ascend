import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X } from "lucide-react";

const ACCENT = "#22d3ee";         // cyan-400 — mission/execution colour
const ACCENT_BG = "#061018";
const RESET_DURATION = 120;

const BREATHING_PHASES = [
  { label: "Inhale",  seconds: 4 },
  { label: "Hold",    seconds: 4 },
  { label: "Exhale",  seconds: 6 },
];
const CYCLE_SECONDS = BREATHING_PHASES.reduce((s, p) => s + p.seconds, 0);

/* ─── Planned action from localStorage ─────────────────────────────── */
interface PlannedTime {
  slot: string;
  label: string;
  range: string;
  date: string;
}
function loadPlannedTime(): PlannedTime | null {
  try {
    const raw = localStorage.getItem("ascend_planned_action_time");
    return raw ? (JSON.parse(raw) as PlannedTime) : null;
  } catch {
    return null;
  }
}

/* ─── Breathing circle (active state) ──────────────────────────────── */
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
    currentPhase.label === "Inhale"  ? 0.55 + 0.45 * phaseProgress
    : currentPhase.label === "Exhale" ? 1.0  - 0.45 * phaseProgress
    : 1.0;

  const remaining = RESET_DURATION - elapsed;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-8 py-4">
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 200, height: 200,
            background: `radial-gradient(circle, ${ACCENT}08 0%, transparent 70%)`,
            border: `1px solid ${ACCENT}18`,
          }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          style={{
            width: 130, height: 130,
            borderRadius: "50%",
            transform: `scale(${scale})`,
            transition: `transform ${currentPhase.seconds * 0.9}s ease-in-out`,
            background: `radial-gradient(circle, ${ACCENT}28 0%, ${ACCENT}0a 55%, transparent 100%)`,
            border: `2px solid ${ACCENT}50`,
            boxShadow: `0 0 ${24 + scale * 24}px ${ACCENT}22`,
          }}
        />
        <div className="absolute flex flex-col items-center gap-1">
          <span className="text-base font-bold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
            {currentPhase.label}
          </span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-3xl font-mono font-light tracking-widest" style={{ color: "rgba(255,255,255,0.85)" }}>
          {timeStr}
        </p>
        <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>
          2-Minute Reset · Breathe and be present
        </p>
      </div>
    </div>
  );
}

/* ─── Animated checkmark ────────────────────────────────────────────── */
function AnimatedCheckmark() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
      <motion.div
        className="absolute rounded-full"
        style={{ inset: 0, backgroundColor: `${ACCENT}12`, border: `2px solid ${ACCENT}35` }}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{ inset: -10, border: `1px solid ${ACCENT}18` }}
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

/* ─── Types ─────────────────────────────────────────────────────────── */
type Mode = "execution" | "active" | "completed";
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

/* ─── Main component ────────────────────────────────────────────────── */
export function Day7FollowThrough({ onComplete, onCancel, xpData }: Props) {
  const [mode, setMode]                     = useState<Mode>("execution");
  const [completionStep, setCompletionStep] = useState<CompletionStep>(1);
  const [elapsed, setElapsed]               = useState(0);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimerRef  = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const plannedTime   = loadPlannedTime();

  /* Start the 2-minute breathing session */
  const startSession = useCallback(() => {
    if (mode === "active") return;
    setMode("active");
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= RESET_DURATION) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setTimeout(() => {
            setMode("completed");
            setCompletionStep(1);
          }, 400);
          return RESET_DURATION;
        }
        return next;
      });
    }, 1000);
  }, [mode]);

  /* Auto-advance completion steps 1→2→3→4 */
  useEffect(() => {
    if (mode !== "completed") return;
    const delays: Record<number, number> = { 1: 1400, 2: 1400, 3: 2800 };
    const delay = delays[completionStep];
    if (!delay) return;
    stepTimerRef.current = setTimeout(
      () => setCompletionStep(prev => (prev + 1) as CompletionStep),
      delay,
    );
    return () => { if (stepTimerRef.current) clearTimeout(stepTimerRef.current); };
  }, [mode, completionStep]);

  /* Cleanup */
  useEffect(() => () => {
    if (intervalRef.current)  clearInterval(intervalRef.current);
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
  }, []);

  const timeLabel  = plannedTime?.label ?? "Your chosen time";
  const timeRange  = plannedTime?.range ?? "Morning window";
  const xpPct      = xpData && xpData.max > 0
    ? Math.min(100, Math.round((xpData.current / xpData.max) * 100)) : 0;

  /* ── Root container: full screen, flex-col, dark bg ─────────────── */
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col text-white overflow-hidden"
      style={{ backgroundColor: ACCENT_BG }}
      data-testid="day7-follow-through"
    >
      {/* Ambient video only during active breathing */}
      {mode === "active" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <video
            src="/videos/calm-breathing.mp4"
            className="w-full h-full object-cover"
            autoPlay playsInline muted loop preload="auto"
            style={{ opacity: 0.09 }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(6,16,24,0.6) 0%, rgba(6,16,24,0.3) 50%, rgba(6,16,24,0.75) 100%)" }}
          />
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="relative z-10 px-4 pt-6 pb-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Shield size={13} style={{ color: `${ACCENT}99` }} />
          <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: `${ACCENT}99` }}>
            Day 7 · Follow-Through
          </span>
        </div>
        {mode === "execution" && onCancel && (
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            data-testid="button-cancel-day7"
          >
            <X size={15} className="text-white/35" />
          </button>
        )}
      </div>

      {/* ── SCROLLABLE BODY ────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-36 space-y-5">
        <AnimatePresence mode="wait">

          {/* ═══ EXECUTION MODE ═══════════════════════════════════════ */}
          {mode === "execution" && (
            <motion.div
              key="execution"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-5 pt-2"
            >
              {/* Context card */}
              <div
                className="rounded-2xl p-5 border"
                style={{ backgroundColor: "#0B1C2C", borderColor: `${ACCENT}28` }}
                data-testid="execution-context-card"
              >
                <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.38)" }}>
                  You planned this yesterday
                </p>
                <h2 className="text-2xl font-bold tracking-tight leading-snug text-white">
                  2-Minute Reset
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}
                  >
                    {timeLabel}
                  </span>
                  {timeRange && (
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {timeRange}
                    </span>
                  )}
                </div>
              </div>

              {/* Mission message */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="px-1 space-y-1"
              >
                <p className="text-lg font-semibold text-white leading-snug">
                  You placed this yesterday.
                </p>
                <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Now you meet yourself there.
                </p>
              </motion.div>

              {/* What to expect */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="rounded-xl px-4 py-3 flex items-start gap-3"
                style={{ backgroundColor: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.10)" }}
              >
                <div
                  className="w-1 self-stretch rounded-full mt-0.5 flex-shrink-0"
                  style={{ backgroundColor: `${ACCENT}60` }}
                />
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                  A 2-minute guided breathing reset. Follow the circle, clear your mind, commit to the moment.
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* ═══ ACTIVE MODE ══════════════════════════════════════════ */}
          {mode === "active" && (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center pt-4 space-y-2"
            >
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-sm"
                style={{ color: "rgba(255,255,255,0.38)" }}
              >
                Session in progress
              </motion.p>
              <BreathingCircle elapsed={elapsed} />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center text-xs px-8 pt-2"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                Follow the circle. Let everything else go.
              </motion.p>
            </motion.div>
          )}

          {/* ═══ COMPLETED MODE — 4-step sequence ═════════════════════ */}
          {mode === "completed" && (
            <motion.div
              key="completed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center pt-6 space-y-8 text-center"
            >
              {/* Step 1: Checkmark + heading */}
              <AnimatedCheckmark />

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-2xl font-bold tracking-tight text-white"
              >
                You followed through.
              </motion.p>

              {/* Step 2: Identity */}
              <AnimatePresence>
                {completionStep >= 2 && (
                  <motion.p
                    key="identity"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55 }}
                    className="text-base px-4 leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                    data-testid="identity-message"
                  >
                    This is how consistency is built.
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Step 3: XP bar */}
              <AnimatePresence>
                {completionStep >= 3 && xpData && (
                  <motion.div
                    key="xp"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55 }}
                    className="w-full max-w-[260px] space-y-3"
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
                      style={{ backgroundColor: `${ACCENT}18` }}
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
                      className="text-[11px] italic"
                      style={{ color: "rgba(255,255,255,0.2)" }}
                    >
                      This is the result of what you've already done.
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Step 4: Foundation message */}
              <AnimatePresence>
                {completionStep >= 4 && (
                  <motion.div
                    key="foundation"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55 }}
                    className="w-full max-w-[280px] rounded-2xl px-5 py-5 space-y-1 text-center"
                    style={{ backgroundColor: `${ACCENT}08`, border: `1px solid ${ACCENT}18` }}
                    data-testid="transition-block"
                  >
                    <p className="text-base font-bold text-white leading-snug">
                      Your foundation is set.
                    </p>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Now we build structure.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── FIXED BOTTOM CTA ─────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 p-4 flex-shrink-0"
        style={{
          background: `linear-gradient(to top, ${ACCENT_BG} 60%, transparent)`,
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <AnimatePresence mode="wait">

          {/* Execution / Active CTA */}
          {(mode === "execution" || mode === "active") && (
            <motion.button
              key="start-btn"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35 }}
              onClick={startSession}
              disabled={mode === "active"}
              className="w-full py-4 rounded-xl font-bold text-base tracking-wide transition-all active:scale-[0.97] disabled:cursor-default"
              style={{
                backgroundColor: mode === "active" ? `${ACCENT}22` : ACCENT,
                color: mode === "active" ? ACCENT : "#000",
                border: mode === "active" ? `1px solid ${ACCENT}40` : "none",
                boxShadow: mode === "active" ? "none" : `0 0 32px ${ACCENT}30`,
              }}
              data-testid="button-begin-day7"
            >
              {mode === "active" ? "In Progress…" : "Start Session"}
            </motion.button>
          )}

          {/* Enter Phase 1 CTA — only after step 4 */}
          {mode === "completed" && completionStep >= 4 && (
            <motion.button
              key="phase-btn"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              onClick={onComplete}
              className="w-full py-4 rounded-xl font-bold text-base uppercase tracking-[0.12em] transition-all active:scale-[0.97]"
              style={{
                backgroundColor: ACCENT,
                color: "#000",
                boxShadow: `0 0 32px ${ACCENT}38`,
              }}
              data-testid="button-finish-day7"
            >
              Enter Phase 1
            </motion.button>
          )}

          {/* Placeholder during completion steps 1–3 so layout doesn't jump */}
          {mode === "completed" && completionStep < 4 && (
            <div className="w-full py-4 rounded-xl" style={{ backgroundColor: "transparent" }} />
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
