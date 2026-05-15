/**
 * DemoEditorContext – shared state for the demo editor wizard.
 * Initializes from the real live template config (fetched once from the API),
 * then layers customer edits on top. Never writes back to the live template.
 */
import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import type { WeddingConfig } from "@/templates/types";
import { defaultConfig as romanticDefaultConfig } from "@/templates/romantic/config";
import { DEMO_DEFAULT_CONFIG } from "./demoConfig";
import { saveDemoConfig } from "./demoStorage";

export type PreviewMode = "desktop" | "mobile";

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

interface DemoEditorContextValue {
  config: WeddingConfig;
  baseLoaded: boolean;
  previewMode: PreviewMode;
  /** Current wizard step (1–7) */
  currentStep: number;
  isDirty: boolean;
  setPreviewMode: (m: PreviewMode) => void;
  setCurrentStep: (step: number) => void;
  updateConfig: (patch: DeepPartial<WeddingConfig>) => void;
  applyCustomerPatch: (patch: DeepPartial<WeddingConfig>) => void;
  saveConfig: () => void;
  resetConfig: () => void;
}

const DemoEditorContext = createContext<DemoEditorContextValue | null>(null);

const LIVE_TEMPLATE_SLUG = "david-rose-romantic";

export function DemoEditorProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<WeddingConfig>(structuredClone(DEMO_DEFAULT_CONFIG));
  const [baseLoaded, setBaseLoaded] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [currentStep, setCurrentStep] = useState(1);
  const [isDirty, setIsDirty] = useState(false);

  // Fetch the real live template config once on mount and use it as the base.
  // We deep-merge: romanticDefaultConfig (has all Armenian texts) + DB config (has real
  // images and admin customisations). This mirrors how RomanticTemplate builds safeConfig
  // at runtime — so the demo preview always shows real photos AND real Armenian texts.
  // Customer edits are layered on top via applyCustomerPatch() called by DemoEditorPage.
  useEffect(() => {
    fetch(`/api/templates/${LIVE_TEMPLATE_SLUG}/config`)
      .then(r => r.ok ? r.json() : null)
      .then((data: { config?: WeddingConfig } | null) => {
        // Start with the romantic default config (all Armenian text fields from weddingConfig),
        // then layer the DB overrides (real couple names, images, colors) on top.
        const base = deepMerge(romanticDefaultConfig, data?.config ?? {}) as WeddingConfig;
        setConfig(structuredClone(base));
      })
      .catch(() => {
        // Even on network failure, fall back to the full Armenian default config
        setConfig(structuredClone(romanticDefaultConfig as WeddingConfig));
      })
      .finally(() => setBaseLoaded(true));
  }, []);

  // Autosave debounce
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleAutosave = useCallback((cfg: WeddingConfig) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveDemoConfig(cfg);
      setIsDirty(false);
    }, 800);
  }, []);

  const updateConfig = useCallback((patch: DeepPartial<WeddingConfig>) => {
    setConfig((prev) => {
      const next = deepMerge(prev, patch) as WeddingConfig;
      setIsDirty(true);
      scheduleAutosave(next);
      return next;
    });
  }, [scheduleAutosave]);

  /** Apply saved customer edits on top of the freshly-loaded base config.
   *  Called once by DemoEditorPage after it fetches the customerEdits record. */
  const applyCustomerPatch = useCallback((patch: DeepPartial<WeddingConfig>) => {
    setConfig((prev) => deepMerge(prev, patch) as WeddingConfig);
  }, []);

  const saveConfig = useCallback(() => {
    setConfig((prev) => {
      saveDemoConfig(prev);
      return prev;
    });
    setIsDirty(false);
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(structuredClone(DEMO_DEFAULT_CONFIG));
    setIsDirty(false);
    setCurrentStep(1);
  }, []);

  useEffect(() => () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
  }, []);

  return (
    <DemoEditorContext.Provider
      value={{
        config, baseLoaded, previewMode, currentStep, isDirty,
        setPreviewMode, setCurrentStep,
        updateConfig, applyCustomerPatch, saveConfig, resetConfig,
      }}
    >
      {children}
    </DemoEditorContext.Provider>
  );
}

export function useDemoEditor(): DemoEditorContextValue {
  const ctx = useContext(DemoEditorContext);
  if (!ctx) throw new Error("useDemoEditor must be used inside DemoEditorProvider");
  return ctx;
}

// ─── Internal deep-merge (arrays replaced, objects merged) ───────────────────
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


