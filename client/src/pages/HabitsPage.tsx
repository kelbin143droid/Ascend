import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useLanguage } from "@/context/LanguageStageContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Flame,
  Plus,
  Pencil,
  Trash2,
  Check,
  Trophy,
  X,
  Clock,
  Shield,
  ShieldOff,
  ChevronDown,
  ChevronUp,
  Zap,
  Eye,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  SkipForward,
} from "lucide-react";
import type { Habit, Badge, BadHabit } from "@shared/schema";
import { TaskCompletionBurst } from "@/components/game/MicroRewards";

const STAT_COLORS: Record<string, string> = {
  strength: "#ef4444",
  agility: "#22c55e",
  sense: "#3b82f6",
  vitality: "#f59e0b",
};

const STAT_ICONS: Record<string, string> = {
  strength: "💪",
  agility: "⚡",
  sense: "🧘",
  vitality: "❤️",
};

const DIFFICULTY_LABELS = ["", "Micro", "Light", "Standard", "Intense", "Master"];

const BAD_HABIT_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "substance", label: "Substance" },
  { value: "digital", label: "Digital / Screen" },
  { value: "food", label: "Food & Eating" },
  { value: "procrastination", label: "Procrastination" },
  { value: "social", label: "Social Patterns" },
  { value: "sleep", label: "Sleep Disruption" },
];

interface CompletionResult {
  habit: Habit;
  xpEarned: number;
  bonusXP: number;
  dailyBonus: number;
  weeklyBonus: number;
  newBadges: Badge[];
  streakInfo: { current: number; longest: number };
  visuals?: {
    particleType: string;
    auraPulseColor: string;
    celebrationLevel: "minimal" | "moderate" | "epic";
  };
  stability?: { score: number; delta: number; state: string };
}

