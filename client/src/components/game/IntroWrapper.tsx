import React, { useState, useEffect, useRef } from "react";
import { useGame } from "@/context/GameContext";
import { IntroScreen } from "./IntroScreen";
import { PlayerInfoScreen } from "./PlayerInfoScreen";
import { GenderSelectScreen } from "./GenderSelectScreen";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

interface IntroWrapperProps {
  children: React.ReactNode;
}

type IntroStep = "loading" | "intro" | "gender" | "info" | "welcome" | "complete";

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
  const { player, isLoading, updatePlayer } = useGame();
  const { setBackgroundTheme, setClockTheme } = useTheme();
  const [step, setStep] = useState<IntroStep>("loading");
  const [playerName, setPlayerName] = useState("");
  const [playerGender, setPlayerGender] = useState<"male" | "female">("male");
  const initialCheckDone = useRef(false);

  useEffect(() => {
    if (!isLoading && player && !initialCheckDone.current) {
      initialCheckDone.current = true;
      const hasName = player.name && player.name.trim() !== "";
      const hasGender = !!localStorage.getItem("ascend_gender");
      if (!hasName) {
        setStep("intro");
      } else if (!hasGender) {
        setStep("gender");
      } else {
        setStep("complete");
      }
    }
  }, [isLoading, player]);

  const handleBeginAscension = () => {
    setStep("gender");
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
      setTimeout(() => setStep("complete"), 3800);
    } else {
      setStep("info");
    }
  };

  const handleInfoComplete = (data: { name: string }) => {
    setPlayerName(data.name);
    updatePlayer({ name: data.name, onboardingCompleted: 1 });
    setStep("welcome");
    setTimeout(() => {
      setStep("complete");
    }, 3800);
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

  if (step === "welcome") {
    return <WelcomeScreen gender={playerGender} firstName={getFirstName()} />;
  }

  return <>{children}</>;
}
