import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Activity, Calendar, Zap, Flame, Target, Award, BarChart2 } from "lucide-react";

interface StatSnapshot {
  id: string;
  playerId: string;
  date: string;
  level: number;
  stats: {
    strength: number;
    agility: number;
    sense: number;
    vitality: number;
  };
  powerRating: number;
}

interface AnalyticsData {
  snapshots: StatSnapshot[];
  weeklyGrowth: {
    strength: number;
    agility: number;
    sense: number;
    vitality: number;
    power: number;
    level: number;
  };
  summary: {
    totalStats: number;
    currentPower: number;
    avgDailyGrowth: number;
    daysTracked: number;
  };
}

interface HabitStat {
  habitId: string;
  name: string;
  stat: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  momentum: number;
  currentDuration: number;
  baseDuration: number;
  completionsLast7: number;
  completionsLast14: number;
  completionsLast30: number;
  trend: "improving" | "declining" | "stable";
}

interface HabitAnalyticsData {
  habitStats: HabitStat[];
  badges: { id: string; badgeType: string; name: string; description: string; earnedAt: string }[];
  totalHabits: number;
}

const STAT_COLORS: Record<string, string> = {
  strength: "#ef4444",
  agility: "#22c55e",
  sense: "#3b82f6",
  vitality: "#a855f7",
  power: "#f59e0b",
};