function formatScheduledTime(hour: number | null | undefined, minute: number | null | undefined): string {
  if (hour == null) return "";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const m = String(minute ?? 0).padStart(2, "0");
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:${m} ${ampm}`;
}

function HabitLoopBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex gap-1.5 items-start">
      <span
        className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {label}
      </span>
      <span className="text-[11px] text-gray-300">{value}</span>
    </div>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  const color = streak >= 21 ? "#f59e0b" : streak >= 7 ? "#22c55e" : streak >= 3 ? "#3b82f6" : "#6b7280";
  return (
    <div className="flex items-center gap-1" style={{ color }}>
      <Flame className="w-3 h-3" />
      <span className="text-[11px] font-bold">{streak}</span>
    </div>
  );
}

export default function HabitsPage() {
  const { player } = useGame();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const playerId = player?.id ?? "";

  const [activeTab, setActiveTab] = useState<"build" | "break">("build");

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [formName, setFormName] = useState("");
  const [formStat, setFormStat] = useState("strength");
  const [formDuration, setFormDuration] = useState("3");
  const [formStackAfter, setFormStackAfter] = useState("none");
  const [formCue, setFormCue] = useState("");
  const [formCraving, setFormCraving] = useState("");
  const [formResponse, setFormResponse] = useState("");
  const [formReward, setFormReward] = useState("");
  const [formScheduledHour, setFormScheduledHour] = useState("");
  const [formScheduledMinute, setFormScheduledMinute] = useState("0");
  const [showLoopFields, setShowLoopFields] = useState(false);

  const [showBadHabitForm, setShowBadHabitForm] = useState(false);
  const [editingBadHabit, setEditingBadHabit] = useState<BadHabit | null>(null);
  const [bhName, setBhName] = useState("");
  const [bhTrigger, setBhTrigger] = useState("");
  const [bhCraving, setBhCraving] = useState("");
  const [bhReplacement, setBhReplacement] = useState("");
  const [bhReplacementCue, setBhReplacementCue] = useState("");
  const [bhCategory, setBhCategory] = useState("general");

  const [completionResult, setCompletionResult] = useState<CompletionResult | null>(null);
  const [showBurst, setShowBurst] = useState(false);
  const [showDayClose, setShowDayClose] = useState(false);

  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);
  const [expandedBadHabit, setExpandedBadHabit] = useState<string | null>(null);
  const [avoidedToday, setAvoidedToday] = useState<Set<string>>(new Set());

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/player", playerId, "habits"],
    queryFn: () => apiRequest("GET", `/api/player/${playerId}/habits`).then((r) => r.json()),
    enabled: !!playerId,
  });

  const { data: badHabits = [] } = useQuery<BadHabit[]>({
    queryKey: ["/api/player", playerId, "bad-habits"],
    queryFn: () => apiRequest("GET", `/api/player/${playerId}/bad-habits`).then((r) => r.json()),
    enabled: !!playerId,
  });

  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ["/api/player", playerId, "badges"],
    queryFn: () => apiRequest("GET", `/api/player/${playerId}/badges`).then((r) => r.json()),
    enabled: !!playerId,
  });

  const createHabitMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", `/api/player/${playerId}/habits`, data).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId, "habits"] });
      closeHabitForm();
    },
  });

  const updateHabitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/habits/${id}`, data).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId, "habits"] });
      closeHabitForm();
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/habits/${id}`).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/player", playerId, "habits"] }),
  });

  const completeHabitMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/habits/${id}/complete`).then((r) => r.json()),
    onSuccess: (data: CompletionResult) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId, "habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId] });
      setCompletionResult(data);
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 1200);
    },
  });

  const skipHabitMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/habits/${id}/skip`).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/player", playerId, "habits"] }),
  });

  const createBadHabitMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", `/api/player/${playerId}/bad-habits`, data).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId, "bad-habits"] });
      closeBadHabitForm();
    },
  });

  const updateBadHabitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/bad-habits/${id}`, data).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId, "bad-habits"] });
      closeBadHabitForm();
    },
  });

  const deleteBadHabitMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/bad-habits/${id}`).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/player", playerId, "bad-habits"] }),
  });

  const avoidBadHabitMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/bad-habits/${id}/avoided`).then((r) => r.json()),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId, "bad-habits"] });
      setAvoidedToday((prev) => new Set(prev).add(id));
    },
  });

  if (!player) return null;

  function openAddHabit() {
    setEditingHabit(null);
    setFormName("");
    setFormStat("strength");
    setFormDuration("3");
    setFormStackAfter("none");
    setFormCue("");
    setFormCraving("");
    setFormResponse("");
    setFormReward("");
    setFormScheduledHour("");
    setFormScheduledMinute("0");
    setShowLoopFields(false);
    setShowAddForm(true);
  }

  function openEditHabit(h: Habit) {
    setEditingHabit(h);
    setFormName(h.name);
    setFormStat(h.stat);
    setFormDuration(String(h.baseDurationMinutes));
    setFormStackAfter(h.stackAfterHabitId ?? "none");
    setFormCue(h.cue ?? "");
    setFormCraving(h.craving ?? "");
    setFormResponse(h.response ?? "");
    setFormReward(h.reward ?? "");
    setFormScheduledHour(h.scheduledHour != null ? String(h.scheduledHour) : "");
    setFormScheduledMinute(h.scheduledMinute != null ? String(h.scheduledMinute) : "0");
    setShowLoopFields(!!(h.cue || h.craving || h.response || h.reward));
    setShowAddForm(true);
  }

  function closeHabitForm() {
    setShowAddForm(false);
    setEditingHabit(null);
  }

  function submitHabitForm() {
    if (!formName.trim()) return;
    const scheduledHour = formScheduledHour !== "" ? parseInt(formScheduledHour) : undefined;
    const scheduledMinute = formScheduledHour !== "" ? parseInt(formScheduledMinute) : undefined;
    const data = {
      name: formName.trim(),
      stat: formStat,
      baseDurationMinutes: parseInt(formDuration) || 3,
      currentDurationMinutes: parseInt(formDuration) || 3,
      stackAfterHabitId: formStackAfter === "none" ? undefined : formStackAfter,
      cue: formCue.trim() || undefined,
      craving: formCraving.trim() || undefined,
      response: formResponse.trim() || undefined,
      reward: formReward.trim() || undefined,
      scheduledHour,
      scheduledMinute,
      userId: playerId,
    };
    if (editingHabit) {
      updateHabitMutation.mutate({ id: editingHabit.id, data });
    } else {
      createHabitMutation.mutate(data);
    }
  }

  function openAddBadHabit() {
    setEditingBadHabit(null);
    setBhName("");
    setBhTrigger("");
    setBhCraving("");
    setBhReplacement("");
    setBhReplacementCue("");
    setBhCategory("general");
    setShowBadHabitForm(true);
  }

  function openEditBadHabit(bh: BadHabit) {
    setEditingBadHabit(bh);
    setBhName(bh.name);
    setBhTrigger(bh.trigger ?? "");
    setBhCraving(bh.craving ?? "");
    setBhReplacement(bh.replacementHabit ?? "");
    setBhReplacementCue(bh.replacementCue ?? "");
    setBhCategory(bh.category);
    setShowBadHabitForm(true);
  }

  function closeBadHabitForm() {
    setShowBadHabitForm(false);
    setEditingBadHabit(null);
  }

  function submitBadHabitForm() {
    if (!bhName.trim()) return;
    const data = {
      name: bhName.trim(),
      trigger: bhTrigger.trim() || undefined,
      craving: bhCraving.trim() || undefined,
      replacementHabit: bhReplacement.trim() || undefined,
      replacementCue: bhReplacementCue.trim() || undefined,
      category: bhCategory,
      userId: playerId,
    };
    if (editingBadHabit) {
      updateBadHabitMutation.mutate({ id: editingBadHabit.id, data });
    } else {
      createBadHabitMutation.mutate(data);
    }
  }

  const today = new Date().toLocaleDateString("en-CA");
  const activeHabits = habits.filter((h) => h.active);
  const completedTodayIds = new Set(
    activeHabits.filter((h) => h.lastCompletedDate === today).map((h) => h.id)
  );

  const activeBadHabits = badHabits.filter((b) => b.active);
  const totalBadStreakDays = activeBadHabits.reduce((s, b) => s + b.currentStreak, 0);
  const topBadStreak = activeBadHabits.reduce((max, b) => Math.max(max, b.currentStreak), 0);

  const completedCount = completedTodayIds.size;
  const totalCount = activeHabits.length;
  const allDone = totalCount > 0 && completedCount === totalCount;

  return (
    <SystemLayout>
      <div className="p-4 space-y-4 pb-24">
        <TaskCompletionBurst
          stat={completionResult?.habit?.stat ?? "strength"}
          xpEarned={completionResult?.xpEarned ?? 0}
          celebrationLevel={(completionResult?.visuals?.celebrationLevel) ?? "minimal"}
          visible={showBurst}
          onComplete={() => setShowBurst(false)}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-lg font-bold text-white"
              style={{ fontFamily: "'Orbitron', monospace" }}
            >
              {t("Habits")}
            </h1>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Build good. Break bad. Level up.
            </p>
          </div>
          <button
            onClick={activeTab === "build" ? openAddHabit : openAddBadHabit}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-700 hover:border-cyan-500 transition-colors"
            style={{ backgroundColor: "rgba(6,182,212,0.1)" }}
            data-testid="button-add-habit"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg overflow-hidden border border-gray-800">
          <button
            onClick={() => setActiveTab("build")}
            className="flex-1 py-2 text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: activeTab === "build" ? "rgba(6,182,212,0.15)" : "transparent",
              color: activeTab === "build" ? "#22d3ee" : "#6b7280",
              borderRight: "1px solid #1f2937",
            }}
            data-testid="tab-build-habits"
          >
            <Shield className="w-3.5 h-3.5" />
            Build ({activeHabits.length})
          </button>
          <button
            onClick={() => setActiveTab("break")}
            className="flex-1 py-2 text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: activeTab === "break" ? "rgba(239,68,68,0.12)" : "transparent",
              color: activeTab === "break" ? "#f87171" : "#6b7280",
            }}
            data-testid="tab-break-habits"
          >
            <ShieldOff className="w-3.5 h-3.5" />
            Break ({activeBadHabits.length})
          </button>
        </div>

        {/* ── BUILD HABITS TAB ── */}
        {activeTab === "build" && (
          <>
            {/* Daily progress bar */}
            {totalCount > 0 && (
              <div
                className="rounded-lg p-3 border border-gray-800"
                style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
                data-testid="daily-progress"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                    Today's Progress
                  </span>
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: allDone ? "#22c55e" : "#22d3ee" }}
                    data-testid="progress-count"
                  >
                    {completedCount}/{totalCount}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%`,
                      backgroundColor: allDone ? "#22c55e" : "#22d3ee",
                    }}
                  />
                </div>
                {allDone && (
                  <p className="text-[10px] text-green-400 mt-1.5 font-semibold">
                    ✓ All habits complete today!
                  </p>
                )}
              </div>
            )}

            {/* Habit list */}
            {activeHabits.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🌱</div>
                <p className="text-gray-400 text-sm mb-1">No habits yet</p>
                <p className="text-gray-600 text-xs">Tap + to create your first daily habit</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeHabits.map((habit) => {
                  const done = completedTodayIds.has(habit.id);
                  const expanded = expandedHabit === habit.id;
                  const hasLoop = !!(habit.cue || habit.craving || habit.response || habit.reward);
                  const hasSchedule = habit.scheduledHour != null;
                  const statColor = STAT_COLORS[habit.stat] ?? "#6b7280";

                  return (
                    <div
                      key={habit.id}
                      className="rounded-lg border overflow-hidden transition-all"
                      style={{
                        borderColor: done ? `${statColor}40` : "#1f2937",
                        backgroundColor: done ? `${statColor}08` : "rgba(0,0,0,0.3)",
                      }}
                      data-testid={`habit-card-${habit.id}`}
                    >
                      <div className="p-3">
                        <div className="flex items-center gap-3">
                          {/* Complete button */}
                          <button
                            onClick={() => !done && completeHabitMutation.mutate(habit.id)}
                            disabled={done || completeHabitMutation.isPending}
                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all"
                            style={{
                              borderColor: done ? statColor : "#374151",
                              backgroundColor: done ? `${statColor}20` : "transparent",
                            }}
                            data-testid={`button-complete-habit-${habit.id}`}
                          >
                            {done ? (
                              <Check className="w-4 h-4" style={{ color: statColor }} />
                            ) : (
                              <span style={{ color: statColor, fontSize: 16 }}>
                                {STAT_ICONS[habit.stat]}
                              </span>
                            )}
                          </button>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-semibold truncate ${done ? "line-through" : ""}`}
                                style={{ color: done ? "#6b7280" : "#ffffff" }}
                                data-testid={`habit-name-${habit.id}`}
                              >
                                {habit.name}
                              </span>
                              {hasSchedule && (
                                <span className="text-[9px] text-gray-500 flex items-center gap-0.5 flex-shrink-0">
                                  <Clock className="w-2.5 h-2.5" />
                                  {formatScheduledTime(habit.scheduledHour, habit.scheduledMinute)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded"
                                style={{ backgroundColor: `${statColor}20`, color: statColor }}
                              >
                                {habit.stat}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {habit.currentDurationMinutes}m
                              </span>
                              {habit.difficultyLevel > 0 && (
                                <span className="text-[10px] text-gray-600">
                                  {DIFFICULTY_LABELS[habit.difficultyLevel] ?? ""}
                                </span>
                              )}
                              <StreakBadge streak={habit.currentStreak} />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!done && (
                              <button
                                onClick={() => skipHabitMutation.mutate(habit.id)}
                                className="w-7 h-7 rounded flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors"
                                title="Skip today"
                                data-testid={`button-skip-habit-${habit.id}`}
                              >
                                <SkipForward className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setExpandedHabit(expanded ? null : habit.id)}
                              className="w-7 h-7 rounded flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors"
                              data-testid={`button-expand-habit-${habit.id}`}
                            >
                              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {expanded && (
                        <div
                          className="px-3 pb-3 space-y-2 border-t"
                          style={{ borderColor: "#1f2937" }}
                        >
                          {/* Habit Loop */}
                          {hasLoop && (
                            <div className="mt-2 space-y-1.5">
                              <p className="text-[9px] uppercase tracking-wider text-gray-600 font-semibold">
                                Habit Loop
                              </p>
                              <div className="space-y-1">
                                {habit.cue && (
                                  <HabitLoopBadge label="Cue" value={habit.cue} color="#22d3ee" />
                                )}
                                {habit.craving && (
                                  <HabitLoopBadge label="Craving" value={habit.craving} color="#a78bfa" />
                                )}
                                {habit.response && (
                                  <HabitLoopBadge label="Response" value={habit.response} color="#34d399" />
                                )}
                                {habit.reward && (
                                  <HabitLoopBadge label="Reward" value={habit.reward} color="#fbbf24" />
                                )}
                              </div>
                            </div>
                          )}

                          {/* Stats row */}
                          <div className="flex gap-3 mt-2">
                            <div className="text-center">
                              <div className="text-xs font-bold text-white">{habit.currentStreak}</div>
                              <div className="text-[9px] text-gray-600">streak</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs font-bold text-white">{habit.longestStreak}</div>
                              <div className="text-[9px] text-gray-600">best</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs font-bold text-white">{habit.totalCompletions}</div>
                              <div className="text-[9px] text-gray-600">total</div>
                            </div>
                            <div className="flex-1" />
                            <button
                              onClick={() => openEditHabit(habit)}
                              className="text-[10px] text-gray-500 hover:text-cyan-400 transition-colors flex items-center gap-1"
                              data-testid={`button-edit-habit-${habit.id}`}
                            >
                              <Pencil className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => deleteHabitMutation.mutate(habit.id)}
                              className="text-[10px] text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
                              data-testid={`button-delete-habit-${habit.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Badges section */}
            {badges.length > 0 && (
              <div
                className="rounded-lg p-3 border border-gray-800"
                style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
                data-testid="badge-showcase"
              >
                <h2 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Badges ({badges.length})
                </h2>
                <div className="grid grid-cols-2 gap-1.5">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-2 p-2 rounded-lg border border-gray-700/50"
                      style={{ backgroundColor: "rgba(251,191,36,0.05)" }}
                      data-testid={`badge-item-${badge.id}`}
                    >
                      <span className="text-base flex-shrink-0">🏅</span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-white truncate" data-testid={`badge-name-${badge.id}`}>
                          {badge.name}
                        </div>
                        <div className="text-[9px] text-gray-500 truncate">{badge.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── BREAK BAD HABITS TAB ── */}
        {activeTab === "break" && (
          <>
            {/* Stats overview */}
            {activeBadHabits.length > 0 && (
              <div
                className="rounded-lg p-3 border border-red-900/30 grid grid-cols-3 gap-2"
                style={{ backgroundColor: "rgba(127,29,29,0.1)" }}
              >
                <div className="text-center">
                  <div className="text-base font-bold text-red-400">{activeBadHabits.length}</div>
                  <div className="text-[9px] text-gray-500">tracking</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-bold text-amber-400">{topBadStreak}</div>
                  <div className="text-[9px] text-gray-500">best streak</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-bold text-green-400">{totalBadStreakDays}</div>
                  <div className="text-[9px] text-gray-500">days avoided</div>
                </div>
              </div>
            )}

            {activeBadHabits.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🛡️</div>
                <p className="text-gray-400 text-sm mb-1">No bad habits tracked</p>
                <p className="text-gray-600 text-xs">Add patterns you want to break and build replacements</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeBadHabits.map((bh) => {
                  const expanded = expandedBadHabit === bh.id;
                  const hasAvoided = avoidedToday.has(bh.id) || bh.lastAvoidedDate === new Date().toLocaleDateString("en-CA");
                  const hasReplacement = !!(bh.replacementHabit);
                  const streakColor = bh.currentStreak >= 21 ? "#f59e0b" : bh.currentStreak >= 7 ? "#22c55e" : bh.currentStreak >= 3 ? "#3b82f6" : "#ef4444";

                  return (
                    <div
                      key={bh.id}
                      className="rounded-lg border overflow-hidden transition-all"
                      style={{
                        borderColor: hasAvoided ? "#16a34a40" : "#3f1515",
                        backgroundColor: hasAvoided ? "rgba(22,163,74,0.05)" : "rgba(127,29,29,0.08)",
                      }}
                      data-testid={`bad-habit-card-${bh.id}`}
                    >
                      <div className="p-3">
                        <div className="flex items-center gap-3">
                          {/* Avoid button */}
                          <button
                            onClick={() => !hasAvoided && avoidBadHabitMutation.mutate(bh.id)}
                            disabled={hasAvoided || avoidBadHabitMutation.isPending}
                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all"
                            style={{
                              borderColor: hasAvoided ? "#16a34a" : "#7f1d1d",
                              backgroundColor: hasAvoided ? "rgba(22,163,74,0.15)" : "transparent",
                            }}
                            data-testid={`button-avoid-bad-habit-${bh.id}`}
                          >
                            {hasAvoided ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : (
                              <ShieldOff className="w-4 h-4 text-red-400" />
                            )}
                          </button>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-sm font-semibold text-white truncate"
                                data-testid={`bad-habit-name-${bh.id}`}
                              >
                                {bh.name}
                              </span>
                              {hasReplacement && (
                                <span className="text-[9px] text-green-500 flex-shrink-0">→ has plan</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded"
                                style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#f87171" }}
                              >
                                {bh.category}
                              </span>
                              <div className="flex items-center gap-1" style={{ color: streakColor }}>
                                <Flame className="w-3 h-3" />
                                <span className="text-[11px] font-bold">{bh.currentStreak}d</span>
                              </div>
                              <span className="text-[10px] text-gray-600">
                                {bh.totalDaysAvoided} total
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => setExpandedBadHabit(expanded ? null : bh.id)}
                            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-400"
                            data-testid={`button-expand-bad-habit-${bh.id}`}
                          >
                            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {hasAvoided && (
                          <div className="mt-2 text-[10px] text-green-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Marked avoided today
                          </div>
                        )}
                      </div>

                      {expanded && (
                        <div
                          className="px-3 pb-3 space-y-2 border-t"
                          style={{ borderColor: "#2d1515" }}
                        >
                          {/* Habit loop details */}
                          {(bh.trigger || bh.craving) && (
                            <div className="mt-2 space-y-1.5">
                              <p className="text-[9px] uppercase tracking-wider text-gray-600 font-semibold">
                                Pattern
                              </p>
                              {bh.trigger && (
                                <HabitLoopBadge label="Trigger" value={bh.trigger} color="#f87171" />
                              )}
                              {bh.craving && (
                                <HabitLoopBadge label="Craving" value={bh.craving} color="#fb923c" />
                              )}
                            </div>
                          )}
                          {(bh.replacementHabit || bh.replacementCue) && (
                            <div className="space-y-1.5">
                              <p className="text-[9px] uppercase tracking-wider text-gray-600 font-semibold">
                                Replacement Plan
                              </p>
                              {bh.replacementCue && (
                                <HabitLoopBadge label="When" value={bh.replacementCue} color="#34d399" />
                              )}
                              {bh.replacementHabit && (
                                <HabitLoopBadge label="Do Instead" value={bh.replacementHabit} color="#22d3ee" />
                              )}
                            </div>
                          )}
                          {!bh.replacementHabit && (
                            <div className="flex items-center gap-1.5 text-[10px] text-amber-500">
                              <AlertCircle className="w-3 h-3" />
                              Add a replacement habit for better results
                            </div>
                          )}

                          {/* Stats + actions */}
                          <div className="flex gap-3 mt-1 items-center">
                            <div className="text-center">
                              <div className="text-xs font-bold text-white">{bh.currentStreak}</div>
                              <div className="text-[9px] text-gray-600">streak</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs font-bold text-white">{bh.longestStreak}</div>
                              <div className="text-[9px] text-gray-600">best</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs font-bold text-white">{bh.totalDaysAvoided}</div>
                              <div className="text-[9px] text-gray-600">days</div>
                            </div>
                            <div className="flex-1" />
                            <button
                              onClick={() => openEditBadHabit(bh)}
                              className="text-[10px] text-gray-500 hover:text-cyan-400 transition-colors flex items-center gap-1"
                              data-testid={`button-edit-bad-habit-${bh.id}`}
                            >
                              <Pencil className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => deleteBadHabitMutation.mutate(bh.id)}
                              className="text-[10px] text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
                              data-testid={`button-delete-bad-habit-${bh.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Info card */}
            <div
              className="rounded-lg p-3 border border-gray-800"
              style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            >
              <p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold mb-1.5">
                How It Works
              </p>
              <div className="space-y-1.5 text-[11px] text-gray-500">
                <p>• Track each day you avoid the pattern — builds a streak</p>
                <p>• Add a replacement habit to redirect the craving</p>
                <p>• Log the trigger to understand when it happens</p>
                <p>• Ask your Coach for personalized strategies</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── ADD / EDIT HABIT MODAL ── */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="bg-gray-950 border-gray-800 max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, color: "white" }}>
              {editingHabit ? "Edit Habit" : "New Daily Habit"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Name */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1 text-gray-500">Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Morning Pushups"
                className="h-9 bg-black/50 border-gray-700 text-sm text-white"
                data-testid="input-habit-name"
              />
            </div>

            {/* Stat */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1 text-gray-500">Stat</label>
              <Select value={formStat} onValueChange={setFormStat}>
                <SelectTrigger className="h-9 bg-black/50 border-gray-700 text-sm text-white" data-testid="select-habit-stat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="strength">💪 Strength</SelectItem>
                  <SelectItem value="agility">⚡ Agility</SelectItem>
                  <SelectItem value="sense">🧘 Sense</SelectItem>
                  <SelectItem value="vitality">❤️ Vitality</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1 text-gray-500">
                Starting Duration (minutes)
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                className="h-9 bg-black/50 border-gray-700 text-sm text-white"
                data-testid="input-habit-duration"
              />
              <div className="text-[9px] text-gray-600 mt-1">Scales automatically with consistency</div>
            </div>

            {/* Scheduled time */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1 text-gray-500">
                Scheduled Time (optional)
              </label>
              <div className="flex gap-2">
                <Select value={formScheduledHour} onValueChange={setFormScheduledHour}>
                  <SelectTrigger className="h-9 bg-black/50 border-gray-700 text-xs text-white flex-1" data-testid="select-scheduled-hour">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 max-h-48 overflow-y-auto">
                    <SelectItem value="">No time</SelectItem>
                    {Array.from({ length: 24 }, (_, i) => {
                      const label = i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`;
                      return <SelectItem key={i} value={String(i)}>{label}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
                {formScheduledHour !== "" && (
                  <Select value={formScheduledMinute} onValueChange={setFormScheduledMinute}>
                    <SelectTrigger className="h-9 bg-black/50 border-gray-700 text-xs text-white w-20" data-testid="select-scheduled-minute">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="0">:00</SelectItem>
                      <SelectItem value="15">:15</SelectItem>
                      <SelectItem value="30">:30</SelectItem>
                      <SelectItem value="45">:45</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Stack After */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1 text-gray-500">
                Stack After (optional)
              </label>
              <Select value={formStackAfter} onValueChange={setFormStackAfter}>
                <SelectTrigger className="h-9 bg-black/50 border-gray-700 text-sm text-white" data-testid="select-habit-stack-after">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="none">None</SelectItem>
                  {habits.filter((h) => h.id !== editingHabit?.id).map((h) => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Habit Loop toggle */}
            <button
              type="button"
              onClick={() => setShowLoopFields(!showLoopFields)}
              className="w-full flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500 hover:text-cyan-400 transition-colors py-1"
              data-testid="button-toggle-habit-loop"
            >
              <span className="flex items-center gap-1.5">
                <Zap className="w-3 h-3" />
                Habit Loop (cue → craving → response → reward)
              </span>
              {showLoopFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showLoopFields && (
              <div className="space-y-2 pl-2 border-l-2 border-cyan-900">
                <div>
                  <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: "#22d3ee" }}>
                    Cue — What triggers it?
                  </label>
                  <Input
                    value={formCue}
                    onChange={(e) => setFormCue(e.target.value)}
                    placeholder="e.g. After morning alarm"
                    className="h-8 bg-black/50 border-gray-700 text-xs text-white"
                    data-testid="input-habit-cue"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: "#a78bfa" }}>
                    Craving — What feeling do you want?
                  </label>
                  <Input
                    value={formCraving}
                    onChange={(e) => setFormCraving(e.target.value)}
                    placeholder="e.g. Feel energized and alert"
                    className="h-8 bg-black/50 border-gray-700 text-xs text-white"
                    data-testid="input-habit-craving"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: "#34d399" }}>
                    Response — What's the habit exactly?
                  </label>
                  <Input
                    value={formResponse}
                    onChange={(e) => setFormResponse(e.target.value)}
                    placeholder={formName || "e.g. 10 pushups, no phone"}
                    className="h-8 bg-black/50 border-gray-700 text-xs text-white"
                    data-testid="input-habit-response"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: "#fbbf24" }}>
                    Reward — How will you feel after?
                  </label>
                  <Input
                    value={formReward}
                    onChange={(e) => setFormReward(e.target.value)}
                    placeholder="e.g. Proud, accomplished, strong"
                    className="h-8 bg-black/50 border-gray-700 text-xs text-white"
                    data-testid="input-habit-reward"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={submitHabitForm}
              disabled={!formName.trim() || createHabitMutation.isPending || updateHabitMutation.isPending}
              className="w-full h-10 text-sm font-semibold"
              style={{ backgroundColor: "#0e7490", color: "white" }}
              data-testid="button-submit-habit"
            >
              {editingHabit ? "Save Changes" : "Add Habit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── ADD / EDIT BAD HABIT MODAL ── */}
      <Dialog open={showBadHabitForm} onOpenChange={setShowBadHabitForm}>
        <DialogContent className="bg-gray-950 border-gray-800 max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, color: "white" }}>
              {editingBadHabit ? "Edit Bad Habit" : "Track Bad Habit"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div
              className="text-[11px] text-amber-400/80 bg-amber-900/10 border border-amber-900/20 rounded-lg p-2.5"
            >
              Identify the pattern, understand the craving, build a replacement.
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1 text-gray-500">
                Habit / Pattern Name
              </label>
              <Input
                value={bhName}
                onChange={(e) => setBhName(e.target.value)}
                placeholder="e.g. Late night phone scrolling"
                className="h-9 bg-black/50 border-gray-700 text-sm text-white"
                data-testid="input-bad-habit-name"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1 text-gray-500">
                Category
              </label>
              <Select value={bhCategory} onValueChange={setBhCategory}>
                <SelectTrigger className="h-9 bg-black/50 border-gray-700 text-sm text-white" data-testid="select-bad-habit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {BAD_HABIT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: "#f87171" }}>
                Trigger — When does it happen?
              </label>
              <Input
                value={bhTrigger}
                onChange={(e) => setBhTrigger(e.target.value)}
                placeholder="e.g. When I'm bored, after dinner"
                className="h-8 bg-black/50 border-gray-700 text-xs text-white"
                data-testid="input-bad-habit-trigger"
              />
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: "#fb923c" }}>
                Craving — What need is it fulfilling?
              </label>
              <Input
                value={bhCraving}
                onChange={(e) => setBhCraving(e.target.value)}
                placeholder="e.g. Escape, stimulation, comfort"
                className="h-8 bg-black/50 border-gray-700 text-xs text-white"
                data-testid="input-bad-habit-craving"
              />
            </div>

            <div
              className="rounded-lg p-2 border border-green-900/30"
              style={{ backgroundColor: "rgba(22,163,74,0.05)" }}
            >
              <p className="text-[9px] uppercase tracking-wider text-green-600 font-semibold mb-2">
                Replacement Plan
              </p>
              <div className="space-y-2">
                <div>
                  <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: "#34d399" }}>
                    When the trigger hits, do:
                  </label>
                  <Input
                    value={bhReplacementCue}
                    onChange={(e) => setBhReplacementCue(e.target.value)}
                    placeholder="e.g. When I reach for phone after dinner..."
                    className="h-8 bg-black/50 border-green-900/30 text-xs text-white"
                    data-testid="input-bad-habit-replacement-cue"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: "#22d3ee" }}>
                    Do this instead:
                  </label>
                  <Input
                    value={bhReplacement}
                    onChange={(e) => setBhReplacement(e.target.value)}
                    placeholder="e.g. Read 10 pages, take a 5-min walk"
                    className="h-8 bg-black/50 border-green-900/30 text-xs text-white"
                    data-testid="input-bad-habit-replacement"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={submitBadHabitForm}
              disabled={!bhName.trim() || createBadHabitMutation.isPending || updateBadHabitMutation.isPending}
              className="w-full h-10 text-sm font-semibold"
              style={{ backgroundColor: "#7f1d1d", color: "white" }}
              data-testid="button-submit-bad-habit"
            >
              {editingBadHabit ? "Save Changes" : "Start Tracking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SystemLayout>
  );
}
