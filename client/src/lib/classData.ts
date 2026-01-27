import type { Skill } from "@shared/schema";

export const basicClasses = ["NONE", "WARRIOR", "MAGE", "SUPPORT", "ASSASSIN", "RANGER", "TANK"];

export const advancedClasses: Record<string, string[]> = {
  C: ["BERSERKER", "ELEMENTALIST", "PRIEST", "SHADOW BLADE", "MARKSMAN", "GUARDIAN"],
  B: ["CHAMPION", "ARCHMAGE", "ORACLE", "PHANTOM", "SHARPSHOOTER", "PALADIN"],
  A: ["WARLORD", "SAGE", "SAINT", "NIGHTLORD", "SNIPER", "CRUSADER"],
  S: ["SHADOW MONARCH", "DRAGON KNIGHT", "GRAND SAGE", "ARCHANGEL", "DEATH DEALER", "IMMORTAL"],
};

export const jobsByRank: Record<string, string[]> = {
  E: basicClasses,
  D: basicClasses,
  C: [...basicClasses, ...advancedClasses.C],
  B: [...basicClasses, ...advancedClasses.C, ...advancedClasses.B],
  A: [...basicClasses, ...advancedClasses.C, ...advancedClasses.B, ...advancedClasses.A],
  S: [...basicClasses, ...advancedClasses.C, ...advancedClasses.B, ...advancedClasses.A, ...advancedClasses.S],
};

export const titlesByRank: Record<string, string[]> = {
  E: ["NOVICE HUNTER"],
  D: ["NOVICE HUNTER", "WOLF SLAYER", "GOBLIN HUNTER"],
  C: ["WOLF SLAYER", "GOBLIN HUNTER", "DUNGEON BREAKER", "BEAST TAMER"],
  B: ["DUNGEON BREAKER", "BEAST TAMER", "BOSS KILLER", "SHADOW WALKER"],
  A: ["BOSS KILLER", "SHADOW WALKER", "GATE CRUSHER", "DEMON SLAYER"],
  S: ["GATE CRUSHER", "DEMON SLAYER", "MONARCH'S VESSEL", "SHADOW SOVEREIGN"],
};

export const skillsByClass: Record<string, Skill[]> = {
  NONE: [
    { id: "basic_attack", name: "Basic Attack", description: "A simple attack that deals minor damage", mpCost: 0, cooldown: 0, level: 1, unlocked: true },
    { id: "dodge", name: "Dodge", description: "Evade incoming attacks", mpCost: 5, cooldown: 5, level: 1, unlocked: false },
    { id: "focus", name: "Focus", description: "Increase accuracy for the next attack", mpCost: 10, cooldown: 10, level: 1, unlocked: false },
    { id: "survival_instinct", name: "Survival Instinct", description: "Temporarily boost all stats when HP is low", mpCost: 20, cooldown: 60, level: 1, unlocked: false },
  ],
  WARRIOR: [
    { id: "power_strike", name: "Power Strike", description: "A powerful blow that deals 150% weapon damage", mpCost: 10, cooldown: 5, level: 1, unlocked: true },
    { id: "battle_cry", name: "Battle Cry", description: "Increases attack power by 20% for 30 seconds", mpCost: 25, cooldown: 30, level: 1, unlocked: false },
    { id: "whirlwind", name: "Whirlwind", description: "Spin attack that hits all nearby enemies", mpCost: 40, cooldown: 15, level: 1, unlocked: false },
    { id: "berserker_rage", name: "Berserker Rage", description: "Enter a rage state, doubling damage but reducing defense", mpCost: 60, cooldown: 60, level: 1, unlocked: false },
  ],
  MAGE: [
    { id: "fireball", name: "Fireball", description: "Launch a ball of fire that explodes on impact", mpCost: 15, cooldown: 3, level: 1, unlocked: true },
    { id: "ice_shard", name: "Ice Shard", description: "Shoot sharp ice crystals that slow enemies", mpCost: 20, cooldown: 5, level: 1, unlocked: false },
    { id: "lightning_bolt", name: "Lightning Bolt", description: "Call down lightning to strike enemies", mpCost: 35, cooldown: 10, level: 1, unlocked: false },
    { id: "meteor_storm", name: "Meteor Storm", description: "Rain down meteors on the battlefield", mpCost: 80, cooldown: 45, level: 1, unlocked: false },
  ],
  SUPPORT: [
    { id: "heal", name: "Heal", description: "Restore HP to yourself or an ally", mpCost: 20, cooldown: 8, level: 1, unlocked: true },
    { id: "barrier", name: "Barrier", description: "Create a protective shield that absorbs damage", mpCost: 30, cooldown: 15, level: 1, unlocked: false },
    { id: "blessing", name: "Blessing", description: "Increase all stats of allies for 60 seconds", mpCost: 45, cooldown: 30, level: 1, unlocked: false },
    { id: "resurrection", name: "Resurrection", description: "Revive a fallen ally with 50% HP", mpCost: 100, cooldown: 120, level: 1, unlocked: false },
  ],
  ASSASSIN: [
    { id: "backstab", name: "Backstab", description: "Attack from behind for critical damage", mpCost: 15, cooldown: 6, level: 1, unlocked: true },
    { id: "stealth", name: "Stealth", description: "Become invisible for 10 seconds", mpCost: 30, cooldown: 20, level: 1, unlocked: false },
    { id: "poison_blade", name: "Poison Blade", description: "Coat weapon with poison that deals damage over time", mpCost: 25, cooldown: 15, level: 1, unlocked: false },
    { id: "death_mark", name: "Death Mark", description: "Mark an enemy to take 50% more damage", mpCost: 50, cooldown: 45, level: 1, unlocked: false },
  ],
  RANGER: [
    { id: "precise_shot", name: "Precise Shot", description: "A well-aimed shot that never misses", mpCost: 10, cooldown: 4, level: 1, unlocked: true },
    { id: "multishot", name: "Multishot", description: "Fire multiple arrows at once", mpCost: 25, cooldown: 10, level: 1, unlocked: false },
    { id: "trap", name: "Trap", description: "Set a trap that immobilizes enemies", mpCost: 20, cooldown: 20, level: 1, unlocked: false },
    { id: "eagle_eye", name: "Eagle Eye", description: "Increase critical hit chance by 30%", mpCost: 35, cooldown: 30, level: 1, unlocked: false },
  ],
  TANK: [
    { id: "shield_bash", name: "Shield Bash", description: "Slam shield into enemy, stunning them", mpCost: 15, cooldown: 8, level: 1, unlocked: true },
    { id: "taunt", name: "Taunt", description: "Force all enemies to attack you", mpCost: 20, cooldown: 15, level: 1, unlocked: false },
    { id: "iron_wall", name: "Iron Wall", description: "Reduce all incoming damage by 50%", mpCost: 40, cooldown: 25, level: 1, unlocked: false },
    { id: "last_stand", name: "Last Stand", description: "Become invincible for 5 seconds when HP drops to 1", mpCost: 80, cooldown: 120, level: 1, unlocked: false },
  ],
};

export const getSkillsForClass = (className: string): Skill[] => {
  const baseClass = className.toUpperCase();
  if (skillsByClass[baseClass]) {
    return skillsByClass[baseClass];
  }
  return skillsByClass.NONE;
};
