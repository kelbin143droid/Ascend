export const XP_PER_LEVEL = 100;
export const STAT_POINTS_PER_LEVEL = 4;

export const PHASE1_XP = {
  sense: 15,
  agility: 15,
  vitality: 10,
  strength: 40,
  synthesisBonus: 20,
} as const;

export const PHASE1_TASK_XP_TOTAL =
  PHASE1_XP.sense + PHASE1_XP.agility + PHASE1_XP.vitality + PHASE1_XP.strength;

export const PHASE1_DAILY_TARGET_XP = PHASE1_TASK_XP_TOTAL + PHASE1_XP.synthesisBonus;
