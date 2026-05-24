import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, icon, sub, accent }: StatCardProps) {
  return (
    <div
      style={{
        background: accent ? "linear-gradient(135deg, #00472F 0%, #006B4A 100%)" : "#FFFFFF",
        borderRadius: 16,
        padding: "14px 16px",
        border: accent ? "none" : "1px solid #E5E7EB",
        boxShadow: "0 2px 8px rgba(17,24,39,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: accent ? "rgba(255,255,255,0.7)" : "#6B7280", letterSpacing: "0.02em" }}>
          {label}
        </span>
        {icon && (
          <div style={{ opacity: accent ? 0.7 : 1 }}>{icon}</div>
        )}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent ? "#FFFFFF" : "#111827", lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 10.5, color: accent ? "rgba(255,255,255,0.6)" : "#9CA3AF" }}>{sub}</div>
      )}
    </div>
  );
}
