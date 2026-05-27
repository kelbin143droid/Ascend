import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useGame } from '@/context/GameContext';
import { SystemLayout } from '@/components/game/SystemLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Sword, Zap, Heart, Brain, Shield, Package, Star, X, Check, AlertTriangle } from 'lucide-react';
import {
  loadRPGState, saveRPGState, getRank, getEvolutionTier,
  dispatchSystemMessage, rollLoot, RARITY_COLORS, RARITY_GLOW,
  DUNGEON_SHADOW_FOREST, STARTER_EQUIPMENT, CLASS_CHANGE_COST,
  type GearItem, type GearSlot, type RPGState, type ArchetypeId,
} from '@/lib/rpgStore';

// ─── Archetypes ───────────────────────────────────────────────────────────────
const ARCHETYPES = [
  { id: 'warrior' as ArchetypeId, name: 'Warrior', color: '#ef4444', accent: '#fbbf24', tagline: 'Born in battle',    weapon: 'Rusted Sword',   armor: 'Shoulder Armor' },
  { id: 'sage'    as ArchetypeId, name: 'Sage',    color: '#8b5cf6', accent: '#60a5fa', tagline: 'Master of mind',   weapon: 'Wooden Scepter', armor: 'Spell Orb'      },
  { id: 'shadow'  as ArchetypeId, name: 'Shadow',  color: '#14b8a6', accent: '#94a3b8', tagline: 'Unseen force',     weapon: 'Twin Daggers',   armor: 'Dark Hood'      },
  { id: 'warden'  as ArchetypeId, name: 'Warden',  color: '#22c55e', accent: '#fbbf24', tagline: 'Unbreakable will', weapon: 'Iron Mace',      armor: 'Warden Shield'  },
] as const;

const ARCHETYPE_KEY = 'ascend_avatar_archetype';

const STAT_META = [
  { key: 'strength' as const, label: 'STR', color: '#fbbf24', icon: <Sword size={10}/> },
  { key: 'agility'  as const, label: 'AGI', color: '#34d399', icon: <Zap   size={10}/> },
  { key: 'vitality' as const, label: 'VIT', color: '#f87171', icon: <Heart size={10}/> },
  { key: 'sense'    as const, label: 'SEN', color: '#a78bfa', icon: <Brain size={10}/> },
];

const RANK_COLOR: Record<string, string> = {
  E: '#94a3b8', D: '#6ee7b7', C: '#22d3ee', B: '#3b82f6', A: '#8b5cf6', S: '#f59e0b',
};

// ─── Battle enemies ───────────────────────────────────────────────────────────
interface BattleEnemy {
  name: string; hp: number; maxHp: number; type: 'normal'|'elite'|'boss';
  attackDmg: number; xpReward: number; svgType: string; color: string; size: number;
}
const WAVE_ENEMIES: BattleEnemy[] = [
  { name: 'Shadow Sprite',    hp: 35,  maxHp: 35,  type: 'normal', attackDmg: 3,  xpReward: 15,  svgType: 'sprite',   color: '#7c3aed', size: 80  },
  { name: 'Dark Wolf',        hp: 55,  maxHp: 55,  type: 'normal', attackDmg: 5,  xpReward: 22,  svgType: 'wolf',     color: '#3b82f6', size: 90  },
  { name: 'Bone Crawler',     hp: 50,  maxHp: 50,  type: 'elite',  attackDmg: 6,  xpReward: 28,  svgType: 'crawler',  color: '#6ee7b7', size: 88  },
  { name: 'Shadow Wolf Alpha',hp: 80,  maxHp: 80,  type: 'elite',  attackDmg: 8,  xpReward: 35,  svgType: 'wolf',     color: '#06b6d4', size: 100 },
  { name: '⚡ FANG WOLF',     hp: 200, maxHp: 200, type: 'boss',   attackDmg: 14, xpReward: 120, svgType: 'fangwolf', color: '#ef4444', size: 130 },
];

