import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, CheckCircle2, Sparkles, Volume2, VolumeX, SkipForward } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ActivityDefinition, ActivityStep, BreathTiming } from "@/lib/activityEngine";

const EXERCISE_ANIMATIONS: Record<string, { emoji: string; movementHint: string }> = {
  pushups: { emoji: "💪", movementHint: "Push up · Hold · Lower down" },
  cardio: { emoji: "🏃", movementHint: "Jog in place · Knees up · Stay light" },
  abs: { emoji: "🔥", movementHint: "Curl up · Squeeze · Lower slowly" },
  rest: { emoji: "🧘", movementHint: "Breathe deeply · Relax your muscles" },
  neck_rolls: { emoji: "🔄", movementHint: "Slow gentle circles · Both directions" },
  shoulder_rolls: { emoji: "🤸", movementHint: "Roll forward · Then backward" },
  torso_twist: { emoji: "🌀", movementHint: "Twist left · Center · Twist right" },
  forward_fold: { emoji: "🙏", movementHint: "Fold forward · Reach toes · Hold" },
  arm_circles: { emoji: "💫", movementHint: "Small circles · Then big circles" },
  hip_circles: { emoji: "🔄", movementHint: "Slow hip rotations · Stay loose" },
};

function useBeepSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const playBeep = useCallback((frequency = 880, duration = 0.15, volume = 0.3) => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = frequency;
      osc.type = "sine";
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, [getCtx]);

  const playCountdownBeep = useCallback(() => {
    playBeep(660, 0.1, 0.2);
  }, [playBeep]);

  const playCompleteBeep = useCallback(() => {
    try {
      const ctx = getCtx();
      [0, 0.12, 0.24].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = [660, 880, 1100][i];
        osc.type = "sine";
        gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.2);
      });
    } catch {}
  }, [getCtx]);

  return { playBeep, playCountdownBeep, playCompleteBeep };
}

function useVoiceGuidance() {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem("ascend_voice_guidance");
    return saved !== "false";
  });

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("ascend_voice_guidance", String(next));
      if (!next) window.speechSynthesis?.cancel();
      return next;
    });
  }, []);

  const speak = useCallback((text: string) => {
    if (!enabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")
    ) || voices.find(
      (v) => v.lang.startsWith("en") && v.localService
    ) || voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }, [enabled]);

  const stop = useCallback(() => { window.speechSynthesis?.cancel(); }, []);

  return { enabled, toggle, speak, stop };
}

