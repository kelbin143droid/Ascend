import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Wind, Sparkles, ArrowRight, RefreshCw } from "lucide-react";

interface ResetRitualStep {
  id: string;
  type: "breathing" | "reflection" | "affirmation";
  title: string;
  instruction: string;
  durationSeconds: number;
}

interface ReturnProtocolData {
  active: boolean;
  tier: "short" | "extended" | "long";
  daysSinceLastActivity: number;
  coachMessage: string | null;
  resetRitual: {
    steps: ResetRitualStep[];
    totalDurationSeconds: number;
  } | null;
  simplifyMode: {
    habitLoadReduction: number;
    focusDurationMultiplier: number;
    hideAnalytics: boolean;
    hideWeeklyPlanning: boolean;
    durationDays: number;
  } | null;
  softRestart: boolean;
  hideProgress: boolean;
}

interface ReturnProtocolScreenProps {
  data: ReturnProtocolData;
  onComplete: () => void;
}

const TIER_THEMES = {
  short: {
    accent: "#3b82f6",
    accentDim: "rgba(59,130,246,0.12)",
    accentBorder: "rgba(59,130,246,0.2)",
    icon: Wind,
    title: "Welcome Back",
  },
  extended: {
    accent: "#a855f7",
    accentDim: "rgba(168,85,247,0.12)",
    accentBorder: "rgba(168,85,247,0.2)",
    icon: RefreshCw,
    title: "Let's Simplify",
  },
  long: {
    accent: "#22c55e",
    accentDim: "rgba(34,197,94,0.12)",
    accentBorder: "rgba(34,197,94,0.2)",
    icon: Sparkles,
    title: "Fresh Start",
  },
};

const BREATH_AUDIO: Record<"in" | "hold" | "out", string> = {
  in: "/audio/inhale.mp3",
  hold: "/audio/hold.mp3",
  out: "/audio/exhale.mp3",
};
let _returnBreathAudio: HTMLAudioElement | null = null;
function playReturnBreathCue(phase: "in" | "hold" | "out") {
  try {
    if (_returnBreathAudio) { _returnBreathAudio.pause(); _returnBreathAudio.currentTime = 0; }
    const a = new Audio(BREATH_AUDIO[phase]);
    a.volume = 0.9;
    a.play().catch(() => {});
    _returnBreathAudio = a;
  } catch {}
}

function BreathingExercise({ step, onDone }: { step: ResetRitualStep; onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const [timeLeft, setTimeLeft] = useState(step.durationSeconds);
  const [circleScale, setCircleScale] = useState(1);
  const pendingDoneRef = useRef(false);

  // Play first cue on mount
  useEffect(() => { playReturnBreathCue("in"); }, []);

  useEffect(() => {
    const phaseTimer = setInterval(() => {
      setPhase(p => {
        let next: "in" | "hold" | "out";
        if (p === "in") { setCircleScale(1.4); next = "hold"; }
        else if (p === "hold") { setCircleScale(1); next = "out"; }
        else { setCircleScale(1); next = "in"; }
        playReturnBreathCue(next);
        // If time already expired and we just reached "out", complete now
        if (pendingDoneRef.current && next === "out") {
          setTimeout(onDone, 5500); // let exhale cue play
        }
        return next;
      });
    }, 4000);

    const countdownTimer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(countdownTimer);
          clearInterval(phaseTimer);
          // Don't call onDone immediately — queue it for end of next exhale
          pendingDoneRef.current = true;
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => { clearInterval(phaseTimer); clearInterval(countdownTimer); };
  }, [step.durationSeconds, onDone]);

  const phaseLabel = phase === "in" ? "Breathe In" : phase === "hold" ? "Hold" : "Breathe Out";

  return (
    <div className="flex flex-col items-center gap-6" data-testid="breathing-exercise">
      <div
        className="relative w-32 h-32 rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.03) 70%)`,
          transform: `scale(${circleScale})`,
          transition: "transform 3.5s ease-in-out",
          boxShadow: `0 0 40px rgba(59,130,246,${circleScale > 1 ? 0.25 : 0.1})`,
        }}
      >
        <div
          className="w-20 h-20 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(59,130,246,0.08) 100%)`,
            transform: `scale(${circleScale})`,
            transition: "transform 3.5s ease-in-out",
          }}
        />
      </div>
      <p className="text-lg font-medium text-white/80 tracking-wide">{phaseLabel}</p>
      <p className="text-xs text-white/30">{timeLeft}s</p>
    </div>
  );
}

