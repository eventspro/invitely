/**
 * /demo/david-rose-romantic/edit/:editId
 * Backend-tracked 5-step wizard for the customer demo lead-capture flow.
 *
 * Steps:
 *   1. Names & Date        -- groomName, brideName, weddingDate
 *   2. Photos              -- hero image + gallery (uploaded to backend on Continue)
 *   3. Colors              -- 25 palette cards (paletteId saved to backend)
 *   4. Preview             -- live DemoPreview, no editing
 *   5. Email & Send        -- customerEmail (required), phone, instagram -> redirect to /done
 *
 * DEMO ONLY -- never writes to any live template or production config.
 */
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { DemoEditorProvider, useDemoEditor } from "@/features/demo-editor/DemoEditorContext";
import DemoPreview from "@/features/demo-editor/DemoPreview";
import { DEMO_PALETTES, getPaletteById } from "@/features/demo-editor/demoPalettes";
import { ArrowLeft, Eye, Upload, X, Check, Loader2, Phone } from "lucide-react";
import { SaleWheelModal } from "@/components/SaleWheelModal";

const TOTAL_STEPS = 5;
const STEP_META = [
  { label: "Names & Date", emoji: "\u{1F495}" },
  { label: "Photos",       emoji: "\u{1F4F8}" },
  { label: "Colors",       emoji: "\u{1F3A8}" },
  { label: "Preview",      emoji: "\u{1F441}" },
  { label: "Email & Send", emoji: "\u{1F48C}" },
];
const inputCls =
  "w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 " +
  "focus:outline-none focus:border-rose-400 focus:bg-white transition-colors placeholder:text-stone-300";