// ─── Player SVG art ────────────────────────────────────────────────────────────
function WarriorArt({ c, a }: { c: string; a: string }) {
  return (
    <svg viewBox="0 0 120 220" fill="none" className="w-full h-full">
      <ellipse cx="60" cy="185" rx="36" ry="8" fill={c} opacity=".20"/>
      <path d="M40 68 Q24 110 28 170 L60 158 L92 170 Q96 110 80 68Z" fill={c} opacity=".28"/>
      <rect x="43" y="148" width="14" height="50" rx="4" fill="#1e293b" stroke={c} strokeWidth="1.5"/>
      <rect x="63" y="148" width="14" height="50" rx="4" fill="#1e293b" stroke={c} strokeWidth="1.5"/>
      <rect x="40" y="188" width="20" height="14" rx="3" fill={c} opacity=".7"/>
      <rect x="60" y="188" width="20" height="14" rx="3" fill={c} opacity=".7"/>
      <path d="M38 80 L82 80 L86 148 L34 148Z" fill="#1e293b" stroke={c} strokeWidth="1.5"/>
      <path d="M60 84 L60 144" stroke={a} strokeWidth="1" opacity=".5"/>
      <polygon points="50,88 60,78 70,88 65,100 55,100" fill={a} opacity=".35" stroke={a} strokeWidth="1"/>
      <ellipse cx="34" cy="84" rx="12" ry="9" fill={c} opacity=".7" stroke={a} strokeWidth="1"/>
      <ellipse cx="86" cy="84" rx="12" ry="9" fill={c} opacity=".7" stroke={a} strokeWidth="1"/>
      <rect x="22" y="88" width="12" height="44" rx="5" fill="#1e293b" stroke={c} strokeWidth="1.2"/>
      <rect x="86" y="88" width="12" height="44" rx="5" fill="#1e293b" stroke={c} strokeWidth="1.2"/>
      {/* Sword */}
      <rect x="100" y="68" width="5" height="104" rx="2" fill={a} opacity=".9"/>
      <rect x="96" y="108" width="13" height="4" rx="1" fill={c} opacity=".9"/>
      <rect x="101" y="62" width="3" height="10" rx="1" fill={a}/>
      {/* Head */}
      <rect x="53" y="56" width="14" height="24" rx="4" fill="#1e293b" stroke={c} strokeWidth="1"/>
      <ellipse cx="60" cy="44" rx="22" ry="22" fill="#1e293b" stroke={c} strokeWidth="2"/>
      <path d="M40 38 L80 38 L80 52 Q60 58 40 52Z" fill={c} opacity=".5"/>
      <path d="M46 44 L74 44" stroke={a} strokeWidth="2" opacity=".8"/>
      <ellipse cx="51" cy="40" rx="5" ry="3" fill={a} opacity=".9"/>
      <ellipse cx="69" cy="40" rx="5" ry="3" fill={a} opacity=".9"/>
    </svg>
  );
}
function SageArt({ c, a }: { c: string; a: string }) {
  return (
    <svg viewBox="0 0 120 220" fill="none" className="w-full h-full">
      <ellipse cx="60" cy="185" rx="34" ry="8" fill={c} opacity=".18"/>
      <path d="M44 80 Q30 100 24 190 L96 190 Q90 100 76 80Z" fill="#1e293b" stroke={c} strokeWidth="1.5"/>
      <path d="M60 90 L60 180" stroke={c} strokeWidth="1" opacity=".35"/>
      <circle cx="60" cy="118" r="14" stroke={a} strokeWidth="1.2" opacity=".55" fill="none"/>
      <circle cx="60" cy="118" r="8" fill={c} fillOpacity=".1" stroke={c} strokeWidth="1" opacity=".7"/>
      <polygon points="60,108 67,122 53,122" fill="none" stroke={a} strokeWidth="1" opacity=".6"/>
      {/* Staff */}
      <rect x="14" y="30" width="5" height="160" rx="2" fill={c} opacity=".7"/>
      <circle cx="16" cy="30" r="6" fill={a} opacity=".7"/>
      <circle cx="16" cy="30" r="3" fill="white" opacity=".5"/>
      {/* Orb */}
      <circle cx="90" cy="128" r="10" fill={a} opacity=".2"/>
      <circle cx="90" cy="128" r="6" fill={a} opacity=".65"/>
      <circle cx="87" cy="125" r="2" fill="white" opacity=".7"/>
      <path d="M44 90 Q28 110 22 130" stroke={c} strokeWidth="10" strokeLinecap="round" opacity=".45"/>
      <path d="M76 90 Q88 108 88 128" stroke={c} strokeWidth="10" strokeLinecap="round" opacity=".45"/>
      <rect x="54" y="56" width="12" height="24" rx="4" fill="#1e293b"/>
      <ellipse cx="60" cy="44" rx="20" ry="22" fill="#1e293b" stroke={c} strokeWidth="1.8"/>
      <path d="M36 44 Q38 16 60 14 Q82 16 84 44 Q74 36 60 36 Q46 36 36 44Z" fill={c} opacity=".55"/>
      <ellipse cx="52" cy="42" rx="4" ry="3" fill={a} opacity=".9"/>
      <ellipse cx="68" cy="42" rx="4" ry="3" fill={a} opacity=".9"/>
    </svg>
  );
}
function ShadowArt({ c, a }: { c: string; a: string }) {
  return (
    <svg viewBox="0 0 120 220" fill="none" className="w-full h-full">
      <ellipse cx="62" cy="185" rx="32" ry="7" fill={c} opacity=".18"/>
      <path d="M38 72 Q18 108 22 182 L62 168 L98 178 Q104 114 84 72Z" fill="#0f172a" stroke={c} strokeWidth="1.2" opacity=".9"/>
      <path d="M40 78 L84 78 L86 152 L36 152Z" fill="#0f172a" stroke={c} strokeWidth="1.2"/>
      <path d="M40 84 L84 100" stroke={a} strokeWidth="1.5" opacity=".55"/>
      <path d="M84 84 L40 100" stroke={a} strokeWidth="1.5" opacity=".55"/>
      {/* Twin daggers */}
      <path d="M24 92 L24 140" stroke={a} strokeWidth="3" strokeLinecap="round" opacity=".8"/>
      <path d="M22 92 L26 92 L25 88Z" fill={a} opacity=".9"/>
      <path d="M96 100 L96 142" stroke={a} strokeWidth="3" strokeLinecap="round" opacity=".8"/>
      <path d="M94 100 L98 100 L97 96Z" fill={a} opacity=".9"/>
      <rect x="42" y="152" width="13" height="46" rx="4" fill="#0f172a" stroke={c} strokeWidth="1.2"/>
      <rect x="66" y="156" width="13" height="42" rx="4" fill="#0f172a" stroke={c} strokeWidth="1.2"/>
      <rect x="24" y="82" width="16" height="40" rx="5" fill="#0f172a" stroke={c} strokeWidth="1"/>
      <rect x="80" y="82" width="16" height="40" rx="5" fill="#0f172a" stroke={c} strokeWidth="1"/>
      <ellipse cx="61" cy="44" rx="21" ry="22" fill="#0f172a" stroke={c} strokeWidth="1.8"/>
      <path d="M40 40 Q42 18 61 16 Q80 18 82 40 Q72 34 61 34 Q50 34 40 40Z" fill={c} opacity=".22"/>
      <ellipse cx="52" cy="43" rx="5" ry="2.5" fill={c} opacity=".95"/>
      <ellipse cx="70" cy="43" rx="5" ry="2.5" fill={c} opacity=".95"/>
    </svg>
  );
}
function WardenArt({ c, a }: { c: string; a: string }) {
  return (
    <svg viewBox="0 0 120 220" fill="none" className="w-full h-full">
      <ellipse cx="60" cy="185" rx="38" ry="9" fill={c} opacity=".20"/>
      <rect x="38" y="150" width="16" height="50" rx="5" fill="#1e293b" stroke={c} strokeWidth="1.5"/>
      <rect x="66" y="150" width="16" height="50" rx="5" fill="#1e293b" stroke={c} strokeWidth="1.5"/>
      <rect x="35" y="172" width="22" height="28" rx="4" fill={c} opacity=".6"/>
      <rect x="63" y="172" width="22" height="28" rx="4" fill={c} opacity=".6"/>
      <path d="M34 78 L86 78 L90 152 L30 152Z" fill="#1e293b" stroke={c} strokeWidth="1.8"/>
      <path d="M44 80 L60 68 L76 80 L76 110 Q60 120 44 110Z" fill={c} opacity=".30" stroke={a} strokeWidth="1"/>
      <ellipse cx="30" cy="82" rx="14" ry="11" fill={c} opacity=".7" stroke={a} strokeWidth="1.2"/>
      <ellipse cx="90" cy="82" rx="14" ry="11" fill={c} opacity=".7" stroke={a} strokeWidth="1.2"/>
      <rect x="16" y="86" width="14" height="50" rx="5" fill="#1e293b" stroke={c} strokeWidth="1.2"/>
      <rect x="90" y="86" width="14" height="50" rx="5" fill="#1e293b" stroke={c} strokeWidth="1.2"/>
      {/* Shield */}
      <path d="M4 86 Q4 130 4 130 Q4 152 16 158 Q28 152 28 130 L28 86Z" fill={c} opacity=".50" stroke={a} strokeWidth="1.5"/>
      <path d="M16 108 L16 140M8 124 L24 124" stroke={a} strokeWidth="1.5" opacity=".6"/>
      {/* Mace */}
      <rect x="97" y="75" width="6" height="80" rx="3" fill={c} opacity=".75"/>
      <ellipse cx="100" cy="75" rx="10" ry="8" fill={c} opacity=".8" stroke={a} strokeWidth="1.2"/>
      <rect x="52" y="56" width="16" height="22" rx="4" fill="#1e293b" stroke={c} strokeWidth="1"/>
      <ellipse cx="60" cy="44" rx="23" ry="22" fill="#1e293b" stroke={c} strokeWidth="2"/>
      <path d="M37 46 L83 46 L83 60 Q60 66 37 60Z" fill={c} opacity=".50"/>
      <path d="M37 46 L83 46 L83 34 Q60 22 37 34Z" fill={c} opacity=".50"/>
      <ellipse cx="52" cy="48" rx="4" ry="2.5" fill={a} opacity=".9"/>
      <ellipse cx="68" cy="48" rx="4" ry="2.5" fill={a} opacity=".9"/>
    </svg>
  );
}
function ArchetypeAvatar({ id, color, accent }: { id: ArchetypeId; color: string; accent: string }) {
  if (id === 'warrior') return <WarriorArt c={color} a={accent}/>;
  if (id === 'sage')    return <SageArt    c={color} a={accent}/>;
  if (id === 'shadow')  return <ShadowArt  c={color} a={accent}/>;
  return <WardenArt c={color} a={accent}/>;
}
function HexPedestal({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 160 60" fill="none" className="w-full max-w-[180px]">
      <ellipse cx="80" cy="30" rx="72" ry="22" fill={color} opacity=".07"/>
      <polygon points="80,8 116,22 116,42 80,56 44,42 44,22"
        fill={color} fillOpacity=".10" stroke={color} strokeWidth="1.5" strokeOpacity=".45"/>
    </svg>
  );
}

// ─── Enemy SVG sprites ─────────────────────────────────────────────────────────
function ShadowSpriteEnemy({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 90 100" fill="none">
      <ellipse cx="45" cy="90" rx="28" ry="5" fill={color} opacity=".18"/>
      {/* Tentacles */}
      <path d="M25 58 Q16 75 20 90" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M45 64 Q45 80 45 95" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M65 58 Q74 75 70 90" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M32 62 Q26 74 30 84" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".6"/>
      <path d="M58 62 Q64 74 60 84" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".6"/>
      {/* Body */}
      <circle cx="45" cy="40" r="30" fill="#1a0830" stroke={color} strokeWidth="2"/>
      <circle cx="45" cy="40" r="26" fill="#1a0830"/>
      {/* Aura */}
      <circle cx="45" cy="40" r="33" fill="none" stroke={color} strokeWidth="1" opacity=".3" strokeDasharray="4 3"/>
      {/* Eyes */}
      <ellipse cx="34" cy="36" rx="7" ry="5" fill={color} opacity=".9"/>
      <ellipse cx="56" cy="36" rx="7" ry="5" fill={color} opacity=".9"/>
      <ellipse cx="34" cy="36" rx="3" ry="3" fill="white" opacity=".7"/>
      <ellipse cx="56" cy="36" rx="3" ry="3" fill="white" opacity=".7"/>
      {/* Mouth */}
      <path d="M36 50 Q45 56 54 50" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".7"/>
    </svg>
  );
}
function WolfEnemy({ color, boss }: { color: string; boss?: boolean }) {
  const s = boss ? 1.3 : 1;
  return (
    <svg viewBox="0 0 110 110" fill="none">
      <ellipse cx="55" cy="105" rx="35" ry="5" fill={color} opacity=".18"/>
      {/* Body */}
      <ellipse cx="50" cy="65" rx="35" ry="24" fill="#0a1428" stroke={color} strokeWidth={boss?2:1.5}/>
      {/* Head */}
      <path d="M65 42 Q78 24 90 32 Q96 40 86 50 Q76 56 65 50Z" fill="#0a1428" stroke={color} strokeWidth={boss?2:1.5}/>
      {/* Snout */}
      <path d="M82 40 Q92 44 90 52 Q84 54 80 48Z" fill="#0a1428" stroke={color} strokeWidth="1"/>
      {/* Nose */}
      <ellipse cx="88" cy="46" rx="3" ry="2" fill={color} opacity=".7"/>
      {/* Ear */}
      <path d="M70 36 L74 20 L83 32" fill="#0a1428" stroke={color} strokeWidth="1.5"/>
      {boss && <path d="M60 32 L64 18 L71 28" fill="#0a1428" stroke={color} strokeWidth="1.2"/>}
      {/* Eye */}
      <ellipse cx="80" cy="40" rx={boss?5:4} ry={boss?4:3} fill={color} opacity=".9"/>
      <circle cx="80" cy="40" r={boss?2.5:1.5} fill="white" opacity=".8"/>
      {boss && <ellipse cx="80" cy="40" rx="7" ry="5" fill={color} opacity=".35" style={{filter:'blur(3px)'}}/>}
      {/* Tail */}
      <path d="M16 62 Q4 48 10 36 Q14 44 20 54" fill="#0a1428" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      {/* Legs */}
      <rect x="30" y="82" width={boss?11:9} height={boss?24:20} rx="5" fill="#0a1428" stroke={color} strokeWidth="1.2"/>
      <rect x="50" y="82" width={boss?11:9} height={boss?24:20} rx="5" fill="#0a1428" stroke={color} strokeWidth="1.2"/>
      {/* Claws */}
      <path d="M30 102 L27 108 M34 102 L33 108 M38 102 L38 108" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
      {boss && (
        <>
          <path d="M50 102 L47 110 M54 102 L53 110 M58 102 L60 110" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
          {/* Boss crown */}
          <path d="M70 36 L74 24 L80 32 L86 20 L90 32 L96 26 L94 36" stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Boss armor shards */}
          <path d="M20 58 L14 50 L18 68Z" fill={color} opacity=".5" stroke={color} strokeWidth="1"/>
          <path d="M82 62 L88 54 L90 72Z" fill={color} opacity=".5" stroke={color} strokeWidth="1"/>
        </>
      )}
    </svg>
  );
}
function BoneCrawlerEnemy({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none">
      <ellipse cx="50" cy="95" rx="28" ry="5" fill={color} opacity=".15"/>
      {/* Legs */}
      <path d="M28 45 L12 34 L10 44" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M28 52 L10 52 L12 62" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M30 60 L18 72 L26 76" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M72 45 L88 34 L90 44" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M72 52 L90 52 L88 62" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M70 60 L82 72 L74 76" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      {/* Body */}
      <circle cx="50" cy="50" r="24" fill="#0a1f1a" stroke={color} strokeWidth="2"/>
      {/* Skull face */}
      <ellipse cx="40" cy="46" rx="5" ry="6" fill={color} opacity=".75"/>
      <ellipse cx="60" cy="46" rx="5" ry="6" fill={color} opacity=".75"/>
      {/* Teeth */}
      <path d="M40 58 L44 63 L48 58 L52 63 L56 58 L60 63" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      {/* Head ridge */}
      <path d="M34 40 Q50 30 66 40" fill="none" stroke={color} strokeWidth="1.5" opacity=".5"/>
    </svg>
  );
}
function EnemySprite({ svgType, color, boss }: { svgType: string; color: string; boss?: boolean }) {
  if (svgType === 'sprite') return <ShadowSpriteEnemy color={color}/>;
  if (svgType === 'crawler') return <BoneCrawlerEnemy color={color}/>;
  if (svgType === 'fangwolf') return <WolfEnemy color={color} boss/>;
  return <WolfEnemy color={color}/>;
}

