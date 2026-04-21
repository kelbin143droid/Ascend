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

/**
 * Public alias — explicit name preferred by callers.
 * Wraps LocalNotifications.requestPermissions() with caching + native guard.
 */
export const requestNotificationPermissions = (): Promise<boolean> => requestPermission();

export async function requestPermission(): Promise<boolean> {
  console.log("[notifications] Native platform:", isNativePlatform());
  if (!isNativePlatform()) return false;
  if (permissionGranted) {
    console.log("[notifications] Permission already granted");
    return true;
  }

  try {
    const status: PermissionStatus = await LocalNotifications.checkPermissions();
    if (status.display === "granted") {
      permissionGranted = true;
      console.log("[notifications] Permission granted (already)");
      return true;
    }
    if (status.display === "denied") {
      console.log("[notifications] Permission denied (system level)");
      return false;
    }
    const req = await LocalNotifications.requestPermissions();
    permissionGranted = req.display === "granted";
    console.log(
      permissionGranted
        ? "[notifications] Permission granted"
        : "[notifications] Permission denied",
    );
    return permissionGranted;
  } catch (err) {
    console.warn("[notifications] permission check failed", err);
    return false;
  }
}

export async function initNotifications(): Promise<boolean> {
  console.log("[notifications] Native platform:", isNativePlatform());
  if (!isNativePlatform()) return false;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const granted = await requestPermission();
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
      console.log("[notifications] Android channel created");
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

/**
 * Schedule a one-off notification at the given date/time.
 * Auto-generates a numeric id; safe to call from anywhere.
 */
export async function scheduleNotification(
  title: string,
  body: string,
  date: Date | string | number,
): Promise<ScheduleResult> {
  if (!isNativePlatform()) {
    console.log("[notifications] scheduleNotification skipped (web)");
    return { scheduled: false, reason: "not-native" };
  }
  const granted = await initNotifications();
  if (!granted) return { scheduled: false, reason: "no-permission" };

  const at = date instanceof Date ? date : new Date(date);
  if (isNaN(at.getTime()) || at.getTime() <= Date.now()) {
    console.warn("[notifications] scheduleNotification: time is in the past", at);
    return { scheduled: false, reason: "past-time" };
  }

  const id = ((Date.now() & 0x7fffffff) >>> 0) || 1;
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
          schedule: { at, allowWhileIdle: true },
          channelId: "ascend-default",
          smallIcon: "ic_stat_icon",
        },
      ],
    });
    console.log("[notifications] Notification scheduled", { id, at: at.toISOString(), title });
    return { scheduled: true, notificationId: id };
  } catch (err) {
    console.warn("[notifications] schedule failed", err);
    return { scheduled: false, reason: "error" };
  }
}

interface TaskLike {
  id: string;
  name?: string;
  title?: string;
  description?: string | null;
  body?: string;
  startTime?: Date | string | number | null;
  date?: Date | string | number | null;
}

/**
 * Schedule a notification tied to a task. Two call shapes are supported:
 *   scheduleTaskNotification(task)
 *   scheduleTaskNotification(taskId, title, body, date)
 */
export async function scheduleTaskNotification(
  taskOrId: TaskLike | string,
  title?: string,
  body?: string,
  dateTime?: Date | string | number,
  extraData?: Record<string, unknown>,
): Promise<ScheduleResult> {
  let id: string;
  let resolvedTitle: string;
  let resolvedBody: string;
  let resolvedDate: Date | string | number | null | undefined;

  if (typeof taskOrId === "string") {
    id = taskOrId;
    resolvedTitle = title ?? "Reminder";
    resolvedBody = body ?? "";
    resolvedDate = dateTime;
  } else {
    id = taskOrId.id;
    resolvedTitle = taskOrId.title ?? taskOrId.name ?? "Reminder";
    resolvedBody = taskOrId.body ?? taskOrId.description ?? "";
    resolvedDate = taskOrId.startTime ?? taskOrId.date;
  }

  if (!isNativePlatform()) {
    return { scheduled: false, reason: "not-native" };
  }
  if (resolvedDate == null) {
    console.warn("[notifications] scheduleTaskNotification: no date", id);
    return { scheduled: false, reason: "past-time" };
  }
  const granted = await initNotifications();
  if (!granted) return { scheduled: false, reason: "no-permission" };

  const at = resolvedDate instanceof Date ? resolvedDate : new Date(resolvedDate);
  if (isNaN(at.getTime()) || at.getTime() <= Date.now()) {
    return { scheduled: false, reason: "past-time" };
  }

  const numericId = stableNotificationId(id);
  const notification: LocalNotificationSchema = {
    id: numericId,
    title: resolvedTitle,
    body: resolvedBody,
    schedule: { at, allowWhileIdle: true },
    channelId: "ascend-default",
    smallIcon: "ic_stat_icon",
    extra: { taskId: id, ...(extraData ?? {}) },
  };

  try {
    await LocalNotifications.cancel({ notifications: [{ id: numericId }] }).catch(() => {});
    const opts: ScheduleOptions = { notifications: [notification] };
    await LocalNotifications.schedule(opts);
    console.log("[notifications] Notification scheduled (task)", {
      id: numericId,
      taskId: id,
      at: at.toISOString(),
      title: resolvedTitle,
    });
    return { scheduled: true, notificationId: numericId };
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
