import React, { useState, useEffect, useRef } from "react";
import { useGame } from "@/context/GameContext";
import { IntroScreen } from "./IntroScreen";
import { PlayerInfoScreen } from "./PlayerInfoScreen";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

interface IntroWrapperProps {
  children: React.ReactNode;
}

type IntroStep = "loading" | "intro" | "info" | "transitioning" | "complete";

export function IntroWrapper({ children }: IntroWrapperProps) {
  const { player, isLoading, updatePlayer } = useGame();
  const { theme } = useTheme();
  const [step, setStep] = useState<IntroStep>("loading");
  const [playerName, setPlayerName] = useState("");
  const initialCheckDone = useRef(false);

  useEffect(() => {
    if (!isLoading && player && !initialCheckDone.current) {
      initialCheckDone.current = true;
      if (!player.name || player.name.trim() === "") {
        setStep("intro");
      } else {
        setStep("complete");
      }
    }
  }, [isLoading, player]);

  const handleBeginAscension = () => {
    setStep("info");
  };

  const handleInfoComplete = (data: { name: string }) => {
    setPlayerName(data.name);
    updatePlayer({
      name: data.name,
    });
    setStep("transitioning");
    setTimeout(() => {
      setStep("complete");
    }, 2500);
  };

  // Get first name from player name
  const getFirstName = () => {
    const name = playerName || player?.name || "";
    return name.split(" ")[0] || name;
  };

  if (step === "loading" || isLoading) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center"
        style={{ 
          background: `
            linear-gradient(to bottom, 
              #1a2a4a 0%, 
              #2a4a6a 50%,
              #3a5070 100%
            )
          `
        }}
      >
        <motion.div
          className="text-lg font-display tracking-widest text-white"
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

  if (step === "info") {
    return <PlayerInfoScreen onComplete={handleInfoComplete} />;
  }

  if (step === "transitioning") {
    return (
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ 
          background: `
            linear-gradient(to bottom, 
              #1a2a4a 0%, 
              #2a4a6a 50%,
              #3a5070 100%
            )
          `
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.div
            className="text-3xl font-display mb-4 text-white"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Welcome, {getFirstName()}!
          </motion.div>
          <motion.div
            className="text-sm"
            style={{ color: "rgba(255,255,255,0.6)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Your journey begins now
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return <>{children}</>;
}
