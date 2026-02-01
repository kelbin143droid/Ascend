import React, { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Role, InsertRole, UpdateRole } from "@shared/schema";

interface RolesContextType {
  roles: Role[];
  isLoading: boolean;
  createRole: (role: Omit<InsertRole, "userId">) => Promise<Role>;
  updateRole: (id: string, updates: UpdateRole) => Promise<Role | undefined>;
  deleteRole: (id: string) => Promise<boolean>;
  getDefaultRole: () => Role | undefined;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

export function RolesProvider({ 
  children, 
  userId 
}: { 
  children: React.ReactNode;
  userId: string | null;
}) {
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/roles/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch roles");
      return res.json();
    },
    enabled: !!userId,
  });

  const createRoleMutation = useMutation({
    mutationFn: async (role: Omit<InsertRole, "userId">) => {
      if (!userId) throw new Error("No user ID");
      const res = await apiRequest("POST", "/api/roles", { ...role, userId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles", userId] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateRole }) => {
      const res = await apiRequest("PATCH", `/api/roles/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles", userId] });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/roles/${id}`, {});
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles", userId] });
    },
  });

  const createRole = async (role: Omit<InsertRole, "userId">) => {
    return createRoleMutation.mutateAsync(role);
  };

  const updateRole = async (id: string, updates: UpdateRole) => {
    return updateRoleMutation.mutateAsync({ id, updates });
  };

  const deleteRole = async (id: string) => {
    return deleteRoleMutation.mutateAsync(id);
  };

  const getDefaultRole = () => {
    return roles.find(r => r.name === "General") || roles[0];
  };

  return (
    <RolesContext.Provider value={{ 
      roles, 
      isLoading, 
      createRole, 
      updateRole, 
      deleteRole,
      getDefaultRole 
    }}>
      {children}
    </RolesContext.Provider>
  );
}

export function useRoles() {
  const context = useContext(RolesContext);
  if (!context) {
    throw new Error("useRoles must be used within RolesProvider");
  }
  return context;
}
