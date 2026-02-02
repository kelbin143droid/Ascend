import React, { useState } from "react";
import { useLocation } from "wouter";
import { SystemLayout } from "@/components/game/SystemLayout";
import { useTheme } from "@/context/ThemeContext";
import { useGame } from "@/context/GameContext";
import { useWeeklyGoals } from "@/context/WeeklyGoalsContext";
import { useRoles } from "@/context/RolesContext";
import { WeeklyGoalForm } from "@/components/game/WeeklyGoalForm";
import { BookOpen, Scroll, Trophy, Star, Lock, Target, ChevronDown, ChevronUp, Trash2, CheckCircle, Calendar, ChevronRight } from "lucide-react";

const RANK_ORDER = ["E", "D", "C", "B", "A", "S"];
const PLANNING_UNLOCK_RANK = "C";
const TRIALS_UNLOCK_RANK = "B";

function isRankUnlocked(playerRank: string, requiredRank: string): boolean {
  const playerIndex = RANK_ORDER.indexOf(playerRank);
  const requiredIndex = RANK_ORDER.indexOf(requiredRank);
  return playerIndex >= requiredIndex;
}

export default function LibraryPage() {
  const [, navigate] = useLocation();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const { player, updatePlayer } = useGame();
  const { weeklyGoals, deleteWeeklyGoal, updateWeeklyGoal } = useWeeklyGoals();
  const { roles } = useRoles();
  const [showGoalForm, setShowGoalForm] = useState(false);
  
  const playerRank = player?.rank || "E";
  const canAccessPlanning = isRankUnlocked(playerRank, PLANNING_UNLOCK_RANK);
  const canAccessTrials = isRankUnlocked(playerRank, TRIALS_UNLOCK_RANK);

  const libraryItems = [
    { id: 1, title: "Ascendant's Guide", type: "Tutorial", icon: BookOpen, unlocked: true },
    { id: 2, title: "Combat Manual", type: "Skills", icon: Scroll, unlocked: true },
    { id: 3, title: "Tier Codex", type: "Progression", icon: Trophy, unlocked: true },
    { id: 4, title: "Secret Techniques", type: "Advanced", icon: Star, unlocked: false },
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
                  ? "Set goals and priorities for the week" 
                  : `Unlock at Rank ${PLANNING_UNLOCK_RANK}`
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
                    ? "Requires weekly goals for tasks" 
                    : "Tasks can be created freely"
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
                  : `Unlock at Rank ${TRIALS_UNLOCK_RANK}`
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
                {!item.unlocked && (
                  <div 
                    className="px-2 py-1 rounded text-xs font-bold"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.2)",
                      color: "#ef4444"
                    }}
                  >
                    LOCKED
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div 
          className="text-center p-4 rounded-lg mt-4"
          style={{
            backgroundColor: `${colors.primary}10`,
            border: `1px solid ${colors.surfaceBorder}`
          }}
        >
          <p 
            className="text-sm"
            style={{ color: colors.textMuted }}
          >
            More content coming soon...
          </p>
        </div>
      </div>
    </SystemLayout>
  );
}
