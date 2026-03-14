import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SystemLayout } from "@/components/game/SystemLayout";
import { Sectograph, type ScheduleBlock } from "@/components/game/Sectograph";
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
  Circle,
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

  const schedule: ScheduleBlock[] = player?.schedule?.length
    ? (player.schedule as ScheduleBlock[])
    : [];

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
          style={{ backgroundColor: `${colors.surface}`, border: `1px solid ${colors.surfaceBorder}` }}
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

        {activeTab === "sectograph" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex justify-center pt-2">
              <Sectograph
                schedule={schedule}
                size={300}
                onCenterClick={() => navigate("/schedule")}
              />
            </div>
            <div
              className="w-full rounded-lg p-4"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
            >
              <h3 className="text-xs font-display font-bold tracking-wider mb-3" style={{ color: colors.textMuted }}>
                TODAY'S BLOCKS
              </h3>
              {schedule.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: colors.textMuted }}>
                  No schedule blocks yet. Use the schedule editor to add blocks.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {schedule
                    .filter(b => !b.isTemplate || b.isTemplate)
                    .sort((a, b) => a.startHour - b.startHour)
                    .map((block) => {
                      const startH = block.startHour % 12 || 12;
                      const startP = block.startHour < 12 ? "AM" : "PM";
                      const endH = block.endHour % 12 || 12;
                      const endP = block.endHour < 12 ? "AM" : "PM";
                      const startMin = (block.startMinute ?? 0).toString().padStart(2, '0');
                      const endMin = (block.endMinute ?? 0).toString().padStart(2, '0');
                      return (
                        <div
                          key={block.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg"
                          style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
                          data-testid={`block-item-${block.id}`}
                        >
                          <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: block.color }} />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block" style={{ color: colors.text }}>
                              {block.name}
                            </span>
                            <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                              {startH}:{startMin} {startP} — {endH}:{endMin} {endP}
                            </span>
                          </div>
                          {block.isSystemTask && (
                            <Circle size={6} fill={colors.primary} stroke="none" className="flex-shrink-0 opacity-60" />
                          )}
                        </div>
                      );
                    })}
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
                  const dayBlocks = schedule.filter(b => !b.isTemplate || b.isTemplate);

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
                          {isToday && dayBlocks.length > 0 ? (
                            <span className="text-[10px]" style={{ color: colors.textMuted }}>
                              {dayBlocks.length} schedule block{dayBlocks.length !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-[10px]" style={{ color: colors.textMuted }}>No events</span>
                          )}
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
      </div>
    </SystemLayout>
  );
}
