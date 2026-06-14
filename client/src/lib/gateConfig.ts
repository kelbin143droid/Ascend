export type GateRank = "E" | "D" | "C" | "B" | "A" | "S";

export interface GateDefinition {
  requiredPower: number;
  rewardXP: number;
  rewardTier: number;
  color: string;
  glow: string;
  waves: [number, number];
}

export const GATE_CONFIG: Record<GateRank, GateDefinition> = {
  E: { requiredPower: 0,    rewardXP: 50,   rewardTier: 1, color: "#9ca3af", glow: "rgba(156,163,175,0.55)", waves: [1, 2] },
  D: { requiredPower: 100,  rewardXP: 150,  rewardTier: 2, color: "#22c55e", glow: "rgba(34,197,94,0.55)",   waves: [2, 3] },
  C: { requiredPower: 300,  rewardXP: 300,  rewardTier: 3, color: "#3b82f6", glow: "rgba(59,130,246,0.55)",  waves: [3, 4] },
  B: { requiredPower: 600,  rewardXP: 550,  rewardTier: 4, color: "#a855f7", glow: "rgba(168,85,247,0.55)",  waves: [4, 5] },
  A: { requiredPower: 1000, rewardXP: 900,  rewardTier: 5, color: "#f59e0b", glow: "rgba(245,158,11,0.55)",  waves: [5, 7] },
  S: { requiredPower: 1800, rewardXP: 1500, rewardTier: 5, color: "#ef4444", glow: "rgba(239,68,68,0.55)",   waves: [7, 10] },
};

// Exactly the 6 dungeon names from the spec
export const DUNGEON_NAMES = [
  "Shadow Forest",
  "Goblin Cave",
  "Orc Camp",
  "Ancient Ruins",
  "Ice Cavern",
  "City",
];

export const RANK_ORDER: GateRank[] = ["E", "D", "C", "B", "A", "S"];

// ── Rank selection weighted toward player's current combat power ──────────────
export function pickRankForCP(cp: number): GateRank {
  const weights: [GateRank, number][] =
    cp < 100
      ? [["E", 50], ["D", 35], ["C", 10], ["B", 4],  ["A", 1],  ["S", 0]]
      : cp < 300
      ? [["E", 35], ["D", 35], ["C", 18], ["B", 8],  ["A", 3],  ["S", 1]]
      : cp < 600
      ? [["E", 18], ["D", 28], ["C", 25], ["B", 16], ["A", 9],  ["S", 4]]
      : [["E", 8],  ["D", 18], ["C", 25], ["B", 25], ["A", 14], ["S", 10]];

  let r = Math.random() * 100;
  for (const [rank, w] of weights) {
    r -= w;
    if (r <= 0) return rank;
  }
  return "E";
}

// ── Tunable constants ─────────────────────────────────────────────────────────
export const MAX_DUNGEON_ENERGY   = 5;
export const ENERGY_RECHARGE_MS   = 30 * 60 * 1000;  // 30 min per pip
export const WALK_RADIUS_M        = 25;               // metres — Walk button threshold
export const GATE_SPAWN_RADIUS_M  = 400;              // metres — spawn ring radius
export const GATE_COUNT_RANGE: [number, number] = [4, 6];

// ── localStorage keys (shared between WorldMapPage ↔ GodotGamePage) ───────────
export const ACTIVE_DUNGEON_KEY = "ascend_active_dungeon";   // payload written before /game
export const CLEARED_GATE_KEY   = "ascend_cleared_gate_id";  // gateId written after victory
export const PERSISTED_GATES_KEY = "ascend_world_gates";     // gate array persists nav round-trip
