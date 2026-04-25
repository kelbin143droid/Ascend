import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SystemLayout } from "@/components/game/SystemLayout";
import { Sectograph, DEFAULT_SEGMENTS, detectFreeWindows, type ScheduleBlock, type FreeWindow, type BehavioralAnchor, type ActiveFocusBlock, type RhythmWindowVisual, type SuggestedPlacement } from "@/components/game/Sectograph";
import { CurrentMissionCard } from "@/components/game/CurrentMissionCard";
import { useTheme } from "@/context/ThemeContext";
import { useGame } from "@/context/GameContext";
import { useRoles } from "@/context/RolesContext";
import { useWeeklyGoals } from "@/context/WeeklyGoalsContext";
import { apiRequest } from "@/lib/queryClient";
import {
  scheduleTaskNotification,
  requestNotificationPermissions,
  isNativePlatform,
  cancelTaskNotification,
} from "@/lib/notificationService";
import { getNightPlan } from "@/lib/sleepModeStore";
import { useToast } from "@/hooks/use-toast";
import type { Quadrant } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Bell,
  Trash2,
  Check,
  CalendarDays,
  Sparkles,
  Eye,
  EyeOff,
  Play,
  Pause,
  X,
  Target,
  Activity,
  Zap,
  Moon,
  Briefcase,
  Coffee,
  Book,
  Gamepad2,
  Settings2,
  Brain,
  CheckCircle2,
  Palette,
  ArrowRight,
  AlarmClock,
  Star,
  Heart,
  Flame,
  Music,
  Camera,
  Dumbbell,
  Smile,
  Bookmark,
  Sun,
  Headphones,
  PenTool,
  Leaf,
  Utensils,
} from "lucide-react";
import type { CalendarEvent } from "@shared/schema";
import { getSavedMeal, logSavedMealToToday } from "@/lib/savedMealsStore";
import {
  isSectographTutorialDone,
  markSectographTutorialDone,
  getSectographTutorialStep,
  setSectographTutorialStep,
  isDayFiveSleepScheduled,
  isDayFiveFlowScheduled,
  markDayFiveSleepScheduled,
  markDayFiveFlowScheduled,
} from "@/lib/userState";

type ViewTab = "sectograph" | "calendar" | "plan";

const QUADRANT_OPTIONS: { value: Quadrant; label: string; color: string }[] = [
  { value: "Q1", label: "Q1 – Urgent & Important", color: "#ef4444" },
  { value: "Q2", label: "Q2 – Important, Not Urgent", color: "#22c55e" },
  { value: "Q3", label: "Q3 – Urgent, Not Important", color: "#f59e0b" },
  { value: "Q4", label: "Q4 – Neither", color: "#6b7280" },
];

interface GoalInput {
  roleId: string;
  title: string;
  quadrant: Quadrant;
}

const EVENT_COLORS = [
  "#8b5cf6", "#ef4444", "#22c55e", "#3b82f6", "#f59e0b", "#ec4899", "#14b8a6", "#f97316"
];

const REMINDER_OPTIONS = [
  { value: 0, label: "At time" },
  { value: 5, label: "5 min before" },
  { value: 15, label: "15 min before" },
  { value: 30, label: "30 min before" },
  { value: 60, label: "1 hour before" },
];

const SEGMENT_LABELS: Record<string, { label: string; color: string }> = {
  sleep: { label: "Sleep", color: "#2d3a4f" },
  personal: { label: "Personal", color: "#5a6b7a" },
  work: { label: "Work", color: "#3d5a80" },
  focus: { label: "Focus", color: "#6b5b8a" },
  open: { label: "Open Time", color: "#22c55e" },
};

const BLOCK_PRESETS = [
  { id: "sleep", name: "Sleep", icon: Moon, color: "#3b4d6b", defaultStart: { h: 22, m: 0 }, defaultEnd: { h: 6, m: 0 } },
  { id: "work", name: "Work", icon: Briefcase, color: "#4a6fa5", defaultStart: { h: 9, m: 0 }, defaultEnd: { h: 17, m: 0 } },
  { id: "study", name: "Study", icon: Book, color: "#5a8a72", defaultStart: { h: 18, m: 0 }, defaultEnd: { h: 20, m: 0 } },
  { id: "daily-flow", name: "Daily Flow", icon: Zap, color: "#a855f7", defaultStart: { h: 7, m: 0 }, defaultEnd: { h: 8, m: 0 } },
  { id: "meal", name: "Meal", icon: Coffee, color: "#7d9d6a", defaultStart: { h: 12, m: 0 }, defaultEnd: { h: 13, m: 0 } },
  { id: "leisure", name: "Leisure", icon: Gamepad2, color: "#8b7aa3", defaultStart: { h: 20, m: 0 }, defaultEnd: { h: 22, m: 0 } },
  { id: "custom", name: "Custom", icon: Palette, color: "#6b7280", defaultStart: { h: 9, m: 0 }, defaultEnd: { h: 10, m: 0 } },
];

// Icon options for Custom blocks (key → component lookup).
const CUSTOM_ICONS: { key: string; Icon: any; label: string }[] = [
  { key: "palette",    Icon: Palette,    label: "Palette" },
  { key: "star",       Icon: Star,       label: "Star" },
  { key: "heart",      Icon: Heart,      label: "Heart" },
  { key: "flame",      Icon: Flame,      label: "Flame" },
  { key: "music",      Icon: Music,      label: "Music" },
  { key: "headphones", Icon: Headphones, label: "Listen" },
  { key: "camera",     Icon: Camera,     label: "Camera" },
  { key: "dumbbell",   Icon: Dumbbell,   label: "Train" },
  { key: "smile",      Icon: Smile,      label: "Mood" },
  { key: "bookmark",   Icon: Bookmark,   label: "Save" },
  { key: "sun",        Icon: Sun,        label: "Sun" },
  { key: "pen",        Icon: PenTool,    label: "Write" },
  { key: "leaf",       Icon: Leaf,       label: "Calm" },
  { key: "brain",      Icon: Brain,      label: "Mind" },
];
const ICON_BY_KEY: Record<string, any> = Object.fromEntries(CUSTOM_ICONS.map(i => [i.key, i.Icon]));

// Six curated swatches for Custom blocks; user can also enter any hex value.
const CUSTOM_COLOR_PRESETS = [
  "#ef4444", // red
  "#f59e0b", // amber
  "#22c55e", // green
  "#06b6d4", // cyan
  "#6366f1", // indigo
  "#ec4899", // pink
];

// Daily Flow becomes the umbrella for these training sub-types.
const DAILY_FLOW_SUBTYPES: { id: string; label: string }[] = [
  { id: "mixed",    label: "Mixed" },
  { id: "strength", label: "Strength" },
  { id: "agility",  label: "Agility" },
  { id: "vitality", label: "Vitality" },
];

const HEX_REGEX = /^#([0-9a-fA-F]{6})$/;

interface EditingBlock {
  id: string;
  name: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  color: string;
  isSystemTask?: boolean;
  isNew?: boolean;
  /** Sub-type for Daily Flow blocks. */
  subType?: string;
  /** Icon key for Custom blocks (lookup in ICON_BY_KEY). */
  iconKey?: string;
  /** Optional alarm time HH:MM (Sleep blocks). */
  alarmAt?: string;
  /** Saved-meal reference (set when scheduling from Nutrition page). */
  mealId?: string;
}

function getAwarenessInsight(schedule: ScheduleBlock[], freeWindows: FreeWindow[]): string | null {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const currentTotal = currentHour * 60 + currentMin;

  const currentBlock = schedule.find(b => {
    const start = b.startHour * 60 + (b.startMinute ?? 0);
    let end = b.endHour * 60 + (b.endMinute ?? 0);
    if (end <= start) end += 24 * 60;
    return currentTotal >= start && currentTotal < end;
  });

  if (currentBlock?.segment === "work" || currentBlock?.isSystemTask) {
    if (currentHour < 12) return "Morning focus is active. This is often your strongest window.";
    return "Deep work block in progress. Stay in the zone.";
  }

  const upcomingFree = freeWindows.find(w => {
    const freeStart = w.startHour * 60 + w.startMinute;
    return freeStart > currentTotal && freeStart - currentTotal < 120;
  });
  if (upcomingFree) {
    const h = Math.floor(upcomingFree.durationMinutes / 60);
    const m = upcomingFree.durationMinutes % 60;
    const dur = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
    return `You have a free window coming up — ${dur} of open time.`;
  }

  const currentFree = freeWindows.find(w => {
    const freeStart = w.startHour * 60 + w.startMinute;
    const freeEnd = w.endHour * 60 + w.endMinute;
    return currentTotal >= freeStart && currentTotal < freeEnd;
  });
  if (currentFree) {
    const remaining = (currentFree.endHour * 60 + currentFree.endMinute) - currentTotal;
    return `You're in open time right now — ${remaining} minutes before your next block.`;
  }

  if (currentBlock?.segment === "personal") {
    return "Personal time. A good moment to recharge.";
  }

  if (currentBlock?.segment === "sleep") {
    return "Rest is part of progress. Sleep well.";
  }

  return "Observe your day's rhythm. Patterns will emerge over time.";
}

