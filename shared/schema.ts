import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, real, date, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const quadrantEnum = z.enum(["Q1", "Q2", "Q3", "Q4"]);
export type Quadrant = z.infer<typeof quadrantEnum>;

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

export const PHASE_STAT_CAPS: Record<number, number> = {
  1: 30,
  2: 60,
  3: 80,
  4: 100,
  5: 120,
};

export const EFFORT_TIER_XP: Record<number, number> = {
  1: 5,
  2: 10,
  3: 20,
  4: 30,
  5: 50,
};

export type EffortTier = 1 | 2 | 3 | 4 | 5;

export const FATIGUE_MULTIPLIERS = [1.0, 0.85, 0.70, 0.50];

export type StatName = "strength" | "agility" | "sense" | "vitality";

export type Stats = z.infer<typeof statsSchema>;

export const inventoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["weapon", "armor", "accessory", "consumable"]),
  rarity: z.enum(["T1", "T2", "T3", "T4", "T5"]),
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
  description: z.string().optional(),
  date: z.string().optional(),
  startHour: z.number(),
  startMinute: z.number().optional(),
  endHour: z.number(),
  endMinute: z.number().optional(),
  color: z.string(),
  isSystemTask: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
});

export const statExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetValue: z.number(),
  unit: z.enum(["reps", "minutes", "hours"]),
});

export const statGoalsSchema = z.object({
  strength: z.array(statExerciseSchema).default([
    { id: "pushups", name: "Pushups", targetValue: 10, unit: "reps" },
    { id: "abs", name: "Abs", targetValue: 10, unit: "reps" },
    { id: "squats", name: "Squats", targetValue: 10, unit: "reps" },
  ]),
  agility: z.array(statExerciseSchema).default([
    { id: "cardio", name: "Cardio Training", targetValue: 5, unit: "minutes" },
  ]),
  sense: z.array(statExerciseSchema).default([
    { id: "meditation", name: "Meditation", targetValue: 5, unit: "minutes" },
  ]),
  vitality: z.array(statExerciseSchema).default([
    { id: "sleep", name: "Sleep", targetValue: 7, unit: "hours" },
  ]),
});

export const dailyStatProgressSchema = z.object({
  date: z.string(),
  progress: z.record(z.record(z.number())),
});

export type StatExercise = z.infer<typeof statExerciseSchema>;
export type StatGoals = z.infer<typeof statGoalsSchema>;
export type DailyStatProgress = z.infer<typeof dailyStatProgressSchema>;

export type ScheduleBlock = z.infer<typeof scheduleBlockSchema>;

export const statXPSchema = z.object({
  strength: z.number().default(0),
  agility: z.number().default(0),
  sense: z.number().default(0),
  vitality: z.number().default(0),
});

export type StatXP = z.infer<typeof statXPSchema>;

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

export const phaseHistoryEntrySchema = z.object({
  phase: z.number(),
  date: z.string(),
});

export type PhaseHistoryEntry = z.infer<typeof phaseHistoryEntrySchema>;

export const pendingPhaseUnlockSchema = z.object({
  phase: z.number(),
}).nullable();

export type PendingPhaseUnlock = z.infer<typeof pendingPhaseUnlockSchema>;

export const PHASE_UNLOCK_DATA: Record<number, { title: string; description: string; highlights: string[] }> = {
  2: { title: "Phase 2", description: "Building consistency.", highlights: ["Stat cap raised to 60", "Extended session bonuses"] },
  3: { title: "Phase 3", description: "Deepening practice.", highlights: ["Stat cap raised to 80", "Advanced weekly planning unlocked"] },
  4: { title: "Phase 4", description: "Sustained growth.", highlights: ["Stat cap raised to 100", "Trials system unlocked"] },
  5: { title: "Phase 5", description: "Long-term mastery.", highlights: ["Stat cap raised to 120", "All features unlocked"] },
};

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  level: integer("level").notNull().default(1),
  job: text("job").notNull().default("NONE"),
  title: text("title").notNull().default("AWAKENED"),
  hp: integer("hp").notNull().default(100),
  maxHp: integer("max_hp").notNull().default(100),
  lastHpCheckDate: text("last_hp_check_date"),
  lastMpCheckDate: text("last_mp_check_date"),
  mp: integer("mp").notNull().default(50),
  maxMp: integer("max_mp").notNull().default(50),
  stats: jsonb("stats").$type<Stats>().notNull().default({
    strength: 1,
    agility: 1,
    sense: 1,
    vitality: 1,
  }),
  phase: integer("phase").notNull().default(1),
  gold: integer("gold").notNull().default(0),
  rank: text("rank").notNull().default("E"),
  exp: integer("exp").notNull().default(0),
  maxExp: integer("max_exp").notNull().default(100),
  totalExp: integer("total_exp").notNull().default(0),
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
  phaseHistory: jsonb("phase_history").$type<PhaseHistoryEntry[]>().notNull().default([]),
  pendingPhaseUnlock: jsonb("pending_phase_unlock").$type<PendingPhaseUnlock>().default(null),
  planningMode: text("planning_mode").notNull().default("basic"),
  dailyStatProgress: jsonb("daily_stat_progress").$type<DailyStatProgress[]>().notNull().default([]),
  statXP: jsonb("stat_xp").$type<StatXP>().notNull().default({ strength: 0, agility: 0, sense: 0, vitality: 0 }),
  streak: integer("streak").notNull().default(0),
  consecutiveMissedDays: integer("consecutive_missed_days").notNull().default(0),
  stamina: integer("stamina").notNull().default(1),
  lastMVDCheckDate: text("last_mvd_check_date"),
});

