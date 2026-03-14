import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SystemLayout } from "@/components/game/SystemLayout";
import { Sectograph, DEFAULT_SEGMENTS, detectFreeWindows, type ScheduleBlock, type FreeWindow, type BehavioralAnchor, type ActiveFocusBlock, type RhythmWindowVisual } from "@/components/game/Sectograph";
import { useTheme } from "@/context/ThemeContext";
import { useGame } from "@/context/GameContext";
import { apiRequest } from "@/lib/queryClient";
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
  Play,
  Pause,
  X,
  Target,
  Activity,
} from "lucide-react";
import type { CalendarEvent } from "@shared/schema";

type ViewTab = "sectograph" | "calendar" | "week";

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
  const { player } = useGame();
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

  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDates = getWeekDates();

  const tabs: { id: ViewTab; label: string }[] = [
    { id: "sectograph", label: "Timeline" },
    { id: "calendar", label: "Calendar" },
    { id: "week", label: "Week" },
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

        <div
          className="flex rounded-lg p-0.5"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2 text-xs font-display font-bold tracking-wider rounded-md transition-all"
              style={{
                backgroundColor: activeTab === tab.id ? `${colors.primary}25` : "transparent",
                color: activeTab === tab.id ? colors.primary : colors.textMuted,
                border: activeTab === tab.id ? `1px solid ${colors.primary}40` : "1px solid transparent",
              }}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {showIntroOverlay && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
            onClick={dismissIntro}
            data-testid="sectograph-intro-overlay"
          >
            <div
              className="mx-6 max-w-sm rounded-xl p-6 text-center"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${colors.primary}20` }}>
                <Clock size={24} style={{ color: colors.primary }} />
              </div>
              <h2 className="text-lg font-display font-bold mb-2" style={{ color: colors.text }}>
                Your Time System
              </h2>
              {behavioralAnchors.length > 0 ? (
                <div className="space-y-3 mb-5">
                  <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>
                    Your previous resets appear here. The system has been learning when you naturally show up.
                  </p>
                  <div
                    className="rounded-lg p-3 text-left"
                    style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
                      <span className="text-xs font-bold" style={{ color: "#f59e0b" }}>
                        {behavioralAnchors.length} Reset{behavioralAnchors.length > 1 ? "s" : ""} Recorded
                      </span>
                    </div>
                    {anchorClusterInsight && (
                      <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>
                        {anchorClusterInsight}
                      </p>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: colors.textMuted, opacity: 0.7 }}>
                    These markers connect your earlier actions to this larger time system. Your behavior was always part of the structure.
                  </p>
                </div>
              ) : (
                <p className="text-sm leading-relaxed mb-4" style={{ color: colors.textMuted }}>
                  The Sectograph maps your entire day as a 24-hour circle. Watch your schedule unfold in real time, spot free windows, and build focused sessions into your rhythm.
                </p>
              )}
              <div className="space-y-2 text-left mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e" }} />
                  <span className="text-xs" style={{ color: colors.textMuted }}>Green dot tracks present moment</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
                  <span className="text-xs" style={{ color: colors.textMuted }}>Amber marks show your Reset moments</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#8b5cf6" }} />
                  <span className="text-xs" style={{ color: colors.textMuted }}>Purple blocks are active focus sessions</span>
                </div>
              </div>
              <Button
                onClick={dismissIntro}
                className="w-full"
                style={{ backgroundColor: colors.primary, color: "#fff" }}
                data-testid="button-dismiss-intro"
              >
                Begin Observing
              </Button>
            </div>
          </div>
        )}

        {activeTab === "sectograph" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex justify-center pt-2">
              <Sectograph
                schedule={activeSchedule}
                size={300}
                showAwareness={true}
                anchors={behavioralAnchors}
                focusBlock={activeFocus?.block ?? null}
                rhythmWindows={rhythmWindows}
                onCenterClick={() => navigate("/schedule")}
                onFreeWindowClick={(w) => {
                  setFocusDuration(Math.min(w.durationMinutes, 30));
                  setShowFocusSetup(true);
                }}
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

            {!activeFocus && (
              <button
                onClick={() => setShowFocusSetup(true)}
                className="w-full rounded-lg p-3 flex items-center gap-3 transition-all hover:scale-[1.01]"
                style={{
                  backgroundColor: "rgba(139,92,246,0.08)",
                  border: "1px solid rgba(139,92,246,0.2)",
                }}
                data-testid="button-start-focus"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(139,92,246,0.15)" }}>
                  <Target size={14} style={{ color: "#8b5cf6" }} />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium block" style={{ color: colors.text }}>Start Focus Session</span>
                  <span className="text-[10px]" style={{ color: colors.textMuted }}>Block time on your timeline</span>
                </div>
              </button>
            )}

            {awarenessInsight && (
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

            {rhythmInsights.length > 0 && (
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

            {behavioralAnchors.length > 0 && (
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

            <div
              className="w-full rounded-lg p-4"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-display font-bold tracking-wider" style={{ color: colors.textMuted }}>
                  TIME SEGMENTS
                </h3>
                <div className="flex items-center gap-1">
                  <Eye size={10} style={{ color: colors.textMuted, opacity: 0.5 }} />
                  <span className="text-[9px]" style={{ color: colors.textMuted, opacity: 0.5 }}>
                    {hasCustomSchedule ? "Your schedule" : "Default layout"}
                  </span>
                </div>
              </div>

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
                        className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
                        style={{
                          backgroundColor: isCurrent ? `${colors.primary}12` : "rgba(0,0,0,0.2)",
                          border: isCurrent ? `1px solid ${colors.primary}25` : "1px solid transparent",
                        }}
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
            </div>
          </div>
        )}

        {activeTab === "calendar" && (
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

        {activeTab === "week" && (
          <div className="flex flex-col gap-3">
            <div
              className="rounded-lg p-3"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
            >
              <h3 className="text-xs font-display font-bold tracking-wider mb-3" style={{ color: colors.textMuted }}>
                WEEK OVERVIEW
              </h3>
              <div className="space-y-2">
                {weekDates.map((date) => {
                  const dateKey = formatDateKey(date);
                  const dayEvents = getEventsForDate(dateKey);
                  const isToday = dateKey === todayKey;

                  return (
                    <div
                      key={dateKey}
                      className="rounded-lg p-3 transition-all"
                      style={{
                        backgroundColor: isToday ? `${colors.primary}10` : "rgba(0,0,0,0.15)",
                        border: isToday ? `1px solid ${colors.primary}30` : "1px solid transparent",
                      }}
                      data-testid={`week-day-${dateKey}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-xs font-display font-bold"
                          style={{ color: isToday ? colors.primary : colors.text }}
                        >
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          <span className="font-mono ml-2 opacity-60">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </span>
                        {isToday && (
                          <span
                            className="text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wider"
                            style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
                          >
                            TODAY
                          </span>
                        )}
                      </div>

                      {dayEvents.length > 0 ? (
                        <div className="space-y-1 mt-1.5">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div key={event.id} className="flex items-center gap-2">
                              <div className="w-1 h-4 rounded-full" style={{ backgroundColor: event.color }} />
                              <span className="text-[11px] truncate" style={{ color: colors.text }}>{event.title}</span>
                              <span className="text-[9px] font-mono ml-auto flex-shrink-0" style={{ color: colors.textMuted }}>
                                {event.startTime}
                              </span>
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[9px] pl-3" style={{ color: colors.textMuted }}>
                              +{dayEvents.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px]" style={{ color: colors.textMuted }}>No events</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
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
      </div>
    </SystemLayout>
  );
}
