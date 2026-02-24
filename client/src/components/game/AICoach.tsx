import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { Brain, Sparkles, X, Clock, Smile, Frown, Meh, Heart, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoachMessage {
  type: "celebration" | "warning" | "suggestion" | "motivation" | "check_in";
  title: string;
  message: string;
  priority: number;
}

interface HabitSuggestion {
  habitId: string;
  habitName: string;
  suggested: number;
  reason: string;
}

interface CoachData {
  messages: CoachMessage[];
  nudge: string;
  habitSuggestions: HabitSuggestion[];
}

const typeColors: Record<string, string> = {
  celebration: "#22c55e",
  warning: "#f59e0b",
  suggestion: "#3b82f6",
  motivation: "#a855f7",
  check_in: "#6b7280",
};

const moodEmojis = [
  { icon: Zap, label: "Energized", value: "energized" },
  { icon: Smile, label: "Happy", value: "happy" },
  { icon: Meh, label: "Okay", value: "okay" },
  { icon: Frown, label: "Low", value: "low" },
  { icon: Heart, label: "Grateful", value: "grateful" },
];

export function AICoach() {
  const { player } = useGame();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const { data: coachData, isLoading } = useQuery<CoachData>({
    queryKey: ["/api/player", player?.id, "coach"],
    queryFn: async () => {
      if (!player?.id) throw new Error("No player");
      const res = await fetch(`/api/player/${player.id}/coach`);
      if (!res.ok) throw new Error("Failed to fetch coach data");
      return res.json();
    },
    enabled: !!player?.id,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  const hasNewSuggestions = coachData && (coachData.messages.length > 0 || coachData.habitSuggestions.length > 0);
  const topMessage = coachData?.messages?.sort((a, b) => b.priority - a.priority)[0];

  if (!player) return null;

  return (
    <>
      <button
        data-testid="button-ai-coach"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
          hasNewSuggestions && !isOpen && "animate-pulse"
        )}
        style={{
          backgroundColor: colors.primary,
          boxShadow: `0 0 20px ${colors.primaryGlow}, 0 0 40px ${colors.primaryGlow}40`,
          border: `2px solid ${colors.surfaceBorder}`,
        }}
      >
        {isOpen ? (
          <X size={20} style={{ color: colors.background }} />
        ) : (
          <Brain size={20} style={{ color: colors.background }} />
        )}
      </button>

      {isOpen && (
        <div
          data-testid="panel-ai-coach"
          className="fixed bottom-[6.5rem] right-4 z-40 w-80 max-h-[70vh] overflow-y-auto rounded-lg backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300"
          style={{
            backgroundColor: `${colors.background}ee`,
            border: `1px solid ${colors.surfaceBorder}`,
            boxShadow: `0 0 30px ${colors.primaryGlow}30`,
          }}
        >
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} style={{ color: colors.primary }} />
              <span
                className="text-xs font-display font-bold tracking-widest uppercase"
                style={{ color: colors.primary }}
              >
                AI Coach
              </span>
            </div>

            {isLoading && (
              <div data-testid="text-coach-loading" className="text-center py-4 text-sm" style={{ color: colors.textMuted }}>
                Analyzing your progress...
              </div>
            )}

            {topMessage && (
              <div
                data-testid="card-coach-message"
                className="rounded-md p-3"
                style={{
                  backgroundColor: `${typeColors[topMessage.type]}15`,
                  borderLeft: `3px solid ${typeColors[topMessage.type]}`,
                }}
              >
                <div
                  className="text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: typeColors[topMessage.type] }}
                >
                  {topMessage.title}
                </div>
                <div className="text-sm" style={{ color: colors.text }}>
                  {topMessage.message}
                </div>
              </div>
            )}

            {coachData?.nudge && (
              <div data-testid="card-nudge" className="rounded-md p-3" style={{ backgroundColor: `${colors.primary}10`, border: `1px solid ${colors.surfaceBorder}` }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.primary }}>
                  Nudge of the Day
                </div>
                <div className="text-sm italic" style={{ color: colors.textMuted }}>
                  "{coachData.nudge}"
                </div>
              </div>
            )}

            {coachData?.habitSuggestions && coachData.habitSuggestions.length > 0 && (
              <div data-testid="section-habit-suggestions">
                <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: colors.textMuted }}>
                  Habit Suggestions
                </div>
                <div className="space-y-2">
                  {coachData.habitSuggestions.map((s) => (
                    <div
                      key={s.habitId}
                      data-testid={`card-habit-suggestion-${s.habitId}`}
                      className="rounded-md p-2 flex items-start gap-2"
                      style={{ backgroundColor: `${colors.primary}08`, border: `1px solid ${colors.surfaceBorder}` }}
                    >
                      <Clock size={14} className="mt-0.5 shrink-0" style={{ color: colors.primary }} />
                      <div>
                        <div className="text-sm font-semibold" style={{ color: colors.text }}>
                          {s.habitName}
                        </div>
                        <div className="text-xs" style={{ color: colors.textMuted }}>
                          {s.suggested} min · {s.reason}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div data-testid="section-emotional-checkin" className="rounded-md p-3" style={{ backgroundColor: `${colors.primary}08`, border: `1px solid ${colors.surfaceBorder}` }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: colors.textMuted }}>
                How are you feeling?
              </div>
              <div className="flex justify-between gap-1">
                {moodEmojis.map((mood) => (
                  <button
                    key={mood.value}
                    data-testid={`button-mood-${mood.value}`}
                    onClick={() => setSelectedMood(mood.value)}
                    className="flex flex-col items-center gap-1 p-2 rounded-md transition-all"
                    style={{
                      backgroundColor: selectedMood === mood.value ? `${colors.primary}25` : "transparent",
                      border: selectedMood === mood.value ? `1px solid ${colors.primary}` : "1px solid transparent",
                    }}
                  >
                    <mood.icon size={18} style={{ color: selectedMood === mood.value ? colors.primary : colors.textMuted }} />
                    <span className="text-[9px]" style={{ color: colors.textMuted }}>{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
