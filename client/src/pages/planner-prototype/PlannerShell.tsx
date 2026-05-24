import React, { useState } from "react";
import BottomNav from "./components/BottomNav";
import SidebarNav from "./components/SidebarNav";
import { Bell, Calendar, ArrowLeft, Menu, X, Home, Users, LayoutGrid, Wallet, MoreHorizontal, Heart, LogOut } from "lucide-react";
import { formatDate } from "./plannerUtils";
import { usePlannerText, LocaleSwitcher } from "./PlannerLocaleContext";
import type { TabId, PlannerSettings } from "./types";

interface PlannerShellProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  settings: PlannerSettings;
  children: React.ReactNode;
  headerTitle: string;
  headerRight?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  isDemoMode?: boolean;
  onDemoContactUs?: () => void;
  userDisplayName?: string;
  onLogout?: () => void;
}

const PLANNER_CSS = `
  .pp-root, .pp-root * { box-sizing: border-box; }
  .pp-mobile-view  { display: block; }
  .pp-desktop-view { display: none; }
  .pp-mobile-only  { display: block; }
  .pp-desktop-only { display: none; }
  .pp-chip-scroll  { overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .pp-chip-scroll::-webkit-scrollbar { display: none; }

  @media (min-width: 1024px) {
    .pp-desktop-flex  { display: flex !important; }
    .pp-mobile-only   { display: none !important; }
    .pp-desktop-only  { display: block !important; }
    .pp-mobile-view   { display: none !important; }
    .pp-desktop-view  { display: block !important; }
    .pp-stat-grid     { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; }
    .pp-overview-grid { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 16px !important; }
    .pp-lower-grid    { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
    .pp-tables-list   { grid-template-columns: repeat(2, 1fr) !important; }
    .pp-page-pad      { padding: 32px 32px 48px !important; }
    .pp-screen-bottom { padding-bottom: 0 !important; }
  }

  @media (max-width: 1023px) {
    .pp-desktop-flex  { display: none !important; }
    .pp-mobile-only   { display: block !important; }
    .pp-desktop-only  { display: none !important; }
    .pp-mobile-view   { display: block !important; }
    .pp-desktop-view  { display: none !important; }
    .pp-stat-grid     { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; }
    .pp-overview-grid { display: flex !important; flex-direction: column !important; }
    .pp-lower-grid    { display: flex !important; flex-direction: column !important; }
    .pp-tables-list   { grid-template-columns: 1fr !important; }
    .pp-page-pad      { padding: 16px 16px 0 !important; }
    .pp-screen-bottom { padding-bottom: 80px !important; }
  }
`;

