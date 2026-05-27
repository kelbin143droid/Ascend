import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useGame } from '@/context/GameContext';
import { SystemLayout } from '@/components/game/SystemLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Sword, Zap, Heart, Brain, Shield, Package, ChevronRight, X, Star, RotateCcw, Check } from 'lucide-react';
import {
  loadRPGState, saveRPGState, getRank, getEvolutionTier,
  dispatchSystemMessage, rollLoot, RARITY_COLORS, RARITY_GLOW,
  DUNGEON_SHADOW_FOREST, type GearItem, type GearSlot, type RPGState,
} from '@/lib/rpgStore';

// ─── Archetype constants ──────────────────────────────────────────────────────
const ARCHETYPE_KEY = 'ascend_avatar_archetype';

const ARCHETYPES = [
  { id: 'warrior', name: 'Warrior', color: '#ef4444', accent: '#fbbf24', tagline: 'Born in battle' },
  { id: 'sage',    name: 'Sage',    color: '#8b5cf6', accent: '#60a5fa', tagline: 'Master of mind'  },
  { id: 'shadow',  name: 'Shadow',  color: '#14b8a6', accent: '#94a3b8', tagline: 'Unseen force'    },
  { id: 'warden',  name: 'Warden',  color: '#22c55e', accent: '#fbbf24', tagline: 'Unbreakable will' },
] as const;
type ArchetypeId = typeof ARCHETYPES[number]['id'];

const STAT_META = [
  { key: 'strength' as const, label: 'STR', color: '#fbbf24', icon: <Sword  size={11} /> },
  { key: 'agility'  as const, label: 'AGI', color: '#34d399', icon: <Zap    size={11} /> },
  { key: 'vitality' as const, label: 'VIT', color: '#f87171', icon: <Heart  size={11} /> },
  { key: 'sense'    as const, label: 'SEN', color: '#a78bfa', icon: <Brain  size={11} /> },
];

// ─── Rank aura config ─────────────────────────────────────────────────────────
const RANK_BADGE_COLOR: Record<string, string> = {
  E: '#94a3b8', D: '#6ee7b7', C: '#22d3ee', B: '#3b82f6', A: '#a855f7', S: '#f59e0b',
};

// ─── SVG character art ────────────────────────────────────────────────────────
function WarriorArt({ color, accent }: { color: string; accent: string }) {
  return (
    <svg viewBox="0 0 120 220" fill="none" className="w-full h-full">
      <ellipse cx="60" cy="185" rx="36" ry="8" fill={color} opacity=".22" />
      <path d="M38 68 Q20 120 24 180 Q38 165 60 170 Q82 165 96 180 Q100 120 82 68Z" fill={color} opacity=".18" />
      <path d="M40 68 Q24 110 28 170 L60 158 L92 170 Q96 110 80 68Z" fill={color} opacity=".30" />
      <rect x="43" y="148" width="14" height="50" rx="4" fill="#1e293b" stroke={color} strokeWidth="1.5" />
      <rect x="63" y="148" width="14" height="50" rx="4" fill="#1e293b" stroke={color} strokeWidth="1.5" />
      <rect x="40" y="188" width="20" height="14" rx="3" fill={color} opacity=".7" />
      <rect x="60" y="188" width="20" height="14" rx="3" fill={color} opacity=".7" />
      <path d="M38 80 L82 80 L86 148 L34 148Z" fill="#1e293b" />
      <path d="M38 80 L82 80 L86 148 L34 148Z" fill={color} opacity=".15" stroke={color} strokeWidth="1.5" />
      <path d="M60 84 L60 144" stroke={accent} strokeWidth="1" opacity=".6" />
      <path d="M38 100 L82 100" stroke={accent} strokeWidth="1" opacity=".35" />
      <polygon points="50,88 60,78 70,88 65,100 55,100" fill={accent} opacity=".4" stroke={accent} strokeWidth="1" />
      <ellipse cx="34" cy="84" rx="12" ry="9" fill={color} opacity=".7" stroke={accent} strokeWidth="1" />
      <ellipse cx="86" cy="84" rx="12" ry="9" fill={color} opacity=".7" stroke={accent} strokeWidth="1" />
      <rect x="22" y="88" width="12" height="44" rx="5" fill="#1e293b" stroke={color} strokeWidth="1.2" />
      <rect x="86" y="88" width="12" height="44" rx="5" fill="#1e293b" stroke={color} strokeWidth="1.2" />
      <rect x="100" y="70" width="5" height="100" rx="2" fill={accent} opacity=".85" />
      <rect x="96" y="108" width="13" height="4" rx="1" fill={color} opacity=".9" />
      <rect x="101" y="64" width="3" height="10" rx="1" fill={accent} />
      <rect x="53" y="56" width="14" height="24" rx="4" fill="#1e293b" stroke={color} strokeWidth="1" />
      <ellipse cx="60" cy="44" rx="22" ry="22" fill="#1e293b" stroke={color} strokeWidth="2" />
      <path d="M40 38 L80 38 L80 52 Q60 58 40 52Z" fill={color} opacity=".5" />
      <path d="M46 44 L74 44" stroke={accent} strokeWidth="2" opacity=".8" />
      <ellipse cx="51" cy="40" rx="5" ry="3" fill={accent} opacity=".9" />
      <ellipse cx="69" cy="40" rx="5" ry="3" fill={accent} opacity=".9" />
      <path d="M52 24 L60 10 L68 24" fill={accent} opacity=".6" />
    </svg>
  );
}

function SageArt({ color, accent }: { color: string; accent: string }) {
  return (
    <svg viewBox="0 0 120 220" fill="none" className="w-full h-full">
      <ellipse cx="60" cy="185" rx="34" ry="8" fill={color} opacity=".20" />
      <path d="M44 80 Q30 100 24 190 L96 190 Q90 100 76 80Z" fill="#1e293b" stroke={color} strokeWidth="1.5" />
      <path d="M60 90 L60 180" stroke={color} strokeWidth="1" opacity=".4" />
      <circle cx="60" cy="118" r="14" stroke={accent} strokeWidth="1.2" opacity=".6" fill="none" />
      <circle cx="60" cy="118" r="8" stroke={color} strokeWidth="1" opacity=".8" fill={color} fillOpacity=".1" />
      <polygon points="60,108 67,122 53,122" fill="none" stroke={accent} strokeWidth="1" opacity=".7" />
      <rect x="14" y="30" width="5" height="160" rx="2" fill={color} opacity=".7" />
      <circle cx="16" cy="30" r="6" fill={accent} opacity=".7" />
      <path d="M44 90 Q28 110 22 130" stroke={color} strokeWidth="10" strokeLinecap="round" opacity=".5" />
      <path d="M76 90 Q88 108 88 128" stroke={color} strokeWidth="10" strokeLinecap="round" opacity=".5" />
      <circle cx="90" cy="128" r="6" fill={accent} opacity=".65" />
      <rect x="54" y="56" width="12" height="24" rx="4" fill="#1e293b" />
      <ellipse cx="60" cy="44" rx="20" ry="22" fill="#1e293b" stroke={color} strokeWidth="1.8" />
      <path d="M36 44 Q38 16 60 14 Q82 16 84 44 Q74 36 60 36 Q46 36 36 44Z" fill={color} opacity=".6" />
      <ellipse cx="52" cy="42" rx="4" ry="3" fill={accent} opacity=".9" />
      <ellipse cx="68" cy="42" rx="4" ry="3" fill={accent} opacity=".9" />
      <text x="57" y="8" fill={accent} fontSize="8" opacity=".55" fontFamily="monospace">◈</text>
    </svg>
  );
}

