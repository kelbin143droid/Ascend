import type { HabitCompletion } from "@shared/schema";

export interface ActionEvent {
  timestamp: Date;
  actionType: "reset" | "habit" | "focusSession";
  duration?: number;
}

export interface RhythmWindow {
  centerHour: number;
  centerMinute: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  actionType: "reset" | "habit" | "focusSession" | "mixed";
  frequency: number;
  confidenceScore: number;
  label: string;
}

export interface RhythmInsight {
  message: string;
  windowLabel: string;
  actionType: string;
  confidenceScore: number;
}

const BUCKET_SIZE_MINUTES = 60;
const MIN_EVENTS_FOR_RHYTHM = 3;
const CONFIDENCE_THRESHOLD = 0.4;
const MAX_INSIGHTS_PER_DAY = 2;

function classifyActionType(habitId: string): ActionEvent["actionType"] {
  if (habitId.startsWith("guided_")) return "reset";
  if (habitId.startsWith("focus_")) return "focusSession";
  return "habit";
}

function getTimeOfDayLabel(hour: number): string {
  if (hour >= 5 && hour < 9) return "early morning";
  if (hour >= 9 && hour < 12) return "morning";
  if (hour >= 12 && hour < 14) return "midday";
  if (hour >= 14 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  if (hour >= 20 && hour < 23) return "late evening";
  return "night";
}

function formatTimeLabel(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const p = hour < 12 ? "AM" : "PM";
  const m = minute > 0 ? `:${String(minute).padStart(2, "0")}` : "";
  return `${h}${m} ${p}`;
}

function toBucket(hour: number, minute: number): number {
  return Math.floor((hour * 60 + minute) / BUCKET_SIZE_MINUTES);
}

function bucketToTime(bucket: number): { hour: number; minute: number } {
  const totalMinutes = bucket * BUCKET_SIZE_MINUTES;
  return { hour: Math.floor(totalMinutes / 60) % 24, minute: totalMinutes % 60 };
}

export function extractActionEvents(completions: HabitCompletion[]): ActionEvent[] {
  return completions
    .filter(c => c.completedAt)
    .map(c => ({
      timestamp: new Date(c.completedAt!),
      actionType: classifyActionType(c.habitId),
      duration: c.durationMinutes ?? undefined,
    }));
}

export function detectRhythmWindows(events: ActionEvent[]): RhythmWindow[] {
  if (events.length < MIN_EVENTS_FOR_RHYTHM) return [];

  const bucketMap: Map<string, ActionEvent[]> = new Map();

  for (const event of events) {
    const hour = event.timestamp.getHours();
    const minute = event.timestamp.getMinutes();
    const bucket = toBucket(hour, minute);
    const key = `${bucket}-${event.actionType}`;

    if (!bucketMap.has(key)) {
      bucketMap.set(key, []);
    }
    bucketMap.get(key)!.push(event);
  }

  const mixedBuckets: Map<number, ActionEvent[]> = new Map();
  for (const event of events) {
    const bucket = toBucket(event.timestamp.getHours(), event.timestamp.getMinutes());
    if (!mixedBuckets.has(bucket)) {
      mixedBuckets.set(bucket, []);
    }
    mixedBuckets.get(bucket)!.push(event);
  }

  const windows: RhythmWindow[] = [];
  const usedBuckets = new Set<string>();

  for (const [key, bucketEvents] of bucketMap) {
    if (bucketEvents.length < MIN_EVENTS_FOR_RHYTHM) continue;
    if (usedBuckets.has(key)) continue;

    const [bucketStr, actionType] = key.split("-");
    const bucket = parseInt(bucketStr);

    const avgMinutes = bucketEvents.reduce((sum, e) => {
      return sum + e.timestamp.getHours() * 60 + e.timestamp.getMinutes();
    }, 0) / bucketEvents.length;

    const centerHour = Math.floor(avgMinutes / 60) % 24;
    const centerMinute = Math.round(avgMinutes % 60);

    const { hour: startHour, minute: startMinute } = bucketToTime(bucket);
    const endBucket = bucket + 1;
    const { hour: endHour, minute: endMinute } = bucketToTime(endBucket);

    const totalEvents = events.length;
    const recency = calculateRecencyWeight(bucketEvents);
    const frequency = bucketEvents.length;
    const confidenceScore = Math.min(1, (frequency / Math.max(5, totalEvents * 0.3)) * recency);

    if (confidenceScore >= CONFIDENCE_THRESHOLD) {
      windows.push({
        centerHour,
        centerMinute,
        startHour,
        startMinute,
        endHour: endHour % 24,
        endMinute,
        actionType: actionType as RhythmWindow["actionType"],
        frequency,
        confidenceScore: Math.round(confidenceScore * 100) / 100,
        label: getTimeOfDayLabel(centerHour),
      });
      usedBuckets.add(key);
    }
  }

  for (const [bucket, bucketEvents] of mixedBuckets) {
    if (bucketEvents.length < MIN_EVENTS_FOR_RHYTHM) continue;

    const types = new Set(bucketEvents.map(e => e.actionType));
    if (types.size < 2) continue;

    const bucketKey = `${bucket}-mixed`;
    if (usedBuckets.has(bucketKey)) continue;

    const avgMinutes = bucketEvents.reduce((sum, e) => {
      return sum + e.timestamp.getHours() * 60 + e.timestamp.getMinutes();
    }, 0) / bucketEvents.length;

    const centerHour = Math.floor(avgMinutes / 60) % 24;
    const centerMinute = Math.round(avgMinutes % 60);
    const { hour: startHour, minute: startMinute } = bucketToTime(bucket);
    const endBucket = bucket + 1;
    const { hour: endHour, minute: endMinute } = bucketToTime(endBucket);

    const recency = calculateRecencyWeight(bucketEvents);
    const confidenceScore = Math.min(1, (bucketEvents.length / Math.max(5, events.length * 0.3)) * recency);

    if (confidenceScore >= CONFIDENCE_THRESHOLD) {
      const alreadyCovered = windows.some(w =>
        Math.abs(w.centerHour * 60 + w.centerMinute - centerHour * 60 - centerMinute) < BUCKET_SIZE_MINUTES
      );
      if (!alreadyCovered) {
        windows.push({
          centerHour,
          centerMinute,
          startHour,
          startMinute,
          endHour: endHour % 24,
          endMinute,
          actionType: "mixed",
          frequency: bucketEvents.length,
          confidenceScore: Math.round(confidenceScore * 100) / 100,
          label: getTimeOfDayLabel(centerHour),
        });
      }
    }
  }

  return windows.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

function calculateRecencyWeight(events: ActionEvent[]): number {
  const now = Date.now();
  const dayMs = 86400000;
  let weight = 0;
  for (const e of events) {
    const daysAgo = (now - e.timestamp.getTime()) / dayMs;
    if (daysAgo <= 3) weight += 1.0;
    else if (daysAgo <= 7) weight += 0.8;
    else if (daysAgo <= 14) weight += 0.5;
    else weight += 0.2;
  }
  return weight / events.length;
}

export function generateRhythmInsights(windows: RhythmWindow[]): RhythmInsight[] {
  const insights: RhythmInsight[] = [];
  const qualified = windows.filter(w => w.confidenceScore >= CONFIDENCE_THRESHOLD);

  for (const window of qualified.slice(0, MAX_INSIGHTS_PER_DAY)) {
    const timeLabel = formatTimeLabel(window.centerHour, window.centerMinute);
    const todLabel = window.label;

    let message: string;
    switch (window.actionType) {
      case "reset":
        message = `You often reset in the ${todLabel}, around ${timeLabel}. This may be your natural grounding window.`;
        break;
      case "habit":
        message = `It looks like your habits tend to happen around ${timeLabel}. The ${todLabel} seems to work for you.`;
        break;
      case "focusSession":
        message = `You tend to focus best around ${timeLabel}. The ${todLabel} appears to be a strong window for deep work.`;
        break;
      case "mixed":
        message = `You're most active around ${timeLabel}. The ${todLabel} draws multiple types of engagement from you.`;
        break;
    }

    insights.push({
      message,
      windowLabel: todLabel,
      actionType: window.actionType,
      confidenceScore: window.confidenceScore,
    });
  }

  return insights;
}

export function suggestFocusInFreeWindows(
  rhythmWindows: RhythmWindow[],
  freeWindows: { startHour: number; startMinute: number; endHour: number; endMinute: number; durationMinutes: number }[]
): { message: string; freeWindow: typeof freeWindows[0] }[] {
  const suggestions: { message: string; freeWindow: typeof freeWindows[0] }[] = [];

  for (const free of freeWindows) {
    const freeStart = free.startHour * 60 + free.startMinute;
    const freeEnd = free.endHour * 60 + free.endMinute;

    for (const rhythm of rhythmWindows) {
      const rhythmCenter = rhythm.centerHour * 60 + rhythm.centerMinute;

      if (rhythmCenter >= freeStart && rhythmCenter <= freeEnd) {
        const timeLabel = formatTimeLabel(free.startHour, free.startMinute);
        suggestions.push({
          message: `You have a free window around ${timeLabel}. This overlaps with a time you're naturally active. Would you like to start a focus session?`,
          freeWindow: free,
        });
        break;
      }
    }
  }

  return suggestions.slice(0, 2);
}

export function getCoachRhythmComment(windows: RhythmWindow[], currentHour: number): string | null {
  if (windows.length === 0) return null;

  const nearbyWindow = windows.find(w => {
    const diff = Math.abs(w.centerHour - currentHour);
    return diff <= 1 || diff >= 23;
  });

  if (nearbyWindow) {
    const todLabel = nearbyWindow.label;
    switch (nearbyWindow.actionType) {
      case "reset":
        return `This is close to your natural reset time in the ${todLabel}. Good moment to begin.`;
      case "habit":
        return `The ${todLabel} is when your habits tend to happen. Your rhythm supports this.`;
      case "focusSession":
        return `You tend to focus well around this time. The ${todLabel} is a strong window.`;
      case "mixed":
        return `You're typically active around this time. Your rhythm is aligned.`;
    }
  }

  const strongest = windows[0];
  if (strongest.confidenceScore >= 0.6) {
    return `Your strongest rhythm is in the ${strongest.label}. It looks like that's when you naturally engage.`;
  }

  return null;
}
