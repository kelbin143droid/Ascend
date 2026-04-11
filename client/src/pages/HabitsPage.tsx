import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useLanguage } from "@/context/LanguageStageContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { Day7HabitsTutorial } from "@/components/game/Day7HabitsTutorial";
import { isHabitsTutorialDone } from "@/lib/progressionService";
import { apiRequest } from "@/lib/queryClient";
import { AddHabitModal } from "@/components/game/AddHabitModal";
import { BreakHabitModal } from "@/components/game/BreakHabitModal";
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

  const [showTutorial, setShowTutorial] = useState(() => !isHabitsTutorialDone());

  const [activeTab, setActiveTab] = useState<"build" | "break">("build");

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [showBadHabitForm, setShowBadHabitForm] = useState(false);
  const [editingBadHabit, setEditingBadHabit] = useState<BadHabit | null>(null);

  const [completionResult, setCompletionResult] = useState<CompletionResult | null>(null);
  const [showBurst, setShowBurst] = useState(false);

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

  const closeHabitForm = () => { setShowAddForm(false); setEditingHabit(null); };
  const closeBadHabitForm = () => { setShowBadHabitForm(false); setEditingBadHabit(null); };

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

  const openAddHabit = () => { setEditingHabit(null); setShowAddForm(true); };
  const openEditHabit = (h: Habit) => { setEditingHabit(h); setShowAddForm(true); };
  const openAddBadHabit = () => { setEditingBadHabit(null); setShowBadHabitForm(true); };
  const openEditBadHabit = (bh: BadHabit) => { setEditingBadHabit(bh); setShowBadHabitForm(true); };

  const submitHabitForm = (data: Record<string, unknown>) => {
    if (editingHabit) {
      updateHabitMutation.mutate({ id: editingHabit.id, data });
    } else {
      createHabitMutation.mutate(data);
    }
  };

  const submitBadHabitForm = (data: Record<string, unknown>) => {
    if (editingBadHabit) {
      updateBadHabitMutation.mutate({ id: editingBadHabit.id, data });
    } else {
      createBadHabitMutation.mutate(data);
    }
  };

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
    <>
      <AnimatePresence>
        {showTutorial && (
          <Day7HabitsTutorial onComplete={() => setShowTutorial(false)} />
        )}
      </AnimatePresence>
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
          <div className="flex flex-col items-center gap-0.5">
            <button
              onClick={activeTab === "build" ? openAddHabit : openAddBadHabit}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{
                backgroundColor: activeTab === "build" ? "rgba(6,182,212,0.12)" : "rgba(239,68,68,0.12)",
                border: `1px solid ${activeTab === "build" ? "rgba(34,211,238,0.3)" : "rgba(239,68,68,0.3)"}`,
              }}
              data-testid="button-add-habit"
              title={activeTab === "build" ? "Add Habit" : "Track Bad Habit"}
            >
              <Plus className="w-4 h-4" style={{ color: activeTab === "build" ? "#22d3ee" : "#f87171" }} />
            </button>
            <span className="text-[8px] uppercase tracking-wide font-bold" style={{ color: activeTab === "build" ? "rgba(34,211,238,0.5)" : "rgba(248,113,113,0.5)" }}>
              {activeTab === "build" ? "Build" : "Break"}
            </span>
          </div>
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

      <AddHabitModal
        open={showAddForm}
        onClose={closeHabitForm}
        onSubmit={submitHabitForm}
        editingHabit={editingHabit}
        habits={habits}
        playerId={playerId}
        isPending={createHabitMutation.isPending || updateHabitMutation.isPending}
      />

      <BreakHabitModal
        open={showBadHabitForm}
        onClose={closeBadHabitForm}
        onSubmit={submitBadHabitForm}
        editingBadHabit={editingBadHabit}
        playerId={playerId}
        isPending={createBadHabitMutation.isPending || updateBadHabitMutation.isPending}
      />
    </SystemLayout>
    </>
  );
}
