import { useState, useEffect, useRef } from "react";
import { Droplets, Wind } from "lucide-react";

interface Day5ExpansionOverlayProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onSessionComplete: () => void;
}

type Step = "ask" | "choose" | "session" | "complete";
type MicroTask = "drink-water" | "breathing-reset";

const MICRO_TASKS = [
  { id: "drink-water" as MicroTask, label: "Drink Water", duration: "30 seconds", icon: Droplets, seconds: 30 },
  { id: "breathing-reset" as MicroTask, label: "1-Minute Breathing Reset", duration: "1 minute", icon: Wind, seconds: 60 },
];

const BREATHING_PHASES = [
  { label: "Inhale", duration: 4000 },
  { label: "Hold", duration: 2000 },
  { label: "Exhale", duration: 4000 },
];

export function Day5ExpansionOverlay({ visible, onComplete, onSkip, onSessionComplete }: Day5ExpansionOverlayProps) {
  const [step, setStep] = useState<Step>("ask");
  const [selectedTask, setSelectedTask] = useState<MicroTask | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      setStep("ask");
      setSelectedTask(null);
      setElapsed(0);
    }
  }, [visible]);

  useEffect(() => {
    if (step !== "session" || !selectedTask) return;

    const task = MICRO_TASKS.find(t => t.id === selectedTask);
    if (!task) return;

    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= task.seconds) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimeout(() => {
            onSessionComplete();
            setStep("complete");
          }, 300);
          return task.seconds;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [step, selectedTask]);

  if (!visible) return null;

  const handleSelectTask = (taskId: MicroTask) => {
    setSelectedTask(taskId);
    setElapsed(0);
    if (taskId === "drink-water") {
      setStep("session");
    } else {
      setStep("session");
    }
  };

  const handleWaterDone = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    onSessionComplete();
    setStep("complete");
  };

  const task = selectedTask ? MICRO_TASKS.find(t => t.id === selectedTask) : null;

  return (
    <div
      data-testid="day5-expansion-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.90)" }}
    >
      <style>{`
        @keyframes d5xFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes d5xFadeUp {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes d5xBreathePulse {
          0%, 100% { transform: scale(0.7); }
          40% { transform: scale(1); }
          60% { transform: scale(1); }
        }
      `}</style>

      <div
        className="flex flex-col items-center justify-center gap-6 px-8 max-w-sm w-full text-center"
        style={{ animation: "d5xFadeIn 0.5s ease-out" }}
      >
        {step === "ask" && (
          <div style={{ animation: "d5xFadeIn 0.4s ease-out" }} className="w-full">
            <p
              data-testid="d5-expansion-question"
              className="text-lg font-display font-medium leading-relaxed mb-8"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              Would you like to add one more small step today?
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                data-testid="button-d5-yes"
                onClick={() => setStep("choose")}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-display tracking-wide transition-all active:scale-[0.97]"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.65)",
                  animation: "d5xFadeUp 0.3s ease-out 0.05s both",
                }}
              >
                Yes, something small
              </button>
              <button
                data-testid="button-d5-maybe-tomorrow"
                onClick={onSkip}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-display tracking-wide transition-all active:scale-[0.97]"
                style={{
                  backgroundColor: "rgba(147,197,253,0.08)",
                  border: "1px solid rgba(147,197,253,0.15)",
                  color: "rgba(147,197,253,0.8)",
                  animation: "d5xFadeUp 0.3s ease-out 0.1s both",
                }}
              >
                Maybe tomorrow
              </button>
            </div>
          </div>
        )}

        {step === "choose" && (
          <div style={{ animation: "d5xFadeIn 0.4s ease-out" }} className="w-full">
            <p
              data-testid="d5-choose-title"
              className="text-sm font-display mb-6"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Pick one small action
            </p>

            <div className="flex flex-col gap-3 w-full">
              {MICRO_TASKS.map((t, i) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    data-testid={`button-d5-task-${t.id}`}
                    onClick={() => handleSelectTask(t.id)}
                    className="w-full py-4 px-5 rounded-xl flex items-center gap-4 text-left transition-all active:scale-[0.97]"
                    style={{
                      backgroundColor: "rgba(147,197,253,0.05)",
                      border: "1px solid rgba(147,197,253,0.10)",
                      animation: `d5xFadeUp 0.3s ease-out ${i * 0.06}s both`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "rgba(147,197,253,0.08)" }}
                    >
                      <Icon size={18} style={{ color: "rgba(147,197,253,0.7)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-display font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
                        {t.label}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {t.duration}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === "session" && task && (
          <div style={{ animation: "d5xFadeIn 0.4s ease-out" }} className="w-full flex flex-col items-center gap-6">
            {selectedTask === "drink-water" ? (
              <DrinkWaterSession elapsed={elapsed} total={task.seconds} onDone={handleWaterDone} />
            ) : (
              <BreathingResetSession elapsed={elapsed} total={task.seconds} />
            )}
          </div>
        )}

        {step === "complete" && (
          <div style={{ animation: "d5xFadeIn 0.5s ease-out" }} className="w-full flex flex-col items-center gap-6">
            <div
              className="w-14 h-14 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(147,197,253,0.15) 0%, transparent 70%)",
              }}
            />
            <p
              data-testid="d5-expansion-complete"
              className="text-lg font-display font-medium"
              style={{ color: "rgba(147,197,253,0.9)" }}
            >
              You expanded your momentum today.
            </p>
            <button
              data-testid="button-d5-done"
              onClick={onComplete}
              className="mt-4 px-8 py-3 rounded-xl font-display text-sm tracking-[0.08em] transition-all active:scale-[0.97]"
              style={{
                backgroundColor: "rgba(147,197,253,0.10)",
                border: "1px solid rgba(147,197,253,0.18)",
                color: "rgba(147,197,253,0.85)",
              }}
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DrinkWaterSession({ elapsed, total, onDone }: { elapsed: number; total: number; onDone: () => void }) {
  const remaining = Math.max(0, total - elapsed);

  return (
    <>
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "rgba(147,197,253,0.08)" }}
      >
        <Droplets size={28} style={{ color: "rgba(147,197,253,0.7)" }} />
      </div>
      <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
        Take a slow drink of water.
      </p>
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
        {remaining}s remaining
      </p>
      <button
        data-testid="button-d5-water-done"
        onClick={onDone}
        className="mt-2 px-6 py-2.5 rounded-xl font-display text-sm transition-all active:scale-[0.97]"
        style={{
          backgroundColor: "rgba(147,197,253,0.08)",
          border: "1px solid rgba(147,197,253,0.12)",
          color: "rgba(147,197,253,0.7)",
        }}
      >
        Done
      </button>
    </>
  );
}

function BreathingResetSession({ elapsed, total }: { elapsed: number; total: number }) {
  const cycleLength = BREATHING_PHASES.reduce((s, p) => s + p.duration, 0);
  const posInCycle = (elapsed * 1000) % cycleLength;
  const remaining = Math.max(0, total - elapsed);

  let currentPhase = BREATHING_PHASES[0];
  let cumulative = 0;
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
    ? 0.65 + 0.35 * phaseProgress
    : currentPhase.label === "Exhale"
      ? 1.0 - 0.35 * phaseProgress
      : 1.0;

  return (
    <>
      <div
        className="w-24 h-24 rounded-full transition-transform"
        style={{
          transform: `scale(${scale})`,
          transitionDuration: "200ms",
          background: "radial-gradient(circle, rgba(147,197,253,0.15) 0%, rgba(147,197,253,0.04) 60%, transparent 100%)",
          border: "2px solid rgba(147,197,253,0.18)",
        }}
      />
      <p
        data-testid="d5-breathing-phase"
        className="text-lg font-display font-medium tracking-wider"
        style={{ color: "rgba(147,197,253,0.8)" }}
      >
        {currentPhase.label}
      </p>
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
        {remaining}s remaining
      </p>
    </>
  );
}
