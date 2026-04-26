import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  Moon,
  Smartphone,
  Wind,
  Heart,
  PenLine,
  Check,
  X,
  ChevronRight,
  ArrowRight,
  Utensils,
  Coffee,
  Wine,
  Settings2,
} from "lucide-react";
import {
  getState,
  markFoodCutoffHeld,
  markNightCompleted,
  recordSkip,
  setTargetBedTime,
  setCaffeineHoursAgo,
  setHadAlcohol,
  type SkipReason,
} from "@/lib/vitalityFlowStore";
import { getNightPlan, type NightPlan } from "@/lib/sleepModeStore";
import {
  bedtimeForCycles,
  formatHM,
  recommendedCycles,
  type CycleCount,
} from "@/lib/remCycleEngine";

type Phase = number;

const SKIP_REASONS: { value: SkipReason; label: string }[] = [
  { value: "too_tired", label: "Too tired" },
  { value: "no_time", label: "No time" },
  { value: "outside_routine", label: "Out of routine" },
  { value: "other", label: "Other" },
];

function PhaseProgress({ phase, total }: { phase: number; total: number }) {
  const safeTotal = Math.max(1, total);
  const pct = Math.min(100, (phase / safeTotal) * 100);
  return (
    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full transition-[width] duration-500"
        style={{
          width: `${pct}%`,
          background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
          boxShadow: "0 0 8px rgba(139,92,246,0.55)",
        }}
        data-testid="night-progress-bar"
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
                backgroundColor: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.35)",
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
  doneDisabled,
}: {
  onDone: () => void;
  onSkip: () => void;
  doneLabel?: string;
  doneDisabled?: boolean;
}) {
  return (
    <div className="flex gap-2 w-full">
      <Button
        type="button"
        onClick={onDone}
        disabled={doneDisabled}
        className="flex-1 h-11 text-sm font-bold disabled:opacity-50"
        style={{ backgroundColor: "#8b5cf6", color: "#fff" }}
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

/* ─────────────── Phase 1: Wind-down initiation ─────────────── */

interface CycleTarget {
  cycles: CycleCount;
  bedtime: Date;
  /** Minutes from now until the target bedtime (negative = already past). */
  minutesAway: number;
}

function resolveCycleTarget(plan: NightPlan): CycleTarget | null {
  if (!plan.wakeTime) return null;
  const now = new Date();
  let cycles: CycleCount;
  if (plan.cycles) {
    cycles = plan.cycles;
  } else {
    const best = recommendedCycles(plan.wakeTime, now);
    cycles = best === 4 || best === 5 || best === 6 ? best : 5;
  }
  const bedtime = bedtimeForCycles(plan.wakeTime, cycles, now);
  return {
    cycles,
    bedtime,
    minutesAway: Math.round((bedtime.getTime() - now.getTime()) / 60_000),
  };
}

function Phase1Init({
  onContinue,
  plan,
  target,
}: {
  onContinue: () => void;
  plan: NightPlan;
  target: CycleTarget | null;
}) {
  const [, navigate] = useLocation();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  const onTime = target ? target.minutesAway >= -10 : false;
  const headline = !target
    ? "Start winding down"
    : onTime
    ? `${target.cycles} REM cycles tonight`
    : `Bedtime target passed`;
  const subline = !target
    ? "The day is closing. Let your system rest."
    : onTime
    ? `Asleep by ${formatHM(target.bedtime)} → wake at ${formatHM(new Date(target.bedtime.getTime() + (target.cycles * 90 + 14) * 60_000))}.`
    : `You wanted to be asleep ${Math.abs(target.minutesAway)} min ago. Aim for the next 90-minute boundary.`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
      <style>{`
        @keyframes nightPulse {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.12); opacity: 0.95; }
        }
      `}</style>
      <div
        className="relative w-40 h-40 mb-6 transition-all duration-[1500ms] ease-out"
        style={{ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(12px)" }}
      >
        <div
          className="absolute inset-4 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 65% 35%, #c7d2fe, #6366f1 60%, #1e1b4b 100%)",
            boxShadow:
              "0 0 60px rgba(99,102,241,0.5), 0 0 120px rgba(99,102,241,0.25)",
            animation: "nightPulse 5s ease-in-out infinite",
          }}
          data-testid="moon-orb"
        />
      </div>
      <p
        className="text-[10px] uppercase tracking-[0.4em] mb-2 transition-opacity duration-1000"
        style={{ color: "#a5b4fc", opacity: show ? 0.85 : 0 }}
      >
        Night Flow
      </p>
      <h1
        className="text-2xl sm:text-3xl font-bold mb-2 transition-all duration-1000 delay-300"
        style={{
          color: "#e0e7ff",
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(8px)",
          textShadow: "0 0 24px rgba(99,102,241,0.4)",
        }}
        data-testid="night-greeting"
      >
        {headline}
      </h1>
      <p
        className="text-sm max-w-xs mb-6 transition-opacity duration-1000 delay-500"
        style={{ color: "rgba(224,231,255,0.7)", opacity: show ? 1 : 0 }}
        data-testid="night-target-subline"
      >
        {subline}
      </p>

      {/* Cycle math card */}
      {target && (
        <div
          className="w-full max-w-sm rounded-xl px-4 py-3 mb-5 transition-opacity duration-1000 delay-700"
          style={{
            backgroundColor: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.25)",
            opacity: show ? 1 : 0,
          }}
          data-testid="cycle-target-card"
        >
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider mb-1.5"
               style={{ color: "rgba(165,180,252,0.7)" }}>
            <span>Tonight's target</span>
            <span>{target.cycles} × 90m + 14m</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px]" style={{ color: "rgba(224,231,255,0.65)" }}>
              Asleep by
            </span>
            <span
              className="text-lg font-mono font-bold"
              style={{ color: "#e0e7ff" }}
              data-testid="text-tonight-bedtime"
            >
              {formatHM(target.bedtime)}
            </span>
          </div>
          {onTime ? (
            target.minutesAway > 0 && target.minutesAway < 30 ? (
              <p className="text-[10px] mt-1.5" style={{ color: "#fbbf24" }}>
                {target.minutesAway} min away — start winding down now.
              </p>
            ) : null
          ) : (
            <p className="text-[10px] mt-1.5" style={{ color: "#fbbf24" }}>
              Get to bed soon — you can still catch 4 cycles.
            </p>
          )}
        </div>
      )}

      {!plan.wakeTime && (
        <button
          type="button"
          onClick={() => navigate("/sleep-settings")}
          className="text-[10px] uppercase tracking-[0.2em] mb-4 px-3 py-1.5 rounded-full transition-opacity"
          style={{
            color: "#a5b4fc",
            border: "1px solid rgba(99,102,241,0.3)",
            backgroundColor: "rgba(99,102,241,0.06)",
            opacity: show ? 1 : 0,
            transitionDelay: "800ms",
          }}
          data-testid="button-set-wake-time"
        >
          <Settings2 size={11} className="inline mr-1" />
          Set wake time for cycle math
        </button>
      )}

      <button
        type="button"
        onClick={onContinue}
        className="text-xs uppercase tracking-[0.3em] px-6 py-3 rounded-full transition-all"
        style={{
          color: "#e0e7ff",
          border: "1px solid rgba(99,102,241,0.4)",
          backgroundColor: "rgba(99,102,241,0.1)",
          opacity: show ? 1 : 0,
          transitionDelay: "1000ms",
        }}
        data-testid="button-begin-night"
      >
        Begin <ArrowRight size={12} className="inline ml-1" />
      </button>
    </div>
  );
}

