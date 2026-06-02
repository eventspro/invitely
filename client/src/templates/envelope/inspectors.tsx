/**
 * Envelope Romance — Section Inspector Components
 *
 * Custom right-panel inspectors for each Envelope Romance V2 section.
 * Registered via envelopeManifest.sectionInspectors in manifest.ts.
 */

import React, { useCallback } from "react";
import { useBuilderV2 } from "../../pages/builder-v2/BuilderV2Context";
import {
  FieldGroup,
  TextField,
  TextareaField,
  ToggleField,
  ColorField,
  MilestoneEditor,
  VenueCardEditor,
  InfoNote,
  UploadImageButton,
  DateField,
} from "../../pages/builder-v2/components/InspectorControls";

// ─── Shared layout styles ─────────────────────────────────────────────────────
const HEADER_STYLE: React.CSSProperties = {
  padding:      "12px 14px",
  borderBottom: "1px solid #1F2937",
  flexShrink:   0,
};

const CONTENT_STYLE: React.CSSProperties = {
  flex:      1,
  padding:   "14px",
  overflowY: "auto",
};

// ─── Upload helper ────────────────────────────────────────────────────────────
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
      throw new Error((err as any).error || "Upload failed");
    }
    const data = await res.json() as { url: string };
    return data.url;
  };
}

// ─── Inspector header ─────────────────────────────────────────────────────────
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

// ─── Image preview with remove ────────────────────────────────────────────────
function ImagePreview({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div style={{ position: "relative", marginBottom: "8px" }}>
      <img
        src={src}
        alt="Preview"
        style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "6px", border: "1px solid #374151" }}
      />
      <button
        type="button"
        onClick={onRemove}
        style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "4px", color: "#EF4444", cursor: "pointer", padding: "2px 6px", fontSize: "0.65rem" }}
      >
        ✕ Remove
      </button>
    </div>
  );
}

// ─── 1. Envelope Inspector ────────────────────────────────────────────────────
export function EnvelopeInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;

  return (
    <>
      <InspectorHeader title="Opening Envelope" subtitle="Animated intro overlay" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Text Content">
          <TextField
            label="Invitation Text"
            value={cfg.envelopeTitle ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, envelopeTitle: v }))}
            placeholder="You are cordially invited"
          />
          <TextField
            label="Wax Seal Initials"
            value={cfg.envelopeInitials ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, envelopeInitials: v }))}
            placeholder="A & I"
          />
          <TextField
            label="Open Button Label"
            value={cfg.envelopeOpenCta ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, envelopeOpenCta: v }))}
            placeholder="Open Your Invitation"
          />
          <TextField
            label="Skip Button Label"
            value={cfg.envelopeSkipLabel ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, envelopeSkipLabel: v }))}
            placeholder="Skip"
          />
          <TextField
            label="Envelope Subtitle"
            value={cfg.envelopeSubtitle ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, envelopeSubtitle: v }))}
            placeholder="A Private Invitation"
          />
        </FieldGroup>
        <FieldGroup label="Colors">
          <ColorField
            label="Background Color"
            value={cfg.envelopeBgColor ?? "#FFF9EF"}
            onChange={(v) => updateConfig((c) => ({ ...c, envelopeBgColor: v }))}
          />
          <ColorField
            label="Paper / Card Color"
            value={cfg.envelopePaperColor ?? "#FFFFFF"}
            onChange={(v) => updateConfig((c) => ({ ...c, envelopePaperColor: v }))}
          />
          <ColorField
            label="Wax Seal / Gold Color"
            value={cfg.envelopeGoldColor ?? "#C9A45C"}
            onChange={(v) => updateConfig((c) => ({ ...c, envelopeGoldColor: v }))}
          />
        </FieldGroup>
        <FieldGroup label="Animation">
          <ToggleField
            label="Animation Enabled"
            value={cfg.animationEnabled !== false}
            onChange={(v) => updateConfig((c) => ({ ...c, animationEnabled: v }))}
          />
          <InfoNote>
            When disabled, the envelope skips directly to the invitation. In the builder the envelope overlay is always bypassed for editing.
          </InfoNote>
        </FieldGroup>
      </div>
    </>
  );
}

