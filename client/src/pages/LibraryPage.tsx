import React, { useState } from "react";
import { useLocation } from "wouter";
import { SystemLayout } from "@/components/game/SystemLayout";
import { useTheme } from "@/context/ThemeContext";
import { useGame } from "@/context/GameContext";
import { useWeeklyGoals } from "@/context/WeeklyGoalsContext";
import { useRoles } from "@/context/RolesContext";
import { WeeklyGoalForm } from "@/components/game/WeeklyGoalForm";
import { OnboardingFlow } from "@/components/game/OnboardingFlow";
import { BookOpen, Lock, Target, ChevronDown, ChevronUp, Trash2, CheckCircle, Calendar, ChevronRight, Swords, Wind, Eye, Heart, Play, ExternalLink } from "lucide-react";

const PLANNING_UNLOCK_PHASE = 3;
const TRIALS_UNLOCK_PHASE = 4;

export default function LibraryPage() {
  const [, navigate] = useLocation();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const { player, updatePlayer } = useGame();
  const { weeklyGoals, deleteWeeklyGoal, updateWeeklyGoal } = useWeeklyGoals();
  const { roles } = useRoles();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  const playerPhase = player?.phase || 1;
  const canAccessPlanning = playerPhase >= PLANNING_UNLOCK_PHASE;
  const canAccessTrials = playerPhase >= TRIALS_UNLOCK_PHASE;

  const libraryItems = [
    { id: 1, title: "Ascendant's Guide", type: "Tutorial", icon: BookOpen, unlocked: true },
  ];

  const [expandedStat, setExpandedStat] = useState<string | null>(null);

  const statVideoSections = [
    {
      stat: "strength",
      label: "STR",
      fullLabel: "Strength",
      icon: Swords,
      color: "#ef4444",
      videos: [
        { title: "Perfect Pushup Form", url: "https://www.youtube.com/watch?v=IODxDxX7oi4", duration: "5:23" },
        { title: "Beginner Bodyweight Squats", url: "https://www.youtube.com/watch?v=aclHkVaku9U", duration: "6:11" },
        { title: "Core & Abs Workout Guide", url: "https://www.youtube.com/watch?v=AnYl6Nk9GOA", duration: "8:45" },
      ],
    },
    {
      stat: "agility",
      label: "AGI",
      fullLabel: "Agility",
      icon: Wind,
      color: "#3b82f6",
      videos: [
        { title: "Cardio for Beginners", url: "https://www.youtube.com/watch?v=ml6cT4AZdqI", duration: "10:00" },
        { title: "Sprint Interval Training", url: "https://www.youtube.com/watch?v=YoPBRlJgDb0", duration: "7:32" },
        { title: "Flexibility & Mobility Hunter Path", url: "https://www.youtube.com/watch?v=g_tea8ZNk5A", duration: "12:15" },
      ],
    },
    {
      stat: "sense",
      label: "SEN",
      fullLabel: "Sense",
      icon: Eye,
      color: "#a855f7",
      videos: [
        { title: "Meditation for Beginners", url: "https://www.youtube.com/watch?v=U9YKY7fdwyg", duration: "10:00" },
        { title: "Deep Focus Techniques", url: "https://www.youtube.com/watch?v=lTxn2BuqyzU", duration: "8:22" },
        { title: "Breathing for Mental Clarity", url: "https://www.youtube.com/watch?v=tybOi4hjZFQ", duration: "6:40" },
      ],
    },
    {
      stat: "vitality",
      label: "VIT",
      fullLabel: "Vitality",
      icon: Heart,
      color: "#22c55e",
      videos: [
        { title: "Sleep Optimization Tips", url: "https://www.youtube.com/watch?v=nm1TxQj9IsQ", duration: "11:30" },
        { title: "Recovery & Rest Days", url: "https://www.youtube.com/watch?v=x0kXMnB1bM0", duration: "7:15" },
        { title: "Nutrition Basics for Energy", url: "https://www.youtube.com/watch?v=fqhYBTg73fw", duration: "9:50" },
      ],
    },
  ];

  return (
    <SystemLayout>
      <div className="flex flex-col gap-6 pt-4">
        <div className="text-center">
          <h1 
            className="text-2xl font-display font-black tracking-wider"
            style={{ color: colors.text }}
          >
            LIBRARY
          </h1>
          <p 
            className="text-sm mt-1"
            style={{ color: colors.textMuted }}
          >
            Knowledge Archive
          </p>
        </div>

        <button
          onClick={() => canAccessPlanning && navigate("/weekly-planning")}
          disabled={!canAccessPlanning}
          className={`w-full rounded-lg overflow-hidden transition-all ${
            canAccessPlanning ? 'hover:scale-[1.02] cursor-pointer' : 'opacity-60 cursor-not-allowed'
          }`}
          style={{
            backgroundColor: canAccessPlanning ? `${colors.primary}15` : colors.surface,
            border: `1px solid ${canAccessPlanning ? colors.primary + '40' : colors.surfaceBorder}`
          }}
          data-testid="button-advanced-planning"
        >
          <div className="p-4 flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: canAccessPlanning ? `${colors.primary}30` : 'rgba(100,100,100,0.2)',
                border: `1px solid ${canAccessPlanning ? colors.primary + '60' : 'rgba(100,100,100,0.3)'}`
              }}
            >
              {canAccessPlanning ? (
                <Calendar size={20} style={{ color: colors.primary }} />
              ) : (
                <Lock size={20} style={{ color: colors.textMuted }} />
              )}
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-display font-bold" style={{ color: canAccessPlanning ? colors.text : colors.textMuted }}>
                Advanced Weekly Planning
              </h3>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                {canAccessPlanning 
                  ? "Set missions and priorities for the week" 
                  : `Unlock at Phase ${PLANNING_UNLOCK_PHASE}`
                }
              </p>
            </div>
            {canAccessPlanning ? (
              <ChevronRight size={20} style={{ color: colors.primary }} />
            ) : (
              <span 
                className="text-xs font-bold px-2 py-1 rounded"
                style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
              >
                LOCKED
              </span>
            )}
          </div>
        </button>

        {canAccessPlanning && (
          <div 
            className="rounded-lg p-4"
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.surfaceBorder}`
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm" style={{ color: colors.text }}>
                  Planning Mode
                </h3>
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  {player?.planningMode === "advanced" 
                    ? "Requires weekly missions for quests" 
                    : "Quests can be created freely"
                  }
                </p>
              </div>
              <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: colors.background }}>
                <button
                  onClick={() => {
                    if (player?.planningMode !== "basic") {
                      updatePlayer({ planningMode: "basic" });
                    }
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    player?.planningMode === "basic" ? 'text-white' : ''
                  }`}
                  style={{
                    backgroundColor: player?.planningMode === "basic" ? colors.primary : 'transparent',
                    color: player?.planningMode === "basic" ? colors.background : colors.textMuted
                  }}
                  data-testid="button-mode-basic"
                >
                  Basic
                </button>
                <button
                  onClick={() => {
                    if (player?.planningMode !== "advanced") {
                      updatePlayer({ planningMode: "advanced" });
                    }
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    player?.planningMode === "advanced" ? 'text-white' : ''
                  }`}
                  style={{
                    backgroundColor: player?.planningMode === "advanced" ? colors.primary : 'transparent',
                    color: player?.planningMode === "advanced" ? colors.background : colors.textMuted
                  }}
                  data-testid="button-mode-advanced"
                >
                  Advanced
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => canAccessTrials && navigate("/trials")}
          disabled={!canAccessTrials}
          className={`w-full rounded-lg overflow-hidden transition-all ${
            canAccessTrials ? 'hover:scale-[1.02] cursor-pointer' : 'opacity-60 cursor-not-allowed'
          }`}
          style={{
            backgroundColor: canAccessTrials ? `${colors.primary}15` : colors.surface,
            border: `1px solid ${canAccessTrials ? colors.primary + '40' : colors.surfaceBorder}`
          }}
          data-testid="button-trials"
        >
          <div className="p-4 flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: canAccessTrials ? `${colors.primary}30` : 'rgba(100,100,100,0.2)',
                border: `1px solid ${canAccessTrials ? colors.primary + '60' : 'rgba(100,100,100,0.3)'}`
              }}
            >
              {canAccessTrials ? (
                <Target size={20} style={{ color: colors.primary }} />
              ) : (
                <Lock size={20} style={{ color: colors.textMuted }} />
              )}
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-display font-bold" style={{ color: canAccessTrials ? colors.text : colors.textMuted }}>
                Trials
              </h3>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                {canAccessTrials 
                  ? "Test your resolve with focused challenges" 
                  : `Unlock at Phase ${TRIALS_UNLOCK_PHASE}`
                }
              </p>
            </div>
            {canAccessTrials ? (
              <ChevronRight size={20} style={{ color: colors.primary }} />
            ) : (
              <span 
                className="text-xs font-bold px-2 py-1 rounded"
                style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
              >
                LOCKED
              </span>
            )}
          </div>
        </button>

        <div 
          className="rounded-lg overflow-hidden"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.surfaceBorder}`
          }}
        >
          <button
            onClick={() => setShowGoalForm(!showGoalForm)}
            className="w-full p-4 flex items-center gap-3 transition-colors hover:bg-white/5"
            data-testid="button-toggle-goals"
          >
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: `${colors.primary}20`,
                border: `1px solid ${colors.primary}40`
              }}
            >
              <Target size={20} style={{ color: colors.primary }} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-display font-bold" style={{ color: colors.text }}>
                Weekly Goals
              </h3>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                {weeklyGoals.length} goal{weeklyGoals.length !== 1 ? 's' : ''} this week
              </p>
            </div>
            {showGoalForm ? (
              <ChevronUp size={20} style={{ color: colors.textMuted }} />
            ) : (
              <ChevronDown size={20} style={{ color: colors.textMuted }} />
            )}
          </button>

          {showGoalForm && (
            <div className="px-4 pb-4 space-y-3">
              <WeeklyGoalForm onSuccess={() => {}} />
              
              {weeklyGoals.length > 0 && (
                <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                  <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: colors.textMuted }}>
                    Current Goals
                  </div>
                  {weeklyGoals.map((goal) => {
                    const role = roles.find(r => r.id === goal.roleId);
                    const quadrantColors: Record<string, string> = {
                      Q1: "#ef4444", Q2: "#22c55e", Q3: "#f59e0b", Q4: "#6b7280"
                    };
                    return (
                      <div
                        key={goal.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-black/30"
                        data-testid={`goal-item-${goal.id}`}
                      >
                        <button
                          onClick={() => updateWeeklyGoal(goal.id, { completed: !goal.completed })}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            goal.completed ? 'bg-green-500/30' : 'bg-white/10 hover:bg-white/20'
                          }`}
                          data-testid={`button-complete-goal-${goal.id}`}
                        >
                          {goal.completed && <CheckCircle size={14} className="text-green-400" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div 
                            className={`text-sm truncate ${goal.completed ? 'line-through opacity-50' : ''}`}
                            style={{ color: colors.text }}
                          >
                            {goal.title}
                          </div>
                          <div className="text-[10px]" style={{ color: colors.textMuted }}>
                            {role?.name || 'Unknown Role'}
                          </div>
                        </div>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${quadrantColors[goal.quadrant]}30`,
                            color: quadrantColors[goal.quadrant]
                          }}
                        >
                          {goal.quadrant}
                        </span>
                        <button
                          onClick={() => deleteWeeklyGoal(goal.id)}
                          className="p-1 rounded hover:bg-red-500/20 transition-colors"
                          data-testid={`button-delete-goal-${goal.id}`}
                        >
                          <Trash2 size={12} className="text-red-400/60 hover:text-red-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-4">
          {libraryItems.map((item) => (
            <div
              key={item.id}
              data-testid={`library-item-${item.id}`}
              className="relative p-4 rounded-lg transition-all duration-300 cursor-pointer hover:scale-[1.02]"
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.surfaceBorder}`,
                opacity: item.unlocked ? 1 : 0.5
              }}
              onClick={() => {
                if (item.unlocked && item.id === 1) setShowGuide(true);
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: `${colors.primary}20`,
                    border: `1px solid ${colors.primary}40`
                  }}
                >
                  {item.unlocked ? (
                    <item.icon size={24} style={{ color: colors.primary }} />
                  ) : (
                    <Lock size={24} style={{ color: colors.textMuted }} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 
                    className="font-display font-bold text-lg"
                    style={{ color: colors.text }}
                  >
                    {item.title}
                  </h3>
                  <p 
                    className="text-xs tracking-wider uppercase"
                    style={{ color: colors.textMuted }}
                  >
                    {item.type}
                  </p>
                </div>
                {item.unlocked && item.id === 1 ? (
                  <ChevronRight size={20} style={{ color: colors.primary }} />
                ) : !item.unlocked ? (
                  <div 
                    className="px-2 py-1 rounded text-xs font-bold"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.2)",
                      color: "#ef4444"
                    }}
                  >
                    LOCKED
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {showGuide && (
          <OnboardingFlow
            onComplete={() => setShowGuide(false)}
            onSkip={() => setShowGuide(false)}
            playerName={player?.name?.split(" ")[0] || ""}
          />
        )}

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Play size={14} style={{ color: colors.primary }} />
            <h2 className="font-display font-bold text-sm tracking-wider uppercase" style={{ color: colors.text }}>
              Stat Training Videos
            </h2>
          </div>
          <div className="grid gap-3">
            {statVideoSections.map((section) => {
              const isExpanded = expandedStat === section.stat;
              const StatIcon = section.icon;
              return (
                <div
                  key={section.stat}
                  className="rounded-lg overflow-hidden transition-all"
                  style={{
                    backgroundColor: colors.surface,
                    border: `1px solid ${isExpanded ? section.color + '40' : colors.surfaceBorder}`
                  }}
                  data-testid={`stat-videos-${section.stat}`}
                >
                  <button
                    onClick={() => setExpandedStat(isExpanded ? null : section.stat)}
                    className="w-full p-3 flex items-center gap-3 transition-colors hover:bg-white/5"
                    data-testid={`button-toggle-${section.stat}-videos`}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${section.color}20`,
                        border: `1px solid ${section.color}40`
                      }}
                    >
                      <StatIcon size={18} style={{ color: section.color }} />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-display font-bold text-sm" style={{ color: colors.text }}>
                        {section.label} — {section.fullLabel}
                      </h3>
                      <p className="text-[10px]" style={{ color: colors.textMuted }}>
                        {section.videos.length} videos
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={16} style={{ color: section.color }} />
                    ) : (
                      <ChevronDown size={16} style={{ color: colors.textMuted }} />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2">
                      {section.videos.map((video, idx) => (
                        <a
                          key={idx}
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2.5 rounded-lg transition-colors hover:bg-white/5 group"
                          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                          data-testid={`video-link-${section.stat}-${idx}`}
                        >
                          <div
                            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${section.color}15`, border: `1px solid ${section.color}30` }}
                          >
                            <Play size={14} style={{ color: section.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm truncate" style={{ color: colors.text }}>
                              {video.title}
                            </div>
                            <div className="text-[10px]" style={{ color: colors.textMuted }}>
                              {video.duration}
                            </div>
                          </div>
                          <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: section.color }} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SystemLayout>
  );
}
