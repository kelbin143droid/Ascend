import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageStageContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { GuidedActivityEngine } from "@/components/game/GuidedActivityEngine";
import { buildPhase1Activities, type ActivityDefinition } from "@/lib/activityEngine";
import { Dumbbell, Wind, Brain, Heart, Play, CheckCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_ICONS: Record<string, typeof Dumbbell> = {
  strength: Dumbbell,
  agility: Wind,
  meditation: Brain,
  vitality: Heart,
};

export default function TrainPage() {
  const { player } = useGame();
  const { backgroundTheme } = useTheme();
  const { t } = useLanguage();
  const colors = backgroundTheme.colors;
  const [activeActivity, setActiveActivity] = useState<ActivityDefinition | null>(null);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());

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

  const dayNumber = homeData?.onboardingDay ?? 1;
  const activities = buildPhase1Activities(dayNumber);
  const totalTime = activities.reduce((sum, a) => sum + a.duration, 0);
  const totalMins = Math.ceil(totalTime / 60);

  const handleActivityComplete = (activityId: string) => {
    setCompletedToday((prev) => new Set(prev).add(activityId));
    setActiveActivity(null);
  };

  const allComplete = completedToday.size === activities.length;

  return (
    <SystemLayout>
      <AnimatePresence>
        {activeActivity && player && (
          <GuidedActivityEngine
            activity={activeActivity}
            playerId={player.id}
            onComplete={() => handleActivityComplete(activeActivity.id)}
            onCancel={() => setActiveActivity(null)}
          />
        )}
      </AnimatePresence>

      <div className="p-4 space-y-5 max-w-4xl mx-auto pb-24">
        <div className="flex items-center gap-3 mb-1">
          <Dumbbell className="w-5 h-5" style={{ color: colors.primary }} />
          <h1
            className="text-lg font-bold font-orbitron tracking-wide"
            style={{ color: colors.text }}
            data-testid="text-train-title"
          >
            {t("Daily Training")}
          </h1>
        </div>

        <div
          className="rounded-lg px-4 py-3"
          style={{
            backgroundColor: `${colors.primary}08`,
            border: `1px solid ${colors.primary}15`,
          }}
        >
          <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>
            Phase 1 — Build consistency with small daily rituals. Complete all 4 activities (~{totalMins} min total).
          </p>
        </div>

        {allComplete && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg p-4 text-center"
            style={{
              backgroundColor: "#22c55e15",
              border: "1px solid #22c55e40",
            }}
            data-testid="card-all-complete"
          >
            <CheckCircle2 className="mx-auto mb-2" size={28} style={{ color: "#22c55e" }} />
            <div className="text-sm font-bold" style={{ color: colors.text }}>
              All training complete for today!
            </div>
            <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
              Come back tomorrow to continue building your rhythm.
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          {activities.map((activity) => {
            const isDone = completedToday.has(activity.id);
            const actMins = Math.ceil(activity.duration / 60);
            const Icon = CATEGORY_ICONS[activity.category] || Dumbbell;
            const stepsWithoutCompletion = activity.steps.filter((s) => s.type !== "completion");

            return (
              <div
                key={activity.id}
                className={`rounded-lg overflow-hidden transition-all duration-300 ${isDone ? "opacity-60" : ""}`}
                style={{
                  backgroundColor: `${colors.background}cc`,
                  border: `1px solid ${isDone ? "#22c55e40" : colors.surfaceBorder}`,
                }}
                data-testid={`card-activity-${activity.id}`}
              >
                <button
                  className="w-full p-4 flex items-center gap-4 transition-all"
                  onClick={() => !isDone && setActiveActivity(activity)}
                  disabled={isDone}
                  data-testid={`button-start-${activity.id}`}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: isDone ? "#22c55e20" : `${activity.color}20`,
                      border: `1px solid ${isDone ? "#22c55e40" : activity.color + "40"}`,
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2 size={24} style={{ color: "#22c55e" }} />
                    ) : (
                      <Icon size={24} style={{ color: activity.color }} />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div
                      className="text-base font-bold"
                      style={{ color: isDone ? colors.textMuted : colors.text }}
                    >
                      {activity.activityName}
                    </div>
                    <div className="text-xs" style={{ color: colors.textMuted }}>
                      {isDone
                        ? "Completed"
                        : `${stepsWithoutCompletion.length} steps · ~${actMins} min`}
                    </div>
                  </div>
                  {!isDone && (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: `${activity.color}20`,
                        border: `1px solid ${activity.color}40`,
                      }}
                    >
                      <Play size={16} style={{ color: activity.color }} />
                    </div>
                  )}
                </button>

                {!isDone && (
                  <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                    {stepsWithoutCompletion.map((step) => (
                      <span
                        key={step.id}
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${activity.color}10`,
                          color: activity.color,
                          border: `1px solid ${activity.color}20`,
                        }}
                      >
                        {step.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: `${colors.background}cc`,
            border: `1px solid ${colors.surfaceBorder}`,
          }}
          data-testid="card-progression-info"
        >
          <div
            className="text-xs font-bold uppercase tracking-wider mb-2"
            style={{ color: colors.textMuted }}
          >
            Today's Progression
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                {completedToday.size}/{activities.length}
              </div>
              <div
                className="text-[10px] uppercase tracking-wider"
                style={{ color: colors.textMuted }}
              >
                Activities Done
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                Day {dayNumber}
              </div>
              <div
                className="text-[10px] uppercase tracking-wider"
                style={{ color: colors.textMuted }}
              >
                Phase 1
              </div>
            </div>
          </div>
          <div className="mt-3 text-[10px] leading-relaxed" style={{ color: colors.textMuted }}>
            Push-ups: {5 + Math.floor((dayNumber - 1) / 3)} · Cardio:{" "}
            {30 + Math.floor((dayNumber - 1) / 3) * 5}s · Crunches:{" "}
            {10 + Math.floor((dayNumber - 1) / 3) * 2} — increases every few days
          </div>
        </div>
      </div>
    </SystemLayout>
  );
}
