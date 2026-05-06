import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Sun,
  Droplet,
  Activity,
  Sparkles,
  Check,
  X,
  ChevronRight,
  ArrowRight,
  Moon,
  Brain,
} from "lucide-react";
import {
  markWakeStarted,
  markHydrated,
  markLightExposure,
  markMovement,
  markWakeCompleted,
  recordSkip,
  setDreamRecall,
  setSleepQuality,
  getState as getFlowState,
  todayIso,
  type SkipReason,
  type DreamRecall,
} from "@/lib/vitalityFlowStore";
import { formatHM, bedtimeDeltaMin } from "@/lib/remCycleEngine";

type Phase = number;

const SKIP_REASONS: { value: SkipReason; label: string }[] = [
  { value: "too_tired", label: "Too tired" },
  { value: "no_time", label: "No time" },
  { value: "outside_routine", label: "Out of routine" },
  { value: "other", label: "Other" },
];

/* ─────────────── Reusable bits ─────────────── */
function PhaseProgress({ phase }: { phase: number }) {
  const total = 6;
  const pct = Math.min(100, ((phase) / total) * 100);
  return (
    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full transition-[width] duration-500"
        style={{
          width: `${pct}%`,
          background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
          boxShadow: "0 0 8px rgba(251,191,36,0.7)",
        }}
        data-testid="wake-progress-bar"
      />
    </div>
  );
}

