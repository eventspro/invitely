import { useState, useEffect, useCallback } from "react";
import type { PlannerSession, PlannerProject } from "./plannerAccessTypes";
import { PLANNER_TOKEN_KEY, PLANNER_SESSION_KEY } from "./plannerAccessTypes";

/**
 * Phase 1 — Customer planner authentication hook.
 *
 * Uses the existing /api/auth/login endpoint (managementUsers + userAdminPanels).
 * Stores token and session in localStorage under separate keys from platform admin.
 *
 * TODO Phase 2+: Extend to refresh token on expiry, verify token server-side on
 * mount, and add customer-specific planner data loading.
 */

export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; session: PlannerSession };

export function usePlannerAuth() {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });

  // ─── Hydrate from localStorage on mount ────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem(PLANNER_TOKEN_KEY);
    const sessionStr = localStorage.getItem(PLANNER_SESSION_KEY);

    if (token && sessionStr) {
      try {
        const session: PlannerSession = JSON.parse(sessionStr);
        setAuthState({ status: "authenticated", session });
      } catch {
        // Corrupted session data — clear it
        localStorage.removeItem(PLANNER_TOKEN_KEY);
        localStorage.removeItem(PLANNER_SESSION_KEY);
        setAuthState({ status: "unauthenticated" });
      }
    } else {
      setAuthState({ status: "unauthenticated" });
    }
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

      // Map first active admin panel as the planner project.
      // Phase 2+: Support multiple projects or let the user choose.
      const rawPanel = data.user?.adminPanels?.[0] ?? null;
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
