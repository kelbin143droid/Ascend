import { useState, useEffect } from "react";

interface Day6RevealModalProps {
  visible: boolean;
  onContinue: () => void;
}

export function Day6RevealModal({ visible, onContinue }: Day6RevealModalProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!visible) {
      setPhase(0);
      return;
    }
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visible]);

  if (!visible || phase === 0) return null;

  return (
    <div
      data-testid="day6-reveal-modal"
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
    >
      <style>{`
        @keyframes d6FadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes d6TextFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="w-full max-w-sm rounded-2xl px-6 py-8 text-center"
        style={{
          backgroundColor: "rgba(15,23,42,0.95)",
          border: "1px solid rgba(147,197,253,0.1)",
          animation: "d6FadeIn 0.6s ease-out",
        }}
      >
        <div
          className="w-10 h-10 rounded-full mx-auto mb-5 flex items-center justify-center"
          style={{
            backgroundColor: "rgba(59,130,246,0.12)",
            border: "1px solid rgba(59,130,246,0.2)",
          }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "rgba(59,130,246,0.6)" }}
          />
        </div>

        <h2
          data-testid="text-day6-reveal-title"
          className="text-lg font-display font-bold mb-4 leading-snug"
          style={{
            color: "rgba(255,255,255,0.95)",
            animation: "d6TextFade 0.5s ease-out 0.3s both",
          }}
        >
          Your Progress Was Never Invisible.
        </h2>

        {phase >= 2 && (
          <div style={{ animation: "d6TextFade 0.6s ease-out" }}>
            <p
              className="text-sm leading-relaxed mb-2"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              For the past days, every small action has been building momentum.
            </p>
            <p
              className="text-sm leading-relaxed mb-2"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              Consistency creates change before you notice it.
            </p>
            <p
              className="text-sm leading-relaxed mb-6 font-medium"
              style={{ color: "rgba(147,197,253,0.8)" }}
            >
              Today, you unlock deeper insight into your growth.
            </p>

            <button
              data-testid="button-day6-continue"
              onClick={onContinue}
              className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
              style={{
                backgroundColor: "rgba(59,130,246,0.15)",
                color: "rgba(147,197,253,0.9)",
                border: "1px solid rgba(59,130,246,0.25)",
              }}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
