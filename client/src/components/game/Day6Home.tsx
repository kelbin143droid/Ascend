import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, CheckCircle2, Sparkles, X, Palette,
  ArrowRight, BookOpen, Zap, Shield, Flame,
  ChevronLeft, ChevronRight,
  Heart, Moon, Swords, Compass, Crosshair, Leaf, FlaskConical, Target, Trophy,
} from "lucide-react";
import { CustomizePanel } from "./CustomizePanel";
import { AvatarPickerSheet, getAvatarIcon, saveAvatarIcon } from "./AvatarPickerSheet";
import {
  shouldPromptAutoSwitch,
  setMode as setSleepMode,
  dismissAutoSwitchPrompt,
} from "@/lib/sleepModeStore";
import { useLocation } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { DailyFlowEngine } from "./DailyFlowEngine";
import { PhysicalCircuitSetupModal } from "./PhysicalCircuitSetupModal";
import { SystemLayout } from "./SystemLayout";
import { type CategoryTiers } from "@/lib/activityEngine";
import { getWorkoutLevel } from "@/lib/workoutProgressStore";
import { getPathFlowConfig } from "@/lib/pathFlowConfig";
import { buildDailyFlowActivities } from "@/lib/dailyFlowBuilder";
import { getPathAwareRecommendation } from "@/lib/dailyRecommendationEngine";
import { recordSleepCheck, recordBreathingSession, initLevelBaseline } from "@/lib/statsSystem";
import { markFlowCompleted } from "@/lib/userState";
import { computeXPState } from "@/lib/xpSystem";
import { clearFlow, clearSession } from "@/lib/sessionPersistenceStore";
import { useSessionProgress } from "@/hooks/useSessionProgress";
import { PHASE1_DAILY_TARGET_XP, PHASE1_XP } from "@shared/gameProgression";
import { addXP, completeTask } from "@/lib/workoutProgressStore";
import {
  initializePhysicalCircuitProfile,
  isPhysicalCircuitProfileInitialized,
  type PhysicalCircuitStartingChoices,
} from "@/lib/physicalCircuitProgressStore";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface HomeData {
  phase: { number: number; name: string };
  insight: string; onboardingDay: number;
  isOnboardingComplete: boolean; streak: number;
  stability?: { consecutiveActiveDays?: number };
}
interface StatLevel { level: number; currentXP: number; xpForNext: number; }
interface PlayerData {
  level: number; exp: number; maxExp: number; totalExp: number;
  name?: string; statLevels?: Record<string, StatLevel>;
  hp?: number; maxHp?: number; mp?: number; maxMp?: number;
}
interface Player { id: string; }
interface ScalingData { trainingScaling?: Record<string, { tier: number }>; }
interface Props {
  homeData: HomeData; playerData: PlayerData | null;
  player: Player; scalingData: ScalingData | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Card definitions
// barType: "mp" uses living player stats; "xp" uses statLevels XP
// fallbackRoute: used when the activity is not in today's flow or is done
// ─────────────────────────────────────────────────────────────────────────────

const INTELLIGENCE_ACTIVITY_ID = "phase1_intelligence";
const VITALITY_ACTIVITY_ID = "phase1_vitality";
const FIRST_MISSION_GUIDE_SEEN_KEY = "ascend_first_mission_guide_seen";

const DASH_CARDS = [
  {
    id: "calm",       activityId: "phase1_meditation", statKey: "sense",
    label: "Calm Mind",  sub: "Breathing Reset",    desc: "Mental clarity",
    icon: Brain,  color: "#818cf8", glow: "rgba(129,140,248,0.45)",
    barLabel: "MP", barType: "mp" as const, fallbackRoute: "/coach",
  },
  {
    id: "intelligence", activityId: INTELLIGENCE_ACTIVITY_ID, statKey: "sense",
    label: "Intel", sub: "Daily Insight", desc: "3-min read",
    icon: BookOpen, color: "#38bdf8", glow: "rgba(56,189,248,0.45)",
    barLabel: "INT", barType: "xp" as const, fallbackRoute: "/library",
  },
  {
    id: "vitality", activityId: VITALITY_ACTIVITY_ID, statKey: "vitality",
    label: "Vitality", sub: "Sleep Log", desc: "Recovery check",
    icon: Heart, color: "#f59e0b", glow: "rgba(245,158,11,0.45)",
    barLabel: "VIT", barType: "xp" as const, fallbackRoute: "/sleep-settings",
  },
  {
    id: "strength",   activityId: "phase1_strength",   statKey: "strength",
    label: "Strength",   sub: "Power Training",       desc: "Build resilience",
    icon: Shield, color: "#fbbf24", glow: "rgba(251,191,36,0.45)",
    barLabel: "STR", barType: "xp" as const, fallbackRoute: "/train",
  },
  {
    id: "agility",    activityId: "phase1_agility",    statKey: "agility",
    label: "Agility",    sub: "Mobility Flow",        desc: "Movement & flex",
    icon: Zap,    color: "#34d399", glow: "rgba(52,211,153,0.45)",
    barLabel: "AGI", barType: "xp" as const, fallbackRoute: "/train",
  },
] as const;

const ACTIVITY_XP: Record<string, number> = {
  phase1_meditation: PHASE1_XP.sense,
  phase1_agility: PHASE1_XP.agility,
  phase1_strength: PHASE1_XP.strength,
  [INTELLIGENCE_ACTIVITY_ID]: PHASE1_XP.intelligence,
  [VITALITY_ACTIVITY_ID]: PHASE1_XP.vitality,
};

const FIRST_RESET_COMPLETED_DATE_KEY = "ascend_first_reset_completed_date";
const INTELLIGENCE_READ_SECONDS = 60;

type IntelReadMode = "recommended" | "custom";
type SleepQuality = "great" | "ok" | "rough";

const DAILY_INTEL_READS = [
  {
    title: "The 1-Minute Start",
    topic: "Action beats motivation.",
    prompt: "Pick the smallest visible step. Do it before judging your energy.",
    body: [
      "Motivation is useful, but it is unreliable. It rises after sleep, food, music, pressure, or a good mood, then disappears when life gets noisy. A stronger system does not wait for motivation first. It starts with a small action that is easy enough to do even when the mood is average.",
      "The one-minute start works because it lowers the cost of beginning. You are not promising a perfect workout, a flawless study block, or a transformed life. You are only asking yourself to enter the room, open the page, put on the shoes, or complete the first clean rep.",
      "Once the first action is done, your brain gets new evidence: I am moving. That evidence often creates the energy you were waiting for. Momentum is not something you find. Most days, it is something you trigger.",
      "Today, choose one action so small it feels almost too easy. Do it before negotiating with yourself. The win is not the size of the action. The win is proving that your system can start on command.",
    ],
  },
  {
    title: "Protect Your Attention",
    topic: "Focus is trained by subtraction.",
    prompt: "Remove one distraction before you begin. Less noise, better effort.",
    body: [
      "Most people try to focus by adding more pressure: more reminders, more discipline, more self-talk. But attention usually improves faster when you remove something. A quiet surface, a hidden phone, one closed tab, or a simple timer can do more than another motivational speech.",
      "Your mind follows friction. If distraction is one tap away, your brain will keep checking for escape routes. If the next useful action is already visible, it becomes easier to stay with the work. The environment starts making the better choice feel normal.",
      "Before a focus session, do a quick subtraction scan. What can you remove for the next few minutes? A notification, a messy object, a second screen, a song with lyrics, or an open app can all leak energy.",
      "Focus is not a personality trait. It is a trained state. Protect the first few minutes, and the rest of the session has a better chance of becoming real.",
    ],
  },
  {
    title: "Identity Reps",
    topic: "You become what you repeat.",
    prompt: "One clean rep matters. Make the next action match the person you are building.",
    body: [
      "Identity is built through repeated evidence. Every completed task becomes a small vote for the kind of person you believe you are. One vote will not change everything, but repeated votes become hard to ignore.",
      "This is why tiny actions matter. A short reset, a mobility session, a logged sleep plan, or a few focused pages all create proof. The action tells your mind: I am someone who returns. I am someone who trains. I am someone who keeps promises at a realistic size.",
      "The goal is not to pretend you are already perfect. The goal is to act in a way that makes the next version of you easier to believe in. Confidence grows when your behavior and your desired identity start matching.",
      "For today, pick one clean rep. Do it with full attention. Then let that evidence count.",
    ],
  },
  {
    title: "Recovery Is Strategy",
    topic: "Rest keeps the system online.",
    prompt: "Progress is not only push. Protect sleep, hydration, and calm.",
    body: [
      "Recovery is not the opposite of progress. It is part of the machinery that makes progress possible. A tired system can still force action for a while, but it becomes more expensive: more cravings, more avoidance, more emotional noise, and less patience.",
      "Good recovery does not need to be dramatic. It can start with a sleep window, a water bottle, a calmer evening, or a short breath reset before the next decision. These actions protect the baseline that your future effort depends on.",
      "When recovery is ignored, discipline has to carry too much weight. When recovery is planned, discipline gets support. You are no longer trying to win the day with willpower alone.",
      "Today, treat one recovery action as training. Schedule it, complete it, and notice how much easier tomorrow becomes when the system is not running on fumes.",
    ],
  },
  {
    title: "Reduce the Friction",
    topic: "Environment beats willpower.",
    prompt: "Make the good action easier to start and the bad action harder to reach.",
    body: [
      "Willpower is valuable, but it should not be your only tool. The better strategy is to design your surroundings so the right action is easier to begin. When the path is clear, you spend less energy convincing yourself.",
      "Friction can be tiny and still powerful. Shoes by the door, a book on the desk, a pre-written task list, a prepared meal, or a blocked app can change what happens when your energy dips.",
      "The reverse is also true. If the habit you want to avoid is effortless, it will keep winning when you are tired. Add a little distance. Put it out of sight. Add one extra step between impulse and action.",
      "Today, change one piece of your environment. Do not rely on a future version of yourself to be stronger. Make the better choice easier for that version to find.",
    ],
  },
];

function dailyIntelRead() {
  const daySeed = Math.floor(new Date().getTime() / 86400000);
  return DAILY_INTEL_READS[daySeed % DAILY_INTEL_READS.length];
}

function buildIntelReadCopy(mode: IntelReadMode, recommended: ReturnType<typeof dailyIntelRead>, customTopic: string) {
  const chosenTopic = customTopic.trim() || "discipline, confidence, and focus";
  if (mode === "custom") {
    return {
      title: `Read on ${chosenTopic}`,
      eyebrow: "Your chosen topic",
      paragraphs: [
        `For the next few minutes, read with one target: find a single useful idea about ${chosenTopic} that you can test today.`,
        "Start by looking for a principle, not a perfect answer. A principle is a sentence that changes what you do next: make it easier to start, protect your attention, recover before you crash, or repeat the behavior you want to become normal.",
        `As you read, ask: what is one action that would make ${chosenTopic} visible in my day? It could be a one-minute start, a note to yourself, one avoided distraction, or a better evening setup.`,
        "Do not try to master the whole subject in one sitting. Leave with one useful sentence, one practical action, or one sharper question. That is enough for today's Intel rep.",
      ],
    };
  }
  return {
    title: recommended.title,
    eyebrow: "Recommended read",
    paragraphs: recommended.body,
  };
}

function formatReadTimer(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function todayDateKey(): string {
  return new Date().toISOString().split("T")[0];
}

function wasFirstResetCompletedToday(): boolean {
  try {
    return localStorage.getItem(FIRST_RESET_COMPLETED_DATE_KEY) === todayDateKey();
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared card style token
// ─────────────────────────────────────────────────────────────────────────────

const CARD_BASE = "rounded-2xl p-4 flex flex-col gap-3 w-full text-left";

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function Day6Home({ homeData, playerData, player, scalingData }: Props) {
  const { backgroundTheme } = useTheme();
  const colors    = backgroundTheme.colors;
  const isIronSov = backgroundTheme.id === "male";
  const isNeonEmp = backgroundTheme.id === "female";

  const hudCyan  = "#22d3ee";
  const hudCyanG = "rgba(34,211,238,0.55)";
  const fae = { peach: "#fbcaad", peachStrong: "#f4845f", lavender: "#c8b9ee", lavenderDeep: "#8d75c4", ink: "#2d1b4e" };

  const primary  = isIronSov ? hudCyan  : isNeonEmp ? fae.peachStrong : colors.primary;
  const textCol  = isNeonEmp ? fae.ink  : colors.text;
  const mutedCol = isNeonEmp ? fae.ink + "88" : colors.textMuted;
  const panelBg = isNeonEmp
    ? "linear-gradient(145deg, rgba(11,13,34,0.88) 0%, rgba(7,8,25,0.93) 68%, rgba(21,15,42,0.88) 100%)"
    : "linear-gradient(145deg, rgba(6,8,24,0.92) 0%, rgba(8,10,28,0.86) 100%)";
  const panelBorder = isNeonEmp ? `${primary}48` : `${primary}24`;
  const panelShadow = isNeonEmp
    ? `0 0 0 1px rgba(255,255,255,0.08), 0 18px 48px rgba(20,16,45,0.42), 0 0 28px ${primary}20, inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.45)`
    : `0 0 0 1px ${primary}0c, 0 2px 20px ${primary}16, 0 10px 34px rgba(0,0,0,0.52), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.35)`;
  const glossOpacity = isNeonEmp ? 0.72 : 0.46;
  const cardTextCol = isNeonEmp ? "rgba(248,250,255,0.96)" : textCol;
  const cardMutedCol = isNeonEmp ? "rgba(218,226,244,0.74)" : mutedCol;

  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [showCustomize, setShowCustomize] = useState(false);
  const [showAvatar,    setShowAvatar]    = useState(false);
  const [avatarIcon,    setAvatarState]   = useState(() => getAvatarIcon());
  const [flowActive,       setFlowActive]       = useState(false);
  const [singleActivityId, setSingleActivityId] = useState<string | null>(null);
  const [showPhysicalSetup, setShowPhysicalSetup] = useState(false);
  const [physicalProfileRevision, setPhysicalProfileRevision] = useState(0);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [intelReadMode, setIntelReadMode] = useState<IntelReadMode>("recommended");
  const [customIntelTopic, setCustomIntelTopic] = useState("");
  const [intelReadStarted, setIntelReadStarted] = useState(false);
  const [intelReadingView, setIntelReadingView] = useState(false);
  const [intelReadPage, setIntelReadPage] = useState(0);
  const [intelSecondsLeft, setIntelSecondsLeft] = useState(INTELLIGENCE_READ_SECONDS);
  const [intelSubmitting, setIntelSubmitting] = useState(false);
  const [showVitality, setShowVitality] = useState(false);
  const [sleepHours, setSleepHours] = useState("7");
  const [sleepQuality, setSleepQuality] = useState<SleepQuality>("ok");
  const [vitalitySubmitting, setVitalitySubmitting] = useState(false);
  const [showMissionGuide, setShowMissionGuide] = useState(false);
  // Auto-start strength when navigated from agility completion (?autostart=strength)
  const [autoStartPending, setAutoStartPending] = useState(() =>
    typeof window !== "undefined" && window.location.search.includes("autostart=strength")
  );
  const onboardingCompleteRequestedRef = useRef(false);

  const { completedIds, markComplete } = useSessionProgress();

  // Path + activity config
  const tiers: CategoryTiers = {
    strength:   scalingData?.trainingScaling?.strength?.tier   ?? 1,
    agility:    scalingData?.trainingScaling?.agility?.tier    ?? 1,
    meditation: scalingData?.trainingScaling?.meditation?.tier ?? 1,
    vitality:   scalingData?.trainingScaling?.vitality?.tier   ?? 1,
  };
  const [wlevel]   = useState(() => getWorkoutLevel());
  const pathCfg    = getPathFlowConfig(wlevel);
  const pathRec    = getPathAwareRecommendation(wlevel);
  const recommendedIntelRead = useMemo(() => dailyIntelRead(), []);
  const activities = useMemo(
    () => buildDailyFlowActivities(wlevel, { dayNumber: homeData.onboardingDay, tiers }),
    [
      wlevel,
      homeData.onboardingDay,
      tiers.strength,
      tiers.agility,
      tiers.meditation,
      tiers.vitality,
      physicalProfileRevision,
    ],
  );
  const totalMins  = Math.ceil(activities.reduce((s, a) => s + a.duration, 0) / 60);

  // XP
  const xp  = computeXPState(playerData?.totalExp ?? 0, playerData?.level ?? 1, playerData?.exp ?? 0, playerData?.maxExp ?? 100);
  const lvl = playerData?.level ?? 1;
  const [xpFrom, setXpFrom] = useState(xp.percent);
  const xpRef = useRef(xp.percent);
  useEffect(() => {
    if (xp.percent !== xpRef.current) { setXpFrom(xpRef.current); xpRef.current = xp.percent; }
  }, [xp.percent]);

  // Mission sequencing
  // GuidedSessionPage stores "calm-breathing" / "light-movement" as session IDs.
  // Day6Home tracks phase1 activity IDs. These maps bridge the two systems.
  const ACTIVITY_TO_SESSION: Record<string, string> = {
    phase1_meditation: "calm-breathing",
    phase1_agility:    "light-movement",
  };
  const activitySessionRoute = (activityId: string): string | null => {
    const sessionSlug = ACTIVITY_TO_SESSION[activityId];
    return sessionSlug ? `/guided-session/${sessionSlug}` : null;
  };

  const metaById = Object.fromEntries(pathCfg.sessionCards.map(c => [c.id, c]));
  const seqCards = activities.map(a => metaById[a.id] ?? null).filter(Boolean) as NonNullable<typeof metaById[string]>[];

  // isActivityDone checks both the phase1 ID and the standalone session page ID
  const isActivityDone = (activityId: string): boolean => {
    if (completedIds.has(activityId)) return true;
    const sessionId = ACTIVITY_TO_SESSION[activityId];
    if (sessionId && completedIds.has(sessionId)) return true;
    const onboardingIntroResetCounts = !homeData.isOnboardingComplete && wasFirstResetCompletedToday();
    if (activityId === "phase1_meditation" && onboardingIntroResetCounts) return true;
    if (activityId === "phase1_meditation" && (completedIds.has("phase1_agility") || completedIds.has("light-movement") || completedIds.has("phase1_strength"))) return true;
    if (activityId === "phase1_agility" && completedIds.has("phase1_strength")) return true;
    return false;
  };

  const pendingSeq = seqCards.filter(c => !isActivityDone(c.id));
  const doneSeq    = seqCards.filter(c =>  isActivityDone(c.id));
  const intelligenceDone = completedIds.has(INTELLIGENCE_ACTIVITY_ID);
  const vitalityDone = completedIds.has(VITALITY_ACTIVITY_ID);
  const allDone    = pendingSeq.length === 0 && seqCards.length > 0 && intelligenceDone && vitalityDone;
  const currentAid = pendingSeq[0]?.id ?? null;
  const todayIds   = new Set(activities.map(a => a.id));

  // When singleActivityId is set, restrict the flow engine to that one activity
  const flowActivities = singleActivityId
    ? activities.filter(a => a.id === singleActivityId)
    : activities;

  // Living stats
  const mp    = playerData?.mp    ?? 10;
  const maxMp = playerData?.maxMp ?? 10;
  const mpPct = maxMp > 0 ? Math.min(100, (mp / maxMp) * 100) : 100;

  const snap   = pathRec.progressSnapshot;
  const streak = snap.streak;
  const hasStreak = streak >= 3;

  // System card
  const seqAllDone = pendingSeq.length === 0 && seqCards.length > 0;
  const shouldLockDailyQuestSequence = !homeData.isOnboardingComplete && !allDone;
  const intelligencePending = seqAllDone && !intelligenceDone;
  const vitalityPending = seqAllDone && intelligenceDone && !vitalityDone;
  const currentDashLabel = DASH_CARDS.find(d => d.activityId === currentAid)?.label ?? null;
  const firstResetCompleted = wasFirstResetCompletedToday();
  const firstResetJustUnlockedMovement = !homeData.isOnboardingComplete && firstResetCompleted && currentAid === "phase1_agility";
  const totalMissionCount = seqCards.length + 2;
  const completedMissionCount = doneSeq.length + (intelligenceDone ? 1 : 0) + (vitalityDone ? 1 : 0);
  const activeMissionNumber = Math.min(totalMissionCount, completedMissionCount + 1);
  const missionStepLabel = `${allDone ? totalMissionCount : activeMissionNumber}/${totalMissionCount}`;
  const questProgressPct = totalMissionCount > 0
    ? Math.min(100, (completedMissionCount / totalMissionCount) * 100)
    : 0;
  const currentReward = intelligencePending
    ? PHASE1_XP.intelligence
    : vitalityPending
      ? PHASE1_XP.vitality
    : currentAid ? ACTIVITY_XP[currentAid] ?? 0 : 0;
  const rewardLabel = currentReward > 0 ? `+${currentReward} XP` : "";
  const compactRewardLabel = currentReward > 0 ? `+${currentReward} XP` : rewardLabel;
  const systemMission = allDone ? "System awakened"
    : vitalityPending ? "Next: Vitality"
    : intelligencePending ? "Next: Intel"
    : firstResetJustUnlockedMovement ? "Next: Agility"
    : currentDashLabel ? `Next: ${currentDashLabel}` : pathRec.headline;

  // Effects & handlers
  useEffect(() => { initLevelBaseline(lvl); }, [lvl]);
  useEffect(() => {
    const h = (e: Event) => recordSleepCheck((e as CustomEvent<{ sleptWell: boolean }>).detail.sleptWell);
    window.addEventListener("ascend:sleep-check", h);
    return () => window.removeEventListener("ascend:sleep-check", h);
  }, []);
  // Auto-start strength circuit when landing from agility completion
  useEffect(() => {
    if (!autoStartPending || activities.length === 0) return;
    window.history.replaceState(null, "", "/");
    setAutoStartPending(false);
    const strengthAvailableToday = activities.some((activity) => activity.id === "phase1_strength");
    if (strengthAvailableToday && !isActivityDone("phase1_strength")) {
      if (!isPhysicalCircuitProfileInitialized()) {
        setSingleActivityId("phase1_strength");
        setShowPhysicalSetup(true);
      } else {
        setSingleActivityId("phase1_strength");
        setFlowActive(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartPending, activities.length]);

  useEffect(() => {
    const needsOnboardingXpRepair = (playerData?.totalExp ?? 0) < PHASE1_DAILY_TARGET_XP;
    if (!allDone || (homeData.isOnboardingComplete && !needsOnboardingXpRepair) || onboardingCompleteRequestedRef.current) return;
    onboardingCompleteRequestedRef.current = true;
    fetch(`/api/player/${player.id}/onboarding-complete`, { method: "POST" })
      .then(() => Promise.allSettled([
        queryClient.refetchQueries({ queryKey: ["/api/player", player.id] }),
        queryClient.refetchQueries({ queryKey: ["home", player.id] }),
      ]))
      .catch(() => {
        onboardingCompleteRequestedRef.current = false;
      });
  }, [allDone, homeData.isOnboardingComplete, player.id, playerData?.totalExp, queryClient]);

  useEffect(() => {
    if (!showIntelligence || !intelReadStarted || intelSecondsLeft <= 0 || intelligenceDone) return;
    const timer = window.setInterval(() => {
      setIntelSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [showIntelligence, intelReadStarted, intelSecondsLeft, intelligenceDone]);

  useEffect(() => {
    if (!firstResetJustUnlockedMovement || flowActive || showIntelligence || showVitality) return;
    try {
      if (localStorage.getItem(FIRST_MISSION_GUIDE_SEEN_KEY) === "1") return;
      setShowMissionGuide(true);
    } catch {
      setShowMissionGuide(true);
    }
  }, [firstResetJustUnlockedMovement, flowActive, showIntelligence, showVitality]);

  const resetIntelReader = useCallback(() => {
    setIntelReadMode("recommended");
    setCustomIntelTopic("");
    setIntelReadStarted(false);
    setIntelReadingView(false);
    setIntelReadPage(0);
    setIntelSecondsLeft(INTELLIGENCE_READ_SECONDS);
  }, []);

  const closeIntelReader = useCallback(() => {
    setShowIntelligence(false);
    if (!intelReadStarted || intelligenceDone) resetIntelReader();
  }, [intelReadStarted, intelligenceDone, resetIntelReader]);

  const startIntelRead = useCallback(() => {
    setIntelReadStarted(true);
    setIntelReadingView(true);
    setIntelReadPage(0);
    setIntelSecondsLeft((s) => (s <= 0 ? INTELLIGENCE_READ_SECONDS : s));
  }, []);

  const handleFlowDone = useCallback((ids: string[]) => {
    // Close the flow engine immediately so the home content is visible right away
    // (avoids a blank/loading flash while queries refetch in the background).
    setFlowActive(false);
    setSingleActivityId(null);
    if (ids.length > 0) {
      markFlowCompleted(ids);
      if (ids.includes("phase1_meditation")) recordBreathingSession(true);
      localStorage.setItem("ascend_first_mission_done", "1");
      ids.forEach(id => markComplete(id));
    }
    // Refetch in background — home content is already visible with stale data.
    queryClient.invalidateQueries({ queryKey: ["/api/player", player.id] });
    queryClient.invalidateQueries({ queryKey: ["home", player.id] });
  }, [markComplete, queryClient, player.id]);

  const completeIntelligenceMission = useCallback(async () => {
    if (!intelReadStarted || intelSecondsLeft > 0 || intelSubmitting) return;
    if (!intelligenceDone) {
      setIntelSubmitting(true);
      try {
        const res = await fetch(`/api/player/${player.id}/complete-guided-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: INTELLIGENCE_ACTIVITY_ID,
            stat: "sense",
            durationMinutes: 1,
            category: "meditation",
            xpMultiplier: 1.0,
          }),
        });
        if (!res.ok) throw new Error("Intel sync failed");
        const data = await res.json();
        const earned = data?.xpEarned ?? PHASE1_XP.intelligence;
        addXP(earned, "intelligence");
        completeTask(INTELLIGENCE_ACTIVITY_ID);
        markComplete(INTELLIGENCE_ACTIVITY_ID);
        window.dispatchEvent(new CustomEvent("ascend:activity-completed", {
          detail: { activityId: INTELLIGENCE_ACTIVITY_ID },
        }));
      } catch {
        setIntelSubmitting(false);
        return;
      }
    }
    setIntelSubmitting(false);
    setShowIntelligence(false);
    resetIntelReader();
    queryClient.invalidateQueries({ queryKey: ["/api/player", player.id] });
    queryClient.invalidateQueries({ queryKey: ["home", player.id] });
  }, [intelReadStarted, intelSecondsLeft, intelSubmitting, intelligenceDone, markComplete, player.id, queryClient, resetIntelReader]);

  const completeVitalityMission = useCallback(async () => {
    if (vitalityDone || vitalitySubmitting) return;
    setVitalitySubmitting(true);
    const parsedHours = Number.parseFloat(sleepHours);
    const sleptWell = sleepQuality !== "rough";
    try {
      localStorage.setItem("ascend_last_sleep_log", JSON.stringify({
        date: todayDateKey(),
        hours: Number.isFinite(parsedHours) ? parsedHours : null,
        quality: sleepQuality,
      }));
      window.dispatchEvent(new CustomEvent("ascend:sleep-check", { detail: { sleptWell } }));
      const res = await fetch(`/api/player/${player.id}/complete-guided-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: VITALITY_ACTIVITY_ID,
          stat: "vitality",
          durationMinutes: 3,
          category: "vitality",
          xpMultiplier: 1.0,
        }),
      });
      if (!res.ok) throw new Error("Vitality sync failed");
      addXP(PHASE1_XP.vitality, "vitality");
      completeTask(VITALITY_ACTIVITY_ID);
      markComplete(VITALITY_ACTIVITY_ID);
      window.dispatchEvent(new CustomEvent("ascend:activity-completed", {
        detail: { activityId: VITALITY_ACTIVITY_ID },
      }));
      window.dispatchEvent(new CustomEvent("ascend:vitality-done"));
      setShowVitality(false);
      queryClient.invalidateQueries({ queryKey: ["/api/player", player.id] });
      queryClient.invalidateQueries({ queryKey: ["home", player.id] });
    } catch {
      setShowVitality(true);
    } finally {
      setVitalitySubmitting(false);
    }
  }, [markComplete, player.id, queryClient, sleepHours, sleepQuality, vitalityDone, vitalitySubmitting]);

  // Featured card tap — navigate to the correct standalone session,
  // or start an isolated single-activity flow for strength (no standalone page).
  const startActivity = (aid: string) => {
    const sessionRoute = activitySessionRoute(aid);
    if (sessionRoute) {
      navigate(sessionRoute);
    } else {
      if (aid === "phase1_strength" && !isPhysicalCircuitProfileInitialized()) {
        setSingleActivityId(aid);
        setShowPhysicalSetup(true);
        return;
      }
      setSingleActivityId(aid);
      setFlowActive(true);
    }
  };

  const handlePhysicalSetupComplete = (choices: PhysicalCircuitStartingChoices) => {
    initializePhysicalCircuitProfile(choices);
    setPhysicalProfileRevision((revision) => revision + 1);
    setShowPhysicalSetup(false);
    setSingleActivityId("phase1_strength");
    setFlowActive(true);
  };

  const handleFeaturedTap = () => {
    if (featuredCard?.id === "intelligence") {
      setShowIntelligence(true);
      return;
    }
    if (featuredCard?.id === "vitality") {
      navigate("/sectograph?vitality=1");
      return;
    }
    const aid = featuredCard?.activityId;
    if (!aid) return;
    startActivity(aid);
  };
  const handleAvatarPick = (icon: string) => { saveAvatarIcon(icon); setAvatarState(icon); setShowAvatar(false); };

  const dismissMissionGuide = () => {
    try { localStorage.setItem(FIRST_MISSION_GUIDE_SEEN_KEY, "1"); } catch { /* noop */ }
    setShowMissionGuide(false);
  };

  // Featured vs supporting — Intel becomes featured once the body sequence is done.
  const intelligenceCard = DASH_CARDS.find(d => d.id === "intelligence")!;
  const vitalityCard = DASH_CARDS.find(d => d.id === "vitality")!;
  const featuredCard = intelligencePending
    ? intelligenceCard
    : vitalityPending
      ? vitalityCard
    : DASH_CARDS.find(d => d.activityId === currentAid) ?? null;
  const intelReadCopy = buildIntelReadCopy(intelReadMode, recommendedIntelRead, customIntelTopic);
  const intelReadPages = useMemo(() => {
    const pages: string[][] = [];
    for (let i = 0; i < intelReadCopy.paragraphs.length; i += 2) {
      pages.push(intelReadCopy.paragraphs.slice(i, i + 2));
    }
    return pages.length > 0 ? pages : [[]];
  }, [intelReadCopy.paragraphs]);
  const currentIntelReadPage = Math.min(intelReadPage, intelReadPages.length - 1);
  const visibleIntelParagraphs = intelReadPages[currentIntelReadPage] ?? [];

  // Resolve the click action for a supporting card
  const resolveAction = (dc: (typeof DASH_CARDS)[number]): () => void => {
    if (dc.id === "intelligence") return () => setShowIntelligence(true);
    if (dc.id === "vitality") return () => navigate("/sectograph?vitality=1");
    const sessionRoute = activitySessionRoute(dc.activityId);
    if (sessionRoute) return () => navigate(sessionRoute);
    // Strength: no standalone session — run isolated single-activity flow if pending
    if (dc.activityId === "phase1_strength") {
      const pendingStrength = todayIds.has("phase1_strength") && !isActivityDone("phase1_strength");
      return pendingStrength
        ? () => startActivity("phase1_strength")
        : () => navigate("/train");
    }
    return () => navigate(dc.fallbackRoute);
  };

  const calmCard = DASH_CARDS.find(d => d.id === "calm")!;
  const agilityCard = DASH_CARDS.find(d => d.id === "agility")!;
  const strengthCard = DASH_CARDS.find(d => d.id === "strength")!;
  const activeCommandId = featuredCard?.id ?? "calm";
  const commandItems = [
    {
      id: "calm",
      label: "Calm Mind",
      subtitle: "Breath",
      icon: Brain,
      color: "#58e39b",
      position: "top" as const,
      action: resolveAction(calmCard),
    },
    {
      id: "agility",
      label: "Agility",
      subtitle: "Movement",
      icon: Zap,
      color: "#34d399",
      position: "upperRight" as const,
      action: resolveAction(agilityCard),
    },
    {
      id: "strength",
      label: "Physical",
      subtitle: "Circuit",
      icon: Shield,
      color: "#f9735b",
      position: "lowerRight" as const,
      action: resolveAction(strengthCard),
    },
    {
      id: "intelligence",
      label: "Intel",
      subtitle: "Study",
      icon: BookOpen,
      color: "#38bdf8",
      position: "lowerLeft" as const,
      action: () => setShowIntelligence(true),
    },
    {
      id: "vitality",
      label: "Vitality",
      subtitle: "Recovery",
      icon: Heart,
      color: "#f59e0b",
      position: "upperLeft" as const,
      action: resolveAction(vitalityCard),
    },
  ];
  const positionClass: Record<(typeof commandItems)[number]["position"], string> = {
    top: "left-1/2 top-1 -translate-x-1/2",
    upperRight: "right-1 top-[28%] -translate-y-1/2",
    lowerRight: "right-[10%] bottom-7",
    lowerLeft: "bottom-7 left-[10%]",
    upperLeft: "left-1 top-[28%] -translate-y-1/2",
  };
  const nextActionTitle = allDone ? "Daily ritual complete" : featuredCard?.label ?? "Focus";
  const nextActionSubtitle = allDone
    ? "You cleared today's command cycle."
    : featuredCard?.sub ?? "You have the most to gain.";
  const nextActionColor = allDone ? "#58e39b" : featuredCard?.color ?? "#38bdf8";
  const startLabel = allDone ? "Complete" : "Start";

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SystemLayout>
      <CustomizePanel open={showCustomize} onClose={() => setShowCustomize(false)} />
      <AnimatePresence>
        {showPhysicalSetup && (
          <PhysicalCircuitSetupModal
            colors={colors}
            onComplete={handlePhysicalSetupComplete}
            onClose={() => {
              setShowPhysicalSetup(false);
              setSingleActivityId(null);
            }}
          />
        )}
        {flowActive && (
          <DailyFlowEngine activities={flowActivities} playerId={player.id}
            onComplete={handleFlowDone} onCancel={() => setFlowActive(false)}
            isOnboardingComplete={true} />
        )}
      </AnimatePresence>
      <AvatarPickerSheet
        open={showAvatar} current={avatarIcon} playerName={playerData?.name ?? ""}
        onPick={handleAvatarPick} onClose={() => setShowAvatar(false)}
        isIronSovereign={isIronSov} isNeonEmpress={isNeonEmp} colors={colors}
        fae={{ lavender: fae.lavender, lavenderDeep: fae.lavenderDeep, inkText: fae.ink }}
        pathColor={pathCfg.primaryColor}
      />
      <AnimatePresence>
        {showIntelligence && (
          <motion.div
            className="fixed inset-0 z-[10000] flex items-center justify-center px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: "rgba(2,6,18,0.82)", backdropFilter: "blur(18px)" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="w-full max-w-sm max-h-[calc(100dvh-28px)] rounded-3xl overflow-y-auto"
              style={{
                background: "linear-gradient(145deg, rgba(8,14,32,0.96), rgba(4,9,24,0.98))",
                border: "1px solid rgba(56,189,248,0.32)",
                boxShadow: "0 24px 70px rgba(0,0,0,0.55), 0 0 42px rgba(56,189,248,0.18)",
              }}
              data-testid="intelligence-quest-modal"
            >
              <div className="relative px-5 pt-5 pb-4">
                <button
                  type="button"
                  onClick={closeIntelReader}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(226,232,240,0.72)" }}
                  aria-label="Close Daily Insight"
                  data-testid="button-close-intelligence"
                >
                  <X size={16} />
                </button>
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{
                    background: "rgba(56,189,248,0.14)",
                    border: "1px solid rgba(56,189,248,0.32)",
                    color: "#38bdf8",
                    boxShadow: "0 0 22px rgba(56,189,248,0.20)",
                  }}
                >
                  <BookOpen size={19} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "#38bdf8" }}>
                  Intel · 1 min
                </p>
                <h2 className="mt-2 text-[21px] font-black leading-tight" style={{ color: "rgba(248,250,252,0.98)" }}>
                  {intelReadingView ? intelReadCopy.title : "Read one useful idea."}
                </h2>
                <p className="mt-1.5 text-[12px] leading-snug" style={{ color: "rgba(203,213,225,0.72)" }}>
                  {intelReadingView ? "Read until the timer ends. Then continue reading or complete the task." : "Choose a topic. Start the read. Finish with one useful idea."}
                </p>

                <div
                  className="mt-3 rounded-2xl px-4 py-2.5 text-center"
                  style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.16)" }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(125,211,252,0.70)" }}>
                    Reading timer
                  </p>
                  <p className="mt-1 text-[28px] font-black tabular-nums leading-none" style={{ color: "#e0f2fe" }}>
                    {formatReadTimer(intelSecondsLeft)}
                  </p>
                </div>

                {!intelReadingView ? (
                  <>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {([
                        ["recommended", "Recommended"],
                        ["custom", "Choose topic"],
                      ] as const).map(([mode, label]) => {
                        const active = intelReadMode === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => !intelReadStarted && setIntelReadMode(mode)}
                            disabled={intelReadStarted}
                            className="rounded-2xl px-3 py-2.5 text-[12px] font-bold disabled:opacity-70"
                            style={{
                              background: active ? "rgba(56,189,248,0.18)" : "rgba(255,255,255,0.045)",
                              border: `1px solid ${active ? "rgba(56,189,248,0.42)" : "rgba(255,255,255,0.08)"}`,
                              color: active ? "#7dd3fc" : "rgba(226,232,240,0.74)",
                            }}
                            data-testid={`button-intel-mode-${mode}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    <div
                      className="mt-3 rounded-2xl px-4 py-3"
                      style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {intelReadMode === "recommended" ? (
                        <>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "#38bdf8" }}>
                            Recommended read
                          </p>
                          <h3 className="mt-1.5 text-[15px] font-black leading-tight" style={{ color: "rgba(248,250,252,0.95)" }}>
                            {recommendedIntelRead.title}
                          </h3>
                          <p className="mt-1 text-[11px] font-semibold leading-snug" style={{ color: "rgba(226,232,240,0.86)" }}>
                            {recommendedIntelRead.topic}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "#38bdf8" }}>
                            Your read
                          </p>
                          <input
                            value={customIntelTopic}
                            onChange={(e) => setCustomIntelTopic(e.target.value)}
                            disabled={intelReadStarted}
                            placeholder="Example: discipline, confidence, focus"
                            className="mt-2 w-full rounded-xl px-3 py-2.5 text-[13px] outline-none disabled:opacity-80"
                            style={{
                              background: "rgba(2,6,18,0.42)",
                              border: "1px solid rgba(148,163,184,0.18)",
                              color: "rgba(248,250,252,0.94)",
                            }}
                            data-testid="input-custom-intel-topic"
                          />
                          <p className="mt-1.5 text-[11px] leading-snug" style={{ color: "rgba(203,213,225,0.64)" }}>
                            Read anything useful on this topic until the timer ends.
                          </p>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div
                    className="mt-5 rounded-2xl px-4 py-4"
                    style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}
                    data-testid="intel-reading-screen"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "#38bdf8" }}>
                      {intelReadCopy.eyebrow}
                    </p>
                    <div className="mt-3 space-y-3">
                      {visibleIntelParagraphs.map((paragraph) => (
                        <p key={paragraph} className="text-[14px] leading-relaxed" style={{ color: "rgba(226,232,240,0.88)" }}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    {intelReadPages.length > 1 && (
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setIntelReadPage((p) => Math.max(0, p - 1))}
                          disabled={currentIntelReadPage === 0}
                          className="flex min-h-[38px] flex-1 items-center justify-center gap-1 rounded-xl text-[12px] font-bold disabled:opacity-40"
                          style={{ background: "rgba(255,255,255,0.055)", color: "rgba(226,232,240,0.78)", border: "1px solid rgba(255,255,255,0.08)" }}
                          data-testid="button-intel-prev-page"
                        >
                          <ChevronLeft size={15} />
                          Previous
                        </button>
                        <span className="min-w-[46px] text-center text-[11px] font-bold" style={{ color: "rgba(125,211,252,0.72)" }}>
                          {currentIntelReadPage + 1}/{intelReadPages.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIntelReadPage((p) => Math.min(intelReadPages.length - 1, p + 1))}
                          disabled={currentIntelReadPage >= intelReadPages.length - 1}
                          className="flex min-h-[38px] flex-1 items-center justify-center gap-1 rounded-xl text-[12px] font-bold disabled:opacity-40"
                          style={{ background: "rgba(56,189,248,0.12)", color: "#7dd3fc", border: "1px solid rgba(56,189,248,0.22)" }}
                          data-testid="button-intel-next-page"
                        >
                          Next
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!intelReadStarted ? (
                  <button
                    type="button"
                    onClick={startIntelRead}
                    className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-bold"
                    style={{
                      background: "linear-gradient(90deg, #2563eb, #38bdf8, #7c3aed)",
                      color: "#fff",
                      boxShadow: "0 10px 30px rgba(56,189,248,0.24)",
                    }}
                    data-testid="button-start-intel-read"
                  >
                    Start read
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <div
                    className="sticky bottom-0 -mx-5 mt-5 grid gap-2 px-5 pb-4 pt-3"
                    style={{ background: "linear-gradient(180deg, rgba(4,9,24,0.72), rgba(4,9,24,0.99) 32%, rgba(4,9,24,1))" }}
                  >
                    <button
                      type="button"
                      onClick={completeIntelligenceMission}
                      disabled={intelligenceDone || intelSecondsLeft > 0 || intelSubmitting}
                      className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-bold disabled:opacity-60"
                      style={{
                        background: intelSecondsLeft <= 0 ? "linear-gradient(90deg, #2563eb, #38bdf8, #7c3aed)" : "rgba(148,163,184,0.14)",
                        color: "#fff",
                        boxShadow: intelSecondsLeft <= 0 ? "0 10px 30px rgba(56,189,248,0.24)" : "none",
                      }}
                      data-testid="button-complete-intelligence"
                    >
                      {intelligenceDone ? "Insight complete" : intelSubmitting ? "Saving..." : intelSecondsLeft > 0 ? "Reading..." : `Complete task · +${PHASE1_XP.intelligence} XP`}
                      <ArrowRight size={18} />
                    </button>
                    {intelSecondsLeft <= 0 && !intelligenceDone && (
                      <button
                        type="button"
                        onClick={() => setIntelSecondsLeft(60)}
                        className="min-h-[42px] rounded-2xl text-[13px] font-bold"
                        style={{ background: "rgba(255,255,255,0.055)", color: "rgba(226,232,240,0.74)", border: "1px solid rgba(255,255,255,0.08)" }}
                        data-testid="button-continue-intel-reading"
                      >
                        Continue reading
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showVitality && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: "rgba(2,6,18,0.82)", backdropFilter: "blur(18px)" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="w-full max-w-sm rounded-3xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg, rgba(24,15,8,0.96), rgba(8,12,24,0.98))",
                border: "1px solid rgba(245,158,11,0.32)",
                boxShadow: "0 24px 70px rgba(0,0,0,0.55), 0 0 42px rgba(245,158,11,0.16)",
              }}
              data-testid="vitality-quest-modal"
            >
              <div className="relative px-6 pt-6 pb-5">
                <button
                  type="button"
                  onClick={() => setShowVitality(false)}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(226,232,240,0.72)" }}
                  aria-label="Close Vitality"
                  data-testid="button-close-vitality"
                >
                  <X size={16} />
                </button>
                <div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    background: "rgba(245,158,11,0.13)",
                    border: "1px solid rgba(245,158,11,0.32)",
                    color: "#f59e0b",
                    boxShadow: "0 0 22px rgba(245,158,11,0.18)",
                  }}
                >
                  <Moon size={22} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "#f59e0b" }}>
                  Vitality · Sleep Log
                </p>
                <h2 className="mt-2 text-[24px] font-black leading-tight" style={{ color: "rgba(248,250,252,0.98)" }}>
                  Log your recovery.
                </h2>
                <p className="mt-2 text-[13px] leading-snug" style={{ color: "rgba(203,213,225,0.72)" }}>
                  Sleep powers HP, energy, and tomorrow's performance.
                </p>

                <div className="mt-5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(251,191,36,0.78)" }}>
                    Hours slept
                  </label>
                  <input
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    inputMode="decimal"
                    className="mt-2 w-full rounded-2xl px-4 py-3 text-[20px] font-black tabular-nums outline-none"
                    style={{
                      background: "rgba(255,255,255,0.055)",
                      border: "1px solid rgba(245,158,11,0.18)",
                      color: "rgba(248,250,252,0.96)",
                    }}
                    data-testid="input-sleep-hours"
                  />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {([
                    ["great", "Great"],
                    ["ok", "Okay"],
                    ["rough", "Rough"],
                  ] as const).map(([quality, label]) => {
                    const active = sleepQuality === quality;
                    return (
                      <button
                        key={quality}
                        type="button"
                        onClick={() => setSleepQuality(quality)}
                        className="rounded-2xl px-2 py-3 text-[12px] font-bold"
                        style={{
                          background: active ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.045)",
                          border: `1px solid ${active ? "rgba(245,158,11,0.42)" : "rgba(255,255,255,0.08)"}`,
                          color: active ? "#fcd34d" : "rgba(226,232,240,0.74)",
                        }}
                        data-testid={`button-sleep-quality-${quality}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={completeVitalityMission}
                  disabled={vitalitySubmitting}
                  className="mt-5 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-bold disabled:opacity-60"
                  style={{
                    background: "linear-gradient(90deg, #d97706, #f59e0b, #7c3aed)",
                    color: "#fff",
                    boxShadow: "0 10px 30px rgba(245,158,11,0.22)",
                  }}
                  data-testid="button-complete-vitality"
                >
                  {vitalitySubmitting ? "Saving..." : `Log sleep · +${PHASE1_XP.vitality} XP`}
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showMissionGuide && featuredCard && (
          <motion.div
            className="fixed inset-0 z-[60] px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: "rgba(2,6,18,0.72)", backdropFilter: "blur(8px)" }}
            data-testid="first-mission-guide"
          >
            <div className="absolute inset-x-5 top-[13vh] mx-auto max-w-sm rounded-3xl px-5 py-5 text-center"
              style={{
                background: "linear-gradient(145deg, rgba(8,14,32,0.96), rgba(4,9,24,0.98))",
                border: `1px solid ${primary}55`,
                boxShadow: `0 18px 60px rgba(0,0,0,0.52), 0 0 34px ${primary}20`,
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: primary }}>
                Next Mission
              </p>
              <h2 className="mt-2 text-[22px] font-black leading-tight" style={{ color: "rgba(248,250,252,0.98)" }}>
                Begin the highlighted task.
              </h2>
              <p className="mt-2 text-[13px] leading-snug" style={{ color: "rgba(203,213,225,0.72)" }}>
                Your main mission card is the next step. Tap it to continue your onboarding path.
              </p>
              <button
                type="button"
                onClick={dismissMissionGuide}
                className="mt-4 min-h-[44px] w-full rounded-2xl text-[14px] font-bold"
                style={{ background: `linear-gradient(90deg, #2563eb, ${primary}, #7c3aed)`, color: "#fff" }}
                data-testid="button-dismiss-first-mission-guide"
              >
                Got it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyframes */}
      <style>{`
        @keyframes streakRingPulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50%       { opacity: 0.90; transform: scale(1.06); }
        }
        @keyframes streakBarGlow {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1; }
        }
        @keyframes xpShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes buttonSweep {
          0%, 60%    { transform: translateX(-160%); opacity: 0; }
          65%        { opacity: 1; }
          82%        { transform: translateX(160%); opacity: 0.7; }
          88%, 100%  { transform: translateX(160%); opacity: 0; }
        }
        @keyframes cardGlossDrift {
          0%, 42%    { transform: translateX(-150%) rotate(14deg); opacity: 0; }
          52%        { opacity: 0.52; }
          72%        { transform: translateX(165%) rotate(14deg); opacity: 0; }
          100%       { transform: translateX(165%) rotate(14deg); opacity: 0; }
        }
      `}</style>

      {/* ── Mission Command ── fixed height = viewport minus top-bar + bottom-nav */}
      <div className="flex flex-col px-2 max-w-md mx-auto w-full" style={{ height: "calc(100dvh - 9rem)" }} data-testid="day6-home">
        <AutoSwitchBanner navigate={navigate} colors={colors} primary={primary} />

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="relative flex flex-col flex-1 min-h-0 overflow-hidden"
          style={{
            borderRadius: "22px",
            background: "radial-gradient(ellipse at 50% 0%, rgba(12,20,58,0.99) 0%, rgba(4,6,18,1) 55%, rgba(2,3,10,1) 100%)",
            border: "1.5px solid rgba(185,142,48,0.70)",
            boxShadow: "0 0 0 1px rgba(185,142,48,0.12), 0 6px 60px rgba(0,0,0,0.92), inset 0 1px 0 rgba(255,255,255,0.07)",
            color: "#f0e8d8",
          }}
          data-testid="mission-command-home"
        >
          {/* Ambient top-center blue radiance */}
          <div className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% -5%, rgba(40,80,220,0.10) 0%, transparent 55%)" }} />
          {/* Gold top edge line */}
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(220,175,65,0.50), transparent)" }} />

          {/* ── HEADER ── */}
          <div className="relative z-10 flex items-center justify-between px-4 pt-3">
            <button type="button" onClick={() => setShowCustomize(true)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full active:scale-90 transition-transform"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(185,142,48,0.35)", color: "#c4a245" }}
              aria-label="Customize">
              <ChevronLeft size={17} />
            </button>
            <p className="font-display text-[13px] font-black uppercase tracking-[0.22em] whitespace-nowrap"
              style={{ color: "#e8c860", textShadow: "0 0 24px rgba(232,200,96,0.45), 0 1px 0 rgba(0,0,0,0.60)" }}>
              Mission Command
            </p>
            <button type="button" onClick={() => setShowAvatar(true)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full active:scale-90 transition-transform"
              style={{ background: "rgba(185,142,48,0.10)", border: "1px solid rgba(185,142,48,0.45)", color: "#e8c860" }}
              aria-label="Hero">
              <Zap size={15} style={{ filter: "drop-shadow(0 0 5px rgba(232,200,96,0.70))" }} />
            </button>
          </div>

          {/* ── DAILY PROGRESS ── */}
          <div className="relative z-10 px-4 pt-2">
            <p className="mb-1.5 text-center text-[9px] font-bold uppercase tracking-[0.32em]"
              style={{ color: "rgba(220,175,65,0.52)" }}>Daily Progress</p>
            <div className="flex items-center gap-2">
              {/* Segment track */}
              <div className="flex flex-1 items-center gap-[3px] rounded-[6px] px-1 py-1"
                style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(185,142,48,0.20)" }}>
                {Array.from({ length: Math.max(totalMissionCount, 4) }).slice(0, 4).map((_, i) => {
                  const filled = i < Math.min(completedMissionCount, 4);
                  const current = i === Math.min(completedMissionCount, 3) && !allDone;
                  return (
                    <div key={i} className="flex-1 h-[10px] rounded-[3px]"
                      style={{
                        background: filled
                          ? "linear-gradient(90deg, #1a5ef5 0%, #5aaeff 100%)"
                          : current ? "rgba(185,142,48,0.28)" : "rgba(255,255,255,0.06)",
                        boxShadow: filled ? "0 0 8px rgba(26,100,245,0.65), 0 0 2px rgba(90,174,255,0.90)" : "none",
                      }} />
                  );
                })}
              </div>
              {/* Trophy */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px]"
                style={{ background: "rgba(185,142,48,0.12)", border: "1.5px solid rgba(185,142,48,0.55)", boxShadow: "0 0 8px rgba(185,142,48,0.18)" }}>
                {allDone
                  ? <CheckCircle2 size={15} style={{ color: "#22c55e" }} />
                  : <Trophy size={15} style={{ color: "#e8c860", filter: "drop-shadow(0 0 4px rgba(232,200,96,0.60))" }} />}
              </div>
            </div>
          </div>

          {/* ── 4-QUADRANT COMMAND WHEEL ── */}
          <div className="relative z-10 flex-1 min-h-0 flex items-center justify-center px-3 py-2">
            {/* Square wheel — capped by both card width and available height */}
            <div className="relative"
              style={{ width: "min(100%, 320px, calc(100dvh - 23rem))", height: "min(100%, 320px, calc(100dvh - 23rem))" }}>

              {/* Outer ambient glow ring */}
              <div className="absolute pointer-events-none rounded-full"
                style={{ inset: "-10px", background: "radial-gradient(circle, transparent 48%, rgba(185,142,48,0.15) 100%)", filter: "blur(10px)" }} />

              {/* Bronze metallic border */}
              <div className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  border: "3.5px solid rgba(195,152,52,0.92)",
                  boxShadow: "0 0 0 1px rgba(195,152,52,0.18), 0 0 28px rgba(195,152,52,0.38), 0 0 56px rgba(0,0,0,0.75), inset 0 0 22px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.13), inset 0 -1px 0 rgba(0,0,0,0.50)",
                }} />

              {/* SVG wheel — 5 mathematically exact 72° wedge arcs + gold dividers
                  Boundary points at r=50, center=(50,50), from-top clockwise:
                    B0 (-36° / 324°): (20.61, 9.55)
                    B1 (  36°)      : (79.39, 9.55)
                    B2 ( 108°)      : (97.55, 65.45)
                    B3 ( 180°)      : (50,    100  )
                    B4 ( 252°)      : ( 2.45, 65.45)
              */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                <defs>
                  {/* Per-slice radial gradients — origin at icon position so colour fades toward center */}
                  <radialGradient id="wg-focus"   cx="50%" cy="5%"  r="75%"><stop offset="0%" stopColor="#0d2ea0"/><stop offset="100%" stopColor="#030820"/></radialGradient>
                  <radialGradient id="wg-train"   cx="88%" cy="32%" r="75%"><stop offset="0%" stopColor="#8a0c0c"/><stop offset="100%" stopColor="#180202"/></radialGradient>
                  <radialGradient id="wg-restore" cx="75%" cy="88%" r="75%"><stop offset="0%" stopColor="#0a4e58"/><stop offset="100%" stopColor="#020e12"/></radialGradient>
                  <radialGradient id="wg-calm"    cx="25%" cy="88%" r="75%"><stop offset="0%" stopColor="#0c1260"/><stop offset="100%" stopColor="#02020e"/></radialGradient>
                  <radialGradient id="wg-move"    cx="12%" cy="32%" r="75%"><stop offset="0%" stopColor="#2e0a70"/><stop offset="100%" stopColor="#06020e"/></radialGradient>
                  <clipPath id="wg-circle"><circle cx="50" cy="50" r="50"/></clipPath>
                </defs>

                {/* Wedge fills — clipped to perfect circle */}
                <g clipPath="url(#wg-circle)">
                  {/* FOCUS  — top        (-36° → 36°)  */}
                  <path d="M 50,50 L 20.61,9.55 A 50,50 0 0,1 79.39,9.55 Z"  fill="url(#wg-focus)"   />
                  {/* TRAIN  — top-right  (36° → 108°)  */}
                  <path d="M 50,50 L 79.39,9.55 A 50,50 0 0,1 97.55,65.45 Z" fill="url(#wg-train)"   />
                  {/* RESTORE— bot-right  (108° → 180°) */}
                  <path d="M 50,50 L 97.55,65.45 A 50,50 0 0,1 50,100 Z"     fill="url(#wg-restore)" />
                  {/* CALM   — bot-left   (180° → 252°) */}
                  <path d="M 50,50 L 50,100 A 50,50 0 0,1 2.45,65.45 Z"      fill="url(#wg-calm)"    />
                  {/* MOVE   — top-left   (252° → 324°) */}
                  <path d="M 50,50 L 2.45,65.45 A 50,50 0 0,1 20.61,9.55 Z"  fill="url(#wg-move)"    />
                </g>

                {/* Gold divider spokes — one per boundary */}
                {(["20.61,9.55","79.39,9.55","97.55,65.45","50,100","2.45,65.45"] as const).map((pt, i) => (
                  <line key={i} x1="50" y1="50" x2={pt.split(",")[0]} y2={pt.split(",")[1]}
                    stroke="rgba(218,172,62,0.90)" strokeWidth="0.55" />
                ))}
              </svg>

              {/* 5 slice buttons — midpoint of each arc at r=32, angles: 0°,72°,144°,216°,288° */}
              {([
                { id: "intelligence", label: "FOCUS",   Icon: Target,     color: "#5aadff", card: intelligenceCard, isDone: intelligenceDone,                   pos: { top: "18%",   left: "50%"   } },
                { id: "strength",     label: "TRAIN",   Icon: Swords,      color: "#ff5555", card: strengthCard,    isDone: isActivityDone("phase1_strength"),   pos: { top: "40.1%", left: "80.4%" } },
                { id: "vitality",     label: "RESTORE", Icon: FlaskConical,color: "#22d4e8", card: vitalityCard,    isDone: vitalityDone,                        pos: { top: "75.9%", left: "68.8%" } },
                { id: "calm",         label: "CALM",    Icon: Leaf,         color: "#4ad880", card: calmCard,        isDone: isActivityDone("phase1_meditation"), pos: { top: "75.9%", left: "31.2%" } },
                { id: "agility",      label: "MOVE",    Icon: Zap,          color: "#b06fff", card: agilityCard,     isDone: isActivityDone("phase1_agility"),    pos: { top: "40.1%", left: "19.6%" } },
              ] as const).map(({ id, label, Icon, color, card, isDone, pos }) => {
                const isActive = !allDone && (activeCommandId === id || (id === "intelligence" && activeCommandId === "intelligence"));
                const onTap = id === "intelligence" ? () => setShowIntelligence(true) : resolveAction(card);
                return (
                  <motion.button key={id} type="button" onClick={onTap}
                    whileTap={{ scale: 0.86 }}
                    className="absolute flex flex-col items-center gap-1 active:opacity-90"
                    style={{ top: pos.top, left: pos.left, transform: "translate(-50%, -50%)" }}
                    data-testid={`command-${id}`}>
                    {/* Icon circle */}
                    <div className="flex items-center justify-center rounded-full"
                      style={{
                        width: 50, height: 50,
                        background: isDone
                          ? "rgba(34,197,94,0.18)"
                          : `radial-gradient(circle at 34% 28%, ${color}22 0%, rgba(2,4,16,0.92) 68%)`,
                        border: `1.5px solid ${isDone ? "rgba(34,197,94,0.75)" : color + (isActive ? "bb" : "55")}`,
                        boxShadow: isDone
                          ? "0 0 16px rgba(34,197,94,0.40)"
                          : isActive
                            ? `0 0 22px ${color}65, 0 0 44px ${color}20, inset 0 0 10px rgba(0,0,0,0.42)`
                            : `0 0 12px ${color}22, inset 0 0 10px rgba(0,0,0,0.42)`,
                      }}>
                      {isDone
                        ? <CheckCircle2 size={22} style={{ color: "#22c55e" }} />
                        : <Icon size={22} style={{
                            color: color,
                            filter: `drop-shadow(0 0 ${isActive ? "9px" : "5px"} ${color}${isActive ? "ee" : "88"})`,
                          }} />}
                    </div>
                    {/* Label */}
                    <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] select-none"
                      style={{
                        color: isDone ? "#4ade80" : color,
                        textShadow: `0 0 10px ${color}${isActive ? "aa" : "55"}`,
                      }}>
                      {label}
                    </span>
                  </motion.button>
                );
              })}

              {/* Center compass medallion */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full"
                style={{
                  width: 60, height: 60,
                  background: "radial-gradient(circle at 38% 32%, rgba(205,162,55,0.32) 0%, rgba(4,6,22,0.97) 65%)",
                  border: "2px solid rgba(195,152,52,0.90)",
                  boxShadow: "0 0 0 1px rgba(195,152,52,0.18), 0 0 22px rgba(195,152,52,0.28), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.50)",
                }}>
                <Compass size={28} style={{ color: "#e8c860", filter: "drop-shadow(0 0 8px rgba(232,200,96,0.60))" }} />
              </div>
            </div>
          </div>

          {/* ── NEXT BEST ACTION ── */}
          <div className="relative z-10 mx-3 rounded-2xl overflow-hidden"
            style={{ background: "rgba(4,8,26,0.82)", border: "1px solid rgba(185,142,48,0.30)" }}>
            <p className="pt-2 pb-0 text-center text-[9px] font-bold uppercase tracking-[0.32em]"
              style={{ color: "rgba(220,175,65,0.52)" }}>Next Best Action</p>
            <button type="button"
              onClick={allDone ? undefined : handleFeaturedTap}
              className="flex w-full items-center gap-3 px-3 py-2 text-left"
              data-testid="next-best-action">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ background: `${nextActionColor}14`, border: `1.5px solid ${nextActionColor}55`, boxShadow: `0 0 10px ${nextActionColor}22` }}>
                {allDone
                  ? <CheckCircle2 size={18} style={{ color: "#22c55e" }} />
                  : <Brain size={18} style={{ color: nextActionColor, filter: `drop-shadow(0 0 5px ${nextActionColor}99)` }} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold leading-snug" style={{ color: "#ede5d8" }}>
                  {allDone ? nextActionTitle : (featuredCard?.label ?? "Calm Mind")}
                </p>
                <p className="truncate text-[11px] mt-0.5" style={{ color: "rgba(237,229,216,0.48)" }}>
                  {allDone ? nextActionSubtitle : (featuredCard?.sub ?? "Breathing Reset")}
                </p>
              </div>
              {!allDone && <ChevronRight size={16} style={{ color: "#c4a245" }} />}
            </button>
          </div>

          {/* ── START BUTTON ── */}
          <motion.button type="button"
            onClick={allDone ? undefined : handleFeaturedTap}
            whileTap={!allDone ? { scale: 0.980 } : undefined}
            className="relative z-10 mx-3 mt-2 mb-3 flex items-center justify-center overflow-hidden uppercase"
            style={{
              minHeight: "52px",
              borderRadius: "14px",
              background: allDone
                ? "linear-gradient(135deg, rgba(22,130,60,0.82) 0%, rgba(48,190,100,0.88) 100%)"
                : "linear-gradient(135deg, rgba(10,38,140,1) 0%, rgba(18,88,210,1) 50%, rgba(8,34,128,1) 100%)",
              border: "1px solid rgba(185,142,48,0.58)",
              color: "#ede5d8",
              /* Wide geometric futuristic font stack */
              fontFamily: "'Rajdhani', 'Orbitron', 'Bank Gothic', 'Bebas Neue', 'Impact', ui-sans-serif, system-ui",
              fontSize: "22px",
              fontWeight: 900,
              letterSpacing: "0.32em",
              boxShadow: allDone
                ? "0 6px 24px rgba(22,130,60,0.30)"
                : "0 6px 30px rgba(12,56,200,0.40), inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -1px 0 rgba(0,0,0,0.40)",
              textShadow: "0 0 20px rgba(140,180,255,0.60), 0 1px 6px rgba(0,0,0,0.80)",
            }}
            data-testid="button-start-command"
          >
            {/* Top shimmer line */}
            <span className="pointer-events-none absolute inset-x-8 top-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)" }} />
            {/* Sweep animation */}
            <span className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(90deg, transparent 18%, rgba(255,255,255,0.10) 50%, transparent 82%)", animation: "buttonSweep 6s ease-in-out 1s infinite" }} />
            {/* 4-point gold stars */}
            <span className="pointer-events-none absolute left-4 flex items-center justify-center" style={{ color: "#e8c860", fontSize: "16px", filter: "drop-shadow(0 0 5px rgba(232,200,96,0.80))", lineHeight: 1 }}>✦</span>
            <span className="pointer-events-none absolute right-4 flex items-center justify-center" style={{ color: "#e8c860", fontSize: "16px", filter: "drop-shadow(0 0 5px rgba(232,200,96,0.80))", lineHeight: 1 }}>✦</span>
            {startLabel}
          </motion.button>

        </motion.section>

        <div className="hidden" aria-hidden="true">

        {/* ── SYSTEM CARD ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06 }}
          className="rounded-2xl px-4 py-3 relative overflow-hidden"
          style={{
            background: panelBg,
            border: `1px solid ${panelBorder}`,
            boxShadow: panelShadow,
            backdropFilter: "blur(22px) saturate(1.18)",
          }}
          data-testid="system-message"
        >
          <div className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.045) 44%, transparent 100%)",
              opacity: glossOpacity,
            }} />
          <div className="absolute -top-14 -left-32 h-28 w-80 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent)",
              filter: "blur(12px)",
              animation: "cardGlossDrift 10s ease-in-out 0.8s infinite",
            }} />
          {/* Background icon decoration */}
          {DASH_CARDS.find(d => d.activityId === currentAid) && (() => {
            const Icon = DASH_CARDS.find(d => d.activityId === currentAid)!.icon;
            return (
              <div className="absolute top-2 right-3 pointer-events-none" style={{ opacity: 0.07 }}>
                <Icon size={44} style={{ color: primary }} />
              </div>
            );
          })()}
          <div className="relative z-10 flex items-center justify-between gap-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: primary }}>
              Daily Quest
            </span>
            <span className="text-[11px] font-mono tabular-nums" style={{ color: cardMutedCol }}>
              {completedMissionCount}/{totalMissionCount}
            </span>
          </div>
          <div
            className="relative z-10 h-[5px] rounded-full overflow-hidden mb-2"
            style={{ background: "rgba(255,255,255,0.06)" }}
            aria-hidden="true"
          >
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${questProgressPct}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              style={{ background: primary, boxShadow: `0 0 10px ${primary}66` }}
            />
          </div>
          <p className="relative z-10 text-[12px] font-semibold leading-none tracking-tight" style={{ color: isNeonEmp ? "rgba(245,247,255,0.95)" : textCol }}
            data-testid="path-recommendation-text">
            {systemMission}
          </p>
        </motion.div>

        {/* ── RITUAL QUEUE STRIP ───────────────────────────────────────── */}
        {activities.length > 0 && (() => {
          const dashById = Object.fromEntries(DASH_CARDS.map(dc => [dc.id, dc])) as Record<(typeof DASH_CARDS)[number]["id"], (typeof DASH_CARDS)[number]>;
          const QUEUE_DEFS = [
            { id: "phase1_meditation", label: "Sense",    dc: dashById.calm },
            { id: "phase1_agility",    label: "Agility",  dc: dashById.agility },
            { id: "phase1_strength",   label: "Strength", dc: dashById.strength },
            { id: INTELLIGENCE_ACTIVITY_ID, label: "Intel", dc: dashById.intelligence },
            { id: VITALITY_ACTIVITY_ID, label: "Vitality", dc: dashById.vitality },
          ] as const;
          const queueItems = QUEUE_DEFS.filter(q =>
            q.id === INTELLIGENCE_ACTIVITY_ID || q.id === VITALITY_ACTIVITY_ID ? true : activities.some(a => a.id === q.id)
          );
          if (queueItems.length < 2) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.09 }}
              className="grid grid-cols-5 gap-1.5"
              data-testid="ritual-queue-strip"
            >
              {queueItems.map((q) => {
                const { dc } = q;
                const done = q.id === INTELLIGENCE_ACTIVITY_ID
                  ? intelligenceDone
                  : q.id === VITALITY_ACTIVITY_ID
                    ? vitalityDone
                    : isActivityDone(q.id);
                const seqAllDone = pendingSeq.length === 0 && seqCards.length > 0;
                const isActive = q.id === INTELLIGENCE_ACTIVITY_ID
                  ? intelligencePending
                  : q.id === VITALITY_ACTIVITY_ID
                    ? vitalityPending
                    : (q.id === currentAid && !allDone);
                const isUnlocked = !shouldLockDailyQuestSequence || done || isActive;
                const nodeColor = done ? "#22c55e" : isActive || isUnlocked ? dc.color : colors.textMuted;
                const action = q.id === INTELLIGENCE_ACTIVITY_ID
                  ? () => setShowIntelligence(true)
                  : q.id === VITALITY_ACTIVITY_ID
                    ? () => navigate("/sectograph?vitality=1")
                    : resolveAction(dc);
                const isTappable = isUnlocked;
                return (
                  <motion.button
                    key={q.id}
                    type="button"
                    disabled={!isTappable}
                    onClick={isTappable ? action : undefined}
                    whileTap={isTappable ? { scale: 0.96 } : {}}
                    className="relative flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center disabled:cursor-default"
                    style={{
                      background: done
                        ? "rgba(34,197,94,0.09)"
                        : isActive ? `${dc.color}18`
                        : isUnlocked ? `${dc.color}0e`
                        : "rgba(255,255,255,0.035)",
                      border: `1px solid ${done ? "rgba(34,197,94,0.28)" : isActive ? `${dc.color}66` : isUnlocked ? `${dc.color}28` : "rgba(255,255,255,0.07)"}`,
                      boxShadow: isActive ? `0 0 0 3px ${dc.color}12, 0 0 18px ${dc.color}20` : "none",
                      opacity: done || isActive || isUnlocked ? 1 : 0.42,
                    }}
                    aria-label={`${dc.label}: ${dc.sub}`}
                  >
                    {done && (
                      <span
                        className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full"
                        style={{ background: "#22c55e", color: "#041008" }}
                      >
                        <CheckCircle2 size={11} />
                      </span>
                    )}
                    <dc.icon size={17} style={{ color: nodeColor }} />
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: nodeColor }}>
                      {q.label}
                    </span>
                    <span className="max-w-full truncate text-[7px] font-semibold leading-none" style={{ color: isUnlocked || done ? cardMutedCol : colors.textMuted, opacity: isUnlocked || done ? 0.76 : 0.35 }}>
                      {dc.sub}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          );
        })()}

        {/* ── ALL DONE ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {allDone && (
            <motion.div key="all-done"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.28 }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
              style={{
                background: "rgba(4,18,8,0.92)",
                boxShadow: "0 0 32px rgba(34,197,94,0.14), 0 4px 20px rgba(0,0,0,0.45)",
                backdropFilter: "blur(16px)",
              }}
              data-testid="text-flow-completed"
            >
              <CheckCircle2 size={22} style={{ color: "#22c55e", flexShrink: 0 }} />
              <div>
                <p className="text-[13px] font-bold" style={{ color: "#22c55e" }}>Daily ritual complete</p>
                <p className="text-[10px] mt-0.5" style={{ color: mutedCol }}>
                  Lv {lvl} · {xp.exp}/{xp.maxExp} XP · {totalMins} min today
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FEATURED MISSION CARD ─────────────────────────────────────── */}
        {!allDone && featuredCard && (() => {
          const dc    = featuredCard;
          const ctaText = intelligencePending
            ? `Complete insight · ${compactRewardLabel}`
            : vitalityPending
              ? `Log sleep · ${compactRewardLabel}`
            : currentAid === "phase1_strength"
              ? `Start circuit · ${compactRewardLabel}`
              : `Begin mission · ${compactRewardLabel}`;
          const barPct = dc.barType === "mp" ? mpPct
            : (() => { const sl = playerData?.statLevels?.[dc.statKey]; return sl ? Math.min(100, (sl.currentXP / sl.xpForNext) * 100) : 0; })();

          return (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12 }}
              className={showMissionGuide ? "relative z-[70]" : undefined}
            >
              <motion.div
                className="rounded-2xl"
                style={{
                  boxShadow: `0 8px 34px rgba(0,0,0,0.48), 0 0 30px ${dc.glow.replace("0.45","0.16")}`,
                }}
              >
                <motion.button
                  type="button"
                  onClick={handleFeaturedTap}
                  whileHover={{ scale: 1.006, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.982, transition: { duration: 0.12 } }}
                  className={`${CARD_BASE} gap-4 relative overflow-hidden`}
                  style={{
                    background: isNeonEmp
                      ? `linear-gradient(145deg, rgba(11,13,36,0.90) 0%, rgba(7,8,26,0.96) 58%, rgba(20,13,46,0.91) 100%)`
                      : `linear-gradient(140deg, rgba(6,7,22,0.98) 0%, rgba(10,6,28,0.97) 60%, rgba(6,8,24,0.98) 100%)`,
                    border: `1.5px solid ${dc.color}${isNeonEmp ? "66" : "3f"}`,
                    backdropFilter: "blur(22px) saturate(1.2)",
                    padding: "20px 18px 18px",
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.45)`,
                  }}
                  data-testid="mission-card-current"
                >
                  <div className="absolute inset-x-0 top-0 h-[46%] rounded-t-2xl pointer-events-none" style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.055) 48%, transparent 100%)",
                    opacity: isNeonEmp ? 0.78 : 0.50,
                  }} />
                  <div className="absolute -top-12 -left-28 h-28 w-80 pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
                      filter: "blur(12px)",
                      animation: "cardGlossDrift 8.5s ease-in-out 1.2s infinite",
                    }} />
                  {/* Radial bloom centre glow */}
                  <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
                    background: `radial-gradient(ellipse at 72% 50%, ${dc.color}14 0%, transparent 60%)`,
                  }} />
                  {/* Top-edge reflection */}
                  <div className="absolute top-0 left-[10%] right-[10%] h-px pointer-events-none" style={{
                    background: `linear-gradient(90deg, transparent, ${dc.color}40, transparent)`,
                  }} />
                  {/* Header */}
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        animate={{
                          boxShadow: [
                            `0 0 12px ${dc.glow.replace("0.45","0.20")}, inset 0 1px 0 ${dc.color}20`,
                            `0 0 28px ${dc.glow.replace("0.45","0.55")}, 0 0 50px ${dc.glow.replace("0.45","0.18")}, inset 0 1px 0 ${dc.color}30`,
                            `0 0 12px ${dc.glow.replace("0.45","0.20")}, inset 0 1px 0 ${dc.color}20`,
                          ],
                        }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                          background: `radial-gradient(circle at 35% 35%, ${dc.color}28 0%, ${dc.color}0c 100%)`,
                          border: `1px solid ${dc.color}38`,
                        }}
                      >
                        <dc.icon size={20} style={{ color: dc.color, filter: `drop-shadow(0 0 4px ${dc.color})` }} />
                      </motion.div>
                      <div>
                        <p className="text-[28px] font-black leading-none tracking-tight" style={{ color: cardTextCol }}>
                          {dc.label}
                        </p>
                        <p className="text-[14px] mt-1 leading-none" style={{ color: cardMutedCol }}>{dc.sub} · Step {missionStepLabel}</p>
                      </div>
                    </div>
                    <div
                      className="rounded-xl px-3 py-2 text-center shrink-0"
                      style={{ background: "rgba(34,197,94,0.13)", border: "1px solid rgba(34,197,94,0.28)" }}
                    >
                      <p className="text-[17px] font-black leading-none" style={{ color: "#4ade80" }}>{compactRewardLabel.replace(" XP", "")}</p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "#22c55e" }}>XP</p>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="relative">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[8px] tracking-wide" style={{ color: cardMutedCol }}>{dc.barLabel}</span>
                      <span className="text-[8px] font-mono tabular-nums" style={{ color: cardMutedCol }}>{Math.round(barPct)}%</span>
                    </div>
                    <div className="w-full h-[6px] rounded-full overflow-hidden" style={{ background: `${dc.color}12` }}>
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
                        style={{ background: dc.color, boxShadow: `0 0 8px ${dc.glow.replace("0.45","0.50")}` }} />
                    </div>
                  </div>

                  {/* Begin button */}
                  <div
                    className="relative flex min-h-[54px] items-center justify-center gap-2 w-full rounded-2xl font-bold text-[15px] tracking-wide overflow-hidden"
                    style={{
                      background: `linear-gradient(90deg, #4f46e5ee, ${dc.color}dd, #7c3aedcc)`,
                      color: "#fff",
                      boxShadow: `0 3px 20px ${dc.glow.replace("0.45","0.40")}, 0 0 40px ${dc.glow.replace("0.45","0.16")}, inset 0 1px 0 rgba(255,255,255,0.18)`,
                      textShadow: "0 1px 4px rgba(0,0,0,0.40)",
                    }}
                  >
                    <div className="absolute top-0 left-0 h-full w-[55%] pointer-events-none"
                      style={{
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
                        animation: "buttonSweep 6s ease-in-out 1.5s infinite",
                        willChange: "transform, opacity",
                      }} />
                    {ctaText} <ArrowRight size={18} />
                  </div>
                </motion.button>
              </motion.div>
            </motion.div>
          );
        })()}

