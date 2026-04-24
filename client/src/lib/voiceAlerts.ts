/**
 * Lightweight Web Speech API helper for the "voice alerts" notification mode.
 * Speaks the user's next upcoming sectograph block while the app is open.
 */
import { getNotificationPrefs } from "@/lib/notificationModeStore";

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported()) return [];
  return window.speechSynthesis.getVoices();
}

export function speak(text: string, opts?: { rate?: number; pitch?: number; volume?: number; voiceName?: string }) {
  if (!speechSupported() || !text.trim()) return;
  try {
    const prefs = getNotificationPrefs();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = opts?.rate ?? prefs.voiceRate;
    u.pitch = opts?.pitch ?? prefs.voicePitch;
    u.volume = opts?.volume ?? prefs.voiceVolume;
    const voiceName = opts?.voiceName ?? prefs.voiceName;
    if (voiceName) {
      const voices = getAvailableVoices();
      const match = voices.find((v) => v.name === voiceName);
      if (match) u.voice = match;
    }
    // Cancel anything in flight to avoid stacking.
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch (err) {
    console.warn("[voiceAlerts] speak failed", err);
  }
}

export function stopSpeaking() {
  if (!speechSupported()) return;
  try { window.speechSynthesis.cancel(); } catch { /* noop */ }
}
