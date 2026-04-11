import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SystemLayout } from "@/components/game/SystemLayout";
import { Sectograph, DEFAULT_SEGMENTS, detectFreeWindows, type ScheduleBlock, type FreeWindow, type BehavioralAnchor, type ActiveFocusBlock, type RhythmWindowVisual, type SuggestedPlacement } from "@/components/game/Sectograph";
import { useTheme } from "@/context/ThemeContext";
import { useGame } from "@/context/GameContext";
import { useRoles } from "@/context/RolesContext";
import { useWeeklyGoals } from "@/context/WeeklyGoalsContext";
import { apiRequest } from "@/lib/queryClient";
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
  Wind,
  Heart,
  Dumbbell,
  Settings2,
  Brain,
  CheckCircle2,
} from "lucide-react";
import type { CalendarEvent } from "@shared/schema";
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
  { id: "strength", name: "Strength", icon: Dumbbell, color: "#ef4444", defaultStart: { h: 7, m: 0 }, defaultEnd: { h: 7, m: 45 } },
  { id: "agility", name: "Agility", icon: Wind, color: "#22c55e", defaultStart: { h: 7, m: 45 }, defaultEnd: { h: 8, m: 15 } },
  { id: "vitality", name: "Vitality", icon: Heart, color: "#a855f7", defaultStart: { h: 8, m: 15 }, defaultEnd: { h: 8, m: 30 } },
  { id: "daily-flow", name: "Daily Flow", icon: Zap, color: "#a855f7", defaultStart: { h: 7, m: 0 }, defaultEnd: { h: 8, m: 0 } },
  { id: "meal", name: "Meal", icon: Coffee, color: "#7d9d6a", defaultStart: { h: 12, m: 0 }, defaultEnd: { h: 13, m: 0 } },
  { id: "leisure", name: "Leisure", icon: Gamepad2, color: "#8b7aa3", defaultStart: { h: 20, m: 0 }, defaultEnd: { h: 22, m: 0 } },
  { id: "custom", name: "Custom", icon: Zap, color: "#6b7280", defaultStart: { h: 9, m: 0 }, defaultEnd: { h: 10, m: 0 } },
];

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

