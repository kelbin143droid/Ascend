import React, { useState } from "react";
import { useGame } from "@/context/GameContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { Sectograph } from "@/components/game/Sectograph";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Pencil, X, Swords, Wind, Eye, Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jobsByRank, titlesByRank, getSkillsForClass } from "@/lib/classData";

export default function StatusPage() {
  const { player, isLoading, addStat, updatePlayer, systemMessage, clearSystemMessage } = useGame();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

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

  const statIcons = [
    { key: 'strength', label: 'Strength', icon: Swords, color: '#ff6b6b', value: player.stats.strength },
    { key: 'agility', label: 'Agility', icon: Wind, color: '#4ecdc4', value: player.stats.agility },
    { key: 'sense', label: 'Sense', icon: Eye, color: '#ffe66d', value: player.stats.sense },
    { key: 'vitality', label: 'Vitality', icon: Heart, color: '#a855f7', value: player.stats.vitality },
  ];

  return (
    <SystemLayout>
      <AnimatePresence>
        {systemMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className="fixed top-4 left-1/2 z-50 bg-gradient-to-r from-purple-500/20 via-primary/30 to-purple-500/20 border border-primary/50 px-6 py-3 rounded-sm shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-sm font-bold text-primary tracking-wide">{systemMessage}</span>
              <button data-testid="button-dismiss-message" onClick={clearSystemMessage} className="text-primary/60 hover:text-primary ml-2">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <div className="text-center space-y-1">
          {isEditingName ? (
            <div className="flex items-center justify-center gap-2">
              <Input 
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="h-10 w-48 bg-black/50 border-primary/30 text-xl font-display font-bold uppercase text-center"
                placeholder="ENTER NAME"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveName}>
                <Check size={16} className="text-primary" />
              </Button>
            </div>
          ) : (
            <div 
              className="flex items-center justify-center gap-2 cursor-pointer group"
              onClick={handleStartEditName}
            >
              <h1 className="text-3xl font-display font-black text-white tracking-wide drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                {player.name || "HUNTER"}
              </h1>
              <Pencil size={14} className="text-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
          
          <div className="flex items-center justify-center gap-3">
            <Select value={player.job} onValueChange={handleJobChange}>
              <SelectTrigger className="w-28 h-7 bg-black/30 border-purple-500/30 text-purple-400 text-xs font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/95 border-purple-500/30">
                {availableJobs.map((job) => (
                  <SelectItem key={job} value={job} className="text-purple-400 font-bold text-xs">{job}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="px-3 py-1 bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 rounded">
              <span className="text-primary font-mono font-bold text-sm">Lv.{player.level}</span>
            </div>
            
            <Select value={player.title} onValueChange={handleTitleChange}>
              <SelectTrigger className="w-28 h-7 bg-black/30 border-pink-500/30 text-pink-400 text-xs font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/95 border-pink-500/30">
                {availableTitles.map((title) => (
                  <SelectItem key={title} value={title} className="text-pink-400 font-bold text-xs">{title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-center py-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-primary/10 rounded-full blur-xl" />
            <Sectograph 
              stats={player.stats} 
              maxStat={Math.max(50, Math.max(player.stats.strength, player.stats.agility, player.stats.sense, player.stats.vitality) + 20)}
              size={260}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-[10px] text-muted-foreground tracking-widest">RANK</span>
          <span className="text-xl font-display font-black text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.6)]">{player.rank}</span>
          <span className="text-[10px] text-muted-foreground tracking-widest ml-4">POINTS</span>
          <span className="text-xl font-mono font-bold text-primary">{player.availablePoints}</span>
        </div>

        <div className="grid grid-cols-4 gap-2 px-2">
          {statIcons.map((stat) => (
            <motion.div
              key={stat.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center p-2 rounded-lg bg-gradient-to-b from-black/40 to-black/20 border border-white/10 relative group"
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                style={{ 
                  background: `linear-gradient(135deg, ${stat.color}30 0%, transparent 100%)`,
                  boxShadow: `0 0 15px ${stat.color}30`
                }}
              >
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <span className="text-lg font-mono font-bold text-white">{stat.value}</span>
              <span className="text-[8px] text-muted-foreground tracking-wider uppercase">{stat.label}</span>
              
              {player.availablePoints > 0 && (
                <button
                  data-testid={`button-add-${stat.key}`}
                  onClick={() => addStat(stat.key as 'strength' | 'agility' | 'sense' | 'vitality')}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary"
                >
                  <Plus size={12} className="text-black" />
                </button>
              )}
            </motion.div>
          ))}
        </div>

        <div className="space-y-2 px-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-red-400 font-bold tracking-wider w-8">HP</span>
            <div className="flex-1 h-3 bg-red-950/30 rounded-full border border-red-500/20 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                style={{ boxShadow: '0 0 10px rgba(239,68,68,0.5)' }}
              />
            </div>
            <span className="text-[10px] font-mono text-red-400 w-16 text-right">{player.hp}/{player.maxHp}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-blue-400 font-bold tracking-wider w-8">MP</span>
            <div className="flex-1 h-3 bg-blue-950/30 rounded-full border border-blue-500/20 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(player.mp / player.maxMp) * 100}%` }}
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                style={{ boxShadow: '0 0 10px rgba(59,130,246,0.5)' }}
              />
            </div>
            <span className="text-[10px] font-mono text-blue-400 w-16 text-right">{player.mp}/{player.maxMp}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-primary font-bold tracking-wider w-8">XP</span>
            <div className="flex-1 h-2 bg-primary/10 rounded-full border border-primary/20 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(player.exp / player.maxExp) * 100}%` }}
                className="h-full bg-gradient-to-r from-cyan-500 to-primary rounded-full"
                style={{ boxShadow: '0 0 8px rgba(0,255,255,0.4)' }}
              />
            </div>
            <span className="text-[10px] font-mono text-primary w-16 text-right">{player.exp}/{player.maxExp}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 px-2 pt-2">
          <div className="system-panel p-2 rounded flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-500/20 flex items-center justify-center rounded border border-purple-500/30">
              🗡️
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[8px] text-muted-foreground uppercase tracking-wider">Weapon</div>
              <div className="text-xs font-bold truncate">Kasaka's Fang</div>
            </div>
          </div>
          <div className="system-panel p-2 rounded flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-500/20 flex items-center justify-center rounded border border-purple-500/30">
              🛡️
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[8px] text-muted-foreground uppercase tracking-wider">Armor</div>
              <div className="text-xs font-bold truncate">Hunter Armor</div>
            </div>
          </div>
        </div>
      </div>
    </SystemLayout>
  );
}