// ─── 2. Hero Inspector ────────────────────────────────────────────────────────
export function HeroInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;
  const templateId = state.templateId;

  const upload = useCallback(makeUploader(templateId, "hero"), [templateId]);

  const handleHeroUpload = async (file: File) => {
    const url = await upload(file);
    updateConfig((c) => ({ ...c, hero: { ...(c.hero || {}), images: [url] } }));
    return url;
  };

  const currentHeroImage: string = (cfg.hero?.images || [])[0] || "";

  return (
    <>
      <InspectorHeader title="Hero" subtitle="Full-height opening section" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Couple Names">
          <TextField
            label="Groom Name"
            value={cfg.couple?.groomName ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, couple: { ...c.couple, groomName: v } }))}
            placeholder="Alexander"
          />
          <TextField
            label="Bride Name"
            value={cfg.couple?.brideName ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, couple: { ...c.couple, brideName: v } }))}
            placeholder="Isabella"
          />
          <TextField
            label="Combined Names"
            value={cfg.couple?.combinedNames ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, couple: { ...c.couple, combinedNames: v } }))}
            placeholder="Alexander & Isabella"
          />
        </FieldGroup>
        <FieldGroup label="Hero Content">
          <TextField
            label="Tagline (italic subtitle)"
            value={cfg.heroTagline ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, heroTagline: v }))}
            placeholder="A love story written in the stars"
          />
          <TextField
            label="Location"
            value={cfg.heroLocation ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, heroLocation: v }))}
            placeholder="Grand Estate, Florence"
          />
          <TextField
            label="Invitation Line"
            value={cfg.hero?.invitation ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, hero: { ...(c.hero || {}), invitation: v } }))}
            placeholder="TOGETHER WITH THEIR FAMILIES"
          />
        </FieldGroup>
        <FieldGroup label="Wedding Date">
          <DateField
            label="Date"
            value={cfg.wedding?.date ?? ""}
            onChange={(iso, display) =>
              updateConfig((c) => ({
                ...c,
                wedding: { ...c.wedding, date: iso, displayDate: display },
              }))
            }
          />
        </FieldGroup>
        <FieldGroup label="Background Image">
          {currentHeroImage && (
            <ImagePreview
              src={currentHeroImage}
              onRemove={() => updateConfig((c) => ({ ...c, hero: { ...(c.hero || {}), images: [] } }))}
            />
          )}
          <UploadImageButton onUpload={handleHeroUpload} label="Upload Hero Background" />
          <TextField
            label="Or paste image URL"
            value={currentHeroImage}
            onChange={(v) => updateConfig((c) => ({ ...c, hero: { ...(c.hero || {}), images: v ? [v] : [] } }))}
            placeholder="https://… (leave blank for gradient)"
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
  const cfg = state.draftConfig as any;

  return (
    <>
      <InspectorHeader title="Countdown" subtitle="Live countdown to the wedding day" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Content">
          <TextField
            label="Subtitle"
            value={cfg.countdown?.subtitle ?? ""}
            onChange={(v) =>
              updateConfig((c) => ({ ...c, countdown: { ...c.countdown, subtitle: v } }))
            }
            placeholder="UNTIL WE SAY I DO"
          />
        </FieldGroup>
        <FieldGroup label="Labels">
          <TextField
            label="Days Label"
            value={cfg.countdown?.labels?.days ?? ""}
            onChange={(v) =>
              updateConfig((c) => ({
                ...c,
                countdown: { ...c.countdown, labels: { ...c.countdown?.labels, days: v } },
              }))
            }
            placeholder="DAYS"
          />
          <TextField
            label="Hours Label"
            value={cfg.countdown?.labels?.hours ?? ""}
            onChange={(v) =>
              updateConfig((c) => ({
                ...c,
                countdown: { ...c.countdown, labels: { ...c.countdown?.labels, hours: v } },
              }))
            }
            placeholder="HRS"
          />
          <TextField
            label="Minutes Label"
            value={cfg.countdown?.labels?.minutes ?? ""}
            onChange={(v) =>
              updateConfig((c) => ({
                ...c,
                countdown: { ...c.countdown, labels: { ...c.countdown?.labels, minutes: v } },
              }))
            }
            placeholder="MIN"
          />
          <TextField
            label="Seconds Label"
            value={cfg.countdown?.labels?.seconds ?? ""}
            onChange={(v) =>
              updateConfig((c) => ({
                ...c,
                countdown: { ...c.countdown, labels: { ...c.countdown?.labels, seconds: v } },
              }))
            }
            placeholder="SEC"
          />
        </FieldGroup>
        <FieldGroup label="Visibility">
          <ToggleField
            label="Show Countdown"
            value={cfg.sections?.countdown?.enabled !== false}
            onChange={(v) =>
              updateConfig((c) => ({
                ...c,
                sections: { ...(c.sections || {}), countdown: { ...(c.sections?.countdown || {}), enabled: v } },
              }))
            }
          />
        </FieldGroup>
      </div>
    </>
  );
}

