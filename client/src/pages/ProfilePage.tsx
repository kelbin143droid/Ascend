import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { RadarChart, type RadarChartValues } from "@/components/game/RadarChart";
import { getCalibrationProfile } from "@/lib/calibrationEngine";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Calendar, Play, User, Bell, Clock, Settings, ChevronRight, Plus } from "lucide-react";
import { PHASE_STAT_CAPS, PHASE_NAMES } from "@shared/schema";
import { syncPlayerToCache } from "@/lib/progressionService";
import { apiRequest } from "@/lib/queryClient";

// ─── Constants ────────────────────────────────────────────────────────────────

const ARCHETYPE_KEY = "ascend_avatar_archetype";

const PHASE_COLORS: Record<number, string> = {
  1: "#6b7280",
  2: "#22c55e",
  3: "#3b82f6",
  4: "#a855f7",
  5: "#ffd700",
};

const ARCHETYPES = [
  { id: "warrior", name: "Warrior", color: "#ef4444", accent: "#fbbf24", tagline: "Born in battle" },
  { id: "sage",    name: "Sage",    color: "#8b5cf6", accent: "#60a5fa", tagline: "Master of mind" },
  { id: "shadow",  name: "Shadow",  color: "#14b8a6", accent: "#94a3b8", tagline: "Unseen force" },
  { id: "warden",  name: "Warden",  color: "#22c55e", accent: "#fbbf24", tagline: "Unbreakable will" },
] as const;

type ArchetypeId = typeof ARCHETYPES[number]["id"];

const GAME_STATS = [
  { key: "strength" as const, label: "STR", color: "#fbbf24" },
  { key: "agility"  as const, label: "AGI", color: "#34d399" },
  { key: "vitality" as const, label: "VIT", color: "#f87171" },
  { key: "sense"    as const, label: "SEN", color: "#a78bfa" },
];

const SETTINGS_ITEMS = [
  { icon: User,     label: "Edit Profile",           key: "edit-profile",   route: undefined as string | undefined },
  { icon: Bell,     label: "Notification Settings",  key: "notifications",  route: "/notification-settings" as string | undefined },
  { icon: Clock,    label: "Sectograph Preferences", key: "sectograph",     route: undefined as string | undefined },
  { icon: Settings, label: "App Settings",           key: "app-settings",   route: undefined as string | undefined },
];

const STAT_META_RADAR = [
  { key: "strength"   as const, label: "STR", color: "#fbbf24" },
  { key: "vitality"   as const, label: "VIT", color: "#34d399" },
  { key: "sense"      as const, label: "SNS", color: "#a78bfa" },
  { key: "discipline" as const, label: "DIS", color: "#fb923c" },
];

// ─── Archetype SVG art ────────────────────────────────────────────────────────

function WarriorArt({ color, accent }: { color: string; accent: string }) {
  return (
    <svg viewBox="0 0 120 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="60" cy="185" rx="36" ry="8" fill={color} opacity="0.22" />
      <path d="M38 68 Q20 120 24 180 Q38 165 60 170 Q82 165 96 180 Q100 120 82 68Z" fill={color} opacity="0.18" />
      <path d="M40 68 Q24 110 28 170 L60 158 L92 170 Q96 110 80 68Z" fill={color} opacity="0.3" />
      <rect x="43" y="148" width="14" height="50" rx="4" fill="#1e293b" stroke={color} strokeWidth="1.5" />
      <rect x="63" y="148" width="14" height="50" rx="4" fill="#1e293b" stroke={color} strokeWidth="1.5" />
      <rect x="40" y="188" width="20" height="14" rx="3" fill={color} opacity="0.7" />
      <rect x="60" y="188" width="20" height="14" rx="3" fill={color} opacity="0.7" />
      <path d="M38 80 L82 80 L86 148 L34 148Z" fill="#1e293b" />
      <path d="M38 80 L82 80 L86 148 L34 148Z" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" />
      <path d="M60 84 L60 144" stroke={accent} strokeWidth="1" opacity="0.6" />
      <path d="M38 100 L82 100" stroke={accent} strokeWidth="1" opacity="0.35" />
      <polygon points="50,88 60,78 70,88 65,100 55,100" fill={accent} opacity="0.4" stroke={accent} strokeWidth="1" />
      <ellipse cx="34" cy="84" rx="12" ry="9" fill={color} opacity="0.7" stroke={accent} strokeWidth="1" />
      <ellipse cx="86" cy="84" rx="12" ry="9" fill={color} opacity="0.7" stroke={accent} strokeWidth="1" />
      <rect x="22" y="88" width="12" height="44" rx="5" fill="#1e293b" stroke={color} strokeWidth="1.2" />
      <rect x="86" y="88" width="12" height="44" rx="5" fill="#1e293b" stroke={color} strokeWidth="1.2" />
      <rect x="100" y="70" width="5" height="100" rx="2" fill={accent} opacity="0.85" />
      <rect x="96" y="108" width="13" height="4" rx="1" fill={color} opacity="0.9" />
      <rect x="101" y="64" width="3" height="10" rx="1" fill={accent} />
      <rect x="53" y="56" width="14" height="24" rx="4" fill="#1e293b" stroke={color} strokeWidth="1" />
      <ellipse cx="60" cy="44" rx="22" ry="22" fill="#1e293b" stroke={color} strokeWidth="2" />
      <path d="M40 38 L80 38 L80 52 Q60 58 40 52Z" fill={color} opacity="0.5" />
      <path d="M46 44 L74 44" stroke={accent} strokeWidth="2" opacity="0.8" />
      <ellipse cx="51" cy="40" rx="5" ry="3" fill={accent} opacity="0.9" />
      <ellipse cx="69" cy="40" rx="5" ry="3" fill={accent} opacity="0.9" />
      <path d="M52 24 L60 10 L68 24" fill={accent} opacity="0.6" />
    </svg>
  );
}