export const dailyStatSnapshots = pgTable("daily_stat_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").notNull(),
  date: date("date").notNull(),
  level: integer("level").notNull(),
  stats: jsonb("stats").$type<Stats>().notNull(),
  powerRating: integer("power_rating").notNull(),
});

export const insertSnapshotSchema = createInsertSchema(dailyStatSnapshots).omit({
  id: true,
});

export type InsertSnapshot = z.infer<typeof insertSnapshotSchema>;
export type DailyStatSnapshot = typeof dailyStatSnapshots.$inferSelect;

export const insertPlayerSchema = createInsertSchema(players, {
  pendingPhaseUnlock: pendingPhaseUnlockSchema.optional().default(null),
  unlockedAttributes: z.array(z.string()).optional().default(["strength", "agility", "sense", "vitality"]),
  phaseHistory: z.array(phaseHistoryEntrySchema).optional().default([]),
}).omit({
  id: true,
});

export const updatePlayerSchema = createInsertSchema(players, {
  pendingPhaseUnlock: pendingPhaseUnlockSchema,
  unlockedAttributes: z.array(z.string()),
  phaseHistory: z.array(phaseHistoryEntrySchema),
}).partial().omit({
  id: true,
});

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type UpdatePlayer = z.infer<typeof updatePlayerSchema>;
export type Player = typeof players.$inferSelect;

export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  weeklyPriority: integer("weekly_priority").default(0),
});

export const insertRoleSchema = createInsertSchema(roles).omit({ id: true });
export const updateRoleSchema = createInsertSchema(roles).partial().omit({ id: true });
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type UpdateRole = z.infer<typeof updateRoleSchema>;
export type Role = typeof roles.$inferSelect;

export const weeklyGoals = pgTable("weekly_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  roleId: varchar("role_id").notNull(),
  title: text("title").notNull(),
  quadrant: text("quadrant").notNull().$type<Quadrant>(),
  completed: boolean("completed").default(false),
  weekStartDate: date("week_start_date").notNull(),
});

export const insertWeeklyGoalSchema = createInsertSchema(weeklyGoals, {
  quadrant: quadrantEnum,
}).omit({ id: true });
export const updateWeeklyGoalSchema = createInsertSchema(weeklyGoals, {
  quadrant: quadrantEnum,
}).partial().omit({ id: true });
export type InsertWeeklyGoal = z.infer<typeof insertWeeklyGoalSchema>;
export type UpdateWeeklyGoal = z.infer<typeof updateWeeklyGoalSchema>;
export type WeeklyGoal = typeof weeklyGoals.$inferSelect;

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  roleId: varchar("role_id").notNull(),
  weeklyGoalId: varchar("weekly_goal_id"),
  name: text("name").notNull(),
  quadrant: text("quadrant").notNull().$type<Quadrant>(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  color: text("color").notNull().default("#8b5cf6"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks, {
  quadrant: quadrantEnum,
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
}).omit({ id: true, createdAt: true });
export const updateTaskSchema = createInsertSchema(tasks, {
  quadrant: quadrantEnum,
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
}).partial().omit({ id: true, createdAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const trialStatusEnum = z.enum(["active", "completed"]);
export type TrialStatus = z.infer<typeof trialStatusEnum>;

export const trials = pgTable("trials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  trialType: text("trial_type").notNull(),
  status: text("status").notNull().$type<TrialStatus>().default("active"),
  startDate: date("start_date").notNull(),
  progressDays: integer("progress_days").notNull().default(0),
  lastEvaluatedDate: date("last_evaluated_date"),
});

export const insertTrialSchema = createInsertSchema(trials, {
  status: trialStatusEnum.optional().default("active"),
}).omit({ id: true });
export type InsertTrial = z.infer<typeof insertTrialSchema>;
export type Trial = typeof trials.$inferSelect;
