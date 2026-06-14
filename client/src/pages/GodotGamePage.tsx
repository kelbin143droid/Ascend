import { useCallback, useEffect, useRef } from "react";
import { useGame } from "@/context/GameContext";
import { useQueryClient } from "@tanstack/react-query";

type GameStats = { STR: number; AGI: number; VIT: number; SEN: number; INT: number; DIS: number };

function buildStats(player: NonNullable<ReturnType<typeof useGame>["player"]>): GameStats {
  const s = (player.stats ?? {}) as Record<string, number>;
  const b = (player.bonusStats ?? {}) as Record<string, number>;
  return {
    STR: (s.strength   ?? 0) + (b.strength   ?? 0),
    AGI: (s.agility    ?? 0) + (b.agility    ?? 0),
    VIT: (s.vitality   ?? 0) + (b.vitality   ?? 0),
    SEN: (s.sense      ?? 0) + (b.sense      ?? 0),
    INT: 0,
    DIS: (s.discipline ?? 0) + (b.discipline ?? 0),
  };
}

export default function GodotGamePage() {
  const { player } = useGame();
  const queryClient = useQueryClient();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef  = useRef(false);

  const sendStats = useCallback((overrideStats?: GameStats) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !readyRef.current) return;
    const stats = overrideStats ?? (player ? buildStats(player) : null);
    if (!stats) return;
    iframe.contentWindow.postMessage({ type: "SET_STATS", stats }, "*");
  }, [player]);

  useEffect(() => {
    if (readyRef.current) sendStats();
  }, [sendStats]);

  useEffect(() => {
    const handler = (e: Event) => {
      const stats = (e as CustomEvent<GameStats>).detail;
      if (readyRef.current && iframeRef.current?.contentWindow && stats) {
        iframeRef.current.contentWindow.postMessage({ type: "SET_STATS", stats }, "*");
      }
    };
    window.addEventListener("ascend:stats-updated", handler);
    return () => window.removeEventListener("ascend:stats-updated", handler);
  }, []);

  useEffect(() => {
    if (!player?.id) return;

    const handleMessage = async (e: MessageEvent) => {
      const data = e.data as { type?: string; result?: { outcome?: string; wave?: number; kills?: number; xp?: number } };

      if (data?.type === "GODOT_READY") {
        readyRef.current = true;
        if (player) {
          iframeRef.current?.contentWindow?.postMessage(
            { type: "SET_STATS", stats: buildStats(player) },
            "*",
          );
        }
        return;
      }

      if (data?.type === "RUN_RESULT") {
        const xp = data.result?.xp ?? 0;
        if (xp > 0) {
          try {
            await fetch(`/api/player/${player.id}/gain-exp`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount: xp }),
            });
            queryClient.invalidateQueries({ queryKey: ["player", player.id] });
            queryClient.invalidateQueries({ queryKey: ["home",   player.id] });
          } catch (err) {
            console.error("[GodotGame] RUN_RESULT XP award failed:", err);
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [player?.id, queryClient]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 10,
      }}
    >
      <iframe
        id="game-frame"
        ref={iframeRef}
        src="/game/index.html"
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        allow="autoplay; fullscreen"
        title="SoloHeroWars"
        data-testid="iframe-godot-game"
      />
    </div>
  );
}