// ─── 4. Details Inspector ─────────────────────────────────────────────────────
export function DetailsInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;

  const venues = (cfg.locations?.venues || []) as Array<{
    id?: string;
    title: string;
    name: string;
    description: string;
    mapButton?: string;
    mapIcon?: string;
  }>;

  return (
    <>
      <InspectorHeader title="Wedding Details" subtitle="Detail cards: ceremony, reception, dress code…" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Section Label">
          <TextField
            label="Section Title"
            value={cfg.locations?.sectionTitle ?? ""}
            onChange={(v) =>
              updateConfig((c) => ({
                ...c,
                locations: { ...c.locations, sectionTitle: v },
              }))
            }
            placeholder="WEDDING DETAILS"
          />
        </FieldGroup>
        <FieldGroup label="Detail Cards">
          <InfoNote>Each card shows an icon, time/name, and description. Use \\n in description for line breaks.</InfoNote>
          <VenueCardEditor
            venues={venues as any[]}
            onChange={(updated) =>
              updateConfig((c) => ({
                ...c,
                locations: { ...c.locations, venues: updated as any },
              }))
            }
          />
        </FieldGroup>
      </div>
    </>
  );
}

// ─── 5. Story Inspector ───────────────────────────────────────────────────────
export function StoryInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;

  const milestones = (cfg.timeline?.events || []) as Array<{
    id?: string;
    time: string;
    title: string;
    description: string;
  }>;

  return (
    <>
      <InspectorHeader title="Our Story" subtitle="Timeline of your love story" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Content">
          <TextField
            label="Heading"
            value={cfg.storyHeading ?? cfg.timeline?.title ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, storyHeading: v }))}
            placeholder="Our Story"
          />
          <TextareaField
            label="Introduction Paragraph"
            value={cfg.storyBody ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, storyBody: v }))}
            rows={3}
            placeholder="A few words about your journey together…"
          />
        </FieldGroup>
        <FieldGroup label="Timeline Events">
          <InfoNote>
            Add events in chronological order. Each shows year, title, and a short description.
          </InfoNote>
          <MilestoneEditor
            milestones={milestones}
            onChange={(updated) =>
              updateConfig((c) => ({
                ...c,
                timeline: { ...c.timeline, events: updated },
              }))
            }
          />
        </FieldGroup>
        <FieldGroup label="Closing Message">
          <TextField
            label="Thank You Note"
            value={cfg.timeline?.afterMessage?.thankYou ?? ""}
            onChange={(v) =>
              updateConfig((c) => ({
                ...c,
                timeline: {
                  ...c.timeline,
                  afterMessage: { ...(c.timeline?.afterMessage || {}), thankYou: v },
                },
              }))
            }
            placeholder="Thank you for being part of our love story"
          />
        </FieldGroup>
      </div>
    </>
  );
}

