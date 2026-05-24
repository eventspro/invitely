import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { Heart, Calendar, User, LayoutTemplate, LogOut } from "lucide-react";
import { plannerText } from "../planner-prototype/plannerTextConfig";
import { usePlannerAuth } from "./usePlannerAuth";
import type { PlannerProject } from "./plannerAccessTypes";

// ─── Design tokens (match approved planner-prototype) ─────────────────────────
const BG        = "#FBFAF7";
const WHITE     = "#FFFFFF";
const PRIMARY   = "#064E3B";
const GRADIENT  = "linear-gradient(135deg, #00472F 0%, #006B4A 100%)";
const SOFT      = "#EAF5EF";
const GOLD      = "#D7B56D";
const TEXT      = "#111827";
const SECONDARY = "#6B7280";
const MUTED     = "#9CA3AF";
const BORDER    = "#E5E7EB";
const CARD_SHADOW = "0 4px 16px rgba(17, 24, 39, 0.05)";

// ─── Loading state ─────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: GRADIENT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Heart size={22} color={GOLD} fill={GOLD} />
      </div>
      <p style={{ fontSize: 14, color: SECONDARY, margin: 0 }}>
        {plannerText.planner.loading}
      </p>
    </div>
  );
}

// ─── No-access state ───────────────────────────────────────────────────────────
function NoAccessState({ onLogout }: { onLogout: () => void }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: WHITE,
          borderRadius: 24,
          boxShadow: "0 8px 40px rgba(17, 24, 39, 0.10)",
          overflow: "hidden",
        }}
      >
        {/* Header strip */}
        <div
          style={{
            background: GRADIENT,
            padding: "24px 28px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Heart size={20} color={GOLD} fill={GOLD} />
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "rgba(255,255,255,0.7)",
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
            }}
          >
            {plannerText.app.name}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: "32px 28px 28px", textAlign: "center" }}>
          {/* Icon */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: SOFT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <LayoutTemplate size={28} color={PRIMARY} />
          </div>

          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: TEXT,
              margin: "0 0 10px",
            }}
          >
            {plannerText.auth.noAccessTitle}
          </h2>
          <p
            style={{
              fontSize: 14,
              color: SECONDARY,
              margin: "0 0 28px",
              lineHeight: 1.6,
            }}
          >
            {plannerText.auth.noAccessText}
          </p>

          {/* Support link */}
          <a
            href="mailto:hello@4ever.am"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              borderRadius: 10,
              background: SOFT,
              color: PRIMARY,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              marginBottom: 20,
            }}
          >
            {plannerText.auth.contactSupport}
          </a>

          {/* Logout */}
          <div>
            <button
              onClick={onLogout}
              style={{
                background: "none",
                border: "none",
                color: MUTED,
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: 0,
              }}
            >
              <LogOut size={14} />
              {plannerText.auth.logout}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Project summary card ──────────────────────────────────────────────────────
function ProjectCard({ project }: { project: PlannerProject }) {
  return (
    <div
      style={{
        background: WHITE,
        borderRadius: 18,
        border: `1px solid ${BORDER}`,
        boxShadow: CARD_SHADOW,
        overflow: "hidden",
      }}
    >
      {/* Card header */}
      <div
        style={{
          background: GRADIENT,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <LayoutTemplate size={18} color="rgba(255,255,255,0.7)" />
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "rgba(255,255,255,0.85)",
            textTransform: "uppercase" as const,
            letterSpacing: "0.05em",
          }}
        >
          {plannerText.planner.assignedProject}
        </span>
      </div>

      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Template name */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: SOFT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <LayoutTemplate size={17} color={PRIMARY} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>
              {plannerText.planner.template}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>{project.templateName}</div>
          </div>
        </div>

        {/* Slug */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: SOFT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <User size={17} color={PRIMARY} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>
              {plannerText.planner.couple}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: SECONDARY }}>
              {project.templateSlug || "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main planner shell ────────────────────────────────────────────────────────
/**
 * Phase 1 planner shell.
 *
 * Handles three states:
 *   1. Loading — hydrating session from localStorage
 *   2. Unauthenticated — redirect to /planner/login
 *   3. Authenticated, no project — no-access state
 *   4. Authenticated, project assigned — basic project summary
 *
 * TODO Phase 2+: Load real planner data (RSVP → guests, tables, seats, budget)
 * and render the full PlannerShell with all approved tab screens.
 */
export default function PlannerPage() {
  const [, setLocation] = useLocation();
  const { authState, logout } = usePlannerAuth();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (authState.status === "unauthenticated") {
      setLocation("/planner/login");
    }
  }, [authState.status, setLocation]);

  function handleLogout() {
    logout();
    setLocation("/planner/login");
  }

  // ─── State: loading ────────────────────────────────────────────────────────
  if (authState.status === "loading" || authState.status === "unauthenticated") {
    return <LoadingState />;
  }

  const { session } = authState;

  // ─── State: no project assigned ────────────────────────────────────────────
  if (!session.project) {
    return <NoAccessState onLogout={handleLogout} />;
  }

  // ─── State: project assigned — Phase 1 summary view ───────────────────────
  const { user, project } = session;
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: BG,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Top nav */}
      <header
        style={{
          background: WHITE,
          borderBottom: `1px solid ${BORDER}`,
          padding: "0 20px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: GRADIENT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Heart size={16} color={GOLD} fill={GOLD} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: PRIMARY }}>
            {plannerText.app.name}
          </span>
        </div>

        {/* User + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{ fontSize: 13, color: SECONDARY, display: "none" }}
            className="pp-desktop-name"
          >
            {displayName}
          </span>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: `1.5px solid ${BORDER}`,
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: SECONDARY,
            }}
          >
            <LogOut size={14} />
            {plannerText.auth.logout}
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ padding: "24px 16px 48px", maxWidth: 640, margin: "0 auto" }}>
        {/* Welcome */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: TEXT,
              margin: "0 0 6px",
            }}
          >
            {plannerText.app.greeting}, {displayName.split(" ")[0]}
          </h1>
          <p style={{ fontSize: 14, color: SECONDARY, margin: 0 }}>
            {plannerText.app.greetingSub}
          </p>
        </div>

        {/* Project card */}
        <ProjectCard project={project} />

        {/*
         * TODO Phase 2+: Replace this placeholder with the full PlannerShell
         * loaded with real customer data:
         *   - RSVP responses synced as guest list
         *   - Tables / seats from backend
         *   - Budget items from backend
         *   - Settings from template config
         *
         * The approved planner-prototype screens (DashboardScreen, GuestsScreen,
         * TablesScreen, BudgetScreen, TasksScreen) can be reused here once data
         * is wired through a real API call.
         */}
        <div
          style={{
            marginTop: 20,
            background: WHITE,
            borderRadius: 14,
            border: `1px solid ${BORDER}`,
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#FFF3E0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Calendar size={18} color="#D7951E" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>
              Phase 1
            </div>
            <div style={{ fontSize: 13, color: SECONDARY, lineHeight: 1.5 }}>
              Full planner dashboard coming in the next phase. Your project is set up and ready.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
