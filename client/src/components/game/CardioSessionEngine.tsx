import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const COLOR = "#f97316";
const REST_SECONDS = 5;
const XP_REWARD = 35;

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
    id: "jogging",
    name: "Jog in Place",
    instruction: "Lift your knees, keep a steady rhythm. Land softly and breathe through it.",
    video: "/videos/jumping-jacks.mp4",
    duration: 20,
    loop: true,
  },
  {
    id: "jumping_jacks",
    name: "Jumping Jacks",
    instruction: "Arms up as legs go wide, back together as they close. Keep the pace comfortable.",
    video: "/videos/shadow-boxing.mp4",
    duration: 15,
    loop: true,
  },
  {
    id: "shadow_boxing",
    name: "Shadow Boxing",
    instruction: "Alternate punches forward. Keep your core tight and move with intention.",
    video: "/videos/cardio-bow.mp4",
    duration: 20,
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

  const beepTick = useCallback(() => playTone(880, 0.08), [playTone]);
  const beepDone = useCallback(() => {
    playTone(660, 0.1, 0);
    playTone(880, 0.1, 0.12);
    playTone(1100, 0.15, 0.24);
  }, [playTone]);

  return { beepTick, beepDone };
}

function CircularCountdown({ total, remaining, isRest }: { total: number; remaining: number; isRest?: boolean }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const progress = total > 0 ? remaining / total : 0;
  const dash = circ * progress;
  const color = isRest ? "rgba(255,255,255,0.3)" : COLOR;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.9s linear" }}
        />
      </svg>
      <span className="text-white text-3xl font-bold tabular-nums">{remaining}</span>
    </div>
  );
}

interface Props {
  playerId: number;
  onComplete: (xp: number) => void;
  onCancel: () => void;
  noApiCall?: boolean;
}

export function CardioSessionEngine({ playerId, onComplete, onCancel, noApiCall = false }: Props) {
  const queryClient = useQueryClient();
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [phase, setPhase] = useState<"intro" | "running" | "rest" | "bow">("intro");
  const [countdown, setCountdown] = useState(EXERCISES[0].duration);
  const [started, setStarted] = useState(false);
  const [bowEnded, setBowEnded] = useState(false);
  const [xpClaimed, setXpClaimed] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bowVideoRef = useRef<HTMLVideoElement | null>(null);
  const bowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const exercise = EXERCISES[exerciseIdx];
  const isLast = exerciseIdx === EXERCISES.length - 1;

  const { beepTick, beepDone } = useBeep();

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/player/${playerId}/complete-guided-session`, {
        activityId: "phase1_strength",
        xpEarned: XP_REWARD,
        category: "strength",
        xpMultiplier: 1.0,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      queryClient.invalidateQueries({ queryKey: ["home"] });
    },
  });

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startRestRef = useRef<() => void>(() => {});

  const startCountdown = useCallback(
    (seconds: number, onDone: () => void) => {
      clearTimer();
      setCountdown(seconds);
      let remaining = seconds;
      intervalRef.current = setInterval(() => {
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

  const goToNextExercise = useCallback(() => {
    const next = exerciseIdx + 1;
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
  }, [exerciseIdx, startCountdown, beepDone]);

  const startRest = useCallback(() => {
    beepDone();
    setPhase("rest");
    setCountdown(REST_SECONDS);
    startCountdown(REST_SECONDS, goToNextExercise);
  }, [beepDone, startCountdown, goToNextExercise]);

  startRestRef.current = startRest;

  const beginExercise = useCallback(() => {
    setStarted(true);
    setPhase("running");
    startCountdown(exercise.duration, () => startRestRef.current());
  }, [exercise.duration, startCountdown]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Simple ref — just stores the element
  const exerciseVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
  }, []);

  // Restart from frame 0 whenever exercise or phase changes
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (phase === "running") {
      el.pause();
      el.currentTime = 0;
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [exerciseIdx, phase]);

  // Bow phase: play video, show card when both video-ended AND min time passed
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
    onCompleteRef.current(XP_REWARD);
    if (!noApiCall && !xpClaimed) {
      setXpClaimed(true);
      localStorage.setItem("ascend_light_movement_completed", new Date().toISOString().split("T")[0]);
      claimMutation.mutate();
    }
  }, [noApiCall, xpClaimed, claimMutation]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "#000" }}
      data-testid="cardio-session-engine"
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
                  i < exerciseIdx ? COLOR
                    : i === exerciseIdx && phase !== "bow" ? COLOR
                    : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
        <button
          onClick={() => { clearTimer(); onCancel(); }}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          data-testid="button-cancel-cardio"
        >
          <X size={16} className="text-white" />
        </button>
      </div>

      {/* Preload next video */}
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
                background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.75) 100%)",
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
              ref={(el) => { bowVideoRef.current = el; }}
              src="/videos/jogging.mp4"
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
            className="absolute inset-0 z-10 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
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

      {/* Bottom UI */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-safe pb-8 pt-4">
        <AnimatePresence mode="wait">
          {phase === "intro" && !started && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              <div className="text-white/70 text-[10px] uppercase tracking-widest">
                Exercise 1 of {EXERCISES.length}
              </div>
              <div className="text-white text-xl font-bold leading-tight">{exercise.name}</div>
              <div className="text-white/90 text-sm leading-relaxed font-medium">{exercise.instruction}</div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                <span>⏱ {exercise.duration}s</span>
                {exercise.loop && <span>· Looped</span>}
              </div>
              <button
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ backgroundColor: COLOR, color: "#fff" }}
                onClick={beginExercise}
                data-testid="button-begin-cardio"
              >
                Begin
              </button>
            </motion.div>
          )}

          {phase === "running" && (
            <motion.div
              key={`running-${exerciseIdx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="text-white/70 text-[10px] uppercase tracking-widest">
                Exercise {exerciseIdx + 1} of {EXERCISES.length}
              </div>
              <div className="text-white text-xl font-bold leading-tight">{exercise.name}</div>
              <div className="text-white/90 text-sm leading-relaxed font-medium">{exercise.instruction}</div>
              <div className="flex items-center gap-2 text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                <span>⏱ {exercise.duration}s</span>
                {exercise.loop && <span>· Looped</span>}
              </div>
              <div className="flex justify-end mt-1">
                <CircularCountdown total={exercise.duration} remaining={countdown} />
              </div>
            </motion.div>
          )}

          {phase === "bow" && bowEnded && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={20} style={{ color: COLOR }} />
                <span className="text-white font-bold text-lg">Circuit Complete</span>
              </div>
              <div className="text-white/90 text-sm font-medium">
                All 3 exercises done. Your energy is building.
              </div>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold w-fit"
                style={{ backgroundColor: `${COLOR}25`, color: COLOR, border: `1px solid ${COLOR}40` }}
              >
                +{XP_REWARD} Strength XP
              </div>
              <button
                className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
                style={{ backgroundColor: COLOR, color: "#fff" }}
                onClick={handleClaim}
                data-testid="button-continue-cardio"
              >
                Continue
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