export default function SectographPage() {
  const [, navigate] = useLocation();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const { player, updatePlayer } = useGame();
  const queryClient = useQueryClient();

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
  const [focusDuration, setFocusDuration] = useState(15);
  const [showFocusSetup, setShowFocusSetup] = useState(false);
  const [activeFocus, setActiveFocus] = useState<{ block: ActiveFocusBlock; endTime: number; label: string } | null>(null);
  const [focusRemaining, setFocusRemaining] = useState(0);
  const [focusPaused, setFocusPaused] = useState(false);

  const [showAddBlock, setShowAddBlock] = useState(false);
  const [editingBlock, setEditingBlock] = useState<EditingBlock | null>(null);
  const [customBlockName, setCustomBlockName] = useState("");
  const [showSegments, setShowSegments] = useState(true);

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

  const dismissIntro = useCallback(() => {
    localStorage.setItem("ascend_sectograph_intro_seen", "1");
    setShowIntroOverlay(false);
  }, []);

  useEffect(() => {
    if (!activeFocus || focusPaused) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, activeFocus.endTime - Date.now());
      setFocusRemaining(remaining);
      if (remaining <= 0) {
        setActiveFocus(null);
        setFocusRemaining(0);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeFocus, focusPaused]);

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

  const focusMutation = useMutation({
    mutationFn: async (data: { durationMinutes: number; label?: string }) => {
      const res = await apiRequest("POST", `/api/player/${player?.id}/start-focus-session`, data);
      return res.json();
    },
    onSuccess: (data: any) => {
      const now = new Date();
      const block: ActiveFocusBlock = {
        startHour: now.getHours(),
        startMinute: now.getMinutes(),
        durationMinutes: data.durationMinutes,
      };
      setActiveFocus({
        block,
        endTime: Date.now() + data.durationMinutes * 60 * 1000,
        label: "Focus Session",
      });
      setFocusRemaining(data.durationMinutes * 60 * 1000);
      setShowFocusSetup(false);
      queryClient.invalidateQueries({ queryKey: ["behavioral-anchors"] });
      queryClient.invalidateQueries({ queryKey: ["rhythm"] });
    },
  });

  const startFocusSession = () => {
    if (!player?.id) return;
    focusMutation.mutate({ durationMinutes: focusDuration });
  };

  const cancelFocus = () => {
    setActiveFocus(null);
    setFocusRemaining(0);
    setFocusPaused(false);
  };

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
        isSystemTask: ["strength", "agility", "vitality", "work", "study"].includes(preset.id),
        isNew: true,
      });
      if (preset.id === "custom") setCustomBlockName("");
    }
    setShowAddBlock(false);
  };

  const handleSaveBlock = () => {
    if (!editingBlock || !player) return;
    const name = editingBlock.id.startsWith("custom") ? (customBlockName || "Custom Block") : editingBlock.name;
    const blockFinal = { ...editingBlock, name };
    delete (blockFinal as any).isNew;
    const current: ScheduleBlock[] = (player.schedule ?? []) as ScheduleBlock[];
    // System preset IDs that should be deduplicated (only one per type allowed)
    const SYSTEM_PRESET_PREFIXES = ["sleep", "daily", "work", "study", "exercise", "meal", "morning", "evening"];
    const blockTypePrefix = blockFinal.id.split("_")[0];
    const isSystemPreset = SYSTEM_PRESET_PREFIXES.includes(blockTypePrefix);
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

    if (isSleepBlock && !tutorialDone) {
      markSectographTutorialDone();
      setTutorialDone(true);
      setTutorialStep(99);
      setJustCompletedTutorial(true);
      window.dispatchEvent(new CustomEvent("ascend:sectograph-tutorial-done"));
      setTimeout(() => navigate("/"), 2200);
    }
  };

  const handleDeleteBlock = () => {
    if (!editingBlock || !player) return;
    const current: ScheduleBlock[] = (player.schedule ?? []) as ScheduleBlock[];
    const newSchedule = current.filter((b: any) => b.id !== editingBlock.id);
    updatePlayer({ schedule: newSchedule });
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

  const activeSchedule: ScheduleBlock[] = player?.schedule?.length
    ? (player.schedule as ScheduleBlock[])
    : DEFAULT_SEGMENTS;

  const hasCustomSchedule = (player?.schedule as any[])?.length > 0;

  const freeWindows = useMemo(() => detectFreeWindows(activeSchedule, 30), [activeSchedule]);
  const awarenessInsight = useMemo(() => getAwarenessInsight(activeSchedule, freeWindows), [activeSchedule, freeWindows]);

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
          <div className="w-14" />
        </div>


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
            className="fixed inset-0 z-50 flex items-end justify-center pb-8"
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
              <p className="text-[9px] uppercase tracking-wider font-bold mb-0.5" style={{ color: "rgba(59,130,246,0.7)" }}>Coach · Step 1</p>
              <p className="text-sm font-medium leading-snug" style={{ color: colors.text }}>
                Start with your <span style={{ color: "#3b4d6b", fontWeight: 700 }}>Sleep</span> block
              </p>
              <p className="text-[10px] mt-1 leading-relaxed" style={{ color: colors.textMuted }}>
                Tap the <strong style={{ color: colors.primary }}>+</strong> in the center of the clock, then select Sleep and set your hours.
              </p>
            </div>
            <Moon size={14} style={{ color: "#3b4d6b", marginTop: 2 }} />
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
            <div className="flex justify-center pt-2">
              <Sectograph
                schedule={activeSchedule}
                size={300}
                showAwareness={true}
                anchors={[]}
                focusBlock={activeFocus?.block ?? null}
                rhythmWindows={[]}
                suggestedPlacements={[]}
                highlightCenter={day5Step === 1}
                onCenterClick={() => {
                  if (!isDay5Mode && !tutorialDone && tutorialStep === 0) {
                    setSectographTutorialStep(1);
                    setTutorialStep(1);
                  }
                  setShowAddBlock(true);
                }}
                onBlockClick={(block) => {
                  const blk = block as any;
                  setEditingBlock({
                    id: blk.id,
                    name: blk.name || blk.label || "",
                    startHour: blk.startHour,
                    startMinute: blk.startMinute ?? 0,
                    endHour: blk.endHour,
                    endMinute: blk.endMinute ?? 0,
                    color: blk.color || "#6b7280",
                    isSystemTask: blk.isSystemTask,
                    isNew: false,
                  });
                }}
                onFreeWindowClick={(w) => {
                  setFocusDuration(Math.min(w.durationMinutes, 30));
                  setShowFocusSetup(true);
                }}
                onSuggestedPlacementClick={() => {}}
              />
            </div>

            {activeFocus && (
              <div
                className="w-full rounded-lg p-3"
                style={{
                  backgroundColor: "rgba(139,92,246,0.1)",
                  border: "1px solid rgba(139,92,246,0.3)",
                }}
                data-testid="active-focus-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target size={14} style={{ color: "#8b5cf6" }} />
                    <span className="text-sm font-bold" style={{ color: colors.text }}>Focus Active</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setFocusPaused(!focusPaused)}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10"
                      data-testid="button-pause-focus"
                    >
                      {focusPaused ? <Play size={12} style={{ color: "#8b5cf6" }} /> : <Pause size={12} style={{ color: "#8b5cf6" }} />}
                    </button>
                    <button
                      onClick={cancelFocus}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10"
                      data-testid="button-cancel-focus"
                    >
                      <X size={12} style={{ color: colors.textMuted }} />
                    </button>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold" style={{ color: "#8b5cf6" }}>
                    {Math.floor(focusRemaining / 60000)}:{String(Math.floor((focusRemaining % 60000) / 1000)).padStart(2, '0')}
                  </span>
                  <span className="text-xs" style={{ color: colors.textMuted }}>remaining</span>
                </div>
                <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(139,92,246,0.2)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      backgroundColor: "#8b5cf6",
                      width: `${activeFocus ? ((1 - focusRemaining / (activeFocus.block.durationMinutes * 60 * 1000)) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}


            {!isDay5Mode && awarenessInsight && (
              <div
                className="w-full rounded-lg p-3 flex items-start gap-3"
                style={{
                  backgroundColor: `${colors.primary}08`,
                  border: `1px solid ${colors.primary}20`,
                }}
                data-testid="awareness-insight"
              >
                <Sparkles size={14} className="flex-shrink-0 mt-0.5" style={{ color: colors.primary, opacity: 0.7 }} />
                <p className="text-xs leading-relaxed" style={{ color: colors.text, opacity: 0.85 }}>
                  {awarenessInsight}
                </p>
              </div>
            )}

            {!isDay5Mode && rhythmInsights.length > 0 && (
              <div
                className="w-full rounded-lg p-4"
                style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
                data-testid="rhythm-insights-card"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={12} style={{ color: "#6366f1" }} />
                  <h3 className="text-xs font-display font-bold tracking-wider" style={{ color: "#6366f1" }}>
                    RHYTHM DETECTED
                  </h3>
                </div>
                <div className="space-y-2">
                  {rhythmInsights.slice(0, 2).map((insight, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 px-3 py-2 rounded-lg"
                      style={{ backgroundColor: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}
                      data-testid={`rhythm-insight-${i}`}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{
                          backgroundColor: insight.actionType === "reset" ? "#f59e0b" : insight.actionType === "focusSession" ? "#8b5cf6" : insight.actionType === "habit" ? "#3b82f6" : "#6366f1",
                        }}
                      />
                      <div>
                        <p className="text-xs leading-relaxed" style={{ color: colors.text, opacity: 0.85 }}>
                          {insight.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1 rounded-full flex-1" style={{ backgroundColor: "rgba(99,102,241,0.15)" }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.round(insight.confidenceScore * 100)}%`, backgroundColor: "rgba(99,102,241,0.5)" }}
                            />
                          </div>
                          <span className="text-[9px] font-mono" style={{ color: colors.textMuted, opacity: 0.5 }}>
                            {Math.round(insight.confidenceScore * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {rhythmWindows.length > 0 && (
                  <p className="text-[10px] mt-3 leading-relaxed" style={{ color: colors.textMuted, opacity: 0.5 }}>
                    Glowing arcs on the timeline show where your rhythms are strongest.
                  </p>
                )}
              </div>
            )}

            {!isDay5Mode && behavioralAnchors.length > 0 && (
              <div
                className="w-full rounded-lg p-4"
                style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
                data-testid="anchors-card"
              >
                <h3 className="text-xs font-display font-bold tracking-wider mb-2" style={{ color: "#f59e0b" }}>
                  RESET MARKERS
                </h3>
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
                    {hasCustomSchedule ? "Your schedule" : "Default layout"}
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
                          <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                            {formatTimeSlot(block.startHour, block.startMinute ?? 0)} — {formatTimeSlot(block.endHour, block.endMinute ?? 0)}
                          </span>
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
                            const current = (player?.schedule ?? []) as any[];
                            updatePlayer({ schedule: current.filter((b: any) => b.id !== block.id) });
                          }}
                          className="flex-shrink-0 p-1 rounded opacity-40 hover:opacity-100 transition-opacity"
                          style={{ color: "#ef4444" }}
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
                  className="mt-4 p-3 rounded-lg text-center"
                  style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
                  data-testid="observe-hint"
                >
                  <p className="text-[11px] leading-relaxed" style={{ color: colors.textMuted }}>
                    This is a default day layout. Observe how your actual day flows.
                    <br />
                    <span style={{ opacity: 0.6 }}>Schedule editing unlocks as you build consistency.</span>
                  </p>
                </div>
              )}
            </div>}
          </div>

        {activeTab === "calendar-removed" && (
          <div className="flex flex-col gap-4">
            <div
              className="rounded-lg p-3"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="p-1 rounded hover:bg-white/10" data-testid="button-prev-month">
                  <ChevronLeft size={18} style={{ color: colors.primary }} />
                </button>
                <span className="font-display font-bold text-sm" style={{ color: colors.text }}>
                  {monthName}
                </span>
                <button onClick={nextMonth} className="p-1 rounded hover:bg-white/10" data-testid="button-next-month">
                  <ChevronRight size={18} style={{ color: colors.primary }} />
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

                {selectedEvents.length === 0 ? (
                  <div className="p-6 text-center">
                    <CalendarDays size={24} className="mx-auto mb-2 opacity-30" style={{ color: colors.textMuted }} />
                    <p className="text-xs" style={{ color: colors.textMuted }}>No events for this day</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1.5">
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

        {activeTab === "plan-removed" && (
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
        <Dialog open={showFocusSetup} onOpenChange={setShowFocusSetup}>
          <DialogContent className="max-w-xs border-white/10" style={{ backgroundColor: colors.surface }}>
            <DialogHeader>
              <DialogTitle className="text-base font-display" style={{ color: colors.text }}>
                <Target size={16} className="inline mr-2" style={{ color: "#8b5cf6" }} />
                Focus Session
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-2" style={{ color: colors.textMuted }}>
                  Duration
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15, 25, 30, 45, 60].map(d => (
                    <button
                      key={d}
                      onClick={() => setFocusDuration(d)}
                      className="flex-1 py-2 rounded text-xs font-mono font-bold transition-all"
                      style={{
                        backgroundColor: focusDuration === d ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)",
                        color: focusDuration === d ? "#8b5cf6" : colors.textMuted,
                        border: `1px solid ${focusDuration === d ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.1)"}`,
                      }}
                      data-testid={`button-focus-${d}`}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: colors.textMuted }}>
                A {focusDuration}-minute focus block will appear on your timeline. Stay present with the task at hand.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={startFocusSession}
                  className="flex-1"
                  style={{ backgroundColor: "#8b5cf6", color: "#fff" }}
                  disabled={focusMutation.isPending}
                  data-testid="button-confirm-focus"
                >
                  <Play size={12} className="mr-1" />
                  {focusMutation.isPending ? "Starting..." : "Begin Focus"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFocusSetup(false)}
                  className="border-white/10"
                  data-testid="button-cancel-focus-setup"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── ADD BLOCK — preset picker ─────────────────────────── */}
        <Dialog open={showAddBlock} onOpenChange={setShowAddBlock}>
          <DialogContent className="max-w-sm border-white/10" style={{ backgroundColor: colors.surface }}>
            <DialogHeader>
              <DialogTitle className="text-sm font-display font-bold" style={{ color: colors.text }}>
                Add Time Block
              </DialogTitle>
            </DialogHeader>
            <p className="text-[11px] mb-3" style={{ color: colors.textMuted }}>
              Choose a block type to add to your timeline
            </p>
            <div className="grid grid-cols-5 gap-2">
              {BLOCK_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isHighlighted =
                  isDay5Mode &&
                  ((day5Step === 1 && preset.id === "sleep") ||
                   (day5Step === 2 && preset.id === "daily-flow"));
                return (
                  <button
                    key={preset.id}
                    data-testid={`preset-${preset.id}`}
                    onClick={() => handlePresetClick(preset)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all active:scale-95"
                    style={{
                      backgroundColor: isHighlighted ? `${preset.color}25` : `${preset.color}15`,
                      border: isHighlighted ? `2px solid ${preset.color}` : `1px solid ${preset.color}30`,
                      boxShadow: isHighlighted ? `0 0 12px ${preset.color}60, 0 0 4px ${preset.color}30 inset` : "none",
                      transform: isHighlighted ? "scale(1.08)" : "scale(1)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${preset.color}25` }}
                    >
                      <Icon size={16} style={{ color: preset.color }} />
                    </div>
                    <span className="text-[9px] font-medium text-center leading-tight" style={{ color: preset.color }}>
                      {preset.name}
                    </span>
                    {isHighlighted && (
                      <span className="text-[7px] font-bold leading-none" style={{ color: preset.color, opacity: 0.85 }}>
                        ← tap
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
                {editingBlock.id.startsWith("custom") && (
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
                <div className="flex gap-2 pt-1">
                  <div
                    className="w-5 h-5 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: editingBlock.color }}
                  />
                  <span className="text-sm font-medium" style={{ color: colors.text }}>
                    {editingBlock.id.startsWith("custom") ? (customBlockName || "Custom Block") : editingBlock.name}
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
