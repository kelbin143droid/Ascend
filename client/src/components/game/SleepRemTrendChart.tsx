import React, { useEffect, useMemo, useState } from "react";
import { Coffee, Wine, Moon, X } from "lucide-react";
import {
  getState as getFlowState,
  setCaffeineHoursAgoForDate,
  setDreamRecallForDate,
  setHadAlcoholForDate,
  setSleepQualityForDate,
  subscribeVitalityFlow,
  todayIso,
  type DailyFlowRecord,
  type DreamRecall,
} from "@/lib/vitalityFlowStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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

  // Tap-to-edit: which night column the user opened for back-fill / fix.
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const editingNight = useMemo(
    () => (editingDate ? nights.find((n) => n.date === editingDate) ?? null : null),
    [editingDate, nights],
  );

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
          className="w-full text-center pb-3 text-[11px]"
          style={{ color: textMutedColor }}
          data-testid="trend-empty-state"
        >
          <Moon size={16} className="mx-auto mb-1.5" style={{ opacity: 0.5 }} />
          No sleep logs yet — tap any night below to back-fill recall, caffeine, or alcohol.
        </div>
      )}

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
        const colLeft = cx - colW / 2;
        const tapTop = RECALL_ROW_Y - 8;
        const tapHeight = WEEKDAY_ROW_Y + 4 - tapTop;
        const isHighlighted = editingDate === n.date;
        return (
          <g key={n.date} data-testid={`night-${n.date}`}>
            {/* Highlight ring while this column is being edited */}
            {isHighlighted && (
              <rect
                x={colLeft + 0.5}
                y={tapTop}
                width={colW - 1}
                height={tapHeight}
                rx={3}
                fill="rgba(167, 139, 250, 0.10)"
                stroke="rgba(167, 139, 250, 0.55)"
                strokeWidth="0.7"
              />
            )}
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

            {/* Tap target — sits on top so the entire column is clickable. */}
            <rect
              x={colLeft}
              y={tapTop}
              width={colW}
              height={tapHeight}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onClick={() => setEditingDate(n.date)}
              data-testid={`night-tap-${n.date}`}
            >
              <title>{`Tap to edit ${n.date}`}</title>
            </rect>
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

<NightEditorDialog
  night={editingNight}
        open={!!editingDate}
        onClose={() => setEditingDate(null)}
      />
    </div>
  );
}

/* ─────────────── Tap-to-edit dialog ─────────────── */

interface NightEditorDialogProps {
  night: NightPoint | null;
  open: boolean;
  onClose: () => void;
}

const RECALL_OPTIONS: { value: DreamRecall; label: string }[] = [
  { value: "none", label: "None" },
  { value: "faint", label: "Faint" },
  { value: "vivid", label: "Vivid" },
];

function formatPrettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map((s) => Number(s));
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function NightEditorDialog({ night, open, onClose }: NightEditorDialogProps) {
  // Local caffeine-input string buffer so users can type "3.5" without each
  // keystroke immediately writing back. We commit on blur or Enter.
  const [caffeineInput, setCaffeineInput] = useState<string>("");

  // Re-seed the local buffer whenever the dialog opens for a new night
  // (or the underlying value changes via another tab / store write).
  useEffect(() => {
    if (!night) return;
    setCaffeineInput(
      night.caffeineHoursAgo === null ? "" : String(night.caffeineHoursAgo),
    );
  }, [night?.date, night?.caffeineHoursAgo]);

  if (!night) return null;

  const date = night.date;

  // Read the latest record so the dialog reflects writes made by this very
  // dialog (the parent's `nights` array refreshes via subscribeVitalityFlow,
  // then re-passes the fresh `night` prop on the next render).
  const currentRecall = night.recall;
  const flowRec: DailyFlowRecord | undefined = getFlowState().history[date];
  const currentQuality =
    typeof flowRec?.sleepQuality === "number" ? flowRec.sleepQuality : null;
  const currentAlcohol = night.hadAlcohol;
  const alcoholExplicit = typeof flowRec?.hadAlcohol === "boolean";

  const commitCaffeine = () => {
    const trimmed = caffeineInput.trim();
    if (trimmed === "") {
      setCaffeineHoursAgoForDate(date, null);
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed) && parsed >= 0) {
      setCaffeineHoursAgoForDate(date, parsed);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-black/95 border-white/10 max-w-sm"
        data-testid={`dialog-edit-night-${date}`}
      >
        <DialogHeader>
          <DialogTitle
            className="font-display text-sm flex items-center gap-2"
            style={{ color: "#a78bfa" }}
          >
            <Moon size={13} />
            EDIT NIGHT · {formatPrettyDate(date).toUpperCase()}
          </DialogTitle>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            Back-fill or correct what you logged for this night. Saves immediately.
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Dream recall */}
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
              Dream recall
            </div>
            <div className="flex flex-wrap gap-1.5">
              {RECALL_OPTIONS.map((opt) => {
                const active = currentRecall === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDreamRecallForDate(date, opt.value)}
                    data-testid={`button-recall-${opt.value}-${date}`}
                    className="px-2.5 py-1 rounded text-[11px] border transition-colors"
                    style={{
                      backgroundColor: active ? `${RECALL_TONE[opt.value]}33` : "rgba(255,255,255,0.04)",
                      borderColor: active ? RECALL_TONE[opt.value] : "rgba(255,255,255,0.12)",
                      color: active ? RECALL_TONE[opt.value] : "rgba(255,255,255,0.75)",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setDreamRecallForDate(date, null)}
                disabled={currentRecall === null}
                data-testid={`button-recall-clear-${date}`}
                className="px-2 py-1 rounded text-[11px] border inline-flex items-center gap-1 disabled:opacity-30"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                <X size={10} /> Clear
              </button>
            </div>
          </div>

          {/* Sleep quality */}
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
              Sleep quality
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5].map((q) => {
                const active = currentQuality === q;
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSleepQualityForDate(date, q)}
                    data-testid={`button-quality-${q}-${date}`}
                    className="w-8 h-8 rounded text-[12px] font-semibold border transition-colors"
                    style={{
                      backgroundColor: active ? "rgba(167,139,250,0.20)" : "rgba(255,255,255,0.04)",
                      borderColor: active ? "#a78bfa" : "rgba(255,255,255,0.12)",
                      color: active ? "#a78bfa" : "rgba(255,255,255,0.75)",
                    }}
                  >
                    {q}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setSleepQualityForDate(date, null)}
                disabled={currentQuality === null}
                data-testid={`button-quality-clear-${date}`}
                className="px-2 py-1 rounded text-[11px] border inline-flex items-center gap-1 disabled:opacity-30"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                <X size={10} /> Clear
              </button>
            </div>
          </div>

          {/* Caffeine */}
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
              <Coffee size={10} style={{ color: "#fbbf24" }} />
              Caffeine — hours before bed
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step={0.5}
                value={caffeineInput}
                onChange={(e) => setCaffeineInput(e.target.value)}
                onBlur={commitCaffeine}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitCaffeine();
                  }
                }}
                placeholder="e.g. 3.5"
                className="h-8 bg-black/50 border-white/10 text-sm w-24"
                data-testid={`input-caffeine-${date}`}
              />
              <button
                type="button"
                onClick={() => {
                  setCaffeineInput("");
                  setCaffeineHoursAgoForDate(date, null);
                }}
                disabled={night.caffeineHoursAgo === null}
                data-testid={`button-caffeine-clear-${date}`}
                className="px-2 py-1 rounded text-[11px] border inline-flex items-center gap-1 disabled:opacity-30"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                <X size={10} /> Clear
              </button>
            </div>
            <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              Under 6 hours flags this night with a late-caffeine marker.
            </p>
          </div>

          {/* Alcohol */}
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
              <Wine size={10} style={{ color: "#f472b6" }} />
              Alcohol
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setHadAlcoholForDate(date, true)}
                data-testid={`button-alcohol-yes-${date}`}
                className="px-2.5 py-1 rounded text-[11px] border transition-colors"
                style={{
                  backgroundColor: alcoholExplicit && currentAlcohol ? "rgba(244,114,182,0.20)" : "rgba(255,255,255,0.04)",
                  borderColor: alcoholExplicit && currentAlcohol ? "#f472b6" : "rgba(255,255,255,0.12)",
                  color: alcoholExplicit && currentAlcohol ? "#f472b6" : "rgba(255,255,255,0.75)",
                }}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setHadAlcoholForDate(date, false)}
                data-testid={`button-alcohol-no-${date}`}
                className="px-2.5 py-1 rounded text-[11px] border transition-colors"
                style={{
                  backgroundColor: alcoholExplicit && !currentAlcohol ? "rgba(167,139,250,0.20)" : "rgba(255,255,255,0.04)",
                  borderColor: alcoholExplicit && !currentAlcohol ? "#a78bfa" : "rgba(255,255,255,0.12)",
                  color: alcoholExplicit && !currentAlcohol ? "#a78bfa" : "rgba(255,255,255,0.75)",
                }}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setHadAlcoholForDate(date, null)}
                disabled={!alcoholExplicit}
                data-testid={`button-alcohol-clear-${date}`}
                className="px-2 py-1 rounded text-[11px] border inline-flex items-center gap-1 disabled:opacity-30"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                <X size={10} /> Clear
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SleepRemTrendChart;
