import React, { useState, useEffect } from "react";
import { SystemLayout } from "@/components/game/SystemLayout";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Shield, Sword, Skull, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/context/GameContext";
import { useToast } from "@/hooks/use-toast";

interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  exp: number;
  rank: string;
}

const dungeonList = [
    { id: 1, name: "Subway Station", rank: "E", minLevel: 1, enemies: ["Shadow Wolf", "Hungry Goblin"] },
    { id: 2, name: "Goblin Forest", rank: "D", minLevel: 5, enemies: ["Goblin Shaman", "Hobgoblin"] },
    { id: 3, name: "Red Gate", rank: "B", minLevel: 15, enemies: ["Ice Bear", "White Walker"] },
];

export default function DungeonPage() {
  const { player, isLoading, gainExp, modifyHp, modifyMp } = useGame();
  const { toast } = useToast();
  const [activeDungeon, setActiveDungeon] = useState<any>(null);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [isFighting, setIsFighting] = useState(false);

  const startDungeon = (dungeon: any) => {
    if (!player) return;
    if (player.level < dungeon.minLevel) {
        toast({ title: "LEVEL TOO LOW", description: `Required Level: ${dungeon.minLevel}`, variant: "destructive" });
        return;
    }
    setActiveDungeon(dungeon);
    spawnEnemy(dungeon);
    setBattleLog([`Entered ${dungeon.name}.`, `A wild enemy appeared!`]);
  };

  const spawnEnemy = (dungeon: any) => {
    if (!player) return;
    const name = dungeon.enemies[Math.floor(Math.random() * dungeon.enemies.length)];
    setEnemy({
        name,
        maxHp: 50 * player.level,
        hp: 50 * player.level,
        atk: 5 + player.level * 2,
        exp: 30 * player.level,
        rank: dungeon.rank
    });
  };

  const attack = () => {
    if (!player || !enemy || isFighting || player.hp <= 0) return;
    setIsFighting(true);

    // Player attacks
    const playerDamage = player.stats.strength * 2 + Math.floor(Math.random() * 5);
    const newEnemyHp = Math.max(0, enemy.hp - playerDamage);
    
    setBattleLog(prev => [`You dealt ${playerDamage} damage to ${enemy.name}!`, ...prev].slice(0, 5));
    setEnemy(prev => prev ? { ...prev, hp: newEnemyHp } : null);

    if (newEnemyHp <= 0) {
        setBattleLog(prev => [`Enemy defeated! Gained ${enemy.exp} EXP.`, ...prev].slice(0, 5));
        gainExp(enemy.exp);
        setTimeout(() => {
            spawnEnemy(activeDungeon);
            setIsFighting(false);
        }, 1000);
        return;
    }

    // Enemy attacks back
    setTimeout(() => {
        const enemyDamage = Math.max(1, enemy.atk - Math.floor(player.stats.agility / 2));
        modifyHp(-enemyDamage);
        setBattleLog(prev => [`${enemy.name} dealt ${enemyDamage} damage to you!`, ...prev].slice(0, 5));
        setIsFighting(false);
    }, 600);
  };

  const useSkill = () => {
    if (!player) return;
    if (player.mp < 20) {
        toast({ title: "NOT ENOUGH MP" });
        return;
    }
    modifyMp(-20);
    setBattleLog(prev => [`Used SKILL: CRITICAL STRIKE!`, ...prev].slice(0, 5));
    // Implementation of skill damage
    const skillDamage = player.stats.strength * 5;
    setEnemy(prev => prev ? { ...prev, hp: Math.max(0, prev.hp - skillDamage) } : null);
    if (enemy && enemy.hp - skillDamage <= 0) {
        gainExp(enemy.exp);
        setTimeout(() => spawnEnemy(activeDungeon), 1000);
    }
  };

  if (isLoading || !player) {
    return (
      <SystemLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-primary animate-pulse font-display text-xl tracking-widest">LOADING SYSTEM...</div>
        </div>
      </SystemLayout>
    );
  }

  return (
    <SystemLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b-2 border-primary pb-2">
            <div>
                <h1 className="text-3xl font-display font-bold text-primary tracking-tighter drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">DUNGEON</h1>
                <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase">
                    {activeDungeon ? activeDungeon.name : "Select Gate"}
                </p>
            </div>
            {activeDungeon && (
                <Button variant="ghost" size="sm" onClick={() => setActiveDungeon(null)} className="text-[10px] text-destructive">LEAVE</Button>
            )}
        </div>

        {!activeDungeon ? (
            <div className="grid gap-4">
                {dungeonList.map((d) => (
                    <motion.div
                        key={d.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => startDungeon(d)}
                        className="system-panel p-4 cursor-pointer border-l-4 border-primary group"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">{d.name}</h3>
                                <p className="text-xs text-muted-foreground">Rank {d.rank} • Min Lv. {d.minLevel}</p>
                            </div>
                            <Sword size={24} className="text-primary group-hover:animate-pulse" />
                        </div>
                    </motion.div>
                ))}
            </div>
        ) : (
            <div className="space-y-6">
                {/* Battle UI */}
                <AnimatePresence mode="wait">
                {enemy && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="system-panel p-6 text-center space-y-4"
                    >
                        <div className="flex flex-col items-center">
                            <Skull size={48} className="text-destructive mb-2 animate-bounce" />
                            <h2 className="text-xl font-display text-destructive tracking-widest">{enemy.name}</h2>
                            <div className="text-[10px] text-muted-foreground uppercase">Rank {enemy.rank} Enemy</div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                                <span>ENEMY HP</span>
                                <span>{enemy.hp} / {enemy.maxHp}</span>
                            </div>
                            <div className="h-2 w-full bg-red-950/30 border border-red-500/20">
                                <motion.div 
                                    initial={false}
                                    animate={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                                    className="h-full bg-red-600 shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* Log and Actions */}
                <div className="system-panel p-4 h-32 overflow-y-auto font-mono text-[10px] space-y-1 bg-black/40">
                    {battleLog.map((log, i) => (
                        <div key={i} className={log.includes('damage') ? 'text-destructive' : 'text-primary'}>
                            {`> ${log}`}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button 
                        onClick={attack} 
                        disabled={isFighting || player.hp <= 0}
                        className="h-16 font-display tracking-widest bg-primary text-primary-foreground hover:bg-primary/80 transition-all"
                    >
                        <Sword className="mr-2" size={20} /> ATTACK
                    </Button>
                    <Button 
                        onClick={useSkill}
                        disabled={isFighting || player.hp <= 0 || player.mp < 20}
                        variant="outline"
                        className="h-16 font-display tracking-widest border-accent text-accent hover:bg-accent/10"
                    >
                        <Zap className="mr-2" size={20} /> SKILL
                    </Button>
                </div>

                {player.hp <= 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="text-center p-4 bg-destructive/20 border border-destructive text-destructive font-display rounded"
                    >
                        YOU HAVE FAILED THE QUEST
                        <Button variant="link" className="text-white block mx-auto mt-2" onClick={() => window.location.reload()}>RESTART SYSTEM</Button>
                    </motion.div>
                )}
            </div>
        )}
      </div>
    </SystemLayout>
  );
}
