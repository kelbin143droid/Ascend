import React, { useReducer, useEffect, useState, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface AppState {
  currentDay: number;
  completedDays: number[];
  justCompletedDayId: number | null;
  xp: number;
  streak: number;
}

type AppAction =
  | { type: "COMPLETE_DAY"; day: number }
  | { type: "GO_TO_NEXT_DAY" }
  | { type: "RESET" };

// ─────────────────────────────────────────────────────────────────────────────
// REDUCER — all state changes are explicit
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL: AppState = {
  currentDay: 1,
  completedDays: [],
  justCompletedDayId: null,
  xp: 0,
  streak: 0,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "COMPLETE_DAY": {
      const { day } = action;
      const already = state.completedDays.includes(day);
      return {
        ...state,
        completedDays: already ? state.completedDays : [...state.completedDays, day],
        justCompletedDayId: day,
        xp: already ? state.xp : state.xp + 5,
        streak: already ? state.streak : state.streak + 1,
      };
    }
    case "GO_TO_NEXT_DAY":
      return { ...state, currentDay: state.currentDay + 1, justCompletedDayId: null };
    case "RESET":
      return INITIAL;
    default:
      return state;
  }
}

function isDayUnlocked(day: number, state: AppState) {
  return day === 1 || state.completedDays.includes(day - 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// DAY DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

type SessionType = "breathing" | "movement" | "hydration" | "cardio" | "planning";

interface DayDef {
  id: number;
  title: string;
  subtitle: string;
  duration: string;
  icon: string;
  type: SessionType;
}

const DAYS: DayDef[] = [
  { id: 1, title: "Breathing",             subtitle: "Calm your nervous system",  duration: "75 sec",   icon: "🌬️", type: "breathing"  },
  { id: 2, title: "Light Movement",        subtitle: "Wake up your body",          duration: "75 sec",   icon: "🌀", type: "movement"   },
  { id: 3, title: "Hydration & Check-in", subtitle: "Nourish and reflect",        duration: "2 steps",  icon: "💧", type: "hydration"  },
  { id: 4, title: "Focus & Cardio",        subtitle: "Build your momentum",        duration: "90 sec",   icon: "⚡", type: "cardio"     },
  { id: 5, title: "Planning & Reflection", subtitle: "Prepare for tomorrow",       duration: "2 steps",  icon: "📋", type: "planning"   },
];

// ─────────────────────────────────────────────────────────────────────────────
// DAILY FLOW DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

interface FlowTask { label: string; duration: number; feedback?: string; }
interface FlowActivity { id: string; name: string; icon: string; color: string; tasks: FlowTask[]; }

const FLOW_ACTIVITIES: FlowActivity[] = [
  {
    id: "reset", name: "Reset", icon: "🌬️", color: "#818cf8",
    tasks: [
      { label: "Inhale slowly — 4 seconds", duration: 4,  feedback: "Good" },
      { label: "Hold — 2 seconds",           duration: 2,  feedback: "Hold..." },
      { label: "Exhale fully — 6 seconds",   duration: 6,  feedback: "Release" },
      { label: "Inhale slowly — 4 seconds",  duration: 4,  feedback: "Good" },
      { label: "Hold — 2 seconds",           duration: 2,  feedback: "Hold..." },
      { label: "Exhale fully — 6 seconds",   duration: 6 },
    ],
  },
  {
    id: "strength", name: "Strength", icon: "💪", color: "#f87171",
    tasks: [
      { label: "Push-ups — go!",         duration: 20, feedback: "Strong set!" },
      { label: "Rest",                   duration: 10, feedback: "Keep going" },
      { label: "Crunches — go!",         duration: 20, feedback: "Core activated!" },
      { label: "Rest",                   duration: 10, feedback: "Almost done" },
      { label: "Plank hold — stay strong", duration: 20 },
    ],
  },
  {
    id: "mobility", name: "Mobility", icon: "🌀", color: "#34d399",
    tasks: [
      { label: "Neck rolls — slow and easy",      duration: 15, feedback: "Nice" },
      { label: "Shoulder rolls — backward",        duration: 15, feedback: "Keep going" },
      { label: "Arm circles — large arcs",         duration: 15, feedback: "Good flow" },
      { label: "Hip circles — both directions",    duration: 15, feedback: "Great" },
      { label: "Forward fold — breathe into it",   duration: 15 },
    ],
  },
  {
    id: "vitality", name: "Vitality", icon: "💧", color: "#60a5fa",
    tasks: [
      { label: "Drink a full glass of water",                     duration: 15, feedback: "Hydrated!" },
      { label: "Three deep belly breaths",                        duration: 12, feedback: "Good" },
      { label: "Shake out hands, roll your shoulders",            duration: 10 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const S = {
  bg:        "#0a0a0f",
  surface:   "#13131f",
  border:    "rgba(255,255,255,0.07)",
  textPrimary: "#e8e8f0",
  textMuted:   "rgba(255,255,255,0.4)",
  accent:    "#818cf8",
  success:   "#34d399",
} as const;

const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: S.surface,
  borderRadius: 16,
  border: `1px solid ${S.border}`,
  padding: "20px",
  ...extra,
});

const btn = (color: string = S.accent, extra?: React.CSSProperties): React.CSSProperties => ({
  display: "block",
  width: "100%",
  padding: "16px",
  borderRadius: 12,
  border: "none",
  background: color,
  color: "#fff",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  textAlign: "center",
  ...extra,
});

// ─────────────────────────────────────────────────────────────────────────────
// XP BAR
// ─────────────────────────────────────────────────────────────────────────────

function XPBar({ xp, streak }: { xp: number; streak: number }) {
  const pct = Math.min((xp / 100) * 100, 100);
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
        <span style={{ color: S.textMuted }}>XP: <span style={{ color: S.accent, fontWeight: 600 }}>{xp}</span> / 100</span>
        {streak > 0 && (
          <span style={{ color: S.textMuted }}>
            🔥 <span style={{ color: "#fb923c", fontWeight: 600 }}>{streak}</span> day streak
          </span>
        )}
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
        <div
          style={{
            height: "100%",
            borderRadius: 99,
            background: `linear-gradient(90deg, ${S.accent}, #a78bfa)`,
            width: `${pct}%`,
            transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNTDOWN SCREEN (3-second)
// ─────────────────────────────────────────────────────────────────────────────

function CountdownScreen({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3);
  const doneRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setN(prev => {
        if (prev <= 1) {
          clearInterval(id);
          if (!doneRef.current) { doneRef.current = true; onDone(); }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <p style={{ color: S.textMuted, fontSize: 14, marginBottom: 24 }}>Get comfortable. Starting in...</p>
      <div
        key={n}
        style={{
          fontSize: 80,
          fontWeight: 200,
          color: S.accent,
          animation: "flowFadeIn 0.3s ease",
        }}
      >
        {n === 0 ? "Go" : n}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMED STEP — generic step with countdown
// ─────────────────────────────────────────────────────────────────────────────

function TimedStep({
  label, duration, stepIndex, totalSteps, accentColor, onDone,
}: {
  label: string; duration: number; stepIndex: number; totalSteps: number;
  accentColor: string; onDone: () => void;
}) {
  const [remaining, setRemaining] = useState(duration);
  const doneRef = useRef(false);

  useEffect(() => {
    setRemaining(duration);
    doneRef.current = false;
    const id = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(id);
          if (!doneRef.current) { doneRef.current = true; onDone(); }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [label, duration, onDone]);

  const pct = ((duration - remaining) / duration) * 100;

  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <p style={{ color: S.textMuted, fontSize: 13, marginBottom: 16 }}>
        Step {stepIndex + 1} of {totalSteps}
      </p>
      <p style={{ fontSize: 20, fontWeight: 600, color: S.textPrimary, marginBottom: 32, lineHeight: 1.4 }}>
        {label}
      </p>
      <div
        style={{
          width: 100, height: 100, borderRadius: "50%", margin: "0 auto 24px",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `conic-gradient(${accentColor} ${pct}%, rgba(255,255,255,0.06) ${pct}%)`,
          fontSize: 28, fontWeight: 300, color: accentColor,
        }}
      >
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: S.surface, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 200,
        }}>
          {remaining}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MICRO FEEDBACK — shown between steps
// ─────────────────────────────────────────────────────────────────────────────

function MicroFeedback({ message, onContinue }: { message: string; onContinue: () => void }) {
  useEffect(() => {
    const id = setTimeout(onContinue, 1000);
    return () => clearTimeout(id);
  }, [onContinue]);

  return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
      <p style={{ fontSize: 22, fontWeight: 600, color: S.success }}>{message}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION CONTENT — per day type
// ─────────────────────────────────────────────────────────────────────────────

// Day 1 — Breathing

function BreathingSession({ onComplete }: { onComplete: () => void }) {
  const PHASES: Array<{ name: string; duration: number }> = [
    { name: "Inhale", duration: 4000 },
    { name: "Hold",   duration: 2000 },
    { name: "Exhale", duration: 6000 },
  ];
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(75);
  const doneRef = useRef(false);

  useEffect(() => {
    const totalId = setInterval(() => {
      setTotalRemaining(prev => {
        if (prev <= 1) {
          clearInterval(totalId);
          if (!doneRef.current) { doneRef.current = true; onComplete(); }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(totalId);
  }, [onComplete]);

  useEffect(() => {
    if (doneRef.current) return;
    const phase = PHASES[phaseIdx];
    const id = setTimeout(() => {
      setPhaseIdx(i => (i + 1) % PHASES.length);
    }, phase.duration);
    return () => clearTimeout(id);
  }, [phaseIdx]);

  const phase = PHASES[phaseIdx];
  const scale = phase.name === "Inhale" ? 1 : phase.name === "Hold" ? 1 : 0.5;
  const dur   = phase.name === "Inhale" ? "4s" : phase.name === "Hold" ? "0.2s" : "6s";

  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div
        style={{
          width: 140, height: 140, borderRadius: "50%", margin: "0 auto 32px",
          transform: `scale(${scale})`,
          transition: `transform ${dur} ease-in-out`,
          background: `radial-gradient(circle, ${S.accent}30 0%, ${S.accent}08 70%, transparent 100%)`,
          border: `2px solid ${S.accent}40`,
          boxShadow: phase.name === "Hold" ? `0 0 48px ${S.accent}30` : `0 0 20px ${S.accent}15`,
        }}
      />
      <p style={{ fontSize: 22, fontWeight: 600, color: S.accent, marginBottom: 6 }}>{phase.name}</p>
      <p style={{ fontSize: 13, color: S.textMuted }}>
        {totalRemaining}s remaining
      </p>
    </div>
  );
}

// Day 2 — Light Movement / Day 4 — Cardio (step-based timer sessions)

const MOVEMENT_STEPS: FlowTask[] = [
  { label: "Neck rolls — slow and easy",         duration: 15, feedback: "Good" },
  { label: "Shoulder rolls — backward",           duration: 15, feedback: "Keep going" },
  { label: "Arm circles — big sweeping arcs",     duration: 15, feedback: "Nice!" },
  { label: "Hip circles — both directions",       duration: 15, feedback: "Good flow" },
  { label: "Forward fold — breathe into it",      duration: 15 },
];

const CARDIO_STEPS: FlowTask[] = [
  { label: "Jog on the spot — fast!",    duration: 30, feedback: "Great work!" },
  { label: "Rest and breathe",           duration: 10, feedback: "Keep going" },
  { label: "Push-ups — go!",            duration: 20, feedback: "Strong!" },
  { label: "Rest and breathe",           duration: 10, feedback: "Last one!" },
  { label: "Jumping jacks — let's go!", duration: 20 },
];

function StepSession({ steps, onComplete }: { steps: FlowTask[]; onComplete: () => void }) {
  type Phase = "step" | "feedback";
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("step");

  const advance = useCallback(() => {
    const current = steps[idx];
    if (current.feedback) {
      setPhase("feedback");
    } else {
      if (idx + 1 >= steps.length) onComplete();
      else { setIdx(i => i + 1); setPhase("step"); }
    }
  }, [idx, steps, onComplete]);

  const afterFeedback = useCallback(() => {
    if (idx + 1 >= steps.length) onComplete();
    else { setIdx(i => i + 1); setPhase("step"); }
  }, [idx, steps.length, onComplete]);

  if (phase === "feedback") {
    return <MicroFeedback message={steps[idx].feedback!} onContinue={afterFeedback} />;
  }
  return (
    <TimedStep
      key={`${idx}-${steps[idx].label}`}
      label={steps[idx].label}
      duration={steps[idx].duration}
      stepIndex={idx}
      totalSteps={steps.length}
      accentColor={S.accent}
      onDone={advance}
    />
  );
}

// Day 3 — Hydration + Reflection

function HydrationSession({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<0 | 1>(0);
  const [text, setText] = useState("");

  if (step === 0) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>💧</div>
        <p style={{ fontSize: 20, fontWeight: 600, color: S.textPrimary, marginBottom: 12 }}>
          Step 1 of 2
        </p>
        <p style={{ fontSize: 16, color: S.textMuted, marginBottom: 36, lineHeight: 1.6 }}>
          Drink a full glass of water right now.<br />Take your time.
        </p>
        <button data-testid="btn-hydration-done" style={btn()} onClick={() => setStep(1)}>
          Done — I drank water
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 0" }}>
      <p style={{ fontSize: 20, fontWeight: 600, color: S.textPrimary, marginBottom: 8 }}>
        Step 2 of 2
      </p>
      <p style={{ fontSize: 15, color: S.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
        Write one thing you are grateful for today.
      </p>
      <textarea
        data-testid="input-gratitude"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="I'm grateful for..."
        style={{
          width: "100%", minHeight: 100, padding: 14, borderRadius: 12,
          background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`,
          color: S.textPrimary, fontSize: 15, resize: "none", marginBottom: 20,
          outline: "none", boxSizing: "border-box",
        }}
      />
      <button
        data-testid="btn-reflection-done"
        style={btn(text.trim() ? S.accent : "rgba(255,255,255,0.15)")}
        onClick={() => { if (text.trim()) onComplete(); }}
        disabled={!text.trim()}
      >
        Complete
      </button>
    </div>
  );
}

// Day 5 — Planning + Reflection

const ENERGY_OPTIONS = ["Energised", "Neutral", "Drained"] as const;

function PlanningSession({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<0 | 1>(0);
  const [priority, setPriority] = useState("");
  const [energy, setEnergy] = useState<string | null>(null);

  if (step === 0) {
    return (
      <div style={{ padding: "40px 0" }}>
        <p style={{ fontSize: 20, fontWeight: 600, color: S.textPrimary, marginBottom: 8 }}>
          Step 1 of 2
        </p>
        <p style={{ fontSize: 15, color: S.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
          What is your #1 priority for tomorrow?
        </p>
        <textarea
          data-testid="input-priority"
          value={priority}
          onChange={e => setPriority(e.target.value)}
          placeholder="Tomorrow I will focus on..."
          style={{
            width: "100%", minHeight: 90, padding: 14, borderRadius: 12,
            background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`,
            color: S.textPrimary, fontSize: 15, resize: "none", marginBottom: 20,
            outline: "none", boxSizing: "border-box",
          }}
        />
        <button
          data-testid="btn-priority-next"
          style={btn(priority.trim() ? S.accent : "rgba(255,255,255,0.15)")}
          onClick={() => { if (priority.trim()) setStep(1); }}
          disabled={!priority.trim()}
        >
          Next
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 0", textAlign: "center" }}>
      <p style={{ fontSize: 20, fontWeight: 600, color: S.textPrimary, marginBottom: 8 }}>
        Step 2 of 2
      </p>
      <p style={{ fontSize: 15, color: S.textMuted, marginBottom: 28, lineHeight: 1.6 }}>
        How are you feeling about today?
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {ENERGY_OPTIONS.map(opt => (
          <button
            key={opt}
            data-testid={`btn-energy-${opt.toLowerCase()}`}
            onClick={() => setEnergy(opt)}
            style={{
              padding: "14px 20px", borderRadius: 12, border: `1px solid`,
              borderColor: energy === opt ? S.accent : S.border,
              background: energy === opt ? `${S.accent}18` : "transparent",
              color: energy === opt ? S.accent : S.textMuted,
              fontSize: 16, fontWeight: energy === opt ? 600 : 400, cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {opt}
          </button>
        ))}
      </div>
      <button
        data-testid="btn-planning-complete"
        style={btn(energy ? S.accent : "rgba(255,255,255,0.15)")}
        onClick={() => { if (energy) onComplete(); }}
        disabled={!energy}
      >
        Complete Week 1
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION RUNNER — countdown → content
// ─────────────────────────────────────────────────────────────────────────────

function SessionRunner({ day, onComplete }: { day: DayDef; onComplete: () => void }) {
  const [phase, setPhase] = useState<"countdown" | "running">("countdown");
  const toRunning = useCallback(() => setPhase("running"), []);

  const content = (() => {
    switch (day.type) {
      case "breathing": return <BreathingSession onComplete={onComplete} />;
      case "movement":  return <StepSession steps={MOVEMENT_STEPS} onComplete={onComplete} />;
      case "hydration": return <HydrationSession onComplete={onComplete} />;
      case "cardio":    return <StepSession steps={CARDIO_STEPS} onComplete={onComplete} />;
      case "planning":  return <PlanningSession onComplete={onComplete} />;
    }
  })();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 24 }}>{day.icon}</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: S.textPrimary }}>{day.title}</span>
      </div>
      {phase === "countdown" ? <CountdownScreen onDone={toRunning} /> : content}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETION SCREEN
// ─────────────────────────────────────────────────────────────────────────────

function CompletionScreen({
  day, xpEarned, isLastDay, onContinue,
}: {
  day: DayDef; xpEarned: number; isLastDay: boolean; onContinue: () => void;
}) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✨</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: S.textPrimary, marginBottom: 8 }}>
        Session Complete
      </h2>
      <p style={{ fontSize: 15, color: S.textMuted, marginBottom: 6 }}>{day.title}</p>
      <div
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px",
          background: `${S.accent}18`, borderRadius: 99, border: `1px solid ${S.accent}30`,
          fontSize: 14, fontWeight: 600, color: S.accent, marginBottom: 36,
        }}
      >
        +{xpEarned} XP
      </div>

      {isLastDay ? (
        <>
          <p style={{ fontSize: 16, color: S.textMuted, marginBottom: 32, lineHeight: 1.7 }}>
            You completed your 5-day foundation.<br />
            Your daily flow is now unlocked.
          </p>
          <button data-testid="btn-complete-onboarding" style={btn(S.success)} onClick={onContinue}>
            Begin Daily Flow →
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: 15, color: S.textMuted, marginBottom: 32 }}>
            Come back tomorrow to continue.
          </p>
          <button data-testid="btn-continue-day" style={btn()} onClick={onContinue}>
            Continue to Day {day.id + 1}
          </button>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING SECTION
// ─────────────────────────────────────────────────────────────────────────────

function OnboardingSection({
  state, dispatch,
}: {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}) {
  const [isRunning, setIsRunning] = useState(false);
  const activeDay = DAYS.find(d => d.id === state.currentDay)!;

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    dispatch({ type: "COMPLETE_DAY", day: state.currentDay });
  }, [state.currentDay, dispatch]);

  const handleContinue = useCallback(() => {
    dispatch({ type: "GO_TO_NEXT_DAY" });
    setIsRunning(false);
  }, [dispatch]);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: S.textPrimary, marginBottom: 4 }}>
          Foundation
        </h1>
        <p style={{ fontSize: 14, color: S.textMuted }}>5-day starter protocol</p>
      </div>

      {/* ── Active Day Panel ─────────────────────────────────────────────── */}
      <div style={card({ marginBottom: 24 })}>
        {state.justCompletedDayId === state.currentDay ? (
          // COMPLETION SCREEN
          <CompletionScreen
            day={activeDay}
            xpEarned={5}
            isLastDay={state.currentDay === 5}
            onContinue={handleContinue}
          />
        ) : state.completedDays.includes(state.currentDay) ? (
          // COMPLETED STATE (already done, day hasn't advanced — shouldn't normally show)
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: S.success }}>Day {state.currentDay} done</p>
            <button data-testid="btn-continue-completed" style={{ ...btn(), marginTop: 24 }} onClick={handleContinue}>
              Next Day →
            </button>
          </div>
        ) : isRunning ? (
          // SESSION RUNNER
          <SessionRunner day={activeDay} onComplete={handleComplete} />
        ) : (
          // START SCREEN
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `${S.accent}15`, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 26,
                }}
              >
                {activeDay.icon}
              </div>
              <div>
                <p style={{ fontSize: 11, color: S.textMuted, marginBottom: 2 }}>Day {activeDay.id} of 5</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: S.textPrimary }}>{activeDay.title}</p>
              </div>
            </div>
            <p style={{ fontSize: 14, color: S.textMuted, marginBottom: 6 }}>{activeDay.subtitle}</p>
            <p style={{ fontSize: 12, color: `${S.accent}80`, marginBottom: 24 }}>
              ⏱ {activeDay.duration}
            </p>
            <button
              data-testid="btn-start-session"
              style={btn()}
              onClick={() => setIsRunning(true)}
            >
              Start Session
            </button>
          </div>
        )}
      </div>

      {/* ── Day Progress Track ────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {DAYS.map(day => {
          const done    = state.completedDays.includes(day.id);
          const active  = day.id === state.currentDay;
          const locked  = !isDayUnlocked(day.id, state);
          return (
            <div
              key={day.id}
              style={{
                flex: 1, height: 6, borderRadius: 99,
                background: done
                  ? S.success
                  : active
                  ? S.accent
                  : "rgba(255,255,255,0.08)",
                transition: "background 0.5s",
              }}
            />
          );
        })}
      </div>

      {/* ── Upcoming Days ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {DAYS.filter(d => d.id !== state.currentDay).map(day => {
          const done   = state.completedDays.includes(day.id);
          const locked = !isDayUnlocked(day.id, state);
          return (
            <div
              key={day.id}
              style={{
                ...card({ padding: "14px 16px" }),
                display: "flex", alignItems: "center", gap: 12,
                opacity: locked ? 0.4 : 1,
              }}
            >
              <span style={{ fontSize: 20 }}>{done ? "✅" : locked ? "🔒" : day.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: done ? 400 : 600, color: done ? S.textMuted : S.textPrimary }}>
                  Day {day.id}: {day.title}
                </p>
                <p style={{ fontSize: 12, color: S.textMuted }}>{day.subtitle}</p>
              </div>
              {done && (
                <span style={{ fontSize: 11, color: S.success, fontWeight: 600 }}>+5 XP</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY FLOW SECTION
// ─────────────────────────────────────────────────────────────────────────────

function FlowRunner({
  activity, onDone,
}: {
  activity: FlowActivity; onDone: () => void;
}) {
  type RunPhase = "countdown" | "step" | "feedback" | "done";
  const [runPhase, setRunPhase] = useState<RunPhase>("countdown");
  const [taskIdx, setTaskIdx]   = useState(0);

  const advanceStep = useCallback(() => {
    const task = activity.tasks[taskIdx];
    if (task.feedback) {
      setRunPhase("feedback");
    } else {
      if (taskIdx + 1 >= activity.tasks.length) {
        setRunPhase("done");
      } else {
        setTaskIdx(i => i + 1);
        setRunPhase("step");
      }
    }
  }, [taskIdx, activity.tasks]);

  const afterFeedback = useCallback(() => {
    if (taskIdx + 1 >= activity.tasks.length) {
      setRunPhase("done");
    } else {
      setTaskIdx(i => i + 1);
      setRunPhase("step");
    }
  }, [taskIdx, activity.tasks.length]);

  if (runPhase === "countdown") {
    return <CountdownScreen onDone={() => setRunPhase("step")} />;
  }

  if (runPhase === "feedback") {
    return <MicroFeedback message={activity.tasks[taskIdx].feedback!} onContinue={afterFeedback} />;
  }

  if (runPhase === "done") {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{activity.icon}</div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: S.textPrimary, marginBottom: 8 }}>
          {activity.name} Complete
        </h3>
        <p style={{ color: S.textMuted, marginBottom: 32 }}>Great work — keep the momentum going.</p>
        <button data-testid="btn-flow-done" style={btn(activity.color)} onClick={onDone}>
          Done
        </button>
      </div>
    );
  }

  const task = activity.tasks[taskIdx];
  return (
    <div>
      <p style={{ fontSize: 13, color: activity.color, marginBottom: 20, fontWeight: 600 }}>
        {activity.icon} {activity.name}
      </p>
      <TimedStep
        key={`${taskIdx}-${task.label}`}
        label={task.label}
        duration={task.duration}
        stepIndex={taskIdx}
        totalSteps={activity.tasks.length}
        accentColor={activity.color}
        onDone={advanceStep}
      />
    </div>
  );
}

function DailyFlowSection({ dispatch }: { dispatch: React.Dispatch<AppAction> }) {
  const [running, setRunning] = useState<FlowActivity | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [showFlowDone, setShowFlowDone] = useState(false);

  const allDone = FLOW_ACTIVITIES.every(a => completed.has(a.id));

  if (showFlowDone) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🌟</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: S.textPrimary, marginBottom: 12 }}>
          Daily Flow Complete
        </h2>
        <p style={{ fontSize: 15, color: S.textMuted, marginBottom: 36, lineHeight: 1.7 }}>
          You did it. Every system activated.<br />Come back tomorrow to keep your rhythm.
        </p>
        <div
          style={{
            background: `${S.success}12`, border: `1px solid ${S.success}30`,
            borderRadius: 16, padding: "20px", marginBottom: 36,
          }}
        >
          <p style={{ fontSize: 13, color: S.textMuted, marginBottom: 4 }}>Today's completion</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: S.success }}>4 / 4 activities</p>
        </div>
        <button
          style={{ ...btn("rgba(255,255,255,0.08)"), color: S.textMuted, fontSize: 14 }}
          onClick={() => { setCompleted(new Set()); setShowFlowDone(false); }}
        >
          Reset for testing
        </button>
      </div>
    );
  }

  if (running) {
    return (
      <div>
        <button
          data-testid="btn-back-flow"
          onClick={() => setRunning(null)}
          style={{ background: "none", border: "none", color: S.textMuted, fontSize: 13, cursor: "pointer", marginBottom: 16, padding: 0 }}
        >
          ← Back
        </button>
        <div style={card()}>
          <FlowRunner
            activity={running}
            onDone={() => {
              const next = new Set(completed);
              next.add(running.id);
              setCompleted(next);
              setRunning(null);
              if (FLOW_ACTIVITIES.every(a => next.has(a.id))) {
                setShowFlowDone(true);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: S.textPrimary, marginBottom: 4 }}>
          Daily Flow
        </h1>
        <p style={{ fontSize: 14, color: S.textMuted }}>
          {completed.size} of 4 activities complete
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, marginBottom: 28 }}>
        <div
          style={{
            height: "100%", borderRadius: 99,
            background: `linear-gradient(90deg, ${S.accent}, ${S.success})`,
            width: `${(completed.size / 4) * 100}%`,
            transition: "width 0.6s ease",
          }}
        />
      </div>

      {/* Activity cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {FLOW_ACTIVITIES.map((activity, i) => {
          const done = completed.has(activity.id);
          const unlocked = i === 0 || completed.has(FLOW_ACTIVITIES[i - 1].id);
          return (
            <div
              key={activity.id}
              data-testid={`card-activity-${activity.id}`}
              style={{
                ...card({ padding: "16px 20px", opacity: unlocked ? 1 : 0.45 }),
                display: "flex", alignItems: "center", gap: 14,
              }}
            >
              <div
                style={{
                  width: 48, height: 48, borderRadius: 12, fontSize: 22,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: done ? `${S.success}15` : `${activity.color}15`,
                }}
              >
                {done ? "✅" : activity.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: done ? S.textMuted : S.textPrimary }}>
                  {activity.name}
                </p>
                <p style={{ fontSize: 12, color: S.textMuted }}>
                  {activity.tasks.length} steps · {activity.tasks.reduce((s, t) => s + t.duration, 0)}s
                </p>
              </div>
              {unlocked && !done && (
                <button
                  data-testid={`btn-start-${activity.id}`}
                  onClick={() => setRunning(activity)}
                  style={{
                    padding: "8px 18px", borderRadius: 10, border: "none",
                    background: activity.color, color: "#fff",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Start
                </button>
              )}
              {done && (
                <span style={{ fontSize: 12, color: S.success, fontWeight: 600 }}>Done</span>
              )}
            </div>
          );
        })}
      </div>

      {allDone && (
        <button
          data-testid="btn-finish-flow"
          style={{ ...btn(S.success), marginTop: 24 }}
          onClick={() => setShowFlowDone(true)}
        >
          Finish Today's Flow
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────

export default function FlowApp() {
  const [state, dispatch] = useReducer(reducer, INITIAL, init => {
    try {
      const saved = localStorage.getItem("flow_app_state");
      if (saved) return JSON.parse(saved) as AppState;
    } catch {}
    return init;
  });

  useEffect(() => {
    localStorage.setItem("flow_app_state", JSON.stringify(state));
  }, [state]);

  const isOnboardingDone = state.completedDays.includes(5);

  return (
    <>
      <style>{`
        @keyframes flowFadeIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea:focus, button:focus { outline: none; }
      `}</style>
      <div
        style={{
          minHeight: "100vh",
          background: S.bg,
          color: S.textPrimary,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 440, margin: "0 auto", padding: "24px 16px 80px" }}>
          <XPBar xp={state.xp} streak={state.streak} />

          {isOnboardingDone ? (
            <DailyFlowSection dispatch={dispatch} />
          ) : (
            <OnboardingSection state={state} dispatch={dispatch} />
          )}

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <button
              data-testid="btn-dev-reset"
              onClick={() => {
                dispatch({ type: "RESET" });
                localStorage.removeItem("flow_app_state");
              }}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.1)", fontSize: 11, cursor: "pointer" }}
            >
              reset progress
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