function ShadowArt({ color, accent }: { color: string; accent: string }) {
  return (
    <svg viewBox="0 0 120 220" fill="none" className="w-full h-full">
      <ellipse cx="62" cy="185" rx="32" ry="7" fill={color} opacity=".20" />
      <path d="M38 72 Q18 108 22 182 L62 168 L98 178 Q104 114 84 72Z" fill="#0f172a" stroke={color} strokeWidth="1.2" opacity=".9" />
      <path d="M62 80 L62 170" stroke={color} strokeWidth="1" opacity=".25" />
      <rect x="42" y="152" width="13" height="46" rx="4" fill="#0f172a" stroke={color} strokeWidth="1.2" />
      <rect x="66" y="156" width="13" height="42" rx="4" fill="#0f172a" stroke={color} strokeWidth="1.2" />
      <rect x="38" y="190" width="20" height="12" rx="3" fill={color} opacity=".6" />
      <rect x="62" y="192" width="20" height="10" rx="3" fill={color} opacity=".6" />
      <path d="M40 78 L84 78 L86 152 L36 152Z" fill="#0f172a" stroke={color} strokeWidth="1.2" />
      <path d="M40 84 L84 100" stroke={accent} strokeWidth="1.5" opacity=".6" />
      <path d="M84 84 L40 100" stroke={accent} strokeWidth="1.5" opacity=".6" />
      <path d="M24 92 L24 140" stroke={accent} strokeWidth="3" strokeLinecap="round" opacity=".8" />
      <path d="M96 100 L96 142" stroke={accent} strokeWidth="3" strokeLinecap="round" opacity=".8" />
      <rect x="24" y="82" width="16" height="40" rx="5" fill="#0f172a" stroke={color} strokeWidth="1" />
      <rect x="80" y="82" width="16" height="40" rx="5" fill="#0f172a" stroke={color} strokeWidth="1" />
      <ellipse cx="61" cy="44" rx="21" ry="22" fill="#0f172a" stroke={color} strokeWidth="1.8" />
      <path d="M40 40 Q42 18 61 16 Q80 18 82 40 Q72 34 61 34 Q50 34 40 40Z" fill={color} opacity=".25" />
      <ellipse cx="52" cy="43" rx="5" ry="2.5" fill={color} opacity=".95" />
      <ellipse cx="70" cy="43" rx="5" ry="2.5" fill={color} opacity=".95" />
    </svg>
  );
}

function WardenArt({ color, accent }: { color: string; accent: string }) {
  return (
    <svg viewBox="0 0 120 220" fill="none" className="w-full h-full">
      <ellipse cx="60" cy="185" rx="38" ry="9" fill={color} opacity=".22" />
      <rect x="38" y="150" width="16" height="50" rx="5" fill="#1e293b" stroke={color} strokeWidth="1.5" />
      <rect x="66" y="150" width="16" height="50" rx="5" fill="#1e293b" stroke={color} strokeWidth="1.5" />
      <rect x="35" y="172" width="22" height="28" rx="4" fill={color} opacity=".65" />
      <rect x="63" y="172" width="22" height="28" rx="4" fill={color} opacity=".65" />
      <path d="M34 78 L86 78 L90 152 L30 152Z" fill="#1e293b" stroke={color} strokeWidth="1.8" />
      <path d="M60 80 L60 148" stroke={accent} strokeWidth="1.2" opacity=".5" />
      <path d="M44 80 L60 68 L76 80 L76 110 Q60 120 44 110Z" fill={color} opacity=".35" stroke={accent} strokeWidth="1" />
      <ellipse cx="30" cy="82" rx="14" ry="11" fill={color} opacity=".75" stroke={accent} strokeWidth="1.2" />
      <ellipse cx="90" cy="82" rx="14" ry="11" fill={color} opacity=".75" stroke={accent} strokeWidth="1.2" />
      <rect x="16" y="86" width="14" height="50" rx="5" fill="#1e293b" stroke={color} strokeWidth="1.2" />
      <rect x="90" y="86" width="14" height="50" rx="5" fill="#1e293b" stroke={color} strokeWidth="1.2" />
      <path d="M4 86 Q4 130 4 130 Q4 152 16 158 Q28 152 28 130 L28 86Z" fill={color} opacity=".55" stroke={accent} strokeWidth="1.5" />
      <rect x="52" y="56" width="16" height="22" rx="4" fill="#1e293b" stroke={color} strokeWidth="1" />
      <ellipse cx="60" cy="44" rx="23" ry="22" fill="#1e293b" stroke={color} strokeWidth="2" />
      <path d="M37 46 L83 46 L83 60 Q60 66 37 60Z" fill={color} opacity=".55" />
      <path d="M37 46 L83 46 L83 34 Q60 22 37 34Z" fill={color} opacity=".55" />
      <ellipse cx="52" cy="48" rx="4" ry="2.5" fill={accent} opacity=".95" />
      <ellipse cx="68" cy="48" rx="4" ry="2.5" fill={accent} opacity=".95" />
      <rect x="57" y="12" width="6" height="22" rx="2" fill={accent} opacity=".7" />
    </svg>
  );
}

function ArchetypeAvatar({ id, color, accent }: { id: ArchetypeId; color: string; accent: string }) {
  if (id === 'warrior') return <WarriorArt color={color} accent={accent} />;
  if (id === 'sage')    return <SageArt    color={color} accent={accent} />;
  if (id === 'shadow')  return <ShadowArt  color={color} accent={accent} />;
  return                        <WardenArt  color={color} accent={accent} />;
}