function CircularTimer({
  seconds,
  remaining,
  color,
  label,
  exerciseId,
}: {
  seconds: number;
  remaining: number;
  color: string;
  label: string;
  exerciseId: string;
}) {
  const progress = seconds > 0 ? (1 - remaining / seconds) : 0;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const anim = EXERCISE_ANIMATIONS[exerciseId];

  const pulsePhase = remaining % 2 === 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-52 h-52 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={`${color}15`}
            strokeWidth="8"
          />
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          {anim && (
            <motion.div
              animate={{ scale: pulsePhase ? 1.1 : 0.95 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="text-4xl mb-1 select-none"
            >
              {anim.emoji}
            </motion.div>
          )}
          <div
            className="text-3xl font-bold font-mono tabular-nums"
            style={{ color }}
            data-testid="text-countdown"
          >
            {mins}:{secs.toString().padStart(2, "0")}
          </div>
          <div className="text-[10px] uppercase tracking-wider mt-1 font-bold" style={{ color: `${color}99` }}>
            {label}
          </div>
        </div>

        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: remaining <= 3
              ? `0 0 40px ${color}40`
              : `0 0 20px ${color}15`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {anim && (
        <motion.div
          key={exerciseId}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-center tracking-wide"
          style={{ color: `${color}88` }}
        >
          {anim.movementHint}
        </motion.div>
      )}
    </div>
  );
}

function GetReadyCountdown({
  color,
  onComplete,
  exerciseName,
}: {
  color: string;
  onComplete: () => void;
  exerciseName: string;
}) {
  const [count, setCount] = useState(3);
  const beep = useBeepSound();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    beep.playCountdownBeep();
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => onCompleteRef.current(), 200);
          return 0;
        }
        beep.playCountdownBeep();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="text-xs uppercase tracking-widest font-bold" style={{ color: `${color}88` }}>
        Get Ready
      </div>
      <div className="text-sm mb-2" style={{ color: `${color}cc` }}>
        {exerciseName}
      </div>
      <motion.div
        key={count}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.5, opacity: 0 }}
        className="text-7xl font-bold font-mono"
        style={{ color }}
      >
        {count || "GO!"}
      </motion.div>
    </motion.div>
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
    return () => { cancelledRef.current = true; };
  }, [active, timing.inhaleSeconds, timing.holdSeconds, timing.exhaleSeconds]);

  if (!active) return null;

  const size = 80 + scale * 80;
  const phaseLabel =
    phase === "inhale" ? `Inhale ${timing.inhaleSeconds}s`
    : phase === "hold" ? `Hold ${timing.holdSeconds}s`
    : `Exhale ${timing.exhaleSeconds}s`;

  return (
    <div className="flex flex-col items-center gap-4 my-2">
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: size, height: size,
          backgroundColor: `${color}20`,
          border: `2px solid ${color}50`,
          boxShadow: `0 0 ${Math.floor(size / 3)}px ${color}25`,
          transition: "width 50ms linear, height 50ms linear",
        }}
      >
        <span className="text-xs font-bold uppercase tracking-wider select-none" style={{ color }}>
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
  const voice = useVoiceGuidance();
  const beep = useBeepSound();

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [stepPhase, setStepPhase] = useState<"ready" | "getready" | "running" | "done">("ready");
  const [stepsCompleted, setStepsCompleted] = useState<Set<number>>(new Set());
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = activity.steps[currentStepIdx];
  const isCompletionStep = step?.type === "completion";
  const isTimerStep = step?.type === "timer";
  const isBreathStep = step?.type === "breath";

  useEffect(() => {
    if (step?.voiceText && stepPhase !== "getready") {
      voice.speak(step.voiceText);
    }
  }, [currentStepIdx]);

  useEffect(() => {
    return () => { voice.stop(); };
  }, []);

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
          category: activity.category,
          xpMultiplier: activity.xpMultiplier ?? 1.0,
        }
      );
      return res.json();
    },
    onSuccess: (data: any) => {
      const earned = data?.xpEarned ?? 0;
      setXpEarned(earned);
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      queryClient.invalidateQueries({ queryKey: ["home"] });
      queryClient.invalidateQueries({ queryKey: ["training-scaling"] });
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
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStepPhase("done");
    setStepsCompleted((prev) => new Set(prev).add(currentStepIdx));

    const nextIdx = currentStepIdx + 1;
    if (nextIdx < activity.steps.length) {
      setTimeout(() => {
        setCurrentStepIdx(nextIdx);
        setStepPhase("ready");
      }, 400);
    }
  }, [currentStepIdx, activity.steps.length]);

  const startTimer = useCallback(() => {
    if (!step?.durationSeconds) return;
    setTimerRemaining(step.durationSeconds);
    setStepPhase("running");

    if (intervalRef.current) clearInterval(intervalRef.current);
    let remaining = step.durationSeconds;
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setTimerRemaining(remaining);
      if (remaining <= 3 && remaining > 0) {
        beep.playCountdownBeep();
        voice.speak(String(remaining));
      }
      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        beep.playCompleteBeep();
        advanceStep();
      }
    }, 1000);
  }, [step, advanceStep, beep, voice]);

  const handleAction = useCallback(() => {
    if (!step) return;
    if (isTimerStep) {
      setStepPhase("getready");
    } else if (isBreathStep) {
      setStepPhase("getready");
    } else {
      advanceStep();
    }
  }, [step, isTimerStep, isBreathStep, advanceStep]);

  const handleGetReadyComplete = useCallback(() => {
    if (isBreathStep) {
      setStepPhase("running");
      if (step?.durationSeconds) {
        setTimerRemaining(step.durationSeconds);
        let remaining = step.durationSeconds;
        intervalRef.current = setInterval(() => {
          remaining -= 1;
          setTimerRemaining(remaining);
          if (remaining <= 3 && remaining > 0) beep.playCountdownBeep();
          if (remaining <= 0) {
            clearInterval(intervalRef.current!);
            beep.playCompleteBeep();
            advanceStep();
          }
        }, 1000);
      }
    } else {
      startTimer();
    }
    if (step?.voiceText) voice.speak(step.voiceText);
  }, [isBreathStep, step, startTimer, advanceStep, beep, voice]);

  const handleSkip = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    advanceStep();
  }, [advanceStep]);

  useEffect(() => {
    if (isCompletionStep && !completeMutation.isPending && !completeMutation.isSuccess) {
      completeMutation.mutate();
    }
  }, [isCompletionStep]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const getActionLabel = (s: ActivityStep, stepIdx: number): string => {
    if (s.type === "timer" || s.type === "breath") return "Start";
    return stepIdx === 0 ? "Begin" : "Done";
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
        <div className="flex items-center gap-2">
          <button
            onClick={voice.toggle}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: `${colors.textMuted}15` }}
            data-testid="button-toggle-voice"
          >
            {voice.enabled ? (
              <Volume2 size={18} style={{ color: activity.color }} />
            ) : (
              <VolumeX size={18} style={{ color: colors.textMuted }} />
            )}
          </button>
          <button
            onClick={() => { voice.stop(); if (intervalRef.current) clearInterval(intervalRef.current); onCancel(); }}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: `${colors.textMuted}15` }}
            data-testid="button-cancel-activity"
          >
            <X size={18} style={{ color: colors.textMuted }} />
          </button>
        </div>
      </div>

      <StepProgressBar
        steps={activity.steps}
        currentIdx={currentStepIdx}
        completedSet={stepsCompleted}
        color={activity.color}
        mutedColor={colors.textMuted}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {isCompletionStep ? (
            <CompletionScreen
              key="completion"
              activity={activity}
              colors={colors}
              xpEarned={xpEarned}
              onFinish={() => onComplete(xpEarned ?? 0)}
              isPending={completeMutation.isPending}
            />
          ) : stepPhase === "getready" && step ? (
            <GetReadyCountdown
              key={`getready-${currentStepIdx}`}
              color={activity.color}
              onComplete={handleGetReadyComplete}
              exerciseName={step.label}
            />
          ) : step ? (
            <motion.div
              key={`step-${currentStepIdx}-${stepPhase}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-5 w-full"
            >
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

              {(isTimerStep && stepPhase === "running") ? (
                <CircularTimer
                  seconds={step.durationSeconds!}
                  remaining={timerRemaining}
                  color={activity.color}
                  label={step.label}
                  exerciseId={step.id}
                />
              ) : (isBreathStep && stepPhase === "running") ? (
                <>
                  <BreathingVisual
                    active={true}
                    color={activity.color}
                    timing={step.breathTiming!}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="text-2xl font-bold font-mono tabular-nums"
                      style={{ color: activity.color }}
                    >
                      {Math.floor(timerRemaining / 60)}:{(timerRemaining % 60).toString().padStart(2, "0")}
                    </div>
                    <div
                      className="w-48 h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: `${activity.color}20` }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-linear"
                        style={{
                          width: `${step.durationSeconds ? (1 - timerRemaining / step.durationSeconds) * 100 : 0}%`,
                          backgroundColor: activity.color,
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : (
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
              )}

              {stepPhase === "running" && (
                <button
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs transition-all active:scale-95"
                  style={{
                    backgroundColor: `${colors.textMuted}10`,
                    color: colors.textMuted,
                    border: `1px solid ${colors.textMuted}20`,
                  }}
                  onClick={handleSkip}
                  data-testid="button-skip-step"
                >
                  <SkipForward size={14} />
                  Skip
                </button>
              )}

              {stepPhase === "ready" && !stepsCompleted.has(currentStepIdx) && (
                <button
                  className="px-8 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
                  style={{ backgroundColor: activity.color, color: "#fff" }}
                  onClick={handleAction}
                  data-testid="button-step-action"
                >
                  <Play size={16} />
                  {getActionLabel(step, currentStepIdx)}
                </button>
              )}

              {stepPhase === "done" && stepsCompleted.has(currentStepIdx) && (
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
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
