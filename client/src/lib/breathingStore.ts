import type { BreathingProfile } from "./breathingProgressionSystem";
import { DEFAULT_PROFILE } from "./breathingProgressionSystem";

const BREATHING_KEY = "ascend_breathing_profile";

export function getBreathingProfile(): BreathingProfile {
  try {
    const raw = localStorage.getItem(BREATHING_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw) as BreathingProfile;
    if (!parsed.phaseUnlockedAt) parsed.phaseUnlockedAt = { 1: parsed.lastSessionDate ?? "" };
    if (
      parsed.phase === 1 &&
      parsed.pattern?.inhaleSeconds === 4 &&
      parsed.pattern?.holdSeconds === 2 &&
      parsed.pattern?.exhaleSeconds === 4
    ) {
      parsed.pattern = { ...DEFAULT_PROFILE.pattern };
    }
    if (parsed.phase === 1 && parsed.sessionsCompleted === 0 && parsed.durationSeconds > DEFAULT_PROFILE.durationSeconds) {
      parsed.durationSeconds = DEFAULT_PROFILE.durationSeconds;
    }
    return parsed;
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveBreathingProfile(profile: BreathingProfile): void {
  try {
    localStorage.setItem(BREATHING_KEY, JSON.stringify(profile));
  } catch {}
}
