import type { HomepageContent } from "./homepageContentTypes";
import { DEFAULT_HOMEPAGE_CONTENT } from "./defaultHomepageContent";

const LS_KEY = "homepage_content_prototype_v1";

/** Merge stored content with defaults so missing fields never cause `.hy` crashes. */
function mergeWithDefaults(stored: Record<string, unknown>): HomepageContent {
  const result = { ...DEFAULT_HOMEPAGE_CONTENT } as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_HOMEPAGE_CONTENT) as (keyof HomepageContent)[]) {
    const storedVal = stored[key];
    const defaultVal = (DEFAULT_HOMEPAGE_CONTENT as unknown as Record<string, unknown>)[key];
    if (storedVal === undefined) continue;
    if (
      typeof storedVal === "object" && storedVal !== null && !Array.isArray(storedVal) &&
      typeof defaultVal === "object" && defaultVal !== null && !Array.isArray(defaultVal)
    ) {
      // Shallow-merge section objects so missing sub-fields fall back to defaults
      result[key] = { ...(defaultVal as object), ...(storedVal as object) };
    } else {
      result[key] = storedVal;
    }
  }
  return result as unknown as HomepageContent;
}

export function loadHomepageContent(): HomepageContent {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return mergeWithDefaults(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    // ignore parse errors
  }
  return DEFAULT_HOMEPAGE_CONTENT;
}

export function saveHomepageContent(content: HomepageContent): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(content));
    window.dispatchEvent(new CustomEvent("homepage-content-updated"));
  } catch {
    // ignore storage errors
  }
}

export function resetHomepageContent(): void {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent("homepage-content-updated"));
}

export function exportHomepageContent(content: HomepageContent): void {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `homepage-content-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importHomepageContent(json: string): HomepageContent {
  return JSON.parse(json) as HomepageContent;
}

// ── Server-side persistence ──────────────────────────────────────────────────

/** Fetch the published homepage content from the server. Returns null if not yet published. */
export async function fetchHomepageContentFromServer(): Promise<HomepageContent | null> {
  try {
    const res = await fetch("/api/homepage-content");
    if (!res.ok) return null;
    const data = await res.json() as { content: HomepageContent | null };
    if (!data.content) return null;
    return mergeWithDefaults(data.content as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** Publish homepage content to the server (admin JWT from localStorage required). */
export async function publishHomepageContent(content: HomepageContent): Promise<boolean> {
  try {
    const token = localStorage.getItem("adminToken") ?? localStorage.getItem("admin-token") ?? "";
    const res = await fetch("/api/homepage-content", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(content),
    });
    return res.ok;
  } catch {
    return false;
  }
}
