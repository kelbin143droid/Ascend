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
  SkipForward,
  Trophy,
  Link2,
  Target,
  Sparkles,
  Award,
  ChevronRight,
  X,
  Clock,
  MapPin,
} from "lucide-react";
import type { Habit, Badge } from "@shared/schema";
import { TaskCompletionBurst, StabilityShift } from "@/components/game/MicroRewards";
import { DayCloseOverlay } from "@/components/game/DayCloseOverlay";
import { useLocation } from "wouter";

const STAT_COLORS: Record<string, string> = {
  strength: "#ef4444",
  agility: "#22c55e",
  sense: "#3b82f6",
  vitality: "#f59e0b",
};

const STAT_LABELS: Record<string, string> = {
  strength: "STR",
  agility: "AGI",
  sense: "SEN",
  vitality: "VIT",
};

const DIFFICULTY_LABELS = ["", "Micro", "Light", "Standard", "Intense", "Master"];

interface PlacementSuggestionData {
  id: string;
  suggestedHour: number;
  suggestedMinute: number;
  durationMinutes: number;
  rhythmActionType: string;
  confidenceScore: number;
  reason: string;
  rhythmLabel: string;
}

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
  stability?: {
    score: number;
    previousScore?: number;
    tier: string;
  };
}

interface StackSuggestion {
  habitIds: string[];
  reason: string;
}

