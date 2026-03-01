import { useState, useEffect, useCallback, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { apiRequest } from "@/lib/queryClient";
import { DayCloseOverlay } from "@/components/game/DayCloseOverlay";
import { Day5ExpansionOverlay } from "@/components/game/Day5ExpansionOverlay";
import { Wind, Heart, Droplets, Brain, X } from "lucide-react";

type SessionId = "calm-breathing" | "light-movement" | "hydration-check" | "quick-reflection";

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
    title: "Calm Breathing",
    stat: "sense",
    durationSeconds: 120,
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
};

const BREATHING_PHASES = [
  { label: "Inhale", duration: 4000 },
  { label: "Hold", duration: 4000 },
  { label: "Exhale", duration: 6000 },
];

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
      masterGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 3);

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

let cachedVoice: SpeechSynthesisVoice | null = null;

function getVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  cachedVoice =
    voices.find(v => v.lang.startsWith("en") && /samantha|karen|female|fiona|moira|tessa/i.test(v.name)) ||
    voices.find(v => v.lang.startsWith("en-") && !v.localService) ||
    voices.find(v => v.lang.startsWith("en")) ||
    voices[0];
  return cachedVoice;
}

function speakPhase(label: string) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(label);
      utterance.rate = 0.65;
      utterance.pitch = 0.85;
      utterance.volume = 0.6;
      const voice = getVoice();
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.addEventListener("voiceschanged", () => speak(), { once: true });
    } else {
      speak();
    }
  } catch {}
}

interface BreathEngine {
  ctx: AudioContext;
  inhaleSource: AudioBufferSourceNode;
  exhaleSource: AudioBufferSourceNode;
  inhaleGain: GainNode;
  exhaleGain: GainNode;
  inhaleLpFreq: BiquadFilterNode;
  exhaleLpFreq: BiquadFilterNode;
}

function createSoftNoise(ctx: AudioContext, seconds: number): AudioBuffer {
  const len = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let s1 = 0, s2 = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    s1 = (s1 + 0.004 * white) / 1.004;
    s2 = (s2 + 0.012 * s1) / 1.012;
    data[i] = s2 * 8;
  }
  return buffer;
}

function buildBreathEngine(ctx: AudioContext): BreathEngine {
  const noise1 = createSoftNoise(ctx, 5);
  const noise2 = createSoftNoise(ctx, 5);

  const inhaleSource = ctx.createBufferSource();
  inhaleSource.buffer = noise1;
  inhaleSource.loop = true;
  const inhaleLp1 = ctx.createBiquadFilter();
  inhaleLp1.type = "lowpass";
  inhaleLp1.frequency.setValueAtTime(400, ctx.currentTime);
  inhaleLp1.Q.setValueAtTime(0.5, ctx.currentTime);
  const inhaleLp2 = ctx.createBiquadFilter();
  inhaleLp2.type = "lowpass";
  inhaleLp2.frequency.setValueAtTime(700, ctx.currentTime);
  inhaleLp2.Q.setValueAtTime(0.3, ctx.currentTime);
  const inhaleHp = ctx.createBiquadFilter();
  inhaleHp.type = "highpass";
  inhaleHp.frequency.setValueAtTime(150, ctx.currentTime);
  inhaleHp.Q.setValueAtTime(0.3, ctx.currentTime);
  const inhalePeak = ctx.createBiquadFilter();
  inhalePeak.type = "peaking";
  inhalePeak.frequency.setValueAtTime(350, ctx.currentTime);
  inhalePeak.Q.setValueAtTime(0.8, ctx.currentTime);
  inhalePeak.gain.setValueAtTime(4, ctx.currentTime);
  const inhaleGain = ctx.createGain();
  inhaleGain.gain.setValueAtTime(0, ctx.currentTime);
  inhaleSource.connect(inhaleHp).connect(inhaleLp1).connect(inhalePeak).connect(inhaleLp2).connect(inhaleGain).connect(ctx.destination);
  inhaleSource.start();

  const exhaleSource = ctx.createBufferSource();
  exhaleSource.buffer = noise2;
  exhaleSource.loop = true;
  const exhaleLp1 = ctx.createBiquadFilter();
  exhaleLp1.type = "lowpass";
  exhaleLp1.frequency.setValueAtTime(300, ctx.currentTime);
  exhaleLp1.Q.setValueAtTime(0.4, ctx.currentTime);
  const exhaleLp2 = ctx.createBiquadFilter();
  exhaleLp2.type = "lowpass";
  exhaleLp2.frequency.setValueAtTime(500, ctx.currentTime);
  exhaleLp2.Q.setValueAtTime(0.3, ctx.currentTime);
  const exhaleHp = ctx.createBiquadFilter();
  exhaleHp.type = "highpass";
  exhaleHp.frequency.setValueAtTime(60, ctx.currentTime);
  exhaleHp.Q.setValueAtTime(0.2, ctx.currentTime);
  const exhalePeak = ctx.createBiquadFilter();
  exhalePeak.type = "peaking";
  exhalePeak.frequency.setValueAtTime(220, ctx.currentTime);
  exhalePeak.Q.setValueAtTime(0.6, ctx.currentTime);
  exhalePeak.gain.setValueAtTime(5, ctx.currentTime);
  const exhaleGain = ctx.createGain();
  exhaleGain.gain.setValueAtTime(0, ctx.currentTime);
  exhaleSource.connect(exhaleHp).connect(exhaleLp1).connect(exhalePeak).connect(exhaleLp2).connect(exhaleGain).connect(ctx.destination);
  exhaleSource.start();

  return {
    ctx,
    inhaleSource, exhaleSource,
    inhaleGain, exhaleGain,
    inhaleLpFreq: inhaleLp2,
    exhaleLpFreq: exhaleLp2,
  };
}