// ─── Rank aura ────────────────────────────────────────────────────────────────
function RankAura({ rank, color }: { rank: string; color: string }) {
  const tier = getEvolutionTier(rank);
  if (!tier.auraLayers) return null;
  return (
    <>
      {Array.from({ length: tier.auraLayers }).map((_, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none" style={{
          inset: -14 - i * 14,
          background: `radial-gradient(circle, ${color}${i === 0 ? '28' : '16'} 0%, transparent 68%)`,
          animation: `rpgAura ${3 + i * 0.8}s ${i * 0.5}s ease-in-out infinite`,
        }}/>
      ))}
      {tier.legendaryEffect && (
        <div className="absolute rounded-full pointer-events-none" style={{
          inset: -6, border: `2px solid ${color}50`,
          animation: 'rpgAura 2s ease-in-out infinite',
          boxShadow: `0 0 20px ${color}55`,
        }}/>
      )}
    </>
  );
}

// ─── Evolution overlay ────────────────────────────────────────────────────────
function EvolutionOverlay({ fromRank, toRank, onClose }: { fromRank: string; toRank: string; onClose: () => void }) {
  const tier = getEvolutionTier(toRank);
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9990] flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.1 }}
        className="flex flex-col items-center gap-4">
        <div className="text-5xl" style={{ filter: `drop-shadow(0 0 28px ${tier.color})` }}>◈</div>
        <div className="font-mono font-bold tracking-[0.22em] uppercase text-center" style={{ fontSize: 10, color: tier.color, opacity: 0.7 }}>AWAKENING DETECTED</div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="font-display font-black text-center uppercase"
          style={{ fontSize: 32, color: tier.color, textShadow: `0 0 40px ${tier.glow}`, letterSpacing: '0.1em' }}>
          {tier.label}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="font-mono text-center" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}>
          RANK {fromRank} → RANK {toRank} · EVOLUTION COMPLETE
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─── Class lock modal ─────────────────────────────────────────────────────────
function ClassLockModal({ archetype, mode, playerGold, onConfirm, onCancel }: {
  archetype: typeof ARCHETYPES[number];
  mode: 'first_lock' | 'change_cost';
  playerGold: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const canAfford = playerGold >= CLASS_CHANGE_COST;
  const starter = STARTER_EQUIPMENT[archetype.id];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 24 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'rgba(8,14,28,0.98)', border: `1px solid ${archetype.color}50`, boxShadow: `0 0 40px ${archetype.color}20` }}>

        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center gap-3"
          style={{ borderBottom: `1px solid ${archetype.color}18` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${archetype.color}18`, border: `1px solid ${archetype.color}40` }}>
            <span className="text-xl">⚔</span>
          </div>
          <div>
            <div className="font-display font-black text-base uppercase" style={{ color: archetype.color }}>
              {mode === 'first_lock' ? 'LOCK IN CLASS' : 'CHANGE CLASS'}
            </div>
            <div className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.38)' }}>
              {mode === 'first_lock' ? 'Choose your permanent identity' : 'This will reset your combat specialization'}
            </div>
          </div>
        </div>

        {/* Class info */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-16 shrink-0" style={{ filter: `drop-shadow(0 0 8px ${archetype.color}80)` }}>
              <ArchetypeAvatar id={archetype.id} color={archetype.color} accent={archetype.accent}/>
            </div>
            <div>
              <div className="font-display font-black text-xl" style={{ color: archetype.color }}>{archetype.name}</div>
              <div className="text-[10px] font-mono" style={{ color: `${archetype.color}88` }}>"{archetype.tagline}"</div>
              <div className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {archetype.weapon} · {archetype.armor}
              </div>
            </div>
          </div>

          {mode === 'first_lock' && (
            <div className="rounded-xl px-3 py-2.5 mb-4"
              style={{ background: `${archetype.color}0c`, border: `1px solid ${archetype.color}28` }}>
              <div className="text-[8px] font-mono uppercase tracking-widest mb-1.5" style={{ color: `${archetype.color}80` }}>
                STARTER EQUIPMENT
              </div>
              <div className="flex gap-2 flex-wrap">
                {[starter.weapon, starter.armor, starter.accessory].filter(Boolean).map(g => (
                  <div key={g!.id} className="flex items-center gap-1.5 text-[9px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    <span>{g!.icon}</span> {g!.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === 'change_cost' && (
            <div className="rounded-xl px-3 py-2.5 mb-4 flex items-center justify-between"
              style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.28)' }}>
              <div>
                <div className="text-[8px] font-mono uppercase tracking-widest mb-0.5" style={{ color: 'rgba(245,158,11,0.7)' }}>CLASS CHANGE COST</div>
                <div className="font-display font-black text-xl" style={{ color: '#f59e0b' }}>{CLASS_CHANGE_COST} Gold</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] font-mono uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>Your Gold</div>
                <div className="font-mono font-bold text-sm" style={{ color: canAfford ? '#34d399' : '#f87171' }}>{playerGold}G</div>
              </div>
            </div>
          )}

          {mode === 'change_cost' && !canAfford && (
            <div className="flex items-center gap-2 mb-3 text-[10px]" style={{ color: '#f87171' }}>
              <AlertTriangle size={12}/> Insufficient gold. Complete dungeons to earn more.
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-mono"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)' }}>
              Cancel
            </button>
            <button onClick={onConfirm}
              disabled={mode === 'change_cost' && !canAfford}
              className="flex-2 flex-1 py-2.5 rounded-xl text-sm font-display font-black uppercase tracking-wider"
              style={{
                background: (mode === 'change_cost' && !canAfford) ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${archetype.color}dd, ${archetype.color}99)`,
                color: (mode === 'change_cost' && !canAfford) ? 'rgba(255,255,255,0.2)' : '#fff',
                border: `1px solid ${archetype.color}44`,
                boxShadow: (mode === 'change_cost' && !canAfford) ? 'none' : `0 4px 18px ${archetype.color}30`,
              }}>
              {mode === 'first_lock' ? 'LOCK IN' : canAfford ? 'CONFIRM CHANGE' : 'NOT ENOUGH GOLD'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Visual Battle Scene ───────────────────────────────────────────────────────
interface DamageNum { id: string; value: number; crit: boolean; side: 'enemy'|'player'; }

function VisualBattleScene({
  archetype, displayStats, equippedBonuses, dungeon, onBattleComplete, onExit,
}: {
  archetype: typeof ARCHETYPES[number];
  displayStats: Record<string, number>;
  equippedBonuses: Record<string, number>;
  dungeon: typeof DUNGEON_SHADOW_FOREST;
  onBattleComplete: (xp: number, gold: number, gear?: GearItem) => void;
  onExit: () => void;
}) {
  const [wave, setWave] = useState(0);
  const [phase, setPhase] = useState<'entering'|'combat'|'dying'|'wave_clear'|'victory'>('entering');
  const [enemyHp, setEnemyHp] = useState(WAVE_ENEMIES[0].maxHp);
  const [playerHp, setPlayerHp] = useState(100);
  const [attacking, setAttacking] = useState(false);
  const [enemyShake, setEnemyShake] = useState(false);
  const [playerShake, setPlayerShake] = useState(false);
  const [damageNums, setDamageNums] = useState<DamageNum[]>([]);
  const [screenShake, setScreenShake] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  const [totalGold, setTotalGold] = useState(0);

  const enemy = WAVE_ENEMIES[wave];
  const enemyHpRef = useRef(enemy.maxHp);
  const playerHpRef = useRef(100);
  const phaseRef = useRef<string>('entering');

  const addDmg = useCallback((val: number, crit: boolean, side: 'enemy'|'player') => {
    const id = `${Date.now()}-${Math.random()}`;
    setDamageNums(p => [...p.slice(-6), { id, value: val, crit, side }]);
    setTimeout(() => setDamageNums(p => p.filter(d => d.id !== id)), 1300);
  }, []);

  const str = (displayStats.strength ?? 1) + (equippedBonuses.strength ?? 0);
  const sen = (displayStats.sense    ?? 1) + (equippedBonuses.sense    ?? 0);
  const agi = (displayStats.agility  ?? 1) + (equippedBonuses.agility  ?? 0);

  const calcPlayerDmg = () => {
    const base = 4 + str * 1.4;
    const crit = Math.random() < (sen * 0.015);
    const dmg  = Math.floor(crit ? base * 2 : base * (0.8 + Math.random() * 0.4));
    return { dmg, crit };
  };

  // Enter enemy
  useEffect(() => {
    phaseRef.current = 'entering';
    enemyHpRef.current = WAVE_ENEMIES[wave].maxHp;
    setEnemyHp(WAVE_ENEMIES[wave].maxHp);
    const t = setTimeout(() => { setPhase('combat'); phaseRef.current = 'combat'; }, 900);
    return () => clearTimeout(t);
  }, [wave]);

  // Player attack interval
  useEffect(() => {
    if (phase !== 'combat') return;
    const interval = setInterval(() => {
      if (phaseRef.current !== 'combat') return;
      const { dmg, crit } = calcPlayerDmg();
      setAttacking(true);
      setTimeout(() => setAttacking(false), 380);
      setTimeout(() => {
        setEnemyShake(true);
        setTimeout(() => setEnemyShake(false), 280);
        addDmg(dmg, crit, 'enemy');
        const newHp = Math.max(0, enemyHpRef.current - dmg);
        enemyHpRef.current = newHp;
        setEnemyHp(newHp);
        if (newHp <= 0) {
          phaseRef.current = 'dying';
          setPhase('dying');
          setTotalXP(p => p + WAVE_ENEMIES[wave].xpReward);
          setTotalGold(p => p + Math.floor(12 + Math.random() * 18));
          setTimeout(() => {
            if (wave < WAVE_ENEMIES.length - 1) {
              setWave(w => w + 1);
              setPhase('entering');
              phaseRef.current = 'entering';
            } else {
              setPhase('victory');
              phaseRef.current = 'victory';
            }
          }, 900);
        }
      }, 240);
    }, 1600);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, wave]);

  // Enemy attack interval
  useEffect(() => {
    if (phase !== 'combat') return;
    const interval = setInterval(() => {
      if (phaseRef.current !== 'combat') return;
      const eDmg = Math.floor(enemy.attackDmg * (0.7 + Math.random() * 0.6));
      const newHp = Math.max(0, playerHpRef.current - eDmg);
      playerHpRef.current = newHp;
      setPlayerHp(newHp);
      setPlayerShake(true);
      setScreenShake(true);
      setTimeout(() => setPlayerShake(false), 260);
      setTimeout(() => setScreenShake(false), 320);
      addDmg(eDmg, false, 'player');
    }, 2400);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, wave]);

  // Victory: collect rewards
  useEffect(() => {
    if (phase !== 'victory') return;
    const gear = rollLoot(dungeon.lootTable);
    const xpTotal = totalXP + dungeon.baseXP;
    const goldTotal = totalGold + dungeon.baseGold;
    const t = setTimeout(() => onBattleComplete(xpTotal, goldTotal, gear), 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const playerHpPct  = Math.max(0, (playerHp / 100) * 100);
  const enemyHpPct   = Math.max(0, (enemyHp / enemy.maxHp) * 100);
  const isBoss       = enemy.type === 'boss';

  return (
    <div className="relative overflow-hidden" style={{ borderRadius: 20, minHeight: 380 }}>
      {/* ─ Background forest scene ──────────────────────────────────── */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 100% 80% at 50% 60%, #0d1a1e 0%, #060d12 55%, #030608 100%)',
      }}/>
      {/* Atmospheric fog */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" style={{
        background: 'linear-gradient(to top, rgba(6,182,212,0.07), transparent)',
        filter: 'blur(12px)',
      }}/>
      {/* Tree silhouettes */}
      <div className="absolute bottom-14 left-0 right-0 pointer-events-none opacity-25">
        <svg viewBox="0 0 400 60" fill="none" className="w-full">
          {[10,35,60,80,110,150,180,220,260,290,330,360,390].map((x,i) => (
            <rect key={i} x={x} y={60-(15+(i%3)*15)} width={6+(i%4)*3} height={15+(i%3)*15} fill="#0f2028"/>
          ))}
        </svg>
      </div>
      {/* Ground line */}
      <div className="absolute bottom-14 left-0 right-0 h-px" style={{ background: 'rgba(6,182,212,0.15)' }}/>
      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full opacity-30" style={{
            left: `${(i*73+11)%100}%`, top: `${(i*61+7)%85}%`,
            backgroundColor: isBoss ? '#ef4444' : '#22d3ee',
            animation: `rpgParticle ${2+i%3}s ${(i*0.4)%2}s ease-in-out infinite`,
          }}/>
        ))}
      </div>

      {/* Screen shake wrapper */}
      <div className="absolute inset-0" style={{ animation: screenShake ? 'rpgShake 0.32s ease-out' : 'none' }}>

        {/* ─ HP BARS ─────────────────────────────────────────── */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-3">
          {/* Player HP */}
          <div className="flex-1">
            <div className="flex justify-between text-[8px] font-mono mb-1">
              <span style={{ color: '#34d399' }}>{archetype.name}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>{Math.round(playerHp)}/100</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.20)' }}>
              <motion.div className="h-full rounded-full" animate={{ width: `${playerHpPct}%` }}
                transition={{ duration: 0.4 }}
                style={{ background: playerHp > 50 ? 'linear-gradient(to right, #059669, #34d399)' : playerHp > 25 ? '#fbbf24' : '#ef4444', boxShadow: '0 0 8px #34d39940' }}/>
            </div>
          </div>
          {/* VS */}
          <div className="text-[8px] font-mono" style={{ color: 'rgba(255,255,255,0.25)', paddingTop: 12 }}>VS</div>
          {/* Enemy HP */}
          <div className="flex-1">
            <div className="flex justify-between text-[8px] font-mono mb-1">
              <span style={{ color: isBoss ? '#ef4444' : enemy.color }}>{enemy.name}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>{Math.round(enemyHp)}/{enemy.maxHp}</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.20)' }}>
              <motion.div className="h-full rounded-full" animate={{ width: `${enemyHpPct}%` }}
                transition={{ duration: 0.4 }}
                style={{ background: `linear-gradient(to right, #b91c1c, ${enemy.color})`, boxShadow: `0 0 8px ${enemy.color}50` }}/>
            </div>
          </div>
        </div>

        {/* Wave indicator */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="text-[7px] font-mono px-2 py-0.5 rounded-full"
            style={{ color: isBoss ? '#ef4444' : 'rgba(255,255,255,0.30)', background: isBoss ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)', border: isBoss ? '1px solid rgba(239,68,68,0.3)' : 'none', animation: isBoss ? 'rpgBlink 1.2s infinite' : 'none' }}>
            {isBoss ? '⚡ BOSS' : `WAVE ${wave+1} / ${WAVE_ENEMIES.length}`}
          </span>
        </div>

        {/* ─ BATTLE AREA ─────────────────────────────────────── */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ top: 48, bottom: 72 }}>

          {/* PLAYER — left side */}
          <div className="flex-1 flex items-end justify-center pb-4 relative" style={{ maxWidth: '45%' }}>
            <motion.div
              className="relative"
              animate={{ x: attacking ? [0, 28, 0] : 0 }}
              transition={{ duration: 0.38, ease: 'easeInOut' }}
              style={{ width: 80, height: 160, animation: !attacking ? 'rpgPlayerIdle 3s ease-in-out infinite' : 'none' }}>
              <div style={{ transform: 'scaleX(-1)', width: '100%', height: '100%' }}>
                <ArchetypeAvatar id={archetype.id} color={archetype.color} accent={archetype.accent}/>
              </div>
              {/* Weapon glow */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: `radial-gradient(circle at 80% 40%, ${archetype.color}20, transparent 60%)`,
              }}/>
            </motion.div>
            {/* Player hit flash */}
            {playerShake && (
              <div className="absolute inset-0 rounded-lg pointer-events-none" style={{ background: 'rgba(239,68,68,0.3)' }}/>
            )}
          </div>

          {/* CENTER — attack VFX + damage numbers */}
          <div className="relative flex items-center justify-center" style={{ width: 60, height: '100%' }}>
            {/* Attack flash */}
            {attacking && (
              <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: [0,1,0] }}
                transition={{ duration: 0.35 }}
                className="absolute w-12 h-1.5 rounded-full"
                style={{ background: `linear-gradient(to right, ${archetype.color}, white)`, filter: 'blur(1px)', transformOrigin: 'left' }}/>
            )}
            {/* Damage numbers */}
            {damageNums.map(d => (
              <motion.div key={d.id}
                initial={{ opacity: 1, y: 0, scale: d.crit ? 1.4 : 1 }}
                animate={{ opacity: 0, y: -55, scale: d.crit ? 1.1 : 0.85 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="absolute font-display font-black pointer-events-none"
                style={{
                  fontSize: d.crit ? 20 : 15,
                  color: d.side === 'player' ? '#f87171' : d.crit ? '#f59e0b' : '#ffffff',
                  textShadow: d.crit ? `0 0 14px #f59e0b` : d.side === 'player' ? '0 0 8px #ef4444' : '0 0 8px rgba(255,255,255,0.5)',
                  left: d.side === 'enemy' ? '60%' : '-10%',
                  zIndex: 20,
                }}>
                {d.side === 'player' ? '-' : d.crit ? '⚡' : ''}{d.value}
                {d.crit && <span style={{ fontSize: 9, marginLeft: 2 }}>CRIT</span>}
              </motion.div>
            ))}
          </div>

          {/* ENEMY — right side */}
          <div className="flex-1 flex items-end justify-center pb-4 relative" style={{ maxWidth: '45%' }}>
            <AnimatePresence mode="wait">
              <motion.div key={`${wave}-${phase}`}
                initial={{ opacity: 0, x: 40 }}
                animate={{
                  opacity: phase === 'dying' ? 0 : 1,
                  x: enemyShake ? [-8, 8, -6, 6, 0] : 0,
                  scale: phase === 'dying' ? 0.2 : 1,
                  rotate: phase === 'dying' ? 20 : 0,
                }}
                exit={{ opacity: 0, scale: 0.2 }}
                transition={{ duration: phase === 'dying' ? 0.7 : enemyShake ? 0.25 : 0.5, ease: 'easeOut' }}
                style={{
                  width: isBoss ? 120 : 90,
                  height: isBoss ? 130 : 100,
                  filter: `drop-shadow(0 0 ${isBoss ? 16 : 10}px ${enemy.color}60)`,
                  animation: phase === 'combat' && !enemyShake ? `rpgEnemyIdle 2.5s ease-in-out infinite` : 'none',
                }}>
                <EnemySprite svgType={enemy.svgType} color={enemy.color} boss={isBoss}/>
              </motion.div>
            </AnimatePresence>
            {/* Enemy hit flash */}
            {enemyShake && (
              <div className="absolute inset-0 pointer-events-none" style={{ background: `${enemy.color}25`, borderRadius: 12 }}/>
            )}
          </div>
        </div>

        {/* ─ BOTTOM INFO ─────────────────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <span style={{ color: '#f59e0b' }}>✦ {totalXP} XP</span>
              <span style={{ color: '#fbbf24' }}>◆ {totalGold}G</span>
            </div>
            <button onClick={onExit} className="text-[9px] font-mono px-2.5 py-1 rounded-lg"
              style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Retreat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Gear detail card ─────────────────────────────────────────────────────────
function GearDetail({ item, equipped, onEquip, onClose }: {
  item: GearItem; equipped: boolean; onEquip: () => void; onClose: () => void;
}) {
  const rc = RARITY_COLORS[item.rarity];
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="fixed inset-x-4 bottom-24 z-50 rounded-2xl p-4"
      style={{ background: 'rgba(8,14,28,0.97)', border: `1px solid ${rc}50`, boxShadow: `0 0 32px ${RARITY_GLOW[item.rarity]}` }}>
      <button onClick={onClose} className="absolute top-3 right-3 opacity-40"><X size={16} style={{ color: '#fff' }}/></button>
      <div className="flex items-start gap-3">
        <div className="text-4xl" style={{ filter: `drop-shadow(0 0 8px ${rc})` }}>{item.icon}</div>
        <div className="flex-1">
          <div className="font-display font-bold text-base" style={{ color: rc }}>{item.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ color: rc, background: `${rc}15`, border: `1px solid ${rc}28` }}>{item.rarity}</span>
            <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.30)' }}>{item.slot}</span>
          </div>
          <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.description}</p>
          <div className="flex gap-3 mt-2">
            {Object.entries(item.stats).map(([stat, val]) => (
              <span key={stat} className="text-[10px] font-mono font-bold" style={{ color: STAT_META.find(s=>s.key===stat)?.color??'#fff' }}>
                +{val} {STAT_META.find(s=>s.key===stat)?.label??stat.slice(0,3).toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>
      <button onClick={onEquip} className="w-full mt-3 py-2.5 rounded-xl font-bold text-sm"
        style={{
          background: equipped ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${rc}cc, ${rc}88)`,
          color: equipped ? 'rgba(255,255,255,0.35)' : '#fff', border: `1px solid ${rc}35`,
        }}>
        {equipped ? 'EQUIPPED' : 'EQUIP'}
      </button>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Game3DPage() {
  const { player, gainExp } = useGame();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'character'|'dungeon'|'gear'>('character');

  // ── Archetype + class lock ──
  const [archetype, setArchetype] = useState<ArchetypeId>(() => {
    try { return (localStorage.getItem(ARCHETYPE_KEY) as ArchetypeId) || 'warrior'; } catch { return 'warrior'; }
  });
  const archetypeData = ARCHETYPES.find(a => a.id === archetype) ?? ARCHETYPES[0];

  // RPG state
  const [rpgState, setRpgStateRaw] = useState<RPGState>(() => loadRPGState());
  const setRpgState = useCallback((updater: (s: RPGState) => RPGState) => {
    setRpgStateRaw(prev => { const next = updater(prev); saveRPGState(next); return next; });
  }, []);

  // Class lock modal
  const [lockModal, setLockModal] = useState<{ archId: ArchetypeId; mode: 'first_lock'|'change_cost' } | null>(null);
  const [pendingArchetype, setPendingArchetype] = useState<ArchetypeId | null>(null);

  const handleArchetypeClick = (id: ArchetypeId) => {
    if (id === archetype) return;
    if (!rpgState.classLocked) {
      // Not yet locked → show first-lock modal
      setPendingArchetype(id);
      setLockModal({ archId: id, mode: 'first_lock' });
    } else {
      // Already locked → show change cost modal
      setPendingArchetype(id);
      setLockModal({ archId: id, mode: 'change_cost' });
    }
  };

  const confirmClassChange = () => {
    if (!pendingArchetype) return;
    const newClass = pendingArchetype;
    const starter = STARTER_EQUIPMENT[newClass];
    const startEquipped: Partial<Record<GearSlot, GearItem>> = {};
    if (starter.weapon) startEquipped.weapon = starter.weapon;
    if (starter.armor)  startEquipped.armor  = starter.armor;
    if (starter.accessory) startEquipped.accessory = starter.accessory;
    setArchetype(newClass);
    try { localStorage.setItem(ARCHETYPE_KEY, newClass); } catch { /* noop */ }
    setRpgState(s => ({ ...s, classLocked: true, lockedClass: newClass, equipped: { ...startEquipped, ...s.equipped } }));
    dispatchSystemMessage({ type: 'rank_up', title: `CLASS LOCKED: ${newClass.toUpperCase()}`, subtitle: `Starter equipment equipped. Your journey begins.`, icon: '⚔', color: ARCHETYPES.find(a=>a.id===newClass)?.color });
    setLockModal(null);
    setPendingArchetype(null);
  };

  // Auto-equip starter gear if class locked but equipped is empty
  useEffect(() => {
    if (rpgState.classLocked && rpgState.lockedClass) {
      const hasAny = Object.keys(rpgState.equipped).length > 0;
      if (!hasAny) {
        const starter = STARTER_EQUIPMENT[rpgState.lockedClass];
        setRpgState(s => ({
          ...s,
          equipped: {
            weapon:    starter.weapon,
            armor:     starter.armor,
            ...(starter.accessory ? { accessory: starter.accessory } : {}),
          }
        }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rpgState.classLocked]);

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

  const statPoints   = playerData?.statPoints  ?? 0;
  const displayStats = playerData?.displayStats ?? player?.stats ?? {};
  const withinXP     = playerData?.exp   ?? 0;
  const maxXP        = playerData?.maxExp ?? 100;
  const xpPct        = Math.min(100, Math.round((withinXP / maxXP) * 100));
  const level        = player?.level ?? 1;
  const playerGold   = playerData?.gold ?? player?.gold ?? 0;
  const rank         = getRank(level);
  const evTier       = getEvolutionTier(rank);

  // ── Evolution detection ──
  const [showEvolution, setShowEvolution] = useState(false);
  const [evoFrom, setEvoFrom] = useState('E');
  const [evoTo,   setEvoTo]   = useState('E');
  useEffect(() => {
    const lastRank = localStorage.getItem('ascend_last_rank') ?? 'E';
    localStorage.setItem('ascend_last_rank', rank);
    if (lastRank !== rank) {
      setEvoFrom(lastRank); setEvoTo(rank); setShowEvolution(true);
      dispatchSystemMessage({ type: 'evolution', title: 'RANK UP', subtitle: `${lastRank} → ${rank} · ${evTier.label}`, icon: '◈', color: evTier.color });
    }
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
      refetchPlayer(); queryClient.invalidateQueries({ queryKey: ['/api/player'] });
      setAllocatingFor(null);
      const s = STAT_META.find(m => m.key === stat);
      if (s) dispatchSystemMessage({ type: 'stat_gain', title: `${s.label} INCREASED`, subtitle: `${s.label} +1`, color: s.color });
    },
    onError: () => setAllocatingFor(null),
  });

  // ── Dungeon ──
  const [dungeonPhase, setDungeonPhase] = useState<'idle'|'battle'|'results'>('idle');
  const [runResult, setRunResult] = useState<{ xp: number; gold: number; gear?: GearItem } | null>(null);
  const dungeon = DUNGEON_SHADOW_FOREST;
  const cooldownRemaining = Math.max(0, rpgState.lastDungeonAt + dungeon.cooldownMs - Date.now());
  const onCooldown = cooldownRemaining > 0;

  const handleBattleComplete = useCallback((xp: number, gold: number, gear?: GearItem) => {
    setRunResult({ xp, gold, gear });
    setDungeonPhase('results');
    setRpgState(s => ({ ...s, lastDungeonAt: Date.now() }));
  }, [setRpgState]);

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

  // ── Gear ──
  const [selectedGear, setSelectedGear] = useState<GearItem | null>(null);
  const equipGear = useCallback((item: GearItem) => {
    setRpgState(s => {
      const old = s.equipped[item.slot];
      const inv = s.inventory.filter(g => g.id !== item.id);
      if (old) inv.push(old);
      return { ...s, equipped: { ...s.equipped, [item.slot]: item }, inventory: inv };
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

  const equippedBonuses = Object.values(rpgState.equipped).reduce((acc, g) => {
    if (!g) return acc;
    Object.entries(g.stats).forEach(([k, v]) => { acc[k] = (acc[k]||0) + (v??0); });
    return acc;
  }, {} as Record<string, number>);

  const SLOTS: { slot: GearSlot; label: string; icon: React.ReactNode }[] = [
    { slot: 'weapon', label: 'Weapon', icon: <Sword size={13}/> },
    { slot: 'armor',  label: 'Armor',  icon: <Shield size={13}/> },
    { slot: 'accessory', label: 'Acc', icon: <Star size={13}/> },
  ];

  const lockModalArchetype = lockModal ? ARCHETYPES.find(a => a.id === lockModal.archId)! : null;

  return (
    <SystemLayout>
      <style>{`
        @keyframes rpgParticle  { 0%,100%{opacity:.15;transform:scale(1)}    50%{opacity:.55;transform:scale(1.7)}       }
        @keyframes rpgFloat     { 0%,100%{transform:translateY(0)}            50%{transform:translateY(-8px)}             }
        @keyframes rpgAura      { 0%,100%{opacity:.45;transform:scale(1)}     50%{opacity:.80;transform:scale(1.06)}      }
        @keyframes rpgScan      { 0%{transform:translateY(-100%)}             100%{transform:translateY(400%)}            }
        @keyframes rpgBlink     { 0%,100%{opacity:1}                          50%{opacity:.25}                            }
        @keyframes rpgPlayerIdle{ 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-4px) rotate(.5deg)}}
        @keyframes rpgEnemyIdle { 0%,100%{transform:translateY(0)}           50%{transform:translateY(-5px)}             }
        @keyframes rpgShake     { 0%,100%{transform:translate(0,0)}          25%{transform:translate(-4px,1px)}  75%{transform:translate(4px,-1px)}}
      `}</style>

      {/* Overlays */}
      <AnimatePresence>
        {showEvolution && <EvolutionOverlay fromRank={evoFrom} toRank={evoTo} onClose={() => setShowEvolution(false)}/>}
      </AnimatePresence>

      <AnimatePresence>
        {lockModal && lockModalArchetype && (
          <ClassLockModal
            archetype={lockModalArchetype}
            mode={lockModal.mode}
            playerGold={playerGold}
            onConfirm={confirmClassChange}
            onCancel={() => { setLockModal(null); setPendingArchetype(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedGear && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setSelectedGear(null)}/>
            <GearDetail item={selectedGear}
              equipped={Object.values(rpgState.equipped).some(g => g?.id === selectedGear.id)}
              onEquip={() => equipGear(selectedGear)}
              onClose={() => setSelectedGear(null)}/>
          </>
        )}
      </AnimatePresence>

      <div className="-mx-4 -mt-6">

        {/* ══ CHARACTER SCREEN ════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden"
          style={{ background: 'radial-gradient(ellipse 90% 65% at 50% 42%, #1a2540 0%, #0c1220 45%, #060a12 100%)', minHeight: 400 }}>
          {/* Spotlight + scan */}
          <div className="absolute pointer-events-none" style={{
            left:'50%',top:'44%',transform:'translate(-50%,-50%)',
            width:260,height:260,borderRadius:'50%',
            background:`radial-gradient(circle, ${archetypeData.color}22 0%, transparent 70%)`,
          }}/>
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.025]">
            <div className="w-full h-1.5 blur-sm" style={{ background:`linear-gradient(transparent,${archetypeData.color},transparent)`, animation:'rpgScan 7s linear infinite' }}/>
          </div>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(18)].map((_,i) => (
              <div key={i} className="absolute rounded-full" style={{
                left:`${(i*47+9)%100}%`,top:`${(i*63+11)%100}%`,width:i%3===0?2:1.5,height:i%3===0?2:1.5,
                backgroundColor:archetypeData.color,opacity:.22,
                animation:`rpgParticle ${(2.3+(i%4)*0.6).toFixed(1)}s ${((i*0.4)%2.6).toFixed(1)}s ease-in-out infinite`,
              }}/>
            ))}
          </div>

          {/* TOP STAT BAR */}
          <div className="relative z-10 flex items-center gap-2 px-3 pt-2.5 pb-2"
            style={{ borderBottom:`1px solid ${archetypeData.color}1e` }}>
            {/* Rank badge */}
            <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg shrink-0"
              style={{ background:`${RANK_COLOR[rank]}16`,border:`1px solid ${RANK_COLOR[rank]}40` }}>
              <span className="text-[7px] font-mono uppercase tracking-widest" style={{ color:RANK_COLOR[rank] }}>RANK</span>
              <span className="text-xl font-display font-black leading-none" style={{ color:RANK_COLOR[rank] }}>{rank}</span>
            </div>
            {/* Name + XP */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-mono font-bold truncate" style={{ color:archetypeData.color }}>{player.name||'AWAKENED'}</span>
                <span className="text-[8px] font-mono shrink-0 ml-1" style={{ color:`${archetypeData.color}88` }}>Lv {level} · {withinXP}/{maxXP}</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background:`${archetypeData.color}14` }}>
                <motion.div className="h-full rounded-full" animate={{ width:`${xpPct}%` }} transition={{ duration:1.2,ease:'easeOut' }}
                  style={{ background:`linear-gradient(to right,${archetypeData.color},${archetypeData.accent})`,boxShadow:`0 0 8px ${archetypeData.color}70` }}/>
              </div>
              <div className="text-[7px] font-mono mt-0.5" style={{ color:evTier.color,opacity:.7,letterSpacing:'0.12em' }}>{evTier.label.toUpperCase()}</div>
            </div>
            {/* Stat pills */}
            <div className="flex gap-1 shrink-0">
              {STAT_META.map(s => (
                <div key={s.key} className="flex flex-col items-center px-1.5 py-1 rounded"
                  style={{ background:`${s.color}0e`,border:`1px solid ${s.color}22` }}>
                  <span className="text-[7px] font-mono font-bold" style={{ color:s.color }}>{s.label}</span>
                  <span className="text-[11px] font-mono font-bold leading-none tabular-nums" style={{ color:s.color }}>
                    {(displayStats[s.key]??1)+(equippedBonuses[s.key]??0)}
                  </span>
                  {(equippedBonuses[s.key]??0)>0 && <span className="text-[6px] font-mono" style={{ color:`${s.color}80` }}>+{equippedBonuses[s.key]}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* 3-COLUMN BODY */}
          <div className="relative z-10 flex items-stretch" style={{ minHeight:300 }}>

            {/* LEFT — class selector */}
            <div className="flex flex-col items-center justify-center gap-2 py-4 shrink-0"
              style={{ width:66,borderRight:`1px solid ${archetypeData.color}12` }}>
              {ARCHETYPES.map(a => {
                const sel = a.id === archetype;
                const locked = rpgState.classLocked && rpgState.lockedClass === a.id;
                return (
                  <motion.button key={a.id} data-testid={`button-archetype-${a.id}`}
                    onClick={() => handleArchetypeClick(a.id)} whileTap={{ scale:0.9 }}
                    className="relative flex flex-col items-center justify-center rounded-xl"
                    style={{
                      width:54,height:58,
                      background:sel?`${a.color}1e`:'rgba(255,255,255,0.025)',
                      border:`1.5px solid ${sel?a.color:'rgba(255,255,255,0.06)'}`,
                      boxShadow:sel?`0 0 14px ${a.color}38,inset 0 0 10px ${a.color}0e`:'none',
                      transition:'all 0.25s ease',
                    }}>
                    <div className="w-8 h-9 flex items-end justify-center overflow-hidden">
                      <ArchetypeAvatar id={a.id} color={a.color} accent={a.accent}/>
                    </div>
                    <span className="text-[7px] font-mono font-bold uppercase tracking-tight leading-none mt-0.5"
                      style={{ color:sel?a.color:'rgba(255,255,255,0.25)' }}>{a.name}</span>
                    {locked && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center"
                        style={{ background:a.color, fontSize:7 }}>🔒</div>
                    )}
                    {sel && (
                      <motion.div layoutId="activeIndicator"
                        className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full"
                        style={{ background:a.color,boxShadow:`0 0 6px ${a.color}` }}/>
                    )}
                  </motion.button>
                );
              })}
              {!rpgState.classLocked && (
                <div className="text-[6px] font-mono text-center leading-tight px-1" style={{ color:'rgba(255,255,255,0.20)' }}>
                  TAP TO<br/>LOCK IN
                </div>
              )}
            </div>

            {/* CENTER — character */}
            <div className="flex-1 flex flex-col items-center justify-end pb-2 px-1 relative overflow-hidden">
              <div className="absolute top-2 left-0 right-0 text-center">
                <span className="text-[8px] font-mono uppercase tracking-[0.18em]"
                  style={{ color:archetypeData.color,opacity:.55 }}>{archetypeData.tagline}</span>
              </div>
              <motion.div key={archetype} initial={{ opacity:0,scale:0.9 }} animate={{ opacity:1,scale:1 }}
                transition={{ duration:0.3 }} className="relative flex items-end justify-center"
                style={{ width:130,height:230,animation:'rpgFloat 5s ease-in-out infinite' }}>
                <RankAura rank={rank} color={evTier.color}/>
                <ArchetypeAvatar id={archetype} color={archetypeData.color} accent={archetypeData.accent}/>
                {['B','A','S'].includes(rank) && (
                  <div className="absolute pointer-events-none" style={{
                    top:'20%',left:'50%',transform:'translateX(-50%)',
                    width:8,height:4,borderRadius:'50%',
                    background:evTier.color,filter:'blur(2px)',
                    animation:'rpgBlink 3.2s ease-in-out infinite',
                  }}/>
                )}
                {/* Equipped weapon glow overlay */}
                {rpgState.equipped.weapon && (
                  <div className="absolute bottom-0 right-0 pointer-events-none"
                    style={{ fontSize:20, filter:`drop-shadow(0 0 8px ${RARITY_COLORS[rpgState.equipped.weapon.rarity]})` }}>
                    {rpgState.equipped.weapon.icon}
                  </div>
                )}
              </motion.div>
              <div className="w-full flex justify-center -mt-4 relative z-10">
                <svg viewBox="0 0 160 60" fill="none" className="w-full max-w-[160px]">
                  <ellipse cx="80" cy="30" rx="72" ry="22" fill={archetypeData.color} opacity=".06"/>
                  <polygon points="80,8 116,22 116,42 80,56 44,42 44,22" fill={archetypeData.color} fillOpacity=".09" stroke={archetypeData.color} strokeWidth="1.5" strokeOpacity=".4"/>
                </svg>
              </div>
              <div className="text-center mt-0.5 relative z-10">
                <span className="text-[11px] font-display font-bold uppercase tracking-[0.18em]"
                  style={{ color:archetypeData.color }} data-testid="archetype-name-label">{archetypeData.name}</span>
                {rpgState.classLocked && rpgState.lockedClass === archetype && (
                  <span className="ml-1.5 text-[7px] font-mono px-1 py-0.5 rounded"
                    style={{ color:archetypeData.color,background:`${archetypeData.color}18`,border:`1px solid ${archetypeData.color}28` }}>LOCKED</span>
                )}
              </div>
            </div>

            {/* RIGHT — stat allocation */}
            <div className="flex flex-col justify-center py-4 px-2 shrink-0"
              style={{ width:86,borderLeft:`1px solid ${archetypeData.color}12` }}>
              <AnimatePresence>
                {statPoints > 0 && (
                  <motion.div initial={{ opacity:0,scale:0.85 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0 }}
                    className="mb-3 py-1 px-1.5 rounded text-center"
                    style={{ background:`${archetypeData.accent}1e`,border:`1px solid ${archetypeData.accent}3e` }}>
                    <span className="text-[8px] font-mono font-bold"
                      style={{ color:archetypeData.accent,animation:'rpgBlink 2s ease-in-out infinite' }}>
                      {statPoints} PTS FREE
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              {STAT_META.map(s => {
                const base   = displayStats[s.key]??1;
                const bonus  = equippedBonuses[s.key]??0;
                const canAdd = statPoints>0;
                const pend   = allocatingFor===s.key;
                return (
                  <div key={s.key} className="mb-3">
                    <div className="flex items-center justify-between gap-1.5">
                      <div>
                        <div className="flex items-center gap-1">
                          <span style={{ color:s.color,opacity:.7 }}>{s.icon}</span>
                          <span className="text-[7px] font-mono font-bold uppercase" style={{ color:s.color }}>{s.label}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-mono font-bold" style={{ color:s.color }}>{base+bonus}</span>
                          {bonus>0 && <span className="text-[7px] font-mono" style={{ color:`${s.color}70` }}>+{bonus}</span>}
                        </div>
                      </div>
                      <motion.button data-testid={`button-allocate-${s.label.toLowerCase()}`}
                        disabled={!canAdd||allocateMutation.isPending}
                        onClick={() => { if(!canAdd)return; setAllocatingFor(s.key); allocateMutation.mutate({stat:s.key}); }}
                        whileTap={canAdd?{scale:0.85}:{}}
                        className="flex items-center justify-center rounded-lg shrink-0"
                        style={{
                          width:26,height:26,
                          background:canAdd?`${s.color}1e`:'rgba(255,255,255,0.03)',
                          border:`1.5px solid ${canAdd?s.color:'rgba(255,255,255,0.07)'}`,
                          opacity:canAdd?1:0.25,
                          boxShadow:canAdd?`0 0 10px ${s.color}28`:'none',
                          cursor:canAdd?'pointer':'default',
                        }}>
                        {pend
                          ? <div className="rounded-full border-2 border-t-transparent animate-spin w-3 h-3" style={{ borderColor:s.color,borderTopColor:'transparent' }}/>
                          : <Plus size={12} style={{ color:canAdd?s.color:'rgba(255,255,255,0.18)' }}/>
                        }
                      </motion.button>
                    </div>
                    <div className="mt-1 w-full h-[3px] rounded-full overflow-hidden" style={{ background:`${s.color}10` }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width:`${Math.min(100,base+bonus)}%`,background:s.color,boxShadow:`0 0 4px ${s.color}` }}/>
                    </div>
                  </div>
                );
              })}
              {statPoints===0 && <p className="text-[7px] font-mono text-center leading-tight mt-1" style={{ color:'rgba(255,255,255,0.18)' }}>Level up to<br/>gain points</p>}
            </div>
          </div>
        </div>

        {/* ══ TAB BAR ═══════════════════════════════════════════════════════ */}
        <div className="flex sticky top-0 z-20"
          style={{ background:'#060a12',borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          {(['character','dungeon','gear'] as const).map(tab => {
            const labels: Record<string,string> = { character:'⚔  CHARACTER', dungeon:'🌑  DUNGEON', gear:'◆  GEAR' };
            const active = activeTab===tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                data-testid={`tab-${tab}`}
                className="flex-1 py-3 text-[10px] font-mono font-bold uppercase tracking-widest transition-all"
                style={{
                  color:active?archetypeData.color:'rgba(255,255,255,0.28)',
                  borderBottom:active?`2px solid ${archetypeData.color}`:'2px solid transparent',
                  background:active?`${archetypeData.color}07`:'transparent',
                }}>
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* ══ DUNGEON TAB ════════════════════════════════════════════════════ */}
        {activeTab==='dungeon' && (
          <div className="px-4 py-4 space-y-4" data-testid="dungeon-tab">
            {dungeonPhase==='idle' && (
              <>
                {/* Dungeon card */}
                <div className="relative rounded-2xl overflow-hidden"
                  style={{ background:'linear-gradient(135deg,#0d1f35 0%,#081424 100%)',border:'1px solid rgba(59,130,246,0.22)',boxShadow:'0 0 28px rgba(59,130,246,0.10)' }}>
                  <div className="px-4 pt-4 pb-2 flex items-start justify-between">
                    <div>
                      <div className="text-[8px] font-mono uppercase tracking-[0.22em]" style={{ color:'rgba(59,130,246,0.55)' }}>SHADOW GATE · INSTANCE 001</div>
                      <div className="font-display font-black text-xl mt-0.5" style={{ color:'#e2e8f0',letterSpacing:'0.04em' }}>Shadow Forest</div>
                      <div className="text-[9px] font-mono mt-0.5" style={{ color:'rgba(255,255,255,0.32)' }}>Boss: Fang Wolf · 5 Waves</div>
                    </div>
                    <div className="text-4xl" style={{ filter:'drop-shadow(0 0 10px rgba(59,130,246,0.5))' }}>🌑</div>
                  </div>
                  <p className="px-4 text-[9px] leading-relaxed pb-2" style={{ color:'rgba(255,255,255,0.28)' }}>
                    Dark forest. Neon mist. Something watches from between the trees.
                  </p>
                  <div className="mx-4 mb-3 rounded-xl px-3 py-2 flex items-center justify-between"
                    style={{ background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.16)' }}>
                    <span className="text-[8px] font-mono" style={{ color:'rgba(59,130,246,0.65)' }}>REWARDS</span>
                    <div className="flex gap-3 text-[9px] font-mono">
                      <span style={{ color:'#f59e0b' }}>✦ 80–160 XP</span>
                      <span style={{ color:'#fbbf24' }}>◆ 45–90G</span>
                      <span style={{ color:'#a855f7' }}>◈ Gear</span>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    {onCooldown ? (
                      <div className="w-full py-3 rounded-xl text-center font-mono text-xs"
                        style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',color:'rgba(255,255,255,0.32)' }}>
                        COOLDOWN — {Math.ceil(cooldownRemaining/60000)}m remaining
                      </div>
                    ) : (
                      <motion.button whileTap={{ scale:0.97 }} onClick={() => setDungeonPhase('battle')}
                        data-testid="button-enter-dungeon"
                        className="w-full py-3 rounded-xl font-display font-black text-sm uppercase tracking-widest"
                        style={{ background:'linear-gradient(135deg,#1d4ed8,#2563eb)',color:'#e0f2fe',letterSpacing:'0.14em',boxShadow:'0 4px 22px rgba(37,99,235,0.40)' }}>
                        ⚔ ENTER DUNGEON
                      </motion.button>
                    )}
                  </div>
                </div>
              </>
            )}

            {dungeonPhase==='battle' && (
              <VisualBattleScene
                archetype={archetypeData}
                displayStats={displayStats}
                equippedBonuses={equippedBonuses}
                dungeon={dungeon}
                onBattleComplete={handleBattleComplete}
                onExit={() => setDungeonPhase('idle')}
              />
            )}

            {dungeonPhase==='results' && runResult && (
              <motion.div initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }}
                className="rounded-2xl p-5 text-center space-y-4"
                style={{ background:'linear-gradient(135deg,#0d1f35,#081a2e)',border:'1px solid rgba(245,158,11,0.32)',boxShadow:'0 0 40px rgba(245,158,11,0.12)' }}>
                <div className="text-4xl">🏆</div>
                <div className="font-display font-black text-xl uppercase tracking-widest"
                  style={{ color:'#f59e0b',textShadow:'0 0 24px rgba(245,158,11,0.45)' }}>DUNGEON CLEARED</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl py-2.5 px-3" style={{ background:'rgba(245,158,11,0.09)',border:'1px solid rgba(245,158,11,0.20)' }}>
                    <div className="text-[8px] font-mono uppercase tracking-widest mb-0.5" style={{ color:'rgba(245,158,11,0.55)' }}>XP GAINED</div>
                    <div className="font-display font-black text-xl" style={{ color:'#f59e0b' }}>+{runResult.xp}</div>
                  </div>
                  <div className="rounded-xl py-2.5 px-3" style={{ background:'rgba(251,191,36,0.09)',border:'1px solid rgba(251,191,36,0.20)' }}>
                    <div className="text-[8px] font-mono uppercase tracking-widest mb-0.5" style={{ color:'rgba(251,191,36,0.55)' }}>GOLD</div>
                    <div className="font-display font-black text-xl" style={{ color:'#fbbf24' }}>+{runResult.gold}G</div>
                  </div>
                </div>
                {runResult.gear && (
                  <div className="rounded-xl p-3 flex items-center gap-3"
                    style={{ background:`${RARITY_COLORS[runResult.gear.rarity]}0e`,border:`1px solid ${RARITY_COLORS[runResult.gear.rarity]}30` }}>
                    <span className="text-3xl" style={{ filter:`drop-shadow(0 0 8px ${RARITY_COLORS[runResult.gear.rarity]})` }}>{runResult.gear.icon}</span>
                    <div className="text-left">
                      <div className="font-bold text-sm" style={{ color:RARITY_COLORS[runResult.gear.rarity] }}>{runResult.gear.name}</div>
                      <div className="text-[9px] font-mono uppercase" style={{ color:`${RARITY_COLORS[runResult.gear.rarity]}80` }}>{runResult.gear.rarity} · {runResult.gear.slot}</div>
                    </div>
                    <span className="ml-auto text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ color:'#34d399',background:'rgba(52,211,153,0.10)' }}>NEW</span>
                  </div>
                )}
                <motion.button whileTap={{ scale:0.97 }} onClick={collectRewards}
                  data-testid="button-collect-rewards"
                  className="w-full py-3 rounded-xl font-display font-black text-sm uppercase tracking-widest"
                  style={{ background:'linear-gradient(135deg,#d97706,#f59e0b)',color:'#000',boxShadow:'0 4px 24px rgba(245,158,11,0.40)' }}>
                  COLLECT REWARDS
                </motion.button>
              </motion.div>
            )}
          </div>
        )}

        {/* ══ GEAR TAB ════════════════════════════════════════════════════════ */}
        {activeTab==='gear' && (
          <div className="px-4 py-4 space-y-4" data-testid="gear-tab">
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[0.16em] mb-2" style={{ color:'rgba(255,255,255,0.32)' }}>EQUIPPED</div>
              <div className="grid grid-cols-3 gap-2">
                {SLOTS.map(({ slot,label,icon }) => {
                  const eq = rpgState.equipped[slot];
                  const rc = eq ? RARITY_COLORS[eq.rarity] : 'rgba(255,255,255,0.14)';
                  return (
                    <div key={slot} className="rounded-xl p-3 flex flex-col items-center gap-1.5 relative"
                      style={{ background:eq?`${rc}07`:'rgba(255,255,255,0.025)',border:`1.5px solid ${eq?`${rc}38`:'rgba(255,255,255,0.07)'}`,boxShadow:eq?`0 0 14px ${RARITY_GLOW[eq.rarity]}`:'none' }}>
                      {eq ? (
                        <>
                          <span className="text-2xl" style={{ filter:`drop-shadow(0 0 6px ${rc})` }}>{eq.icon}</span>
                          <span className="text-[7px] font-mono font-bold text-center leading-tight" style={{ color:rc }}>{eq.name}</span>
                          <button onClick={() => unequipGear(slot)} className="absolute top-1 right-1 rounded p-0.5 opacity-35 hover:opacity-75">
                            <X size={10} style={{ color:'#fff' }}/>
                          </button>
                        </>
                      ) : (
                        <>
                          <span style={{ color:'rgba(255,255,255,0.16)' }}>{icon}</span>
                          <span className="text-[7px] font-mono uppercase" style={{ color:'rgba(255,255,255,0.20)' }}>{label}</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[0.16em] mb-2" style={{ color:'rgba(255,255,255,0.32)' }}>INVENTORY ({rpgState.inventory.length})</div>
              {rpgState.inventory.length===0 ? (
                <div className="rounded-xl p-6 text-center" style={{ background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)' }}>
                  <Package size={24} style={{ color:'rgba(255,255,255,0.12)',margin:'0 auto 8px' }}/>
                  <p className="text-[10px] font-mono" style={{ color:'rgba(255,255,255,0.22)' }}>Complete dungeons to earn gear</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {rpgState.inventory.map((item,i) => {
                    const rc = RARITY_COLORS[item.rarity];
                    return (
                      <motion.button key={`${item.id}-${i}`} whileTap={{ scale:0.93 }}
                        onClick={() => setSelectedGear(item)} data-testid={`gear-item-${item.id}`}
                        className="rounded-xl p-2.5 flex flex-col items-center gap-1 relative"
                        style={{ background:`${rc}07`,border:`1.5px solid ${rc}28`,boxShadow:`0 0 10px ${RARITY_GLOW[item.rarity]}` }}>
                        <span className="text-2xl" style={{ filter:`drop-shadow(0 0 5px ${rc})` }}>{item.icon}</span>
                        <span className="text-[7px] font-mono font-bold text-center leading-tight" style={{ color:rc }}>{item.name}</span>
                        <span className="text-[6px] font-mono uppercase" style={{ color:`${rc}75` }}>{item.rarity}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ CHARACTER TAB EXTRAS ════════════════════════════════════════════ */}
        {activeTab==='character' && (
          <div className="px-4 py-4 space-y-3" data-testid="character-tab-extras">
            {!rpgState.classLocked && (
              <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }}
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.25)' }}>
                <span className="text-xl">⚠️</span>
                <div>
                  <div className="text-[10px] font-display font-bold" style={{ color:'#f59e0b' }}>SELECT YOUR CLASS</div>
                  <div className="text-[9px]" style={{ color:'rgba(255,255,255,0.40)' }}>Tap a class on the left to lock it in and receive starter equipment.</div>
                </div>
              </motion.div>
            )}
            {/* Equipped gear summary */}
            <div className="text-[9px] font-mono uppercase tracking-[0.16em] mb-1" style={{ color:'rgba(255,255,255,0.28)' }}>EQUIPPED GEAR</div>
            <div className="grid grid-cols-3 gap-2">
              {SLOTS.map(({ slot,label,icon }) => {
                const eq = rpgState.equipped[slot];
                const rc = eq ? RARITY_COLORS[eq.rarity] : 'rgba(255,255,255,0.10)';
                return (
                  <div key={slot} className="rounded-xl p-2.5 flex items-center gap-2"
                    style={{ background:eq?`${rc}07`:'rgba(255,255,255,0.02)',border:`1px solid ${eq?`${rc}28`:'rgba(255,255,255,0.05)'}` }}>
                    {eq ? (
                      <>
                        <span style={{ fontSize:18 }}>{eq.icon}</span>
                        <div className="min-w-0">
                          <div className="text-[7px] font-mono font-bold truncate" style={{ color:rc }}>{eq.name}</div>
                          <div className="text-[6px] font-mono" style={{ color:`${rc}65` }}>
                            {Object.entries(eq.stats).map(([s,v])=>`+${v} ${s.slice(0,3).toUpperCase()}`).join(' ')}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <span style={{ color:'rgba(255,255,255,0.14)' }}>{icon}</span>
                        <span className="text-[7px] font-mono" style={{ color:'rgba(255,255,255,0.18)' }}>{label} —</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl px-4 py-3" style={{ background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[8px] font-mono leading-relaxed" style={{ color:'rgba(255,255,255,0.25)' }}>
                ◈ Complete daily habits to earn stat XP in real life.<br/>
                ◈ STR · AGI · VIT · SEN each map to a real habit type.<br/>
                ◈ Level up in life → evolve your character in-game.
              </div>
            </div>
          </div>
        )}

        <div className="pb-8"/>
      </div>
    </SystemLayout>
  );
}
