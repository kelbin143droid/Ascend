import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X } from "lucide-react";
import inhaleUrl from "@assets/Inhale_1774271882288.mp3";
import holdUrl from "@assets/Hold_1774271892968.mp3";
import exhaleUrl from "@assets/Exhale_1774271901274.mp3";

const ACCENT     = "#22d3ee";
const ACCENT_BG  = "#061018";
const SESSION_SECONDS = 120;

const BREATHING_PHASES = [
  { label: "Inhale", duration: 4000 },
  { label: "Hold",   duration: 4000 },
  { label: "Exhale", duration: 6000 },
];
const CYCLE_MS = BREATHING_PHASES.reduce((s, p) => s + p.duration, 0);

interface PlannedTime { slot: string; label: string; range: string; date: string; }
function loadPlannedTime(): PlannedTime | null {
  try {
    const raw = localStorage.getItem("ascend_planned_action_time");
    return raw ? JSON.parse(raw) as PlannedTime : null;
  } catch { return null; }
}

/* ─── Ambient pad (identical to Day 1) ──────────────────────────────── */
function createPadOscillator(
  ctx: AudioContext, freq: number, detuneCents: number,
  gainValue: number, destination: AudioNode,
) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  osc.detune.setValueAtTime(detuneCents, ctx.currentTime);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  osc.connect(gain).connect(destination);
  osc.start();
  return osc;
}

function useBreathingAudio(active: boolean) {
  const audioCtxRef    = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const lfoRef         = useRef<OscillatorNode | null>(null);
  useEffect(() => {
    if (!active) return;
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 3);
      const lpFilter = ctx.createBiquadFilter();
      lpFilter.type = "lowpass";
      lpFilter.frequency.setValueAtTime(600, ctx.currentTime);
      lpFilter.Q.setValueAtTime(0.7, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.03, ctx.currentTime);
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.15, ctx.currentTime);
      lfo.connect(lfoGain).connect(masterGain.gain);
      lfo.start();
      lfoRef.current = lfo;
      lpFilter.connect(masterGain).connect(ctx.destination);
      const oscs: OscillatorNode[] = [];
      oscs.push(createPadOscillator(ctx, 130.81, -4, 0.35, lpFilter));
      oscs.push(createPadOscillator(ctx, 130.81,  4, 0.35, lpFilter));
      oscs.push(createPadOscillator(ctx, 196.00, -3, 0.20, lpFilter));
      oscs.push(createPadOscillator(ctx, 196.00,  3, 0.20, lpFilter));
      oscs.push(createPadOscillator(ctx, 261.63, -5, 0.12, lpFilter));
      oscs.push(createPadOscillator(ctx, 261.63,  5, 0.12, lpFilter));
      oscs.push(createPadOscillator(ctx, 329.63,  0, 0.06, lpFilter));
      oscillatorsRef.current = oscs;
    } catch {}
    return () => {
      try {
        oscillatorsRef.current.forEach(o => { try { o.stop(); } catch {} });
        if (lfoRef.current) try { lfoRef.current.stop(); } catch {}
        audioCtxRef.current?.close();
      } catch {}
      oscillatorsRef.current = [];
      lfoRef.current = null;
      audioCtxRef.current = null;
    };
  }, [active]);
}

/* ─── Pentatonic music (identical to Day 1) ─────────────────────────── */
const CALM_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

function useCalmMusic(active: boolean) {
  const ctxRef   = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!active) return;
    let closed = false;
    const playNote = (ctx: AudioContext, dest: GainNode) => {
      if (closed) return;
      const freq = CALM_NOTES[Math.floor(Math.random() * CALM_NOTES.length)];
      const f    = Math.random() > 0.7 ? freq * 2 : freq;
      const osc  = ctx.createOscillator();
      osc.type   = "sine";
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 1.2);
      g.gain.linearRampToValueAtTime(0.03,  ctx.currentTime + 3.5);
      g.gain.linearRampToValueAtTime(0,     ctx.currentTime + 5.5);
      osc.connect(g); g.connect(dest);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 6);
    };
    const schedule = (ctx: AudioContext, dest: GainNode) => {
      if (closed) return;
      playNote(ctx, dest);
      const delay = 2800 + Math.random() * 3200;
      timerRef.current = setTimeout(() => schedule(ctx, dest), delay);
    };
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(1, ctx.currentTime + 6);
      master.connect(ctx.destination);
      timerRef.current = setTimeout(() => schedule(ctx, master), 4000);
    } catch {}
    return () => {
      closed = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      try { ctxRef.current?.close(); } catch {}
      ctxRef.current = null;
    };
  }, [active]);
}

/* ─── Voice cues (MP3, identical to Day 1) ───────────────────────────── */
const VOICE_MAP: Record<string, string> = {
  Inhale: inhaleUrl, Hold: holdUrl, Exhale: exhaleUrl,
};
let activeVoiceAudio: HTMLAudioElement | null = null;
function playVoiceClip(label: string) {
  try {
    const url = VOICE_MAP[label];
    if (!url) return;
    if (activeVoiceAudio) { activeVoiceAudio.pause(); activeVoiceAudio.currentTime = 0; }
    const audio = new Audio(url);
    audio.volume = 0.9;
    audio.play().catch(() => {});
    activeVoiceAudio = audio;
  } catch {}
}
function stopVoiceClip() {
  try {
    if (activeVoiceAudio) { activeVoiceAudio.pause(); activeVoiceAudio.currentTime = 0; activeVoiceAudio = null; }
  } catch {}
}

