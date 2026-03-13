import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGame } from "@/context/GameContext";
import { useRoles } from "@/context/RolesContext";
import { useWeeklyGoals } from "@/context/WeeklyGoalsContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, ChevronRight, Plus, Trash2, AlertCircle } from "lucide-react";
import type { Quadrant } from "@shared/schema";

const QUADRANT_OPTIONS: { value: Quadrant; label: string; color: string }[] = [
  { value: "Q1", label: "Q1 - Urgent & Important", color: "#ef4444" },
  { value: "Q2", label: "Q2 - Not Urgent & Important", color: "#22c55e" },
  { value: "Q3", label: "Q3 - Urgent & Not Important", color: "#f59e0b" },
  { value: "Q4", label: "Q4 - Neither", color: "#6b7280" },
];

interface GoalInput {
  roleId: string;
  title: string;
  quadrant: Quadrant;
}

export default function WeeklyPlanningPage() {
  const [, navigate] = useLocation();
  const { player } = useGame();
  const { roles } = useRoles();
  const { weeklyGoals, createWeeklyGoal, currentWeekStart, hasGoalsForCurrentWeek } = useWeeklyGoals();
  
  const [goalInputs, setGoalInputs] = useState<GoalInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roles.length > 0 && goalInputs.length === 0) {
      setGoalInputs(roles.map(role => ({
        roleId: role.id,
        title: "",
        quadrant: "Q2" as Quadrant,
      })));
    }
  }, [roles, goalInputs.length]);

  const rolesWithGoals = new Set(weeklyGoals.map(g => g.roleId));
  const rolesMissingGoals = roles.filter(r => !rolesWithGoals.has(r.id));
  const allRolesHaveGoals = rolesMissingGoals.length === 0 && roles.length > 0;

  const updateGoalInput = (roleId: string, field: keyof GoalInput, value: string) => {
    setGoalInputs(prev => prev.map(g => 
      g.roleId === roleId ? { ...g, [field]: value } : g
    ));
  };

  const handleSubmit = async () => {
    const goalsToCreate = goalInputs.filter(g => g.title.trim());
    
    if (goalsToCreate.length === 0) {
      setError("Please enter at least one mission to continue.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      for (const goal of goalsToCreate) {
        await createWeeklyGoal({
          roleId: goal.roleId,
          title: goal.title.trim(),
          quadrant: goal.quadrant,
        });
      }
      navigate("/");
    } catch (err) {
      setError("Failed to save missions. Please try again.");
      console.error("Failed to create goals:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    navigate("/");
  };

  const getRoleName = (roleId: string) => {
    return roles.find(r => r.id === roleId)?.name || "Unknown Role";
  };

  return (
    <SystemLayout>
      <div className="flex flex-col gap-6 pt-4 pb-20">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="text-primary" size={28} />
          </div>
          <h1 className="text-2xl font-display font-black tracking-wider text-primary">
            WEEKLY PLANNING
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Week of {currentWeekStart}
          </p>
        </div>

        {weeklyGoals.length > 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="text-xs uppercase tracking-wider text-green-400 mb-2">
              Current Goals ({weeklyGoals.length})
            </div>
            <div className="space-y-2">
              {weeklyGoals.map(goal => (
                <div key={goal.id} className="flex items-center gap-2 text-sm">
                  <span 
                    className="w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center"
                    style={{
                      backgroundColor: `${QUADRANT_OPTIONS.find(q => q.value === goal.quadrant)?.color}30`,
                      color: QUADRANT_OPTIONS.find(q => q.value === goal.quadrant)?.color
                    }}
                  >
                    {goal.quadrant}
                  </span>
                  <span className="text-white/80">{goal.title}</span>
                  <span className="text-muted-foreground/50 text-xs ml-auto">
                    {getRoleName(goal.roleId)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!allRolesHaveGoals && (
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground/60">
              Set Goals for Each Role
            </div>

            {goalInputs.map((input) => {
              const role = roles.find(r => r.id === input.roleId);
              const hasExistingGoal = rolesWithGoals.has(input.roleId);
              
              if (hasExistingGoal) return null;
              
              return (
                <div 
                  key={input.roleId}
                  className="bg-black/40 border border-white/10 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                      <Target size={14} className="text-primary" />
                    </div>
                    <span className="font-display font-bold text-white">
                      {role?.name || "Role"}
                    </span>
                  </div>

                  <Input
                    value={input.title}
                    onChange={(e) => updateGoalInput(input.roleId, "title", e.target.value)}
                    placeholder="What's your main mission this week?"
                    className="bg-black/50 border-white/10"
                    data-testid={`input-goal-${input.roleId}`}
                  />

                  <div className="flex gap-2">
                    {QUADRANT_OPTIONS.map(q => (
                      <button
                        key={q.value}
                        type="button"
                        onClick={() => updateGoalInput(input.roleId, "quadrant", q.value)}
                        className={`flex-1 py-2 rounded text-xs font-bold transition-all ${
                          input.quadrant === q.value 
                            ? 'ring-2 ring-white' 
                            : 'opacity-50 hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor: `${q.color}30`,
                          color: q.color,
                          border: `1px solid ${q.color}40`
                        }}
                        data-testid={`button-quadrant-${input.roleId}-${q.value}`}
                      >
                        {q.value}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent">
          {allRolesHaveGoals ? (
            <Button
              onClick={handleContinue}
              className="w-full h-12 bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 font-display tracking-wider"
              data-testid="button-continue-to-scheduler"
            >
              CONTINUE TO SCHEDULER
              <ChevronRight size={18} className="ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || goalInputs.every(g => !g.title.trim())}
              className="w-full h-12 bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 font-display tracking-wider disabled:opacity-50"
              data-testid="button-save-goals"
            >
              {isSubmitting ? "SAVING..." : "SAVE GOALS & CONTINUE"}
              <ChevronRight size={18} className="ml-2" />
            </Button>
          )}
        </div>
      </div>
    </SystemLayout>
  );
}
