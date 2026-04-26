import React, { useEffect, useMemo, useState } from "react";
import { Coffee, Wine, Moon } from "lucide-react";
import {
  getState as getFlowState,
  subscribeVitalityFlow,
  todayIso,
  type DailyFlowRecord,
  type DreamRecall,
} from "@/lib/vitalityFlowStore";

interface SleepRemTrendChartProps {
  /** How many trailing nights to plot. Defaults to 14. */
  days?: number;
  /** Surface color for the legend chips. */
  textMutedColor?: string;
}

interface NightPoint {
  date: string;
  dayLabel: string;
  weekday: string;
  recall: DreamRecall | null;
  bedDeltaMin: number | null;
  hadAlcohol: boolean;
  hadLateCaffeine: boolean;
  caffeineHoursAgo: number | null;
}

const RECALL_TONE: Record<DreamRecall, string> = {
  vivid: "#22d3ee",
  faint: "#a78bfa",
  none: "#6b7280",
};

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildNights(days: number): NightPoint[] {
  const state = getFlowState();
  const out: NightPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = todayIso(d);
    const rec: DailyFlowRecord | undefined = state.history[key];
    const hadLateCaffeine =
      typeof rec?.caffeineHoursAgo === "number" && rec.caffeineHoursAgo < 6;
    const bedDeltaMin =
      rec?.bedTime && rec?.targetBedTime
        ? Math.round((rec.bedTime - rec.targetBedTime) / 60_000)
        : null;
    out.push({
      date: key,
      dayLabel: String(d.getDate()),
      weekday: WEEKDAY[d.getDay()],
      recall: (rec?.dreamRecall ?? null) as DreamRecall | null,
      bedDeltaMin,
      hadAlcohol: !!rec?.hadAlcohol,
      hadLateCaffeine,
      caffeineHoursAgo: typeof rec?.caffeineHoursAgo === "number" ? rec.caffeineHoursAgo : null,
    });
  }
  return out;
}

function deltaTone(v: number): string {
  if (v > 30) return "#fbbf24";
  if (v < -10) return "#22d3ee";
  return "#a5b4fc";
}

function formatDelta(v: number | null): string {
  if (v === null) return "—";
  if (v > 0) return `+${v}m`;
  return `${v}m`;
}