function GrowthIndicator({ value, suffix = "%" }: { value: number; suffix?: string }) {
  if (value > 0) {
    return (
      <span className="flex items-center gap-1 text-emerald-400">
        <TrendingUp className="w-3 h-3" />
        +{value}{suffix}
      </span>
    );
  } else if (value < 0) {
    return (
      <span className="flex items-center gap-1 text-red-400">
        <TrendingDown className="w-3 h-3" />
        {value}{suffix}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-gray-500">
      <Minus className="w-3 h-3" />
      0{suffix}
    </span>
  );
}

export default function AnalyticsPage() {
  const { player } = useGame();

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/player", player?.id, "analytics"],
    queryFn: async () => {
      if (!player) throw new Error("No player");
      const res = await fetch(`/api/player/${player.id}/analytics`);
      return res.json();
    },
    enabled: !!player,
  });

  const { data: habitAnalytics } = useQuery<HabitAnalyticsData>({
    queryKey: ["/api/player", player?.id, "habit-analytics"],
    queryFn: async () => {
      if (!player) throw new Error("No player");
      const res = await fetch(`/api/player/${player.id}/habit-analytics`);
      return res.json();
    },
    enabled: !!player,
  });

  const chartData = analytics?.snapshots.map((s) => ({
    date: new Date(s.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    strength: s.stats.strength,
    agility: s.stats.agility,
    sense: s.stats.sense,
    vitality: s.stats.vitality,
    power: s.powerRating,
    level: s.level,
  })) || [];

  return (
    <SystemLayout>
      <div className="p-4 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-cyan-400" />
          <h1 className="text-xl font-bold text-white font-orbitron tracking-wide">
            WEEKLY EVOLUTION
          </h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading analytics...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4" data-testid="summary-power">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Power Rating</div>
                <div className="text-2xl font-bold text-amber-400 font-orbitron">
                  {analytics?.summary.currentPower || 0}
                </div>
                <div className="text-xs mt-1">
                  <GrowthIndicator value={analytics?.weeklyGrowth.power || 0} />
                </div>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4" data-testid="summary-stats">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Stats</div>
                <div className="text-2xl font-bold text-cyan-400 font-orbitron">
                  {Math.floor(analytics?.summary.totalStats || 0)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Combined</div>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4" data-testid="summary-daily">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Avg Daily
                </div>
                <div className="text-2xl font-bold text-emerald-400 font-orbitron">
                  +{analytics?.summary.avgDailyGrowth || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">Power/day</div>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4" data-testid="summary-days">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Days Tracked
                </div>
                <div className="text-2xl font-bold text-purple-400 font-orbitron">
                  {analytics?.summary.daysTracked || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">This week</div>
              </div>
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Stat Progression
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      axisLine={{ stroke: '#374151' }}
                      tickLine={{ stroke: '#374151' }}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      axisLine={{ stroke: '#374151' }}
                      tickLine={{ stroke: '#374151' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px' }}
                      iconType="line"
                    />
                    <Line
                      type="linear"
                      dataKey="strength"
                      stroke={STAT_COLORS.strength}
                      strokeWidth={2}
                      dot={{ r: 3, fill: STAT_COLORS.strength }}
                      connectNulls
                      name="STR"
                    />
                    <Line
                      type="linear"
                      dataKey="agility"
                      stroke={STAT_COLORS.agility}
                      strokeWidth={2}
                      dot={{ r: 3, fill: STAT_COLORS.agility }}
                      connectNulls
                      name="AGI"
                    />
                    <Line
                      type="linear"
                      dataKey="sense"
                      stroke={STAT_COLORS.sense}
                      strokeWidth={2}
                      dot={{ r: 3, fill: STAT_COLORS.sense }}
                      connectNulls
                      name="SEN"
                    />
                    <Line
                      type="linear"
                      dataKey="vitality"
                      stroke={STAT_COLORS.vitality}
                      strokeWidth={2}
                      dot={{ r: 3, fill: STAT_COLORS.vitality }}
                      connectNulls
                      name="VIT"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Power Rating Trend
              </h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      axisLine={{ stroke: '#374151' }}
                      tickLine={{ stroke: '#374151' }}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      axisLine={{ stroke: '#374151' }}
                      tickLine={{ stroke: '#374151' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <Line
                      type="linear"
                      dataKey="power"
                      stroke={STAT_COLORS.power}
                      strokeWidth={2}
                      dot={{ r: 4, fill: STAT_COLORS.power }}
                      connectNulls
                      name="Power"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Weekly Growth Rates
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col" data-testid="growth-strength">
                  <span className="text-xs text-gray-500 uppercase">Strength</span>
                  <span className="text-lg font-bold" style={{ color: STAT_COLORS.strength }}>
                    <GrowthIndicator value={analytics?.weeklyGrowth.strength || 0} />
                  </span>
                </div>
                <div className="flex flex-col" data-testid="growth-agility">
                  <span className="text-xs text-gray-500 uppercase">Agility</span>
                  <span className="text-lg font-bold" style={{ color: STAT_COLORS.agility }}>
                    <GrowthIndicator value={analytics?.weeklyGrowth.agility || 0} />
                  </span>
                </div>
                <div className="flex flex-col" data-testid="growth-sense">
                  <span className="text-xs text-gray-500 uppercase">Sense</span>
                  <span className="text-lg font-bold" style={{ color: STAT_COLORS.sense }}>
                    <GrowthIndicator value={analytics?.weeklyGrowth.sense || 0} />
                  </span>
                </div>
                <div className="flex flex-col" data-testid="growth-vitality">
                  <span className="text-xs text-gray-500 uppercase">Vitality</span>
                  <span className="text-lg font-bold" style={{ color: STAT_COLORS.vitality }}>
                    <GrowthIndicator value={analytics?.weeklyGrowth.vitality || 0} />
                  </span>
                </div>
              </div>

              {analytics?.weeklyGrowth.level !== undefined && analytics.weeklyGrowth.level > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800" data-testid="growth-level">
                  <span className="text-xs text-gray-500 uppercase">Level Progress</span>
                  <div className="text-lg font-bold text-cyan-400">
                    +{analytics.weeklyGrowth.level} levels this week
                  </div>
                </div>
              )}
            </div>

            {habitAnalytics && habitAnalytics.habitStats.length > 0 && (
              <>
                <div className="flex items-center gap-3 mt-8 mb-4">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white font-orbitron tracking-wide">
                    HABIT ANALYTICS
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4" data-testid="habit-total">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Active Habits</div>
                    <div className="text-2xl font-bold text-cyan-400 font-orbitron">
                      {habitAnalytics.totalHabits}
                    </div>
                  </div>
                  <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4" data-testid="habit-badges">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Award className="w-3 h-3" /> Badges
                    </div>
                    <div className="text-2xl font-bold text-amber-400 font-orbitron">
                      {habitAnalytics.badges.length}
                    </div>
                  </div>
                  <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4" data-testid="habit-best-streak">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Best Streak
                    </div>
                    <div className="text-2xl font-bold text-orange-400 font-orbitron">
                      {Math.max(0, ...habitAnalytics.habitStats.map(h => h.longestStreak))}d
                    </div>
                  </div>
                  <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4" data-testid="habit-completions-30">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <BarChart2 className="w-3 h-3" /> 30-Day Total
                    </div>
                    <div className="text-2xl font-bold text-emerald-400 font-orbitron">
                      {habitAnalytics.habitStats.reduce((s, h) => s + h.completionsLast30, 0)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {habitAnalytics.habitStats.map((h) => (
                    <div
                      key={h.habitId}
                      className="bg-gray-900/60 border border-gray-800 rounded-lg p-4"
                      data-testid={`habit-stat-${h.habitId}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: STAT_COLORS[h.stat] || "#888" }}
                          />
                          <span className="font-semibold text-white text-sm">{h.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 uppercase">
                            {h.stat}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {h.trend === "improving" && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                          {h.trend === "declining" && <TrendingDown className="w-4 h-4 text-red-400" />}
                          {h.trend === "stable" && <Minus className="w-4 h-4 text-gray-500" />}
                          <span className={`text-xs ${
                            h.trend === "improving" ? "text-emerald-400" :
                            h.trend === "declining" ? "text-red-400" : "text-gray-500"
                          }`}>
                            {h.trend}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <div className="text-xs text-gray-500">Streak</div>
                          <div className="text-sm font-bold text-orange-400 flex items-center justify-center gap-1">
                            {h.currentStreak > 0 && <Flame className="w-3 h-3" />}
                            {h.currentStreak}d
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">7 Day</div>
                          <div className="text-sm font-bold text-cyan-400">{h.completionsLast7}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">14 Day</div>
                          <div className="text-sm font-bold text-blue-400">{h.completionsLast14}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">30 Day</div>
                          <div className="text-sm font-bold text-purple-400">{h.completionsLast30}</div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Momentum</span>
                          <span>{Math.round(h.momentum * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.round(h.momentum * 100)}%`,
                              backgroundColor: h.momentum > 0.7 ? "#22c55e" : h.momentum > 0.3 ? "#f59e0b" : "#ef4444",
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>Duration: {h.currentDuration}min (base: {h.baseDuration}min)</span>
                        <span>Best: {h.longestStreak}d | Total: {h.totalCompletions}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {habitAnalytics.badges.length > 0 && (
                  <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" /> Earned Badges
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {habitAnalytics.badges.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg border border-amber-900/30"
                          data-testid={`badge-${b.badgeType}`}
                        >
                          <Award className="w-5 h-5 text-amber-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-amber-300 truncate">{b.name}</div>
                            <div className="text-[10px] text-gray-500 truncate">{b.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </SystemLayout>
  );
}
