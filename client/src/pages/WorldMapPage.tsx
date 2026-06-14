import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/context/GameContext";
import { useQueryClient } from "@tanstack/react-query";
import {
  GATE_CONFIG,
  DUNGEON_NAMES,
  RANK_ORDER,
  MAX_DUNGEON_ENERGY,
  ENERGY_RECHARGE_MS,
  WALK_RADIUS_M,
  GATE_SPAWN_RADIUS_M,
  GATE_COUNT_RANGE,
  type GateRank,
} from "@/lib/gateConfig";

// ── Types ────────────────────────────────────────────────────────────────────

interface Gate {
  id: string;
  lat: number;
  lng: number;
  rank: GateRank;
  name: string;
  waves: number;
}

interface ActiveDungeon {
  gate: Gate;
}

type PlayerStats = { STR: number; AGI: number; VIT: number; SEN: number; INT: number; DIS: number };

// ── Helpers ──────────────────────────────────────────────────────────────────

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function randomPointNear(lat: number, lng: number, maxM: number): { lat: number; lng: number } {
  const R = 6_371_000;
  const angle = Math.random() * 2 * Math.PI;
  const dist = 80 + Math.random() * (maxM - 80);
  const dLat = (dist * Math.cos(angle)) / R;
  const dLng = (dist * Math.sin(angle)) / (R * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + (dLat * 180) / Math.PI, lng: lng + (dLng * 180) / Math.PI };
}

function pickRank(): GateRank {
  const weights: [GateRank, number][] = [
    ["E", 35], ["D", 28], ["C", 18], ["B", 10], ["A", 6], ["S", 3],
  ];
  let r = Math.random() * 100;
  for (const [rank, w] of weights) {
    r -= w;
    if (r <= 0) return rank;
  }
  return "E";
}

function spawnGates(lat: number, lng: number): Gate[] {
  const [min, max] = GATE_COUNT_RANGE;
  const count = min + Math.floor(Math.random() * (max - min + 1));
  return Array.from({ length: count }, () => {
    const rank = pickRank();
    const cfg = GATE_CONFIG[rank];
    const pos = randomPointNear(lat, lng, GATE_SPAWN_RADIUS_M);
    const name = DUNGEON_NAMES[Math.floor(Math.random() * DUNGEON_NAMES.length)];
    const waves = cfg.waves[0] + Math.floor(Math.random() * (cfg.waves[1] - cfg.waves[0] + 1));
    return { id: crypto.randomUUID(), ...pos, rank, name, waves };
  });
}

// ── Dungeon energy (localStorage) ────────────────────────────────────────────

const E_KEY = "ascend_dungeon_energy";
const E_TS_KEY = "ascend_dungeon_energy_ts";

function loadEnergy(): number {
  const stored = parseInt(localStorage.getItem(E_KEY) ?? `${MAX_DUNGEON_ENERGY}`, 10);
  const ts = parseInt(localStorage.getItem(E_TS_KEY) ?? `${Date.now()}`, 10);
  const recharged = Math.floor((Date.now() - ts) / ENERGY_RECHARGE_MS);
  const current = Math.min(stored + recharged, MAX_DUNGEON_ENERGY);
  if (recharged > 0) {
    localStorage.setItem(E_KEY, String(current));
    localStorage.setItem(E_TS_KEY, String(ts + recharged * ENERGY_RECHARGE_MS));
  }
  return current;
}

function consumeEnergy(current: number): number {
  const next = Math.max(0, current - 1);
  localStorage.setItem(E_KEY, String(next));
  if (next < MAX_DUNGEON_ENERGY) {
    localStorage.setItem(E_TS_KEY, String(Date.now()));
  }
  return next;
}

// ── Leaflet CSS injection (gate portal animation) ─────────────────────────────

