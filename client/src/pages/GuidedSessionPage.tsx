import { useState, useEffect, useCallback, useRef, type ChangeEvent } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageStageContext";
import { apiRequest } from "@/lib/queryClient";
import { DayCloseOverlay } from "@/components/game/DayCloseOverlay";
import { Day5ExpansionOverlay } from "@/components/game/Day5ExpansionOverlay";
import { Wind, Heart, Droplets, Brain, X } from "lucide-react";
import { LightMovementEngine } from "@/components/game/LightMovementEngine";
import { CardioSessionEngine } from "@/components/game/CardioSessionEngine";

type SessionId = "calm-breathing" | "light-movement" | "hydration-check" | "quick-reflection" | "focus-block" | "plan-tomorrow";

interface SessionConfig {
  id: SessionId;
  title: string;
  stat: string;
  durationSeconds: number;
  icon: typeof Wind;
  type: "breathing" | "prompts" | "instant" | "timer";
}

const SESSIONS: Record<SessionId, SessionConfig> = {
  "calm-breathing": {
    id: "calm-breathing",
    title: "2-Minute Reset",
    stat: "sense",
    durationSeconds: 140,
    icon: Wind,
    type: "breathing",
  },
  "light-movement": {
    id: "light-movement",
    title: "Light Movement",
    stat: "agility",
    durationSeconds: 150,
    icon: Heart,
    type: "prompts",
  },
  "hydration-check": {
    id: "hydration-check",
    title: "Hydration Check",
    stat: "vitality",
    durationSeconds: 0,
    icon: Droplets,
    type: "instant",
  },
  "quick-reflection": {
    id: "quick-reflection",
    title: "Quick Reflection",
    stat: "sense",
    durationSeconds: 60,
    icon: Brain,
    type: "timer",
  },
  "focus-block": {
    id: "focus-block",
    title: "Focus Block",
    stat: "sense",
    durationSeconds: 180,
    icon: Brain,
    type: "timer",
  },
  "plan-tomorrow": {
    id: "plan-tomorrow",
    title: "Plan Tomorrow",
    stat: "vitality",
    durationSeconds: 0,
    icon: Brain,
    type: "instant",
  },
};

const INHALE_URL = "/audio/inhale.mp3";
const HOLD_URL = "/audio/hold.mp3";
const EXHALE_URL = "/audio/exhale.mp3";

const BREATHING_PHASES = [
  { label: "Inhale", duration: 4000 },
  { label: "Hold", duration: 4000 },
  { label: "Exhale", duration: 6000 },
];

const CYCLE_MS = BREATHING_PHASES.reduce((s, p) => s + p.duration, 0); // 14000ms

const MOVEMENT_PROMPTS = [
  { text: "Roll your shoulders slowly, forward and back.", at: 0 },
  { text: "Stretch your arms above your head. Hold.", at: 30 },
  { text: "Gently twist your torso left, then right.", at: 60 },
  { text: "Touch your toes or reach as far as you can.", at: 90 },
  { text: "Shake out your hands and arms. Release tension.", at: 120 },
];

const STAT_COLORS: Record<string, string> = {
  strength: "#ef4444",
  agility: "#22c55e",
  sense: "#3b82f6",
  vitality: "#f59e0b",
};

function createPadOscillator(
  ctx: AudioContext,
  freq: number,
  detuneCents: number,
  gainValue: number,
  destination: AudioNode
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
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const lfoRef = useRef<OscillatorNode | null>(null);
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
      oscs.push(createPadOscillator(ctx, 130.81, 4, 0.35, lpFilter));
      oscs.push(createPadOscillator(ctx, 196.00, -3, 0.2, lpFilter));
      oscs.push(createPadOscillator(ctx, 196.00, 3, 0.2, lpFilter));
      oscs.push(createPadOscillator(ctx, 261.63, -5, 0.12, lpFilter));
      oscs.push(createPadOscillator(ctx, 261.63, 5, 0.12, lpFilter));
      oscs.push(createPadOscillator(ctx, 329.63, 0, 0.06, lpFilter));
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

// ─── Voice clip phase durations & order ──────────────────────────────────────
const VOICE_DURATIONS: Record<"Inhale" | "Hold" | "Exhale", number> = {
  Inhale: 4000,
  Hold:   4000,
  Exhale: 6000,
};
const VOICE_NEXT: Record<"Inhale" | "Hold" | "Exhale", "Inhale" | "Hold" | "Exhale"> = {
  Inhale: "Hold",
  Hold:   "Exhale",
  Exhale: "Inhale",
};

// ─── Calm background music (pentatonic, Web Audio) ───────────────────────────
const CALM_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C D E G A C (pentatonic)

function useCalmMusic(active: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) return;

    let closed = false;

    const playNote = (ctx: AudioContext, dest: GainNode) => {
      if (closed) return;
      const freq = CALM_NOTES[Math.floor(Math.random() * CALM_NOTES.length)];
      // Occasionally play the note an octave up for shimmer
      const f = Math.random() > 0.7 ? freq * 2 : freq;

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, ctx.currentTime);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 1.2);
      g.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 3.5);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 5.5);

      osc.connect(g);
      g.connect(dest);
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

      // Start first note after 4s (let ambient pad settle first)
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


