export interface FurnitureDef {
  id: string;
  name: string;
  category: "seating" | "table" | "storage" | "decor" | "lighting" | "bed" | "plant";
  width: number;
  height: number;
  emoji: string;
  cost: number;
  rarity: "common" | "uncommon" | "rare" | "epic";
  color: string;
}

export const FURNITURE_CATALOG: FurnitureDef[] = [
  { id: "chair_basic", name: "Basic Chair", category: "seating", width: 1, height: 1, emoji: "🪑", cost: 0, rarity: "common", color: "#8B4513" },
  { id: "sofa_blue", name: "Blue Sofa", category: "seating", width: 2, height: 1, emoji: "🛋️", cost: 200, rarity: "uncommon", color: "#4a6fa5" },
  { id: "throne", name: "Hunter's Throne", category: "seating", width: 2, height: 1, emoji: "👑", cost: 1000, rarity: "epic", color: "#a855f7" },
  
  { id: "table_wood", name: "Wooden Table", category: "table", width: 2, height: 1, emoji: "🪵", cost: 100, rarity: "common", color: "#654321" },
  { id: "desk_crystal", name: "Crystal Desk", category: "table", width: 2, height: 1, emoji: "💎", cost: 500, rarity: "rare", color: "#22d3ee" },
  { id: "coffee_table", name: "Coffee Table", category: "table", width: 1, height: 1, emoji: "☕", cost: 75, rarity: "common", color: "#5a4030" },
  
  { id: "chest_wood", name: "Wooden Chest", category: "storage", width: 1, height: 1, emoji: "📦", cost: 80, rarity: "common", color: "#8B4513" },
  { id: "bookshelf", name: "Bookshelf", category: "storage", width: 1, height: 2, emoji: "📚", cost: 150, rarity: "uncommon", color: "#654321" },
  { id: "wardrobe", name: "Wardrobe", category: "storage", width: 2, height: 1, emoji: "🚪", cost: 250, rarity: "uncommon", color: "#3d2817" },
  { id: "vault", name: "Hunter's Vault", category: "storage", width: 2, height: 1, emoji: "🔐", cost: 800, rarity: "rare", color: "#374151" },
  
  { id: "painting_landscape", name: "Landscape Art", category: "decor", width: 1, height: 1, emoji: "🖼️", cost: 120, rarity: "uncommon", color: "#8b7aa3" },
  { id: "statue_knight", name: "Knight Statue", category: "decor", width: 1, height: 1, emoji: "🗿", cost: 300, rarity: "rare", color: "#6b7280" },
  { id: "trophy", name: "Boss Trophy", category: "decor", width: 1, height: 1, emoji: "🏆", cost: 600, rarity: "epic", color: "#fbbf24" },
  { id: "rug_fancy", name: "Fancy Rug", category: "decor", width: 2, height: 2, emoji: "🟫", cost: 180, rarity: "uncommon", color: "#7c2d12" },
  { id: "mirror", name: "Magic Mirror", category: "decor", width: 1, height: 1, emoji: "🪞", cost: 250, rarity: "rare", color: "#e0e7ff" },
  
  { id: "lamp_floor", name: "Floor Lamp", category: "lighting", width: 1, height: 1, emoji: "🪔", cost: 60, rarity: "common", color: "#fef3c7" },
  { id: "chandelier", name: "Crystal Chandelier", category: "lighting", width: 2, height: 1, emoji: "✨", cost: 400, rarity: "rare", color: "#f5f5f4" },
  { id: "torch_magic", name: "Magic Torch", category: "lighting", width: 1, height: 1, emoji: "🔥", cost: 150, rarity: "uncommon", color: "#f97316" },
  
  { id: "bed_single", name: "Single Bed", category: "bed", width: 2, height: 1, emoji: "🛏️", cost: 0, rarity: "common", color: "#4a6fa5" },
  { id: "bed_king", name: "King Bed", category: "bed", width: 3, height: 2, emoji: "👑", cost: 600, rarity: "rare", color: "#7c3aed" },
  
  { id: "fridge", name: "Fridge", category: "storage", width: 1, height: 2, emoji: "🧊", cost: 0, rarity: "common", color: "#e0e7ff" },
  { id: "plant_small", name: "Potted Plant", category: "plant", width: 1, height: 1, emoji: "🪴", cost: 40, rarity: "common", color: "#22c55e" },
  { id: "tree_bonsai", name: "Bonsai Tree", category: "plant", width: 1, height: 1, emoji: "🌳", cost: 200, rarity: "uncommon", color: "#15803d" },
  { id: "flowers", name: "Flower Vase", category: "plant", width: 1, height: 1, emoji: "💐", cost: 80, rarity: "common", color: "#ec4899" },
];

export const FLOOR_STYLES = [
  { id: "wood", name: "Wooden Floor", color: "#8B4513" },
  { id: "stone", name: "Stone Floor", color: "#6b7280" },
  { id: "marble", name: "Marble Floor", color: "#e0e7ff" },
  { id: "grass", name: "Grass Floor", color: "#22c55e" },
  { id: "dark", name: "Dark Floor", color: "#1f2937" },
];

export const WALL_STYLES = [
  { id: "stone", name: "Stone Wall", color: "#4b5563" },
  { id: "brick", name: "Brick Wall", color: "#b45309" },
  { id: "wood", name: "Wood Paneling", color: "#78350f" },
  { id: "crystal", name: "Crystal Wall", color: "#22d3ee" },
  { id: "dark", name: "Shadow Wall", color: "#111827" },
];

export const RARITY_COLORS = {
  common: "#9ca3af",
  uncommon: "#22c55e",
  rare: "#3b82f6",
  epic: "#a855f7",
};

export function getFurnitureById(id: string): FurnitureDef | undefined {
  return FURNITURE_CATALOG.find(f => f.id === id);
}
