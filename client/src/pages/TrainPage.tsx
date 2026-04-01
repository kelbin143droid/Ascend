import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageStageContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { GuidedActivityEngine } from "@/components/game/GuidedActivityEngine";
import { DailyFlowEngine } from "@/components/game/DailyFlowEngine";
import { buildPhase1Activities, TIER_XP_MULTIPLIERS, type ActivityDefinition, type CategoryTiers } from "@/lib/activityEngine";
import { Dumbbell, Wind, Brain, Heart, Play, CheckCircle2, TrendingUp, Shield, Zap, ListChecks } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_ICONS: Record<string, typeof Dumbbell> = {
  strength: Dumbbell,
  agility: Wind,
  meditation: Brain,
  vitality: Heart,
};

const TIER_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Building",
  3: "Steady",
  4: "Strong",
  5: "Peak",
};

export default function TrainPage() {
  const { player } = useGame();
  const { backgroundTheme } = useTheme();
  const { t } = useLanguage();
  const colors = backgroundTheme.colors;
  const queryClient = useQueryClient();
  const [activeActivity, setActiveActivity] = useState<ActivityDefinition | null>(null);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [flowActive, setFlowActive] = useState(false);

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

  const { data: scalingData } = useQuery<{ trainingScaling: Record<string, { tier: number; completionStreak: number; missedDays: number; sessionsCompleted: number }> }>({
    queryKey: ["training-scaling", player?.id],
    queryFn: async () => {
      if (!player?.id) throw new Error("No player");
      const res = await fetch(`/api/player/${player.id}/training-scaling`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!player?.id,
    staleTime: 10000,
  });

  const tiers: CategoryTiers = {
    strength: scalingData?.trainingScaling?.strength?.tier ?? 1,
    agility: scalingData?.trainingScaling?.agility?.tier ?? 1,
    meditation: scalingData?.trainingScaling?.meditation?.tier ?? 1,
    vitality: scalingData?.trainingScaling?.vitality?.tier ?? 1,
  };

  const dayNumber = homeData?.onboardingDay ?? 1;
  const activities = buildPhase1Activities(dayNumber, tiers);
  const totalTime = activities.reduce((sum, a) => sum + a.duration, 0);
  const totalMins = Math.ceil(totalTime / 60);

  const handleActivityComplete = (activityId: string) => {
    setCompletedToday((prev) => new Set(prev).add(activityId));
    setActiveActivity(null);
    queryClient.invalidateQueries({ queryKey: ["training-scaling", player?.id] });
  };

  const handleFlowComplete = (completedIds: string[], _bonusAwarded: boolean) => {
    setCompletedToday((prev) => {
      const next = new Set(prev);
      completedIds.forEach((id) => next.add(id));
      return next;
    });
    setFlowActive(false);
    queryClient.invalidateQueries({ queryKey: ["training-scaling", player?.id] });
    queryClient.invalidateQueries({ queryKey: ["/api/player"] });
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
            isOnboardingComplete={homeData?.isOnboardingComplete}
          />
        )}
        {flowActive && player && (
          <DailyFlowEngine
            activities={activities}
            playerId={player.id}
            onComplete={handleFlowComplete}
            onCancel={() => setFlowActive(false)}
            isOnboardingComplete={homeData?.isOnboardingComplete}
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

        {!allComplete && (
          <button
            className="w-full rounded-xl p-4 flex items-center gap-4 transition-all active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}20, ${colors.primary}08)`,
              border: `1px solid ${colors.primary}30`,
            }}
            onClick={() => setFlowActive(true)}
            data-testid="button-start-daily-flow"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${colors.primary}20`,
                border: `1px solid ${colors.primary}40`,
              }}
            >
              <ListChecks size={24} style={{ color: colors.primary }} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-base font-bold" style={{ color: colors.text }}>
                Start Daily Flow
              </div>
              <div className="text-xs" style={{ color: colors.textMuted }}>
                All 4 activities in sequence · ~{totalMins} min · +5 bonus XP
              </div>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: `${colors.primary}20`,
                border: `1px solid ${colors.primary}40`,
              }}
            >
              <Play size={16} style={{ color: colors.primary }} />
            </div>
          </button>
        )}

        <div
          className="rounded-lg px-4 py-3"
          style={{
            backgroundColor: `${colors.primary}08`,
            border: `1px solid ${colors.primary}15`,
          }}
        >
          <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>
            Phase 1 — Build consistency with small daily rituals. Complete all 4 activities (~{totalMins} min total) or run the Daily Flow.
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
            const tier = activity.tier ?? 1;
            const multiplier = activity.xpMultiplier ?? 1.0;
            const catScaling = scalingData?.trainingScaling?.[activity.category];
            const streak = catScaling?.completionStreak ?? 0;

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
                    <div className="flex items-center gap-2">
                      <span
                        className="text-base font-bold"
                        style={{ color: isDone ? colors.textMuted : colors.text }}
                      >
                        {activity.activityName}
                      </span>
                      {tier > 1 && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${activity.color}20`,
                            color: activity.color,
                          }}
                        >
                          T{tier}
                        </span>
                      )}
                    </div>
                    <div className="text-xs flex items-center gap-2" style={{ color: colors.textMuted }}>
                      {isDone ? (
                        "Completed"
                      ) : (
                        <>
                          <span>{stepsWithoutCompletion.length} steps · ~{actMins} min</span>
                          {multiplier > 1 && (
                            <span style={{ color: activity.color }}>×{multiplier.toFixed(1)} XP</span>
                          )}
                        </>
                      )}
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
                  <div className="px-4 pb-3">
                    <div className="flex flex-wrap gap-1.5 mb-2">
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
                    {streak > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px]" style={{ color: colors.textMuted }}>
                        <TrendingUp size={10} style={{ color: activity.color }} />
                        <span>{streak}/3 streak to next tier</span>
                      </div>
                    )}
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
            className="text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: colors.textMuted }}
          >
            Adaptive Scaling
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(["strength", "agility", "meditation", "vitality"] as const).map((cat) => {
              const catTier = tiers[cat];
              const catColor = {
                strength: "#ef4444",
                agility: "#22c55e",
                meditation: "#3b82f6",
                vitality: "#f59e0b",
              }[cat];
              const catIcon = {
                strength: "STR",
                agility: "AGI",
                meditation: "SEN",
                vitality: "VIT",
              }[cat];
              return (
                <div
                  key={cat}
                  className="text-center p-2 rounded-lg"
                  style={{
                    backgroundColor: `${catColor}10`,
                    border: `1px solid ${catColor}20`,
                  }}
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: catColor }}>
                    {catIcon}
                  </div>
                  <div className="text-lg font-bold" style={{ color: colors.text }}>
                    T{catTier}
                  </div>
                  <div className="text-[9px]" style={{ color: colors.textMuted }}>
                    {TIER_LABELS[catTier] ?? "Beginner"}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-[10px] leading-relaxed" style={{ color: colors.textMuted }}>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={10} style={{ color: colors.primary }} />
              <span>3 completions in a row → tier up</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield size={10} style={{ color: colors.textMuted }} />
              <span>3 missed days → tier down · Phase 1 max: Tier 3</span>
            </div>
          </div>
        </div>
      </div>
    </SystemLayout>
  );
}
