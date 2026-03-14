import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ActivityDefinition, ActivityStep, BreathTiming } from "@/lib/activityEngine";

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
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

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
          onCompleteRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = seconds > 0 ? (1 - remaining / seconds) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-xs">
      <div
        className="text-4xl font-bold font-mono tabular-nums"
        style={{ color }}
        data-testid="text-countdown"
      >
        {mins}:{secs.toString().padStart(2, "0")}
      </div>
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: `${color}20` }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function RepCounter({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-5xl font-bold" style={{ color }}>
        {count}
      </div>
      <div className="text-sm" style={{ color: `${color}cc` }}>
        {label}
      </div>
    </div>
  );
}

function BreathingVisual({
  active,
  color,
  timing,
}: {
  active: boolean;
  color: string;
  timing: BreathTiming;
}) {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [scale, setScale] = useState(0.5);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    if (!active) return;

    const animate = async () => {
      const frameMs = 50;
      while (!cancelledRef.current) {
        setPhase("inhale");
        const inhaleFrames = Math.floor((timing.inhaleSeconds * 1000) / frameMs);
        for (let i = 0; i <= inhaleFrames; i++) {
          if (cancelledRef.current) return;
          setScale(0.5 + (i / inhaleFrames) * 0.5);
          await new Promise((r) => setTimeout(r, frameMs));
        }

        setPhase("hold");
        const holdMs = timing.holdSeconds * 1000;
        const holdStart = Date.now();
        while (Date.now() - holdStart < holdMs) {
          if (cancelledRef.current) return;
          await new Promise((r) => setTimeout(r, 100));
        }

        setPhase("exhale");
        const exhaleFrames = Math.floor((timing.exhaleSeconds * 1000) / frameMs);
        for (let i = 0; i <= exhaleFrames; i++) {
          if (cancelledRef.current) return;
          setScale(1 - (i / exhaleFrames) * 0.5);
          await new Promise((r) => setTimeout(r, frameMs));
        }
      }
    };

    animate();
    return () => {
      cancelledRef.current = true;
    };
  }, [active, timing.inhaleSeconds, timing.holdSeconds, timing.exhaleSeconds]);

  if (!active) return null;

  const size = 80 + scale * 80;
  const phaseLabel =
    phase === "inhale"
      ? `Inhale ${timing.inhaleSeconds}s`
      : phase === "hold"
      ? `Hold ${timing.holdSeconds}s`
      : `Exhale ${timing.exhaleSeconds}s`;

  return (
    <div className="flex flex-col items-center gap-4 my-2">
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          backgroundColor: `${color}20`,
          border: `2px solid ${color}50`,
          boxShadow: `0 0 ${Math.floor(size / 3)}px ${color}25`,
          transition: "width 50ms linear, height 50ms linear",
        }}
      >
        <span
          className="text-xs font-bold uppercase tracking-wider select-none"
          style={{ color }}
        >
          {phase}
        </span>
      </div>
      <div className="text-xs font-medium" style={{ color: `${color}bb` }}>
        {phaseLabel}
      </div>
    </div>
  );
}

function StepProgressBar({
  steps,
  currentIdx,
  completedSet,
  color,
  mutedColor,
}: {
  steps: ActivityStep[];
  currentIdx: number;
  completedSet: Set<number>;
  color: string;
  mutedColor: string;
}) {
  return (
    <div className="flex gap-1 px-4 pt-3">
      {steps.map((_, i) => (
        <div
          key={i}
          className="flex-1 h-1.5 rounded-full transition-all duration-300"
          style={{
            backgroundColor: completedSet.has(i)
              ? color
              : i === currentIdx
              ? `${color}60`
              : `${mutedColor}30`,
          }}
        />
      ))}
    </div>
  );
}

