import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Swords, Wind, Eye, Heart, Play, Square, Clock, Zap, Check, RotateCcw, Pause, ChevronRight, RefreshCw, List, TrendingUp } from "lucide-react";
import { ExerciseAnimation, RestAnimationComponent } from "./ExerciseAnimation";
import { hasAnimation } from "@/lib/animationRegistry";
import { getDailyTip, STAT_MULTIPLIERS } from "@/lib/statTips";
import {
  generateSession,
  generateDynamicSession,
  formatIntervalTime,
  getSessionSummary,
  getCompletionMessage,
  type TrainingSession,
  type TrainingLevel,
  type TrainingStat,
  type IntervalStep,
  type DynamicSessionConfig,
} from "@/lib/intervalTraining";
import type { ScheduleBlock } from "./Sectograph";
import type { DailyStatProgress } from "@shared/schema";

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
  dailyProgress?: DailyStatProgress[];
  onUpdateProgress?: (stat: string, exerciseId: string, value: number) => void;
  playerPhase?: number;
}

const STAT_CONFIG: Record<string, { icon: typeof Swords; color: string; label: string; description: string }> = {
  strength: { icon: Swords, color: "#ff6b6b", label: "STRENGTH", description: "Bodyweight & resistance training" },
  agility: { icon: Wind, color: "#4ecdc4", label: "FLEXIBILITY", description: "Yoga & mobility exercises" },
  sense: { icon: Eye, color: "#ffe66d", label: "MEDITATION", description: "Mindfulness & awareness practice" },
  vitality: { icon: Heart, color: "#a855f7", label: "VITALITY", description: "Recovery & health foundations" },
};

const STAT_TO_SCHEDULE_MAP: Record<string, string[]> = {
  strength: ["exercise", "training", "workout", "gym"],
  agility: ["exercise", "training", "yoga", "stretch", "flexibility"],
  sense: ["study", "work", "focus", "deep work", "meditation", "reading"],
  vitality: ["sleep", "rest", "recovery", "meal", "walk"],
};

const STAT_XP: Record<string, number> = {
  strength: 15,
  sense: 5,
  agility: 5,
  vitality: 5,
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

function playTransitionBeep() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 660;
    osc.type = "sine";
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.12);
  } catch (e) {}
}

interface IntervalPlayerProps {
  session: TrainingSession;
  color: string;
  onComplete: () => void;
  onCancel: () => void;
}

