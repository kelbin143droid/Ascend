import React, { useState, useEffect, useRef } from "react";
import { useGame } from "@/context/GameContext";
import { IntroScreen } from "./IntroScreen";
import { PlayerInfoScreen } from "./PlayerInfoScreen";
import { GenderSelectScreen } from "./GenderSelectScreen";
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
const FIRST_RESET_XP = 10;
const FIRST_RESET_STORAGE_KEY = "ascend_first_reset_done";
const INHALE_AUDIO_URL = "/audio/inhale.mp3";
const HOLD_AUDIO_URL = "/audio/hold.mp3";
const EXHALE_AUDIO_URL = "/audio/exhale.mp3";

type FirstResetBreathPhase = "inhale" | "hold" | "exhale";

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

type IntroStep = "loading" | "intro" | "info" | "first-reset" | "gender" | "welcome" | "calibration" | "recommendation" | "complete";

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
    setRemaining(FIRST_RESET_DURATION_SECONDS);
    setPhase("active");
  };
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
      <img
        src="/first-reset-neural-bg.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(34,211,238,0.08),transparent_34%),linear-gradient(180deg,rgba(2,7,17,0.35)_0%,rgba(2,7,17,0.72)_52%,rgba(2,7,17,0.94)_100%)]" />
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
            <p className="mx-auto mb-6 max-w-[340px] text-[15px] leading-7 text-white/62">
              Follow the pulse and the guided voice. One small reset before the system personalizes around you.
            </p>

            <div className="relative mb-6 overflow-hidden rounded-[30px] border border-white/22 bg-white/[0.105] px-5 py-6 shadow-[0_26px_90px_rgba(0,0,0,0.44),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              <div className="pointer-events-none absolute -left-16 top-24 h-28 w-60 rotate-[-18deg] rounded-full bg-cyan-200/12 blur-2xl" />
              <div className="pointer-events-none absolute -right-20 bottom-20 h-24 w-64 rotate-[22deg] rounded-full bg-violet-300/10 blur-2xl" />

              <div className="relative mb-5 flex items-start justify-between gap-3">
                <div className="text-left">
                  <p className="text-[11px] font-black uppercase tracking-[0.32em] text-white/48">Breath Guide</p>
                  <p className="mt-2 text-[20px] font-black leading-tight text-white">{isActive ? breathInstruction : "Guided voice ready"}</p>
                </div>
                <div className="shrink-0 rounded-full border border-white/18 bg-white/10 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]">
                  Voice On
                </div>
              </div>

              <div className="relative mx-auto mb-5 flex h-[260px] w-full max-w-[300px] items-center justify-center">
                <svg className="absolute h-[250px] w-[250px] overflow-visible" viewBox="0 0 250 250" aria-hidden="true">
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
                    width: isActive && breathState.phase === "inhale" ? [154, 214] : 154,
                    height: isActive && breathState.phase === "inhale" ? [154, 214] : 154,
                    opacity: isActive && breathState.phase === "inhale" ? [0.42, 0] : 0.18,
                  }}
                  transition={{ duration: 1.9, repeat: isActive && breathState.phase === "inhale" ? Infinity : 0, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute rounded-full"
                  animate={{ scale: isActive ? breathState.scale : 0.82 }}
                  transition={{ duration: 0.75, ease: [0.22, 0.61, 0.36, 1] }}
                  style={{
                    width: 158,
                    height: 158,
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
                    className="text-[16px] font-black uppercase tracking-[0.32em]"
                    style={{ color: isActive ? phaseColor : "rgba(255,255,255,0.54)", textShadow: `0 0 14px ${phaseColor}44` }}
                  >
                    {isActive ? breathLabel : "Ready"}
                  </motion.span>
                  <span className="mt-2 text-[64px] font-black leading-none tabular-nums text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.18)]">
                    {isActive ? breathState.secondsLeft : remaining}
                  </span>
                  <span className="mt-3 text-[12px] font-black uppercase tracking-[0.28em] text-white/36">
                    {isActive ? "phase" : "seconds"}
                  </span>
                </div>
              </div>

              <div className="relative mb-4 flex items-center justify-center gap-2">
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
              <p className="mt-5 text-[11px] font-black uppercase tracking-[0.28em] text-cyan-100/55">
                Personalization Pathway
              </p>
            </div>

            <button
              onClick={startReset}
              disabled={isActive}
              className="group flex w-full items-center justify-center gap-3 rounded-full border border-cyan-100/60 bg-white/[0.055] px-5 py-4 text-[11px] font-black uppercase tracking-[0.22em] text-white shadow-[0_0_46px_rgba(186,243,255,0.2),inset_0_0_0_1px_rgba(255,255,255,0.14)] backdrop-blur-xl transition hover:bg-cyan-100/12 disabled:cursor-default disabled:opacity-70"
            >
              {isActive ? "Reset In Progress" : "Start Reset"}
              <ArrowRight className="transition group-hover:translate-x-0.5" size={17} />
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
      const hasGender = !!localStorage.getItem("ascend_gender");
      const firstResetDone = localStorage.getItem(FIRST_RESET_STORAGE_KEY) === "true";
      if (!hasName) {
        setStep("intro");
      } else if (!hasGender) {
        setPlayerName(player.name || "");
        setStep(firstResetDone ? "gender" : "first-reset");
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
        setStep(alreadyCalibrated ? "complete" : "calibration");
      }, 3800);
    } else {
      setStep("info");
    }
  };

  const handleInfoComplete = (data: { name: string }) => {
    setPlayerName(data.name);
    updatePlayer({ name: data.name, onboardingCompleted: 1 });
    const firstResetDone = localStorage.getItem(FIRST_RESET_STORAGE_KEY) === "true";
    setStep(firstResetDone ? "gender" : "first-reset");
  };

  const handleFirstResetComplete = () => {
    const firstResetDone = localStorage.getItem(FIRST_RESET_STORAGE_KEY) === "true";
    if (!firstResetDone && !firstResetAwarded.current) {
      firstResetAwarded.current = true;
      localStorage.setItem(FIRST_RESET_STORAGE_KEY, "true");
      gainExp(FIRST_RESET_XP);
    }
    setStep("gender");
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
    setStep("complete");
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
