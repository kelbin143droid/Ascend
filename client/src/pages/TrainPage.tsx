import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageStageContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { Dumbbell, Wind, Brain, Heart, Play, CheckCircle2, ChevronRight, Timer, Droplets, Moon as MoonIcon, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

interface ActivityStep {
  id: string;
  label: string;
  instruction: string;
  durationSeconds: number | null;
  type: "timed" | "reps" | "prompt";
  reps?: string;
}

interface GuidedActivity {
  id: string;
  name: string;
  stat: string;
  color: string;
  icon: typeof Dumbbell;
  steps: ActivityStep[];
  totalSeconds: number;
}

function getPhase1Activities(dayNumber: number): GuidedActivity[] {
  const pushupReps = 5 + Math.floor((dayNumber - 1) / 2);
  const plankSeconds = 15 + Math.floor((dayNumber - 1) / 2) * 5;

  return [
    {
      id: "strength",
      name: "Strength",
      stat: "strength",
      color: "#ef4444",
      icon: Dumbbell,
      totalSeconds: 90,
      steps: [
        {
          id: "pushups",
          label: "Push-ups",
          instruction: `Do ${pushupReps} push-ups at your own pace. Knee push-ups are fine.`,
          durationSeconds: null,
          type: "reps",
          reps: `${pushupReps} reps`,
        },
        {
          id: "abs",
          label: "Core Work",
          instruction: dayNumber % 2 === 0
            ? `Hold a plank for ${plankSeconds} seconds. Drop to knees if needed.`
            : "Do 10 slow crunches. Focus on control, not speed.",
          durationSeconds: dayNumber % 2 === 0 ? plankSeconds : null,
          type: dayNumber % 2 === 0 ? "timed" : "reps",
          reps: dayNumber % 2 === 0 ? undefined : "10 slow crunches",
        },
        {
          id: "cardio",
          label: "Cardio",
          instruction: dayNumber % 2 === 0
            ? "Jog in place for 30 seconds. Keep it light."
            : "Take a 1-minute brisk walk around your space.",
          durationSeconds: dayNumber % 2 === 0 ? 30 : 60,
          type: "timed",
        },
      ],
    },
    {
      id: "agility",
      name: "Agility",
      stat: "agility",
      color: "#22c55e",
      icon: Wind,
      totalSeconds: 60,
      steps: [
        {
          id: "neck_roll",
          label: "Neck Rolls",
          instruction: "Gently roll your neck in circles. 10 seconds each direction.",
          durationSeconds: 20,
          type: "timed",
        },
        {
          id: "shoulder_rolls",
          label: "Shoulder Rolls",
          instruction: "Roll your shoulders forward and backward. 10 reps each.",
          durationSeconds: null,
          type: "reps",
          reps: "10 each direction",
        },
        {
          id: "forward_bend",
          label: "Forward Bend",
          instruction: "Stand and slowly bend forward. Reach toward your toes. Hold gently.",
          durationSeconds: 15,
          type: "timed",
        },
      ],
    },
    {
      id: "meditation",
      name: "Calm Breathing",
      stat: "sense",
      color: "#3b82f6",
      icon: Brain,
      totalSeconds: 120,
      steps: [
        {
          id: "calm_breathing",
          label: "Calm Breathing",
          instruction: "Inhale 4s → Hold 2s → Exhale 6s. Repeat for 2 minutes.",
          durationSeconds: 120,
          type: "timed",
        },
      ],
    },
    {
      id: "vitality",
      name: "Vitality Check",
      stat: "vitality",
      color: "#f59e0b",
      icon: Heart,
      totalSeconds: 30,
      steps: [
        {
          id: "hydration",
          label: "Hydration",
          instruction: "Drink one full glass of water right now.",
          durationSeconds: null,
          type: "prompt",
        },
        {
          id: "sleep_check",
          label: "Sleep Check",
          instruction: "Did you sleep at least 6 hours last night?",
          durationSeconds: null,
          type: "prompt",
        },
      ],
    },
  ];
}

function BreathingCircle({ active, color }: { active: boolean; color: string }) {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [size, setSize] = useState(60);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const cycle = async () => {
      while (!cancelled) {
        setPhase("inhale");
        for (let i = 0; i <= 40; i++) { if (cancelled) return; setSize(60 + i * 1.5); await new Promise(r => setTimeout(r, 100)); }
        setPhase("hold");
        await new Promise(r => setTimeout(r, 2000));
        if (cancelled) return;
        setPhase("exhale");
        for (let i = 0; i <= 60; i++) { if (cancelled) return; setSize(120 - i * 1); await new Promise(r => setTimeout(r, 100)); }
      }
    };
    cycle();
    return () => { cancelled = true; };
  }, [active]);

  if (!active) return null;

  return (
    <div className="flex flex-col items-center gap-3 my-4">
      <div
        className="rounded-full transition-all duration-100 flex items-center justify-center"
        style={{
          width: size,
          height: size,
          backgroundColor: `${color}25`,
          border: `2px solid ${color}60`,
          boxShadow: `0 0 ${size / 3}px ${color}30`,
        }}
      >
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
          {phase}
        </span>
      </div>
    </div>
  );
}

