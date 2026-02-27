import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface Day4IntroFlowProps {
  visible: boolean;
  lastCompletionTime: string | null;
  onComplete: () => void;
  onSetReminder: (timeWindow: string) => void;
}

type Step = "reentry" | "insight";

export function Day4IntroFlow({ visible, lastCompletionTime, onComplete, onSetReminder }: Day4IntroFlowProps) {
  const [step, setStep] = useState<Step>("reentry");

  useEffect(() => {
    if (!visible) {
      setStep("reentry");
    }
  }, [visible]);

  if (!visible) return null;

  const timeWindow = lastCompletionTime ? detectTimeWindow(lastCompletionTime) : null;

  return (
    <div
      data-testid="day4-intro-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
    >
      <style>{`
        @keyframes d4FadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes d4FadeUp {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="flex flex-col items-center justify-center gap-6 px-8 max-w-sm w-full text-center"
        style={{ animation: "d4FadeIn 0.5s ease-out" }}
      >
        {step === "reentry" && (
          <div style={{ animation: "d4FadeIn 0.4s ease-out" }}>
            <p
              data-testid="d4-reentry-message"
              className="text-lg font-display font-medium leading-relaxed whitespace-pre-line"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              {"You're building a rhythm.\nSmall actions are becoming familiar."}
            </p>
            <button
              data-testid="button-d4-continue"
              onClick={() => setStep("insight")}
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

        {step === "insight" && (
          <div style={{ animation: "d4FadeIn 0.4s ease-out" }} className="w-full">
            <div
              className="rounded-xl px-5 py-5 mb-6"
              style={{
                backgroundColor: "rgba(147,197,253,0.05)",
                border: "1px solid rgba(147,197,253,0.10)",
              }}
            >
              <p
                data-testid="d4-insight-title"
                className="text-sm font-display mb-3"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                When did you complete your habit yesterday?
              </p>

              <div className="flex items-center justify-center gap-2.5 mb-1">
                <Clock size={16} style={{ color: "rgba(147,197,253,0.7)" }} />
                <p
                  data-testid="d4-completion-time"
                  className="text-base font-display font-medium"
                  style={{ color: "rgba(147,197,253,0.9)" }}
                >
                  {lastCompletionTime
                    ? `Yesterday around ${lastCompletionTime}`
                    : "We'll track this going forward"}
                </p>
              </div>
            </div>

            {lastCompletionTime && timeWindow && (
              <button
                data-testid="button-d4-set-reminder"
                onClick={() => {
                  onSetReminder(timeWindow);
                  onComplete();
                }}
                className="w-full py-3 px-4 rounded-xl text-sm font-display tracking-wide transition-all active:scale-[0.97] mb-3"
                style={{
                  backgroundColor: "rgba(147,197,253,0.08)",
                  border: "1px solid rgba(147,197,253,0.15)",
                  color: "rgba(147,197,253,0.8)",
                  animation: "d4FadeUp 0.3s ease-out 0.1s both",
                }}
              >
                Remind me around this time
              </button>
            )}

            <button
              data-testid="button-d4-dismiss"
              onClick={onComplete}
              className="w-full py-3 px-4 rounded-xl text-sm font-display tracking-wide transition-all active:scale-[0.97]"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.45)",
                animation: "d4FadeUp 0.3s ease-out 0.15s both",
              }}
            >
              Continue to today
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function detectTimeWindow(timeStr: string): string {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return "evening";
  let hour = parseInt(match[1]);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
