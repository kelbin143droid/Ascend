import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPlayerSchema, updatePlayerSchema, type Player, type StatName, PHASE_STAT_CAPS,
  insertRoleSchema, updateRoleSchema,
  insertWeeklyGoalSchema, updateWeeklyGoalSchema,
  insertTaskSchema, updateTaskSchema, quadrantEnum,
  insertCalendarEventSchema, updateCalendarEventSchema,
  type EffortTier
} from "@shared/schema";
import { z } from "zod";
import { calculateDerivedStats, type DerivedStats } from "./gameLogic/stats";
import { getDisplayStats, getTodayDateString, getFatigueMultiplier, calculateHPUpdate, getVitalityMinutesForDate, VITALITY_GOAL_MINUTES, calculateMPUpdate, getSenseMinutesForDate, SENSE_GOAL_MINUTES } from "./gameLogic/statProgression";
import { processTaskCompletion, applyMinimumViableDay, applyPenalty, updateStamina, getCompletionPercentage, calculateXPRequired, type TaskStatType } from "./gameLogic/xpProgressionSystem";
import { getTotalXPForLevel } from "./gameLogic/levelSystem";
import { checkPhaseEligibility, getStatCapForPhase } from "./gameLogic/phaseConfig";

function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

interface PlayerWithDerived extends Player {
  derived: DerivedStats;
  displayStats: { strength: number; agility: number; sense: number; vitality: number };
  fatigueInfo: { strength: number; agility: number; sense: number; vitality: number };
  phaseStatCap: number;
  systemMessage?: string;
  computedStamina: number;
}