/* ─── Breathing visual (Day 1 style) ─────────────────────────────────── */
function BreathingSession({ elapsed }: { elapsed: number }) {
  const lastSpokenRef = useRef<string>("");
  useBreathingAudio(true);
  useCalmMusic(true);

  const posInCycle = (elapsed * 1000) % CYCLE_MS;
  let cumulative = 0;
  let currentPhase = BREATHING_PHASES[0];
  let phaseProgress = 0;
  for (const phase of BREATHING_PHASES) {
    if (posInCycle < cumulative + phase.duration) {
      currentPhase  = phase;
      phaseProgress = (posInCycle - cumulative) / phase.duration;
      break;
    }
    cumulative += phase.duration;
  }

  useEffect(() => {
    if (currentPhase.label !== lastSpokenRef.current) {
      lastSpokenRef.current = currentPhase.label;
      playVoiceClip(currentPhase.label);
    }
  }, [currentPhase.label]);
  useEffect(() => () => stopVoiceClip(), []);

  const scale =
    currentPhase.label === "Inhale"  ? 0.6 + 0.4 * phaseProgress
    : currentPhase.label === "Exhale" ? 1.0 - 0.4 * phaseProgress
    : 1.0;

  return (
    <div className="flex flex-col items-center gap-8">
      <div
        className="w-32 h-32 rounded-full transition-transform"
        style={{
          transform: `scale(${scale})`,
          transitionDuration: "200ms",
          background: `radial-gradient(circle, ${ACCENT}25 0%, ${ACCENT}08 60%, transparent 100%)`,
          border: `2px solid ${ACCENT}30`,
        }}
        data-testid="breathing-circle"
      />
      <p
        data-testid="breathing-phase-label"
        className="text-xl font-medium tracking-wider"
        style={{ color: `${ACCENT}cc` }}
      >
        {currentPhase.label}
      </p>
      <p className="text-[10px] tracking-wide" style={{ color: "rgba(255,255,255,0.25)" }}>
        Voice guided · Ambient audio
      </p>
    </div>
  );
}

/* ─── Animated checkmark ─────────────────────────────────────────────── */
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
          stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}

/* ─── Types ──────────────────────────────────────────────────────────── */
type Mode           = "execution" | "countdown" | "active" | "completed";
type CompletionStep = 1 | 2 | 3 | 4;
export interface XpData { level: number; current: number; max: number; }
interface Props { onComplete: () => void; onCancel?: () => void; xpData?: XpData; }