function SkipDialog({
  open,
  onClose,
  onChoose,
}: {
  open: boolean;
  onClose: () => void;
  onChoose: (reason: SkipReason) => void;
}) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
      data-testid="skip-reason-modal"
    >
      <div
        className="w-full max-w-sm rounded-2xl p-4"
        style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: colors.textMuted }}>
          Why skip?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SKIP_REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => onChoose(r.value)}
              data-testid={`skip-reason-${r.value}`}
              className="rounded-lg py-2 text-xs font-bold"
              style={{
                backgroundColor: `${colors.primary}14`,
                border: `1px solid ${colors.primary}40`,
                color: colors.text,
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepActions({
  onDone,
  onSkip,
  doneLabel = "Done",
  primaryColor,
  doneDisabled,
}: {
  onDone: () => void;
  onSkip: () => void;
  doneLabel?: string;
  primaryColor: string;
  doneDisabled?: boolean;
}) {
  return (
    <div className="flex gap-2 w-full">
      <Button
        type="button"
        onClick={onDone}
        disabled={doneDisabled}
        className="flex-1 h-11 text-sm font-bold disabled:opacity-50"
        style={{ backgroundColor: primaryColor, color: "#0b1020" }}
        data-testid="button-step-done"
      >
        <Check size={15} className="mr-1.5" /> {doneLabel}
      </Button>
      <Button
        type="button"
        onClick={onSkip}
        variant="outline"
        className="h-11 px-4 text-xs border-white/15"
        data-testid="button-step-skip"
      >
        Skip
      </Button>
    </div>
  );
}

/* ─────────────── Phase 1: Wake experience ─────────────── */
function Phase1Wake({ onContinue }: { onContinue: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
      <style>{`
        @keyframes wakeBreath {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.18); opacity: 0.95; }
        }
        @keyframes wakeRays {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div
        className="relative w-44 h-44 mb-8 transition-all duration-[1500ms] ease-out"
        style={{ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(12px)" }}
      >
        {/* Rays */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(251,191,36,0.0), rgba(251,191,36,0.18), rgba(251,191,36,0.0), rgba(251,191,36,0.18), rgba(251,191,36,0.0))",
            animation: "wakeRays 18s linear infinite",
            filter: "blur(4px)",
          }}
        />
        {/* Sun core */}
        <div
          className="absolute inset-6 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #fde68a, #f59e0b 60%, #b45309 100%)",
            boxShadow:
              "0 0 60px rgba(251,191,36,0.55), 0 0 120px rgba(251,191,36,0.3)",
            animation: "wakeBreath 5s ease-in-out infinite",
          }}
          data-testid="sun-orb"
        />
      </div>
      <p
        className="text-[10px] uppercase tracking-[0.4em] mb-2 transition-opacity duration-1000"
        style={{ color: "#fbbf24", opacity: show ? 0.85 : 0 }}
      >
        Wake Flow
      </p>
      <h1
        className="text-3xl font-bold mb-2 transition-all duration-1000 delay-300"
        style={{
          color: "#fef3c7",
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(8px)",
          textShadow: "0 0 24px rgba(251,191,36,0.5)",
        }}
        data-testid="wake-greeting"
      >
        Good morning
      </h1>
      <p
        className="text-sm mb-10 transition-opacity duration-1000 delay-500"
        style={{ color: "rgba(254,243,199,0.7)", opacity: show ? 1 : 0 }}
      >
        Your day is starting. Take it slow.
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="text-xs uppercase tracking-[0.3em] px-6 py-3 rounded-full transition-all"
        style={{
          color: "#fef3c7",
          border: "1px solid rgba(251,191,36,0.35)",
          backgroundColor: "rgba(251,191,36,0.08)",
          opacity: show ? 1 : 0,
          transitionDelay: "1000ms",
        }}
        data-testid="button-begin-wake"
      >
        I'm awake <ArrowRight size={12} className="inline ml-1" />
      </button>
    </div>
  );
}

/* ─────────────── Phase 2: Nervous system activation ─────────────── */
type ActivationStep = "neck" | "twist" | "breath";
const ACTIVATION_STEPS: { id: ActivationStep; label: string; instruction: string }[] = [
  { id: "neck", label: "Neck rolls", instruction: "5 slow rolls each side. Feel the tension release." },
  { id: "twist", label: "Lying spinal twist", instruction: "Knees to one side, hold 20 sec. Repeat other side." },
  { id: "breath", label: "Breathing", instruction: "Inhale 4 seconds, exhale 6. Loop for ~1 minute." },
];

function BreathingCircle() {
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let mounted = true;
    const cycle = () => {
      if (!mounted) return;
      setPhase("in");
      setTimeout(() => mounted && setPhase("out"), 4000);
    };
    cycle();
    const id = setInterval(cycle, 10_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    setCountdown(60);
    const id = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;
  const display = mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;

  return (
    <div className="flex flex-col items-center my-6">
      <div
        className="rounded-full transition-all ease-in-out"
        style={{
          width: phase === "in" ? 160 : 90,
          height: phase === "in" ? 160 : 90,
          background:
            "radial-gradient(circle, rgba(251,191,36,0.35), rgba(245,158,11,0.05))",
          border: "1px solid rgba(251,191,36,0.5)",
          boxShadow: "0 0 32px rgba(251,191,36,0.45)",
          transitionDuration: phase === "in" ? "4000ms" : "6000ms",
        }}
        data-testid="breath-circle"
      />
      <p className="mt-4 text-sm font-bold tracking-[0.3em]" style={{ color: "#fbbf24" }}>
        {phase === "in" ? "INHALE" : "EXHALE"}
      </p>
      <p
        className="mt-2 text-xl font-bold font-mono tabular-nums"
        style={{ color: countdown <= 10 ? "#f97316" : "#fbbf24" }}
        data-testid="breath-countdown"
      >
        {display}
      </p>
      <p className="text-[10px] mt-0.5" style={{ color: "rgba(251,191,36,0.5)" }}>
        {countdown > 0 ? "remaining" : "complete"}
      </p>
    </div>
  );
}

function Phase2Activation({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [idx, setIdx] = useState(0);
  const step = ACTIVATION_STEPS[idx];
  const isLast = idx === ACTIVATION_STEPS.length - 1;

  const advance = () => {
    if (isLast) {
      onDone();
    } else {
      setIdx((i) => i + 1);
    }
  };

  return (
    <div className="flex flex-col items-center px-6 py-10 max-w-md mx-auto w-full">
      <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: "#fbbf24" }}>
        Phase 2 · Activation
      </p>
      <h2 className="text-xl font-bold mb-1" style={{ color: colors.text }}>
        {step.label}
      </h2>
      <p className="text-xs text-center max-w-xs mb-2" style={{ color: colors.textMuted }}>
        Step {idx + 1} of {ACTIVATION_STEPS.length}
      </p>
      <div
        className="w-full rounded-2xl p-5 my-4 text-center"
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.surfaceBorder}`,
        }}
        data-testid={`activation-step-${step.id}`}
      >
        <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
          {step.instruction}
        </p>
        {step.id === "breath" && <BreathingCircle />}
      </div>
      <StepActions
        onDone={advance}
        onSkip={onSkip}
        doneLabel={isLast ? "Done" : "Next"}
        primaryColor="#fbbf24"
      />
    </div>
  );
}

/* ─────────────── Phase 3: Hydration ─────────────── */
const ML_PER_OZ = 29.5735;
const HYDRATION_OPTIONS_OZ = [8, 16, 24];

function Phase3Hydration({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [amountOz, setAmountOz] = useState(8);
  return (
    <div className="flex flex-col items-center px-6 py-10 max-w-md mx-auto w-full">
      <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: "#06b6d4" }}>
        Phase 3 · Hydrate
      </p>
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
        style={{
          backgroundColor: "rgba(6,182,212,0.15)",
          border: "1px solid rgba(6,182,212,0.4)",
          boxShadow: "0 0 32px rgba(6,182,212,0.35)",
        }}
      >
        <Droplet size={36} style={{ color: "#06b6d4" }} />
      </div>
      <h2 className="text-xl font-bold mb-2 text-center" style={{ color: colors.text }}>
        Drink one full glass of water
      </h2>
      <p className="text-xs text-center mb-5 max-w-xs" style={{ color: colors.textMuted }}>
        Your body just spent 7-9 hours without water. Refill now.
      </p>

      <div className="w-full grid grid-cols-3 gap-2 mb-5">
        {HYDRATION_OPTIONS_OZ.map((oz) => (
          <button
            key={oz}
            type="button"
            onClick={() => setAmountOz(oz)}
            data-testid={`button-water-${oz}`}
            className="rounded-lg py-2 text-xs font-bold transition-transform active:scale-95"
            style={{
              backgroundColor: amountOz === oz ? "rgba(6,182,212,0.3)" : "rgba(6,182,212,0.08)",
              border: `1px solid ${amountOz === oz ? "#06b6d4" : "rgba(6,182,212,0.3)"}`,
              color: amountOz === oz ? "#06b6d4" : colors.textMuted,
            }}
          >
            {oz} oz
          </button>
        ))}
      </div>

      <StepActions
        onDone={() => {
          markHydrated(Math.round(amountOz * ML_PER_OZ));
          onDone();
        }}
        onSkip={onSkip}
        doneLabel="I drank water"
        primaryColor="#06b6d4"
      />
    </div>
  );
}

