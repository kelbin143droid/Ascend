import React from "react";
import { useGame } from "@/context/GameContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { StatRow } from "@/components/game/StatRow";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";

export default function StatusPage() {
  const { player, addStat } = useGame();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <SystemLayout>
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Header Section */}
        <motion.div variants={item} className="flex justify-between items-end border-b-2 border-primary pb-2">
            <div>
                <h1 className="text-3xl font-display font-bold text-primary tracking-tighter drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">STATUS</h1>
                <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase">Player Information</p>
            </div>
            <div className="text-right">
                 <span className="text-xs text-muted-foreground block">RANK</span>
                 <span className="text-2xl font-display font-bold text-destructive drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]">{player.rank}-Rank</span>
            </div>
        </motion.div>

        {/* Character Info Card */}
        <motion.div variants={item} className="system-panel p-4 rounded-sm space-y-4">
            <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                    <span className="text-muted-foreground block text-xs tracking-wider mb-1">NAME</span>
                    <span className="font-bold text-lg">{player.name}</span>
                </div>
                <div className="text-right">
                    <span className="text-muted-foreground block text-xs tracking-wider mb-1">LEVEL</span>
                    <span className="font-mono text-xl text-primary font-bold">{player.level}</span>
                </div>
                <div>
                    <span className="text-muted-foreground block text-xs tracking-wider mb-1">JOB</span>
                    <span className="font-bold">{player.job}</span>
                </div>
                <div className="text-right">
                    <span className="text-muted-foreground block text-xs tracking-wider mb-1">TITLE</span>
                    <span className="font-bold text-destructive text-xs md:text-sm">{player.title}</span>
                </div>
            </div>

            <Separator className="bg-primary/20" />

            <div className="space-y-3">
                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                        <span>HP</span>
                        <span className="font-mono text-primary">{player.hp} / {player.maxHp}</span>
                    </div>
                    <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                            className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                        <span>MP</span>
                        <span className="font-mono text-primary">{player.mp} / {player.maxMp}</span>
                    </div>
                    <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(player.mp / player.maxMp) * 100}%` }}
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(0,0,255,0.5)]"
                        />
                    </div>
                </div>
            </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div variants={item} className="system-panel p-4 rounded-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-display text-lg tracking-wider">STATS</h3>
                <div className="text-xs bg-primary/10 px-2 py-1 rounded border border-primary/20">
                    POINTS: <span className="font-mono font-bold text-primary">{player.availablePoints}</span>
                </div>
            </div>
            
            <div className="space-y-1">
                <StatRow label="STRENGTH" value={player.stats.strength} canAdd={player.availablePoints > 0} onAdd={() => addStat('strength')} />
                <StatRow label="AGILITY" value={player.stats.agility} canAdd={player.availablePoints > 0} onAdd={() => addStat('agility')} />
                <StatRow label="SENSE" value={player.stats.sense} canAdd={player.availablePoints > 0} onAdd={() => addStat('sense')} />
                <StatRow label="VITALITY" value={player.stats.vitality} canAdd={player.availablePoints > 0} onAdd={() => addStat('vitality')} />
                <StatRow label="INTEL" value={player.stats.intelligence} canAdd={player.availablePoints > 0} onAdd={() => addStat('intelligence')} />
            </div>
        </motion.div>

        {/* Equipment Mockup */}
        <motion.div variants={item} className="grid grid-cols-2 gap-4">
             <div className="system-panel p-3 rounded-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary flex items-center justify-center rounded border border-primary/30 text-primary">
                    🛡️
                </div>
                <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Equipped</div>
                    <div className="text-sm font-bold truncate">Basic Hunter Armor</div>
                </div>
             </div>
             <div className="system-panel p-3 rounded-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary flex items-center justify-center rounded border border-primary/30 text-primary">
                    🗡️
                </div>
                <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Weapon</div>
                    <div className="text-sm font-bold truncate">Kasaka's Fang</div>
                </div>
             </div>
        </motion.div>

      </motion.div>
    </SystemLayout>
  );
}