function injectMapStyles() {
  const id = "ascend-map-styles";
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = `
    @keyframes portal-spin { to { transform: rotate(360deg); } }
    @keyframes portal-pulse { 0%,100% { opacity:0.7; } 50% { opacity:1; } }
    @keyframes player-ping  { 0% { transform:scale(1); opacity:0.8; } 100% { transform:scale(2.5); opacity:0; } }
    .gate-marker { cursor: pointer; }
    .gate-ring {
      position: absolute; inset: 0; border-radius: 50%;
      animation: portal-spin 10s linear infinite;
    }
    .gate-ring-inner {
      position: absolute; inset: 4px; border-radius: 50%;
      animation: portal-spin 6s linear infinite reverse;
    }
    .gate-core { animation: portal-pulse 2.5s ease-in-out infinite; }
    .player-ping {
      position: absolute; inset: 0; border-radius: 50%;
      animation: player-ping 1.8s ease-out infinite;
    }
  `;
  document.head.appendChild(el);
}

// ── Gate marker HTML ──────────────────────────────────────────────────────────

function gateMarkerHtml(rank: GateRank, power: number): string {
  const { color, glow } = GATE_CONFIG[rank];
  return `
    <div class="gate-marker" style="width:56px;height:56px;position:relative;display:flex;align-items:center;justify-content:center;">
      <div class="gate-ring" style="border:2px solid ${color};box-shadow:0 0 10px ${glow},inset 0 0 10px ${glow};"></div>
      <div class="gate-ring-inner" style="border:1px solid ${color}80;"></div>
      <div class="gate-core" style="
        width:40px;height:40px;border-radius:50%;
        background:radial-gradient(circle,${glow} 0%,#060d1a 65%);
        border:1px solid ${color};
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        position:relative;z-index:2;
      ">
        <span style="color:${color};font-weight:900;font-size:15px;line-height:1;font-family:monospace;">${rank}</span>
        <span style="color:#94a3b8;font-size:7px;line-height:1.4;">${power > 0 ? power + " CP" : "FREE"}</span>
      </div>
    </div>
  `;
}

// ── Player marker HTML ────────────────────────────────────────────────────────

function playerMarkerHtml(): string {
  return `
    <div style="width:24px;height:24px;position:relative;display:flex;align-items:center;justify-content:center;">
      <div class="player-ping" style="background:rgba(14,165,233,0.3);border:1px solid #0ea5e9;"></div>
      <div style="
        width:14px;height:14px;border-radius:50%;
        background:#0ea5e9;
        border:2px solid #fff;
        box-shadow:0 0 8px #0ea5e9;
        position:relative;z-index:2;
      "></div>
    </div>
  `;
}

// ── Combat power helper ───────────────────────────────────────────────────────

function buildStats(player: NonNullable<ReturnType<typeof useGame>["player"]>): PlayerStats {
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

function computeCP(stats: PlayerStats): number {
  return Math.round(
    stats.STR * 12 + stats.INT * 12 + stats.VIT * 10 +
    stats.AGI * 9  + stats.SEN * 7  + stats.DIS * 3
  );
}

// ── Rank badge color ──────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: GateRank }) {
  const { color } = GATE_CONFIG[rank];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 28, height: 28, borderRadius: "50%",
        border: `2px solid ${color}`,
        color, fontWeight: 900, fontSize: 13,
        boxShadow: `0 0 8px ${color}80`,
        flexShrink: 0,
      }}
    >
      {rank}
    </span>
  );
}

// ── Energy dots ───────────────────────────────────────────────────────────────