/* ─────────────── Phase 4: Light exposure ─────────────── */
function Phase4Light({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [decision, setDecision] = useState<"yes" | "no" | null>(null);
  const [seconds, setSeconds] = useState(120);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (decision !== "yes") return;
    intervalRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [decision]);

  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;

  return (
    <div className="flex flex-col items-center px-6 py-10 max-w-md mx-auto w-full">
      <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: "#fbbf24" }}>
        Phase 4 · Light
      </p>
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
        style={{
          background: "radial-gradient(circle, rgba(251,191,36,0.4), rgba(245,158,11,0.05))",
          border: "1px solid rgba(251,191,36,0.5)",
          boxShadow: "0 0 32px rgba(251,191,36,0.5)",
        }}
      >
        <Sun size={36} style={{ color: "#fef3c7" }} />
      </div>

      {decision === null && (
        <>
          <h2 className="text-xl font-bold mb-1 text-center" style={{ color: colors.text }}>
            Can you go outside right now?
          </h2>
          <p className="text-xs text-center mb-5 max-w-xs" style={{ color: colors.textMuted }}>
            Natural light within an hour of waking sets your circadian clock.
          </p>
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              onClick={() => setDecision("yes")}
              className="flex-1 h-11 text-sm font-bold"
              style={{ backgroundColor: "#fbbf24", color: "#0b1020" }}
              data-testid="button-light-yes"
            >
              Yes, I can
            </Button>
            <Button
              type="button"
              onClick={() => setDecision("no")}
              variant="outline"
              className="flex-1 h-11 text-sm border-white/15"
              data-testid="button-light-no"
            >
              Not right now
            </Button>
          </div>
        </>
      )}

      {decision === "yes" && (
        <>
          <h2 className="text-lg font-bold mb-1 text-center" style={{ color: colors.text }}>
            Step outside
          </h2>
          <p className="text-xs text-center mb-4" style={{ color: colors.textMuted }}>
            2-5 minutes of natural light. No phone needed.
          </p>
          <div
            className="text-4xl font-mono font-bold mb-5"
            style={{ color: "#fbbf24", textShadow: "0 0 16px rgba(251,191,36,0.5)" }}
            data-testid="light-timer"
          >
            {mm}:{String(ss).padStart(2, "0")}
          </div>
          <StepActions
            onDone={() => {
              markLightExposure();
              onDone();
            }}
            onSkip={onSkip}
            doneLabel={seconds === 0 ? "I'm back" : "Done early"}
            primaryColor="#fbbf24"
          />
        </>
      )}

      {decision === "no" && (
        <>
          <h2 className="text-lg font-bold mb-2 text-center" style={{ color: colors.text }}>
            Indoor fallback
          </h2>
          <ul className="text-sm text-left mb-5 space-y-2 w-full max-w-xs" style={{ color: colors.text }}>
            <li className="flex items-center gap-2">
              <Check size={14} style={{ color: "#fbbf24" }} /> Turn on all the lights
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} style={{ color: "#fbbf24" }} /> Set screen brightness to max
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} style={{ color: "#fbbf24" }} /> Open every blind / curtain
            </li>
          </ul>
          <StepActions
            onDone={() => {
              markLightExposure();
              onDone();
            }}
            onSkip={onSkip}
            doneLabel="Done"
            primaryColor="#fbbf24"
          />
        </>
      )}
    </div>
  );
}

