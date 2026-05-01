import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  getBreathingProfile,
  saveBreathingProfile,
} from "@/lib/breathingStore";
import {
  recordBreathingSession,
  getPhaseProgress,
  BREATHING_PHASES,
} from "@/lib/breathingProgressionSystem";
import type { BreathingSessionFeedback } from "@/lib/breathingProgressionSystem";
import { Wind, ChevronRight, Star, Zap, Flame, TrendingUp, Unlock } from "lucide-react";

interface ThemeColors {
  background: string;
  text: string;
  textMuted: string;
  primary: string;
}

interface BreathingFeedbackModalProps {
  playerId: string;
  colors: ThemeColors;
  onComplete: (bonusXp: number) => void;
}

type Screen = "questions" | "results";

const DIFFICULTY_OPTIONS = [
  { value: "easy" as const,     label: "Easy",      emoji: "😌", desc: "Felt comfortable throughout" },
  { value: "normal" as const,   label: "Normal",    emoji: "👌", desc: "Manageable but attentive" },
  { value: "difficult" as const, label: "Difficult", emoji: "💪", desc: "Challenging to keep up" },
];

const RHYTHM_OPTIONS = [
  { value: "yes" as const,    label: "Yes",    emoji: "🎯", desc: "Stayed in sync the whole time" },
  { value: "mostly" as const, label: "Mostly", emoji: "〰️", desc: "Minor lapses, recovered quickly" },
  { value: "no" as const,     label: "No",     emoji: "🌀", desc: "Hard to follow the pattern" },
];

const WANDER_OPTIONS = [
  { value: "rarely" as const,    label: "Rarely",    emoji: "🧘", desc: "Stayed fully present" },
  { value: "sometimes" as const, label: "Sometimes", emoji: "💭", desc: "Brief drifts, came back" },
  { value: "often" as const,     label: "Often",     emoji: "🌊", desc: "Mind wandered a lot" },
];

