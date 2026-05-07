/**
 * Florence Eternal — Section Inspector Components
 *
 * Provides a custom right-panel inspector for each Florence V2 section.
 * Registered via `florenceManifest.sectionInspectors` in manifest.ts.
 *
 * ── Why this file exists ──────────────────────────────────────────────────────
 * BuilderRightPanel is generic — it does not know about Florence-specific config
 * keys. All Florence-specific inspector UI lives here, owned by the template.
 *
 * ── Template authoring contract ──────────────────────────────────────────────
 * For a new V2 template, create a similar file at:
 *   client/src/templates/{name}/inspectors.tsx
 * Export your inspector components and register them in your manifest.ts via:
 *   sectionInspectors: { "iris-hero": IrisHeroInspector, ... }
 * BuilderRightPanel will pick them up automatically — no changes to builder code.
 */

import React, { useCallback } from "react";
import { useBuilderV2 } from "../../pages/builder-v2/BuilderV2Context";
import {
  FieldGroup,
  TextField,
  TextareaField,
  SelectField,
  SliderField,
  ToggleField,
  MilestoneEditor,
  VenueCardEditor,
  InfoNote,
  UploadImageButton,
} from "../../pages/builder-v2/components/InspectorControls";
import type { WeddingConfig } from "../types";

// ─── Shared styles (local copies — keeps inspectors.tsx self-contained) ───────
const HEADER_STYLE: React.CSSProperties = {
  padding:      "12px 14px",
  borderBottom: "1px solid #1F2937",
  flexShrink:   0,
};

const CONTENT_STYLE: React.CSSProperties = {
  flex:     1,
  padding:  "14px",
  overflowY: "auto",
};

