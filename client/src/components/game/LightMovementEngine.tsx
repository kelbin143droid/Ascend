import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, SkipForward, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { addXP, completeTask } from "@/lib/workoutProgressStore";
import { PHASE1_XP } from "@shared/gameProgression";

const COLOR = "#22c55e";
const REST_SECONDS = 7;
const XP_REWARD = PHASE1_XP.agility;

interface Exercise {
  id: string;
  name: string;
  instruction: string;
  video: string;
  duration: number;
  loop: boolean;
}

const EXERCISES: Exercise[] = [
  {
    id: "shoulder_forward",
    name: "Forward Shoulder Roll",
    instruction: "Roll your shoulders forward in smooth circles. Keep your neck relaxed.",
    video: "/videos/shoulder-roll-forward.mp4",
    duration: 15,
    loop: true,
  },
  {
    id: "shoulder_backward",
    name: "Backwards Shoulder Roll",
    instruction: "Roll your shoulders backwards in smooth circles. Keep your neck relaxed and breathe steadily.",
    video: "/videos/shoulder-roll-backward.mp4",
    duration: 20,
    loop: true,
  },
  {
    id: "tricep_left",
    name: "Tricep Stretch · Left",
    instruction: "Reach your left arm behind your head. Use your right hand to gently press down. Hold and breathe.",
    video: "/videos/tricep_left.mp4",
    duration: 15,
    loop: false,
  },
  {
    id: "tricep_right",
    name: "Tricep Stretch · Right",
    instruction: "Switch sides — right arm behind your head. Press gently and hold.",
    video: "/videos/tricep_right.mp4",
    duration: 15,
    loop: false,
  },
  {
    id: "cross_arm_left",
    name: "Cross Arm Stretch · Left",
    instruction: "Bring your left arm across your chest. Pull it close with your right hand. Hold steady.",
    video: "/videos/cross_arm_left.mp4",
    duration: 15,
    loop: false,
  },
  {
    id: "cross_arm_right",
    name: "Cross Arm Stretch · Right",
    instruction: "Switch — pull your right arm across your chest. Breathe steadily and hold.",
    video: "/videos/cross_arm_right.mp4",
    duration: 15,
    loop: false,
  },
  {
    id: "toe_hold",
    name: "Toe Hold",
    instruction: "Slowly fold forward, reach down, and hold your toes. No bouncing — just a gentle hold.",
    video: "/videos/toe_hold.mp4",
    duration: 15,
    loop: false,
  },
  {
    id: "arm_shake",
    name: "Arm Shake",
    instruction: "Shake out your arms and hands loosely. Let everything go — wrists, fingers, shoulders.",
    video: "/videos/arm-shake.mp4",
    duration: 15,
    loop: true,
  },
];

function useBeep() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback((freq: number, duration: number, delay = 0) => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    } catch {}
  }, [getCtx]);

  const beepDone = useCallback(() => {
    playTone(523, 0.15, 0);
    playTone(659, 0.15, 0.18);
    playTone(784, 0.25, 0.36);
  }, [playTone]);

  const beepTick = useCallback(() => {
    playTone(440, 0.08);
  }, [playTone]);

  return { beepDone, beepTick };
}

function CircularCountdown({
  total,
  remaining,
  isRest,
}: {
  total: number;
  remaining: number;
  isRest: boolean;
}) {
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const progress = total > 0 ? 1 - remaining / total : 1;
  const offset = circ * (1 - progress);
  const accent = isRest ? "#94a3b8" : COLOR;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={radius} fill="none" stroke={`${accent}20`} strokeWidth="6" />
        <circle
          cx="44" cy="44" r={radius}
          fill="none"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <div className="z-10 flex flex-col items-center">
        <span className="text-2xl font-bold font-mono tabular-nums" style={{ color: accent }}>
          {remaining}
        </span>
        <span className="text-[9px] uppercase tracking-wider" style={{ color: `${accent}88` }}>
          {isRest ? "rest" : "sec"}
        </span>
      </div>
    </div>
  );
}

interface LightMovementEngineProps {
  playerId: string;
  onComplete: (xpEarned: number) => void;
  onCancel: () => void;
  nextLabel?: string;
  /** When true, skip internal complete-guided-session call (parent handles XP) */
  noApiCall?: boolean;
}

