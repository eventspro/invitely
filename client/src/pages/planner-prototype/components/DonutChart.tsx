import React from "react";

interface Segment {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  segments: Segment[];
  total: number;
  centerLabel?: string;
  centerSub?: string;
  size?: number;
}

export default function DonutChart({ segments, total, centerLabel, centerSub, size = 140 }: DonutChartProps) {
  const r = 44;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs: { segment: Segment; strokeDasharray: string; strokeDashoffset: number }[] = [];

  for (const seg of segments) {
    const pct = total > 0 ? seg.value / total : 0;
    const len = pct * circumference;
    arcs.push({
      segment: seg,
      strokeDasharray: `${len} ${circumference}`,
      strokeDashoffset: -offset,
    });
    offset += len;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={size} height={size} viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
        {/* background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth={12} />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={arc.segment.color}
            strokeWidth={12}
            strokeDasharray={arc.strokeDasharray}
            strokeDashoffset={arc.strokeDashoffset}
            strokeLinecap="butt"
            style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize={18} fontWeight={700} fill="#111827" fontFamily="Inter, system-ui, sans-serif">
          {centerLabel ?? total}
        </text>
        {centerSub && (
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="#6B7280" fontFamily="Inter, system-ui, sans-serif">
            {centerSub}
          </text>
        )}
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#6B7280" }}>{seg.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#111827", marginLeft: "auto", paddingLeft: 8 }}>
              {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
