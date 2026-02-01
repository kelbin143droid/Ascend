import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { WeeklyGoal, InsertWeeklyGoal, UpdateWeeklyGoal, Quadrant } from "@shared/schema";

function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

interface WeeklyGoalsContextType {
  weeklyGoals: WeeklyGoal[];
  isLoading: boolean;
  currentWeekStart: string;
  hasGoalsForCurrentWeek: boolean;
  createWeeklyGoal: (goal: Omit<InsertWeeklyGoal, "userId" | "weekStartDate">) => Promise<WeeklyGoal>;
  updateWeeklyGoal: (id: string, updates: UpdateWeeklyGoal) => Promise<WeeklyGoal | undefined>;
  deleteWeeklyGoal: (id: string) => Promise<boolean>;
  getGoalsByQuadrant: (quadrant: Quadrant) => WeeklyGoal[];
  getGoalsByRole: (roleId: string) => WeeklyGoal[];
}

const WeeklyGoalsContext = createContext<WeeklyGoalsContextType | undefined>(undefined);

export function WeeklyGoalsProvider({ 
  children, 
  userId 
}: { 
  children: React.ReactNode;
  userId: string | null;
}) {
  const queryClient = useQueryClient();
  const currentWeekStart = useMemo(() => getWeekStartDate(), []);

  const { data: weeklyGoals = [], isLoading } = useQuery<WeeklyGoal[]>({
    queryKey: ["/api/weekly-goals", userId, currentWeekStart],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/weekly-goals/${userId}?week_start_date=${currentWeekStart}`);
      if (!res.ok) throw new Error("Failed to fetch weekly goals");
      return res.json();
    },
    enabled: !!userId,
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goal: Omit<InsertWeeklyGoal, "userId" | "weekStartDate">) => {
      if (!userId) throw new Error("No user ID");
      const res = await apiRequest("POST", "/api/weekly-goals", { 
        ...goal, 
        userId,
        weekStartDate: currentWeekStart 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-goals", userId, currentWeekStart] });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateWeeklyGoal }) => {
      const res = await apiRequest("PATCH", `/api/weekly-goals/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-goals", userId, currentWeekStart] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/weekly-goals/${id}`, {});
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-goals", userId, currentWeekStart] });
    },
  });

  const createWeeklyGoal = async (goal: Omit<InsertWeeklyGoal, "userId" | "weekStartDate">) => {
    return createGoalMutation.mutateAsync(goal);
  };

  const updateWeeklyGoal = async (id: string, updates: UpdateWeeklyGoal) => {
    return updateGoalMutation.mutateAsync({ id, updates });
  };

  const deleteWeeklyGoal = async (id: string) => {
    return deleteGoalMutation.mutateAsync(id);
  };

  const getGoalsByQuadrant = (quadrant: Quadrant) => {
    return weeklyGoals.filter(g => g.quadrant === quadrant);
  };

  const getGoalsByRole = (roleId: string) => {
    return weeklyGoals.filter(g => g.roleId === roleId);
  };

  return (
    <WeeklyGoalsContext.Provider value={{ 
      weeklyGoals, 
      isLoading, 
      currentWeekStart,
      hasGoalsForCurrentWeek: weeklyGoals.length > 0,
      createWeeklyGoal, 
      updateWeeklyGoal, 
      deleteWeeklyGoal,
      getGoalsByQuadrant,
      getGoalsByRole
    }}>
      {children}
    </WeeklyGoalsContext.Provider>
  );
}

export function useWeeklyGoals() {
  const context = useContext(WeeklyGoalsContext);
  if (!context) {
    throw new Error("useWeeklyGoals must be used within WeeklyGoalsProvider");
  }
  return context;
}