        </div>
      </div>
    </SystemLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// XP bars
// ─────────────────────────────────────────────────────────────────────────────

function SegBar({ fromPct = 0, pct, fill, glow, segs = 20 }: {
  fromPct?: number; pct: number; fill: string; glow: string; segs?: number;
}) {
  const target = Math.round((Math.max(0, Math.min(100, pct))    / 100) * segs);
  const from   = Math.round((Math.max(0, Math.min(100, fromPct))/ 100) * segs);
  const newN   = Math.max(0, target - from);
  return (
    <div className="w-full flex gap-[2px] h-1.5 items-center" data-testid="xp-bar-track">
      {Array.from({ length: segs }).map((_, i) => {
        const on = i < target; const isN = i >= from && i < target;
        return (
          <motion.div key={i} className="flex-1 h-full rounded-[2px]"
            animate={{ backgroundColor: on ? fill : "rgba(255,255,255,0.07)", boxShadow: on ? `0 0 4px ${glow}` : "none" }}
            transition={{ duration: 0.10, ease: "easeOut", delay: isN ? ((i - from) / Math.max(newN, 1)) * 0.8 : 0 }}
            data-testid={i === 0 ? "xp-bar-fill" : undefined} />
        );
      })}
    </div>
  );
}

function PastelBar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.30)" }} data-testid="xp-bar-track">
      <motion.div className="h-full rounded-full"
        initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ background: "linear-gradient(90deg,#f7e5b6,#f4a6c8,#b59cf2)", boxShadow: "0 0 6px rgba(180,150,240,0.5)" }}
        data-testid="xp-bar-fill" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AutoSwitchBanner
