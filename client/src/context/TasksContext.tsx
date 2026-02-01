import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Task, InsertTask, UpdateTask, Quadrant } from "@shared/schema";

function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

interface TasksContextType {
  tasks: Task[];
  isLoading: boolean;
  currentWeekStart: string;
  createTask: (task: Omit<InsertTask, "userId">) => Promise<Task>;
  updateTask: (id: string, updates: UpdateTask, confirmStrategic?: boolean) => Promise<Task | undefined>;
  deleteTask: (id: string, confirmStrategic?: boolean) => Promise<boolean>;
  getTasksByQuadrant: (quadrant: Quadrant) => Task[];
  getTasksByRole: (roleId: string) => Task[];
  getTodayTasks: () => Task[];
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ 
  children, 
  userId 
}: { 
  children: React.ReactNode;
  userId: string | null;
}) {
  const queryClient = useQueryClient();
  const currentWeekStart = useMemo(() => getWeekStartDate(), []);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", userId, currentWeekStart],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/tasks/${userId}?week_start_date=${currentWeekStart}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    enabled: !!userId,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (task: Omit<InsertTask, "userId">) => {
      if (!userId) throw new Error("No user ID");
      const res = await apiRequest("POST", "/api/tasks", { ...task, userId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", userId, currentWeekStart] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates, confirmStrategic }: { id: string; updates: UpdateTask; confirmStrategic?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { ...updates, confirmStrategic });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", userId, currentWeekStart] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async ({ id, confirmStrategic }: { id: string; confirmStrategic?: boolean }) => {
      const res = await apiRequest("DELETE", `/api/tasks/${id}`, { confirmStrategic });
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", userId, currentWeekStart] });
    },
  });

  const createTask = async (task: Omit<InsertTask, "userId">) => {
    return createTaskMutation.mutateAsync(task);
  };

  const updateTask = async (id: string, updates: UpdateTask, confirmStrategic?: boolean) => {
    return updateTaskMutation.mutateAsync({ id, updates, confirmStrategic });
  };

  const deleteTask = async (id: string, confirmStrategic?: boolean) => {
    return deleteTaskMutation.mutateAsync({ id, confirmStrategic });
  };

  const getTasksByQuadrant = (quadrant: Quadrant) => {
    return tasks.filter(t => t.quadrant === quadrant);
  };

  const getTasksByRole = (roleId: string) => {
    return tasks.filter(t => t.roleId === roleId);
  };

  const getTodayTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks.filter(t => {
      const taskDate = new Date(t.startTime);
      return taskDate >= today && taskDate < tomorrow;
    });
  };

  return (
    <TasksContext.Provider value={{ 
      tasks, 
      isLoading, 
      currentWeekStart,
      createTask, 
      updateTask, 
      deleteTask,
      getTasksByQuadrant,
      getTasksByRole,
      getTodayTasks
    }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used within TasksProvider");
  }
  return context;
}
