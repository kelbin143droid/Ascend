import React, { useState } from "react";
import { useGame } from "@/context/GameContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { Sectograph } from "@/components/game/Sectograph";
import { StatRow } from "@/components/game/StatRow";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jobsByRank, titlesByRank, getSkillsForClass } from "@/lib/classData";

export default function StatusPage() {
  const { player, isLoading, addStat, updatePlayer, systemMessage, clearSystemMessage } = useGame();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
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

  const availableJobs = jobsByRank[player.rank] || jobsByRank["E"];
  const availableTitles = titlesByRank[player.rank] || titlesByRank["E"];

  const handleStartEditName = () => {
    setTempName(player.name);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      updatePlayer({ name: tempName.trim().toUpperCase() });
    }
    setIsEditingName(false);
  };

  const handleJobChange = (job: string) => {
    const newSkills = getSkillsForClass(job);
    updatePlayer({ job, skills: newSkills });
  };

  const handleTitleChange = (title: string) => {
    updatePlayer({ title });
  };

  return (
    <SystemLayout>
      <AnimatePresence>
        {systemMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className="fixed top-4 left-1/2 z-50 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 border border-primary/50 px-6 py-3 rounded-sm shadow-[0_0_20px_rgba(0,240,255,0.3)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-bold text-primary tracking-wide">{systemMessage}</span>
              <button data-testid="button-dismiss-message" onClick={clearSystemMessage} className="text-primary/60 hover:text-primary ml-2">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={item} className="flex justify-between items-end border-b-2 border-primary pb-2">
          <div>
            <h1 className="text-4xl font-display font-black text-primary tracking-tighter drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]">STATUS</h1>
            <p className="text-[10px] text-primary/60 tracking-[0.4em] uppercase font-bold">Awakened Hunter Interface</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block font-bold tracking-widest">RANK</span>
            <span className="text-3xl font-display font-black text-destructive drop-shadow-[0_0_12px_rgba(255,0,0,0.7)] animate-pulse">{player.rank}</span>
          </div>
        </motion.div>

        <motion.div variants={item} className="flex justify-center py-4">
          <Sectograph 
            stats={player.stats} 
            maxStat={Math.max(50, Math.max(player.stats.strength, player.stats.agility, player.stats.sense, player.stats.vitality) + 20)}
            size={220}
          />
        </motion.div>

        <motion.div variants={item} className="system-panel p-5 rounded-sm space-y-5 border-t-2 border-t-primary/50 relative">
          <div className="absolute top-2 right-2 flex gap-1">
            <div className="w-1 h-1 bg-primary animate-ping" />
            <div className="w-1 h-1 bg-primary/40" />
          </div>
          <div className="grid grid-cols-2 gap-y-5 text-sm">
            <div>
              <span className="text-primary/40 block text-[10px] font-bold tracking-[0.2em] mb-1">NAME</span>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input 
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="h-8 w-32 bg-black/50 border-primary/30 text-sm font-bold uppercase"
                    placeholder="ENTER NAME"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveName}>
                    <Check size={14} className="text-primary" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={handleStartEditName}>
                  <span className="font-black text-xl tracking-tight text-glow">
                    {player.name || "ENTER NAME"}
                  </span>
                  <Pencil size={12} className="text-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
            <div className="text-right">
              <span className="text-primary/40 block text-[10px] font-bold tracking-[0.2em] mb-1">LEVEL</span>
              <span className="font-mono text-3xl text-primary font-black drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">{player.level}</span>
            </div>
            <div>
              <span className="text-primary/40 block text-[10px] font-bold tracking-[0.2em] mb-1">JOB</span>
              <Select value={player.job} onValueChange={handleJobChange}>
                <SelectTrigger className="w-40 h-8 bg-black/50 border-primary/30 text-accent font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-primary/30">
                  {availableJobs.map((job) => (
                    <SelectItem key={job} value={job} className="text-accent font-bold">{job}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-right">
              <span className="text-primary/40 block text-[10px] font-bold tracking-[0.2em] mb-1">TITLE</span>
              <Select value={player.title} onValueChange={handleTitleChange}>
                <SelectTrigger className="w-40 h-8 bg-black/50 border-primary/30 text-destructive font-bold ml-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-primary/30">
                  {availableTitles.map((title) => (
                    <SelectItem key={title} value={title} className="text-destructive font-bold">{title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
                <span>Health Points</span>
                <span className="font-mono">{player.hp} / {player.maxHp}</span>
              </div>
              <div className="h-2.5 w-full bg-red-950/30 rounded-none border border-red-500/20 overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                  className="h-full bg-gradient-to-r from-red-700 via-red-500 to-red-400 shadow-[0_0_15px_rgba(255,0,0,0.6)]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] w-20 animate-[move_2s_infinite]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                <span>Mana Points</span>
                <span className="font-mono">{player.mp} / {player.maxMp}</span>
              </div>
              <div className="h-2.5 w-full bg-blue-950/30 rounded-none border border-blue-500/20 overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(player.mp / player.maxMp) * 100}%` }}
                  className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 shadow-[0_0_15px_rgba(0,0,255,0.6)]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] w-20 animate-[move_2s_infinite]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                <span>Experience Points</span>
                <span className="font-mono">{player.exp} / {player.maxExp}</span>
              </div>
              <div className="h-1.5 w-full bg-primary/10 rounded-none border border-primary/20 overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(player.exp / player.maxExp) * 100}%` }}
                  className="h-full bg-primary shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                />
              </div>
            </div>
          </div>
        </motion.div>

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
          </div>
        </motion.div>
      </motion.div>
    </SystemLayout>
  );
}
