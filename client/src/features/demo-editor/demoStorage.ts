/**
 * localStorage persistence for the demo editor.
 * Completely isolated – no network calls, no DB interaction.
 */
import type { WeddingConfig } from "@/templates/types";
import { DEMO_STORAGE_KEY, DEMO_DEFAULT_CONFIG } from "./demoConfig";

export function loadDemoConfig(): WeddingConfig {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return structuredClone(DEMO_DEFAULT_CONFIG);
    const parsed = JSON.parse(raw) as Partial<WeddingConfig>;
    // Deep merge: saved values override defaults so new keys added later still appear
    return deepMerge(structuredClone(DEMO_DEFAULT_CONFIG), parsed) as WeddingConfig;
  } catch {
    return structuredClone(DEMO_DEFAULT_CONFIG);
  }
}

export function saveDemoConfig(config: WeddingConfig): void {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // quota exceeded or private mode – silently swallow
  }
}

export function resetDemoConfig(): WeddingConfig {
  try {
    localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch { /* ignore */ }
  return structuredClone(DEMO_DEFAULT_CONFIG);
}

// ─── Deep merge helper (plain objects only, arrays replaced not merged) ───────
function deepMerge(base: unknown, override: unknown): unknown {
  if (!isObject(override)) return override ?? base;
  if (!isObject(base)) return override;
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override as Record<string, unknown>)) {
    const bv = (base as Record<string, unknown>)[key];
    const ov = (override as Record<string, unknown>)[key];
    result[key] = isObject(bv) && isObject(ov) ? deepMerge(bv, ov) : ov ?? bv;
  }
  return result;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
