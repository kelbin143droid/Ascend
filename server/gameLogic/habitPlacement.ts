import type { RhythmWindow } from "./rhythmEngine";

export interface FreeTimeWindow {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  durationMinutes: number;
}

export interface PlacementSuggestion {
  id: string;
  suggestedHour: number;
  suggestedMinute: number;
  durationMinutes: number;
  rhythmActionType: "reset" | "habit" | "focusSession" | "mixed";
  confidenceScore: number;
  reason: string;
  rhythmLabel: string;
  freeWindowStart: { hour: number; minute: number };
  freeWindowEnd: { hour: number; minute: number };
}

function toMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

function windowsOverlap(
  aStart: number, aEnd: number,
  bStart: number, bEnd: number
): boolean {
  if (aEnd <= aStart) aEnd += 1440;
  if (bEnd <= bStart) bEnd += 1440;
  return aStart < bEnd && bStart < aEnd;
}

function actionTypeMatchesHabitStat(actionType: string, stat?: string): boolean {
  if (!stat) return true;
  if (actionType === "habit") return true;
  if (actionType === "mixed") return true;
  if (actionType === "reset" && (stat === "sense" || stat === "vitality")) return true;
  if (actionType === "focusSession" && (stat === "sense" || stat === "agility")) return true;
  return false;
}

export function generatePlacementSuggestions(
  rhythmWindows: RhythmWindow[],
  freeWindows: FreeTimeWindow[],
  habitStat?: string,
  habitDuration: number = 3
): PlacementSuggestion[] {
  const suggestions: PlacementSuggestion[] = [];

  const sortedRhythms = [...rhythmWindows]
    .filter(w => w.confidenceScore >= 0.4)
    .sort((a, b) => b.confidenceScore - a.confidenceScore);

  for (const rhythm of sortedRhythms) {
    const rhythmStart = toMinutes(rhythm.startHour, rhythm.startMinute);
    const rhythmEnd = toMinutes(rhythm.endHour, rhythm.endMinute);

    for (const free of freeWindows) {
      if (free.durationMinutes < habitDuration) continue;

      const freeStart = toMinutes(free.startHour, free.startMinute);
      const freeEnd = toMinutes(free.endHour, free.endMinute);

      if (!windowsOverlap(rhythmStart, rhythmEnd, freeStart, freeEnd)) continue;

      if (!actionTypeMatchesHabitStat(rhythm.actionType, habitStat)) continue;

      const overlapStart = Math.max(rhythmStart, freeStart);
      const rhythmCenter = toMinutes(rhythm.centerHour, rhythm.centerMinute);
      let placementMin = rhythmCenter;
      const effectiveFreeEnd = freeEnd <= freeStart ? freeEnd + 1440 : freeEnd;
      if (placementMin < overlapStart) placementMin = overlapStart;
      if (placementMin + habitDuration > effectiveFreeEnd) {
        placementMin = effectiveFreeEnd - habitDuration;
      }
      if (placementMin < 0) placementMin += 1440;

      const placementHour = Math.floor((placementMin % 1440) / 60);
      const placementMinute = (placementMin % 1440) % 60;

      const existing = suggestions.find(s =>
        Math.abs(toMinutes(s.suggestedHour, s.suggestedMinute) - placementMin) < 30
      );
      if (existing) continue;

      const h = placementHour % 12 || 12;
      const ampm = placementHour < 12 ? "AM" : "PM";
      const timeStr = `${h}:${String(placementMinute).padStart(2, "0")} ${ampm}`;

      let reason: string;
      switch (rhythm.actionType) {
        case "reset":
          reason = `You often show up around ${timeStr}. This could be a natural fit for this habit.`;
          break;
        case "habit":
          reason = `You tend to complete habits around ${timeStr}. Would you like to place this one here?`;
          break;
        case "focusSession":
          reason = `You're typically focused around ${timeStr}. A good window for building a habit.`;
          break;
        default:
          reason = `You're naturally active around ${timeStr}. This might be a good time for this habit.`;
      }

      suggestions.push({
        id: `suggestion-${rhythm.centerHour}-${rhythm.centerMinute}-${free.startHour}`,
        suggestedHour: placementHour,
        suggestedMinute: placementMinute,
        durationMinutes: habitDuration,
        rhythmActionType: rhythm.actionType,
        confidenceScore: rhythm.confidenceScore,
        reason,
        rhythmLabel: rhythm.label,
        freeWindowStart: { hour: free.startHour, minute: free.startMinute },
        freeWindowEnd: { hour: free.endHour, minute: free.endMinute },
      });
    }
  }

  return suggestions
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 3);
}

export function getCoachPlacementComment(
  suggestions: PlacementSuggestion[]
): string | null {
  if (suggestions.length === 0) return null;

  const best = suggestions[0];
  const h = best.suggestedHour % 12 || 12;
  const ampm = best.suggestedHour < 12 ? "AM" : "PM";
  const timeStr = `${h}:${String(best.suggestedMinute).padStart(2, "0")} ${ampm}`;

  switch (best.rhythmActionType) {
    case "reset":
      return `You often complete resets around ${timeStr}. This might be a good time for a habit.`;
    case "habit":
      return `Your habit rhythm is strongest around ${timeStr}. Consider placing new habits there.`;
    case "focusSession":
      return `You tend to focus well around ${timeStr}. That could work for a new habit too.`;
    default:
      return `You're typically active around ${timeStr}. A natural window for building consistency.`;
  }
}
