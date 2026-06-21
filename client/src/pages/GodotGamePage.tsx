import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useGame } from "@/context/GameContext";
import { ACTIVE_DUNGEON_KEY, CLEARED_GATE_KEY, GATE_CONFIG, type GateRank } from "@/lib/gateConfig";
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

type GameClassId = "warrior" | "mage" | "assassin" | "archer";
type GameArchetypeId = "warrior" | "sage" | "shadow" | "warden";
type GameClassPayload = {
  id: GameClassId;
  name: string;
  job: string;
  index: number;
  archetype: GameArchetypeId;
  godotClass: GameArchetypeId;
  classId: GameClassId;
  characterClass: GameClassId;
  className: string;
  classIndex: number;
};
type GameStats = { STR: number; AGI: number; VIT: number; SEN: number; INT: number; DIS: number };
type CombatStats = {
  attackDamage: number;
  staminaMax: number;
  defense: number;
  hpRegen: number;
  maxHp: number;
  attackSpeed: number;
  movementSpeed: number;
  manaRegen: number;
  cooldownReduction: number;
  maxMp: number;
  critChance: number;
  dodgeChance: number;
  dungeonEnergy: number;
  rewardChance: number;
};
type GameStatsPayload = GameStats & {
  items: ConsumableInventory;
  classId: GameClassId;
  characterClass: GameClassId;
  className: string;
  job: string;
  archetype: GameArchetypeId;
  godotClass: GameArchetypeId;
  combat: CombatStats;
  derived: CombatStats;
};

const SELECTED_GAME_CLASS_KEY = "ascend_selected_game_class";
const SELECTED_GAME_CLASS_ID_KEY = "ascend_selected_game_class_id";
const SELECTED_GAME_ARCHETYPE_KEY = "ascend_avatar_archetype";

function makeClassPayload(
  id: GameClassId,
  name: string,
  job: string,
  index: number,
  archetype: GameArchetypeId,
): GameClassPayload {
  return {
    id,
    name,
    job,
    index,
    archetype,
    godotClass: archetype,
    classId: id,
    characterClass: id,
    className: name,
    classIndex: index,
  };
}

const CLASS_BY_INDEX: GameClassPayload[] = [
  makeClassPayload("warrior", "Warrior", "WARRIOR", 0, "warrior"),
  makeClassPayload("mage", "Mage", "SAGE", 1, "sage"),
  makeClassPayload("assassin", "Assassin", "SHADOW", 2, "shadow"),
  makeClassPayload("archer", "Archer", "WARDEN", 3, "warden"),
];

const CLASS_BY_JOB: Record<string, GameClassPayload> = {
  WARRIOR: CLASS_BY_INDEX[0],
  SAGE: CLASS_BY_INDEX[1],
  MAGE: CLASS_BY_INDEX[1],
  SHADOW: CLASS_BY_INDEX[2],
  ASSASSIN: CLASS_BY_INDEX[2],
  WARDEN: CLASS_BY_INDEX[3],
  ARCHER: CLASS_BY_INDEX[3],
};

function buildPlayerClass(player: NonNullable<ReturnType<typeof useGame>["player"]>): GameClassPayload {
  try {
    const raw = localStorage.getItem(SELECTED_GAME_CLASS_KEY);
    if (raw !== null) {
      const index = Number(raw);
      if (Number.isInteger(index) && CLASS_BY_INDEX[index]) return CLASS_BY_INDEX[index];
    }
  } catch {
    /* noop */
  }
  const job = String(player.job || "").toUpperCase();
  return CLASS_BY_JOB[job] ?? CLASS_BY_INDEX[0];
}

function persistPlayerClassBridge(playerClass: GameClassPayload) {
  try {
    localStorage.setItem(SELECTED_GAME_CLASS_KEY, String(playerClass.index));
    localStorage.setItem(SELECTED_GAME_CLASS_ID_KEY, playerClass.id);
    localStorage.setItem(SELECTED_GAME_ARCHETYPE_KEY, playerClass.archetype);
    localStorage.setItem("ascend_game_class", playerClass.id);
    localStorage.setItem("ascend_game_archetype", playerClass.archetype);
  } catch {
    /* noop */
  }
  (window as any).__ASCEND_PLAYER_CLASS__ = playerClass;
}

