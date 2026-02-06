import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Swords, Wind, Eye, Heart, Play, Square, Clock, Zap, Plus, Check, Timer, RotateCcw, Pause } from "lucide-react";
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
  instructions?: string;
}

const DEFAULT_EXERCISES: Record<string, StatExercise[]> = {
  strength: [
    { id: "pushups", name: "Pushups (3 sets)", targetValue: 30, unit: "reps" },
    { id: "abs", name: "Abs (3 sets)", targetValue: 30, unit: "reps" },
    { id: "squats", name: "Squats (3 sets)", targetValue: 30, unit: "reps" },
    { id: "cardio", name: "Cardio", targetValue: 15, unit: "minutes" },
  ],
  agility: [
    { id: "sprint", name: "Sprint Training", targetValue: 5, unit: "minutes" },
  ],
  sense: [
    { id: "meditation", name: "Meditation", targetValue: 5, unit: "minutes", instructions: "Breathe in for 4 seconds, breathe out for 6 seconds." },
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

const TIMER_PRESETS: Record<string, { label: string; seconds: number }[]> = {
  strength: [
    { label: "30s", seconds: 30 },
    { label: "60s", seconds: 60 },
    { label: "90s", seconds: 90 },
    { label: "2m", seconds: 120 },
    { label: "3m", seconds: 180 },
  ],
  agility: [
    { label: "15s", seconds: 15 },
    { label: "30s", seconds: 30 },
    { label: "60s", seconds: 60 },
    { label: "90s", seconds: 90 },
    { label: "2m", seconds: 120 },
  ],
  sense: [
    { label: "1m", seconds: 60 },
    { label: "3m", seconds: 180 },
    { label: "5m", seconds: 300 },
    { label: "10m", seconds: 600 },
    { label: "15m", seconds: 900 },
  ],
};

const TIMER_LABELS: Record<string, string> = {
  strength: "Rest / Tension Timer",
  agility: "Rest / Tension Timer",
  sense: "Meditation Timer",
};

function playBeep() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (startTime: number, freq: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = audioCtx.currentTime;
    playTone(now, 880, 0.15);
    playTone(now + 0.2, 880, 0.15);
    playTone(now + 0.4, 1100, 0.3);
  } catch (e) {}
}

function createBreathingAudioContext() {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
}

function playBreathSound(audioCtx: AudioContext, phase: "inhale" | "exhale") {
  const duration = phase === "inhale" ? 4 : 6;
  const baseFreq = phase === "inhale" ? 220 : 165;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = "sine";
  filter.type = "lowpass";
  filter.frequency.value = 400;

  const now = audioCtx.currentTime;

  if (phase === "inhale") {
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.2, now + duration);
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + duration * 0.6);
    gain.gain.linearRampToValueAtTime(0.08, now + duration);
  } else {
    osc.frequency.setValueAtTime(baseFreq * 1.1, now);
    osc.frequency.linearRampToValueAtTime(baseFreq, now + duration);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0.06, now + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
  }

  osc.start(now);
  osc.stop(now + duration);

  return { osc, gain };
}