export default function PlannerShell({
  active,
  onChange,
  settings,
  children,
  headerTitle,
  headerRight,
  showBack,
  onBack,
  isDemoMode = false,
  onDemoContactUs,
  userDisplayName,
  onLogout,
}: PlannerShellProps) {
  const pt = usePlannerText();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const DRAWER_TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: pt.nav.dashboard, icon: Home },
    { id: "guests",    label: pt.nav.guests,    icon: Users },
    { id: "tables",    label: pt.nav.tables,    icon: LayoutGrid },
    { id: "budget",    label: pt.nav.budget,    icon: Wallet },
    { id: "more",      label: pt.nav.more,      icon: MoreHorizontal },
  ];

  const initials = settings.coupleName
    .split(/\s*&\s*|\s+and\s+/i)
    .map(n => n.trim()[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  return (
    <div
      className="pp-root"
      style={{
        minHeight: "100dvh",
        background: "#FBFAF7",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style>{PLANNER_CSS}</style>

      {/* ======= DESKTOP (≥1024px) ======= */}
      <div className="pp-desktop-flex" style={{ display: "none", minHeight: "100dvh" }}>
        <SidebarNav active={active} onChange={onChange} coupleName={settings.coupleName} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflowX: "hidden" }}>
          {/* Desktop top bar */}
          <header style={{
            height: 64,
            background: "#FFFFFF",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            padding: "0 32px",
            gap: 12,
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
              {isDemoMode && (
                <>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "#FEF3C7", color: "#92400E", letterSpacing: "0.06em" }}>{pt.more.demoVersion}</span>
                  <button
                    onClick={onDemoContactUs}
                    style={{ fontSize: 12, fontWeight: 600, color: "#064E3B", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline", textUnderlineOffset: 2 }}
                  >
                    {pt.more.getFullAccess}
                  </button>
                </>
              )}
              {!isDemoMode && userDisplayName && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #00472F, #006B4A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#FFFFFF", flexShrink: 0 }}>
                    {userDisplayName.slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{userDisplayName}</span>
                </div>
              )}
            </div>
            {/* Language switcher */}
            <LocaleSwitcher />
            {/* Wedding date */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F9FAFB", borderRadius: 10, padding: "7px 14px", border: "1px solid #E5E7EB" }}>
              <Calendar size={14} color="#6B7280" strokeWidth={1.75} />
              <div>
                <div style={{ fontSize: 10, color: "#9CA3AF", lineHeight: 1, fontWeight: 500 }}>{pt.app.weddingDate}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", lineHeight: 1.4 }}>{formatDate(settings.weddingDate)}</div>
              </div>
            </div>
            {/* Bell */}
            <button style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Bell size={16} color="#6B7280" strokeWidth={1.75} />
            </button>
            {/* Logout (customer mode) or Avatar (prototype mode) */}
            {onLogout ? (
              <button
                onClick={onLogout}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#6B7280" }}
              >
                <LogOut size={14} strokeWidth={1.75} />
                {pt.auth.logout}
              </button>
            ) : (
              <button style={{ display: "flex", alignItems: "center", gap: 8, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "5px 14px 5px 6px", cursor: "pointer" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #00472F, #006B4A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#FFFFFF", flexShrink: 0 }}>
                  {initials}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{settings.coupleName}</span>
              </button>
            )}
            {headerRight && <div style={{ marginLeft: 4 }}>{headerRight}</div>}
          </header>
          <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            {children}
          </main>
        </div>
      </div>

      {/* ======= MOBILE (<1024px) ======= */}
      <div className="pp-mobile-only" style={{ display: "block", minHeight: "100dvh" }}>
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(255,255,255,0.97)",
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
        }}>
          {showBack ? (
            <button onClick={onBack} style={{ display: "flex", alignItems: "center", border: "none", background: "transparent", cursor: "pointer", color: "#064E3B", padding: 4, borderRadius: 8, WebkitTapHighlightColor: "transparent" }}>
              <ArrowLeft size={20} strokeWidth={2} />
            </button>
          ) : (
            <button onClick={() => setDrawerOpen(true)} style={{ display: "flex", alignItems: "center", border: "none", background: "transparent", cursor: "pointer", color: "#374151", padding: 4, WebkitTapHighlightColor: "transparent" }}>
              <Menu size={20} strokeWidth={1.75} />
            </button>
          )}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
              {headerTitle}
              {isDemoMode && (
                <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 5, background: "#FEF3C7", color: "#92400E", letterSpacing: "0.06em", verticalAlign: "middle" }}>{pt.more.demoVersion}</span>
              )}
            </div>
          </div>
          {headerRight ?? (
            <Bell size={18} strokeWidth={1.75} color="#374151" />
          )}
        </header>
        <main>
          {children}
        </main>
        <BottomNav active={active} onChange={onChange} />

        {/* Mobile drawer */}
        {drawerOpen && (
          <>
            <div
              onClick={() => setDrawerOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)" }}
            />
            <div style={{
              position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 201,
              width: 272,
              background: "#FFFFFF",
              display: "flex", flexDirection: "column",
              boxShadow: "4px 0 32px rgba(0,0,0,0.18)",
            }}>
              {/* Header */}
              <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #00472F, #006B4A)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Heart size={18} color="#FFFFFF" fill="#FFFFFF" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>{pt.app.name}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>{settings.coupleName}</div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  style={{ border: "none", background: "transparent", cursor: "pointer", color: "#6B7280", padding: 4, WebkitTapHighlightColor: "transparent" }}
                >
                  <X size={20} strokeWidth={1.75} />
                </button>
              </div>
              {/* Nav items */}
              <nav style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
                {DRAWER_TABS.map((tab) => {
                  const isActive = active === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { onChange(tab.id); setDrawerOpen(false); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "12px 12px", borderRadius: 10, border: "none",
                        background: isActive ? "#EAF5EF" : "transparent",
                        cursor: "pointer", marginBottom: 2, textAlign: "left",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <Icon size={18} color={isActive ? "#064E3B" : "#6B7280"} strokeWidth={isActive ? 2.25 : 1.75} />
                      <span style={{ fontSize: 15, fontWeight: isActive ? 700 : 500, color: isActive ? "#064E3B" : "#374151" }}>
                        {tab.label}
                      </span>
                      {isActive && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#064E3B" }} />}
                    </button>
                  );
                })}
              </nav>
              {/* Language switcher + wedding date footer */}
              <div style={{ padding: "12px 16px 28px", borderTop: "1px solid #E5E7EB" }}>
                <div style={{ marginBottom: 12 }}>
                  <LocaleSwitcher />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Calendar size={13} color="#9CA3AF" />
                  <div>
                    <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>{pt.app.weddingDate}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{formatDate(settings.weddingDate)}</div>
                  </div>
                </div>
                {onLogout && (
                  <button
                    onClick={() => { setDrawerOpen(false); onLogout(); }}
                    style={{ marginTop: 14, width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: "1px solid #E5E7EB", background: "#FAFAFA", color: "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
                  >
                    <LogOut size={15} strokeWidth={1.75} />
                    {pt.auth.logout}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