export default function HabitsPage() {
  const { player } = useGame();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [completionResult, setCompletionResult] = useState<CompletionResult | null>(null);
  const [showDayClose, setShowDayClose] = useState(false);

  const { data: homeData } = useQuery<{ onboardingDay: number; hasCompletedHabitToday: boolean; stability?: { habitLimit?: number; state?: string; recoveryModeActive?: boolean } }>({
    queryKey: ["home", player?.id],
    queryFn: async () => {
      if (!player?.id) throw new Error("No player");
      const res = await fetch(`/api/player/${player.id}/home`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!player?.id,
    staleTime: 30000,
  });

  const onboardingDay = homeData?.onboardingDay ?? 1;
  const habitCreationLocked = onboardingDay < 3;
  const habitLimit = homeData?.stability?.habitLimit ?? 10;
  const activeHabitCount = habits.filter(h => h.active).length;
  const habitLimitReached = activeHabitCount >= habitLimit;
  const isRecoveryMode = homeData?.stability?.recoveryModeActive ?? false;
  const stabilityState = homeData?.stability?.state ?? "stabilizing";

  const [formName, setFormName] = useState("");
  const [formStat, setFormStat] = useState<string>("strength");
  const [formDuration, setFormDuration] = useState("3");
  const [formStackAfter, setFormStackAfter] = useState<string>("");
  const [acceptedSuggestion, setAcceptedSuggestion] = useState<PlacementSuggestionData | null>(null);
  const [showSuggestionBanner, setShowSuggestionBanner] = useState(false);

  const [burstVisible, setBurstVisible] = useState(false);
  const [burstStat, setBurstStat] = useState("strength");
  const [burstXP, setBurstXP] = useState(0);
  const [burstLevel, setBurstLevel] = useState<"minimal" | "moderate" | "epic">("minimal");
  const [stabilityShift, setStabilityShift] = useState<{ direction: "up" | "down" | null; amount: number; visible: boolean }>({ direction: null, amount: 0, visible: false });
  const [burstTriggerCount, setBurstTriggerCount] = useState(0);
  const [burstColor, setBurstColor] = useState("#ffffff");

  const { data: habits = [], isLoading } = useQuery<Habit[]>({
    queryKey: ["habits", player?.id],
    queryFn: async () => {
      if (!player?.id) return [];
      const res = await fetch(`/api/habits/${player.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!player?.id,
  });

  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ["badges", player?.id],
    queryFn: async () => {
      if (!player?.id) return [];
      const res = await fetch(`/api/badges/${player.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!player?.id,
  });

  const { data: stackSuggestions = [] } = useQuery<StackSuggestion[]>({
    queryKey: ["habit-stacks", player?.id],
    queryFn: async () => {
      if (!player?.id) return [];
      const res = await fetch(`/api/habits/${player.id}/stacks`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!player?.id,
  });

  const { data: placementData } = useQuery<{ suggestions: PlacementSuggestionData[]; coachComment: string | null }>({
    queryKey: ["habit-placement", player?.id, formStat, formDuration],
    queryFn: async () => {
      if (!player?.id) return { suggestions: [], coachComment: null };
      const res = await fetch(`/api/player/${player.id}/habit-placement-suggestions?stat=${formStat}&duration=${parseInt(formDuration) || 3}`);
      if (!res.ok) return { suggestions: [], coachComment: null };
      return res.json();
    },
    enabled: !!player?.id && showAddForm && !editingHabit,
    staleTime: 30000,
  });

  const placementSuggestions = placementData?.suggestions ?? [];
  const placementCoachComment = placementData?.coachComment ?? null;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["habits"] });
    queryClient.invalidateQueries({ queryKey: ["badges"] });
    queryClient.invalidateQueries({ queryKey: ["habit-stacks"] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/habits", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setShowAddForm(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await apiRequest("PATCH", `/api/habits/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setEditingHabit(null);
      setShowAddForm(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/habits/${id}`);
    },
    onSuccess: invalidateAll,
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/habits/${id}/complete`);
      return res.json() as Promise<CompletionResult>;
    },
    onSuccess: (data) => {
      invalidateAll();
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      queryClient.invalidateQueries({ queryKey: ["visuals"] });
      queryClient.invalidateQueries({ queryKey: ["home"] });

      if (!homeData?.hasCompletedHabitToday) {
        setShowDayClose(true);
        return;
      }

      setCompletionResult(data);

      if (data.visuals) {
        setBurstStat(data.habit?.stat || "strength");
        setBurstXP(data.xpEarned);
        setBurstLevel(data.visuals.celebrationLevel);
        setBurstColor(data.visuals.auraPulseColor);
        setBurstVisible(true);
        setBurstTriggerCount(c => c + 1);
      }

      if (data.stability?.previousScore !== undefined) {
        const diff = data.stability.score - data.stability.previousScore;
        if (diff !== 0) {
          setStabilityShift({
            direction: diff > 0 ? "up" : "down",
            amount: Math.abs(Math.round(diff)),
            visible: true,
          });
        }
      }
    },
  });

  const skipMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/habits/${id}/skip`);
      return res.json();
    },
    onSuccess: invalidateAll,
  });

  const resetForm = () => {
    setFormName("");
    setFormStat("strength");
    setFormDuration("3");
    setFormStackAfter("");
    setAcceptedSuggestion(null);
    setShowSuggestionBanner(false);
  };

  const openAddForm = () => {
    if (habitLimitReached) return;
    resetForm();
    setEditingHabit(null);
    setShowAddForm(true);
    setShowSuggestionBanner(true);
  };

  const openEditForm = (habit: Habit) => {
    setFormName(habit.name);
    setFormStat(habit.stat);
    setFormDuration(String(habit.baseDurationMinutes));
    setFormStackAfter(habit.stackAfterHabitId || "");
    setEditingHabit(habit);
    setShowAddForm(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !player?.id) return;
    const dur = parseInt(formDuration) || 3;
    const data: Record<string, unknown> = {
      userId: player.id,
      name: formName.trim(),
      stat: formStat,
      baseDurationMinutes: dur,
      currentDurationMinutes: dur,
    };
    if (formStackAfter) data.stackAfterHabitId = formStackAfter;

    if (editingHabit) {
      updateMutation.mutate({ id: editingHabit.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const buildStacks = (): Habit[][] => {
    const byId = new Map(habits.map((h) => [h.id, h]));
    const childOf = new Map<string, string>();
    habits.forEach((h) => {
      if (h.stackAfterHabitId) childOf.set(h.stackAfterHabitId, h.id);
    });
    const roots = habits.filter((h) => !h.stackAfterHabitId);
    const chains: Habit[][] = [];
    const visited = new Set<string>();

    for (const root of roots) {
      const chain: Habit[] = [root];
      visited.add(root.id);
      let current = root.id;
      while (childOf.has(current)) {
        const nextId = childOf.get(current)!;
        const next = byId.get(nextId);
        if (!next || visited.has(nextId)) break;
        chain.push(next);
        visited.add(nextId);
        current = nextId;
      }
      chains.push(chain);
    }

    habits.forEach((h) => {
      if (!visited.has(h.id)) chains.push([h]);
    });
    return chains;
  };

  const stacks = buildStacks();

  return (
    <SystemLayout>
      <TaskCompletionBurst
        stat={burstStat}
        xpEarned={burstXP}
        celebrationLevel={burstLevel}
        visible={burstVisible}
        onComplete={() => setBurstVisible(false)}
      />
      <StabilityShift
        direction={stabilityShift.direction}
        amount={stabilityShift.amount}
        visible={stabilityShift.visible}
        onComplete={() => setStabilityShift({ direction: null, amount: 0, visible: false })}
      />
      <div className="p-4 space-y-6 max-w-4xl mx-auto pb-24">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg font-bold text-white font-orbitron tracking-wide">
              {t("Daily Rituals")}
            </h1>
          </div>
          <Button
            size="sm"
            onClick={(habitCreationLocked || habitLimitReached) ? undefined : openAddForm}
            className={(habitCreationLocked || habitLimitReached) ? "bg-gray-700 text-gray-400 cursor-default" : "bg-cyan-600 hover:bg-cyan-700 text-white"}
            disabled={habitCreationLocked || habitLimitReached}
            data-testid="button-add-habit"
            title={habitLimitReached ? `Habit limit reached (${activeHabitCount}/${habitLimit})` : ""}
          >
            <Plus className="w-4 h-4 mr-1" />
            {habitLimitReached ? `${activeHabitCount}/${habitLimit}` : t("Add Ritual")}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading rituals...</div>
          </div>
        ) : (
          <>
            {stacks.map((chain, si) => (
              <div
                key={si}
                className="bg-gray-900/60 border border-gray-800 rounded-lg overflow-hidden"
                data-testid={`habit-stack-${si}`}
              >
                {chain.length > 1 && (
                  <div className="px-3 py-1.5 bg-gray-800/50 flex items-center gap-2 text-xs text-gray-400">
                    <Link2 className="w-3 h-3" />
                    <span>Stacked Chain ({chain.length} habits)</span>
                  </div>
                )}
                {chain.map((habit, hi) => (
                  <div
                    key={habit.id}
                    className={`p-3 ${hi > 0 ? "border-t border-gray-800/50" : ""}`}
                    data-testid={`habit-item-${habit.id}`}
                  >
                    <div className="flex items-start gap-3">
                      {chain.length > 1 && (
                        <div className="flex flex-col items-center pt-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: STAT_COLORS[habit.stat] }}
                          />
                          {hi < chain.length - 1 && (
                            <div className="w-0.5 h-8 bg-gray-700 mt-0.5" />
                          )}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-sm font-bold"
                            data-testid={`habit-name-${habit.id}`}
                          >
                            {habit.name}
                          </span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase"
                            style={{
                              backgroundColor: `${STAT_COLORS[habit.stat]}20`,
                              color: STAT_COLORS[habit.stat],
                            }}
                            data-testid={`habit-stat-${habit.id}`}
                          >
                            {STAT_LABELS[habit.stat]}
                          </span>
                          {habit.currentStreak > 0 && (
                            <span
                              className="flex items-center gap-0.5 text-[10px] text-orange-400"
                              data-testid={`habit-streak-${habit.id}`}
                            >
                              <Flame className="w-3 h-3" />
                              {habit.currentStreak}
                            </span>
                          )}
                          <span
                            className="text-[10px] text-gray-500"
                            data-testid={`habit-difficulty-${habit.id}`}
                          >
                            Lv.{habit.difficultyLevel}{" "}
                            {DIFFICULTY_LABELS[habit.difficultyLevel] || ""}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-1.5">
                          <span data-testid={`habit-duration-${habit.id}`}>
                            {habit.currentDurationMinutes} min
                          </span>
                          <span>
                            {habit.totalCompletions}x done
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div
                            className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden"
                            data-testid={`habit-momentum-${habit.id}`}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, (habit.momentum || 0) * 100)}%`,
                                backgroundColor: STAT_COLORS[habit.stat],
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500">
                            {Math.round((habit.momentum || 0) * 100)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-900/30"
                          onClick={() => completeMutation.mutate(habit.id)}
                          disabled={completeMutation.isPending}
                          data-testid={`button-complete-habit-${habit.id}`}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30"
                          onClick={() => skipMutation.mutate(habit.id)}
                          disabled={skipMutation.isPending}
                          data-testid={`button-skip-habit-${habit.id}`}
                        >
                          <SkipForward className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                          onClick={() => openEditForm(habit)}
                          data-testid={`button-edit-habit-${habit.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/30"
                          onClick={() => deleteMutation.mutate(habit.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-habit-${habit.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {habitLimitReached && !habitCreationLocked && (
              <div
                data-testid="habit-limit-banner"
                className="rounded-xl px-5 py-4 text-center"
                style={{
                  backgroundColor: isRecoveryMode ? "rgba(168,85,247,0.04)" : "rgba(234,179,8,0.04)",
                  border: `1px solid ${isRecoveryMode ? "rgba(168,85,247,0.12)" : "rgba(234,179,8,0.12)"}`,
                }}
              >
                <p className="text-sm leading-relaxed" style={{ color: isRecoveryMode ? "rgba(168,85,247,0.8)" : "rgba(234,179,8,0.8)" }}>
                  {isRecoveryMode
                    ? `Recovery mode active — focus on ${habitLimit} key habits right now.`
                    : `You've reached your current habit limit (${activeHabitCount}/${habitLimit}). Strengthen existing habits to unlock more.`}
                </p>
              </div>
            )}

            {habitCreationLocked && (
              <div
                data-testid="soft-lock-habits"
                className="rounded-xl px-5 py-4 text-center"
                style={{
                  backgroundColor: "rgba(147,197,253,0.04)",
                  border: "1px solid rgba(147,197,253,0.08)",
                }}
              >
                <p className="text-sm leading-relaxed" style={{ color: "rgba(147,197,253,0.7)" }}>
                  Custom daily rituals unlock as your hunter path develops.
                </p>
                <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Complete guided sessions from Home to build your foundation.
                </p>
              </div>
            )}

            {habits.length === 0 && !habitCreationLocked && (
              <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-8 text-center">
                <Target className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No habits yet. Create your first habit to start building streaks!</p>
              </div>
            )}

            {stackSuggestions.length > 0 && (
              <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4" data-testid="stack-suggestions">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Stack Suggestions
                </h2>
                <div className="space-y-2">
                  {stackSuggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded bg-gray-800/40 text-xs text-gray-300"
                      data-testid={`stack-suggestion-${i}`}
                    >
                      <ChevronRight className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      <div className="flex items-center gap-1 flex-wrap">
                        {suggestion.habitIds.map((hid, j) => {
                          const h = habits.find((x) => x.id === hid);
                          return (
                            <span key={hid}>
                              {j > 0 && (
                                <span className="text-gray-600 mx-1">→</span>
                              )}
                              <span
                                className="px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: `${STAT_COLORS[h?.stat || "strength"]}15`,
                                  color: STAT_COLORS[h?.stat || "strength"],
                                }}
                              >
                                {h?.name || hid}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                      <span className="text-gray-500 ml-auto flex-shrink-0">{suggestion.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {badges.length > 0 && (
              <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4" data-testid="badge-showcase">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Badges Earned ({badges.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-800/40 border border-gray-700/50"
                      data-testid={`badge-item-${badge.id}`}
                    >
                      <Award className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate" data-testid={`badge-name-${badge.id}`}>
                          {badge.name}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                          {badge.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="bg-gray-950 border-gray-800 max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-orbitron text-sm text-white">
                {editingHabit ? t("Edit Ritual") : t("New Daily Ritual")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1 text-gray-500">
                  Name
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Morning Pushups"
                  className="h-9 bg-black/50 border-gray-700 text-sm text-white"
                  data-testid="input-habit-name"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1 text-gray-500">
                  Stat
                </label>
                <Select value={formStat} onValueChange={setFormStat}>
                  <SelectTrigger
                    className="h-9 bg-black/50 border-gray-700 text-sm text-white"
                    data-testid="select-habit-stat"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="agility">Agility</SelectItem>
                    <SelectItem value="sense">Sense</SelectItem>
                    <SelectItem value="vitality">Vitality</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                <div className="text-[9px] text-gray-600 mt-1">
                  Duration scales automatically with your consistency
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1 text-gray-500">
                  Stack After (optional)
                </label>
                <Select value={formStackAfter} onValueChange={setFormStackAfter}>
                  <SelectTrigger
                    className="h-9 bg-black/50 border-gray-700 text-sm text-white"
                    data-testid="select-habit-stack-after"
                  >
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="none">None</SelectItem>
                    {habits
                      .filter((h) => h.id !== editingHabit?.id)
                      .map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {!editingHabit && showSuggestionBanner && placementSuggestions.length > 0 && (
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ border: "1px solid rgba(34,211,238,0.2)", backgroundColor: "rgba(34,211,238,0.04)" }}
                  data-testid="placement-suggestions"
                >
                  <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(34,211,238,0.1)" }}>
                    <MapPin size={11} style={{ color: "rgba(34,211,238,0.7)" }} />
                    <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "rgba(34,211,238,0.7)" }}>
                      Suggested Times
                    </span>
                    <button
                      onClick={() => setShowSuggestionBanner(false)}
                      className="ml-auto"
                      data-testid="button-dismiss-suggestions"
                    >
                      <X size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                    </button>
                  </div>
                  <div className="p-2 space-y-1.5">
                    {placementSuggestions.map((s) => {
                      const h = s.suggestedHour % 12 || 12;
                      const ampm = s.suggestedHour < 12 ? "AM" : "PM";
                      const timeStr = `${h}:${String(s.suggestedMinute).padStart(2, "0")} ${ampm}`;
                      const isAccepted = acceptedSuggestion?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            if (isAccepted) {
                              setAcceptedSuggestion(null);
                            } else {
                              setAcceptedSuggestion(s);
                            }
                          }}
                          className="w-full text-left rounded-md px-3 py-2.5 transition-all"
                          style={{
                            backgroundColor: isAccepted ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.02)",
                            border: isAccepted ? "1px solid rgba(34,211,238,0.35)" : "1px solid transparent",
                          }}
                          data-testid={`button-accept-suggestion-${s.id}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Clock size={10} style={{ color: "rgba(34,211,238,0.6)" }} />
                              <span className="text-xs font-mono font-bold" style={{ color: "rgba(34,211,238,0.9)" }}>
                                {timeStr}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(34,211,238,0.1)", color: "rgba(34,211,238,0.6)" }}>
                                {s.rhythmLabel}
                              </span>
                            </div>
                            {isAccepted && (
                              <Check size={12} style={{ color: "rgba(34,211,238,0.8)" }} />
                            )}
                          </div>
                          <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                            {s.reason}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="h-1 rounded-full flex-1" style={{ backgroundColor: "rgba(34,211,238,0.1)" }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.round(s.confidenceScore * 100)}%`, backgroundColor: "rgba(34,211,238,0.4)" }} />
                            </div>
                            <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
                              {Math.round(s.confidenceScore * 100)}% match
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {placementCoachComment && (
                    <div className="px-3 pb-2.5">
                      <div className="flex items-start gap-2 px-2.5 py-2 rounded-md" style={{ backgroundColor: "rgba(34,211,238,0.03)" }}>
                        <Sparkles size={10} className="flex-shrink-0 mt-0.5" style={{ color: "rgba(34,211,238,0.5)" }} />
                        <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                          {placementCoachComment}
                        </p>
                      </div>
                    </div>
                  )}
                  {acceptedSuggestion && (
                    <div className="px-3 pb-2.5">
                      <p className="text-[9px] text-center" style={{ color: "rgba(34,211,238,0.5)" }}>
                        Placement accepted — this habit will be linked to your rhythm.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                  disabled={!formName.trim() || createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-habit"
                >
                  {editingHabit ? "Update" : "Create"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingHabit(null);
                    resetForm();
                  }}
                  className="border-gray-700 text-gray-400"
                  data-testid="button-cancel-habit"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!completionResult}
          onOpenChange={(open) => !open && setCompletionResult(null)}
        >
          <DialogContent className="bg-gray-950 border-gray-800 max-w-sm" data-testid="completion-dialog">
            <DialogHeader>
              <DialogTitle className="font-orbitron text-sm text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Habit Complete!
              </DialogTitle>
            </DialogHeader>
            {completionResult && (
              <div className="space-y-3">
                <div className="text-center py-2">
                  <div className="text-3xl font-bold text-cyan-400 font-orbitron" data-testid="text-xp-earned">
                    +{completionResult.xpEarned} XP
                  </div>
                  {completionResult.bonusXP > 0 && (
                    <div className="text-sm text-amber-400" data-testid="text-bonus-xp">
                      +{completionResult.bonusXP} Bonus XP
                    </div>
                  )}
                  {completionResult.dailyBonus > 0 && (
                    <div className="text-xs text-green-400">
                      Daily bonus: +{completionResult.dailyBonus}
                    </div>
                  )}
                  {completionResult.weeklyBonus > 0 && (
                    <div className="text-xs text-purple-400">
                      Weekly bonus: +{completionResult.weeklyBonus}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="text-center" data-testid="text-streak-info">
                    <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                    <div className="text-white font-bold">{completionResult.streakInfo.current}</div>
                    <div className="text-[10px] text-gray-500">Current</div>
                  </div>
                  <div className="text-center">
                    <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <div className="text-white font-bold">{completionResult.streakInfo.longest}</div>
                    <div className="text-[10px] text-gray-500">Best</div>
                  </div>
                </div>

                {completionResult.newBadges.length > 0 && (
                  <div className="space-y-2" data-testid="new-badges">
                    <div className="text-xs text-amber-400 uppercase tracking-wide font-bold text-center">
                      New Badges Unlocked!
                    </div>
                    {completionResult.newBadges.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex items-center gap-2 p-2 rounded bg-amber-900/20 border border-amber-700/30"
                        data-testid={`new-badge-${badge.id}`}
                      >
                        <Award className="w-5 h-5 text-amber-400" />
                        <div>
                          <div className="text-xs font-bold text-white">{badge.name}</div>
                          <div className="text-[10px] text-gray-400">{badge.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                  onClick={() => setCompletionResult(null)}
                  data-testid="button-close-completion"
                >
                  Continue
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <DayCloseOverlay
          visible={showDayClose}
          onboardingDay={homeData?.onboardingDay ?? 1}
          onClose={() => {
            setShowDayClose(false);
            setLocation("/");
          }}
        />
      </div>
    </SystemLayout>
  );
}
