import type { Player } from "@shared/schema";
import { PHASE_NAMES } from "@shared/schema";

export type NotificationType = "phase_up" | "phase_down" | "stability_warning" | "missed_habits" | "milestone";

export interface NotificationCheck {
  type: NotificationType;
  data: Record<string, any>;
}

export interface Notification {
  type: NotificationType;
  title: string;
  message: string;
  priority: number;
}

export interface PreviousState {
  phase: number;
  stabilityScore: number;
  level: number;
  streak: number;
  completedHabitsToday: number;
  totalActiveHabits: number;
}

export function checkNotificationEligibility(
  player: Player,
  previousState: PreviousState
): NotificationCheck[] {
  const notifications: NotificationCheck[] = [];
  const currentStability = player.stability?.score ?? 50;

  if (player.phase > previousState.phase) {
    notifications.push({
      type: "phase_up",
      data: {
        oldPhase: previousState.phase,
        newPhase: player.phase,
        oldPhaseName: PHASE_NAMES[previousState.phase] || "Unknown",
        newPhaseName: PHASE_NAMES[player.phase] || "Unknown",
      },
    });
  }

  if (player.phase < previousState.phase) {
    notifications.push({
      type: "phase_down",
      data: {
        oldPhase: previousState.phase,
        newPhase: player.phase,
        oldPhaseName: PHASE_NAMES[previousState.phase] || "Unknown",
        newPhaseName: PHASE_NAMES[player.phase] || "Unknown",
        stabilityScore: currentStability,
      },
    });
  }

  if (currentStability < 40 && previousState.stabilityScore >= 40) {
    notifications.push({
      type: "stability_warning",
      data: {
        stabilityScore: currentStability,
        previousScore: previousState.stabilityScore,
        consecutiveLowDays: player.stability?.consecutiveLowDays ?? 0,
      },
    });
  }

  if (
    previousState.totalActiveHabits > 0 &&
    previousState.completedHabitsToday === 0 &&
    previousState.totalActiveHabits >= 2
  ) {
    notifications.push({
      type: "missed_habits",
      data: {
        missedCount: previousState.totalActiveHabits,
      },
    });
  }

  if (player.level > previousState.level) {
    notifications.push({
      type: "milestone",
      data: {
        milestoneType: "level_up",
        newLevel: player.level,
        previousLevel: previousState.level,
      },
    });
  }

  const milestoneStreaks = [7, 14, 30, 50, 100];
  for (const ms of milestoneStreaks) {
    if (player.streak >= ms && previousState.streak < ms) {
      notifications.push({
        type: "milestone",
        data: {
          milestoneType: "streak",
          streakDays: ms,
        },
      });
      break;
    }
  }

  return notifications;
}

export function buildNotification(type: NotificationType, data: Record<string, any>): Notification {
  switch (type) {
    case "phase_up":
      return {
        type,
        title: "Phase Evolution",
        message: `You've ascended to ${data.newPhaseName}. Your consistency and stability have earned this evolution. New capabilities are unlocked — keep building.`,
        priority: 10,
      };

    case "phase_down":
      return {
        type,
        title: "Strategic Recalibration",
        message: `The system has adjusted to ${data.newPhaseName} to help you rebuild your foundation. This is a strategic reset — stability at ${data.stabilityScore}/100. Shorter sessions and reduced difficulty will help you recover momentum.`,
        priority: 9,
      };

    case "stability_warning":
      return {
        type,
        title: "Stability Needs Attention",
        message: `Your stability has dropped to ${data.stabilityScore}/100. The system is adjusting difficulty to support you. Even a single micro-session today can start turning things around. Small wins build momentum.`,
        priority: 8,
      };

    case "missed_habits":
      return {
        type,
        title: "Ready When You Are",
        message: `You have ${data.missedCount} habit${data.missedCount > 1 ? "s" : ""} waiting for today. Start with just one — even 2 minutes counts. The system adapts to meet you where you are.`,
        priority: 6,
      };

    case "milestone":
      if (data.milestoneType === "level_up") {
        return {
          type,
          title: "Level Up",
          message: `You've reached Level ${data.newLevel}. Every level represents real growth built through consistency. Keep going.`,
          priority: 7,
        };
      }
      if (data.milestoneType === "streak") {
        return {
          type,
          title: `${data.streakDays}-Day Streak`,
          message: `${data.streakDays} consecutive days of commitment. This consistency is building lasting change. Your momentum is compounding.`,
          priority: 7,
        };
      }
      return {
        type,
        title: "Milestone Reached",
        message: "You've reached a new milestone. Your dedication is paying off.",
        priority: 5,
      };

    default:
      return {
        type,
        title: "Update",
        message: "Something has changed in your journey. Check your status for details.",
        priority: 3,
      };
  }
}
