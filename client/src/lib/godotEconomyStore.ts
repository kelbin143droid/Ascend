export const CONSUMABLE_IDS = ["hp_potion", "mp_potion", "power_elixir"] as const;

export type ConsumableId = (typeof CONSUMABLE_IDS)[number];
export type ConsumableInventory = Partial<Record<ConsumableId, number>>;
export type GodotRarity = "Common" | "Rare" | "Epic" | "Legendary";
export type GodotSlot = "Weapon" | "Helmet" | "Chest" | "Gloves" | "Boots";
export type GodotGear = { id?: string; name: string; rarity: GodotRarity };
export type GodotEquipment = Partial<Record<GodotSlot, GodotGear>>;

export interface ShopConsumable {
  id: ConsumableId;
  name: string;
  description: string;
  price: number;
}

export interface ShopGear extends GodotGear {
  id: string;
  slot: GodotSlot;
  description: string;
  price: number;
}

interface EconomyState {
  gold: number;
  consumables: ConsumableInventory;
  equipment: GodotEquipment;
  gearVault: ShopGear[];
}

const STORAGE_KEY = "ascend_godot_economy_v1";
const CHANGE_EVENT = "ascend:godot-economy-changed";

export const SHOP_CONSUMABLES: ShopConsumable[] = [
  { id: "hp_potion", name: "Health Potion", description: "Restores HP inside a dungeon.", price: 25 },
  { id: "mp_potion", name: "Mana Elixir", description: "Restores MP for skills and bursts.", price: 30 },
  { id: "power_elixir", name: "Power Elixir", description: "Temporary combat power spike.", price: 55 },
];

export const SHOP_GEAR: ShopGear[] = [
  { id: "system_blade_common", slot: "Weapon", name: "System Blade", rarity: "Common", description: "Reliable starter weapon.", price: 90 },
  { id: "hunter_jacket_common", slot: "Chest", name: "Hunter Jacket", rarity: "Common", description: "Basic dungeon protection.", price: 75 },
  { id: "focus_gloves_rare", slot: "Gloves", name: "Focus Gloves", rarity: "Rare", description: "Sharper handling under pressure.", price: 140 },
];

function emptyState(): EconomyState {
  return { gold: 0, consumables: {}, equipment: {}, gearVault: [] };
}

function emitChange() {
  try { window.dispatchEvent(new CustomEvent(CHANGE_EVENT)); } catch { /* noop */ }
}

function isConsumableId(id: string): id is ConsumableId {
  return (CONSUMABLE_IDS as readonly string[]).includes(id);
}

function sanitizeConsumables(raw: unknown): ConsumableInventory {
  const next: ConsumableInventory = {};
  if (!raw || typeof raw !== "object") return next;
  for (const id of CONSUMABLE_IDS) {
    const value = (raw as Record<string, unknown>)[id];
    const count = typeof value === "number" ? value : Number(value ?? 0);
    if (Number.isFinite(count) && count > 0) next[id] = Math.floor(count);
  }
  return next;
}

function normalizeRarity(value: unknown): GodotRarity {
  if (value === "Rare" || value === "Epic" || value === "Legendary") return value;
  if (value === "T2") return "Rare";
  if (value === "T3") return "Epic";
  if (value === "T4" || value === "T5") return "Legendary";
  return "Common";
}

function normalizeSlot(value: unknown): GodotSlot {
  if (value === "Helmet" || value === "Chest" || value === "Gloves" || value === "Boots") return value;
  if (value === "helmet") return "Helmet";
  if (value === "armor" || value === "chest") return "Chest";
  if (value === "accessory" || value === "gloves") return "Gloves";
  if (value === "boots") return "Boots";
  return "Weapon";
}

function normalizeGear(raw: unknown): ShopGear | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const name = typeof rec.name === "string" && rec.name.trim() ? rec.name.trim() : null;
  if (!name) return null;
  const slot = normalizeSlot(rec.slot);
  const rarity = normalizeRarity(rec.rarity);
  const id = typeof rec.id === "string" && rec.id.trim()
    ? rec.id.trim()
    : `${slot}_${name}_${rarity}`.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return {
    id,
    slot,
    name,
    rarity,
    description: typeof rec.description === "string" ? rec.description : `${rarity} ${slot}`,
    price: typeof rec.price === "number" ? Math.max(0, rec.price) : 0,
  };
}

