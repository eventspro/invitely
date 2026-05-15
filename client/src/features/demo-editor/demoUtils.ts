/** Utility re-exported here for use outside of the context */
import type { WeddingConfig } from "@/templates/types";

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export function deepMergeConfig(base: WeddingConfig, override: DeepPartial<WeddingConfig>): WeddingConfig {
  return deepMerge(base, override) as WeddingConfig;
}

function deepMerge(base: unknown, override: unknown): unknown {
  if (!isPlainObject(override)) return override ?? base;
  if (!isPlainObject(base)) return override;
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(override as Record<string, unknown>)) {
    const bv = (base as Record<string, unknown>)[key];
    const ov = (override as Record<string, unknown>)[key];
    result[key] = isPlainObject(bv) && isPlainObject(ov) ? deepMerge(bv, ov) : ov ?? bv;
  }
  return result;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
