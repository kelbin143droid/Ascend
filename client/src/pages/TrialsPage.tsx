import React from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SystemLayout } from "@/components/game/SystemLayout";
import { useTheme } from "@/context/ThemeContext";
import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Lock, Target, CheckCircle, ChevronLeft, Flame } from "lucide-react";
import type { Trial } from "@shared/schema";

const TRIALS_UNLOCK_PHASE = 4;

export default function TrialsPage() {
  const [, navigate] = useLocation();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const { player } = useGame();
  const queryClient = useQueryClient();

  const playerPhase = player?.phase || 1;
  const canAccessTrials = playerPhase >= TRIALS_UNLOCK_PHASE;

  const { data: trials = [], isLoading } = useQuery<Trial[]>({
    queryKey: ["trials", player?.id],
    queryFn: async () => {
      if (!player?.id) return [];
      const response = await fetch(`/api/trials/${player.id}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!player?.id && canAccessTrials,
  });

  const startTrialMutation = useMutation({
    mutationFn: async (trialType: string) => {
      const response = await fetch("/api/trials/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: player?.id, trialType }),
      });
      if (!response.ok) throw new Error("Failed to start trial");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trials", player?.id] });
    },
  });

  const focusTrial = trials.find(t => t.trialType === "focus");
  const hasActiveFocusTrial = focusTrial?.status === "active";
  const hasCompletedFocusTrial = focusTrial?.status === "completed";

  if (!canAccessTrials) {
    return (
      <SystemLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
          <Lock size={48} style={{ color: colors.textMuted }} />
          <h1 className="text-xl font-display font-bold" style={{ color: colors.text }}>
            TRIALS LOCKED
          </h1>
          <p className="text-sm text-center max-w-[280px]" style={{ color: colors.textMuted }}>
            Reach Phase {TRIALS_UNLOCK_PHASE} to unlock Trials and test your focus.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="mt-4"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back
          </Button>
        </div>
      </SystemLayout>
    );
  }

  return (
    <SystemLayout>
      <div className="flex flex-col gap-6 p-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            data-testid="button-back"
          >
            <ChevronLeft size={20} style={{ color: colors.text }} />
          </button>
          <div>
            <h1 
              className="text-2xl font-display font-black tracking-wider"
              style={{ color: colors.text }}
            >
              TRIALS
            </h1>
            <p 
              className="text-xs"
              style={{ color: colors.textMuted }}
            >
              Test Your Resolve
            </p>
          </div>
        </div>

        <div 
          className="rounded-lg overflow-hidden"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.surfaceBorder}`
          }}
        >
          <div className="p-4 border-b" style={{ borderColor: colors.surfaceBorder }}>
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: hasCompletedFocusTrial 
                    ? 'rgba(34,197,94,0.2)' 
                    : hasActiveFocusTrial 
                      ? `${colors.primary}30` 
                      : 'rgba(100,100,100,0.2)',
                  border: `1px solid ${hasCompletedFocusTrial ? '#22c55e60' : hasActiveFocusTrial ? colors.primary + '60' : 'rgba(100,100,100,0.3)'}`
                }}
              >
                {hasCompletedFocusTrial ? (
                  <CheckCircle size={24} style={{ color: '#22c55e' }} />
                ) : (
                  <Target size={24} style={{ color: hasActiveFocusTrial ? colors.primary : colors.textMuted }} />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold" style={{ color: colors.text }}>
                  Trial of Focus
                </h3>
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  Maintain 60%+ Q2 time for 7 consecutive days
                </p>
              </div>
              {hasCompletedFocusTrial && (
                <span 
                  className="text-xs font-bold px-2 py-1 rounded"
                  style={{ backgroundColor: 'rgba(34,197,94,0.2)', color: '#22c55e' }}
                >
                  COMPLETED
                </span>
              )}
            </div>
          </div>

          <div className="p-4">
            {hasCompletedFocusTrial ? (
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Flame size={20} style={{ color: '#f59e0b' }} />
                  <span className="font-display font-bold text-lg" style={{ color: '#22c55e' }}>
                    Trial Complete!
                  </span>
                </div>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  You earned 500 XP for your dedication
                </p>
              </div>
            ) : hasActiveFocusTrial ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm" style={{ color: colors.textMuted }}>Progress</span>
                  <span className="font-mono font-bold" style={{ color: colors.primary }}>
                    {focusTrial?.progressDays || 0} / 7 days
                  </span>
                </div>
                
                <div className="flex gap-2 mb-4">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-3 rounded-full transition-all"
                      style={{
                        backgroundColor: i < (focusTrial?.progressDays || 0) 
                          ? colors.primary 
                          : `${colors.primary}20`,
                        boxShadow: i < (focusTrial?.progressDays || 0) 
                          ? `0 0 8px ${colors.primary}60` 
                          : 'none'
                      }}
                    />
                  ))}
                </div>

                <div 
                  className="rounded-lg p-3 text-center"
                  style={{ backgroundColor: colors.background }}
                >
                  <p className="text-xs" style={{ color: colors.textMuted }}>
                    Keep your Q2 (Important, Not Urgent) time above 60% daily to progress. 
                    Missing a day resets your streak!
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                  Challenge yourself to maintain focus on important tasks for a full week.
                </p>
                <p className="text-xs mb-4" style={{ color: colors.primary }}>
                  Reward: 500 XP
                </p>
                <Button
                  onClick={() => startTrialMutation.mutate("focus")}
                  disabled={startTrialMutation.isPending}
                  style={{ backgroundColor: colors.primary }}
                  data-testid="button-start-focus-trial"
                >
                  {startTrialMutation.isPending ? "Starting..." : "Start Trial"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </SystemLayout>
  );
}