function HexPedestal({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 160 60" fill="none" className="w-full max-w-[180px]">
      <ellipse cx="80" cy="30" rx="72" ry="22" fill={color} opacity=".08" />
      <polygon points="80,8 116,22 116,42 80,56 44,42 44,22"
        fill={color} fillOpacity=".12" stroke={color} strokeWidth="1.5" strokeOpacity=".5" />
      <polygon points="80,14 108,26 108,38 80,50 52,38 52,26"
        fill={color} fillOpacity=".08" stroke={color} strokeWidth="1" strokeOpacity=".35" />
    </svg>
  );
}

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i, x: `${(i * 47 + 7) % 100}%`, y: `${(i * 61 + 11) % 100}%`,
  s: i % 3 === 0 ? 2 : 1.5, delay: `${((i * 0.41) % 2.8).toFixed(1)}s`, dur: `${(2.4 + (i % 4) * 0.6).toFixed(1)}s`,
}));

// ─── Rank Aura ────────────────────────────────────────────────────────────────
function RankAura({ rank, color }: { rank: string; color: string }) {
  const tier = getEvolutionTier(rank);
  if (tier.auraLayers === 0) return null;
  return (
    <>
      {Array.from({ length: tier.auraLayers }).map((_, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none" style={{
          inset: -16 - i * 12,
          background: `radial-gradient(circle, ${color}${i === 0 ? '28' : '14'} 0%, transparent 65%)`,
          animation: `g3dAuraPulse ${2.8 + i * 0.7}s ${i * 0.4}s ease-in-out infinite`,
        }} />
      ))}
      {tier.legendaryEffect && (
        <div className="absolute rounded-full pointer-events-none" style={{
          inset: -8, border: `2px solid ${color}55`,
          animation: 'g3dAuraPulse 1.8s ease-in-out infinite',
          boxShadow: `0 0 24px ${color}60`,
        }} />
      )}
    </>
  );
}

