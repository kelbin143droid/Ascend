import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Brain, ChevronDown, ChevronUp, Zap, Sparkles, Shield } from "lucide-react";
import { aiCoachService, type HabitRecommendation } from "@/lib/aiCoachService";
import type { Habit } from "@shared/schema";

const STAT_OPTIONS = [
  { value: "strength", label: "Strength", color: "#ef4444", icon: "💪" },
  { value: "sense", label: "Sense", color: "#3b82f6", icon: "🧘" },
  { value: "vitality", label: "Vitality", color: "#f59e0b", icon: "❤️" },
  { value: "agility", label: "Agility", color: "#22c55e", icon: "⚡" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  editingHabit?: Habit | null;
  habits: Habit[];
  playerId: string;
  isPending: boolean;
}

function EffectTag({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}30` }}
    >
      {label}
    </span>
  );
}

function RecCard({ rec, selected, onSelect }: { rec: HabitRecommendation; selected: boolean; onSelect: () => void }) {
  const statOpt = STAT_OPTIONS.find((s) => s.value === rec.stat);
  const color = statOpt?.color ?? "#3b82f6";
  return (
    <button
      onClick={onSelect}
      data-testid={`ai-rec-card-${rec.name.replace(/\s+/g, "-").toLowerCase()}`}
      className="w-full text-left rounded-xl p-3 transition-all"
      style={{
        backgroundColor: selected ? `${color}14` : "rgba(255,255,255,0.025)",
        border: `1px solid ${selected ? color + "50" : "rgba(255,255,255,0.06)"}`,
        boxShadow: selected ? `0 0 14px ${color}20` : "none",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-tight" style={{ color: selected ? color : "rgba(255,255,255,0.85)" }}>
            {rec.name}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {rec.durationMinutes} min · +{rec.xpBonus} XP
          </p>
        </div>
        <div className="flex flex-col gap-1 items-end shrink-0">
          {rec.hpEffect !== "none" && <EffectTag label={`HP ${rec.hpEffect}`} color="#22c55e" />}
          {rec.mpEffect !== "none" && <EffectTag label={`MP ${rec.mpEffect}`} color="#3b82f6" />}
        </div>
      </div>
      <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
        {rec.tip}
      </p>
      {selected && (
        <div className="mt-2 text-[9px] font-bold uppercase tracking-wider" style={{ color }}>
          ✓ Selected — fields auto-filled below
        </div>
      )}
    </button>
  );
}

export function AddHabitModal({ open, onClose, onSubmit, editingHabit, habits, playerId, isPending }: Props) {
  const [name, setName] = useState("");
  const [stat, setStat] = useState("strength");
  const [duration, setDuration] = useState("3");
  const [stackAfter, setStackAfter] = useState("none");
  const [cue, setCue] = useState("");
  const [craving, setCraving] = useState("");
  const [response, setResponse] = useState("");
  const [reward, setReward] = useState("");
  const [scheduledHour, setScheduledHour] = useState("");
  const [scheduledMinute, setScheduledMinute] = useState("0");
  const [showLoopFields, setShowLoopFields] = useState(false);
  const [showAI, setShowAI] = useState(true);
  const [selectedRec, setSelectedRec] = useState<HabitRecommendation | null>(null);

  const statOpt = STAT_OPTIONS.find((s) => s.value === stat);
  const recs = aiCoachService.getRecommendations(stat);
  const color = statOpt?.color ?? "#3b82f6";

  useEffect(() => {
    if (!open) return;
    if (editingHabit) {
      setName(editingHabit.name);
      setStat(editingHabit.stat);
      setDuration(String(editingHabit.baseDurationMinutes));
      setStackAfter(editingHabit.stackAfterHabitId ?? "none");
      setCue(editingHabit.cue ?? "");
      setCraving(editingHabit.craving ?? "");
      setResponse(editingHabit.response ?? "");
      setReward(editingHabit.reward ?? "");
      setScheduledHour(editingHabit.scheduledHour != null ? String(editingHabit.scheduledHour) : "");
      setScheduledMinute(editingHabit.scheduledMinute != null ? String(editingHabit.scheduledMinute) : "0");
      setShowLoopFields(!!(editingHabit.cue || editingHabit.craving || editingHabit.response || editingHabit.reward));
      setShowAI(false);
      setSelectedRec(null);
    } else {
      setName(""); setStat("strength"); setDuration("3"); setStackAfter("none");
      setCue(""); setCraving(""); setResponse(""); setReward("");
      setScheduledHour(""); setScheduledMinute("0");
      setShowLoopFields(false); setShowAI(true); setSelectedRec(null);
    }
  }, [open, editingHabit]);

  const applyRec = (rec: HabitRecommendation) => {
    setSelectedRec(rec);
    setName(rec.name);
    setDuration(String(rec.durationMinutes));
    setCue(rec.cue);
    setCraving(rec.craving);
    setResponse(rec.response);
    setReward(rec.reward);
    setShowLoopFields(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const timeSet = scheduledHour !== "" && scheduledHour !== "none";
    const hrs = timeSet ? parseInt(scheduledHour) : undefined;
    const mins = timeSet ? parseInt(scheduledMinute) : undefined;
    onSubmit({
      name: name.trim(),
      stat,
      baseDurationMinutes: parseInt(duration) || 3,
      currentDurationMinutes: parseInt(duration) || 3,
      stackAfterHabitId: stackAfter === "none" ? undefined : stackAfter,
      cue: cue.trim() || undefined,
      craving: craving.trim() || undefined,
      response: response.trim() || undefined,
      reward: reward.trim() || undefined,
      scheduledHour: hrs,
      scheduledMinute: mins,
      userId: playerId,
    });
  };

  const LOOP_FIELDS = [
    { label: "Cue — What triggers it?", val: cue, setter: setCue, color: "#22d3ee", placeholder: "e.g. After morning alarm", testId: "input-habit-cue" },
    { label: "Craving — What feeling do you want?", val: craving, setter: setCraving, color: "#a78bfa", placeholder: "e.g. Feel energized", testId: "input-habit-craving" },
    { label: "Response — The habit action", val: response, setter: setResponse, color: "#22c55e", placeholder: "e.g. Do 10 push-ups", testId: "input-habit-response" },
    { label: "Reward — What you get", val: reward, setter: setReward, color: "#f59e0b", placeholder: "e.g. Strength XP + energy boost", testId: "input-habit-reward" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="border-0 max-w-sm max-h-[92vh] overflow-y-auto p-0"
        style={{ backgroundColor: "rgba(5,8,18,0.98)", border: `1px solid ${color}25` }}
      >
        <div className="px-5 pt-5 pb-1">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold" style={{ color: "rgba(255,255,255,0.9)", fontFamily: "'Orbitron', monospace" }}>
              <Zap size={14} style={{ color }} />
              {editingHabit ? "Edit Habit" : "Build a New Habit"}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Stat selector */}
          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] block mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              Stat Category
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {STAT_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => { setStat(s.value); setSelectedRec(null); }}
                  data-testid={`stat-btn-${s.value}`}
                  className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all"
                  style={{
                    backgroundColor: stat === s.value ? `${s.color}18` : "rgba(255,255,255,0.025)",
                    border: `1px solid ${stat === s.value ? s.color + "45" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  <span className="text-base">{s.icon}</span>
                  <span className="text-[9px] font-bold" style={{ color: stat === s.value ? s.color : "rgba(255,255,255,0.4)" }}>
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Recommendations panel */}
          {!editingHabit && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <button
                onClick={() => setShowAI(!showAI)}
                className="w-full flex items-center justify-between px-3 py-2.5 transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                data-testid="button-toggle-ai-suggestions"
              >
                <div className="flex items-center gap-2">
                  <Brain size={12} style={{ color }} />
                  <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color }}>
                    AI Coach Suggestions
                  </span>
                </div>
                {showAI ? <ChevronUp size={12} style={{ color: "rgba(255,255,255,0.3)" }} /> : <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.3)" }} />}
              </button>

              {showAI && (
                <div className="px-3 pb-3 space-y-2 pt-2">
                  {recs.map((rec) => (
                    <RecCard
                      key={rec.name}
                      rec={rec}
                      selected={selectedRec?.name === rec.name}
                      onSelect={() => applyRec(rec)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Habit Name */}
          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] block mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              Habit Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Push-Ups"
              className="h-10 text-sm"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: name ? `${color}40` : "rgba(255,255,255,0.08)", color: "white" }}
              data-testid="input-habit-name"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] block mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              Duration (minutes)
            </label>
            <Input
              type="number"
              min="1"
              max="120"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="h-10 text-sm"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "white" }}
              data-testid="input-habit-duration"
            />
            <p className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>Scales automatically with your consistency</p>
          </div>

          {/* Scheduled Time */}
          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] block mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              Scheduled Time (optional)
            </label>
            <div className="flex gap-2">
              <Select value={scheduledHour} onValueChange={setScheduledHour}>
                <SelectTrigger className="h-9 flex-1 text-xs" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "white" }} data-testid="select-scheduled-hour">
                  <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: "#0a0e1a", borderColor: "rgba(255,255,255,0.1)" }}>
                  <SelectItem value="none" style={{ color: "white" }}>No time</SelectItem>
                  {Array.from({ length: 24 }, (_, i) => {
                    const label = i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`;
                    return <SelectItem key={i} value={String(i)} style={{ color: "white" }}>{label}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
              {scheduledHour !== "" && scheduledHour !== "none" && scheduledHour && (
                <Select value={scheduledMinute} onValueChange={setScheduledMinute}>
                  <SelectTrigger className="h-9 w-20 text-xs" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "white" }} data-testid="select-scheduled-minute">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: "#0a0e1a", borderColor: "rgba(255,255,255,0.1)" }}>
                    {["0", "15", "30", "45"].map((m) => (
                      <SelectItem key={m} value={m} style={{ color: "white" }}>:{m.padStart(2, "0")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Stack After */}
          {habits.filter((h) => h.id !== editingHabit?.id).length > 0 && (
            <div>
              <label className="text-[9px] uppercase tracking-[0.15em] block mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                Stack After (optional)
              </label>
              <Select value={stackAfter} onValueChange={setStackAfter}>
                <SelectTrigger className="h-9 text-xs" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "white" }} data-testid="select-habit-stack-after">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: "#0a0e1a", borderColor: "rgba(255,255,255,0.1)" }}>
                  <SelectItem value="none" style={{ color: "white" }}>None</SelectItem>
                  {habits.filter((h) => h.id !== editingHabit?.id).map((h) => (
                    <SelectItem key={h.id} value={h.id} style={{ color: "white" }}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Habit Loop (collapsible) */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
            <button
              type="button"
              onClick={() => setShowLoopFields(!showLoopFields)}
              className="w-full flex items-center justify-between px-3 py-2.5"
              style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
              data-testid="button-toggle-habit-loop"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles size={11} style={{ color: "rgba(34,211,238,0.7)" }} />
                <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "rgba(34,211,238,0.7)" }}>
                  Habit Loop  cue → craving → response → reward
                </span>
              </div>
              {showLoopFields ? <ChevronUp size={12} style={{ color: "rgba(255,255,255,0.2)" }} /> : <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.2)" }} />}
            </button>

            {showLoopFields && (
              <div className="px-3 pb-3 pt-2 space-y-2.5 border-l-2" style={{ borderColor: "rgba(34,211,238,0.2)" }}>
                {LOOP_FIELDS.map(({ label, val, setter, color: c, placeholder, testId }) => (
                  <div key={testId}>
                    <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: c }}>
                      {label}
                    </label>
                    <Input
                      value={val}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={placeholder}
                      className="h-8 text-xs"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: `${c}25`, color: "white" }}
                      data-testid={testId}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* XP/HP/MP preview */}
          {selectedRec && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ backgroundColor: `${color}08`, border: `1px solid ${color}20` }}
              data-testid="xp-preview"
            >
              <Shield size={11} style={{ color }} />
              <div className="flex flex-wrap gap-2">
                <span className="text-[9px] font-bold" style={{ color }}>+{selectedRec.xpBonus} XP</span>
                {selectedRec.hpEffect !== "none" && (
                  <span className="text-[9px] font-bold" style={{ color: "#22c55e" }}>HP {selectedRec.hpEffect}</span>
                )}
                {selectedRec.mpEffect !== "none" && (
                  <span className="text-[9px] font-bold" style={{ color: "#3b82f6" }}>MP {selectedRec.mpEffect}</span>
                )}
              </div>
            </div>
          )}

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
                backgroundColor: name.trim() ? color : "rgba(255,255,255,0.06)",
                color: name.trim() ? "#05070f" : "rgba(255,255,255,0.2)",
                boxShadow: name.trim() ? `0 0 16px ${color}40` : "none",
                border: "none",
              }}
              data-testid="button-submit-habit"
            >
              {isPending ? "Saving..." : editingHabit ? "Save Changes" : "Add Habit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