function EnergyDots({ energy }: { energy: number }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: MAX_DUNGEON_ENERGY }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: i < energy ? "#0ea5e9" : "#1e293b",
            border: "1px solid #334155",
            boxShadow: i < energy ? "0 0 6px #0ea5e9" : "none",
            transition: "all 0.3s",
          }}
        />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WorldMapPage() {
  const { player } = useGame();
  const queryClient = useQueryClient();

  const mapDivRef     = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<L.Map | null>(null);
  const playerMarker  = useRef<L.Marker | null>(null);
  const gateMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const iframeRef     = useRef<HTMLIFrameElement>(null);
  const godotReady    = useRef(false);
  const activeDungeonRef = useRef<ActiveDungeon | null>(null);

  const [playerPos, setPlayerPos] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError]   = useState<string | null>(null);
  const [gates, setGates]         = useState<Gate[]>([]);
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
  const [activeDungeon, setActiveDungeon] = useState<ActiveDungeon | null>(null);
  const [energy, setEnergy]       = useState<number>(MAX_DUNGEON_ENERGY);
  const [distToSelected, setDistToSelected] = useState<number>(Infinity);
  const [enterError, setEnterError] = useState<string | null>(null);

  // keep ref in sync so postMessage handler always has latest
  useEffect(() => { activeDungeonRef.current = activeDungeon; }, [activeDungeon]);

  const playerCP = player ? computeCP(buildStats(player)) : 0;

  // ── Energy: load on mount, recharge ticker ───────────────────────────────
  useEffect(() => {
    setEnergy(loadEnergy());
    const tick = setInterval(() => setEnergy(loadEnergy()), 60_000);
    return () => clearInterval(tick);
  }, []);

  // ── Init Leaflet map ──────────────────────────────────────────────────────
  useEffect(() => {
    injectMapStyles();
    if (!mapDivRef.current || mapRef.current) return;

    const map = L.map(mapDivRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([51.505, -0.09], 16);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── GPS watch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation not supported by your browser.");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPlayerPos({ lat, lng });
        setGpsError(null);
        if (mapRef.current && !mapRef.current.getBounds().contains([lat, lng])) {
          mapRef.current.setView([lat, lng], 16, { animate: true });
        }
      },
      (err) => {
        setGpsError(`GPS unavailable (${err.message}). Gates spawned at a demo location.`);
        // Demo fallback: midtown Manhattan
        const fallback = { lat: 40.7549, lng: -73.984 };
        setPlayerPos((prev) => prev ?? fallback);
        if (mapRef.current) mapRef.current.setView([fallback.lat, fallback.lng], 16);
      },
      { enableHighAccuracy: true, maximumAge: 5_000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // ── Spawn initial gates once we have a position ───────────────────────────
  useEffect(() => {
    if (!playerPos || gates.length > 0) return;
    setGates(spawnGates(playerPos.lat, playerPos.lng));
  }, [playerPos, gates.length]);

  // ── Update player marker ──────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !playerPos) return;
    const icon = L.divIcon({
      html: playerMarkerHtml(),
      className: "",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    if (playerMarker.current) {
      playerMarker.current.setLatLng([playerPos.lat, playerPos.lng]);
    } else {
      playerMarker.current = L.marker([playerPos.lat, playerPos.lng], {
        icon,
        zIndexOffset: 1000,
      }).addTo(map);
    }
    // update distance to selected gate
    if (selectedGate) {
      setDistToSelected(haversineM(playerPos.lat, playerPos.lng, selectedGate.lat, selectedGate.lng));
    }
  }, [playerPos, selectedGate]);

  // ── Render gate markers ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(gates.map((g) => g.id));

    // remove stale markers
    gateMarkersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        gateMarkersRef.current.delete(id);
      }
    });

    // add new markers
    gates.forEach((gate) => {
      if (gateMarkersRef.current.has(gate.id)) return;
      const cfg = GATE_CONFIG[gate.rank];
      const icon = L.divIcon({
        html: gateMarkerHtml(gate.rank, cfg.requiredPower),
        className: "",
        iconSize: [56, 56],
        iconAnchor: [28, 28],
        popupAnchor: [0, -28],
      });
      const marker = L.marker([gate.lat, gate.lng], { icon })
        .addTo(map)
        .on("click", () => {
          setSelectedGate(gate);
          setEnterError(null);
          if (playerPos) {
            setDistToSelected(haversineM(playerPos.lat, playerPos.lng, gate.lat, gate.lng));
          }
        });
      gateMarkersRef.current.set(gate.id, marker);
    });
  }, [gates, playerPos]);

  // ── Godot postMessage handler ─────────────────────────────────────────────
  useEffect(() => {
    if (!player?.id) return;

    const handleMessage = async (e: MessageEvent) => {
      const data = e.data as { type?: string; result?: { xp?: number } };

      if (data?.type === "GODOT_READY") {
        godotReady.current = true;
        const stats = buildStats(player);
        iframeRef.current?.contentWindow?.postMessage({ type: "SET_STATS", stats }, "*");

        const dungeon = activeDungeonRef.current;
        if (dungeon) {
          iframeRef.current?.contentWindow?.postMessage(
            {
              type: "START_DUNGEON",
              config: {
                dungeon: dungeon.gate.name,
                rank: dungeon.gate.rank,
                waves: dungeon.gate.waves,
              },
            },
            "*"
          );
        }
      }

      if (data?.type === "RUN_RESULT") {
        const xp = data.result?.xp ?? 0;
        if (xp > 0 && player?.id) {
          try {
            await fetch(`/api/player/${player.id}/gain-exp`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount: xp }),
            });
            queryClient.invalidateQueries({ queryKey: ["player", player.id] });
            queryClient.invalidateQueries({ queryKey: ["home", player.id] });
          } catch {/* best-effort */}
        }

        // Remove cleared gate
        const cleared = activeDungeonRef.current?.gate;
        if (cleared) {
          setGates((prev) => prev.filter((g) => g.id !== cleared.id));
          // Respawn a new gate after 30 s
          setTimeout(() => {
            setPlayerPos((pos) => {
              if (pos) setGates((prev) => [...prev, ...spawnGates(pos.lat, pos.lng).slice(0, 1)]);
              return pos;
            });
          }, 30_000);
        }

        godotReady.current = false;
        setActiveDungeon(null);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [player?.id, queryClient]);

  // ── Enter gate ────────────────────────────────────────────────────────────
  const enterGate = useCallback(
    (gate: Gate, method: "walk" | "teleport") => {
      setEnterError(null);
      const cfg = GATE_CONFIG[gate.rank];

      if (playerCP < cfg.requiredPower) {
        setEnterError(
          `Combat Power too low! Need ${cfg.requiredPower} CP — you have ${playerCP}.`
        );
        return;
      }
      if (method === "teleport") {
        if (energy <= 0) {
          setEnterError("No Dungeon Energy left. Wait for recharge or clear gates on foot.");
          return;
        }
        const next = consumeEnergy(energy);
        setEnergy(next);
      }

      godotReady.current = false;
      const dungeon: ActiveDungeon = { gate };
      activeDungeonRef.current = dungeon;
      setActiveDungeon(dungeon);
      setSelectedGate(null);
    },
    [playerCP, energy]
  );

  // ── Close iframe (back to map) ────────────────────────────────────────────
  const closeGame = useCallback(() => {
    godotReady.current = false;
    activeDungeonRef.current = null;
    setActiveDungeon(null);
  }, []);

  // ── Distance helpers ──────────────────────────────────────────────────────
  const canWalk = distToSelected <= WALK_RADIUS_M;
  const canTeleport = energy > 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#060d1a", overflow: "hidden" }}>

      {/* ── Dark map ─────────────────────────────────────────────────────── */}
      <div ref={mapDivRef} style={{ position: "absolute", inset: 0 }} />

      {/* ── HUD — top bar ────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 400,
          background: "linear-gradient(180deg,rgba(6,13,26,0.92) 0%,transparent 100%)",
          padding: "12px 16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          pointerEvents: "none",
        }}
      >
        <div>
          <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>
            ⬡ GATE DISTRICT
          </div>
          {gpsError && (
            <div style={{ color: "#f59e0b", fontSize: 10, marginTop: 2, maxWidth: 220 }}>
              {gpsError}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <div style={{ color: "#94a3b8", fontSize: 10, letterSpacing: 0.5 }}>DUNGEON ENERGY</div>
          <EnergyDots energy={energy} />
        </div>
      </div>

      {/* ── CP badge — bottom-left ─────────────────────────────────────── */}
      <div
        style={{
          position: "absolute", bottom: selectedGate ? 300 : 24, left: 16,
          zIndex: 400, transition: "bottom 0.3s",
          background: "rgba(6,13,26,0.85)",
          border: "1px solid #1e3a5f",
          borderRadius: 12, padding: "8px 14px",
          display: "flex", flexDirection: "column", gap: 2,
        }}
      >
        <div style={{ color: "#64748b", fontSize: 9, letterSpacing: 1 }}>COMBAT POWER</div>
        <div style={{ color: "#0ea5e9", fontWeight: 900, fontSize: 20, lineHeight: 1 }}>
          {playerCP}
        </div>
        <div style={{ color: "#475569", fontSize: 9 }}>
          {gates.length} gate{gates.length !== 1 ? "s" : ""} nearby
        </div>
      </div>

      {/* ── Gate preview panel — bottom sheet ─────────────────────────── */}
      <div
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 500,
          transform: selectedGate ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.32,0.72,0,1)",
          background: "linear-gradient(180deg,rgba(8,16,32,0.97) 0%,rgba(6,13,26,0.99) 100%)",
          borderTop: "1px solid #1e3a5f",
          borderRadius: "20px 20px 0 0",
          padding: "20px 20px 32px",
          backdropFilter: "blur(12px)",
        }}
      >
        {selectedGate && (() => {
          const cfg = GATE_CONFIG[selectedGate.rank];
          const cpOk = playerCP >= cfg.requiredPower;
          return (
            <>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <RankBadge rank={selectedGate.rank} />
                  <div>
                    <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 16 }}>
                      {selectedGate.name}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 11 }}>
                      {selectedGate.waves} waves · Rank {selectedGate.rank} Gate
                    </div>
                  </div>
                </div>
                <button
                  data-testid="button-close-gate-panel"
                  onClick={() => setSelectedGate(null)}
                  style={{
                    background: "none", border: "none", color: "#475569",
                    fontSize: 20, cursor: "pointer", padding: 4, lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* CP comparison bar */}
              <div
                style={{
                  background: "#0f1c2e", borderRadius: 10, padding: "10px 14px",
                  marginBottom: 14, border: "1px solid #1e3a5f",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#64748b", fontSize: 11 }}>Required Power</span>
                  <span style={{ color: "#64748b", fontSize: 11 }}>Your CP</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: cfg.color, fontWeight: 900, fontSize: 22 }}>
                    {cfg.requiredPower > 0 ? cfg.requiredPower : "—"}
                  </span>
                  <span style={{ color: "#475569", fontSize: 12 }}>vs</span>
                  <span style={{ color: cpOk ? "#22c55e" : "#ef4444", fontWeight: 900, fontSize: 22 }}>
                    {playerCP}
                  </span>
                </div>
                {!cpOk && (
                  <div style={{ color: "#ef4444", fontSize: 10, marginTop: 6 }}>
                    ⚠ Need {cfg.requiredPower - playerCP} more CP to enter
                  </div>
                )}
                <div style={{ color: "#64748b", fontSize: 10, marginTop: 4 }}>
                  Reward: {cfg.rewardXP} XP on clear
                </div>
              </div>

              {/* Distance info */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: "#475569" }}>📍</span>
                <span style={{ color: "#64748b", fontSize: 11 }}>
                  {playerPos
                    ? `${Math.round(haversineM(playerPos.lat, playerPos.lng, selectedGate.lat, selectedGate.lng))} m away`
                    : "Distance unknown"}
                </span>
                {canWalk && (
                  <span style={{
                    background: "#14532d", color: "#4ade80", fontSize: 9,
                    padding: "2px 6px", borderRadius: 4, fontWeight: 700,
                  }}>IN RANGE</span>
                )}
              </div>

              {enterError && (
                <div style={{
                  color: "#ef4444", fontSize: 11, marginBottom: 12,
                  background: "rgba(239,68,68,0.1)", borderRadius: 8, padding: "8px 12px",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}>
                  {enterError}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                {/* Walk */}
                <button
                  data-testid="button-walk-gate"
                  onClick={() => enterGate(selectedGate, "walk")}
                  disabled={!canWalk}
                  style={{
                    flex: 1, padding: "13px 0",
                    borderRadius: 12, border: "1px solid",
                    borderColor: canWalk ? "#22c55e" : "#1e3a5f",
                    background: canWalk ? "rgba(34,197,94,0.15)" : "rgba(30,58,95,0.2)",
                    color: canWalk ? "#22c55e" : "#334155",
                    fontWeight: 700, fontSize: 14, cursor: canWalk ? "pointer" : "not-allowed",
                    transition: "all 0.2s",
                  }}
                >
                  🚶 Walk
                  <div style={{ fontSize: 9, fontWeight: 400, marginTop: 2, opacity: 0.7 }}>
                    {canWalk ? "In range!" : `Need ${WALK_RADIUS_M}m proximity`}
                  </div>
                </button>

                {/* Teleport */}
                <button
                  data-testid="button-teleport-gate"
                  onClick={() => enterGate(selectedGate, "teleport")}
                  disabled={!canTeleport}
                  style={{
                    flex: 1, padding: "13px 0",
                    borderRadius: 12, border: "1px solid",
                    borderColor: canTeleport ? "#0ea5e9" : "#1e3a5f",
                    background: canTeleport ? "rgba(14,165,233,0.15)" : "rgba(30,58,95,0.2)",
                    color: canTeleport ? "#0ea5e9" : "#334155",
                    fontWeight: 700, fontSize: 14, cursor: canTeleport ? "pointer" : "not-allowed",
                    transition: "all 0.2s",
                  }}
                >
                  ⚡ Teleport
                  <div style={{ fontSize: 9, fontWeight: 400, marginTop: 2, opacity: 0.7 }}>
                    {canTeleport ? `${energy}/${MAX_DUNGEON_ENERGY} energy` : "No energy"}
                  </div>
                </button>
              </div>
            </>
          );
        })()}
      </div>

      {/* ── Active dungeon — fullscreen Godot iframe ──────────────────── */}
      {activeDungeon && (
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 900,
            background: "#000",
            display: "flex", flexDirection: "column",
          }}
        >
          <div
            style={{
              position: "absolute", top: 12, left: 12, zIndex: 10,
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(6,13,26,0.8)", borderRadius: 12,
              padding: "8px 14px", border: "1px solid #1e3a5f",
            }}
          >
            <RankBadge rank={activeDungeon.gate.rank} />
            <div>
              <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 13 }}>
                {activeDungeon.gate.name}
              </div>
              <div style={{ color: "#64748b", fontSize: 10 }}>
                {activeDungeon.gate.waves} waves
              </div>
            </div>
          </div>

          <button
            data-testid="button-close-dungeon"
            onClick={closeGame}
            style={{
              position: "absolute", top: 12, right: 12, zIndex: 10,
              background: "rgba(6,13,26,0.8)", border: "1px solid #334155",
              color: "#94a3b8", borderRadius: 8,
              padding: "8px 12px", cursor: "pointer", fontSize: 12,
            }}
          >
            ← Back to Map
          </button>

          <iframe
            ref={iframeRef}
            src="/game/index.html"
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            allow="pointer-lock; fullscreen; autoplay"
            allowFullScreen
            title="Dungeon"
            data-testid="iframe-dungeon-game"
          />
        </div>
      )}
    </div>
  );
}
