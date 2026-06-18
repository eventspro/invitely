import { BLANK_DATA } from "../defaultData";
import type { PlannerData } from "../types";

export class PlannerConflictError extends Error {
  constructor() {
    super("planner version conflict");
    this.name = "PlannerConflictError";
  }
}

function headers(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function cloneBlank(): PlannerData {
  return structuredClone(BLANK_DATA);
}

function normalizePlannerData(raw: unknown): PlannerData {
  const fallback = cloneBlank();
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Partial<PlannerData>;

  return {
    guests: Array.isArray(data.guests) ? data.guests : fallback.guests,
    tables: Array.isArray(data.tables) ? data.tables : fallback.tables,
    seats: Array.isArray(data.seats) ? data.seats : fallback.seats,
    budgetItems: Array.isArray(data.budgetItems) ? data.budgetItems : fallback.budgetItems,
    tasks: Array.isArray(data.tasks) ? data.tasks : fallback.tasks,
    settings: { ...fallback.settings, ...(data.settings ?? {}) },
  };
}

type PlannerDataWithVersion = PlannerData & { plannerVersion: string | null };

function withVersion(raw: unknown, data: PlannerData): PlannerDataWithVersion {
  const r = raw as Record<string, unknown>;
  return { ...data, plannerVersion: typeof r?.plannerVersion === "string" ? r.plannerVersion : null };
}

export async function getPlannerData(templateId: string, token: string): Promise<PlannerDataWithVersion> {
  const res = await fetch(`/api/planner/data/${templateId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`getPlannerData failed: ${res.status}`);
  const raw = await res.json();
  return withVersion(raw, normalizePlannerData(raw));
}

export async function savePlannerData(
  templateId: string,
  token: string,
  data: PlannerData,
  plannerVersion: string | null = null,
): Promise<PlannerDataWithVersion> {
  const res = await fetch(`/api/planner/data/${templateId}`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify({ ...data, plannerVersion }),
  });
  if (res.status === 409) throw new PlannerConflictError();
  if (!res.ok) throw new Error(`savePlannerData failed: ${res.status}`);
  const raw = await res.json();
  return withVersion(raw, normalizePlannerData(raw));
}

export async function importLegacyPlannerData(
  templateId: string,
  token: string,
  data: PlannerData,
): Promise<PlannerDataWithVersion> {
  const res = await fetch(`/api/planner/data/${templateId}/import`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`importLegacyPlannerData failed: ${res.status}`);
  const raw = await res.json();
  return withVersion(raw, normalizePlannerData(raw));
}
