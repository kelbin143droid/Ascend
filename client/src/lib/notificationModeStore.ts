/**
 * Stores the user's preferred way to receive task alerts.
 *  - "phone": OS-level Capacitor LocalNotifications (default).
 *  - "voice": In-app Web Speech announcements as the next scheduled block approaches.
 *  - "both":  Both phone notification AND in-app voice when the app is open.
 */
export type NotificationMode = "phone" | "voice" | "both";

export interface NotificationPrefs {
  mode: NotificationMode;
  voiceEnabled: boolean;        // master toggle for voice (independent of mode)
  voiceRate: number;            // 0.5 - 1.5
  voicePitch: number;           // 0.5 - 1.5
  voiceVolume: number;          // 0 - 1
  voiceLeadMinutes: number;     // how many minutes before the block to announce
  voiceName?: string;           // chosen Web Speech voice name (if any)
}

const STORAGE_KEY = "ascend_notification_prefs";
const EVENT_NAME = "ascend:notification-prefs-changed";

const DEFAULTS: NotificationPrefs = {
  mode: "phone",
  voiceEnabled: false,
  voiceRate: 1,
  voicePitch: 1,
  voiceVolume: 1,
  voiceLeadMinutes: 1,
};

export function getNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export function setNotificationPrefs(patch: Partial<NotificationPrefs>) {
  const next = { ...getNotificationPrefs(), ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch { /* ignore quota errors */ }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
  return next;
}

export function subscribeNotificationPrefs(cb: (prefs: NotificationPrefs) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<NotificationPrefs>).detail);
  window.addEventListener(EVENT_NAME, handler as EventListener);
  return () => window.removeEventListener(EVENT_NAME, handler as EventListener);
}

/** True if phone (OS) notifications should be scheduled. */
export function shouldUsePhoneNotifications(): boolean {
  const m = getNotificationPrefs().mode;
  return m === "phone" || m === "both";
}

/** True if voice announcements should fire while the app is open. */
export function shouldUseVoiceAlerts(): boolean {
  const prefs = getNotificationPrefs();
  if (!prefs.voiceEnabled) return false;
  return prefs.mode === "voice" || prefs.mode === "both";
}

export const NOTIFICATION_PREFS_EVENT = EVENT_NAME;