export function BreathingFeedbackModal({ playerId, colors, onComplete }: BreathingFeedbackModalProps) {
  const queryClient = useQueryClient();
  const [screen, setScreen] = useState<Screen>("questions");
  const [difficulty, setDifficulty] = useState<BreathingSessionFeedback["difficulty"] | null>(null);
  const [rhythm, setRhythm] = useState<BreathingSessionFeedback["maintainedRhythm"] | null>(null);
  const [wander, setWander] = useState<BreathingSessionFeedback["mindWandered"] | null>(null);
  const [result, setResult] = useState<{
    score: number;
    isPerfect: boolean;
    xp: { base: number; streakBonus: number; perfectBonus: number; total: number };
    phaseUnlocked: number | null;
    percentToNext: number;
    sessionsForPhase: number;
    neededForNextPhase: number | null;
    newPhase: number;
  } | null>(null);

  const gainExpMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", `/api/player/${playerId}/gain-exp`, { amount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      queryClient.invalidateQueries({ queryKey: ["home"] });
    },
  });

  const trainingFeedbackMutation = useMutation({
    mutationFn: async (value: string) => {
      const res = await apiRequest("POST", `/api/player/${playerId}/training-feedback`, {
        meditation: value,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-scaling"] });
    },
  });

  const canSubmit = difficulty !== null && rhythm !== null && wander !== null;

  function handleSubmit() {
    if (!difficulty || !rhythm || !wander) return;
    const feedback: BreathingSessionFeedback = {
      difficulty,
      maintainedRhythm: rhythm,
      mindWandered: wander,
    };

    const profile = getBreathingProfile();
    const sessionResult = recordBreathingSession(profile, feedback);
    saveBreathingProfile(sessionResult.updatedProfile);

    const progress = getPhaseProgress(sessionResult.updatedProfile);

    setResult({
      score: sessionResult.score,
      isPerfect: sessionResult.isPerfect,
      xp: sessionResult.xp,
      phaseUnlocked: sessionResult.phaseUnlocked,
      percentToNext: progress.percentToNext,
      sessionsForPhase: progress.sessionsForPhase,
      neededForNextPhase: progress.neededForNextPhase,
      newPhase: sessionResult.updatedProfile.phase,
    });

    const trainingValue =
      difficulty === "easy" ? "easy" : difficulty === "difficult" ? "challenging" : "same";
    trainingFeedbackMutation.mutate(trainingValue);

    if (sessionResult.xp.total > 0) {
      gainExpMutation.mutate(sessionResult.xp.total);
    }

    setScreen("results");
  }

  function handleContinue() {
    onComplete(result?.xp.total ?? 0);
  }

  const primary = colors.primary;

  if (screen === "questions") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 overflow-y-auto"
        style={{
          backgroundColor: colors.background,
          WebkitOverflowScrolling: "touch",
        }}
        data-testid="breathing-feedback-modal"
      >
        <div className="max-w-xs mx-auto w-full flex flex-col gap-4 px-5 pt-6 pb-10">
          <div className="text-center mb-1">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-2.5"
              style={{ backgroundColor: `${primary}20`, border: `1.5px solid ${primary}40` }}
            >
              <Wind size={20} style={{ color: primary }} />
            </div>
            <div className="text-base font-bold mb-0.5" style={{ color: colors.text }}>
              Breathing Check-In
            </div>
            <div className="text-xs" style={{ color: colors.textMuted }}>
              3 quick questions to track your progress
            </div>
          </div>

          <Question
            number={1}
            label="How did the breathing feel?"
            options={DIFFICULTY_OPTIONS}
            value={difficulty}
            onSelect={setDifficulty}
            colors={colors}
            primary={primary}
          />

          <Question
            number={2}
            label="Did you maintain the rhythm?"
            options={RHYTHM_OPTIONS}
            value={rhythm}
            onSelect={setRhythm}
            colors={colors}
            primary={primary}
          />

          <Question
            number={3}
            label="Did your mind wander?"
            options={WANDER_OPTIONS}
            value={wander}
            onSelect={setWander}
            colors={colors}
            primary={primary}
          />

          <button
            data-testid="button-submit-breathing-feedback"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 mt-2"
            style={{
              backgroundColor: canSubmit ? primary : `${colors.textMuted}30`,
              color: canSubmit ? "#fff" : colors.textMuted,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            See Results
            <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    );
  }

  if (!result) return null;

  const phaseDef = BREATHING_PHASES[result.newPhase as 1 | 2 | 3 | 4];
  const scoreColor =
    result.score >= 85 ? "#22c55e" : result.score >= 50 ? primary : "#f59e0b";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ backgroundColor: colors.background, WebkitOverflowScrolling: "touch" }}
      data-testid="breathing-results-screen"
    >
      <div className="max-w-xs mx-auto w-full flex flex-col gap-4 px-5 pt-6 pb-10">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.05 }}
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: `${scoreColor}20`, border: `2px solid ${scoreColor}50` }}
          >
            {result.isPerfect ? (
              <Star size={28} style={{ color: scoreColor }} />
            ) : (
              <Wind size={28} style={{ color: scoreColor }} />
            )}
          </motion.div>
          <div className="text-lg font-bold mb-0.5" style={{ color: colors.text }}>
            {result.isPerfect ? "Perfect Session!" : "Session Complete"}
          </div>
          <div className="text-xs" style={{ color: colors.textMuted }}>
            Session score: <span style={{ color: scoreColor, fontWeight: 700 }}>{result.score}/100</span>
          </div>
        </div>

        {result.phaseUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl p-4 flex items-center gap-3"
            style={{
              backgroundColor: `#22c55e18`,
              border: `1.5px solid #22c55e40`,
            }}
          >
            <Unlock size={20} style={{ color: "#22c55e", flexShrink: 0 }} />
            <div>
              <div className="text-sm font-bold" style={{ color: "#22c55e" }}>
                Phase {result.phaseUnlocked} Unlocked!
              </div>
              <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                {BREATHING_PHASES[result.phaseUnlocked as 1 | 2 | 3 | 4].description}
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl p-4"
          style={{ backgroundColor: `${primary}10`, border: `1.5px solid ${primary}25` }}
        >
          <div className="text-xs font-semibold mb-3" style={{ color: colors.textMuted }}>
            XP EARNED
          </div>
          <div className="flex flex-col gap-1.5">
            <XpRow label="Session XP" value={result.xp.base} icon={<Zap size={13} />} color={primary} colors={colors} />
            {result.xp.streakBonus > 0 && (
              <XpRow label="Streak Bonus" value={result.xp.streakBonus} icon={<Flame size={13} />} color="#f59e0b" colors={colors} />
            )}
            {result.xp.perfectBonus > 0 && (
              <XpRow label="Perfect Session" value={result.xp.perfectBonus} icon={<Star size={13} />} color="#22c55e" colors={colors} />
            )}
          </div>
          <div
            className="mt-3 pt-3 flex items-center justify-between text-sm font-bold"
            style={{ borderTop: `1px solid ${primary}20`, color: colors.text }}
          >
            <span>Total</span>
            <span style={{ color: primary }}>+{result.xp.total} XP</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl p-4"
          style={{ backgroundColor: `${colors.textMuted}08`, border: `1.5px solid ${colors.textMuted}15` }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={13} style={{ color: primary }} />
              <span className="text-xs font-semibold" style={{ color: colors.text }}>
                Phase {result.newPhase} · {phaseDef.label}
              </span>
            </div>
            {result.neededForNextPhase && (
              <span className="text-xs" style={{ color: colors.textMuted }}>
                {result.sessionsForPhase}/{result.neededForNextPhase} sessions
              </span>
            )}
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: `${colors.textMuted}20` }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.percentToNext}%` }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="h-full rounded-full"
              style={{ backgroundColor: primary }}
            />
          </div>
          <div className="text-xs mt-2" style={{ color: colors.textMuted }}>
            {result.neededForNextPhase
              ? `${phaseDef.focus} · Next phase in ${Math.max(0, result.neededForNextPhase - result.sessionsForPhase)} more sessions`
              : `${phaseDef.focus} · Max phase reached`}
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          data-testid="button-breathing-continue"
          onClick={handleContinue}
          className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ backgroundColor: primary, color: "#fff" }}
        >
          Continue
          <ChevronRight size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}

function XpRow({
  label, value, icon, color, colors,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  colors: ThemeColors;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-1.5" style={{ color: colors.textMuted }}>
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <span style={{ color, fontWeight: 600 }}>+{value}</span>
    </div>
  );
}

function Question<T extends string>({
  number, label, options, value, onSelect, colors, primary,
}: {
  number: number;
  label: string;
  options: { value: T; label: string; emoji: string; desc: string }[];
  value: T | null;
  onSelect: (v: T) => void;
  colors: ThemeColors;
  primary: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: `${primary}20`, color: primary }}
        >
          {number}
        </div>
        <span className="text-sm font-semibold" style={{ color: colors.text }}>
          {label}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              data-testid={`breathing-q${number}-${opt.value}`}
              onClick={() => onSelect(opt.value)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all active:scale-98"
              style={{
                backgroundColor: selected ? `${primary}18` : `${colors.textMuted}08`,
                border: `1.5px solid ${selected ? primary : `${colors.textMuted}18`}`,
              }}
            >
              <span
                className="flex-shrink-0 flex items-center justify-center"
                style={{ width: 28, height: 28, fontSize: 18, lineHeight: 1 }}
              >
                {opt.emoji}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold" style={{ color: selected ? primary : colors.text }}>
                  {opt.label}
                </div>
                <div className="text-xs" style={{ color: colors.textMuted }}>
                  {opt.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
