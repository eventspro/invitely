/**
 * ImageEditDialog.tsx
 * Dialog/bottom sheet for replacing images in the demo editor.
 * Uses FileReader for local preview only — no server uploads.
 */
import { useRef, useState } from "react";
import { useDemoEditor } from "../DemoEditorContext";
import { getValueByPath } from "./editableRegistry";
import type { WeddingConfig } from "@/templates/types";
import { Upload, RotateCcw, X, Check } from "lucide-react";

interface ImageEditDialogProps {
  path: string;
  label: string;
  anchorRect: DOMRect;
  onClose: () => void;
}

export default function ImageEditDialog({ path, label, onClose }: ImageEditDialogProps) {
  const { config, updateConfigByPath } = useDemoEditor();
  const current = getValueByPath(config as unknown as Record<string, unknown>, path);
  // path might point to a string URL or string[] (hero.images)
  const isArray = Array.isArray(current);
  const currentUrl = isArray ? (current as string[])[0] ?? "" : String(current ?? "");

  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleApply() {
    if (preview) {
      if (isArray) {
        updateConfigByPath(path, [preview]);
      } else {
        updateConfigByPath(path, preview);
      }
    }
    onClose();
  }

  function handleRemove() {
    updateConfigByPath(path, isArray ? [] : "");
    onClose();
  }

  const displayImage = preview ?? (currentUrl || null);

  return (
    <>
      <div className="fixed inset-0 z-[99998] bg-black/40" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[99999] bg-white rounded-2xl shadow-2xl p-5 max-w-sm mx-auto space-y-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-80">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
        </div>

        {/* Preview */}
        <div
          className="w-full h-40 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer hover:border-rose-300 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {displayImage ? (
            <img src={displayImage} alt="preview" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="text-center text-gray-400 space-y-1">
              <Upload size={24} className="mx-auto" />
              <p className="text-xs">Click to upload</p>
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {/* Local-only notice */}
        <p className="text-xs text-gray-400 text-center">
          Image stored locally in browser only
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          {currentUrl && (
            <button
              onClick={handleRemove}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-gray-500 text-xs hover:bg-gray-50"
            >
              <RotateCcw size={11} /> Remove
            </button>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-rose-200 text-rose-700 text-xs font-medium hover:bg-rose-50"
          >
            <Upload size={12} /> Choose Image
          </button>
          <button
            onClick={handleApply}
            disabled={!preview}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-rose-700 text-white text-xs font-semibold disabled:opacity-40"
          >
            <Check size={11} /> Apply
          </button>
        </div>
      </div>
    </>
  );
}
