import { 
  players, dailyStatSnapshots, roles, weeklyGoals, tasks, trials, calendarEvents,
  habits, habitCompletions, badges,
  type Player, type InsertPlayer, type UpdatePlayer, type Stats, type StatName, 
  type FatigueData, type PhaseHistoryEntry, type DailyStatSnapshot, type InsertSnapshot, 
  type Role, type InsertRole, type UpdateRole,
  type WeeklyGoal, type InsertWeeklyGoal, type UpdateWeeklyGoal,
  type Task, type InsertTask, type UpdateTask,
  type Trial, type InsertTrial,
  type CalendarEvent, type InsertCalendarEvent, type UpdateCalendarEvent,
  type Habit, type InsertHabit, type UpdateHabit,
  type HabitCompletion, type InsertHabitCompletion,
  type Badge, type InsertBadge,
  PHASE_UNLOCK_DATA 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { processSession, updateFatigueTracker, getTodayDateString, type SessionResult } from "./gameLogic/statProgression";
import { updateStamina } from "./gameLogic/xpProgressionSystem";

export interface CompleteSessionInput {
  stat: StatName;
  xp: number;
  durationMinutes: number;
}

export interface IStorage {
  getPlayer(id: string): Promise<Player | undefined>;
  getPlayerByName(name: string): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, updates: UpdatePlayer): Promise<Player | undefined>;
  gainExp(id: string, amount: number): Promise<Player | undefined>;
  modifyHp(id: string, amount: number): Promise<Player | undefined>;
  modifyMp(id: string, amount: number): Promise<Player | undefined>;
  completeSession(id: string, input: CompleteSessionInput): Promise<{ player: Player; result: SessionResult } | undefined>;
  confirmPhaseUnlock(id: string): Promise<Player | undefined>;
  saveStatSnapshot(playerId: string): Promise<DailyStatSnapshot | undefined>;
  getWeeklySnapshots(playerId: string): Promise<DailyStatSnapshot[]>;
  
  getRoles(userId: string): Promise<Role[]>;
  getRole(id: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, updates: UpdateRole): Promise<Role | undefined>;
  deleteRole(id: string): Promise<boolean>;
  getOrCreateDefaultRole(userId: string): Promise<Role>;
  
  getWeeklyGoals(userId: string, weekStartDate?: string): Promise<WeeklyGoal[]>;
  getWeeklyGoal(id: string): Promise<WeeklyGoal | undefined>;
  createWeeklyGoal(goal: InsertWeeklyGoal): Promise<WeeklyGoal>;
  updateWeeklyGoal(id: string, updates: UpdateWeeklyGoal): Promise<WeeklyGoal | undefined>;
  deleteWeeklyGoal(id: string): Promise<boolean>;
  
  getTasks(userId: string, weekStartDate?: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  
  getTrials(userId: string): Promise<Trial[]>;
  getActiveTrial(userId: string, trialType: string): Promise<Trial | undefined>;
  createTrial(trial: InsertTrial): Promise<Trial>;
  updateTrial(id: string, updates: Partial<Trial>): Promise<Trial | undefined>;
  
  getCalendarEvents(userId: string, month?: string): Promise<CalendarEvent[]>;
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, updates: UpdateCalendarEvent): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: string): Promise<boolean>;
  
  getHabits(userId: string): Promise<Habit[]>;
  getHabit(id: string): Promise<Habit | undefined>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: string, updates: UpdateHabit): Promise<Habit | undefined>;
  deleteHabit(id: string): Promise<boolean>;
  
  getHabitCompletions(userId: string, since?: Date): Promise<HabitCompletion[]>;
  createHabitCompletion(completion: InsertHabitCompletion): Promise<HabitCompletion>;
  
  getBadges(userId: string): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
}

export class DatabaseStorage implements IStorage {
  private normalizePlayer(player: Player): Player {
    if (!player.stability) {
      player.stability = {
        score: 50,
        habitCompletionPct: 0,
        sleepConsistency: 50,
        energyCompliance: 50,
        emotionalStability: 50,
        taskTimingAdherence: 50,
        consecutiveLowDays: 0,
        softRegressionActive: false,
      };
    }
    return player;
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player ? this.normalizePlayer(player) : undefined;
  }

