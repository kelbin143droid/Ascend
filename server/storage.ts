import { 
  players, dailyStatSnapshots, roles, weeklyGoals, tasks, trials,
  type Player, type InsertPlayer, type UpdatePlayer, type Stats, type StatName, 
  type FatigueData, type RankHistoryEntry, type DailyStatSnapshot, type InsertSnapshot, 
  type Role, type InsertRole, type UpdateRole,
  type WeeklyGoal, type InsertWeeklyGoal, type UpdateWeeklyGoal,
  type Task, type InsertTask, type UpdateTask,
  type Trial, type InsertTrial,
  RANK_UNLOCK_DATA 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { processSession, updateFatigueTracker, getTodayDateString, type SessionResult } from "./gameLogic/statProgression";
import { checkRankUp, createRankHistoryEntry } from "./gameLogic/rankProgression";
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
  addStat(id: string, stat: keyof Stats): Promise<Player | undefined>;
  gainExp(id: string, amount: number): Promise<Player | undefined>;
  modifyHp(id: string, amount: number): Promise<Player | undefined>;
  modifyMp(id: string, amount: number): Promise<Player | undefined>;
  completeSession(id: string, input: CompleteSessionInput): Promise<{ player: Player; result: SessionResult } | undefined>;
  confirmRankUnlock(id: string): Promise<Player | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  async getPlayer(id: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player || undefined;
  }

  async getPlayerByName(name: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.name, name));
    return player || undefined;
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const [player] = await db
      .insert(players)
      .values(insertPlayer)
      .returning();
    return player;
  }

  async updatePlayer(id: string, updates: UpdatePlayer): Promise<Player | undefined> {
    const [player] = await db
      .update(players)
      .set(updates)
      .where(eq(players.id, id))
      .returning();
    return player || undefined;
  }

  async addStat(id: string, stat: keyof Stats): Promise<Player | undefined> {
    const player = await this.getPlayer(id);
    if (!player || player.availablePoints <= 0) return player;

    const newStats = { ...player.stats, [stat]: player.stats[stat] + 1 };
    let newMaxHp = player.maxHp;
    let newMaxMp = player.maxMp;

    if (stat === 'vitality') newMaxHp += 20;

    return this.updatePlayer(id, {
      stats: newStats,
      maxHp: newMaxHp,
      maxMp: newMaxMp,
      availablePoints: player.availablePoints - 1,
    });
  }

  async gainExp(id: string, amount: number): Promise<Player | undefined> {
    const player = await this.getPlayer(id);
    if (!player) return undefined;

    const { getLevelFromXP, getRankFromLevel } = await import("./gameLogic/levelSystem");

    const newTotalExp = (player.totalExp || 0) + amount;
    const levelInfo = getLevelFromXP(newTotalExp);
    
    const oldLevel = player.level;
    const newLevel = levelInfo.level;
    const newExp = levelInfo.remainingXP;
    const newMaxExp = levelInfo.xpForNext;
    
    let newAvailablePoints = player.availablePoints;
    let newMaxHp = player.maxHp;
    let newMaxMp = player.maxMp;
    let newHp = player.hp;
    let newMp = player.mp;
    let newRank = player.rank;
    let pendingRankUnlock = player.pendingRankUnlock;
    let rankHistory = [...(player.rankHistory || [])];
    let unlockedAttributes = [...(player.unlockedAttributes || ["strength", "agility", "sense", "vitality"])];

    if (newLevel > oldLevel) {
      const levelsGained = newLevel - oldLevel;
      newAvailablePoints += levelsGained * 3;
      newMaxHp += levelsGained * 50;
      newMaxMp += levelsGained * 20;
      newHp = newMaxHp;
      newMp = newMaxMp;

      const expectedRank = getRankFromLevel(newLevel);
      if (expectedRank !== newRank && !pendingRankUnlock) {
        const rankUpResult = checkRankUp(newLevel, newRank);
        if (rankUpResult) {
          newRank = rankUpResult.newRank;
          const attribute = rankUpResult.unlockData.attribute.toLowerCase();
          pendingRankUnlock = { rank: newRank, attribute };
        }
      }
    }

    return this.updatePlayer(id, {
      exp: newExp,
      totalExp: newTotalExp,
      level: newLevel,
      maxExp: newMaxExp,
      availablePoints: newAvailablePoints,
      maxHp: newMaxHp,
      maxMp: newMaxMp,
      hp: newHp,
      mp: newMp,
      rank: newRank,
      pendingRankUnlock,
      rankHistory,
      unlockedAttributes,
    });
  }

  async confirmRankUnlock(id: string): Promise<Player | undefined> {
    const player = await this.getPlayer(id);
    if (!player || !player.pendingRankUnlock) return player;

    const { rank, attribute } = player.pendingRankUnlock;
    const rankHistory = [...(player.rankHistory || [])];
    const unlockedAttributes = [...(player.unlockedAttributes || ["strength", "agility", "sense", "vitality"])];

    const unlockData = RANK_UNLOCK_DATA[rank];
    if (unlockData) {
      rankHistory.push(createRankHistoryEntry(rank, unlockData.attribute));
      if (!unlockedAttributes.includes(attribute)) {
        unlockedAttributes.push(attribute);
      }
    }

    return this.updatePlayer(id, {
      pendingRankUnlock: null,
      rankHistory,
      unlockedAttributes,
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
      rank: player.rank,
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
    
    return this.createRole({ userId, name: "General", weeklyPriority: 0 });
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
}

export const storage = new DatabaseStorage();
