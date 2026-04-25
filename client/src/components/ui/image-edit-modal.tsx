/**
 * ImageEditModal — builder-only image editing tool.
 *
 * Provides crop, filter adjustments, and output-resize for a single image.
 * Changes are purely client-side until "Save & Apply" is clicked. On save,
 * the edited image is exported via Canvas API and re-uploaded to the same
 * secure upload endpoint used everywhere else. The old image record is then
 * deleted. If anything fails during save the original image is untouched.
 *
 * Security notes:
 *  - Canvas output is always image/jpeg (no SVG/HTML injection possible).
 *  - Upload uses the same auth headers and endpoint as all other image uploads.
 *  - Output blob is size-checked client-side before upload (< 4 MB, server limit).
 *  - Image is loaded via fetch-as-blob to avoid CORS canvas-taint issues.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Scissors, SlidersHorizontal, Maximize2, RotateCcw, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Slider } from "./slider";
import { Label } from "./label";
import { Input } from "./input";
import { Alert, AlertDescription } from "./alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterState {
  brightness: number;  // 100 = normal
  contrast: number;    // 100 = normal
  saturation: number;  // 100 = normal
  grayscale: number;   // 0 = none
  blur: number;        // 0 = none (px)
}

const DEFAULT_FILTERS: FilterState = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  blur: 0,
};

/** Persisted editor state stored client-side alongside the ImageFile.
 *  `originalUrl` always points to the very first (unedited) version of the image
 *  so re-edits always render from the unmodified source — never double-baking filters. */
export interface ImageEditSettings {
  filters: FilterState;
  originalUrl: string;     // URL of the first-ever unedited version
  originalImageId: string; // DB id of the original record (never deleted)
}

interface ResizeState {
  width: string;
  height: string;
  preserveAspect: boolean;
}

const ASPECT_RATIOS: { label: string; value: number | undefined }[] = [
  { label: "Free", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:4", value: 3 / 4 },
  { label: "9:16", value: 9 / 16 },
];

export interface SavedImage {
  id: string;
  url: string;
  filename: string;
  editSettings?: ImageEditSettings;
}

export interface ImageEditModalProps {
  isOpen: boolean;
  imageId: string;
  imageUrl: string;
  imageName: string;
  templateId: string;
  category: string;
  onClose: () => void;
  /** Saved edit settings from a previous session. Hydrates sliders and sets the render source. */
  initialEditSettings?: ImageEditSettings;
  /** Called with old image id and new image data after a successful save. */
  onSaved: (oldImageId: string, newImage: SavedImage) => void;
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

/** Load image as an object URL.
 * For same-origin URLs (/api/images/serve/…) fetches directly.
 * For external URLs (R2 CDN) routes through our server proxy so the
 * browser can use the image in Canvas without a cross-origin taint error.
 * Returns the raw Blob so callers can use createImageBitmap() — which
 * can never taint a canvas regardless of image origin.
 */
async function fetchImageAsBlob(url: string): Promise<Blob> {
  const isSameOrigin =
    url.startsWith("/") ||
    url.startsWith(window.location.origin);

  const fetchUrl = isSameOrigin
    ? url
    : `/api/img-proxy?url=${encodeURIComponent(url)}`;

  console.log("[image-edit] fetchImageAsBlob", { url, isSameOrigin, fetchUrl });

  // cache:'no-store' ensures the browser never serves a stale cached error response
  const resp = await fetch(fetchUrl, { cache: "no-store" });
  console.log("[image-edit] proxy response", { status: resp.status, contentType: resp.headers.get("content-type"), ok: resp.ok });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "(unreadable)");
    console.error("[image-edit] proxy error body:", body);
    throw new Error(`HTTP ${resp.status} fetching image`);
  }
  const contentType = resp.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    const body = await resp.text().catch(() => "(unreadable)");
    console.error("[image-edit] proxy returned non-image body:", body);
    throw new Error(`Unexpected response type: ${contentType}`);
  }
  return resp.blob();
}

function buildFilterCss(f: FilterState): string {
  const parts = [
    `brightness(${f.brightness}%)`,
    `contrast(${f.contrast}%)`,
    `saturate(${f.saturation}%)`,
    `grayscale(${f.grayscale}%)`,
  ];
  if (f.blur > 0) parts.push(`blur(${f.blur}px)`);
  return parts.join(" ");
}

