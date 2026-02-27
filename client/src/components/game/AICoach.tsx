import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { Brain, Sparkles, X, Clock, Smile, Frown, Meh, Heart, Zap, Send, MessageCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface CoachMessage {
  type: "celebration" | "warning" | "suggestion" | "motivation" | "check_in" | "recovery" | "insight" | "regression" | "stability";
  title: string;
  message: string;
  priority: number;
  actionable?: boolean;
  action?: string;
}

interface HabitSuggestion {
  habitId: string;
  habitName: string;
  suggested: number;
  reason: string;
  momentum: number;
  momentumTier: { tier: string; label: string; color: string };
}

interface CoachData {
  messages: CoachMessage[];
  nudge: string;
  habitSuggestions: HabitSuggestion[];
}

interface ChatMessage {
  role: "user" | "coach";
  text: string;
  suggestions?: string[];
}

const typeColors: Record<string, string> = {
  celebration: "#22c55e",
  warning: "#f59e0b",
  suggestion: "#3b82f6",
  motivation: "#a855f7",
  check_in: "#6b7280",
  recovery: "#ef4444",
  insight: "#06b6d4",
  regression: "#dc2626",
  stability: "#06b6d4",
};

const moodEmojis = [
  { icon: Zap, label: "Energized", value: "energized" },
  { icon: Smile, label: "Happy", value: "happy" },
  { icon: Meh, label: "Okay", value: "okay" },
  { icon: Frown, label: "Low", value: "low" },
  { icon: Heart, label: "Grateful", value: "grateful" },
];

export function AICoach() {
  const { player } = useGame();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"insights" | "chat">("insights");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: coachData, isLoading } = useQuery<CoachData>({
    queryKey: ["/api/player", player?.id, "coach"],
    queryFn: async () => {
      if (!player?.id) throw new Error("No player");
      const res = await fetch(`/api/player/${player.id}/coach`);
      if (!res.ok) throw new Error("Failed to fetch coach data");
      return res.json();
    },
    enabled: !!player?.id,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", `/api/player/${player!.id}/coach/chat`, { message });
      return res.json();
    },
    onSuccess: (data) => {
      setChatMessages(prev => [
        ...prev,
        { role: "coach", text: data.reply, suggestions: data.suggestions },
      ]);
    },
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChat = () => {
    if (!chatInput.trim() || chatMutation.isPending) return;
    const msg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", text: msg }]);
    setChatInput("");
    chatMutation.mutate(msg);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setChatMessages(prev => [...prev, { role: "user", text: suggestion }]);
    chatMutation.mutate(suggestion);
  };

  const hasNewSuggestions = coachData && (coachData.messages.length > 0 || coachData.habitSuggestions.length > 0);
  const topMessage = coachData?.messages?.sort((a, b) => b.priority - a.priority)[0];

  if (!player) return null;

  return (
    <>
      <button
        data-testid="button-ai-coach"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
          hasNewSuggestions && !isOpen && "animate-pulse"
        )}
        style={{
          backgroundColor: colors.primary,
          boxShadow: `0 0 20px ${colors.primaryGlow}, 0 0 40px ${colors.primaryGlow}40`,
          border: `2px solid ${colors.surfaceBorder}`,
        }}
      >
        {isOpen ? (
          <X size={20} style={{ color: colors.background }} />
        ) : (
          <Brain size={20} style={{ color: colors.background }} />
        )}
      </button>

      {isOpen && (
        <div
          data-testid="panel-ai-coach"
          className="fixed bottom-[6.5rem] right-4 z-40 w-80 max-h-[70vh] flex flex-col rounded-lg backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300"
          style={{
            backgroundColor: `${colors.background}ee`,
            border: `1px solid ${colors.surfaceBorder}`,
            boxShadow: `0 0 30px ${colors.primaryGlow}30`,
          }}
        >
          <div className="p-3 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${colors.surfaceBorder}` }}>
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: colors.primary }} />
              <span
                className="text-xs font-display font-bold tracking-widest uppercase"
                style={{ color: colors.primary }}
              >
                AI Coach
              </span>
            </div>
            <div className="flex gap-1">
              {(["insights", "chat"] as const).map((tab) => (
                <button
                  key={tab}
                  data-testid={`tab-coach-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className="px-2.5 py-1 rounded text-[10px] uppercase tracking-wider font-bold transition-all"
                  style={{
                    backgroundColor: activeTab === tab ? `${colors.primary}25` : "transparent",
                    color: activeTab === tab ? colors.primary : colors.textMuted,
                    border: activeTab === tab ? `1px solid ${colors.primary}40` : "1px solid transparent",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {activeTab === "insights" ? (
              <div className="p-4 space-y-3">
                {isLoading && (
                  <div data-testid="text-coach-loading" className="text-center py-4 text-sm" style={{ color: colors.textMuted }}>
                    Analyzing your progress...
                  </div>
                )}

                {topMessage && (
                  <div
                    data-testid="card-coach-message"
                    className="rounded-md p-3"
                    style={{
                      backgroundColor: `${typeColors[topMessage.type]}15`,
                      borderLeft: `3px solid ${typeColors[topMessage.type]}`,
                    }}
                  >
                    <div
                      className="text-xs font-bold uppercase tracking-wider mb-1"
                      style={{ color: typeColors[topMessage.type] }}
                    >
                      {topMessage.title}
                    </div>
                    <div className="text-sm" style={{ color: colors.text }}>
                      {topMessage.message}
                    </div>
                  </div>
                )}

                {coachData?.nudge && (
                  <div data-testid="card-nudge" className="rounded-md p-3" style={{ backgroundColor: `${colors.primary}10`, border: `1px solid ${colors.surfaceBorder}` }}>
                    <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.primary }}>
                      Nudge
                    </div>
                    <div className="text-sm italic" style={{ color: colors.textMuted }}>
                      "{coachData.nudge}"
                    </div>
                  </div>
                )}

                {coachData?.habitSuggestions && coachData.habitSuggestions.length > 0 && (
                  <div data-testid="section-habit-suggestions">
                    <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: colors.textMuted }}>
                      Habit Insights
                    </div>
                    <div className="space-y-2">
                      {coachData.habitSuggestions.map((s) => (
                        <div
                          key={s.habitId}
                          data-testid={`card-habit-suggestion-${s.habitId}`}
                          className="rounded-md p-2 flex items-start gap-2"
                          style={{ backgroundColor: `${s.momentumTier?.color || colors.primary}08`, border: `1px solid ${colors.surfaceBorder}` }}
                        >
                          <Clock size={14} className="mt-0.5 shrink-0" style={{ color: s.momentumTier?.color || colors.primary }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold" style={{ color: colors.text }}>
                                {s.habitName}
                              </span>
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                                style={{
                                  backgroundColor: `${s.momentumTier?.color || "#666"}20`,
                                  color: s.momentumTier?.color || "#666",
                                }}
                              >
                                {s.momentumTier?.label || "—"}
                              </span>
                            </div>
                            <div className="text-xs" style={{ color: colors.textMuted }}>
                              {s.suggested} min · {s.reason}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div data-testid="section-emotional-checkin" className="rounded-md p-3" style={{ backgroundColor: `${colors.primary}08`, border: `1px solid ${colors.surfaceBorder}` }}>
                  <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: colors.textMuted }}>
                    How are you feeling?
                  </div>
                  <div className="flex justify-between gap-1">
                    {moodEmojis.map((mood) => (
                      <button
                        key={mood.value}
                        data-testid={`button-mood-${mood.value}`}
                        onClick={() => {
                          setSelectedMood(mood.value);
                          if (mood.value === "low" || mood.value === "okay") {
                            setActiveTab("chat");
                            setChatMessages(prev => [
                              ...prev,
                              { role: "user", text: `I'm feeling ${mood.label.toLowerCase()} today` },
                            ]);
                            chatMutation.mutate(`I'm feeling ${mood.label.toLowerCase()} today`);
                          }
                        }}
                        className="flex flex-col items-center gap-1 p-2 rounded-md transition-all"
                        style={{
                          backgroundColor: selectedMood === mood.value ? `${colors.primary}25` : "transparent",
                          border: selectedMood === mood.value ? `1px solid ${colors.primary}` : "1px solid transparent",
                        }}
                      >
                        <mood.icon size={18} style={{ color: selectedMood === mood.value ? colors.primary : colors.textMuted }} />
                        <span className="text-[9px]" style={{ color: colors.textMuted }}>{mood.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[200px] max-h-[40vh]">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-6">
                      <MessageCircle size={24} className="mx-auto mb-2" style={{ color: colors.textMuted }} />
                      <div className="text-xs" style={{ color: colors.textMuted }}>
                        Ask me anything about the app, your progress, habits, phases, or how to improve.
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1 justify-center">
                        {["How do phases work?", "What should I do today?", "I'm struggling"].map(q => (
                          <button
                            key={q}
                            data-testid={`button-starter-${q.slice(0, 10)}`}
                            onClick={() => handleSuggestionClick(q)}
                            className="text-[10px] px-2 py-1 rounded-full transition-all"
                            style={{
                              backgroundColor: `${colors.primary}15`,
                              color: colors.primary,
                              border: `1px solid ${colors.primary}30`,
                            }}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className="max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap"
                        data-testid={`chat-message-${i}`}
                        style={{
                          backgroundColor: msg.role === "user" ? `${colors.primary}20` : `${colors.surfaceBorder}40`,
                          color: colors.text,
                          borderBottomRightRadius: msg.role === "user" ? "2px" : undefined,
                          borderBottomLeftRadius: msg.role === "coach" ? "2px" : undefined,
                        }}
                      >
                        {msg.text}
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {msg.suggestions.map((s, j) => (
                              <button
                                key={j}
                                onClick={() => handleSuggestionClick(s)}
                                className="text-[10px] px-2 py-0.5 rounded-full transition-all"
                                style={{
                                  backgroundColor: `${colors.primary}15`,
                                  color: colors.primary,
                                  border: `1px solid ${colors.primary}30`,
                                }}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex justify-start">
                      <div
                        className="rounded-lg px-3 py-2 text-sm"
                        style={{ backgroundColor: `${colors.surfaceBorder}40`, color: colors.textMuted }}
                      >
                        Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>
            )}
          </div>

          {activeTab === "chat" && (
            <div className="p-2 shrink-0" style={{ borderTop: `1px solid ${colors.surfaceBorder}` }}>
              <div className="flex gap-2">
                <input
                  data-testid="input-coach-chat"
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent border rounded px-2 py-1.5 text-sm outline-none"
                  style={{
                    borderColor: colors.surfaceBorder,
                    color: colors.text,
                  }}
                />
                <button
                  data-testid="button-send-chat"
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || chatMutation.isPending}
                  className="w-8 h-8 rounded flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: chatInput.trim() ? colors.primary : `${colors.primary}30`,
                    color: colors.background,
                  }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