// ─── 6. Gallery Inspector ─────────────────────────────────────────────────────
export function GalleryInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;
  const templateId = state.templateId;

  const upload = useCallback(makeUploader(templateId, "gallery"), [templateId]);

  const handleGalleryUpload = async (file: File) => {
    const url = await upload(file);
    updateConfig((c) => ({
      ...c,
      photos: {
        ...(c.photos || {}),
        galleryImages: [...((c.photos?.galleryImages) || []), url],
      },
    }));
    return url;
  };

  const galleryImages: string[] = cfg.photos?.galleryImages || [];

  return (
    <>
      <InspectorHeader title="Gallery" subtitle="Masonry photo grid" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Content">
          <TextField
            label="Gallery Title"
            value={cfg.galleryTitle ?? cfg.photos?.title ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, galleryTitle: v }))}
            placeholder="OUR MOMENTS"
          />
          <TextField
            label="Subtitle"
            value={cfg.gallerySubtitle ?? cfg.photos?.description ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, gallerySubtitle: v }))}
            placeholder="A collection of memories"
          />
        </FieldGroup>
        <FieldGroup label="Images">
          {galleryImages.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px", marginBottom: "8px" }}>
              {galleryImages.map((url, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img
                    src={url}
                    alt={`Gallery ${i + 1}`}
                    style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "4px", border: "1px solid #374151" }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateConfig((c) => ({
                        ...c,
                        photos: {
                          ...(c.photos || {}),
                          galleryImages: (c.photos?.galleryImages || []).filter((_, idx) => idx !== i),
                        },
                      }))
                    }
                    style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "3px", color: "#EF4444", cursor: "pointer", padding: "1px 4px", fontSize: "0.55rem", lineHeight: 1 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <UploadImageButton onUpload={handleGalleryUpload} label="Add Gallery Image" />
          <InfoNote>Upload multiple images — they display in a masonry grid. Gallery section hides automatically when no images are added.</InfoNote>
        </FieldGroup>
      </div>
    </>
  );
}

// ─── 7. RSVP Inspector ────────────────────────────────────────────────────────
export function RsvpInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;
  const templateId = state.templateId;

  const upload = useCallback(makeUploader(templateId, "rsvp"), [templateId]);

  const handleRsvpBgUpload = async (file: File) => {
    const url = await upload(file);
    updateConfig((c) => ({ ...c, rsvpBgImage: url }));
    return url;
  };

  return (
    <>
      <InspectorHeader title="RSVP" subtitle="Guest reply form" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Content">
          <TextField
            label="Section Title"
            value={cfg.rsvp?.title ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, rsvp: { ...c.rsvp, title: v } }))}
            placeholder="KINDLY REPLY"
          />
          <TextareaField
            label="Description"
            value={cfg.rsvp?.description ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, rsvp: { ...c.rsvp, description: v } }))}
            rows={3}
          />
        </FieldGroup>
        <FieldGroup label="Background Image">
          {cfg.rsvpBgImage && (
            <ImagePreview
              src={cfg.rsvpBgImage}
              onRemove={() => updateConfig((c) => ({ ...c, rsvpBgImage: "" }))}
            />
          )}
          <UploadImageButton onUpload={handleRsvpBgUpload} label="Upload RSVP Background" />
          <TextField
            label="Or paste image URL"
            value={cfg.rsvpBgImage ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, rsvpBgImage: v }))}
            placeholder="https://…"
            monospace
          />
        </FieldGroup>
        <FieldGroup label="Form Labels">
          <TextField
            label="Attending: Yes"
            value={cfg.rsvp?.form?.attendingYes ?? ""}
            onChange={(v) =>
              updateConfig((c) => ({ ...c, rsvp: { ...c.rsvp, form: { ...c.rsvp?.form, attendingYes: v } } }))
            }
            placeholder="Joyfully accepts"
          />
          <TextField
            label="Attending: No"
            value={cfg.rsvp?.form?.attendingNo ?? ""}
            onChange={(v) =>
              updateConfig((c) => ({ ...c, rsvp: { ...c.rsvp, form: { ...c.rsvp?.form, attendingNo: v } } }))
            }
            placeholder="Regretfully declines"
          />
          <TextField
            label="Submit Button"
            value={cfg.rsvp?.form?.submitButton ?? ""}
            onChange={(v) =>
              updateConfig((c) => ({ ...c, rsvp: { ...c.rsvp, form: { ...c.rsvp?.form, submitButton: v } } }))
            }
            placeholder="CONFIRM RSVP"
          />
        </FieldGroup>
        <FieldGroup label="Messages">
          <TextField
            label="Success Message"
            value={cfg.rsvp?.messages?.success ?? ""}
            onChange={(v) =>
              updateConfig((c) => ({ ...c, rsvp: { ...c.rsvp, messages: { ...c.rsvp?.messages, success: v } } }))
            }
          />
        </FieldGroup>
        <FieldGroup label="Submit Logic">
          <InfoNote>RSVP submission is handled automatically via the platform API. Edit form labels and messages above.</InfoNote>
          <ToggleField
            label="RSVP Enabled"
            value={cfg.sections?.rsvp?.enabled !== false}
            onChange={(v) =>
              updateConfig((c) => ({
                ...c,
                sections: { ...(c.sections || {}), rsvp: { ...(c.sections?.rsvp || {}), enabled: v } },
              }))
            }
          />
        </FieldGroup>
      </div>
    </>
  );
}

