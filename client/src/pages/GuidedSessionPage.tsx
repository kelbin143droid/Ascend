import { useState, useEffect, useCallback, useRef } from "react";
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
import { Day6SectographIntro } from "@/components/game/Day6SectographIntro";
import { Day7FollowThrough } from "@/components/game/Day7FollowThrough";

type SessionId = "calm-breathing" | "light-movement" | "hydration-check" | "quick-reflection" | "focus-block" | "plan-tomorrow" | "weekly-reflection";

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
  "weekly-reflection": {
    id: "weekly-reflection",
    title: "Weekly Reflection",
    stat: "sense",
    durationSeconds: 0,
    icon: Brain,
    type: "instant",
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

let cachedVoice: SpeechSynthesisVoice | null = null;

function getVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  cachedVoice =
    voices.find(v => v.lang.startsWith("en") && /samantha/i.test(v.name)) ||
    voices.find(v => v.lang.startsWith("en") && /fiona|moira|tessa|karen|victoria|zoe|serena/i.test(v.name)) ||
    voices.find(v => v.lang.startsWith("en") && /female|woman/i.test(v.name)) ||
    voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("google") && /us|uk/i.test(v.name)) ||
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
      utterance.rate = 0.9;
      utterance.pitch = 0.95;
      utterance.volume = 0.55;
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
  "weekly-reflection": {
    icon: Brain,
    heading: "Review your first week.",
    body: "You showed up for 7 days. Consistency builds strength.",
    button: "Complete reflection",
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
    heading: "Close your eyes. Reflect on one thing you're grateful for.",
    body: "Let thoughts settle. No need to force anything.",
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
    // These sessions use their own engines and manage timing independently
    if (sessionId === "light-movement" || sessionId === "focus-block") return;
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
  }, [state, session.type, session.durationSeconds, sessionId]);

  useEffect(() => {
    if (sessionId === "light-movement" || sessionId === "focus-block") return;
    if (session.type !== "instant" && elapsed >= session.durationSeconds && state === "active") {
      handleComplete();
    }
  }, [elapsed, session.durationSeconds, state, sessionId]);

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

  // Light Movement uses the video-guided engine instead of the generic session page
  if (sessionId === "light-movement" && player?.id) {
    const handleLightMovementComplete = () => {
      const isFirstCompletionToday = !homeData?.hasCompletedHabitToday;
      const isDay5 = homeData?.onboardingDay === 5;
      const alreadyExpanded = localStorage.getItem("ascend_day5_expansion_shown") === new Date().toISOString().split("T")[0];

      if (isFirstCompletionToday && isDay5 && !alreadyExpanded) {
        localStorage.setItem("ascend_day5_expansion_shown", new Date().toISOString().split("T")[0]);
        setShowDay5Expansion(true);
      } else if (isFirstCompletionToday) {
        setShowDayClose(true);
      } else {
        setLocation("/");
      }
    };

    return (
      <>
        <LightMovementEngine
          playerId={player.id}
          onComplete={handleLightMovementComplete}
          onCancel={() => setLocation("/")}
        />
        <Day5ExpansionOverlay
          visible={showDay5Expansion}
          onComplete={() => { setShowDay5Expansion(false); setLocation("/"); }}
          onSkip={() => { setShowDay5Expansion(false); setShowDayClose(true); }}
          onSessionComplete={() => {
            apiRequest("POST", `/api/player/${player.id}/complete-guided-session`, {
              sessionId: "day5-expansion", stat: "vitality", durationMinutes: 1,
            }).then(() => { queryClient.invalidateQueries({ queryKey: ["home"] }); });
          }}
        />
        <DayCloseOverlay
          visible={showDayClose}
          onboardingDay={homeData?.onboardingDay ?? 2}
          onClose={() => { setShowDayClose(false); setLocation("/"); }}
        />
      </>
    );
  }

  // Light Cardio Session uses the video-guided cardio engine
  if (sessionId === "focus-block" && player?.id) {
    const handleCardioComplete = () => {
      const isFirstCompletionToday = !homeData?.hasCompletedHabitToday;
      if (isFirstCompletionToday) {
        setShowDayClose(true);
      } else {
        setLocation("/");
      }
    };

    return (
      <>
        <CardioSessionEngine
          playerId={player.id}
          onComplete={handleCardioComplete}
          onCancel={() => setLocation("/")}
        />
        <DayCloseOverlay
          visible={showDayClose}
          onboardingDay={homeData?.onboardingDay ?? 2}
          onClose={() => { setShowDayClose(false); setLocation("/"); }}
        />
      </>
    );
  }

  // Day 6 — Sectograph intro: guided time placement experience
  if (sessionId === "plan-tomorrow" && player?.id) {
    const handleDay6Complete = () => {
      // Fire the completion API in background to record the day
      apiRequest("POST", `/api/player/${player.id}/complete-guided-session`, {
        sessionId: "plan-tomorrow",
        stat: "sense",
        durationMinutes: 1,
      }).then(() => queryClient.invalidateQueries({ queryKey: ["home"] })).catch(() => {});

      const isFirstCompletionToday = !homeData?.hasCompletedHabitToday;
      if (isFirstCompletionToday) {
        setShowDayClose(true);
      } else {
        setLocation("/");
      }
    };

    return (
      <>
        <Day6SectographIntro
          onComplete={handleDay6Complete}
          onCancel={() => setLocation("/")}
        />
        <DayCloseOverlay
          visible={showDayClose}
          onboardingDay={homeData?.onboardingDay ?? 2}
          onClose={() => { setShowDayClose(false); setLocation("/"); }}
        />
      </>
    );
  }

  // Day 7 — Follow-Through: meets the planned action from Day 6
  if (sessionId === "weekly-reflection" && player?.id) {
    const handleDay7Complete = () => {
      apiRequest("POST", `/api/player/${player.id}/complete-guided-session`, {
        sessionId: "weekly-reflection",
        stat: "sense",
        durationMinutes: 2,
      }).then(() => queryClient.invalidateQueries({ queryKey: ["home"] })).catch(() => {});

      const isFirstCompletionToday = !homeData?.hasCompletedHabitToday;
      if (isFirstCompletionToday) {
        setShowDayClose(true);
      } else {
        setLocation("/");
      }
    };

    return (
      <>
        <Day7FollowThrough
          onComplete={handleDay7Complete}
          onCancel={() => setLocation("/")}
        />
        <DayCloseOverlay
          visible={showDayClose}
          onboardingDay={homeData?.onboardingDay ?? 2}
          onClose={() => { setShowDayClose(false); setLocation("/"); }}
        />
      </>
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
          <BreathingSession elapsed={elapsed} accentColor={accentColor} />
        )}
        {state === "active" && session.type === "prompts" && (
          <PromptSession elapsed={elapsed} accentColor={accentColor} />
        )}
        {state === "active" && session.type === "instant" && (
          <InstantSession sessionId={session.id} accentColor={accentColor} onDone={handleInstantDone} />
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
                animation: "gsGlowPulse 2s ease-in-out infinite",
              }}
            />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              Saving your progress...
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
