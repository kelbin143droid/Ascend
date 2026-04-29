import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, CheckCircle2, Sparkles, Volume2, VolumeX, SkipForward, Info, Check, Plus, Minus, Pause, Music } from "lucide-react";
import {
  saveSession,
  loadSession,
  clearSession,
} from "@/lib/sessionPersistenceStore";
import { WorkoutMusicPlayer } from "@/components/game/WorkoutMusicPlayer";
import { useWorkoutMusic, playMusic, pauseMusic } from "@/lib/workoutMusicStore";
import { apiRequest } from "@/lib/queryClient";
import type { ActivityDefinition, ActivityStep, BreathTiming } from "@/lib/activityEngine";
import {
  addWorkout,
  caloriesForReps,
  caloriesForTime,
} from "@/lib/workoutLogStore";
import { readEnergySettings } from "@/lib/energySettingsStore";

/**
 * Map a guided-session step id to its canonical exercise name used by
 * the calorie tables in workoutLogStore. Returns null for steps that
 * aren't trackable exercises (intros, rest breaks, completions, etc).
 */
function stepIdToExerciseName(stepId: string): string | null {
  if (stepId.startsWith("pushups")) return "pushups";
  if (stepId.startsWith("situps") || stepId.startsWith("abs")) return "situps";
  if (stepId.startsWith("squats")) return "squats";
  if (stepId.startsWith("jumping_jacks") || stepId === "cardio") return "jumping_jacks";
  if (stepId.startsWith("jog")) return "jog_in_place";
  if (stepId.startsWith("plank")) return "plank";
  if (stepId.startsWith("shadow")) return "shadow_boxing";
  return null;
}

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

function useAudioEnabled() {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem("ascend_audio_enabled");
    return saved !== "false";
  });

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("ascend_audio_enabled", String(next));
      return next;
    });
  }, []);

  return { enabled, toggle };
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

function VideoExerciseTimer({
  src,
  seconds,
  remaining,
  label,
  color,
  loop = true,
}: {
  src: string;
  seconds: number;
  remaining: number;
  label: string;
  color: string;
  loop?: boolean;
}) {
  const pct = seconds > 0 ? Math.max(0, remaining / seconds) : 0;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
  }, [src]);

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-xs">
      <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "9/16", maxHeight: "380px" }}>
        <video
          ref={videoRef}
          src={src}
          autoPlay
          loop={loop}
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 50%)",
          }}
        />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <span className="text-white text-sm font-bold drop-shadow">{label}</span>
          <span
            className="text-3xl font-bold font-mono tabular-nums drop-shadow"
            style={{ color: remaining <= 3 ? "#f87171" : "white" }}
            data-testid="text-countdown"
          >
            {remaining}s
          </span>
        </div>
      </div>
      <div
        className="w-full h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: `${color}20` }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${(1 - pct) * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function GetReadyCountdown({
  color,
  onComplete,
  exerciseName,
  videoSrc,
}: {
  color: string;
  onComplete: () => void;
  exerciseName: string;
  videoSrc?: string;
}) {
  const [count, setCount] = useState(6);
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

  const grVideoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoSrc && grVideoRef.current) {
      grVideoRef.current.play().catch(() => {});
    }
  }, [videoSrc]);

  if (videoSrc) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center gap-3 w-full max-w-xs"
      >
        <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "9/16", maxHeight: "380px" }}>
          <video
            ref={grVideoRef}
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(0.5)" }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="text-xs uppercase tracking-widest font-bold text-white/70">
              Get Ready
            </div>
            <div className="text-sm font-medium text-white/90 mb-1">{exerciseName}</div>
            <motion.div
              key={count}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="text-7xl font-bold font-mono"
              style={{ color, textShadow: "0 0 20px rgba(0,0,0,0.8)" }}
            >
              {count || "GO!"}
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

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

