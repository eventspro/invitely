import React from "react";

interface ProgressBarProps {
  pct: number; // 0-100
  color?: string;
  bg?: string;
  height?: number;
  radius?: number;
}

export default function ProgressBar({
  pct,
  color = "#064E3B",
  bg = "#E5E7EB",
  height = 6,
  radius = 99,
}: ProgressBarProps) {
  return (
    <div style={{ width: "100%", height, borderRadius: radius, background: bg, overflow: "hidden" }}>
      <div
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          height: "100%",
          background: color,
          borderRadius: radius,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}
