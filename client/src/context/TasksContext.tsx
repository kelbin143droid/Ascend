import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Task, InsertTask, UpdateTask, Quadrant } from "@shared/schema";
import {
  scheduleTaskNotification,
  cancelTaskNotification,
  requestNotificationPermissions,
  isNativePlatform,
  listPendingNotifications,
} from "@/lib/notificationService";
import { useToast } from "@/hooks/use-toast";

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

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
  const { toast } = useToast();
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

  // Authoritative sync: whenever the loaded task list changes, reconcile pending
  // OS notifications with the desired set of upcoming tasks. We schedule any
  // missing/changed notifications and CANCEL pending ones whose task no longer
  // exists or has moved into the past. Stable ids (FNV-1a of taskId) make this
  // idempotent — re-scheduling overwrites without duplicating.
  const syncedSignatureRef = useRef<string>("");
  useEffect(() => {
    if (!isNativePlatform()) return;
    const upcoming = (tasks ?? []).filter(
      (t) => t?.id && t?.startTime && new Date(t.startTime).getTime() > Date.now(),
    );
    const signature = upcoming
      .map((t) => `${t.id}:${new Date(t.startTime!).getTime()}:${t.title ?? ""}`)
      .sort()
      .join("|");
    if (signature === syncedSignatureRef.current) return;

    let cancelled = false;
    (async () => {
      const granted = await requestNotificationPermissions();
      if (cancelled) return;
      if (!granted) {
        console.warn("[TasksContext] Notification permission denied — Sectograph tasks not scheduled");
        // Do NOT commit signature so we retry once permission flips to granted.
        return;
      }

      // Cancel pending OS notifications that are no longer desired.
      try {
        const desiredIds = new Set(upcoming.map((t) => t.id));
        const pending = await listPendingNotifications();
        for (const p of pending) {
          const taskId = (p as any)?.extra?.taskId as string | undefined;
          if (taskId && !desiredIds.has(taskId)) {
            await cancelTaskNotification(taskId);
          }
        }
      } catch (err) {
        console.warn("[TasksContext] reconcile cancel pass failed", err);
      }

      // Schedule (or re-schedule) every desired upcoming task.
      let okCount = 0;
      for (const task of upcoming) {
        try {
          const r = await scheduleTaskNotification(task);
          if (r.scheduled) okCount += 1;
        } catch (err) {
          console.warn("[TasksContext] schedule failed for task", task.id, err);
        }
      }
      console.log(
        `[TasksContext] Sectograph notif sync — scheduled ${okCount}/${upcoming.length} upcoming task(s)`,
      );
      // Only commit signature on a successful pass so denied→granted recovers.
      if (!cancelled) syncedSignatureRef.current = signature;
    })();

    return () => {
      cancelled = true;
    };
  }, [tasks]);

  const createTaskMutation = useMutation({
    mutationFn: async (task: Omit<InsertTask, "userId">) => {
      if (!userId) throw new Error("No user ID");
      const res = await apiRequest("POST", "/api/tasks", { ...task, userId });
      return res.json() as Promise<Task>;
    },
    onSuccess: async (created) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", userId, currentWeekStart] });
      if (!isNativePlatform()) return;
      if (!created?.id || !created?.startTime) return;
      try {
        const r = await scheduleTaskNotification(created);
        const at = new Date(created.startTime);
        if (r.scheduled) {
          toast({
            title: "Notification scheduled",
            description: `You'll be reminded at ${formatTime(at)}.`,
          });
        } else {
          toast({
            title: "Notification NOT scheduled",
            description: `Reason: ${r.reason ?? "unknown"} (start time: ${at.toISOString()})`,
            variant: "destructive",
          });
        }
      } catch (err) {
        console.warn("[TasksContext] schedule on create failed", err);
        toast({
          title: "Notification failed",
          description: String(err),
          variant: "destructive",
        });
      }
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates, confirmStrategic }: { id: string; updates: UpdateTask; confirmStrategic?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { ...updates, confirmStrategic });
      return res.json() as Promise<Task>;
    },
    onSuccess: async (updated) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", userId, currentWeekStart] });
      if (!isNativePlatform()) return;
      if (!updated?.id || !updated?.startTime) return;
      try {
        const r = await scheduleTaskNotification(updated);
        const at = new Date(updated.startTime);
        if (r.scheduled) {
          toast({
            title: "Notification rescheduled",
            description: `Updated to ${formatTime(at)}.`,
          });
        } else {
          toast({
            title: "Reschedule skipped",
            description: `Reason: ${r.reason ?? "unknown"}`,
            variant: "destructive",
          });
        }
      } catch (err) {
        console.warn("[TasksContext] reschedule on update failed", err);
      }
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async ({ id, confirmStrategic }: { id: string; confirmStrategic?: boolean }) => {
      const res = await apiRequest("DELETE", `/api/tasks/${id}`, { confirmStrategic });
      return { ok: res.ok, id };
    },
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", userId, currentWeekStart] });
      cancelTaskNotification(id).catch((err) =>
        console.warn("[TasksContext] cancel on delete failed", err),
      );
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
