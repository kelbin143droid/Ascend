import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useGame } from "@/context/GameContext";
import { useQueryClient } from "@tanstack/react-query";
import { ACTIVE_DUNGEON_KEY, CLEARED_GATE_KEY } from "@/lib/gateConfig";

// ── Stats ─────────────────────────────────────────────────────────────────────

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

// ── Equipment ─────────────────────────────────────────────────────────────────

type GodotRarity   = "Common" | "Rare" | "Epic" | "Legendary";
type GodotSlot     = "Weapon" | "Helmet" | "Chest" | "Gloves" | "Boots";
type GodotEquipment = Partial<Record<GodotSlot, { name: string; rarity: GodotRarity }>>;

const RARITY_MAP: Record<string, GodotRarity> = {
  T1: "Common", T2: "Rare", T3: "Epic", T4: "Legendary", T5: "Legendary",
};

const SLOT_MAP: Array<[string, GodotSlot]> = [
  ["weapon", "Weapon"], ["armor", "Chest"], ["accessory", "Gloves"],
];

function buildEquipment(player: NonNullable<ReturnType<typeof useGame>["player"]>): GodotEquipment {
  const eq  = (player as any).equipment as Record<string, string | null> | null;
  const inv = (player as any).inventory as Array<{ id: string; name: string; rarity: string }> | null;
  if (!eq || !inv) return {};
  const result: GodotEquipment = {};
  for (const [dbSlot, godotSlot] of SLOT_MAP) {
    const itemId = eq[dbSlot];
    if (!itemId) continue;
    const item = inv.find((i) => i.id === itemId);
    if (!item) continue;
    result[godotSlot] = { name: item.name, rarity: RARITY_MAP[item.rarity] ?? "Common" };
  }
  return result;
}

// ── Dungeon config type (written to localStorage by WorldMapPage) ─────────────

interface ActiveDungeonConfig {
  dungeon: string;
  rank: string;
  waves: number;
  gateId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GodotGamePage() {
  const { player }    = useGame();
  const queryClient   = useQueryClient();
  const [, navigate]  = useLocation();
  const iframeRef     = useRef<HTMLIFrameElement>(null);
  const readyRef      = useRef(false);

  // ── Stats: send on ready + whenever player changes ─────────────────────────
  const sendStats = useCallback((overrideStats?: GameStats) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !readyRef.current) return;
    const stats = overrideStats ?? (player ? buildStats(player) : null);
    if (!stats) return;
    iframe.contentWindow.postMessage({ type: "SET_STATS", stats }, "*");
  }, [player]);

  useEffect(() => { if (readyRef.current) sendStats(); }, [sendStats]);

  useEffect(() => {
    const handler = (e: Event) => {
      const stats = (e as CustomEvent<GameStats>).detail;
      if (readyRef.current && iframeRef.current?.contentWindow && stats)
        iframeRef.current.contentWindow.postMessage({ type: "SET_STATS", stats }, "*");
    };
    window.addEventListener("ascend:stats-updated", handler);
    return () => window.removeEventListener("ascend:stats-updated", handler);
  }, []);

  // ── Equipment: send on ready + whenever player changes ─────────────────────
  const sendEquipment = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !readyRef.current || !player) return;
    iframe.contentWindow.postMessage({ type: "SET_EQUIPMENT", equipment: buildEquipment(player) }, "*");
  }, [player]);

  useEffect(() => { if (readyRef.current) sendEquipment(); }, [sendEquipment]);

  useEffect(() => {
    const handler = (e: Event) => {
      const equipment = (e as CustomEvent<GodotEquipment>).detail;
      if (readyRef.current && iframeRef.current?.contentWindow && equipment)
        iframeRef.current.contentWindow.postMessage({ type: "SET_EQUIPMENT", equipment }, "*");
    };
    window.addEventListener("ascend:equipment-updated", handler);
    return () => window.removeEventListener("ascend:equipment-updated", handler);
  }, []);

  // ── postMessage handler (GODOT_READY / RUN_RESULT) ─────────────────────────
  useEffect(() => {
    if (!player?.id) return;

    const handleMessage = async (e: MessageEvent) => {
      const data = e.data as {
        type?: string;
        result?: { outcome?: string; wave?: number; kills?: number; xp?: number };
      };

      if (data?.type === "GODOT_READY") {
        readyRef.current = true;
        const iframe = iframeRef.current;
        if (player && iframe?.contentWindow) {
          // 1. Power layer
          iframe.contentWindow.postMessage({ type: "SET_STATS",     stats:     buildStats(player) },     "*");
          // 2. Visual layer
          iframe.contentWindow.postMessage({ type: "SET_EQUIPMENT", equipment: buildEquipment(player) }, "*");
          // 3. Dungeon config — if launched from the world map
          const raw = localStorage.getItem(ACTIVE_DUNGEON_KEY);
          if (raw) {
            try {
              const config = JSON.parse(raw) as ActiveDungeonConfig;
              iframe.contentWindow.postMessage(
                { type: "START_DUNGEON", config: { dungeon: config.dungeon, rank: config.rank, waves: config.waves } },
                "*",
              );
            } catch {/* malformed — ignore */}
            localStorage.removeItem(ACTIVE_DUNGEON_KEY);
          }
        }
        return;
      }

      if (data?.type === "RUN_RESULT") {
        const xp      = data.result?.xp ?? 0;
        const outcome = data.result?.outcome ?? "";
        const raw     = localStorage.getItem("_last_gate_id");   // written just before navigate

        // Grant XP
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

        // On victory, tell the world map which gate to remove
        if (outcome === "victory" && raw) {
          localStorage.setItem(CLEARED_GATE_KEY, raw);
          localStorage.removeItem("_last_gate_id");
        }

        // Navigate back to the world map regardless of outcome
        readyRef.current = false;
        navigate("/world-map");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [player?.id, queryClient, navigate]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 10 }}>
      <iframe
        id="game-frame"
        ref={iframeRef}
        src="/game/index.html"
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        allow="pointer-lock; fullscreen; autoplay"
        allowFullScreen
        title="SoloHeroWars"
        data-testid="iframe-godot-game"
      />
    </div>
  );
}