function BreathingGuide({ isActive, color }: { isActive: boolean; color: string }) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "countdown" | "inhale" | "exhale">("idle");
  const [phaseTime, setPhaseTime] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
    intervalRef.current = null;
    phaseTimeoutRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startBreathingCycle = useCallback(() => {
    const runPhase = (currentPhase: "inhale" | "exhale") => {
      setPhase(currentPhase);
      setPhaseTime(0);
      const duration = currentPhase === "inhale" ? 4 : 6;

      try {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = createBreathingAudioContext();
        }
        playBreathSound(audioCtxRef.current, currentPhase);
      } catch (e) {}

      if (intervalRef.current) clearInterval(intervalRef.current);
      let elapsed = 0;
      intervalRef.current = setInterval(() => {
        elapsed++;
        setPhaseTime(elapsed);
      }, 1000);

      phaseTimeoutRef.current = setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const nextPhase = currentPhase === "inhale" ? "exhale" : "inhale";
        runPhase(nextPhase as "inhale" | "exhale");
      }, duration * 1000);
    };

    runPhase("inhale");
  }, []);

  const prevActiveRef = useRef(false);

  useEffect(() => {
    if (isActive && !prevActiveRef.current && phase === "idle") {
      setPhase("countdown");
      setCountdown(3);

      try {
        audioCtxRef.current = createBreathingAudioContext();
      } catch (e) {}

      let count = 3;
      const countdownInterval = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(countdownInterval);
          setCountdown(null);
          startBreathingCycle();
        } else {
          setCountdown(count);
        }
      }, 1000);
      intervalRef.current = countdownInterval;
    } else if (!isActive && prevActiveRef.current) {
      cleanup();
      setPhase("idle");
      setCountdown(null);
      setPhaseTime(0);
    }
    prevActiveRef.current = isActive;
  }, [isActive, phase, startBreathingCycle, cleanup]);

  const handleStart = () => {
    setPhase("countdown");
    setCountdown(3);

    try {
      audioCtxRef.current = createBreathingAudioContext();
    } catch (e) {}

    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(countdownInterval);
        setCountdown(null);
        startBreathingCycle();
      } else {
        setCountdown(count);
      }
    }, 1000);

    intervalRef.current = countdownInterval;
  };

  const handleStop = () => {
    cleanup();
    setPhase("idle");
    setCountdown(null);
    setPhaseTime(0);
  };

  const phaseDuration = phase === "inhale" ? 4 : phase === "exhale" ? 6 : 0;
  const progress = phaseDuration > 0 ? (phaseTime / phaseDuration) * 100 : 0;

  const circleSize = 100;
  const strokeWidth = 4;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="space-y-3 p-3 rounded-lg border border-white/10 bg-black/30" data-testid="breathing-guide">
      <div className="flex items-center gap-2 mb-1">
        <Eye size={12} style={{ color }} />
        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Breathing Guide</span>
      </div>

      {phase === "idle" && (
        <div className="text-center">
          <p className="text-[11px] text-muted-foreground/60 mb-2">
            Inhale 4s, Exhale 6s
          </p>
          <button
            onClick={handleStart}
            className="px-4 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: `${color}20`,
              border: `1px solid ${color}40`,
              color: color,
            }}
            data-testid="button-start-breathing"
          >
            <Play size={12} className="inline mr-1.5" />
            Start Breathing
          </button>
        </div>
      )}

      {phase === "countdown" && (
        <div className="text-center py-4">
          <div
            className="text-5xl font-mono font-bold animate-pulse"
            style={{ color }}
            data-testid="breathing-countdown"
          >
            {countdown}
          </div>
          <div className="text-xs text-muted-foreground/60 mt-2">Get ready...</div>
        </div>
      )}

      {(phase === "inhale" || phase === "exhale") && (
        <div className="flex flex-col items-center gap-2">
          <div className="relative" style={{ width: circleSize, height: circleSize }}>
            <svg width={circleSize} height={circleSize} className="transform -rotate-90">
              <circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={radius}
                fill="none"
                stroke={phase === "inhale" ? "#60a5fa" : "#34d399"}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className="text-lg font-bold"
                style={{ color: phase === "inhale" ? "#60a5fa" : "#34d399" }}
              >
                {phase === "inhale" ? "INHALE" : "EXHALE"}
              </div>
              <div className="text-xs font-mono text-white/50">
                {phaseTime}s / {phaseDuration}s
              </div>
            </div>
          </div>

          <button
            onClick={handleStop}
            className="px-3 py-1.5 rounded text-xs border border-white/20 text-white/60 hover:bg-white/10 transition-colors"
            data-testid="button-stop-breathing"
          >
            <Square size={10} className="inline mr-1" />
            Stop
          </button>
        </div>
      )}
    </div>
  );
}

