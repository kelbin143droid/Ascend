import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPlayerSchema, updatePlayerSchema, type Player, type StatName, RANK_STAT_CAPS } from "@shared/schema";
import { z } from "zod";
import { calculateDerivedStats, type DerivedStats } from "./gameLogic/stats";
import { calculateXP } from "./gameLogic/xp";
import { getDisplayStats, getTodayDateString, getFatigueMultiplier } from "./gameLogic/statProgression";

interface PlayerWithDerived extends Player {
  derived: DerivedStats;
  displayStats: { strength: number; agility: number; sense: number; vitality: number };
  fatigueInfo: { strength: number; agility: number; sense: number; vitality: number };
  rankStatCap: number;
  systemMessage?: string;
}

function attachDerivedStats(player: Player, systemMessage?: string): PlayerWithDerived {
  const displayStats = getDisplayStats(player.stats);
  
  const today = getTodayDateString();
  const fatigue = player.fatigue || { date: "", sessions: { strength: 0, agility: 0, sense: 0, vitality: 0 } };
  const fatigueInfo = fatigue.date === today ? fatigue.sessions : { strength: 0, agility: 0, sense: 0, vitality: 0 };
  
  return {
    ...player,
    derived: calculateDerivedStats(player.stats, player.rank),
    displayStats,
    fatigueInfo,
    rankStatCap: RANK_STAT_CAPS[player.rank] || 25,
    ...(systemMessage && { systemMessage }),
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/player/:id", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      res.json(attachDerivedStats(player));
    } catch (error) {
      res.status(500).json({ error: "Failed to get player" });
    }
  });

  app.post("/api/player", async (req, res) => {
    try {
      const parsed = insertPlayerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const player = await storage.createPlayer(parsed.data);
      res.status(201).json(attachDerivedStats(player));
    } catch (error) {
      res.status(500).json({ error: "Failed to create player" });
    }
  });

  app.patch("/api/player/:id", async (req, res) => {
    try {
      const parsed = updatePlayerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const player = await storage.updatePlayer(req.params.id, parsed.data);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      res.json(attachDerivedStats(player));
    } catch (error) {
      res.status(500).json({ error: "Failed to update player" });
    }
  });

  app.post("/api/player/:id/add-stat", async (req, res) => {
    try {
      const statSchema = z.object({ stat: z.enum(["strength", "agility", "sense", "vitality"]) });
      const parsed = statSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid stat" });
      }
      
      const currentPlayer = await storage.getPlayer(req.params.id);
      if (!currentPlayer) {
        return res.status(404).json({ error: "Player not found" });
      }
      if (currentPlayer.availablePoints <= 0) {
        return res.status(400).json({ error: "No stat points available" });
      }
      
      const player = await storage.addStat(req.params.id, parsed.data.stat);
      if (!player) {
        return res.status(500).json({ error: "Failed to update stat" });
      }
      
      const statMessages: Record<string, string> = {
        strength: `Strength increased → Power rating now ${(player.stats.strength * 1.5).toFixed(1)}`,
        agility: `Agility increased → Streak forgiveness now ${Math.floor(player.stats.agility / 10)} days`,
        sense: `Sense increased → XP efficiency +${((player.stats.sense * 0.02) * 100).toFixed(0)}%`,
        vitality: `Vitality increased → Max stamina now ${100 + player.stats.vitality * 5}`,
      };
      
      res.json(attachDerivedStats(player, statMessages[parsed.data.stat]));
    } catch (error) {
      res.status(500).json({ error: "Failed to add stat" });
    }
  });

  app.post("/api/player/:id/gain-exp", async (req, res) => {
    try {
      const expSchema = z.object({ amount: z.number().positive() });
      const parsed = expSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid exp amount" });
      }
      
      const currentPlayer = await storage.getPlayer(req.params.id);
      if (!currentPlayer) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      const scaledXP = calculateXP({ baseXP: parsed.data.amount, stats: currentPlayer.stats });
      const player = await storage.gainExp(req.params.id, scaledXP);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      const leveledUp = player.level > currentPlayer.level;
      const message = leveledUp 
        ? `Level up! Now level ${player.level}. +5 stat points available.`
        : `Gained ${scaledXP} XP (base: ${parsed.data.amount}, multiplier: ${(1 + currentPlayer.stats.sense * 0.02).toFixed(2)}x)`;
      
      res.json(attachDerivedStats(player, message));
    } catch (error) {
      res.status(500).json({ error: "Failed to gain exp" });
    }
  });

  app.post("/api/player/:id/modify-hp", async (req, res) => {
    try {
      const hpSchema = z.object({ amount: z.number() });
      const parsed = hpSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid hp amount" });
      }
      const player = await storage.modifyHp(req.params.id, parsed.data.amount);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      res.json(attachDerivedStats(player));
    } catch (error) {
      res.status(500).json({ error: "Failed to modify hp" });
    }
  });

  app.post("/api/player/:id/modify-mp", async (req, res) => {
    try {
      const mpSchema = z.object({ amount: z.number() });
      const parsed = mpSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid mp amount" });
      }
      const player = await storage.modifyMp(req.params.id, parsed.data.amount);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      res.json(attachDerivedStats(player));
    } catch (error) {
      res.status(500).json({ error: "Failed to modify mp" });
    }
  });

  // Action: Workout (Strength) - requires timer >= 10 minutes
  app.post("/api/player/:id/action/workout", async (req, res) => {
    try {
      const workoutSchema = z.object({ durationMinutes: z.number().min(10) });
      const parsed = workoutSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Workout must be at least 10 minutes" });
      }
      
      const currentPlayer = await storage.getPlayer(req.params.id);
      if (!currentPlayer) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      const baseXP = Math.floor(parsed.data.durationMinutes * 2);
      const scaledXP = calculateXP({ baseXP, stats: currentPlayer.stats });
      const player = await storage.gainExp(req.params.id, scaledXP);
      
      res.json(attachDerivedStats(player!, `Workout complete! Gained ${scaledXP} XP from ${parsed.data.durationMinutes} min session.`));
    } catch (error) {
      res.status(500).json({ error: "Failed to complete workout" });
    }
  });

  // Action: Focus (Sense) - single-task focus timer
  app.post("/api/player/:id/action/focus", async (req, res) => {
    try {
      const focusSchema = z.object({ durationMinutes: z.number().min(5) });
      const parsed = focusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Focus session must be at least 5 minutes" });
      }
      
      const currentPlayer = await storage.getPlayer(req.params.id);
      if (!currentPlayer) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      const baseXP = Math.floor(parsed.data.durationMinutes * 1.5);
      const scaledXP = calculateXP({ baseXP, stats: currentPlayer.stats });
      const player = await storage.gainExp(req.params.id, scaledXP);
      
      res.json(attachDerivedStats(player!, `Focus complete! Gained ${scaledXP} XP. Sense sharpened.`));
    } catch (error) {
      res.status(500).json({ error: "Failed to complete focus session" });
    }
  });

  // Action: Recovery (Vitality) - daily check-in
  app.post("/api/player/:id/action/recovery", async (req, res) => {
    try {
      const currentPlayer = await storage.getPlayer(req.params.id);
      if (!currentPlayer) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      const derived = calculateDerivedStats(currentPlayer.stats);
      const hpRecovery = Math.floor(derived.staminaMax * 0.2);
      
      await storage.modifyHp(req.params.id, hpRecovery);
      
      const baseXP = 10;
      const scaledXP = calculateXP({ baseXP, stats: currentPlayer.stats });
      await storage.gainExp(req.params.id, scaledXP);
      
      // Re-fetch to get updated HP and XP
      const player = await storage.getPlayer(req.params.id);
      
      const message = currentPlayer.hp < currentPlayer.maxHp * 0.3
        ? `Recovery check-in! HP restored. Vitality low → stamina penalty was applied.`
        : `Recovery check-in! HP +${hpRecovery}. Gained ${scaledXP} XP.`;
      
      res.json(attachDerivedStats(player!, message));
    } catch (error) {
      res.status(500).json({ error: "Failed to complete recovery" });
    }
  });

  // Action: Streak Check (Agility) - streak protection
  app.post("/api/player/:id/action/streak-check", async (req, res) => {
    try {
      const streakSchema = z.object({ missedDays: z.number().min(0) });
      const parsed = streakSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid streak data" });
      }
      
      const currentPlayer = await storage.getPlayer(req.params.id);
      if (!currentPlayer) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      const derived = calculateDerivedStats(currentPlayer.stats);
      const forgiven = parsed.data.missedDays <= derived.streakForgiveness;
      
      let message: string;
      if (parsed.data.missedDays === 0) {
        const baseXP = 15;
        const scaledXP = calculateXP({ baseXP, stats: currentPlayer.stats });
        const player = await storage.gainExp(req.params.id, scaledXP);
        message = `Streak maintained! Gained ${scaledXP} XP.`;
        return res.json(attachDerivedStats(player!, message));
      } else if (forgiven) {
        message = `Streak preserved by Agility bonus! (${parsed.data.missedDays} days forgiven)`;
      } else {
        message = `Streak broken. Agility forgiveness (${derived.streakForgiveness} days) exceeded.`;
      }
      
      res.json(attachDerivedStats(currentPlayer, message));
    } catch (error) {
      res.status(500).json({ error: "Failed to check streak" });
    }
  });

  // Initialize starter items if inventory is empty
  app.post("/api/player/:id/init-inventory", async (req, res) => {
    try {
      const currentPlayer = await storage.getPlayer(req.params.id);
      if (!currentPlayer) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      if (currentPlayer.inventory && currentPlayer.inventory.length > 0) {
        return res.json(attachDerivedStats(currentPlayer));
      }
      
      const starterItems = [
        { id: "sword_1", name: "Iron Sword", type: "weapon", rarity: "E", icon: "⚔️", description: "A basic iron sword", stats: { attack: 5 } },
        { id: "armor_1", name: "Leather Armor", type: "armor", rarity: "E", icon: "🥋", description: "Basic leather protection", stats: { defense: 3 } },
        { id: "ring_1", name: "Copper Ring", type: "accessory", rarity: "E", icon: "💍", description: "A simple copper ring", stats: { luck: 1 } },
        { id: "sword_2", name: "Steel Blade", type: "weapon", rarity: "D", icon: "🗡️", description: "A sharp steel blade", stats: { attack: 10 } },
        { id: "armor_2", name: "Chain Mail", type: "armor", rarity: "D", icon: "🛡️", description: "Linked chain protection", stats: { defense: 7 } },
        { id: "amulet_1", name: "Wolf Fang Amulet", type: "accessory", rarity: "C", icon: "🐺", description: "Grants the power of wolves", stats: { attack: 3, speed: 5 } },
      ];
      
      const player = await storage.updatePlayer(req.params.id, { inventory: starterItems as any });
      res.json(attachDerivedStats(player!));
    } catch (error) {
      res.status(500).json({ error: "Failed to initialize inventory" });
    }
  });

  app.post("/api/player/:id/complete-session", async (req, res) => {
    try {
      const sessionSchema = z.object({
        stat: z.enum(["strength", "agility", "sense", "vitality"]),
        xp: z.number().positive(),
        durationMinutes: z.number().positive()
      });
      
      const parsed = sessionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid session data" });
      }
      
      const result = await storage.completeSession(req.params.id, {
        stat: parsed.data.stat as StatName,
        xp: parsed.data.xp,
        durationMinutes: parsed.data.durationMinutes
      });
      
      if (!result) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      res.json(attachDerivedStats(result.player, result.result.message));
    } catch (error) {
      res.status(500).json({ error: "Failed to complete session" });
    }
  });

  app.post("/api/player/:id/add-levels", async (req, res) => {
    try {
      const levelSchema = z.object({ levels: z.number().min(1).max(100) });
      const parsed = levelSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid levels amount (1-100)" });
      }
      
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      const levelsToAdd = parsed.data.levels;
      let newLevel = player.level + levelsToAdd;
      let newAvailablePoints = Math.min(9999, player.availablePoints + (levelsToAdd * 5));
      let newMaxHp = Math.min(999999, player.maxHp + (levelsToAdd * 50));
      let newMaxMp = Math.min(99999, player.maxMp + (levelsToAdd * 20));
      let newRank = player.rank;
      let pendingRankUnlock = player.pendingRankUnlock;
      
      const rankOrder = ["E", "D", "C", "B", "A", "S"];
      const thresholds = { D: 11, C: 26, B: 46, A: 71, S: 101 };
      
      for (const [rank, threshold] of Object.entries(thresholds)) {
        if (newLevel >= threshold && rankOrder.indexOf(rank) > rankOrder.indexOf(newRank) && !pendingRankUnlock) {
          newRank = rank;
          const unlockData = { D: "endurance", C: "mobility", B: "social", A: "skill", S: "ascension" };
          pendingRankUnlock = { rank: newRank, attribute: unlockData[rank as keyof typeof unlockData] };
        }
      }
      
      const newMaxExp = Math.min(2000000000, Math.floor(100 * Math.pow(1.2, Math.min(newLevel - 1, 100))));
      
      const updatedPlayer = await storage.updatePlayer(req.params.id, {
        level: newLevel,
        availablePoints: newAvailablePoints,
        maxHp: newMaxHp,
        maxMp: newMaxMp,
        hp: newMaxHp,
        mp: newMaxMp,
        rank: newRank,
        pendingRankUnlock,
        exp: 0,
        maxExp: newMaxExp,
      });
      
      res.json(attachDerivedStats(updatedPlayer!, `Added ${levelsToAdd} levels! Now level ${newLevel}.`));
    } catch (error) {
      console.error("Add levels error:", error);
      res.status(500).json({ error: "Failed to add levels" });
    }
  });

  app.post("/api/player/:id/confirm-rank-unlock", async (req, res) => {
    try {
      const player = await storage.confirmRankUnlock(req.params.id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      res.json(attachDerivedStats(player, `Welcome to Rank ${player.rank}!`));
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm rank unlock" });
    }
  });

  app.post("/api/player/:id/save-snapshot", async (req, res) => {
    try {
      const snapshot = await storage.saveStatSnapshot(req.params.id);
      if (!snapshot) {
        return res.status(404).json({ error: "Player not found" });
      }
      res.json(snapshot);
    } catch (error) {
      res.status(500).json({ error: "Failed to save snapshot" });
    }
  });

  app.get("/api/player/:id/analytics", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }

      await storage.saveStatSnapshot(req.params.id);
      
      let snapshots = await storage.getWeeklySnapshots(req.params.id);

      if (snapshots.length === 0) {
        const today = new Date().toISOString().split('T')[0];
        const powerRating = Math.floor(
          player.stats.strength * 1.5 +
          player.stats.agility * 1.2 +
          player.stats.sense * 1.3 +
          player.stats.vitality * 1.4 +
          player.level * 10
        );
        
        snapshots = [{
          id: 'current',
          playerId: player.id,
          date: today,
          level: player.level,
          stats: player.stats,
          powerRating
        }];
      }

      const first = snapshots[0];
      const last = snapshots[snapshots.length - 1];
      
      const calculateGrowthRate = (start: number, end: number) => {
        if (start === 0) return end > 0 ? 100 : 0;
        return Math.round(((end - start) / start) * 100);
      };

      const weeklyGrowth = {
        strength: calculateGrowthRate(first.stats.strength, last.stats.strength),
        agility: calculateGrowthRate(first.stats.agility, last.stats.agility),
        sense: calculateGrowthRate(first.stats.sense, last.stats.sense),
        vitality: calculateGrowthRate(first.stats.vitality, last.stats.vitality),
        power: calculateGrowthRate(first.powerRating, last.powerRating),
        level: last.level - first.level,
      };

      const totalStats = last.stats.strength + last.stats.agility + last.stats.sense + last.stats.vitality;
      const avgDailyGrowth = snapshots.length > 1 
        ? Math.round((last.powerRating - first.powerRating) / (snapshots.length - 1))
        : 0;

      res.json({
        snapshots,
        weeklyGrowth,
        summary: {
          totalStats,
          currentPower: last.powerRating,
          avgDailyGrowth,
          daysTracked: snapshots.length,
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get analytics" });
    }
  });

  app.get("/api/player/:id/fatigue", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      const today = getTodayDateString();
      const fatigue = player.fatigue || { date: "", sessions: { strength: 0, agility: 0, sense: 0, vitality: 0 } };
      const sessions = fatigue.date === today ? fatigue.sessions : { strength: 0, agility: 0, sense: 0, vitality: 0 };
      
      const multipliers = {
        strength: getFatigueMultiplier(sessions.strength),
        agility: getFatigueMultiplier(sessions.agility),
        sense: getFatigueMultiplier(sessions.sense),
        vitality: getFatigueMultiplier(sessions.vitality),
      };
      
      res.json({ sessions, multipliers, date: today });
    } catch (error) {
      res.status(500).json({ error: "Failed to get fatigue info" });
    }
  });

  return httpServer;
}
