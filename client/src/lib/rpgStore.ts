export type GearRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type GearSlot = 'weapon' | 'armor' | 'accessory';
export type ArchetypeId = 'warrior' | 'sage' | 'shadow' | 'warden';

export interface GearItem {
  id: string;
  name: string;
  slot: GearSlot;
  rarity: GearRarity;
  stats: Partial<Record<'strength' | 'agility' | 'vitality' | 'sense', number>>;
  description: string;
  icon: string;
  auraColor?: string;
  isStarter?: boolean;
}

export interface DungeonResult {
  dungeonId: string;
  completedAt: number;
  xpGained: number;
  goldGained: number;
  gearDrop?: GearItem;
}

export interface RPGState {
  equipped: Partial<Record<GearSlot, GearItem>>;
  inventory: GearItem[];
  dungeonHistory: DungeonResult[];
  lastDungeonAt: number;
  lastKnownRank: string;
  classLocked: boolean;
  lockedClass: ArchetypeId | null;
}

const STORAGE_KEY = 'ascend_rpg_state';
export const CLASS_LOCK_KEY = 'ascend_class_locked';
export const CLASS_CHANGE_COST = 500;

const DEFAULT_STATE: RPGState = {
  equipped: {},
  inventory: [],
  dungeonHistory: [],
  lastDungeonAt: 0,
  lastKnownRank: 'E',
  classLocked: false,
  lockedClass: null,
};

export function loadRPGState(): RPGState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch { return { ...DEFAULT_STATE }; }
}

export function saveRPGState(state: RPGState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* noop */ }
}

export function getEquippedBonuses(equipped: Partial<Record<GearSlot, GearItem>>): Record<string, number> {
  const totals: Record<string, number> = { strength: 0, agility: 0, vitality: 0, sense: 0 };
  for (const item of Object.values(equipped)) {
    if (!item) continue;
    for (const [s, v] of Object.entries(item.stats)) { totals[s] = (totals[s] || 0) + (v ?? 0); }
  }
  return totals;
}

export function getRank(level: number): string {
  if (level >= 75) return 'S';
  if (level >= 50) return 'A';
  if (level >= 35) return 'B';
  if (level >= 20) return 'C';
  if (level >= 10) return 'D';
  return 'E';
}

export function getEvolutionTier(rank: string): {
  label: string; color: string; glow: string; auraLayers: number; legendaryEffect: boolean;
} {
  switch (rank) {
    case 'S': return { label: 'Sovereign',  color: '#f59e0b', glow: '#fbbf2488', auraLayers: 4, legendaryEffect: true  };
    case 'A': return { label: 'Champion',   color: '#8b5cf6', glow: '#8b5cf688', auraLayers: 3, legendaryEffect: false };
    case 'B': return { label: 'Elite',      color: '#3b82f6', glow: '#3b82f688', auraLayers: 2, legendaryEffect: false };
    case 'C': return { label: 'Formidable', color: '#22d3ee', glow: '#22d3ee66', auraLayers: 1, legendaryEffect: false };
    case 'D': return { label: 'Rising',     color: '#6ee7b7', glow: '#6ee7b744', auraLayers: 1, legendaryEffect: false };
    default:  return { label: 'Awakened',   color: '#94a3b8', glow: 'transparent', auraLayers: 0, legendaryEffect: false };
  }
}

export const RARITY_COLORS: Record<GearRarity, string> = {
  common: '#94a3b8', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b',
};
export const RARITY_GLOW: Record<GearRarity, string> = {
  common: 'rgba(148,163,184,0.22)', rare: 'rgba(59,130,246,0.28)',
  epic: 'rgba(168,85,247,0.33)', legendary: 'rgba(245,158,11,0.44)',
};