function CountdownTimer({ stat, color }: { stat: string; color: string }) {
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasBeepedRef = useRef(false);

  const presets = TIMER_PRESETS[stat] || [];
  const label = TIMER_LABELS[stat] || "Timer";

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setHasFinished(true);
            if (!hasBeepedRef.current) {
              hasBeepedRef.current = true;
              playBeep();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return clearTimer;
    }
  }, [isRunning, remaining, clearTimer]);

  const startTimer = (seconds: number) => {
    clearTimer();
    hasBeepedRef.current = false;
    setTimerSeconds(seconds);
    setRemaining(seconds);
    setIsRunning(true);
    setHasFinished(false);
  };

  const handleCustomStart = () => {
    const val = parseInt(customInput);
    if (!isNaN(val) && val > 0) {
      startTimer(val);
      setCustomInput("");
    }
  };

  const togglePause = () => {
    if (isRunning) {
      clearTimer();
      setIsRunning(false);
    } else if (remaining > 0) {
      setIsRunning(true);
    }
  };

  const resetTimer = () => {
    clearTimer();
    setIsRunning(false);
    setHasFinished(false);
    setRemaining(0);
    setTimerSeconds(0);
    hasBeepedRef.current = false;
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress = timerSeconds > 0 ? ((timerSeconds - remaining) / timerSeconds) * 100 : 0;

  return (
    <div className="space-y-2 p-3 rounded-lg border border-white/10 bg-black/30">
      <div className="flex items-center gap-2 mb-1">
        <Timer size={12} style={{ color }} />
        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{label}</span>
      </div>

      {remaining > 0 || hasFinished ? (
        <div className="space-y-2">
          <div className="relative">
            <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${progress}%`, backgroundColor: color }}
              />
            </div>
          </div>

          <div className="text-center">
            <div
              className={`text-3xl font-mono font-bold ${hasFinished ? 'animate-pulse' : ''}`}
              style={{ color: hasFinished ? '#22c55e' : color }}
              data-testid="timer-display"
            >
              {hasFinished ? "00:00" : formatCountdown(remaining)}
            </div>
            {hasFinished && (
              <div className="text-xs text-green-400 mt-1">Time's up!</div>
            )}
          </div>

          <div className="flex gap-2 justify-center">
            {!hasFinished && (
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white/60 text-xs"
                onClick={togglePause}
                data-testid="button-timer-pause"
              >
                {isRunning ? <Pause size={12} className="mr-1" /> : <Play size={12} className="mr-1" />}
                {isRunning ? "Pause" : "Resume"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white/60 text-xs"
              onClick={resetTimer}
              data-testid="button-timer-reset"
            >
              <RotateCcw size={12} className="mr-1" />
              Reset
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {presets.map(preset => (
              <button
                key={preset.label}
                onClick={() => startTimer(preset.seconds)}
                className="px-2.5 py-1.5 rounded text-xs font-mono transition-colors"
                style={{
                  backgroundColor: `${color}15`,
                  border: `1px solid ${color}30`,
                  color: color,
                }}
                data-testid={`button-timer-${preset.seconds}`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              placeholder="sec"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-16 h-7 text-xs bg-black/50 border-white/20 text-center"
              min="1"
              data-testid="input-custom-timer"
              onKeyDown={(e) => e.key === 'Enter' && handleCustomStart()}
            />
            <button
              onClick={handleCustomStart}
              className="h-7 px-2 rounded text-[10px] transition-colors"
              style={{
                backgroundColor: `${color}20`,
                border: `1px solid ${color}40`,
                color: color,
              }}
              data-testid="button-custom-timer-start"
            >
              Start
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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

  const STAT_XP: Record<string, number> = {
    strength: 15,
    sense: 5,
    agility: 5,
    vitality: 5,
  };

  const calculateXP = (_duration: number) => {
    return STAT_XP[stat] || 5;
  };

  const handleStartSession = () => {
    onStartSession(stat, defaultDuration);
  };

  const handleCompleteSession = () => {
    const duration = activeSession?.scheduledDuration || defaultDuration;
    const xp = calculateXP(duration);
    onCompleteSession(stat, duration, xp);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/95 border-primary/20 max-w-sm max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ 
                background: `linear-gradient(135deg, ${config.color}30 0%, transparent 100%)`,
                boxShadow: `0 0 15px ${config.color}40`
              }}
            >
              <Icon size={20} style={{ color: config.color }} />
            </div>
            <div>
              <span className="text-base font-display tracking-wider" style={{ color: config.color }}>
                {config.label}
              </span>
              <div className="text-[9px] text-muted-foreground/60 font-mono">
                {multiplier}x XP
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1 overflow-y-auto flex-1 min-h-0">
          <div className="p-2 rounded-lg bg-gradient-to-r from-black/40 to-black/20 border border-white/5">
            <div className="flex items-start gap-2">
              <Zap size={12} className="text-primary/60 mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground/80 italic leading-snug">
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
                      {exercise.instructions && (
                        <div className="text-[10px] text-muted-foreground/60 italic leading-tight mt-0.5">
                          {exercise.instructions}
                        </div>
                      )}
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

          {stat === "sense" ? (
            <BreathingGuide isActive={isActiveForThisStat} color={config.color} />
          ) : (stat === "strength" || stat === "agility") ? (
            <CountdownTimer stat={stat} color={config.color} />
          ) : null}

          {scheduledBlocks.length > 0 && (
            <div className="space-y-1">
              <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1">
                <Clock size={9} />
                Scheduled
              </div>
              <div className="space-y-1">
                {scheduledBlocks.slice(0, 2).map(block => (
                  <div 
                    key={block.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-[11px] ${
                      block === currentBlock ? 'ring-1 ring-primary/40' : ''
                    }`}
                    style={{ backgroundColor: `${block.color}20` }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ 
                        backgroundColor: block.color,
                        boxShadow: block.isSystemTask ? `0 0 6px ${block.color}` : 'none'
                      }}
                    />
                    <span className="flex-1 text-white/70 truncate">{block.name}</span>
                    <span className="text-muted-foreground/50 font-mono text-[9px] shrink-0">
                      {block.startHour}:00 - {block.endHour}:00
                    </span>
                    {block === currentBlock && (
                      <span className="text-[8px] text-primary font-bold shrink-0">NOW</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-1">
            {isActiveForThisStat ? (
              <Button
                className="w-full bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30"
                onClick={handleCompleteSession}
                data-testid="button-complete-session"
              >
                <Square size={14} className="mr-2" />
                Complete Session
              </Button>
            ) : (
              <Button
                className="w-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 text-primary hover:border-primary/50"
                onClick={handleStartSession}
                style={{ boxShadow: `0 0 20px ${config.color}20` }}
                data-testid="button-start-session"
              >
                <Play size={16} className="mr-2" />
                Start Session
              </Button>
            )}
          </div>

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