// ─── Shared helpers ───────────────────────────────────────────────────────────
/** Creates an upload function for a specific template + category. */
function makeUploader(templateId: string, category: string) {
  return async (file: File): Promise<string> => {
    const token =
      localStorage.getItem("admin-token") ||
      localStorage.getItem("management-token") ||
      "";
    const fd = new FormData();
    fd.append("image", file);
    fd.append("category", category);
    const res = await fetch(`/api/templates/${templateId}/photos/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(err.error || "Upload failed");
    }
    const data = await res.json();
    return data.url as string;
  };
}

/** Returns false for javascript: and data: URLs (XSS prevention). */
function isSafeUrl(url: string): boolean {
  if (!url) return true;
  const l = url.trim().toLowerCase();
  return !l.startsWith("javascript:") && !l.startsWith("data:");
}

// ─── Inspector header (section title + subtitle) ──────────────────────────────
function InspectorHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={HEADER_STYLE}>
      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#E2E8F0", margin: 0 }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ fontSize: "0.65rem", color: "#64748B", margin: "2px 0 0" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── 1. Hero Inspector ────────────────────────────────────────────────────────
export function HeroInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;
  const templateId = state.templateId;

  const set = (key: string) => (val: string) =>
    updateConfig((c) => ({ ...c, [key]: val }));

  const setHero = (key: string) => (val: string) =>
    updateConfig((c) => ({ ...c, hero: { ...c.hero, [key]: val } }));

  const currentHeroImage: string = (cfg.hero?.images || [])[0] || "";
  const upload = useCallback(makeUploader(templateId, "hero"), [templateId]);

  const handleHeroUpload = async (file: File) => {
    const url = await upload(file);
    updateConfig((c) => ({ ...c, hero: { ...c.hero, images: [url] } }));
    return url;
  };

  return (
    <>
      <InspectorHeader title="Hero Section" subtitle="Full-screen opening section" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Couple Names">
          <TextField
            label="Groom Name"
            value={cfg.couple?.groomName || ""}
            onChange={(val) => updateConfig((c) => ({ ...c, couple: { ...c.couple, groomName: val } }))}
            placeholder="Alexander"
          />
          <TextField
            label="Bride Name"
            value={cfg.couple?.brideName || ""}
            onChange={(val) => updateConfig((c) => ({ ...c, couple: { ...c.couple, brideName: val } }))}
            placeholder="Rosalie"
          />
          <TextField
            label="Name Separator"
            value={cfg.nameSeparator ?? "&"}
            onChange={(val) => updateConfig((c) => ({ ...c, nameSeparator: val }))}
            placeholder="&"
          />
        </FieldGroup>
        <FieldGroup label="Content">
          <TextField
            label="Top Intro Line"
            value={cfg.heroIntro || ""}
            onChange={set("heroIntro")}
            placeholder="TOGETHER WITH THEIR FAMILIES"
          />
          <TextField
            label="Subtitle Line"
            value={cfg.heroSub || ""}
            onChange={set("heroSub")}
            placeholder="INVITE YOU TO CELEBRATE THEIR WEDDING"
          />
          <TextField
            label="Location Text"
            value={cfg.heroLocation || ""}
            onChange={set("heroLocation")}
            placeholder="FLORENCE, ITALY"
          />
        </FieldGroup>
        <FieldGroup label="Background Image">
          {currentHeroImage && (
            <div
              style={{
                width:        "100%",
                height:       "100px",
                borderRadius: "6px",
                overflow:     "hidden",
                marginBottom: "8px",
                background:   "#111827",
                border:       "1px solid #374151",
                position:     "relative",
              }}
            >
              <img
                src={currentHeroImage}
                alt="Hero background"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                type="button"
                onClick={() => updateConfig((c) => ({ ...c, hero: { ...c.hero, images: [] } }))}
                style={{
                  position:     "absolute",
                  top:          "4px",
                  right:        "4px",
                  background:   "rgba(0,0,0,0.7)",
                  border:       "none",
                  borderRadius: "4px",
                  color:        "#EF4444",
                  cursor:       "pointer",
                  padding:      "2px 6px",
                  fontSize:     "0.65rem",
                }}
              >
                ✕ Remove
              </button>
            </div>
          )}
          <UploadImageButton onUpload={handleHeroUpload} label="Upload Hero Background" />
          <TextField
            label="Or paste image URL"
            value={currentHeroImage}
            onChange={(val) =>
              updateConfig((c) => ({
                ...c,
                hero: { ...c.hero, images: val ? [val] : [] },
              }))
            }
            placeholder="https://… (leave blank for gradient)"
            monospace
          />
        </FieldGroup>
      </div>
    </>
  );
}

// ─── 2. Story Inspector ───────────────────────────────────────────────────────
export function StoryInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;
  const templateId = state.templateId;
  const set = (key: string) => (val: string) =>
    updateConfig((c) => ({ ...c, [key]: val }));

  const uploadStory = useCallback(makeUploader(templateId, "story"), [templateId]);

  const handleStoryImg = (idx: number) => async (file: File) => {
    const url = await uploadStory(file);
    updateConfig((c) => {
      const imgs = [...(c.photos?.images || [])];
      imgs[idx] = url;
      return { ...c, photos: { ...c.photos, images: imgs } };
    });
    return url;
  };

  return (
    <>
      <InspectorHeader title="Our Story" subtitle="Two-column story section" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Content">
          <TextField
            label="Section Heading"
            value={cfg.storyTitle || ""}
            onChange={set("storyTitle")}
            placeholder="Two paths. One forever."
          />
          <TextField
            label="Gold Italic Emphasis"
            value={cfg.storyTitleEmphasis ?? ""}
            onChange={set("storyTitleEmphasis")}
            placeholder="forever."
          />
          <TextareaField
            label="Story Paragraph"
            value={cfg.storyText || ""}
            onChange={set("storyText")}
            rows={4}
          />
          <TextField
            label="CTA Button Label"
            value={cfg.storyCtaLabel || ""}
            onChange={set("storyCtaLabel")}
            placeholder="READ OUR STORY"
          />
        </FieldGroup>
        <FieldGroup label="Monogram Card">
          <ToggleField
            label="Show Monogram"
            value={!(cfg.storyMonogramHidden === true)}
            onChange={(val) => updateConfig((c) => ({ ...c, storyMonogramHidden: !val }))}
          />
          <TextField
            label="Top Letter / Text"
            value={cfg.storyMonogramTop ?? "A"}
            onChange={(val) => updateConfig((c) => ({ ...c, storyMonogramTop: val }))}
            placeholder="A"
          />
          <TextField
            label="Bottom Letter / Text"
            value={cfg.storyMonogramBtm ?? "R"}
            onChange={(val) => updateConfig((c) => ({ ...c, storyMonogramBtm: val }))}
            placeholder="R"
          />
          <SliderField
            label="Opacity"
            value={typeof cfg.storyMonogramOpacity === "number" ? cfg.storyMonogramOpacity : 1}
            onChange={(val) => updateConfig((c) => ({ ...c, storyMonogramOpacity: val }))}
            min={0}
            max={1}
            step={0.05}
            unit=""
          />
        </FieldGroup>
        <FieldGroup label="Images">
          {/* Portrait image (index 0) */}
          {(cfg.photos?.images || [])[0] && (
            <div style={{ position: "relative", marginBottom: "8px" }}>
              <img
                src={(cfg.photos.images)[0]}
                alt="Portrait"
                style={{ width: "100%", height: "90px", objectFit: "cover", borderRadius: "6px", border: "1px solid #374151" }}
              />
              <button
                type="button"
                onClick={() => updateConfig((c) => {
                  const imgs = [...(c.photos?.images || [])];
                  imgs[0] = "";
                  return { ...c, photos: { ...c.photos, images: imgs } };
                })}
                style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "4px", color: "#EF4444", cursor: "pointer", padding: "2px 6px", fontSize: "0.65rem" }}
              >✕ Remove</button>
            </div>
          )}
          <UploadImageButton onUpload={handleStoryImg(0)} label="Upload Portrait Image" />
          <TextField
            label="Or paste portrait URL"
            value={(cfg.photos?.images || [])[0] || ""}
            onChange={(val) =>
              updateConfig((c) => {
                const imgs = [...(c.photos?.images || [])];
                imgs[0] = val;
                return { ...c, photos: { ...c.photos, images: imgs } };
              })
            }
            placeholder="https://…"
            monospace
          />

          {/* Secondary image (index 1) */}
          {(cfg.photos?.images || [])[1] && (
            <div style={{ position: "relative", marginBottom: "8px", marginTop: "12px" }}>
              <img
                src={(cfg.photos.images)[1]}
                alt="Secondary"
                style={{ width: "100%", height: "90px", objectFit: "cover", borderRadius: "6px", border: "1px solid #374151" }}
              />
              <button
                type="button"
                onClick={() => updateConfig((c) => {
                  const imgs = [...(c.photos?.images || [])];
                  imgs[1] = "";
                  return { ...c, photos: { ...c.photos, images: imgs } };
                })}
                style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "4px", color: "#EF4444", cursor: "pointer", padding: "2px 6px", fontSize: "0.65rem" }}
              >✕ Remove</button>
            </div>
          )}
          <UploadImageButton onUpload={handleStoryImg(1)} label="Upload Secondary Image" />
          <TextField
            label="Or paste secondary URL"
            value={(cfg.photos?.images || [])[1] || ""}
            onChange={(val) =>
              updateConfig((c) => {
                const imgs = [...(c.photos?.images || [])];
                imgs[1] = val;
                return { ...c, photos: { ...c.photos, images: imgs } };
              })
            }
            placeholder="https://…"
            monospace
          />
        </FieldGroup>
      </div>
    </>
  );
}

// ─── 3. Countdown Inspector ───────────────────────────────────────────────────
export function CountdownInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig;

  return (
    <>
      <InspectorHeader title="Countdown" subtitle="Live timer band section" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Content">
          <TextField
            label="Heading"
            value={cfg.countdown?.subtitle || ""}
            onChange={(val) =>
              updateConfig((c) => ({
                ...c,
                countdown: { ...c.countdown, subtitle: val },
              }))
            }
            placeholder="COUNTDOWN TO OUR BIG DAY"
          />
        </FieldGroup>
        <FieldGroup label="Counter Labels">
          {(["days", "hours", "minutes", "seconds"] as const).map((key) => (
            <TextField
              key={key}
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              value={cfg.countdown?.labels?.[key] || ""}
              onChange={(val) =>
                updateConfig((c) => ({
                  ...c,
                  countdown: {
                    ...c.countdown,
                    labels: { ...c.countdown?.labels, [key]: val },
                  },
                }))
              }
            />
          ))}
        </FieldGroup>
      </div>
    </>
  );
}

// ─── 4. Journey Inspector ─────────────────────────────────────────────────────
export function JourneyInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;

  return (
    <>
      <InspectorHeader title="Journey" subtitle="Milestone timeline" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Layout">
          <SelectField
            label="Timeline Direction"
            value={cfg.journeyLayout || "horizontal"}
            onChange={(val) => updateConfig((c) => ({ ...c, journeyLayout: val } as any))}
            options={[
              { value: "horizontal", label: "Horizontal" },
              { value: "vertical",   label: "Vertical" },
            ]}
          />
        </FieldGroup>
        <FieldGroup label="Headings">
          <TextField
            label="Section Label"
            value={cfg.timeline?.title || ""}
            onChange={(val) =>
              updateConfig((c) => ({ ...c, timeline: { ...c.timeline, title: val } }))
            }
          />
          <TextField
            label="Subheading"
            value={cfg.journeyHeading || ""}
            onChange={(val) => updateConfig((c) => ({ ...c, journeyHeading: val }))}
            placeholder="Every moment led us here."
          />
        </FieldGroup>
        <FieldGroup label="Milestones">
          <MilestoneEditor
            milestones={cfg.timeline?.events || []}
            onChange={(events) =>
              updateConfig((c) => ({ ...c, timeline: { ...c.timeline, events } }))
            }
          />
        </FieldGroup>
      </div>
    </>
  );
}

// ─── 5. Wedding Details Inspector ─────────────────────────────────────────────
export function DetailsInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig;

  return (
    <>
      <InspectorHeader title="Wedding Details" subtitle="4-card schedule section" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Section Label">
          <TextField
            label="Heading"
            value={cfg.locations?.sectionTitle || ""}
            onChange={(val) =>
              updateConfig((c) => ({
                ...c,
                locations: { ...c.locations, sectionTitle: val },
              }))
            }
          />
        </FieldGroup>
        <FieldGroup label="Cards">
          <VenueCardEditor
            venues={(cfg.locations?.venues || []) as any[]}
            onChange={(venues) =>
              updateConfig((c) => ({
                ...c,
                locations: { ...c.locations, venues: venues as any },
              }))
            }
          />
        </FieldGroup>
      </div>
    </>
  );
}

// ─── 6. Venue Inspector ───────────────────────────────────────────────────────
export function VenueInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;
  const set = (key: string) => (val: string) =>
    updateConfig((c) => ({ ...c, [key]: val }));

  return (
    <>
      <InspectorHeader title="Venue" subtitle="Two-column venue section" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Content">
          <TextField label="Section Label"  value={cfg.venueSubtitle || ""}    onChange={set("venueSubtitle")}    placeholder="THE VENUE" />
          <TextField label="Venue Name"     value={cfg.venueTitle || ""}       onChange={set("venueTitle")}       placeholder="Villa di Maiano" />
          <TextareaField label="Description" value={cfg.venueDescription || ""} onChange={set("venueDescription")} />
          <TextField label="CTA Button"     value={cfg.venueCtaLabel || ""}    onChange={set("venueCtaLabel")}    placeholder="VIEW VENUE" />
        </FieldGroup>
        <FieldGroup label="Address Card">
          <TextareaField
            label="Address"
            value={cfg.venueAddress || ""}
            onChange={set("venueAddress")}
            placeholder={"Via del Salviatino, 6\nFlorence, Italy"}
            rows={2}
          />
          <TextField
            label="Google Maps URL"
            value={cfg.venueMapUrl || ""}
            onChange={set("venueMapUrl")}
            placeholder="https://maps.google.com/…"
            monospace
          />
        </FieldGroup>
      </div>
    </>
  );
}

// ─── 7. Gallery Inspector ─────────────────────────────────────────────────────
export function GalleryInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig;
  const templateId = state.templateId;
  const galleryImages: string[] = (cfg.photos?.galleryImages as string[]) || [];

  const updateImages = (imgs: string[]) =>
    updateConfig((c) => ({ ...c, photos: { ...c.photos, galleryImages: imgs } }));

  const removeImage = (idx: number) =>
    updateImages(galleryImages.filter((_, i) => i !== idx));

  const setImage = (idx: number, val: string) => {
    const updated = [...galleryImages];
    updated[idx] = val;
    updateImages(updated);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const arr = [...galleryImages];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    updateImages(arr);
  };

  const moveDown = (idx: number) => {
    if (idx === galleryImages.length - 1) return;
    const arr = [...galleryImages];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    updateImages(arr);
  };

  const upload = useCallback(makeUploader(templateId, "gallery"), [templateId]);

  const handleUpload = async (file: File) => {
    const url = await upload(file);
    updateImages([...galleryImages, url]);
    return url;
  };

  const BTN_BASE: React.CSSProperties = {
    background:   "transparent",
    border:       "1px solid #374151",
    borderRadius: "4px",
    color:        "#9CA3AF",
    cursor:       "pointer",
    padding:      "3px 6px",
    fontSize:     "0.6rem",
    flexShrink:   0,
  };

  return (
    <>
      <InspectorHeader title="Gallery" subtitle="Horizontal image strip" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Section Heading">
          <TextField
            label="Title"
            value={cfg.photos?.title || ""}
            onChange={(val) =>
              updateConfig((c) => ({ ...c, photos: { ...c.photos, title: val } }))
            }
          />
        </FieldGroup>
        <FieldGroup label="Gallery Images">
          {galleryImages.map((src, idx) => (
            <div
              key={idx}
              style={{
                background:    "#1F2937",
                border:        "1px solid #374151",
                borderRadius:  "8px",
                padding:       "8px",
                display:       "flex",
                flexDirection: "column",
                gap:           "6px",
              }}
            >
              {src && (
                <div
                  style={{
                    width:        "100%",
                    height:       "70px",
                    borderRadius: "5px",
                    overflow:     "hidden",
                    background:   "#111827",
                  }}
                >
                  <img
                    src={src}
                    alt={`Gallery ${idx + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              )}
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <input
                  value={src}
                  onChange={(e) => setImage(idx, e.target.value)}
                  placeholder="https://…"
                  style={{
                    flex:         1,
                    background:   "#111827",
                    border:       "1px solid #374151",
                    borderRadius: "5px",
                    padding:      "4px 7px",
                    fontSize:     "0.68rem",
                    color:        "#F3F4F6",
                    outline:      "none",
                    fontFamily:   "monospace",
                    minWidth:     0,
                  }}
                />
                <button onClick={() => moveUp(idx)}   title="Move up"   style={BTN_BASE}>↑</button>
                <button onClick={() => moveDown(idx)} title="Move down" style={BTN_BASE}>↓</button>
                <button
                  onClick={() => removeImage(idx)}
                  title="Remove"
                  style={{ ...BTN_BASE, border: "1px solid #4B1C1C", color: "#EF4444" }}
                >✕</button>
              </div>
            </div>
          ))}
          <UploadImageButton onUpload={handleUpload} label="Upload & Add Image" />
          <button
            onClick={() => updateImages([...galleryImages, ""])}
            style={{
              background:   "transparent",
              border:       "1px dashed #374151",
              borderRadius: "6px",
              color:        "#6B7280",
              cursor:       "pointer",
              padding:      "6px",
              fontSize:     "0.68rem",
              width:        "100%",
            }}
          >
            + Add by URL
          </button>
        </FieldGroup>
      </div>
    </>
  );
}

