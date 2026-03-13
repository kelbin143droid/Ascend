import { useState, useEffect } from "react";

interface Day3IntroFlowProps {
  visible: boolean;
  onComplete: (choice: "repeat" | "different") => void;
  lastHabitName?: string;
}

type Step = "reentry" | "reflection" | "response" | "choice";
type ReflectionOption = "easier" | "same" | "hard" | "almost-skipped";

const REFLECTION_OPTIONS: { id: ReflectionOption; label: string }[] = [
  { id: "easier", label: "Easier" },
  { id: "same", label: "Same" },
  { id: "hard", label: "Hard" },
  { id: "almost-skipped", label: "I almost skipped" },
];

const ADAPTIVE_RESPONSES: Record<ReflectionOption, string> = {
  "easier": "Your brain is adapting.",
  "same": "Consistency builds quietly.",
  "hard": "Effort means growth is starting.",
  "almost-skipped": "Showing up builds resilience.",
};

export function Day3IntroFlow({ visible, onComplete, lastHabitName }: Day3IntroFlowProps) {
  const [step, setStep] = useState<Step>("reentry");
  const [reflectionChoice, setReflectionChoice] = useState<ReflectionOption | null>(null);

  useEffect(() => {
    if (!visible) {
      setStep("reentry");
      setReflectionChoice(null);
    }
  }, [visible]);

  useEffect(() => {
    if (step === "response" && reflectionChoice) {
      const stored = JSON.parse(localStorage.getItem("ascend_reflections") || "[]");
      stored.push({ day: 3, response: reflectionChoice, date: new Date().toISOString().split("T")[0] });
      localStorage.setItem("ascend_reflections", JSON.stringify(stored));

      const timer = setTimeout(() => setStep("choice"), 2000);
      return () => clearTimeout(timer);
    }
  }, [step, reflectionChoice]);

  if (!visible) return null;

  const handleReflectionSelect = (option: ReflectionOption) => {
    setReflectionChoice(option);
    setStep("response");
  };

  return (
    <div
      data-testid="day3-intro-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
    >
      <style>{`
        @keyframes d3FadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes d3FadeUp {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="flex flex-col items-center justify-center gap-6 px-8 max-w-sm w-full text-center"
        style={{ animation: "d3FadeIn 0.5s ease-out" }}
      >
        {step === "reentry" && (
          <div style={{ animation: "d3FadeIn 0.4s ease-out" }}>
            <p
              data-testid="d3-reentry-message"
              className="text-lg font-display font-medium leading-relaxed whitespace-pre-line"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              {"You're building consistency.\nThree days in a row changes patterns."}
            </p>
            <button
              data-testid="button-d3-continue"
              onClick={() => setStep("reflection")}
              className="mt-8 px-8 py-3 rounded-xl font-display text-sm tracking-[0.08em] transition-all active:scale-[0.97]"
              style={{
                backgroundColor: "rgba(147,197,253,0.10)",
                border: "1px solid rgba(147,197,253,0.18)",
                color: "rgba(147,197,253,0.85)",
              }}
            >
              Continue
            </button>
          </div>
        )}

        {step === "reflection" && (
          <div style={{ animation: "d3FadeIn 0.4s ease-out" }}>
            <p
              data-testid="d3-reflection-question"
              className="text-lg font-display font-medium mb-6"
              style={{ color: "rgba(255,255,255,0.88)" }}
            >
              How did yesterday feel?
            </p>
            <div className="flex flex-col gap-2.5 w-full">
              {REFLECTION_OPTIONS.map((option, i) => (
                <button
                  key={option.id}
                  data-testid={`button-reflection-${option.id}`}
                  onClick={() => handleReflectionSelect(option.id)}
                  className="w-full py-3 px-4 rounded-xl text-sm font-display tracking-wide transition-all active:scale-[0.97]"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.7)",
                    animation: `d3FadeUp 0.3s ease-out ${i * 0.08}s both`,
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "response" && reflectionChoice && (
          <div style={{ animation: "d3FadeIn 0.4s ease-out" }}>
            <p
              data-testid="d3-adaptive-response"
              className="text-lg font-display font-medium"
              style={{ color: "rgba(147,197,253,0.9)" }}
            >
              {ADAPTIVE_RESPONSES[reflectionChoice]}
            </p>
          </div>
        )}

        {step === "choice" && (
          <div style={{ animation: "d3FadeIn 0.4s ease-out" }}>
            <p
              data-testid="d3-choice-title"
              className="text-lg font-display font-medium mb-6"
              style={{ color: "rgba(255,255,255,0.88)" }}
            >
              Choose today's focus
            </p>
            <div className="flex flex-col gap-3 w-full">
              <button
                data-testid="button-choice-repeat"
                onClick={() => onComplete("repeat")}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-display tracking-wide transition-all active:scale-[0.97]"
                style={{
                  backgroundColor: "rgba(147,197,253,0.10)",
                  border: "1px solid rgba(147,197,253,0.22)",
                  color: "rgba(147,197,253,0.9)",
                }}
              >
                {lastHabitName ? `Repeat ${lastHabitName}` : "Repeat yesterday's practice"}
                <span
                  className="block text-[10px] mt-0.5 tracking-wider"
                  style={{ color: "rgba(147,197,253,0.5)" }}
                >
                  Recommended
                </span>
              </button>
              <button
                data-testid="button-choice-different"
                onClick={() => onComplete("different")}
                className="w-full py-3 px-4 rounded-xl text-sm font-display tracking-wide transition-all active:scale-[0.97]"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                Try a different micro habit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