function readState(): EconomyState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<EconomyState>;
    return {
      gold: Math.max(0, Math.floor(Number(parsed.gold ?? 0))),
      consumables: sanitizeConsumables(parsed.consumables),
      equipment: parsed.equipment && typeof parsed.equipment === "object" ? parsed.equipment : {},
      gearVault: Array.isArray(parsed.gearVault) ? parsed.gearVault.map(normalizeGear).filter(Boolean) as ShopGear[] : [],
    };
  } catch {
    return emptyState();
  }
}

function writeState(state: EconomyState): EconomyState {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* noop */ }
  emitChange();
  return state;
}

function mutate(updater: (state: EconomyState) => EconomyState): EconomyState {
  return writeState(updater(readState()));
}

export function getEconomyState(): EconomyState {
  return readState();
}

export function subscribeEconomy(handler: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

export function getOwnedConsumables(): ConsumableInventory {
  return readState().consumables;
}

export function getOwnedGear(): GodotEquipment {
  return readState().equipment;
}

export function addGold(amount: number): EconomyState {
  const value = Math.max(0, Math.floor(Number(amount) || 0));
  if (value <= 0) return readState();
  return mutate((state) => ({ ...state, gold: state.gold + value }));
}

export function setOwnedConsumables(items: unknown): EconomyState {
  return mutate((state) => ({ ...state, consumables: sanitizeConsumables(items) }));
}

export function buyConsumable(id: ConsumableId): { ok: boolean; state: EconomyState } {
  const item = SHOP_CONSUMABLES.find((entry) => entry.id === id);
  if (!item) return { ok: false, state: readState() };
  const state = readState();
  if (state.gold < item.price) return { ok: false, state };
  const consumables = { ...state.consumables, [id]: (state.consumables[id] ?? 0) + 1 };
  return { ok: true, state: writeState({ ...state, gold: state.gold - item.price, consumables }) };
}

export function buyGear(id: string): { ok: boolean; state: EconomyState } {
  const gear = SHOP_GEAR.find((entry) => entry.id === id);
  if (!gear) return { ok: false, state: readState() };
  const state = readState();
  if (state.gold < gear.price) return { ok: false, state };
  const gearVault = state.gearVault.some((entry) => entry.id === gear.id)
    ? state.gearVault
    : [...state.gearVault, gear];
  const equipment = {
    ...state.equipment,
    [gear.slot]: { id: gear.id, name: gear.name, rarity: gear.rarity },
  };
  return { ok: true, state: writeState({ ...state, gold: state.gold - gear.price, gearVault, equipment }) };
}

export function addLoot(loot: unknown): EconomyState {
  const drops = Array.isArray(loot) ? loot : loot ? [loot] : [];
  const normalized = drops.map(normalizeGear).filter(Boolean) as ShopGear[];
  if (normalized.length === 0) return readState();
  return mutate((state) => {
    const byId = new Map(state.gearVault.map((gear) => [gear.id, gear]));
    const equipment = { ...state.equipment };
    for (const gear of normalized) {
      byId.set(gear.id, gear);
      if (!equipment[gear.slot]) {
        equipment[gear.slot] = { id: gear.id, name: gear.name, rarity: gear.rarity };
      }
    }
    return { ...state, gearVault: Array.from(byId.values()), equipment };
  });
}

export function mergeConsumableCounts(items: Record<string, number>): EconomyState {
  return mutate((state) => {
    const consumables = { ...state.consumables };
    for (const [id, value] of Object.entries(items)) {
      if (!isConsumableId(id)) continue;
      const count = Math.max(0, Math.floor(Number(value) || 0));
      consumables[id] = (consumables[id] ?? 0) + count;
    }
    return { ...state, consumables };
  });
}
