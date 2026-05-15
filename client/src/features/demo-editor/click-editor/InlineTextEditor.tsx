/**
 * InlineTextEditor.tsx
 * Floating popover (desktop) / bottom sheet (mobile) for inline text editing.
 */
import { useState, useEffect, useRef } from "react";
import { useDemoEditor } from "../DemoEditorContext";
import { getValueByPath } from "./editableRegistry";
import type { WeddingConfig } from "@/templates/types";
import { X, Check } from "lucide-react";

interface InlineTextEditorProps {
  path: string;
  label: string;
  multiline?: boolean;
  anchorRect: DOMRect;
  onClose: () => void;
}

export default function InlineTextEditor({ path, label, multiline, anchorRect, onClose }: InlineTextEditorProps) {
  const { config, updateConfigByPath } = useDemoEditor();
  const currentValue = String(getValueByPath(config as unknown as Record<string, unknown>, path) ?? "");
  const [value, setValue] = useState(currentValue);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const isMobile = window.innerWidth < 640;

  useEffect(() => {
    // Auto-focus + select all on mount
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, []);

  function handleSave() {
    if (value.trim() !== currentValue) {
      updateConfigByPath(path, value);
    }
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { onClose(); return; }
    if (!multiline && e.key === "Enter") { handleSave(); return; }
    if (multiline && e.key === "Enter" && (e.metaKey || e.ctrlKey)) { handleSave(); }
  }

  // ── Position calculation (desktop) ───────────────────────────────
  const popoverStyle: React.CSSProperties = isMobile
    ? {}
    : (() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const popW = 280;
        let left = anchorRect.left + anchorRect.width / 2 - popW / 2;
        let top = anchorRect.bottom + 10;
        if (left < 8) left = 8;
        if (left + popW > vw - 8) left = vw - popW - 8;
        if (top + 180 > vh) top = anchorRect.top - 180 - 10;
        return { position: "fixed", left, top, width: popW, zIndex: 99999 } as React.CSSProperties;
      })();

  const sharedInputClass =
    "w-full border border-rose-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white text-gray-800";

  // ── Mobile bottom sheet ──────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 z-[99998] bg-black/20" onClick={onClose} />
        <div className="fixed bottom-0 left-0 right-0 z-[99999] bg-white rounded-t-2xl shadow-2xl p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-gray-700">{label}</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              className={sharedInputClass}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={sharedInputClass}
            />
          )}
          <button
            onClick={handleSave}
            className="w-full py-2.5 rounded-lg bg-rose-700 text-white text-sm font-semibold"
          >
            Apply
          </button>
        </div>
      </>
    );
  }

  // ── Desktop floating popover ──────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 z-[99998]" onClick={onClose} />
      <div style={popoverStyle} className="bg-white rounded-xl shadow-2xl border border-rose-100 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600">{label}</span>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500"><X size={13} /></button>
        </div>
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className={sharedInputClass}
            placeholder="Ctrl+Enter to save"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={sharedInputClass}
            placeholder="Enter to save"
          />
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-xs hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1">
            <Check size={11} /> Apply
          </button>
        </div>
      </div>
    </>
  );
}
