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
  const elapsed = FIRST_RESET_DURATION_SECONDS - remaining;
  const progress = phase === "reward" ? 100 : Math.min(100, Math.max(0, (elapsed / FIRST_RESET_DURATION_SECONDS) * 100));
  const breathCue = Math.floor(remaining / 5) % 2 === 0 ? "Breathe in" : "Breathe out";

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

  const startReset = () => {
    setRemaining(FIRST_RESET_DURATION_SECONDS);
    setPhase("active");
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      style={{
        background:
          "radial-gradient(circle at 50% 18%, rgba(34,211,238,0.16), transparent 34%), linear-gradient(180deg, #020711 0%, #06121d 48%, #020711 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <motion.div
        className="absolute h-72 w-72 rounded-full border border-cyan-300/20"
        animate={{ scale: phase === "active" ? [0.86, 1.08, 0.86] : [0.95, 1.02, 0.95], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: phase === "active" ? 5 : 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-48 w-48 rounded-full border border-fuchsia-300/15"
        animate={{ scale: phase === "active" ? [1.05, 0.85, 1.05] : [1, 1.08, 1], opacity: [0.18, 0.52, 0.18] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />

      <div className="relative z-10 w-full max-w-[390px] text-center">
        <motion.div
          className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-300/10"
          animate={{ boxShadow: ["0 0 24px rgba(34,211,238,0.18)", "0 0 48px rgba(34,211,238,0.38)", "0 0 24px rgba(34,211,238,0.18)"] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {phase === "reward" ? <CheckCircle2 className="text-emerald-300" size={34} /> : <Wind className="text-cyan-200" size={34} />}
        </motion.div>

        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/65">
          First Quest
        </p>

        {phase === "reward" ? (
          <>
            <h1 className="mb-3 text-3xl font-black uppercase tracking-[0.03em] text-white">
              System Online
            </h1>
            <p className="mx-auto mb-7 max-w-[320px] text-sm leading-6 text-white/55">
              Nice start{firstName ? `, ${firstName}` : ""}. You completed your first reset and earned momentum.
            </p>
            <div className="mb-7 flex items-center justify-center gap-2 rounded-2xl border border-violet-300/25 bg-violet-300/10 px-5 py-4">
              <Zap className="text-violet-200" size={18} />
              <span className="text-sm font-black uppercase tracking-[0.18em] text-white">
                +{FIRST_RESET_XP} XP
              </span>
            </div>
            <button
              onClick={onComplete}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-[12px] font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_0_42px_rgba(255,255,255,0.18)]"
            >
              Choose Style
              <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <>
            <h1 className="mb-3 text-3xl font-black uppercase tracking-[0.03em] text-white">
              30-Second Reset
            </h1>
            <p className="mx-auto mb-7 max-w-[320px] text-sm leading-6 text-white/55">
              Start with one small win. Settle your breath, then we will personalize the system.
            </p>

            <div className="mb-7 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4 flex items-end justify-center gap-2">
                <span className="text-6xl font-black tabular-nums text-white">{remaining}</span>
                <span className="pb-2 text-xs font-bold uppercase tracking-[0.2em] text-white/35">sec</span>
              </div>
              <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-cyan-200"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-100/70">
                {phase === "active" ? breathCue : "Ready when you are"}
              </p>
            </div>

            <button
              onClick={startReset}
              disabled={phase === "active"}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-200 px-5 py-4 text-[12px] font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_0_42px_rgba(34,211,238,0.24)] disabled:cursor-default disabled:bg-cyan-200/45"
            >
              {phase === "active" ? "Reset In Progress" : "Start Reset"}
              <ArrowRight size={16} />
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
