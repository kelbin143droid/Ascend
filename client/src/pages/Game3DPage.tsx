import React, { useState, useCallback, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { SystemLayout } from '@/components/game/SystemLayout';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Sword, Shield, Eye, Heart, Skull, RotateCcw, Trophy, Package, Gamepad2, Plus } from 'lucide-react';

// ─── Archetype constants ──────────────────────────────────────────────────────

const ARCHETYPE_KEY = "ascend_avatar_archetype";

const ARCHETYPES = [
  { id: "warrior", name: "Warrior", color: "#ef4444", accent: "#fbbf24", tagline: "Born in battle" },
  { id: "sage",    name: "Sage",    color: "#8b5cf6", accent: "#60a5fa", tagline: "Master of mind" },
  { id: "shadow",  name: "Shadow",  color: "#14b8a6", accent: "#94a3b8", tagline: "Unseen force" },
  { id: "warden",  name: "Warden",  color: "#22c55e", accent: "#fbbf24", tagline: "Unbreakable will" },
] as const;

type ArchetypeId = typeof ARCHETYPES[number]["id"];

const CHAR_STATS = [
  { key: "strength" as const, label: "STR", color: "#fbbf24" },
  { key: "agility"  as const, label: "AGI", color: "#34d399" },
  { key: "vitality" as const, label: "VIT", color: "#f87171" },
  { key: "sense"    as const, label: "SEN", color: "#a78bfa" },
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
      <text x="57" y="8"  fill={accent} fontSize="8" opacity="0.55" fontFamily="monospace">◈</text>
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

function HexPedestal({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 160 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[180px]">
      <ellipse cx="80" cy="30" rx="72" ry="22" fill={color} opacity="0.08" />
      <ellipse cx="80" cy="30" rx="52" ry="16" fill={color} opacity="0.12" />
      <polygon points="80,8 116,22 116,42 80,56 44,42 44,22"
        fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />
      <polygon points="80,14 108,26 108,38 80,50 52,38 52,26"
        fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1" strokeOpacity="0.35" />
    </svg>
  );
}

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: `${Math.round((i * 41 + 9) % 100)}%`,
  y: `${Math.round((i * 57 + 13) % 100)}%`,
  size: i % 3 === 0 ? 2 : 1.5,
  delay: `${((i * 0.43) % 2.8).toFixed(1)}s`,
  dur:   `${(2.5 + (i % 4) * 0.6).toFixed(1)}s`,
}));

