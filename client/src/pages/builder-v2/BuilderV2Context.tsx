/**
 * V2 Builder — Context and Reducer
 * Isolated from V1 builder. Provides all builder state to child components.
 */

import React, { createContext, useContext, useReducer, useCallback, useMemo } from "react";
import type { WeddingConfig } from "@/templates/types";
import type {
  BuilderV2State,
  BuilderV2Action,
  BuilderV2ContextValue,
  DevicePreview,
  InspectorTab,
  BuilderMode,
  BuilderPanel,
} from "./types";
import { MAX_HISTORY } from "./types";
import { getV2Manifest } from "./manifest-registry";
import type { V2TemplateManifest } from "./manifest-types";

// ─── Reducer ──────────────────────────────────────────────────────────────────
function builderReducer(state: BuilderV2State, action: BuilderV2Action): BuilderV2State {
  switch (action.type) {
    case "UPDATE_CONFIG": {
      const newDraft = action.updater(state.draftConfig);
      const newPast = [state.draftConfig, ...state.past].slice(0, MAX_HISTORY);
      return {
        ...state,
        draftConfig: newDraft,
        past: newPast,
        future: [],
        hasUnsavedChanges: true,
      };
    }

    case "SELECT_SECTION":
      return { ...state, selectedSection: action.sectionId, selectedElement: null };

    case "SELECT_ELEMENT":
      return {
        ...state,
        selectedElement: action.elementId,
        selectedSection: action.sectionId ?? state.selectedSection,
      };

    case "SET_DEVICE":
      return { ...state, devicePreview: action.device };

    case "SET_TAB":
      return { ...state, inspectorTab: action.tab };

    case "SET_MODE":
      return { ...state, builderMode: action.mode };

    case "SET_PANEL":
      return { ...state, builderPanel: action.panel };

    case "SET_NAME":
      return { ...state, templateName: action.name };

    case "UNDO": {
      if (state.past.length === 0) return state;
      const [prev, ...newPast] = state.past;
      return {
        ...state,
        draftConfig: prev,
        past: newPast,
        future: [state.draftConfig, ...state.future],
        hasUnsavedChanges: true,
      };
    }

    case "REDO": {
      if (state.future.length === 0) return state;
      const [next, ...newFuture] = state.future;
      return {
        ...state,
        draftConfig: next,
        past: [state.draftConfig, ...state.past],
        future: newFuture,
        hasUnsavedChanges: true,
      };
    }

    case "SAVE_START":
      return { ...state, isSaving: true };

    case "SAVE_SUCCESS":
      return {
        ...state,
        isSaving:          false,
        isPublishing:      false,
        savedConfig:       action.config,
        hasUnsavedChanges: false,
        lastSaved:         new Date(),
        past:              [],
        future:            [],
      };

    case "SAVE_ERROR":
      return { ...state, isSaving: false };

    case "PUBLISH_START":
      return { ...state, isPublishing: true };

    case "PUBLISH_SUCCESS":
      return { ...state, isPublishing: false };

    case "PUBLISH_ERROR":
      return { ...state, isPublishing: false };

    case "DISCARD":
      return {
        ...state,
        draftConfig: state.savedConfig,
        hasUnsavedChanges: false,
        past: [],
        future: [],
      };

    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────────────────────────
const BuilderV2Context = createContext<BuilderV2ContextValue | null>(null);

export function useBuilderV2(): BuilderV2ContextValue {
  const ctx = useContext(BuilderV2Context);
  if (!ctx) throw new Error("useBuilderV2 must be used inside BuilderV2Provider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
interface ProviderProps {
  templateId:   string;
  templateKey:  string;
  templateName: string;
  initialConfig: WeddingConfig;
  children: React.ReactNode;
}

export function BuilderV2Provider({
  templateId,
  templateKey,
  templateName,
  initialConfig,
  children,
}: ProviderProps) {
  // Derive manifest from templateKey (non-reactive — key never changes mid-session)
  const manifest: V2TemplateManifest | null = useMemo(
    () => getV2Manifest(templateKey),
    [templateKey]
  );
  const [state, dispatch] = useReducer(builderReducer, {
    templateId,
    templateName,
    savedConfig:       initialConfig,
    draftConfig:       initialConfig,
    selectedSection:   null,
    selectedElement:   null,
    inspectorTab:      "content",
    builderMode:       "editing",
    builderPanel:      "inspector",
    devicePreview:     "desktop",
    hasUnsavedChanges: false,
    isSaving:          false,
    isPublishing:      false,
    lastSaved:         null,
    past:              [],
    future:            [],
  } satisfies BuilderV2State);

  const updateConfig = useCallback(
    (updater: (cfg: WeddingConfig) => WeddingConfig) =>
      dispatch({ type: "UPDATE_CONFIG", updater }),
    []
  );

  const selectSection = useCallback(
    (id: string | null) => dispatch({ type: "SELECT_SECTION", sectionId: id }),
    []
  );

  const selectElement = useCallback(
    (id: string | null, sectionId?: string) =>
      dispatch({ type: "SELECT_ELEMENT", elementId: id, sectionId }),
    []
  );

  const setDevice = useCallback(
    (device: DevicePreview) => dispatch({ type: "SET_DEVICE", device }),
    []
  );

  const setTab = useCallback(
    (tab: InspectorTab) => dispatch({ type: "SET_TAB", tab }),
    []
  );

  const setMode = useCallback(
    (mode: BuilderMode) => dispatch({ type: "SET_MODE", mode }),
    []
  );

  const setPanel = useCallback(
    (panel: BuilderPanel) => dispatch({ type: "SET_PANEL", panel }),
    []
  );

  const setName = useCallback(
    (name: string) => dispatch({ type: "SET_NAME", name }),
    []
  );

  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);

  const save = useCallback(async () => {
    dispatch({ type: "SAVE_START" });
    try {
      const token = localStorage.getItem("admin-token");
      const res = await fetch(`/api/templates/${templateId}/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(state.draftConfig),
      });
      if (!res.ok) throw new Error("Save failed");
      dispatch({ type: "SAVE_SUCCESS", config: state.draftConfig });
    } catch {
      dispatch({ type: "SAVE_ERROR" });
    }
  }, [templateId, state.draftConfig]);

  const publish = useCallback(async () => {
    dispatch({ type: "PUBLISH_START" });
    try {
      const token = localStorage.getItem("admin-token");
      // Save config first, then set published flag
      const res = await fetch(`/api/templates/${templateId}/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(state.draftConfig),
      });
      if (!res.ok) throw new Error("Publish failed");
      dispatch({ type: "SAVE_SUCCESS", config: state.draftConfig });
      dispatch({ type: "PUBLISH_SUCCESS" });
    } catch {
      dispatch({ type: "PUBLISH_ERROR" });
    }
  }, [templateId, state.draftConfig]);

  const discard = useCallback(() => dispatch({ type: "DISCARD" }), []);

  const value: BuilderV2ContextValue = {
    state,
    dispatch,
    manifest,
    updateConfig,
    selectSection,
    selectElement,
    setDevice,
    setTab,
    setMode,
    setPanel,
    setName,
    undo,
    redo,
    save,
    publish,
    discard,
    canUndo: state.past.length   > 0,
    canRedo: state.future.length > 0,
  };

  return (
    <BuilderV2Context.Provider value={value}>
      {children}
    </BuilderV2Context.Provider>
  );
}
