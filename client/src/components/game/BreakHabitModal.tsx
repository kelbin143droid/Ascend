import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Brain, Zap, ArrowRight, Sparkles } from "lucide-react";
import { aiCoachService, type BadHabitSolution } from "@/lib/aiCoachService";
import type { BadHabit } from "@shared/schema";

const BAD_HABIT_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "substance", label: "Substance" },
  { value: "digital", label: "Digital / Screen" },
  { value: "food", label: "Food & Eating" },
  { value: "procrastination", label: "Procrastination" },
  { value: "social", label: "Social Patterns" },
  { value: "sleep", label: "Sleep Disruption" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  editingBadHabit?: BadHabit | null;
  playerId: string;
  isPending: boolean;
}

export function BreakHabitModal({ open, onClose, onSubmit, editingBadHabit, playerId, isPending }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("general");
  const [trigger, setTrigger] = useState("");
  const [craving, setCraving] = useState("");
  const [replacement, setReplacement] = useState("");
  const [replacementCue, setReplacementCue] = useState("");
  const [aiSolution, setAiSolution] = useState<BadHabitSolution | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingBadHabit) {
      setName(editingBadHabit.name);
      setCategory(editingBadHabit.category);
      setTrigger(editingBadHabit.trigger ?? "");
      setCraving(editingBadHabit.craving ?? "");
      setReplacement(editingBadHabit.replacementHabit ?? "");
      setReplacementCue(editingBadHabit.replacementCue ?? "");
      setAiSolution(null);
      setAnalyzed(false);
    } else {
      setName(""); setCategory("general"); setTrigger(""); setCraving("");
      setReplacement(""); setReplacementCue(""); setAiSolution(null); setAnalyzed(false);
    }
  }, [open, editingBadHabit]);

  const analyze = () => {
    if (!name.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      const solution = aiCoachService.analyzeBadHabit(name, category);
      setAiSolution(solution);
      setReplacement(solution.replacement);
      setReplacementCue(solution.replacementCue);
      setAnalyzed(true);
      setAnalyzing(false);
    }, 800);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      category,
      trigger: trigger.trim() || undefined,
      craving: craving.trim() || undefined,
      replacementHabit: replacement.trim() || undefined,
      replacementCue: replacementCue.trim() || undefined,
      userId: playerId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="border-0 max-w-sm max-h-[92vh] overflow-y-auto p-0"
        style={{ backgroundColor: "rgba(5,8,18,0.98)", border: "1px solid rgba(239,68,68,0.2)" }}
      >
        <div className="px-5 pt-5 pb-1">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold" style={{ color: "rgba(255,255,255,0.9)", fontFamily: "'Orbitron', monospace" }}>
              <Zap size={14} style={{ color: "#ef4444" }} />
              {editingBadHabit ? "Edit Bad Habit" : "Break a Bad Habit"}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Header tip */}
          <div
            className="rounded-lg px-3 py-2.5 text-[10px] leading-relaxed"
            style={{ backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "rgba(239,68,68,0.8)" }}
          >
            Identify the pattern, understand the craving, then replace the response.
          </div>

          {/* Name */}
          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] block mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              Habit / Pattern Name
            </label>
            <Input
              value={name}
              onChange={(e) => { setName(e.target.value); setAnalyzed(false); setAiSolution(null); }}
              placeholder="e.g. Late night phone scrolling"
              className="h-10 text-sm"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(239,68,68,0.2)", color: "white" }}
              data-testid="input-bad-habit-name"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] block mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-sm" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "white" }} data-testid="select-bad-habit-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: "#0a0e1a", borderColor: "rgba(255,255,255,0.1)" }}>
                {BAD_HABIT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value} style={{ color: "white" }}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trigger */}
          <div>
            <label className="text-[9px] uppercase tracking-wider block mb-1.5" style={{ color: "#f87171" }}>
              Trigger — When does it happen?
            </label>
            <Input
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder="e.g. When I'm bored, after dinner"
              className="h-9 text-xs"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(248,113,113,0.2)", color: "white" }}
              data-testid="input-bad-habit-trigger"
            />
          </div>

          {/* Craving */}
          <div>
            <label className="text-[9px] uppercase tracking-wider block mb-1.5" style={{ color: "#fb923c" }}>
              Craving — What need is it fulfilling?
            </label>
            <Input
              value={craving}
              onChange={(e) => setCraving(e.target.value)}
              placeholder="e.g. Escape, stimulation, comfort"
              className="h-9 text-xs"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(251,146,60,0.2)", color: "white" }}
              data-testid="input-bad-habit-craving"
            />
          </div>

          {/* AI Analyze Button */}
          {!editingBadHabit && (
            <button
              onClick={analyze}
              disabled={!name.trim() || analyzing}
              className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
              style={{
                backgroundColor: !name.trim() ? "rgba(167,139,250,0.05)" : "rgba(167,139,250,0.12)",
                border: "1px solid rgba(167,139,250,0.25)",
                color: !name.trim() ? "rgba(167,139,250,0.3)" : "rgba(167,139,250,0.9)",
                cursor: !name.trim() ? "not-allowed" : "pointer",
              }}
              data-testid="button-ai-analyze"
            >
              <Brain size={13} />
              {analyzing ? "Analyzing..." : analyzed ? "Re-analyze with AI Coach" : "Analyze with AI Coach"}
            </button>
          )}

          {/* AI Solution Result */}
          {aiSolution && (
            <div
              className="rounded-xl p-3 space-y-2"
              style={{ backgroundColor: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)" }}
              data-testid="ai-solution-panel"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(167,139,250,0.2)" }}>
                  <Brain size={11} style={{ color: "#a78bfa" }} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#a78bfa" }}>
                  AI Coach Analysis
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles size={11} style={{ color: "#a78bfa", marginTop: 2, flexShrink: 0 }} />
                <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {aiSolution.tip}
                </p>
              </div>
            </div>
          )}

          {/* Replacement Plan */}
          <div
            className="rounded-xl p-3 space-y-3"
            style={{ backgroundColor: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)" }}
          >
            <div className="flex items-center gap-1.5">
              <ArrowRight size={11} style={{ color: "#22c55e" }} />
              <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "#22c55e" }}>
                Replacement Plan
              </p>
              {analyzed && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(167,139,250,0.12)", color: "#a78bfa" }}>
                  AI-filled
                </span>
              )}
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-wider block mb-1.5" style={{ color: "#34d399" }}>
                When the trigger hits, do:
              </label>
              <Input
                value={replacementCue}
                onChange={(e) => setReplacementCue(e.target.value)}
                placeholder="e.g. When I reach for phone after dinner..."
                className="h-9 text-xs"
                style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(52,211,153,0.2)", color: "white" }}
                data-testid="input-bad-habit-replacement-cue"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider block mb-1.5" style={{ color: "#22d3ee" }}>
                Do this instead:
              </label>
              <Input
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="e.g. Read 10 pages, take a 5-min walk"
                className="h-9 text-xs"
                style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(34,211,238,0.2)", color: "white" }}
                data-testid="input-bad-habit-replacement"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)" }}
            >
              Cancel
            </button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || isPending}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider"
              style={{
                backgroundColor: name.trim() ? "#7f1d1d" : "rgba(255,255,255,0.06)",
                color: name.trim() ? "white" : "rgba(255,255,255,0.2)",
                border: "none",
              }}
              data-testid="button-submit-bad-habit"
            >
              {isPending ? "Saving..." : editingBadHabit ? "Save Changes" : "Start Tracking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