function ParticleLayer({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {PARTICLES.map((p) => (
        <div key={p.id} className="absolute rounded-full" style={{
          left: p.x, top: p.y, width: p.size, height: p.size,
          backgroundColor: color, opacity: 0.3,
          animation: `g3dParticlePulse ${p.dur} ${p.delay} ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── Dungeon types ────────────────────────────────────────────────────────────

const DUNGEON_STATS = [
  { label: "STR", name: "Strength",  key: "strength", color: "#ef4444", desc: "Increases attack damage" },
  { label: "AGI", name: "Agility",   key: "agility",  color: "#22c55e", desc: "Increases dodge chance" },
  { label: "VIT", name: "Vitality",  key: "vitality", color: "#f59e0b", desc: "Increases max HP" },
  { label: "SEN", name: "Sense",     key: "sense",    color: "#a855f7", desc: "Increases crit chance" },
];

interface Enemy {
  name: string; hp: number; maxHp: number; attack: number; defense: number; xpReward: number; icon: string;
}
interface Room {
  type: 'combat' | 'treasure' | 'empty' | 'boss' | 'start';
  enemy?: Enemy; loot?: { gold: number; item?: string }; explored: boolean;
}
interface CombatLog { message: string; type: 'player' | 'enemy' | 'system'; }

const ENEMY_TEMPLATES = [
  { name: 'Shadow Goblin',  hp: 30,  attack: 5,  defense: 2, xpReward: 15,  icon: '👹' },
  { name: 'Cave Spider',    hp: 20,  attack: 8,  defense: 1, xpReward: 12,  icon: '🕷️' },
  { name: 'Stone Golem',    hp: 60,  attack: 4,  defense: 6, xpReward: 25,  icon: '🗿' },
  { name: 'Dark Mage',      hp: 25,  attack: 12, defense: 2, xpReward: 30,  icon: '🧙' },
  { name: 'Undead Knight',  hp: 50,  attack: 7,  defense: 5, xpReward: 35,  icon: '💀' },
];
const BOSS_TEMPLATE = { name: 'Shadow Monarch', hp: 150, attack: 15, defense: 8, xpReward: 100, icon: '👑' };

function generateDungeon(): Room[][] {
  const dungeon: Room[][] = [];
  const size = 5;
  for (let y = 0; y < size; y++) {
    const row: Room[] = [];
    for (let x = 0; x < size; x++) {
      if (y === 0 && x === 0) {
        row.push({ type: 'start', explored: true });
      } else if (y === size - 1 && x === size - 1) {
        row.push({ type: 'boss', enemy: { ...BOSS_TEMPLATE, maxHp: BOSS_TEMPLATE.hp }, explored: false });
      } else {
        const roll = Math.random();
        if (roll < 0.5) {
          const t = ENEMY_TEMPLATES[Math.floor(Math.random() * ENEMY_TEMPLATES.length)];
          row.push({ type: 'combat', enemy: { ...t, maxHp: t.hp }, explored: false });
        } else if (roll < 0.7) {
          row.push({ type: 'treasure', loot: { gold: Math.floor(Math.random() * 50) + 10 }, explored: false });
        } else {
          row.push({ type: 'empty', explored: false });
        }
      }
    }
    dungeon.push(row);
  }
  return dungeon;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Game3DPage() {
  const { player, gainExp, modifyHp } = useGame();
  const queryClient = useQueryClient();

  // ── Archetype state ──
  const [archetype, setArchetype] = useState<ArchetypeId>(() => {
    try { return (localStorage.getItem(ARCHETYPE_KEY) as ArchetypeId) || "warrior"; } catch { return "warrior"; }
  });
  const [allocatingFor, setAllocatingFor] = useState<string | null>(null);

  const archetypeData = ARCHETYPES.find((a) => a.id === archetype) ?? ARCHETYPES[0];

  const selectArchetype = useCallback((id: ArchetypeId) => {
    setArchetype(id);
    try { localStorage.setItem(ARCHETYPE_KEY, id); } catch { /* noop */ }
  }, []);

  // ── Player data ──
  const { data: playerData, refetch: refetchPlayer } = useQuery<any>({
    queryKey: ["/api/player", player?.id],
    queryFn: async () => {
      if (!player?.id) throw new Error("No player");
      const res = await fetch(`/api/player/${player.id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!player?.id,
    staleTime: 5000,
  });

  const statPoints   = playerData?.statPoints   ?? 0;
  const displayStats = playerData?.displayStats  ?? player?.stats ?? {};
  const withinLevelXP = playerData?.exp    ?? 0;
  const maxXP         = playerData?.maxExp  ?? 100;
  const xpPct         = Math.min(100, Math.round((withinLevelXP / maxXP) * 100));

  // ── Stat allocation ──
  const allocateMutation = useMutation({
    mutationFn: async ({ stat }: { stat: string }) => {
      if (!player?.id) throw new Error("No player");
      const res = await apiRequest("POST", `/api/player/${player.id}/allocate-stat`, { stat, amount: 1 });
      return res.json();
    },
    onSuccess: () => {
      refetchPlayer();
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

  // ── Dungeon state ──
  const [dungeon, setDungeon]           = useState<Room[][]>(() => generateDungeon());
  const [position, setPosition]         = useState({ x: 0, y: 0 });
  const [inCombat, setInCombat]         = useState(false);
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
  const [combatLog, setCombatLog]       = useState<CombatLog[]>([]);
  const [goldCollected, setGoldCollected] = useState(0);
  const [gameOver, setGameOver]         = useState(false);
  const [victory, setVictory]           = useState(false);
  const [playerTurn, setPlayerTurn]     = useState(true);
  const [isDefending, setIsDefending]   = useState(false);
  const [localHp, setLocalHp]           = useState(player?.hp || 100);
  const [gameStarted, setGameStarted]   = useState(false);

  const bonusStats = (playerData?.bonusStats as Record<string, number>) ?? {};
  const stats = player?.stats || { strength: 10, agility: 10, sense: 10, vitality: 10 };
  const derived = {
    damage:      Math.floor(5 + (stats.strength + (bonusStats.strength ?? 0)) * 1.5),
    dodgeChance: Math.min(0.5, (stats.agility + (bonusStats.agility ?? 0)) * 0.02),
    critChance:  Math.min(0.3, (stats.sense + (bonusStats.sense ?? 0)) * 0.015),
    maxHp:       100 + (stats.vitality + (bonusStats.vitality ?? 0)) * 5,
  };

  const addLog = useCallback((message: string, type: CombatLog['type']) => {
    setCombatLog(prev => [...prev.slice(-5), { message, type }]);
  }, []);

  const handleAttack = useCallback(() => {
    if (!currentEnemy || !playerTurn) return;
    const isCrit = Math.random() < derived.critChance;
    const damage = isCrit ? derived.damage * 2 : derived.damage;
    const newEnemyHp = currentEnemy.hp - damage;
    addLog(`You deal ${damage} damage${isCrit ? ' (CRITICAL!)' : ''}`, 'player');
    if (newEnemyHp <= 0) {
      addLog(`${currentEnemy.name} defeated! +${currentEnemy.xpReward} XP`, 'system');
      gainExp(currentEnemy.xpReward);
      setCurrentEnemy(null);
      setInCombat(false);
      const currentRoom = dungeon[position.y]?.[position.x];
      if (currentRoom?.type === 'boss') setVictory(true);
      setDungeon(prev => {
        const newDungeon = [...prev];
        newDungeon[position.y][position.x] = { ...currentRoom!, enemy: undefined, explored: true };
        return newDungeon;
      });
    } else {
      setCurrentEnemy({ ...currentEnemy, hp: newEnemyHp });
      setPlayerTurn(false);
    }
  }, [currentEnemy, playerTurn, derived, addLog, gainExp, dungeon, position]);

  const handleDefend = useCallback(() => {
    if (!playerTurn) return;
    setIsDefending(true);
    addLog('You brace for impact (50% damage reduction)', 'player');
    setPlayerTurn(false);
  }, [playerTurn, addLog]);

  useEffect(() => {
    if (player?.hp !== undefined) setLocalHp(player.hp);
  }, [player?.hp]);

  useEffect(() => {
    if (!playerTurn && currentEnemy && !gameOver) {
      const timer = setTimeout(() => {
        const dodged = Math.random() < derived.dodgeChance;
        if (dodged) {
          addLog(`You dodge ${currentEnemy.name}'s attack!`, 'system');
        } else {
          let baseDamage = Math.max(1, currentEnemy.attack - Math.floor(stats.vitality / 10));
          if (isDefending) { baseDamage = Math.floor(baseDamage * 0.5); addLog('Your defense reduces the blow!', 'system'); }
          addLog(`${currentEnemy.name} hits you for ${baseDamage} damage`, 'enemy');
          modifyHp(-baseDamage);
          const newHp = localHp - baseDamage;
          setLocalHp(newHp);
          if (newHp <= 0) { setGameOver(true); addLog('You have fallen...', 'system'); }
        }
        setIsDefending(false);
        setPlayerTurn(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [playerTurn, currentEnemy, derived.dodgeChance, stats.vitality, addLog, modifyHp, localHp, gameOver, isDefending]);

  const moveToRoom = useCallback((dx: number, dy: number) => {
    if (inCombat || gameOver) return;
    const newX = position.x + dx;
    const newY = position.y + dy;
    if (newX < 0 || newX >= 5 || newY < 0 || newY >= 5) return;
    setPosition({ x: newX, y: newY });
    const room = dungeon[newY][newX];
    setDungeon(prev => {
      const newDungeon = [...prev];
      newDungeon[newY][newX] = { ...room, explored: true };
      return newDungeon;
    });
    if ((room.type === 'combat' || room.type === 'boss') && room.enemy) {
      setCurrentEnemy(room.enemy);
      setInCombat(true);
      setCombatLog([{ message: `${room.enemy.name} appears!`, type: 'system' }]);
      setPlayerTurn(true);
      setIsDefending(false);
    } else if (room.type === 'treasure' && room.loot) {
      const senseBonus = Math.floor(room.loot.gold * (stats.sense * 0.03));
      const totalGold  = room.loot.gold + senseBonus;
      setGoldCollected(prev => prev + totalGold);
      addLog(`Found ${totalGold} gold${senseBonus > 0 ? ` (+${senseBonus} Sense bonus)` : ''}!`, 'system');
      gainExp(5);
      setDungeon(prev => {
        const newDungeon = [...prev];
        newDungeon[newY][newX] = { ...room, type: 'empty', loot: undefined, explored: true };
        return newDungeon;
      });
    }
  }, [inCombat, gameOver, position, dungeon, stats.sense, addLog, gainExp]);

  const resetDungeon = useCallback(() => {
    setDungeon(generateDungeon());
    setPosition({ x: 0, y: 0 });
    setInCombat(false);
    setCurrentEnemy(null);
    setCombatLog([]);
    setGoldCollected(0);
    setGameOver(false);
    setVictory(false);
    setPlayerTurn(true);
    setIsDefending(false);
    setLocalHp(player?.hp || 100);
    setGameStarted(true);
  }, [player?.hp]);

  if (!player) {
    return (
      <SystemLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-primary animate-pulse">Loading...</div>
        </div>
      </SystemLayout>
    );
  }

  const currentRoom = dungeon[position.y]?.[position.x];

  return (
    <SystemLayout>
      <style>{`
        @keyframes g3dParticlePulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50%       { opacity: 0.50; transform: scale(1.7); }
        }
        @keyframes g3dAvatarFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-7px); }
        }
        @keyframes g3dSpotPulse {
          0%, 100% { opacity: 0.50; }
          50%       { opacity: 0.78; }
        }
      `}</style>

      <div className="space-y-4 -mx-4 -mt-6">

        {/* ══════════════════════════════════════════════════════
            RPG CHARACTER SCREEN
            ══════════════════════════════════════════════════════ */}
        <div
          className="relative overflow-hidden"
          style={{
            background: "radial-gradient(ellipse 90% 65% at 50% 42%, #1a2540 0%, #0c1220 45%, #060a12 100%)",
            minHeight: 430,
          }}
        >
          {/* Spotlight */}
          <div className="absolute pointer-events-none" style={{
            left: "50%", top: "42%", transform: "translate(-50%,-50%)",
            width: 300, height: 300, borderRadius: "50%",
            background: `radial-gradient(circle, ${archetypeData.color}20 0%, transparent 70%)`,
            animation: "g3dSpotPulse 4s ease-in-out infinite",
          }} />
          {/* Ground glow */}
          <div className="absolute pointer-events-none" style={{
            left: "50%", bottom: "6%", transform: "translateX(-50%)",
            width: 200, height: 50, borderRadius: "50%",
            background: `radial-gradient(ellipse, ${archetypeData.color}28 0%, transparent 70%)`,
            filter: "blur(10px)",
          }} />

          <ParticleLayer color={archetypeData.color} />

          {/* ── TOP STAT BAR ─────────────────────────────── */}
          <div
            className="relative z-10 flex items-center gap-2 px-3 pt-2.5 pb-2"
            style={{ borderBottom: `1px solid ${archetypeData.color}20` }}
            data-testid="rpg-stat-bar"
          >
            {/* Level */}
            <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg shrink-0"
              style={{ background: `${archetypeData.color}18`, border: `1px solid ${archetypeData.color}40` }}>
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
                <div className="h-full rounded-full transition-all duration-700" style={{
                  width: `${xpPct}%`,
                  background: `linear-gradient(to right, ${archetypeData.color}, ${archetypeData.accent})`,
                  boxShadow: `0 0 8px ${archetypeData.color}80`,
                }} />
              </div>
            </div>
            {/* Stat pills */}
            <div className="flex gap-1 shrink-0">
              {CHAR_STATS.map((s) => (
                <div key={s.key} className="flex flex-col items-center px-1.5 py-1 rounded"
                  style={{ background: `${s.color}12`, border: `1px solid ${s.color}28` }}
                  data-testid={`stat-pill-${s.label.toLowerCase()}`}>
                  <span className="text-[7px] font-mono font-bold" style={{ color: s.color }}>{s.label}</span>
                  <span className="text-[11px] font-mono font-bold tabular-nums leading-none" style={{ color: s.color }}>
                    {displayStats[s.key] ?? 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── 3-COLUMN BODY ────────────────────────────── */}
          <div className="relative z-10 flex items-stretch" style={{ minHeight: 330 }}>

            {/* LEFT — Archetype selector */}
            <div className="flex flex-col items-center justify-center gap-2 py-4 shrink-0"
              style={{ width: 70, borderRight: `1px solid ${archetypeData.color}15` }}>
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
                      width: 58, height: 62,
                      background: isSelected ? `${a.color}22` : "rgba(255,255,255,0.03)",
                      border: `1.5px solid ${isSelected ? a.color : "rgba(255,255,255,0.07)"}`,
                      boxShadow: isSelected ? `0 0 14px ${a.color}40, inset 0 0 10px ${a.color}12` : "none",
                    }}
                  >
                    <div className="w-9 h-10 flex items-end justify-center overflow-hidden">
                      <ArchetypeAvatar id={a.id} color={a.color} accent={a.accent} />
                    </div>
                    <span className="text-[7px] font-mono font-bold uppercase tracking-tight leading-none mt-1"
                      style={{ color: isSelected ? a.color : "rgba(255,255,255,0.3)" }}>
                      {a.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* CENTER — Avatar */}
            <div className="flex-1 flex flex-col items-center justify-end pb-2 px-1 relative overflow-hidden">
              <div className="absolute top-3 left-0 right-0 text-center">
                <span className="text-[8px] font-mono uppercase tracking-[0.2em]"
                  style={{ color: archetypeData.color, opacity: 0.7 }}>
                  {archetypeData.tagline}
                </span>
              </div>
              <motion.div
                key={archetype}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="relative flex items-end justify-center"
                style={{ width: 140, height: 248, animation: "g3dAvatarFloat 5s ease-in-out infinite" }}
                data-testid="avatar-preview"
              >
                <ArchetypeAvatar id={archetype} color={archetypeData.color} accent={archetypeData.accent} />
              </motion.div>
              <div className="w-full flex justify-center -mt-6 relative z-10">
                <HexPedestal color={archetypeData.color} />
              </div>
              <div className="text-center mt-1 relative z-10">
                <span className="text-[11px] font-display font-bold uppercase tracking-[0.18em]"
                  style={{ color: archetypeData.color }}
                  data-testid="archetype-name-label">
                  {archetypeData.name}
                </span>
              </div>
            </div>

            {/* RIGHT — Stat allocation */}
            <div className="flex flex-col justify-center py-4 px-2 shrink-0"
              style={{ width: 90, borderLeft: `1px solid ${archetypeData.color}15` }}>
              <AnimatePresence>
                {statPoints > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className="mb-3 text-center px-1 py-0.5 rounded"
                    style={{ background: `${archetypeData.accent}22`, border: `1px solid ${archetypeData.accent}45` }}
                    data-testid="stat-points-badge"
                  >
                    <span className="text-[8px] font-mono font-bold" style={{ color: archetypeData.accent }}>
                      {statPoints} pts
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {CHAR_STATS.map((s) => {
                const val       = displayStats[s.key] ?? 1;
                const canAdd    = statPoints > 0;
                const isPending = allocatingFor === s.key;
                return (
                  <div key={s.key} className="flex items-center justify-between gap-1.5 mb-2.5"
                    data-testid={`stat-row-${s.label.toLowerCase()}`}>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-[7px] font-mono font-bold uppercase" style={{ color: s.color }}>{s.label}</span>
                      <span className="text-sm font-mono font-bold tabular-nums leading-tight" style={{ color: s.color }}>{val}</span>
                    </div>
                    <motion.button
                      data-testid={`button-allocate-${s.label.toLowerCase()}`}
                      disabled={!canAdd || allocateMutation.isPending}
                      onClick={() => handleAllocate(s.key)}
                      whileTap={canAdd ? { scale: 0.88 } : {}}
                      className="flex items-center justify-center rounded-lg transition-all duration-200 shrink-0"
                      style={{
                        width: 26, height: 26,
                        background: canAdd ? `${s.color}22` : "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${canAdd ? s.color : "rgba(255,255,255,0.08)"}`,
                        opacity: canAdd ? 1 : 0.3,
                        boxShadow: canAdd ? `0 0 8px ${s.color}35` : "none",
                        cursor: canAdd ? "pointer" : "default",
                      }}
                    >
                      {isPending
                        ? <div className="rounded-full border-2 border-t-transparent animate-spin"
                            style={{ width: 10, height: 10, borderColor: s.color, borderTopColor: "transparent" }} />
                        : <Plus size={12} style={{ color: canAdd ? s.color : "rgba(255,255,255,0.25)" }} />
                      }
                    </motion.button>
                  </div>
                );
              })}

              {statPoints === 0 && (
                <p className="text-[7px] font-mono text-center leading-tight mt-1"
                  style={{ color: "rgba(255,255,255,0.22)" }}>
                  Level up to gain points
                </p>
              )}
            </div>
          </div>
        </div>
        {/* END RPG CHARACTER SCREEN */}

        {/* ══════════════════════════════════════════════════════
            DUNGEON GAME
            ══════════════════════════════════════════════════════ */}
        <div className="px-4 space-y-4">
          {!gameStarted ? (
            <div className="rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(34,211,238,0.22)", backgroundColor: "rgba(6,182,212,0.04)" }}>
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ borderBottom: "1px solid rgba(34,211,238,0.12)" }}>
                <Gamepad2 size={14} style={{ color: "#22d3ee" }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#22d3ee" }}>
                  Dungeon — Coming Soon
                </span>
              </div>
              <div className="px-4 py-4 space-y-3">
                <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Your daily habits shape your RPG character. Level up in real life to earn stat points, then allocate them above. The dungeon unlocks as your power grows.
                </p>

                {/* Derived stats */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  {[
                    { icon: <Sword size={10} className="text-red-400" />,    label: "Attack",  val: derived.damage },
                    { icon: <Shield size={10} className="text-blue-400" />,  label: "Dodge",   val: `${(derived.dodgeChance * 100).toFixed(0)}%` },
                    { icon: <Eye size={10} className="text-yellow-400" />,   label: "Crit",    val: `${(derived.critChance * 100).toFixed(0)}%` },
                    { icon: <Heart size={10} className="text-green-400" />,  label: "Max HP",  val: derived.maxHp },
                  ].map(({ icon, label, val }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {icon} {label}
                      </span>
                      <span className="text-[9px] font-mono font-bold" style={{ color: "rgba(34,211,238,0.8)" }}>{val}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setGameStarted(true)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 mt-1 transition-all"
                  style={{
                    background: "linear-gradient(135deg, rgba(34,211,238,0.85), rgba(14,165,233,0.85))",
                    color: "#000d14", letterSpacing: "0.08em",
                    boxShadow: "0 4px 18px rgba(34,211,238,0.22)",
                  }}
                  data-testid="button-start-game"
                >
                  <Gamepad2 size={13} />
                  ENTER DUNGEON
                </button>
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex justify-between items-center border-b-2 border-primary pb-2">
                <div>
                  <h1 className="text-2xl font-display font-black text-primary tracking-tighter">DUNGEON</h1>
                  <p className="text-[10px] text-primary/60 tracking-[0.2em] uppercase">Shadow Gate Instance</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="font-mono">{player.hp}/{player.maxHp}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4 text-yellow-500" />
                    <span className="font-mono">{goldCollected}g</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="system-panel p-4 rounded-sm">
                  <h3 className="text-xs font-bold text-primary/70 mb-3 tracking-wider">DUNGEON MAP</h3>
                  <div className="grid grid-cols-5 gap-1">
                    {dungeon.map((row, y) => row.map((room, x) => {
                      const isPlayer = position.x === x && position.y === y;
                      const canMove  = !inCombat && !gameOver &&
                        ((Math.abs(position.x - x) === 1 && position.y === y) ||
                         (Math.abs(position.y - y) === 1 && position.x === x));
                      return (
                        <button key={`${x}-${y}`} data-testid={`room-${x}-${y}`}
                          onClick={() => canMove && moveToRoom(x - position.x, y - position.y)}
                          disabled={!canMove}
                          className={`
                            aspect-square flex items-center justify-center text-lg rounded border transition-all
                            ${isPlayer ? 'bg-primary text-black border-primary ring-2 ring-primary/50' : ''}
                            ${room.explored && !isPlayer ? 'bg-secondary/50 border-primary/30' : ''}
                            ${!room.explored && !isPlayer ? 'bg-black/50 border-primary/10' : ''}
                            ${canMove ? 'hover:border-primary/60 cursor-pointer hover:bg-primary/20' : ''}
                          `}
                        >
                          {isPlayer ? '🧑' : room.explored ? (
                            room.type === 'combat' && room.enemy ? room.enemy.icon :
                            room.type === 'boss'   && room.enemy ? room.enemy.icon :
                            room.type === 'treasure' ? '📦' :
                            room.type === 'start'    ? '🚪' : '·'
                          ) : '?'}
                        </button>
                      );
                    }))}
                  </div>
                  <div className="mt-4 text-[10px] text-muted-foreground space-y-1">
                    <p>🧑 You | 👹 Enemy | 📦 Treasure | 👑 Boss</p>
                    <p>Click adjacent rooms to move</p>
                  </div>
                </div>

                <div className="system-panel p-4 rounded-sm">
                  <h3 className="text-xs font-bold text-primary/70 mb-3 tracking-wider">YOUR STATS</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2"><Sword className="w-3 h-3 text-red-400" /> Attack</span>
                      <span className="font-mono text-primary">{derived.damage}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2"><Shield className="w-3 h-3 text-blue-400" /> Dodge</span>
                      <span className="font-mono text-primary">{(derived.dodgeChance * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2"><Eye className="w-3 h-3 text-yellow-400" /> Crit</span>
                      <span className="font-mono text-primary">{(derived.critChance * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2"><Heart className="w-3 h-3 text-green-400" /> Max HP</span>
                      <span className="font-mono text-primary">{derived.maxHp}</span>
                    </div>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {inCombat && currentEnemy && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="system-panel p-4 rounded-sm border-2 border-red-500/50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                          <span className="text-2xl">{currentEnemy.icon}</span>
                          {currentEnemy.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-2 w-32 bg-red-950/50 rounded overflow-hidden">
                            <div className="h-full bg-red-500 transition-all"
                              style={{ width: `${(currentEnemy.hp / currentEnemy.maxHp) * 100}%` }} />
                          </div>
                          <span className="text-xs font-mono">{currentEnemy.hp}/{currentEnemy.maxHp}</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>ATK: {currentEnemy.attack} | DEF: {currentEnemy.defense}</p>
                        <p>XP: {currentEnemy.xpReward}</p>
                      </div>
                    </div>
                    <div className="bg-black/30 rounded p-2 mb-4 h-24 overflow-y-auto text-sm font-mono">
                      {combatLog.map((log, i) => (
                        <div key={i} className={
                          log.type === 'player' ? 'text-cyan-400' :
                          log.type === 'enemy'  ? 'text-red-400'  : 'text-yellow-400'
                        }>{log.message}</div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button data-testid="button-attack" onClick={handleAttack} disabled={!playerTurn}
                        className="flex-1 bg-red-600 hover:bg-red-500">
                        ⚔️ Attack
                      </Button>
                      <Button data-testid="button-defend" onClick={handleDefend} disabled={!playerTurn}
                        variant="outline" className="flex-1 border-blue-500/50 text-blue-400 hover:bg-blue-500/20">
                        🛡️ Defend
                      </Button>
                    </div>
                    {!playerTurn && (
                      <p className="text-center text-xs text-muted-foreground mt-2 animate-pulse">
                        Enemy is attacking...
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {!inCombat && !gameOver && !victory && currentRoom?.type === 'empty' && (
                <div className="system-panel p-4 rounded-sm text-center text-muted-foreground">
                  <p>An empty corridor. The shadows seem to watch you...</p>
                </div>
              )}

              <AnimatePresence>
                {(gameOver || victory) && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="system-panel p-8 rounded-sm text-center max-w-md">
                      {victory ? (
                        <>
                          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                          <h2 className="text-2xl font-display font-bold text-primary mb-2">VICTORY!</h2>
                          <p className="text-muted-foreground mb-4">You defeated the Shadow Monarch!</p>
                          <p className="text-lg text-yellow-400 mb-4">Gold collected: {goldCollected}</p>
                        </>
                      ) : (
                        <>
                          <Skull className="w-16 h-16 text-red-500 mx-auto mb-4" />
                          <h2 className="text-2xl font-display font-bold text-red-500 mb-2">DEFEATED</h2>
                          <p className="text-muted-foreground mb-4">You have fallen in the dungeon. Train harder and try again!</p>
                        </>
                      )}
                      <Button data-testid="button-restart" onClick={resetDungeon} className="w-full">
                        <RotateCcw className="w-4 h-4 mr-2" /> Try Again
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </SystemLayout>
  );
}