  async getPlayerByName(name: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.name, name));
    return player ? this.normalizePlayer(player) : undefined;
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const [player] = await db
      .insert(players)
      .values(insertPlayer)
      .returning();
    return this.normalizePlayer(player);
  }

  async updatePlayer(id: string, updates: UpdatePlayer): Promise<Player | undefined> {
    const [player] = await db
      .update(players)
      .set(updates)
      .where(eq(players.id, id))
      .returning();
    return player ? this.normalizePlayer(player) : undefined;
  }

  async gainExp(id: string, amount: number): Promise<Player | undefined> {
    const player = await this.getPlayer(id);
    if (!player) return undefined;

    const { getLevelFromXP } = await import("./gameLogic/levelSystem");

    const newTotalExp = (player.totalExp || 0) + amount;
    const levelInfo = getLevelFromXP(newTotalExp);
    
    const oldLevel = player.level;
    const newLevel = levelInfo.level;
    const newExp = levelInfo.remainingXP;
    const newMaxExp = levelInfo.xpForNext;

    const updates: UpdatePlayer = {
      exp: newExp,
      totalExp: newTotalExp,
      level: newLevel,
      maxExp: newMaxExp,
    };

    if (newLevel > oldLevel) {
      const levelsGained = newLevel - oldLevel;
      updates.maxHp = Math.min(999999, player.maxHp + (levelsGained * 50));
      updates.maxMp = Math.min(99999, player.maxMp + (levelsGained * 20));
      updates.hp = updates.maxHp;
      updates.mp = updates.maxMp;
    }

    return this.updatePlayer(id, updates);
  }

  async confirmPhaseUnlock(id: string): Promise<Player | undefined> {
    const player = await this.getPlayer(id);
    if (!player || !player.pendingPhaseUnlock) return player;

    const { phase } = player.pendingPhaseUnlock;
    const phaseHistory = [...(player.phaseHistory || [])];

    phaseHistory.push({
      phase,
      date: new Date().toISOString().split('T')[0],
    });

    return this.updatePlayer(id, {
      phase,
      pendingPhaseUnlock: null,
      phaseHistory,
    });
  }

  async modifyHp(id: string, amount: number): Promise<Player | undefined> {
    const player = await this.getPlayer(id);
    if (!player) return undefined;

    const newHp = Math.min(player.maxHp, Math.max(0, player.hp + amount));
    return this.updatePlayer(id, { hp: newHp });
  }

  async modifyMp(id: string, amount: number): Promise<Player | undefined> {
    const player = await this.getPlayer(id);
    if (!player) return undefined;

    const newMp = Math.min(player.maxMp, Math.max(0, player.mp + amount));
    return this.updatePlayer(id, { mp: newMp });
  }

  async completeSession(id: string, input: CompleteSessionInput): Promise<{ player: Player; result: SessionResult } | undefined> {
    const player = await this.getPlayer(id);
    if (!player) return undefined;

    const fatigue = player.fatigue || { date: "", sessions: { strength: 0, agility: 0, sense: 0, vitality: 0 } };

    const result = processSession({
      xp: input.xp,
      stat: input.stat,
      currentStats: player.stats,
      phase: player.phase,
      durationMinutes: input.durationMinutes,
      fatigue
    });

    const newFatigue = updateFatigueTracker(fatigue, input.stat);

    const currentStatXP = player.statXP || { strength: 0, agility: 0, sense: 0, vitality: 0 };
    const statKey = input.stat as keyof typeof currentStatXP;
    const newStatXP = {
      ...currentStatXP,
      [statKey]: (currentStatXP[statKey] || 0) + result.levelXP,
    };

    const newStamina = updateStamina(newStatXP.strength, newStatXP.agility);

    await this.updatePlayer(id, {
      stats: result.updatedStats,
      fatigue: newFatigue,
      statXP: newStatXP,
      stamina: newStamina,
    });

    const updatedPlayer = await this.gainExp(id, result.levelXP);

    return { player: updatedPlayer!, result };
  }

  async saveStatSnapshot(playerId: string): Promise<DailyStatSnapshot | undefined> {
    const player = await this.getPlayer(playerId);
    if (!player) return undefined;

    const today = getTodayDateString();
    
    const existing = await db.select().from(dailyStatSnapshots)
      .where(and(
        eq(dailyStatSnapshots.playerId, playerId),
        eq(dailyStatSnapshots.date, today)
      ));
    
    if (existing.length > 0) {
      return existing[0];
    }

    const powerRating = Math.floor(
      player.stats.strength * 1.5 +
      player.stats.agility * 1.2 +
      player.stats.sense * 1.3 +
      player.stats.vitality * 1.4 +
      player.level * 10
    );

    const [snapshot] = await db.insert(dailyStatSnapshots).values({
      playerId,
      date: today,
      level: player.level,
      stats: player.stats,
      powerRating,
    }).returning();

    return snapshot;
  }

  async getWeeklySnapshots(playerId: string): Promise<DailyStatSnapshot[]> {
    const today = getTodayDateString();
    const todayDate = new Date(today + 'T00:00:00');
    todayDate.setDate(todayDate.getDate() - 7);
    const sevenDaysAgoStr = todayDate.toISOString().split('T')[0];

    const snapshots = await db.select().from(dailyStatSnapshots)
      .where(and(
        eq(dailyStatSnapshots.playerId, playerId),
        gte(dailyStatSnapshots.date, sevenDaysAgoStr)
      ))
      .orderBy(dailyStatSnapshots.date);

    return snapshots;
  }

  async getRoles(userId: string): Promise<Role[]> {
    return db.select().from(roles).where(eq(roles.userId, userId));
  }

  async getRole(id: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async updateRole(id: string, updates: UpdateRole): Promise<Role | undefined> {
    const [role] = await db.update(roles).set(updates).where(eq(roles.id, id)).returning();
    return role || undefined;
  }

  async deleteRole(id: string): Promise<boolean> {
    const result = await db.delete(roles).where(eq(roles.id, id)).returning();
    return result.length > 0;
  }

  async getOrCreateDefaultRole(userId: string): Promise<Role> {
    const existingRoles = await this.getRoles(userId);
    const generalRole = existingRoles.find(r => r.name === "General");
    if (generalRole) return generalRole;

    try {
      return await this.createRole({ userId, name: "General", weeklyPriority: 0 });
    } catch {
      const rolesAfterRetry = await this.getRoles(userId);
      return rolesAfterRetry.find(r => r.name === "General")!;
    }
  }

  async getWeeklyGoals(userId: string, weekStartDate?: string): Promise<WeeklyGoal[]> {
    if (weekStartDate) {
      return db.select().from(weeklyGoals).where(
        and(eq(weeklyGoals.userId, userId), eq(weeklyGoals.weekStartDate, weekStartDate))
      );
    }
    return db.select().from(weeklyGoals).where(eq(weeklyGoals.userId, userId));
  }

  async getWeeklyGoal(id: string): Promise<WeeklyGoal | undefined> {
    const [goal] = await db.select().from(weeklyGoals).where(eq(weeklyGoals.id, id));
    return goal || undefined;
  }

  async createWeeklyGoal(goal: InsertWeeklyGoal): Promise<WeeklyGoal> {
    const [newGoal] = await db.insert(weeklyGoals).values(goal).returning();
    return newGoal;
  }

  async updateWeeklyGoal(id: string, updates: UpdateWeeklyGoal): Promise<WeeklyGoal | undefined> {
    const [goal] = await db.update(weeklyGoals).set(updates).where(eq(weeklyGoals.id, id)).returning();
    return goal || undefined;
  }

  async deleteWeeklyGoal(id: string): Promise<boolean> {
    const result = await db.delete(weeklyGoals).where(eq(weeklyGoals.id, id)).returning();
    return result.length > 0;
  }

  async getTasks(userId: string, weekStartDate?: string): Promise<Task[]> {
    if (weekStartDate) {
      const weekStart = new Date(weekStartDate);
      const weekEnd = new Date(weekStartDate);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      return db.select().from(tasks).where(
        and(
          eq(tasks.userId, userId),
          gte(tasks.startTime, weekStart),
          gte(sql`${weekEnd}`, tasks.startTime)
        )
      );
    }
    return db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: string, updates: UpdateTask): Promise<Task | undefined> {
    const [task] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return task || undefined;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  async getTrials(userId: string): Promise<Trial[]> {
    return await db.select().from(trials).where(eq(trials.userId, userId));
  }

  async getActiveTrial(userId: string, trialType: string): Promise<Trial | undefined> {
    const [trial] = await db.select().from(trials).where(
      and(
        eq(trials.userId, userId),
        eq(trials.trialType, trialType),
        eq(trials.status, "active")
      )
    );
    return trial || undefined;
  }

  async createTrial(trial: InsertTrial): Promise<Trial> {
    const [newTrial] = await db.insert(trials).values(trial).returning();
    return newTrial;
  }

  async updateTrial(id: string, updates: Partial<Trial>): Promise<Trial | undefined> {
    const [trial] = await db.update(trials).set(updates).where(eq(trials.id, id)).returning();
    return trial || undefined;
  }

  async getCalendarEvents(userId: string, month?: string): Promise<CalendarEvent[]> {
    if (month) {
      const startDate = `${month}-01`;
      const [year, m] = month.split('-').map(Number);
      const endDate = `${year}-${String(m + 1).padStart(2, '0')}-01`;
      return db.select().from(calendarEvents).where(
        and(
          eq(calendarEvents.userId, userId),
          gte(calendarEvents.date, startDate),
          sql`${calendarEvents.date} < ${endDate}`
        )
      );
    }
    return db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId));
  }

  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    const [event] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
    return event || undefined;
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [newEvent] = await db.insert(calendarEvents).values(event as any).returning();
    return newEvent;
  }

  async updateCalendarEvent(id: string, updates: UpdateCalendarEvent): Promise<CalendarEvent | undefined> {
    const [event] = await db.update(calendarEvents).set(updates as any).where(eq(calendarEvents.id, id)).returning();
    return event || undefined;
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    const result = await db.delete(calendarEvents).where(eq(calendarEvents.id, id)).returning();
    return result.length > 0;
  }

  async getHabits(userId: string): Promise<Habit[]> {
    return db.select().from(habits).where(eq(habits.userId, userId));
  }

  async getHabit(id: string): Promise<Habit | undefined> {
    const [habit] = await db.select().from(habits).where(eq(habits.id, id));
    return habit || undefined;
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const [newHabit] = await db.insert(habits).values(habit as any).returning();
    return newHabit;
  }

  async updateHabit(id: string, updates: UpdateHabit): Promise<Habit | undefined> {
    const [habit] = await db.update(habits).set(updates as any).where(eq(habits.id, id)).returning();
    return habit || undefined;
  }

  async deleteHabit(id: string): Promise<boolean> {
    const result = await db.delete(habits).where(eq(habits.id, id)).returning();
    return result.length > 0;
  }

  async getHabitCompletions(userId: string, since?: Date): Promise<HabitCompletion[]> {
    if (since) {
      return db.select().from(habitCompletions).where(
        and(
          eq(habitCompletions.userId, userId),
          gte(habitCompletions.completedAt, since)
        )
      ).orderBy(desc(habitCompletions.completedAt));
    }
    return db.select().from(habitCompletions)
      .where(eq(habitCompletions.userId, userId))
      .orderBy(desc(habitCompletions.completedAt));
  }

  async createHabitCompletion(completion: InsertHabitCompletion): Promise<HabitCompletion> {
    const [newCompletion] = await db.insert(habitCompletions).values(completion).returning();
    return newCompletion;
  }

  async getBadges(userId: string): Promise<Badge[]> {
    return db.select().from(badges).where(eq(badges.userId, userId));
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge as any).returning();
    return newBadge;
  }
}

export const storage = new DatabaseStorage();
