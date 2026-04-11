import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageStageContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { apiRequest } from "@/lib/queryClient";
import {
  Brain,
  Sparkles,
  Smile,
  Frown,
  Meh,
  Heart,
  Zap,
  Send,
  MessageCircle,
  TrendingUp,
  Shield,
  ShieldOff,
  ChevronRight,
  Lock,
  RotateCcw,
} from "lucide-react";

interface CoachMessage {
  type: string;
  title: string;
  message: string;
  priority: number;
  actionable?: boolean;
  action?: string;
}

interface CoachData {
  messages: CoachMessage[];
  nudge: string;
  habitSuggestions: unknown[];
}

interface ChatMessage {
  role: "user" | "coach";
  text: string;
  suggestions?: string[];
}

const TYPE_COLORS: Record<string, string> = {
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

const MOOD_OPTIONS = [
  { icon: Zap, label: "Energized", value: "energized", color: "#22c55e" },
  { icon: Smile, label: "Good", value: "happy", color: "#06b6d4" },
  { icon: Meh, label: "Okay", value: "okay", color: "#f59e0b" },
  { icon: Frown, label: "Low", value: "low", color: "#ef4444" },
  { icon: Heart, label: "Grateful", value: "grateful", color: "#a855f7" },
];

const QUICK_QUESTIONS = [
  { label: "What should I do today?", icon: Sparkles, color: "#22d3ee" },
  { label: "Help me build a new habit", icon: Shield, color: "#22c55e" },
  { label: "I want to break a bad habit", icon: ShieldOff, color: "#ef4444" },
  { label: "I'm struggling to stay consistent", icon: TrendingUp, color: "#f59e0b" },
  { label: "How does the habit loop work?", icon: Brain, color: "#a855f7" },
  { label: "I need motivation", icon: Zap, color: "#f97316" },
];

const WELCOME_MESSAGE: ChatMessage = {
  role: "coach",
  text: "I'm your Ascend Coach. I track your habits, patterns, and growth — and I'm here to guide you forward. What's on your mind?",
  suggestions: [
    "What should I do today?",
    "Help me build a new habit",
    "I'm struggling",
  ],
};

export default function CoachPage() {
  const { player } = useGame();
  const { theme } = useTheme();
  const colors = theme.colors;
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<"chat" | "insights">("chat");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  if (!player) return null;

  const { data: coachData, isLoading } = useQuery<CoachData>({
    queryKey: ["/api/player", player.id, "coach"],
    queryFn: () =>
      apiRequest("GET", `/api/player/${player.id}/coach`).then((r) => r.json()),
  });

  const chatMutation = useMutation<
    { response: string; suggestions?: string[]; coachTone?: string; stabilityState?: string },
    Error,
    string
  >({
    mutationFn: (message: string) =>
      apiRequest("POST", `/api/player/${player.id}/coach/chat`, { message }).then((r) =>
        r.json()
      ),
    onSuccess: (data, message) => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "coach",
          text: data.response || "I'm here with you. Keep going.",
          suggestions: data.suggestions,
        },
      ]);
    },
    onError: () => {
      setChatMessages((prev) => [
        ...prev,
        { role: "coach", text: "Something shifted. Try again in a moment." },
      ]);
    },
  });

  function sendMessage(text: string) {
    if (!text.trim() || chatMutation.isPending) return;
    setChatMessages((prev) => [...prev, { role: "user", text: text.trim() }]);
    chatMutation.mutate(text.trim());
    setInputText("");
  }

  function handleMoodSelect(mood: typeof MOOD_OPTIONS[number]) {
    setSelectedMood(mood.value);
    sendMessage(`I'm feeling ${mood.label.toLowerCase()} today`);
  }

  function resetChat() {
    setChatMessages([WELCOME_MESSAGE]);
    setSelectedMood(null);
  }

  const sortedMessages = (coachData?.messages ?? []).sort((a, b) => b.priority - a.priority);

  return (
    <SystemLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header + Tabs */}
        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1
                className="text-lg font-bold text-white"
                style={{ fontFamily: "'Orbitron', monospace" }}
                data-testid="text-coach-title"
              >
                {t("Coach")}
              </h1>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Your AI growth partner
              </p>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-700"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Brain className="w-4 h-4" style={{ color: colors.primary }} />
            </div>
          </div>

          <div className="flex rounded-lg overflow-hidden border border-gray-800">
            <button
              onClick={() => setActiveTab("chat")}
              className="flex-1 py-2 text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: activeTab === "chat" ? `${colors.primary}20` : "transparent",
                color: activeTab === "chat" ? colors.primary : "#6b7280",
                borderRight: "1px solid #1f2937",
              }}
              data-testid="tab-coach-chat"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className="flex-1 py-2 text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: activeTab === "insights" ? `${colors.primary}20` : "transparent",
                color: activeTab === "insights" ? colors.primary : "#6b7280",
              }}
              data-testid="tab-coach-insights"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Insights
            </button>
          </div>
        </div>

        {/* ── CHAT TAB ── */}
        {activeTab === "chat" && (
          <>
            {/* Message area */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 min-h-0">
              {/* Mood row — shown only if no mood selected yet */}
              {!selectedMood && chatMessages.length <= 1 && (
                <div
                  className="rounded-lg p-3 border border-gray-800"
                  style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
                  data-testid="section-mood-check"
                >
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
                    How are you feeling right now?
                  </p>
                  <div className="flex gap-1.5">
                    {MOOD_OPTIONS.map((mood) => (
                      <button
                        key={mood.value}
                        onClick={() => handleMoodSelect(mood)}
                        className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors"
                        style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                        data-testid={`button-mood-${mood.value}`}
                      >
                        <mood.icon className="w-4 h-4" style={{ color: mood.color }} />
                        <span className="text-[9px] text-gray-500">{mood.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick questions — shown initially */}
              {chatMessages.length <= 1 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold mb-2">
                    Quick questions
                  </p>
                  <div className="space-y-1.5">
                    {QUICK_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q.label)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors text-left"
                        style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                        data-testid={`button-quick-q-${i}`}
                      >
                        <q.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: q.color }} />
                        <span className="text-[12px] text-gray-300">{q.label}</span>
                        <ChevronRight className="w-3 h-3 text-gray-600 ml-auto flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat messages */}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`chat-message-${i}`}
                >
                  {msg.role === "coach" && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-2"
                      style={{ backgroundColor: `${colors.primary}20`, border: `1px solid ${colors.primary}40` }}
                    >
                      <Brain className="w-3 h-3" style={{ color: colors.primary }} />
                    </div>
                  )}
                  <div className="max-w-[82%]">
                    <div
                      className="rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed"
                      style={
                        msg.role === "user"
                          ? { backgroundColor: `${colors.primary}25`, color: "#ffffff" }
                          : { backgroundColor: "rgba(255,255,255,0.06)", color: "#e5e7eb", border: "1px solid rgba(255,255,255,0.08)" }
                      }
                    >
                      {msg.text}
                    </div>
                    {/* Suggestion chips */}
                    {msg.role === "coach" && msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.suggestions.map((s, j) => (
                          <button
                            key={j}
                            onClick={() => sendMessage(s)}
                            className="text-[11px] px-2.5 py-1 rounded-full border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                            style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                            data-testid={`suggestion-chip-${i}-${j}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {chatMutation.isPending && (
                <div className="flex justify-start items-center gap-2" data-testid="coach-typing">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${colors.primary}20`, border: `1px solid ${colors.primary}40` }}
                  >
                    <Brain className="w-3 h-3" style={{ color: colors.primary }} />
                  </div>
                  <div
                    className="rounded-2xl px-3.5 py-2.5 flex gap-1"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {[0, 1, 2].map((j) => (
                      <span
                        key={j}
                        className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
                        style={{ animationDelay: `${j * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div
              className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-gray-800"
              style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={resetChat}
                  className="w-8 h-9 flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0"
                  title="New conversation"
                  data-testid="button-reset-chat"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(inputText);
                    }
                  }}
                  placeholder="Ask your coach anything..."
                  className="flex-1 h-9 bg-gray-900 border border-gray-700 rounded-full px-4 text-[13px] text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
                  data-testid="input-coach-message"
                />
                <button
                  onClick={() => sendMessage(inputText)}
                  disabled={!inputText.trim() || chatMutation.isPending}
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    backgroundColor: inputText.trim() ? colors.primary : "rgba(255,255,255,0.05)",
                    opacity: !inputText.trim() || chatMutation.isPending ? 0.5 : 1,
                  }}
                  data-testid="button-send-message"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── INSIGHTS TAB ── */}
        {activeTab === "insights" && (
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 pb-6">
            {isLoading && (
              <div className="text-center py-8 text-sm text-gray-500" data-testid="text-insights-loading">
                Analyzing your progress...
              </div>
            )}

            {/* Coach nudge */}
            {coachData?.nudge && (
              <div
                className="rounded-lg p-3 border"
                style={{
                  borderColor: `${colors.primary}30`,
                  backgroundColor: `${colors.primary}08`,
                }}
                data-testid="card-coach-nudge"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: colors.primary }} />
                  <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: colors.primary }}>
                    Today's Focus
                  </span>
                </div>
                <p className="text-[13px] text-gray-300 italic leading-relaxed">
                  "{coachData.nudge}"
                </p>
              </div>
            )}

            {/* Coach messages */}
            {sortedMessages.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-600 text-sm">
                No insights yet. Complete some habits to unlock them.
              </div>
            )}

            {sortedMessages.map((msg, i) => {
              const color = TYPE_COLORS[msg.type] ?? colors.primary;
              return (
                <div
                  key={i}
                  className="rounded-lg p-3 border"
                  style={{
                    borderColor: `${color}30`,
                    borderLeftWidth: "3px",
                    borderLeftColor: color,
                    backgroundColor: `${color}06`,
                  }}
                  data-testid={`insight-card-${i}`}
                >
                  <div
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color }}
                  >
                    {msg.title}
                  </div>
                  <p className="text-[13px] text-gray-300 leading-relaxed">{msg.message}</p>
                  {msg.action && (
                    <div className="mt-2 flex items-center gap-1" style={{ color }}>
                      <ChevronRight className="w-3 h-3" />
                      <span className="text-[11px] font-semibold">{msg.action}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Habit coaching guidance */}
            <div
              className="rounded-lg p-3 border border-gray-800"
              style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
              data-testid="card-habit-guidance"
            >
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400">
                  Habit Loop Science
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] text-gray-500">
                <div className="flex gap-2">
                  <span className="text-cyan-600 font-bold w-16 flex-shrink-0">Cue</span>
                  <span>The trigger that starts the behavior</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-purple-500 font-bold w-16 flex-shrink-0">Craving</span>
                  <span>The motivation or desire behind it</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-green-500 font-bold w-16 flex-shrink-0">Response</span>
                  <span>The habit or behavior itself</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-500 font-bold w-16 flex-shrink-0">Reward</span>
                  <span>The benefit that reinforces it</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTab("chat");
                  sendMessage("Explain how to use the habit loop to build better habits");
                }}
                className="mt-2.5 text-[11px] text-cyan-500 hover:text-cyan-300 transition-colors"
                data-testid="button-learn-habit-loop"
              >
                → Ask coach to explain →
              </button>
            </div>

            {/* Bad habit section */}
            <div
              className="rounded-lg p-3 border border-red-900/30"
              style={{ backgroundColor: "rgba(127,29,29,0.08)" }}
              data-testid="card-bad-habit-guidance"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldOff className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-red-400">
                  Breaking Bad Habits
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                Bad habits can't be erased — they need to be replaced. Identify the cue and craving, then swap the routine with something healthier.
              </p>
              <button
                onClick={() => {
                  setActiveTab("chat");
                  sendMessage("I want to break a bad habit. How do I start?");
                }}
                className="text-[11px] text-red-500 hover:text-red-300 transition-colors"
                data-testid="button-chat-bad-habit"
              >
                → Get personalized guidance →
              </button>
            </div>
          </div>
        )}
      </div>
    </SystemLayout>
  );
}
