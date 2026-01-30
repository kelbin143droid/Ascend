import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Swords, Wind, Eye, Heart, Play, Square, Clock, Zap } from "lucide-react";
import { getDailyTip, STAT_MULTIPLIERS } from "@/lib/statTips";
import type { ScheduleBlock } from "./Sectograph";

interface ActiveSession {
  stat: string;
  startTime: number;
  scheduledDuration: number;
}

interface StatActionPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stat: string | null;
  schedule: ScheduleBlock[];
  onCompleteSession: (stat: string, duration: number, xp: number) => void;
  activeSession: ActiveSession | null;
  onStartSession: (stat: string, scheduledDuration: number) => void;
  onCancelSession: () => void;
}

const STAT_CONFIG: Record<string, { icon: typeof Swords; color: string; label: string }> = {
  strength: { icon: Swords, color: "#ff6b6b", label: "STRENGTH" },
  agility: { icon: Wind, color: "#4ecdc4", label: "AGILITY" },
  sense: { icon: Eye, color: "#ffe66d", label: "SENSE" },
  vitality: { icon: Heart, color: "#a855f7", label: "VITALITY" },
};

const STAT_TO_SCHEDULE_MAP: Record<string, string[]> = {
  strength: ["exercise", "training", "workout", "gym"],
  agility: ["exercise", "training", "sports"],
  sense: ["study", "work", "focus", "deep work", "meditation", "reading"],
  vitality: ["sleep", "rest", "recovery", "meal", "walk"],
};

export function StatActionPanel({
  open,
  onOpenChange,
  stat,
  schedule,
  onCompleteSession,
  activeSession,
  onStartSession,
  onCancelSession,
}: StatActionPanelProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [adjustedDuration, setAdjustedDuration] = useState(30);
  const [showDurationAdjust, setShowDurationAdjust] = useState(false);

  useEffect(() => {
    if (activeSession) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - activeSession.startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
    }
  }, [activeSession]);

  if (!stat) return null;

  const config = STAT_CONFIG[stat];
  if (!config) return null;

  const Icon = config.icon;
  const tip = getDailyTip(stat);
  const multiplier = STAT_MULTIPLIERS[stat] || 1;

  const getScheduledBlocks = () => {
    const keywords = STAT_TO_SCHEDULE_MAP[stat] || [];
    return schedule.filter(block => 
      keywords.some(kw => block.name.toLowerCase().includes(kw)) || block.isSystemTask
    );
  };

  const scheduledBlocks = getScheduledBlocks();
  const currentHour = new Date().getHours();
  
  const getCurrentBlock = () => {
    return scheduledBlocks.find(block => {
      if (block.endHour < block.startHour) {
        return currentHour >= block.startHour || currentHour < block.endHour;
      }
      return currentHour >= block.startHour && currentHour < block.endHour;
    });
  };

  const currentBlock = getCurrentBlock();
  const defaultDuration = currentBlock 
    ? (currentBlock.endHour > currentBlock.startHour 
        ? (currentBlock.endHour - currentBlock.startHour) * 60 
        : (24 - currentBlock.startHour + currentBlock.endHour) * 60)
    : 30;

  const isActiveForThisStat = activeSession?.stat === stat;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateXP = (duration: number) => {
    let xp = duration * multiplier;
    if (currentBlock) {
      xp *= 1.1;
    }
    return Math.round(xp);
  };

  const handleStartSession = () => {
    onStartSession(stat, defaultDuration);
  };

  const handleCompleteSession = () => {
    const duration = showDurationAdjust 
      ? adjustedDuration 
      : (activeSession?.scheduledDuration || defaultDuration);
    const xp = calculateXP(duration);
    onCompleteSession(stat, duration, xp);
    setShowDurationAdjust(false);
    onOpenChange(false);
  };

  const handleShowAdjust = () => {
    setAdjustedDuration(Math.max(1, Math.floor(elapsedTime / 60)));
    setShowDurationAdjust(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/95 border-primary/20 max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${config.color}30 0%, transparent 100%)`,
                boxShadow: `0 0 20px ${config.color}40`
              }}
            >
              <Icon size={24} style={{ color: config.color }} />
            </div>
            <div>
              <span className="text-lg font-display tracking-wider" style={{ color: config.color }}>
                {config.label}
              </span>
              <div className="text-[10px] text-muted-foreground/60 font-mono">
                {multiplier}x XP MULTIPLIER
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 rounded-lg bg-gradient-to-r from-black/40 to-black/20 border border-white/5">
            <div className="flex items-start gap-2">
              <Zap size={14} className="text-primary/60 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground/80 italic leading-relaxed">
                "{tip}"
              </p>
            </div>
          </div>

          {scheduledBlocks.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1">
                <Clock size={10} />
                Today's Scheduled Blocks
              </div>
              <div className="space-y-1">
                {scheduledBlocks.slice(0, 3).map(block => (
                  <div 
                    key={block.id}
                    className={`flex items-center gap-2 p-2 rounded text-xs ${
                      block === currentBlock ? 'ring-1 ring-primary/40' : ''
                    }`}
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
                    {block === currentBlock && (
                      <span className="text-[8px] text-primary font-bold">NOW</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {isActiveForThisStat ? (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="text-center py-4">
                  <div className="text-4xl font-mono font-bold text-primary mb-1">
                    {formatTime(elapsedTime)}
                  </div>
                  <div className="text-[10px] text-muted-foreground/60">
                    Session in progress
                  </div>
                </div>

                {showDurationAdjust ? (
                  <div className="space-y-3 p-3 rounded-lg bg-black/30 border border-primary/20">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Adjust Duration</span>
                      <span className="font-mono text-primary">{adjustedDuration} min</span>
                    </div>
                    <Slider
                      value={[adjustedDuration]}
                      onValueChange={([v]) => setAdjustedDuration(v)}
                      min={1}
                      max={180}
                      step={5}
                      className="py-2"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground/50">
                      <span>1 min</span>
                      <span>+{calculateXP(adjustedDuration)} XP</span>
                      <span>180 min</span>
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-muted-foreground/20 text-muted-foreground/60"
                    onClick={handleShowAdjust}
                  >
                    Adjust Time
                  </Button>
                  <Button
                    className="flex-1 bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30"
                    onClick={handleCompleteSession}
                  >
                    <Square size={14} className="mr-2" />
                    Complete
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <div className="text-center py-2">
                  <div className="text-sm text-muted-foreground/60 mb-1">
                    Default session: <span className="font-mono text-white/80">{defaultDuration} min</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground/40">
                    Estimated XP: +{calculateXP(defaultDuration)}
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 text-primary hover:border-primary/50"
                  onClick={handleStartSession}
                  style={{ boxShadow: `0 0 20px ${config.color}20` }}
                >
                  <Play size={16} className="mr-2" />
                  Start Session
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {activeSession && activeSession.stat !== stat && (
            <div className="text-center text-[10px] text-amber-400/70 py-2">
              Another session ({activeSession.stat}) is currently active
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
