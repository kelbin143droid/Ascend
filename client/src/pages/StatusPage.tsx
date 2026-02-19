import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useRoles } from "@/context/RolesContext";
import { useWeeklyGoals } from "@/context/WeeklyGoalsContext";
import { useTasks } from "@/context/TasksContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { Sectograph, type ScheduleBlock } from "@/components/game/Sectograph";
import { StatActionPanel } from "@/components/game/StatActionPanel";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Check, Pencil, X, Clock, Moon, Coffee, Book, Sunrise, Gamepad2, Briefcase, Swords, Wind, Eye, Heart, Plus, Trash2, ChevronDown, ChevronLeft, ChevronRight, CalendarDays, Flame, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Quadrant, DailyStatProgress } from "@shared/schema";

const COLOR_OPTIONS = [
  "#3b4d6b", "#4a6fa5", "#5a8a72", "#c97b63", "#7d9d6a", "#8b7aa3",
  "#ff6b6b", "#4ecdc4", "#ffe66d", "#a855f7", "#f472b6", "#22d3ee"
];

const ACTIVITY_PRESETS = [
  { id: "strength", name: "Strength", icon: Swords, color: "#ff6b6b", isSystemTask: true, stat: "strength" },
  { id: "agility", name: "Agility", icon: Wind, color: "#4ecdc4", isSystemTask: true, stat: "agility" },
  { id: "sense", name: "Sense", icon: Eye, color: "#ffe66d", isSystemTask: true, stat: "sense" },
  { id: "vitality", name: "Vitality", icon: Heart, color: "#a855f7", isSystemTask: true, stat: "vitality" },
  { id: "sleep", name: "Sleep", icon: Moon, color: "#3b4d6b" },
  { id: "work", name: "Work", icon: Briefcase, color: "#4a6fa5", isSystemTask: true },
  { id: "study", name: "Study", icon: Book, color: "#5a8a72", isSystemTask: true },
  { id: "wakeup", name: "Wake Up", icon: Sunrise, color: "#f97316", isSystemTask: false },
  { id: "meal", name: "Meal", icon: Coffee, color: "#7d9d6a" },
  { id: "leisure", name: "Leisure", icon: Gamepad2, color: "#8b7aa3" },
  { id: "custom", name: "Custom", icon: Plus, color: "#6b7280" },
];

interface EditingBlock {
  id: string;
  name: string;
  description?: string;
  date?: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  color: string;
  isSystemTask?: boolean;
  isNew?: boolean;
  isTemplate?: boolean;
  roleId?: string;
  weeklyGoalId?: string;
  quadrant?: Quadrant;
}

const QUADRANT_OPTIONS: { value: Quadrant; label: string; description: string; color: string }[] = [
  { value: "Q1", label: "Q1", description: "Urgent & Important", color: "#ef4444" },
  { value: "Q2", label: "Q2", description: "Not Urgent & Important", color: "#22c55e" },
  { value: "Q3", label: "Q3", description: "Urgent & Not Important", color: "#f59e0b" },
  { value: "Q4", label: "Q4", description: "Not Urgent & Not Important", color: "#6b7280" },
];