/* ─────────────── Phase 5: Micro movement ─────────────── */
const MOVEMENT_OPTIONS = [
  { id: "squats", label: "10 squats" },
  { id: "pushups", label: "10 push-ups" },
  { id: "walk", label: "2 minute walk" },
];

function Phase5Movement({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-center px-6 py-10 max-w-md mx-auto w-full">
      <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: "#22c55e" }}>
        Phase 5 · Activate
      </p>
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
        style={{
          backgroundColor: "rgba(34,197,94,0.15)",
          border: "1px solid rgba(34,197,94,0.4)",
          boxShadow: "0 0 32px rgba(34,197,94,0.35)",
        }}
      >
        <Activity size={36} style={{ color: "#22c55e" }} />
      </div>
      <h2 className="text-xl font-bold mb-1 text-center" style={{ color: colors.text }}>
        Quick activation
      </h2>
      <p className="text-xs text-center mb-5 max-w-xs" style={{ color: colors.textMuted }}>
        Pick one. Just enough to wake the body.
      </p>
      <div className="w-full grid grid-cols-1 gap-2 mb-5">
        {MOVEMENT_OPTIONS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setPicked(m.id)}
            data-testid={`movement-${m.id}`}
            className="rounded-lg py-3 text-sm font-bold transition-all"
            style={{
              backgroundColor: picked === m.id ? "rgba(34,197,94,0.25)" : `${colors.surface}`,
              border: `1px solid ${picked === m.id ? "#22c55e" : colors.surfaceBorder}`,
              color: picked === m.id ? "#22c55e" : colors.text,
              boxShadow: picked === m.id ? "0 0 16px rgba(34,197,94,0.3)" : "none",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <StepActions
        onDone={() => {
          if (!picked) return;
          markMovement();
          onDone();
        }}
        onSkip={onSkip}
        doneLabel="Done"
        primaryColor="#22c55e"
        doneDisabled={!picked}
      />
    </div>
  );
}

