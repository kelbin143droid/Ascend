import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPlayerSchema, updatePlayerSchema, type Player } from "@shared/schema";
import { z } from "zod";
import { calculateDerivedStats, type DerivedStats } from "./gameLogic/stats";
import { calculateXP } from "./gameLogic/xp";

interface PlayerWithDerived extends Player {
  derived: DerivedStats;
  systemMessage?: string;
}

function attachDerivedStats(player: Player, systemMessage?: string): PlayerWithDerived {
  return {
    ...player,
    derived: calculateDerivedStats(player.stats),
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

  return httpServer;
}
