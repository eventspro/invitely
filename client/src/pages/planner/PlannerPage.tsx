import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Heart, LayoutTemplate, LogOut } from "lucide-react";
import { plannerText } from "../planner-prototype/plannerTextConfig";
import { BLANK_DATA } from "../planner-prototype/defaultData";
import { usePlannerAuth } from "./usePlannerAuth";
import PlannerPrototypePage from "../planner-prototype/PlannerPrototypePage";
import { getPlannerData } from "../planner-prototype/api/plannerDataApi";
import type { PlannerData } from "../planner-prototype/types";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const BG = "#FBFAF7";
const WHITE = "#FFFFFF";
const PRIMARY = "#064E3B";
const GRADIENT = "linear-gradient(135deg, #00472F 0%, #006B4A 100%)";
const SOFT = "#EAF5EF";
const GOLD = "#D7B56D";
const TEXT = "#111827";
const SECONDARY = "#6B7280";
const MUTED = "#9CA3AF";

function LoadingState() {
  return (
    <div style={{ minHeight: "100dvh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, fontFamily: "Inter, -apple-system, sans-serif" }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: GRADIENT, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Heart size={22} color={GOLD} fill={GOLD} />
      </div>
      <p style={{ fontSize: 14, color: SECONDARY, margin: 0 }}>{plannerText.planner.loading}</p>
    </div>
  );
}

function NoAccessState({ onLogout }: { onLogout: () => void }) {
  return (
    <div style={{ minHeight: "100dvh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420, background: WHITE, borderRadius: 24, boxShadow: "0 8px 40px rgba(17,24,39,0.10)", overflow: "hidden" }}>
        <div style={{ background: GRADIENT, padding: "24px 28px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Heart size={20} color={GOLD} fill={GOLD} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
            {plannerText.app.name}
          </span>
        </div>
        <div style={{ padding: "32px 28px 28px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: SOFT, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <LayoutTemplate size={28} color={PRIMARY} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: TEXT, margin: "0 0 10px" }}>{plannerText.auth.noAccessTitle}</h2>
          <p style={{ fontSize: 14, color: SECONDARY, margin: "0 0 28px", lineHeight: 1.6 }}>{plannerText.auth.noAccessText}</p>
          <a href="mailto:hello@4ever.am" style={{ display: "inline-block", padding: "10px 20px", borderRadius: 10, background: SOFT, color: PRIMARY, fontSize: 14, fontWeight: 600, textDecoration: "none", marginBottom: 20 }}>
            {plannerText.auth.contactSupport}
          </a>
          <div>
            <button onClick={onLogout} style={{ background: "none", border: "none", color: MUTED, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: 0 }}>
              <LogOut size={14} />
              {plannerText.auth.logout}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function readLegacyPlannerData(storageKey: string): PlannerData | undefined {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as PlannerData;
    if (!Array.isArray(parsed.guests) || !Array.isArray(parsed.tables)) return undefined;
    return { ...structuredClone(BLANK_DATA), ...parsed };
  } catch {
    return undefined;
  }
}

export default function PlannerPage() {
  const [, setLocation] = useLocation();
  const { authState, logout } = usePlannerAuth();
  const authenticatedSession = authState.status === "authenticated" ? authState.session : undefined;
  const [initialData, setInitialData] = useState<PlannerData | undefined>(undefined);
  const [legacyData, setLegacyData] = useState<PlannerData | undefined>(undefined);
  const [dataReady, setDataReady] = useState(false);

  function handleLogout() {
    logout();
    setLocation("/planner/login");
  }

  async function refreshPlannerData(
    templateId: string,
    token: string,
    fallback?: PlannerData,
    options?: { background?: boolean }
  ) {
    const isBackgroundRefresh = options?.background === true;

    if (!isBackgroundRefresh) {
      setDataReady(false);
    }

    try {
      const freshData = await getPlannerData(templateId, token);
      setInitialData(freshData);
    } catch {
      // During background refresh, keep the current data if the request fails.
      // Do not replace the UI with blank/fallback data.
      if (!isBackgroundRefresh) {
        setInitialData(fallback ?? structuredClone(BLANK_DATA));
      }
    } finally {
      if (!isBackgroundRefresh) {
        setDataReady(true);
      }
    }
  }

  // Once authenticated with a project, always fetch DB-backed planner data.
  useEffect(() => {
    if (authState.status !== "authenticated" || !authenticatedSession?.project) return;

    const { user, project, token } = authenticatedSession;
    const storageKey = `wedding_planner_u_${user.id}`;
    const legacy = readLegacyPlannerData(storageKey);
    setLegacyData(legacy);

    void refreshPlannerData(project.templateId, token, legacy);
  }, [
    authState.status,
    authenticatedSession?.user?.id,
    authenticatedSession?.project?.templateId,
    authenticatedSession?.token,
  ]);

  useEffect(() => {
    if (authState.status !== "authenticated" || !authenticatedSession?.project) return;
    const { project, token } = authenticatedSession;

    function handleFocus() {
      void refreshPlannerData(project.templateId, token, undefined, { background: true });
    }

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [
    authState.status,
    authenticatedSession?.project?.templateId,
    authenticatedSession?.token,
  ]);

  if (authState.status === "loading" || authState.status === "unauthenticated") {
    return <LoadingState />;
  }

  const { session } = authState;

  if (!session.project) {
    return <NoAccessState onLogout={handleLogout} />;
  }

  if (!dataReady) {
    return <LoadingState />;
  }

  const { user } = session;
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const storageKey = `wedding_planner_u_${user.id}`;

  return (
    <PlannerPrototypePage
      token={session.token}
      templateId={session.project.templateId}
      userDisplayName={displayName}
      onLogout={handleLogout}
      storageKey={storageKey}
      initialData={initialData}
      legacyData={legacyData}
      onLegacyImported={() => {
        localStorage.removeItem(storageKey);
        setLegacyData(undefined);
      }}
    />
  );
}