function BreathingSession({
  accentColor,
  targetSeconds,
  onDone,
}: {
  accentColor: string;
  targetSeconds: number;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"Inhale" | "Hold" | "Exhale">("Inhale");
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useBreathingAudio(true);
  useCalmMusic(true);

  useEffect(() => {
    let alive = true;
    const sessionStart = performance.now();

    // ── Voice via Web Speech API — no audio file unlock needed ───────────────
    const speakPhase = (p: "Inhale" | "Hold" | "Exhale") => {
      try {
        if (!("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(p);
        utt.rate = 0.78;
        utt.pitch = 0.88;
        utt.volume = 1.0;
        window.speechSynthesis.speak(utt);
      } catch {}
    };

    // ── Phase cycling — drives both the visual label and voice cues ──────────
    let curPhase: "Inhale" | "Hold" | "Exhale" = "Inhale";
    let phaseStart = performance.now();
    setPhase("Inhale");
    // Speak first cue immediately
    speakPhase("Inhale");

    const tickId = setInterval(() => {
      if (!alive) return;
      if (performance.now() - phaseStart >= VOICE_DURATIONS[curPhase]) {
        const elapsedSec = (performance.now() - sessionStart) / 1000;
        // After an Exhale completes and we've met the target duration, end cleanly
        if (curPhase === "Exhale" && elapsedSec >= targetSeconds) {
          alive = false;
          clearInterval(tickId);
          try { window.speechSynthesis?.cancel(); } catch {}
          onDoneRef.current();
          return;
        }
        curPhase = VOICE_NEXT[curPhase];
        phaseStart = performance.now();
        setPhase(curPhase);
        speakPhase(curPhase);
      }
    }, 100);

    return () => {
      alive = false;
      clearInterval(tickId);
      try { window.speechSynthesis?.cancel(); } catch {}
    };
  }, [targetSeconds]);

  // Circle: small → large on inhale, stays large on hold, large → small on exhale
  const scale = phase === "Inhale" ? 1.0 : phase === "Hold" ? 1.0 : 0.5;
  const transitionDuration =
    phase === "Inhale" ? `${VOICE_DURATIONS.Inhale / 1000}s`
    : phase === "Hold"   ? "0.2s"
    : `${VOICE_DURATIONS.Exhale / 1000}s`;

  // Duration label shown below phase name
  const phaseHint =
    phase === "Inhale" ? `${VOICE_DURATIONS.Inhale / 1000}s`
    : phase === "Hold"   ? `${VOICE_DURATIONS.Hold / 1000}s`
    : `${VOICE_DURATIONS.Exhale / 1000}s`;

  return (
    <div className="flex flex-col items-center gap-8">
      <div
        className="w-32 h-32 rounded-full"
        style={{
          transform: `scale(${scale})`,
          transition: `transform ${transitionDuration} ease-in-out`,
          background: `radial-gradient(circle, ${accentColor}30 0%, ${accentColor}10 60%, transparent 100%)`,
          border: `2px solid ${accentColor}40`,
          boxShadow: phase === "Hold"
            ? `0 0 40px ${accentColor}30`
            : `0 0 20px ${accentColor}15`,
        }}
      />
      <div className="flex flex-col items-center gap-1">
        <p
          data-testid="breathing-phase-label"
          className="text-xl font-display font-medium tracking-wider"
          style={{ color: `${accentColor}cc` }}
        >
          {phase}
        </p>
        <p className="text-xs" style={{ color: `${accentColor}55` }}>
          {phaseHint}
        </p>
      </div>
      <p className="text-[10px] tracking-wide" style={{ color: "rgba(255,255,255,0.25)" }}>
        Voice guided · Ambient audio
      </p>
    </div>
  );
}

const TIME_SLOTS = [
  "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM",
  "12:00 PM", "3:00 PM", "6:00 PM", "9:00 PM",
];

function PlanTomorrowSession({ accentColor, onDone }: { accentColor: string; onDone: () => void }) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState("");

  const activeTime = selectedTime ?? (customTime ? customTime : null);

  const handleConfirm = () => {
    if (!activeTime) return;
    localStorage.setItem("preferredReminderTime", activeTime);
    onDone();
  };

  const handleCustomChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCustomTime(e.target.value);
    setSelectedTime(null);
  };

  return (
    <div className="flex flex-col items-center gap-6 px-4 w-full max-w-sm">
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${accentColor}15` }}
      >
        <Brain size={28} style={{ color: accentColor }} />
      </div>

      {/* Heading */}
      <div className="text-center space-y-2">
        <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
          Choose a time for tomorrow's practice.
        </p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          Structure protects consistency.
        </p>
      </div>

      {/* Time slot grid */}
      <div className="grid grid-cols-4 gap-2 w-full">
        {TIME_SLOTS.map((slot) => {
          const isSelected = selectedTime === slot;
          return (
            <button
              key={slot}
              data-testid={`button-time-slot-${slot.replace(/[: ]/g, "-")}`}
              onClick={() => { setSelectedTime(slot); setCustomTime(""); }}
              className="py-2.5 rounded-xl text-xs font-medium transition-all active:scale-[0.95]"
              style={{
                backgroundColor: isSelected ? `${accentColor}22` : "rgba(255,255,255,0.04)",
                border: isSelected ? `1.5px solid ${accentColor}60` : "1px solid rgba(255,255,255,0.08)",
                color: isSelected ? accentColor : "rgba(255,255,255,0.5)",
                boxShadow: isSelected ? `0 0 12px ${accentColor}20` : "none",
              }}
            >
              {slot}
            </button>
          );
        })}
      </div>

      {/* Custom time picker */}
      <div className="w-full flex items-center gap-3">
        <div
          className="h-px flex-1"
          style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
        />
        <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>
          or custom
        </span>
        <div
          className="h-px flex-1"
          style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
        />
      </div>
      <input
        type="time"
        data-testid="input-custom-time"
        value={customTime}
        onChange={handleCustomChange}
        className="w-full px-4 py-2.5 rounded-xl text-sm text-center transition-all"
        style={{
          backgroundColor: customTime ? `${accentColor}12` : "rgba(255,255,255,0.04)",
          border: customTime ? `1.5px solid ${accentColor}40` : "1px solid rgba(255,255,255,0.1)",
          color: customTime ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)",
          colorScheme: "dark",
          outline: "none",
        }}
      />

      {/* CTA button */}
      <button
        data-testid="button-confirm-time"
        onClick={handleConfirm}
        disabled={!activeTime}
        className="mt-2 w-full py-3.5 rounded-xl text-sm uppercase tracking-[0.12em] font-display font-medium transition-all active:scale-[0.97]"
        style={{
          backgroundColor: activeTime ? `${accentColor}20` : "rgba(255,255,255,0.04)",
          border: activeTime ? `1.5px solid ${accentColor}50` : "1px solid rgba(255,255,255,0.07)",
          color: activeTime ? `${accentColor}ee` : "rgba(255,255,255,0.2)",
          cursor: activeTime ? "pointer" : "not-allowed",
          boxShadow: activeTime ? `0 0 20px ${accentColor}18` : "none",
        }}
      >
        I've chosen a time
      </button>

      {activeTime && (
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          Selected: <span style={{ color: accentColor }}>{activeTime}</span>
        </p>
      )}
    </div>
  );
}

function PromptSession({ elapsed, accentColor }: { elapsed: number; accentColor: string }) {
  let currentPrompt = MOVEMENT_PROMPTS[0];
  for (const p of MOVEMENT_PROMPTS) {
    if (elapsed >= p.at) currentPrompt = p;
  }

  return (
    <div className="flex flex-col items-center gap-6 px-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${accentColor}15` }}
      >
        <Heart size={28} style={{ color: accentColor }} />
      </div>
      <p
        data-testid="movement-prompt"
        className="text-center text-base leading-relaxed max-w-xs"
        style={{ color: "rgba(255,255,255,0.85)" }}
      >
        {currentPrompt.text}
      </p>
    </div>
  );
}

