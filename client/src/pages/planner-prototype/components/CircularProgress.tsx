import React from "react";

interface CircularProgressProps {
  pct: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

export default function CircularProgress({
  pct,
  size = 96,
  strokeWidth = 10,
  color = "#064E3B",
  label,
  sublabel,
}: CircularProgressProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = Math.max(0, (pct / 100) * circumference);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth={strokeWidth} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <span style={{ fontSize: size < 80 ? 14 : 18, fontWeight: 800, color: "#111827", lineHeight: 1 }}>
          {label ?? `${pct}%`}
        </span>
        {sublabel && (
          <span style={{ fontSize: 9, color: "#6B7280" }}>{sublabel}</span>
        )}
      </div>
    </div>
  );
}