/* ─── Main component ─────────────────────────────────────────────────── */
export function Day7FollowThrough({ onComplete, onCancel, xpData }: Props) {
  const [mode, setMode]                     = useState<Mode>("execution");
  const [countdown, setCountdown]           = useState(3);
  const [completionStep, setCompletionStep] = useState<CompletionStep>(1);
  const [elapsed, setElapsed]               = useState(0);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const cdTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const plannedTime  = loadPlannedTime();

  const startSession = useCallback(() => {
    if (mode !== "execution") return;
    setMode("countdown");
    setCountdown(3);
    let n = 3;
    cdTimerRef.current = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(cdTimerRef.current!);
        cdTimerRef.current = null;
        setMode("active");
        setElapsed(0);
        intervalRef.current = setInterval(() => {
          setElapsed(prev => {
            const next = prev + 1;
            if (next >= SESSION_SECONDS) {
              clearInterval(intervalRef.current!);
              intervalRef.current = null;
              setTimeout(() => { setMode("completed"); setCompletionStep(1); }, 400);
              return SESSION_SECONDS;
            }
            return next;
          });
        }, 1000);
      } else {
        setCountdown(n);
      }
    }, 1000);
  }, [mode]);

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

  useEffect(() => () => {
    if (intervalRef.current)  clearInterval(intervalRef.current);
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    if (cdTimerRef.current)   clearInterval(cdTimerRef.current);
  }, []);

  const timeLabel = plannedTime?.label ?? "Morning";
  const timeRange = plannedTime?.range ?? "6 AM – 11 AM";
  const xpPct     = xpData && xpData.max > 0
    ? Math.min(100, Math.round((xpData.current / xpData.max) * 100)) : 0;
  const progress  = Math.min(elapsed / SESSION_SECONDS, 1);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col text-white overflow-hidden"
      style={{ backgroundColor: ACCENT_BG }}
      data-testid="day7-follow-through"
    >
      {/* Ambient video — active breathing only */}
      {mode === "active" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <video
            src="/videos/calm-breathing.mp4"
            className="w-full h-full object-cover"
            autoPlay playsInline muted loop preload="auto"
            style={{ opacity: 0.25 }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)" }}
          />
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="relative z-10 px-4 pt-6 pb-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Shield size={12} style={{ color: `${ACCENT}80` }} />
          <h1 className="text-xs tracking-widest" style={{ color: ACCENT }}>
            DAY 7 · FOLLOW THROUGH
          </h1>
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

      {/* Progress bar — active breathing only */}
      {mode === "active" && (
        <div className="relative z-10 px-4 flex-shrink-0">
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
            <div
              data-testid="session-progress-bar"
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: `${ACCENT}60`,
                transitionDuration: "1s",
                transitionTimingFunction: "linear",
              }}
            />
          </div>
        </div>
      )}

      {/* ── SCROLLABLE BODY ─────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-36 space-y-6">
        <AnimatePresence mode="wait">

          {/* ═══ EXECUTION ══════════════════════════════════════════ */}
          {mode === "execution" && (
            <motion.div
              key="execution"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 pt-2"
            >
              {/* Action card */}
              <div
                className="rounded-2xl p-5 border"
                style={{ backgroundColor: "#0B1C2C", borderColor: "rgba(34,211,238,0.10)" }}
                data-testid="execution-context-card"
              >
                <p className="text-xs" style={{ color: "rgba(156,163,175,1)" }}>
                  You planned this yesterday
                </p>
                <h2 className="text-lg font-semibold mt-2 tracking-wide text-white">
                  2-MINUTE RESET
                </h2>
                <div className="flex items-center gap-3 mt-3">
                  <span
                    className="px-3 py-1 rounded-full text-xs"
                    style={{ backgroundColor: "rgba(34,211,238,0.10)", color: ACCENT }}
                  >
                    {timeLabel}
                  </span>
                  <span className="text-sm" style={{ color: "rgba(156,163,175,1)" }}>
                    {timeRange}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-4 text-sm" style={{ color: ACCENT }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />
                  Ready to begin
                </div>
              </div>

              {/* Context */}
              <div>
                <p className="text-lg font-medium text-white">
                  You placed this yesterday.
                </p>
                <p className="mt-1" style={{ color: "rgba(156,163,175,1)" }}>
                  Now you meet yourself there.
                </p>
              </div>

              {/* Instructions */}
              <div
                className="rounded-xl p-4 border"
                style={{ backgroundColor: "#0A1A26", borderColor: "rgba(255,255,255,0.05)" }}
              >
                <p className="text-sm leading-relaxed" style={{ color: "rgba(209,213,219,1)" }}>
                  A 2-minute guided breathing reset. Follow the circle, clear your mind, and commit to the moment.
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══ COUNTDOWN ══════════════════════════════════════════ */}
          {mode === "countdown" && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-8 pt-20"
            >
              <p className="text-sm tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
                Get comfortable. Starting in…
              </p>
              <motion.p
                key={countdown}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-7xl font-light"
                style={{ color: `${ACCENT}bb` }}
                data-testid="countdown-number"
              >
                {countdown}
              </motion.p>
            </motion.div>
          )}

          {/* ═══ ACTIVE — breathing session ═════════════════════════ */}
          {mode === "active" && (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center pt-16"
            >
              <BreathingSession elapsed={elapsed} />
            </motion.div>
          )}

          {/* ═══ COMPLETED — 4-step sequence ════════════════════════ */}
          {mode === "completed" && (
            <motion.div
              key="completed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center pt-8 space-y-8 text-center"
            >
              <AnimatedCheckmark />

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-2xl font-bold tracking-tight text-white"
              >
                You followed through.
              </motion.p>

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
                      <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: `${ACCENT}99` }}>
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
                    <p className="text-base font-bold text-white leading-snug">Your foundation is set.</p>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Now we build structure.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── FIXED CTA — above bottom nav ────────────────────────────── */}
      <div className="fixed bottom-[70px] left-0 right-0 z-40 px-4">
        <AnimatePresence mode="wait">

          {mode === "execution" && (
            <motion.button
              key="start-btn"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35 }}
              onClick={startSession}
              className="w-full py-3 rounded-xl font-semibold text-base transition active:scale-95"
              style={{ backgroundColor: ACCENT, color: "#000" }}
              data-testid="button-begin-day7"
            >
              Start Session
            </motion.button>
          )}

          {mode === "countdown" && (
            <div key="cd-spacer" />
          )}

          {mode === "active" && (
            <motion.div
              key="active-indicator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
              style={{ backgroundColor: `${ACCENT}10`, border: `1px solid ${ACCENT}25` }}
            >
              <span className="text-sm tracking-wide" style={{ color: `${ACCENT}cc` }}>Breathe…</span>
            </motion.div>
          )}

          {mode === "completed" && completionStep >= 4 && (
            <motion.button
              key="phase-btn"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              onClick={onComplete}
              className="w-full py-3 rounded-xl font-semibold text-base uppercase tracking-[0.12em] transition active:scale-95"
              style={{ backgroundColor: ACCENT, color: "#000" }}
              data-testid="button-finish-day7"
            >
              Enter Phase 1
            </motion.button>
          )}

          {mode === "completed" && completionStep < 4 && (
            <div key="completed-spacer" />
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