// ─── Evolution overlay ────────────────────────────────────────────────────────
function EvolutionOverlay({ fromRank, toRank, onClose }: { fromRank: string; toRank: string; onClose: () => void }) {
  const tier = getEvolutionTier(toRank);
  useEffect(() => { const t = setTimeout(onClose, 4200); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9990] flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
        className="flex flex-col items-center gap-4 px-8"
      >
        <div className="text-5xl" style={{ filter: `drop-shadow(0 0 24px ${tier.color})` }}>◈</div>
        <div className="font-mono font-bold text-center tracking-[0.22em] uppercase"
          style={{ fontSize: 11, color: tier.color, opacity: 0.7 }}>
          EVOLUTION DETECTED
        </div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="font-display font-black text-center uppercase"
          style={{ fontSize: 28, color: tier.color, textShadow: `0 0 32px ${tier.glow}`, letterSpacing: '0.1em' }}>
          {tier.label}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="font-mono text-center" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em' }}>
          RANK {fromRank} → RANK {toRank} · AWAKENING COMPLETE
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─── Battle log generator ─────────────────────────────────────────────────────
function getBattleEvents(archName: string): string[] {
  return [
    '▶ Entering Shadow Forest...',
    '⚠ Shadow Sprite detected — engaging!',
    `⚔ ${archName} strikes — critical hit!`,
    '✓ Shadow Sprite eliminated. +12 XP',
    '⚠ Dark Wolf closing in...',
    '⚡ Skill activated — Shadow Step!',
    `⚔ ${archName} delivers a finishing blow!`,
    '✓ Dark Wolf eliminated. +18 XP',
    '⚠ BOSS DETECTED — FANG WOLF!',
    '⚔ Fang Wolf lunges — dodge successful!',
    `⚔ ${archName} — ULTIMATE STRIKE!`,
    '✓ FANG WOLF DEFEATED. Dungeon cleared!',
  ];
}

// ─── Gear detail card ─────────────────────────────────────────────────────────
function GearDetail({ item, equipped, onEquip, onClose }: {
  item: GearItem; equipped: boolean;
  onEquip: () => void; onClose: () => void;
}) {
  const rc = RARITY_COLORS[item.rarity];
  const rg = RARITY_GLOW[item.rarity];
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="fixed inset-x-4 bottom-24 z-50 rounded-2xl p-4"
      style={{ background: 'rgba(8,14,28,0.97)', border: `1px solid ${rc}50`, boxShadow: `0 0 32px ${rg}` }}>
      <button onClick={onClose} className="absolute top-3 right-3 opacity-50"><X size={16} style={{ color: '#fff' }} /></button>
      <div className="flex items-start gap-3">
        <div className="text-4xl" style={{ filter: `drop-shadow(0 0 8px ${rc})` }}>{item.icon}</div>
        <div className="flex-1">
          <div className="font-display font-bold text-base" style={{ color: rc }}>{item.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ color: rc, background: `${rc}18`, border: `1px solid ${rc}30` }}>
              {item.rarity}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {item.slot}
            </span>
          </div>
          <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{item.description}</p>
          <div className="flex gap-3 mt-2">
            {Object.entries(item.stats).map(([stat, val]) => (
              <div key={stat} className="flex items-center gap-1">
                <span className="text-[10px] font-mono font-bold" style={{ color: STAT_META.find(s => s.key === stat)?.color ?? '#fff' }}>
                  +{val} {STAT_META.find(s => s.key === stat)?.label ?? stat.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button onClick={onEquip}
        className="w-full mt-3 py-2.5 rounded-xl font-bold text-sm"
        style={{
          background: equipped ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${rc}cc, ${rc}88)`,
          color: equipped ? 'rgba(255,255,255,0.4)' : '#fff',
          border: `1px solid ${rc}40`,
        }}>
        {equipped ? 'EQUIPPED' : 'EQUIP'}
      </button>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Game3DPage() {
  const { player, gainExp } = useGame();
  const queryClient = useQueryClient();

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<'character' | 'dungeon' | 'gear'>('character');

  // ── Archetype ──
  const [archetype, setArchetype] = useState<ArchetypeId>(() => {
    try { return (localStorage.getItem(ARCHETYPE_KEY) as ArchetypeId) || 'warrior'; } catch { return 'warrior'; }
  });
  const archetypeData = ARCHETYPES.find(a => a.id === archetype) ?? ARCHETYPES[0];

  const selectArchetype = useCallback((id: ArchetypeId) => {
    setArchetype(id);
    try { localStorage.setItem(ARCHETYPE_KEY, id); } catch { /* noop */ }
  }, []);

  // ── Player data ──
  const { data: playerData, refetch: refetchPlayer } = useQuery<any>({
    queryKey: ['/api/player', player?.id],
    queryFn: async () => {
      if (!player?.id) throw new Error('No player');
      const res = await fetch(`/api/player/${player.id}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!player?.id,
    staleTime: 5000,
  });

  const statPoints  = playerData?.statPoints  ?? 0;
  const displayStats = playerData?.displayStats ?? player?.stats ?? {};
  const withinXP    = playerData?.exp   ?? 0;
  const maxXP       = playerData?.maxExp ?? 100;
  const xpPct       = Math.min(100, Math.round((withinXP / maxXP) * 100));
  const level       = player?.level ?? 1;
  const rank        = getRank(level);
  const evTier      = getEvolutionTier(rank);

  // ── Evolution detection ──
  const [showEvolution, setShowEvolution] = useState(false);
  const [evoFrom, setEvoFrom] = useState('E');
  const [evoTo, setEvoTo]   = useState('E');
  const prevRankRef = useRef<string>(rank);

  useEffect(() => {
    const lastRank = localStorage.getItem('ascend_last_rank') ?? 'E';
    if (lastRank !== rank) {
      setEvoFrom(lastRank);
      setEvoTo(rank);
      setShowEvolution(true);
      dispatchSystemMessage({ type: 'evolution', title: 'RANK UP', subtitle: `${lastRank} → ${rank} · ${evTier.label}`, icon: '◈', color: evTier.color });
      localStorage.setItem('ascend_last_rank', rank);
    } else {
      localStorage.setItem('ascend_last_rank', rank);
    }
    prevRankRef.current = rank;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rank]);

  // ── Stat allocation ──
  const [allocatingFor, setAllocatingFor] = useState<string | null>(null);
  const allocateMutation = useMutation({
    mutationFn: async ({ stat }: { stat: string }) => {
      if (!player?.id) throw new Error('No player');
      const res = await apiRequest('POST', `/api/player/${player.id}/allocate-stat`, { stat, amount: 1 });
      return res.json();
    },
    onSuccess: (_data, { stat }) => {
      refetchPlayer();
      queryClient.invalidateQueries({ queryKey: ['/api/player'] });
      setAllocatingFor(null);
      const s = STAT_META.find(m => m.key === stat);
      if (s) {
        dispatchSystemMessage({
          type: 'stat_gain',
          title: `${s.label} INCREASED`,
          subtitle: `${s.label} +1 · STAT POINT ALLOCATED`,
          color: s.color,
        });
      }
    },
    onError: () => setAllocatingFor(null),
  });

  // ── RPG state (gear / dungeon) ──
  const [rpgState, setRpgStateRaw] = useState<RPGState>(() => loadRPGState());
  const setRpgState = useCallback((updater: (s: RPGState) => RPGState) => {
    setRpgStateRaw(prev => {
      const next = updater(prev);
      saveRPGState(next);
      return next;
    });
  }, []);

  // ── Dungeon ──
  type DPhase = 'idle' | 'briefing' | 'battle' | 'results';
  const [dungeonPhase, setDungeonPhase] = useState<DPhase>('idle');
  const [battleProgress, setBattleProgress] = useState(0);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [runResult, setRunResult] = useState<{ xp: number; gold: number; gear?: GearItem } | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const dungeon = DUNGEON_SHADOW_FOREST;
  const cooldownMs = dungeon.cooldownMs;
  const lastDungeonAt = rpgState.lastDungeonAt;
  const cooldownRemaining = Math.max(0, lastDungeonAt + cooldownMs - Date.now());
  const onCooldown = cooldownRemaining > 0;

  const startBattle = useCallback(() => {
    setDungeonPhase('battle');
    setBattleProgress(0);
    setBattleLog([]);
    const events = getBattleEvents(archetypeData.name);
    const totalDur = 18000;
    const interval = totalDur / events.length;
    events.forEach((evt, i) => {
      setTimeout(() => {
        setBattleLog(prev => [...prev, evt]);
        setBattleProgress(Math.round(((i + 1) / events.length) * 100));
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
      }, i * interval);
    });
    setTimeout(() => {
      const statBonus = (displayStats.strength ?? 1) + (displayStats.agility ?? 1);
      const xp   = Math.floor(dungeon.baseXP + statBonus * 1.5 + Math.random() * 30);
      const gold = Math.floor(dungeon.baseGold + statBonus + Math.random() * 20);
      const gear = rollLoot(dungeon.lootTable);
      const result = { xp, gold, gear };
      setRunResult(result);
      setDungeonPhase('results');
      setRpgState(s => ({ ...s, lastDungeonAt: Date.now() }));
    }, totalDur + 400);
  }, [archetypeData.name, displayStats, dungeon, setRpgState]);

  const collectRewards = useCallback(() => {
    if (!runResult) return;
    gainExp(runResult.xp);
    if (runResult.gear) {
      setRpgState(s => ({ ...s, inventory: [...s.inventory, runResult.gear!] }));
      dispatchSystemMessage({ type: 'gear', title: 'GEAR FOUND', subtitle: `${runResult.gear.name} — ${runResult.gear.rarity.toUpperCase()}`, icon: '◆', color: RARITY_COLORS[runResult.gear.rarity] });
    }
    dispatchSystemMessage({ type: 'dungeon', title: 'DUNGEON CLEARED', subtitle: `+${runResult.xp} XP · +${runResult.gold}G`, icon: '⚔' });
    setRunResult(null);
    setDungeonPhase('idle');
  }, [runResult, gainExp, setRpgState]);

  // ── Gear management ──
  const [selectedGear, setSelectedGear] = useState<GearItem | null>(null);

  const equipGear = useCallback((item: GearItem) => {
    setRpgState(s => {
      const oldEquipped = s.equipped[item.slot];
      const newInventory = s.inventory.filter(g => g.id !== item.id);
      if (oldEquipped) newInventory.push(oldEquipped);
      return { ...s, equipped: { ...s.equipped, [item.slot]: item }, inventory: newInventory };
    });
    setSelectedGear(null);
    dispatchSystemMessage({ type: 'gear', title: 'GEAR EQUIPPED', subtitle: item.name, icon: '◆', color: RARITY_COLORS[item.rarity] });
  }, [setRpgState]);

  const unequipGear = useCallback((slot: GearSlot) => {
    setRpgState(s => {
      const item = s.equipped[slot];
      if (!item) return s;
      const { [slot]: _, ...rest } = s.equipped;
      return { ...s, equipped: rest, inventory: [...s.inventory, item] };
    });
  }, [setRpgState]);

  if (!player) {
    return (
      <SystemLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-primary animate-pulse">Loading...</div>
        </div>
      </SystemLayout>
    );
  }

  const equippedGearBonuses = Object.values(rpgState.equipped).reduce((acc, g) => {
    if (!g) return acc;
    Object.entries(g.stats).forEach(([k, v]) => { acc[k] = (acc[k] || 0) + (v ?? 0); });
    return acc;
  }, {} as Record<string, number>);

  const SLOTS: { slot: GearSlot; label: string; icon: React.ReactNode }[] = [
    { slot: 'weapon',    label: 'Weapon',    icon: <Sword  size={14} /> },
    { slot: 'armor',     label: 'Armor',     icon: <Shield size={14} /> },
    { slot: 'accessory', label: 'Accessory', icon: <Star   size={14} /> },
  ];

  return (
    <SystemLayout>
      <style>{`
        @keyframes g3dParticle { 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:.55;transform:scale(1.8)} }
        @keyframes g3dFloat    { 0%,100%{transform:translateY(0)}        50%{transform:translateY(-8px)}        }
        @keyframes g3dAuraPulse{ 0%,100%{opacity:.45;transform:scale(1)} 50%{opacity:.80;transform:scale(1.05)} }
        @keyframes g3dScan     { 0%{transform:translateY(-100%)}         100%{transform:translateY(400%)}       }
        @keyframes g3dBlink    { 0%,100%{opacity:1}                       50%{opacity:.3}                       }
      `}</style>

      {/* Evolution overlay */}
      <AnimatePresence>
        {showEvolution && (
          <EvolutionOverlay fromRank={evoFrom} toRank={evoTo} onClose={() => setShowEvolution(false)} />
        )}
      </AnimatePresence>

      {/* Gear detail */}
      <AnimatePresence>
        {selectedGear && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setSelectedGear(null)} />
            <GearDetail
              item={selectedGear}
              equipped={Object.values(rpgState.equipped).some(g => g?.id === selectedGear.id)}
              onEquip={() => equipGear(selectedGear)}
              onClose={() => setSelectedGear(null)}
            />
          </>
        )}
      </AnimatePresence>

      <div className="-mx-4 -mt-6">

        {/* ══ CHARACTER SCREEN (always visible at top) ══════════════════════ */}
        <div className="relative overflow-hidden"
          style={{ background: 'radial-gradient(ellipse 90% 65% at 50% 42%, #1a2540 0%, #0c1220 45%, #060a12 100%)', minHeight: 420 }}>

          {/* Spotlight + particles */}
          <div className="absolute pointer-events-none" style={{
            left: '50%', top: '44%', transform: 'translate(-50%,-50%)',
            width: 280, height: 280, borderRadius: '50%',
            background: `radial-gradient(circle, ${archetypeData.color}22 0%, transparent 70%)`,
          }} />
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {PARTICLES.map(p => (
              <div key={p.id} className="absolute rounded-full" style={{
                left: p.x, top: p.y, width: p.s, height: p.s,
                backgroundColor: archetypeData.color, opacity: 0.25,
                animation: `g3dParticle ${p.dur} ${p.delay} ease-in-out infinite`,
              }} />
            ))}
          </div>

          {/* Scan line */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
            <div className="w-full h-2 blur-sm" style={{
              background: `linear-gradient(transparent, ${archetypeData.color}, transparent)`,
              animation: 'g3dScan 6s linear infinite',
            }} />
          </div>

          {/* ── TOP STAT BAR ─────────────────────────── */}
          <div className="relative z-10 flex items-center gap-2 px-3 pt-2.5 pb-2"
            style={{ borderBottom: `1px solid ${archetypeData.color}20` }}>
            {/* Rank badge */}
            <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg shrink-0"
              style={{ background: `${RANK_BADGE_COLOR[rank]}18`, border: `1px solid ${RANK_BADGE_COLOR[rank]}44` }}>
              <span className="text-[7px] font-mono uppercase tracking-widest" style={{ color: RANK_BADGE_COLOR[rank] }}>RANK</span>
              <span className="text-xl font-display font-black leading-none" style={{ color: RANK_BADGE_COLOR[rank] }}>{rank}</span>
            </div>
            {/* Name + XP */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-mono font-bold truncate" style={{ color: archetypeData.color }}>
                  {player.name || 'AWAKENED'}
                </span>
                <span className="text-[8px] font-mono shrink-0 ml-1" style={{ color: `${archetypeData.color}99` }}>
                  Lv {level} · {withinXP}/{maxXP}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: `${archetypeData.color}16` }}>
                <motion.div className="h-full rounded-full"
                  animate={{ width: `${xpPct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                  style={{ background: `linear-gradient(to right, ${archetypeData.color}, ${archetypeData.accent})`, boxShadow: `0 0 8px ${archetypeData.color}80` }} />
              </div>
              {/* Evolution tier label */}
              <div className="text-[7px] font-mono mt-0.5" style={{ color: evTier.color, opacity: 0.75, letterSpacing: '0.12em' }}>
                {evTier.label.toUpperCase()}
              </div>
            </div>
            {/* Stat pills */}
            <div className="flex gap-1 shrink-0">
              {STAT_META.map(s => (
                <div key={s.key} className="flex flex-col items-center px-1.5 py-1 rounded"
                  style={{ background: `${s.color}10`, border: `1px solid ${s.color}26` }}>
                  <span className="text-[7px] font-mono font-bold" style={{ color: s.color }}>{s.label}</span>
                  <span className="text-[11px] font-mono font-bold leading-none tabular-nums" style={{ color: s.color }}>
                    {(displayStats[s.key] ?? 1) + (equippedGearBonuses[s.key] ?? 0)}
                  </span>
                  {(equippedGearBonuses[s.key] ?? 0) > 0 && (
                    <span className="text-[6px] font-mono" style={{ color: `${s.color}99` }}>
                      +{equippedGearBonuses[s.key]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── 3-COLUMN BODY ──────────────────────────── */}
          <div className="relative z-10 flex items-stretch" style={{ minHeight: 310 }}>

            {/* LEFT — Archetype selector */}
            <div className="flex flex-col items-center justify-center gap-2 py-4 shrink-0"
              style={{ width: 68, borderRight: `1px solid ${archetypeData.color}14` }}>
              {ARCHETYPES.map(a => {
                const sel = a.id === archetype;
                return (
                  <motion.button key={a.id} data-testid={`button-archetype-${a.id}`}
                    onClick={() => selectArchetype(a.id)} whileTap={{ scale: 0.9 }}
                    className="relative flex flex-col items-center justify-center rounded-xl"
                    style={{
                      width: 56, height: 60,
                      background: sel ? `${a.color}20` : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${sel ? a.color : 'rgba(255,255,255,0.07)'}`,
                      boxShadow: sel ? `0 0 16px ${a.color}40, inset 0 0 12px ${a.color}10` : 'none',
                      transition: 'all 0.25s ease',
                    }}>
                    <div className="w-8 h-9 flex items-end justify-center overflow-hidden">
                      <ArchetypeAvatar id={a.id} color={a.color} accent={a.accent} />
                    </div>
                    <span className="text-[7px] font-mono font-bold uppercase tracking-tight leading-none mt-0.5"
                      style={{ color: sel ? a.color : 'rgba(255,255,255,0.28)' }}>
                      {a.name}
                    </span>
                    {sel && (
                      <motion.div layoutId="archetype-indicator"
                        className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                        style={{ background: a.color, boxShadow: `0 0 8px ${a.color}` }} />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* CENTER — Animated character */}
            <div className="flex-1 flex flex-col items-center justify-end pb-2 px-1 relative overflow-hidden">
              <div className="absolute top-2 left-0 right-0 text-center">
                <span className="text-[8px] font-mono uppercase tracking-[0.18em]"
                  style={{ color: archetypeData.color, opacity: 0.6 }}>
                  {archetypeData.tagline}
                </span>
              </div>

              {/* Character with aura */}
              <motion.div key={archetype} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }} className="relative flex items-end justify-center"
                style={{ width: 140, height: 240, animation: 'g3dFloat 5s ease-in-out infinite' }}>
                <RankAura rank={rank} color={evTier.color} />
                <ArchetypeAvatar id={archetype} color={archetypeData.color} accent={archetypeData.accent} />
                {/* Eye glow effect for higher ranks */}
                {['B','A','S'].includes(rank) && (
                  <div className="absolute" style={{
                    top: '20%', left: '50%', transform: 'translateX(-50%)',
                    width: 6, height: 3, borderRadius: '50%',
                    background: evTier.color, filter: `blur(2px)`,
                    animation: 'g3dBlink 3s ease-in-out infinite',
                  }} />
                )}
              </motion.div>

              <div className="w-full flex justify-center -mt-5 relative z-10">
                <HexPedestal color={archetypeData.color} />
              </div>
              <div className="text-center mt-0.5 relative z-10">
                <span className="text-[11px] font-display font-bold uppercase tracking-[0.18em]"
                  style={{ color: archetypeData.color }} data-testid="archetype-name-label">
                  {archetypeData.name}
                </span>
              </div>
            </div>

            {/* RIGHT — Stat allocation */}
            <div className="flex flex-col justify-center py-4 px-2 shrink-0"
              style={{ width: 88, borderLeft: `1px solid ${archetypeData.color}14` }}>
              <AnimatePresence>
                {statPoints > 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="mb-3 py-1 px-1.5 rounded text-center"
                    style={{ background: `${archetypeData.accent}20`, border: `1px solid ${archetypeData.accent}40` }}
                    data-testid="stat-points-badge">
                    <span className="text-[8px] font-mono font-bold" style={{ color: archetypeData.accent, animation: 'g3dBlink 2s ease-in-out infinite' }}>
                      {statPoints} PTS FREE
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {STAT_META.map(s => {
                const base    = displayStats[s.key] ?? 1;
                const bonus   = equippedGearBonuses[s.key] ?? 0;
                const total   = base + bonus;
                const canAdd  = statPoints > 0;
                const pending = allocatingFor === s.key;
                return (
                  <div key={s.key} className="mb-3" data-testid={`stat-row-${s.label.toLowerCase()}`}>
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span style={{ color: s.color, opacity: 0.7 }}>{s.icon}</span>
                          <span className="text-[7px] font-mono font-bold uppercase" style={{ color: s.color }}>{s.label}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-mono font-bold leading-tight" style={{ color: s.color }}>{total}</span>
                          {bonus > 0 && <span className="text-[7px] font-mono" style={{ color: `${s.color}80` }}>+{bonus}</span>}
                        </div>
                      </div>
                      <motion.button data-testid={`button-allocate-${s.label.toLowerCase()}`}
                        disabled={!canAdd || allocateMutation.isPending}
                        onClick={() => { if (!canAdd) return; setAllocatingFor(s.key); allocateMutation.mutate({ stat: s.key }); }}
                        whileTap={canAdd ? { scale: 0.85 } : {}}
                        className="flex items-center justify-center rounded-lg shrink-0"
                        style={{
                          width: 26, height: 26,
                          background: canAdd ? `${s.color}20` : 'rgba(255,255,255,0.03)',
                          border: `1.5px solid ${canAdd ? s.color : 'rgba(255,255,255,0.07)'}`,
                          opacity: canAdd ? 1 : 0.28,
                          boxShadow: canAdd ? `0 0 10px ${s.color}35` : 'none',
                          cursor: canAdd ? 'pointer' : 'default',
                        }}>
                        {pending
                          ? <div className="rounded-full border-2 border-t-transparent animate-spin w-3 h-3"
                              style={{ borderColor: s.color, borderTopColor: 'transparent' }} />
                          : <Plus size={12} style={{ color: canAdd ? s.color : 'rgba(255,255,255,0.2)' }} />
                        }
                      </motion.button>
                    </div>
                    {/* Mini progress bar (stat level visualization) */}
                    <div className="mt-1 w-full h-[3px] rounded-full overflow-hidden" style={{ background: `${s.color}12` }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, total)}%`, background: s.color, boxShadow: `0 0 4px ${s.color}` }} />
                    </div>
                  </div>
                );
              })}
              {statPoints === 0 && (
                <p className="text-[7px] font-mono text-center leading-tight mt-1"
                  style={{ color: 'rgba(255,255,255,0.20)' }}>Level up to<br />gain points</p>
              )}
            </div>
          </div>
        </div>
        {/* END CHARACTER SCREEN */}

        {/* ══ TAB BAR ═══════════════════════════════════════════════════════ */}
        <div className="flex sticky top-0 z-20" style={{ background: '#060a12', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {(['character', 'dungeon', 'gear'] as const).map(tab => {
            const labels: Record<string, string> = { character: '⚔  CHARACTER', dungeon: '🌑  DUNGEON', gear: '◆  GEAR' };
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-1 py-3 text-[10px] font-mono font-bold uppercase tracking-widest transition-all"
                style={{
                  color: active ? archetypeData.color : 'rgba(255,255,255,0.28)',
                  borderBottom: active ? `2px solid ${archetypeData.color}` : '2px solid transparent',
                  background: active ? `${archetypeData.color}08` : 'transparent',
                }}
                data-testid={`tab-${tab}`}>
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* ══ DUNGEON TAB ════════════════════════════════════════════════════ */}
        {activeTab === 'dungeon' && (
          <div className="px-4 py-4 space-y-4" data-testid="dungeon-tab">

            {/* Dungeon card */}
            <div className="relative rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0d1f35 0%, #081424 100%)', border: '1px solid rgba(59,130,246,0.25)', boxShadow: '0 0 32px rgba(59,130,246,0.12)' }}>
              {/* Atmosphere banner */}
              <div className="px-4 pt-4 pb-2 flex items-start justify-between">
                <div>
                  <div className="text-[8px] font-mono uppercase tracking-[0.22em]" style={{ color: 'rgba(59,130,246,0.6)' }}>
                    SHADOW GATE · INSTANCE 001
                  </div>
                  <div className="font-display font-black text-xl mt-0.5" style={{ color: '#e2e8f0', letterSpacing: '0.05em' }}>
                    Shadow Forest
                  </div>
                  <div className="text-[9px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Boss: Fang Wolf
                  </div>
                </div>
                <div className="text-4xl" style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.5))' }}>🌑</div>
              </div>

              <p className="px-4 text-[9px] leading-relaxed pb-3" style={{ color: 'rgba(255,255,255,0.30)' }}>
                {dungeon.atmosphere}
              </p>

              {/* Enemy roster */}
              <div className="px-4 pb-3 flex gap-2 flex-wrap">
                {dungeon.enemies.map(e => (
                  <span key={e} className="text-[8px] font-mono px-2 py-0.5 rounded-full"
                    style={{ color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                    {e}
                  </span>
                ))}
              </div>

              {/* Rewards preview */}
              <div className="mx-4 mb-4 rounded-xl px-3 py-2 flex items-center justify-between"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}>
                <div className="text-[8px] font-mono" style={{ color: 'rgba(59,130,246,0.7)' }}>REWARDS</div>
                <div className="flex gap-3 text-[9px] font-mono">
                  <span style={{ color: '#f59e0b' }}>✦ {dungeon.baseXP}–{dungeon.baseXP + 60} XP</span>
                  <span style={{ color: '#fbbf24' }}>◆ {dungeon.baseGold}–{dungeon.baseGold + 40} G</span>
                  <span style={{ color: '#a855f7' }}>◈ Gear drop</span>
                </div>
              </div>

              {/* ENTER button */}
              {dungeonPhase === 'idle' && (
                <div className="px-4 pb-4">
                  {onCooldown ? (
                    <div className="w-full py-3 rounded-xl text-center font-mono text-xs"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.35)' }}>
                      COOLDOWN — {Math.ceil(cooldownRemaining / 60000)}m remaining
                    </div>
                  ) : (
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => setDungeonPhase('briefing')}
                      data-testid="button-enter-dungeon"
                      className="w-full py-3 rounded-xl font-display font-black text-sm uppercase tracking-widest"
                      style={{
                        background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                        color: '#e0f2fe', letterSpacing: '0.15em',
                        boxShadow: '0 4px 24px rgba(37,99,235,0.45)',
                      }}>
                      ⚔ ENTER DUNGEON
                    </motion.button>
                  )}
                </div>
              )}
            </div>

            {/* BRIEFING */}
            {dungeonPhase === 'briefing' && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4 space-y-3"
                style={{ background: 'rgba(8,20,36,0.95)', border: '1px solid rgba(59,130,246,0.30)' }}>
                <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(59,130,246,0.7)' }}>
                  PRE-BATTLE SYNC
                </div>
                {STAT_META.map(s => (
                  <div key={s.key} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {s.icon} {s.label}
                    </span>
                    <span className="font-mono text-[10px] font-bold" style={{ color: s.color }}>
                      {(displayStats[s.key] ?? 1) + (equippedGearBonuses[s.key] ?? 0)}
                    </span>
                  </div>
                ))}
                <motion.button whileTap={{ scale: 0.97 }} onClick={startBattle}
                  data-testid="button-start-battle"
                  className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest mt-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.85), rgba(220,38,38,0.85))',
                    color: '#fff', boxShadow: '0 4px 18px rgba(239,68,68,0.35)',
                  }}>
                  INITIATE COMBAT
                </motion.button>
              </motion.div>
            )}

            {/* BATTLE */}
            {dungeonPhase === 'battle' && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4 space-y-3"
                style={{ background: 'rgba(8,14,28,0.97)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(239,68,68,0.8)', animation: 'g3dBlink 1.2s infinite' }}>
                    ⚔ COMBAT ACTIVE
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{battleProgress}%</span>
                </div>

                {/* Progress */}
                <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(239,68,68,0.12)' }}>
                  <motion.div className="absolute left-0 top-0 h-full rounded-full"
                    animate={{ width: `${battleProgress}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{ background: 'linear-gradient(to right, #ef4444, #f87171)', boxShadow: '0 0 10px #ef4444' }} />
                </div>

                {/* Log */}
                <div ref={logRef} className="rounded-xl p-3 space-y-1 overflow-y-auto"
                  style={{ background: 'rgba(0,0,0,0.4)', maxHeight: 180, border: '1px solid rgba(255,255,255,0.06)' }}>
                  {battleLog.map((line, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      className="text-[9px] font-mono"
                      style={{ color: line.includes('✓') ? '#34d399' : line.includes('⚠') ? '#fbbf24' : line.includes('⚔') ? '#22d3ee' : 'rgba(255,255,255,0.45)' }}>
                      {line}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* RESULTS */}
            {dungeonPhase === 'results' && runResult && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-5 text-center space-y-4"
                style={{ background: 'linear-gradient(135deg, #0d1f35, #081a2e)', border: '1px solid rgba(245,158,11,0.35)', boxShadow: '0 0 40px rgba(245,158,11,0.15)' }}>
                <div className="text-4xl">🏆</div>
                <div className="font-display font-black text-xl uppercase tracking-widest" style={{ color: '#f59e0b', textShadow: '0 0 24px rgba(245,158,11,0.5)' }}>
                  DUNGEON CLEARED
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl py-2.5 px-3" style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.22)' }}>
                    <div className="text-[8px] font-mono uppercase tracking-widest mb-0.5" style={{ color: 'rgba(245,158,11,0.6)' }}>XP GAINED</div>
                    <div className="font-display font-black text-xl" style={{ color: '#f59e0b' }}>+{runResult.xp}</div>
                  </div>
                  <div className="rounded-xl py-2.5 px-3" style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.22)' }}>
                    <div className="text-[8px] font-mono uppercase tracking-widest mb-0.5" style={{ color: 'rgba(251,191,36,0.6)' }}>GOLD</div>
                    <div className="font-display font-black text-xl" style={{ color: '#fbbf24' }}>+{runResult.gold}G</div>
                  </div>
                </div>
                {runResult.gear && (
                  <div className="rounded-xl p-3 flex items-center gap-3"
                    style={{ background: `${RARITY_COLORS[runResult.gear.rarity]}10`, border: `1px solid ${RARITY_COLORS[runResult.gear.rarity]}35` }}>
                    <span className="text-3xl" style={{ filter: `drop-shadow(0 0 8px ${RARITY_COLORS[runResult.gear.rarity]})` }}>
                      {runResult.gear.icon}
                    </span>
                    <div className="text-left">
                      <div className="font-bold text-sm" style={{ color: RARITY_COLORS[runResult.gear.rarity] }}>{runResult.gear.name}</div>
                      <div className="text-[9px] font-mono uppercase" style={{ color: `${RARITY_COLORS[runResult.gear.rarity]}80` }}>
                        {runResult.gear.rarity} · {runResult.gear.slot}
                      </div>
                    </div>
                    <span className="ml-auto text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ color: '#34d399', background: 'rgba(52,211,153,0.12)' }}>NEW</span>
                  </div>
                )}
                <motion.button whileTap={{ scale: 0.97 }} onClick={collectRewards}
                  data-testid="button-collect-rewards"
                  className="w-full py-3 rounded-xl font-display font-black text-sm uppercase tracking-widest"
                  style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#000', boxShadow: '0 4px 24px rgba(245,158,11,0.45)' }}>
                  COLLECT REWARDS
                </motion.button>
              </motion.div>
            )}
          </div>
        )}

        {/* ══ GEAR TAB ════════════════════════════════════════════════════════ */}
        {activeTab === 'gear' && (
          <div className="px-4 py-4 space-y-4" data-testid="gear-tab">

            {/* Equipment slots */}
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[0.18em] mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>EQUIPPED</div>
              <div className="grid grid-cols-3 gap-2">
                {SLOTS.map(({ slot, label, icon }) => {
                  const eq = rpgState.equipped[slot];
                  const rc = eq ? RARITY_COLORS[eq.rarity] : 'rgba(255,255,255,0.15)';
                  return (
                    <div key={slot} className="rounded-xl p-3 flex flex-col items-center gap-1.5 relative"
                      style={{
                        background: eq ? `${rc}08` : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${eq ? `${rc}40` : 'rgba(255,255,255,0.08)'}`,
                        boxShadow: eq ? `0 0 16px ${RARITY_GLOW[eq.rarity]}` : 'none',
                      }}
                      data-testid={`slot-${slot}`}>
                      {eq ? (
                        <>
                          <span className="text-2xl" style={{ filter: `drop-shadow(0 0 6px ${rc})` }}>{eq.icon}</span>
                          <span className="text-[7px] font-mono font-bold text-center leading-tight" style={{ color: rc }}>{eq.name}</span>
                          <button onClick={() => unequipGear(slot)}
                            className="absolute top-1 right-1 rounded p-0.5 opacity-40 hover:opacity-80"
                            style={{ color: '#fff' }}>
                            <X size={10} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span style={{ color: 'rgba(255,255,255,0.18)' }}>{icon}</span>
                          <span className="text-[7px] font-mono uppercase" style={{ color: 'rgba(255,255,255,0.22)' }}>{label}</span>
                          <span className="text-[6px] font-mono" style={{ color: 'rgba(255,255,255,0.12)' }}>Empty</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inventory */}
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[0.18em] mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                INVENTORY ({rpgState.inventory.length})
              </div>
              {rpgState.inventory.length === 0 ? (
                <div className="rounded-xl p-6 text-center"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Package size={24} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 8px' }} />
                  <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    Complete dungeons to earn gear
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {rpgState.inventory.map(item => {
                    const rc = RARITY_COLORS[item.rarity];
                    return (
                      <motion.button key={`${item.id}-${Math.random()}`} whileTap={{ scale: 0.94 }}
                        onClick={() => setSelectedGear(item)}
                        data-testid={`gear-item-${item.id}`}
                        className="rounded-xl p-2.5 flex flex-col items-center gap-1 relative"
                        style={{
                          background: `${rc}08`, border: `1.5px solid ${rc}30`,
                          boxShadow: `0 0 12px ${RARITY_GLOW[item.rarity]}`,
                        }}>
                        <span className="text-2xl" style={{ filter: `drop-shadow(0 0 5px ${rc})` }}>{item.icon}</span>
                        <span className="text-[7px] font-mono font-bold text-center leading-tight" style={{ color: rc }}>
                          {item.name}
                        </span>
                        <span className="text-[6px] font-mono uppercase" style={{ color: `${rc}80` }}>{item.rarity}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ CHARACTER TAB EXTRAS ════════════════════════════════════════════ */}
        {activeTab === 'character' && (
          <div className="px-4 py-4 space-y-3" data-testid="character-tab-extras">
            {/* Equipped gear summary */}
            <div className="text-[9px] font-mono uppercase tracking-[0.18em] mb-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
              EQUIPPED GEAR
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SLOTS.map(({ slot, label, icon }) => {
                const eq = rpgState.equipped[slot];
                const rc = eq ? RARITY_COLORS[eq.rarity] : 'rgba(255,255,255,0.12)';
                return (
                  <div key={slot} className="rounded-xl p-2.5 flex items-center gap-2"
                    style={{ background: eq ? `${rc}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${eq ? `${rc}30` : 'rgba(255,255,255,0.06)'}` }}>
                    {eq ? (
                      <>
                        <span style={{ fontSize: 18 }}>{eq.icon}</span>
                        <div className="min-w-0">
                          <div className="text-[7px] font-mono font-bold truncate" style={{ color: rc }}>{eq.name}</div>
                          <div className="text-[6px] font-mono" style={{ color: `${rc}70` }}>
                            {Object.entries(eq.stats).map(([s, v]) => `+${v} ${s.slice(0,3).toUpperCase()}`).join(' ')}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <span style={{ color: 'rgba(255,255,255,0.15)' }}>{icon}</span>
                        <span className="text-[7px] font-mono" style={{ color: 'rgba(255,255,255,0.20)' }}>{label} —</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* System info */}
            <div className="rounded-xl px-4 py-3 mt-2"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[8px] font-mono leading-relaxed" style={{ color: 'rgba(255,255,255,0.28)' }}>
                ◈ Complete daily habits to earn stat XP in real life.<br />
                ◈ Each habit maps to a stat: STR · AGI · VIT · SEN.<br />
                ◈ Level up in life → evolve your character in-game.
              </div>
            </div>
          </div>
        )}

        <div className="pb-8" />
      </div>
    </SystemLayout>
  );
}