function attachDerivedStats(player: Player, systemMessage?: string): PlayerWithDerived {
  const displayStats = getDisplayStats(player.stats);
  
  const today = getTodayDateString();
  const fatigue = player.fatigue || { date: "", sessions: { strength: 0, agility: 0, sense: 0, vitality: 0 } };
  const fatigueInfo = fatigue.date === today ? fatigue.sessions : { strength: 0, agility: 0, sense: 0, vitality: 0 };
  
  const sxp = player.statXP || { strength: 0, agility: 0, sense: 0, vitality: 0 };
  const computedStamina = updateStamina(sxp.strength, sxp.agility);
  
  return {
    ...player,
    derived: calculateDerivedStats(player.stats),
    displayStats,
    fatigueInfo,
    phaseStatCap: PHASE_STAT_CAPS[player.phase] || 30,
    computedStamina,
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
      
      const player = await storage.gainExp(req.params.id, parsed.data.amount);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      const leveledUp = player.level > currentPlayer.level;
      const message = leveledUp 
        ? `Level up! Now level ${player.level}.`
        : `Gained ${parsed.data.amount} XP`;
      
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

  app.post("/api/player/:id/check-hp", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      const today = getTodayDateString();
      const dailyProgress = player.dailyStatProgress || [];
      const vitalityMinutes = getVitalityMinutesForDate(dailyProgress, today);
      const senseMinutes = getSenseMinutesForDate(dailyProgress, today);
      
      const hpResult = calculateHPUpdate(
        player.hp,
        player.maxHp,
        vitalityMinutes,
        player.lastHpCheckDate || null
      );
      
      const mpResult = calculateMPUpdate(
        player.mp,
        player.maxMp,
        senseMinutes,
        player.lastMpCheckDate || null
      );
      
      const updates: Partial<{ hp: number; lastHpCheckDate: string; mp: number; lastMpCheckDate: string }> = {};
      if (hpResult.changed) {
        updates.hp = hpResult.newHp;
        updates.lastHpCheckDate = today;
      }
      if (mpResult.changed) {
        updates.mp = mpResult.newMp;
        updates.lastMpCheckDate = today;
      }
      
      if (Object.keys(updates).length > 0) {
        const updatedPlayer = await storage.updatePlayer(req.params.id, updates);
        if (!updatedPlayer) {
          return res.status(500).json({ error: "Failed to update HP/MP" });
        }
        res.json({
          ...attachDerivedStats(updatedPlayer),
          hpUpdate: hpResult,
          mpUpdate: mpResult
        });
      } else {
        res.json({
          ...attachDerivedStats(player),
          hpUpdate: hpResult,
          mpUpdate: mpResult,
          vitalityMinutes,
          vitalityGoal: VITALITY_GOAL_MINUTES,
          senseMinutes,
          senseGoal: SENSE_GOAL_MINUTES
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to check HP/MP" });
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

  app.post("/api/player/:id/complete-task", async (req, res) => {
    try {
      const taskSchema = z.object({
        stat: z.enum(["strength", "agility", "sense", "vitality"]),
        completionPercentage: z.number().min(0).max(100),
        effortTier: z.number().min(1).max(5).default(1),
      });
      const parsed = taskSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid task data" });
      }

      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }

      const currentStatXP = player.statXP || { strength: 0, agility: 0, sense: 0, vitality: 0 };
      const result = processTaskCompletion(
        parsed.data.stat as TaskStatType,
        parsed.data.completionPercentage,
        player.totalExp,
        player.level,
        currentStatXP,
        parsed.data.effortTier as EffortTier,
        player.phase
      );

      const updates: Record<string, any> = {
        totalExp: result.newTotalXP,
        statXP: result.newStatXP,
        stamina: result.newStamina,
      };

      if (result.leveledUp) {
        updates.level = result.newLevel;
        updates.exp = result.newTotalXP - getTotalXPForLevel(result.newLevel);
        updates.maxExp = calculateXPRequired(result.newLevel);
      } else {
        updates.exp = result.newTotalXP - getTotalXPForLevel(player.level);
        updates.maxExp = calculateXPRequired(player.level);
      }

      const updatedPlayer = await storage.updatePlayer(req.params.id, updates);
      res.json({
        ...attachDerivedStats(updatedPlayer!, result.message),
        taskResult: result,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to complete task" });
    }
  });

  app.post("/api/player/:id/check-mvd", async (req, res) => {
    try {
      const mvdSchema = z.object({
        tasksCompletedToday: z.array(z.object({
          stat: z.enum(["strength", "agility", "sense", "vitality"]),
          xpEarned: z.number(),
        })),
      });
      const parsed = mvdSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid MVD data" });
      }

      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }

      const today = getTodayDateString();
      if (player.lastMVDCheckDate === today) {
        return res.json({
          ...attachDerivedStats(player),
          mvdResult: { achieved: false, alreadyChecked: true, message: "MVD already checked today" },
        });
      }

      const mvdResult = applyMinimumViableDay(
        parsed.data.tasksCompletedToday as { stat: TaskStatType; xpEarned: number }[],
        player.streak
      );

      const updates: Record<string, any> = {
        streak: mvdResult.newStreak,
        lastMVDCheckDate: today,
      };

      if (mvdResult.achieved) {
        updates.totalExp = player.totalExp + mvdResult.bonusXP;
        updates.consecutiveMissedDays = 0;
      } else {
        const missedDays = (player.consecutiveMissedDays || 0) + 1;
        const currentStatXP = player.statXP || { strength: 0, agility: 0, sense: 0, vitality: 0 };
        const penaltyResult = applyPenalty(player.totalExp, player.level, missedDays, currentStatXP);

        updates.totalExp = penaltyResult.newTotalXP;
        updates.consecutiveMissedDays = missedDays;

        if (penaltyResult.statPenalties.strength > 0 || penaltyResult.statPenalties.vitality > 0) {
          updates.statXP = {
            ...currentStatXP,
            strength: Math.max(0, currentStatXP.strength - penaltyResult.statPenalties.strength),
            vitality: Math.max(0, currentStatXP.vitality - penaltyResult.statPenalties.vitality),
          };
          updates.stamina = updateStamina(
            updates.statXP.strength,
            updates.statXP.agility ?? currentStatXP.agility
          );
        }
      }

      const newTotalXP = updates.totalExp;
      let lvl = 1;
      let xpCheck = newTotalXP;
      let xpForNext = calculateXPRequired(lvl);
      while (xpCheck >= xpForNext) {
        xpCheck -= xpForNext;
        lvl++;
        xpForNext = calculateXPRequired(lvl);
      }
      updates.level = lvl;
      updates.exp = xpCheck;
      updates.maxExp = xpForNext;

      const updatedPlayer = await storage.updatePlayer(req.params.id, updates);
      res.json({
        ...attachDerivedStats(updatedPlayer!),
        mvdResult,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check MVD" });
    }
  });

  app.post("/api/player/:id/check-phase", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }

      const displayStats = getDisplayStats(player.stats);
      const result = checkPhaseEligibility(
        player.phase,
        player.level,
        displayStats,
        player.streak
      );

      if (!result) {
        return res.json({
          ...attachDerivedStats(player),
          phaseCheck: { eligible: false, message: "Maximum phase reached." },
        });
      }

      if (result.eligible && !player.pendingPhaseUnlock) {
        const updatedPlayer = await storage.updatePlayer(req.params.id, {
          pendingPhaseUnlock: { phase: result.nextPhase },
        });
        return res.json({
          ...attachDerivedStats(updatedPlayer!),
          phaseCheck: result,
        });
      }

      res.json({
        ...attachDerivedStats(player),
        phaseCheck: result,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check phase" });
    }
  });

  app.post("/api/player/:id/confirm-phase-unlock", async (req, res) => {
    try {
      const player = await storage.confirmPhaseUnlock(req.params.id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      res.json(attachDerivedStats(player, `Welcome to Phase ${player.phase}!`));
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm phase unlock" });
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

  app.get("/api/roles/:userId", async (req, res) => {
    try {
      const roles = await storage.getRoles(req.params.userId);
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: "Failed to get roles" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const parsed = insertRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const role = await storage.createRole(parsed.data);
      res.status(201).json(role);
    } catch (error) {
      res.status(500).json({ error: "Failed to create role" });
    }
  });

  app.patch("/api/roles/:id", async (req, res) => {
    try {
      const parsed = updateRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const role = await storage.updateRole(req.params.id, parsed.data);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  app.delete("/api/roles/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteRole(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete role" });
    }
  });

  app.get("/api/weekly-goals/:userId", async (req, res) => {
    try {
      const weekStartDate = req.query.week_start_date as string | undefined;
      const goals = await storage.getWeeklyGoals(req.params.userId, weekStartDate);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to get weekly goals" });
    }
  });

  app.post("/api/weekly-goals", async (req, res) => {
    try {
      const parsed = insertWeeklyGoalSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const goal = await storage.createWeeklyGoal(parsed.data);
      res.status(201).json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to create weekly goal" });
    }
  });

  app.patch("/api/weekly-goals/:id", async (req, res) => {
    try {
      const parsed = updateWeeklyGoalSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const goal = await storage.updateWeeklyGoal(req.params.id, parsed.data);
      if (!goal) {
        return res.status(404).json({ error: "Weekly goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to update weekly goal" });
    }
  });

  app.delete("/api/weekly-goals/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWeeklyGoal(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Weekly goal not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete weekly goal" });
    }
  });

  app.get("/api/tasks/:userId", async (req, res) => {
    try {
      const weekStartDate = req.query.week_start_date as string | undefined;
      const tasks = await storage.getTasks(req.params.userId, weekStartDate);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to get tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const parsed = insertTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      
      const task = await storage.createTask(parsed.data);
      res.status(201).json(task);
    } catch (error) {
      console.error("Failed to create task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const existingTask = await storage.getTask(req.params.id);
      if (!existingTask) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      if (existingTask.quadrant === "Q2" && !req.body.confirmStrategic) {
        return res.status(400).json({ 
          error: "Q2 tasks require confirmation. Set confirmStrategic: true to modify." 
        });
      }
      
      const { confirmStrategic, ...updateData } = req.body;
      const parsed = updateTaskSchema.safeParse(updateData);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      
      const task = await storage.updateTask(req.params.id, parsed.data);
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const existingTask = await storage.getTask(req.params.id);
      if (!existingTask) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      if (existingTask.quadrant === "Q2" && !req.body.confirmStrategic) {
        return res.status(400).json({ 
          error: "Q2 tasks require confirmation. Set confirmStrategic: true to delete." 
        });
      }
      
      const deleted = await storage.deleteTask(req.params.id);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  app.get("/api/weekly-analytics/:userId", async (req, res) => {
    try {
      const weekStartDate = (req.query.week_start_date as string) || getWeekStartDate();
      
      const tasks = await storage.getTasks(req.params.userId, weekStartDate);
      const roles = await storage.getRoles(req.params.userId);
      
      const totalTimePerRole: Record<string, number> = {};
      const totalTimePerQuadrant: Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
      const completedPerRole: Record<string, { completed: number; total: number }> = {};
      
      for (const task of tasks) {
        const duration = (new Date(task.endTime).getTime() - new Date(task.startTime).getTime()) / (1000 * 60);
        
        totalTimePerRole[task.roleId] = (totalTimePerRole[task.roleId] || 0) + duration;
        totalTimePerQuadrant[task.quadrant] = (totalTimePerQuadrant[task.quadrant] || 0) + duration;
        
        if (!completedPerRole[task.roleId]) {
          completedPerRole[task.roleId] = { completed: 0, total: 0 };
        }
        completedPerRole[task.roleId].total++;
        if (task.completed) {
          completedPerRole[task.roleId].completed++;
        }
      }
      
      const totalTime = Object.values(totalTimePerQuadrant).reduce((a, b) => a + b, 0);
      const q2Percentage = totalTime > 0 ? (totalTimePerQuadrant.Q2 / totalTime) * 100 : 0;
      
      const completionRatePerRole: Record<string, number> = {};
      for (const [roleId, data] of Object.entries(completedPerRole)) {
        completionRatePerRole[roleId] = data.total > 0 ? (data.completed / data.total) * 100 : 0;
      }
      
      const roleNameMap: Record<string, string> = {};
      for (const role of roles) {
        roleNameMap[role.id] = role.name;
      }
      
      const tasksWithGoal = tasks.filter(t => t.weeklyGoalId != null).length;
      const goalLinkedPercentage = tasks.length > 0 
        ? Math.round((tasksWithGoal / tasks.length) * 100 * 10) / 10 
        : 100;
      
      const today = new Date().toISOString().split('T')[0];
      const focusTrial = await storage.getActiveTrial(req.params.userId, "focus");
      
      if (focusTrial && focusTrial.lastEvaluatedDate !== today) {
        const player = await storage.getPlayer(req.params.userId);
        
        if (q2Percentage >= 60) {
          const newProgress = focusTrial.progressDays + 1;
          if (newProgress >= 7) {
            await storage.updateTrial(focusTrial.id, {
              progressDays: 7,
              status: "completed",
              lastEvaluatedDate: today
            });
            if (player) {
              await storage.gainExp(player.id, 500);
            }
          } else {
            await storage.updateTrial(focusTrial.id, {
              progressDays: newProgress,
              lastEvaluatedDate: today
            });
          }
        } else {
          await storage.updateTrial(focusTrial.id, {
            progressDays: 0,
            lastEvaluatedDate: today
          });
        }
      }
      
      res.json({
        totalTimePerRole,
        totalTimePerQuadrant,
        q2Percentage: Math.round(q2Percentage * 10) / 10,
        completionRatePerRole,
        roleNameMap,
        weekStartDate,
        taskCount: tasks.length,
        goalLinkedPercentage
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get weekly analytics" });
    }
  });

  app.get("/api/trials/:userId", async (req, res) => {
    try {
      const trials = await storage.getTrials(req.params.userId);
      res.json(trials);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trials" });
    }
  });

  app.post("/api/trials/start", async (req, res) => {
    try {
      const { userId, trialType } = req.body;
      
      if (!userId || !trialType) {
        return res.status(400).json({ error: "userId and trialType are required" });
      }
      
      const existingTrial = await storage.getActiveTrial(userId, trialType);
      if (existingTrial) {
        return res.status(400).json({ error: "An active trial of this type already exists" });
      }
      
      const today = new Date().toISOString().split('T')[0];
      const trial = await storage.createTrial({
        userId,
        trialType,
        startDate: today,
        progressDays: 0,
        status: "active",
        lastEvaluatedDate: null
      });
      
      res.json(trial);
    } catch (error) {
      res.status(500).json({ error: "Failed to start trial" });
    }
  });

  app.get("/api/calendar-events/:userId", async (req, res) => {
    try {
      const month = req.query.month as string | undefined;
      const events = await storage.getCalendarEvents(req.params.userId, month);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to get calendar events" });
    }
  });

  app.post("/api/calendar-events", async (req, res) => {
    try {
      const validated = insertCalendarEventSchema.parse(req.body);
      const event = await storage.createCalendarEvent(validated);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid calendar event data" });
    }
  });

  app.patch("/api/calendar-events/:id", async (req, res) => {
    try {
      const validated = updateCalendarEventSchema.parse(req.body);
      const event = await storage.updateCalendarEvent(req.params.id, validated);
      if (!event) return res.status(404).json({ error: "Event not found" });
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/calendar-events/:id", async (req, res) => {
    try {
      const success = await storage.deleteCalendarEvent(req.params.id);
      if (!success) return res.status(404).json({ error: "Event not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  return httpServer;
}