function CompletionScreen({
  activity,
  colors,
  xpEarned,
  onFinish,
  isPending,
}: {
  activity: ActivityDefinition;
  colors: any;
  xpEarned: number | null;
  onFinish: () => void;
  isPending: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-5 text-center px-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: `${activity.color}20`,
            border: `2px solid ${activity.color}50`,
            boxShadow: `0 0 30px ${activity.color}30`,
          }}
        >
          <Sparkles size={36} style={{ color: activity.color }} />
        </div>
      </motion.div>

      <div>
        <div className="text-lg font-bold mb-1" style={{ color: colors.text }}>
          Activity complete.
        </div>
        <div className="text-sm" style={{ color: colors.textMuted }}>
          Small actions build momentum.
        </div>
      </div>

      {xpEarned !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold"
          style={{ color: activity.color }}
        >
          +{xpEarned} XP
        </motion.div>
      )}

      <button
        className="px-10 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 mt-2"
        style={{ backgroundColor: activity.color, color: "#fff" }}
        onClick={onFinish}
        disabled={isPending}
        data-testid="button-finish-activity"
      >
        {isPending ? "Saving..." : "Continue"}
      </button>
    </motion.div>
  );
}

export interface GuidedActivityEngineProps {
  activity: ActivityDefinition;
  playerId: string;
  onComplete: (xpEarned: number) => void;
  onCancel: () => void;
}

