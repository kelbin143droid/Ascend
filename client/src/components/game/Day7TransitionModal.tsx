import { useState, useEffect } from "react";

interface Day7TransitionModalProps {
  visible: boolean;
  onContinue: () => void;
}

export function Day7TransitionModal({ visible, onContinue }: Day7TransitionModalProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!visible) {
      setPhase(0);
      return;
    }
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visible]);

  if (!visible || phase === 0) return null;

  return (
    <div
      data-testid="day7-transition-modal"
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ backgroundColor: "rgba(0,0,0,0.94)" }}
    >
      <style>{`
        @keyframes d7FadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes d7TextFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes d7GlowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(147,197,253,0.08); }
          50% { box-shadow: 0 0 40px rgba(147,197,253,0.18); }
        }
      `}</style>

      <div
        className="w-full max-w-sm rounded-2xl px-6 py-10 text-center"
        style={{
          backgroundColor: "rgba(15,23,42,0.95)",
          border: "1px solid rgba(147,197,253,0.12)",
          animation: "d7FadeIn 0.8s ease-out",
        }}
      >
        <div
          className="w-12 h-12 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{
            backgroundColor: "rgba(59,130,246,0.10)",
            border: "1px solid rgba(59,130,246,0.2)",
            animation: "d7GlowPulse 3s ease-in-out infinite",
          }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: "rgba(59,130,246,0.7)" }}
          />
        </div>

        <h2
          data-testid="text-day7-title"
          className="text-xl font-display font-bold mb-6 tracking-wide"
          style={{
            color: "rgba(255,255,255,0.95)",
            animation: "d7TextFade 0.6s ease-out 0.3s both",
          }}
        >
          You Have Begun.
        </h2>

        {phase >= 2 && (
          <div style={{ animation: "d7TextFade 0.7s ease-out" }}>
            <p
              className="text-sm leading-[1.8] mb-2 whitespace-pre-line"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              For seven days, you showed up.{"\n"}Small actions repeated become identity.
            </p>
            <p
              className="text-sm leading-[1.8] mb-8 font-medium whitespace-pre-line"
              style={{ color: "rgba(147,197,253,0.85)" }}
            >
              You are no longer starting —{"\n"}you are now training.
            </p>

            <button
              data-testid="button-enter-training"
              onClick={onContinue}
              className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
              style={{
                backgroundColor: "rgba(59,130,246,0.15)",
                color: "rgba(147,197,253,0.9)",
                border: "1px solid rgba(59,130,246,0.25)",
              }}
            >
              Enter Training Mode
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
