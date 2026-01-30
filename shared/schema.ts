import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const statsSchema = z.object({
  strength: z.number(),
  agility: z.number(),
  sense: z.number(),
  vitality: z.number(),
});

export const fatigueDataSchema = z.object({
  date: z.string(),
  sessions: z.object({
    strength: z.number(),
    agility: z.number(),
    sense: z.number(),
    vitality: z.number(),
  }),
});

export type FatigueData = z.infer<typeof fatigueDataSchema>;

export const RANK_STAT_CAPS: Record<string, number> = {
  E: 25,
  D: 50,
  C: 80,
  B: 120,
  A: 180,
  S: 250,
};

export const FATIGUE_MULTIPLIERS = [1.0, 0.85, 0.70, 0.50];

export type StatName = "strength" | "agility" | "sense" | "vitality";

export type Stats = z.infer<typeof statsSchema>;

export const inventoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["weapon", "armor", "accessory", "consumable"]),
  rarity: z.enum(["E", "D", "C", "B", "A", "S"]),
  equipped: z.boolean().optional(),
  stats: z.record(z.number()).optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export const equipmentSchema = z.object({
  weapon: z.string().nullable(),
  armor: z.string().nullable(),
  accessory: z.string().nullable(),
});

export type Equipment = z.infer<typeof equipmentSchema>;

export const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  mpCost: z.number(),
  cooldown: z.number(),
  level: z.number(),
  unlocked: z.boolean(),
});

export type Skill = z.infer<typeof skillSchema>;

export const scheduleBlockSchema = z.object({
  id: z.string(),
  name: z.string(),
  startHour: z.number(),
  endHour: z.number(),
  color: z.string(),
  isSystemTask: z.boolean().optional(),
});

export type ScheduleBlock = z.infer<typeof scheduleBlockSchema>;

export const avatarCustomizationSchema = z.object({
  hairStyle: z.number().default(1),
  hairColor: z.string().default("#8B4513"),
  skinColor: z.string().default("#DEB887"),
  eyeColor: z.string().default("#2E8B57"),
  outfitColor: z.string().default("#4A5568"),
});

export type AvatarCustomization = z.infer<typeof avatarCustomizationSchema>;

export const furnitureItemSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  x: z.number(),
  y: z.number(),
  rotation: z.number().optional(),
});

export type FurnitureItem = z.infer<typeof furnitureItemSchema>;

export const housingRoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  width: z.number(),
  height: z.number(),
  floorStyle: z.string(),
  wallStyle: z.string(),
  furniture: z.array(furnitureItemSchema),
});

export type HousingRoom = z.infer<typeof housingRoomSchema>;

export const housingDataSchema = z.object({
  rooms: z.array(housingRoomSchema),
  activeRoomId: z.string().optional(),
});

export type HousingData = z.infer<typeof housingDataSchema>;

export const rankHistoryEntrySchema = z.object({
  rank: z.string(),
  unlocked: z.string(),
  date: z.string(),
});

export type RankHistoryEntry = z.infer<typeof rankHistoryEntrySchema>;

export const pendingRankUnlockSchema = z.object({
  rank: z.string(),
  attribute: z.string(),
}).nullable();

export type PendingRankUnlock = z.infer<typeof pendingRankUnlockSchema>;

export const RANK_LEVEL_THRESHOLDS: Record<string, { min: number; max: number }> = {
  E: { min: 1, max: 10 },
  D: { min: 11, max: 25 },
  C: { min: 26, max: 45 },
  B: { min: 46, max: 70 },
  A: { min: 71, max: 100 },
  S: { min: 101, max: 999 },
};

export const RANK_UNLOCK_DATA: Record<string, { attribute: string; description: string; highlights: string[] }> = {
  D: { attribute: "Endurance", description: "Push beyond your limits.", highlights: ["Extended session bonuses", "Recovery rate improved"] },
  C: { attribute: "Mobility", description: "Move with purpose and precision.", highlights: ["Agility training enhanced", "Cooldown reduction active"] },
  B: { attribute: "Social", description: "Build and preserve meaningful relationships.", highlights: ["Relationship sessions now available", "Weekly diversity bonus unlocked", "Social stat cap: 120"] },
  A: { attribute: "Skill", description: "Master specialized techniques.", highlights: ["Advanced skill tree unlocked", "Unique abilities available"] },
  S: { attribute: "Ascension Mode", description: "Sustained balance unlocks elite growth.", highlights: ["Balanced Mastery Bonus unlocked", "Elite Sessions unlocked", "Stat cap increased to 250"] },
};

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  level: integer("level").notNull().default(1),
  job: text("job").notNull().default("NONE"),
  title: text("title").notNull().default("WOLF SLAYER"),
  hp: integer("hp").notNull().default(100),
  maxHp: integer("max_hp").notNull().default(100),
  mp: integer("mp").notNull().default(10),
  maxMp: integer("max_mp").notNull().default(10),
  stats: jsonb("stats").$type<Stats>().notNull().default({
    strength: 10,
    agility: 10,
    sense: 10,
    vitality: 10,
  }),
  availablePoints: integer("available_points").notNull().default(3),
  gold: integer("gold").notNull().default(0),
  rank: text("rank").notNull().default("E"),
  exp: integer("exp").notNull().default(0),
  maxExp: integer("max_exp").notNull().default(100),
  inventory: jsonb("inventory").$type<InventoryItem[]>().notNull().default([]),
  skills: jsonb("skills").$type<Skill[]>().notNull().default([]),
  equipment: jsonb("equipment").$type<Equipment>().notNull().default({
    weapon: null,
    armor: null,
    accessory: null,
  }),
  schedule: jsonb("schedule").$type<ScheduleBlock[]>().notNull().default([]),
  housing: jsonb("housing").$type<HousingData>().notNull().default({
    rooms: [{
      id: "main",
      name: "Main Room",
      width: 8,
      height: 6,
      floorStyle: "wood",
      wallStyle: "stone",
      furniture: []
    }],
    activeRoomId: "main"
  }),
  fatigue: jsonb("fatigue").$type<FatigueData>().notNull().default({
    date: "",
    sessions: { strength: 0, agility: 0, sense: 0, vitality: 0 }
  }),
  unlockedAttributes: jsonb("unlocked_attributes").$type<string[]>().notNull().default(["strength", "agility", "sense", "vitality"]),
  rankHistory: jsonb("rank_history").$type<RankHistoryEntry[]>().notNull().default([]),
  pendingRankUnlock: jsonb("pending_rank_unlock").$type<PendingRankUnlock>().default(null),
  avatarCustomization: jsonb("avatar_customization").$type<AvatarCustomization>().notNull().default({
    hairStyle: 1,
    hairColor: "#8B4513",
    skinColor: "#DEB887",
    eyeColor: "#2E8B57",
    outfitColor: "#4A5568",
  }),
});

export const insertPlayerSchema = createInsertSchema(players, {
  pendingRankUnlock: pendingRankUnlockSchema.optional().default(null),
  unlockedAttributes: z.array(z.string()).optional().default(["strength", "agility", "sense", "vitality"]),
  rankHistory: z.array(rankHistoryEntrySchema).optional().default([]),
}).omit({
  id: true,
});

export const updatePlayerSchema = createInsertSchema(players, {
  pendingRankUnlock: pendingRankUnlockSchema,
  unlockedAttributes: z.array(z.string()),
  rankHistory: z.array(rankHistoryEntrySchema),
}).partial().omit({
  id: true,
});

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type UpdatePlayer = z.infer<typeof updatePlayerSchema>;
export type Player = typeof players.$inferSelect;
