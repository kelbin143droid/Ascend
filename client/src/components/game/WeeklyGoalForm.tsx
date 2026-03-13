import React, { useState } from "react";
import { useRoles } from "@/context/RolesContext";
import { useWeeklyGoals } from "@/context/WeeklyGoalsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Plus } from "lucide-react";
import type { Quadrant } from "@shared/schema";

const QUADRANT_OPTIONS: { value: Quadrant; label: string; description: string; color: string }[] = [
  { value: "Q1", label: "Q1", description: "Urgent & Important", color: "#ef4444" },
  { value: "Q2", label: "Q2", description: "Not Urgent & Important", color: "#22c55e" },
  { value: "Q3", label: "Q3", description: "Urgent & Not Important", color: "#f59e0b" },
  { value: "Q4", label: "Q4", description: "Not Urgent & Not Important", color: "#6b7280" },
];

interface WeeklyGoalFormProps {
  onSuccess?: () => void;
  compact?: boolean;
}

export function WeeklyGoalForm({ onSuccess, compact = false }: WeeklyGoalFormProps) {
  const { roles } = useRoles();
  const { createWeeklyGoal, currentWeekStart } = useWeeklyGoals();
  
  const [roleId, setRoleId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [quadrant, setQuadrant] = useState<Quadrant>("Q2");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleId || !title.trim()) return;

    setIsSubmitting(true);
    try {
      await createWeeklyGoal({
        roleId,
        title: title.trim(),
        quadrant,
      });
      setTitle("");
      setRoleId("");
      setQuadrant("Q2");
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create weekly goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <Select value={roleId} onValueChange={setRoleId}>
            <SelectTrigger className="h-8 w-28 bg-black/50 border-white/10 text-xs" data-testid="select-role">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="bg-black/95 border-white/10">
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id} className="text-xs">
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Mission title..."
            className="h-8 flex-1 bg-black/50 border-white/10 text-xs"
            data-testid="input-goal-title"
          />
          
          <div className="flex gap-1">
            {QUADRANT_OPTIONS.map((q) => (
              <button
                key={q.value}
                type="button"
                data-testid={`button-quadrant-${q.value}`}
                onClick={() => setQuadrant(q.value)}
                className={`w-7 h-8 rounded text-[10px] font-bold transition-all ${
                  quadrant === q.value 
                    ? 'ring-1 ring-white' 
                    : 'opacity-50 hover:opacity-80'
                }`}
                style={{ 
                  backgroundColor: `${q.color}30`,
                  color: q.color,
                  border: `1px solid ${q.color}40`
                }}
              >
                {q.label}
              </button>
            ))}
          </div>
          
          <Button
            type="submit"
            disabled={!roleId || !title.trim() || isSubmitting}
            className="h-8 px-3 bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30"
            data-testid="button-add-goal"
          >
            <Plus size={14} />
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-black/40 border border-white/10 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Target size={16} className="text-primary" />
        <span className="text-xs font-display tracking-wider text-primary/80 uppercase">New Weekly Goal</span>
        <span className="text-[10px] text-muted-foreground/50 ml-auto">Week of {currentWeekStart}</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block mb-1">Role</label>
          <Select value={roleId} onValueChange={setRoleId}>
            <SelectTrigger className="h-9 bg-black/50 border-white/10 text-sm" data-testid="select-role-full">
              <SelectValue placeholder="Select a role..." />
            </SelectTrigger>
            <SelectContent className="bg-black/95 border-white/10">
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id} className="text-sm">
                  {role.name}
                </SelectItem>
              ))}
              {roles.length === 0 && (
                <div className="text-xs text-muted-foreground/50 px-2 py-1">No roles available</div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block mb-1">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you want to achieve this week?"
            className="h-9 bg-black/50 border-white/10"
            data-testid="input-goal-title-full"
          />
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block mb-1">Priority Quadrant</label>
          <div className="grid grid-cols-4 gap-2">
            {QUADRANT_OPTIONS.map((q) => (
              <button
                key={q.value}
                type="button"
                data-testid={`button-quadrant-full-${q.value}`}
                onClick={() => setQuadrant(q.value)}
                className={`py-2 px-3 rounded text-xs font-bold transition-all ${
                  quadrant === q.value 
                    ? 'ring-2 ring-white ring-offset-1 ring-offset-black' 
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{ 
                  backgroundColor: `${q.color}30`,
                  color: q.color,
                  border: `1px solid ${q.color}50`
                }}
              >
                <div>{q.label}</div>
                <div className="text-[8px] opacity-70 mt-0.5">{q.description.split(' & ')[0]}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!roleId || !title.trim() || isSubmitting}
        className="w-full h-10 bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 font-display tracking-wider"
        data-testid="button-create-goal"
      >
        {isSubmitting ? "Creating..." : "Create Mission"}
      </Button>
    </form>
  );
}
