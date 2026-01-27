import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPlayerSchema, updatePlayerSchema } from "@shared/schema";
import { z } from "zod";

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
      res.json(player);
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
      res.status(201).json(player);
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
      res.json(player);
    } catch (error) {
      res.status(500).json({ error: "Failed to update player" });
    }
  });

  app.post("/api/player/:id/add-stat", async (req, res) => {
    try {
      const statSchema = z.object({ stat: z.enum(["strength", "agility", "sense", "vitality", "intelligence"]) });
      const parsed = statSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid stat" });
      }
      const player = await storage.addStat(req.params.id, parsed.data.stat);
      if (!player) {
        return res.status(404).json({ error: "Player not found or no points available" });
      }
      res.json(player);
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
      const player = await storage.gainExp(req.params.id, parsed.data.amount);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      res.json(player);
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
      res.json(player);
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
      res.json(player);
    } catch (error) {
      res.status(500).json({ error: "Failed to modify mp" });
    }
  });

  return httpServer;
}
