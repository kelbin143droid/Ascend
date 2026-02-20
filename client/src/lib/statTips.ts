export const STAT_TIPS: Record<string, string[]> = {
  strength: [
    "Sleep 7-9 hours for muscle recovery.",
    "Hydrate before and after training.",
    "Increase volume gradually to avoid injury.",
    "Protein intake within 2 hours post-workout aids recovery.",
    "Compound movements build functional strength faster.",
    "Rest days are when muscles actually grow.",
    "Warming up prevents 50% of common injuries.",
  ],
  agility: [
    "Consistent stretching builds flexibility over time.",
    "Never bounce during a stretch. Hold steady.",
    "Breathe deeply into each stretch to deepen the hold.",
    "Flexibility reduces injury risk by up to 50%.",
    "Yoga improves balance, posture, and body awareness.",
    "Stretch after warming up for best results.",
    "Mobility work keeps joints healthy as you age.",
  ],
  sense: [
    "Meditation improves emotional regulation.",
    "Even 3 minutes of mindfulness changes brain activity.",
    "Deep focus requires a distraction-free environment.",
    "Breath awareness is the foundation of all meditation.",
    "Mindfulness increases awareness and perception.",
    "Quality sleep consolidates learning and memory.",
    "Consistency matters more than duration in meditation.",
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
