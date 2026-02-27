import { useState } from "react";
import { Clock } from "lucide-react";

interface ReminderPromptProps {
  visible: boolean;
  onSelect: (preference: string) => void;
  onDismiss: () => void;
}

const OPTIONS = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
  { id: "not-now", label: "Not now" },
];

export function ReminderPrompt({ visible, onSelect, onDismiss }: ReminderPromptProps) {
  if (!visible) return null;

  return (
    <div
      data-testid="reminder-prompt-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
    >
      <style>{`
        @keyframes rpFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rpFadeUp {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="flex flex-col items-center gap-6 px-8 max-w-sm w-full text-center"
        style={{ animation: "rpFadeIn 0.5s ease-out" }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(147,197,253,0.08)" }}
        >
          <Clock size={20} style={{ color: "rgba(147,197,253,0.7)" }} />
        </div>

        <p
          data-testid="reminder-prompt-question"
          className="text-lg font-display font-medium leading-relaxed"
          style={{ color: "rgba(255,255,255,0.88)" }}
        >
          Would you like a gentle reminder tomorrow?
        </p>

        <div className="flex flex-col gap-2.5 w-full">
          {OPTIONS.map((option, i) => (
            <button
              key={option.id}
              data-testid={`button-reminder-${option.id}`}
              onClick={() => {
                if (option.id === "not-now") {
                  onDismiss();
                } else {
                  onSelect(option.id);
                }
              }}
              className="w-full py-3 px-4 rounded-xl text-sm font-display tracking-wide transition-all active:scale-[0.97]"
              style={{
                backgroundColor: option.id === "not-now" ? "rgba(255,255,255,0.03)" : "rgba(147,197,253,0.06)",
                border: `1px solid ${option.id === "not-now" ? "rgba(255,255,255,0.06)" : "rgba(147,197,253,0.12)"}`,
                color: option.id === "not-now" ? "rgba(255,255,255,0.45)" : "rgba(147,197,253,0.8)",
                animation: `rpFadeUp 0.3s ease-out ${i * 0.06}s both`,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
