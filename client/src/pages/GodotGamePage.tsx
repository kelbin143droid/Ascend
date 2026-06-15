import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useGame } from "@/context/GameContext";
import { useQueryClient } from "@tanstack/react-query";
import { ACTIVE_DUNGEON_KEY, CLEARED_GATE_KEY } from "@/lib/gateConfig";
import {
  addGold,
  addLoot,
  getOwnedConsumables,
  getOwnedGear,
  setOwnedConsumables,
  type ConsumableInventory,
  type GodotEquipment,
  type GodotRarity,
  type GodotSlot,
} from "@/lib/godotEconomyStore";

// ── Stats ─────────────────────────────────────────────────────────────────────

type GameStats = { STR: number; AGI: number; VIT: number; SEN: number; INT: number; DIS: number };
type GameStatsPayload = GameStats & { items: ConsumableInventory };

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

function buildStatsPayload(player: NonNullable<ReturnType<typeof useGame>["player"]>): GameStatsPayload {
  return { ...buildStats(player), items: getOwnedConsumables() };
}

function buildLoadoutEquipment(player: NonNullable<ReturnType<typeof useGame>["player"]>): GodotEquipment {
  const ownedGear = getOwnedGear();
  return Object.keys(ownedGear).length > 0 ? ownedGear : buildEquipment(player);
}

// ── Dungeon config type (written to localStorage by WorldMapPage) ─────────────

interface ActiveDungeonConfig {
  dungeon: string;
  rank: string;
  waves: number;
  gateId: string;
}

// ── Orientation helpers ────────────────────────────────────────────────────────

function isPortraitNow() {
  if (screen.orientation) return screen.orientation.type.startsWith("portrait");
  return window.innerHeight > window.innerWidth;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GodotGamePage() {
  const { player }    = useGame();
  const queryClient   = useQueryClient();
  const [, navigate]  = useLocation();
  const iframeRef     = useRef<HTMLIFrameElement>(null);
  const readyRef      = useRef(false);
  const [portrait, setPortrait] = useState(isPortraitNow);

  // ── Fullscreen + orientation lock ─────────────────────────────────────────
  useEffect(() => {
    // Request fullscreen to hide browser chrome / address bar
    const el = document.documentElement;
    const reqFs = el.requestFullscreen?.bind(el)
      ?? (el as any).webkitRequestFullscreen?.bind(el);
    if (reqFs) reqFs({ navigationUI: "hide" }).catch(() => {});

    // Lock to landscape once fullscreen is granted (required on some browsers)
    const onFsChange = () => {
      if (document.fullscreenElement && screen.orientation?.lock) {
        screen.orientation.lock("landscape").catch(() => {});
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);

    // Fallback: lock orientation even without fullscreen (works on some Android)
    if (screen.orientation?.lock) {
      screen.orientation.lock("landscape").catch(() => {});
    }

    const update = () => setPortrait(isPortraitNow());
    screen.orientation?.addEventListener("change", update);
    window.addEventListener("resize", update);
    update();

    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      screen.orientation?.removeEventListener("change", update);
      window.removeEventListener("resize", update);
      if (screen.orientation?.unlock) screen.orientation.unlock();
    };
  }, []);

  // ── Stats: send on ready + whenever player changes ─────────────────────────
  const sendStats = useCallback((overrideStats?: GameStatsPayload) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !readyRef.current) return;
    const stats = overrideStats ?? (player ? buildStatsPayload(player) : null);
    if (!stats) return;
    iframe.contentWindow.postMessage({ type: "SET_STATS", stats }, "*");
  }, [player]);

  useEffect(() => { if (readyRef.current) sendStats(); }, [sendStats]);

  useEffect(() => {
    const handler = (e: Event) => {
      const stats = (e as CustomEvent<GameStatsPayload>).detail;
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
    iframe.contentWindow.postMessage({ type: "SET_EQUIPMENT", equipment: buildLoadoutEquipment(player) }, "*");
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
        result?: {
          outcome?: string;
          wave?: number;
          kills?: number;
          xp?: number;
          gold?: number;
          loot?: unknown;
          items?: unknown;
        };
      };

      if (data?.type === "GODOT_READY") {
        readyRef.current = true;
        const iframe = iframeRef.current;
        if (player && iframe?.contentWindow) {
          // 1. Power layer + consumables
          iframe.contentWindow.postMessage({ type: "SET_STATS", stats: buildStatsPayload(player) }, "*");
          // 2. Visual/loadout layer
          iframe.contentWindow.postMessage({ type: "SET_EQUIPMENT", equipment: buildLoadoutEquipment(player) }, "*");
          // 3. Dungeon config — if launched from the world map
          const raw = localStorage.getItem(ACTIVE_DUNGEON_KEY);
          if (raw) {
            try {
              const config = JSON.parse(raw) as ActiveDungeonConfig;
              iframe.contentWindow.postMessage({ type: "SET_STATS", stats: buildStatsPayload(player) }, "*");
              iframe.contentWindow.postMessage({ type: "SET_EQUIPMENT", equipment: buildLoadoutEquipment(player) }, "*");
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
        const gold    = data.result?.gold ?? 0;
        const outcome = data.result?.outcome ?? "";
        const raw     = localStorage.getItem("_last_gate_id");   // written just before navigate

        if (gold > 0) addGold(gold);
        if (data.result?.loot !== undefined) addLoot(data.result.loot);
        if (data.result?.items !== undefined) setOwnedConsumables(data.result.items);

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

      {/* Portrait-mode blocker */}
      {portrait && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "#060d1a",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 20,
        }}>
          {/* Animated phone-rotate icon */}
          <div style={{
            fontSize: 72,
            animation: "rotate-hint 1.8s ease-in-out infinite",
          }}>📱</div>
          <div style={{
            color: "#e2e8f0", fontWeight: 700, fontSize: 18,
            fontFamily: "'Chakra Petch', sans-serif", letterSpacing: 2,
            textAlign: "center",
          }}>
            ROTATE DEVICE
          </div>
          <div style={{
            color: "#64748b", fontSize: 13, textAlign: "center", maxWidth: 240, lineHeight: 1.6,
          }}>
            This dungeon requires landscape mode. Turn your phone sideways to continue.
          </div>
          <style>{`
            @keyframes rotate-hint {
              0%   { transform: rotate(0deg);   }
              30%  { transform: rotate(-90deg); }
              70%  { transform: rotate(-90deg); }
              100% { transform: rotate(0deg);   }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
