/**
 * RadarChart.tsx
 * Custom SVG radar/spider chart — 4 axes (Strength, Vitality, Sense, Discipline).
 * Supports an optional ghost/baseline polygon drawn beneath the live data polygon.
 * Animates the data polygon from the centre outward on mount when animate=true.
 * Sharp, technical aesthetic — no rounded corners, neon-blue glow on the border.
 */

import { useEffect, useRef, useState } from "react";

// ── Public types ───────────────────────────────────────────────────────────────

export interface RadarChartValues {
  strength:   number;  // 0–100
  vitality:   number;  // 0–100
  sense:      number;  // 0–100
  discipline: number;  // 0–100
}

interface Props {
  values:       RadarChartValues;
  /** Optional ghost polygon shown faintly behind the live data polygon. */
  ghostValues?: RadarChartValues;
  /** Diameter of the chart diamond (not the full SVG — labels live outside). Default 160. */
  chartSize?:   number;
  /** Colour of the data polygon and its glow. Default neon-blue. */
  color?:       string;
  /** Whether to run the draw-in animation on mount. Default true. */
  animate?:     boolean;
  /** Delay in ms before the animation starts. Default 0. */
  delay?:       number;
}

// ── Axis definitions ───────────────────────────────────────────────────────────

const AXES = [
  { key: "strength"   as keyof RadarChartValues, abbr: "STR", color: "#fbbf24", angle: -90 },
  { key: "vitality"   as keyof RadarChartValues, abbr: "VIT", color: "#34d399", angle:   0 },
  { key: "sense"      as keyof RadarChartValues, abbr: "SNS", color: "#a78bfa", angle:  90 },
  { key: "discipline" as keyof RadarChartValues, abbr: "DIS", color: "#fb923c", angle: 180 },
] as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = toRad(angleDeg);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function pts(points: { x: number; y: number }[]) {
  return points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}

// ── Component ──────────────────────────────────────────────────────────────────

export function RadarChart({
  values,
  ghostValues,
  chartSize = 160,
  color     = "#0ea5e9",
  animate   = true,
  delay     = 0,
}: Props) {
  const [progress, setProgress] = useState(animate ? 0 : 1);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!animate) return;
    const DURATION = 1500;
    let startTime = 0;

    const timeoutId = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!startTime) startTime = now;
        const p = Math.min((now - startTime) / DURATION, 1);
        setProgress(1 - Math.pow(1 - p, 3)); // ease-out cubic
        if (p < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafRef.current);
    };
  }, [animate, delay]);

  // ── Layout maths ────────────────────────────────────────────────────────────
  const labelPad = 36;
  const svgW     = chartSize + labelPad * 2;
  const svgH     = chartSize + labelPad * 2;
  const cx       = svgW / 2;
  const cy       = svgH / 2;
  const maxR     = chartSize / 2;
  const glowId   = `rg-${chartSize}-${color.replace("#", "")}`;

  const GRID_LEVELS = [0.25, 0.5, 0.75, 1.0];

  // Live data polygon (scaled by animation progress)
  const dataPts = AXES.map(ax => {
    const val = Math.max(0, Math.min(100, values[ax.key] ?? 0));
    return polar(cx, cy, maxR * (val / 100) * progress, ax.angle);
  });

  // Ghost polygon (always full — not affected by progress)
  const ghostPts = ghostValues
    ? AXES.map(ax => {
        const val = Math.max(0, Math.min(100, ghostValues[ax.key] ?? 0));
        return polar(cx, cy, maxR * (val / 100), ax.angle);
      })
    : null;

  const LABEL_R = maxR + 14;
  const VALUE_R = maxR + 26;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width={svgW}
      height={svgH}
      style={{ display: "block", overflow: "visible" }}
      aria-label="Stat radar chart"
    >
      <defs>
        <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${glowId}-dot`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Background grid ── */}
      {AXES.map(ax => {
        const end = polar(cx, cy, maxR, ax.angle);
        return (
          <line key={`ax-${ax.key}`}
            x1={cx} y1={cy} x2={end.x} y2={end.y}
            stroke="rgba(255,255,255,0.06)" strokeWidth={0.8} strokeDasharray="3 4" />
        );
      })}
      {GRID_LEVELS.map((lvl, gi) => {
        const gPts = AXES.map(ax => polar(cx, cy, maxR * lvl, ax.angle));
        const isOuter = gi === GRID_LEVELS.length - 1;
        return (
          <polygon key={`grid-${gi}`} points={pts(gPts)} fill="none"
            stroke={isOuter ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.045)"}
            strokeWidth={isOuter ? 0.9 : 0.6} />
        );
      })}

      {/* ── Ghost / baseline polygon ── */}
      {ghostPts && (
        <>
          <polygon points={pts(ghostPts)} fill="rgba(255,255,255,0.035)" stroke="none" />
          <polygon points={pts(ghostPts)} fill="none"
            stroke="rgba(255,255,255,0.14)" strokeWidth={1}
            strokeDasharray="4 3" />
        </>
      )}

      {/* ── Live data polygon ── */}
      <polygon points={pts(dataPts)} fill={`${color}28`} stroke="none" />
      <polygon points={pts(dataPts)} fill="none" stroke={color}
        strokeWidth={1.6} filter={`url(#${glowId})`} />

      {/* Vertex dots */}
      {dataPts.map((pt, i) => (
        <circle key={`dot-${i}`} cx={pt.x} cy={pt.y}
          r={progress > 0.05 ? 2.8 : 0}
          fill={AXES[i].color} filter={`url(#${glowId}-dot)`} />
      ))}

      {/* ── Axis labels ── */}
      {AXES.map(ax => {
        const val    = Math.max(0, Math.min(100, values[ax.key] ?? 0));
        const angle  = ax.angle;
        const anchor = angle === 0 ? "start" : angle === 180 ? "end" : "middle";
        const lp     = polar(cx, cy, LABEL_R, angle);
        const vp     = polar(cx, cy, VALUE_R, angle);
        const isLat  = angle === 0 || angle === 180;
        const dy1    = isLat ? -5 : 0;
        const dy2    = isLat ?  9 : 13;
        const ep     = polar(cx, cy, maxR, angle);

        return (
          <g key={`lbl-${ax.key}`}>
            <circle cx={ep.x} cy={ep.y} r={1.8} fill={ax.color} opacity={0.45} />
            <text x={lp.x} y={lp.y + dy1} textAnchor={anchor} fontSize={9}
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fontWeight={700} letterSpacing={0.8} fill={ax.color} opacity={0.88}>
              {ax.abbr}
            </text>
            <text x={vp.x} y={vp.y + dy2} textAnchor={anchor} fontSize={9}
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fontWeight={500} fill="rgba(255,255,255,0.45)">
              {val}%
            </text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={2} fill={color} opacity={0.4} />
    </svg>
  );
}
