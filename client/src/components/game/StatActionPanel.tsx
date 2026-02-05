import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Swords, Wind, Eye, Heart, Play, Square, Clock, Zap, Plus, Check } from "lucide-react";
import { getDailyTip, STAT_MULTIPLIERS } from "@/lib/statTips";
import type { ScheduleBlock } from "./Sectograph";
import type { DailyStatProgress } from "@shared/schema";

interface ActiveSession {
  stat: string;
  startTime: number;
  scheduledDuration: number;
}

interface StatExercise {
  id: string;
  name: string;
  targetValue: number;
  unit: "reps" | "minutes" | "hours";
}

const DEFAULT_EXERCISES: Record<string, StatExercise[]> = {
  strength: [
    { id: "pushups", name: "Pushups", targetValue: 10, unit: "reps" },
    { id: "abs", name: "Abs", targetValue: 10, unit: "reps" },
    { id: "squats", name: "Squats", targetValue: 10, unit: "reps" },
  ],
  agility: [
    { id: "cardio", name: "Cardio Training", targetValue: 5, unit: "minutes" },
  ],
  sense: [
    { id: "meditation", name: "Meditation", targetValue: 5, unit: "minutes" },
  ],
  vitality: [
    { id: "sleep", name: "Sleep", targetValue: 7, unit: "hours" },
  ],
};

interface StatActionPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stat: string | null;
  schedule: ScheduleBlock[];
  onCompleteSession: (stat: string, duration: number, xp: number) => void;
  activeSession: ActiveSession | null;
  onStartSession: (stat: string, scheduledDuration: number) => void;
  onCancelSession: () => void;
  dailyProgress?: DailyStatProgress[];
  onUpdateProgress?: (stat: string, exerciseId: string, value: number) => void;
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
  dailyProgress = [],
  onUpdateProgress,
}: StatActionPanelProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [adjustedDuration, setAdjustedDuration] = useState(30);
  const [showDurationAdjust, setShowDurationAdjust] = useState(false);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const getTodayProgress = () => {
    const todayKey = getTodayKey();
    return dailyProgress.find(p => p.date === todayKey)?.progress || {};
  };

  const getExerciseProgress = (exerciseId: string): number => {
    const todayProgress = getTodayProgress();
    return stat ? (todayProgress[stat]?.[exerciseId] || 0) : 0;
  };

  const handleAddProgress = (exerciseId: string, exercise: StatExercise) => {
    if (!stat || !onUpdateProgress) return;
    const inputVal = inputValues[exerciseId];
    const addValue = inputVal ? parseFloat(inputVal) : 1;
    if (isNaN(addValue) || addValue <= 0) return;
    
    const currentValue = getExerciseProgress(exerciseId);
    onUpdateProgress(stat, exerciseId, currentValue + addValue);
    setInputValues(prev => ({ ...prev, [exerciseId]: '' }));
  };

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

          <div className="space-y-2">
            <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
              Daily Goals
            </div>
            <div className="space-y-2">
              {(DEFAULT_EXERCISES[stat] || []).map((exercise) => {
                const current = getExerciseProgress(exercise.id);
                const isComplete = current >= exercise.targetValue;
                const unitLabel = exercise.unit === "reps" ? "" : ` ${exercise.unit}`;
                
                return (
                  <div 
                    key={exercise.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border ${
                      isComplete 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-black/30 border-white/10'
                    }`}
                    data-testid={`exercise-${exercise.id}`}
                  >
                    <div className="flex-1">
                      <div className="text-xs text-white/80">{exercise.name}</div>
                      <div className="text-sm font-mono" style={{ color: isComplete ? '#22c55e' : config.color }}>
                        {current}/{exercise.targetValue}{unitLabel}
                      </div>
                    </div>
                    
                    {isComplete ? (
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check size={16} className="text-green-500" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          placeholder={exercise.unit === "reps" ? "1" : "1"}
                          value={inputValues[exercise.id] || ''}
                          onChange={(e) => setInputValues(prev => ({ ...prev, [exercise.id]: e.target.value }))}
                          className="w-14 h-8 text-xs bg-black/50 border-white/20 text-center"
                          min="0"
                          step={exercise.unit === "hours" ? "0.5" : "1"}
                          data-testid={`input-${exercise.id}`}
                        />
                        <button
                          onClick={() => handleAddProgress(exercise.id, exercise)}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                          style={{ 
                            backgroundColor: `${config.color}20`,
                            border: `1px solid ${config.color}40`
                          }}
                          data-testid={`button-add-${exercise.id}`}
                        >
                          <Plus size={16} style={{ color: config.color }} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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