export function GuidedActivityEngine({
  activity,
  playerId,
  onComplete,
  onCancel,
}: GuidedActivityEngineProps) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const queryClient = useQueryClient();

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [stepRunning, setStepRunning] = useState(false);
  const [stepsCompleted, setStepsCompleted] = useState<Set<number>>(new Set());
  const [xpEarned, setXpEarned] = useState<number | null>(null);

  const step = activity.steps[currentStepIdx];
  const isCompletionStep = step?.type === "completion";
  const isLastNonCompletion = (() => {
    const remaining = activity.steps.slice(currentStepIdx + 1);
    return remaining.every((s) => s.type === "completion");
  })();

  const completeMutation = useMutation({
    mutationFn: async () => {
      const durationMinutes = Math.max(1, Math.ceil(activity.duration / 60));
      const res = await apiRequest(
        "POST",
        `/api/player/${playerId}/complete-guided-session`,
        {
          sessionId: activity.id,
          stat: activity.stat,
          durationMinutes,
        }
      );
      return res.json();
    },
    onSuccess: (data: any) => {
      const earned = data?.xpEarned ?? 0;
      setXpEarned(earned);
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      queryClient.invalidateQueries({ queryKey: ["home"] });

      apiRequest("POST", `/api/player/${playerId}/record-activity`, {
        activityId: activity.id,
        activityName: activity.activityName,
        category: activity.category,
        stat: activity.stat,
        durationMinutes: Math.max(1, Math.ceil(activity.duration / 60)),
        xpEarned: earned,
      }).catch(() => {});
    },
  });

  const advanceStep = useCallback(() => {
    setStepRunning(false);
    setStepsCompleted((prev) => new Set(prev).add(currentStepIdx));

    const nextIdx = currentStepIdx + 1;
    if (nextIdx < activity.steps.length) {
      setTimeout(() => setCurrentStepIdx(nextIdx), 350);
    }
  }, [currentStepIdx, activity.steps.length]);

  const handleAction = useCallback(() => {
    if (!step) return;

    if (step.type === "timer" || step.type === "breath") {
      setStepRunning(true);
    } else {
      advanceStep();
    }
  }, [step, advanceStep]);

  const handleTimerComplete = useCallback(() => {
    advanceStep();
  }, [advanceStep]);

  const handleFinish = useCallback(() => {
    if (!completeMutation.isSuccess) {
      completeMutation.mutate();
      return;
    }
    onComplete(xpEarned ?? 0);
  }, [completeMutation, onComplete, xpEarned]);

  useEffect(() => {
    if (isCompletionStep && !completeMutation.isPending && !completeMutation.isSuccess) {
      completeMutation.mutate();
    }
  }, [isCompletionStep]);

  const getActionLabel = (s: ActivityStep): string => {
    switch (s.type) {
      case "timer":
        return "Start Timer";
      case "breath":
        return "Begin Breathing";
      case "rep":
        return "Mark Complete";
      case "instruction":
        return "Done";
      default:
        return "Continue";
    }
  };

  const getActionIcon = (s: ActivityStep) => {
    switch (s.type) {
      case "timer":
      case "breath":
        return <Play size={16} />;
      default:
        return <CheckCircle2 size={16} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: colors.background }}
      data-testid="guided-activity-engine"
    >
      <div
        className="flex items-center justify-between p-4 shrink-0"
        style={{ borderBottom: `1px solid ${colors.surfaceBorder}` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: `${activity.color}20`,
              border: `1px solid ${activity.color}40`,
            }}
          >
            <Sparkles size={16} style={{ color: activity.color }} />
          </div>
          <div>
            <span className="font-bold text-sm" style={{ color: colors.text }}>
              {activity.activityName}
            </span>
            <span className="text-xs ml-2" style={{ color: colors.textMuted }}>
              {Math.ceil(activity.duration / 60)} min
            </span>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-lg transition-colors"
          style={{ backgroundColor: `${colors.textMuted}15` }}
          data-testid="button-cancel-activity"
        >
          <X size={18} style={{ color: colors.textMuted }} />
        </button>
      </div>

      <StepProgressBar
        steps={activity.steps}
        currentIdx={currentStepIdx}
        completedSet={stepsCompleted}
        color={activity.color}
        mutedColor={colors.textMuted}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 overflow-y-auto">
        {isCompletionStep ? (
          <CompletionScreen
            activity={activity}
            colors={colors}
            xpEarned={xpEarned}
            onFinish={() => onComplete(xpEarned ?? 0)}
            isPending={completeMutation.isPending}
          />
        ) : step ? (
          <>
            <div className="text-center">
              <div
                className="text-sm uppercase tracking-widest mb-1 font-bold"
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
                border: `1px solid ${activity.color}20`,
              }}
            >
              <p
                className="text-sm leading-relaxed whitespace-pre-line"
                style={{ color: colors.text }}
                data-testid="text-step-instruction"
              >
                {step.instruction}
              </p>
            </div>

            {step.type === "rep" && step.repCount != null && (
              <RepCounter
                count={step.repCount}
                label={step.repLabel || "reps"}
                color={activity.color}
              />
            )}

            {step.type === "breath" && stepRunning && step.breathTiming && (
              <BreathingVisual
                active={stepRunning}
                color={activity.color}
                timing={step.breathTiming}
              />
            )}

            {step.type === "breath" && stepRunning && step.durationSeconds && (
              <CountdownTimer
                seconds={step.durationSeconds}
                color={activity.color}
                onComplete={handleTimerComplete}
                running={stepRunning}
              />
            )}

            {step.type === "timer" && stepRunning && step.durationSeconds && (
              <CountdownTimer
                seconds={step.durationSeconds}
                color={activity.color}
                onComplete={handleTimerComplete}
                running={stepRunning}
              />
            )}

            {!stepRunning && !stepsCompleted.has(currentStepIdx) && (
              <button
                className="px-8 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
                style={{ backgroundColor: activity.color, color: "#fff" }}
                onClick={handleAction}
                data-testid="button-step-action"
              >
                {getActionIcon(step)}
                {getActionLabel(step)}
              </button>
            )}

            {stepsCompleted.has(currentStepIdx) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2"
              >
                <CheckCircle2 size={24} style={{ color: activity.color }} />
                <span className="text-sm font-bold" style={{ color: activity.color }}>
                  Done!
                </span>
              </motion.div>
            )}
          </>
        ) : null}
      </div>
    </motion.div>
  );
}