// ─── Gear database ────────────────────────────────────────────────────────────
export const GEAR_DATABASE: GearItem[] = [
  // Starter gear
  { id: 'rusted_sword',    name: 'Rusted Sword',       slot: 'weapon',    rarity: 'common', stats: { strength: 2 },             icon: '🗡️', description: 'A battle-worn blade. Still sharp enough.',    auraColor: '#ef4444', isStarter: true },
  { id: 'basic_shoulder',  name: 'Basic Shoulder Armor', slot: 'armor',   rarity: 'common', stats: { vitality: 1 },             icon: '🛡️', description: 'Forged iron shoulder guard.',                  auraColor: '#94a3b8', isStarter: true },
  { id: 'wooden_scepter',  name: 'Wooden Scepter',     slot: 'weapon',    rarity: 'common', stats: { sense: 2 },                icon: '🪄', description: 'Channeled from old-growth forest wood.',      auraColor: '#8b5cf6', isStarter: true },
  { id: 'spell_orb',       name: 'Spell Orb',          slot: 'accessory', rarity: 'common', stats: { sense: 1 },                icon: '🔮', description: 'A floating orb that hums with arcane energy.', auraColor: '#60a5fa', isStarter: true },
  { id: 'twin_daggers',    name: 'Twin Daggers',        slot: 'weapon',    rarity: 'common', stats: { agility: 2 },              icon: '⚔️', description: 'Light, balanced blades for swift strikes.',   auraColor: '#14b8a6', isStarter: true },
  { id: 'dark_hood',       name: 'Dark Hood',           slot: 'armor',     rarity: 'common', stats: { agility: 1 },              icon: '🪖', description: 'Shadow-woven hood. Quiet as the dark.',      auraColor: '#94a3b8', isStarter: true },
  { id: 'iron_mace',       name: 'Iron Mace',           slot: 'weapon',    rarity: 'common', stats: { strength: 1, vitality: 1 }, icon: '🔨', description: 'A heavy mace that hits like a wall.',        auraColor: '#22c55e', isStarter: true },
  { id: 'warden_shield',   name: 'Warden Shield',       slot: 'armor',     rarity: 'common', stats: { vitality: 2 },             icon: '🛡️', description: 'The Warden\'s mark. Heavy, protective.',      auraColor: '#22c55e', isStarter: true },
  // Dungeon drops
  { id: 'iron_dagger',     name: 'Iron Dagger',         slot: 'weapon',    rarity: 'common', stats: { strength: 2 },                          icon: '🗡️', description: 'A simple iron blade.',            auraColor: '#94a3b8' },
  { id: 'leather_armor',   name: 'Leather Vest',        slot: 'armor',     rarity: 'common', stats: { vitality: 2 },                          icon: '🦺', description: 'Tanned hide protection.',         auraColor: '#94a3b8' },
  { id: 'bone_ring',       name: 'Bone Ring',           slot: 'accessory', rarity: 'common', stats: { agility: 1 },                           icon: '💀', description: 'Carved from beast bone.',         auraColor: '#94a3b8' },
  { id: 'shadow_blade',    name: 'Shadow Blade',        slot: 'weapon',    rarity: 'rare',   stats: { strength: 4, agility: 1 },               icon: '⚔️', description: 'Tempered in shadow energy.',    auraColor: '#3b82f6' },
  { id: 'wolf_vest',       name: 'Wolf Hide Armor',     slot: 'armor',     rarity: 'rare',   stats: { vitality: 3, agility: 2 },               icon: '🛡️', description: 'Shadow wolf pelt armor.',       auraColor: '#3b82f6' },
  { id: 'ranger_band',     name: "Ranger's Band",       slot: 'accessory', rarity: 'rare',   stats: { sense: 3 },                              icon: '📿', description: 'Worn by shadow scouts.',        auraColor: '#3b82f6' },
  { id: 'fang_edge',       name: "Fang Wolf's Edge",    slot: 'weapon',    rarity: 'epic',   stats: { strength: 7, agility: 3 },               icon: '🐺', description: 'The cursed fang of the boss.',  auraColor: '#a855f7' },
  { id: 'hunter_mantle',   name: "Hunter's Mantle",     slot: 'armor',     rarity: 'epic',   stats: { vitality: 5, strength: 2 },              icon: '🌑', description: 'Absorbs dark energy.',          auraColor: '#a855f7' },
  { id: 'predator_eye',    name: "Predator's Eye",      slot: 'accessory', rarity: 'epic',   stats: { sense: 5, agility: 3 },                  icon: '👁️', description: 'Preternatural awareness.',      auraColor: '#a855f7' },
  { id: 'sovereign_shard', name: 'Sovereign Shard',     slot: 'accessory', rarity: 'legendary', stats: { strength: 4, sense: 4, agility: 4, vitality: 4 }, icon: '💎', description: 'Fragment of supreme power.', auraColor: '#f59e0b' },
];

