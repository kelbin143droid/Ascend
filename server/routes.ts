import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { habitCompletions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { 
  insertPlayerSchema, updatePlayerSchema, type Player, type StatName, PHASE_STAT_CAPS,
  insertRoleSchema, updateRoleSchema,
  insertWeeklyGoalSchema, updateWeeklyGoalSchema,
  insertTaskSchema, updateTaskSchema, quadrantEnum,
  insertCalendarEventSchema, updateCalendarEventSchema,
  insertHabitSchema, updateHabitSchema,
  insertBadHabitSchema, updateBadHabitSchema,
  type EffortTier
} from "@shared/schema";
import { suggestHabitStacks } from "./gameLogic/habitProgression";
import { calculateHabitXP, checkDailyBonus, checkWeeklyBonus, checkBadgeEligibility } from "./gameLogic/rewardEngine";
import { generateCoachMessages, getDurationSuggestion, getMotivationNudge, handleCoachChat, getHomeInsight } from "./gameLogic/aiCoach";
import { extractActionEvents, detectRhythmWindows, generateRhythmInsights, suggestFocusInFreeWindows, getCoachRhythmComment, type RhythmWindow, type RhythmInsight } from "./gameLogic/rhythmEngine";
import { generatePlacementSuggestions, getCoachPlacementComment, type PlacementSuggestion, type FreeTimeWindow } from "./gameLogic/habitPlacement";
import { calculateMomentumUpdate, getMomentumTier, shouldTriggerRecovery } from "./gameLogic/momentumEngine";
import { scaleDifficulty, calculateTrainingDuration, getDifficultyLabel } from "./gameLogic/difficultyScaler";
import { checkPhaseEligibility, getStatCapForPhase, getPhaseVisualConfig, PHASE_PLANNING_UNLOCK, PHASE_TRIALS_UNLOCK } from "./gameLogic/phaseEngine";
import { calculateStabilityScore, checkRegression, buildUpdatedStabilityData, getStabilityTier, detectDisruption, getSystemState, getStabilityStateInfo, getRecoveryCoachMessage } from "./gameLogic/stabilityEngine";
import { getReturnProtocol, calculateDaysSinceLastActivity, getReturnCoachComment, getSimplifiedHabitLimit, getSimplifiedFocusDuration } from "./gameLogic/returnProtocol";
import { generateIdentityProfile, getIdentityCoachComment, getIdentityAnchorForChat } from "./gameLogic/identityEngine";
import { getTasksForToday, completeTask as taskEngineComplete, getPhaseAdjustedDuration } from "./gameLogic/taskEngine";
import { getEnvironmentVisuals, getAvatarAura, getTaskCompletionVisuals } from "./gameLogic/visualEngine";
import { checkNotificationEligibility, buildNotification, type PreviousState } from "./gameLogic/notificationEngine";
import { PHASE_NAMES, PHASE_DESCRIPTIONS } from "@shared/schema";
import { z } from "zod";
import { calculateDerivedStats, type DerivedStats } from "./gameLogic/stats";
import { getDisplayStats, getTodayDateString, getFatigueMultiplier, calculateHPUpdate, getVitalityMinutesForDate, VITALITY_GOAL_MINUTES, calculateMPUpdate, getSenseMinutesForDate, SENSE_GOAL_MINUTES } from "./gameLogic/statProgression";
import { processTaskCompletion, applyMinimumViableDay, applyPenalty, updateStamina, getCompletionPercentage, type TaskStatType } from "./gameLogic/xpProgressionSystem";
import { getStatFromLevel as getStatLevel, getRankFromLevel, getXPForNextLevel as calculateXPRequired, getTotalXPForLevel } from "./gameLogic/levelSystem";
import { getFlowState, updateFlowAfterCompletion } from "./gameLogic/flowEngine";

function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

interface StatLevelInfo {
  level: number;
  currentXP: number;
  xpForNext: number;
}

interface PlayerWithDerived extends Player {
  derived: DerivedStats;
  displayStats: { strength: number; agility: number; sense: number; vitality: number };
  fatigueInfo: { strength: number; agility: number; sense: number; vitality: number };
  phaseStatCap: number;
  systemMessage?: string;
  computedStamina: number;
  statLevels: {
    strength: StatLevelInfo;
    agility: StatLevelInfo;
    sense: StatLevelInfo;
    vitality: StatLevelInfo;
  };
}

function attachDerivedStats(player: Player, systemMessage?: string): PlayerWithDerived {
  const displayStats = getDisplayStats(player.stats);
  
  const today = getTodayDateString();
  const fatigue = player.fatigue || { date: "", sessions: { strength: 0, agility: 0, sense: 0, vitality: 0 } };
  const fatigueInfo = fatigue.date === today ? fatigue.sessions : { strength: 0, agility: 0, sense: 0, vitality: 0 };
  
  const sxp = player.statXP || { strength: 0, agility: 0, sense: 0, vitality: 0 };
  const computedStamina = updateStamina(sxp.strength, sxp.agility);

  const statLevels = {
    strength: getStatLevel(sxp.strength),
    agility: getStatLevel(sxp.agility),
    sense: getStatLevel(sxp.sense),
    vitality: getStatLevel(sxp.vitality),
  };
  const rank = getRankFromLevel(player.level);
  
  return {
    ...player,
    rank,
    derived: calculateDerivedStats(player.stats),
    displayStats,
    fatigueInfo,
    phaseStatCap: PHASE_STAT_CAPS[player.phase] || 30,
    computedStamina,
    statLevels,
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
      console.error("[GET /api/player/:id] error:", error);
      res.status(500).json({ error: "Failed to get player", detail: (error as Error)?.message });
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
      console.error("[POST /api/player] error:", error);
      res.status(500).json({ error: "Failed to create player", detail: (error as Error)?.message });
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

  app.post("/api/player/:id/onboarding-complete", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });
      // Idempotent: if already completed, just return
      if (player.onboardingCompleted === 1) {
        return res.json(attachDerivedStats(player, "Already completed"));
      }
      // Mark onboarding complete — preserve all XP earned naturally during the 5-day onboarding
      // Player stays at Level 1 with their earned XP (e.g. 25 XP from 5 days × 5 XP)
      const final = await storage.updatePlayer(req.params.id, {
        onboardingCompleted: 1,
      });
      res.json(attachDerivedStats(final ?? player, "Onboarding complete. The system is yours now."));
    } catch (error) {
      res.status(500).json({ error: "Failed to complete onboarding level-up" });
    }
  });

  app.post("/api/player/:id/dev/fix-onboarding-xp", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });
      // Force player back to Level 1 with 25 XP (5 days × 5 XP = the correct onboarding total)
      const ONBOARDING_CORRECT_XP = 25;
      const updated = await storage.updatePlayer(req.params.id, {
        level: 1,
        exp: ONBOARDING_CORRECT_XP,
        maxExp: 100,
        totalExp: ONBOARDING_CORRECT_XP,
      });
      res.json({ success: true, level: 1, exp: ONBOARDING_CORRECT_XP, totalExp: ONBOARDING_CORRECT_XP });
    } catch (err) {
      res.status(500).json({ error: "Failed to fix XP" });
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

  app.post("/api/player/:id/complete-guided-session", async (req, res) => {
    try {
      const schema = z.object({
        sessionId: z.string(),
        stat: z.enum(["strength", "agility", "sense", "vitality"]),
        durationMinutes: z.number().min(1),
        category: z.enum(["strength", "agility", "meditation", "vitality"]).optional(),
        xpMultiplier: z.number().min(1).max(2).optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid guided session data" });
      }

      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const { getBaseXPForCategory } = await import("./gameLogic/levelSystem");
      const { processSessionCompletion, ensureTrainingScaling, getXPMultiplier } = await import("./gameLogic/trainingScaling");

      const statToCat: Record<string, "strength" | "agility" | "meditation" | "vitality"> = {
        strength: "strength", agility: "agility", sense: "meditation", vitality: "vitality",
      };
      const category = parsed.data.category || statToCat[parsed.data.stat] || "strength";
      const scaling = ensureTrainingScaling(player.trainingScaling);
      const tierMultiplier = getXPMultiplier(scaling[category].tier);

      // Anti-grind: check how many times this same session was already done today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayCompletions = await storage.getHabitCompletions(req.params.id, startOfToday);
      const sessionHabitId = `guided_${parsed.data.sessionId}`;
      const priorSessionsToday = todayCompletions.filter(c => c.habitId === sessionHabitId).length;
      const antiGrindMultiplier = priorSessionsToday === 0 ? 1.0 : priorSessionsToday === 1 ? 0.5 : 0.25;

      // Daily XP cap (50–55 XP from guided sessions)
      const DAILY_XP_CAP = 55;
      const totalGuidedXPToday = todayCompletions
        .filter(c => c.habitId.startsWith("guided_"))
        .reduce((sum, c) => sum + (c.xpEarned || 0), 0);
      const remainingCap = Math.max(0, DAILY_XP_CAP - totalGuidedXPToday);

      const baseXP = getBaseXPForCategory(category);
      const rawXP = Math.round(baseXP * tierMultiplier * antiGrindMultiplier);
      let guidedXP = Math.min(rawXP, remainingCap);

      // Onboarding sessions skip stat XP and award a fixed amount on first completion.
      // quick-reflection is Day 3's paired second session — it's in onboarding but awards 0 XP
      // (hydration-check already gives Day 3's 5 XP) and does not increment streak.
      const ONBOARDING_SESSION_IDS = new Set(["calm-breathing", "light-movement", "hydration-check", "quick-reflection", "focus-block", "plan-tomorrow"]);
      const ONBOARDING_CHAINED_IDS = new Set(["quick-reflection"]); // paired sessions: no XP, no streak
      const isOnboardingSession = ONBOARDING_SESSION_IDS.has(parsed.data.sessionId);
      let isFirstOnboardingCompletion = false;
      if (isOnboardingSession) {
        const allPlayerCompletions = await storage.getHabitCompletions(req.params.id);
        isFirstOnboardingCompletion = !allPlayerCompletions.some(c => c.habitId === sessionHabitId);
        if (isFirstOnboardingCompletion) {
          guidedXP = ONBOARDING_CHAINED_IDS.has(parsed.data.sessionId) ? 0 : 5;
        }
      }

      const updatedScaling = processSessionCompletion(scaling, category, player.phase || 1);

      await storage.createHabitCompletion({
        habitId: sessionHabitId,
        userId: req.params.id,
        durationMinutes: parsed.data.durationMinutes,
        xpEarned: guidedXP,
      });

      const stabilityData = player.stability || {
        score: 50, habitCompletionPct: 0, sleepConsistency: 50,
        energyCompliance: 50, emotionalStability: 50,
        taskTimingAdherence: 50, consecutiveLowDays: 0,
        softRegressionActive: false,
      };
      const newScore = Math.min(100, stabilityData.score + 2);
      const updatedStability = { ...stabilityData, score: newScore };

      const playerUpdates: Record<string, any> = {
        stability: updatedStability,
        trainingScaling: updatedScaling,
      };

      // During active onboarding (completing an onboarding session), skip stat XP entirely.
      // Stat progression starts only after the 5-day onboarding journey is complete.
      if (!isOnboardingSession) {
        const currentStatXP = player.statXP || { strength: 0, agility: 0, sense: 0, vitality: 0 };
        const statKey = parsed.data.stat as keyof typeof currentStatXP;
        const newStatXP = {
          ...currentStatXP,
          [statKey]: (currentStatXP[statKey] || 0) + guidedXP,
        };
        const derivedStats = {
          strength: getStatLevel(newStatXP.strength).level,
          agility: getStatLevel(newStatXP.agility).level,
          sense: getStatLevel(newStatXP.sense).level,
          vitality: getStatLevel(newStatXP.vitality).level,
        };
        playerUpdates.statXP = newStatXP;
        playerUpdates.stats = derivedStats;
      }

      // Increment streak for first-time onboarding session completions (not for chained/paired sessions)
      if (isFirstOnboardingCompletion && !ONBOARDING_CHAINED_IDS.has(parsed.data.sessionId)) {
        playerUpdates.streak = (player.streak ?? 0) + 1;
      }
      await storage.updatePlayer(req.params.id, playerUpdates);

      const updatedPlayer = await storage.gainExp(req.params.id, guidedXP);

      res.json({
        success: true,
        xpEarned: guidedXP,
        stabilityScore: newScore,
        trainingScaling: updatedScaling,
        tierMultiplier,
        antiGrindMultiplier,
        dailyCapReached: remainingCap === 0,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to complete guided session" });
    }
  });

  app.post("/api/player/:id/daily-flow-bonus", async (req, res) => {
    try {
      const schema = z.object({
        bonusXP: z.number().min(1).max(20),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid bonus data" });
      }
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const updatedPlayer = await storage.gainExp(req.params.id, parsed.data.bonusXP);
      res.json({ success: true, bonusXP: parsed.data.bonusXP });
    } catch (error) {
      res.status(500).json({ error: "Failed to award bonus" });
    }
  });

  app.get("/api/player/:id/training-scaling", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const { ensureTrainingScaling, checkAndProcessMissedDays } = await import("./gameLogic/trainingScaling");
      let scaling = ensureTrainingScaling(player.trainingScaling);
      const processed = checkAndProcessMissedDays(scaling);

      if (JSON.stringify(processed) !== JSON.stringify(scaling)) {
        await storage.updatePlayer(req.params.id, { trainingScaling: processed });
        scaling = processed;
      }

      res.json({ trainingScaling: scaling });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch training scaling" });
    }
  });

  app.post("/api/player/:id/record-activity", async (req, res) => {
    try {
      const schema = z.object({
        activityId: z.string(),
        activityName: z.string(),
        category: z.string(),
        stat: z.string(),
        durationMinutes: z.number().min(1),
        xpEarned: z.number().min(0),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid activity data" });
      }
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const now = new Date();
      const startHour = now.getHours();
      const startMinute = now.getMinutes();
      const endMinutes = startHour * 60 + startMinute + parsed.data.durationMinutes;
      const endHour = Math.floor(endMinutes / 60) % 24;
      const endMinute = endMinutes % 60;

      const statColors: Record<string, string> = {
        strength: "#ef4444",
        agility: "#22c55e",
        sense: "#3b82f6",
        vitality: "#f59e0b",
      };

      const scheduleEntry = {
        id: `activity_${parsed.data.activityId}_${Date.now()}`,
        name: parsed.data.activityName,
        description: `${parsed.data.category} training · +${parsed.data.xpEarned} XP`,
        date: now.toISOString().split("T")[0],
        startHour,
        startMinute,
        endHour,
        endMinute,
        color: statColors[parsed.data.stat] || "#8b5cf6",
        isSystemTask: true,
      };

      // Do not write activity completions to player.schedule —
      // they accumulate without a natural cleanup path and clutter the Sectograph.
      // The Sectograph is for planned schedule blocks, not a completion log.

      res.json({ success: true, entry: scheduleEntry });
    } catch (error) {
      res.status(500).json({ error: "Failed to record activity" });
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

      const derivedStats = {
        strength: getStatLevel(result.newStatXP.strength).level,
        agility: getStatLevel(result.newStatXP.agility).level,
        sense: getStatLevel(result.newStatXP.sense).level,
        vitality: getStatLevel(result.newStatXP.vitality).level,
      };

      const updates: Record<string, any> = {
        totalExp: result.newTotalXP,
        statXP: result.newStatXP,
        stamina: result.newStamina,
        stats: derivedStats,
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

      const habits = await storage.getHabits(req.params.id);
      const windowDays = 45;
      const windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - windowDays);
      const completions = await storage.getHabitCompletions(req.params.id, windowStart);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentCompletions = await storage.getHabitCompletions(req.params.id, sevenDaysAgo);
      const stabilityCalc = calculateStabilityScore(player, habits, recentCompletions);
      const regression = checkRegression(player, stabilityCalc.score);
      const previousRate = player.stability?.habitCompletionPct ?? 50;
      const disruption = detectDisruption(player, recentCompletions, previousRate);

      if (regression.type === "hard") {
        const updatedStability = buildUpdatedStabilityData(stabilityCalc, regression, disruption, player.stability ?? undefined);
        const regressed = await storage.updatePlayer(req.params.id, {
          stability: updatedStability,
          phase: regression.newPhase,
          phaseHistory: [
            ...(player.phaseHistory || []),
            { phase: regression.newPhase, date: new Date().toLocaleDateString("en-CA"), direction: "down" as const },
          ],
        });
        return res.json({
          ...attachDerivedStats(regressed!),
          phaseCheck: { eligible: false, message: regression.message },
          regression: { type: "hard", message: regression.message, newPhase: regression.newPhase },
        });
      }

      const updatedStability = buildUpdatedStabilityData(stabilityCalc, regression, disruption, player.stability ?? undefined);
      await storage.updatePlayer(req.params.id, { stability: updatedStability });

      const result = checkPhaseEligibility(player, habits, completions);

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
        regression: regression.type !== "none" ? { type: regression.type, message: regression.message } : undefined,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check phase" });
    }
  });

  app.post("/api/player/:id/allocate-stat", async (req, res) => {
    try {
      const schema = z.object({ stat: z.enum(["strength", "agility", "sense", "vitality"]), amount: z.number().int().min(1).max(50) });
      const { stat, amount } = schema.parse(req.body);
      const player = await storage.allocateStat(req.params.id, stat as any, amount);
      if (!player) return res.status(404).json({ error: "Player not found" });
      res.json(attachDerivedStats(player));
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to allocate stat" });
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

      if (parsed.data.name === "General" && parsed.data.userId) {
        const existing = await storage.getOrCreateDefaultRole(parsed.data.userId);
        return res.status(201).json(existing);
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

  // Player-scoped habit routes (used by HabitsPage)
  app.get("/api/player/:id/habits", async (req, res) => {
    try {
      const habits = await storage.getHabits(req.params.id);
      res.json(habits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habits" });
    }
  });

  app.post("/api/player/:id/habits", async (req, res) => {
    try {
      const parsed = insertHabitSchema.safeParse({ ...req.body, userId: req.params.id });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const habit = await storage.createHabit(parsed.data);

      // Auto-add to Sectograph timeline if a scheduled time was given
      if (habit.scheduledHour !== null && habit.scheduledHour !== undefined) {
        const player = await storage.getPlayer(req.params.id);
        if (player) {
          const startH = habit.scheduledHour;
          const startM = habit.scheduledMinute ?? 0;
          const totalMins = startH * 60 + startM + (habit.baseDurationMinutes ?? 5);
          const endH = Math.floor(totalMins / 60) % 24;
          const endM = totalMins % 60;
          const statColors: Record<string, string> = {
            strength: "#ef4444", agility: "#22c55e", sense: "#3b82f6", vitality: "#f59e0b",
          };
          const habitBlock = {
            id: `habit_${habit.id}`,
            name: habit.name,
            startHour: startH,
            startMinute: startM,
            endHour: endH,
            endMinute: endM,
            color: statColors[habit.stat] || "#8b5cf6",
            segment: "work",
          };
          // Remove old entry for this habit then append (dedup)
          const existing = ((player.schedule ?? []) as any[]).filter((b: any) => b.id !== `habit_${habit.id}`);
          await storage.updatePlayer(req.params.id, { schedule: [...existing, habitBlock] });
        }
      }

      res.status(201).json(habit);
    } catch (error) {
      res.status(500).json({ error: "Failed to create habit" });
    }
  });

  app.get("/api/habits/:userId", async (req, res) => {
    try {
      const userHabits = await storage.getHabits(req.params.userId);
      res.json(userHabits);
    } catch (error) {
      res.status(500).json({ error: "Failed to get habits" });
    }
  });

  app.post("/api/habits", async (req, res) => {
    try {
      const parsed = insertHabitSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const habit = await storage.createHabit(parsed.data);
      res.status(201).json(habit);
    } catch (error) {
      res.status(500).json({ error: "Failed to create habit" });
    }
  });

  app.patch("/api/habits/:id", async (req, res) => {
    try {
      const parsed = updateHabitSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const habit = await storage.updateHabit(req.params.id, parsed.data);
      if (!habit) return res.status(404).json({ error: "Habit not found" });
      res.json(habit);
    } catch (error) {
      res.status(500).json({ error: "Failed to update habit" });
    }
  });

  app.delete("/api/habits/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteHabit(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Habit not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete habit" });
    }
  });

  app.get("/api/player/:id/bad-habits", async (req, res) => {
    try {
      const bhs = await storage.getBadHabits(req.params.id);
      res.json(bhs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bad habits" });
    }
  });

  app.post("/api/player/:id/bad-habits", async (req, res) => {
    try {
      const parsed = insertBadHabitSchema.safeParse({ ...req.body, userId: req.params.id });
      if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });
      const bh = await storage.createBadHabit(parsed.data);
      res.json(bh);
    } catch (error) {
      res.status(500).json({ error: "Failed to create bad habit" });
    }
  });

  app.patch("/api/bad-habits/:id", async (req, res) => {
    try {
      const parsed = updateBadHabitSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });
      const bh = await storage.updateBadHabit(req.params.id, parsed.data);
      if (!bh) return res.status(404).json({ error: "Bad habit not found" });
      res.json(bh);
    } catch (error) {
      res.status(500).json({ error: "Failed to update bad habit" });
    }
  });

  app.delete("/api/bad-habits/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBadHabit(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Bad habit not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete bad habit" });
    }
  });

  app.post("/api/bad-habits/:id/avoided", async (req, res) => {
    try {
      const bh = await storage.markBadHabitAvoided(req.params.id);
      if (!bh) return res.status(404).json({ error: "Bad habit not found" });
      res.json(bh);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark bad habit avoided" });
    }
  });

  app.post("/api/habits/:id/complete", async (req, res) => {
    try {
      const habit = await storage.getHabit(req.params.id);
      if (!habit) return res.status(404).json({ error: "Habit not found" });

      const player = await storage.getPlayer(habit.userId);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const today = getTodayDateString();
      const derived = calculateDerivedStats(player.stats);

      const momentumResult = calculateMomentumUpdate(habit, today, true, derived.streakForgiveness);

      const newStreak = momentumResult.newStreak;
      const newMomentum = momentumResult.momentum;
      const newLongestStreak = Math.max(habit.longestStreak, newStreak);
      const newTotalCompletions = habit.totalCompletions + 1;

      const recentWindow = new Date();
      recentWindow.setDate(recentWindow.getDate() - 14);
      const recentCompletionsForHabit = (await storage.getHabitCompletions(habit.userId, recentWindow))
        .filter(c => c.habitId === habit.id);
      const consecutiveCompletions = recentCompletionsForHabit.length;

      const scaled = scaleDifficulty(
        { ...habit, momentum: newMomentum, currentStreak: newStreak, totalCompletions: newTotalCompletions },
        consecutiveCompletions,
        player.phase,
        player.stability?.score
      );

      const xpEarned = calculateHabitXP(
        { ...habit, currentStreak: newStreak, difficultyLevel: scaled.difficultyLevel },
        newMomentum,
        newStreak
      );

      await storage.updateHabit(habit.id, {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        totalCompletions: newTotalCompletions,
        lastCompletedDate: today,
        difficultyLevel: scaled.difficultyLevel,
        currentDurationMinutes: scaled.duration,
        momentum: newMomentum,
      });

      await storage.createHabitCompletion({
        habitId: habit.id,
        userId: habit.userId,
        durationMinutes: habit.currentDurationMinutes,
        xpEarned,
      });

      const { getStatFromLevel } = await import("./gameLogic/levelSystem");
      const currentStatXP = player.statXP || { strength: 0, agility: 0, sense: 0, vitality: 0 };
      const statKey = habit.stat as keyof typeof currentStatXP;
      const newStatXP = {
        ...currentStatXP,
        [statKey]: (currentStatXP[statKey] || 0) + xpEarned,
      };
      const derivedStats = {
        strength: getStatFromLevel(newStatXP.strength).level,
        agility: getStatFromLevel(newStatXP.agility).level,
        sense: getStatFromLevel(newStatXP.sense).level,
        vitality: getStatFromLevel(newStatXP.vitality).level,
      };
      await storage.updatePlayer(habit.userId, { statXP: newStatXP, stats: derivedStats });

      const updatedPlayer = await storage.gainExp(habit.userId, xpEarned);

      const allHabits = await storage.getHabits(habit.userId);
      const existingBadges = await storage.getBadges(habit.userId);
      const totalAllCompletions = allHabits.reduce((sum, h) => sum + h.totalCompletions, 0);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentCompletions = await storage.getHabitCompletions(habit.userId, sevenDaysAgo);

      const completionsByDay: number[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString("en-CA");
        completionsByDay.push(
          recentCompletions.filter(c => new Date(c.completedAt!).toLocaleDateString("en-CA") === dateStr).length
        );
      }
      const weeklyBonus = checkWeeklyBonus(completionsByDay, allHabits.filter(h => h.active).length);

      const todayCompletions = recentCompletions.filter(
        c => new Date(c.completedAt!).toLocaleDateString("en-CA") === today
      );
      const dailyBonus = checkDailyBonus(
        new Set(todayCompletions.map(c => c.habitId)).size,
        allHabits.filter(h => h.active).length
      );

      let bonusXP = 0;
      if (dailyBonus.earned) bonusXP += dailyBonus.bonusXP;
      if (weeklyBonus.earned) bonusXP += weeklyBonus.bonusXP;
      if (bonusXP > 0) {
        await storage.gainExp(habit.userId, bonusXP);
      }

      const updatedHabit = await storage.getHabit(habit.id);
      const newBadges = checkBadgeEligibility(
        updatedHabit!,
        allHabits,
        existingBadges,
        totalAllCompletions + 1,
        weeklyBonus.earned
      );

      const awardedBadges = [];
      for (const badge of newBadges) {
        const created = await storage.createBadge({
          userId: habit.userId,
          badgeType: badge.type,
          name: badge.name,
          description: badge.description,
        });
        awardedBadges.push(created);
      }

      const finalPlayer = await storage.getPlayer(habit.userId);

      const previousStabilityScore = player.stability?.score ?? 50;
      let stabilityResult = { score: previousStabilityScore, tier: getStabilityTier(previousStabilityScore) };
      if (finalPlayer) {
        const allCompletionsForStability = await storage.getHabitCompletions(habit.userId, sevenDaysAgo);
        const stabCalc = calculateStabilityScore(finalPlayer, allHabits, allCompletionsForStability);
        const reg = checkRegression(finalPlayer, stabCalc.score);
        const stabData = buildUpdatedStabilityData(stabCalc, reg);
        await storage.updatePlayer(habit.userId, { stability: stabData });
        stabilityResult = { score: stabCalc.score, tier: getStabilityTier(stabCalc.score) };
      }

      const visuals = getTaskCompletionVisuals(habit.stat, xpEarned, awardedBadges.length);

      const flowCompletions = await storage.getHabitCompletions(habit.userId, sevenDaysAgo);
      const flowState = getFlowState(finalPlayer || player, allHabits, flowCompletions);
      const updatedFlow = updateFlowAfterCompletion(flowState, 
        new Set(flowCompletions.filter(c => new Date(c.completedAt!).toLocaleDateString("en-CA") === today).map(c => c.habitId)).size / Math.max(1, allHabits.filter(h => h.active).length)
      );

      res.json({
        habit: updatedHabit,
        xpEarned,
        bonusXP,
        dailyBonus,
        weeklyBonus,
        newBadges: awardedBadges,
        streakInfo: {
          current: newStreak,
          longest: newLongestStreak,
          momentum: newMomentum,
          graceDayUsed: momentumResult.graceDayUsed,
          recoveryMode: momentumResult.recoveryMode,
          xpMultiplier: momentumResult.xpMultiplier,
        },
        difficultyInfo: {
          level: scaled.difficultyLevel,
          label: getDifficultyLabel(scaled.difficultyLevel),
          duration: scaled.duration,
          reason: scaled.reason,
          isAutoAdjusted: scaled.isAutoAdjusted,
        },
        visuals,
        stability: {
          score: stabilityResult.score,
          previousScore: previousStabilityScore,
          tier: stabilityResult.tier,
        },
        flow: updatedFlow,
        player: finalPlayer ? attachDerivedStats(finalPlayer) : null,
      });
    } catch (error) {
      console.error("Failed to complete habit:", error);
      res.status(500).json({ error: "Failed to complete habit" });
    }
  });

  app.post("/api/habits/:id/skip", async (req, res) => {
    try {
      const habit = await storage.getHabit(req.params.id);
      if (!habit) return res.status(404).json({ error: "Habit not found" });

      const player = await storage.getPlayer(habit.userId);
      const today = getTodayDateString();
      const momentumResult = calculateMomentumUpdate(habit, today, false);

      const scaled = scaleDifficulty(
        { ...habit, momentum: momentumResult.momentum },
        0,
        player?.phase || 1
      );

      const updated = await storage.updateHabit(habit.id, {
        momentum: momentumResult.momentum,
        currentDurationMinutes: scaled.duration,
        difficultyLevel: scaled.difficultyLevel,
      });

      res.json({
        habit: updated,
        message: "Habit skipped. Difficulty adjusted to help you get back on track.",
        momentum: momentumResult.momentum,
        recoveryMode: momentumResult.recoveryMode,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to skip habit" });
    }
  });

  app.get("/api/habits/:userId/stacks", async (req, res) => {
    try {
      const userHabits = await storage.getHabits(req.params.userId);
      const suggestions = suggestHabitStacks(userHabits);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get habit stack suggestions" });
    }
  });

  app.get("/api/badges/:userId", async (req, res) => {
    try {
      const userBadges = await storage.getBadges(req.params.userId);
      res.json(userBadges);
    } catch (error) {
      res.status(500).json({ error: "Failed to get badges" });
    }
  });

  app.get("/api/player/:id/coach", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const userHabits = await storage.getHabits(req.params.id);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentCompletions = await storage.getHabitCompletions(req.params.id, sevenDaysAgo);

      const allCompletionsForAnchors = await storage.getHabitCompletions(req.params.id);
      const anchors = allCompletionsForAnchors
        .filter(c => c.habitId.startsWith("guided_") && c.completedAt)
        .map(c => ({
          sessionId: c.habitId.replace("guided_", ""),
          completedAt: c.completedAt!.toISOString(),
          hour: new Date(c.completedAt!).getHours(),
          minute: new Date(c.completedAt!).getMinutes(),
          durationMinutes: c.durationMinutes,
        }));

      const messages = generateCoachMessages(player, userHabits, recentCompletions, anchors);

      const avgMomentum = userHabits.length > 0
        ? userHabits.reduce((sum, h) => sum + h.momentum, 0) / userHabits.length
        : 0;
      const nudge = getMotivationNudge(avgMomentum, player.streak, player.consecutiveMissedDays);

      const habitSuggestions = userHabits.map(h => ({
        habitId: h.id,
        habitName: h.name,
        ...getDurationSuggestion(h, player.phase),
        momentum: h.momentum,
        momentumTier: getMomentumTier(h.momentum),
      }));

      res.json({ messages, nudge, habitSuggestions });
    } catch (error) {
      res.status(500).json({ error: "Failed to get coach data" });
    }
  });

  app.post("/api/player/:id/coach/chat", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const { message } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      const userHabits = await storage.getHabits(req.params.id);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentCompletions = await storage.getHabitCompletions(req.params.id, sevenDaysAgo);

      const allCompletions = await storage.getHabitCompletions(req.params.id);
      const distinctDays = new Set(
        allCompletions.filter(c => c.completedAt).map(c => new Date(c.completedAt!).toLocaleDateString("en-CA"))
      );
      const todayStr = new Date().toLocaleDateString("en-CA");
      const completedToday = distinctDays.has(todayStr);
      const daysCompleted = distinctDays.size;
      // Stay on the current day if the user has already completed today's session.
      // Only advance on the next calendar day.
      const onboardingDay = (completedToday && daysCompleted <= 4)
        ? Math.max(daysCompleted, 1)
        : Math.min(daysCompleted + 1, 5);
      // isOnboardingComplete is ONLY based on completing 5 distinct days.
      // player.onboardingCompleted tracks the initial welcome intro, not the 5-day journey.
      const isOnboardingComplete = onboardingDay >= 5;
      const streak = player.streak ?? 0;

      let languageStage: 1 | 2 | 3 | 4;
      if (!isOnboardingComplete && onboardingDay <= 5) languageStage = 1;
      else if (distinctDays.size < 14 || streak < 7) languageStage = 2;
      else if (distinctDays.size >= 28 && streak >= 14) languageStage = 4;
      else languageStage = 3;

      const anchorsForChat = allCompletions
        .filter(c => c.habitId.startsWith("guided_") && c.completedAt)
        .map(c => ({
          sessionId: c.habitId.replace("guided_", ""),
          completedAt: c.completedAt!.toISOString(),
          hour: new Date(c.completedAt!).getHours(),
          minute: new Date(c.completedAt!).getMinutes(),
          durationMinutes: c.durationMinutes,
        }));

      const response = handleCoachChat(message, player, userHabits, recentCompletions, languageStage, anchorsForChat);

      const events = extractActionEvents(allCompletions);
      const windows = detectRhythmWindows(events);
      const rhythmComment = getCoachRhythmComment(windows, new Date().getHours());
      if (rhythmComment && response.response) {
        response.response = response.response + " " + rhythmComment;
      }

      const stabilityCalcChat = calculateStabilityScore(player, userHabits, recentCompletions);
      const previousRateChat = player.stability?.habitCompletionPct ?? 50;
      const disruptionChat = detectDisruption(player, recentCompletions, previousRateChat);
      const systemStateChat = getSystemState(stabilityCalcChat, player, disruptionChat);

      const chatEvents = extractActionEvents(allCompletions);
      const chatRhythmWindows = detectRhythmWindows(chatEvents);
      const identityProfileChat = generateIdentityProfile(player, allCompletions, chatRhythmWindows);

      const identityComment = getIdentityCoachComment(identityProfileChat);
      const identityAnchor = getIdentityAnchorForChat(identityProfileChat);
      if (identityAnchor && response.response) {
        response.response = response.response + " " + identityAnchor;
      } else if (identityComment && response.response) {
        response.response = response.response + " " + identityComment;
      }

      const returnProtocolChat = getReturnProtocol(player, allCompletions);
      if (returnProtocolChat.active && response.response) {
        const returnComment = getReturnCoachComment(returnProtocolChat.tier, returnProtocolChat.daysSinceLastActivity);
        if (returnComment) {
          response.response = returnComment + " " + response.response;
        }
      } else if (disruptionChat.detected && response.response) {
        const recoveryMsg = getRecoveryCoachMessage(disruptionChat, systemStateChat.state);
        response.response = recoveryMsg + " " + response.response;
      }

      if ((systemStateChat.coachToneModifier === "gentle" || returnProtocolChat.tier === "long") && response.response) {
        response.response = response.response
          .replace(/You must/g, "You could")
          .replace(/You need to/g, "You might try")
          .replace(/You should/g, "You could")
          .replace(/You missed/gi, "Rhythm paused")
          .replace(/You failed/gi, "Things shifted")
          .replace(/Your streak ended/gi, "Returning restores momentum");
      }

      response.reply = response.response;
      res.json({ ...response, coachTone: systemStateChat.coachToneModifier, stabilityState: systemStateChat.state, returnTier: returnProtocolChat.tier });
    } catch (error) {
      res.status(500).json({ error: "Failed to process coach chat" });
    }
  });

  app.get("/api/player/:id/training-config", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const stat = req.query.stat as string;
      if (!stat || !["strength", "agility", "sense", "vitality"].includes(stat)) {
        return res.status(400).json({ error: "Valid stat required" });
      }

      const habits = await storage.getHabits(req.params.id);
      const statHabits = habits.filter(h => h.stat === stat);
      const avgMomentum = statHabits.length > 0
        ? statHabits.reduce((sum, h) => sum + h.momentum, 0) / statHabits.length
        : 0.3;

      const recentWindow = new Date();
      recentWindow.setDate(recentWindow.getDate() - 14);
      const completions = await storage.getHabitCompletions(req.params.id, recentWindow);
      const statCompletions = completions.filter(c => {
        const habit = habits.find(h => h.id === c.habitId);
        return habit?.stat === stat;
      });

      const config = calculateTrainingDuration(player.phase, avgMomentum, statCompletions.length, stat);

      res.json({
        ...config,
        momentum: avgMomentum,
        momentumTier: getMomentumTier(avgMomentum),
        phase: player.phase,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get training config" });
    }
  });

  app.get("/api/player/:id/stability", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const habits = await storage.getHabits(req.params.id);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const completions = await storage.getHabitCompletions(req.params.id, sevenDaysAgo);

      const calc = calculateStabilityScore(player, habits, completions);
      const regression = checkRegression(player, calc.score);
      const tier = getStabilityTier(calc.score);
      const phaseVisual = getPhaseVisualConfig(player.phase);

      res.json({
        ...calc,
        tier,
        regression: {
          type: regression.type,
          message: regression.message,
        },
        phase: {
          current: player.phase,
          name: PHASE_NAMES[player.phase],
          description: PHASE_DESCRIPTIONS[player.phase],
          visual: phaseVisual,
          nextPhase: player.phase < 5 ? {
            name: PHASE_NAMES[player.phase + 1],
            description: PHASE_DESCRIPTIONS[player.phase + 1],
          } : null,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get stability data" });
    }
  });

  app.post("/api/player/:id/stability/update", async (req, res) => {
    try {
      const stabilityUpdateSchema = z.object({
        sleepConsistency: z.number().min(0).max(100).optional(),
        energyCompliance: z.number().min(0).max(100).optional(),
        emotionalStability: z.number().min(0).max(100).optional(),
      });
      const parsed = stabilityUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const { sleepConsistency, energyCompliance, emotionalStability } = parsed.data;

      const habits = await storage.getHabits(req.params.id);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const completions = await storage.getHabitCompletions(req.params.id, sevenDaysAgo);

      const calc = calculateStabilityScore(player, habits, completions, {
        sleepConsistency: sleepConsistency ?? player.stability?.sleepConsistency,
        energyCompliance: energyCompliance ?? player.stability?.energyCompliance,
        emotionalStability: emotionalStability ?? player.stability?.emotionalStability,
      });

      const regression = checkRegression(player, calc.score);
      const updatedStability = buildUpdatedStabilityData(calc, regression);

      let updatedPlayer: Player;
      if (regression.type === "hard") {
        updatedPlayer = (await storage.updatePlayer(req.params.id, {
          stability: updatedStability,
          phase: regression.newPhase,
          phaseHistory: [
            ...(player.phaseHistory || []),
            { phase: regression.newPhase, date: new Date().toLocaleDateString("en-CA"), direction: "down" as const },
          ],
        }))!;
      } else {
        updatedPlayer = (await storage.updatePlayer(req.params.id, {
          stability: updatedStability,
        }))!;
      }

      res.json({
        ...attachDerivedStats(updatedPlayer),
        stabilityUpdate: {
          score: calc.score,
          trend: calc.trend,
          regression: {
            type: regression.type,
            message: regression.message,
          },
          tier: getStabilityTier(calc.score),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update stability" });
    }
  });

  app.get("/api/player/:id/phase-info", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const visual = getPhaseVisualConfig(player.phase);
      const stabilityScore = player.stability?.score ?? 50;

      const habits = await storage.getHabits(req.params.id);
      const windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - 45);
      const completions = await storage.getHabitCompletions(req.params.id, windowStart);

      const phaseCheck = player.phase < 5 ? checkPhaseEligibility(player, habits, completions) : null;

      res.json({
        current: {
          phase: player.phase,
          name: PHASE_NAMES[player.phase],
          description: PHASE_DESCRIPTIONS[player.phase],
          visual,
        },
        next: phaseCheck ? {
          phase: phaseCheck.nextPhase,
          name: phaseCheck.nextPhaseName,
          requirements: phaseCheck.requirements,
          progress: phaseCheck.progress,
          missing: phaseCheck.missing,
          eligible: phaseCheck.eligible,
        } : null,
        stability: {
          score: stabilityScore,
          tier: getStabilityTier(stabilityScore),
          softRegressionActive: player.stability?.softRegressionActive ?? false,
          consecutiveLowDays: player.stability?.consecutiveLowDays ?? 0,
        },
        history: player.phaseHistory || [],
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get phase info" });
    }
  });

  app.get("/api/player/:id/home", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const habits = await storage.getHabits(req.params.id);
      const allCompletions = await storage.getHabitCompletions(req.params.id);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentCompletions = allCompletions.filter(
        c => c.completedAt && new Date(c.completedAt) >= sevenDaysAgo
      );

      const stabilityScore = player.stability?.score ?? 50;
      const stabilityCalcHome = calculateStabilityScore(player, habits, recentCompletions);
      const regressionHome = checkRegression(player, stabilityCalcHome.score);
      const previousRateHome = player.stability?.habitCompletionPct ?? 50;
      const disruptionHome = detectDisruption(player, recentCompletions, previousRateHome);
      const systemState = getSystemState(stabilityCalcHome, player, disruptionHome);
      const stabilityStateInfo = getStabilityStateInfo(systemState.state);
      const stabilityLabel = stabilityStateInfo.label;

      const updatedStabilityHome = buildUpdatedStabilityData(stabilityCalcHome, regressionHome, disruptionHome, player.stability ?? undefined);
      await storage.updatePlayer(req.params.id, { stability: updatedStabilityHome });

      const flow = getFlowState(player, habits, recentCompletions);

      const avgMomentum = habits.length > 0
        ? habits.reduce((sum, h) => sum + (h.momentum ?? 0), 0) / habits.length
        : 0;
      const growthScore = Math.round(
        (stabilityScore * 0.4) + (flow.value * 0.35) + (avgMomentum * 100 * 0.25)
      );
      const clampedGrowth = Math.min(100, Math.max(0, growthScore));
      let growthState: string;
      if (clampedGrowth >= 81) growthState = "Thriving rhythm";
      else if (clampedGrowth >= 61) growthState = "Strong momentum";
      else if (clampedGrowth >= 41) growthState = "Growth strengthening";
      else if (clampedGrowth >= 21) growthState = "Growth forming";
      else growthState = "Beginning";

      const today = new Date().toLocaleDateString("en-CA");
      const completedIds = new Set(
        allCompletions
          .filter(c => c.completedAt && new Date(c.completedAt).toLocaleDateString("en-CA") === today)
          .map(c => c.habitId)
      );

      // Which specific guided sessions were completed today (session IDs without the guided_ prefix)
      const completedGuidedSessionsToday = allCompletions
        .filter(c =>
          c.completedAt &&
          new Date(c.completedAt).toLocaleDateString("en-CA") === today &&
          c.habitId.startsWith("guided_") &&
          !c.habitId.startsWith("guided_day_sim_")
        )
        .map(c => c.habitId.replace("guided_", ""));
      const activeHabits = habits.filter(h => h.active);
      const remaining = activeHabits.filter(h => !completedIds.has(h.id));

      const sorted = remaining.sort((a, b) => b.momentum - a.momentum);
      const nextAction = sorted.length > 0 ? sorted[0] : null;

      let todaysFocus: string;
      if (activeHabits.length === 0) {
        todaysFocus = "Start your first habit to activate Flow.";
      } else if (remaining.length === 0) {
        todaysFocus = "All sessions complete. Recovery time.";
      } else {
        todaysFocus = `${nextAction!.name} · ${nextAction!.currentDurationMinutes}m`;
      }

      const distinctCompletionDays = new Set(
        allCompletions
          .filter(c => c.completedAt)
          .map(c => new Date(c.completedAt!).toLocaleDateString("en-CA"))
      );
      const todayDateStr = new Date().toLocaleDateString("en-CA");

      // Track which specific onboarding days have been permanently completed
      // (based on their dedicated guided session habitId, not calendar days)
      const ONBOARDING_HABIT_TO_DAY: Record<string, number> = {
        "guided_calm-breathing": 1,
        "guided_light-movement": 2,
        "guided_hydration-check": 3,
        "guided_focus-block": 4,
        "guided_plan-tomorrow": 5,
      };
      const completedDays: number[] = [];
      for (const [habitId, day] of Object.entries(ONBOARDING_HABIT_TO_DAY)) {
        if (allCompletions.some(c => c.habitId === habitId)) {
          completedDays.push(day);
        }
      }
      completedDays.sort((a, b) => a - b);

      // onboardingDay = next uncompleted day, clamped to totalDays
      const TOTAL_ONBOARDING_DAYS = 5;
      const onboardingDay = Math.min(completedDays.length + 1, TOTAL_ONBOARDING_DAYS);
      // isOnboardingComplete only after all 5 specific sessions are done
      const isOnboardingComplete = completedDays.length >= TOTAL_ONBOARDING_DAYS;
      // onboardingDayCompleted = has the current onboarding day been completed?
      const onboardingDayCompleted = completedDays.includes(onboardingDay);

      // Minimum XP guarantee: if Days 1-5 are complete, totalExp must be at least 21
      const ONBOARDING_MIN_XP = 21;
      if (isOnboardingComplete && (player.totalExp ?? 0) < ONBOARDING_MIN_XP) {
        const deficit = ONBOARDING_MIN_XP - (player.totalExp ?? 0);
        await storage.gainExp(req.params.id, deficit);
        // Re-fetch player to get updated XP values
        const refreshed = await storage.getPlayer(req.params.id);
        if (refreshed) Object.assign(player, refreshed);
      }

      const hasCompletedHabitToday = completedIds.size > 0;
      const sortedByDate = [...allCompletions]
        .filter(c => c.completedAt)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
      const lastCompletionDate = sortedByDate.length > 0
        ? new Date(sortedByDate[0].completedAt!).toLocaleDateString("en-CA")
        : null;

      let lastCompletionTime: string | null = null;
      const yesterdayCompletions = sortedByDate.filter(c => {
        const d = new Date(c.completedAt!).toLocaleDateString("en-CA");
        const yd = new Date();
        yd.setDate(yd.getDate() - 1);
        return d === yd.toLocaleDateString("en-CA");
      });
      if (yesterdayCompletions.length > 0) {
        const lastYesterday = new Date(yesterdayCompletions[0].completedAt!);
        lastCompletionTime = lastYesterday.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      }

      let notification: { type: string; message: string } | null = null;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString("en-CA");
      const hadCompletionYesterday = distinctCompletionDays.has(yesterdayStr);

      if (onboardingDay >= 5) {
        notification = { type: "milestone", message: "Foundation complete. The system is yours now." };
      } else if (onboardingDay >= 3 && distinctCompletionDays.size >= 3) {
        notification = { type: "milestone", message: "Three days of action. A pattern is forming." };
      }

      if (!notification && lastCompletionDate && lastCompletionDate !== today && !hadCompletionYesterday && distinctCompletionDays.size > 0) {
        notification = { type: "recovery", message: "Progress resumes anytime. Today is a fresh start." };
      }

      // Removed "A small action still counts today" notification per user request

      const completionHours = allCompletions
        .filter(c => c.completedAt)
        .map(c => new Date(c.completedAt!).getHours());
      let suggestedReminderTime: string | null = null;
      if (completionHours.length >= 2) {
        const hourCounts: Record<number, number> = {};
        completionHours.forEach(h => {
          const bucket = Math.floor(h / 2) * 2;
          hourCounts[bucket] = (hourCounts[bucket] || 0) + 1;
        });
        const best = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
        if (best && parseInt(best[1] as any) >= 2) {
          const bucketHour = parseInt(best[0]);
          if (bucketHour < 12) suggestedReminderTime = "morning";
          else if (bucketHour < 17) suggestedReminderTime = "afternoon";
          else suggestedReminderTime = "evening";
        }
      }

      const totalCompletionDays = distinctCompletionDays.size;
      const streak = player.streak ?? 0;

      let userLanguageStage: number;
      if (!isOnboardingComplete && onboardingDay <= 5) {
        userLanguageStage = 1;
      } else if (totalCompletionDays < 14 || streak < 7) {
        userLanguageStage = 2;
      } else if (totalCompletionDays >= 28 && streak >= 14) {
        userLanguageStage = 4;
      } else {
        userLanguageStage = 3;
      }

      const guidedAnchors = allCompletions
        .filter(c => c.habitId.startsWith("guided_") && c.completedAt)
        .map(c => ({
          sessionId: c.habitId.replace("guided_", ""),
          completedAt: c.completedAt!.toISOString(),
          hour: new Date(c.completedAt!).getHours(),
          minute: new Date(c.completedAt!).getMinutes(),
          durationMinutes: c.durationMinutes,
        }));

      const homeInsight = getHomeInsight(player, habits, recentCompletions, userLanguageStage as 1 | 2 | 3 | 4, guidedAnchors);
      const insight = homeInsight.message;

      let recoveryMessage: string | null = null;
      if (disruptionHome.detected) {
        recoveryMessage = getRecoveryCoachMessage(disruptionHome, systemState.state);
      }

      const returnProtocol = getReturnProtocol(player, allCompletions);

      if (returnProtocol.active && returnProtocol.simplifyMode) {
        systemState.habitLimit = getSimplifiedHabitLimit(systemState.habitLimit, returnProtocol.simplifyMode);
      }

      const homeEvents = extractActionEvents(allCompletions);
      const homeRhythmWindows = detectRhythmWindows(homeEvents);
      const identityProfile = generateIdentityProfile(player, allCompletions, homeRhythmWindows);

      res.json({
        phase: {
          number: player.phase,
          name: PHASE_NAMES[player.phase] || "Unknown",
        },
        stability: {
          score: stabilityCalcHome.score,
          label: stabilityLabel,
          state: systemState.state,
          stateInfo: stabilityStateInfo,
          recoveryModeActive: systemState.recoveryModeActive,
          disruptionDetected: systemState.disruptionDetected,
          habitLimit: systemState.habitLimit,
          unlockedFeatures: systemState.unlockedFeatures,
          coachTone: systemState.coachToneModifier,
          expansionReady: systemState.expansionReady,
          consecutiveActiveDays: stabilityCalcHome.components.consecutiveActiveDays,
          trend: stabilityCalcHome.trend,
        },
        flow,
        growthState,
        momentum: Math.round(avgMomentum * 100),
        insight,
        todaysFocus,
        nextAction: nextAction ? {
          habitId: nextAction.id,
          name: nextAction.name,
          stat: nextAction.stat,
          durationMinutes: nextAction.currentDurationMinutes,
        } : null,
        completedToday: completedIds.size,
        totalActive: activeHabits.length,
        onboardingDay,
        completedDays,
        onboardingDayCompleted,
        hasCompletedHabitToday,
        completedGuidedSessionsToday,
        lastCompletionDate,
        notification,
        suggestedReminderTime,
        lastCompletionTime,
        isOnboardingComplete,
        streak,
        userLanguageStage,
        recoveryMessage,
        returnProtocol: returnProtocol.active ? returnProtocol : null,
        identity: {
          stage: identityProfile.stage,
          stageLabel: identityProfile.stageLabel,
          stageDescription: identityProfile.stageDescription,
          reflection: identityProfile.reflection,
          reflectionAnchor: identityProfile.reflectionAnchor,
          metrics: {
            totalActiveDays: identityProfile.metrics.totalActiveDays,
            longestStreak: identityProfile.metrics.longestStreak,
            weeksEngaged: identityProfile.metrics.weeksEngaged,
            recoveryCount: identityProfile.metrics.recoveryCount,
          },
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get home data" });
    }
  });

  app.get("/api/player/:id/identity", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const allCompletions = await storage.getHabitCompletions(req.params.id);
      const events = extractActionEvents(allCompletions);
      const rhythmWindows = detectRhythmWindows(events);
      const profile = generateIdentityProfile(player, allCompletions, rhythmWindows);

      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to get identity profile" });
    }
  });

  app.get("/api/player/:id/tasks-today", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const habits = await storage.getHabits(req.params.id);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const completions = await storage.getHabitCompletions(req.params.id, sevenDaysAgo);

      const tasks = getTasksForToday(player, habits, completions);
      res.json({ tasks, phase: player.phase, stabilityScore: player.stability?.score ?? 50 });
    } catch (error) {
      res.status(500).json({ error: "Failed to get tasks for today" });
    }
  });

  app.get("/api/player/:id/visuals", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const habits = await storage.getHabits(req.params.id);
      const avgMomentum = habits.length > 0
        ? habits.reduce((sum, h) => sum + h.momentum, 0) / habits.length
        : 0;

      const stabilityScore = player.stability?.score ?? 50;
      const environment = getEnvironmentVisuals(player.phase, stabilityScore);
      const aura = getAvatarAura(player.phase, stabilityScore, avgMomentum);

      res.json({ environment, aura });
    } catch (error) {
      res.status(500).json({ error: "Failed to get visuals" });
    }
  });

  app.get("/api/player/:id/stability/trend", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const days = Math.min(30, Math.max(1, parseInt(req.query.days as string) || 7));
      const habits = await storage.getHabits(req.params.id);
      const windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - days);
      const completions = await storage.getHabitCompletions(req.params.id, windowStart);

      const trend: Array<{ date: string; score: number; habitCompletionPct: number }> = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString("en-CA");
        const dayCompletions = completions.filter(c => {
          const cd = c.completedAt ? new Date(c.completedAt).toLocaleDateString("en-CA") : null;
          return cd === dateStr;
        });
        const activeHabits = habits.filter(h => h.active);
        const pct = activeHabits.length > 0
          ? Math.min(100, (dayCompletions.length / activeHabits.length) * 100)
          : 50;
        const dayScore = Math.round(
          pct * 0.35 +
          (player.stability?.sleepConsistency ?? 50) * 0.20 +
          (player.stability?.energyCompliance ?? 50) * 0.15 +
          (player.stability?.emotionalStability ?? 50) * 0.15 +
          (player.stability?.taskTimingAdherence ?? 50) * 0.15
        );
        trend.push({ date: dateStr, score: Math.max(0, Math.min(100, dayScore)), habitCompletionPct: Math.round(pct) });
      }

      const currentScore = player.stability?.score ?? 50;
      const avgScore = trend.length > 0 ? Math.round(trend.reduce((s, t) => s + t.score, 0) / trend.length) : currentScore;
      const direction: "improving" | "stable" | "declining" =
        currentScore > avgScore + 3 ? "improving" : currentScore < avgScore - 3 ? "declining" : "stable";

      res.json({
        trend,
        current: currentScore,
        average: avgScore,
        direction,
        tier: getStabilityTier(currentScore),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get stability trend" });
    }
  });

  app.get("/api/player/:id/notifications", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const habits = await storage.getHabits(req.params.id);
      const today = new Date().toLocaleDateString("en-CA");
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const completions = await storage.getHabitCompletions(req.params.id, sevenDaysAgo);

      const todayCompletions = completions.filter(c => {
        const cd = c.completedAt ? new Date(c.completedAt).toLocaleDateString("en-CA") : null;
        return cd === today;
      });

      const previousState: PreviousState = {
        phase: player.phase,
        stabilityScore: player.stability?.score ?? 50,
        level: player.level,
        streak: player.streak,
        completedHabitsToday: todayCompletions.length,
        totalActiveHabits: habits.filter(h => h.active).length,
      };

      const eligible = checkNotificationEligibility(player, previousState);
      const notifications = eligible.map(n => buildNotification(n.type, n.data));

      res.json({ notifications });
    } catch (error) {
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  app.post("/api/player/:id/complete-task-unified", async (req, res) => {
    try {
      const schema = z.object({
        habitId: z.string(),
        durationMinutes: z.number().min(1).max(120).optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const habit = await storage.getHabit(parsed.data.habitId);
      if (!habit) return res.status(404).json({ error: "Habit not found" });

      const allHabits = await storage.getHabits(req.params.id);
      const badges = await storage.getBadges(req.params.id);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const completions = await storage.getHabitCompletions(req.params.id, sevenDaysAgo);

      const previousState: PreviousState = {
        phase: player.phase,
        stabilityScore: player.stability?.score ?? 50,
        level: player.level,
        streak: player.streak,
        completedHabitsToday: completions.filter(c => {
          const cd = c.completedAt ? new Date(c.completedAt).toLocaleDateString("en-CA") : null;
          return cd === new Date().toLocaleDateString("en-CA");
        }).length,
        totalActiveHabits: allHabits.filter(h => h.active).length,
      };

      const duration = parsed.data.durationMinutes || habit.currentDurationMinutes;
      const taskResult = taskEngineComplete(player, habit, duration, allHabits, badges, completions);

      await storage.createHabitCompletion({
        habitId: habit.id,
        userId: req.params.id,
        durationMinutes: duration,
        xpEarned: taskResult.xpEarned,
      });

      await storage.updateHabit(habit.id, {
        currentStreak: taskResult.streakUpdate.newStreak,
        longestStreak: Math.max(habit.longestStreak, taskResult.streakUpdate.newStreak),
        totalCompletions: habit.totalCompletions + 1,
        lastCompletedDate: new Date().toLocaleDateString("en-CA"),
        momentum: taskResult.newMomentum.momentum,
        currentDurationMinutes: getPhaseAdjustedDuration(
          { ...habit, currentStreak: taskResult.streakUpdate.newStreak, momentum: taskResult.newMomentum.momentum },
          player.phase,
          player.stability?.score ?? 50
        ).duration,
      });

      for (const badge of taskResult.badges) {
        await storage.createBadge({
          userId: req.params.id,
          badgeType: badge.type,
          name: badge.name,
          description: badge.description,
        });
      }

      const updatedPlayer = await storage.gainExp(req.params.id, taskResult.xpEarned);
      if (!updatedPlayer) return res.status(500).json({ error: "Failed to update player" });

      const recentCompletions = await storage.getHabitCompletions(req.params.id, sevenDaysAgo);
      const stabilityCalc = calculateStabilityScore(updatedPlayer, allHabits, recentCompletions);
      const regression = checkRegression(updatedPlayer, stabilityCalc.score);
      const stabilityData = buildUpdatedStabilityData(stabilityCalc, regression);
      await storage.updatePlayer(req.params.id, { stability: stabilityData });

      const visuals = getTaskCompletionVisuals(habit.stat, taskResult.xpEarned, taskResult.badges.length);
      const notificationChecks = checkNotificationEligibility(updatedPlayer, previousState);
      const notifications = notificationChecks.map(n => buildNotification(n.type, n.data));

      const updatedHabit = await storage.getHabit(habit.id);

      const newBadges = [];
      for (const badge of taskResult.badges) {
        const allBadgesNow = await storage.getBadges(req.params.id);
        const found = allBadgesNow.find(b => b.name === badge.name);
        if (found) newBadges.push(found);
      }

      res.json({
        ...attachDerivedStats(updatedPlayer),
        habit: updatedHabit || habit,
        xpEarned: taskResult.xpEarned,
        bonusXP: 0,
        dailyBonus: 0,
        weeklyBonus: 0,
        newBadges,
        streakInfo: {
          current: taskResult.streakUpdate.newStreak,
          longest: Math.max(habit.longestStreak, taskResult.streakUpdate.newStreak),
        },
        taskResult: {
          xpEarned: taskResult.xpEarned,
          statGain: taskResult.statGain,
          streakUpdate: taskResult.streakUpdate,
          recoveryMode: taskResult.recoveryMode,
          badges: taskResult.badges,
          momentum: {
            value: taskResult.newMomentum.momentum,
            tier: getMomentumTier(taskResult.newMomentum.momentum),
          },
        },
        visuals,
        stability: {
          score: stabilityCalc.score,
          previousScore: previousState.stabilityScore,
          trend: stabilityCalc.trend,
          tier: getStabilityTier(stabilityCalc.score),
        },
        notifications,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to complete task" });
    }
  });

  app.get("/api/player/:id/habit-analytics", async (req, res) => {
    try {
      const userHabits = await storage.getHabits(req.params.id);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const completions = await storage.getHabitCompletions(req.params.id, thirtyDaysAgo);
      const userBadges = await storage.getBadges(req.params.id);

      const habitStats = userHabits.map(h => {
        const habitCompletions = completions.filter(c => c.habitId === h.id);
        const last7 = habitCompletions.filter(c => {
          const d = new Date(c.completedAt!);
          const sevenAgo = new Date();
          sevenAgo.setDate(sevenAgo.getDate() - 7);
          return d >= sevenAgo;
        }).length;
        const last14 = habitCompletions.filter(c => {
          const d = new Date(c.completedAt!);
          const fourteenAgo = new Date();
          fourteenAgo.setDate(fourteenAgo.getDate() - 14);
          return d >= fourteenAgo;
        }).length;
        const last30 = habitCompletions.length;

        let trend: "improving" | "declining" | "stable" = "stable";
        const recentRate = last7 / 7;
        const olderRate = (last14 - last7) / 7;
        if (recentRate > olderRate + 0.1) trend = "improving";
        else if (recentRate < olderRate - 0.1) trend = "declining";

        return {
          habitId: h.id,
          name: h.name,
          stat: h.stat,
          currentStreak: h.currentStreak,
          longestStreak: h.longestStreak,
          totalCompletions: h.totalCompletions,
          momentum: h.momentum,
          currentDuration: h.currentDurationMinutes,
          baseDuration: h.baseDurationMinutes,
          completionsLast7: last7,
          completionsLast14: last14,
          completionsLast30: last30,
          trend,
        };
      });

      res.json({ habitStats, badges: userBadges, totalHabits: userHabits.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to get habit analytics" });
    }
  });

  app.get("/api/player/:id/rhythm", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const allCompletions = await storage.getHabitCompletions(req.params.id);
      const events = extractActionEvents(allCompletions);
      const windows = detectRhythmWindows(events);
      const insights = generateRhythmInsights(windows);

      res.json({ windows, insights, totalEvents: events.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to detect rhythm" });
    }
  });

  app.get("/api/player/:id/habit-placement-suggestions", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const stat = req.query.stat as string | undefined;
      const duration = parseInt(req.query.duration as string) || 3;

      const allCompletions = await storage.getHabitCompletions(req.params.id);
      const events = extractActionEvents(allCompletions);
      const rhythmWindows = detectRhythmWindows(events);

      const schedule = [
        { startHour: 22, endHour: 6 },
        { startHour: 9, endHour: 12 },
        { startHour: 13, endHour: 17 },
      ];

      const freeWindows: FreeTimeWindow[] = [];
      const occupied = schedule.map(s => ({
        start: s.startHour * 60,
        end: s.endHour * 60 + (s.endHour < s.startHour ? 1440 : 0),
      }));

      const checkpoints = [0, ...schedule.flatMap(s => [s.startHour * 60, s.endHour * 60]), 1440]
        .sort((a, b) => a - b)
        .filter((v, i, arr) => arr.indexOf(v) === i);

      for (let i = 0; i < checkpoints.length - 1; i++) {
        const gapStart = checkpoints[i];
        const gapEnd = checkpoints[i + 1];
        const gapDuration = gapEnd - gapStart;

        if (gapDuration < 30) continue;

        const isOccupied = occupied.some(o => {
          const occStart = o.start;
          const occEnd = o.end > 1440 ? o.end - 1440 : o.end;
          if (o.end > 1440) {
            return gapStart < occEnd || gapEnd > occStart;
          }
          return gapStart >= occStart && gapEnd <= occEnd;
        });

        if (!isOccupied) {
          freeWindows.push({
            startHour: Math.floor(gapStart / 60) % 24,
            startMinute: gapStart % 60,
            endHour: Math.floor(gapEnd / 60) % 24,
            endMinute: gapEnd % 60,
            durationMinutes: gapDuration,
          });
        }
      }

      const suggestions = generatePlacementSuggestions(rhythmWindows, freeWindows, stat, duration);
      const coachComment = getCoachPlacementComment(suggestions);

      res.json({ suggestions, coachComment });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate placement suggestions" });
    }
  });

  app.get("/api/player/:id/behavioral-anchors", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const clearedAt: number | null = (player.stability as any)?.anchorsClearedAt ?? null;

      const allCompletions = await storage.getHabitCompletions(req.params.id);
      const guidedCompletions = allCompletions
        .filter(c => c.habitId.startsWith("guided_") && c.completedAt)
        .filter(c => !clearedAt || new Date(c.completedAt!).getTime() > clearedAt)
        .map(c => ({
          sessionId: c.habitId.replace("guided_", ""),
          completedAt: c.completedAt!.toISOString(),
          hour: new Date(c.completedAt!).getHours(),
          minute: new Date(c.completedAt!).getMinutes(),
          durationMinutes: c.durationMinutes,
        }))
        .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

      res.json({ anchors: guidedCompletions });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch behavioral anchors" });
    }
  });

  app.delete("/api/player/:id/behavioral-anchors", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });
      const stabilityData = (player.stability as any) ?? {};
      await storage.updatePlayer(req.params.id, {
        stability: { ...stabilityData, anchorsClearedAt: Date.now() },
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear anchors" });
    }
  });

  app.post("/api/player/:id/start-focus-session", async (req, res) => {
    try {
      const schema = z.object({
        durationMinutes: z.number().min(1).max(120),
        label: z.string().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid focus session data" });

      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const now = new Date();
      const sessionId = `focus_${Date.now()}`;

      await storage.createHabitCompletion({
        habitId: sessionId,
        userId: req.params.id,
        durationMinutes: parsed.data.durationMinutes,
        xpEarned: Math.ceil(parsed.data.durationMinutes / 3),
      });

      const xpGain = Math.ceil(parsed.data.durationMinutes / 3);
      await storage.updatePlayer(req.params.id, {
        exp: (player.exp || 0) + xpGain,
        totalExp: (player.totalExp || 0) + xpGain,
      });

      res.json({
        success: true,
        sessionId,
        startHour: now.getHours(),
        startMinute: now.getMinutes(),
        durationMinutes: parsed.data.durationMinutes,
        xpEarned: xpGain,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start focus session" });
    }
  });

  app.post("/api/player/:id/dev/simulate-day", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const { days = 1, completeHabits = true } = req.body;
      const dayCount = Math.min(Math.max(1, days), 90);

      const habits = await storage.getHabits(req.params.id);
      const activeHabits = habits.filter(h => h.active);
      const completionsCreated: string[] = [];

      // Count existing distinct active days to offset new simulated dates correctly
      const existingCompletions = await storage.getHabitCompletions(req.params.id);
      const existingDates = existingCompletions
        .filter(c => c.completedAt)
        .map(c => new Date(c.completedAt!).toLocaleDateString("en-CA"))
        .sort();

      // Place each simulated day at a unique past date by counting backwards
      // from today. existingDistinctCount ensures no collision with existing data.
      // d=0 is the oldest new day, d=dayCount-1 is the newest (closest to today).
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      const existingDistinctCount = new Set(existingDates).size;

      const getSimulatedDate = (d: number) => {
        const date = new Date(todayMidnight);
        // Newest new day lands at (existingDistinctCount + 1) days ago,
        // older days go further back — guaranteeing no overlap with existing dates.
        const daysBack = existingDistinctCount + (dayCount - d);
        date.setDate(date.getDate() - daysBack);
        date.setHours(9 + (d % 8), 30, 0, 0);
        return date;
      };

      // Determine how many onboarding days are already done (to know which guided sessions to simulate)
      const ONBOARDING_DAY_SESSION: Record<number, string> = {
        1: "guided_calm-breathing",
        2: "guided_light-movement",
        3: "guided_hydration-check",
        4: "guided_focus-block",
        5: "guided_plan-tomorrow",
      };
      const existingOnboardingDone = Object.values(ONBOARDING_DAY_SESSION)
        .filter(habitId => existingCompletions.some(c => c.habitId === habitId)).length;

      for (let d = 0; d < dayCount; d++) {
        const simulatedDate = getSimulatedDate(d);

        // For each simulated day, create the corresponding onboarding guided session (if still in onboarding)
        const onboardingDayBeingSimulated = existingOnboardingDone + d + 1;
        const onboardingHabitId = ONBOARDING_DAY_SESSION[onboardingDayBeingSimulated];
        if (onboardingHabitId && !existingCompletions.some(c => c.habitId === onboardingHabitId)) {
          const onboardingCompletion = await storage.createHabitCompletion({
            habitId: onboardingHabitId,
            userId: req.params.id,
            durationMinutes: 2,
            xpEarned: 5,
          });
          await db.update(habitCompletions)
            .set({ completedAt: simulatedDate })
            .where(eq(habitCompletions.id, onboardingCompletion.id));
          completionsCreated.push(onboardingCompletion.id);
          await storage.gainExp(req.params.id, 5);
        }

        if (completeHabits && activeHabits.length > 0) {
          const habitsToComplete = activeHabits.slice(0, Math.max(1, Math.ceil(activeHabits.length * 0.7)));
          for (const habit of habitsToComplete) {
            const { getXPForActivity } = await import("./gameLogic/levelSystem");
            const simXP = getXPForActivity(habit.baseDurationMinutes);
            const completion = await storage.createHabitCompletion({
              habitId: habit.id,
              userId: req.params.id,
              durationMinutes: habit.baseDurationMinutes,
              xpEarned: simXP,
            });
            await db.update(habitCompletions)
              .set({ completedAt: simulatedDate })
              .where(eq(habitCompletions.id, completion.id));
            completionsCreated.push(completion.id);
            await storage.gainExp(req.params.id, simXP);

            const newTime = new Date(simulatedDate);
            newTime.setMinutes(newTime.getMinutes() + habit.baseDurationMinutes + 15);
            simulatedDate.setTime(newTime.getTime());
          }
        } else {
          // No active habits — create a minimal placeholder for streak/date tracking
          const guidedCompletion = await storage.createHabitCompletion({
            habitId: `guided_day_sim_${d}`,
            userId: req.params.id,
            durationMinutes: 2,
            xpEarned: 0,
          });
          await db.update(habitCompletions)
            .set({ completedAt: simulatedDate })
            .where(eq(habitCompletions.id, guidedCompletion.id));
          completionsCreated.push(guidedCompletion.id);
        }
      }

      const allCompletions = await storage.getHabitCompletions(req.params.id);
      // Compute newOnboardingDay from specific onboarding session completions
      const newCompletedOnboardingDays = Object.values(ONBOARDING_DAY_SESSION)
        .filter(habitId => allCompletions.some(c => c.habitId === habitId)).length;
      const newOnboardingDay = Math.min(newCompletedOnboardingDays + 1, 5);

      // Count distinct active days from all completions (defined here for the response)
      const simDistinctDays = new Set(
        allCompletions.filter(c => c.completedAt).map(c => new Date(c.completedAt!).toLocaleDateString("en-CA"))
      );

      const newStreak = Math.min(player.streak + dayCount, 999);
      const playerUpdates: Record<string, unknown> = { streak: newStreak };

      // Auto-complete onboarding when all 5 sessions are simulated
      // Player stays at Level 1 with naturally earned XP (5 XP × 5 days = 25 XP)
      if (newCompletedOnboardingDays >= 5 && player.onboardingCompleted !== 1) {
        playerUpdates.onboardingCompleted = 1;
      }

      await storage.updatePlayer(req.params.id, playerUpdates);

      res.json({
        success: true,
        daysSimulated: dayCount,
        completionsCreated: completionsCreated.length,
        newOnboardingDay,
        newStreak,
        distinctActiveDays: simDistinctDays.size,
        onboardingCompleted: newCompletedOnboardingDays >= 5,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to simulate days" });
    }
  });

  app.get("/api/player/:id/dev/status", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const allCompletions = await storage.getHabitCompletions(req.params.id);
      const habits = await storage.getHabits(req.params.id);
      const distinctDays = new Set(
        allCompletions.filter(c => c.completedAt).map(c => new Date(c.completedAt!).toLocaleDateString("en-CA"))
      );

      // Use the same ONBOARDING_HABIT_TO_DAY logic as the home endpoint
      const STATUS_ONBOARDING_HABIT_TO_DAY: Record<string, number> = {
        "guided_calm-breathing": 1,
        "guided_light-movement": 2,
        "guided_hydration-check": 3,
        "guided_focus-block": 4,
        "guided_plan-tomorrow": 5,
      };
      const statusCompletedDays: number[] = [];
      for (const [habitId, day] of Object.entries(STATUS_ONBOARDING_HABIT_TO_DAY)) {
        if (allCompletions.some(c => c.habitId === habitId)) statusCompletedDays.push(day);
      }
      const onboardingDayRaw = statusCompletedDays.length + 1;
      const onboardingDay = player.onboardingCompleted === 1
        ? Math.max(onboardingDayRaw, distinctDays.size + 1)
        : Math.min(onboardingDayRaw, 5);

      const sortedDays = [...distinctDays].sort().reverse();
      const lastActiveDate = sortedDays[0] ?? null;
      const daysSinceLastActivity = lastActiveDate
        ? Math.floor((Date.now() - new Date(lastActiveDate + "T23:59:59").getTime()) / 86400000)
        : 999;

      res.json({
        playerId: player.id,
        playerName: player.name,
        onboardingDay,
        onboardingCompleted: player.onboardingCompleted === 1,
        streak: player.streak,
        phase: player.phase,
        level: player.level,
        stabilityScore: player.stability?.score ?? 50,
        stabilityState: player.stability?.state ?? "stabilizing",
        totalCompletions: allCompletions.length,
        totalActiveHabits: habits.filter(h => h.active).length,
        distinctActiveDays: distinctDays.size,
        lastActiveDate,
        daysSinceLastActivity,
        tabUnlocks: {
          HOME: { unlockDay: 1, unlocked: onboardingDay >= 1 },
          COACH: { unlockDay: 1, unlocked: onboardingDay >= 1 },
          HABITS: { unlockDay: 7, unlocked: onboardingDay >= 7 },
          TRAIN: { unlockDay: 5, unlocked: onboardingDay >= 5 },
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get dev status" });
    }
  });

  app.post("/api/player/:id/dev/go-back-day", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const ONBOARDING_HABIT_TO_DAY_BACK: Record<string, number> = {
        "guided_calm-breathing": 1,
        "guided_light-movement": 2,
        "guided_hydration-check": 3,
        "guided_focus-block": 4,
        "guided_plan-tomorrow": 5,
      };

      const allCompletions = await storage.getHabitCompletions(req.params.id);
      const toDateStr = (d: Date) => d.toISOString().split("T")[0];
      const distinctDays = [...new Set(
        allCompletions.filter(c => c.completedAt).map(c => toDateStr(new Date(c.completedAt!)))
      )].sort();

      if (distinctDays.length === 0) {
        return res.json({ success: true, message: "Already at Day 1", newOnboardingDay: 1, newStreak: 0, removedCompletions: 0 });
      }

      const latestDay = distinctDays[distinctDays.length - 1];
      const completionsToRemove = allCompletions.filter(c =>
        c.completedAt && toDateStr(new Date(c.completedAt!)) === latestDay
      );
      const removedIds = new Set(completionsToRemove.map(c => c.id));

      await db.transaction(async (tx) => {
        for (const c of completionsToRemove) {
          await tx.delete(habitCompletions).where(eq(habitCompletions.id, c.id));
        }

        // Recalculate onboardingDay from remaining guided_* completions
        const remainingCompletions = allCompletions.filter(c => !removedIds.has(c.id));
        const remainingCompletedDays = Object.entries(ONBOARDING_HABIT_TO_DAY_BACK)
          .filter(([habitId]) => remainingCompletions.some(c => c.habitId === habitId))
          .map(([, day]) => day);
        const newOnboardingDay = Math.min(remainingCompletedDays.length + 1, 5);

        const newStreak = Math.max(0, player.streak - 1);
        const updates: Record<string, any> = { streak: newStreak };
        if (newOnboardingDay < 5) updates.onboardingCompleted = 0;
        await storage.updatePlayer(req.params.id, updates);

        res.json({
          success: true,
          removedCompletions: completionsToRemove.length,
          removedDay: latestDay,
          newOnboardingDay,
          newStreak,
        });
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to go back a day" });
    }
  });

  app.post("/api/player/:id/dev/reset-today", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });
      const removed = await storage.deleteTodayGuidedCompletions(req.params.id);
      res.json({ success: true, removed });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset today's sessions" });
    }
  });

  app.post("/api/player/:id/reset-progress", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });

      await storage.resetPlayerProgress(req.params.id);

      res.json({ success: true, message: "Progress reset to Day 1" });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset progress" });
    }
  });

  return httpServer;
}
