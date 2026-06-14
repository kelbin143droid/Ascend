export type GateRank = "E" | "D" | "C" | "B" | "A" | "S";

export interface GateDefinition {
  requiredPower: number;
  rewardXP: number;
  color: string;
  glow: string;
  waves: [number, number];
}

export const GATE_CONFIG: Record<GateRank, GateDefinition> = {
  E: { requiredPower: 0,    rewardXP: 50,   color: "#9ca3af", glow: "rgba(156,163,175,0.55)", waves: [1, 2] },
  D: { requiredPower: 100,  rewardXP: 150,  color: "#22c55e", glow: "rgba(34,197,94,0.55)",   waves: [2, 3] },
  C: { requiredPower: 300,  rewardXP: 300,  color: "#3b82f6", glow: "rgba(59,130,246,0.55)",  waves: [3, 4] },
  B: { requiredPower: 600,  rewardXP: 550,  color: "#a855f7", glow: "rgba(168,85,247,0.55)",  waves: [4, 5] },
  A: { requiredPower: 1000, rewardXP: 900,  color: "#f59e0b", glow: "rgba(245,158,11,0.55)",  waves: [5, 7] },
  S: { requiredPower: 1800, rewardXP: 1500, color: "#ef4444", glow: "rgba(239,68,68,0.55)",   waves: [7, 10] },
};

export const DUNGEON_NAMES = [
  "Shadow Forest",
  "Goblin Cave",
  "Orc Camp",
  "Ancient Ruins",
  "Ice Cavern",
  "Blood Sanctum",
  "Iron Fortress",
  "Cursed Tomb",
];

export const RANK_ORDER: GateRank[] = ["E", "D", "C", "B", "A", "S"];

export const MAX_DUNGEON_ENERGY = 5;
export const ENERGY_RECHARGE_MS = 30 * 60 * 1000;
export const WALK_RADIUS_M = 20;
export const GATE_SPAWN_RADIUS_M = 500;
export const GATE_COUNT_RANGE: [number, number] = [3, 5];