// ─── 8. Schedule Inspector ────────────────────────────────────────────────────
export function ScheduleInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;

  const items: Array<{ time: string; title: string; icon?: string }> =
    cfg.scheduleItems ?? [];

  const updateItem = (i: number, field: string, value: string) => {
    const next = items.map((it, idx) =>
      idx === i ? { ...it, [field]: value } : it
    );
    updateConfig((c) => ({ ...c, scheduleItems: next }));
  };

  const addItem = () =>
    updateConfig((c) => ({
      ...c,
      scheduleItems: [...(items), { time: "", title: "", icon: "clock" }],
    }));

  const removeItem = (i: number) =>
    updateConfig((c) => ({
      ...c,
      scheduleItems: items.filter((_, idx) => idx !== i),
    }));

  return (
    <>
      <InspectorHeader title="Day-of Schedule" subtitle="Wedding day timeline on forest green" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Section Title">
          <TextField
            label="Title"
            value={cfg.scheduleTitle ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, scheduleTitle: v }))}
            placeholder="THE DAY"
          />
        </FieldGroup>
        <FieldGroup label="Schedule Items">
          <InfoNote>Add wedding-day events in order. Leave empty to use defaults (ceremony, cocktail hour, etc.).</InfoNote>
          {items.map((item, i) => (
            <div key={i} style={{ border: "1px solid #374151", borderRadius: "6px", padding: "8px", marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.65rem", color: "#9CA3AF" }}>Event {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "0.65rem", padding: "2px 6px" }}
                >
                  Remove
                </button>
              </div>
              <TextField
                label="Time"
                value={item.time}
                onChange={(v) => updateItem(i, "time", v)}
                placeholder="4:00 PM"
              />
              <TextField
                label="Event Name"
                value={item.title}
                onChange={(v) => updateItem(i, "title", v)}
                placeholder="Ceremony"
              />
              <TextField
                label="Icon key"
                value={item.icon ?? ""}
                onChange={(v) => updateItem(i, "icon", v)}
                placeholder="ceremony / cocktail / dinner / dance / party / welcome"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            style={{ width: "100%", padding: "8px", border: "1px dashed #374151", borderRadius: "6px", background: "none", color: "#9CA3AF", cursor: "pointer", fontSize: "0.75rem" }}
          >
            + Add Schedule Item
          </button>
        </FieldGroup>
        <FieldGroup label="Visibility">
          <ToggleField
            label="Show Schedule Section"
            value={(cfg.sections as any)?.schedule?.enabled !== false}
            onChange={(v) =>
              updateConfig((c) => ({
                ...c,
                sections: { ...(c.sections || {}), schedule: { ...((c.sections as any)?.schedule || {}), enabled: v } } as any,
              }))
            }
          />
        </FieldGroup>
      </div>
    </>
  );
}

// ─── 9. Journey Map Inspector ─────────────────────────────────────────────────
export function JourneyMapInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;

  return (
    <>
      <InspectorHeader title="Journey Map" subtitle="Interactive helicopter route map" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Content">
          <TextField
            label="Section Title"
            value={cfg.journeyTitle ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, journeyTitle: v }))}
            placeholder="Our Journey Map"
          />
          <TextField
            label="Subtitle"
            value={cfg.journeySubtitle ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, journeySubtitle: v }))}
            placeholder="Click the helicopter to see the roadmap"
          />
          <TextField
            label="Open in Maps URL"
            value={cfg.journeyMapUrl ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, journeyMapUrl: v }))}
            placeholder="https://maps.google.com/..."
            monospace
          />
        </FieldGroup>
        <FieldGroup label="Stops">
          <InfoNote>
            Up to 4 stops shown on the journey map. Each stop needs a time, title, location name, and optional image URL.
          </InfoNote>
          {(cfg.journeyStops ?? []).map((stop: any, i: number) => (
            <div key={i} style={{ border: "1px solid #374151", borderRadius: "6px", padding: "8px", marginBottom: "8px" }}>
              <p style={{ fontSize: "0.65rem", color: "#9CA3AF", margin: "0 0 6px" }}>Stop {i + 1}</p>
              <TextField label="Time" value={stop.time ?? ""} onChange={(v) => {
                const next = [...(cfg.journeyStops ?? [])]; next[i] = { ...next[i], time: v };
                updateConfig((c) => ({ ...c, journeyStops: next }));
              }} placeholder="4:00 PM" />
              <TextField label="Title" value={stop.title ?? ""} onChange={(v) => {
                const next = [...(cfg.journeyStops ?? [])]; next[i] = { ...next[i], title: v };
                updateConfig((c) => ({ ...c, journeyStops: next }));
              }} placeholder="Ceremony" />
              <TextField label="Location" value={stop.sub ?? ""} onChange={(v) => {
                const next = [...(cfg.journeyStops ?? [])]; next[i] = { ...next[i], sub: v };
                updateConfig((c) => ({ ...c, journeyStops: next }));
              }} placeholder="Grand Estate Chapel" />
              <TextField label="Image URL" value={stop.img ?? ""} onChange={(v) => {
                const next = [...(cfg.journeyStops ?? [])]; next[i] = { ...next[i], img: v };
                updateConfig((c) => ({ ...c, journeyStops: next }));
              }} placeholder="https://..." monospace />
            </div>
          ))}
        </FieldGroup>
      </div>
    </>
  );
}