function useBreathNoise(elapsedMs: number, cycleLengthMs: number) {
  const engineRef = useRef<BreathEngine | null>(null);
  const rafRef = useRef<number>(0);
  const elapsedRef = useRef(elapsedMs);
  elapsedRef.current = elapsedMs;
  const cycleLenRef = useRef(cycleLengthMs);
  cycleLenRef.current = cycleLengthMs;

  useEffect(() => {
    try {
      const ctx = new AudioContext();
      const engine = buildBreathEngine(ctx);
      engineRef.current = engine;

      const tick = () => {
        if (!engineRef.current) return;
        const e = engineRef.current;
        const now = e.ctx.currentTime;
        const pos = (elapsedRef.current) % cycleLenRef.current;

        let inhVol = 0;
        let exhVol = 0;
        let cumul = 0;

        const inhaleDur = BREATHING_PHASES[0].duration;
        const holdDur = BREATHING_PHASES[1].duration;
        const exhaleDur = BREATHING_PHASES[2].duration;

        if (pos < inhaleDur) {
          const p = pos / inhaleDur;
          inhVol = 0.22 * Math.sin(p * Math.PI);
          const freq = 400 + p * 300;
          e.inhaleLpFreq.frequency.setTargetAtTime(freq, now, 0.05);
        } else if (pos < inhaleDur + holdDur) {
          const holdP = (pos - inhaleDur) / holdDur;
          inhVol = 0.22 * Math.sin(Math.PI) * Math.max(0, 1 - holdP * 3);
          exhVol = 0;
        } else {
          const p = (pos - inhaleDur - holdDur) / exhaleDur;
          exhVol = 0.28 * Math.sin(p * Math.PI);
          const freq = 350 + (1 - p) * 150;
          e.exhaleLpFreq.frequency.setTargetAtTime(freq, now, 0.05);
        }

        e.inhaleGain.gain.setTargetAtTime(Math.max(0, inhVol), now, 0.04);
        e.exhaleGain.gain.setTargetAtTime(Math.max(0, exhVol), now, 0.04);

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch {}

    return () => {
      cancelAnimationFrame(rafRef.current);
      try {
        if (engineRef.current) {
          engineRef.current.inhaleSource.stop();
          engineRef.current.exhaleSource.stop();
          engineRef.current.ctx.close();
        }
      } catch {}
      engineRef.current = null;
    };
  }, []);
}

function BreathingSession({ elapsed, accentColor }: { elapsed: number; accentColor: string }) {
  const cycleLength = BREATHING_PHASES.reduce((s, p) => s + p.duration, 0);
  const posInCycle = (elapsed * 1000) % cycleLength;
  const lastSpokenRef = useRef<string>("");

  useBreathingAudio(true);

  let cumulative = 0;
  let currentPhase = BREATHING_PHASES[0];
  let phaseProgress = 0;

  for (const phase of BREATHING_PHASES) {
    if (posInCycle < cumulative + phase.duration) {
      currentPhase = phase;
      phaseProgress = (posInCycle - cumulative) / phase.duration;
      break;
    }
    cumulative += phase.duration;
  }

  useBreathNoise(posInCycle, cycleLength);

  useEffect(() => {
    if (currentPhase.label !== lastSpokenRef.current) {
      lastSpokenRef.current = currentPhase.label;
      speakPhase(currentPhase.label);
    }
  }, [currentPhase.label]);

  useEffect(() => {
    return () => {
      try { window.speechSynthesis?.cancel(); } catch {}
    };
  }, []);

  const scale = currentPhase.label === "Inhale"
    ? 0.6 + 0.4 * phaseProgress
    : currentPhase.label === "Exhale"
      ? 1.0 - 0.4 * phaseProgress
      : 1.0;

  return (
    <div className="flex flex-col items-center gap-8">
      <div
        className="w-32 h-32 rounded-full transition-transform"
        style={{
          transform: `scale(${scale})`,
          transitionDuration: "200ms",
          background: `radial-gradient(circle, ${accentColor}25 0%, ${accentColor}08 60%, transparent 100%)`,
          border: `2px solid ${accentColor}30`,
        }}
      />
      <p
        data-testid="breathing-phase-label"
        className="text-xl font-display font-medium tracking-wider"
        style={{ color: `${accentColor}cc` }}
      >
        {currentPhase.label}
      </p>
      <p className="text-[10px] tracking-wide" style={{ color: "rgba(255,255,255,0.25)" }}>
        Voice guided · Ambient audio
      </p>
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

function InstantSession({ accentColor, onDone }: { accentColor: string; onDone: () => void }) {
  return (
    <div className="flex flex-col items-center gap-8 px-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${accentColor}15` }}
      >
        <Droplets size={28} style={{ color: accentColor }} />
      </div>
      <div className="text-center space-y-3">
        <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
          Drink a full glass of water.
        </p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          Take your time. Hydration supports everything.
        </p>
      </div>
      <button
        data-testid="button-hydration-done"
        onClick={onDone}
        className="mt-4 px-10 py-3 rounded-xl font-display text-sm uppercase tracking-[0.12em] transition-all active:scale-[0.97]"
        style={{
          backgroundColor: `${accentColor}15`,
          border: `1px solid ${accentColor}25`,
          color: `${accentColor}dd`,
        }}
      >
        Done
      </button>
    </div>
  );
}

function TimerSession({ elapsed, total, accentColor }: { elapsed: number; total: number; accentColor: string }) {
  const remaining = Math.max(0, total - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

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
          Close your eyes. Reflect on one thing you're grateful for.
        </p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          Let thoughts settle. No need to force anything.
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

export default function GuidedSessionPage() {
  const [, params] = useRoute("/guided-session/:sessionId");
  const [, setLocation] = useLocation();
  const { player } = useGame();
  const { backgroundTheme } = useTheme();
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!player?.id) throw new Error("No player");
      const res = await apiRequest("POST", `/api/player/${player.id}/complete-guided-session`, {
        sessionId: session.id,
        stat: session.stat,
        durationMinutes: Math.max(1, Math.ceil(session.durationSeconds / 60)),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home"] });
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });

      const isFirstCompletionToday = !homeData?.hasCompletedHabitToday;
      const isDay5 = homeData?.onboardingDay === 5;
      const alreadyExpanded = localStorage.getItem("ascend_day5_expansion_shown") === new Date().toISOString().split("T")[0];

      if (isFirstCompletionToday && isDay5 && !alreadyExpanded) {
        localStorage.setItem("ascend_day5_expansion_shown", new Date().toISOString().split("T")[0]);
        setShowDay5Expansion(true);
      } else if (isFirstCompletionToday) {
        setShowDayClose(true);
      } else {
        setState("done");
      }
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
    if (state !== "active" || session.type === "instant") return;

    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= session.durationSeconds) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return session.durationSeconds;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state, session.type, session.durationSeconds]);

  useEffect(() => {
    if (session.type !== "instant" && elapsed >= session.durationSeconds && state === "active") {
      handleComplete();
    }
  }, [elapsed, session.durationSeconds, state]);

  const handleComplete = useCallback(() => {
    if (state !== "active") return;
    setState("completing");
    completeMutation.mutate();
  }, [state, completeMutation]);

  const handleInstantDone = () => {
    handleComplete();
  };

  if (!session) {
    setLocation("/");
    return null;
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
              Get comfortable. Session starts in...
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
          <BreathingSession elapsed={elapsed} accentColor={accentColor} />
        )}
        {state === "active" && session.type === "prompts" && (
          <PromptSession elapsed={elapsed} accentColor={accentColor} />
        )}
        {state === "active" && session.type === "instant" && (
          <InstantSession accentColor={accentColor} onDone={handleInstantDone} />
        )}
        {state === "active" && session.type === "timer" && (
          <TimerSession elapsed={elapsed} total={session.durationSeconds} accentColor={accentColor} />
        )}
        {state === "completing" && (
          <div className="flex flex-col items-center gap-4" style={{ animation: "gsDoneGlow 0.5s ease-out" }}>
            <div
              className="w-16 h-16 rounded-full"
              style={{
                background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
                animation: "gsGlowPulse 2s ease-in-out infinite",
              }}
            />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              Recording progress...
            </p>
          </div>
        )}
        {state === "done" && (
          <div className="flex flex-col items-center gap-6 px-8 text-center" style={{ animation: "gsFadeIn 0.4s ease-out" }}>
            <div
              className="w-16 h-16 rounded-full"
              style={{ background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)` }}
            />
            <p className="text-lg font-display font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
              Session complete.
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              Action completed. Momentum increased.
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
        <div className="px-4 pb-6 text-center">
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
