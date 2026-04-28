import { useEffect, useRef } from "react";
import { useGame } from "@/context/GameContext";
import {
  shouldUseVoiceAlerts,
  getNotificationPrefs,
  subscribeNotificationPrefs,
} from "@/lib/notificationModeStore";
import { speak } from "@/lib/voiceAlerts";
import { useToast } from "@/hooks/use-toast";

/**
 * Background ticker (mounted once near the app root) that:
 *  1. Fires in-app visual toast alerts when a scheduled block is starting NOW
 *     (within a 2-minute window) — works on web and native, no permission needed.
 *  2. Optionally announces the block via voice when voice-alerts mode is on.
 *
 * Each block is alerted at most once per day to avoid spam.
 */
export function VoiceAlertEngine() {
  const { player } = useGame();
  const { toast } = useToast();
  const announcedRef = useRef<Set<string>>(new Set());
  const toastedRef = useRef<Set<string>>(new Set());
  const lastDayRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tick = () => {
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
        toastedRef.current = new Set();
        lastDayRef.current = dayKey;
      }

      const prefs = getNotificationPrefs();
      const leadMin = Math.max(0, prefs.voiceLeadMinutes ?? 1);
      const nowMin = now.getHours() * 60 + now.getMinutes();

      for (const block of schedule) {
        const startMin = block.startHour * 60 + (block.startMinute ?? 0);
        const delta = startMin - nowMin;

        // ── Visual in-app toast: fires when the block starts (delta 0–2 min)
        const toastKey = `toast:${dayKey}:${block.id}`;
        if (delta >= 0 && delta <= 2 && !toastedRef.current.has(toastKey)) {
          toastedRef.current.add(toastKey);
          const label = delta === 0 ? "Starting now" : `Starting in ${delta} min`;
          const isDailyFlow = block.id.startsWith("daily-flow") || block.id.startsWith("daily");
          toast({
            title: isDailyFlow ? "⚡ Daily Flow" : `🔔 ${block.name}`,
            description: isDailyFlow
              ? `${label} — open the app to begin your training.`
              : `${block.name} — ${label}.`,
            duration: 8000,
          });
        }

        // ── Voice announcement: fires within voiceLeadMinutes window
        if (!shouldUseVoiceAlerts()) continue;
        if (delta < 0 || delta > leadMin) continue;
        const voiceKey = `voice:${dayKey}:${block.id}`;
        if (announcedRef.current.has(voiceKey)) continue;
        announcedRef.current.add(voiceKey);

        const minLabel =
          delta <= 0 ? "now" : delta === 1 ? "in one minute" : `in ${delta} minutes`;
        speak(`Heads up. ${block.name} ${minLabel}.`);
        break;
      }
    };

    const unsub = subscribeNotificationPrefs(() => tick());
    const id = window.setInterval(tick, 30_000);
    tick();

    return () => {
      window.clearInterval(id);
      unsub();
    };
  }, [player?.id, (player as any)?.schedule, toast]);

  return null;
}