function formatTimeSlot(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const p = hour < 12 ? "AM" : "PM";
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m} ${p}`;
}

// Self-contained per-second clock so the rest of the (large) Sectograph page
// keeps re-rendering on its slower 60s cadence.
function LiveHeaderClock({
  primaryColor,
  mutedColor,
}: {
  primaryColor: string;
  mutedColor: string;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      className="flex flex-col items-end leading-tight"
      data-testid="text-current-time"
    >
      <span
        className="text-base font-mono font-bold tabular-nums"
        style={{ color: primaryColor }}
      >
        {now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </span>
      <span
        className="text-[10px] uppercase tracking-wider"
        style={{ color: mutedColor }}
      >
        {now.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
      </span>
    </div>
  );
}

export default function SectographPage() {
  const [, navigate] = useLocation();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const { player, updatePlayer } = useGame();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<ViewTab>("sectograph");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:00");
  const [formColor, setFormColor] = useState(EVENT_COLORS[0]);
  const [formType, setFormType] = useState<"appointment" | "reminder">("appointment");
  const [formReminder, setFormReminder] = useState<number | undefined>(undefined);

  const [showIntroOverlay, setShowIntroOverlay] = useState(false);

  const [showAddBlock, setShowAddBlock] = useState(false);
  const [editingBlock, setEditingBlock] = useState<EditingBlock | null>(null);
  const [customBlockName, setCustomBlockName] = useState("");
  const [showSegments, setShowSegments] = useState(false);
  const [showAnchors, setShowAnchors] = useState(false);

  const [tutorialDone, setTutorialDone] = useState(() => isSectographTutorialDone());
  const [tutorialStep, setTutorialStep] = useState(() => isSectographTutorialDone() ? 99 : getSectographTutorialStep());
  const [justCompletedTutorial, setJustCompletedTutorial] = useState(false);

  const isDay5Mode = useMemo(
    () => new URLSearchParams(window.location.search).get("day5") === "1",
    []
  );
  const [day5SleepDone, setDay5SleepDone] = useState(() => isDayFiveSleepScheduled());
  const [day5FlowDone, setDay5FlowDone] = useState(() => isDayFiveFlowScheduled());
  const [day5IntroSeen, setDay5IntroSeen] = useState(
    () => localStorage.getItem("ascend_day5_sectograph_intro_seen") === "true"
  );
  const day5Step = useMemo(() => {
    if (!isDay5Mode) return -1;
    if (day5SleepDone && day5FlowDone) return 3;
    if (day5SleepDone) return 2;
    if (day5IntroSeen) return 1;
    return 0;
  }, [isDay5Mode, day5SleepDone, day5FlowDone, day5IntroSeen]);

  // Weekly planning state
  const { roles } = useRoles();
  const { weeklyGoals, createWeeklyGoal, currentWeekStart } = useWeeklyGoals();
  const [goalInputs, setGoalInputs] = useState<GoalInput[]>([]);
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    if (roles.length > 0 && goalInputs.length === 0) {
      setGoalInputs(roles.map(role => ({ roleId: role.id, title: "", quadrant: "Q2" as Quadrant })));
    }
  }, [roles, goalInputs.length]);

  const rolesWithGoals = useMemo(() => new Set(weeklyGoals.map(g => g.roleId)), [weeklyGoals]);
  const allRolesHaveGoals = roles.length > 0 && roles.every(r => rolesWithGoals.has(r.id));

  const updateGoalInput = (roleId: string, field: keyof GoalInput, value: string) => {
    setGoalInputs(prev => prev.map(g => g.roleId === roleId ? { ...g, [field]: value } : g));
  };

  const handlePlanSubmit = async () => {
    const toCreate = goalInputs.filter(g => g.title.trim());
    if (toCreate.length === 0) { setPlanError("Enter at least one goal to continue."); return; }
    setPlanSubmitting(true); setPlanError(null);
    try {
      for (const g of toCreate) await createWeeklyGoal({ roleId: g.roleId, title: g.title.trim(), quadrant: g.quadrant });
      setGoalInputs([]);
    } catch { setPlanError("Failed to save. Please try again."); }
    finally { setPlanSubmitting(false); }
  };

  useEffect(() => {
    const seen = localStorage.getItem("ascend_sectograph_intro_seen");
    if (!seen) setShowIntroOverlay(true);
  }, []);

  // If the user came from the Nutrition page after tapping "Schedule" on a
  // saved meal, pre-open the Add Block dialog with type=meal pre-filled.
  // Only consume the intent when no guided flow is in progress so we don't
  // hijack the tutorial / day-5 prescribed steps.
  useEffect(() => {
    if (isDay5Mode) return;
    if (!tutorialDone) return;
    if (showIntroOverlay) return;
    import("@/lib/savedMealsStore").then(({ consumePendingMealSchedule }) => {
      const pending = consumePendingMealSchedule();
      if (!pending) return;
      const now = new Date();
      const startHour = (now.getHours() + 1) % 24;
      const endHour = (startHour + 1) % 24;
      setEditingBlock({
        id: `meal_${Date.now()}`,
        name: pending.name,
        startHour,
        startMinute: 0,
        endHour,
        endMinute: 0,
        color: "#f97316",
        isNew: true,
        mealId: pending.mealId,
      });
      toast({
        title: "Schedule this meal",
        description: `Pick a time to log "${pending.name}".`,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDay5Mode, tutorialDone, showIntroOverlay]);

  const dismissIntro = useCallback(() => {
    localStorage.setItem("ascend_sectograph_intro_seen", "1");
    setShowIntroOverlay(false);
  }, []);

  const { data: anchorsData } = useQuery<{ anchors: BehavioralAnchor[] }>({
    queryKey: ["behavioral-anchors", player?.id],
    queryFn: async () => {
      if (!player?.id) return { anchors: [] };
      const res = await fetch(`/api/player/${player.id}/behavioral-anchors`);
      if (!res.ok) return { anchors: [] };
      return res.json();
    },
    enabled: !!player?.id,
  });

  const behavioralAnchors = anchorsData?.anchors ?? [];

  const anchorClusterInsight = useMemo(() => {
    if (behavioralAnchors.length < 2) return null;
    const hourBuckets: Record<number, number> = {};
    for (const a of behavioralAnchors) {
      hourBuckets[a.hour] = (hourBuckets[a.hour] || 0) + 1;
    }
    const clusters = Object.entries(hourBuckets)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a);
    if (clusters.length === 0) return null;
    const [hourStr, count] = clusters[0];
    const hour = parseInt(hourStr);
    const h = hour % 12 || 12;
    const p = hour < 12 ? "AM" : "PM";
    return `You often reset around ${h} ${p}. This may be your natural window.`;
  }, [behavioralAnchors]);

  interface RhythmData {
    windows: RhythmWindowVisual[];
    insights: { message: string; windowLabel: string; actionType: string; confidenceScore: number }[];
    totalEvents: number;
  }

  const { data: rhythmData } = useQuery<RhythmData>({
    queryKey: ["rhythm", player?.id],
    queryFn: async () => {
      if (!player?.id) return { windows: [], insights: [], totalEvents: 0 };
      const res = await fetch(`/api/player/${player.id}/rhythm`);
      if (!res.ok) return { windows: [], insights: [], totalEvents: 0 };
      return res.json();
    },
    enabled: !!player?.id,
    refetchInterval: 60000,
  });

  const rhythmWindows = rhythmData?.windows ?? [];
  const rhythmInsights = rhythmData?.insights ?? [];

  const { data: placementData } = useQuery<{ suggestions: SuggestedPlacement[]; coachComment: string | null }>({
    queryKey: ["habit-placement-sectograph", player?.id],
    queryFn: async () => {
      if (!player?.id) return { suggestions: [], coachComment: null };
      const res = await fetch(`/api/player/${player.id}/habit-placement-suggestions`);
      if (!res.ok) return { suggestions: [], coachComment: null };
      return res.json();
    },
    enabled: !!player?.id,
    staleTime: 60000,
  });

  const placementSuggestions = placementData?.suggestions ?? [];

  const clearAnchorsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/player/${player?.id}/behavioral-anchors`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["behavioral-anchors", player?.id] });
    },
  });

  const handlePresetClick = (preset: typeof BLOCK_PRESETS[0]) => {
    const existing = (player?.schedule ?? []).find((b: any) => b.id === preset.id);
    if (existing) {
      setEditingBlock({
        ...existing,
        startMinute: existing.startMinute ?? 0,
        endMinute: existing.endMinute ?? 0,
        isNew: false,
      });
    } else {
      setEditingBlock({
        id: preset.id === "custom" ? `custom_${Date.now()}` : `${preset.id}_${Date.now()}`,
        name: preset.id === "custom" ? "" : preset.name,
        startHour: preset.defaultStart.h,
        startMinute: preset.defaultStart.m,
        endHour: preset.defaultEnd.h,
        endMinute: preset.defaultEnd.m,
        color: preset.color,
        isSystemTask: ["work", "study", "daily-flow"].includes(preset.id),
        isNew: true,
        subType: preset.id === "daily-flow" ? "mixed" : undefined,
      });
      if (preset.id === "custom") setCustomBlockName("");
    }
    setShowAddBlock(false);
  };

  const handleSaveBlock = async () => {
    if (!editingBlock || !player) return;
    const name = editingBlock.id.startsWith("custom") ? (customBlockName || "Custom Block") : editingBlock.name;
    const blockFinal: any = { ...editingBlock, name };
    delete blockFinal.isNew;

    // Schedule a phone notification for the block's start time.
    if (
      isNativePlatform() &&
      typeof blockFinal.startHour === "number"
    ) {
      const now = new Date();
      const fireAt = new Date(now);
      fireAt.setHours(
        blockFinal.startHour,
        blockFinal.startMinute || 0,
        0,
        0,
      );
      // If the block's time today is already past, push to tomorrow.
      if (fireAt.getTime() <= now.getTime()) {
        fireAt.setDate(fireAt.getDate() + 1);
      }
      try {
        const granted = await requestNotificationPermissions();
        if (!granted) {
          toast({
            title: "Notification permission needed",
            description: "Tap the bell on Home → Allow, then re-save the block.",
            variant: "destructive",
          });
        } else {
          const r = await scheduleTaskNotification(
            blockFinal.id,
            blockFinal.name || "Sectograph block",
            "Time for this block.",
            fireAt,
            { route: "/sectograph", source: "sectograph-block" },
          );
          if (r.scheduled) {
            toast({
              title: "Reminder set",
              description: `You'll be notified at ${fireAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
            });
          } else {
            toast({
              title: "Reminder NOT set",
              description: `Reason: ${r.reason ?? "unknown"}`,
              variant: "destructive",
            });
          }
        }
      } catch (err) {
        console.warn("[SectographPage] schedule failed", err);
        toast({
          title: "Reminder failed",
          description: String(err),
          variant: "destructive",
        });
      }
    }
    // ── Night Flow / wind-down triggers (two-step).
    //   1) -30min  "Stop eating + put phone in night mode"  (controlled by plan.foodCutoff)
    //   2) -10min  "Wind down routine"                     (controlled by plan.windDownReminder)
    // The 10-min ping opens Night Flow when the active mode includes a full flow;
    // minimal mode → notification only, no auto-open.
    if (
      isNativePlatform() &&
      editingBlock.id.startsWith("sleep") &&
      typeof blockFinal.startHour === "number"
    ) {
      const cutoffId = `${blockFinal.id}__cutoff`;
      const nightId = `${blockFinal.id}__nightflow`;
      try {
        await cancelTaskNotification(cutoffId);
        await cancelTaskNotification(nightId);
      } catch (err) {
        console.warn("[SectographPage] cancel prior night pings failed", err);
      }

      const now = new Date();
      const sleepStart = new Date(now);
      sleepStart.setHours(blockFinal.startHour, blockFinal.startMinute || 0, 0, 0);
      const plan = getNightPlan();

      // 30-min food-cutoff + phone night-mode ping
      if (plan.foodCutoff) {
        const cutoffAt = new Date(sleepStart.getTime() - 30 * 60 * 1000);
        if (cutoffAt.getTime() <= now.getTime()) cutoffAt.setDate(cutoffAt.getDate() + 1);
        try {
          await scheduleTaskNotification(
            cutoffId,
            "Wind-down — 30 min",
            "Stop eating now and switch your phone to night mode.",
            cutoffAt,
            { source: "night-cutoff" },
          );
        } catch (err) {
          console.warn("[SectographPage] cutoff schedule failed", err);
        }
      }

      // 10-min wind-down ping
      if (plan.windDownReminder) {
        const offsetMin = Math.max(5, plan.windDownOffsetMin || 10);
        const nightAt = new Date(sleepStart.getTime() - offsetMin * 60 * 1000);
        if (nightAt.getTime() <= now.getTime()) nightAt.setDate(nightAt.getDate() + 1);
        const minimal = !plan.showFullFlow;
        try {
          await scheduleTaskNotification(
            nightId,
            minimal ? "Start winding down" : "Wind-down — start now",
            minimal
              ? "Time to wind down — open your tools when ready."
              : "Begin your Night Flow routine.",
            nightAt,
            minimal
              ? { source: "night-flow-minimal" }
              : { route: "/night-flow", source: "night-flow" },
          );
        } catch (err) {
          console.warn("[SectographPage] night-flow schedule failed", err);
        }
      }
    }
    // ── Sleep wake-up alarm — schedule (or cancel) a separate notification at alarmAt.
    if (isNativePlatform() && editingBlock.id.startsWith("sleep")) {
      const alarmId = `${blockFinal.id}__alarm`;
      const hasAlarm =
        typeof blockFinal.alarmAt === "string" && /^\d{2}:\d{2}$/.test(blockFinal.alarmAt);
      // Always cancel any prior alarm first so toggle-off / time-change behaves correctly.
      try {
        await cancelTaskNotification(alarmId);
      } catch (err) {
        console.warn("[SectographPage] cancel prior alarm failed", err);
      }
      if (hasAlarm) {
        const [ah, am] = blockFinal.alarmAt.split(":").map(Number);
        const now = new Date();
        const alarmAt = new Date(now);
        alarmAt.setHours(ah, am, 0, 0);
        if (alarmAt.getTime() <= now.getTime()) {
          alarmAt.setDate(alarmAt.getDate() + 1);
        }
        try {
          const granted = await requestNotificationPermissions();
          if (!granted) {
            toast({
              title: "Alarm permission needed",
              description: "Allow notifications and re-save the block.",
              variant: "destructive",
            });
          } else {
            const r = await scheduleTaskNotification(
              alarmId,
              "Wake up",
              "Time to rise — your day is starting.",
              alarmAt,
              { route: "/wake-flow", source: "wake-alarm" },
            );
            if (r.scheduled) {
              toast({
                title: "Alarm set",
                description: `Wake-up at ${alarmAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
              });
            } else {
              toast({
                title: "Alarm NOT set",
                description: `Reason: ${r.reason ?? "unknown"}`,
                variant: "destructive",
              });
            }
          }
        } catch (err) {
          console.warn("[SectographPage] alarm schedule failed", err);
          toast({
            title: "Alarm failed",
            description: String(err),
            variant: "destructive",
          });
        }
      }
    }
    // Strip subType when not a Daily Flow block to keep stored data clean.
    if (!editingBlock.id.startsWith("daily-flow")) {
      delete blockFinal.subType;
    }
    // Strip iconKey when not a Custom block to keep stored data clean.
    if (!editingBlock.id.startsWith("custom")) {
      delete blockFinal.iconKey;
    }
    // Strip alarmAt when not a Sleep block.
    if (!editingBlock.id.startsWith("sleep")) {
      delete blockFinal.alarmAt;
    }
    const current: ScheduleBlock[] = (player.schedule ?? []) as ScheduleBlock[];
    // System preset IDs that should be deduplicated (only one per type allowed)
    const SYSTEM_PRESET_PREFIXES = ["sleep", "daily", "work", "study", "exercise", "meal", "morning", "evening"];
    const blockTypePrefix = blockFinal.id.split("_")[0];
    const isSystemPreset = SYSTEM_PRESET_PREFIXES.includes(blockTypePrefix);
    // For system presets, find any existing block(s) of the same type that
    // will be replaced so we can cancel their scheduled notifications first.
    if (editingBlock.isNew && isSystemPreset && isNativePlatform()) {
      const replaced = current.filter((b: any) => b.id.split("_")[0] === blockTypePrefix && b.id !== blockFinal.id);
      for (const r of replaced) {
        try {
          await cancelTaskNotification(r.id);
          if (String(r.id).startsWith("sleep")) {
            await cancelTaskNotification(`${r.id}__alarm`);
            await cancelTaskNotification(`${r.id}__nightflow`);
            await cancelTaskNotification(`${r.id}__cutoff`);
          }
        } catch (err) {
          console.warn("[SectographPage] cancel replaced block failed", r.id, err);
        }
      }
    }
    const newSchedule = editingBlock.isNew
      ? [
          // For system presets: remove existing block of same type before adding
          // For custom/habit blocks: just append (allow multiples)
          ...(isSystemPreset
            ? current.filter((b: any) => b.id.split("_")[0] !== blockTypePrefix)
            : current),
          blockFinal,
        ]
      : current.map((b: any) => b.id === blockFinal.id ? blockFinal : b);
    updatePlayer({ schedule: newSchedule });
    setEditingBlock(null);
    setCustomBlockName("");

    const isSleepBlock = editingBlock.id.startsWith("sleep");
    const isDailyFlowBlock = editingBlock.id.startsWith("daily-flow");

    if (isDay5Mode) {
      if (isSleepBlock && !day5SleepDone) {
        markDayFiveSleepScheduled();
        setDay5SleepDone(true);
      } else if (day5SleepDone && !day5FlowDone) {
        markDayFiveFlowScheduled();
        setDay5FlowDone(true);
      }
      return;
    }

    // Tutorial progression: Sleep (step 1) → Daily Flow (step 2) → Done
    if (!tutorialDone) {
      if (isSleepBlock && tutorialStep <= 1) {
        setSectographTutorialStep(2);
        setTutorialStep(2);
      } else if (isDailyFlowBlock && tutorialStep === 2) {
        markSectographTutorialDone();
        setTutorialDone(true);
        setTutorialStep(99);
        setJustCompletedTutorial(true);
        window.dispatchEvent(new CustomEvent("ascend:sectograph-tutorial-done"));
      }
    }
  };

  const handleDeleteBlock = async () => {
    if (!editingBlock || !player) return;
    // Cancel any scheduled phone notifications tied to this block.
    if (isNativePlatform()) {
      try {
        await cancelTaskNotification(editingBlock.id);
        if (editingBlock.id.startsWith("sleep")) {
          await cancelTaskNotification(`${editingBlock.id}__alarm`);
          await cancelTaskNotification(`${editingBlock.id}__nightflow`);
          await cancelTaskNotification(`${editingBlock.id}__cutoff`);
        }
      } catch (err) {
        console.warn("[SectographPage] cancel on delete failed", err);
      }
    }
    deleteScheduleBlock(editingBlock.id);
    setEditingBlock(null);
  };

  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

  const { data: events = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["calendar-events", player?.id, monthKey],
    queryFn: async () => {
      if (!player?.id) return [];
      const res = await fetch(`/api/calendar-events/${player.id}?month=${monthKey}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!player?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/calendar-events", data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calendar-events"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/calendar-events/${id}`, data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calendar-events"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/calendar-events/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calendar-events"] }),
  });

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const getEventsForDate = (dateKey: string) => events.filter(e => e.date === dateKey);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const openNewEvent = (date?: Date) => {
    const d = date || selectedDay || new Date();
    setFormTitle("");
    setFormDescription("");
    setFormDate(formatDateKey(d));
    setFormStartTime("09:00");
    setFormEndTime("10:00");
    setFormColor(EVENT_COLORS[0]);
    setFormType("appointment");
    setFormReminder(undefined);
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const openEditEvent = (event: CalendarEvent) => {
    setFormTitle(event.title);
    setFormDescription(event.description || "");
    setFormDate(event.date);
    setFormStartTime(event.startTime);
    setFormEndTime(event.endTime);
    setFormColor(event.color);
    setFormType(event.type);
    setFormReminder(event.reminderMinutes ?? undefined);
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleSaveEvent = () => {
    if (!formTitle.trim() || !player?.id) return;
    const eventData = {
      userId: player.id,
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      color: formColor,
      type: formType,
      reminderMinutes: formReminder ?? null,
    };
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: eventData });
    } else {
      createMutation.mutate(eventData);
    }
    setShowEventForm(false);
  };

  const activeSchedule: ScheduleBlock[] = (player?.schedule as ScheduleBlock[]) ?? [];

  const hasCustomSchedule = activeSchedule.length > 0;

  const deleteScheduleBlock = async (blockId: string) => {
    // Cancel any phone notifications tied to this block, including sleep sub-IDs.
    if (isNativePlatform()) {
      try {
        await cancelTaskNotification(blockId);
        if (blockId.startsWith("sleep")) {
          await cancelTaskNotification(`${blockId}__alarm`);
          await cancelTaskNotification(`${blockId}__nightflow`);
          await cancelTaskNotification(`${blockId}__cutoff`);
        }
      } catch (err) {
        console.warn("[SectographPage] cancel on inline delete failed", err);
      }
    }
    const updated = activeSchedule.filter((b: any) => b.id !== blockId);
    updatePlayer({ schedule: updated });
  };

  const freeWindows = useMemo(() => detectFreeWindows(activeSchedule, 30), [activeSchedule]);
  const awarenessInsight = useMemo(() => getAwarenessInsight(activeSchedule, freeWindows), [activeSchedule, freeWindows]);

  // Tick once a minute so the active/next block computation refreshes without re-rendering Sectograph internals.
  // The live header clock has its own per-second tick inside <LiveHeaderClock /> so the rest of the page is untouched.
  const [nowTick, setNowTick] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNowTick(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { currentBlock, nextBlock } = useMemo(() => {
    if (!activeSchedule.length) return { currentBlock: null as ScheduleBlock | null, nextBlock: null as ScheduleBlock | null };
    const nowMin = nowTick.getHours() * 60 + nowTick.getMinutes();
    let curr: ScheduleBlock | null = null;
    let next: ScheduleBlock | null = null;
    let nextDelta = Number.POSITIVE_INFINITY;
    for (const b of activeSchedule) {
      const start = b.startHour * 60 + (b.startMinute ?? 0);
      let end = b.endHour * 60 + (b.endMinute ?? 0);
      if (end <= start) end += 24 * 60; // wraps midnight
      const containsNow = nowMin >= start && nowMin < end;
      const containsNowWrap = end > 24 * 60 && nowMin + 24 * 60 >= start && nowMin + 24 * 60 < end;
      if (containsNow || containsNowWrap) curr = b;
      const startDelta = start - nowMin;
      if (startDelta > 0 && startDelta < nextDelta) {
        nextDelta = startDelta;
        next = b;
      }
    }
    // If nothing later today, the "next" block is the earliest one tomorrow.
    if (!next) {
      const earliest = [...activeSchedule].sort(
        (a, b) => (a.startHour * 60 + (a.startMinute ?? 0)) - (b.startHour * 60 + (b.startMinute ?? 0)),
      )[0];
      next = earliest ?? null;
    }
    return { currentBlock: curr, nextBlock: next };
  }, [activeSchedule, nowTick]);

  const todayKey = formatDateKey(new Date());
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);
  const selectedDateKey = selectedDay ? formatDateKey(selectedDay) : null;
  const selectedEvents = selectedDateKey ? getEventsForDate(selectedDateKey) : [];

  const tabs: { id: ViewTab; label: string }[] = [
    { id: "sectograph", label: "Timeline" },
    { id: "calendar", label: "Calendar" },
    { id: "plan", label: "Plan" },
  ];

  const usedSegments = useMemo(() => {
    const segs = new Set<string>();
    activeSchedule.forEach(b => {
      if (b.segment) segs.add(b.segment);
    });
    if (freeWindows.length > 0) segs.add("open");
    return segs;
  }, [activeSchedule, freeWindows]);

  return (
    <SystemLayout>
      <div className="flex flex-col gap-4 pt-4 pb-20">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
            style={{ color: colors.primary }}
            data-testid="button-back-sectograph"
          >
            <ChevronLeft size={14} />
            Back
          </button>
          <h1 className="text-lg font-display font-black tracking-wider" style={{ color: colors.text }}>
            SECTOGRAPH
          </h1>
          <LiveHeaderClock primaryColor={colors.primary} mutedColor={colors.textMuted} />
        </div>

        {/* ── VIEW TABS (Timeline / Calendar) ──────────────────────── */}
        {!isDay5Mode && (
          <div
            className="flex rounded-xl p-1 gap-1"
            style={{
              backgroundColor: `${colors.surface}80`,
              border: `1px solid ${colors.surfaceBorder}`,
            }}
            data-testid="sectograph-tabs"
          >
            {tabs.filter(t => t.id !== "plan").map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all"
                  style={{
                    backgroundColor: isActive ? colors.primary : "transparent",
                    color: isActive ? "#05070f" : colors.textMuted,
                    boxShadow: isActive ? `0 0 12px ${colors.primaryGlow}` : "none",
                  }}
                  data-testid={`tab-${tab.id}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}


        {/* ── DAY 5 SETUP GUIDE ──────────────────────────────────────── */}
        {isDay5Mode && day5Step >= 1 && day5Step < 3 && (
          <div
            className="w-full rounded-2xl p-4 space-y-3"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.06))",
              border: "1px solid rgba(99,102,241,0.25)",
            }}
            data-testid="day5-sectograph-guide"
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "rgba(99,102,241,0.15)" }}
              >
                <Brain size={12} style={{ color: "#6366f1" }} />
              </div>
              <span
                className="text-[9px] uppercase tracking-widest font-bold"
                style={{ color: "rgba(99,102,241,0.8)" }}
              >
                Day 5 · Timeline Setup
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: day5SleepDone ? "rgba(34,197,94,0.06)" : "rgba(59,130,246,0.06)",
                  border: day5SleepDone ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(59,130,246,0.2)",
                }}
                data-testid="d5-sectograph-sleep-status"
              >
                <Moon size={14} style={{ color: day5SleepDone ? "#22c55e" : "#3b82f6" }} />
                <p className="text-xs font-medium flex-1" style={{ color: day5SleepDone ? "#22c55e" : "rgba(245,245,255,0.8)" }}>
                  Sleep Schedule
                </p>
                {day5SleepDone
                  ? <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
                  : <span className="text-[10px]" style={{ color: "rgba(59,130,246,0.7)" }}>Add it ↑</span>
                }
              </div>

              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: day5FlowDone ? "rgba(34,197,94,0.06)" : day5SleepDone ? "rgba(168,85,247,0.06)" : "rgba(255,255,255,0.02)",
                  border: day5FlowDone ? "1px solid rgba(34,197,94,0.2)" : day5SleepDone ? "1px solid rgba(168,85,247,0.2)" : "1px solid rgba(255,255,255,0.06)",
                  opacity: day5SleepDone ? 1 : 0.45,
                }}
                data-testid="d5-sectograph-flow-status"
              >
                <Zap size={14} style={{ color: day5FlowDone ? "#22c55e" : "#a855f7" }} />
                <p className="text-xs font-medium flex-1" style={{ color: day5FlowDone ? "#22c55e" : "rgba(245,245,255,0.8)" }}>
                  Daily Flow Session
                </p>
                {day5FlowDone
                  ? <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
                  : day5SleepDone
                  ? <span className="text-[10px]" style={{ color: "rgba(168,85,247,0.7)" }}>Add it ↑</span>
                  : <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>After sleep</span>
                }
              </div>
            </div>

            <p
              className="text-[10px] text-center leading-relaxed"
              style={{ color: "rgba(245,245,255,0.35)" }}
            >
              {!day5SleepDone
                ? "Tap + in the clock center → choose Sleep to get started"
                : "Sleep scheduled. Now add your Daily Flow time window"}
            </p>
          </div>
        )}

        {/* ── COACH TUTORIAL — step 0 fullscreen intro ─────────────── */}
        {!isDay5Mode && !tutorialDone && tutorialStep === 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ backgroundColor: "rgba(0,0,0,0.90)" }}
            data-testid="tutorial-overlay-step0"
          >
            <div
              className="mx-4 w-full max-w-sm rounded-2xl p-6"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${colors.primary}20` }}>
                  <Brain size={20} style={{ color: colors.primary }} />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.18em] font-bold" style={{ color: `${colors.primary}80` }}>Coach</p>
                  <p className="text-sm font-semibold leading-tight" style={{ color: colors.text }}>Your personal timeline</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: colors.textMuted }}>
                This is your <span style={{ color: colors.primary, fontWeight: 600 }}>Sectograph</span> — a 24-hour circle that maps your entire day. Time is your most valuable resource. Let's make it visible.
              </p>
              <div className="space-y-2 mb-5">
                {[
                  { dot: "#22c55e", text: "Green dot tracks the present moment" },
                  { dot: "#8b5cf6", text: "Colored arcs show your time blocks" },
                  { dot: "#3b82f6", text: "Tap + in the center to add blocks" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.dot }} />
                    <span className="text-xs" style={{ color: colors.textMuted }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => {
                  const next = 1;
                  setSectographTutorialStep(next);
                  setTutorialStep(next);
                }}
                className="w-full"
                style={{ backgroundColor: colors.primary, color: "#fff" }}
                data-testid="button-tutorial-next-step0"
              >
                Got it — show me how
              </Button>
            </div>
          </div>
        )}

        {activeTab === "sectograph" && <>
        {/* ── COACH CARD — step 1 (add Sleep block) ────────────────── */}
        {!isDay5Mode && !tutorialDone && tutorialStep === 1 && (
          <div
            className="w-full rounded-xl p-4 flex items-start gap-3"
            style={{ backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)" }}
            data-testid="tutorial-card-step1"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(59,130,246,0.15)" }}>
              <Brain size={15} style={{ color: "#3b82f6" }} />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider font-bold mb-0.5" style={{ color: "rgba(59,130,246,0.8)" }}>Coach · Step 1 of 2</p>
              <p className="text-base font-medium leading-snug" style={{ color: colors.text }}>
                Start with your <span style={{ color: "#6b88b0", fontWeight: 700 }}>Sleep</span> block
              </p>
              <p className="text-sm mt-1.5 leading-relaxed" style={{ color: colors.textMuted }}>
                Tap the <strong style={{ color: colors.primary }}>+</strong> in the center of the clock, choose <strong>Sleep</strong>, and set your hours.
              </p>
            </div>
            <Moon size={16} style={{ color: "#6b88b0", marginTop: 2 }} />
          </div>
        )}

        {/* ── COACH CARD — step 2 (add Daily Flow block) ───────────── */}
        {!isDay5Mode && !tutorialDone && tutorialStep === 2 && (
          <div
            className="w-full rounded-xl p-4 flex items-start gap-3"
            style={{ backgroundColor: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)" }}
            data-testid="tutorial-card-step2"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(168,85,247,0.15)" }}>
              <Brain size={15} style={{ color: "#a855f7" }} />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider font-bold mb-0.5" style={{ color: "rgba(168,85,247,0.8)" }}>Coach · Step 2 of 2</p>
              <p className="text-base font-medium leading-snug" style={{ color: colors.text }}>
                Now add your <span style={{ color: "#a855f7", fontWeight: 700 }}>Daily Flow</span> window
              </p>
              <p className="text-sm mt-1.5 leading-relaxed" style={{ color: colors.textMuted }}>
                Tap <strong style={{ color: colors.primary }}>+</strong> again, choose <strong>Daily Flow</strong>, and pick a time for your daily training session.
              </p>
            </div>
            <Zap size={16} style={{ color: "#a855f7", marginTop: 2 }} />
          </div>
        )}

        {/* ── TUTORIAL COMPLETE banner ─────────────────────────────── */}
        {!isDay5Mode && justCompletedTutorial && (
          <div
            className="w-full rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ backgroundColor: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}
            data-testid="tutorial-complete-banner"
          >
            <CheckCircle2 size={15} style={{ color: "#22c55e" }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: "#22c55e" }}>Timeline mapped</p>
              <p className="text-[10px]" style={{ color: colors.textMuted }}>HP and Mana are now active on your home screen.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
            {/* ── DATE NAV STRIP ─────────────────────────────────── */}
            {!isDay5Mode && (() => {
              const viewDate = selectedDay ?? new Date();
              const today = new Date();
              const isToday =
                viewDate.getFullYear() === today.getFullYear() &&
                viewDate.getMonth() === today.getMonth() &&
                viewDate.getDate() === today.getDate();
              const shiftDay = (delta: number) => {
                const d = new Date(viewDate);
                d.setDate(d.getDate() + delta);
                setSelectedDay(d);
                setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
              };
              const goToday = () => {
                const t = new Date();
                setSelectedDay(t);
                setCurrentMonth(new Date(t.getFullYear(), t.getMonth(), 1));
              };
              const dateLabel = viewDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: viewDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
              });
              return (
                <div
                  className="w-full flex items-center justify-between rounded-xl px-2 py-1.5"
                  style={{
                    backgroundColor: `${colors.surface}80`,
                    border: `1px solid ${colors.surfaceBorder}`,
                  }}
                  data-testid="sectograph-date-nav"
                >
                  <button
                    onClick={() => shiftDay(-1)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                    data-testid="button-prev-day"
                    aria-label="Previous day"
                  >
                    <ChevronLeft size={18} style={{ color: colors.primary }} />
                  </button>
                  <button
                    onClick={goToday}
                    className="flex-1 mx-2 flex flex-col items-center justify-center py-1 rounded-lg hover:bg-white/5 transition-colors"
                    data-testid="button-current-date"
                  >
                    <span
                      className="text-[10px] uppercase tracking-[0.2em] font-bold"
                      style={{ color: isToday ? colors.primary : colors.textMuted }}
                    >
                      {isToday ? "Today" : "Tap to return to today"}
                    </span>
                    <span
                      className="text-base font-display font-bold"
                      style={{ color: colors.text }}
                    >
                      {dateLabel}
                    </span>
                  </button>
                  <button
                    onClick={() => shiftDay(1)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                    data-testid="button-next-day"
                    aria-label="Next day"
                  >
                    <ChevronRight size={18} style={{ color: colors.primary }} />
                  </button>
                </div>
              );
            })()}

            <div className="flex justify-center pt-2">
              <Sectograph
                schedule={activeSchedule}
                size={300}
                showAwareness={true}
                anchors={showAnchors ? behavioralAnchors : []}
                focusBlock={null}
                rhythmWindows={rhythmWindows}
                suggestedPlacements={placementSuggestions}
                highlightCenter={day5Step === 1}
                currentBlockId={currentBlock?.id ?? null}
                onCenterClick={() => {
                  if (!isDay5Mode && !tutorialDone && tutorialStep === 0) {
                    setSectographTutorialStep(1);
                    setTutorialStep(1);
                  }
                  setShowAddBlock(true);
                }}
                onBlockClick={(block) => {
                  const blk = block as any;
                  // Spread to preserve persisted metadata (iconKey, alarmAt, description, etc).
                  setEditingBlock({
                    ...blk,
                    name: blk.name || blk.label || "",
                    startMinute: blk.startMinute ?? 0,
                    endMinute: blk.endMinute ?? 0,
                    color: blk.color || "#6b7280",
                    isNew: false,
                  });
                  if (blk.id?.startsWith("custom")) setCustomBlockName(blk.name || "");
                }}
                onFreeWindowClick={() => {}}
                onSuggestedPlacementClick={() => {}}
              />
            </div>

            {/* ── CURRENT MISSION card ─────────────────────────── */}
            {!isDay5Mode && (
              <CurrentMissionCard
                currentBlock={currentBlock ?? null}
                nextBlock={nextBlock ?? null}
                onAddBlock={() => setShowAddBlock(true)}
                onStartFocus={(block) => {
                  setEditingBlock({
                    id: block.id,
                    name: block.name,
                    startHour: block.startHour,
                    startMinute: block.startMinute ?? 0,
                    endHour: block.endHour,
                    endMinute: block.endMinute ?? 0,
                    color: block.color,
                    isSystemTask: block.isSystemTask,
                    subType: block.subType,
                    isNew: false,
                  } as any);
                }}
                onComplete={(block) => {
                  // Mark block as completed in local schedule and persist.
                  if (!player) return;
                  const updated = (activeSchedule as any[]).map((b: any) =>
                    b.id === block.id ? { ...b, completed: true } : b,
                  );
                  updatePlayer({ schedule: updated });
                }}
              />
            )}


            {!isDay5Mode && (() => {
              // Find the next upcoming free window today and show an actionable card.
              const now = new Date();
              const nowMin = now.getHours() * 60 + now.getMinutes();
              // Prefer the window the user is currently inside, then the next one upcoming.
              const upcoming = freeWindows.find(w => {
                const start = w.startHour * 60 + w.startMinute;
                const end = w.endHour * 60 + w.endMinute;
                return nowMin >= start && nowMin < end;
              }) ?? freeWindows.find(w => {
                const start = w.startHour * 60 + w.startMinute;
                return start > nowMin;
              });
              if (!upcoming) {
                return awarenessInsight ? (
                  <div className="w-full px-1 flex items-start gap-2" data-testid="awareness-insight">
                    <Sparkles size={12} className="flex-shrink-0 mt-0.5" style={{ color: colors.primary, opacity: 0.65 }} />
                    <p className="text-xs leading-snug" style={{ color: colors.text, opacity: 0.8 }}>
                      {awarenessInsight}
                    </p>
                  </div>
                ) : null;
              }
              const h = Math.floor(upcoming.durationMinutes / 60);
              const m = upcoming.durationMinutes % 60;
              const dur = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
              const timeLabel = formatTimeSlot(upcoming.startHour, upcoming.startMinute);
              const isNow = (upcoming.startHour * 60 + upcoming.startMinute) <= nowMin;
              return (
                <button
                  type="button"
                  onClick={() => {
                    setEditingBlock({
                      id: `custom_${Date.now()}`,
                      name: "",
                      startHour: upcoming.startHour,
                      startMinute: upcoming.startMinute,
                      endHour: upcoming.endHour,
                      endMinute: upcoming.endMinute,
                      color: "#6b7280",
                      isNew: true,
                    } as any);
                    setCustomBlockName("");
                  }}
                  className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-left transition-transform active:scale-[0.99]"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}25`,
                  }}
                  data-testid="awareness-insight"
                >
                  <Sparkles size={14} className="flex-shrink-0" style={{ color: colors.primary, opacity: 0.85 }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold" style={{ color: colors.text }}>
                      {dur} free window {isNow ? "now" : `at ${timeLabel}`}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-bold tracking-wide flex-shrink-0"
                    style={{ color: colors.primary }}
                  >
                    Fill with Task →
                  </span>
                </button>
              );
            })()}

            {!isDay5Mode && rhythmInsights.length > 0 && (
              <div className="w-full px-1" data-testid="rhythm-insights-card">
                <div className="flex items-center gap-2 mb-2.5">
                  <Activity size={11} style={{ color: "#6366f1" }} />
                  <h3 className="text-[10px] font-display font-bold tracking-[0.18em]" style={{ color: "#6366f1" }}>
                    RHYTHM INSIGHTS
                  </h3>
                </div>
                <div className="space-y-3">
                  {rhythmInsights.slice(0, 1).map((insight, i) => {
                    const dotColor =
                      insight.actionType === "reset" ? "#f59e0b" :
                      insight.actionType === "focusSession" ? "#8b5cf6" :
                      insight.actionType === "habit" ? "#3b82f6" : "#6366f1";
                    const win = rhythmWindows[i];
                    const targetHour = win?.startHour ?? null;
                    const targetMinute = win?.startMinute ?? 0;
                    const handleAutoCreate = () => {
                      if (targetHour === null) return;
                      const startMin = targetHour * 60 + targetMinute;
                      const endMin = startMin + 30;
                      const endH = Math.floor(endMin / 60) % 24;
                      const endM = endMin % 60;
                      setEditingBlock({
                        id: `daily-flow_${Date.now()}`,
                        name: "Daily Flow",
                        startHour: targetHour,
                        startMinute: targetMinute,
                        endHour: endH,
                        endMinute: endM,
                        color: "#a855f7",
                        isSystemTask: true,
                        isNew: true,
                        subType: insight.actionType === "focusSession" ? "mixed" : "vitality",
                      });
                    };
                    return (
                      <div key={i} data-testid={`rhythm-insight-${i}`}>
                        <div className="flex items-start gap-2">
                          <div
                            className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: dotColor }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs leading-snug" style={{ color: colors.text, opacity: 0.92 }}>
                              {insight.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="h-[2px] rounded-full flex-1" style={{ backgroundColor: "rgba(99,102,241,0.18)" }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${Math.round(insight.confidenceScore * 100)}%`, backgroundColor: dotColor, opacity: 0.7 }}
                                />
                              </div>
                              {targetHour !== null && (
                                <button
                                  type="button"
                                  onClick={handleAutoCreate}
                                  className="text-[10px] font-semibold tracking-wide transition-opacity hover:opacity-80 flex-shrink-0"
                                  style={{ color: "#c084fc" }}
                                  data-testid={`button-rhythm-action-${i}`}
                                >
                                  Schedule Block →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!isDay5Mode && behavioralAnchors.length > 0 && (
              <div
                className="w-full rounded-lg p-4"
                style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
                data-testid="anchors-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-display font-bold tracking-wider" style={{ color: "#f59e0b" }}>
                    RESET MARKERS
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (confirm("Clear all reset markers?")) {
                          clearAnchorsMutation.mutate();
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium"
                      style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
                      data-testid="button-clear-anchors"
                    >
                      <Trash2 size={8} />
                      Clear all
                    </button>
                    <button
                      onClick={() => setShowAnchors(v => !v)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium transition-all"
                      style={{
                        backgroundColor: showAnchors ? "rgba(245,158,11,0.15)" : "rgba(0,0,0,0.2)",
                        color: showAnchors ? "#f59e0b" : colors.textMuted,
                        border: `1px solid ${showAnchors ? "rgba(245,158,11,0.3)" : "transparent"}`,
                      }}
                      data-testid="toggle-anchors"
                    >
                      {showAnchors ? <Eye size={8} /> : <EyeOff size={8} />}
                      {showAnchors ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                {showAnchors && <>
                {anchorClusterInsight && (
                  <div
                    className="rounded-lg px-3 py-2 mb-3 flex items-start gap-2"
                    style={{ backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)" }}
                    data-testid="anchor-cluster-insight"
                  >
                    <Sparkles size={12} className="flex-shrink-0 mt-0.5" style={{ color: "#f59e0b", opacity: 0.7 }} />
                    <p className="text-[11px] leading-relaxed" style={{ color: colors.textMuted }}>
                      {anchorClusterInsight}
                    </p>
                  </div>
                )}
                <div className="space-y-1.5">
                  {behavioralAnchors.slice(-5).map((a, i) => (
                    <div key={i} className="flex items-center gap-3 px-2 py-1.5 rounded" style={{ backgroundColor: "rgba(245,158,11,0.06)" }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
                      <span className="text-xs font-mono" style={{ color: colors.textMuted }}>
                        {formatTimeSlot(a.hour, a.minute)}
                      </span>
                      <span className="text-[10px]" style={{ color: colors.textMuted, opacity: 0.6 }}>
                        {a.sessionId.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] ml-auto" style={{ color: colors.textMuted, opacity: 0.5 }}>
                        {new Date(a.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
                {!anchorClusterInsight && behavioralAnchors.length < 3 && (
                  <p className="text-[10px] mt-2 leading-relaxed" style={{ color: colors.textMuted, opacity: 0.5 }}>
                    As more resets accumulate, patterns will emerge.
                  </p>
                )}
                </>}
              </div>
            )}

            {!isDay5Mode && <div
              className="w-full rounded-lg p-4"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-display font-bold tracking-wider" style={{ color: colors.textMuted }}>
                  TIME SEGMENTS
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[9px]" style={{ color: colors.textMuted, opacity: 0.5 }}>
                    {hasCustomSchedule ? "Your schedule" : "No blocks yet"}
                  </span>
                  {hasCustomSchedule && (
                    <button
                      onClick={() => {
                        if (confirm("Remove all time blocks?")) {
                          updatePlayer({ schedule: [] });
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium transition-all"
                      style={{
                        backgroundColor: "rgba(239,68,68,0.1)",
                        color: "#ef4444",
                        border: "1px solid rgba(239,68,68,0.25)",
                      }}
                      data-testid="button-clear-all-blocks"
                    >
                      <Trash2 size={8} />
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setShowSegments(v => !v)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium transition-all"
                    style={{
                      backgroundColor: showSegments ? `${colors.primary}18` : "rgba(0,0,0,0.2)",
                      color: showSegments ? colors.primary : colors.textMuted,
                      border: `1px solid ${showSegments ? colors.primary + "30" : "transparent"}`,
                    }}
                    data-testid="toggle-segments"
                  >
                    {showSegments ? <Eye size={8} /> : <EyeOff size={8} />}
                    {showSegments ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {showSegments && <>
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.from(usedSegments).map(seg => {
                  const info = SEGMENT_LABELS[seg];
                  if (!info) return null;
                  return (
                    <div key={seg} className="flex items-center gap-1.5" data-testid={`segment-tag-${seg}`}>
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: info.color }} />
                      <span className="text-[10px] font-medium" style={{ color: colors.textMuted }}>{info.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                {activeSchedule
                  .sort((a, b) => {
                    const aStart = a.startHour * 60 + (a.startMinute ?? 0);
                    const bStart = b.startHour * 60 + (b.startMinute ?? 0);
                    const aNorm = a.startHour >= 22 ? aStart - 24 * 60 : aStart;
                    const bNorm = b.startHour >= 22 ? bStart - 24 * 60 : bStart;
                    return aNorm - bNorm;
                  })
                  .map((block) => {
                    const now = new Date();
                    const currentTotal = now.getHours() * 60 + now.getMinutes();
                    const blockStart = block.startHour * 60 + (block.startMinute ?? 0);
                    let blockEnd = block.endHour * 60 + (block.endMinute ?? 0);
                    if (blockEnd <= blockStart) blockEnd += 24 * 60;
                    const isCurrent = currentTotal >= blockStart && currentTotal < blockEnd;

                    return (
                      <div
                        key={block.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer hover:opacity-80 active:scale-[0.98]"
                        style={{
                          backgroundColor: isCurrent ? `${colors.primary}12` : "rgba(0,0,0,0.2)",
                          border: isCurrent ? `1px solid ${colors.primary}25` : "1px solid rgba(255,255,255,0.06)",
                        }}
                        onClick={() => setEditingBlock({ ...block, startMinute: block.startMinute ?? 0, endMinute: block.endMinute ?? 0, isNew: false })}
                        data-testid={`block-item-${block.id}`}
                      >
                        <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: block.color }} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block" style={{ color: colors.text }}>
                            {block.name}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                              {formatTimeSlot(block.startHour, block.startMinute ?? 0)} — {formatTimeSlot(block.endHour, block.endMinute ?? 0)}
                            </span>
                            {block.id.startsWith("sleep") && (
                              (block as any).alarmAt ? (
                                <span
                                  className="text-[9px] font-mono px-1.5 py-0.5 rounded-full inline-flex items-center gap-1"
                                  style={{
                                    backgroundColor: "rgba(129,140,248,0.15)",
                                    color: "#a5b4fc",
                                    border: "1px solid rgba(129,140,248,0.35)",
                                  }}
                                  data-testid={`badge-alarm-${block.id}`}
                                >
                                  <AlarmClock size={9} />
                                  {(block as any).alarmAt}
                                </span>
                              ) : (
                                <span
                                  className="text-[9px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-1"
                                  style={{
                                    backgroundColor: "rgba(255,255,255,0.04)",
                                    color: colors.textMuted,
                                    border: "1px dashed rgba(255,255,255,0.2)",
                                  }}
                                  data-testid={`badge-no-alarm-${block.id}`}
                                >
                                  <AlarmClock size={9} />
                                  Set alarm
                                </span>
                              )
                            )}
                          </div>
                        </div>
                        {isCurrent && (
                          <span
                            className="text-[8px] px-1.5 py-0.5 rounded-full font-bold tracking-wider"
                            style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
                          >
                            NOW
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteScheduleBlock(block.id);
                          }}
                          className="flex-shrink-0 p-1.5 rounded-md transition-all"
                          style={{ color: "#ef4444", backgroundColor: "rgba(239,68,68,0.12)" }}
                          data-testid={`button-delete-block-${block.id}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}

                {freeWindows.map((gap, i) => (
                  <div
                    key={`free-${i}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: "rgba(34,197,94,0.06)", border: "1px dashed rgba(34,197,94,0.2)" }}
                    data-testid={`free-window-${i}`}
                  >
                    <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: "rgba(34,197,94,0.4)" }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium" style={{ color: "rgba(34,197,94,0.8)" }}>
                        Open Time
                      </span>
                      <span className="text-[10px] font-mono block" style={{ color: colors.textMuted }}>
                        {formatTimeSlot(gap.startHour, gap.startMinute)} — {formatTimeSlot(gap.endHour, gap.endMinute)}
                        <span className="ml-1 opacity-60">({gap.durationMinutes}m)</span>
                      </span>
                    </div>
                    <span className="text-[9px]" style={{ color: "rgba(34,197,94,0.6)" }}>Free window</span>
                  </div>
                ))}
              </div>
              </>}

              {!hasCustomSchedule && (
                <div
                  className="mt-2 p-3 rounded-lg text-center"
                  style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
                  data-testid="observe-hint"
                >
                  <p className="text-[11px] leading-relaxed" style={{ color: colors.textMuted }}>
                    No time blocks yet. Tap + to add sleep, habits, or custom blocks.
                    <br />
                    <span style={{ opacity: 0.6 }}>Your schedule builds as you set it up.</span>
                  </p>
                </div>
              )}
            </div>}
          </div>
        </>}

        {activeTab === "calendar" && (
          <div className="flex flex-col gap-4">
            <div
              className="rounded-lg p-3"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  <button onClick={prevMonth} className="p-1.5 rounded hover:bg-white/10" data-testid="button-prev-month">
                    <ChevronLeft size={18} style={{ color: colors.primary }} />
                  </button>
                  <button onClick={nextMonth} className="p-1.5 rounded hover:bg-white/10" data-testid="button-next-month">
                    <ChevronRight size={18} style={{ color: colors.primary }} />
                  </button>
                </div>
                <span className="font-display font-bold text-sm" style={{ color: colors.text }}>
                  {monthName}
                </span>
                <button
                  onClick={() => {
                    const t = new Date();
                    setCurrentMonth(new Date(t.getFullYear(), t.getMonth(), 1));
                    setSelectedDay(t);
                  }}
                  className="text-xs font-semibold px-2.5 py-1 rounded-md transition-colors"
                  style={{
                    backgroundColor: `${colors.primary}15`,
                    border: `1px solid ${colors.primary}40`,
                    color: colors.primary,
                  }}
                  data-testid="button-today"
                >
                  Today
                </button>
              </div>

              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {dayNames.map(d => (
                  <div key={d} className="text-center text-[9px] font-mono uppercase py-1" style={{ color: colors.textMuted }}>
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((day, idx) => {
                  if (day === null) return <div key={`empty-${idx}`} />;
                  const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayEvents = getEventsForDate(dateKey);
                  const isSelected = selectedDateKey === dateKey;
                  const isCurrentDay = dateKey === todayKey;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                      className={`relative p-1 rounded-lg text-center transition-all min-h-[40px] flex flex-col items-center justify-start ${
                        isSelected ? 'ring-1' : 'hover:bg-white/5'
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${colors.primary}20` : 'transparent',
                        borderColor: isSelected ? colors.primary : 'transparent',
                      }}
                      data-testid={`calendar-day-${day}`}
                    >
                      <span
                        className={`text-xs font-mono ${isCurrentDay ? 'font-bold' : ''}`}
                        style={{ color: isCurrentDay ? colors.primary : colors.text }}
                      >
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                          {dayEvents.slice(0, 3).map((e, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.color }} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDay && (
              <div
                className="rounded-lg overflow-hidden"
                style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
              >
                <div className="p-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${colors.surfaceBorder}` }}>
                  <div>
                    <h3 className="font-display font-bold text-sm" style={{ color: colors.text }}>
                      {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                    <p className="text-[10px]" style={{ color: colors.textMuted }}>
                      {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => openNewEvent(selectedDay)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      backgroundColor: `${colors.primary}20`,
                      border: `1px solid ${colors.primary}40`,
                      color: colors.primary,
                    }}
                    data-testid="button-add-event"
                  >
                    <Plus size={12} />
                    Add
                  </button>
                </div>

                {activeSchedule.length > 0 && (
                  <div className="px-3 pt-3 pb-1">
                    <div className="text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: colors.textMuted }}>
                      Daily routine
                    </div>
                    <div className="space-y-1">
                      {[...activeSchedule]
                        .sort((a, b) => (a.startHour * 60 + (a.startMinute ?? 0)) - (b.startHour * 60 + (b.startMinute ?? 0)))
                        .map((b: any) => {
                          const fmt = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m ?? 0).padStart(2, '0')}`;
                          return (
                            <div
                              key={`sched-${b.id}`}
                              className="flex items-center gap-2 py-1.5 px-2 rounded-md"
                              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                              data-testid={`day-schedule-${b.id}`}
                            >
                              <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: b.color || colors.primary }} />
                              <span className="text-xs flex-1 truncate" style={{ color: colors.text, opacity: 0.85 }}>
                                {b.name || b.label || 'Block'}
                              </span>
                              <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                                {fmt(b.startHour, b.startMinute ?? 0)} – {fmt(b.endHour, b.endMinute ?? 0)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {selectedEvents.length === 0 ? (
                  <div className="p-6 text-center">
                    <CalendarDays size={24} className="mx-auto mb-2 opacity-30" style={{ color: colors.textMuted }} />
                    <p className="text-xs" style={{ color: colors.textMuted }}>No one-off events. Tap Add to schedule something for this day.</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1.5">
                    <div className="text-[10px] uppercase tracking-wider font-bold px-1.5 pt-1" style={{ color: colors.textMuted }}>
                      Events
                    </div>
                    {selectedEvents
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((event) => (
                        <div
                          key={event.id}
                          onClick={() => openEditEvent(event)}
                          className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors hover:bg-white/5"
                          style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                          data-testid={`event-item-${event.id}`}
                        >
                          <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium truncate ${event.completed ? 'line-through opacity-50' : ''}`} style={{ color: colors.text }}>
                                {event.title}
                              </span>
                              {event.type === "reminder" && (
                                <Bell size={10} className="flex-shrink-0" style={{ color: colors.primary }} />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px]" style={{ color: colors.textMuted }}>
                              <Clock size={9} />
                              <span>{event.startTime} - {event.endTime}</span>
                              {event.reminderMinutes != null && (
                                <span className="px-1 rounded" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                                  {REMINDER_OPTIONS.find(r => r.value === event.reminderMinutes)?.label || `${event.reminderMinutes}m`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateMutation.mutate({ id: event.id, data: { completed: !event.completed } });
                              }}
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                event.completed ? 'bg-green-500/30' : 'bg-white/10 hover:bg-white/20'
                              }`}
                              data-testid={`button-complete-event-${event.id}`}
                            >
                              {event.completed && <Check size={12} className="text-green-400" />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMutation.mutate(event.id);
                              }}
                              className="w-6 h-6 rounded-full flex items-center justify-center bg-white/5 hover:bg-red-500/20 transition-colors"
                              data-testid={`button-delete-event-${event.id}`}
                            >
                              <Trash2 size={10} className="text-red-400/60" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {false && activeTab === "plan" && (
          <div className="flex flex-col gap-4 pb-6">
            {/* Header */}
            <div className="text-center py-2">
              <div className="text-[9px] uppercase tracking-[0.25em] mb-1" style={{ color: colors.textMuted }}>
                Week of {currentWeekStart}
              </div>
              <h2 className="text-lg font-display font-black tracking-wider" style={{ color: colors.text }}>
                WEEKLY PLANNING
              </h2>
            </div>

            {/* Existing goals */}
            {weeklyGoals.length > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}
                data-testid="existing-goals-card"
              >
                <div className="text-[9px] uppercase tracking-widest text-green-400 mb-3">
                  This Week's Goals ({weeklyGoals.length})
                </div>
                <div className="space-y-2">
                  {weeklyGoals.map(goal => {
                    const q = QUADRANT_OPTIONS.find(q => q.value === goal.quadrant);
                    const role = roles.find(r => r.id === goal.roleId);
                    return (
                      <div key={goal.id} className="flex items-center gap-2.5 text-sm">
                        <span
                          className="w-7 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${q?.color || "#6b7280"}25`, color: q?.color || "#6b7280" }}
                        >
                          {goal.quadrant}
                        </span>
                        <span style={{ color: colors.text }} className="flex-1 truncate">{goal.title}</span>
                        {role && (
                          <span className="text-[10px] flex-shrink-0" style={{ color: colors.textMuted }}>{role.name}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add goals form */}
            {!allRolesHaveGoals && roles.length > 0 && (
              <div className="space-y-3">
                <div className="text-[9px] uppercase tracking-widest" style={{ color: colors.textMuted }}>
                  Set Goals per Role
                </div>
                {goalInputs.map((input) => {
                  const role = roles.find(r => r.id === input.roleId);
                  if (rolesWithGoals.has(input.roleId)) return null;
                  return (
                    <div
                      key={input.roleId}
                      className="rounded-xl p-4 space-y-3"
                      style={{ backgroundColor: "rgba(0,0,0,0.35)", border: `1px solid ${colors.surfaceBorder}` }}
                    >
                      <div className="text-sm font-bold" style={{ color: colors.text }}>
                        {role?.name || "Role"}
                      </div>
                      <Input
                        value={input.title}
                        onChange={(e) => updateGoalInput(input.roleId, "title", e.target.value)}
                        placeholder="Main mission this week…"
                        className="bg-black/50 border-white/10 text-sm h-9"
                        data-testid={`input-goal-${input.roleId}`}
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {QUADRANT_OPTIONS.map(q => (
                          <button
                            key={q.value}
                            type="button"
                            onClick={() => updateGoalInput(input.roleId, "quadrant", q.value)}
                            className="px-2 py-1 rounded text-[10px] font-bold transition-all"
                            style={{
                              backgroundColor: input.quadrant === q.value ? `${q.color}30` : "rgba(255,255,255,0.04)",
                              color: input.quadrant === q.value ? q.color : colors.textMuted,
                              border: `1px solid ${input.quadrant === q.value ? `${q.color}50` : "rgba(255,255,255,0.08)"}`,
                              outline: input.quadrant === q.value ? `2px solid ${q.color}40` : "none",
                            }}
                            data-testid={`button-quadrant-${input.roleId}-${q.value}`}
                          >
                            {q.value}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {planError && (
                  <p className="text-xs text-red-400">{planError}</p>
                )}

                <Button
                  onClick={handlePlanSubmit}
                  disabled={planSubmitting || goalInputs.every(g => !g.title.trim())}
                  className="w-full h-11 font-display tracking-wider disabled:opacity-40"
                  style={{ backgroundColor: colors.primary, color: "#fff" }}
                  data-testid="button-save-goals"
                >
                  {planSubmitting ? "Saving…" : "Save Goals"}
                </Button>
              </div>
            )}

            {/* No roles state */}
            {roles.length === 0 && (
              <div
                className="rounded-xl px-4 py-8 text-center"
                style={{ backgroundColor: `${colors.surface}cc`, border: `1px solid ${colors.surfaceBorder}` }}
              >
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Set up your roles first to begin weekly planning.
                </p>
              </div>
            )}

            {allRolesHaveGoals && (
              <div
                className="rounded-xl px-4 py-5 text-center"
                style={{ backgroundColor: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}
              >
                <p className="text-sm font-semibold text-green-400">
                  All goals set for this week.
                </p>
                <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                  Come back next week to plan again.
                </p>
              </div>
            )}
          </div>
        )}

        <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
          <DialogContent className="bg-black/95 border-white/10 max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display text-sm" style={{ color: colors.text }}>
                {editingEvent ? "Edit Event" : "New Event"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: colors.textMuted }}>Title</label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Event name"
                  className="h-9 bg-black/50 border-white/10 text-sm"
                  data-testid="input-event-title"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: colors.textMuted }}>Description</label>
                <Input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional details"
                  className="h-9 bg-black/50 border-white/10 text-sm"
                  data-testid="input-event-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: colors.textMuted }}>Type</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setFormType("appointment")}
                      className="flex-1 py-1.5 rounded text-[10px] font-bold transition-all"
                      style={{
                        backgroundColor: formType === "appointment" ? `${colors.primary}30` : 'rgba(255,255,255,0.05)',
                        color: formType === "appointment" ? colors.primary : colors.textMuted,
                        border: `1px solid ${formType === "appointment" ? colors.primary + '60' : 'rgba(255,255,255,0.1)'}`,
                      }}
                      data-testid="button-type-appointment"
                    >
                      <CalendarDays size={10} className="inline mr-1" />
                      Event
                    </button>
                    <button
                      onClick={() => setFormType("reminder")}
                      className="flex-1 py-1.5 rounded text-[10px] font-bold transition-all"
                      style={{
                        backgroundColor: formType === "reminder" ? `${colors.primary}30` : 'rgba(255,255,255,0.05)',
                        color: formType === "reminder" ? colors.primary : colors.textMuted,
                        border: `1px solid ${formType === "reminder" ? colors.primary + '60' : 'rgba(255,255,255,0.1)'}`,
                      }}
                      data-testid="button-type-reminder"
                    >
                      <Bell size={10} className="inline mr-1" />
                      Reminder
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: colors.textMuted }}>Date</label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="h-9 bg-black/50 border-white/10 text-xs"
                    data-testid="input-event-date"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: colors.textMuted }}>Start Time</label>
                  <Input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="h-9 bg-black/50 border-white/10 text-xs"
                    data-testid="input-event-start"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: colors.textMuted }}>End Time</label>
                  <Input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="h-9 bg-black/50 border-white/10 text-xs"
                    data-testid="input-event-end"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: colors.textMuted }}>Reminder</label>
                <div className="flex gap-1 flex-wrap">
                  {REMINDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFormReminder(formReminder === opt.value ? undefined : opt.value)}
                      className="px-2 py-1 rounded text-[10px] font-medium transition-all"
                      style={{
                        backgroundColor: formReminder === opt.value ? `${colors.primary}30` : 'rgba(255,255,255,0.05)',
                        color: formReminder === opt.value ? colors.primary : colors.textMuted,
                        border: `1px solid ${formReminder === opt.value ? colors.primary + '60' : 'rgba(255,255,255,0.1)'}`,
                      }}
                      data-testid={`button-reminder-${opt.value}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: colors.textMuted }}>Color</label>
                <div className="flex gap-1.5">
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setFormColor(c)}
                      className={`w-6 h-6 rounded-full transition-all ${formColor === c ? 'ring-2 ring-offset-1 ring-offset-black scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                      data-testid={`button-color-${c}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSaveEvent}
                  className="flex-1"
                  style={{ backgroundColor: colors.primary }}
                  disabled={!formTitle.trim()}
                  data-testid="button-save-event"
                >
                  {editingEvent ? "Update" : "Create"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEventForm(false)}
                  className="border-white/10"
                  data-testid="button-cancel-event"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {/* ── ADD BLOCK — preset picker ─────────────────────────── */}
        <Dialog open={showAddBlock} onOpenChange={setShowAddBlock}>
          <DialogContent
            className="max-w-sm"
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.primary}40`,
              boxShadow: `0 0 32px ${colors.primary}25, 0 8px 24px rgba(0,0,0,0.4)`,
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-base font-display font-bold tracking-wider" style={{ color: colors.primary }}>
                ADD TIME BLOCK
              </DialogTitle>
            </DialogHeader>
            <p className="text-[11px] mb-4" style={{ color: colors.text, opacity: 0.7 }}>
              Choose a block type to add to your timeline
            </p>
            <div className="grid grid-cols-4 gap-2.5">
              {BLOCK_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isHighlighted =
                  isDay5Mode &&
                  ((day5Step === 1 && preset.id === "sleep") ||
                   (day5Step === 2 && preset.id === "daily-flow"));
                // Brighter hue for the icon foreground (boost saturation/lightness via overlay).
                const vivid = preset.color;
                return (
                  <button
                    key={preset.id}
                    data-testid={`preset-${preset.id}`}
                    onClick={() => handlePresetClick(preset)}
                    className="relative flex flex-col items-center gap-1.5 px-1 py-3 rounded-xl transition-all active:scale-95 hover:scale-[1.04]"
                    style={{
                      background: isHighlighted
                        ? `linear-gradient(160deg, ${vivid}55, ${vivid}22)`
                        : `linear-gradient(160deg, ${vivid}38, ${vivid}10)`,
                      border: isHighlighted ? `2px solid ${vivid}` : `1px solid ${vivid}66`,
                      boxShadow: isHighlighted
                        ? `0 0 16px ${vivid}90, 0 0 4px ${vivid}40 inset`
                        : `0 0 10px ${vivid}33, 0 1px 0 rgba(255,255,255,0.04) inset`,
                      transform: isHighlighted ? "scale(1.06)" : "scale(1)",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        background: `radial-gradient(circle at 35% 30%, ${vivid}aa, ${vivid}55)`,
                        boxShadow: `0 0 8px ${vivid}80`,
                      }}
                    >
                      <Icon size={18} style={{ color: "#ffffff", filter: `drop-shadow(0 0 4px ${vivid})` }} />
                    </div>
                    <span
                      className="text-[10px] font-bold text-center leading-tight tracking-wide"
                      style={{ color: "#ffffff", textShadow: `0 0 6px ${vivid}` }}
                    >
                      {preset.name}
                    </span>
                    {isHighlighted && (
                      <span
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold leading-none px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: vivid, color: "#0b1020" }}
                      >
                        TAP
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── EDIT / CONFIRM BLOCK ─────────────────────────────── */}
        <Dialog open={editingBlock !== null} onOpenChange={(o) => !o && setEditingBlock(null)}>
          <DialogContent className="max-w-sm border-white/10" style={{ backgroundColor: colors.surface }}>
            <DialogHeader>
              <DialogTitle className="text-sm font-display font-bold" style={{ color: colors.text }}>
                {editingBlock?.isNew ? "Add Block" : "Edit Block"}
              </DialogTitle>
            </DialogHeader>
            {editingBlock && (
              <div className="space-y-4">
                {/* ── Linked saved meal — quick log to today ───── */}
                {editingBlock.mealId && (() => {
                  const meal = getSavedMeal(editingBlock.mealId);
                  if (!meal) return null;
                  return (
                    <div
                      className="rounded-lg p-3"
                      style={{
                        backgroundColor: "rgba(249,115,22,0.08)",
                        border: "1px solid rgba(249,115,22,0.25)",
                      }}
                      data-testid="block-linked-meal"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Utensils size={13} style={{ color: "#f97316" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "#f97316" }}>
                            Linked Meal
                          </p>
                          <p className="text-xs font-bold truncate" style={{ color: colors.text }}>
                            {meal.name}
                          </p>
                          <p className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                            {meal.totalCalories} kcal · P{meal.totalProtein}g · C{meal.totalCarbs}g · F{meal.totalFat}g
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          const n = logSavedMealToToday(meal.id);
                          toast({
                            title: "Meal logged",
                            description: `Added ${n} item${n === 1 ? "" : "s"} from ${meal.name} to today.`,
                          });
                        }}
                        className="w-full text-xs h-8"
                        style={{ backgroundColor: "#f97316", color: "#fff" }}
                        data-testid="button-log-linked-meal"
                      >
                        <Plus size={12} className="mr-1" />
                        Log this meal
                      </Button>
                    </div>
                  );
                })()}
                {editingBlock.id.startsWith("custom") && (
                  <>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold mb-1.5 block" style={{ color: colors.textMuted }}>
                        Name
                      </label>
                      <Input
                        value={customBlockName}
                        onChange={(e) => setCustomBlockName(e.target.value)}
                        placeholder="Block name…"
                        className="bg-white/5 border-white/10 text-sm"
                        style={{ color: colors.text }}
                        data-testid="input-custom-block-name"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold mb-1.5 block" style={{ color: colors.textMuted }}>
                        Icon
                      </label>
                      <div
                        className="grid grid-cols-7 gap-1.5"
                        data-testid="custom-icon-picker"
                      >
                        {CUSTOM_ICONS.map(({ key, Icon, label }) => {
                          const isSel = (editingBlock.iconKey ?? "palette") === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              aria-label={label}
                              onClick={() => setEditingBlock({ ...editingBlock, iconKey: key })}
                              data-testid={`custom-icon-${key}`}
                              className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform active:scale-95"
                              style={{
                                backgroundColor: isSel ? `${editingBlock.color}30` : "rgba(255,255,255,0.04)",
                                border: `1px solid ${isSel ? editingBlock.color : "rgba(255,255,255,0.08)"}`,
                                boxShadow: isSel ? `0 0 8px ${editingBlock.color}80` : "none",
                              }}
                            >
                              <Icon size={15} style={{ color: isSel ? editingBlock.color : colors.textMuted }} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold mb-1.5 block" style={{ color: colors.textMuted }}>
                      Start
                    </label>
                    <Input
                      type="time"
                      value={`${String(editingBlock.startHour).padStart(2, "0")}:${String(editingBlock.startMinute).padStart(2, "0")}`}
                      onChange={(e) => {
                        const [h, m] = e.target.value.split(":").map(Number);
                        setEditingBlock({ ...editingBlock, startHour: h, startMinute: m });
                      }}
                      className="bg-white/5 border-white/10 text-sm"
                      style={{ color: colors.text }}
                      data-testid="input-block-start"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold mb-1.5 block" style={{ color: colors.textMuted }}>
                      End
                    </label>
                    <Input
                      type="time"
                      value={`${String(editingBlock.endHour).padStart(2, "0")}:${String(editingBlock.endMinute).padStart(2, "0")}`}
                      onChange={(e) => {
                        const [h, m] = e.target.value.split(":").map(Number);
                        setEditingBlock({ ...editingBlock, endHour: h, endMinute: m });
                      }}
                      className="bg-white/5 border-white/10 text-sm"
                      style={{ color: colors.text }}
                      data-testid="input-block-end"
                    />
                  </div>
                </div>
                {/* ── Sleep block — wake-up alarm ─────────────── */}
                {editingBlock.id.startsWith("sleep") && (
                  <div
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor: "rgba(99,102,241,0.08)",
                      border: "1px solid rgba(99,102,241,0.2)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: colors.text }}>
                        <AlarmClock size={14} style={{ color: "#818cf8" }} />
                        Wake-up alarm
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (editingBlock.alarmAt) {
                            const { alarmAt: _, ...rest } = editingBlock;
                            setEditingBlock(rest as EditingBlock);
                          } else {
                            // Default the alarm to the block's end time (wake time).
                            const h = String(editingBlock.endHour).padStart(2, "0");
                            const m = String(editingBlock.endMinute).padStart(2, "0");
                            setEditingBlock({ ...editingBlock, alarmAt: `${h}:${m}` });
                          }
                        }}
                        data-testid="toggle-sleep-alarm"
                        className="relative w-9 h-5 rounded-full transition-colors"
                        style={{
                          backgroundColor: editingBlock.alarmAt ? "#818cf8" : "rgba(255,255,255,0.12)",
                        }}
                        aria-pressed={!!editingBlock.alarmAt}
                      >
                        <span
                          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                          style={{ left: editingBlock.alarmAt ? "calc(100% - 18px)" : "2px" }}
                        />
                      </button>
                    </div>
                    {editingBlock.alarmAt && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={editingBlock.alarmAt}
                          onChange={(e) => setEditingBlock({ ...editingBlock, alarmAt: e.target.value })}
                          className="bg-white/5 border-white/10 text-sm flex-1"
                          style={{ color: colors.text }}
                          data-testid="input-sleep-alarm"
                        />
                        <span className="text-[10px]" style={{ color: colors.textMuted }}>
                          rings on phone
                        </span>
                      </div>
                    )}
                    <p className="text-[10px] mt-2" style={{ color: colors.textMuted }}>
                      Turning off the alarm opens your Wake Flow automatically.
                    </p>
                  </div>
                )}

                {/* ── Sleep block — Wake / Night flow shortcuts + sleep mode ───── */}
                {editingBlock.id.startsWith("sleep") && !editingBlock.isNew && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: colors.textMuted }}>
                      Sleep routines
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setEditingBlock(null); navigate("/wake-flow"); }}
                        data-testid="button-open-wake-flow"
                        className="rounded-lg px-3 py-2.5 text-left transition-all"
                        style={{
                          backgroundColor: "rgba(245,158,11,0.1)",
                          border: "1px solid rgba(245,158,11,0.3)",
                        }}
                      >
                        <p className="text-xs font-bold" style={{ color: "#fbbf24" }}>Wake Flow</p>
                        <p className="text-[10px]" style={{ color: colors.textMuted }}>5 phases · activates after alarm</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingBlock(null); navigate("/night-flow"); }}
                        data-testid="button-open-night-flow"
                        className="rounded-lg px-3 py-2.5 text-left transition-all"
                        style={{
                          backgroundColor: "rgba(139,92,246,0.1)",
                          border: "1px solid rgba(139,92,246,0.3)",
                        }}
                      >
                        <p className="text-xs font-bold" style={{ color: "#c4b5fd" }}>Night Flow</p>
                        <p className="text-[10px]" style={{ color: colors.textMuted }}>30m + 10m alerts before bed</p>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setEditingBlock(null); navigate("/sleep-settings"); }}
                      data-testid="button-open-sleep-settings"
                      className="w-full rounded-lg px-3 py-2 text-[11px] font-medium"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: colors.text,
                      }}
                    >
                      Sleep Optimization Settings ›
                    </button>
                  </div>
                )}

                {/* ── Daily Flow sub-type chooser ─────────────── */}
                {editingBlock.id.startsWith("daily-flow") && (
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold mb-1.5 block" style={{ color: colors.textMuted }}>
                      Sub-type
                    </label>
                    <div className="grid grid-cols-4 gap-1.5" data-testid="daily-flow-subtype-picker">
                      {DAILY_FLOW_SUBTYPES.map((st) => {
                        const isSel = (editingBlock.subType ?? "mixed") === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setEditingBlock({ ...editingBlock, subType: st.id })}
                            data-testid={`subtype-${st.id}`}
                            className="text-[10px] py-1.5 rounded-md font-semibold transition-all"
                            style={{
                              backgroundColor: isSel ? `${editingBlock.color}30` : "rgba(255,255,255,0.04)",
                              color: isSel ? editingBlock.color : colors.textMuted,
                              border: `1px solid ${isSel ? editingBlock.color : "rgba(255,255,255,0.08)"}`,
                            }}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Color picker (Custom blocks only) ───────── */}
                {editingBlock.id.startsWith("custom") && (
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold mb-1.5 block" style={{ color: colors.textMuted }}>
                      Color
                    </label>
                    <div className="flex items-center gap-2 flex-wrap" data-testid="custom-color-picker">
                      {CUSTOM_COLOR_PRESETS.map((c) => {
                        const isSel = editingBlock.color.toLowerCase() === c.toLowerCase();
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditingBlock({ ...editingBlock, color: c })}
                            data-testid={`color-swatch-${c.replace("#", "")}`}
                            aria-label={`Use color ${c}`}
                            className="w-7 h-7 rounded-full transition-transform"
                            style={{
                              backgroundColor: c,
                              boxShadow: isSel ? `0 0 0 2px ${colors.surface}, 0 0 0 4px ${c}` : "none",
                              transform: isSel ? "scale(1.1)" : "scale(1)",
                            }}
                          />
                        );
                      })}
                      <Input
                        value={editingBlock.color}
                        onChange={(e) =>
                          setEditingBlock({ ...editingBlock, color: e.target.value })
                        }
                        onBlur={(e) => {
                          // On blur, snap back to a valid color if user left a partial hex.
                          if (!HEX_REGEX.test(e.target.value)) {
                            setEditingBlock({ ...editingBlock, color: CUSTOM_COLOR_PRESETS[0] });
                          }
                        }}
                        placeholder="#hex"
                        className="bg-white/5 border-white/10 text-xs h-7 w-24 ml-auto font-mono"
                        style={{ color: colors.text }}
                        data-testid="input-custom-color-hex"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <div
                    className="w-5 h-5 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: editingBlock.color }}
                  />
                  <span className="text-sm font-medium" style={{ color: colors.text }}>
                    {editingBlock.id.startsWith("custom") ? (customBlockName || "Custom Block") : editingBlock.name}
                    {editingBlock.id.startsWith("daily-flow") && editingBlock.subType && editingBlock.subType !== "mixed" && (
                      <span className="text-xs font-normal ml-1.5" style={{ color: colors.textMuted }}>
                        · {editingBlock.subType}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleSaveBlock}
                    className="flex-1 text-sm"
                    style={{ backgroundColor: colors.primary, color: "#fff" }}
                    data-testid="button-save-block"
                  >
                    <Check size={14} className="mr-1" />
                    {editingBlock.isNew ? "Add" : "Save"}
                  </Button>
                  {!editingBlock.isNew && (
                    <Button
                      onClick={handleDeleteBlock}
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      data-testid="button-delete-block"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                  <Button
                    onClick={() => setEditingBlock(null)}
                    variant="outline"
                    className="border-white/10"
                    data-testid="button-cancel-block"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* ── DAY 5 · STEP 0: FULLSCREEN INTRO OVERLAY ─────────────── */}
      {isDay5Mode && day5Step === 0 && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
          style={{ background: "rgba(5,5,20,0.97)" }}
          data-testid="day5-intro-overlay"
        >
          <style>{`
            @keyframes d5IntroFade { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
            @keyframes d5OrbitPulse { 0%,100% { opacity:0.6; transform:scale(1); } 50% { opacity:1; transform:scale(1.12); } }
          `}</style>
          <div style={{ animation: "d5IntroFade 0.6s ease both" }} className="flex flex-col items-center text-center gap-6 w-full max-w-xs">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.15))",
                border: "1.5px solid rgba(99,102,241,0.4)",
                boxShadow: "0 0 40px rgba(99,102,241,0.25)",
                animation: "d5OrbitPulse 2.5s ease-in-out infinite",
              }}
            >
              <Moon size={36} style={{ color: "#a78bfa" }} />
            </div>

            <div className="space-y-2">
              <p
                className="text-[9px] uppercase tracking-widest font-bold"
                style={{ color: "rgba(99,102,241,0.7)" }}
              >
                Day 5 · Sectograph
              </p>
              <h2
                className="text-2xl font-bold leading-tight"
                style={{ color: "#f5f5ff", fontFamily: "'Orbitron', sans-serif" }}
              >
                Map Your<br />Foundation
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "rgba(245,245,255,0.55)" }}
              >
                Your Sectograph holds your time. Today, lock in two anchors that shape every future day.
              </p>
            </div>

            <div className="w-full space-y-2 mt-2">
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.15)" }}>
                  <Moon size={14} style={{ color: "#60a5fa" }} />
                </div>
                <p className="text-xs font-medium" style={{ color: "rgba(245,245,255,0.8)" }}>
                  Schedule your Sleep window
                </p>
              </div>
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(168,85,247,0.15)" }}>
                  <Zap size={14} style={{ color: "#c084fc" }} />
                </div>
                <p className="text-xs font-medium" style={{ color: "rgba(245,245,255,0.8)" }}>
                  Schedule your Daily Flow session
                </p>
              </div>
            </div>

            <button
              data-testid="button-d5-intro-start"
              onClick={() => {
                localStorage.setItem("ascend_day5_sectograph_intro_seen", "true");
                setDay5IntroSeen(true);
              }}
              className="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2 mt-2"
              style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                color: "#fff",
                boxShadow: "0 4px 24px rgba(99,102,241,0.4)",
              }}
            >
              <Zap size={16} />
              Begin Mapping
            </button>
          </div>
        </div>
      )}

      {/* ── DAY 5 · STEP 3: COMPLETION OVERLAY ────────────────────── */}
      {isDay5Mode && day5Step === 3 && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
          style={{ background: "rgba(5,5,20,0.96)" }}
          data-testid="day5-complete-overlay"
        >
          <style>{`
            @keyframes d5CompleteFade { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
            @keyframes d5CheckBounce { 0%,100% { transform:scale(1); } 40% { transform:scale(1.3); } 70% { transform:scale(0.95); } }
            @keyframes d5GlowPulse { 0%,100% { box-shadow: 0 0 40px rgba(34,197,94,0.3); } 50% { box-shadow: 0 0 70px rgba(34,197,94,0.5); } }
          `}</style>
          <div
            style={{ animation: "d5CompleteFade 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}
            className="flex flex-col items-center text-center gap-6 w-full max-w-xs"
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.12))",
                border: "2px solid rgba(34,197,94,0.4)",
                animation: "d5GlowPulse 2.5s ease-in-out infinite",
              }}
            >
              <CheckCircle2
                size={44}
                style={{ color: "#22c55e", animation: "d5CheckBounce 0.6s 0.2s ease both" }}
              />
            </div>

            <div className="space-y-2">
              <p
                className="text-[9px] uppercase tracking-widest font-bold"
                style={{ color: "rgba(34,197,94,0.7)" }}
              >
                Day 5 · Foundation Mapped
              </p>
              <h2
                className="text-3xl font-bold leading-tight"
                style={{ color: "#f5f5ff", fontFamily: "'Orbitron', sans-serif" }}
              >
                Timeline<br />Locked In
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "rgba(245,245,255,0.55)" }}
              >
                Both anchors are set. Your behavioral foundation is now part of the system.
              </p>
            </div>

            <div className="w-full space-y-2">
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}
              >
                <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
                <p className="text-xs font-medium" style={{ color: "#22c55e" }}>Sleep window — scheduled</p>
              </div>
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}
              >
                <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
                <p className="text-xs font-medium" style={{ color: "#22c55e" }}>Daily Flow — scheduled</p>
              </div>
            </div>

            <button
              data-testid="button-d5-complete-return"
              onClick={() => navigate("/")}
              className="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2 mt-2"
              style={{
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#fff",
                boxShadow: "0 4px 24px rgba(34,197,94,0.4)",
              }}
            >
              <CheckCircle2 size={16} />
              Return to Complete Day 5
            </button>
          </div>
        </div>
      )}
    </SystemLayout>
  );
}
