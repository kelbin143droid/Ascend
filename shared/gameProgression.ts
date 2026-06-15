export const XP_PER_LEVEL = 100;
export const STAT_POINTS_PER_LEVEL = 3;

export const PHASE1_XP = {
  sense: 15,
  agility: 10,
  strength: 15,
  intelligence: 10,
  vitality: 10,
  synthesisBonus: 40,
} as const;

export const PHASE1_TASK_XP_TOTAL =
  PHASE1_XP.sense +
  PHASE1_XP.agility +
  PHASE1_XP.strength +
  PHASE1_XP.intelligence +
  PHASE1_XP.vitality;

export const PHASE1_DAILY_TARGET_XP = PHASE1_TASK_XP_TOTAL + PHASE1_XP.synthesisBonus;
