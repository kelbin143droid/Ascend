import type { Player, Habit, HabitCompletion } from "@shared/schema";

export interface FlowState {
  value: number;
  label: string;
  trending: "rising" | "steady" | "cooling";
}

const FLOW_LABELS: { min: number; label: string }[] = [
  { min: 70, label: "In Flow" },
  { min: 30, label: "Building Flow" },
  { min: 1, label: "Warming Up" },
  { min: 0, label: "Awaiting Action" },
];

function getFlowLabel(value: number): string {
  for (const tier of FLOW_LABELS) {
    if (value >= tier.min) return tier.label;
  }
  return "Awaiting Action";
}

export function getFlowState(
  player: Player,
  habits: Habit[],
  recentCompletions: HabitCompletion[]
): FlowState {
  const today = new Date().toLocaleDateString("en-CA");
  const activeHabits = habits.filter(h => h.active);
  if (activeHabits.length === 0) return { value: 0, label: "Awaiting Action", trending: "steady" };

  const todayCompletions = recentCompletions.filter(c => {
    const cd = c.completedAt ? new Date(c.completedAt).toLocaleDateString("en-CA") : null;
    return cd === today;
  });

  const avgMomentum = activeHabits.length > 0
    ? activeHabits.reduce((sum, h) => sum + h.momentum, 0) / activeHabits.length
    : 0;

  const completionRatio = activeHabits.length > 0
    ? todayCompletions.length / activeHabits.length
    : 0;

  const stackBonus = getStackBonus(habits, todayCompletions);
  const returnBonus = getReturnBonus(player, habits);

  const rawFlow = Math.min(100, Math.round(
    (avgMomentum * 40) +
    (completionRatio * 40) +
    (stackBonus * 10) +
    (returnBonus * 10)
  ));

  const lastCompletionDate = habits
    .filter(h => h.lastCompletedDate)
    .map(h => h.lastCompletedDate!)
    .sort()
    .reverse()[0];

  let decayedFlow = rawFlow;
  if (lastCompletionDate) {
    const lastDate = new Date(lastCompletionDate + "T23:59:59");
    const hoursSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60);
    decayedFlow = applyDailyFlowDecay(rawFlow, hoursSince);
  }

  const value = Math.max(0, Math.min(100, decayedFlow));
  const label = getFlowLabel(value);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString("en-CA");
  const yesterdayCompletions = recentCompletions.filter(c => {
    const cd = c.completedAt ? new Date(c.completedAt).toLocaleDateString("en-CA") : null;
    return cd === yesterdayStr;
  });

  const yesterdayRatio = activeHabits.length > 0
    ? yesterdayCompletions.length / activeHabits.length
    : 0;

  let trending: "rising" | "steady" | "cooling";
  if (completionRatio > yesterdayRatio + 0.1) trending = "rising";
  else if (completionRatio < yesterdayRatio - 0.1) trending = "cooling";
  else trending = "steady";

  return { value, label, trending };
}

function getStackBonus(habits: Habit[], todayCompletions: HabitCompletion[]): number {
  const completedIds = new Set(todayCompletions.map(c => c.habitId));
  let stackedPairs = 0;

  for (const habit of habits) {
    if (habit.stackAfterHabitId && completedIds.has(habit.id) && completedIds.has(habit.stackAfterHabitId)) {
      stackedPairs++;
    }
  }

  return Math.min(1, stackedPairs * 0.5);
}

function getReturnBonus(player: Player, habits: Habit[]): number {
  const today = new Date().toLocaleDateString("en-CA");
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString("en-CA");

  const habitsWithGaps = habits.filter(h => {
    if (!h.lastCompletedDate) return false;
    return h.lastCompletedDate < yesterdayStr && h.lastCompletedDate !== today;
  });

  const returnedToday = habitsWithGaps.filter(h => h.lastCompletedDate === today);

  return returnedToday.length > 0 ? 1 : 0;
}

export function updateFlowAfterCompletion(
  currentFlow: FlowState,
  completionRatio: number
): FlowState {
  const boost = Math.min(15, Math.round(completionRatio * 20));
  const newValue = Math.min(100, currentFlow.value + boost);
  return {
    value: newValue,
    label: getFlowLabel(newValue),
    trending: "rising",
  };
}

export function applyDailyFlowDecay(currentFlowValue: number, hoursSinceLastAction: number): number {
  if (hoursSinceLastAction < 24) return currentFlowValue;
  const decayDays = Math.floor(hoursSinceLastAction / 24);
  const decayRate = 0.08;
  const decayed = currentFlowValue * Math.pow(1 - decayRate, decayDays);
  return Math.max(0, Math.round(decayed));
}
