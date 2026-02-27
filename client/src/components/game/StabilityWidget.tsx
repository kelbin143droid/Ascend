import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, TrendingDown, Minus, Moon, Battery, Brain } from "lucide-react";
import { PhaseEnvironment } from "./PhaseEnvironment";
import { apiRequest } from "@/lib/queryClient";
import { PHASE_NAMES } from "@shared/schema";

interface StabilityData {
  score: number;
  components: {
    habitCompletionPct: number;
    sleepConsistency: number;
    energyCompliance: number;
    emotionalStability: number;
    taskTimingAdherence: number;
  };
  trend: "improving" | "stable" | "declining";
  regressionWarning: string | null;
  tier: { tier: string; label: string; color: string };
  regression: { type: string; message: string };
  phase: {
    current: number;
    name: string;
    description: string;
    visual: any;
    nextPhase: { name: string; description: string } | null;
  };
}

const SLIDER_LABELS = [
  { key: "sleepConsistency", label: "Sleep Quality", icon: Moon, description: "How consistent was your sleep?" },
  { key: "energyCompliance", label: "Energy Level", icon: Battery, description: "How is your recovery/energy?" },
  { key: "emotionalStability", label: "Emotional State", icon: Brain, description: "How stable do you feel?" },
] as const;

export function StabilityWidget() {
  const { player } = useGame();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [sliders, setSliders] = useState({
    sleepConsistency: player?.stability?.sleepConsistency ?? 50,
    energyCompliance: player?.stability?.energyCompliance ?? 50,
    emotionalStability: player?.stability?.emotionalStability ?? 50,
  });

  const { data: stabilityData } = useQuery<StabilityData>({
    queryKey: ["/api/player", player?.id, "stability"],
    queryFn: async () => {
      const res = await fetch(`/api/player/${player?.id}/stability`);
      return res.json();
    },
    enabled: !!player?.id,
    refetchInterval: 60000,
  });

  const updateMutation = useMutation({
    mutationFn: async (values: typeof sliders) => {
      const res = await apiRequest("POST", `/api/player/${player?.id}/stability/update`, values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", player?.id, "stability"] });
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
    },
  });

  if (!player || !stabilityData) return null;

  const score = stabilityData.score;
  const tier = stabilityData.tier;
  const trend = stabilityData.trend;
  const TrendIcon = trend === "improving" ? TrendingUp : trend === "declining" ? TrendingDown : Minus;

  return (
    <div data-testid="stability-widget" className="space-y-3">
      <PhaseEnvironment phase={player.phase} stabilityScore={score} compact />

      <button
        data-testid="stability-expand-toggle"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all"
        style={{
          backgroundColor: `${tier.color}10`,
          border: `1px solid ${tier.color}30`,
        }}
      >
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: tier.color }} />
          <span className="text-xs font-display tracking-wider uppercase" style={{ color: tier.color }}>
            {tier.label} Stability
          </span>
          <TrendIcon size={12} style={{ color: trend === "improving" ? "#22c55e" : trend === "declining" ? "#ef4444" : "#6b7280" }} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-bold" style={{ color: tier.color }}>
            {score}/100
          </span>
          {expanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-1 pb-2">
              {stabilityData.regressionWarning && (
                <div
                  data-testid="regression-warning"
                  className="flex items-start gap-2 p-2.5 rounded-lg text-xs"
                  style={{ backgroundColor: "#ef444420", border: "1px solid #ef444440" }}
                >
                  <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
                  <span className="text-red-300">{stabilityData.regressionWarning}</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-[10px] font-display tracking-wider uppercase text-gray-500">
                  Components
                </div>
                <ComponentBar label="Habits" value={stabilityData.components.habitCompletionPct} color="#3b82f6" weight="35%" />
                <ComponentBar label="Sleep" value={stabilityData.components.sleepConsistency} color="#a855f7" weight="20%" />
                <ComponentBar label="Energy" value={stabilityData.components.energyCompliance} color="#22c55e" weight="15%" />
                <ComponentBar label="Emotional" value={stabilityData.components.emotionalStability} color="#f59e0b" weight="15%" />
                <ComponentBar label="Timing" value={stabilityData.components.taskTimingAdherence} color="#06b6d4" weight="15%" />
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-[10px] font-display tracking-wider uppercase text-gray-500">
                  Self-Report
                </div>
                {SLIDER_LABELS.map(({ key, label, icon: Icon, description }) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-300">{label}</span>
                      </div>
                      <span className="text-xs font-mono text-gray-400">{sliders[key]}</span>
                    </div>
                    <input
                      data-testid={`slider-${key}`}
                      type="range"
                      min="0"
                      max="100"
                      value={sliders[key]}
                      onChange={(e) => setSliders(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${tier.color} ${sliders[key]}%, #374151 ${sliders[key]}%)`,
                      }}
                    />
                  </div>
                ))}
                <button
                  data-testid="button-update-stability"
                  onClick={() => updateMutation.mutate(sliders)}
                  disabled={updateMutation.isPending}
                  className="w-full py-1.5 rounded-lg text-xs font-display tracking-wider uppercase transition-all"
                  style={{
                    backgroundColor: `${tier.color}20`,
                    border: `1px solid ${tier.color}40`,
                    color: tier.color,
                  }}
                >
                  {updateMutation.isPending ? "Updating..." : "Update Self-Report"}
                </button>
              </div>

              {stabilityData.phase.nextPhase && (
                <div className="pt-1">
                  <div className="text-[10px] font-display tracking-wider uppercase text-gray-500 mb-1">
                    Next Evolution
                  </div>
                  <div className="text-xs text-gray-400">
                    <span style={{ color: tier.color }}>{stabilityData.phase.nextPhase.name}</span>
                    {" — "}
                    {stabilityData.phase.nextPhase.description}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ComponentBar({ label, value, color, weight }: { label: string; value: number; color: string; weight: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-gray-800 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
      <span className="text-[10px] font-mono text-gray-500 w-8 text-right">{value}</span>
      <span className="text-[9px] text-gray-600 w-6">{weight}</span>
    </div>
  );
}