function SageArt({ color, accent }: { color: string; accent: string }) {
  return (
    <svg viewBox="0 0 120 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="60" cy="185" rx="34" ry="8" fill={color} opacity="0.20" />
      <path d="M42 80 Q28 100 20 200 L100 200 Q92 100 78 80Z" fill={color} opacity="0.18" stroke={color} strokeWidth="1" />
      <path d="M44 80 Q30 100 24 190 L96 190 Q90 100 76 80Z" fill="#1e293b" stroke={color} strokeWidth="1.5" />
      <path d="M60 90 L60 180" stroke={color} strokeWidth="1" opacity="0.4" />
      <path d="M46 130 Q60 140 74 130" stroke={accent} strokeWidth="1" opacity="0.5" />
      <path d="M42 155 Q60 165 78 155" stroke={accent} strokeWidth="1" opacity="0.4" />
      <circle cx="60" cy="118" r="14" stroke={accent} strokeWidth="1.2" opacity="0.6" fill="none" />
      <circle cx="60" cy="118" r="8" stroke={color} strokeWidth="1" opacity="0.8" fill={color} fillOpacity="0.1" />
      <polygon points="60,108 67,122 53,122" fill="none" stroke={accent} strokeWidth="1" opacity="0.7" />
      <rect x="14" y="30" width="5" height="160" rx="2" fill={color} opacity="0.7" />
      <circle cx="16" cy="30" r="10" fill={color} opacity="0.35" />
      <circle cx="16" cy="30" r="6" fill={accent} opacity="0.7" />
      <circle cx="16" cy="30" r="3" fill="white" opacity="0.5" />
      <path d="M44 90 Q28 110 22 130" stroke={color} strokeWidth="10" strokeLinecap="round" opacity="0.5" />
      <path d="M76 90 Q88 108 88 128" stroke={color} strokeWidth="10" strokeLinecap="round" opacity="0.5" />
      <circle cx="90" cy="128" r="10" fill={accent} opacity="0.25" />
      <circle cx="90" cy="128" r="6" fill={accent} opacity="0.65" />
      <circle cx="87" cy="125" r="2" fill="white" opacity="0.7" />
      <rect x="54" y="56" width="12" height="24" rx="4" fill="#1e293b" />
      <ellipse cx="60" cy="44" rx="20" ry="22" fill="#1e293b" stroke={color} strokeWidth="1.8" />
      <path d="M36 44 Q38 16 60 14 Q82 16 84 44 Q74 36 60 36 Q46 36 36 44Z" fill={color} opacity="0.6" />
      <ellipse cx="52" cy="42" rx="4" ry="3" fill={accent} opacity="0.9" />
      <ellipse cx="68" cy="42" rx="4" ry="3" fill={accent} opacity="0.9" />
      <text x="26" y="34" fill={accent} fontSize="8" opacity="0.55" fontFamily="monospace">✦</text>
      <text x="88" y="34" fill={accent} fontSize="8" opacity="0.55" fontFamily="monospace">✦</text>
      <text x="57" y="8" fill={accent} fontSize="8" opacity="0.55" fontFamily="monospace">◈</text>
    </svg>
  );
}

