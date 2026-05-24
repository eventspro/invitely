import React from "react";
import { ArrowLeft, Bell } from "lucide-react";
import { plannerText } from "../plannerTextConfig";

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
}

export default function AppHeader({ title, showBack, onBack, rightSlot }: AppHeaderProps) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid #E5E7EB",
        height: "calc(56px + env(safe-area-inset-top, 0px))",
        paddingTop: "env(safe-area-inset-top, 0px)",
        display: "flex",
        alignItems: "center",
        paddingLeft: 16,
        paddingRight: 16,
        gap: 12,
        flexShrink: 0,
      }}
    >
      {showBack && (
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#064E3B",
            padding: 4,
            borderRadius: 8,
          }}
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
          {title}
        </div>
        <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500, letterSpacing: "0.01em" }}>
          {plannerText.app.name}
        </div>
      </div>
      {rightSlot ?? (
        <button
          style={{
            display: "flex",
            alignItems: "center",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#6B7280",
            padding: 4,
          }}
        >
          <Bell size={18} strokeWidth={1.75} />
        </button>
      )}
    </header>
  );
}
