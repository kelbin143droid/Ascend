import React, { useState } from "react";
import { useGame } from "@/context/GameContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { Sectograph, type ScheduleBlock } from "@/components/game/Sectograph";
import { StatActionPanel } from "@/components/game/StatActionPanel";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Pencil, X, Clock, Moon, Coffee, Book, Sunrise, Gamepad2, Briefcase, Swords, Wind, Eye, Heart, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { jobsByRank, titlesByRank, getSkillsForClass } from "@/lib/classData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  startHour: number;
  endHour: number;
  color: string;
  isSystemTask?: boolean;
  isNew?: boolean;
}

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
    cancelSession
  } = useGame();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<EditingBlock | null>(null);
  const [customName, setCustomName] = useState("");

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
    { key: 'strength', label: 'STRENGTH', icon: Swords, color: '#ff6b6b', value: player.stats.strength },
    { key: 'agility', label: 'AGILITY', icon: Wind, color: '#4ecdc4', value: player.stats.agility },
    { key: 'sense', label: 'SENSE', icon: Eye, color: '#ffe66d', value: player.stats.sense },
    { key: 'vitality', label: 'VITALITY', icon: Heart, color: '#a855f7', value: player.stats.vitality },
  ];

  const currentSchedule: ScheduleBlock[] = player.schedule?.length ? player.schedule as ScheduleBlock[] : [
    { id: "sleep", name: "Sleep", startHour: 22, endHour: 6, color: "#3b4d6b" },
    { id: "work", name: "Focus Work", startHour: 9, endHour: 12, color: "#4a6fa5", isSystemTask: true },
    { id: "exercise", name: "Training", startHour: 17, endHour: 18, color: "#c97b63", isSystemTask: true },
  ];

  const handlePresetClick = (preset: typeof ACTIVITY_PRESETS[0]) => {
    const existingBlock = currentSchedule.find(b => b.id === preset.id);
    
    if (existingBlock) {
      setEditingBlock({
        ...existingBlock,
        isNew: false,
      });
    } else {
      setEditingBlock({
        id: preset.id === 'custom' ? `custom_${Date.now()}` : preset.id,
        name: preset.id === 'custom' ? '' : preset.name,
        startHour: 9,
        endHour: 10,
        color: preset.color,
        isSystemTask: preset.isSystemTask,
        isNew: true,
      });
      if (preset.id === 'custom') {
        setCustomName('');
      }
    }
  };

  const handleSaveBlock = () => {
    if (!editingBlock) return;
    
    const blockToSave = {
      ...editingBlock,
      name: editingBlock.id.startsWith('custom') ? customName || 'Custom Task' : editingBlock.name,
    };
    delete (blockToSave as any).isNew;
    
    let newSchedule: ScheduleBlock[];
    if (editingBlock.isNew) {
      newSchedule = [...currentSchedule, blockToSave];
    } else {
      newSchedule = currentSchedule.map(b => b.id === blockToSave.id ? blockToSave : b);
    }
    
    updatePlayer({ schedule: newSchedule });
    setEditingBlock(null);
    setCustomName('');
  };

  const handleDeleteBlock = () => {
    if (!editingBlock) return;
    const newSchedule = currentSchedule.filter(b => b.id !== editingBlock.id);
    updatePlayer({ schedule: newSchedule });
    setEditingBlock(null);
  };

  const handleEditExistingBlock = (block: ScheduleBlock) => {
    setEditingBlock({
      ...block,
      isNew: false,
    });
    if (block.id.startsWith('custom')) {
      setCustomName(block.name);
    }
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


        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground tracking-widest">POWER</span>
            <span className="text-lg font-mono font-bold text-primary drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">
              {player.stats.strength + player.stats.agility + player.stats.sense + player.stats.vitality}
            </span>
          </div>
          <div className="w-px h-4 bg-primary/30" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground tracking-widest">RANK</span>
            <span className="text-lg font-display font-black text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]">{player.rank}</span>
          </div>
          <div className="w-px h-4 bg-primary/30" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground tracking-widest">PTS</span>
            <span className="text-lg font-mono font-bold text-primary">{player.availablePoints}</span>
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

      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="bg-black/95 border-primary/20 max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary/80 font-display text-sm flex items-center gap-2">
              <Clock size={16} />
              LIFE TIMELINE
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground/70">
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
                      isInSchedule ? 'border-primary/40 bg-primary/5' : 'border-white/5 hover:border-primary/30'
                    }`}
                    style={{ backgroundColor: isInSchedule ? undefined : `${preset.color}10` }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center mb-1"
                      style={{ 
                        backgroundColor: `${preset.color}30`,
                        boxShadow: preset.isSystemTask ? `0 0 12px ${preset.color}50` : 'none'
                      }}
                    >
                      <preset.icon size={14} style={{ color: preset.color }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground group-hover:text-white/80 truncate w-full text-center">
                      {preset.name}
                    </span>
                    {preset.isSystemTask && (
                      <span className="text-[7px] text-primary/60">QUEST</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Current Schedule</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {currentSchedule.map((block) => (
                  <button 
                    key={block.id}
                    data-testid={`button-edit-block-${block.id}`}
                    onClick={() => handleEditExistingBlock(block)}
                    className="flex items-center gap-2 p-2 rounded text-xs w-full hover:bg-white/5 transition-colors"
                    style={{ backgroundColor: `${block.color}15` }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ 
                        backgroundColor: block.color,
                        boxShadow: block.isSystemTask ? `0 0 6px ${block.color}` : 'none'
                      }}
                    />
                    <span className="flex-1 text-white/70 text-left">{block.name}</span>
                    <span className="text-muted-foreground/50 font-mono text-[10px]">
                      {block.startHour}:00 - {block.endHour}:00
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
        <DialogContent className="bg-black/95 border-primary/20 max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-primary/80 font-display text-sm">
              {editingBlock?.isNew ? 'Add Time Block' : 'Edit Time Block'}
            </DialogTitle>
          </DialogHeader>
          {editingBlock && (
            <div className="space-y-4 py-2">
              {editingBlock.id.startsWith('custom') && (
                <div>
                  <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block mb-1">
                    Task Name
                  </label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter task name"
                    className="h-8 bg-black/50 border-white/10 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block mb-2">
                  Start Time: <span className="text-white/80 font-mono">{editingBlock.startHour}:00</span>
                </label>
                <Slider
                  value={[editingBlock.startHour]}
                  onValueChange={([v]) => setEditingBlock({ ...editingBlock, startHour: v })}
                  min={0}
                  max={23}
                  step={1}
                  className="py-2"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block mb-2">
                  End Time: <span className="text-white/80 font-mono">{editingBlock.endHour}:00</span>
                </label>
                <Slider
                  value={[editingBlock.endHour]}
                  onValueChange={([v]) => setEditingBlock({ ...editingBlock, endHour: v })}
                  min={0}
                  max={24}
                  step={1}
                  className="py-2"
                />
              </div>

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
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30"
                  onClick={handleSaveBlock}
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
        schedule={player.schedule?.length ? player.schedule as ScheduleBlock[] : [
          { id: "sleep", name: "Sleep", startHour: 22, endHour: 6, color: "#3b4d6b" },
          { id: "work", name: "Focus Work", startHour: 9, endHour: 12, color: "#4a6fa5", isSystemTask: true },
          { id: "exercise", name: "Training", startHour: 17, endHour: 18, color: "#c97b63", isSystemTask: true },
        ]}
        onCompleteSession={completeSession}
        activeSession={activeSession}
        onStartSession={startSession}
        onCancelSession={cancelSession}
      />
    </SystemLayout>
  );
}