function ShadowArt({ color, accent }: { color: string; accent: string }) {
  return (
    <svg viewBox="0 0 120 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="62" cy="185" rx="32" ry="7" fill={color} opacity="0.20" />
      <path d="M36 72 Q14 110 18 190 Q38 174 62 176 Q84 174 100 186 Q108 116 86 72Z" fill="#0f172a" stroke={color} strokeWidth="1" opacity="0.9" />
      <path d="M38 72 Q18 108 22 182 L62 168 L98 178 Q104 114 84 72Z" fill={color} opacity="0.12" />
      <path d="M62 80 L62 170" stroke={color} strokeWidth="1" opacity="0.25" />
      <rect x="42" y="152" width="13" height="46" rx="4" fill="#0f172a" stroke={color} strokeWidth="1.2" />
      <rect x="66" y="156" width="13" height="42" rx="4" fill="#0f172a" stroke={color} strokeWidth="1.2" />
      <rect x="38" y="190" width="20" height="12" rx="3" fill={color} opacity="0.6" />
      <rect x="62" y="192" width="20" height="10" rx="3" fill={color} opacity="0.6" />
      <path d="M40 78 L84 78 L86 152 L36 152Z" fill="#0f172a" stroke={color} strokeWidth="1.2" />
      <path d="M40 84 L84 100" stroke={accent} strokeWidth="1.5" opacity="0.6" />
      <path d="M84 84 L40 100" stroke={accent} strokeWidth="1.5" opacity="0.6" />
      <path d="M24 92 L24 140" stroke={accent} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      <path d="M22 92 L26 92 L25 88Z" fill={accent} opacity="0.9" />
      <path d="M96 100 L96 142" stroke={accent} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      <path d="M94 100 L98 100 L97 96Z" fill={accent} opacity="0.9" />
      <rect x="24" y="82" width="16" height="40" rx="5" fill="#0f172a" stroke={color} strokeWidth="1" />
      <rect x="80" y="82" width="16" height="40" rx="5" fill="#0f172a" stroke={color} strokeWidth="1" />
      <rect x="54" y="56" width="14" height="22" rx="3" fill="#0f172a" />
      <ellipse cx="61" cy="44" rx="21" ry="22" fill="#0f172a" stroke={color} strokeWidth="1.8" />
      <path d="M38 38 Q40 16 61 14 Q82 16 84 38 Q72 30 61 30 Q50 30 38 38Z" fill="#0f172a" stroke={color} strokeWidth="1.2" opacity="0.9" />
      <path d="M40 40 Q42 18 61 16 Q80 18 82 40 Q72 34 61 34 Q50 34 40 40Z" fill={color} opacity="0.25" />
      <ellipse cx="52" cy="43" rx="5" ry="2.5" fill={color} opacity="0.95" />
      <ellipse cx="70" cy="43" rx="5" ry="2.5" fill={color} opacity="0.95" />
      <circle cx="28" cy="60" r="2" fill={color} opacity="0.4" />
      <circle cx="95" cy="72" r="1.5" fill={accent} opacity="0.5" />
      <circle cx="18" cy="140" r="1.5" fill={color} opacity="0.35" />
    </svg>
  );
}

