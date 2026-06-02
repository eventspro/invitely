import { useState, useEffect, useCallback } from "react";
import type { PlannerSession, PlannerProject } from "./plannerAccessTypes";
import { PLANNER_TOKEN_KEY, PLANNER_SESSION_KEY } from "./plannerAccessTypes";

export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; session: PlannerSession };

// A panel is the user's OWN wedding planner entry if it is NOT a super_admin
// entry on someone else's template.  Null / undefined / 'customer' roles all
// belong to the user as the couple themselves.
function isOwnPanel(role: string | null | undefined): boolean {
  return role !== "super_admin";
}

export function usePlannerAuth() {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });

  // ─── Hydrate from localStorage, then validate against the server ───────────
  useEffect(() => {
    const token = localStorage.getItem(PLANNER_TOKEN_KEY);
    const sessionStr = localStorage.getItem(PLANNER_SESSION_KEY);

    if (!token || !sessionStr) {
      setAuthState({ status: "unauthenticated" });
      return;
    }

    let session: PlannerSession;
    try {
      session = JSON.parse(sessionStr);
    } catch {
      localStorage.removeItem(PLANNER_TOKEN_KEY);
      localStorage.removeItem(PLANNER_SESSION_KEY);
      setAuthState({ status: "unauthenticated" });
      return;
    }

    // Validate the stored session against the server.
    // This detects stale sessions where the user no longer has customer-level
    // access to the stored templateId (e.g. they were re-assigned, or they are
    // an owner whose session was accidentally pointing to another user's template).
    fetch("/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) return Promise.reject(r.status as number);
        return r.json() as Promise<{ adminPanels: Array<{ templateId: string; role: string | null }> }>;
      })
      .then(profile => {
        const panels = profile.adminPanels ?? [];
        const storedTemplateId = session.project?.templateId;

        // The profile endpoint only returns templates whose ownerEmail matches
        // the logged-in user.  If the stored templateId is not in that list,
        // the session is stale (e.g. an owner who was accidentally pointed at
        // another couple's template) — clear it.
        const stillValid =
          !storedTemplateId ||
          panels.some((p: { templateId: string }) => p.templateId === storedTemplateId);

        if (!stillValid) {
          localStorage.removeItem(PLANNER_TOKEN_KEY);
          localStorage.removeItem(PLANNER_SESSION_KEY);
          setAuthState({ status: "unauthenticated" });
          return;
        }

        setAuthState({ status: "authenticated", session });
      })
      .catch((statusOrError: number | unknown) => {
        // Auth errors (401 / 403 / 404) mean the token or access is invalid.
        // Network / server errors: trust the stored session optimistically so
        // we don't break users who are temporarily offline.
        if (typeof statusOrError === "number" && [401, 403, 404].includes(statusOrError)) {
          localStorage.removeItem(PLANNER_TOKEN_KEY);
          localStorage.removeItem(PLANNER_SESSION_KEY);
          setAuthState({ status: "unauthenticated" });
        } else {
          setAuthState({ status: "authenticated", session });
        }
      });
  }, []);

  // ─── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.error || "Invalid login details." };
      }

      // Pick the user's own planner panel.  The server now filters by
      // templates.ownerEmail = user.email so every panel in this list truly
      // belongs to the logged-in user — no role filtering needed here.
      const rawPanel =
        (data.user?.adminPanels as Array<{ id: string; templateId: string; templateName: string; templateSlug?: string; isActive?: boolean; role?: string | null }> | undefined)
          ?.[0] ?? null;

      const project: PlannerProject | null = rawPanel
        ? {
            panelId: rawPanel.id,
            templateId: rawPanel.templateId,
            templateName: rawPanel.templateName,
            templateSlug: rawPanel.templateSlug ?? "",
            isActive: rawPanel.isActive ?? true,
            role: rawPanel.role ?? "customer",
          }
        : null;

      const session: PlannerSession = {
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName ?? null,
          lastName: data.user.lastName ?? null,
        },
        project,
        token: data.token,
      };

      localStorage.setItem(PLANNER_TOKEN_KEY, data.token);
      localStorage.setItem(PLANNER_SESSION_KEY, JSON.stringify(session));
      setAuthState({ status: "authenticated", session });

      return {};
    } catch {
      return { error: "Network error. Please try again." };
    }
  }, []);

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(PLANNER_TOKEN_KEY);
    localStorage.removeItem(PLANNER_SESSION_KEY);
    setAuthState({ status: "unauthenticated" });
  }, []);

  return { authState, login, logout };
}