/* ─────────────── Completion ─────────────── */
function Completion({ streak, onClose }: { streak: number; onClose: () => void }) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <style>{`
        @keyframes activatedGlow {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.18); opacity: 1; }
        }
      `}</style>
      <div
        className="w-32 h-32 rounded-full flex items-center justify-center mb-6"
        style={{
          background: "radial-gradient(circle, rgba(251,191,36,0.4), rgba(245,158,11,0.05))",
          border: "2px solid #fbbf24",
          boxShadow: "0 0 48px rgba(251,191,36,0.6), 0 0 96px rgba(251,191,36,0.3)",
          animation: "activatedGlow 3s ease-in-out infinite",
        }}
      >
        <Sparkles size={48} style={{ color: "#fef3c7" }} />
      </div>
      <p className="text-[10px] uppercase tracking-[0.4em] mb-1" style={{ color: "#fbbf24" }}>
        Wake Flow Complete
      </p>
      <h1 className="text-3xl font-bold mb-3" style={{ color: colors.text, textShadow: "0 0 24px rgba(251,191,36,0.4)" }}>
        You're activated
      </h1>
      <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
        Your morning is set. Carry the momentum.
      </p>
      <div
        className="px-5 py-3 rounded-xl mb-8"
        style={{
          backgroundColor: "rgba(251,191,36,0.1)",
          border: "1px solid rgba(251,191,36,0.3)",
        }}
        data-testid="wake-streak-display"
      >
        <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>
          Wake Streak
        </p>
        <p className="text-2xl font-bold font-mono" style={{ color: "#fbbf24" }}>
          {streak} {streak === 1 ? "day" : "days"}
        </p>
      </div>
      <Button
        type="button"
        onClick={onClose}
        className="px-8 h-11 text-sm font-bold"
        style={{ backgroundColor: "#fbbf24", color: "#0b1020" }}
        data-testid="button-finish-wake"
      >
        Continue your day <ChevronRight size={14} className="ml-1" />
      </Button>
    </div>
  );
}

/* ─────────────── REM Debrief (Phase 2) ─────────────── */

const RECALL_OPTIONS: { value: DreamRecall; label: string; tone: string }[] = [
  { value: "none", label: "Blank", tone: "#6b7280" },
  { value: "faint", label: "Faint", tone: "#a78bfa" },
  { value: "vivid", label: "Vivid", tone: "#22d3ee" },
];