function RestBreak({
  nextExerciseName,
  color,
  onComplete,
}: {
  nextExerciseName: string;
  color: string;
  onComplete: () => void;
}) {
  const [count, setCount] = useState(5);
  const beep = useBeepSound();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => onCompleteRef.current(), 200);
          return 0;
        }
        if (prev <= 3) beep.playCountdownBeep();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="flex flex-col items-center gap-5"
    >
      <div
        className="text-xs uppercase tracking-widest font-bold"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        Rest
      </div>
      <motion.div
        key={count}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.3, opacity: 0 }}
        className="text-8xl font-bold font-mono"
        style={{ color: count > 0 ? color : "white" }}
      >
        {count > 0 ? count : "GO!"}
      </motion.div>
      <div
        className="text-sm font-medium text-center px-4"
        style={{ color: "rgba(255,255,255,0.55)" }}
      >
        Next: {nextExerciseName}
      </div>
    </motion.div>
  );
}

function BreathingVisual({
  active,
  color,
  timing,
  audioEnabled = true,
  shouldFinish = false,
  onComplete,
}: {
  active: boolean;
  color: string;
  timing: BreathTiming;
  audioEnabled?: boolean;
  shouldFinish?: boolean;
  onComplete?: () => void;
}) {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [scale, setScale] = useState(0.5);
  const cancelledRef = useRef(false);
  const shouldFinishRef = useRef(false);
  useEffect(() => { shouldFinishRef.current = shouldFinish; }, [shouldFinish]);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  const inhaleAudioRef = useRef<HTMLAudioElement | null>(null);
  const holdAudioRef = useRef<HTMLAudioElement | null>(null);
  const exhaleAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    inhaleAudioRef.current = new Audio("/audio/inhale.mp3");
    holdAudioRef.current = new Audio("/audio/hold.mp3");
    exhaleAudioRef.current = new Audio("/audio/exhale.mp3");
    return () => {
      [inhaleAudioRef, holdAudioRef, exhaleAudioRef].forEach((r) => {
        if (r.current) { r.current.pause(); r.current.src = ""; }
      });
    };
  }, []);

  const playBreathAudio = useCallback((p: "inhale" | "hold" | "exhale") => {
    if (!audioEnabled) return;
    [inhaleAudioRef, holdAudioRef, exhaleAudioRef].forEach((r) => {
      if (r.current) { r.current.pause(); r.current.currentTime = 0; }
    });
    const map = { inhale: inhaleAudioRef, hold: holdAudioRef, exhale: exhaleAudioRef };
    map[p].current?.play().catch(() => {});
  }, [audioEnabled]);

  useEffect(() => {
    cancelledRef.current = false;
    if (!active) return;

    const animate = async () => {
      const frameMs = 50;
      while (!cancelledRef.current) {
        setPhase("inhale");
        playBreathAudio("inhale");
        const inhaleFrames = Math.floor((timing.inhaleSeconds * 1000) / frameMs);
        for (let i = 0; i <= inhaleFrames; i++) {
          if (cancelledRef.current) return;
          setScale(0.5 + (i / inhaleFrames) * 0.5);
          await new Promise((r) => setTimeout(r, frameMs));
        }
        setPhase("hold");
        playBreathAudio("hold");
        const holdMs = timing.holdSeconds * 1000;
        const holdStart = Date.now();
        while (Date.now() - holdStart < holdMs) {
          if (cancelledRef.current) return;
          await new Promise((r) => setTimeout(r, 100));
        }
        setPhase("exhale");
        playBreathAudio("exhale");
        const exhaleFrames = Math.floor((timing.exhaleSeconds * 1000) / frameMs);
        for (let i = 0; i <= exhaleFrames; i++) {
          if (cancelledRef.current) return;
          setScale(1 - (i / exhaleFrames) * 0.5);
          await new Promise((r) => setTimeout(r, frameMs));
        }
        if (shouldFinishRef.current) {
          cancelledRef.current = true;
          onCompleteRef.current?.();
          return;
        }
      }
    };
    animate();
    return () => { cancelledRef.current = true; };
  }, [active, timing.inhaleSeconds, timing.holdSeconds, timing.exhaleSeconds, playBreathAudio]);

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
  onRetry,
  isPending,
  isError,
  antiGrindMultiplier,
  dailyCapReached,
  isOnboardingComplete,
}: {
  activity: ActivityDefinition;
  colors: any;
  xpEarned: number | null;
  onFinish: () => void;
  onRetry: () => void;
  isPending: boolean;
  isError: boolean;
  antiGrindMultiplier?: number;
  dailyCapReached?: boolean;
  isOnboardingComplete?: boolean;
}) {
  const xpNote = dailyCapReached
    ? "Daily XP limit reached"
    : antiGrindMultiplier === 0.5
    ? "Reduced XP — already done today"
    : antiGrindMultiplier === 0.25
    ? "Minimal XP — third repetition"
    : null;

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
      {/* XP is only shown post-onboarding so the focus stays on building habits first */}
      {isOnboardingComplete && xpEarned !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-2xl font-bold" style={{ color: activity.color }}>
            +{xpEarned} XP
          </span>
          {xpNote && (
            <span className="text-xs opacity-60" style={{ color: colors.textMuted }}>
              {xpNote}
            </span>
          )}
        </motion.div>
      )}
      {isError ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm" style={{ color: "rgba(255,100,100,0.8)" }}>
            Couldn't save your session. Check your connection.
          </p>
          <button
            className="px-8 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
            style={{ backgroundColor: `${activity.color}20`, border: `1px solid ${activity.color}40`, color: activity.color }}
            onClick={onRetry}
            data-testid="button-retry-activity"
          >
            Retry
          </button>
        </div>
      ) : (
        <button
          className="px-10 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 mt-2"
          style={{ backgroundColor: activity.color, color: "#fff" }}
          onClick={onFinish}
          disabled={isPending}
          data-testid="button-finish-activity"
        >
          {isPending ? "Saving..." : "Continue"}
        </button>
      )}
    </motion.div>
  );
}