function buildClassBridgeMessages(playerClass: GameClassPayload) {
  const base = {
    classId: playerClass.id,
    characterClass: playerClass.id,
    className: playerClass.name,
    classIndex: playerClass.index,
    job: playerClass.job,
    archetype: playerClass.archetype,
    godotClass: playerClass.godotClass,
    playerClass,
    class: playerClass,
  };
  return [
    { type: "SET_CLASS", ...base },
    { type: "SET_PLAYER_CLASS", ...base },
    { type: "SET_CHARACTER_CLASS", ...base },
    { type: "SET_ARCHETYPE", ...base },
    { type: "SELECT_CLASS", ...base },
  ];
}

function postPlayerClassToGame(target: Window, playerClass: GameClassPayload) {
  persistPlayerClassBridge(playerClass);
  for (const message of buildClassBridgeMessages(playerClass)) {
    target.postMessage(message, "*");
  }
}

function buildStats(player: NonNullable<ReturnType<typeof useGame>["player"]>): GameStats {
  const s = (player.stats ?? {}) as Record<string, number>;
  const b = (player.bonusStats ?? {}) as Record<string, number>;
  return {
    STR: (s.strength   ?? 0) + (b.strength   ?? 0),
    AGI: (s.agility    ?? 0) + (b.agility    ?? 0),
    VIT: (s.vitality   ?? 0) + (b.vitality   ?? 0),
    SEN: (s.sense      ?? 0) + (b.sense      ?? 0),
    INT: (s.intelligence ?? 0) + (b.intelligence ?? 0),
    DIS: (s.discipline ?? 0) + (b.discipline ?? 0),
  };
}