function StepShell({ step, title, subtitle, children }: { step: number; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-medium text-stone-400 mb-1">
          Step {step} of {TOTAL_STEPS} \u2014 {STEP_META[step - 1]?.emoji} {STEP_META[step - 1]?.label}
        </p>
        <h2 className="text-2xl font-bold text-stone-800 mb-1 leading-snug" style={{ fontFamily: "Playfair Display, serif" }}>
          {title}
        </h2>
        <p className="text-sm text-stone-500">{subtitle}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
        {hint && <span className="ml-1.5 text-xs font-normal text-stone-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

function PhotoUploadBox({ preview, placeholder, onUpload, onRemove }: { preview?: string; placeholder: string; onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; onRemove?: () => void }) {
  if (preview) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-stone-100" style={{ aspectRatio: "16/9" }}>
        <img src={preview} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
          <label className="bg-white text-stone-700 text-xs px-3 py-1.5 rounded-lg cursor-pointer font-medium shadow">
            Change
            <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </label>
          {onRemove && (
            <button onClick={onRemove} className="bg-white text-red-500 text-xs px-3 py-1.5 rounded-lg font-medium shadow">
              Remove
            </button>
          )}
        </div>
      </div>
    );
  }
  return (
    <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 cursor-pointer hover:border-rose-300 hover:bg-rose-50/30 transition-colors py-8">
      <Upload size={20} className="text-stone-300" />
      <span className="text-sm text-stone-400">{placeholder}</span>
      <span className="text-xs text-stone-300">or skip to use the default photo</span>
      <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
    </label>
  );
}

/** Gallery thumbnail with drag-to-crop and delete button. */
function DraggableGalleryItem({ src, position, onRemove, onPositionChange }: {
  src: string; position: number; onRemove: () => void; onPositionChange: (pos: number) => void;
}) {
  function startDrag(startClientY: number, startPos: number) {
    function onMove(ev: MouseEvent | TouchEvent) {
      const y = 'touches' in ev ? (ev as TouchEvent).touches[0].clientY : (ev as MouseEvent).clientY;
      onPositionChange(Math.max(0, Math.min(100, startPos + (y - startClientY))));
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  }
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden bg-stone-100 group">
      <img src={src} alt="" className="w-full h-full object-cover pointer-events-none"
        style={{ objectPosition: `center ${position}%` }} />
      <button type="button"
        className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs z-10 hover:bg-red-500 transition-colors"
        onClick={onRemove}>
        ×
      </button>
      <div
        className="absolute inset-x-0 bottom-0 flex justify-center pb-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-ns-resize select-none"
        onMouseDown={e => { e.preventDefault(); startDrag(e.clientY, position); }}
        onTouchStart={e => { e.preventDefault(); startDrag(e.touches[0].clientY, position); }}
        title="Drag up/down to adjust crop">
        <span className="bg-black/50 text-white rounded px-1.5 py-0.5 text-[9px] leading-tight">↕ crop</span>
      </div>
    </div>
  );
}

function NamesStep({ groomName, brideName, weddingDate, separator, onChange }: {
  groomName: string; brideName: string; weddingDate: string; separator: string;
  onChange: (fields: { groomName?: string; brideName?: string; weddingDate?: string; separator?: string }) => void;
}) {
  const { updateConfig } = useDemoEditor();

  function handleGroom(val: string) {
    onChange({ groomName: val });
    updateConfig({ couple: { groomName: val, brideName, combinedNames: `${val} & ${brideName}` } });
  }
  function handleBride(val: string) {
    onChange({ brideName: val });
    updateConfig({ couple: { groomName, brideName: val, combinedNames: `${groomName} & ${val}` } });
  }
  function handleDate(val: string) {
    onChange({ weddingDate: val });
    if (val) {
      const d = new Date(val + "T12:00:00");
      const displayDate = d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const month = d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
      const day = String(d.getDate());
      updateConfig({ wedding: { date: val + "T16:00:00", displayDate, month, day } });
    }
  }
  function handleSeparator(val: string) {
    onChange({ separator: val });
    updateConfig({ footer: { separator: val } });
  }

  return (
    <StepShell step={1} title="Let's start with your names" subtitle="These will appear on your wedding website.">
      <Field label="Partner 1 name">
        <input type="text" className={inputCls} value={groomName} placeholder="e.g. David" onChange={e => handleGroom(e.target.value)} />
      </Field>
      <Field label="Name separator" hint="shown between names">
        <input type="text" className={inputCls} value={separator} placeholder="e.g. & or and or ♥" onChange={e => handleSeparator(e.target.value)} />
      </Field>
      <Field label="Partner 2 name">
        <input type="text" className={inputCls} value={brideName} placeholder="e.g. Rose" onChange={e => handleBride(e.target.value)} />
      </Field>
      <Field label="Wedding date">
        <input type="date" className={inputCls} value={weddingDate} onChange={e => handleDate(e.target.value)} />
      </Field>
    </StepShell>
  );
}

type PhotoPreviews = { heroPrev?: string; galleryPrevs: string[] };

function PhotosStep({ previews, galleryPositions, onHeroChange, onGalleryAdd, onGalleryRemove, onPositionChange }: {
  previews: PhotoPreviews;
  galleryPositions: number[];
  onHeroChange: (file: File | null, preview?: string) => void;
  onGalleryAdd: (files: File[], previews: string[]) => void;
  onGalleryRemove: (idx: number) => void;
  onPositionChange: (idx: number, pos: number) => void;
}) {
  // Blob URLs (not data URLs) so CSS background-image in hero-section works for large photos
  function handleHeroSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    onHeroChange(file, URL.createObjectURL(file));
  }

  function handleGallerySelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    onGalleryAdd(files, files.map(f => URL.createObjectURL(f)));
  }

  return (
    <StepShell step={2} title="Add your favorite photos" subtitle="Upload your photos or skip to use the defaults.">
      <Field label="Main photo" hint="(hero background)">
        <PhotoUploadBox
          preview={previews.heroPrev}
          placeholder="Upload main photo"
          onUpload={handleHeroSelect}
          onRemove={previews.heroPrev ? () => onHeroChange(null) : undefined}
        />
      </Field>
      <Field label="Gallery photos" hint="(optional, up to 10)">
        {previews.galleryPrevs.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {previews.galleryPrevs.map((src, i) => (
              <DraggableGalleryItem
                key={i}
                src={src}
                position={galleryPositions[i] ?? 50}
                onRemove={() => onGalleryRemove(i)}
                onPositionChange={pos => onPositionChange(i, pos)}
              />
            ))}
          </div>
        )}
        <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-stone-200 rounded-xl text-stone-400 text-sm cursor-pointer hover:border-rose-300 hover:text-rose-500 transition-colors">
          <Upload size={15} /> Add photos
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleGallerySelect} />
        </label>
        <p className="text-xs text-stone-400 mt-2">
          Photos will be uploaded when you continue to the next step.
        </p>
      </Field>
    </StepShell>
  );
}