// ─── 8. RSVP Inspector ────────────────────────────────────────────────────────
export function RsvpInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig;

  const setRsvp = (key: keyof WeddingConfig["rsvp"]) => (val: string) =>
    updateConfig((c) => ({ ...c, rsvp: { ...c.rsvp, [key]: val } }));

  const setForm = (key: keyof WeddingConfig["rsvp"]["form"]) => (val: string) =>
    updateConfig((c) => ({
      ...c,
      rsvp: { ...c.rsvp, form: { ...c.rsvp?.form, [key]: val } },
    }));

  const setMsg = (key: string) => (val: string) =>
    updateConfig((c) => ({
      ...c,
      rsvp: {
        ...c.rsvp,
        messages: { ...(c.rsvp as any)?.messages, [key]: val },
      },
    }));

  return (
    <>
      <InspectorHeader title="RSVP" subtitle="Response form section" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Section Content">
          <TextField      label="Title"       value={cfg.rsvp?.title || ""}       onChange={setRsvp("title")} />
          <TextareaField  label="Description" value={cfg.rsvp?.description || ""} onChange={setRsvp("description")} rows={3} />
        </FieldGroup>
        <FieldGroup label="Form Labels">
          <TextField label="First Name Label" value={cfg.rsvp?.form?.firstName || ""}    onChange={setForm("firstName")} />
          <TextField label="Last Name Label"  value={cfg.rsvp?.form?.lastName || ""}     onChange={setForm("lastName")} />
          <TextField label="Email Label"      value={cfg.rsvp?.form?.email || ""}        onChange={setForm("email")} />
          <TextField label="Attendance Label" value={cfg.rsvp?.form?.attendance || ""}   onChange={setForm("attendance")} />
          <TextField label="Yes Option"       value={cfg.rsvp?.form?.attendingYes || ""} onChange={setForm("attendingYes")} />
          <TextField label="No Option"        value={cfg.rsvp?.form?.attendingNo || ""}  onChange={setForm("attendingNo")} />
          <TextField label="Dietary Label"    value={cfg.rsvp?.form?.guestNames || ""}   onChange={setForm("guestNames")} />
          <TextField label="Submit Button"    value={cfg.rsvp?.form?.submitButton || ""} onChange={setForm("submitButton")} />
          <TextField
            label="Submitting Text"
            value={(cfg.rsvp?.form as any)?.submittingButton || ""}
            onChange={setForm("submittingButton" as any)}
          />
        </FieldGroup>
        <FieldGroup label="Response Messages">
          <TextareaField
            label="Success Message"
            value={(cfg.rsvp as any)?.messages?.success || ""}
            onChange={setMsg("success")}
            rows={2}
            placeholder="Thank you for your RSVP! We look forward to celebrating with you."
          />
          <TextareaField
            label="Error Message"
            value={(cfg.rsvp as any)?.messages?.error || ""}
            onChange={setMsg("error")}
            rows={2}
            placeholder="Something went wrong. Please try again."
          />
          <TextField
            label="Loading Message"
            value={(cfg.rsvp as any)?.messages?.loading || ""}
            onChange={setMsg("loading")}
            placeholder="Sending your RSVP..."
          />
        </FieldGroup>
        <InfoNote>
          ⚠ Submit logic, backend routing, and email notifications are locked and cannot be changed here.
        </InfoNote>
      </div>
    </>
  );
}

