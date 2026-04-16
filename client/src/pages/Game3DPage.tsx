import React, { useState, useCallback, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { SystemLayout } from '@/components/game/SystemLayout';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sword, Shield, Eye, Heart, Skull, ChevronRight, RotateCcw, Trophy, Package, Gamepad2, Plus, Zap } from 'lucide-react';

const GAME_STATS = [
  { label: "STR", name: "Strength",  key: "strength", color: "#ef4444", desc: "Increases attack damage" },
  { label: "AGI", name: "Agility",   key: "agility",  color: "#22c55e", desc: "Increases dodge chance" },
  { label: "VIT", name: "Vitality",  key: "vitality", color: "#f59e0b", desc: "Increases max HP" },
  { label: "SEN", name: "Sense",     key: "sense",    color: "#a855f7", desc: "Increases crit chance" },
];

interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  xpReward: number;
  icon: string;
}

interface Room {
  type: 'combat' | 'treasure' | 'empty' | 'boss' | 'start';
  enemy?: Enemy;
  loot?: { gold: number; item?: string };
  explored: boolean;
}

interface CombatLog {
  message: string;
  type: 'player' | 'enemy' | 'system';
}

const ENEMY_TEMPLATES = [
  { name: 'Shadow Goblin', hp: 30, attack: 5, defense: 2, xpReward: 15, icon: '👹' },
  { name: 'Cave Spider', hp: 20, attack: 8, defense: 1, xpReward: 12, icon: '🕷️' },
  { name: 'Stone Golem', hp: 60, attack: 4, defense: 6, xpReward: 25, icon: '🗿' },
  { name: 'Dark Mage', hp: 25, attack: 12, defense: 2, xpReward: 30, icon: '🧙' },
  { name: 'Undead Knight', hp: 50, attack: 7, defense: 5, xpReward: 35, icon: '💀' },
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
          const template = ENEMY_TEMPLATES[Math.floor(Math.random() * ENEMY_TEMPLATES.length)];
          row.push({ type: 'combat', enemy: { ...template, maxHp: template.hp }, explored: false });
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

export default function Game3DPage() {
  const { player, gainExp, modifyHp } = useGame();
  const queryClient = useQueryClient();

  const [dungeon, setDungeon] = useState<Room[][]>(() => generateDungeon());
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [inCombat, setInCombat] = useState(false);
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
  const [combatLog, setCombatLog] = useState<CombatLog[]>([]);
  const [goldCollected, setGoldCollected] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [playerTurn, setPlayerTurn] = useState(true);
  const [isDefending, setIsDefending] = useState(false);
  const [localHp, setLocalHp] = useState(player?.hp || 100);
  const [gameStarted, setGameStarted] = useState(false);

  const { data: playerData, refetch: refetchPlayer } = useQuery<any>({
    queryKey: ["/api/player", player?.id],
    queryFn: async () => {
      if (!player?.id) throw new Error("No player");
      const res = await fetch(`/api/player/${player.id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!player?.id,
    staleTime: 10000,
  });

  const allocateMutation = useMutation({
    mutationFn: async (stat: string) => {
      const res = await fetch(`/api/player/${player!.id}/allocate-stat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stat, amount: 1 }),
      });
      if (!res.ok) throw new Error("Failed to allocate");
      return res.json();
    },
    onSuccess: () => {
      refetchPlayer();
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
    },
  });

  const bonusStats = (playerData?.bonusStats as Record<string, number>) ?? { strength: 0, agility: 0, vitality: 0, sense: 0 };
  const statPoints = playerData?.statPoints ?? 0;

  const currentRoom = dungeon[position.y]?.[position.x];
  const stats = player?.stats || { strength: 10, agility: 10, sense: 10, vitality: 10 };
  const derived = {
    damage: Math.floor(5 + (stats.strength + (bonusStats.strength ?? 0)) * 1.5),
    dodgeChance: Math.min(0.5, (stats.agility + (bonusStats.agility ?? 0)) * 0.02),
    critChance: Math.min(0.3, (stats.sense + (bonusStats.sense ?? 0)) * 0.015),
    maxHp: 100 + (stats.vitality + (bonusStats.vitality ?? 0)) * 5,
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
  }, [currentEnemy, playerTurn, derived, addLog, gainExp, currentRoom, position]);

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
      const totalGold = room.loot.gold + senseBonus;
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

  return (
    <SystemLayout>
      <div className="space-y-4">

        {/* ── RPG CHARACTER SECTION ── */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(34,211,238,0.22)", backgroundColor: "rgba(6,182,212,0.04)" }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ borderBottom: "1px solid rgba(34,211,238,0.12)" }}
          >
            <Gamepad2 size={14} style={{ color: "#22d3ee" }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#22d3ee" }}>
              Future Game
            </span>
            <span
              className="ml-auto text-[9px] px-2 py-0.5 rounded-full font-mono"
              style={{ backgroundColor: "rgba(34,211,238,0.1)", color: "rgba(34,211,238,0.7)", border: "1px solid rgba(34,211,238,0.2)" }}
            >
              RPG CHARACTER
            </span>
          </div>

          <div className="px-4 py-3 space-y-3">
            <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
              Your daily habits shape your RPG character. Level up in real life to earn stat points — then allocate them below.
            </p>

            {/* Stat Points Available Banner */}
            {statPoints > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ backgroundColor: "rgba(34,211,238,0.10)", border: "1px solid rgba(34,211,238,0.30)" }}
              >
                <Zap size={12} style={{ color: "#22d3ee" }} />
                <span className="text-[11px] font-bold" style={{ color: "#22d3ee" }}>
                  {statPoints} stat point{statPoints !== 1 ? "s" : ""} available — allocate below!
                </span>
              </motion.div>
            )}

            {/* Stat Rows */}
            {GAME_STATS.map((stat) => {
              const allocated = bonusStats[stat.key] ?? 0;
              const canAllocate = statPoints > 0;
              return (
                <div key={stat.key} className="flex items-center gap-2" data-testid={`game-stat-${stat.key}`}>
                  {/* Label badge */}
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                    style={{ backgroundColor: `${stat.color}18`, color: stat.color, border: `1px solid ${stat.color}30` }}
                  >
                    {stat.label}
                  </span>
                  {/* Name + desc */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                      {stat.name}
                    </span>
                    <span className="text-[9px] ml-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {stat.desc}
                    </span>
                  </div>
                  {/* Points value */}
                  <span
                    className="text-sm font-mono font-bold shrink-0"
                    style={{ color: stat.color, minWidth: 28, textAlign: "right" }}
                  >
                    {allocated}
                  </span>
                  {/* Allocate button */}
                  {canAllocate && (
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => allocateMutation.mutate(stat.key)}
                      disabled={allocateMutation.isPending}
                      className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${stat.color}22`,
                        border: `1px solid ${stat.color}55`,
                        color: stat.color,
                        opacity: allocateMutation.isPending ? 0.5 : 1,
                      }}
                      data-testid={`button-allocate-${stat.key}`}
                    >
                      <Plus size={11} />
                    </motion.button>
                  )}
                </div>
              );
            })}

            {/* Derived stats summary */}
            <div
              className="mt-1 pt-3 grid grid-cols-2 gap-x-4 gap-y-1"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
              {[
                { icon: <Sword size={10} className="text-red-400" />, label: "Attack", val: derived.damage },
                { icon: <Shield size={10} className="text-blue-400" />, label: "Dodge", val: `${(derived.dodgeChance * 100).toFixed(0)}%` },
                { icon: <Eye size={10} className="text-yellow-400" />, label: "Crit", val: `${(derived.critChance * 100).toFixed(0)}%` },
                { icon: <Heart size={10} className="text-green-400" />, label: "Max HP", val: derived.maxHp },
              ].map(({ icon, label, val }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {icon} {label}
                  </span>
                  <span className="text-[9px] font-mono font-bold" style={{ color: "rgba(34,211,238,0.8)" }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Start Game / Enter Dungeon button */}
            {!gameStarted && (
              <button
                onClick={() => setGameStarted(true)}
                className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 mt-1 transition-all"
                style={{
                  background: "linear-gradient(135deg, rgba(34,211,238,0.85), rgba(14,165,233,0.85))",
                  color: "#000d14",
                  letterSpacing: "0.08em",
                  boxShadow: "0 4px 18px rgba(34,211,238,0.22)",
                }}
                data-testid="button-start-game"
              >
                <Gamepad2 size={13} />
                ENTER DUNGEON
              </button>
            )}
          </div>
        </div>

        {/* ── DUNGEON GAME (shown after START) ── */}
        {gameStarted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
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
                  {dungeon.map((row, y) =>
                    row.map((room, x) => {
                      const isPlayer = position.x === x && position.y === y;
                      const canMove = !inCombat && !gameOver &&
                        ((Math.abs(position.x - x) === 1 && position.y === y) ||
                         (Math.abs(position.y - y) === 1 && position.x === x));
                      return (
                        <button
                          key={`${x}-${y}`}
                          data-testid={`room-${x}-${y}`}
                          onClick={() => canMove && moveToRoom(x - position.x, y - position.y)}
                          disabled={!canMove}
                          className={`
                            aspect-square flex items-center justify-center text-lg rounded border transition-all
                            ${isPlayer ? 'bg-primary text-black border-primary ring-2 ring-primary/50' : ''}
                            ${room.explored && !isPlayer ? 'bg-secondary/50 border-primary/30' : ''}
                            ${!room.explored && !isPlayer ? 'bg-black/50 border-primary/10' : ''}
                            ${canMove ? 'hover:border-primary/60 cursor-pointer hover:bg-primary/20' : ''}
                            ${room.type === 'boss' && room.explored ? 'border-purple-500' : ''}
                          `}
                        >
                          {isPlayer ? '🧑' : room.explored ? (
                            room.type === 'combat' && room.enemy ? room.enemy.icon :
                            room.type === 'boss' && room.enemy ? room.enemy.icon :
                            room.type === 'treasure' ? '📦' :
                            room.type === 'start' ? '🚪' :
                            '·'
                          ) : '?'}
                        </button>
                      );
                    })
                  )}
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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="system-panel p-4 rounded-sm border-2 border-red-500/50"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                        <span className="text-2xl">{currentEnemy.icon}</span>
                        {currentEnemy.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-2 w-32 bg-red-950/50 rounded overflow-hidden">
                          <div className="h-full bg-red-500 transition-all" style={{ width: `${(currentEnemy.hp / currentEnemy.maxHp) * 100}%` }} />
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
                      <div key={i} className={`${log.type === 'player' ? 'text-cyan-400' : ''} ${log.type === 'enemy' ? 'text-red-400' : ''} ${log.type === 'system' ? 'text-yellow-400' : ''}`}>
                        {log.message}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button data-testid="button-attack" onClick={handleAttack} disabled={!playerTurn} className="flex-1 bg-red-600 hover:bg-red-500">
                      <Sword className="w-4 h-4 mr-2" /> Attack
                    </Button>
                    <Button data-testid="button-defend" onClick={handleDefend} disabled={!playerTurn} variant="outline" className="flex-1">
                      <Shield className="w-4 h-4 mr-2" /> Defend
                    </Button>
                  </div>
                  {!playerTurn && (
                    <div className="text-center mt-2 text-sm text-muted-foreground animate-pulse">Enemy is attacking...</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {(gameOver || victory) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                >
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

            {!inCombat && !gameOver && !victory && currentRoom?.type === 'empty' && (
              <div className="system-panel p-4 rounded-sm text-center text-muted-foreground">
                <p>An empty corridor. The shadows seem to watch you...</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </SystemLayout>
  );
}