/* ─────────────── Optional REM micro-prompt ─────────────── */

const CAFFEINE_OPTIONS = [
  { value: 0, label: "Just had" },
  { value: 4, label: "<4h" },
  { value: 8, label: "4-8h" },
  { value: 12, label: ">8h" },
];

function RemPromptRow() {
  const [caf, setCaf] = useState<number | null>(null);
  const [alc, setAlc] = useState<boolean | null>(null);
  return (
    <div
      className="w-full max-w-sm rounded-xl p-3 mb-5"
      style={{
        backgroundColor: "rgba(15,23,42,0.55)",
        border: "1px solid rgba(99,102,241,0.18)",
      }}
      data-testid="rem-prompt-row"
    >
      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "rgba(165,180,252,0.7)" }}>
        Quick check (optional)
      </p>
      <div className="flex items-center gap-2 mb-2">
        <Coffee size={12} style={{ color: "#f59e0b" }} />
        <span className="text-[11px]" style={{ color: "rgba(224,231,255,0.7)" }}>
          Last caffeine
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {CAFFEINE_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              setCaf(o.value);
              setCaffeineHoursAgo(o.value);
            }}
            data-testid={`caf-${o.value}`}
            className="rounded-md py-1.5 text-[10px] font-bold"
            style={{
              backgroundColor: caf === o.value ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${caf === o.value ? "#f59e0b" : "rgba(255,255,255,0.08)"}`,
              color: caf === o.value ? "#fbbf24" : "rgba(224,231,255,0.55)",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wine size={12} style={{ color: "#ec4899" }} />
          <span className="text-[11px]" style={{ color: "rgba(224,231,255,0.7)" }}>
            Alcohol tonight?
          </span>
        </div>
        <div className="flex gap-1.5">
          {[
            { v: false, label: "No" },
            { v: true, label: "Yes" },
          ].map((b) => (
            <button
              key={String(b.v)}
              type="button"
              onClick={() => {
                setAlc(b.v);
                setHadAlcohol(b.v);
              }}
              data-testid={`alc-${b.v}`}
              className="rounded-md px-3 py-1 text-[10px] font-bold"
              style={{
                backgroundColor: alc === b.v ? "rgba(236,72,153,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${alc === b.v ? "#ec4899" : "rgba(255,255,255,0.08)"}`,
                color: alc === b.v ? "#f472b6" : "rgba(224,231,255,0.55)",
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
      {alc === true && (
        <p className="text-[10px] mt-2" style={{ color: "#f472b6" }}>
          Alcohol fragments REM. Try cutting it 3h before bed.
        </p>
      )}
    </div>
  );
}