// ─── 10. Dress Code Inspector ─────────────────────────────────────────────────
export function DressCodeInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;

  return (
    <>
      <InspectorHeader title="Dress Code" subtitle="Color palette and attire instructions" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Content">
          <TextField
            label="Section Title"
            value={cfg.dressCodeTitle ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, dressCodeTitle: v }))}
            placeholder="Dress Code"
          />
          <TextareaField
            label="Instructions"
            value={cfg.dressCodeText ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, dressCodeText: v }))}
            rows={2}
            placeholder="We kindly ask you to wear one of these colors."
          />
          <TextField
            label="Attire Style"
            value={cfg.dressCodeStyle ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, dressCodeStyle: v }))}
            placeholder="Black Tie"
          />
        </FieldGroup>
        <FieldGroup label="Color Swatches">
          <InfoNote>Enter up to 4 hex color values for the palette swatches.</InfoNote>
          {([0, 1, 2, 3]).map((i) => (
            <ColorField
              key={i}
              label={`Color ${i + 1}`}
              value={(cfg.dressColors ?? [])[i] ?? ""}
              onChange={(v) => {
                const next = [...(cfg.dressColors ?? ["#F5F0E8", "#C9A45C", "#173D2F", "#2B2722"])];
                next[i] = v;
                updateConfig((c) => ({ ...c, dressColors: next }));
              }}
            />
          ))}
        </FieldGroup>
      </div>
    </>
  );
}

// ─── 11. Footer Inspector ──────────────────────────────────────────────────────
export function FooterInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;

  return (
    <>
      <InspectorHeader title="Footer" subtitle="Closing section with social links" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Content">
          <TextField
            label="Footer Tagline (uppercase label)"
            value={cfg.footerTagline ?? cfg.footer?.thankYouMessage ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, footerTagline: v }))}
            placeholder="WITH LOVE & GRATITUDE"
          />
          <TextField
            label="Closing Note (italic)"
            value={cfg.footerNote ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, footerNote: v }))}
            placeholder="with love & joy"
          />
          <TextField
            label="Name Separator"
            value={cfg.footer?.separator ?? "∞"}
            onChange={(v) => updateConfig((c) => ({ ...c, footer: { ...c.footer, separator: v } }))}
            placeholder="∞"
          />
        </FieldGroup>
        <FieldGroup label="Social Links">
          <TextField
            label="Instagram URL"
            value={cfg.socialInstagram ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, socialInstagram: v }))}
            placeholder="https://instagram.com/…"
            monospace
          />
          <TextField
            label="Facebook URL"
            value={cfg.socialFacebook ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, socialFacebook: v }))}
            placeholder="https://facebook.com/…"
            monospace
          />
          <TextField
            label="Email"
            value={cfg.socialEmail ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, socialEmail: v }))}
            placeholder="hello@example.com"
            monospace
          />
        </FieldGroup>
      </div>
    </>
  );
}
