import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { apiRequest } from "@/lib/queryClient";
import {
  Brain,
  Sparkles,
  Clock,
  Smile,
  Frown,
  Meh,
  Heart,
  Zap,
  Send,
  MessageCircle,
} from "lucide-react";

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

export default function CoachPage() {
  const { player } = useGame();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [activeTab, setActiveTab] = useState<"insights" | "chat">("insights");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
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
      setChatMessages((prev) => [
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
    setChatMessages((prev) => [...prev, { role: "user", text: msg }]);
    setChatInput("");
    chatMutation.mutate(msg);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setChatMessages((prev) => [...prev, { role: "user", text: suggestion }]);
    chatMutation.mutate(suggestion);
  };

  const sortedMessages = coachData?.messages?.sort((a, b) => b.priority - a.priority) ?? [];

  if (!player) return null;

  return (
    <SystemLayout>
      <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-5 h-5" style={{ color: colors.primary }} />
          <h1
            className="text-lg font-bold font-orbitron tracking-wide"
            style={{ color: colors.text }}
            data-testid="text-coach-title"
          >
            Coach
          </h1>
        </div>

        <div className="flex gap-2 mb-4">
          {(["insights", "chat"] as const).map((tab) => (
            <button
              key={tab}
              data-testid={`tab-coach-${tab}`}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all"
              style={{
                backgroundColor: activeTab === tab ? `${colors.primary}25` : `${colors.background}cc`,
                color: activeTab === tab ? colors.primary : colors.textMuted,
                border: `1px solid ${activeTab === tab ? colors.primary + "60" : colors.surfaceBorder}`,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "insights" ? (
          <div className="space-y-4">
            {isLoading && (
              <div
                data-testid="text-coach-loading"
                className="text-center py-8 text-sm"
                style={{ color: colors.textMuted }}
              >
                Analyzing your progress...
              </div>
            )}

            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: `${colors.background}cc`,
                border: `1px solid ${colors.surfaceBorder}`,
              }}
              data-testid="section-emotional-checkin"
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colors.textMuted }}>
                How are you feeling?
              </div>
              <div className="flex justify-between gap-2">
                {moodEmojis.map((mood) => (
                  <button
                    key={mood.value}
                    data-testid={`button-mood-${mood.value}`}
                    onClick={() => {
                      setSelectedMood(mood.value);
                      if (mood.value === "low" || mood.value === "okay") {
                        setActiveTab("chat");
                        setChatMessages((prev) => [
                          ...prev,
                          { role: "user", text: `I'm feeling ${mood.label.toLowerCase()} today` },
                        ]);
                        chatMutation.mutate(`I'm feeling ${mood.label.toLowerCase()} today`);
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all flex-1"
                    style={{
                      backgroundColor: selectedMood === mood.value ? `${colors.primary}25` : `${colors.primary}08`,
                      border: `1px solid ${selectedMood === mood.value ? colors.primary : colors.surfaceBorder}`,
                    }}
                  >
                    <mood.icon size={22} style={{ color: selectedMood === mood.value ? colors.primary : colors.textMuted }} />
                    <span className="text-[10px] font-bold" style={{ color: colors.textMuted }}>
                      {mood.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {sortedMessages.map((msg, i) => (
              <div
                key={i}
                data-testid={`card-coach-message-${i}`}
                className="rounded-lg p-4"
                style={{
                  backgroundColor: `${typeColors[msg.type]}10`,
                  borderLeft: `4px solid ${typeColors[msg.type]}`,
                  border: `1px solid ${colors.surfaceBorder}`,
                  borderLeftWidth: "4px",
                  borderLeftColor: typeColors[msg.type],
                }}
              >
                <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: typeColors[msg.type] }}>
                  {msg.title}
                </div>
                <div className="text-sm leading-relaxed" style={{ color: colors.text }}>
                  {msg.message}
                </div>
                {msg.action && (
                  <div className="mt-2 text-xs font-semibold" style={{ color: typeColors[msg.type] }}>
                    → {msg.action}
                  </div>
                )}
              </div>
            ))}

            {coachData?.nudge && (
              <div
                data-testid="card-nudge"
                className="rounded-lg p-4"
                style={{
                  backgroundColor: `${colors.primary}10`,
                  border: `1px solid ${colors.surfaceBorder}`,
                }}
              >
                <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: colors.primary }}>
                  <Sparkles size={12} className="inline mr-1" />
                  Nudge
                </div>
                <div className="text-sm italic" style={{ color: colors.textMuted }}>
                  "{coachData.nudge}"
                </div>
              </div>
            )}

            {coachData?.habitSuggestions && coachData.habitSuggestions.length > 0 && (
              <div
                data-testid="section-habit-suggestions"
                className="rounded-lg p-4"
                style={{
                  backgroundColor: `${colors.background}cc`,
                  border: `1px solid ${colors.surfaceBorder}`,
                }}
              >
                <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colors.textMuted }}>
                  Habit Insights
                </div>
                <div className="space-y-2">
                  {coachData.habitSuggestions.map((s) => (
                    <div
                      key={s.habitId}
                      data-testid={`card-habit-suggestion-${s.habitId}`}
                      className="rounded-lg p-3 flex items-start gap-3"
                      style={{
                        backgroundColor: `${s.momentumTier?.color || colors.primary}08`,
                        border: `1px solid ${colors.surfaceBorder}`,
                      }}
                    >
                      <Clock size={16} className="mt-0.5 shrink-0" style={{ color: s.momentumTier?.color || colors.primary }} />
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
                        <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                          {s.suggested} min · {s.reason}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className="rounded-lg flex flex-col"
            style={{
              backgroundColor: `${colors.background}cc`,
              border: `1px solid ${colors.surfaceBorder}`,
              minHeight: "60vh",
            }}
          >
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {chatMessages.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle size={32} className="mx-auto mb-3" style={{ color: colors.textMuted }} />
                  <div className="text-sm mb-1" style={{ color: colors.text }}>
                    Chat with your AI Coach
                  </div>
                  <div className="text-xs mb-4" style={{ color: colors.textMuted }}>
                    Ask about your progress, habits, phases, or how to improve.
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {["How do phases work?", "What should I do today?", "I'm struggling", "Give me a plan"].map((q) => (
                      <button
                        key={q}
                        data-testid={`button-starter-${q.slice(0, 10)}`}
                        onClick={() => handleSuggestionClick(q)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all"
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
                    className="max-w-[85%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap"
                    data-testid={`chat-message-${i}`}
                    style={{
                      backgroundColor: msg.role === "user" ? `${colors.primary}20` : `${colors.surfaceBorder}40`,
                      color: colors.text,
                      borderBottomRightRadius: msg.role === "user" ? "4px" : undefined,
                      borderBottomLeftRadius: msg.role === "coach" ? "4px" : undefined,
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
                    className="rounded-lg px-4 py-3 text-sm"
                    style={{ backgroundColor: `${colors.surfaceBorder}40`, color: colors.textMuted }}
                  >
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 shrink-0" style={{ borderTop: `1px solid ${colors.surfaceBorder}` }}>
              <div className="flex gap-2">
                <input
                  data-testid="input-coach-chat"
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent border rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    borderColor: colors.surfaceBorder,
                    color: colors.text,
                  }}
                />
                <button
                  data-testid="button-send-chat"
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || chatMutation.isPending}
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: chatInput.trim() ? colors.primary : `${colors.primary}30`,
                    color: colors.background,
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SystemLayout>
  );
}