// ─────────────────────────────────────────────────────────────────────────────

function AutoSwitchBanner({ navigate, colors, primary }: {
  navigate: (to: string) => void; colors: { textMuted: string }; primary: string;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(shouldPromptAutoSwitch());
    const h = () => setShow(shouldPromptAutoSwitch());
    window.addEventListener("ascend:vitality-flow-changed", h);
    window.addEventListener("ascend:sleep-mode-changed", h);
    return () => { window.removeEventListener("ascend:vitality-flow-changed", h); window.removeEventListener("ascend:sleep-mode-changed", h); };
  }, []);
  if (!show) return null;
  const accept  = () => { setSleepMode("adaptive"); setShow(false); navigate("/sleep-settings"); };
  const dismiss = () => { dismissAutoSwitchPrompt(); setShow(false); };
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-3.5 rounded-2xl"
      style={{ background: "rgba(6,8,20,0.92)", borderLeft: "3px solid rgba(251,191,36,0.60)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", backdropFilter: "blur(16px)" }}
      data-testid="auto-switch-banner">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(251,191,36,0.12)" }}>
        <Sparkles size={14} style={{ color: "#fbbf24" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold mb-0.5" style={{ color: "#fde68a" }}>You're doing great</p>
        <p className="text-[10px] leading-snug" style={{ color: colors.textMuted }}>
          Switch to Adaptive Mode for a lighter, personalised flow.
        </p>
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={accept} data-testid="button-accept-adaptive"
            className="text-[10px] font-bold px-3 py-1 rounded-lg"
            style={{ background: "#fbbf24", color: "#1a1208" }}>Switch</button>
          <button type="button" onClick={dismiss} data-testid="button-dismiss-adaptive"
            className="text-[10px] px-2 py-1 rounded-lg" style={{ color: colors.textMuted }}>Not now</button>
        </div>
      </div>
      <button type="button" onClick={dismiss} className="shrink-0 p-1" style={{ color: colors.textMuted }}>
        <X size={13} />
      </button>
    </motion.div>
  );
}