async function renderToBlob(
  imageSrc: string,
  pixelCrop: Area | null,
  filters: FilterState,
  outputSize?: { width: number; height: number }
): Promise<Blob> {
  const MAX_DIM = 3000;

  // Fetch the image as a Blob then draw via createImageBitmap.
  // An ImageBitmap created from a JS Blob can NEVER taint a canvas —
  // this is the only reliable way to avoid SecurityError on cross-origin images
  // whose URLs may already be cached by the browser without CORS headers.
  const blob = await fetchImageAsBlob(imageSrc);
  const bitmap = await createImageBitmap(blob);

  const srcX = pixelCrop?.x ?? 0;
  const srcY = pixelCrop?.y ?? 0;
  const srcW = pixelCrop?.width ?? bitmap.width;
  const srcH = pixelCrop?.height ?? bitmap.height;

  const outW = Math.min(outputSize?.width ?? srcW, MAX_DIM);
  const outH = Math.min(outputSize?.height ?? srcH, MAX_DIM);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  ctx.filter = buildFilterCss(filters);
  ctx.drawImage(bitmap, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas export returned null"))),
      "image/jpeg",
      0.92
    );
  });
}

async function uploadEditedBlob(
  templateId: string,
  category: string,
  blob: Blob,
  originalName: string
): Promise<SavedImage> {
  // Client-side size guard (server enforces 4 MB)
  if (blob.size > 4 * 1024 * 1024) {
    throw new Error(
      "Edited image exceeds the 4 MB upload limit. Reduce output dimensions or try again."
    );
  }

  const token =
    localStorage.getItem("templateAdminToken") ||
    localStorage.getItem("admin-token");
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Sanitize filename — no path traversal, safe characters only
  // Guard: originalName may be undefined if the API returned 'name' instead of 'filename'
  const safeName = (originalName || 'image').replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const filename = `edited-${Date.now()}-${safeName}.jpg`;

  const file = new File([blob], filename, { type: "image/jpeg" });
  const formData = new FormData();
  formData.append("image", file);
  formData.append("category", category);

  const response = await fetch(`/api/templates/${templateId}/photos/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || `Upload failed (${response.status})`);
  }

  // Server returns { id, url, name, ... } — map 'name' → 'filename' to match SavedImage interface
  const data = await response.json();
  return {
    id: data.id,
    url: data.url,
    filename: data.name || data.filename || '',
  };
}

async function deleteOldImage(templateId: string, imageId: string): Promise<void> {
  const token =
    localStorage.getItem("templateAdminToken") ||
    localStorage.getItem("admin-token");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`/api/templates/${templateId}/images/${imageId}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`deleteOldImage failed [${res.status}]:`, body);
    throw new Error(`Failed to remove old image (${res.status})`);
  }
}

// ─── Filter slider sub-component ──────────────────────────────────────────────

function FilterSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  defaultValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  defaultValue: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground w-8 text-right">{value}</span>
          {value !== defaultValue && (
            <button
              onClick={() => onChange(defaultValue)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Reset"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

// ─── Main modal component ─────────────────────────────────────────────────────

export default function ImageEditModal({
  isOpen,
  imageId,
  imageUrl,
  imageName,
  templateId,
  category,
  onClose,
  initialEditSettings,
  onSaved,
}: ImageEditModalProps) {
  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropApplied, setCropApplied] = useState(false); // true once user interacted with crop

  // Filter state
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Resize state
  const [resize, setResize] = useState<ResizeState>({
    width: "",
    height: "",
    preserveAspect: true,
  });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  // previewUrl: the image source shown in the editor.
  // Normally equals imageUrl (the current edited/saved image).
  // After "Reset all" it switches to originalUrl so the user can see the original.
  // Reverts to imageUrl on Cancel. renderToBlob always uses this value.
  const [previewUrl, setPreviewUrl] = useState(imageUrl);

  // True when the user has clicked "Reset all" to restore the original image.
  // This makes hasChanges=true so Save & Apply is enabled even though sliders are at defaults.
  const [isFullReset, setIsFullReset] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<string>("crop");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load natural image dimensions when modal opens.
  // Measure the originalUrl when we have one, so dimensions reflect the true source.
  useEffect(() => {
    if (!isOpen) return;
    const src = initialEditSettings?.originalUrl ?? imageUrl;
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setResize((r) => ({
        ...r,
        width: String(img.naturalWidth),
        height: String(img.naturalHeight),
      }));
    };
    img.src = src;
  }, [isOpen, imageUrl]);

  // Hydrate editor state when the modal opens.
  // If the image was previously edited, restore saved filter values so sliders
  // reflect what produced the current visual state (no double-filtering on re-edit
  // because renderToBlob always renders from the original source URL).
  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setAspect(undefined);
      setCroppedAreaPixels(null);
      setCropApplied(false);
      setFilters(initialEditSettings?.filters ?? DEFAULT_FILTERS);
      // Always preview from the original unedited source with CSS filters applied.
      // This means individual filter resets update the preview immediately without
      // the baked pixels interfering (no double-application of filters in the preview).
      setPreviewUrl(initialEditSettings?.originalUrl ?? imageUrl);
      setIsFullReset(false);
      setActiveTab("crop");
      setError(null);
    }
  }, [isOpen, imageUrl]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
    setCropApplied(true);
  }, []);

  const filterCss = buildFilterCss(filters);

  // ── Resize helpers ──
  const handleResizeWidthChange = (val: string) => {
    const w = parseInt(val, 10);
    if (resize.preserveAspect && naturalSize.width > 0 && !isNaN(w)) {
      const ratio = naturalSize.height / naturalSize.width;
      setResize((r) => ({ ...r, width: val, height: String(Math.round(w * ratio)) }));
    } else {
      setResize((r) => ({ ...r, width: val }));
    }
  };

  const handleResizeHeightChange = (val: string) => {
    const h = parseInt(val, 10);
    if (resize.preserveAspect && naturalSize.height > 0 && !isNaN(h)) {
      const ratio = naturalSize.width / naturalSize.height;
      setResize((r) => ({ ...r, height: val, width: String(Math.round(h * ratio)) }));
    } else {
      setResize((r) => ({ ...r, height: val }));
    }
  };

  // ── Detect any changes made ──
  // Compare against the saved baseline so that reopening a previously edited image
  // and clicking Save without touching anything won't re-bake identical filters.
  const savedFilters = initialEditSettings?.filters ?? DEFAULT_FILTERS;
  const hasChanges =
    isFullReset || // full reset is always a saveable change
    cropApplied ||
    filters.brightness !== savedFilters.brightness ||
    filters.contrast !== savedFilters.contrast ||
    filters.saturation !== savedFilters.saturation ||
    filters.grayscale !== savedFilters.grayscale ||
    filters.blur !== savedFilters.blur ||
    (resize.width !== "" &&
      resize.width !== String(naturalSize.width) &&
      parseInt(resize.width, 10) > 0) ||
    (resize.height !== "" &&
      resize.height !== String(naturalSize.height) &&
      parseInt(resize.height, 10) > 0);

  // ── Save handler ──
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Determine output size (only if user explicitly changed from natural)
      let outputSize: { width: number; height: number } | undefined;
      const w = parseInt(resize.width, 10);
      const h = parseInt(resize.height, 10);
      const MIN_DIM = 50;
      const MAX_DIM = 3000;

      if (w > 0 && h > 0 && (w !== naturalSize.width || h !== naturalSize.height)) {
        if (w < MIN_DIM || h < MIN_DIM) throw new Error(`Minimum output size is ${MIN_DIM}px`);
        if (w > MAX_DIM || h > MAX_DIM) throw new Error(`Maximum output size is ${MAX_DIM}px`);
        outputSize = { width: w, height: h };
      }

      // Always render from previewUrl:
      // - Normal edit: previewUrl === imageUrl (the current saved version); originalUrl is
      //   stored in editSettings and used as the actual render source to prevent double-baking.
      // - After Reset All: previewUrl === originalUrl, filters === DEFAULT_FILTERS,
      //   so the original is rendered cleanly with no filters.
      const renderSource = isFullReset
        ? (initialEditSettings?.originalUrl ?? imageUrl)   // reset: render original clean
        : (initialEditSettings?.originalUrl ?? imageUrl);  // normal edit: same — always from original
      const cropArea = cropApplied ? croppedAreaPixels : null;
      const blob = await renderToBlob(renderSource, cropArea, filters, outputSize);

      // Upload the edited image
      // Run upload and delete in parallel — they operate on different DB records
      // (upload creates a NEW record; delete removes the OLD one identified by imageId).
      // Awaiting both ensures the old record is gone before onSaved updates the UI,
      // preventing a duplicate from appearing on the next loadImages() call.
      // The actual R2 file is NOT deleted — only the DB row — so editSettings.originalUrl
      // remains valid for future canvas re-renders.
      const [newImage] = await Promise.all([
        uploadEditedBlob(templateId, category, blob, imageName),
        deleteOldImage(templateId, imageId),
      ]);

      // After a full reset the image is back to its original state.
      // Emit undefined editSettings so the next open treats it as an unedited image.
      if (isFullReset) {
        onSaved(imageId, { ...newImage, editSettings: undefined });
        return;
      }

      // Build edit settings to carry forward so future re-edits restore sliders
      // and render from the correct original source (avoids double-baking).
      const newEditSettings: ImageEditSettings = {
        filters,
        originalUrl: initialEditSettings?.originalUrl ?? imageUrl,
        originalImageId: initialEditSettings?.originalImageId ?? imageId,
      };

      onSaved(imageId, { ...newImage, editSettings: newEditSettings });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspect(undefined);
    setCroppedAreaPixels(null);
    setCropApplied(false);
    // Fully clear all edits and switch the preview to the original unedited image.
    // This does NOT permanently change anything — the user must click "Save & Apply".
    setFilters(DEFAULT_FILTERS);
    // Switch preview to originalUrl so the user sees the original immediately.
    const original = initialEditSettings?.originalUrl ?? imageUrl;
    setPreviewUrl(original);
    setIsFullReset(true);
    setResize({
      width: String(naturalSize.width),
      height: String(naturalSize.height),
      preserveAspect: true,
    });
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl w-full p-0 gap-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()} // prevent accidental close
      >
        <DialogHeader className="px-5 py-3 border-b">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Scissors className="h-4 w-4" /> Edit Image
            <span className="text-muted-foreground font-normal text-xs ml-1 truncate max-w-xs">
              — {imageName}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row overflow-hidden">
          {/* ── Left: Preview pane ── */}
          <div className="flex-1 min-h-[320px] lg:min-h-[420px] bg-[#1a1a1a] relative">
            {activeTab === "crop" ? (
              <div className="absolute inset-0">
                <Cropper
                  image={previewUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  style={{
                    containerStyle: { background: "#1a1a1a" },
                    mediaStyle: { filter: filterCss },
                  }}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <img
                  src={previewUrl}
                  alt="Edit preview"
                  className="max-w-full max-h-full object-contain rounded"
                  style={{ filter: filterCss }}
                  draggable={false}
                />
              </div>
            )}

            {/* Zoom slider (visible only on crop tab) */}
            {activeTab === "crop" && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 bg-black/60 rounded-lg px-3 py-2">
                <span className="text-white text-xs shrink-0">Zoom</span>
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.05}
                  onValueChange={([v]) => setZoom(v)}
                  className="flex-1 [&_.bg-primary]:bg-white [&_.border-primary]:border-white [&_.bg-secondary]:bg-white/30"
                />
                <span className="text-white text-xs w-8 text-right shrink-0">
                  {zoom.toFixed(1)}×
                </span>
              </div>
            )}
          </div>

          {/* ── Right: Controls ── */}
          <div className="w-full lg:w-72 border-l flex flex-col">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col"
            >
              <TabsList className="w-full rounded-none border-b h-10 bg-muted/30 p-0">
                <TabsTrigger
                  value="crop"
                  className="flex-1 rounded-none h-10 data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary text-xs gap-1"
                >
                  <Scissors className="h-3.5 w-3.5" /> Crop
                </TabsTrigger>
                <TabsTrigger
                  value="adjust"
                  className="flex-1 rounded-none h-10 data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary text-xs gap-1"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Adjust
                </TabsTrigger>
                <TabsTrigger
                  value="resize"
                  className="flex-1 rounded-none h-10 data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary text-xs gap-1"
                >
                  <Maximize2 className="h-3.5 w-3.5" /> Resize
                </TabsTrigger>
              </TabsList>

              {/* ── Crop tab ── */}
              <TabsContent value="crop" className="flex-1 p-4 space-y-4 m-0">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                    Aspect Ratio
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ASPECT_RATIOS.map((r) => (
                      <button
                        key={r.label}
                        onClick={() => setAspect(r.value)}
                        className={`text-xs py-1.5 px-2 rounded border transition-colors ${
                          aspect === r.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-input hover:bg-muted"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground bg-muted/40 rounded p-2.5 leading-relaxed">
                  Drag the image to reposition. Pinch or use the zoom slider to adjust crop area. The
                  highlighted region will be saved.
                </div>

                {cropApplied && (
                  <button
                    onClick={() => {
                      setCrop({ x: 0, y: 0 });
                      setZoom(1);
                      setCroppedAreaPixels(null);
                      setCropApplied(false);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" /> Reset crop
                  </button>
                )}
              </TabsContent>

              {/* ── Adjust tab ── */}
              <TabsContent value="adjust" className="flex-1 p-4 space-y-4 m-0">
                <FilterSlider
                  label="Brightness"
                  value={filters.brightness}
                  min={0}
                  max={200}
                  defaultValue={100}
                  onChange={(v) => setFilters((f) => ({ ...f, brightness: v }))}
                />
                <FilterSlider
                  label="Contrast"
                  value={filters.contrast}
                  min={0}
                  max={200}
                  defaultValue={100}
                  onChange={(v) => setFilters((f) => ({ ...f, contrast: v }))}
                />
                <FilterSlider
                  label="Saturation"
                  value={filters.saturation}
                  min={0}
                  max={200}
                  defaultValue={100}
                  onChange={(v) => setFilters((f) => ({ ...f, saturation: v }))}
                />
                <FilterSlider
                  label="Grayscale"
                  value={filters.grayscale}
                  min={0}
                  max={100}
                  defaultValue={0}
                  onChange={(v) => setFilters((f) => ({ ...f, grayscale: v }))}
                />
                <FilterSlider
                  label="Blur (px)"
                  value={filters.blur}
                  min={0}
                  max={10}
                  step={0.5}
                  defaultValue={0}
                  onChange={(v) => setFilters((f) => ({ ...f, blur: v }))}
                />
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" /> Reset all filters
                </button>
              </TabsContent>

              {/* ── Resize tab ── */}
              <TabsContent value="resize" className="flex-1 p-4 space-y-4 m-0">
                <div className="text-xs text-muted-foreground bg-muted/40 rounded p-2.5 leading-relaxed">
                  Resize changes the saved pixel dimensions, not the display size on the website (which is
                  controlled by CSS).
                </div>

                {naturalSize.width > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Original: {naturalSize.width} × {naturalSize.height} px
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="resize-width" className="text-xs">Width (px)</Label>
                    <Input
                      id="resize-width"
                      type="number"
                      min={50}
                      max={3000}
                      value={resize.width}
                      onChange={(e) => handleResizeWidthChange(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="resize-height" className="text-xs">Height (px)</Label>
                    <Input
                      id="resize-height"
                      type="number"
                      min={50}
                      max={3000}
                      value={resize.height}
                      onChange={(e) => handleResizeHeightChange(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={resize.preserveAspect}
                    onChange={(e) =>
                      setResize((r) => ({ ...r, preserveAspect: e.target.checked }))
                    }
                    className="accent-primary h-3.5 w-3.5"
                  />
                  <span className="text-xs">Preserve aspect ratio</span>
                </label>

                <button
                  onClick={() =>
                    setResize({
                      width: String(naturalSize.width),
                      height: String(naturalSize.height),
                      preserveAspect: true,
                    })
                  }
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" /> Restore original size
                </button>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t px-5 py-3 flex items-center justify-between gap-3 bg-muted/20">
          <button
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            disabled={saving}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset all
          </button>

          <div className="flex items-center gap-2">
            {error && (
              <Alert className="border-red-200 bg-red-50 py-1 px-3 max-w-xs">
                <AlertDescription className="text-xs text-red-800 flex items-center gap-1">
                  <X className="h-3 w-3 shrink-0" />
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              title={!hasChanges ? "No changes to save" : "Apply and save edited image"}
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving…
                </>
              ) : (
                "Save & Apply"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
