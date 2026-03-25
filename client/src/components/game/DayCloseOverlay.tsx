import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageStageContext";

interface DayCloseOverlayProps {
  visible: boolean;
  onClose: () => void;
  onboardingDay: number;
}

const DAY_MESSAGES: Record<number, { phase1: string; phase2: string; footer: string; button: string }> = {
  1: {
    phase1: "Day 1 complete.",
    phase2: "Momentum started.\nWe'll continue tomorrow.",
    footer: "Your next step unlocks tomorrow.",
    button: "See you Day 2",
  },
  2: {
    phase1: "Day 2 complete.",
    phase2: "Consistency is building.\nYou showed up again.",
    footer: "Tomorrow strengthens the pattern.",
    button: "See you Day 3",
  },
  3: {
    phase1: "Day 3 complete.",
    phase2: "A hunter path is forming.\nThis is becoming yours.",
    footer: "Tomorrow brings new possibilities.",
    button: "See you Day 4",
  },
  4: {
    phase1: "Day 4 complete.",
    phase2: "Stability is growing.\nYou keep showing up.",
    footer: "Progress continues tomorrow.",
    button: "See you Day 5",
  },
  5: {
    phase1: "Day 5 complete.",
    phase2: "You're ready for more.\nGrowth expands naturally.",
    footer: "Tomorrow opens new ground.",
    button: "See you Day 6",
  },
  6: {
    phase1: "Momentum Activated",
    phase2: "You showed up again.\nThis is how change compounds.",
    footer: "One more day to complete the cycle.",
    button: "Return Home",
  },
  7: {
    phase1: "Step complete.",
    phase2: "You showed up.\nSee you tomorrow.",
    footer: "Your next step unlocks tomorrow.",
    button: "Return Home",
  },
};

export function DayCloseOverlay({ visible, onClose, onboardingDay }: DayCloseOverlayProps) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!visible) {
      setPhase(0);
      return;
    }
    setPhase(1);
    const t2 = setTimeout(() => setPhase(2), 1500);
    return () => { clearTimeout(t2); };
  }, [visible]);

  if (!visible || phase === 0) return null;

  const messages = DAY_MESSAGES[onboardingDay] || DAY_MESSAGES[1];

  return (
    <div
      data-testid="day-close-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
    >
      <style>{`
        @keyframes dcFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dcGlowRing {
          0%, 100% { box-shadow: 0 0 20px rgba(147,197,253,0.06); }
          50% { box-shadow: 0 0 35px rgba(147,197,253,0.14); }
        }
      `}</style>

      <div
        className="flex flex-col items-center justify-center gap-6 px-8 max-w-xs text-center"
        style={{ animation: "dcFadeIn 0.5s ease-out forwards" }}
      >
        <div
          className="w-14 h-14 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(147,197,253,0.12) 0%, transparent 70%)",
            animation: "dcGlowRing 3s ease-in-out infinite",
          }}
        />

        {phase === 1 && (
          <p
            data-testid="dc-phase-1"
            className="text-xl font-display font-medium tracking-wide"
            style={{ color: "rgba(255,255,255,0.9)", animation: "dcFadeIn 0.4s ease-out" }}
          >
            {t(messages.phase1)}
          </p>
        )}

        {phase === 2 && (
          <div style={{ animation: "dcFadeIn 0.5s ease-out" }}>
            <p
              data-testid="dc-phase-2"
              className="text-lg font-display font-medium leading-relaxed whitespace-pre-line"
              style={{ color: "rgba(255,255,255,0.88)" }}
            >
              {t(messages.phase2)}
            </p>
            <p
              className="text-[11px] mt-5 tracking-wide"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {t(messages.footer)}
            </p>

            <button
              data-testid="button-dc-close"
              onClick={onClose}
              className="mt-8 px-8 py-3 rounded-xl font-display text-sm tracking-[0.08em] transition-all active:scale-[0.97]"
              style={{
                backgroundColor: "rgba(147,197,253,0.10)",
                border: "1px solid rgba(147,197,253,0.18)",
                color: "rgba(147,197,253,0.85)",
                animation: "dcFadeIn 0.5s ease-out 0.2s both",
              }}
            >
              {t(messages.button)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
