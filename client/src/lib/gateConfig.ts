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

// ── Per-rank gate counts (higher rank = fewer gates) ─────────────────────────
export const RANK_COUNTS: Record<GateRank, number> = {
  E: 10, D: 8, C: 6, B: 4, A: 2, S: 1,
};

// ── Per-rank spawn radii [minMetres, maxMetres] ───────────────────────────────
// Easier gates are closer so they're genuinely walkable; harder gates spread out
export const RANK_SPAWN_RADIUS_M: Record<GateRank, [number, number]> = {
  E: [20,  80],
  D: [60,  150],
  C: [120, 250],
  B: [200, 350],
  A: [300, 500],
  S: [400, 600],
};

// ── Teleport costs by rank (dungeon energy) ───────────────────────────────────
export const TELEPORT_COST: Record<GateRank, number> = {
  E: 20, D: 30, C: 45, B: 65, A: 85, S: 110,
};

// ── Tunable constants ─────────────────────────────────────────────────────────
export const WALK_RADIUS_M = 25;  // metres — Walk button threshold

// ── localStorage keys (shared between WorldMapPage ↔ GodotGamePage) ───────────
export const ACTIVE_DUNGEON_KEY = "ascend_active_dungeon";   // payload written before /game
export const CLEARED_GATE_KEY   = "ascend_cleared_gate_id";  // gateId written after victory
export const PERSISTED_GATES_KEY = "ascend_world_gates";     // gate array persists nav round-trip
