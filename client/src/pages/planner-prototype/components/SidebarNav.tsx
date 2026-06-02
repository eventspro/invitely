import React from "react";
import { Home, Users, LayoutGrid, Wallet, MoreHorizontal, Heart, ClipboardList } from "lucide-react";
import { usePlannerText } from "../PlannerLocaleContext";
import type { TabId } from "../types";

interface SidebarNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  coupleName: string;
}

export default function SidebarNav({ active, onChange, coupleName }: SidebarNavProps) {
  const pt = usePlannerText();

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: pt.nav.dashboard, icon: Home },
    { id: "guests",    label: pt.nav.guests,    icon: Users },
    { id: "tables",    label: pt.nav.tables,    icon: LayoutGrid },
    { id: "tasks",     label: pt.nav.tasks,     icon: ClipboardList },
    { id: "budget",    label: pt.nav.budget,    icon: Wallet },
    { id: "more",      label: pt.nav.more,      icon: MoreHorizontal },
  ];

  return (
    <aside
      style={{
        width: 256,
        background: "#FFFFFF",
        borderRight: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        position: "sticky",
        top: 0,
        flexShrink: 0,
        overflowY: "auto",
      }}
    >
      {/* logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #00472F, #006B4A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Heart size={18} color="#FFFFFF" fill="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
              {pt.app.name}
            </div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{coupleName}</div>
          </div>
        </div>
      </div>

      {/* nav */}
      <nav style={{ flex: 1, padding: "12px 12px" }}>
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background: isActive ? "#EAF5EF" : "transparent",
                cursor: "pointer",
                marginBottom: 2,
                textAlign: "left",
              }}
            >
              <Icon
                size={18}
                color={isActive ? "#064E3B" : "#6B7280"}
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#064E3B" : "#374151",
                }}
              >
                {tab.label}
              </span>
              {isActive && (
                <div
                  style={{
                    marginLeft: "auto",
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#064E3B",
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* footer */}
      <div style={{ padding: "12px 16px 20px", borderTop: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: 10, color: "#9CA3AF", lineHeight: 1.5 }}>
          {pt.more.prototypeNote}
        </div>
      </div>
    </aside>
  );
}