function PhaseRemDebrief({
  onDone,
  onSkip,
}: {
  onDone: () => void;
  onSkip: () => void;
}) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [recall, setRecall] = useState<DreamRecall | null>(null);
  const [quality, setQuality] = useState<number | null>(null);

  const flow = getFlowState();
  // Last night's Night Flow ran on the PREVIOUS day, so bedTime/targetBedTime
  // live on yesterday's record. Wake Flow itself runs today and writes
  // dreamRecall/sleepQuality to today's record. Use the same local-date
  // helper as the store to avoid UTC-boundary off-by-one bugs.
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const lastNight = flow.history[todayIso(yesterday)];
  const delta =
    lastNight?.bedTime && lastNight?.targetBedTime
      ? bedtimeDeltaMin(lastNight.bedTime, lastNight.targetBedTime)
      : null;

  const canFinish = recall !== null && quality !== null;

  const handleDone = () => {
    if (recall) setDreamRecall(recall);
    if (quality) setSleepQuality(quality);
    onDone();
  };

  return (
    <div className="flex flex-col items-center px-6 py-10 max-w-md mx-auto w-full" data-testid="phase-rem-debrief">
      <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: "#a78bfa" }}>
        Phase 2 · REM Debrief
      </p>
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
        style={{
          backgroundColor: "rgba(167,139,250,0.15)",
          border: "1px solid rgba(167,139,250,0.4)",
          boxShadow: "0 0 20px rgba(167,139,250,0.25)",
        }}
      >
        <Brain size={30} style={{ color: "#a78bfa" }} />
      </div>
      <h2 className="text-xl font-bold mb-1 text-center" style={{ color: colors.text }}>
        How was sleep?
      </h2>
      <p className="text-xs text-center mb-4 max-w-xs" style={{ color: colors.textMuted }}>
        Two quick reads while it's fresh. Recall reveals REM quality.
      </p>

      {/* Bedtime delta context (from last night's Night Flow) */}
      {delta !== null && (
        <div
          className="w-full rounded-xl px-3 py-2 mb-4 flex items-center gap-2"
          style={{
            backgroundColor: "rgba(99,102,241,0.06)",
            border: "1px solid rgba(99,102,241,0.18)",
          }}
          data-testid="bedtime-delta"
        >
          <Moon size={12} style={{ color: "#a5b4fc" }} />
          <span className="text-[11px] flex-1" style={{ color: colors.textMuted }}>
            Asleep at {lastNight?.bedTime ? formatHM(new Date(lastNight.bedTime)) : "—"}
          </span>
          <span
            className="text-[10px] font-mono font-bold"
            style={{ color: delta > 30 ? "#fbbf24" : delta < -10 ? "#22d3ee" : "#a5b4fc" }}
          >
            {delta > 0 ? `+${delta}m late` : delta < 0 ? `${Math.abs(delta)}m early` : "on target"}
          </span>
        </div>
      )}

      {/* Caffeine + alcohol context from last night (REM disruptors) */}
      {(lastNight?.hadAlcohol || typeof lastNight?.caffeineHoursAgo === "number") && (
        <div
          className="w-full rounded-xl px-3 py-2 mb-4"
          style={{
            backgroundColor: "rgba(251,191,36,0.06)",
            border: "1px solid rgba(251,191,36,0.18)",
          }}
          data-testid="rem-context"
        >
          <p className="text-[10px] mb-1" style={{ color: "#fbbf24", letterSpacing: "0.05em" }}>
            REM context
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]" style={{ color: colors.textMuted }}>
            {typeof lastNight?.caffeineHoursAgo === "number" && (
              <span data-testid="ctx-caffeine">
                Caffeine ~{lastNight.caffeineHoursAgo}h before bed
                {lastNight.caffeineHoursAgo < 6 ? " (may have shortened deep sleep)" : ""}
              </span>
            )}
            {lastNight?.hadAlcohol && (
              <span data-testid="ctx-alcohol">
                Alcohol logged · expect lighter REM
              </span>
            )}
          </div>
        </div>
      )}

      {/* Dream recall */}
      <div className="w-full mb-4">
        <p className="text-[11px] mb-2" style={{ color: colors.textMuted }}>
          Dream recall
        </p>
        <div className="grid grid-cols-3 gap-2">
          {RECALL_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setRecall(o.value)}
              data-testid={`recall-${o.value}`}
              className="rounded-lg py-2.5 text-xs font-bold transition-all"
              style={{
                backgroundColor: recall === o.value ? `${o.tone}25` : `${colors.surface}`,
                border: `1px solid ${recall === o.value ? o.tone : colors.surfaceBorder}`,
                color: recall === o.value ? o.tone : colors.textMuted,
                boxShadow: recall === o.value ? `0 0 12px ${o.tone}40` : "none",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sleep quality 1-5 */}
      <div className="w-full mb-6">
        <p className="text-[11px] mb-2" style={{ color: colors.textMuted }}>
          Sleep quality
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQuality(n)}
              data-testid={`quality-${n}`}
              className="rounded-lg py-2.5 text-sm font-bold transition-all"
              style={{
                backgroundColor: quality === n ? "rgba(34,211,238,0.2)" : `${colors.surface}`,
                border: `1px solid ${quality === n ? "#22d3ee" : colors.surfaceBorder}`,
                color: quality === n ? "#22d3ee" : colors.textMuted,
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-[9px] mt-1.5 px-1" style={{ color: colors.textMuted, opacity: 0.6 }}>
          <span>Rough</span>
          <span>Deep</span>
        </div>
      </div>

      <div className="w-full flex gap-2">
        <Button
          type="button"
          onClick={handleDone}
          disabled={!canFinish}
          className="flex-1 h-11 text-xs font-bold uppercase tracking-wider"
          style={{
            backgroundColor: canFinish ? "#a78bfa" : "rgba(167,139,250,0.3)",
            color: "#0a0a18",
            opacity: canFinish ? 1 : 0.5,
          }}
          data-testid="button-debrief-done"
        >
          Continue <ChevronRight size={14} className="ml-1" />
        </Button>
        <button
          type="button"
          onClick={onSkip}
          className="text-[10px] uppercase tracking-wider px-3"
          style={{ color: colors.textMuted }}
          data-testid="button-debrief-skip"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

/* ─────────────── Page shell ─────────────── */
export default function WakeFlowPage() {
  const [, navigate] = useLocation();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>(1);
  const [skipFor, setSkipFor] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    markWakeStarted();
  }, []);

  // Background gradient animates from dark → warm.
  const bg = useMemo(() => {
    if (phase === 1) {
      return "radial-gradient(ellipse at top, #1a1208 0%, #0a0a0f 70%)";
    }
    if (phase === 2) {
      // REM debrief — keep cooler purple while reflecting on dreams.
      return "radial-gradient(ellipse at top, #1a1530 0%, #0a0a18 70%)";
    }
    if (phase === 7) {
      return "radial-gradient(ellipse at top, #2d1f0a 0%, #0f0e1a 70%)";
    }
    return "radial-gradient(ellipse at top, #221708 0%, #0c0c14 70%)";
  }, [phase]);

  const close = () => navigate("/");

  const handleSkip = (label: string) => {
    setSkipFor(label);
  };

  const onSkipReason = (reason: SkipReason) => {
    if (skipFor) recordSkip(skipFor, reason);
    const wasMovementSkip = skipFor === "movement";
    setSkipFor(null);
    if (wasMovementSkip) {
      // Last interactive phase: finalize once the user has picked a skip reason.
      finalize();
    } else {
      setPhase((p) => (p < 6 ? p + 1 : 7));
    }
  };

  const advance = () => setPhase((p) => ((p + 1) as Phase));

  const finalize = () => {
    const s = markWakeCompleted();
    setStreak(s.wakeStreak);
    setPhase(7 as Phase);
  };

  return (
    <div
      className="min-h-screen w-full transition-all duration-1000"
      style={{ background: bg, color: colors.text }}
      data-testid="wake-flow-page"
    >
      {/* Top bar */}
      {phase > 1 && phase < 7 && (
        <div className="fixed top-0 inset-x-0 z-30 px-4 pt-3 pb-2" style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.3)" }}>
          <div className="max-w-md mx-auto flex items-center gap-3">
            <button
              type="button"
              onClick={close}
              className="p-1.5 rounded-lg"
              style={{ color: colors.textMuted }}
              data-testid="button-close-wake"
            >
              <X size={16} />
            </button>
            <div className="flex-1">
              <PhaseProgress phase={phase} />
            </div>
            <span className="text-[10px] font-mono w-10 text-right" style={{ color: colors.textMuted }}>
              {phase}/6
            </span>
          </div>
        </div>
      )}

      <div className={phase > 1 && phase < 7 ? "pt-12" : ""}>
        {phase === 1 && <Phase1Wake onContinue={advance} />}
        {phase === 2 && <PhaseRemDebrief onDone={advance} onSkip={() => handleSkip("rem_debrief")} />}
        {phase === 3 && <Phase2Activation onDone={advance} onSkip={() => handleSkip("activation")} />}
        {phase === 4 && <Phase3Hydration onDone={advance} onSkip={() => handleSkip("hydration")} />}
        {phase === 5 && <Phase4Light onDone={advance} onSkip={() => handleSkip("light")} />}
        {phase === 6 && <Phase5Movement onDone={finalize} onSkip={() => handleSkip("movement")} />}
        {phase === 7 && <Completion streak={streak} onClose={close} />}
      </div>

      <SkipDialog open={!!skipFor} onClose={() => setSkipFor(null)} onChoose={onSkipReason} />
    </div>
  );
}
