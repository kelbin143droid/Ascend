import { useState, useEffect } from "react";

interface Day5IntroFlowProps {
  visible: boolean;
  onComplete: () => void;
}

export function Day5IntroFlow({ visible, onComplete }: Day5IntroFlowProps) {
  if (!visible) return null;

  return (
    <div
      data-testid="day5-intro-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
    >
      <style>{`
        @keyframes d5FadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="flex flex-col items-center justify-center gap-6 px-8 max-w-sm w-full text-center"
        style={{ animation: "d5FadeIn 0.5s ease-out" }}
      >
        <p
          data-testid="d5-reentry-message"
          className="text-lg font-display font-medium leading-relaxed whitespace-pre-line"
          style={{ color: "rgba(255,255,255,0.9)" }}
        >
          {"You're building momentum.\nSmall actions are becoming easier."}
        </p>
        <button
          data-testid="button-d5-continue"
          onClick={onComplete}
          className="mt-4 px-8 py-3 rounded-xl font-display text-sm tracking-[0.08em] transition-all active:scale-[0.97]"
          style={{
            backgroundColor: "rgba(147,197,253,0.10)",
            border: "1px solid rgba(147,197,253,0.18)",
            color: "rgba(147,197,253,0.85)",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
