import React, { useState, useEffect, useRef } from "react";
import { useGame } from "@/context/GameContext";
import { IntroScreen } from "./IntroScreen";
import { PlayerInfoScreen } from "./PlayerInfoScreen";
import { GenderSelectScreen } from "./GenderSelectScreen";
import { GoalSelectScreen, type AscendGoal } from "./GoalSelectScreen";
import { CalibrationFlow } from "./CalibrationFlow";
import { RecommendedPathScreen } from "./RecommendedPathScreen";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { ArrowRight, CheckCircle2, Wind, Zap } from "lucide-react";
import {
  deriveCalibrationLevel,
  saveCalibrationProfile,
  type CalibrationAnswers,
  type CalibrationProfile,
} from "@/lib/calibrationEngine";
import { setWorkoutLevel } from "@/lib/workoutProgressStore";
import type { WorkoutLevel } from "@/lib/workoutPlans";

interface IntroWrapperProps {
  children: React.ReactNode;
}

const FIRST_RESET_DURATION_SECONDS = 30;
const FIRST_RESET_XP = 15;
const FIRST_RESET_STORAGE_KEY = "ascend_first_reset_done";
const FIRST_RESET_COMPLETED_DATE_KEY = "ascend_first_reset_completed_date";
const GOAL_STORAGE_KEY = "ascend_primary_goal";
const INHALE_AUDIO_URL = "/audio/inhale.mp3";
const HOLD_AUDIO_URL = "/audio/hold.mp3";
const EXHALE_AUDIO_URL = "/audio/exhale.mp3";
const FIRST_RESET_BACKGROUND_VIDEO_URL = "/first-reset-neural-bg-animated.mp4";

type FirstResetBreathPhase = "inhale" | "hold" | "exhale";
type FirstResetAmbientPad = {
  context: AudioContext;
  output: GainNode;
  oscillators: OscillatorNode[];
  lfos: OscillatorNode[];
  lfoGains: GainNode[];
};

const FIRST_RESET_BREATHING = {
  inhale: 4,
  hold: 2,
  exhale: 4,
} as const;
const FIRST_RESET_CYCLE_SECONDS =
  FIRST_RESET_BREATHING.inhale +
  FIRST_RESET_BREATHING.hold +
  FIRST_RESET_BREATHING.exhale;

function getFirstResetBreathState(elapsedSeconds: number) {
  const cycleSecond = elapsedSeconds % FIRST_RESET_CYCLE_SECONDS;
  if (cycleSecond < FIRST_RESET_BREATHING.inhale) {
    const progress = cycleSecond / FIRST_RESET_BREATHING.inhale;
    return {
      phase: "inhale" as FirstResetBreathPhase,
      secondsLeft: FIRST_RESET_BREATHING.inhale - cycleSecond,
      scale: 0.74 + progress * 0.26,
    };
  }
  if (cycleSecond < FIRST_RESET_BREATHING.inhale + FIRST_RESET_BREATHING.hold) {
    return {
      phase: "hold" as FirstResetBreathPhase,
      secondsLeft: FIRST_RESET_BREATHING.inhale + FIRST_RESET_BREATHING.hold - cycleSecond,
      scale: 1,
    };
  }
  const exhaleElapsed = cycleSecond - FIRST_RESET_BREATHING.inhale - FIRST_RESET_BREATHING.hold;
  const progress = exhaleElapsed / FIRST_RESET_BREATHING.exhale;
  return {
    phase: "exhale" as FirstResetBreathPhase,
    secondsLeft: FIRST_RESET_BREATHING.exhale - exhaleElapsed,
    scale: 1 - progress * 0.26,
  };
}

type IntroStep = "loading" | "intro" | "info" | "goal" | "first-reset" | "gender" | "welcome" | "calibration" | "recommendation" | "complete";

function todayCompletedIdsKey(): string {
  return `ascend_completed_ids_${new Date().toISOString().split("T")[0]}`;
}