function WardenArt({ color, accent }: { color: string; accent: string }) {
  return (
    <svg viewBox="0 0 120 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="60" cy="185" rx="38" ry="9" fill={color} opacity="0.22" />
      <rect x="38" y="150" width="16" height="50" rx="5" fill="#1e293b" stroke={color} strokeWidth="1.5" />
      <rect x="66" y="150" width="16" height="50" rx="5" fill="#1e293b" stroke={color} strokeWidth="1.5" />
      <rect x="35" y="172" width="22" height="28" rx="4" fill={color} opacity="0.65" />
      <rect x="63" y="172" width="22" height="28" rx="4" fill={color} opacity="0.65" />
      <path d="M34 78 L86 78 L90 152 L30 152Z" fill="#1e293b" stroke={color} strokeWidth="1.8" />
      <path d="M60 80 L60 148" stroke={accent} strokeWidth="1.2" opacity="0.5" />
      <path d="M34 108 L86 108" stroke={accent} strokeWidth="1" opacity="0.35" />
      <path d="M44 80 L60 68 L76 80 L76 110 Q60 120 44 110Z" fill={color} opacity="0.35" stroke={accent} strokeWidth="1" />
      <ellipse cx="30" cy="82" rx="14" ry="11" fill={color} opacity="0.75" stroke={accent} strokeWidth="1.2" />
      <ellipse cx="90" cy="82" rx="14" ry="11" fill={color} opacity="0.75" stroke={accent} strokeWidth="1.2" />
      <rect x="16" y="86" width="14" height="50" rx="5" fill="#1e293b" stroke={color} strokeWidth="1.2" />
      <rect x="90" y="86" width="14" height="50" rx="5" fill="#1e293b" stroke={color} strokeWidth="1.2" />
      <path d="M4 86 Q4 86 4 130 Q4 152 16 158 Q28 152 28 130 L28 86Z" fill={color} opacity="0.55" stroke={accent} strokeWidth="1.5" />
      <path d="M8 96 Q8 96 8 128 Q8 146 16 150 Q24 146 24 128 L24 96Z" fill="none" stroke={accent} strokeWidth="1" opacity="0.5" />
      <path d="M16 108 L16 140" stroke={accent} strokeWidth="1.5" opacity="0.6" />
      <path d="M8 124 L24 124" stroke={accent} strokeWidth="1.5" opacity="0.6" />
      <rect x="52" y="56" width="16" height="22" rx="4" fill="#1e293b" stroke={color} strokeWidth="1" />
      <ellipse cx="60" cy="44" rx="23" ry="22" fill="#1e293b" stroke={color} strokeWidth="2" />
      <path d="M37 46 L83 46 L83 60 Q60 66 37 60Z" fill={color} opacity="0.55" />
      <path d="M37 46 L83 46 L83 34 Q60 22 37 34Z" fill={color} opacity="0.55" />
      <rect x="47" y="40" width="26" height="18" rx="3" fill="#0f172a" stroke={color} strokeWidth="1" opacity="0.8" />
      <ellipse cx="52" cy="48" rx="4" ry="2.5" fill={accent} opacity="0.95" />
      <ellipse cx="68" cy="48" rx="4" ry="2.5" fill={accent} opacity="0.95" />
      <rect x="57" y="12" width="6" height="22" rx="2" fill={accent} opacity="0.7" />
      <ellipse cx="60" cy="12" rx="6" ry="5" fill={accent} opacity="0.6" />
    </svg>
  );
}

function ArchetypeAvatar({ id, color, accent }: { id: ArchetypeId; color: string; accent: string }) {
  if (id === "warrior") return <WarriorArt color={color} accent={accent} />;
  if (id === "sage")    return <SageArt    color={color} accent={accent} />;
  if (id === "shadow")  return <ShadowArt  color={color} accent={accent} />;
  return <WardenArt color={color} accent={accent} />;
}

// ─── Hex pedestal ─────────────────────────────────────────────────────────────

function HexPedestal({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 160 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[180px]">
      <ellipse cx="80" cy="30" rx="72" ry="22" fill={color} opacity="0.08" />
      <ellipse cx="80" cy="30" rx="52" ry="16" fill={color} opacity="0.12" />
      <polygon
        points="80,8 116,22 116,42 80,56 44,42 44,22"
        fill={color} fillOpacity="0.12"
        stroke={color} strokeWidth="1.5" strokeOpacity="0.5"
      />
      <polygon
        points="80,14 108,26 108,38 80,50 52,38 52,26"
        fill={color} fillOpacity="0.08"
        stroke={color} strokeWidth="1" strokeOpacity="0.35"
      />
    </svg>
  );
}

// ─── Particle shimmer ─────────────────────────────────────────────────────────

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: `${Math.round((i * 37 + 11) % 100)}%`,
  y: `${Math.round((i * 53 + 7)  % 100)}%`,
  size: i % 3 === 0 ? 2 : 1.5,
  delay: `${((i * 0.37) % 2.8).toFixed(1)}s`,
  dur:   `${(2.5 + (i % 4) * 0.6).toFixed(1)}s`,
}));

