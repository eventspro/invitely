import type { PlannerData } from "./types";
import { DEFAULT_DATA } from "./defaultData";

const LS_KEY = "wedding_planner_prototype_v2";

export function loadData(): PlannerData {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw) as PlannerData;
    if (!Array.isArray(parsed.guests) || !Array.isArray(parsed.tables)) {
      return structuredClone(DEFAULT_DATA);
    }
    return { ...structuredClone(DEFAULT_DATA), ...parsed };
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

export function saveData(data: PlannerData): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function clearData(): void {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}

export function exportData(data: PlannerData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `4ever-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file: File): Promise<PlannerData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as PlannerData;
        if (!Array.isArray(parsed.guests) || !Array.isArray(parsed.tables)) {
          reject(new Error("Invalid backup file"));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error("Invalid JSON"));
      }
    };
    reader.onerror = () => reject(new Error("Read error"));
    reader.readAsText(file);
  });
}
