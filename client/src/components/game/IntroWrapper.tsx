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

  const handleInfoComplete = (data: { name: string; job: string; title: string }) => {
    updatePlayer({
      name: data.name,
      job: data.job,
      title: data.title,
    });
    setStep("transitioning");
    setTimeout(() => {
      setStep("complete");
    }, 2500);
  };

  if (step === "loading" || isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <motion.div
          className="text-lg font-display tracking-widest"
          style={{ color: theme.colors.primary }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          INITIALIZING SYSTEM...
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
        style={{ background: "#000" }}
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
            className="text-2xl font-display mb-2"
            style={{ color: theme.colors.primary }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            SYSTEM SYNCHRONIZED
          </motion.div>
          <motion.div
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Welcome, Hunter
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return <>{children}</>;
}
