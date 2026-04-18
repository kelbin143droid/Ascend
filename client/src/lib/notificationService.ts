import { Capacitor } from "@capacitor/core";
import {
  LocalNotifications,
  type ScheduleOptions,
  type LocalNotificationSchema,
  type PermissionStatus,
} from "@capacitor/local-notifications";

export const isNativePlatform = (): boolean => Capacitor.isNativePlatform();

let permissionGranted = false;
let initPromise: Promise<boolean> | null = null;

async function ensurePermission(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  // Cache only the granted state — denied states must re-check every time so
  // that toggling permission from system settings is picked up without a
  // full app restart.
  if (permissionGranted) return true;

  try {
    const status: PermissionStatus = await LocalNotifications.checkPermissions();
    if (status.display === "granted") {
      permissionGranted = true;
      return true;
    }
    if (status.display === "denied") {
      return false;
    }
    const req = await LocalNotifications.requestPermissions();
    permissionGranted = req.display === "granted";
    return permissionGranted;
  } catch (err) {
    console.warn("[notifications] permission check failed", err);
    return false;
  }
}

export async function initNotifications(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const granted = await ensurePermission();
    if (!granted) return false;

    try {
      await LocalNotifications.createChannel({
        id: "ascend-default",
        name: "Ascend OS",
        description: "Daily ritual and quest reminders",
        importance: 4,
        visibility: 1,
        vibration: true,
        lights: true,
      });
    } catch {
      // createChannel only exists on Android; ignore on other platforms
    }

    try {
      await LocalNotifications.removeAllListeners();
      await LocalNotifications.addListener("localNotificationActionPerformed", (event) => {
        const data = event.notification?.extra ?? {};
        if (data?.taskId) {
          window.dispatchEvent(
            new CustomEvent("ascend:notification-tap", { detail: data }),
          );
        }
      });
    } catch (err) {
      console.warn("[notifications] listener init failed", err);
    }

    return true;
  })();

  return initPromise;
}

// FNV-1a 32-bit. Much lower collision rate than the simple *31 hash for
// arbitrary user-defined task IDs. Capped to a positive int32 range that the
// Capacitor LocalNotifications plugin accepts.
function stableNotificationId(taskId: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < taskId.length; i++) {
    h ^= taskId.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) & 0x7fffffff) || 1;
}

export interface ScheduleResult {
  scheduled: boolean;
  reason?: "not-native" | "no-permission" | "past-time" | "error";
  notificationId?: number;
}

export async function scheduleTaskNotification(
  taskId: string,
  title: string,
  body: string,
  dateTime: Date | string | number,
): Promise<ScheduleResult> {
  if (!isNativePlatform()) {
    return { scheduled: false, reason: "not-native" };
  }
  const granted = await initNotifications();
  if (!granted) return { scheduled: false, reason: "no-permission" };

  const at = dateTime instanceof Date ? dateTime : new Date(dateTime);
  if (isNaN(at.getTime()) || at.getTime() <= Date.now()) {
    return { scheduled: false, reason: "past-time" };
  }

  const id = stableNotificationId(taskId);
  const notification: LocalNotificationSchema = {
    id,
    title,
    body,
    schedule: { at, allowWhileIdle: true },
    channelId: "ascend-default",
    smallIcon: "ic_stat_icon",
    extra: { taskId },
  };

  try {
    await LocalNotifications.cancel({ notifications: [{ id }] }).catch(() => {});
    const opts: ScheduleOptions = { notifications: [notification] };
    await LocalNotifications.schedule(opts);
    return { scheduled: true, notificationId: id };
  } catch (err) {
    console.warn("[notifications] schedule failed", err);
    return { scheduled: false, reason: "error" };
  }
}

export async function cancelTaskNotification(taskId: string): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: stableNotificationId(taskId) }],
    });
  } catch (err) {
    console.warn("[notifications] cancel failed", err);
  }
}

export async function listPendingNotifications() {
  if (!isNativePlatform()) return [];
  try {
    const res = await LocalNotifications.getPending();
    return res.notifications ?? [];
  } catch {
    return [];
  }
}
