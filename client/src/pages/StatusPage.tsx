import React, { useState } from "react";
import { useGame } from "@/context/GameContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { Sectograph, type ScheduleBlock } from "@/components/game/Sectograph";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Pencil, X, Clock, Moon, Coffee, Book, Dumbbell, Gamepad2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jobsByRank, titlesByRank, getSkillsForClass } from "@/lib/classData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ACTIVITY_PRESETS = [
  { id: "sleep", name: "Sleep", icon: Moon, color: "#3b4d6b" },
  { id: "work", name: "Work", icon: Briefcase, color: "#4a6fa5", isSystemTask: true },
  { id: "study", name: "Study", icon: Book, color: "#5a8a72", isSystemTask: true },
  { id: "exercise", name: "Exercise", icon: Dumbbell, color: "#c97b63", isSystemTask: true },
  { id: "meal", name: "Meal", icon: Coffee, color: "#7d9d6a" },
  { id: "leisure", name: "Leisure", icon: Gamepad2, color: "#8b7aa3" },
];

export default function StatusPage() {
  const { player, isLoading, addStat, updatePlayer, systemMessage, clearSystemMessage } = useGame();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

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
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-primary/5 rounded-full blur-xl" />
            <Sectograph 
              schedule={player.schedule?.length ? player.schedule as ScheduleBlock[] : undefined}
              size={280}
              onCenterClick={() => setIsScheduleOpen(true)}
            />
          </div>
        </div>


        <div className="flex justify-center gap-6 px-4 pt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500/60" />
            <span className="text-[10px] font-mono text-muted-foreground/60">{player.hp}/{player.maxHp}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500/60" />
            <span className="text-[10px] font-mono text-muted-foreground/60">{player.mp}/{player.maxMp}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary/60" />
            <span className="text-[10px] font-mono text-muted-foreground/60">Lv.{player.level}</span>
          </div>
        </div>
      </div>

      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="bg-black/95 border-primary/20 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary/80 font-display text-sm flex items-center gap-2">
              <Clock size={16} />
              LIFE TIMELINE
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground/70">
              Design your day. System tasks glow with power.
            </p>
            
            <div className="grid grid-cols-3 gap-2">
              {ACTIVITY_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className="flex flex-col items-center p-3 rounded-lg border border-white/5 hover:border-primary/30 transition-all group"
                  style={{ backgroundColor: `${preset.color}15` }}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center mb-1"
                    style={{ 
                      backgroundColor: `${preset.color}30`,
                      boxShadow: preset.isSystemTask ? `0 0 12px ${preset.color}50` : 'none'
                    }}
                  >
                    <preset.icon size={16} style={{ color: preset.color }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground group-hover:text-white/80">{preset.name}</span>
                  {preset.isSystemTask && (
                    <span className="text-[8px] text-primary/60 mt-0.5">QUEST</span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Current Schedule</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {(player.schedule?.length ? player.schedule : [
                  { id: "sleep", name: "Sleep", startHour: 22, endHour: 6, color: "#3b4d6b" },
                  { id: "work", name: "Focus Work", startHour: 9, endHour: 12, color: "#4a6fa5", isSystemTask: true },
                  { id: "exercise", name: "Training", startHour: 17, endHour: 18, color: "#c97b63", isSystemTask: true },
                ]).map((block: any) => (
                  <div 
                    key={block.id}
                    className="flex items-center gap-2 p-2 rounded text-xs"
                    style={{ backgroundColor: `${block.color}20` }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ 
                        backgroundColor: block.color,
                        boxShadow: block.isSystemTask ? `0 0 6px ${block.color}` : 'none'
                      }}
                    />
                    <span className="flex-1 text-white/70">{block.name}</span>
                    <span className="text-muted-foreground/50 font-mono text-[10px]">
                      {block.startHour}:00 - {block.endHour}:00
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              className="w-full bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary/80 text-xs"
              onClick={() => setIsScheduleOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SystemLayout>
  );
}
