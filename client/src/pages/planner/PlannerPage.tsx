import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Heart, LayoutTemplate, LogOut } from "lucide-react";
import { plannerText } from "../planner-prototype/plannerTextConfig";
import { BLANK_DATA } from "../planner-prototype/defaultData";
import { usePlannerAuth } from "./usePlannerAuth";
import { PLANNER_TOKEN_KEY } from "./plannerAccessTypes";
import PlannerPrototypePage from "../planner-prototype/PlannerPrototypePage";
import type { PlannerData, Guest, RsvpStatus } from "../planner-prototype/types";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const BG       = "#FBFAF7";
const WHITE    = "#FFFFFF";
const PRIMARY  = "#064E3B";
const GRADIENT = "linear-gradient(135deg, #00472F 0%, #006B4A 100%)";
const SOFT     = "#EAF5EF";
const GOLD     = "#D7B56D";
const TEXT     = "#111827";
const SECONDARY= "#6B7280";
const MUTED    = "#9CA3AF";

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

function rsvpAttendingToStatus(attending: boolean | null | undefined): RsvpStatus {
  if (attending === true)  return "coming";
  if (attending === false) return "not_coming";
  return "waiting";
}

async function fetchInitialData(templateId: string, token: string): Promise<PlannerData> {
  try {
    const res = await fetch(`/api/admin-panel/${templateId}/rsvps?limit=200`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { ...BLANK_DATA };
    const json = await res.json();
    const rsvps: Array<{
      id: string;
      firstName: string;
      lastName: string;
      guestPhone?: string | null;
      guestEmail?: string | null;
      attending?: boolean | null;
      guests?: number | null;
    }> = json.rsvps ?? [];

    const guests: Guest[] = rsvps.map(r => ({
      id: crypto.randomUUID(),
      fullName: `${r.firstName} ${r.lastName}`.trim(),
      phone: r.guestPhone ?? "",
      email: r.guestEmail ?? "",
      rsvpStatus: rsvpAttendingToStatus(r.attending),
      guestCount: r.guests ?? 1,
      side: "both",
      groupName: "",
    }));

    return { ...BLANK_DATA, guests };
  } catch {
    return { ...BLANK_DATA };
  }
}

export default function PlannerPage() {
  const [, setLocation] = useLocation();
  const { authState, logout } = usePlannerAuth();
  const [initialData, setInitialData] = useState<PlannerData | undefined>(undefined);
  const [dataReady, setDataReady] = useState(false);

  function handleLogout() {
    logout();
    setLocation("/planner/login");
  }

  // Once authenticated with a project, check for existing stored data or fetch RSVPs
  useEffect(() => {
    if (authState.status !== "authenticated" || !authState.session.project) return;

    const { user, project, token } = authState.session;
    const storageKey = `wedding_planner_u_${user.id}`;

    // If the user already has planner data stored, use it directly
    if (localStorage.getItem(storageKey)) {
      setDataReady(true);
      return;
    }

    // First-time login: fetch RSVPs to pre-populate guests
    fetchInitialData(project.templateId, token).then(data => {
      setInitialData(data);
      setDataReady(true);
    });
  }, [authState.status]);

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
      userDisplayName={displayName}
      onLogout={handleLogout}
      storageKey={storageKey}
      initialData={initialData}
    />
  );
}