function ColorsStep({ paletteId, onChange }: { paletteId: string; onChange: (id: string) => void }) {
  const { updateConfig } = useDemoEditor();

  function selectPalette(id: string) {
    const palette = getPaletteById(id);
    if (!palette) return;
    onChange(id);
    updateConfig({ theme: { colors: palette.colors } });
  }

  return (
    <StepShell step={3} title="Choose your color palette" subtitle="Pick a style that feels right for your wedding.">
      <div className="grid grid-cols-2 gap-3">
        {DEMO_PALETTES.map((palette) => {
          const active = palette.id === paletteId;
          return (
            <button
              key={palette.id}
              onClick={() => selectPalette(palette.id)}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                active ? "border-rose-400 shadow-sm bg-rose-50/30" : "border-stone-200 hover:border-stone-300 bg-white"
              }`}
            >
              {active && (
                <span className="absolute top-2.5 right-2.5 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                  <Check size={11} />
                </span>
              )}
              <div className="flex gap-1.5 mb-2.5">
                {[palette.colors.primary, palette.colors.secondary, palette.colors.background].map((c) => (
                  <div key={c} className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ background: c }} />
                ))}
              </div>
              <span className="text-xs font-semibold text-stone-700 leading-tight block">{palette.name}</span>
              <span className="text-[10px] text-stone-400 leading-tight">{palette.mood}</span>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}

function PreviewStep() {
  return (
    <StepShell step={4} title="Here's your preview" subtitle="Review your wedding website before sending.">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-sm text-amber-700 leading-relaxed">
          <strong>Demo mode:</strong> This preview is not a live wedding website and cannot be shared publicly. The 4ever.am team will set up your real website.
        </p>
      </div>
      <div className="sm:hidden rounded-xl overflow-hidden border border-stone-200" style={{ height: "400px", overflowY: "auto" }}>
        <DemoPreview mode="mobile" />
      </div>
      <p className="text-xs text-stone-400">
        Happy with how it looks? Send it to the 4ever.am team and they will get your real website ready.
      </p>
    </StepShell>
  );
}

function EmailStep({ email, phone, instagram, onChange, error }: {
  email: string; phone: string; instagram: string;
  onChange: (fields: { email?: string; phone?: string; instagram?: string }) => void;
  error?: string;
}) {
  return (
    <StepShell step={5} title="Almost done! Send your demo" subtitle="Leave your contact details and we will reach out to create your real website.">
      {error && <ErrorBanner message={error} />}
      <Field label="Your email" required>
        <input type="email" className={inputCls} value={email} placeholder="you@example.com"
          onChange={e => onChange({ email: e.target.value })} />
      </Field>
      <Field label="Phone number" hint="(optional)">
        <input type="tel" className={inputCls} value={phone} placeholder="+374 XX XXX XXX"
          onChange={e => onChange({ phone: e.target.value })} />
      </Field>
      <Field label="Instagram" hint="(optional)">
        <input type="text" className={inputCls} value={instagram} placeholder="@yourhandle"
          onChange={e => onChange({ instagram: e.target.value })} />
      </Field>
      <div className="bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-xs text-stone-500">
        By continuing you agree to be contacted by the 4ever.am team about your wedding website. We will not share your details.
      </div>
    </StepShell>
  );
}

function WizardLayout({ editId }: { editId: string }) {
  const [, navigate] = useLocation();
  const { updateConfig, applyCustomerPatch, baseLoaded } = useDemoEditor();

  const [step, setStep] = useState(1);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showExitMenu, setShowExitMenu] = useState(false);
  const [showSaleWheel, setShowSaleWheel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [separator, setSeparator] = useState("&");

  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPrev, setHeroPrev] = useState<string | undefined>();
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPrevs, setGalleryPrevs] = useState<string[]>([]);
  const [galleryPositions, setGalleryPositions] = useState<number[]>([]);

  const [paletteId, setPaletteId] = useState("romantic-rose");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");

  useEffect(() => {
    fetch(`/api/demo/customer-edits/${editId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: Record<string, unknown>) => {
        if (data.groomName) setGroomName(data.groomName as string);
        if (data.brideName) setBrideName(data.brideName as string);
        if (data.weddingDate) setWeddingDate(data.weddingDate as string);
        if ((data.config as any)?.footer?.separator) setSeparator((data.config as any).footer.separator);
        if (data.paletteId) {
          const pid = data.paletteId as string;
          setPaletteId(pid);
        }
        if (data.customerEmail) setEmail(data.customerEmail as string);
        if (data.customerPhone) setPhone(data.customerPhone as string);
        if (data.customerInstagram) setInstagram(data.customerInstagram as string);
        if (data.heroImageUrl) setHeroPrev(data.heroImageUrl as string);
        if (Array.isArray(data.galleryImageUrls)) setGalleryPrevs(data.galleryImageUrls as string[]);

        // Build a patch from everything the customer has changed, and apply on top of the real base config
        const patch: Record<string, unknown> = {};
        const gn = (data.groomName as string) ?? "";
        const bn = (data.brideName as string) ?? "";
        const sep = (data.config as any)?.footer?.separator;
        if (gn || bn) patch.couple = { groomName: gn, brideName: bn, combinedNames: `${gn} & ${bn}` };
        if (data.weddingDate) {
          const val = data.weddingDate as string;
          const d = new Date(val + "T12:00:00");
          const displayDate = d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
          const month = d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
          const day = String(d.getDate());
          patch.wedding = { date: val + "T16:00:00", displayDate, month, day };
        }
        if (data.paletteId) {
          const palette = getPaletteById(data.paletteId as string);
          if (palette) patch.theme = { colors: palette.colors };
        }
        if (data.heroImageUrl) patch.hero = { images: [data.heroImageUrl as string] };
        const savedPositions = (data.config as any)?.photos?.imagePositions as number[] | undefined;
        if (savedPositions?.length) setGalleryPositions(savedPositions);
        if (Array.isArray(data.galleryImageUrls) && (data.galleryImageUrls as string[]).length > 0) {
          patch.photos = {
            images: data.galleryImageUrls as string[],
            ...(savedPositions?.length ? { imagePositions: savedPositions } : {}),
          };
        }
        if (sep) patch.footer = { separator: sep };
        if (Object.keys(patch).length > 0) applyCustomerPatch(patch);
      })
      .catch(() => {/* new record — base config already shown */})
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  function handlePositionChange(idx: number, pos: number) {
    setGalleryPositions(prev => {
      const next = [...prev];
      next[idx] = pos;
      updateConfig({ photos: { imagePositions: next } });
      return next;
    });
  }

  async function patchRecord(body: Record<string, unknown>) {
    const res = await fetch(`/api/demo/customer-edits/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Failed to save. Please try again.");
  }

  async function uploadHero(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("hero", file);
    const res = await fetch(`/api/demo/customer-edits/${editId}/upload-hero`, { method: "POST", body: fd });
    if (!res.ok) throw new Error("Hero image upload failed.");
    const data = await res.json() as { url: string };
    return data.url;
  }

  async function uploadGallery(files: File[]): Promise<string[]> {
    const fd = new FormData();
    files.forEach(f => fd.append("gallery", f));
    const res = await fetch(`/api/demo/customer-edits/${editId}/upload-gallery`, { method: "POST", body: fd });
    if (!res.ok) throw new Error("Gallery upload failed.");
    const data = await res.json() as { urls: string[] };
    return data.urls;
  }

  async function handleContinue() {
    setStepError(null);
    setIsSaving(true);
    try {
      if (step === 1) {
        await patchRecord({ groomName, brideName, weddingDate: weddingDate || null, config: { footer: { separator } } });
      } else if (step === 2) {
        let currentHeroUrl = heroPrev;
        let currentGalleryUrls = galleryPrevs;
        if (heroFile) {
          currentHeroUrl = await uploadHero(heroFile);
          setHeroPrev(currentHeroUrl);
          setHeroFile(null);
          updateConfig({ hero: { images: [currentHeroUrl] } });
        }
        const pendingGallery = galleryFiles.filter(f => !!f);
        if (pendingGallery.length > 0) {
          const newUrls = await uploadGallery(pendingGallery);
          currentGalleryUrls = [...currentGalleryUrls.filter(u => !u.startsWith("data:")), ...newUrls].slice(0, 10);
          setGalleryPrevs(currentGalleryUrls);
          setGalleryFiles([]);
          updateConfig({ photos: { images: currentGalleryUrls } });
        }
        await patchRecord({ heroImageUrl: currentHeroUrl ?? null, galleryImageUrls: currentGalleryUrls, config: { photos: { imagePositions: galleryPositions } } });
      } else if (step === 3) {
        await patchRecord({ paletteId });
      } else if (step === 4) {
        // Preview step -- no save needed
      } else if (step === 5) {
        if (!email.trim()) { setStepError("Please enter your email address."); setIsSaving(false); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setStepError("Please enter a valid email address."); setIsSaving(false); return; }
        await patchRecord({ customerEmail: email.trim(), customerPhone: phone.trim() || null, customerInstagram: instagram.trim() || null, status: "demo" });
        navigate(`/demo/david-rose-romantic/edit/${editId}/done`);
        return;
      }
      setStep(s => Math.min(s + 1, TOTAL_STEPS));
    } catch (err) {
      setStepError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleBack() {
    if (step > 1) setStep(s => s - 1);
    else navigate("/demo/david-rose-romantic");
  }

  const isLastStep = step === TOTAL_STEPS;

  if (isLoading || !baseLoaded) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "#faf8f4" }}>
        <Loader2 size={28} className="text-rose-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: "#faf8f4", fontFamily: "Inter, sans-serif" }}>
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-stone-200 sticky top-0 z-30 shrink-0">
        <button onClick={() => setShowExitMenu(true)} className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 text-sm transition-colors">
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">Menu</span>
        </button>
        <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-amber-200">
          Demo mode
        </span>
        <div className="flex-1" />
        <span className="hidden sm:inline text-xs text-stone-400">
          {STEP_META[step - 1]?.emoji} Step {step} of {TOTAL_STEPS} \u2014 {STEP_META[step - 1]?.label}
        </span>
        <span className="sm:hidden text-xs text-stone-400">{step}/{TOTAL_STEPS}</span>
        <button onClick={() => setShowPreviewModal(true)} className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 text-xs">
          <Eye size={12} /> Preview
        </button>
      </header>

      <div className="h-1 bg-stone-100 shrink-0">
        <div className="h-full bg-rose-400 transition-all duration-500" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col w-full sm:w-[420px] sm:max-w-[420px] shrink-0 bg-white border-r border-stone-100 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-8">
            {step === 1 && (
              <NamesStep groomName={groomName} brideName={brideName} weddingDate={weddingDate} separator={separator}
                onChange={f => { if (f.groomName !== undefined) setGroomName(f.groomName); if (f.brideName !== undefined) setBrideName(f.brideName); if (f.weddingDate !== undefined) setWeddingDate(f.weddingDate); if (f.separator !== undefined) setSeparator(f.separator); }} />
            )}
            {step === 2 && (
              <PhotosStep
                previews={{ heroPrev, galleryPrevs }}
                galleryPositions={galleryPositions}
                onPositionChange={handlePositionChange}
                onHeroChange={(file, prev) => {
                  setHeroFile(file);
                  if (prev) {
                    setHeroPrev(prev);
                    updateConfig({ hero: { images: [prev] } });
                  } else {
                    setHeroPrev(undefined);
                    updateConfig({ hero: { images: [] } });
                  }
                }}
                onGalleryAdd={(files, prevs) => {
                  setGalleryFiles(prev => [...prev, ...files].slice(0, 10));
                  setGalleryPositions(prev => [...prev, ...files.map(() => 50)].slice(0, 10));
                  setGalleryPrevs(prev => {
                    const next = [...prev, ...prevs].slice(0, 10);
                    updateConfig({ photos: { images: next } });
                    return next;
                  });
                }}
                onGalleryRemove={idx => {
                  setGalleryFiles(p => p.filter((_, i) => i !== idx));
                  setGalleryPositions(p => p.filter((_, i) => i !== idx));
                  setGalleryPrevs(p => {
                    const next = p.filter((_, i) => i !== idx);
                    updateConfig({ photos: { images: next } });
                    return next;
                  });
                }}
              />
            )}
            {step === 3 && <ColorsStep paletteId={paletteId} onChange={setPaletteId} />}
            {step === 4 && <PreviewStep />}
            {step === 5 && (
              <EmailStep email={email} phone={phone} instagram={instagram}
                onChange={f => { if (f.email !== undefined) setEmail(f.email); if (f.phone !== undefined) setPhone(f.phone); if (f.instagram !== undefined) setInstagram(f.instagram); }}
                error={stepError ?? undefined} />
            )}
          </div>

          <div className="shrink-0 bg-white border-t border-stone-100 px-6 py-4 flex items-center gap-3">
            {step > 1 && (
              <button onClick={handleBack} disabled={isSaving} className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors disabled:opacity-50">
                \u2190 Back
              </button>
            )}
            <button onClick={handleContinue} disabled={isSaving}
              className="flex-[2] py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "#9f1239" }}>
              {isSaving
                ? <><Loader2 size={15} className="animate-spin" /> Saving\u2026</>
                : isLastStep ? "Send My Demo \u2192" : "Continue \u2192"}
            </button>
          </div>
        </div>

        <div className="hidden sm:flex flex-1 overflow-auto bg-stone-100 flex-col items-center p-6 gap-3">
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 self-stretch justify-center">
            <span className="font-semibold">Demo preview</span>
            <span className="text-amber-400">\u00B7</span>
            This is not a live website and cannot be shared publicly
          </div>
          <div className="w-full">
            <DemoPreview />
          </div>
        </div>
      </div>

      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-white shrink-0">
            <div>
              <span className="font-semibold text-sm text-stone-700">Preview</span>
              <span className="ml-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Demo only</span>
            </div>
            <button onClick={() => setShowPreviewModal(false)} className="text-stone-400 p-1"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto bg-stone-100">
            <DemoPreview mode="desktop" />
          </div>
        </div>
      )}

      {/* ── Exit menu popup ── */}
      {showExitMenu && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowExitMenu(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 overflow-hidden max-h-[92dvh] overflow-y-auto">
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-stone-200" />
            </div>

            <div className="px-6 pb-8 pt-3 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-bold text-stone-800" style={{ fontFamily: "Playfair Display, serif" }}>4ever.am</p>
                  <p className="text-xs text-stone-400 mt-0.5">Digital wedding invitations</p>
                </div>
                <button onClick={() => setShowExitMenu(false)} className="text-stone-300 hover:text-stone-500 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Contact us</p>
                <div className="grid grid-cols-3 gap-2">
                  <a href="https://instagram.com/4ever.am" target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border border-stone-200 text-stone-600 hover:border-rose-300 hover:bg-rose-50/40 transition-colors">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#E1306C]">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span className="text-[11px] font-medium">Instagram</span>
                  </a>
                  <a href="https://t.me/4everam" target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border border-stone-200 text-stone-600 hover:border-blue-300 hover:bg-blue-50/40 transition-colors">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#2AABEE]">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    <span className="text-[11px] font-medium">Telegram</span>
                  </a>
                  <a href="tel:+37400000000"
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border border-stone-200 text-stone-600 hover:border-green-300 hover:bg-green-50/40 transition-colors">
                    <Phone size={18} className="text-green-600" />
                    <span className="text-[11px] font-medium">Call us</span>
                  </a>
                </div>
              </div>

              {/* Spin & Win */}
              <button
                onClick={() => { setShowExitMenu(false); setShowSaleWheel(true); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors text-left"
              >
                <span className="text-2xl">🎡</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Spin & Win a Discount</p>
                  <p className="text-xs text-amber-600 mt-0.5">Try your luck — win up to 20% off</p>
                </div>
              </button>

              {/* Planner intro */}
              <div className="rounded-2xl border border-stone-200 overflow-hidden">
                <div className="bg-[#0f2d22] px-4 py-3 flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <p className="text-sm font-semibold text-white">Wedding Planner</p>
                  <span className="ml-auto text-[10px] font-bold text-[#f0cf82] bg-[#f0cf82]/15 border border-[#f0cf82]/30 rounded-full px-2 py-0.5">NEW</span>
                </div>
                <div className="px-4 py-3 bg-white">
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Manage your entire wedding in one place — guests, budget, tasks, and timeline. Built for Armenian couples.
                  </p>
                  <a href="/planner-prototype" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2.5 text-xs font-semibold text-[#173c2d] hover:text-[#0f2d22] transition-colors">
                    Explore the planner →
                  </a>
                </div>
              </div>

              {/* Go to homepage */}
              <a href="/"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors">
                ← Go to Homepage
              </a>
            </div>
          </div>
        </div>
      )}

      {showSaleWheel && <SaleWheelModal onClose={() => setShowSaleWheel(false)} />}
    </div>
  );
}

export default function DemoEditorPage() {
  const params = useParams<{ editId: string }>();
  const [, navigate] = useLocation();

  if (!params.editId) {
    navigate("/demo/david-rose-romantic");
    return null;
  }

  return (
    <DemoEditorProvider>
      <WizardLayout editId={params.editId} />
    </DemoEditorProvider>
  );
}