function ReflectionPrompt({ step, onDone }: { step: ResetRitualStep; onDone: () => void }) {
  const [timeLeft, setTimeLeft] = useState(step.durationSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step.durationSeconds]);

  return (
    <div className="flex flex-col items-center gap-5 text-center px-4" data-testid="reflection-prompt">
      <p className="text-sm text-white/70 leading-relaxed max-w-xs">{step.instruction}</p>
      <div className="flex items-center gap-3 mt-2">
        {timeLeft > 0 && <p className="text-xs text-white/30">{timeLeft}s</p>}
        <button
          onClick={onDone}
          className="px-4 py-2 rounded-lg text-xs font-medium text-white/80 transition-colors"
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
          data-testid="button-continue-ritual"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function AffirmationStep({ step, onDone }: { step: ResetRitualStep; onDone: () => void }) {
  const [timeLeft, setTimeLeft] = useState(step.durationSeconds);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 300);
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step.durationSeconds]);

  return (
    <div className="flex flex-col items-center gap-5 text-center px-4" data-testid="affirmation-step">
      <p
        className="text-base font-medium leading-relaxed max-w-xs transition-all duration-1000"
        style={{
          color: "rgba(34,197,94,0.9)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(10px)",
        }}
      >
        {step.instruction}
      </p>
      <div className="flex items-center gap-3 mt-2">
        {timeLeft > 0 && <p className="text-xs text-white/30">{timeLeft}s</p>}
        <button
          onClick={onDone}
          className="px-4 py-2 rounded-lg text-xs font-medium text-white/80 transition-colors"
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
          data-testid="button-continue-affirmation"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export function ReturnProtocolScreen({ data, onComplete }: ReturnProtocolScreenProps) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [stage, setStage] = useState<"welcome" | "ritual" | "summary">("welcome");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const theme = TIER_THEMES[data.tier];
  const TierIcon = theme.icon;
  const ritualSteps = data.resetRitual?.steps ?? [];

  const handleStartRitual = useCallback(() => {
    if (ritualSteps.length > 0) {
      setStage("ritual");
      setCurrentStepIndex(0);
    } else {
      setStage("summary");
    }
  }, [ritualSteps.length]);

  const handleStepDone = useCallback(() => {
    if (currentStepIndex < ritualSteps.length - 1) {
      setCurrentStepIndex(i => i + 1);
    } else {
      setStage("summary");
    }
  }, [currentStepIndex, ritualSteps.length]);

  if (stage === "welcome") {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: colors.background }}
        data-testid="return-protocol-welcome"
      >
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.accentDim, border: `1px solid ${theme.accentBorder}` }}
          >
            <TierIcon className="w-7 h-7" style={{ color: theme.accent }} />
          </div>

          <h1
            className="text-xl font-bold tracking-wide font-orbitron"
            style={{ color: colors.text }}
          >
            {theme.title}
          </h1>

          {data.coachMessage && (
            <p className="text-sm leading-relaxed" style={{ color: `${colors.text}aa` }}>
              {data.coachMessage}
            </p>
          )}

          {data.tier === "extended" && data.simplifyMode && (
            <div
              className="rounded-xl px-4 py-3 w-full"
              style={{ backgroundColor: theme.accentDim, border: `1px solid ${theme.accentBorder}` }}
            >
              <p className="text-[10px] uppercase tracking-[0.12em] font-bold mb-1.5" style={{ color: `${theme.accent}cc` }}>
                Simplify Mode Active
              </p>
              <ul className="text-xs space-y-1 text-left" style={{ color: `${colors.text}88` }}>
                <li>· Reduced habit load for {data.simplifyMode.durationDays} days</li>
                <li>· Shorter focus sessions</li>
                <li>· Complex views hidden temporarily</li>
              </ul>
            </div>
          )}

          {data.tier === "long" && (
            <div
              className="rounded-xl px-4 py-3 w-full"
              style={{ backgroundColor: theme.accentDim, border: `1px solid ${theme.accentBorder}` }}
            >
              <p className="text-[10px] uppercase tracking-[0.12em] font-bold mb-1.5" style={{ color: `${theme.accent}cc` }}>
                Soft Restart
              </p>
              <ul className="text-xs space-y-1 text-left" style={{ color: `${colors.text}88` }}>
                <li>· Previous progress saved — revealed as you rebuild</li>
                <li>· Minimal starting load</li>
                <li>· Guided path to get moving again</li>
              </ul>
            </div>
          )}

          <button
            onClick={handleStartRitual}
            className="mt-4 px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: theme.accent,
              color: "#fff",
              boxShadow: `0 4px 20px ${theme.accent}40`,
            }}
            data-testid="button-start-reset-ritual"
          >
            {data.resetRitual ? "Begin Reset Ritual" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onComplete}
            className="text-xs transition-colors"
            style={{ color: `${colors.text}44` }}
            data-testid="button-skip-return-protocol"
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  if (stage === "ritual" && ritualSteps[currentStepIndex]) {
    const step = ritualSteps[currentStepIndex];
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: colors.background }}
        data-testid="return-protocol-ritual"
      >
        <div className="flex flex-col items-center gap-3 max-w-sm w-full">
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: `${theme.accent}88` }}>
            Step {currentStepIndex + 1} of {ritualSteps.length}
          </p>
          <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
            {step.title}
          </h2>

          {step.type === "breathing" && (
            <BreathingExercise step={step} onDone={handleStepDone} />
          )}
          {step.type === "reflection" && (
            <ReflectionPrompt step={step} onDone={handleStepDone} />
          )}
          {step.type === "affirmation" && (
            <AffirmationStep step={step} onDone={handleStepDone} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: colors.background }}
      data-testid="return-protocol-summary"
    >
      <div className="flex flex-col items-center gap-5 max-w-sm text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
        >
          <Sparkles className="w-6 h-6" style={{ color: "#22c55e" }} />
        </div>

        <h2 className="text-lg font-bold" style={{ color: colors.text }}>
          {data.tier === "long" ? "Ready for a fresh start" : "Ready to continue"}
        </h2>

        <p className="text-xs leading-relaxed" style={{ color: `${colors.text}88` }}>
          {data.tier === "short" && "Rhythm restored. Your system is ready."}
          {data.tier === "extended" && "Simplified mode is active. Things will feel lighter for a while."}
          {data.tier === "long" && "One step at a time. Your path is clear."}
        </p>

        <button
          onClick={onComplete}
          className="mt-4 px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: "#22c55e",
            color: "#fff",
            boxShadow: "0 4px 20px rgba(34,197,94,0.3)",
          }}
          data-testid="button-complete-return-protocol"
        >
          Let's Go
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