const INSTANT_CONTENT: Record<string, { icon: typeof Wind; heading: string; body: string; button: string }> = {
  "hydration-check": {
    icon: Droplets,
    heading: "Drink a full glass of water.",
    body: "Take your time. Hydration supports everything.",
    button: "Done",
  },
  "plan-tomorrow": {
    icon: Brain,
    heading: "Choose a time for tomorrow's practice.",
    body: "Structure protects consistency. Pick a moment that works for you.",
    button: "I've chosen a time",
  },
};

function InstantSession({ sessionId, accentColor, onDone }: { sessionId: string; accentColor: string; onDone: () => void }) {
  const content = INSTANT_CONTENT[sessionId] || INSTANT_CONTENT["hydration-check"];
  const Icon = content.icon;

  return (
    <div className="flex flex-col items-center gap-8 px-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${accentColor}15` }}
      >
        <Icon size={28} style={{ color: accentColor }} />
      </div>
      <div className="text-center space-y-3">
        <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
          {content.heading}
        </p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          {content.body}
        </p>
      </div>
      <button
        data-testid="button-instant-done"
        onClick={onDone}
        className="mt-4 px-10 py-3 rounded-xl font-display text-sm uppercase tracking-[0.12em] transition-all active:scale-[0.97]"
        style={{
          backgroundColor: `${accentColor}15`,
          border: `1px solid ${accentColor}25`,
          color: `${accentColor}dd`,
        }}
      >
        {content.button}
      </button>
    </div>
  );
}