export function SleepRemTrendChart({
  days = 14,
  textMutedColor = "rgba(255,255,255,0.55)",
}: SleepRemTrendChartProps) {
  // Bump on any vitality-flow change so the chart re-reads localStorage live
  // when the user (or another flow component) logs/edits sleep data.
  const [version, setVersion] = useState(0);
  useEffect(() => {
    return subscribeVitalityFlow(() => setVersion((v) => v + 1));
  }, []);

  const nights = useMemo(() => buildNights(days), [days, version]);

  const hasAnyData = nights.some(
    (n) => n.recall !== null || n.bedDeltaMin !== null || n.hadAlcohol || n.hadLateCaffeine,
  );

  const yScale = useMemo(() => {
    const maxAbs = nights.reduce((m, n) => {
      if (n.bedDeltaMin === null) return m;
      return Math.max(m, Math.abs(n.bedDeltaMin));
    }, 0);
    // Always show at least ±60m so light deltas don't look artificially extreme.
    const stepped = Math.max(60, Math.ceil(maxAbs / 30) * 30);
    return stepped;
  }, [nights]);

  // Layout (SVG viewBox so the chart scales to its container).
  const VB_W = 320;
  const VB_H = 220;
  const PAD_LEFT = 30;
  const PAD_RIGHT = 10;
  const RECALL_ROW_Y = 16;          // recall dots above the chart
  const CHART_TOP = 36;
  const CHART_BOTTOM = 156;         // chart line area
  const MARKER_ROW_Y = 178;          // caffeine + alcohol markers
  const LABEL_ROW_Y = 200;           // day numbers
  const WEEKDAY_ROW_Y = 213;         // tiny weekday letters

  const innerW = VB_W - PAD_LEFT - PAD_RIGHT;
  const colW = innerW / nights.length;
  const xFor = (i: number) => PAD_LEFT + (i + 0.5) * colW;

  const chartH = CHART_BOTTOM - CHART_TOP;
  const chartMidY = CHART_TOP + chartH / 2;
  const yFor = (delta: number) => chartMidY - (delta / yScale) * (chartH / 2);

  // Build delta line as polyline through points that have data (skip gaps).
  const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  let prev: { x: number; y: number } | null = null;
  nights.forEach((n, i) => {
    if (n.bedDeltaMin === null) {
      prev = null;
      return;
    }
    const point = { x: xFor(i), y: yFor(n.bedDeltaMin) };
    if (prev) {
      segments.push({ x1: prev.x, y1: prev.y, x2: point.x, y2: point.y });
    }
    prev = point;
  });

  return (
    <div className="w-full" data-testid="sleep-rem-trend-chart">
      {!hasAnyData && (
        <div
          className="w-full text-center py-10 text-[11px]"
          style={{ color: textMutedColor }}
          data-testid="trend-empty-state"
        >
          <Moon size={18} className="mx-auto mb-2" style={{ opacity: 0.5 }} />
          No sleep logs yet. Run a Wake Flow tomorrow morning to start the trend.
        </div>
      )}

      {hasAnyData && (
        <>
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="w-full h-auto"
            role="img"
            aria-label="Last days sleep and dream-recall trend"
          >
            {/* Y axis grid: 0 line + ±yScale ticks */}
            <line
              x1={PAD_LEFT}
              x2={VB_W - PAD_RIGHT}
              y1={chartMidY}
              y2={chartMidY}
              stroke="rgba(255,255,255,0.18)"
              strokeDasharray="3 3"
            />
            <line
              x1={PAD_LEFT}
              x2={VB_W - PAD_RIGHT}
              y1={CHART_TOP}
              y2={CHART_TOP}
              stroke="rgba(255,255,255,0.06)"
            />
            <line
              x1={PAD_LEFT}
              x2={VB_W - PAD_RIGHT}
              y1={CHART_BOTTOM}
              y2={CHART_BOTTOM}
              stroke="rgba(255,255,255,0.06)"
            />

            {/* Y labels (late top, target middle, early bottom) */}
            <text
              x={PAD_LEFT - 4}
              y={CHART_TOP + 3}
              fontSize="7"
              textAnchor="end"
              fill="#fbbf24"
              opacity="0.85"
            >
              +{yScale}m
            </text>
            <text
              x={PAD_LEFT - 4}
              y={chartMidY + 2.5}
              fontSize="7"
              textAnchor="end"
              fill="rgba(255,255,255,0.55)"
            >
              target
            </text>
            <text
              x={PAD_LEFT - 4}
              y={CHART_BOTTOM + 3}
              fontSize="7"
              textAnchor="end"
              fill="#22d3ee"
              opacity="0.85"
            >
              −{yScale}m
            </text>

            {/* Vertical column hairlines (very faint, helps eye-line dots → line) */}
            {nights.map((_, i) => (
              <line
                key={`col-${i}`}
                x1={xFor(i)}
                x2={xFor(i)}
                y1={RECALL_ROW_Y + 6}
                y2={MARKER_ROW_Y - 4}
                stroke="rgba(255,255,255,0.04)"
              />
            ))}

            {/* Bedtime delta line */}
            {segments.map((s, i) => (
              <line
                key={`seg-${i}`}
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                stroke="#a5b4fc"
                strokeWidth="1.4"
                strokeOpacity="0.75"
                strokeLinecap="round"
              />
            ))}

            {/* Bedtime delta points + recall dots + markers */}
            {nights.map((n, i) => {
              const cx = xFor(i);
              const isToday = n.date === todayIso();
              return (
                <g key={n.date} data-testid={`night-${n.date}`}>
                  {/* Recall dot row (top) */}
                  {n.recall ? (
                    <circle
                      cx={cx}
                      cy={RECALL_ROW_Y}
                      r={4}
                      fill={RECALL_TONE[n.recall]}
                      data-testid={`recall-dot-${n.date}`}
                    >
                      <title>{`${n.date} · recall: ${n.recall}`}</title>
                    </circle>
                  ) : (
                    <circle
                      cx={cx}
                      cy={RECALL_ROW_Y}
                      r={3}
                      fill="none"
                      stroke="rgba(255,255,255,0.18)"
                      strokeDasharray="1.5 1.5"
                      data-testid={`recall-dot-${n.date}`}
                    >
                      <title>{`${n.date} · no recall logged`}</title>
                    </circle>
                  )}

                  {/* Bedtime delta point */}
                  {n.bedDeltaMin !== null && (
                    <circle
                      cx={cx}
                      cy={yFor(n.bedDeltaMin)}
                      r={2.6}
                      fill={deltaTone(n.bedDeltaMin)}
                      data-testid={`bed-delta-${n.date}`}
                    >
                      <title>{`${n.date} · bedtime ${formatDelta(n.bedDeltaMin)} vs target`}</title>
                    </circle>
                  )}

                  {/* Caffeine marker (left of column center) */}
                  {n.hadLateCaffeine && (
                    <g
                      transform={`translate(${cx - 6}, ${MARKER_ROW_Y - 5})`}
                      data-testid={`caffeine-marker-${n.date}`}
                    >
                      <rect
                        width="10"
                        height="10"
                        rx="2"
                        fill="rgba(251, 191, 36, 0.18)"
                        stroke="#fbbf24"
                        strokeOpacity="0.6"
                        strokeWidth="0.6"
                      />
                      <text
                        x="5"
                        y="7.5"
                        fontSize="7"
                        textAnchor="middle"
                        fill="#fbbf24"
                        fontWeight="700"
                      >
                        C
                      </text>
                      <title>{`${n.date} · caffeine ${
                        n.caffeineHoursAgo !== null ? `${n.caffeineHoursAgo}h before bed` : "within 6h"
                      }`}</title>
                    </g>
                  )}

                  {/* Alcohol marker (right of column center) */}
                  {n.hadAlcohol && (
                    <g
                      transform={`translate(${cx - 5}, ${MARKER_ROW_Y + 6})`}
                      data-testid={`alcohol-marker-${n.date}`}
                    >
                      <rect
                        width="10"
                        height="10"
                        rx="2"
                        fill="rgba(244, 114, 182, 0.18)"
                        stroke="#f472b6"
                        strokeOpacity="0.6"
                        strokeWidth="0.6"
                      />
                      <text
                        x="5"
                        y="7.5"
                        fontSize="7"
                        textAnchor="middle"
                        fill="#f472b6"
                        fontWeight="700"
                      >
                        A
                      </text>
                      <title>{`${n.date} · alcohol logged`}</title>
                    </g>
                  )}

                  {/* Day-of-month label */}
                  <text
                    x={cx}
                    y={LABEL_ROW_Y}
                    fontSize="7.5"
                    textAnchor="middle"
                    fill={isToday ? "#a78bfa" : "rgba(255,255,255,0.7)"}
                    fontWeight={isToday ? "700" : "400"}
                  >
                    {n.dayLabel}
                  </text>
                  <text
                    x={cx}
                    y={WEEKDAY_ROW_Y}
                    fontSize="6"
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.35)"
                  >
                    {n.weekday[0]}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div
            className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px]"
            style={{ color: textMutedColor }}
            data-testid="trend-legend"
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: RECALL_TONE.vivid }} />
              Vivid
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: RECALL_TONE.faint }} />
              Faint
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: RECALL_TONE.none }} />
              Blank
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-[2px] rounded"
                style={{ backgroundColor: "#a5b4fc" }}
              />
              Bedtime Δ
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Coffee size={10} style={{ color: "#fbbf24" }} />
              Late caffeine
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wine size={10} style={{ color: "#f472b6" }} />
              Alcohol
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default SleepRemTrendChart;
