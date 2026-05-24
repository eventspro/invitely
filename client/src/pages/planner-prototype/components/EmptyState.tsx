import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        gap: 12,
      }}
    >
      {icon && (
        <div style={{ color: "#D1D5DB", marginBottom: 4 }}>{icon}</div>
      )}
      <div style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>{title}</div>
      {description && (
        <div style={{ fontSize: 13, color: "#9CA3AF", maxWidth: 280 }}>{description}</div>
      )}
      {action && <div style={{ marginTop: 4 }}>{action}</div>}
    </div>
  );
}