const TIMER_CONTENT: Record<string, { heading: string; body: string }> = {
  "quick-reflection": {
    heading: "Take a quiet moment to reflect.",
    body: "What went well today? · What can you improve tomorrow? · How do you feel right now?",
  },
  "focus-block": {
    heading: "Focus on one thing. Let everything else go.",
    body: "3 minutes of uninterrupted attention. No switching.",
  },
};

function TimerSession({ sessionId, elapsed, total, accentColor }: { sessionId: string; elapsed: number; total: number; accentColor: string }) {
  const remaining = Math.max(0, total - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const content = TIMER_CONTENT[sessionId] || TIMER_CONTENT["quick-reflection"];

  return (
    <div className="flex flex-col items-center gap-8 px-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${accentColor}15` }}
      >
        <Brain size={28} style={{ color: accentColor }} />
      </div>
      <div className="text-center space-y-3">
        <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
          {content.heading}
        </p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          {content.body}
        </p>
      </div>
      <p
        data-testid="reflection-timer"
        className="text-3xl font-display font-light tracking-wider"
        style={{ color: `${accentColor}99` }}
      >
        {mins}:{secs.toString().padStart(2, "0")}
      </p>
    </div>
  );
}

/* ─── Completion beep (triple ascending tone, same pattern as training engine) */
function playSessionCompleteBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [0, 0.14, 0.28].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = [660, 880, 1100][i];
      osc.type = "sine";
      gain.gain.setValueAtTime(0.28, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.25);
    });
    setTimeout(() => { try { ctx.close(); } catch {} }, 1200);
  } catch {}
}