function buildCombatStats(stats: GameStats): CombatStats {
  return {
    attackDamage: 10 + stats.STR * 4,
    staminaMax: 100 + stats.STR * 12 + stats.DIS * 4,
    defense: stats.VIT * 3,
    hpRegen: Number((stats.VIT * 0.25).toFixed(2)),
    maxHp: 100 + stats.VIT * 10,
    attackSpeed: Number((1 + stats.AGI * 0.025).toFixed(3)),
    movementSpeed: Number((1 + stats.AGI * 0.025).toFixed(3)),
    manaRegen: Number((stats.SEN * 0.3).toFixed(2)),
    cooldownReduction: Math.min(0.45, Number((stats.SEN * 0.012).toFixed(3))),
    maxMp: 50 + stats.SEN * 6,
    critChance: Math.min(0.5, Number((stats.INT * 0.015).toFixed(3))),
    dodgeChance: Math.min(0.45, Number((stats.INT * 0.012).toFixed(3))),
    dungeonEnergy: 100 + stats.DIS * 4,
    rewardChance: Math.min(0.5, Number((stats.DIS * 0.01).toFixed(3))),
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
  const playerClass = buildPlayerClass(player);
  const stats = buildStats(player);
  const combat = buildCombatStats(stats);
  return {
    ...stats,
    items: getOwnedConsumables(),
    classId: playerClass.id,
    characterClass: playerClass.id,
    className: playerClass.name,
    job: playerClass.job,
    archetype: playerClass.archetype,
    godotClass: playerClass.godotClass,
    combat,
    derived: combat,
  };
}

function buildLoadoutEquipment(player: NonNullable<ReturnType<typeof useGame>["player"]>): GodotEquipment {
  const ownedGear = getOwnedGear();
  return Object.keys(ownedGear).length > 0 ? ownedGear : buildEquipment(player);
}

function buildDungeonConfig(config: ActiveDungeonConfig, player: NonNullable<ReturnType<typeof useGame>["player"]>) {
  const playerClass = buildPlayerClass(player);
  return {
    dungeon: config.dungeon,
    rank: config.rank,
    waves: config.waves,
    classId: playerClass.id,
    characterClass: playerClass.id,
    className: playerClass.name,
    job: playerClass.job,
    classIndex: playerClass.index,
    archetype: playerClass.archetype,
    godotClass: playerClass.godotClass,
    playerClass,
  };
}

// ── Dungeon config type (written to localStorage by WorldMapPage) ─────────────

interface ActiveDungeonConfig {
  dungeon: string;
  rank: GateRank | string;
  waves: number;
  gateId: string;
}

const GATE_LOADING_MIN_MS = 2200;
const GATE_LOADING_BG = "/videos/gate-loading-bg.mp4";

function isGateRank(rank: string): rank is GateRank {
  return rank in GATE_CONFIG;
}

function normalizeGateRank(rank: ActiveDungeonConfig["rank"] | undefined): GateRank {
  const normalized = String(rank ?? "E").toUpperCase();
  return isGateRank(normalized) ? normalized : "E";
}

function readActiveDungeonConfig(): ActiveDungeonConfig | null {
  try {
    const raw = localStorage.getItem(ACTIVE_DUNGEON_KEY);
    return raw ? (JSON.parse(raw) as ActiveDungeonConfig) : null;
  } catch {
    return null;
  }
}

function GateLoadingOverlay({ config }: { config: ActiveDungeonConfig | null }) {
  const rank = normalizeGateRank(config?.rank);
  const rankColor = GATE_CONFIG[rank].color;
  const dungeonName = config?.dungeon ?? "Unknown Gate";

  return (
    <div
      className="gate-loading-screen"
      data-testid="gate-loading-screen"
      style={{ ["--gate-rank-color" as string]: rankColor }}
    >
      <video
        className="gate-loading-video"
        src={GATE_LOADING_BG}
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="gate-loading-vignette" />
      <div className="gate-loading-copy">
        <div className="gate-loading-emblem">{rank}</div>
        <div className="gate-loading-rule" />
        <div className="gate-loading-rank">
          GATE LEVEL: RANK <span>{rank}</span> (INSTANCED)
        </div>
        <div className="gate-loading-dungeon">{dungeonName.toUpperCase()}</div>
        <div className="gate-loading-bar">
          <span className="gate-runes gate-runes-left">ᚠ ᚱ ᚨ ᚾ ᛞ</span>
          <strong>LOADING DUNGEON...</strong>
          <span className="gate-runes gate-runes-right">ᚦ ᚺ ᛒ ᛗ ᛉ</span>
        </div>
        <div className="gate-loading-instance">ENTERING INSTANCE...</div>
      </div>
      <div className="gate-loading-corner" />
    </div>
  );
}

// ── Orientation helpers ────────────────────────────────────────────────────────

function isPortraitNow() {
  if (screen.orientation) return screen.orientation.type.startsWith("portrait");
  return window.innerHeight > window.innerWidth;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GodotGamePage() {
  const { player }    = useGame();
  const [, navigate]  = useLocation();
  const iframeRef     = useRef<HTMLIFrameElement>(null);
  const readyRef      = useRef(false);
  const [portrait, setPortrait] = useState(isPortraitNow);
  const [activeDungeon] = useState<ActiveDungeonConfig | null>(() => readActiveDungeonConfig());
  const [showGateLoading, setShowGateLoading] = useState(() => !!readActiveDungeonConfig());
  const loadingStartedAtRef = useRef(Date.now());
  const [gameSrc, setGameSrc] = useState("about:blank");

  useEffect(() => {
    if (!player) return;
    persistPlayerClassBridge(buildPlayerClass(player));
  }, [player]);

  // Delay iframe src by 400ms so any previous WebGL context (Three.js on
  // HunterProfilePage) has time to fully dispose before Godot creates its own.
  useEffect(() => {
    if (!player) return;
    const cls = buildPlayerClass(player);
    const src = `/game/index.html?class=${cls.archetype}&classId=${cls.id}&classIndex=${cls.index}`;
    const t = setTimeout(() => setGameSrc(src), 800);
    return () => clearTimeout(t);
  }, [player]);

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

  const sendPlayerClass = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !readyRef.current || !player) return;
    const playerClass = buildPlayerClass(player);
    postPlayerClassToGame(iframe.contentWindow, playerClass);
  }, [player]);

  useEffect(() => { if (readyRef.current) sendPlayerClass(); }, [sendPlayerClass]);

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
          gold?: number;
          loot?: unknown;
          items?: unknown;
        };
      };

      if (data?.type === "GODOT_READY") {
        readyRef.current = true;
        const iframe = iframeRef.current;
        // Focus the iframe so browser doesn't throttle it
        iframe?.focus();
        if (player && iframe?.contentWindow) {
          const playerClass = buildPlayerClass(player);
          const statsPayload = buildStatsPayload(player);
          const equipment    = buildLoadoutEquipment(player);
          // 1. Power layer + consumables
          iframe.contentWindow.postMessage({ type: "SET_STATS", stats: statsPayload }, "*");
          // 2. Class + visual/loadout layer
          postPlayerClassToGame(iframe.contentWindow, playerClass);
          iframe.contentWindow.postMessage({ type: "SET_EQUIPMENT", equipment }, "*");
          // 3. Dungeon config — if launched from the world map (no duplicate sends)
          const raw = localStorage.getItem(ACTIVE_DUNGEON_KEY);
          if (raw) {
            try {
              const config = JSON.parse(raw) as ActiveDungeonConfig;
              iframe.contentWindow.postMessage(
                { type: "START_DUNGEON", config: buildDungeonConfig(config, player) },
                "*",
              );
            } catch {/* malformed — ignore */}
            localStorage.removeItem(ACTIVE_DUNGEON_KEY);
          }
        }
        const elapsed = Date.now() - loadingStartedAtRef.current;
        window.setTimeout(() => setShowGateLoading(false), Math.max(0, GATE_LOADING_MIN_MS - elapsed));
        return;
      }

      if (data?.type === "RUN_RESULT") {
        const gold    = data.result?.gold ?? 0;
        const outcome = data.result?.outcome ?? "";
        const raw     = localStorage.getItem("_last_gate_id");   // written just before navigate
        const playerQuit = outcome === "quit";

        if (!playerQuit) {
          if (gold > 0) addGold(gold);
          if (data.result?.loot !== undefined) addLoot(data.result.loot);
          if (data.result?.items !== undefined) setOwnedConsumables(data.result.items);
        }

        // On victory, tell the world map which gate to remove
        if (outcome === "victory" && raw) {
          localStorage.setItem(CLEARED_GATE_KEY, raw);
          localStorage.removeItem("_last_gate_id");
        }
        if (playerQuit) localStorage.removeItem("_last_gate_id");

        // Navigate back to the world map regardless of outcome
        readyRef.current = false;
        navigate("/world-map");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [player?.id, navigate]);

  if (!player?.id) {
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
        display: "grid",
        placeItems: "center",
        background: "#020510",
        color: "#dbeafe",
        fontFamily: "'Chakra Petch', sans-serif",
        letterSpacing: "0.18em",
      }}>
        PREPARING HUNTER DATA...
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 10 }}>
      <style>{`
        .gate-loading-screen {
          position: fixed;
          inset: 0;
          z-index: 80;
          overflow: hidden;
          background: #020510;
          font-family: 'Cinzel', 'Chakra Petch', serif;
        }
        .gate-loading-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          filter: saturate(1.08) contrast(1.04);
        }
        .gate-loading-vignette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 50% 38%, rgba(40,75,140,0.02) 0%, rgba(2,5,16,0.04) 42%, rgba(0,0,0,0.72) 100%),
            linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0.66) 100%);
        }
        .gate-loading-copy {
          position: absolute;
          left: 50%;
          bottom: clamp(16px, 5.5vh, 54px);
          width: min(68vw, 920px);
          transform: translateX(-50%);
          text-align: center;
          color: #e7ecff;
          text-shadow: 0 2px 10px rgba(0,0,0,0.92), 0 0 18px rgba(115,150,255,0.58);
        }
        .gate-loading-emblem {
          margin: 0 auto 4px;
          width: clamp(30px, 4.8vw, 54px);
          height: clamp(30px, 4.8vw, 54px);
          display: grid;
          place-items: center;
          color: rgba(245,247,255,0.92);
          font-size: clamp(24px, 4vw, 44px);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.08em;
          filter: drop-shadow(0 0 14px rgba(199,213,255,0.72));
        }
        .gate-loading-rule {
          height: 1px;
          width: 58%;
          margin: 0 auto 8px;
          background: linear-gradient(90deg, transparent, rgba(210,225,255,0.44), transparent);
        }
        .gate-loading-rank {
          font-size: clamp(13px, 2vw, 25px);
          font-weight: 900;
          letter-spacing: 0.04em;
          color: rgba(226,232,240,0.94);
        }
        .gate-loading-rank span {
          color: var(--gate-rank-color);
          text-shadow: 0 0 14px var(--gate-rank-color), 0 0 28px rgba(139,92,246,0.72);
        }
        .gate-loading-dungeon {
          margin-top: 5px;
          font-family: 'Chakra Petch', system-ui, sans-serif;
          font-size: clamp(9px, 1.2vw, 14px);
          font-weight: 800;
          letter-spacing: 0.34em;
          color: rgba(180,210,255,0.78);
        }
        .gate-loading-bar {
          position: relative;
          margin: clamp(8px, 1.6vh, 18px) auto 8px;
          min-height: clamp(42px, 7.2vh, 70px);
          display: grid;
          grid-template-columns: minmax(82px, 1fr) auto minmax(82px, 1fr);
          align-items: center;
          gap: clamp(8px, 1.4vw, 18px);
          padding: 8px clamp(12px, 2.5vw, 34px);
          border: 1px solid rgba(190,210,255,0.34);
          background:
            linear-gradient(90deg, rgba(28,42,78,0.76), rgba(12,12,16,0.90) 36%, rgba(12,12,16,0.90) 64%, rgba(28,42,78,0.76)),
            linear-gradient(180deg, rgba(255,255,255,0.12), transparent 42%, rgba(0,0,0,0.42));
          box-shadow:
            0 0 22px rgba(78,112,255,0.42),
            0 0 34px rgba(139,92,246,0.30),
            inset 0 0 18px rgba(255,255,255,0.08);
        }
        .gate-loading-bar::before,
        .gate-loading-bar::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(170,210,255,0.7), transparent);
        }
        .gate-loading-bar::before { top: -5px; }
        .gate-loading-bar::after { bottom: -5px; }
        .gate-loading-bar strong {
          color: #efe8d9;
          font-size: clamp(22px, 4.6vw, 50px);
          font-weight: 900;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }
        .gate-runes {
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
          color: #b7c7ff;
          font-size: clamp(16px, 3vw, 38px);
          letter-spacing: 0.16em;
          text-shadow: 0 0 12px #5b7cff, 0 0 24px rgba(91,124,255,0.85);
        }
        .gate-runes-left { text-align: left; }
        .gate-runes-right { text-align: right; }
        .gate-loading-instance {
          font-family: 'Chakra Petch', system-ui, sans-serif;
          color: #a9d5ff;
          font-size: clamp(15px, 2.6vw, 34px);
          font-weight: 900;
          letter-spacing: 0.11em;
          text-shadow: 0 0 12px #5578ff, 0 0 24px rgba(93,103,255,0.78);
          animation: gate-instance-pulse 1.6s ease-in-out infinite;
        }
        .gate-loading-corner {
          position: absolute;
          right: clamp(10px, 2vw, 32px);
          bottom: clamp(10px, 2vw, 32px);
          width: clamp(24px, 4.6vw, 58px);
          height: clamp(24px, 4.6vw, 58px);
          background: rgba(255,255,255,0.86);
          clip-path: polygon(50% 0%, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0% 50%, 38% 38%);
          opacity: 0.78;
          filter: drop-shadow(0 0 16px rgba(225,235,255,0.70));
        }
        @keyframes gate-instance-pulse {
          0%, 100% { opacity: 0.72; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-1px); }
        }
        @media (max-width: 700px) {
          .gate-loading-copy { width: 82vw; bottom: 18px; }
          .gate-loading-bar {
            grid-template-columns: 1fr;
            gap: 2px;
          }
          .gate-runes { display: none; }
          .gate-loading-bar strong {
            font-size: clamp(20px, 8vw, 34px);
          }
        }
      `}</style>
      <iframe
        id="game-frame"
        ref={iframeRef}
        src={gameSrc}
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        allow="pointer-lock; fullscreen; autoplay"
        allowFullScreen
        title="SoloHeroWars"
        data-testid="iframe-godot-game"
      />

      {showGateLoading && <GateLoadingOverlay config={activeDungeon} />}

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
