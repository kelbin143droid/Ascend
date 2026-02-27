import { useState, useEffect, useCallback, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { apiRequest } from "@/lib/queryClient";
import { DayCloseOverlay } from "@/components/game/DayCloseOverlay";
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

function BreathingSession({ elapsed, accentColor }: { elapsed: number; accentColor: string }) {
  const cycleLength = BREATHING_PHASES.reduce((s, p) => s + p.duration, 0);
  const posInCycle = (elapsed * 1000) % cycleLength;

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: homeData } = useQuery<{ onboardingDay: number; hasCompletedHabitToday: boolean }>({
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

      if (!homeData?.hasCompletedHabitToday) {
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