function markFirstResetMissionComplete(): void {
  try {
    const key = todayCompletedIdsKey();
    const raw = localStorage.getItem(key);
    const ids: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    ["calm-breathing", "phase1_meditation"].forEach((id) => {
      if (!ids.includes(id)) ids.push(id);
    });
    localStorage.setItem(key, JSON.stringify(ids));
    localStorage.setItem(FIRST_RESET_COMPLETED_DATE_KEY, new Date().toISOString().split("T")[0]);
    window.dispatchEvent(new CustomEvent("ascend:activity-completed", {
      detail: {
        activityId: "phase1_meditation",
        activityIds: ["calm-breathing", "phase1_meditation"],
        xp: FIRST_RESET_XP,
      },
    }));
  } catch { /* noop */ }
}

function FirstResetScreen({
  firstName,
  onComplete,
}: {
  firstName: string;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<"ready" | "active" | "reward">("ready");
  const [remaining, setRemaining] = useState(FIRST_RESET_DURATION_SECONDS);
  const audioRefs = useRef<Record<FirstResetBreathPhase, HTMLAudioElement | null>>({
    inhale: null,
    hold: null,
    exhale: null,
  });
  const backgroundVideoRef = useRef<HTMLVideoElement | null>(null);
  const ambientPadRef = useRef<FirstResetAmbientPad | null>(null);
  const lastAudioPhase = useRef<FirstResetBreathPhase | null>(null);
  const elapsed = FIRST_RESET_DURATION_SECONDS - remaining;
  const progress = phase === "reward" ? 100 : Math.min(100, Math.max(0, (elapsed / FIRST_RESET_DURATION_SECONDS) * 100));
  const breathState = getFirstResetBreathState(elapsed);
  const breathLabel = breathState.phase === "inhale" ? "Inhale" : breathState.phase === "hold" ? "Hold" : "Exhale";
  const breathInstruction = breathState.phase === "inhale"
    ? "Draw air in slowly"
    : breathState.phase === "hold"
    ? "Stay soft and steady"
    : "Release the breath";
  const phaseColor = breathState.phase === "inhale"
    ? "#67e8f9"
    : breathState.phase === "hold"
    ? "#c4b5fd"
    : "#93c5fd";

  const stopAmbientPad = () => {
    const pad = ambientPadRef.current;
    if (!pad) return;
    const now = pad.context.currentTime;
    pad.output.gain.cancelScheduledValues(now);
    pad.output.gain.setTargetAtTime(0, now, 0.18);
    window.setTimeout(() => {
      pad.oscillators.forEach((oscillator) => {
        try {
          oscillator.stop();
        } catch {}
      });
      pad.lfos.forEach((lfo) => {
        try {
          lfo.stop();
        } catch {}
      });
      pad.context.close().catch(() => {});
    }, 450);
    ambientPadRef.current = null;
  };

  const startAmbientPad = () => {
    if (ambientPadRef.current) return;
    const AudioContextConstructor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;

    const context = new AudioContextConstructor();
    const output = context.createGain();
    const filter = context.createBiquadFilter();
    const frequencies = [174, 220, 261.63];
    const oscillators: OscillatorNode[] = [];
    const lfos: OscillatorNode[] = [];
    const lfoGains: GainNode[] = [];
    const now = context.currentTime;

    output.gain.setValueAtTime(0, now);
    output.gain.linearRampToValueAtTime(0.045, now + 1.8);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, now);
    filter.Q.setValueAtTime(0.65, now);
    filter.connect(output);
    output.connect(context.destination);

    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const voiceGain = context.createGain();
      const lfo = context.createOscillator();
      const lfoGain = context.createGain();

      oscillator.type = index === 1 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.detune.setValueAtTime(index === 0 ? -7 : index === 1 ? 4 : 9, now);
      voiceGain.gain.setValueAtTime(index === 1 ? 0.24 : 0.18, now);
      lfo.frequency.setValueAtTime(0.035 + index * 0.018, now);
      lfoGain.gain.setValueAtTime(0.055, now);

      lfo.connect(lfoGain);
      lfoGain.connect(voiceGain.gain);
      oscillator.connect(voiceGain);
      voiceGain.connect(filter);
      oscillator.start(now);
      lfo.start(now);
      oscillators.push(oscillator);
      lfos.push(lfo);
      lfoGains.push(lfoGain);
    });

    ambientPadRef.current = { context, output, oscillators, lfos, lfoGains };
  };

  useEffect(() => {
    if (phase !== "active") return;
    if (remaining <= 0) {
      setPhase("reward");
      return;
    }

    const timer = window.setTimeout(() => {
      setRemaining((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [phase, remaining]);

  useEffect(() => {
    audioRefs.current = {
      inhale: new Audio(INHALE_AUDIO_URL),
      hold: new Audio(HOLD_AUDIO_URL),
      exhale: new Audio(EXHALE_AUDIO_URL),
    };
    Object.values(audioRefs.current).forEach((audio) => {
      if (!audio) return;
      audio.preload = "auto";
      audio.volume = 0.92;
    });

    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (!audio) return;
        audio.pause();
        audio.src = "";
      });
      stopAmbientPad();
    };
  }, []);

  useEffect(() => {
    if (phase !== "active") return;
    if (remaining <= 0) return;
    if (lastAudioPhase.current === breathState.phase) return;
    lastAudioPhase.current = breathState.phase;

    try {
      Object.values(audioRefs.current).forEach((audio) => {
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
      });
      audioRefs.current[breathState.phase]?.play().catch(() => {});
    } catch {}
  }, [phase, remaining, breathState.phase]);

  const startReset = () => {
    lastAudioPhase.current = null;
    const backgroundVideo = backgroundVideoRef.current;
    if (backgroundVideo) {
      backgroundVideo.play().catch(() => {
        backgroundVideo.play().catch(() => {});
      });
    }
    startAmbientPad();
    setRemaining(FIRST_RESET_DURATION_SECONDS);
    setPhase("active");
  };

  useEffect(() => {
    const backgroundVideo = backgroundVideoRef.current;
    if (phase !== "active") {
      stopAmbientPad();
      if (backgroundVideo) {
        backgroundVideo.muted = true;
      }
    }
  }, [phase]);
  const isActive = phase === "active";
  const ringRadius = 104;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference - (progress / 100) * ringCircumference;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#020711] px-4 py-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <video
        ref={backgroundVideoRef}
        className="absolute inset-0 h-full w-full object-cover opacity-90"
        src={FIRST_RESET_BACKGROUND_VIDEO_URL}
        poster="/first-reset-neural-bg.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(34,211,238,0.06),transparent_34%),linear-gradient(180deg,rgba(2,7,17,0.22)_0%,rgba(2,7,17,0.52)_56%,rgba(2,7,17,0.88)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#020711] to-transparent" />

      <div className="relative z-10 flex max-h-full w-full max-w-[430px] flex-col overflow-y-auto text-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <motion.div
          className="mx-auto mb-5 flex h-[86px] w-[86px] items-center justify-center rounded-full border border-cyan-100/45 bg-white/10 shadow-[inset_0_1px_18px_rgba(255,255,255,0.18)] backdrop-blur-xl"
          animate={{ boxShadow: ["0 0 28px rgba(186,243,255,0.18), inset 0 1px 18px rgba(255,255,255,0.18)", "0 0 58px rgba(186,243,255,0.42), inset 0 1px 22px rgba(255,255,255,0.24)", "0 0 28px rgba(186,243,255,0.18), inset 0 1px 18px rgba(255,255,255,0.18)"] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {phase === "reward" ? <CheckCircle2 className="text-emerald-200 drop-shadow-[0_0_12px_rgba(110,231,183,0.65)]" size={36} /> : <Wind className="text-cyan-100 drop-shadow-[0_0_12px_rgba(186,243,255,0.7)]" size={36} />}
        </motion.div>

        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.42em] text-cyan-100/70">
          First Quest
        </p>

        {phase === "reward" ? (
          <>
            <h1 className="mb-3 text-[32px] font-black uppercase leading-none tracking-[0.08em] text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.16)]">
              System Online
            </h1>
            <p className="mx-auto mb-7 max-w-[320px] text-sm leading-6 text-white/55">
              Nice start{firstName ? `, ${firstName}` : ""}. You completed your first reset and earned momentum.
            </p>
            <div className="mb-7 flex items-center justify-center gap-3 rounded-[28px] border border-white/20 bg-white/[0.105] px-5 py-5 shadow-[0_22px_80px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-2xl">
              <Zap className="text-violet-200" size={18} />
              <span className="text-sm font-black uppercase tracking-[0.18em] text-white">
                +{FIRST_RESET_XP} XP
              </span>
            </div>
            <button
              onClick={onComplete}
              className="group flex w-full items-center justify-center gap-3 rounded-full border border-cyan-100/55 bg-cyan-100/10 px-5 py-4 text-[12px] font-black uppercase tracking-[0.24em] text-white shadow-[0_0_44px_rgba(186,243,255,0.2),inset_0_0_0_1px_rgba(255,255,255,0.12)] backdrop-blur-xl transition hover:bg-cyan-100/16"
            >
              Choose Style
              <ArrowRight className="transition group-hover:translate-x-0.5" size={17} />
            </button>
          </>
        ) : (
          <>
            <h1 className="mb-4 text-[38px] font-black uppercase leading-[0.98] tracking-[0.06em] text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.18)] min-[390px]:text-[44px]">
              30-Second Reset
            </h1>
            <p className="mx-auto mb-6 max-w-[350px] text-[17px] font-bold leading-6 text-yellow-200 drop-shadow-[0_0_12px_rgba(250,204,21,0.26)]">
              Press Start, then breathe with the pulse until the timer ends.
            </p>

            <div className={`relative mb-6 overflow-hidden rounded-[30px] border border-white/10 bg-slate-200/[0.025] px-4 shadow-[0_18px_54px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-sm ${isActive ? "min-h-[380px] py-5" : "min-h-[280px] py-5"}`}>
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

              <div className="absolute right-4 top-4 z-20 rounded-full border border-white/10 bg-slate-200/[0.035] px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
                Voice On
              </div>

              {isActive && (
                <motion.p
                  key={breathInstruction}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="relative mt-9 text-center text-[20px] font-black leading-tight text-white"
                >
                  {breathInstruction}
                </motion.p>
              )}

              <div className={`relative mx-auto flex w-full max-w-[290px] items-center justify-center ${isActive ? "mb-2 mt-0 h-[158px]" : "mt-8 h-[220px]"}`}>
                <svg className={`absolute overflow-visible ${isActive ? "h-[188px] w-[188px]" : "h-[226px] w-[226px]"}`} viewBox="0 0 250 250" aria-hidden="true">
                  <defs>
                    <linearGradient id="first-reset-ring" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#cffafe" />
                      <stop offset="58%" stopColor="#67e8f9" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                  <circle cx="125" cy="125" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="8" strokeLinecap="round" strokeDasharray="178 46" />
                  <motion.circle
                    cx="125"
                    cy="125"
                    r={ringRadius}
                    fill="none"
                    stroke="url(#first-reset-ring)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    animate={{ strokeDashoffset: ringDashOffset }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    style={{ rotate: -90, transformOrigin: "center", filter: "drop-shadow(0 0 12px rgba(103,232,249,0.58))" }}
                  />
                  {[0, 1, 2, 3].map((index) => (
                    <motion.ellipse
                      key={index}
                      cx="125"
                      cy="125"
                      rx="74"
                      ry="100"
                      fill="none"
                      stroke="rgba(207,250,254,0.42)"
                      strokeWidth="1.5"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 14 + index * 2, repeat: Infinity, ease: "linear" }}
                      style={{ transformOrigin: "center", rotate: index * 45 }}
                    />
                  ))}
                </svg>
                <motion.div
                  className="absolute rounded-full border border-cyan-100/30"
                  animate={{
                    width: isActive && breathState.phase === "inhale" ? [122, 166] : isActive ? 122 : 142,
                    height: isActive && breathState.phase === "inhale" ? [122, 166] : isActive ? 122 : 142,
                    opacity: isActive && breathState.phase === "inhale" ? [0.42, 0] : 0.18,
                  }}
                  transition={{ duration: 1.9, repeat: isActive && breathState.phase === "inhale" ? Infinity : 0, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute rounded-full"
                  animate={{ scale: isActive ? breathState.scale : 0.82 }}
                  transition={{ duration: 0.75, ease: [0.22, 0.61, 0.36, 1] }}
                  style={{
                    width: isActive ? 126 : 148,
                    height: isActive ? 126 : 148,
                    background: `radial-gradient(circle at 50% 28%, rgba(255,255,255,0.24) 0%, ${phaseColor}38 28%, ${phaseColor}16 56%, rgba(2,7,17,0.44) 100%)`,
                    border: `2px solid ${phaseColor}55`,
                    boxShadow: `0 0 62px ${phaseColor}2b, inset 0 0 38px ${phaseColor}19, inset 0 1px 22px rgba(255,255,255,0.14)`,
                  }}
                />
                <div className="relative z-10 flex flex-col items-center">
                  <motion.span
                    key={isActive ? breathState.phase : "ready"}
                    initial={{ opacity: 0, y: 7 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`${isActive ? "text-[14px]" : "text-[16px]"} font-black uppercase tracking-[0.32em]`}
                    style={{ color: isActive ? phaseColor : "rgba(255,255,255,0.54)", textShadow: `0 0 14px ${phaseColor}44` }}
                  >
                    {isActive ? breathLabel : "Ready"}
                  </motion.span>
                  <span className={`${isActive ? "mt-1 text-[54px]" : "mt-2 text-[64px]"} font-black leading-none tabular-nums text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.18)]`}>
                    {isActive ? breathState.secondsLeft : remaining}
                  </span>
                  <span className={`${isActive ? "mt-2 text-[10px]" : "mt-3 text-[12px]"} font-black uppercase tracking-[0.28em] text-white/36`}>
                    {isActive ? "phase" : "seconds"}
                  </span>
                </div>
              </div>

              {isActive && (
                <>
                  <div className="relative mb-3 flex items-center justify-center gap-2">
                    <span className="text-[34px] font-black leading-none tabular-nums text-white">{remaining}</span>
                    <span className="text-[13px] font-black uppercase tracking-[0.28em] text-white/38">sec remaining</span>
                  </div>
                  <div className="relative h-3 overflow-hidden rounded-full bg-white/10 shadow-[inset_0_1px_8px_rgba(0,0,0,0.24)]">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-100 via-cyan-300 to-violet-300 shadow-[0_0_18px_rgba(103,232,249,0.55)]"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    />
                  </div>
                  <p className="mt-4 text-[11px] font-black uppercase tracking-[0.28em] text-cyan-100/55">
                    Personalization Pathway
                  </p>
                </>
              )}
            </div>

            <button
              onClick={startReset}
              disabled={isActive}
              className="group relative flex min-h-[68px] w-full items-center justify-center overflow-hidden rounded-[34px] border-2 border-cyan-100/44 bg-slate-200/[0.035] px-5 py-4 text-[12px] font-black uppercase tracking-[0.28em] text-white shadow-[0_0_24px_rgba(186,243,255,0.15),inset_0_0_12px_rgba(186,243,255,0.04)] backdrop-blur-sm transition hover:border-cyan-100/62 hover:bg-slate-200/[0.06] hover:shadow-[0_0_34px_rgba(186,243,255,0.22),inset_0_0_16px_rgba(186,243,255,0.06)] disabled:cursor-default"
            >
              <span className="pointer-events-none absolute inset-[7px] rounded-[26px] border border-cyan-100/20" />
              <span className="pointer-events-none absolute inset-x-4 top-3 h-5 rounded-full bg-gradient-to-b from-white/8 to-transparent blur-[1px]" />
              <span className="pointer-events-none absolute -left-12 top-0 h-full w-32 rotate-[-18deg] bg-gradient-to-r from-transparent via-white/5 to-transparent transition group-hover:translate-x-8" />
              <span className="pointer-events-none absolute inset-x-14 top-1/2 h-10 -translate-y-1/2 rounded-full bg-cyan-100/6 blur-xl" />
              <span className="pointer-events-none absolute left-8 right-8 top-[7px] h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <span className="pointer-events-none absolute left-8 right-8 bottom-[7px] h-px bg-gradient-to-r from-transparent via-cyan-100/30 to-transparent" />
              <span className="pointer-events-none absolute -left-10 top-1/2 h-10 w-24 -translate-y-1/2 rounded-full bg-cyan-100/6 blur-xl transition group-hover:bg-cyan-100/9" />
              <span className="pointer-events-none absolute -right-10 top-1/2 h-10 w-24 -translate-y-1/2 rounded-full bg-cyan-100/6 blur-xl transition group-hover:bg-cyan-100/9" />
              <span className="relative z-10 flex items-center justify-center gap-3 drop-shadow-[0_0_10px_rgba(186,243,255,0.36)]">
                {isActive ? "Reset In Progress" : "Start Reset"}
                <ArrowRight className="transition group-hover:translate-x-0.5" size={18} />
              </span>
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

function WelcomeScreen({
  gender,
  firstName,
}: {
  gender: "male" | "female";
  firstName: string;
}) {
  const isFemale = gender === "female";
  const color = isFemale ? "#d946ef" : "#0ea5e9";
  const colorAlt = isFemale ? "#8b5cf6" : "#38bdf8";
  const glow = isFemale ? "rgba(217,70,239,0.38)" : "rgba(14,165,233,0.38)";
  const glowAlt = isFemale ? "rgba(139,92,246,0.22)" : "rgba(56,189,248,0.22)";
  const badge = isFemale ? "NEON EMPRESS" : "IRON SOVEREIGN";
  const titleText = isFemale ? `Rise, Empress ${firstName}` : `Rise, Sovereign ${firstName}`;
  const subtitle = isFemale
    ? "The Neon Empress awakens. Your ascension begins."
    : "The Iron Sovereign awakens. Your ascension begins.";
  const words = titleText.split(" ");

  const stars = useRef(
    Array.from({ length: 45 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 0.8 + Math.random() * 2.2,
      duration: 2.5 + Math.random() * 4,
      delay: Math.random() * 3,
      opacity: 0.25 + Math.random() * 0.55,
    }))
  ).current;

  const rings = [
    { size: 140, delay: 0.4, duration: 3.5 },
    { size: 230, delay: 0.9, duration: 4.2 },
    { size: 340, delay: 1.5, duration: 5.0 },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{
        background: isFemale
          ? "linear-gradient(145deg, #04000e 0%, #080018 50%, #05000f 100%)"
          : "linear-gradient(145deg, #020810 0%, #03101e 50%, #020810 100%)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      {/* Stars */}
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: s.size,
            height: s.size,
            left: `${s.x}%`,
            top: `${s.y}%`,
            background: s.id % 4 === 0 ? color : s.id % 4 === 1 ? colorAlt : "rgba(255,255,255,0.8)",
            boxShadow: s.id % 5 === 0 ? `0 0 ${s.size * 2}px ${glow}` : "none",
          }}
          animate={{ opacity: [s.opacity * 0.3, s.opacity, s.opacity * 0.2] }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            delay: s.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Left ambient orb */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "30%",
          left: "-10%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glowAlt} 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Right ambient orb */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "45%",
          right: "-10%",
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
          filter: "blur(65px)",
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.75, 0.4] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />

      {/* Center glow */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "38%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
          height: 360,
          background: `radial-gradient(ellipse, ${glow} 0%, transparent 65%)`,
          filter: "blur(70px)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {/* Expanding rings */}
      {rings.map((ring, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            width: ring.size,
            height: ring.size,
            borderRadius: "50%",
            border: `1px solid ${color}`,
            left: "50%",
            top: "42%",
            transform: "translate(-50%, -50%)",
          }}
          initial={{ scale: 0.3, opacity: 0.6 }}
          animate={{ scale: [0.3, 1.6], opacity: [0.5, 0] }}
          transition={{
            duration: ring.duration,
            delay: ring.delay,
            repeat: Infinity,
            repeatDelay: 1.0,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-6"
        style={{ maxWidth: 440 }}
      >
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7"
          style={{
            background: `${color}14`,
            border: `1px solid ${color}40`,
          }}
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: color }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span
            className="text-[9px] tracking-[0.28em] uppercase font-bold font-mono"
            style={{ color }}
          >
            {badge}
          </span>
        </motion.div>

        {/* Title — word by word reveal */}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-4">
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="font-bold text-3xl"
              style={{
                color: "#ffffff",
                fontFamily: "Inter, system-ui, sans-serif",
                textShadow: `0 0 40px ${glow}, 0 0 80px ${glowAlt}`,
                letterSpacing: "0.02em",
                display: "inline-block",
              }}
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                delay: 0.5 + i * 0.18,
                duration: 0.65,
                ease: "easeOut",
              }}
            >
              {word}
            </motion.span>
          ))}
        </div>

        {/* Divider line */}
        <motion.div
          className="mx-auto mb-5 rounded-full"
          style={{ height: 1, background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "70%", opacity: 1 }}
          transition={{ delay: 0.5 + words.length * 0.18 + 0.1, duration: 0.7 }}
        />

        {/* Subtitle */}
        <motion.p
          className="text-sm mb-8"
          style={{
            color: "rgba(255,255,255,0.45)",
            fontFamily: "Inter, system-ui, sans-serif",
            lineHeight: 1.6,
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + words.length * 0.18 + 0.3, duration: 0.6 }}
        >
          {subtitle}
        </motion.p>

        {/* System status */}
        <motion.div
          className="inline-flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + words.length * 0.18 + 0.7, duration: 0.5 }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: color }}
            animate={{ opacity: [1, 0.2, 1], scale: [1, 0.7, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span
            className="text-[9px] tracking-[0.3em] uppercase font-mono"
            style={{ color: `${color}70` }}
          >
            ASCEND OS ONLINE
          </span>
        </motion.div>

        {/* Loading dots */}
        <motion.div
          className="flex justify-center gap-1.5 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + words.length * 0.18 + 1.0, duration: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{ width: 6, height: 6, backgroundColor: color }}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.22 }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function IntroWrapper({ children }: IntroWrapperProps) {
  const { player, isLoading, updatePlayer, gainExp } = useGame();
  const { setBackgroundTheme, setClockTheme } = useTheme();
  const [step, setStep] = useState<IntroStep>("loading");
  const [playerName, setPlayerName] = useState("");
  const [playerGender, setPlayerGender] = useState<"male" | "female">("male");
  const [pendingProfile, setPendingProfile] = useState<CalibrationProfile | null>(null);
  const initialCheckDone = useRef(false);
  const firstResetAwarded = useRef(false);

  useEffect(() => {
    if (!isLoading && player && !initialCheckDone.current) {
      initialCheckDone.current = true;
      const hasName = player.name && player.name.trim() !== "";
      const hasGoal = !!localStorage.getItem(GOAL_STORAGE_KEY);
      const hasGender = !!localStorage.getItem("ascend_gender");
      const hasCalibration = !!localStorage.getItem("ascend_calibration");
      const firstResetDone = localStorage.getItem(FIRST_RESET_STORAGE_KEY) === "true";
      if (!hasName) {
        setStep("intro");
      } else if (!hasGoal) {
        setPlayerName(player.name || "");
        setStep("goal");
      } else if (!hasGender) {
        setPlayerName(player.name || "");
        setStep("gender");
      } else if (!hasCalibration) {
        setPlayerName(player.name || "");
        setPlayerGender(localStorage.getItem("ascend_gender") === "female" ? "female" : "male");
        setStep("calibration");
      } else if (!firstResetDone) {
        setPlayerName(player.name || "");
        setPlayerGender(localStorage.getItem("ascend_gender") === "female" ? "female" : "male");
        setStep("first-reset");
      } else {
        setStep("complete");
      }
    }
  }, [isLoading, player]);

  const handleBeginAscension = () => {
    setStep("info");
  };

  const handleGenderSelect = (gender: "male" | "female") => {
    setPlayerGender(gender);
    localStorage.setItem("ascend_gender", gender);
    const themeId = gender === "male" ? "pixel_forest" : gender;
    setBackgroundTheme(themeId);
    setClockTheme(themeId);
    if (player?.name && player.name.trim() !== "") {
      setPlayerName(player.name);
      setStep("welcome");
      setTimeout(() => {
        const alreadyCalibrated = !!localStorage.getItem("ascend_calibration");
        const firstResetDone = localStorage.getItem(FIRST_RESET_STORAGE_KEY) === "true";
        setStep(alreadyCalibrated ? (firstResetDone ? "complete" : "first-reset") : "calibration");
      }, 1800);
    } else {
      setStep("info");
    }
  };

  const handleInfoComplete = (data: { name: string }) => {
    setPlayerName(data.name);
    updatePlayer({ name: data.name, onboardingCompleted: 1 });
    setStep("goal");
  };

  const handleGoalSelect = (goal: AscendGoal) => {
    localStorage.setItem(GOAL_STORAGE_KEY, goal);
    const hasGender = !!localStorage.getItem("ascend_gender");
    const hasCalibration = !!localStorage.getItem("ascend_calibration");
    const firstResetDone = localStorage.getItem(FIRST_RESET_STORAGE_KEY) === "true";
    if (!hasGender) {
      setStep("gender");
    } else if (!hasCalibration) {
      setPlayerGender(localStorage.getItem("ascend_gender") === "female" ? "female" : "male");
      setStep("calibration");
    } else {
      setStep(firstResetDone ? "complete" : "first-reset");
    }
  };

  const handleFirstResetComplete = () => {
    const firstResetDone = localStorage.getItem(FIRST_RESET_STORAGE_KEY) === "true";
    markFirstResetMissionComplete();
    if (!firstResetDone && !firstResetAwarded.current) {
      firstResetAwarded.current = true;
      localStorage.setItem(FIRST_RESET_STORAGE_KEY, "true");
      gainExp(FIRST_RESET_XP);
    }
    setStep("complete");
  };

  const handleCalibrationComplete = (answers: CalibrationAnswers) => {
    const derivedLevel = deriveCalibrationLevel(answers);
    const profile: CalibrationProfile = {
      ...answers,
      derivedLevel,
      completedAt: new Date().toISOString(),
    };
    setPendingProfile(profile);
    setStep("recommendation");
  };

  const handleRecommendationConfirm = (chosenLevel: WorkoutLevel) => {
    const profile = pendingProfile!;
    const finalProfile: CalibrationProfile = { ...profile, derivedLevel: chosenLevel };
    saveCalibrationProfile(finalProfile);
    setWorkoutLevel(chosenLevel);
    const firstResetDone = localStorage.getItem(FIRST_RESET_STORAGE_KEY) === "true";
    setStep(firstResetDone ? "complete" : "first-reset");
  };

  const getFirstName = () => {
    const name = playerName || player?.name || "";
    return name.split(" ")[0] || name;
  };

  if (step === "loading" || isLoading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{
          background: "linear-gradient(180deg, #020810 0%, #030d1c 100%)",
        }}
      >
        <motion.div
          className="flex flex-col items-center gap-4"
        >
          <motion.p
            className="text-[11px] tracking-[0.35em] text-white font-mono uppercase"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            INITIALIZING...
          </motion.p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === "intro") {
    return <IntroScreen onBeginAscension={handleBeginAscension} />;
  }

  if (step === "gender") {
    return <GenderSelectScreen onSelect={handleGenderSelect} />;
  }

  if (step === "info") {
    return <PlayerInfoScreen onComplete={handleInfoComplete} />;
  }

  if (step === "goal") {
    return <GoalSelectScreen firstName={getFirstName()} onSelect={handleGoalSelect} />;
  }

  if (step === "first-reset") {
    return (
      <FirstResetScreen
        firstName={getFirstName()}
        onComplete={handleFirstResetComplete}
      />
    );
  }

  if (step === "welcome") {
    return <WelcomeScreen gender={playerGender} firstName={getFirstName()} />;
  }

  if (step === "calibration") {
    return (
      <CalibrationFlow
        gender={playerGender}
        onComplete={handleCalibrationComplete}
      />
    );
  }

  if (step === "recommendation" && pendingProfile) {
    return (
      <RecommendedPathScreen
        gender={playerGender}
        profile={pendingProfile}
        onConfirm={handleRecommendationConfirm}
      />
    );
  }

  return <>{children}</>;
}
