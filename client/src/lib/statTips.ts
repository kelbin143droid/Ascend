export const STAT_TIPS: Record<string, string[]> = {
  strength: [
    "Sleep 7–9 hours for muscle recovery.",
    "Hydrate before and after training.",
    "Increase volume gradually to avoid injury.",
    "Protein intake within 2 hours post-workout aids recovery.",
    "Compound movements build functional strength faster.",
    "Rest days are when muscles actually grow.",
    "Warming up prevents 50% of common injuries.",
  ],
  agility: [
    "Quick response time improves with consistent practice.",
    "Short sprints train fast-twitch muscle fibers.",
    "Balance exercises improve overall coordination.",
    "Flexibility training enhances movement speed.",
    "Reaction drills sharpen reflexes over time.",
    "Agility ladders are underrated training tools.",
    "Dynamic stretching before activity improves performance.",
  ],
  sense: [
    "Meditation improves emotional regulation.",
    "Take short breaks every 60–90 minutes.",
    "Deep focus requires a distraction-free environment.",
    "Reading trains pattern recognition.",
    "Mindfulness increases awareness and perception.",
    "Quality sleep consolidates learning and memory.",
    "Cold exposure may sharpen mental clarity.",
  ],
  vitality: [
    "Consistent sleep schedule regulates energy.",
    "Sunlight in the morning resets circadian rhythm.",
    "Walking 10,000 steps improves cardiovascular health.",
    "Deep breathing activates the parasympathetic system.",
    "Hydration directly affects energy levels.",
    "Stress management is vital for recovery.",
    "Regular health checkups catch issues early.",
  ],
};

export function getDailyTip(stat: string): string {
  const tips = STAT_TIPS[stat] || [];
  if (tips.length === 0) return "Train consistently for best results.";
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return tips[dayOfYear % tips.length];
}

export const STAT_MULTIPLIERS: Record<string, number> = {
  strength: 1.2,
  agility: 1.15,
  sense: 1.1,
  vitality: 1.1,
};
