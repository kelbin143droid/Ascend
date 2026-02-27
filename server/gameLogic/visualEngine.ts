import type { StatName } from "@shared/schema";
import { PHASE_NAMES } from "@shared/schema";

export interface EnvironmentVisuals {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  particles: {
    type: string;
    count: number;
    speed: number;
    opacity: number;
  };
  auraLayers: number;
  environmentTier: string;
  stabilityIntensityModifier: number;
  dimming: boolean;
  label: string;
}

export interface AvatarAura {
  color: string;
  layers: number;
  glowIntensity: number;
  pulseSpeed: number;
}

export interface TaskCompletionVisuals {
  particleType: string;
  auraPulseColor: string;
  celebrationLevel: "minimal" | "moderate" | "epic";
}

const PHASE_COLORS: Record<number, { primary: string; secondary: string; accent: string; background: string }> = {
  1: { primary: "#94a3b8", secondary: "#64748b", accent: "#cbd5e1", background: "#0f172a" },
  2: { primary: "#22c55e", secondary: "#16a34a", accent: "#86efac", background: "#052e16" },
  3: { primary: "#3b82f6", secondary: "#2563eb", accent: "#93c5fd", background: "#0c1a3d" },
  4: { primary: "#a855f7", secondary: "#9333ea", accent: "#d8b4fe", background: "#1a0533" },
  5: { primary: "#ffd700", secondary: "#f59e0b", accent: "#fde68a", background: "#1a1400" },
};

const PHASE_PARTICLES: Record<number, { type: string; count: number; speed: number }> = {
  1: { type: "dust", count: 10, speed: 0.3 },
  2: { type: "embers", count: 20, speed: 0.5 },
  3: { type: "sparks", count: 35, speed: 0.7 },
  4: { type: "energy", count: 50, speed: 0.85 },
  5: { type: "radiance", count: 80, speed: 1.0 },
};

const STAT_COLORS: Record<StatName, string> = {
  strength: "#ef4444",
  agility: "#22c55e",
  sense: "#3b82f6",
  vitality: "#f59e0b",
};

const STAT_PARTICLE_TYPES: Record<StatName, string> = {
  strength: "burst",
  agility: "swirl",
  sense: "ripple",
  vitality: "glow",
};

export function getEnvironmentVisuals(phase: number, stabilityScore: number): EnvironmentVisuals {
  const colors = PHASE_COLORS[phase] || PHASE_COLORS[1];
  const particles = PHASE_PARTICLES[phase] || PHASE_PARTICLES[1];
  const auraLayers = Math.max(0, phase - 1);

  const stabilityIntensityModifier = Math.max(0.3, stabilityScore / 100);
  const dimming = stabilityScore < 40;

  const particleOpacity = dimming
    ? stabilityIntensityModifier * 0.5
    : stabilityIntensityModifier;

  const adjustedSpeed = dimming
    ? particles.speed * 0.5
    : particles.speed * stabilityIntensityModifier;

  return {
    colors,
    particles: {
      type: particles.type,
      count: Math.round(particles.count * stabilityIntensityModifier),
      speed: adjustedSpeed,
      opacity: Math.max(0.1, particleOpacity),
    },
    auraLayers,
    environmentTier: getEnvironmentTier(phase),
    stabilityIntensityModifier,
    dimming,
    label: PHASE_NAMES[phase] || "Unknown",
  };
}

function getEnvironmentTier(phase: number): string {
  switch (phase) {
    case 1: return "minimal";
    case 2: return "growing";
    case 3: return "dynamic";
    case 4: return "advanced";
    case 5: return "epic";
    default: return "minimal";
  }
}

export function getAvatarAura(phase: number, stabilityScore: number, momentum: number): AvatarAura {
  const colors = PHASE_COLORS[phase] || PHASE_COLORS[1];
  const layers = Math.max(0, phase - 1);

  const stabilityFactor = stabilityScore / 100;
  const momentumFactor = momentum;

  const glowIntensity = Math.max(0.1, (stabilityFactor * 0.6 + momentumFactor * 0.4));
  const pulseSpeed = 0.5 + momentumFactor * 1.5;

  return {
    color: colors.primary,
    layers,
    glowIntensity: Math.round(glowIntensity * 100) / 100,
    pulseSpeed: Math.round(pulseSpeed * 100) / 100,
  };
}

export function getTaskCompletionVisuals(
  stat: StatName,
  xpEarned: number,
  badgesEarned: number
): TaskCompletionVisuals {
  const particleType = STAT_PARTICLE_TYPES[stat] || "burst";
  const auraPulseColor = STAT_COLORS[stat] || "#ffffff";

  let celebrationLevel: "minimal" | "moderate" | "epic" = "minimal";
  if (badgesEarned > 0) {
    celebrationLevel = "epic";
  } else if (xpEarned >= 25) {
    celebrationLevel = "moderate";
  }

  return {
    particleType,
    auraPulseColor,
    celebrationLevel,
  };
}