export interface GuidedActivityEngineProps {
  activity: ActivityDefinition;
  playerId: string;
  onComplete: (xpEarned: number) => void;
  onCancel: () => void;
  isOnboardingComplete?: boolean;
}

export function GuidedActivityEngine({
  activity,
  playerId,
  onComplete,
  onCancel,
  isOnboardingComplete,
}: GuidedActivityEngineProps) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const queryClient = useQueryClient();
  const audio = useAudioEnabled();
  const beep = useBeepSound();

  // --- Restore from saved session if available ---
  const savedSession = useMemo(() => {
    const s = loadSession();
    return s?.activityId === activity.id ? s : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [currentStepIdx, setCurrentStepIdx] = useState(savedSession?.stepIdx ?? 0);
  const [stepPhase, setStepPhase] = useState<"ready" | "getready" | "running" | "done" | "rest">(
    savedSession?.stepPhase === "running" ? "ready" : (savedSession?.stepPhase ?? "ready")
  );
  const [stepsCompleted, setStepsCompleted] = useState<Set<number>>(
    () => new Set(savedSession?.stepsCompleted ?? [])
  );
  const [stepsSkipped, setStepsSkipped] = useState<Set<number>>(
    () => new Set(savedSession?.stepsSkipped ?? [])
  );
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [antiGrindMultiplier, setAntiGrindMultiplier] = useState<number>(1.0);
  const [dailyCapReached, setDailyCapReached] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(savedSession?.timerRemaining ?? 0);
  const [breathShouldFinish, setBreathShouldFinish] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const music = useWorkoutMusic();
  const pausedRemainingRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = activity.steps[currentStepIdx];
  const isCompletionStep = step?.type === "completion";
  const isTimerStep = step?.type === "timer";
  const isBreathStep = step?.type === "breath";
  const isCheckStep = step?.type === "check";
  const isRepStep = step?.type === "rep";
  const [showCheckInfo, setShowCheckInfo] = useState(false);
  // Per-step rep counter (resets every time the active step changes).
  const [currentReps, setCurrentReps] = useState(0);
  // Actual reps the user completed per step idx — used by the calorie
  // sync so finishing early ("Done Set" before reaching target) doesn't
  // overstate burn. Kept in a ref so the latest value is visible inside
  // the completion mutation closure.
  const actualRepsRef = useRef<Record<number, number>>(savedSession?.repsPerStep ?? {});

  useEffect(() => {
    setShowCheckInfo(false);
    setCurrentReps(0);
  }, [currentStepIdx]);

  // --- Persist session state so the user can resume after navigating away ---
  useEffect(() => {
    if (isCompletionStep) return; // don't save on completion step
    saveSession({
      activityId: activity.id,
      stepIdx: currentStepIdx,
      stepPhase: stepPhase === "rest" || stepPhase === "getready" ? "ready" : stepPhase,
      timerRemaining,
      stepsCompleted: Array.from(stepsCompleted),
      stepsSkipped: Array.from(stepsSkipped),
      repsPerStep: actualRepsRef.current,
      savedAt: Date.now(),
    });
  }, [currentStepIdx, stepPhase, timerRemaining, stepsCompleted, stepsSkipped, isCompletionStep, activity.id]);

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
      clearSession();
      const earned = data?.xpEarned ?? 0;
      setXpEarned(earned);
      setAntiGrindMultiplier(data?.antiGrindMultiplier ?? 1.0);
      setDailyCapReached(data?.dailyCapReached ?? false);
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

      // Sync calories burned from this circuit into the daily workout log.
      // We log ONE summary entry per completed Daily Flow circuit:
      //   { name: <activity name>, calories: <sum across completed steps> }
      // Rep steps use the per-rep table; timer steps use the MET formula.
      // Skipped steps are excluded so calories are never overstated.
      try {
        const completedSteps = activity.steps
          .map((s, idx) => ({ s, idx }))
          .filter(({ idx }) => stepsCompleted.has(idx) && !stepsSkipped.has(idx))
          .map(({ s }) => s);
        const settings = readEnergySettings();
        let totalCalories = 0;
        for (const s of completedSteps) {
          const name = stepIdToExerciseName(s.id);
          if (!name) continue;
          if (s.type === "rep" && s.repCount && s.repCount > 0) {
            // Use ACTUAL reps the user counted, not the target — finishing
            // the set early via "Done Set" must not inflate burn.
            const idx = activity.steps.indexOf(s);
            const actual = actualRepsRef.current[idx];
            const reps = typeof actual === "number" ? Math.min(actual, s.repCount) : 0;
            if (reps > 0) totalCalories += caloriesForReps(name, reps);
          } else if (s.type === "timer" && s.durationSeconds && s.durationSeconds > 0) {
            totalCalories += caloriesForTime(name, s.durationSeconds, settings.weightKg);
          }
        }
        if (totalCalories > 0) {
          addWorkout({ name: activity.activityName, calories: totalCalories });
        }
      } catch (err) {
        console.warn("[guided-session] workout sync failed", err);
      }
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
      const currentStep = activity.steps[currentStepIdx];
      const nextStep = activity.steps[nextIdx];
      const isRestStep = (s?: ActivityStep) =>
        !!s && s.type === "timer" &&
        (s.label === "Rest" || s.id.startsWith("rest") || s.id === "set_break");
      const currentIsRest = isRestStep(currentStep);
      const nextIsRest = isRestStep(nextStep);
      if (
        activity.autoflow &&
        currentStep?.type === "timer" &&
        nextStep?.type === "timer" &&
        (currentIsRest || nextIsRest)
      ) {
        // Skip the auto "Get Ready" countdown when entering or leaving a
        // rest — the rest itself already serves as the transition prep.
        setTimeout(() => {
          setCurrentStepIdx(nextIdx);
          setStepPhase("ready");
        }, 400);
      } else if (activity.autoflow && currentStep?.type === "timer" && nextStep?.type === "timer") {
        setTimeout(() => {
          setCurrentStepIdx(nextIdx);
          setStepPhase("getready");
        }, 400);
      } else if (activity.autoflow && currentStep?.type === "timer" && nextStep?.type !== "completion") {
        setTimeout(() => {
          setCurrentStepIdx(nextIdx);
          setStepPhase("ready");
        }, 400);
      } else if (activity.autoflow && currentStep?.type === "instruction" && nextStep?.type === "timer") {
        setTimeout(() => {
          setCurrentStepIdx(nextIdx);
          setStepPhase("getready");
        }, 400);
      } else if (activity.autoflow && currentStep?.type === "rep" && nextStep?.type === "timer") {
        // Coming off active rep work into a timed hold (e.g. situps → plank)
        // or a rest break. For an active timer, run the 6s "Get Ready"
        // countdown then auto-start the timer; for a rest, skip the
        // countdown and let the auto-start hook take over.
        setTimeout(() => {
          setCurrentStepIdx(nextIdx);
          setStepPhase(nextIsRest ? "ready" : "getready");
        }, 400);
      } else {
        setTimeout(() => {
          setCurrentStepIdx(nextIdx);
          setStepPhase("ready");
        }, 400);
      }
    }
  }, [currentStepIdx, activity]);

  const startTimerFromRemaining = useCallback((initialRemaining: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStepPhase("running");
    setIsPaused(false);
    let remaining = initialRemaining;
    setTimerRemaining(remaining);
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setTimerRemaining(remaining);
      if (remaining <= 3 && remaining > 0) {
        beep.playCountdownBeep();
      }
      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        beep.playCompleteBeep();
        advanceStep();
      }
    }, 1000);
  }, [advanceStep, beep]);

  const startTimer = useCallback(() => {
    if (!step?.durationSeconds) return;
    startTimerFromRemaining(step.durationSeconds);
  }, [step, startTimerFromRemaining]);

  const handlePause = useCallback(() => {
    if (isPaused) {
      startTimerFromRemaining(pausedRemainingRef.current);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      pausedRemainingRef.current = timerRemaining;
      setIsPaused(true);
    }
  }, [isPaused, timerRemaining, startTimerFromRemaining]);

  const handleAction = useCallback(() => {
    if (!step) return;
    if (isTimerStep) {
      setStepPhase("getready");
    } else if (isBreathStep) {
      setStepPhase("getready");
    } else if (isRepStep) {
      setStepPhase("getready");
    } else {
      advanceStep();
    }
  }, [step, isTimerStep, isBreathStep, isRepStep, advanceStep]);

  const handleRepIncrement = useCallback(() => {
    if (!isRepStep || !step?.repCount) return;
    setCurrentReps((prev) => {
      const next = prev + 1;
      actualRepsRef.current[currentStepIdx] = next;
      if (next >= (step.repCount ?? 0)) {
        beep.playCompleteBeep();
        // Defer advance so the user briefly sees the target reached state.
        setTimeout(() => advanceStep(), 250);
      }
      return next;
    });
  }, [isRepStep, step, beep, advanceStep, currentStepIdx]);

  const handleRepDoneEarly = useCallback(() => {
    actualRepsRef.current[currentStepIdx] = currentReps;
    advanceStep();
  }, [currentStepIdx, currentReps, advanceStep]);

  const handleGetReadyComplete = useCallback(() => {
    if (isBreathStep) {
      setStepPhase("running");
      setBreathShouldFinish(false);
      if (step?.durationSeconds) {
        setTimerRemaining(step.durationSeconds);
        let remaining = step.durationSeconds;
        intervalRef.current = setInterval(() => {
          remaining -= 1;
          setTimerRemaining(remaining);
          if (remaining <= 3 && remaining > 0) beep.playCountdownBeep();
          if (remaining <= 0) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            // Defer the completion beep until the breathing visual gracefully
            // finishes its current Inhale → Hold → Exhale cycle. The beep is
            // played in the BreathingVisual onComplete callback below so it
            // lines up with the XP screen instead of cutting into the last
            // hold/exhale voice cue.
            setBreathShouldFinish(true);
          }
        }, 1000);
      }
    } else if (isRepStep) {
      setStepPhase("running");
    } else {
      startTimer();
    }
  }, [isBreathStep, isRepStep, step, startTimer, advanceStep, beep]);

  const handleSkip = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setBreathShouldFinish(false);
    setIsPaused(false);
    // Mark this step as skipped so it's excluded from exercise auto-logging.
    setStepsSkipped((prev) => new Set(prev).add(currentStepIdx));
    advanceStep();
  }, [advanceStep, currentStepIdx]);

  useEffect(() => {
    if (isCompletionStep && !completeMutation.isPending && !completeMutation.isSuccess) {
      completeMutation.mutate();
    }
  }, [isCompletionStep]);

  useEffect(() => {
    if (
      activity.autoflow &&
      step?.type === "instruction" &&
      currentStepIdx > 0 &&
      stepPhase === "ready"
    ) {
      const t = setTimeout(() => advanceStep(), 2500);
      return () => clearTimeout(t);
    }
  }, [currentStepIdx, stepPhase]);

  // Auto-start the next timer in autoflow mode (no extra "Get Ready" overlay)
  // — kicks in only when the engine just chained from a previous rest step.
  useEffect(() => {
    if (
      activity.autoflow &&
      isTimerStep &&
      stepPhase === "ready" &&
      currentStepIdx > 0 &&
      !stepsCompleted.has(currentStepIdx)
    ) {
      const prev = activity.steps[currentStepIdx - 1];
      const current = activity.steps[currentStepIdx];
      const prevWasRest =
        prev?.type === "timer" &&
        (prev.label === "Rest" || prev.id.startsWith("rest") || prev.id === "set_break");
      const currentIsRest =
        current?.type === "timer" &&
        (current.label === "Rest" || current.id.startsWith("rest") || current.id === "set_break");
      if (prevWasRest || currentIsRest) {
        const t = setTimeout(() => startTimer(), 200);
        return () => clearTimeout(t);
      }
    }
  }, [currentStepIdx, stepPhase, isTimerStep, activity, stepsCompleted, startTimer]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const getActionLabel = (s: ActivityStep, stepIdx: number): string => {
    if (s.type === "timer" || s.type === "breath" || s.type === "rep") return "Start";
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
            onClick={audio.toggle}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: `${colors.textMuted}15` }}
            data-testid="button-toggle-voice"
          >
            {audio.enabled ? (
              <Volume2 size={18} style={{ color: activity.color }} />
            ) : (
              <VolumeX size={18} style={{ color: colors.textMuted }} />
            )}
          </button>
          <button
            onClick={() => {
              if (intervalRef.current) clearInterval(intervalRef.current);
              clearSession();
              onCancel();
            }}
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
              onRetry={() => completeMutation.mutate()}
              isPending={completeMutation.isPending}
              isError={completeMutation.isError}
              antiGrindMultiplier={antiGrindMultiplier}
              dailyCapReached={dailyCapReached}
              isOnboardingComplete={isOnboardingComplete}
            />
          ) : stepPhase === "rest" && step ? (
            <RestBreak
              key={`rest-${currentStepIdx}`}
              nextExerciseName={step.label}
              color={activity.color}
              onComplete={() => setStepPhase("getready")}
            />
          ) : stepPhase === "getready" && step ? (
            <GetReadyCountdown
              key={`getready-${currentStepIdx}`}
              color={activity.color}
              onComplete={handleGetReadyComplete}
              exerciseName={step.label}
              videoSrc={step.videoSrc}
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

              {(isTimerStep && stepPhase === "running" && step.videoSrc) ? (
                <VideoExerciseTimer
                  src={step.videoSrc}
                  seconds={step.durationSeconds!}
                  remaining={timerRemaining}
                  label={step.label}
                  color={activity.color}
                  loop={step.loop !== false}
                />
              ) : (isTimerStep && stepPhase === "running") ? (
                <CircularTimer
                  seconds={step.durationSeconds!}
                  remaining={timerRemaining}
                  color={activity.color}
                  label={step.label}
                  exerciseId={step.id}
                />
              ) : (isBreathStep && stepPhase === "running") ? (
                step.videoSrc ? (
                  <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                    <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "9/16", maxHeight: "380px" }}>
                      <video
                        ref={(el) => { if (el) el.play().catch(() => {}); }}
                        src={step.videoSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: "brightness(0.4)" }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <BreathingVisual
                          active={true}
                          color={activity.color}
                          timing={step.breathTiming!}
                          audioEnabled={audio.enabled}
                          shouldFinish={breathShouldFinish}
                          onComplete={() => { beep.playCompleteBeep(); setBreathShouldFinish(false); advanceStep(); }}
                        />
                        <div
                          className="text-2xl font-bold font-mono tabular-nums drop-shadow"
                          style={{ color: activity.color }}
                        >
                          {Math.floor(timerRemaining / 60)}:{(timerRemaining % 60).toString().padStart(2, "0")}
                        </div>
                      </div>
                    </div>
                    <div
                      className="w-full h-1 rounded-full overflow-hidden"
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
                ) : (
                  <>
                    <BreathingVisual
                      active={true}
                      color={activity.color}
                      timing={step.breathTiming!}
                      audioEnabled={audio.enabled}
                      shouldFinish={breathShouldFinish}
                      onComplete={() => { beep.playCompleteBeep(); setBreathShouldFinish(false); advanceStep(); }}
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
                )
              ) : (isRepStep && stepPhase === "running") ? (
                <div className="flex flex-col items-center gap-5 w-full max-w-xs">
                  {step.videoSrc && (
                    <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "9/16", maxHeight: "260px" }}>
                      <video
                        ref={(el) => { if (el) el.play().catch(() => {}); }}
                        src={step.videoSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: "brightness(0.55)" }}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleRepIncrement}
                    data-testid="button-rep-increment"
                    className="w-44 h-44 rounded-full flex flex-col items-center justify-center transition-transform active:scale-95"
                    style={{
                      backgroundColor: `${activity.color}18`,
                      border: `3px solid ${activity.color}`,
                      color: activity.color,
                    }}
                    aria-label="Tap to count rep"
                  >
                    <span className="text-6xl font-bold tabular-nums leading-none" data-testid="text-current-reps">
                      {currentReps}
                    </span>
                    <span className="text-xs uppercase tracking-widest mt-1" style={{ color: colors.textMuted }}>
                      of {step.repCount} {step.repLabel ?? "reps"}
                    </span>
                  </button>
                  <p className="text-[11px] uppercase tracking-widest" style={{ color: colors.textMuted }}>
                    Tap circle for each rep
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentReps((n) => {
                        const next = Math.max(0, n - 1);
                        actualRepsRef.current[currentStepIdx] = next;
                        return next;
                      })}
                      data-testid="button-rep-decrement"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90"
                      style={{
                        backgroundColor: `${colors.textMuted}20`,
                        color: colors.text,
                      }}
                      aria-label="Subtract one rep"
                    >
                      <Minus size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleRepIncrement}
                      data-testid="button-rep-plus"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90"
                      style={{
                        backgroundColor: `${activity.color}30`,
                        color: activity.color,
                      }}
                      aria-label="Add one rep"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleRepDoneEarly}
                    data-testid="button-rep-done"
                    className="px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-transform active:scale-95"
                    style={{ backgroundColor: activity.color, color: "#fff" }}
                  >
                    Done Set
                  </button>
                </div>
              ) : isCheckStep ? (
                <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                  <div
                    className="rounded-xl p-5 w-full"
                    style={{
                      backgroundColor: `${activity.color}10`,
                      border: `1px solid ${activity.color}20`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p
                        className="text-base font-medium leading-relaxed"
                        style={{ color: colors.text }}
                        data-testid="text-step-instruction"
                      >
                        {step.instruction}
                      </p>
                      {step.infoTooltip && (
                        <button
                          onClick={() => setShowCheckInfo(v => !v)}
                          className="shrink-0 mt-0.5 p-1 rounded-lg transition-colors"
                          style={{
                            backgroundColor: showCheckInfo ? `${activity.color}20` : "transparent",
                            color: `${activity.color}90`,
                          }}
                          data-testid="button-meal-info"
                          aria-label="Nutrition info"
                        >
                          <Info size={17} />
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {showCheckInfo && step.infoTooltip && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div
                            className="mt-4 pt-4"
                            style={{ borderTop: `1px solid ${activity.color}20` }}
                          >
                            <p
                              className="text-[10px] font-bold uppercase tracking-wider mb-2.5"
                              style={{ color: `${activity.color}cc` }}
                            >
                              {step.infoTooltip.title}
                            </p>
                            <ul className="space-y-1.5 mb-3">
                              {step.infoTooltip.bullets.map((b) => (
                                <li
                                  key={b}
                                  className="text-xs flex items-start gap-2 leading-relaxed"
                                  style={{ color: `${colors.text}bb` }}
                                >
                                  <span className="shrink-0 mt-0.5" style={{ color: activity.color }}>•</span>
                                  {b}
                                </li>
                              ))}
                            </ul>
                            <p
                              className="text-[10px] leading-relaxed italic"
                              style={{ color: colors.textMuted }}
                            >
                              {step.infoTooltip.note}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {!stepsCompleted.has(currentStepIdx) && (
                    <div className="flex gap-3 w-full">
                      <button
                        className="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        style={{ backgroundColor: activity.color, color: "#fff" }}
                        onClick={() => {
                          if (step.id === "sleep_check") {
                            window.dispatchEvent(new CustomEvent("ascend:sleep-check", { detail: { sleptWell: true } }));
                          }
                          advanceStep();
                        }}
                        data-testid="button-meal-check-yes"
                      >
                        <Check size={16} />
                        Yes
                      </button>
                      <button
                        className="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        style={{
                          backgroundColor: `${activity.color}15`,
                          color: activity.color,
                          border: `1px solid ${activity.color}30`,
                        }}
                        onClick={() => {
                          if (step.id === "sleep_check") {
                            window.dispatchEvent(new CustomEvent("ascend:sleep-check", { detail: { sleptWell: false } }));
                          }
                          advanceStep();
                        }}
                        data-testid="button-meal-check-not-yet"
                      >
                        <Check size={16} />
                        Not yet
                      </button>
                    </div>
                  )}
                </div>
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
                <div className="flex items-center gap-2">
                  {isTimerStep && (
                    <button
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs transition-all active:scale-95"
                      style={{
                        backgroundColor: isPaused ? `${activity.color}20` : `${colors.textMuted}10`,
                        color: isPaused ? activity.color : colors.textMuted,
                        border: `1px solid ${isPaused ? activity.color + "40" : colors.textMuted + "20"}`,
                      }}
                      onClick={handlePause}
                      data-testid="button-pause-step"
                    >
                      {isPaused ? <Play size={14} /> : <Pause size={14} />}
                      {isPaused ? "Resume" : "Pause"}
                    </button>
                  )}
                  {!isPaused && (
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

                  {/* ── Compact music toggle (strength / agility only) ── */}
                  {(activity.category === "strength" || activity.category === "agility") && (
                    <button
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all active:scale-95"
                      style={{
                        backgroundColor: music.isPlaying
                          ? `${activity.color}20`
                          : `${colors.textMuted}10`,
                        color: music.isPlaying ? activity.color : colors.textMuted,
                        border: `1px solid ${music.isPlaying ? activity.color + "50" : colors.textMuted + "20"}`,
                      }}
                      onClick={() => (music.isPlaying ? pauseMusic() : playMusic())}
                      data-testid="button-music-inline"
                    >
                      {music.isPlaying ? (
                        <span className="flex items-end gap-[2px] h-3.5" aria-hidden>
                          {[0.6, 1, 0.4, 0.8].map((h, i) => (
                            <motion.span
                              key={i}
                              className="w-[2px] rounded-full"
                              style={{ backgroundColor: activity.color }}
                              animate={{ scaleY: [h, 1, h * 0.5, 1, h] }}
                              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                            />
                          ))}
                        </span>
                      ) : (
                        <Music size={13} />
                      )}
                    </button>
                  )}
                </div>
              )}

              {!isCheckStep && stepPhase === "ready" && !stepsCompleted.has(currentStepIdx) &&
                // Show the action button when:
                //  • Not autoflow (user always taps to advance)
                //  • First step of any autoflow activity
                //  • Rep steps that need explicit user counting
                //  • A session was restored mid-activity — always surface an
                //    escape-hatch "Resume" button so the user isn't soft-locked
                //    on a step that autoflow would normally skip-over
                (!activity.autoflow || currentStepIdx === 0 || isRepStep || !!savedSession) && (
                <button
                  className="px-8 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
                  style={{ backgroundColor: activity.color, color: "#fff" }}
                  onClick={handleAction}
                  data-testid="button-step-action"
                >
                  <Play size={16} />
                  {savedSession && currentStepIdx > 0 && !isRepStep
                    ? "Resume"
                    : getActionLabel(step, currentStepIdx)}
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

      {/* ── Workout music panel (strength + agility only) ─── */}
      {(activity.category === "strength" || activity.category === "agility") && (
        <WorkoutMusicPlayer
          category={activity.category}
          workoutPaused={isPaused}
          workoutDone={isCompletionStep}
          accentColor={activity.color}
        />
      )}
    </motion.div>
  );
}