export default function GuidedSessionPage() {
  const [, params] = useRoute("/guided-session/:sessionId");
  const [, setLocation] = useLocation();
  const { player } = useGame();
  const { backgroundTheme } = useTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const sessionId = (params?.sessionId || "calm-breathing") as SessionId;
  const session = SESSIONS[sessionId];

  const [state, setState] = useState<"countdown" | "active" | "completing" | "done">(
    session?.type === "breathing" ? "countdown" : "active"
  );
  const [countdown, setCountdown] = useState(5);
  const [elapsed, setElapsed] = useState(0);
  const [showDayClose, setShowDayClose] = useState(false);
  const [showDay5Expansion, setShowDay5Expansion] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeTimeoutRef      = useRef<ReturnType<typeof setTimeout>  | null>(null);
  // Prevents duplicate sessionStorage writes if callbacks fire more than once
  const hasRecordedCompletion   = useRef(false);

  // Unlock HTMLAudioElement playback immediately on page mount for breathing sessions.
  // The browser requires at least one .play() that traces back to a user gesture.
  // We do this here while the mount is still close to the "Start" button click.
  useEffect(() => {
    if (session?.type !== "breathing") return;
    const unlock = new Audio(INHALE_URL);
    unlock.volume = 0;
    unlock.play()
      .then(() => { unlock.pause(); unlock.src = ""; })
      .catch(() => { unlock.src = ""; });
  }, []);

  const { data: homeData } = useQuery<{ onboardingDay: number; hasCompletedHabitToday: boolean; completedToday: number }>({
    queryKey: ["home", player?.id],
    queryFn: async () => {
      if (!player?.id) throw new Error("No player");
      const res = await fetch(`/api/player/${player.id}/home`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!player?.id,
    staleTime: 30000,
  });

  // Single-source mappings used by advanceFromCompleting and engine callbacks.
  // "hydration-check" is intentionally absent: it chains to "quick-reflection" instead
  // of marking Day 3 complete directly.
  const ONBOARDING_SESSION_TO_DAY: Record<string, number> = {
    "calm-breathing": 1, "light-movement": 2, "quick-reflection": 3,
    "focus-block": 4, "plan-tomorrow": 5,
  };
  const ONBOARDING_SESSION_TO_HABIT: Record<string, string> = {
    "calm-breathing": "guided_calm-breathing",
    "light-movement": "guided_light-movement",
    "hydration-check": "guided_hydration-check",
    "focus-block": "guided_focus-block",
    "plan-tomorrow": "guided_plan-tomorrow",
  };
  // Sessions that chain to the next session instead of returning home.
  // hydration-check (Day 3 step 1) → quick-reflection (Day 3 step 2).
  const ONBOARDING_SESSION_CHAINS: Record<string, string> = {
    "hydration-check": "quick-reflection",
  };

  // Write to sessionStorage exactly once per page mount — guards against
  // duplicate calls from re-renders, retry paths, or overlapping callbacks.
  // Also persists a timestamp for the 8-hour inter-day lock.
  const recordCompletion = (day: number) => {
    if (hasRecordedCompletion.current) return;
    hasRecordedCompletion.current = true;
    sessionStorage.setItem("ascend_just_completed_day", String(day));
    localStorage.setItem(`ascend_ob_day${day}_ts`, String(Date.now()));
  };

  /* Advance out of "completing" — only called on confirmed server success.
     Note: onSuccess already awaited refetchQueries, so cache is fresh here. */
  const advanceFromCompleting = useCallback(() => {
    if (completeTimeoutRef.current) {
      clearTimeout(completeTimeoutRef.current);
      completeTimeoutRef.current = null;
    }

    // Check if this session chains to a follow-up (e.g. hydration-check → quick-reflection)
    const chainTarget = ONBOARDING_SESSION_CHAINS[sessionId];
    if (chainTarget) {
      localStorage.setItem("ascend_day3_hydration_done", "true");
      setLocation(`/guided-session/${chainTarget}`);
      return;
    }

    const completedOnboardingDay = ONBOARDING_SESSION_TO_DAY[sessionId];
    if (completedOnboardingDay) {
      recordCompletion(completedOnboardingDay);
      setLocation("/");
      return;
    }

    // Non-onboarding sessions: standard behavior
    const isFirstCompletionToday = !homeData?.hasCompletedHabitToday;
    if (isFirstCompletionToday) {
      setShowDayClose(true);
    } else {
      setState("done");
    }
  }, [homeData, sessionId, setLocation]);

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!player?.id) throw new Error("No player");
      const habitId = ONBOARDING_SESSION_TO_HABIT[session.id] ?? session.id;
      const res = await apiRequest("POST", `/api/player/${player.id}/complete-guided-session`, {
        sessionId: session.id,
        habitId,
        stat: session.stat,
        durationMinutes: Math.max(1, Math.ceil(session.durationSeconds / 60)),
      });
      return res.json();
    },
    onSuccess: async () => {
      // Refetch immediately so the completed state is ready when user returns home
      await Promise.allSettled([
        queryClient.refetchQueries({ queryKey: ["home", player?.id] }),
        queryClient.refetchQueries({ queryKey: ["/api/player", player?.id] }),
      ]);
      advanceFromCompleting();
    },
    // On error: show retry UI — do NOT auto-advance, the session wasn't recorded
    onError: () => {
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = null;
      }
      setSaveError(true);
    },
  });

  useEffect(() => {
    if (state !== "countdown") return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setState("active");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state]);

  useEffect(() => {
    // These sessions use their own engines and manage timing independently
    if (sessionId === "light-movement" || sessionId === "focus-block") return;
    if (state !== "active" || session.type === "instant") return;

    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= session.durationSeconds) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          // Beep to signal timer completion (timer-type sessions only)
          if (session.type === "timer") {
            playSessionCompleteBeep();
          }
          return session.durationSeconds;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state, session.type, session.durationSeconds, sessionId]);

  useEffect(() => {
    if (sessionId === "light-movement" || sessionId === "focus-block") return;
    // Breathing sessions manage their own completion via onDone callback (ends on exhale)
    if (session.type === "breathing") return;
    if (session.type !== "instant" && elapsed >= session.durationSeconds && state === "active") {
      handleComplete();
    }
  }, [elapsed, session.durationSeconds, state, sessionId, session.type]);

  const handleComplete = useCallback(() => {
    if (state !== "active") return;
    setState("completing");
    setSaveError(false);
    // Network-hang guard: if the mutation takes >12s, surface the retry UI instead of auto-advancing
    completeTimeoutRef.current = setTimeout(() => {
      setSaveError(true);
      completeTimeoutRef.current = null;
    }, 12000);
    completeMutation.mutate();
  }, [state, completeMutation]);

  const handleInstantDone = () => {
    handleComplete();
  };

  /* Cleanup failsafe timeout on unmount */
  useEffect(() => () => {
    if (completeTimeoutRef.current) clearTimeout(completeTimeoutRef.current);
  }, []);

  if (!session) {
    setLocation("/");
    return null;
  }

  // Light Movement uses the video-guided engine instead of the generic session page
  if (sessionId === "light-movement" && player?.id) {
    const handleLightMovementComplete = async () => {
      await queryClient.refetchQueries({ queryKey: ["home", player.id] });
      recordCompletion(2);
      setLocation("/");
    };

    return (
      <LightMovementEngine
        playerId={player.id}
        onComplete={handleLightMovementComplete}
        onCancel={() => setLocation("/")}
      />
    );
  }

  // Light Cardio Session uses the video-guided cardio engine
  if (sessionId === "focus-block" && player?.id) {
    const handleCardioComplete = async () => {
      await queryClient.refetchQueries({ queryKey: ["home", player.id] });
      recordCompletion(4);
      setLocation("/");
    };

    return (
      <CardioSessionEngine
        playerId={player.id}
        onComplete={handleCardioComplete}
        onCancel={() => setLocation("/")}
      />
    );
  }

  const accentColor = STAT_COLORS[session.stat] || "#3b82f6";
  const progress = session.durationSeconds > 0 ? Math.min(elapsed / session.durationSeconds, 1) : 0;
  const Icon = session.icon;

  return (
    <div
      data-testid="guided-session-page"
      className="fixed inset-0 z-40 flex flex-col"
      style={{ backgroundColor: backgroundTheme.colors.background }}
    >
      {/* Calm breathing ambient video background */}
      {sessionId === "calm-breathing" && state === "active" && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <video
            src="/videos/calm-breathing.mp4"
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
            loop
            preload="auto"
            style={{ opacity: 0.25 }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)" }}
          />
        </div>
      )}
      <style>{`
        @keyframes gsGlowPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes gsFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gsDoneGlow {
          0% { opacity: 0; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color: `${accentColor}99` }} />
          <span className="text-xs font-display tracking-wide" style={{ color: "rgba(255,255,255,0.6)" }}>
            {session.title}
          </span>
        </div>
        <button
          data-testid="button-close-session"
          onClick={() => setLocation("/")}
          className="p-2 rounded-lg transition-all active:scale-95"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          <X size={18} />
        </button>
      </div>

      {session.type !== "instant" && (
        <div className="px-4">
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
            <div
              data-testid="session-progress-bar"
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: `${accentColor}60`,
                transitionDuration: "1s",
                transitionTimingFunction: "linear",
              }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center" style={{ animation: "gsFadeIn 0.5s ease-out" }}>
        {state === "countdown" && (
          <div className="flex flex-col items-center gap-6">
            <p className="text-sm tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
              Get comfortable. Starting in...
            </p>
            <p
              data-testid="countdown-number"
              className="text-6xl font-display font-light"
              style={{
                color: `${accentColor}bb`,
                animation: "gsFadeIn 0.3s ease-out",
              }}
              key={countdown}
            >
              {countdown}
            </p>
          </div>
        )}
        {state === "active" && session.type === "breathing" && (
          <BreathingSession
            accentColor={accentColor}
            targetSeconds={session.durationSeconds}
            onDone={handleComplete}
          />
        )}
        {state === "active" && session.type === "prompts" && (
          <PromptSession elapsed={elapsed} accentColor={accentColor} />
        )}
        {state === "active" && session.type === "instant" && sessionId !== "plan-tomorrow" && (
          <InstantSession sessionId={session.id} accentColor={accentColor} onDone={handleInstantDone} />
        )}
        {state === "active" && sessionId === "plan-tomorrow" && (
          <PlanTomorrowSession accentColor={accentColor} onDone={handleInstantDone} />
        )}
        {state === "active" && session.type === "timer" && (
          <TimerSession sessionId={session.id} elapsed={elapsed} total={session.durationSeconds} accentColor={accentColor} />
        )}
        {state === "completing" && (
          <div className="flex flex-col items-center gap-4" style={{ animation: "gsDoneGlow 0.5s ease-out" }}>
            <div
              className="w-16 h-16 rounded-full"
              style={{
                background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
                animation: saveError ? "none" : "gsGlowPulse 2s ease-in-out infinite",
              }}
            />
            {saveError ? (
              <>
                <p className="text-sm text-center" style={{ color: "rgba(255,100,100,0.8)" }}>
                  Couldn't save your session. Check your connection.
                </p>
                <button
                  data-testid="button-retry-save"
                  onClick={() => { setSaveError(false); completeMutation.mutate(); }}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                  style={{ backgroundColor: `${accentColor}20`, border: `1px solid ${accentColor}40`, color: accentColor }}
                >
                  Retry
                </button>
              </>
            ) : (
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                Saving your progress...
              </p>
            )}
          </div>
        )}
        {state === "done" && (
          <div className="flex flex-col items-center gap-6 px-8 text-center" style={{ animation: "gsFadeIn 0.4s ease-out" }}>
            <div
              className="w-16 h-16 rounded-full"
              style={{ background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)` }}
            />
            <p className="text-lg font-display font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
              Step complete.
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              {t("You showed up. Momentum begins.")}
            </p>
            <button
              data-testid="button-return-home"
              onClick={() => setLocation("/")}
              className="mt-4 px-8 py-3 rounded-xl font-display text-sm uppercase tracking-[0.12em] transition-all active:scale-[0.97]"
              style={{
                backgroundColor: `${accentColor}12`,
                border: `1px solid ${accentColor}20`,
                color: `${accentColor}cc`,
              }}
            >
              Return Home
            </button>
          </div>
        )}
      </div>

      {state === "active" && session.type !== "instant" && (
        <div className="px-4 pb-6 flex flex-col items-center gap-3">
          {sessionId === "quick-reflection" && (
            <button
              data-testid="button-complete-reflection"
              onClick={handleComplete}
              className="px-8 py-3 rounded-xl text-sm font-medium tracking-wide transition-all active:scale-[0.97]"
              style={{
                backgroundColor: `${accentColor}18`,
                border: `1px solid ${accentColor}35`,
                color: `${accentColor}cc`,
              }}
            >
              Complete Reflection
            </button>
          )}
          <p className="text-[10px] tracking-wide" style={{ color: "rgba(255,255,255,0.25)" }}>
            {Math.ceil((session.durationSeconds - elapsed) / 60)} min remaining
          </p>
        </div>
      )}

      <Day5ExpansionOverlay
        visible={showDay5Expansion}
        onComplete={() => {
          setShowDay5Expansion(false);
          setLocation("/");
        }}
        onSkip={() => {
          setShowDay5Expansion(false);
          setShowDayClose(true);
        }}
        onSessionComplete={() => {
          if (player?.id) {
            apiRequest("POST", `/api/player/${player.id}/complete-guided-session`, {
              sessionId: "day5-expansion",
              stat: "vitality",
              durationMinutes: 1,
            }).then(() => {
              queryClient.invalidateQueries({ queryKey: ["home"] });
              queryClient.invalidateQueries({ queryKey: ["/api/player"] });
              const count = parseInt(localStorage.getItem("ascend_multi_action_days") || "0", 10);
              localStorage.setItem("ascend_multi_action_days", String(count + 1));
            });
          }
        }}
      />

      <DayCloseOverlay
        visible={showDayClose}
        onboardingDay={homeData?.onboardingDay ?? 1}
        onClose={() => {
          setShowDayClose(false);
          setLocation("/");
        }}
      />
    </div>
  );
}
