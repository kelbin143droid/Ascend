import React, { useState, useEffect, useRef } from "react";
import { useGame } from "@/context/GameContext";
import { IntroScreen } from "./IntroScreen";
import { PlayerInfoScreen } from "./PlayerInfoScreen";
import { GenderSelectScreen } from "./GenderSelectScreen";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

interface IntroWrapperProps {
  children: React.ReactNode;
}

type IntroStep = "loading" | "intro" | "gender" | "info" | "welcome" | "complete";

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
    setBackgroundTheme(gender);
    setClockTheme(gender);
    if (player?.name && player.name.trim() !== "") {
      setPlayerName(player.name);
      setStep("welcome");
      setTimeout(() => setStep("complete"), 3200);
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
    }, 3200);
  };

  const getFirstName = () => {
    const name = playerName || player?.name || "";
    return name.split(" ")[0] || name;
  };

  const getWelcomeTitle = () => {
    const firstName = getFirstName();
    if (playerGender === "female") {
      return `Rise, Empress ${firstName}`;
    }
    return `Rise, Sovereign ${firstName}`;
  };

  const getWelcomeSubtitle = () => {
    if (playerGender === "female") {
      return "The Neon Empress awakens. Your ascension begins.";
    }
    return "The Iron Sovereign awakens. Your ascension begins.";
  };

  const getWelcomeColor = () =>
    playerGender === "female" ? "#d946ef" : "#0ea5e9";
  const getWelcomeGlow = () =>
    playerGender === "female"
      ? "rgba(217,70,239,0.35)"
      : "rgba(14,165,233,0.35)";

  if (step === "loading" || isLoading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{
          background: "linear-gradient(to bottom, #030a14 0%, #050010 100%)",
        }}
      >
        <motion.div
          className="text-lg tracking-widest text-white"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          LOADING...
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
    const color = getWelcomeColor();
    const glow = getWelcomeGlow();
    return (
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
        style={{
          background:
            playerGender === "female"
              ? "linear-gradient(135deg, #05000f 0%, #0a0020 100%)"
              : "linear-gradient(135deg, #030a14 0%, #040c1a 100%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Ambient glow */}
        <div
          className="absolute"
          style={{
            top: "20%", left: "50%", transform: "translateX(-50%)",
            width: 360, height: 360,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
            filter: "blur(50px)",
          }}
        />

        {/* Stars */}
        {Array.from({ length: 20 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 1.5 + Math.random(),
              height: 1.5 + Math.random(),
              background: "rgba(255,255,255,0.7)",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.1, 0.6, 0.1] }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        <motion.div
          className="relative z-10 text-center px-6"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
        >
          {/* Rank badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{
              background: `${color}15`,
              border: `1px solid ${color}40`,
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <span className="text-[9px] tracking-[0.28em] uppercase font-bold" style={{ color }}>
              {playerGender === "female" ? "NEON EMPRESS" : "IRON SOVEREIGN"}
            </span>
          </motion.div>

          {/* Main welcome */}
          <motion.h1
            className="text-3xl font-bold mb-3"
            style={{
              color: "#ffffff",
              fontFamily: "Inter, system-ui, sans-serif",
              textShadow: `0 0 40px ${glow}`,
              letterSpacing: "0.02em",
            }}
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            {getWelcomeTitle()}
          </motion.h1>

          <motion.p
            className="text-sm"
            style={{
              color: "rgba(255,255,255,0.5)",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {getWelcomeSubtitle()}
          </motion.p>

          {/* Loading dots */}
          <motion.div
            className="flex justify-center gap-1.5 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: color }}
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return <>{children}</>;
}
