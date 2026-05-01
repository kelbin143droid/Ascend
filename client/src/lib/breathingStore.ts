import type { BreathingProfile } from "./breathingProgressionSystem";
import { DEFAULT_PROFILE } from "./breathingProgressionSystem";

const BREATHING_KEY = "ascend_breathing_profile";

export function getBreathingProfile(): BreathingProfile {
  try {
    const raw = localStorage.getItem(BREATHING_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw) as BreathingProfile;
    if (!parsed.phaseUnlockedAt) parsed.phaseUnlockedAt = { 1: parsed.lastSessionDate ?? "" };
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
