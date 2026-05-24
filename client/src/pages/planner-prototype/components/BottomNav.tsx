import React from "react";
import { Home, Users, LayoutGrid, Wallet, MoreHorizontal } from "lucide-react";
import { usePlannerText } from "../PlannerLocaleContext";
import type { TabId } from "../types";

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  const pt = usePlannerText();

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: pt.nav.dashboard, icon: Home },
    { id: "guests",    label: pt.nav.guests,    icon: Users },
    { id: "tables",    label: pt.nav.tables,    icon: LayoutGrid },
    { id: "budget",    label: pt.nav.budget,    icon: Wallet },
    { id: "more",      label: pt.nav.more,      icon: MoreHorizontal },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "calc(60px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "#FFFFFF",
        borderTop: "1px solid #E5E7EB",
        display: "flex",
        boxShadow: "0 -2px 12px rgba(17,24,39,0.06)",
        zIndex: 100,
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: "6px 0",
              gap: 3,
              position: "relative",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 28,
                  height: 3,
                  borderRadius: "0 0 3px 3px",
                  background: "#064E3B",
                }}
              />
            )}
            <Icon
              size={20}
              color={isActive ? "#064E3B" : "#9CA3AF"}
              strokeWidth={isActive ? 2.25 : 1.75}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? "#064E3B" : "#9CA3AF",
                letterSpacing: isActive ? "-0.01em" : 0,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
