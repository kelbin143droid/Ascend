import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { Dumbbell, Wind, Brain, Moon, Play, Timer, ChevronRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrainingCategory {
  id: string;
  stat: string;
  label: string;
  subtitle: string;
  icon: typeof Dumbbell;
  color: string;
  quickActions: { label: string; duration: number }[];
}

const CATEGORIES: TrainingCategory[] = [
  {
    id: "strength",
    stat: "strength",
    label: "Strength",
    subtitle: "Physical power & discipline",
    icon: Dumbbell,
    color: "#ef4444",
    quickActions: [
      { label: "Quick Set", duration: 3 },
      { label: "Standard", duration: 10 },
      { label: "Full Session", duration: 20 },
    ],
  },
  {
    id: "agility",
    stat: "agility",
    label: "Agility",
    subtitle: "Speed & coordination",
    icon: Wind,
    color: "#22c55e",
    quickActions: [
      { label: "Warm Up", duration: 3 },
      { label: "Drill", duration: 10 },
      { label: "Full Session", duration: 20 },
    ],
  },
  {
    id: "meditation",
    stat: "sense",
    label: "Meditation",
    subtitle: "Focus & awareness",
    icon: Brain,
    color: "#3b82f6",
    quickActions: [
      { label: "Breathe", duration: 3 },
      { label: "Meditate", duration: 10 },
      { label: "Deep Focus", duration: 20 },
    ],
  },
  {
    id: "recovery",
    stat: "vitality",
    label: "Night Recovery",
    subtitle: "Rest & regeneration",
    icon: Moon,
    color: "#f59e0b",
    quickActions: [
      { label: "Wind Down", duration: 5 },
      { label: "Routine", duration: 15 },
      { label: "Full Recovery", duration: 30 },
    ],
  },
];

export default function TrainPage() {
  const { player, activeSession, startSession } = useGame();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const { data: homeData } = useQuery<{ onboardingDay: number; isOnboardingComplete: boolean }>({
    queryKey: ["home", player?.id],
    queryFn: async () => {
      if (!player?.id) throw new Error("No player");
      const res = await fetch(`/api/player/${player.id}/home`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!player?.id,
    staleTime: 30000,
  });

  const isTrainingMode = (homeData?.onboardingDay ?? 1) >= 7 || homeData?.isOnboardingComplete;

  const handleQuickStart = (stat: string, duration: number) => {
    startSession(stat, duration);
  };

  const toggleCategory = (id: string) => {
    setExpandedCategory(expandedCategory === id ? null : id);
  };

  return (
    <SystemLayout>
      <div className="p-4 space-y-6 max-w-4xl mx-auto pb-24">
        <div className="flex items-center gap-3 mb-2">
          <Dumbbell className="w-5 h-5" style={{ color: colors.primary }} />
          <h1
            className="text-lg font-bold font-orbitron tracking-wide"
            style={{ color: colors.text }}
            data-testid="text-train-title"
          >
            Training
          </h1>
          {isTrainingMode && (
            <button
              data-testid="button-train-tooltip"
              onClick={() => setShowTooltip(!showTooltip)}
              className="ml-auto"
            >
              <Info size={16} style={{ color: colors.textMuted }} />
            </button>
          )}
        </div>

        {showTooltip && (
          <div
            data-testid="train-tooltip"
            className="rounded-lg px-4 py-3"
            style={{
              backgroundColor: `${colors.primary}08`,
              border: `1px solid ${colors.primary}15`,
            }}
          >
            <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>
              Train stats through real-world actions. Each category maps to habits you complete in daily life.
            </p>
          </div>
        )}

        {activeSession && (
          <div
            className="rounded-lg p-4 flex items-center gap-3"
            style={{
              backgroundColor: `${colors.primary}15`,
              border: `1px solid ${colors.primary}40`,
            }}
            data-testid="card-active-session"
          >
            <Timer className="w-5 h-5 animate-pulse" style={{ color: colors.primary }} />
            <div className="flex-1">
              <div className="text-sm font-bold" style={{ color: colors.text }}>
                Session Active: {activeSession.stat.toUpperCase()}
              </div>
              <div className="text-xs" style={{ color: colors.textMuted }}>
                {activeSession.scheduledDuration} min scheduled
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {CATEGORIES.map((cat) => {
            const isExpanded = expandedCategory === cat.id;
            return (
              <div
                key={cat.id}
                className="rounded-lg overflow-hidden transition-all duration-300"
                style={{
                  backgroundColor: `${colors.background}cc`,
                  border: `1px solid ${isExpanded ? cat.color + "60" : colors.surfaceBorder}`,
                  boxShadow: isExpanded ? `0 0 20px ${cat.color}20` : "none",
                }}
                data-testid={`card-train-${cat.id}`}
              >
                <button
                  className="w-full p-4 flex items-center gap-4 transition-all"
                  onClick={() => toggleCategory(cat.id)}
                  data-testid={`button-toggle-${cat.id}`}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${cat.color}20`,
                      border: `1px solid ${cat.color}40`,
                    }}
                  >
                    <cat.icon size={24} style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-base font-bold" style={{ color: colors.text }}>
                      {cat.label}
                    </div>
                    <div className="text-xs" style={{ color: colors.textMuted }}>
                      {cat.subtitle}
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className={cn("transition-transform duration-300", isExpanded && "rotate-90")}
                    style={{ color: colors.textMuted }}
                  />
                </button>

                {isExpanded && (
                  <div
                    className="px-4 pb-4 pt-1 flex gap-2"
                    data-testid={`actions-${cat.id}`}
                  >
                    {cat.quickActions.map((action) => (
                      <button
                        key={action.label}
                        className="flex-1 rounded-lg p-3 flex flex-col items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          border: `1px solid ${cat.color}30`,
                        }}
                        onClick={() => handleQuickStart(cat.stat, action.duration)}
                        disabled={!!activeSession}
                        data-testid={`button-start-${cat.id}-${action.duration}`}
                      >
                        <Play size={16} style={{ color: cat.color }} />
                        <span className="text-xs font-bold" style={{ color: colors.text }}>
                          {action.label}
                        </span>
                        <span className="text-[10px]" style={{ color: colors.textMuted }}>
                          {action.duration} min
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {player && (
          <div
            className="rounded-lg p-4"
            style={{
              backgroundColor: `${colors.background}cc`,
              border: `1px solid ${colors.surfaceBorder}`,
            }}
            data-testid="card-stat-overview"
          >
            <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colors.textMuted }}>
              Current Stats
            </div>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const statValue = (player.displayStats as any)?.[cat.stat] ?? (player.stats as any)?.[cat.stat] ?? 0;
                return (
                  <div key={cat.id} className="text-center">
                    <div className="text-lg font-bold" style={{ color: cat.color }} data-testid={`text-stat-${cat.stat}`}>
                      {statValue}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>
                      {cat.stat.slice(0, 3)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </SystemLayout>
  );
}