/* ─────────────── Phase 2: Food cutoff (adaptive) ─────────────── */
function Phase2FoodCutoff({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const state = getState();
  const minutes = state.cutoffMinutes;
  const streak = state.cutoffStreak;
  return (
    <div className="flex flex-col items-center px-6 py-10 max-w-md mx-auto w-full">
      <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: "#f97316" }}>
        Phase 2 · Food Cutoff
      </p>
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
        style={{
          backgroundColor: "rgba(249,115,22,0.15)",
          border: "1px solid rgba(249,115,22,0.4)",
          boxShadow: "0 0 24px rgba(249,115,22,0.3)",
        }}
      >
        <Utensils size={36} style={{ color: "#f97316" }} />
      </div>
      <h2 className="text-xl font-bold mb-1 text-center" style={{ color: colors.text }}>
        No eating for {minutes} min before bed
      </h2>
      <p className="text-xs text-center mb-5 max-w-xs" style={{ color: colors.textMuted }}>
        Late food fragments REM. Hold the line tonight to protect dream sleep.
      </p>
      <div
        className="w-full rounded-xl p-3 mb-5 flex items-center justify-between"
        style={{
          backgroundColor: "rgba(249,115,22,0.08)",
          border: "1px solid rgba(249,115,22,0.25)",
        }}
      >
        <span className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>
          Cutoff streak
        </span>
        <span className="text-sm font-mono font-bold" style={{ color: "#f97316" }} data-testid="cutoff-streak">
          {streak} {streak === 1 ? "day" : "days"}
        </span>
      </div>
      <StepActions
        onDone={() => { markFoodCutoffHeld(); onDone(); }}
        onSkip={onSkip}
        doneLabel="I held the cutoff"
      />
    </div>
  );
}

/* ─────────────── Phase 3: Low stimulation ─────────────── */
function Phase3LowStim({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [focusOn, setFocusOn] = useState(false);
  return (
    <div className="flex flex-col items-center px-6 py-10 max-w-md mx-auto w-full">
      <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: "#a5b4fc" }}>
        Phase 3 · Low Stimulation
      </p>
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
        style={{
          backgroundColor: "rgba(99,102,241,0.15)",
          border: "1px solid rgba(99,102,241,0.4)",
          boxShadow: "0 0 24px rgba(99,102,241,0.3)",
        }}
      >
        <Smartphone size={36} style={{ color: "#a5b4fc" }} />
      </div>
      <h2 className="text-xl font-bold mb-1 text-center" style={{ color: colors.text }}>
        Reduce stimulation
      </h2>
      <p className="text-xs text-center mb-5 max-w-xs" style={{ color: colors.textMuted }}>
        Bright screens delay melatonin and push REM later. Dim things down.
      </p>
      <div
        className="w-full rounded-xl p-3 mb-5 flex items-center justify-between"
        style={{
          backgroundColor: focusOn ? "rgba(139,92,246,0.18)" : `${colors.surface}`,
          border: `1px solid ${focusOn ? "#8b5cf6" : colors.surfaceBorder}`,
        }}
      >
        <div>
          <p className="text-xs font-bold" style={{ color: colors.text }}>Focus Mode</p>
          <p className="text-[10px]" style={{ color: colors.textMuted }}>Hide non-essential sections</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFocusOn((v) => !v);
            try {
              localStorage.setItem("ascend_focus_mode", focusOn ? "0" : "1");
            } catch {}
          }}
          data-testid="toggle-focus-mode"
          className="relative w-10 h-5 rounded-full transition-colors"
          style={{ backgroundColor: focusOn ? "#8b5cf6" : "rgba(255,255,255,0.15)" }}
          aria-pressed={focusOn}
        >
          <span
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
            style={{ left: focusOn ? "calc(100% - 18px)" : "2px" }}
          />
        </button>
      </div>
      <StepActions onDone={onDone} onSkip={onSkip} />
    </div>
  );
}

