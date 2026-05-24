/**
 * Phase 1 — Planner customer access types.
 *
 * These types model what we receive from the existing /api/auth/login endpoint.
 * No schema changes were needed: `userAdminPanels` already links each management
 * user to their assigned wedding template project.
 *
 * Future phases can extend PlannerProject with RSVP data, planner tables/seats,
 * and budget items once backend persistence is added.
 */

export interface PlannerUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * A single project/panel assigned to the customer.
 * Sourced from userAdminPanels joined with templates.
 */
export interface PlannerProject {
  panelId: string;
  templateId: string;
  templateName: string;
  templateSlug: string;
  isActive: boolean;
  role: string; // 'customer' | 'super_admin'
}

/**
 * The full planner session stored in localStorage after a successful login.
 * `project` is null when the user has no active assigned project.
 */
export interface PlannerSession {
  user: PlannerUser;
  /** First active admin panel / wedding project, or null if none. */
  project: PlannerProject | null;
  token: string;
}

// ─── localStorage key constants ───────────────────────────────────────────────
/** JWT token for the customer planner. Separate from the platform admin token. */
export const PLANNER_TOKEN_KEY = "planner-token";
/** Full session object serialized as JSON. */
export const PLANNER_SESSION_KEY = "planner-session";
