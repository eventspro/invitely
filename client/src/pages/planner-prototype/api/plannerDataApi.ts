import { BLANK_DATA } from "../defaultData";
import type { PlannerData } from "../types";

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

export async function getPlannerData(templateId: string, token: string): Promise<PlannerData> {
  const res = await fetch(`/api/planner/data/${templateId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`getPlannerData failed: ${res.status}`);
  return normalizePlannerData(await res.json());
}

export async function savePlannerData(templateId: string, token: string, data: PlannerData): Promise<PlannerData> {
  const res = await fetch(`/api/planner/data/${templateId}`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`savePlannerData failed: ${res.status}`);
  return normalizePlannerData(await res.json());
}

export async function importLegacyPlannerData(templateId: string, token: string, data: PlannerData): Promise<PlannerData> {
  const res = await fetch(`/api/planner/data/${templateId}/import`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`importLegacyPlannerData failed: ${res.status}`);
  return normalizePlannerData(await res.json());
}