/* ─────────────── Phase 4: Sleep priming ─────────────── */
const PRIMING_OPTIONS = [
  { id: "breathing", label: "Calm Breathing", subtitle: "2 min · 4-4-6 rhythm", icon: Wind, color: "#3b82f6" },
  { id: "body_scan", label: "Body Scan", subtitle: "Release tension head to toe", icon: Heart, color: "#ec4899" },
  { id: "reflection", label: "Reflection", subtitle: "One line about today", icon: PenLine, color: "#f59e0b" },
];

function NightBreathingMini({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const [cycles, setCycles] = useState(0);
  useEffect(() => {
    let mounted = true;
    let t1: number, t2: number, t3: number;
    const cycle = () => {
      if (!mounted) return;
      setPhase("in");
      t1 = window.setTimeout(() => {
        if (!mounted) return;
        setPhase("hold");
        t2 = window.setTimeout(() => {
          if (!mounted) return;
          setPhase("out");
          t3 = window.setTimeout(() => {
            if (!mounted) return;
            setCycles((c) => c + 1);
            cycle();
          }, 6000);
        }, 4000);
      }, 4000);
    };
    cycle();
    return () => {
      mounted = false;
      window.clearTimeout(t1!);
      window.clearTimeout(t2!);
      window.clearTimeout(t3!);
    };
  }, []);
  const label = phase === "in" ? "INHALE" : phase === "hold" ? "HOLD" : "EXHALE";
  return (
    <div className="flex flex-col items-center my-4">
      <div
        className="rounded-full transition-all ease-in-out"
        style={{
          width: phase === "in" ? 160 : phase === "out" ? 90 : 160,
          height: phase === "in" ? 160 : phase === "out" ? 90 : 160,
          background: "radial-gradient(circle, rgba(99,102,241,0.35), rgba(30,27,75,0.05))",
          border: "1px solid rgba(99,102,241,0.5)",
          boxShadow: "0 0 32px rgba(99,102,241,0.45)",
          transitionDuration: phase === "in" ? "4000ms" : phase === "out" ? "6000ms" : "0ms",
        }}
        data-testid="night-breath-circle"
      />
      <p className="mt-4 text-sm font-bold tracking-[0.3em]" style={{ color: "#a5b4fc" }}>
        {label}
      </p>
      <p className="mt-1 text-[10px]" style={{ color: "rgba(165,180,252,0.6)" }}>
        Cycle {cycles + 1} · 4-4-6
      </p>
      <Button
        type="button"
        onClick={onDone}
        className="mt-5 px-6 h-10 text-xs font-bold"
        style={{ backgroundColor: "#8b5cf6", color: "#fff" }}
        data-testid="button-finish-breathing"
      >
        I feel settled
      </Button>
    </div>
  );
}

function Phase4Priming({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [picked, setPicked] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const [breathingActive, setBreathingActive] = useState(false);
  // Tiny REM rationale shown above the priming options.
  const remTip = "A calm nervous system enters REM faster. Pick what feels easiest tonight.";

  const handleAdvance = () => {
    if (picked === "reflection" && reflection.trim()) {
      try { localStorage.setItem(`ascend_night_reflection_${new Date().toISOString().slice(0,10)}`, reflection.trim()); } catch {}
    }
    if (picked === "breathing") {
      setBreathingActive(true);
      return;
    }
    onDone();
  };

  if (breathingActive) {
    return (
      <div className="flex flex-col items-center px-6 py-10 max-w-md mx-auto w-full">
        <p className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: "#a5b4fc" }}>
          Sleep Priming · Breathing
        </p>
        <h2 className="text-lg font-bold mb-2 text-center" style={{ color: colors.text }}>
          Breathe with the circle
        </h2>
        <NightBreathingMini onDone={onDone} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-6 py-10 max-w-md mx-auto w-full">
      <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: "#a5b4fc" }}>
        Phase 4 · Sleep Priming
      </p>
      <h2 className="text-xl font-bold mb-1 text-center" style={{ color: colors.text }}>
        Pick how to settle
      </h2>
      <p className="text-xs text-center mb-2 max-w-xs" style={{ color: colors.textMuted }}>
        Choose one. Each takes 1-3 minutes.
      </p>
      <p className="text-[10px] text-center mb-5 max-w-xs italic" style={{ color: "rgba(165,180,252,0.6)" }} data-testid="text-rem-tip">
        {remTip}
      </p>
      <div className="w-full grid grid-cols-1 gap-2 mb-4">
        {PRIMING_OPTIONS.map((o) => {
          const Icon = o.icon;
          const sel = picked === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setPicked(o.id)}
              data-testid={`priming-${o.id}`}
              className="rounded-xl p-3 flex items-center gap-3 transition-all text-left"
              style={{
                backgroundColor: sel ? `${o.color}1f` : colors.surface,
                border: `1px solid ${sel ? o.color : colors.surfaceBorder}`,
                boxShadow: sel ? `0 0 16px ${o.color}50` : "none",
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${o.color}25`, border: `1px solid ${o.color}55` }}
              >
                <Icon size={16} style={{ color: o.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: sel ? o.color : colors.text }}>{o.label}</p>
                <p className="text-[10px]" style={{ color: colors.textMuted }}>{o.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {picked === "reflection" && (
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="One line about today…"
          rows={3}
          className="w-full rounded-lg p-3 mb-4 text-sm bg-transparent outline-none resize-none"
          style={{
            border: `1px solid ${colors.surfaceBorder}`,
            color: colors.text,
            backgroundColor: `${colors.surface}80`,
          }}
          data-testid="textarea-reflection"
        />
      )}

      <StepActions onDone={handleAdvance} onSkip={onSkip} doneDisabled={!picked} />
    </div>
  );
}

/* ─────────────── Completion ─────────────── */
function NightCompletion({ onClose }: { onClose: () => void }) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <style>{`
        @keyframes restGlow {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.12); opacity: 1; }
        }
      `}</style>
      <div
        className="w-32 h-32 rounded-full flex items-center justify-center mb-6"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.4), rgba(30,27,75,0.2))",
          border: "2px solid #818cf8",
          boxShadow: "0 0 48px rgba(99,102,241,0.6), 0 0 96px rgba(99,102,241,0.3)",
          animation: "restGlow 4s ease-in-out infinite",
        }}
      >
        <Moon size={48} style={{ color: "#e0e7ff" }} />
      </div>
      <p className="text-[10px] uppercase tracking-[0.4em] mb-1" style={{ color: "#a5b4fc" }}>
        Night Flow Complete
      </p>
      <h1 className="text-3xl font-bold mb-3" style={{ color: colors.text, textShadow: "0 0 24px rgba(99,102,241,0.4)" }}>
        Rest well
      </h1>
      <p className="text-sm mb-8 max-w-xs" style={{ color: colors.textMuted }}>
        Your system is primed for recovery. Sleep deeply.
      </p>
      <Button
        type="button"
        onClick={onClose}
        className="px-8 h-11 text-sm font-bold"
        style={{ backgroundColor: "#8b5cf6", color: "#fff" }}
        data-testid="button-finish-night"
      >
        Goodnight <ChevronRight size={14} className="ml-1" />
      </Button>
    </div>
  );
}

/* ─────────────── Page shell ─────────────── */
export default function NightFlowPage() {
  const [, navigate] = useLocation();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [phase, setPhase] = useState<Phase>(1);
  const [skipFor, setSkipFor] = useState<string | null>(null);

  // Background dims as we progress.
  const bg = useMemo(() => {
    if (phase === 1) return "radial-gradient(ellipse at top, #1e1b4b 0%, #0a0a18 70%)";
    if (phase >= 5) return "radial-gradient(ellipse at top, #14102e 0%, #050510 70%)";
    return "radial-gradient(ellipse at top, #181437 0%, #07071a 70%)";
  }, [phase]);

  const close = () => navigate("/");

  const handleSkip = (label: string) => setSkipFor(label);

  // Resolve which phases run tonight from the active sleep mode.
  const plan = getNightPlan();
  const target = useMemo(() => resolveCycleTarget(plan), [plan.wakeTime?.hour, plan.wakeTime?.minute, plan.cycles]);
  const enabledPhaseCount =
    1 + // Phase 1 (intro) always runs
    (plan.foodCutoff ? 1 : 0) +
    (plan.lowStimulation ? 1 : 0) +
    (plan.sleepPriming ? 1 : 0);

  // Skip to the next ENABLED phase based on the plan.
  const nextEnabledPhase = (from: Phase): Phase => {
    let p = from + 1;
    // Phase 2 = food cutoff, 3 = low stim, 4 = priming.
    while (p <= 4) {
      if (p === 2 && !plan.foodCutoff) { p++; continue; }
      if (p === 3 && !plan.lowStimulation) { p++; continue; }
      if (p === 4 && !plan.sleepPriming) { p++; continue; }
      return p;
    }
    return 5; // jump to completion
  };

  const onSkipReason = (reason: SkipReason) => {
    if (skipFor) recordSkip(skipFor, reason);
    const wasPrimingSkip = skipFor === "priming";
    setSkipFor(null);
    if (wasPrimingSkip) {
      finalize();
      return;
    }
    // Honor the active plan: never route the user into a disabled phase.
    const next = nextEnabledPhase(phase);
    if (next >= 5) finalize();
    else setPhase(next);
  };

  // Snapshot tonight's target bedtime once so the morning debrief can compare.
  const snapshotted = useRef(false);
  useEffect(() => {
    if (snapshotted.current || !target) return;
    setTargetBedTime(target.bedtime.getTime());
    snapshotted.current = true;
  }, [target]);

  // Minimal mode (or custom-with-everything-off): no full flow exists.
  // Bounce the user back to settings instead of stranding them on an empty intro.
  useEffect(() => {
    if (!plan.showFullFlow) {
      navigate("/sleep-settings");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.showFullFlow]);

  const onAdvanceFromPhase = () => {
    const next = nextEnabledPhase(phase);
    if (next >= 5) {
      finalize();
    } else {
      setPhase(next);
    }
  };

  const finalize = () => {
    markNightCompleted();
    setPhase(5 as Phase);
  };

  const goToCompletion = () => {
    finalize();
  };

  return (
    <div
      className="min-h-screen w-full transition-all duration-1000"
      style={{ background: bg, color: colors.text }}
      data-testid="night-flow-page"
    >
      {phase > 1 && phase < 5 && (
        <div className="fixed top-0 inset-x-0 z-30 px-4 pt-3 pb-2" style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="max-w-md mx-auto flex items-center gap-3">
            <button
              type="button"
              onClick={close}
              className="p-1.5 rounded-lg"
              style={{ color: colors.textMuted }}
              data-testid="button-close-night"
            >
              <X size={16} />
            </button>
            <div className="flex-1">
              <PhaseProgress phase={phase} total={enabledPhaseCount} />
            </div>
            <span className="text-[10px] font-mono w-10 text-right" style={{ color: colors.textMuted }}>
              {phase}/4
            </span>
          </div>
        </div>
      )}

      <div className={phase > 1 && phase < 5 ? "pt-12" : ""}>
        {phase === 1 && (
          <>
            <Phase1Init onContinue={onAdvanceFromPhase} plan={plan} target={target} />
            {plan.remPromptsEnabled && (
              <div className="px-6 -mt-4 pb-6 flex justify-center">
                <RemPromptRow />
              </div>
            )}
          </>
        )}
        {phase === 2 && <Phase2FoodCutoff onDone={onAdvanceFromPhase} onSkip={() => handleSkip("food_cutoff")} />}
        {phase === 3 && <Phase3LowStim onDone={onAdvanceFromPhase} onSkip={() => handleSkip("low_stim")} />}
        {phase === 4 && <Phase4Priming onDone={goToCompletion} onSkip={() => handleSkip("priming")} />}
        {phase === 5 && <NightCompletion onClose={close} />}
      </div>

      <SkipDialog open={!!skipFor} onClose={() => setSkipFor(null)} onChoose={onSkipReason} />
    </div>
  );
}
