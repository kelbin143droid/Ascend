import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { OnboardingDashboard } from "./OnboardingDashboard";
import { OnboardingStartScreen } from "./OnboardingStartScreen";
import { OnboardingCompletionScreen } from "./OnboardingCompletionScreen";
import { OnboardingCompleteScreen } from "./OnboardingCompleteScreen";
import { DevPanel } from "@/components/game/DevPanel";
import { Day5CoachTutorial } from "@/components/game/Day5CoachTutorial";
import { ONBOARDING_CONFIG } from "./onboardingConfig";
import { isDayFiveTutorialDone, markSectographTutorialDone } from "@/lib/userState";
import { useGame } from "@/context/GameContext";
import { apiRequest } from "@/lib/queryClient";

interface HomeData {
  onboardingDay: number;
  completedDays: number[];
  isOnboardingComplete: boolean;
  streak: number;
}

interface OnboardingFlowProps {
  homeData: HomeData;
  justCompletedDay: number | null;
  onClearJustCompleted: () => void;
}

type InternalView = "dashboard" | "start" | "day5-tutorial";

export function OnboardingFlow({
  homeData,
  justCompletedDay,
  onClearJustCompleted,
}: OnboardingFlowProps) {
  const [, setLocation] = useLocation();
  const { player } = useGame();
  const [internalView, setInternalView] = useState<InternalView>("dashboard");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { onboardingDay, completedDays, streak } = homeData;
  const earnedXP = completedDays.length * 5;

  function handleStartDay(day: number) {
    if (day === 5 && !isDayFiveTutorialDone()) {
      setSelectedDay(5);
      setInternalView("day5-tutorial");
      return;
    }
    setSelectedDay(day);
    setInternalView("start");
  }

  function handleBack() {
    setInternalView("dashboard");
    setSelectedDay(null);
  }

  function handleBeginSession() {
    const day = selectedDay ?? onboardingDay;
    const config = ONBOARDING_CONFIG[day];
    if (config) {
      setLocation(`/guided-session/${config.sessionId}`);
    }
  }

  const handleDay5TutorialComplete = useCallback(async () => {
    if (!player?.id) return;

    markSectographTutorialDone();

    try {
      await apiRequest("POST", `/api/player/${player.id}/complete-guided-session`, {
        sessionId: "plan-tomorrow",
        habitId: "guided_plan-tomorrow",
      });
    } catch {}

    sessionStorage.setItem("ascend_just_completed_day", "5");
    localStorage.setItem("ascend_ob_day5_ts", String(Date.now()));

    setLocation("/");
  }, [player?.id, setLocation]);

  if (justCompletedDay !== null) {
    if (justCompletedDay >= 5) {
      return (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key="onboarding-complete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <OnboardingCompleteScreen
                streak={streak}
                onEnter={onClearJustCompleted}
              />
            </motion.div>
          </AnimatePresence>
          <DevPanel />
        </>
      );
    }

    return (
      <>
        <AnimatePresence mode="wait">
          <motion.div
            key={`completion-${justCompletedDay}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <OnboardingCompletionScreen
              day={justCompletedDay}
              streak={streak}
              earnedXP={earnedXP}
              onContinue={onClearJustCompleted}
            />
          </motion.div>
        </AnimatePresence>
        <DevPanel />
      </>
    );
  }

  if (internalView === "day5-tutorial") {
    return (
      <>
        <Day5CoachTutorial onComplete={handleDay5TutorialComplete} />
        <DevPanel />
      </>
    );
  }

  if (internalView === "start" && selectedDay !== null) {
    return (
      <>
        <AnimatePresence mode="wait">
          <motion.div
            key={`start-${selectedDay}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
          >
            <OnboardingStartScreen
              day={selectedDay}
              onBegin={handleBeginSession}
              onBack={handleBack}
            />
          </motion.div>
        </AnimatePresence>
        <DevPanel />
      </>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <OnboardingDashboard
            onboardingDay={onboardingDay}
            completedDays={completedDays}
            streak={streak}
            onStartDay={handleStartDay}
          />
        </motion.div>
      </AnimatePresence>
      <DevPanel />
    </>
  );
}
