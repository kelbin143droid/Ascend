import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { LevelUpAnimation, getMotivationalPhrase } from "./LevelUpAnimation";
import { applyLevelUpStats, initLevelBaseline, getMaxHP, getMaxMana } from "@/lib/statsSystem";
import { isVitalityQuestScheduledToday, isVitalitySleepScheduledToday } from "@/lib/userState";
import { STAT_POINTS_PER_LEVEL } from "@shared/gameProgression";
import { getWorkoutLevel } from "@/lib/workoutProgressStore";
import { getPathFlowConfig } from "@/lib/pathFlowConfig";

const FUTURE_GAME_HANDOFF_KEY = "ascend_future_game_handoff_seen";

function checkRitualComplete(): boolean {
  try {
    const todayKey = `ascend_completed_ids_${new Date().toISOString().split("T")[0]}`;
    const ids = new Set<string>(JSON.parse(localStorage.getItem(todayKey) || "[]"));
    const pathCfg = getPathFlowConfig(getWorkoutLevel());
    const senseDone    = ids.has("phase1_meditation") || ids.has("calm-breathing");
    const agilityDone  = ids.has("phase1_agility")    || ids.has("light-movement");
    const strengthDone = !pathCfg.includesStrength || ids.has("phase1_strength");
    const vitalityDone =
      ids.has("phase1_vitality") ||
      (isVitalitySleepScheduledToday() && isVitalityQuestScheduledToday());
    return senseDone && agilityDone && strengthDone && vitalityDone;
  } catch {
    return false;
  }
}

export function LevelUpOverlay() {
  const { player } = useGame();
  const [, navigate] = useLocation();
  const [pendingLevelUp, setPendingLevelUp] = useState<{
    level: number;
    phrase: string;
    maxHp: number;
    maxMana: number;
  } | null>(null);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const previousLevelRef = useRef<number | null>(null);
  const previousPlayerIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!player) return;

    const currentLevel = player.level;

    if (previousPlayerIdRef.current !== player.id || previousLevelRef.current === null) {
      previousPlayerIdRef.current = player.id;
      previousLevelRef.current = currentLevel;

      // Detect a level-up that happened while the user was away (e.g. completing
      // the vitality session and navigating back home).  Compare the current level
      // against the last level whose stats were actually applied to localStorage.
      // If they differ the overlay was never shown for the gained level(s).
      const lastApplied = parseInt(localStorage.getItem("ascend_stats_level_applied") || "0", 10) || 0;
      if (currentLevel > lastApplied) {
        const result = applyLevelUpStats(currentLevel);
        const maxHp = result?.maxHp ?? getMaxHP(currentLevel);
        const maxMana = result?.maxMana ?? getMaxMana(currentLevel);
        const phrase = getMotivationalPhrase(currentLevel);
        setPendingLevelUp({ level: currentLevel, phrase, maxHp, maxMana });
      } else {
        initLevelBaseline(currentLevel);
      }
      return;
    }

    if (currentLevel > previousLevelRef.current) {
      const result = applyLevelUpStats(currentLevel);
      const maxHp = result?.maxHp ?? getMaxHP(currentLevel);
      const maxMana = result?.maxMana ?? getMaxMana(currentLevel);
      const phrase = getMotivationalPhrase(currentLevel);
      setPendingLevelUp({ level: currentLevel, phrase, maxHp, maxMana });
    }

    previousLevelRef.current = currentLevel;
  }, [player?.id, player?.level]);

  const handleComplete = () => {
    setPendingLevelUp(null);
    if (checkRitualComplete() && localStorage.getItem(FUTURE_GAME_HANDOFF_KEY) !== "1") {
      setShowProfilePrompt(true);
    }
  };

  return (
    <>
      {pendingLevelUp && (
        <LevelUpAnimation
          newLevel={pendingLevelUp.level}
          motivationalPhrase={pendingLevelUp.phrase}
          maxHp={pendingLevelUp.maxHp}
          maxMana={pendingLevelUp.maxMana}
          onComplete={handleComplete}
        />
      )}

      <AnimatePresence>
        {showProfilePrompt && (
          <motion.div
            key="profile-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-end justify-center pb-10 px-5"
            style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
            data-testid="post-levelup-prompt"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="w-full max-w-xs rounded-3xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg, rgba(8,10,28,0.98) 0%, rgba(4,6,20,0.98) 100%)",
                border: "1px solid rgba(139,92,246,0.35)",
                boxShadow: "0 0 60px rgba(139,92,246,0.20), 0 24px 48px rgba(0,0,0,0.70)",
              }}
            >
              <div className="px-6 py-7 flex flex-col items-center gap-5 text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(139,92,246,0.05) 100%)",
                    border: "1.5px solid rgba(139,92,246,0.50)",
                    boxShadow: "0 0 24px rgba(139,92,246,0.30)",
                  }}
                >
                  <span style={{ fontSize: 26 }}>⚔️</span>
                </div>

                <div>
                  <p className="text-base font-bold mb-1" style={{ color: "#e2e8f0" }}>
                    Ritual Complete
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(160,175,200,0.80)" }}>
                    You completed today's full protocol, reached Level {player?.level ?? 2}, and earned {player?.statPoints ?? STAT_POINTS_PER_LEVEL} stat points. Choose your avatar and assign your build.
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <button
                    data-testid="button-view-character"
                    onClick={() => { localStorage.setItem(FUTURE_GAME_HANDOFF_KEY, "1"); setShowProfilePrompt(false); navigate("/hunter-profile"); }}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                    style={{
                      background: "linear-gradient(90deg, #7c3aed, #8b5cf6)",
                      color: "#fff",
                      boxShadow: "0 4px 20px rgba(139,92,246,0.40)",
                    }}
                  >
                    Choose Avatar →
                  </button>
                  <button
                    data-testid="button-stay-home"
                    onClick={() => { localStorage.setItem(FUTURE_GAME_HANDOFF_KEY, "1"); setShowProfilePrompt(false); }}
                    className="w-full py-2.5 rounded-xl text-xs transition-all active:scale-95"
                    style={{ color: "rgba(160,175,200,0.65)" }}
                  >
                    Stay here
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