// ─── Starter equipment per class ──────────────────────────────────────────────
export const STARTER_EQUIPMENT: Record<ArchetypeId, { weapon: GearItem; armor: GearItem; accessory?: GearItem }> = {
  warrior: {
    weapon:    GEAR_DATABASE.find(g => g.id === 'rusted_sword')!,
    armor:     GEAR_DATABASE.find(g => g.id === 'basic_shoulder')!,
  },
  sage: {
    weapon:    GEAR_DATABASE.find(g => g.id === 'wooden_scepter')!,
    armor:     GEAR_DATABASE.find(g => g.id === 'bone_ring')!, // repurpose as sage armor
    accessory: GEAR_DATABASE.find(g => g.id === 'spell_orb')!,
  },
  shadow: {
    weapon:    GEAR_DATABASE.find(g => g.id === 'twin_daggers')!,
    armor:     GEAR_DATABASE.find(g => g.id === 'dark_hood')!,
  },
  warden: {
    weapon:    GEAR_DATABASE.find(g => g.id === 'iron_mace')!,
    armor:     GEAR_DATABASE.find(g => g.id === 'warden_shield')!,
  },
};

// ─── Dungeon definitions ──────────────────────────────────────────────────────
export const DUNGEON_SHADOW_FOREST = {
  id: 'shadow_forest',
  name: 'Shadow Forest',
  subtitle: 'Beginner Gate',
  boss: 'Fang Wolf',
  atmosphere: 'Dark forest. Neon mist. Something watches from between the trees.',
  baseXP: 80,
  baseGold: 45,
  cooldownMs: 3 * 60 * 1000,
  lootTable: [
    { item: GEAR_DATABASE.find(g => g.id === 'iron_dagger')!,   weight: 30 },
    { item: GEAR_DATABASE.find(g => g.id === 'leather_armor')!, weight: 28 },
    { item: GEAR_DATABASE.find(g => g.id === 'bone_ring')!,     weight: 22 },
    { item: GEAR_DATABASE.find(g => g.id === 'shadow_blade')!,  weight: 10 },
    { item: GEAR_DATABASE.find(g => g.id === 'wolf_vest')!,     weight: 8  },
    { item: GEAR_DATABASE.find(g => g.id === 'ranger_band')!,   weight: 7  },
    { item: GEAR_DATABASE.find(g => g.id === 'fang_edge')!,     weight: 2  },
    { item: GEAR_DATABASE.find(g => g.id === 'predator_eye')!,  weight: 1  },
  ],
};

export function rollLoot(lootTable: typeof DUNGEON_SHADOW_FOREST['lootTable']): GearItem | undefined {
  if (Math.random() > 0.40) return undefined;
  const total = lootTable.reduce((a, b) => a + b.weight, 0);
  let roll = Math.random() * total;
  for (const e of lootTable) { roll -= e.weight; if (roll <= 0) return e.item; }
  return lootTable[0].item;
}

export function dispatchSystemMessage(msg: {
  type: 'stat_gain' | 'level_up' | 'evolution' | 'dungeon' | 'rank_up' | 'gear' | 'sync';
  title: string; subtitle?: string; icon?: string; color?: string;
}) {
  window.dispatchEvent(new CustomEvent('ascend:system-msg', {
    detail: { id: `${Date.now()}-${Math.random()}`, ...msg },
  }));
}