export default function StatusPage() {
  const { 
    player, 
    isLoading, 
    updatePlayer, 
    systemMessage, 
    clearSystemMessage,
    activeSession,
    lastXpGain,
    startSession,
    completeSession,
    cancelSession,
    gainExp,
    addLevels
  } = useGame();
  const { roles, getDefaultRole, createRole } = useRoles();
  const { weeklyGoals, hasGoalsForCurrentWeek, getGoalsByRole } = useWeeklyGoals();
  const { createTask } = useTasks();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<EditingBlock | null>(null);
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [showTestMode, setShowTestMode] = useState(false);
  const [defaultRoleCreated, setDefaultRoleCreated] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  const selectedDateKey = formatDateKey(selectedDate);
  const isToday = formatDateKey(new Date()) === selectedDateKey;
  
  const isAdvancedMode = player?.planningMode === "advanced";
  
  const { data: weeklyAnalytics } = useQuery({
    queryKey: ["weekly-analytics", player?.id],
    queryFn: async () => {
      if (!player?.id) return null;
      const response = await fetch(`/api/weekly-analytics/${player.id}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!player?.id && isAdvancedMode,
    refetchInterval: 30000,
  });
  
  const goalLinkedPercentage = weeklyAnalytics?.goalLinkedPercentage ?? 100;
  
  useEffect(() => {
    if (player && roles.length === 0 && !defaultRoleCreated) {
      setDefaultRoleCreated(true);
      createRole({ name: "General", weeklyPriority: 0 });
    }
  }, [player, roles.length, defaultRoleCreated, createRole]);

  if (isLoading || !player) {
    return (
      <SystemLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-primary animate-pulse font-display text-xl tracking-widest">LOADING SYSTEM...</div>
        </div>
      </SystemLayout>
    );
  }


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


  const displayStats = player.displayStats || {
    strength: Math.floor(player.stats.strength),
    agility: Math.floor(player.stats.agility),
    sense: Math.floor(player.stats.sense),
    vitality: Math.floor(player.stats.vitality),
    stamina: Math.floor((player.stats as any).stamina || 0),
  };

  const statIcons = [
    { key: 'strength', label: 'STR', icon: Swords, color: '#ff6b6b', value: displayStats.strength },
    { key: 'agility', label: 'AGI', icon: Wind, color: '#4ecdc4', value: displayStats.agility },
    { key: 'sense', label: 'SEN', icon: Eye, color: '#ffe66d', value: displayStats.sense },
    { key: 'vitality', label: 'VIT', icon: Heart, color: '#a855f7', value: displayStats.vitality },
  ];

  const allScheduleBlocks: (ScheduleBlock & { date?: string; isTemplate?: boolean })[] = player.schedule?.length 
    ? player.schedule as (ScheduleBlock & { date?: string; isTemplate?: boolean })[] 
    : [];
  
  const currentSchedule: ScheduleBlock[] = allScheduleBlocks.filter(block => {
    if (block.date === selectedDateKey) return true;
    if (!block.date && block.isTemplate !== false) return true;
    return false;
  });

  const handlePresetClick = (preset: typeof ACTIVITY_PRESETS[0]) => {
    const existingBlock = currentSchedule.find(b => b.id === preset.id);
    
    if (existingBlock) {
      setEditingBlock({
        ...existingBlock,
        startMinute: existingBlock.startMinute ?? 0,
        endMinute: existingBlock.endMinute ?? 0,
        isNew: false,
      });
    } else {
      setEditingBlock({
        id: preset.id === 'custom' ? `custom_${Date.now()}` : `${preset.id}_${Date.now()}`,
        name: preset.id === 'custom' ? '' : preset.name,
        startHour: 9,
        startMinute: 0,
        endHour: 10,
        endMinute: 0,
        color: preset.color,
        isSystemTask: preset.isSystemTask,
        isNew: true,
        isTemplate: true,
      });
      if (preset.id === 'custom') {
        setCustomName('');
      }
    }
  };

  const handleSaveBlock = async () => {
    if (!editingBlock) return;
    
    const blockToSave = {
      ...editingBlock,
      name: editingBlock.id.startsWith('custom') ? customName || 'Custom Task' : editingBlock.name,
      description: editingBlock.id.startsWith('custom') ? customDescription : editingBlock.description,
    };
    delete (blockToSave as any).isNew;
    
    const isAdvancedMode = player.planningMode === "advanced";
    
    if (isAdvancedMode && !blockToSave.weeklyGoalId) {
      toast({
        title: "Not linked to weekly goal",
        description: "Consider linking tasks to goals for better alignment tracking.",
      });
    }
    
    const hasRequiredTags = blockToSave.roleId && blockToSave.quadrant;
    
    if (hasRequiredTags) {
      try {
        const today = new Date();
        const startTime = new Date(today);
        startTime.setHours(blockToSave.startHour, blockToSave.startMinute || 0, 0, 0);
        
        const endTime = new Date(today);
        const startTotalMinutes = blockToSave.startHour * 60 + (blockToSave.startMinute || 0);
        const endTotalMinutes = blockToSave.endHour * 60 + (blockToSave.endMinute || 0);
        if (endTotalMinutes <= startTotalMinutes) {
          endTime.setDate(endTime.getDate() + 1);
        }
        endTime.setHours(blockToSave.endHour, blockToSave.endMinute || 0, 0, 0);
        
        await createTask({
          roleId: blockToSave.roleId!,
          weeklyGoalId: blockToSave.weeklyGoalId,
          name: blockToSave.name,
          quadrant: blockToSave.quadrant!,
          startTime: startTime,
          endTime: endTime,
          color: blockToSave.color,
        });
      } catch (error) {
        console.error("Failed to persist task to database:", error);
      }
    }
    
    let newSchedule: (ScheduleBlock & { date?: string; isTemplate?: boolean })[];
    const blockFinal = { ...blockToSave };
    if (blockFinal.isTemplate) {
      delete blockFinal.date;
    } else if (!blockFinal.date) {
      blockFinal.date = selectedDateKey;
    }
    
    if (editingBlock.isNew) {
      newSchedule = [...allScheduleBlocks, blockFinal];
    } else {
      newSchedule = allScheduleBlocks.map(b => b.id === blockFinal.id ? blockFinal : b);
    }
    
    updatePlayer({ schedule: newSchedule });
    setEditingBlock(null);
    setCustomName('');
    setCustomDescription('');
  };

  const handleDeleteBlock = () => {
    if (!editingBlock) return;
    const newSchedule = allScheduleBlocks.filter(b => b.id !== editingBlock.id);
    updatePlayer({ schedule: newSchedule });
    setEditingBlock(null);
  };

  const handleEditExistingBlock = (block: ScheduleBlock & { description?: string; isTemplate?: boolean }) => {
    setEditingBlock({
      ...block,
      startMinute: block.startMinute ?? 0,
      endMinute: block.endMinute ?? 0,
      isNew: false,
      isTemplate: block.isTemplate !== false && !block.date,
    });
    if (block.id.startsWith('custom')) {
      setCustomName(block.name);
      setCustomDescription(block.description || '');
    }
  };

  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const handleUpdateProgress = (stat: string, exerciseId: string, newValue: number) => {
    const todayKey = getTodayKey();
    const existingProgress: DailyStatProgress[] = (player.dailyStatProgress as DailyStatProgress[]) || [];
    
    const todayIndex = existingProgress.findIndex(p => p.date === todayKey);
    let updatedProgress: DailyStatProgress[];
    
    if (todayIndex >= 0) {
      updatedProgress = existingProgress.map((p, i) => {
        if (i === todayIndex) {
          return {
            ...p,
            progress: {
              ...p.progress,
              [stat]: {
                ...(p.progress[stat] || {}),
                [exerciseId]: newValue
              }
            }
          };
        }
        return p;
      });
    } else {
      updatedProgress = [
        ...existingProgress,
        {
          date: todayKey,
          progress: {
            [stat]: {
              [exerciseId]: newValue
            }
          }
        }
      ];
    }
    
    updatePlayer({ dailyStatProgress: updatedProgress });
    toast({
      title: "Progress Updated",
      description: `+${newValue} recorded!`,
    });
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
          ) : null}
        </div>

        {isAdvancedMode && (
          <div className="flex flex-col items-center gap-1 mb-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Goal Alignment:</span>
              <span 
                className="font-mono font-bold"
                style={{ 
                  color: goalLinkedPercentage >= 60 ? '#22c55e' : '#f59e0b' 
                }}
              >
                {goalLinkedPercentage}%
              </span>
            </div>
            {goalLinkedPercentage < 60 && (
              <p className="text-[10px] text-amber-400/80 text-center max-w-[200px]">
                Link more tasks to weekly goals for better focus
              </p>
            )}
          </div>
        )}

        <div className="flex justify-center items-center gap-2 mb-2">
          <button
            onClick={() => {
              const prev = new Date(selectedDate);
              prev.setDate(prev.getDate() - 1);
              setSelectedDate(prev);
            }}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            data-testid="button-prev-day"
          >
            <ChevronLeft size={18} className="text-primary/70" />
          </button>
          
          <button
            onClick={() => navigate("/calendar")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/30 border border-primary/20 hover:bg-black/50 transition-colors"
            data-testid="button-date-display"
          >
            <CalendarDays size={14} className="text-primary/70" />
            <span className="text-xs font-mono text-white/80">
              {isToday ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </button>
          
          <button
            onClick={() => {
              const next = new Date(selectedDate);
              next.setDate(next.getDate() + 1);
              setSelectedDate(next);
            }}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            data-testid="button-next-day"
          >
            <ChevronRight size={18} className="text-primary/70" />
          </button>
        </div>

        <div className="flex justify-center py-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-primary/5 rounded-full blur-xl" />
            <Sectograph 
              schedule={currentSchedule}
              size={280}
              onCenterClick={() => setIsScheduleOpen(true)}
              onBlockClick={(block) => handleEditExistingBlock(block)}
            />
          </div>
        </div>


        <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground tracking-widest">LVL</span>
            <span className="text-lg font-mono font-bold text-primary drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">
              {player.level}
            </span>
          </div>
          <div className="w-px h-4 bg-primary/30" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground tracking-widest">POWER</span>
            <span 
              className="text-xl font-mono font-black"
              style={{ 
                color: "#ff6b35",
                filter: "drop-shadow(0 0 10px rgba(255,107,53,0.6))"
              }}
            >
              {displayStats.strength + displayStats.agility + displayStats.sense + displayStats.vitality}
            </span>
          </div>
          <div className="w-px h-4 bg-primary/30" />
          <div className="flex items-center gap-1" data-testid="text-streak">
            <Flame size={12} className="text-orange-400" />
            <span className="text-[10px] text-muted-foreground tracking-widest">STREAK</span>
            <span className="text-sm font-mono font-bold text-orange-400">{player.streak || 0}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 px-2">
          {statIcons.map((stat) => {
            const isActive = activeSession?.stat === stat.key;
            const hasXpGain = lastXpGain?.stat === stat.key;
            
            return (
              <motion.button
                key={stat.key}
                data-testid={`button-stat-${stat.key}`}
                onClick={() => setSelectedStat(stat.key)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center p-2 rounded-lg bg-gradient-to-b from-black/40 to-black/20 border relative cursor-pointer transition-all ${
                  isActive ? 'border-primary/50 ring-1 ring-primary/30' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <AnimatePresence>
                  {hasXpGain && (
                    <motion.div
                      initial={{ opacity: 0, y: 0 }}
                      animate={{ opacity: 1, y: -20 }}
                      exit={{ opacity: 0, y: -40 }}
                      className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs font-mono font-bold text-primary"
                      style={{ textShadow: '0 0 10px rgba(0,255,255,0.8)' }}
                    >
                      +{lastXpGain.amount}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <motion.div 
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                  animate={hasXpGain ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  style={{ 
                    background: `linear-gradient(135deg, ${stat.color}30 0%, transparent 100%)`,
                    boxShadow: isActive 
                      ? `0 0 25px ${stat.color}60, 0 0 10px ${stat.color}40` 
                      : `0 0 15px ${stat.color}30`
                  }}
                >
                  <stat.icon size={20} style={{ color: stat.color }} />
                </motion.div>
                <span className="text-lg font-mono font-bold text-white">{stat.value}</span>
                <span className="text-[8px] text-muted-foreground tracking-wider uppercase">{stat.label}</span>
                
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse" />
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="space-y-2 px-2 pt-2">
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

      </div>

      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="bg-gray-900/98 border-primary/30 max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary font-display text-sm flex items-center gap-2">
              <Clock size={16} />
              LIFE TIMELINE
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-white/60">
              Tap an icon to add or edit a time block.
            </p>
            
            <div className="grid grid-cols-4 gap-2">
              {ACTIVITY_PRESETS.map((preset) => {
                const isInSchedule = currentSchedule.some(b => b.id === preset.id);
                return (
                  <button
                    key={preset.id}
                    data-testid={`button-preset-${preset.id}`}
                    onClick={() => handlePresetClick(preset)}
                    className={`flex flex-col items-center p-2 rounded-lg border transition-all group ${
                      isInSchedule ? 'border-primary/50 bg-primary/10' : 'border-white/10 hover:border-primary/40 hover:bg-white/5'
                    }`}
                    style={{ backgroundColor: isInSchedule ? undefined : `${preset.color}15` }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center mb-1"
                      style={{ 
                        backgroundColor: `${preset.color}40`,
                        boxShadow: `0 0 10px ${preset.color}30`
                      }}
                    >
                      <preset.icon size={14} style={{ color: preset.color, filter: 'brightness(1.3)' }} />
                    </div>
                    <span className="text-[9px] text-white/70 group-hover:text-white truncate w-full text-center">
                      {preset.name}
                    </span>
                    {preset.isSystemTask && (
                      <span className="text-[7px] text-primary/80 font-semibold">QUEST</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Current Schedule</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {currentSchedule.map((block) => (
                  <button 
                    key={block.id}
                    data-testid={`button-edit-block-${block.id}`}
                    onClick={() => handleEditExistingBlock(block)}
                    className="flex items-center gap-2 p-2 rounded text-xs w-full hover:bg-white/10 transition-colors"
                    style={{ backgroundColor: `${block.color}20` }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ 
                        backgroundColor: block.color,
                        boxShadow: `0 0 6px ${block.color}60`
                      }}
                    />
                    <span className="flex-1 text-white/80 text-left">{block.name}</span>
                    <span className="text-white/40 font-mono text-[10px]">
                      {String(block.startHour).padStart(2, '0')}:{String(block.startMinute ?? 0).padStart(2, '0')} - {String(block.endHour).padStart(2, '0')}:{String(block.endMinute ?? 0).padStart(2, '0')}
                    </span>
                    <Pencil size={10} className="text-muted-foreground/40" />
                  </button>
                ))}
                {currentSchedule.length === 0 && (
                  <div className="text-center text-[10px] text-muted-foreground/40 py-4">
                    No blocks scheduled. Tap an icon above to add one.
                  </div>
                )}
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

      <Dialog open={editingBlock !== null} onOpenChange={(open) => !open && setEditingBlock(null)}>
        <DialogContent className="bg-black/95 border-primary/20 max-w-xs max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary/80 font-display text-sm">
              {editingBlock?.isNew ? 'Add Time Block' : 'Edit Time Block'}
            </DialogTitle>
          </DialogHeader>
          {editingBlock && (
            <div className="space-y-4 py-2">
              {editingBlock.id.startsWith('custom') && (
                <>
                  <div>
                    <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block mb-1">
                      Task Name
                    </label>
                    <Input
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Enter task name"
                      className="h-8 bg-black/50 border-white/10 text-sm"
                      data-testid="input-custom-name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block mb-1">
                      Description
                    </label>
                    <textarea
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="What is this task about?"
                      className="w-full h-20 px-3 py-2 bg-black/50 border border-white/10 rounded text-sm text-white/90 resize-none"
                      data-testid="input-custom-description"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={`${String(editingBlock.startHour).padStart(2, '0')}:${String(editingBlock.startMinute).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    setEditingBlock({ ...editingBlock, startHour: hours, startMinute: minutes });
                  }}
                  className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded text-white/90 font-mono text-lg"
                  data-testid="input-start-time"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={`${String(editingBlock.endHour).padStart(2, '0')}:${String(editingBlock.endMinute).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    setEditingBlock({ ...editingBlock, endHour: hours, endMinute: minutes });
                  }}
                  className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded text-white/90 font-mono text-lg"
                  data-testid="input-end-time"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="repeatDaily"
                  checked={editingBlock.isTemplate !== false}
                  onChange={(e) => setEditingBlock({ 
                    ...editingBlock, 
                    isTemplate: e.target.checked,
                    date: e.target.checked ? undefined : selectedDateKey
                  })}
                  className="rounded border-white/20"
                  data-testid="input-repeat-daily"
                />
                <label htmlFor="repeatDaily" className="text-xs text-muted-foreground">
                  Repeat daily
                </label>
              </div>

              {!editingBlock.isTemplate && (
                <div>
                  <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editingBlock.date || selectedDateKey}
                    onChange={(e) => setEditingBlock({ ...editingBlock, date: e.target.value })}
                    className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded text-white/90 font-mono"
                    data-testid="input-block-date"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      data-testid={`button-color-${color}`}
                      onClick={() => setEditingBlock({ ...editingBlock, color })}
                      className={`w-6 h-6 rounded-full transition-all ${
                        editingBlock.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isSystemTask"
                  checked={editingBlock.isSystemTask || false}
                  onChange={(e) => setEditingBlock({ ...editingBlock, isSystemTask: e.target.checked })}
                  className="rounded border-white/20"
                />
                <label htmlFor="isSystemTask" className="text-xs text-muted-foreground">
                  Mark as Quest (glows on timeline)
                </label>
              </div>

              <div className="border-t border-white/5 pt-3 mt-2">
                <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider mb-2">Planning Tags</div>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground/60 block mb-1">Role</label>
                    <Select
                      value={editingBlock.roleId || ""}
                      onValueChange={(v) => setEditingBlock({ ...editingBlock, roleId: v, weeklyGoalId: undefined })}
                    >
                      <SelectTrigger className="h-7 bg-black/50 border-white/10 text-xs">
                        <SelectValue placeholder="Select role..." />
                      </SelectTrigger>
                      <SelectContent className="bg-black/95 border-white/10">
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id} className="text-xs">
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {editingBlock.roleId && (
                    <div>
                      <label className="text-[10px] text-muted-foreground/60 block mb-1">Weekly Goal</label>
                      <Select
                        value={editingBlock.weeklyGoalId || ""}
                        onValueChange={(v) => setEditingBlock({ ...editingBlock, weeklyGoalId: v })}
                      >
                        <SelectTrigger className="h-7 bg-black/50 border-white/10 text-xs">
                          <SelectValue placeholder="Select goal..." />
                        </SelectTrigger>
                        <SelectContent className="bg-black/95 border-white/10">
                          {getGoalsByRole(editingBlock.roleId).map((goal) => (
                            <SelectItem key={goal.id} value={goal.id} className="text-xs">
                              {goal.title}
                            </SelectItem>
                          ))}
                          {getGoalsByRole(editingBlock.roleId).length === 0 && (
                            <div className="text-xs text-muted-foreground/50 px-2 py-1">No goals for this role</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] text-muted-foreground/60 block mb-1">Quadrant</label>
                    <div className="grid grid-cols-4 gap-1">
                      {QUADRANT_OPTIONS.map((q) => (
                        <button
                          key={q.value}
                          data-testid={`button-quadrant-${q.value}`}
                          onClick={() => setEditingBlock({ ...editingBlock, quadrant: q.value })}
                          className={`py-1 px-2 rounded text-[10px] font-bold transition-all ${
                            editingBlock.quadrant === q.value 
                              ? 'ring-2 ring-white ring-offset-1 ring-offset-black' 
                              : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{ 
                            backgroundColor: `${q.color}30`,
                            color: q.color,
                            border: `1px solid ${q.color}50`
                          }}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                    {editingBlock.quadrant && (
                      <div className="text-[9px] text-muted-foreground/50 mt-1">
                        {QUADRANT_OPTIONS.find(q => q.value === editingBlock.quadrant)?.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {!editingBlock.isNew && (
                  <Button
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={handleDeleteBlock}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 border-white/10"
                  onClick={() => setEditingBlock(null)}
                  data-testid="button-cancel-block"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30"
                  onClick={handleSaveBlock}
                  data-testid="button-save-block"
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <StatActionPanel
        open={selectedStat !== null}
        onOpenChange={(open) => !open && setSelectedStat(null)}
        stat={selectedStat}
        schedule={currentSchedule}
        onCompleteSession={completeSession}
        activeSession={activeSession}
        onStartSession={startSession}
        onCancelSession={cancelSession}
        dailyProgress={(player.dailyStatProgress as DailyStatProgress[]) || []}
        onUpdateProgress={handleUpdateProgress}
      />

      {showTestMode && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-20 left-4 right-4 z-40 bg-yellow-900/90 border border-yellow-500 rounded-lg p-4 max-w-md mx-auto"
          data-testid="test-mode-panel"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-yellow-400 text-xs font-mono tracking-wider">TEST MODE</div>
            <button 
              onClick={() => setShowTestMode(false)}
              className="text-yellow-500 hover:text-yellow-300 text-xs"
              data-testid="button-close-test-mode"
            >
              [HIDE]
            </button>
          </div>
          <div className="text-xs text-yellow-200 mb-3">
            Current: Level {player.level} | Phase {player.phase} | XP: {player.exp}/{player.maxExp}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-yellow-500 text-yellow-400 hover:bg-yellow-500/20"
              onClick={() => addLevels(5)}
              data-testid="button-level-up-5"
            >
              +5 Levels
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-yellow-500 text-yellow-400 hover:bg-yellow-500/20"
              onClick={() => addLevels(15)}
              data-testid="button-level-up-15"
            >
              +15 Levels
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-orange-500 text-orange-400 hover:bg-orange-500/20"
              onClick={() => {
                const targetLevel = player.phase === 1 ? 11 : player.phase === 2 ? 26 : player.phase === 3 ? 46 : player.phase === 4 ? 71 : player.level + 1;
                const levelsNeeded = Math.max(1, targetLevel - player.level);
                addLevels(levelsNeeded);
              }}
              data-testid="button-next-rank"
            >
              → Next TIER
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-green-500 text-green-400 hover:bg-green-500/20"
              onClick={() => gainExp(50)}
              data-testid="button-gain-50xp"
            >
              +50 XP
            </Button>
          </div>
          <div className="mt-3 text-[10px] text-yellow-300/70">
            D@11, C@26, B@46, A@71, S@101 (Ascension)
          </div>
        </motion.div>
      )}
    </SystemLayout>
  );
}
