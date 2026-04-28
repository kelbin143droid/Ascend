import { useState, useCallback, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { GuidedActivityEngine } from "./GuidedActivityEngine";
import { apiRequest } from "@/lib/queryClient";
import type { ActivityDefinition } from "@/lib/activityEngine";
import { Sparkles, CheckCircle2, SkipForward, Play, Zap, Brain, Dumbbell, ChevronRight } from "lucide-react";
import { saveFlow, loadFlow, clearFlow } from "@/lib/sessionPersistenceStore";

const FLOW_BONUS_XP = 5;

type FeedbackValue = "easy" | "same" | "challenging" | null;

interface FeedbackState {
  meditation: FeedbackValue;
  strength: FeedbackValue;
}

interface DailyFlowEngineProps {
  activities: ActivityDefinition[];
  playerId: string;
  onComplete: (completedIds: string[], bonusAwarded: boolean) => void;
  onCancel: () => void;
  isOnboardingComplete?: boolean;
}

const FEEDBACK_OPTIONS: { value: FeedbackValue; label: string; emoji: string }[] = [
  { value: "easy",        label: "Easy",       emoji: "😌" },
  { value: "same",        label: "Just Right", emoji: "👌" },
  { value: "challenging", label: "Hard",       emoji: "💪" },
];

export function DailyFlowEngine({
  activities,
  playerId,
  onComplete,
  onCancel,
  isOnboardingComplete,
}: DailyFlowEngineProps) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const queryClient = useQueryClient();

  const savedFlow = useMemo(() => loadFlow(), []);
  const restoredIdx = savedFlow ? Math.min(savedFlow.activityIdx, activities.length - 1) : 0;

  const [currentActivityIdx, setCurrentActivityIdx] = useState(restoredIdx);
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => new Set(savedFlow?.completedIds ?? [])
  );
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [showTransition, setShowTransition] = useState(false);
  const [flowFinished, setFlowFinished] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({ meditation: null, strength: null });
  const [runningActivity, setRunningActivity] = useState(false);
  const [bonusXpAwarded, setBonusXpAwarded] = useState(false);

  const currentActivity = activities[currentActivityIdx];
  const allCompleted = completedIds.size === activities.length;

  const didComplete = (id: string) => completedIds.has(id);
  const meditationCompleted = didComplete("phase1_meditation");
  const strengthCompleted = didComplete("phase1_strength");
  const hasFeedbackQuestions = meditationCompleted || strengthCompleted;

  const bonusMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/player/${playerId}/daily-flow-bonus`,
        { bonusXP: FLOW_BONUS_XP }
      );
      return res.json();
    },
    onSuccess: () => {
      setBonusXpAwarded(true);
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      queryClient.invalidateQueries({ queryKey: ["home"] });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async (fb: { meditation?: string; strength?: string }) => {
      const res = await apiRequest(
        "POST",
        `/api/player/${playerId}/training-feedback`,
        fb
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-scaling"] });
    },
  });

  const advanceToNext = useCallback(() => {
    const nextIdx = currentActivityIdx + 1;
    if (nextIdx >= activities.length) {
      setFlowFinished(true);
      if (completedIds.size + 1 === activities.length && !skippedIds.size) {
        bonusMutation.mutate();
      }
      return;
    }
    setShowTransition(true);
    setTimeout(() => {
      setCurrentActivityIdx(nextIdx);
      setShowTransition(false);
      setRunningActivity(false);
    }, 1200);
  }, [currentActivityIdx, activities.length, completedIds, skippedIds, bonusMutation]);

  const handleActivityComplete = useCallback((_xpEarned: number) => {
    const actId = activities[currentActivityIdx].id;
    setCompletedIds((prev) => {
      const next = new Set(prev);
      next.add(actId);
      return next;
    });
    queryClient.invalidateQueries({ queryKey: ["training-scaling"] });

    const nextIdx = currentActivityIdx + 1;
    if (nextIdx >= activities.length) {
      const allDone = completedIds.size + 1 === activities.length;
      if (allDone) {
        bonusMutation.mutate();
      }
      setFlowFinished(true);
      return;
    }

    setShowTransition(true);
    setTimeout(() => {
      setCurrentActivityIdx(nextIdx);
      setShowTransition(false);
      setRunningActivity(false);
    }, 1200);
  }, [activities, currentActivityIdx, completedIds, queryClient, bonusMutation]);

  const handleSkip = useCallback(() => {
    const actId = activities[currentActivityIdx].id;
    setSkippedIds((prev) => {
      const next = new Set(prev);
      next.add(actId);
      return next;
    });

    const nextIdx = currentActivityIdx + 1;
    if (nextIdx >= activities.length) {
      setFlowFinished(true);
      return;
    }
    setShowTransition(true);
    setTimeout(() => {
      setCurrentActivityIdx(nextIdx);
      setShowTransition(false);
      setRunningActivity(false);
    }, 800);
  }, [activities, currentActivityIdx]);

  useEffect(() => {
    if (flowFinished) return;
    saveFlow({
      activityIdx: currentActivityIdx,
      completedIds: Array.from(completedIds),
      savedAt: Date.now(),
    });
  }, [currentActivityIdx, completedIds, flowFinished]);

  // When flow finishes, show feedback if any activities were completed
  useEffect(() => {
    if (!flowFinished) return;
    clearFlow();
    if (hasFeedbackQuestions) {
      setShowFeedback(true);
    }
  }, [flowFinished]);

  const handleFeedbackSubmit = useCallback(() => {
    const payload: { meditation?: string; strength?: string } = {};
    if (meditationCompleted && feedback.meditation) payload.meditation = feedback.meditation;
    if (strengthCompleted && feedback.strength) payload.strength = feedback.strength;
    if (Object.keys(payload).length > 0) {
      feedbackMutation.mutate(payload);
    }
    setShowFeedback(false);
  }, [feedback, meditationCompleted, strengthCompleted, feedbackMutation]);

  const handleFlowFinish = useCallback(() => {
    clearFlow();
    onComplete(Array.from(completedIds), bonusXpAwarded);
  }, [completedIds, bonusXpAwarded, onComplete]);

  // Auto-dismiss completion screen 2.5s after it becomes visible.
  // Runs when flowFinished=true and the feedback modal is closed (or never shown).
  useEffect(() => {
    if (!flowFinished || showFeedback) return;
    const t = setTimeout(handleFlowFinish, 2500);
    return () => clearTimeout(t);
  }, [flowFinished, showFeedback]);

  // ── Feedback modal ────────────────────────────────────────────────────────
  if (showFeedback) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: colors.background }}
        data-testid="flow-feedback-modal"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-xs"
        >
          <div className="text-center mb-6">
            <div className="text-xl font-bold mb-1" style={{ color: colors.text }}>
              How did it go?
            </div>
            <div className="text-xs" style={{ color: colors.textMuted }}>
              Your answer adjusts tomorrow's difficulty.
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {meditationCompleted && (
              <div>
                <div
                  className="flex items-center gap-2 mb-2.5 text-sm font-semibold"
                  style={{ color: colors.text }}
                >
                  <Brain size={15} style={{ color: "#3b82f6" }} />
                  Calm Breathing
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {FEEDBACK_OPTIONS.map((opt) => {
                    const selected = feedback.meditation === opt.value;
                    return (
                      <button
                        key={opt.value}
                        data-testid={`feedback-meditation-${opt.value}`}
                        onClick={() => setFeedback((f) => ({ ...f, meditation: opt.value }))}
                        className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95"
                        style={{
                          backgroundColor: selected
                            ? `#3b82f620`
                            : `${colors.textMuted}10`,
                          border: `1.5px solid ${selected ? "#3b82f6" : `${colors.textMuted}20`}`,
                          color: selected ? "#3b82f6" : colors.textMuted,
                        }}
                      >
                        <span className="text-base leading-none">{opt.emoji}</span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {strengthCompleted && (
              <div>
                <div
                  className="flex items-center gap-2 mb-2.5 text-sm font-semibold"
                  style={{ color: colors.text }}
                >
                  <Dumbbell size={15} style={{ color: "#ef4444" }} />
                  Physical Circuit
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {FEEDBACK_OPTIONS.map((opt) => {
                    const selected = feedback.strength === opt.value;
                    return (
                      <button
                        key={opt.value}
                        data-testid={`feedback-strength-${opt.value}`}
                        onClick={() => setFeedback((f) => ({ ...f, strength: opt.value }))}
                        className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95"
                        style={{
                          backgroundColor: selected
                            ? `#ef444420`
                            : `${colors.textMuted}10`,
                          border: `1.5px solid ${selected ? "#ef4444" : `${colors.textMuted}20`}`,
                          color: selected ? "#ef4444" : colors.textMuted,
                        }}
                      >
                        <span className="text-base leading-none">{opt.emoji}</span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            data-testid="button-submit-feedback"
            onClick={handleFeedbackSubmit}
            className="w-full mt-7 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ backgroundColor: colors.primary, color: "#fff" }}
          >
            Save & Continue
            <ChevronRight size={16} />
          </button>

          <button
            data-testid="button-skip-feedback"
            onClick={() => setShowFeedback(false)}
            className="w-full mt-2 py-2 text-xs text-center"
            style={{ color: colors.textMuted }}
          >
            Skip
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // ── Flow completion screen ────────────────────────────────────────────────
  if (flowFinished) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: colors.background }}
        data-testid="daily-flow-complete"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: `${colors.primary}20`,
              border: `2px solid ${colors.primary}50`,
              boxShadow: `0 0 40px ${colors.primary}30`,
            }}
          >
            <Sparkles size={44} style={{ color: colors.primary }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6"
        >
          <div className="text-xl font-bold mb-2" style={{ color: colors.text }}>
            Daily flow complete.
          </div>
          <div className="text-sm" style={{ color: colors.textMuted }}>
            Your rhythm is strengthening.
          </div>
        </motion.div>

        <div className="flex flex-col items-center gap-3 mb-6 w-full max-w-xs">
          {activities.map((act) => {
            const done = completedIds.has(act.id);
            const skipped = skippedIds.has(act.id);
            return (
              <div
                key={act.id}
                className="flex items-center gap-3 w-full px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: done ? `${act.color}10` : `${colors.textMuted}08`,
                  border: `1px solid ${done ? act.color + "30" : colors.textMuted + "15"}`,
                }}
              >
                {done ? (
                  <CheckCircle2 size={16} style={{ color: act.color }} />
                ) : (
                  <SkipForward size={16} style={{ color: colors.textMuted }} />
                )}
                <span
                  className="text-sm flex-1"
                  style={{ color: done ? colors.text : colors.textMuted }}
                >
                  {act.activityName}
                </span>
                <span className="text-[10px]" style={{ color: done ? act.color : colors.textMuted }}>
                  {done ? "Done" : skipped ? "Skipped" : "—"}
                </span>
              </div>
            );
          })}
        </div>

        {allCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 mb-6 px-4 py-2 rounded-lg"
            style={{
              backgroundColor: `${colors.primary}15`,
              border: `1px solid ${colors.primary}30`,
            }}
          >
            <Zap size={16} style={{ color: colors.primary }} />
            <span className="text-sm font-bold" style={{ color: colors.primary }}>
              +{FLOW_BONUS_XP} Bonus XP
            </span>
          </motion.div>
        )}

        <button
          className="px-10 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95"
          style={{ backgroundColor: colors.primary, color: "#fff" }}
          onClick={handleFlowFinish}
          data-testid="button-finish-flow"
        >
          Return Home
        </button>
      </motion.div>
    );
  }

  // ── Activity list / runner ────────────────────────────────────────────────
  if (runningActivity && currentActivity) {
    return (
      <GuidedActivityEngine
        activity={currentActivity}
        playerId={playerId}
        onComplete={handleActivityComplete}
        onCancel={() => setRunningActivity(false)}
        isOnboardingComplete={isOnboardingComplete}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: colors.background }}
      data-testid="daily-flow-engine"
    >
      <div
        className="flex items-center justify-between p-4 shrink-0"
        style={{ borderBottom: `1px solid ${colors.surfaceBorder}` }}
      >
        <div>
          <div className="text-sm font-bold" style={{ color: colors.text }}>
            Daily Training Flow
          </div>
          <div className="text-xs" style={{ color: colors.textMuted }}>
            Step {currentActivityIdx + 1} of {activities.length}
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: `${colors.textMuted}15`, color: colors.textMuted }}
          data-testid="button-cancel-flow"
        >
          Exit Flow
        </button>
      </div>

      <div className="flex gap-1 px-4 pt-3">
        {activities.map((act, i) => (
          <div
            key={act.id}
            className="flex-1 h-1.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor: completedIds.has(act.id)
                ? act.color
                : skippedIds.has(act.id)
                ? `${colors.textMuted}40`
                : i === currentActivityIdx
                ? `${act.color}60`
                : `${colors.textMuted}20`,
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {showTransition ? (
          <motion.div
            key="transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-3"
          >
            <CheckCircle2 size={36} style={{ color: activities[currentActivityIdx]?.color || colors.primary }} />
            <div className="text-sm font-bold" style={{ color: colors.text }}>
              Moving to next activity...
            </div>
          </motion.div>
        ) : currentActivity ? (
          <motion.div
            key={currentActivity.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex-1 flex flex-col items-center justify-center px-6 gap-6"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: `${currentActivity.color}15`,
                border: `2px solid ${currentActivity.color}40`,
                boxShadow: `0 0 30px ${currentActivity.color}15`,
              }}
            >
              <Sparkles size={36} style={{ color: currentActivity.color }} />
            </div>

            <div className="text-center">
              <div
                className="text-xs uppercase tracking-widest mb-1"
                style={{ color: colors.textMuted }}
              >
                Step {currentActivityIdx + 1} of {activities.length}
              </div>
              <div className="text-xl font-bold" style={{ color: colors.text }}>
                {currentActivity.activityName}
              </div>
              <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                ~{Math.ceil(currentActivity.duration / 60)} min
                {currentActivity.tier && currentActivity.tier > 1 && (
                  <span style={{ color: currentActivity.color }}> · Tier {currentActivity.tier}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                className="w-full px-6 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                style={{ backgroundColor: currentActivity.color, color: "#fff" }}
                onClick={() => setRunningActivity(true)}
                data-testid="button-start-flow-activity"
              >
                <Play size={16} />
                Start
              </button>
              <button
                className="w-full px-6 py-2.5 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: `${colors.textMuted}10`,
                  color: colors.textMuted,
                  border: `1px solid ${colors.textMuted}20`,
                }}
                onClick={handleSkip}
                data-testid="button-skip-flow-activity"
              >
                <SkipForward size={14} />
                Skip
              </button>
            </div>

            {skippedIds.size > 0 && (
              <div className="text-[10px] text-center" style={{ color: colors.textMuted }}>
                Bonus XP requires completing all activities
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