// ─── 9. Footer Inspector ─────────────────────────────────────────────────────
export function FooterInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;
  const set = (key: string) => (val: string) =>
    updateConfig((c) => ({ ...c, [key]: val }));
  const setFooter = (key: string) => (val: string) =>
    updateConfig((c) => ({ ...c, footer: { ...c.footer, [key]: val } }));
  const setEmail = (key: string) => (val: string) =>
    updateConfig((c) => ({ ...c, email: { ...c.email, [key]: val } }));

  const SOCIAL_LINKS: Array<{ key: string; label: string; placeholder: string }> = [
    { key: "socialInstagram", label: "Instagram", placeholder: "https://instagram.com/…" },
    { key: "socialFacebook",  label: "Facebook",  placeholder: "https://facebook.com/…" },
    { key: "socialEmail",     label: "Email",      placeholder: "mailto:you@example.com" },
    { key: "socialTelegram",  label: "Telegram",  placeholder: "https://t.me/…" },
    { key: "socialWhatsapp",  label: "WhatsApp",  placeholder: "https://wa.me/…" },
    { key: "socialPhone",     label: "Phone",     placeholder: "tel:+1234567890" },
    { key: "socialWebsite",   label: "Website",   placeholder: "https://yoursite.com" },
  ];

  return (
    <>
      <InspectorHeader title="Footer" subtitle="Bottom bar with tagline" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Content">
          <TextField
            label="Tagline"
            value={cfg.footer?.thankYouMessage || ""}
            onChange={setFooter("thankYouMessage")}
            placeholder="FOREVER STARTS HERE"
          />
          <TextField
            label="Sender Name (Email)"
            value={cfg.email?.senderName || ""}
            onChange={setEmail("senderName")}
          />
        </FieldGroup>
        <FieldGroup label="Social Links">
          {SOCIAL_LINKS.map(({ key, label, placeholder }) => {
            const val: string = cfg[key] || "";
            const unsafe = val && !isSafeUrl(val);
            return (
              <div key={key}>
                <label
                  style={{
                    display:       "block",
                    fontSize:      "0.65rem",
                    fontWeight:    600,
                    color:         "#9CA3AF",
                    marginBottom:  "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {label}
                </label>
                <input
                  value={val}
                  onChange={(e) => {
                    if (isSafeUrl(e.target.value)) set(key)(e.target.value);
                  }}
                  placeholder={placeholder}
                  style={{
                    width:        "100%",
                    background:   "#1F2937",
                    border:       `1px solid ${unsafe ? "#EF4444" : "#374151"}`,
                    borderRadius: "6px",
                    padding:      "5px 8px",
                    fontSize:     "0.72rem",
                    color:        "#F3F4F6",
                    outline:      "none",
                    fontFamily:   "monospace",
                    boxSizing:    "border-box",
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = unsafe
                      ? "#EF4444"
                      : "#6366F1";
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = unsafe
                      ? "#EF4444"
                      : "#374151";
                  }}
                />
                {unsafe && (
                  <p style={{ fontSize: "0.62rem", color: "#EF4444", margin: "3px 0 0" }}>
                    ⚠ Unsafe URL — use https://, mailto:, or tel:
                  </p>
                )}
              </div>
            );
          })}
          <InfoNote>Leave any social link blank to hide it from the footer.</InfoNote>
        </FieldGroup>
      </div>
    </>
  );
}