function IntervalPlayer({ session, color, onComplete, onCancel }: IntervalPlayerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepTimeLeft, setStepTimeLeft] = useState(session.steps[0]?.durationSeconds || 0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasBeepedRef = useRef(false);

  const totalSteps = session.steps.length;
  const currentStep = session.steps[currentStepIndex];
  const totalElapsed = session.steps.slice(0, currentStepIndex).reduce((s, step) => s + step.durationSeconds, 0) + (currentStep ? currentStep.durationSeconds - stepTimeLeft : 0);
  const overallProgress = (totalElapsed / session.totalDurationSeconds) * 100;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const startSession = () => {
    setCountdown(3);
    let count = 3;
    intervalRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        clearTimer();
        setCountdown(null);
        setIsRunning(true);
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  useEffect(() => {
    if (!isRunning || isPaused) return;

    intervalRef.current = setInterval(() => {
      setStepTimeLeft(prev => {
        if (prev <= 1) {
          const nextIndex = currentStepIndex + 1;
          if (nextIndex >= totalSteps) {
            clearTimer();
            setIsRunning(false);
            setIsFinished(true);
            if (!hasBeepedRef.current) {
              hasBeepedRef.current = true;
              playBeep();
            }
            return 0;
          }
          playTransitionBeep();
          setCurrentStepIndex(nextIndex);
          return session.steps[nextIndex].durationSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [isRunning, isPaused, currentStepIndex, totalSteps, session.steps, clearTimer]);

  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
    } else {
      clearTimer();
      setIsPaused(true);
    }
  };

  const circleSize = 140;
  const strokeWidth = 6;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const stepProgress = currentStep ? (stepTimeLeft / currentStep.durationSeconds) : 0;
  const strokeDashoffset = circumference * stepProgress;

  if (!isRunning && !isPaused && !isFinished && countdown === null) {
    return (
      <div className="space-y-4" data-testid="interval-session-ready">
        <div className="text-center">
          <div className="text-xs text-muted-foreground/60 mb-3">
            {getSessionSummary(session)}
          </div>

          <div className="space-y-1 mb-4 max-h-40 overflow-y-auto">
            {session.steps.filter(s => s.type === "work").map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1.5 rounded text-[11px] bg-white/5"
                data-testid={`session-step-${i}`}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                  style={{ backgroundColor: `${color}30`, color }}>
                  {i + 1}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-white/80 font-medium">{step.label}</div>
                  <div className="text-muted-foreground/50 text-[10px]">{step.variant}</div>
                </div>
                <div className="text-muted-foreground/40 font-mono text-[10px] shrink-0">
                  {step.durationSeconds}s
                </div>
              </div>
            ))}
          </div>

          <Button
            className="w-full"
            style={{
              backgroundColor: `${color}20`,
              border: `1px solid ${color}40`,
              color,
            }}
            onClick={startSession}
            data-testid="button-begin-interval"
          >
            <Play size={16} className="mr-2" />
            Begin Session
          </Button>
        </div>
      </div>
    );
  }

  if (countdown !== null) {
    return (
      <div className="text-center py-6" data-testid="interval-countdown">
        <div className="text-6xl font-mono font-bold animate-pulse" style={{ color }}>
          {countdown}
        </div>
        <div className="text-xs text-muted-foreground/60 mt-2">Get ready...</div>
      </div>
    );
  }

  if (isFinished) {
    const completionMsg = getCompletionMessage(session.stat);
    return (
      <div className="text-center py-4 space-y-4" data-testid="interval-complete">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, boxShadow: `0 0 30px ${color}40` }}>
          <Check size={32} style={{ color }} />
        </div>
        <div>
          <div className="text-lg font-display tracking-wider" style={{ color }}>SESSION COMPLETE</div>
          <div className="text-sm text-muted-foreground/70 mt-1 italic">"{completionMsg}"</div>
          <div className="text-xs text-muted-foreground/50 mt-2 font-mono">
            {Math.ceil(session.totalDurationSeconds / 60)} min completed
          </div>
        </div>
        <Button
          className="w-full"
          style={{
            backgroundColor: `${color}20`,
            border: `1px solid ${color}40`,
            color,
          }}
          onClick={onComplete}
          data-testid="button-claim-xp"
        >
          <Zap size={14} className="mr-2" />
          Claim +{STAT_XP[session.stat] || 5} XP
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="interval-active">
      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${overallProgress}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between items-center text-[9px] text-muted-foreground/40 font-mono">
        <span>Step {currentStepIndex + 1}/{totalSteps}</span>
        <span>{formatIntervalTime(totalElapsed)} / {formatIntervalTime(session.totalDurationSeconds)}</span>
      </div>

      <div className="flex flex-col items-center">
        {currentStep?.type === "work" && currentStep?.exercise && hasAnimation(currentStep.exercise.id) ? (
          <div className="relative mb-2">
            <ExerciseAnimation
              exerciseId={currentStep.exercise.id}
              color={color}
              size={160}
            />
            <div className="absolute bottom-0 right-0 px-2 py-0.5 rounded-full bg-black/60 border text-xs font-mono font-bold"
              style={{ borderColor: `${color}40`, color }}
              data-testid="interval-timer-display"
            >
              {formatIntervalTime(stepTimeLeft)}
            </div>
          </div>
        ) : currentStep?.type === "rest" ? (
          <div className="relative mb-2">
            <RestAnimationComponent color={color} size={160} />
            <div className="absolute bottom-0 right-0 px-2 py-0.5 rounded-full bg-black/60 border text-xs font-mono font-bold"
              style={{ borderColor: `${color}40`, color }}
              data-testid="interval-timer-display"
            >
              {formatIntervalTime(stepTimeLeft)}
            </div>
          </div>
        ) : (
          <div className="relative" style={{ width: circleSize, height: circleSize }}>
            <svg width={circleSize} height={circleSize} className="transform -rotate-90">
              <circle
                cx={circleSize / 2} cy={circleSize / 2} r={radius}
                fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth}
              />
              <circle
                cx={circleSize / 2} cy={circleSize / 2} r={radius}
                fill="none"
                stroke={currentStep?.type === "work" ? color : "#666"}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[10px] uppercase tracking-widest font-bold"
                style={{ color: currentStep?.type === "work" ? color : "#888" }}>
                {currentStep?.type === "work" ? "WORK" : "REST"}
              </div>
              <div className="text-3xl font-mono font-bold text-white/90" data-testid="interval-timer-display">
                {formatIntervalTime(stepTimeLeft)}
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-1 min-h-[36px]">
          <div className="text-sm font-medium text-white/90">{currentStep?.label}</div>
          <div className="text-[11px] text-muted-foreground/60 italic">{currentStep?.variant}</div>
        </div>

        {currentStepIndex + 1 < totalSteps && (
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground/30 mt-1">
            <ChevronRight size={10} />
            <span>Next: {session.steps[currentStepIndex + 1]?.label}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center pt-1">
        <Button
          variant="outline" size="sm"
          className="border-white/20 text-white/60 text-xs"
          onClick={togglePause}
          data-testid="button-interval-pause"
        >
          {isPaused ? <Play size={12} className="mr-1" /> : <Pause size={12} className="mr-1" />}
          {isPaused ? "Resume" : "Pause"}
        </Button>
        <Button
          variant="outline" size="sm"
          className="border-white/20 text-white/60 text-xs"
          onClick={onCancel}
          data-testid="button-interval-cancel"
        >
          <Square size={12} className="mr-1" />
          End
        </Button>
      </div>
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
  playerPhase = 1,
}: StatActionPanelProps) {
  const { player } = useGame();
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [showSessionTable, setShowSessionTable] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: trainingConfig } = useQuery({
    queryKey: ["training-config", player?.id, stat],
    queryFn: async () => {
      if (!player?.id || !stat) return null;
      const res = await fetch(`/api/player/${player.id}/training-config?stat=${stat}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!player?.id && !!stat && open,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!open) {
      setSession(null);
      setShowSessionTable(false);
      setIsPlaying(false);
    }
  }, [open]);

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

  const handleGenerateSession = () => {
    let newSession: TrainingSession;
    if (trainingConfig) {
      newSession = generateDynamicSession(stat as TrainingStat, {
        workSeconds: trainingConfig.workSeconds,
        restSeconds: trainingConfig.restSeconds,
        cycles: trainingConfig.cycles,
        exercisesPerCycle: trainingConfig.exercisesPerCycle,
        duration: trainingConfig.duration,
      });
    } else {
      newSession = generateSession(stat as TrainingStat, "beginner", playerPhase);
    }
    setSession(newSession);
    setShowSessionTable(true);
    setIsPlaying(false);
  };

  const handleStartPlaying = () => {
    if (!session) return;
    setIsPlaying(true);
    setShowSessionTable(false);
    onStartSession(stat, Math.ceil(session.totalDurationSeconds / 60));
  };

  const handleSessionComplete = () => {
    if (!stat) return;
    const duration = session ? Math.ceil(session.totalDurationSeconds / 60) : defaultDuration;
    const xp = STAT_XP[stat] || 5;
    onCompleteSession(stat, duration, xp);
    setIsPlaying(false);
    setSession(null);
    onOpenChange(false);
  };

  const handleSessionCancel = () => {
    setIsPlaying(false);
    onCancelSession();
  };

  const buildSessionTableRows = () => {
    if (!session) return [];
    let elapsed = 0;
    return session.steps.map((step, i) => {
      const start = elapsed;
      const end = elapsed + step.durationSeconds;
      elapsed = end;
      return { ...step, start, end, index: i };
    });
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
                {config.description} &bull; {multiplier}x XP
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

          {isPlaying && session ? (
            <IntervalPlayer
              session={session}
              color={config.color}
              onComplete={handleSessionComplete}
              onCancel={handleSessionCancel}
            />
          ) : showSessionTable && session ? (
            <div className="space-y-3" data-testid="session-table-view">
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                  Session Plan
                </div>
                <button
                  onClick={handleGenerateSession}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-colors"
                  style={{ color: config.color, backgroundColor: `${config.color}15` }}
                  data-testid="button-regenerate"
                >
                  <RefreshCw size={10} />
                  Shuffle
                </button>
              </div>

              <div className="text-[10px] text-muted-foreground/60 text-center">
                {getSessionSummary(session)}
              </div>

              <div className="space-y-0.5 max-h-48 overflow-y-auto" data-testid="session-interval-table">
                {buildSessionTableRows().map((row) => (
                  <div
                    key={row.index}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-[11px] ${
                      row.type === "work" ? "bg-white/5" : "bg-white/[0.02]"
                    }`}
                    data-testid={`interval-row-${row.index}`}
                  >
                    <div className="w-16 font-mono text-muted-foreground/40 text-[10px] shrink-0">
                      {formatIntervalTime(row.start)}-{formatIntervalTime(row.end)}
                    </div>
                    <div
                      className="w-1.5 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: row.type === "work" ? config.color : "#444" }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className={row.type === "work" ? "text-white/80" : "text-muted-foreground/40"}>
                        {row.label}
                      </span>
                      {row.type === "work" && (
                        <span className="text-muted-foreground/40 text-[10px] ml-1">
                          ({row.variant})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                style={{
                  backgroundColor: `${config.color}20`,
                  border: `1px solid ${config.color}40`,
                  color: config.color,
                  boxShadow: `0 0 20px ${config.color}15`,
                }}
                onClick={handleStartPlaying}
                data-testid="button-start-guided-session"
              >
                <Play size={16} className="mr-2" />
                Start Guided Session
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                Adaptive Training
              </div>

              {trainingConfig ? (
                <div
                  className="p-3 rounded-lg border"
                  style={{
                    backgroundColor: `${config.color}08`,
                    borderColor: `${config.color}25`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} style={{ color: config.color }} />
                      <span className="text-xs font-bold" style={{ color: config.color }}>
                        {trainingConfig.momentumTier?.label || "Building"}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60">
                      Phase {trainingConfig.phase}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-sm font-bold text-white">{trainingConfig.duration} min</div>
                      <div className="text-[9px] text-muted-foreground/50">Duration</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{trainingConfig.workSeconds}s</div>
                      <div className="text-[9px] text-muted-foreground/50">Work</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{trainingConfig.cycles}x{trainingConfig.exercisesPerCycle}</div>
                      <div className="text-[9px] text-muted-foreground/50">Cycles</div>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round((trainingConfig.momentum || 0) * 100)}%`,
                        backgroundColor: config.color,
                      }}
                    />
                  </div>
                  <div className="text-[9px] text-muted-foreground/40 mt-1 text-center">
                    Momentum: {Math.round((trainingConfig.momentum || 0) * 100)}% — difficulty scales with your consistency
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                  <div className="text-xs text-muted-foreground/60">
                    Loading adaptive config...
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                style={{
                  backgroundColor: `${config.color}20`,
                  border: `1px solid ${config.color}40`,
                  color: config.color,
                  boxShadow: `0 0 20px ${config.color}15`,
                }}
                onClick={handleGenerateSession}
                data-testid="button-generate-session"
              >
                <List size={14} className="mr-2" />
                Generate Session
              </Button>
            </div>
          )}

          {scheduledBlocks.length > 0 && !isPlaying && (
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

          {activeSession && activeSession.stat !== stat && !isPlaying && (
            <div className="text-center text-[10px] text-amber-400/70 py-2">
              Another session ({activeSession.stat}) is currently active
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