type Phase = "intro" | "running" | "rest" | "bow" | "done";

export function LightMovementEngine({ playerId, onComplete, onCancel, nextLabel, noApiCall = false }: LightMovementEngineProps) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const queryClient = useQueryClient();

  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [countdown, setCountdown] = useState(0);
  const [xpClaimed, setXpClaimed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [bowEnded, setBowEnded] = useState(false);
  const [earnedXp, setEarnedXp] = useState<number>(15);
  const bowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompletedRef = useRef(false);

  const pausedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bowVideoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { beepDone, beepTick } = useBeep();

  const exercise = EXERCISES[exerciseIdx];
  const isLast = exerciseIdx === EXERCISES.length - 1;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finishCompletion = useCallback((xp: number) => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    if (completeFallbackRef.current) {
      clearTimeout(completeFallbackRef.current);
      completeFallbackRef.current = null;
    }
    onCompleteRef.current(xp);
  }, []);

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/player/${playerId}/complete-guided-session`, {
        sessionId: "light-movement",
        stat: "agility",
        durationMinutes: 3,
        category: "agility",
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      const xp = data?.xpEarned ?? XP_REWARD;
      setEarnedXp(xp);
      addXP(xp, "agility");
      completeTask("agility");
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId] });
      queryClient.invalidateQueries({ queryKey: ["home", playerId] });
      finishCompletion(xp);
    },
    onError: () => {
      finishCompletion(XP_REWARD);
    },
  });

  const exerciseIdxRef = useRef(exerciseIdx);
  exerciseIdxRef.current = exerciseIdx;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(
    (seconds: number, onDone: () => void) => {
      clearTimer();
      setCountdown(seconds);
      let remaining = seconds;
      intervalRef.current = setInterval(() => {
        if (pausedRef.current) return;
        remaining -= 1;
        if (remaining <= 3 && remaining > 0) beepTick();
        if (remaining <= 0) {
          clearTimer();
          onDone();
        } else {
          setCountdown(remaining);
        }
      }, 1000);
    },
    [clearTimer, beepTick]
  );

  const startRestRef = useRef<() => void>(() => {});

  const goToNextExercise = useCallback(() => {
    const next = exerciseIdxRef.current + 1;
    if (next >= EXERCISES.length) {
      beepDone();
      setPhase("bow");
    } else {
      setExerciseIdx(next);
      setPhase("running");
      const nextEx = EXERCISES[next];
      setCountdown(nextEx.duration);
      startCountdown(nextEx.duration, () => startRestRef.current());
    }
  }, [startCountdown, beepDone]);

  const startRest = useCallback(() => {
    beepDone();
    setPhase("rest");
    setCountdown(REST_SECONDS);
    startCountdown(REST_SECONDS, goToNextExercise);
  }, [beepDone, startCountdown, goToNextExercise]);

  startRestRef.current = startRest;

  const beginExercise = useCallback(() => {
    setPaused(false);
    pausedRef.current = false;
    setPhase("running");
    setCountdown(exercise.duration);
    startCountdown(exercise.duration, startRest);
  }, [exercise.duration, startCountdown, startRest]);

  const togglePause = useCallback(() => {
    setPaused(p => {
      pausedRef.current = !p;
      return !p;
    });
  }, []);

  const handleSkip = useCallback(() => {
    clearTimer();
    setPaused(false);
    pausedRef.current = false;
    if (phaseRef.current === "rest") {
      goToNextExercise();
    } else {
      if (exerciseIdxRef.current === EXERCISES.length - 1) {
        beepDone();
        setPhase("bow");
      } else {
        startRest();
      }
    }
  }, [clearTimer, beepDone, goToNextExercise, startRest]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    return () => {
      if (completeFallbackRef.current) clearTimeout(completeFallbackRef.current);
    };
  }, []);

  const exerciseVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
  }, []);

  // When exercise or phase changes: restart/play/pause the video
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (phase === "running" || phase === "intro") {
      el.currentTime = 0;
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [exerciseIdx, phase]);

  // When paused state changes: play or pause the video accordingly
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (paused) {
      el.pause();
    } else if (phase === "running" || phase === "intro") {
      el.play().catch(() => {});
    }
  }, [paused, phase]);

  const bowVideoCallback = useCallback((el: HTMLVideoElement | null) => {
    bowVideoRef.current = el;
  }, []);

  useEffect(() => {
    if (phase !== "bow") return;
    setBowEnded(false);
    if (bowTimerRef.current) clearTimeout(bowTimerRef.current);

    let videoEnded = false;
    let minTimePassed = false;

    const tryReveal = () => {
      if (videoEnded && minTimePassed) setBowEnded(true);
    };

    const minTimer = setTimeout(() => {
      minTimePassed = true;
      tryReveal();
    }, 3000);

    const tryPlay = () => {
      const el = bowVideoRef.current;
      if (!el) {
        bowTimerRef.current = setTimeout(() => setBowEnded(true), 8000);
        return;
      }

      el.currentTime = 0;
      el.play().catch(() => {});

      const onEnded = () => { videoEnded = true; tryReveal(); };
      el.addEventListener("ended", onEnded, { once: true });

      const startFallback = () => {
        const dur = isFinite(el.duration) && el.duration > 0 ? el.duration : 5;
        bowTimerRef.current = setTimeout(() => { videoEnded = true; tryReveal(); }, (dur + 2) * 1000);
      };

      if (isFinite(el.duration) && el.duration > 0) {
        startFallback();
      } else {
        el.addEventListener("loadedmetadata", startFallback, { once: true });
        bowTimerRef.current = setTimeout(() => setBowEnded(true), 12000);
      }
    };

    const mountTimer = setTimeout(tryPlay, 50);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(mountTimer);
      if (bowTimerRef.current) clearTimeout(bowTimerRef.current);
    };
  }, [phase]);

  const handleClaim = useCallback(() => {
    if (!noApiCall && !xpClaimed) {
      setXpClaimed(true);
      localStorage.setItem("ascend_light_movement_completed", new Date().toISOString().split("T")[0]);
      completeTask("phase1_agility");
      completeFallbackRef.current = setTimeout(() => finishCompletion(XP_REWARD), 9000);
      claimMutation.mutate();
    } else {
      finishCompletion(XP_REWARD);
    }
  }, [noApiCall, xpClaimed, claimMutation, finishCompletion]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "#000" }}
      data-testid="light-movement-engine"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-safe pt-4 pb-3">
        <div className="flex items-center gap-2">
          {EXERCISES.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: i === exerciseIdx && phase !== "bow" ? 20 : 8,
                backgroundColor:
                  i < exerciseIdx
                    ? COLOR
                    : i === exerciseIdx && phase !== "bow"
                    ? COLOR
                    : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
        <button
          onClick={() => { clearTimer(); onCancel(); }}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          data-testid="button-cancel-light-movement"
        >
          <X size={16} className="text-white" />
        </button>
      </div>

      {/* Preload next two exercise videos while current plays */}
      {phase === "running" && exerciseIdx + 1 < EXERCISES.length && (
        <video
          key={`preload-${exerciseIdx + 1}`}
          src={EXERCISES[exerciseIdx + 1].video}
          preload="auto"
          muted
          playsInline
          style={{ display: "none" }}
        />
      )}
      {phase === "running" && exerciseIdx + 2 < EXERCISES.length && (
        <video
          key={`preload-${exerciseIdx + 2}`}
          src={EXERCISES[exerciseIdx + 2].video}
          preload="auto"
          muted
          playsInline
          style={{ display: "none" }}
        />
      )}

      {/* Video background */}
      <AnimatePresence mode="sync">
        {phase !== "bow" ? (
          <motion.div
            key={`vid-${exerciseIdx}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "rest" ? 0.3 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <video
              ref={exerciseVideoRef}
              key={`video-${exerciseIdx}`}
              src={exercise.video}
              className="w-full h-full object-cover"
              playsInline
              autoPlay
              muted
              loop={exercise.loop}
              preload="auto"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.75) 100%)",
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="bow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0"
          >
            <video
              ref={bowVideoCallback}
              src="/videos/bow-finish.mp4"
              className="w-full h-full object-cover"
              playsInline
              autoPlay
              muted
              loop={false}
              preload="auto"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(0,0,0,0.8) 80%)" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rest overlay */}
      <AnimatePresence>
        {phase === "rest" && (
          <motion.div
            key="rest-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="text-white text-lg font-bold tracking-wide">Rest</div>
              <CircularCountdown total={REST_SECONDS} remaining={countdown} isRest />
              <div className="text-white/85 text-xs font-medium">
                {isLast ? "Last exercise done" : `Next: ${EXERCISES[exerciseIdx + 1]?.name}`}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paused overlay */}
      <AnimatePresence>
        {paused && phase === "running" && (
          <motion.div
            key="paused-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.45)" }}
          >
            <div className="flex flex-col items-center gap-2">
              <Pause size={40} className="text-white/60" />
              <span className="text-white/50 text-sm tracking-wider uppercase">Paused</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-10">
        <AnimatePresence mode="wait">

          {/* INTRO */}
          {phase === "intro" && (
            <motion.div
              key={`intro-${exerciseIdx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-4"
            >
              <div>
                <div className="text-xs uppercase tracking-widest mb-1" style={{ color: `${COLOR}cc` }}>
                  Exercise {exerciseIdx + 1} of {EXERCISES.length}
                </div>
                <div className="text-white text-xl font-bold leading-tight">
                  {exercise.name}
                </div>
                <div className="text-white/90 text-sm mt-2 leading-relaxed font-medium">
                  {exercise.instruction}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                <span>⏱ {exercise.duration}s</span>
                {exercise.loop && <span>· Looped</span>}
              </div>
              <button
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ backgroundColor: COLOR, color: "#fff" }}
                onClick={beginExercise}
                data-testid={`button-begin-exercise-${exercise.id}`}
              >
                <Play size={18} />
                Begin
              </button>
            </motion.div>
          )}

          {/* RUNNING */}
          {phase === "running" && (
            <motion.div
              key={`running-${exerciseIdx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              {/* Exercise label + countdown */}
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-white/50 text-xs uppercase tracking-widest mb-1">
                    {exerciseIdx + 1} / {EXERCISES.length}
                  </div>
                  <div className="text-white text-lg font-bold">{exercise.name}</div>
                </div>
                <CircularCountdown total={exercise.duration} remaining={countdown} isRest={false} />
              </div>

              {/* Pause / Skip controls */}
              <div className="flex gap-3">
                <button
                  data-testid="button-pause-light-movement"
                  onClick={togglePause}
                  className="flex-1 py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.96]"
                  style={{
                    backgroundColor: paused ? `${COLOR}18` : "rgba(255,255,255,0.08)",
                    border: paused ? `1px solid ${COLOR}45` : "1px solid rgba(255,255,255,0.12)",
                    color: paused ? COLOR : "rgba(255,255,255,0.65)",
                  }}
                >
                  {paused ? <Play size={14} /> : <Pause size={14} />}
                  {paused ? "Resume" : "Pause"}
                </button>
                <button
                  data-testid="button-skip-light-movement"
                  onClick={handleSkip}
                  className="flex-1 py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.96]"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "rgba(255,255,255,0.40)",
                  }}
                >
                  <SkipForward size={14} />
                  Skip
                </button>
              </div>
            </motion.div>
          )}

          {/* REST — also shows skip button */}
          {phase === "rest" && (
            <motion.div
              key="rest-controls"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex justify-center"
            >
              <button
                data-testid="button-skip-rest"
                onClick={handleSkip}
                className="px-8 py-2.5 rounded-2xl text-sm font-medium flex items-center gap-2 transition-all active:scale-95"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.40)",
                }}
              >
                <SkipForward size={13} />
                Skip Rest
              </button>
            </motion.div>
          )}

          {/* BOW / COMPLETE — appears after bow video finishes */}
          {phase === "bow" && bowEnded && (
            <motion.div
              key="bow-complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={20} style={{ color: COLOR }} />
                <span className="text-white font-bold text-lg">Circuit Complete</span>
              </div>
              <div className="text-white/90 text-sm font-medium">
                All 8 exercises done. Your body thanks you.
              </div>
              <div
                className="text-center font-bold text-2xl tracking-wide"
                style={{ color: COLOR }}
              >
                +{earnedXp} XP
              </div>
              <button
                className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
                style={{ backgroundColor: COLOR, color: "#fff" }}
                onClick={handleClaim}
                data-testid="button-claim-light-movement-xp"
              >
                {nextLabel ? `Continue to ${nextLabel}` : "Continue"}
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}