function ParticleLayer({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top:  p.y,
            width:  p.size,
            height: p.size,
            backgroundColor: color,
            opacity: 0.35,
            animation: `ascendParticlePulse ${p.dur} ${p.delay} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── HomeData type ────────────────────────────────────────────────────────────

interface HomeData {
  phase: { number: number; name: string };
  stability: { score: number; label: string; state: string };
  growthState: string;
  streak: number;
  onboardingDay: number;
  isOnboardingComplete: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { player, isLoading, replayPhaseHistory } = useGame();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const queryClient = useQueryClient();

  const [, navigate] = useLocation();
  const [settingsToast, setSettingsToast] = useState<string | null>(null);
  const [archetype, setArchetype] = useState<ArchetypeId>(() => {
    try { return (localStorage.getItem(ARCHETYPE_KEY) as ArchetypeId) || "warrior"; } catch { return "warrior"; }
  });
  const [allocatingFor, setAllocatingFor] = useState<string | null>(null);

  const archetypeData = ARCHETYPES.find((a) => a.id === archetype) ?? ARCHETYPES[0];

  const { data: homeData } = useQuery<HomeData>({
    queryKey: ["home", player?.id],
    queryFn: async () => {
      if (!player?.id) throw new Error("No player");
      const res = await fetch(`/api/player/${player.id}/home`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!player?.id,
    staleTime: 30000,
  });

  useEffect(() => {
    if (player) syncPlayerToCache(player as any);
  }, [player?.id]);

  const selectArchetype = useCallback((id: ArchetypeId) => {
    setArchetype(id);
    try { localStorage.setItem(ARCHETYPE_KEY, id); } catch { /* noop */ }
  }, []);

  const allocateMutation = useMutation({
    mutationFn: async ({ stat }: { stat: string }) => {
      if (!player?.id) throw new Error("No player");
      const res = await apiRequest("POST", `/api/player/${player.id}/allocate-stat`, { stat, amount: 1 });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      setAllocatingFor(null);
    },
    onError: () => setAllocatingFor(null),
  });

  const handleAllocate = (stat: string) => {
    if (allocateMutation.isPending) return;
    setAllocatingFor(stat);
    allocateMutation.mutate({ stat });
  };

  const calibProfile = getCalibrationProfile();
  const radarValues: RadarChartValues | null = calibProfile
    ? {
        strength:   calibProfile.powerOutput,
        vitality:   calibProfile.recoveryRate,
        sense:      calibProfile.signalStability,
        discipline: calibProfile.syncRegularity,
      }
    : null;
  const calibDate = calibProfile
    ? new Date(calibProfile.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const showSettingsToast = (label: string) => {
    setSettingsToast(label);
    setTimeout(() => setSettingsToast(null), 2400);
  };

  if (isLoading || !player) {
    return (
      <SystemLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-primary animate-pulse">Loading...</div>
        </div>
      </SystemLayout>
    );
  }

  const phaseHistory  = player.phaseHistory || [];
  const currentPhase  = player.phase || 1;
  const phaseName     = PHASE_NAMES[currentPhase] || "Stabilization";
  const growthState   = homeData?.growthState || "Beginning";
  const withinLevelXP = (player as any).exp    ?? 0;
  const maxXP         = (player as any).maxExp  ?? 100;
  const xpPct         = Math.min(100, Math.round((withinLevelXP / maxXP) * 100));
  const statPoints    = (player as any).statPoints ?? 0;
  const displayStats  = (player as any).displayStats ?? player.stats ?? {};

  return (
    <SystemLayout>
      <style>{`
        @keyframes ascendParticlePulse {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          50%       { opacity: 0.55; transform: scale(1.6); }
        }
        @keyframes ascendSpotPulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 0.80; }
        }
        @keyframes ascendAvatarFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>

      <AnimatePresence>
        {settingsToast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-center"
            style={{
              backgroundColor: "rgba(15,23,42,0.93)",
              border: `1px solid ${colors.surfaceBorder}`,
              backdropFilter: "blur(12px)",
            }}
          >
            <p className="text-xs" style={{ color: colors.textMuted }}>{settingsToast} — coming soon</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen pb-28" data-testid="profile-page">

        {/* Fixed full-page dark RPG background — covers entire page including below-fold while scrolling */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 15,
            background: "radial-gradient(ellipse 90% 55% at 50% 35%, #1a2540 0%, #0c1220 50%, #060a12 100%)",
          }}
        />

        {/* ════════════════════════════════════════════════
            RPG GAME SCREEN
            ════════════════════════════════════════════════ */}
        <div
          className="relative overflow-hidden"
          style={{
            zIndex: 16,
            background: "transparent",
            minHeight: 430,
          }}
        >
          {/* Radial spotlight behind avatar */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: "50%", top: "42%",
              transform: "translate(-50%, -50%)",
              width: 300, height: 300,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${archetypeData.color}20 0%, transparent 70%)`,
              animation: "ascendSpotPulse 4s ease-in-out infinite",
            }}
          />

          {/* Ground ambient glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: "50%", bottom: "6%",
              transform: "translateX(-50%)",
              width: 200, height: 50,
              borderRadius: "50%",
              background: `radial-gradient(ellipse, ${archetypeData.color}28 0%, transparent 70%)`,
              filter: "blur(10px)",
            }}
          />

          <ParticleLayer color={archetypeData.color} />

          {/* ── TOP STAT BAR ─────────────────────────────── */}
          <div
            className="relative z-10 flex items-center gap-2 px-3 pt-2.5 pb-2"
            style={{ borderBottom: `1px solid ${archetypeData.color}20` }}
            data-testid="rpg-stat-bar"
          >
            {/* Level block */}
            <div
              className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg shrink-0"
              style={{
                background: `${archetypeData.color}18`,
                border: `1px solid ${archetypeData.color}40`,
              }}
            >
              <span className="text-[7px] font-mono uppercase tracking-widest" style={{ color: archetypeData.color }}>LVL</span>
              <span className="text-xl font-display font-bold leading-none" style={{ color: archetypeData.color }}>
                {player.level}
              </span>
            </div>

            {/* Name + XP bar */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[8px] font-mono truncate" style={{ color: archetypeData.color, opacity: 0.8 }}>
                  {player.name || "AWAKENED"}
                </span>
                <span className="text-[8px] font-mono shrink-0 ml-1" style={{ color: archetypeData.color, opacity: 0.65 }}>
                  {withinLevelXP}/{maxXP} XP
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${archetypeData.color}18` }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${xpPct}%`,
                    background: `linear-gradient(to right, ${archetypeData.color}, ${archetypeData.accent})`,
                    boxShadow: `0 0 8px ${archetypeData.color}80`,
                  }}
                  data-testid="xp-progress-bar"
                />
              </div>
            </div>

            {/* Stat pills */}
            <div className="flex gap-1 shrink-0">
              {GAME_STATS.map((s) => (
                <div
                  key={s.key}
                  className="flex flex-col items-center px-1.5 py-1 rounded"
                  style={{ background: `${s.color}12`, border: `1px solid ${s.color}28` }}
                  data-testid={`stat-pill-${s.label.toLowerCase()}`}
                >
                  <span className="text-[7px] font-mono font-bold" style={{ color: s.color }}>{s.label}</span>
                  <span className="text-[11px] font-mono font-bold tabular-nums leading-none" style={{ color: s.color }}>
                    {displayStats[s.key] ?? 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── MAIN 3-COLUMN BODY ──────────────────────────── */}
          <div className="relative z-10 flex items-stretch" style={{ minHeight: 330 }}>

            {/* LEFT — Archetype selector */}
            <div
              className="flex flex-col items-center justify-center gap-2 py-4 shrink-0"
              style={{ width: 70, borderRight: `1px solid ${archetypeData.color}15` }}
            >
              {ARCHETYPES.map((a) => {
                const isSelected = a.id === archetype;
                return (
                  <motion.button
                    key={a.id}
                    data-testid={`button-archetype-${a.id}`}
                    onClick={() => selectArchetype(a.id)}
                    whileTap={{ scale: 0.92 }}
                    className="relative flex flex-col items-center justify-center rounded-xl transition-colors duration-300"
                    style={{
                      width: 58,
                      height: 62,
                      background: isSelected ? `${a.color}22` : "rgba(255,255,255,0.03)",
                      border: `1.5px solid ${isSelected ? a.color : "rgba(255,255,255,0.07)"}`,
                      boxShadow: isSelected ? `0 0 14px ${a.color}40, inset 0 0 10px ${a.color}12` : "none",
                    }}
                  >
                    <div className="w-9 h-10 flex items-end justify-center overflow-hidden">
                      <ArchetypeAvatar id={a.id} color={a.color} accent={a.accent} />
                    </div>
                    <span
                      className="text-[7px] font-mono font-bold uppercase tracking-tight leading-none mt-1"
                      style={{ color: isSelected ? a.color : "rgba(255,255,255,0.3)" }}
                    >
                      {a.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* CENTER — Avatar preview */}
            <div className="flex-1 flex flex-col items-center justify-end pb-2 px-1 relative overflow-hidden">
              <div className="absolute top-3 left-0 right-0 text-center">
                <span
                  className="text-[8px] font-mono uppercase tracking-[0.2em]"
                  style={{ color: archetypeData.color, opacity: 0.7 }}
                >
                  {archetypeData.tagline}
                </span>
              </div>

              {/* Avatar art */}
              <motion.div
                key={archetype}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="relative flex items-end justify-center"
                style={{
                  width: 140,
                  height: 248,
                  animation: "ascendAvatarFloat 5s ease-in-out infinite",
                }}
                data-testid="avatar-preview"
              >
                <ArchetypeAvatar id={archetype} color={archetypeData.color} accent={archetypeData.accent} />
              </motion.div>

              {/* Hex pedestal */}
              <div className="w-full flex justify-center -mt-6 relative z-10">
                <HexPedestal color={archetypeData.color} />
              </div>

              {/* Archetype label */}
              <div className="text-center mt-1 relative z-10">
                <span
                  className="text-[11px] font-display font-bold uppercase tracking-[0.18em]"
                  style={{ color: archetypeData.color }}
                  data-testid="archetype-name-label"
                >
                  {archetypeData.name}
                </span>
              </div>
            </div>

            {/* RIGHT — Stat allocation */}
            <div
              className="flex flex-col justify-center py-4 px-2 shrink-0"
              style={{ width: 90, borderLeft: `1px solid ${archetypeData.color}15` }}
            >
              <AnimatePresence>
                {statPoints > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className="mb-3 text-center px-1 py-0.5 rounded"
                    style={{
                      background: `${archetypeData.accent}22`,
                      border: `1px solid ${archetypeData.accent}45`,
                    }}
                    data-testid="stat-points-badge"
                  >
                    <span className="text-[8px] font-mono font-bold" style={{ color: archetypeData.accent }}>
                      {statPoints} pts
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {GAME_STATS.map((s) => {
                const val      = displayStats[s.key] ?? 1;
                const canAdd   = statPoints > 0;
                const isPending = allocatingFor === s.key;

                return (
                  <div
                    key={s.key}
                    className="flex items-center justify-between gap-1.5 mb-2.5"
                    data-testid={`stat-row-${s.label.toLowerCase()}`}
                  >
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-[7px] font-mono font-bold uppercase" style={{ color: s.color }}>{s.label}</span>
                      <span className="text-sm font-mono font-bold tabular-nums leading-tight" style={{ color: s.color }}>
                        {val}
                      </span>
                    </div>
                    <motion.button
                      data-testid={`button-allocate-${s.label.toLowerCase()}`}
                      disabled={!canAdd || allocateMutation.isPending}
                      onClick={() => handleAllocate(s.key)}
                      whileTap={canAdd ? { scale: 0.88 } : {}}
                      className="flex items-center justify-center rounded-lg transition-all duration-200 shrink-0"
                      style={{
                        width: 26,
                        height: 26,
                        background: canAdd ? `${s.color}22` : "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${canAdd ? s.color : "rgba(255,255,255,0.08)"}`,
                        opacity: canAdd ? 1 : 0.3,
                        boxShadow: canAdd ? `0 0 8px ${s.color}35` : "none",
                        cursor: canAdd ? "pointer" : "default",
                      }}
                    >
                      {isPending
                        ? <div
                            className="rounded-full border-2 border-t-transparent animate-spin"
                            style={{ width: 10, height: 10, borderColor: s.color, borderTopColor: "transparent" }}
                          />
                        : <Plus size={12} style={{ color: canAdd ? s.color : "rgba(255,255,255,0.25)" }} />
                      }
                    </motion.button>
                  </div>
                );
              })}

              {statPoints === 0 && (
                <p
                  className="text-[7px] font-mono text-center leading-tight mt-1"
                  style={{ color: "rgba(255,255,255,0.22)" }}
                >
                  Level up to gain points
                </p>
              )}
            </div>
          </div>
        </div>
        {/* END RPG GAME SCREEN */}

        {/* ════════════════════════════════════════════════
            BELOW-FOLD — Phase, Radar, History, Settings
            ════════════════════════════════════════════════ */}
        <div className="relative px-4 pt-5 pb-4 space-y-5" style={{ zIndex: 16 }}>

          {/* Phase & Growth */}
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: `${colors.surface}cc`, border: `1px solid ${colors.surfaceBorder}` }}
          >
            <div>
              <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: colors.textMuted }}>
                Phase {currentPhase}
              </div>
              <div className="text-base font-display font-bold" style={{ color: colors.text }}>{phaseName}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: colors.textMuted }}>Growth</div>
              <div
                className="text-base font-display font-bold"
                style={{ color: colors.primary }}
                data-testid="text-growth-state"
              >
                {growthState}
              </div>
            </div>
          </div>

          {/* Radar chart */}
          {radarValues && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.45 }}
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: `${colors.surface}cc`, border: `1px solid ${colors.surfaceBorder}` }}
              data-testid="sync-profile-card"
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-1">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4" style={{ backgroundColor: colors.primary }} />
                  <h2 className="text-[10px] font-display tracking-widest" style={{ color: colors.primary }}>
                    SYNC PROFILE
                  </h2>
                </div>
                {calibDate && (
                  <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>
                    Calibrated {calibDate}
                  </span>
                )}
              </div>
              <div className="flex justify-center pt-1 pb-2">
                <RadarChart values={radarValues} chartSize={150} color={colors.primary} animate={true} delay={200} />
              </div>
              <div className="grid grid-cols-4 gap-2 px-4 pb-4">
                {STAT_META_RADAR.map((s) => {
                  const val = radarValues[s.key];
                  const pct = Math.round(val);
                  return (
                    <div
                      key={s.key}
                      className="flex flex-col items-center gap-1 py-2 rounded-lg"
                      style={{ background: `${s.color}0a`, border: `1px solid ${s.color}20` }}
                    >
                      <span className="text-[8px] font-mono font-bold tracking-widest" style={{ color: s.color }}>
                        {s.label}
                      </span>
                      <span className="text-[13px] font-mono font-bold tabular-nums" style={{ color: s.color }}>
                        {pct}<span className="text-[9px] ml-0.5" style={{ opacity: 0.55 }}>%</span>
                      </span>
                      <div className="w-full px-1.5">
                        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: `${s.color}18` }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: s.color, boxShadow: `0 0 4px ${s.color}80` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {calibProfile && (
                <div
                  className="px-4 pb-4 pt-1 flex items-center justify-between"
                  style={{ borderTop: `1px solid ${colors.surfaceBorder}` }}
                >
                  <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>Assigned Protocol</span>
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                    style={{
                      color: colors.primary,
                      background: `${colors.primary}12`,
                      border: `1px solid ${colors.primary}20`,
                    }}
                  >
                    {calibProfile.derivedLevel.toUpperCase()}
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* Phase history */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4" style={{ backgroundColor: colors.primary }} />
              <h2 className="text-[10px] font-display tracking-widest" style={{ color: colors.primary }}>
                PHASE HISTORY
              </h2>
            </div>
            {phaseHistory.length === 0 ? (
              <div
                className="rounded-xl px-4 py-5 text-center"
                style={{ backgroundColor: `${colors.surface}cc`, border: `1px solid ${colors.surfaceBorder}` }}
              >
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  No phase advancements yet. Keep training.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {phaseHistory.map((entry, index) => {
                  const entryColor = PHASE_COLORS[entry.phase] || "#00ffff";
                  return (
                    <motion.div
                      key={`phase-${entry.phase}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="rounded-xl p-4 flex items-center justify-between"
                      style={{ backgroundColor: `${colors.surface}cc`, border: `1px solid ${entryColor}30` }}
                      data-testid={`phase-history-${entry.phase}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full border-2 flex items-center justify-center"
                          style={{ borderColor: entryColor }}
                        >
                          <Shield className="w-4 h-4" style={{ color: entryColor }} />
                        </div>
                        <div>
                          <div className="font-display font-bold" style={{ color: entryColor }}>
                            Phase {entry.phase}
                          </div>
                          <div className="text-[10px]" style={{ color: colors.textMuted }}>
                            Cap {PHASE_STAT_CAPS[entry.phase]}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs" style={{ color: colors.textMuted }}>
                          <Calendar className="w-3 h-3" />
                          {entry.date}
                        </div>
                        <button
                          onClick={() => replayPhaseHistory(entry)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ border: `1px solid ${entryColor}30`, backgroundColor: `${entryColor}10` }}
                          data-testid={`button-replay-phase-${entry.phase}`}
                        >
                          <Play className="w-3.5 h-3.5" style={{ color: entryColor }} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Next phase requirements */}
          <div className="text-center text-xs" style={{ color: colors.textMuted }}>
            <div className="mb-1.5 text-[9px] uppercase tracking-widest">Next Phase Requirements</div>
            {currentPhase === 1 && <div>Level 5 · Avg Stat 10 · 7-day streak</div>}
            {currentPhase === 2 && <div>Level 15 · Avg Stat 25 · 14-day streak</div>}
            {currentPhase === 3 && <div>Level 30 · Avg Stat 50 · 14-day streak</div>}
            {currentPhase === 4 && <div>Level 50 · Avg Stat 75 · 14-day streak</div>}
            {currentPhase === 5 && <div>Maximum phase achieved</div>}
          </div>

          {/* Settings */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4" style={{ backgroundColor: colors.primary }} />
              <h2 className="text-[10px] font-display tracking-widest" style={{ color: colors.primary }}>SETTINGS</h2>
            </div>
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${colors.surfaceBorder}` }}
              data-testid="settings-section"
            >
              {SETTINGS_ITEMS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    data-testid={`button-settings-${item.key}`}
                    onClick={() => item.route ? navigate(item.route) : showSettingsToast(item.label)}
                    className="w-full flex items-center justify-between px-4 py-3.5 transition-all active:scale-[0.99]"
                    style={{
                      backgroundColor: `${colors.surface}cc`,
                      borderBottom: i < SETTINGS_ITEMS.length - 1 ? `1px solid ${colors.surfaceBorder}` : "none",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${colors.primary}12`, border: `1px solid ${colors.primary}20` }}
                      >
                        <Icon size={14} style={{ color: colors.primary }} />
                      </div>
                      <span className="text-sm" style={{ color: colors.text }}>{item.label}</span>
                    </div>
                    <ChevronRight size={14} style={{ color: colors.textMuted }} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pb-4" />
        </div>
      </div>
    </SystemLayout>
  );
}
