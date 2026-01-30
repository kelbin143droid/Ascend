import { players, type Player, type InsertPlayer, type UpdatePlayer, type Stats, type StatName, type FatigueData, type RankHistoryEntry, RANK_UNLOCK_DATA } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { processSession, updateFatigueTracker, type SessionResult } from "./gameLogic/statProgression";
import { checkRankUp, createRankHistoryEntry } from "./gameLogic/rankProgression";

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

    let newExp = player.exp + amount;
    let newLevel = player.level;
    let newMaxExp = player.maxExp;
    let newAvailablePoints = player.availablePoints;
    let newMaxHp = player.maxHp;
    let newMaxMp = player.maxMp;
    let newHp = player.hp;
    let newMp = player.mp;
    let newRank = player.rank;
    let pendingRankUnlock = player.pendingRankUnlock;
    let rankHistory = [...(player.rankHistory || [])];
    let unlockedAttributes = [...(player.unlockedAttributes || ["strength", "agility", "sense", "vitality"])];

    while (newExp >= newMaxExp) {
      newExp -= newMaxExp;
      newLevel += 1;
      newAvailablePoints += 5;
      newMaxExp = Math.floor(newMaxExp * 1.5);
      newMaxHp += 50;
      newMaxMp += 20;
      newHp = newMaxHp;
      newMp = newMaxMp;

      const rankUpResult = checkRankUp(newLevel, newRank);
      if (rankUpResult && !pendingRankUnlock) {
        newRank = rankUpResult.newRank;
        const attribute = rankUpResult.unlockData.attribute.toLowerCase();
        pendingRankUnlock = { rank: newRank, attribute };
      }
    }

    return this.updatePlayer(id, {
      exp: newExp,
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

    await this.updatePlayer(id, {
      stats: result.updatedStats,
      fatigue: newFatigue
    });

    const updatedPlayer = await this.gainExp(id, result.levelXP);

    return { player: updatedPlayer!, result };
  }
}

export const storage = new DatabaseStorage();