function CountdownTimer({
  seconds,
  color,
  onComplete,
  running,
}: {
  seconds: number;
  color: string;
  onComplete: () => void;
  running: boolean;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, onComplete]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = seconds > 0 ? (1 - remaining / seconds) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-3xl font-bold font-mono tabular-nums" style={{ color }} data-testid="text-countdown">
        {mins}:{secs.toString().padStart(2, "0")}
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${color}20` }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function ActiveActivityView({
  activity,
  colors,
  onComplete,
  onCancel,
  playerId,
}: {
  activity: GuidedActivity;
  colors: any;
  onComplete: () => void;
  onCancel: () => void;
  playerId: string;
}) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [stepRunning, setStepRunning] = useState(false);
  const [stepsCompleted, setStepsCompleted] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  const step = activity.steps[currentStepIdx];
  const isLastStep = currentStepIdx === activity.steps.length - 1;
  const allDone = stepsCompleted.size === activity.steps.length;
  const isBreathing = activity.id === "meditation" && step?.id === "calm_breathing";

  const completeMutation = useMutation({
    mutationFn: async () => {
      const durationMinutes = Math.max(1, Math.ceil(activity.totalSeconds / 60));
      return apiRequest("POST", `/api/player/${playerId}/complete-guided-session`, {
        sessionId: `phase1_${activity.id}`,
        stat: activity.stat,
        durationMinutes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      queryClient.invalidateQueries({ queryKey: ["home"] });
      onComplete();
    },
  });

  const markStepDone = useCallback(() => {
    setStepRunning(false);
    setStepsCompleted((prev) => new Set(prev).add(currentStepIdx));
    if (!isLastStep) {
      setTimeout(() => setCurrentStepIdx((i) => i + 1), 400);
    }
  }, [currentStepIdx, isLastStep]);

  const handleStart = () => setStepRunning(true);

  const handleFinishAll = () => {
    completeMutation.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: colors.background }}
    >
      <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${colors.surfaceBorder}` }}>
        <div className="flex items-center gap-3">
          <activity.icon size={20} style={{ color: activity.color }} />
          <span className="font-bold" style={{ color: colors.text }}>{activity.name}</span>
        </div>
        <button onClick={onCancel} data-testid="button-cancel-activity">
          <X size={20} style={{ color: colors.textMuted }} />
        </button>
      </div>

      <div className="flex gap-1 px-4 pt-3">
        {activity.steps.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor: stepsCompleted.has(i)
                ? activity.color
                : i === currentStepIdx
                ? `${activity.color}60`
                : `${colors.textMuted}30`,
            }}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {!allDone && step && (
          <>
            <div className="text-center">
              <div
                className="text-sm uppercase tracking-wider mb-1 font-bold"
                style={{ color: activity.color }}
                data-testid="text-step-label"
              >
                {step.label}
              </div>
              <div className="text-xs" style={{ color: colors.textMuted }}>
                Step {currentStepIdx + 1} of {activity.steps.length}
              </div>
            </div>

            <div
              className="rounded-xl p-6 text-center max-w-sm w-full"
              style={{
                backgroundColor: `${activity.color}10`,
                border: `1px solid ${activity.color}25`,
              }}
            >
              <p className="text-sm leading-relaxed" style={{ color: colors.text }} data-testid="text-step-instruction">
                {step.instruction}
              </p>
              {step.type === "reps" && step.reps && (
                <div className="mt-3 text-lg font-bold" style={{ color: activity.color }}>
                  {step.reps}
                </div>
              )}
            </div>

            {isBreathing && stepRunning && (
              <BreathingCircle active={stepRunning} color={activity.color} />
            )}

            {step.type === "timed" && step.durationSeconds && stepRunning && (
              <CountdownTimer
                seconds={step.durationSeconds}
                color={activity.color}
                onComplete={markStepDone}
                running={stepRunning}
              />
            )}

            {!stepRunning && !stepsCompleted.has(currentStepIdx) && (
              <button
                className="px-8 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                style={{
                  backgroundColor: activity.color,
                  color: "#fff",
                }}
                onClick={step.type === "timed" ? handleStart : markStepDone}
                data-testid="button-step-action"
              >
                {step.type === "timed" ? (
                  <span className="flex items-center gap-2">
                    <Play size={16} /> Start Timer
                  </span>
                ) : step.type === "prompt" ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={16} /> Done
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={16} /> Mark Complete
                  </span>
                )}
              </button>
            )}

            {stepsCompleted.has(currentStepIdx) && !isLastStep && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2"
              >
                <CheckCircle2 size={24} style={{ color: activity.color }} />
                <span className="text-sm font-bold" style={{ color: activity.color }}>Done!</span>
              </motion.div>
            )}
          </>
        )}

        {(allDone || (isLastStep && stepsCompleted.has(currentStepIdx))) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <CheckCircle2 size={48} style={{ color: activity.color }} />
            <div className="text-lg font-bold" style={{ color: colors.text }}>
              {activity.name} Complete!
            </div>
            <button
              className="px-8 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
              style={{ backgroundColor: activity.color, color: "#fff" }}
              onClick={handleFinishAll}
              disabled={completeMutation.isPending}
              data-testid="button-finish-activity"
            >
              {completeMutation.isPending ? "Saving..." : "Claim XP"}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function TrainPage() {
  const { player } = useGame();
  const { backgroundTheme } = useTheme();
  const { t } = useLanguage();
  const colors = backgroundTheme.colors;
  const [activeActivity, setActiveActivity] = useState<GuidedActivity | null>(null);
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
  const activities = getPhase1Activities(dayNumber);
  const totalTime = activities.reduce((sum, a) => sum + a.totalSeconds, 0);
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
          <ActiveActivityView
            activity={activeActivity}
            colors={colors}
            onComplete={() => handleActivityComplete(activeActivity.id)}
            onCancel={() => setActiveActivity(null)}
            playerId={player.id}
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
            Phase 1 — Build consistency with small daily rituals. Complete all 4 activities ({totalMins} min total).
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
            const actMins = Math.ceil(activity.totalSeconds / 60);

            return (
              <div
                key={activity.id}
                className={cn("rounded-lg overflow-hidden transition-all duration-300", isDone && "opacity-60")}
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
                      <activity.icon size={24} style={{ color: activity.color }} />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-base font-bold" style={{ color: isDone ? colors.textMuted : colors.text }}>
                      {activity.name}
                    </div>
                    <div className="text-xs" style={{ color: colors.textMuted }}>
                      {isDone ? "Completed" : `${activity.steps.length} steps · ~${actMins} min`}
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
                    {activity.steps.map((step) => (
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
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: colors.textMuted }}>
            Today's Progression
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                {completedToday.size}/{activities.length}
              </div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>
                Activities Done
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                Day {dayNumber}
              </div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>
                Phase 1
              </div>
            </div>
          </div>
          <div className="mt-3 text-[10px] leading-relaxed" style={{ color: colors.textMuted }}>
            Push-ups: {5 + Math.floor((dayNumber - 1) / 2)} reps · Plank: {15 + Math.floor((dayNumber - 1) / 2) * 5}s — increases every 2 days
          </div>
        </div>
      </div>
    </SystemLayout>
  );
}
