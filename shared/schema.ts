import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const statsSchema = z.object({
  strength: z.number(),
  agility: z.number(),
  sense: z.number(),
  vitality: z.number(),
});

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
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
});

export const updatePlayerSchema = createInsertSchema(players).partial().omit({
  id: true,
});

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type UpdatePlayer = z.infer<typeof updatePlayerSchema>;
export type Player = typeof players.$inferSelect;
