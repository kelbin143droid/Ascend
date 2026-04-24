import { useEffect, useRef } from "react";
import { useGame } from "@/context/GameContext";
import {
  shouldUseVoiceAlerts,
  getNotificationPrefs,
  subscribeNotificationPrefs,
} from "@/lib/notificationModeStore";
import { speak } from "@/lib/voiceAlerts";

/**
 * Background ticker (mounted once near the app root) that watches the
 * sectograph schedule and announces the next upcoming block once it
 * enters the "voiceLeadMinutes" window. Each block is announced at most
 * once per day.
 */
export function VoiceAlertEngine() {
  const { player } = useGame();
  const announcedRef = useRef<Set<string>>(new Set());
  const lastDayRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tick = () => {
      if (!shouldUseVoiceAlerts()) return;
      const schedule = (player as any)?.schedule as Array<{
        id: string;
        name: string;
        startHour: number;
        startMinute?: number;
      }> | undefined;
      if (!schedule || schedule.length === 0) return;

      const now = new Date();
      const dayKey = now.toDateString();
      if (dayKey !== lastDayRef.current) {
        announcedRef.current = new Set();
        lastDayRef.current = dayKey;
      }

      const prefs = getNotificationPrefs();
      const leadMin = Math.max(0, prefs.voiceLeadMinutes ?? 1);
      const nowMin = now.getHours() * 60 + now.getMinutes();

      // Find the next block within the lead window that hasn't been announced.
      for (const block of schedule) {
        const startMin = block.startHour * 60 + (block.startMinute ?? 0);
        const delta = startMin - nowMin;
        if (delta < 0 || delta > leadMin) continue;
        const key = `${dayKey}:${block.id}`;
        if (announcedRef.current.has(key)) continue;
        announcedRef.current.add(key);

        const minLabel =
          delta <= 0 ? "now" : delta === 1 ? "in one minute" : `in ${delta} minutes`;
        const message = `Heads up. ${block.name} ${minLabel}.`;
        speak(message);
        // Only one announcement per tick to avoid overlap.
        break;
      }
    };

    // Re-run when prefs change so a freshly enabled toggle activates without reload.
    const unsub = subscribeNotificationPrefs(() => tick());
    const id = window.setInterval(tick, 30_000); // every 30 seconds
    tick(); // immediate check on mount / dep change

    return () => {
      window.clearInterval(id);
      unsub();
    };
  }, [player?.id, (player as any)?.schedule]);

  return null;
}
