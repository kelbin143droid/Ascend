import { useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { OnboardingDashboard } from "./OnboardingDashboard";
import { OnboardingStartScreen } from "./OnboardingStartScreen";
import { OnboardingCompletionScreen } from "./OnboardingCompletionScreen";
import { OnboardingCompleteScreen } from "./OnboardingCompleteScreen";
import { DevPanel } from "@/components/game/DevPanel";
import { ONBOARDING_CONFIG } from "./onboardingConfig";

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

type InternalView = "dashboard" | "start";

export function OnboardingFlow({
  homeData,
  justCompletedDay,
  onClearJustCompleted,
}: OnboardingFlowProps) {
  const [, setLocation] = useLocation();
  const [internalView, setInternalView] = useState<InternalView>("dashboard");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { onboardingDay, completedDays, streak } = homeData;
  const earnedXP = completedDays.length * 5;

  function handleStartDay(day: number) {
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

  // ── Completion screens ──────────────────────────────────────────────────────
  // Shown when the user returns from a guided session (justCompletedDay set via sessionStorage)
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

  // ── Start screen ────────────────────────────────────────────────────────────
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

  // ── Dashboard ───────────────────────────────────────────────────────────────
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
