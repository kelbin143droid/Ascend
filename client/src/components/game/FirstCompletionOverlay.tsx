import { useState, useEffect } from "react";

interface FirstCompletionOverlayProps {
  visible: boolean;
  onClose: () => void;
  onboardingDay: number;
}

const DAY_MESSAGES: Record<number, { final: string; subtext: string; footer: string }> = {
  1: {
    final: "Day 1 complete.\nTomorrow becomes easier.",
    subtext: "Momentum started.",
    footer: "Next step unlocks tomorrow.",
  },
};

export function FirstCompletionOverlay({ visible, onClose, onboardingDay }: FirstCompletionOverlayProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!visible) {
      setPhase(0);
      return;
    }
    setPhase(1);
    const t2 = setTimeout(() => setPhase(2), 500);
    const t3 = setTimeout(() => setPhase(3), 2000);
    return () => { clearTimeout(t2); clearTimeout(t3); };
  }, [visible]);

  if (!visible || phase === 0) return null;

  const messages = DAY_MESSAGES[onboardingDay] || DAY_MESSAGES[1];

  return (
    <div
      data-testid="first-completion-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
    >
      <style>{`
        @keyframes fcGlow {
          0% { opacity: 0; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fcFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fcGlowRing {
          0%, 100% { box-shadow: 0 0 20px rgba(147,197,253,0.08); }
          50% { box-shadow: 0 0 40px rgba(147,197,253,0.18); }
        }
      `}</style>

      <div
        className="flex flex-col items-center justify-center gap-6 px-8 max-w-xs text-center"
        style={{ animation: "fcGlow 0.5s ease-out forwards" }}
      >
        <div
          className="w-16 h-16 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(147,197,253,0.15) 0%, transparent 70%)",
            animation: "fcGlowRing 3s ease-in-out infinite",
          }}
        />

        {phase === 1 && (
          <p
            data-testid="fc-phase-1"
            className="text-xl font-display font-medium tracking-wide"
            style={{ color: "rgba(255,255,255,0.9)", animation: "fcFadeIn 0.3s ease-out" }}
          >
            Completed.
          </p>
        )}

        {phase === 2 && (
          <p
            data-testid="fc-phase-2"
            className="text-lg font-display font-medium tracking-wide"
            style={{ color: "rgba(147,197,253,0.9)", animation: "fcFadeIn 0.4s ease-out" }}
          >
            {messages.subtext}
          </p>
        )}

        {phase === 3 && (
          <div style={{ animation: "fcFadeIn 0.5s ease-out" }}>
            <p
              data-testid="fc-phase-3"
              className="text-lg font-display font-medium leading-relaxed whitespace-pre-line"
              style={{ color: "rgba(255,255,255,0.92)" }}
            >
              {messages.final}
            </p>
            <p
              className="text-[11px] mt-4 tracking-wide"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {messages.footer}
            </p>

            <button
              data-testid="button-fc-return-home"
              onClick={onClose}
              className="mt-8 px-8 py-3 rounded-xl font-display text-sm uppercase tracking-[0.12em] transition-all active:scale-[0.97]"
              style={{
                backgroundColor: "rgba(147,197,253,0.12)",
                border: "1px solid rgba(147,197,253,0.2)",
                color: "rgba(147,197,253,0.9)",
                animation: "fcFadeIn 0.6s ease-out 0.2s both",
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
