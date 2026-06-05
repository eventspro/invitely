/**
 * Aurelia — Section Inspector Components
 *
 * Custom right-panel inspectors for each Aurelia V2 section.
 * Registered via aureliaManifest.sectionInspectors in manifest.ts.
 */

import React, { useCallback } from "react";
import { useBuilderV2 } from "../../pages/builder-v2/BuilderV2Context";
import {
  FieldGroup,
  TextField,
  TextareaField,
  ToggleField,
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

// ─── 1. Hero Inspector ────────────────────────────────────────────────────────
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
      <InspectorHeader title="Hero" subtitle="Fullscreen opening section" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Couple Names">
          <TextField
            label="Groom Name"
            value={cfg.couple?.groomName ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, couple: { ...c.couple, groomName: v } }))}
            placeholder="Matteo"
          />
          <TextField
            label="Bride Name"
            value={cfg.couple?.brideName ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, couple: { ...c.couple, brideName: v } }))}
            placeholder="Sophia"
          />
          <TextField
            label="Name Separator"
            value={cfg.nameSeparator ?? "&"}
            onChange={(v) => updateConfig((c) => ({ ...c, nameSeparator: v }))}
            placeholder="&"
          />
        </FieldGroup>
        <FieldGroup label="Hero Text">
          <TextField
            label="Invitation Line"
            value={cfg.heroInvitationLine ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, heroInvitationLine: v }))}
            placeholder="WE'RE GETTING MARRIED"
          />
          <TextField
            label="Tagline"
            value={cfg.heroTagline ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, heroTagline: v }))}
            placeholder="A Love Story Written in the Stars"
          />
          <TextField
            label="Location"
            value={cfg.heroLocation ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, heroLocation: v }))}
            placeholder="Amalfi Coast, Italy"
          />
          <TextField
            label="RSVP Button Label"
            value={cfg.heroCta ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, heroCta: v }))}
            placeholder="RSVP NOW"
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
        <FieldGroup label="Countdown">
          <TextField
            label="Subtitle"
            value={cfg.countdown?.subtitle ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, countdown: { ...c.countdown, subtitle: v } }))}
            placeholder="UNTIL WE SAY I DO"
          />
          <TextField
            label="Days Label"
            value={cfg.countdown?.labels?.days ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, countdown: { ...c.countdown, labels: { ...(c.countdown?.labels || {}), days: v } } }))}
            placeholder="DAYS"
          />
          <TextField
            label="Hours Label"
            value={cfg.countdown?.labels?.hours ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, countdown: { ...c.countdown, labels: { ...(c.countdown?.labels || {}), hours: v } } }))}
            placeholder="HOURS"
          />
          <TextField
            label="Minutes Label"
            value={cfg.countdown?.labels?.minutes ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, countdown: { ...c.countdown, labels: { ...(c.countdown?.labels || {}), minutes: v } } }))}
            placeholder="MINUTES"
          />
          <TextField
            label="Seconds Label"
            value={cfg.countdown?.labels?.seconds ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, countdown: { ...c.countdown, labels: { ...(c.countdown?.labels || {}), seconds: v } } }))}
            placeholder="SECONDS"
          />
        </FieldGroup>
        <FieldGroup label="Background Image">
          {currentHeroImage && (
            <div style={{ position: "relative", marginBottom: "8px" }}>
              <img
                src={currentHeroImage}
                alt="Hero background"
                style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "6px", border: "1px solid #374151" }}
              />
              <button
                type="button"
                onClick={() => updateConfig((c) => ({ ...c, hero: { ...(c.hero || {}), images: [] } }))}
                style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "4px", color: "#EF4444", cursor: "pointer", padding: "2px 6px", fontSize: "0.65rem" }}
              >
                ✕ Remove
              </button>
            </div>
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

// ─── 2. Story Inspector ───────────────────────────────────────────────────────
export function StoryInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;
  const templateId = state.templateId;

  const upload = useCallback(makeUploader(templateId, "story"), [templateId]);

  const handleStoryUpload = async (file: File) => {
    const url = await upload(file);
    updateConfig((c) => ({ ...c, storyImage: url }));
    return url;
  };

  return (
    <>
      <InspectorHeader title="Our Story" subtitle="Editorial two-column section" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Content">
          <TextField
            label="Section Label"
            value={cfg.storySmallTitle ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, storySmallTitle: v }))}
            placeholder="OUR STORY"
          />
          <TextField
            label="Heading"
            value={cfg.storyHeading ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, storyHeading: v }))}
            placeholder="How It All Began"
          />
          <TextField
            label="Champagne Italic Emphasis"
            value={cfg.storyHeadingEmphasis ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, storyHeadingEmphasis: v }))}
            placeholder="Began"
          />
          <TextareaField
            label="Story Paragraph"
            value={cfg.storyBody ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, storyBody: v }))}
            rows={4}
            placeholder="Your story..."
          />
          <TextField
            label="CTA Button Label"
            value={cfg.storyCtaLabel ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, storyCtaLabel: v }))}
            placeholder="OUR FULL STORY"
          />
        </FieldGroup>
        <FieldGroup label="Story Image">
          {cfg.storyImage && (
            <div style={{ position: "relative", marginBottom: "8px" }}>
              <img
                src={cfg.storyImage}
                alt="Story"
                style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "6px", border: "1px solid #374151" }}
              />
              <button
                type="button"
                onClick={() => updateConfig((c) => ({ ...c, storyImage: "" }))}
                style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "4px", color: "#EF4444", cursor: "pointer", padding: "2px 6px", fontSize: "0.65rem" }}
              >
                ✕ Remove
              </button>
            </div>
          )}
          <UploadImageButton onUpload={handleStoryUpload} label="Upload Story Image" />
          <TextField
            label="Or paste image URL"
            value={cfg.storyImage ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, storyImage: v }))}
            placeholder="https://…"
            monospace
          />
        </FieldGroup>
      </div>
    </>
  );
}

// ─── 3. Roadmap Inspector ─────────────────────────────────────────────────────
export function RoadmapInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;
  const templateId = state.templateId;

  const milestones = (cfg.timeline?.events || []) as Array<{ id?: string; time: string; title: string; description: string; image?: string; address?: string; mapUrl?: string; buttonText?: string }>;

  const uploadRoadmapBg = useCallback(makeUploader(templateId, "roadmap"), [templateId]);
  const handleRoadmapBgUpload = async (file: File) => {
    const url = await uploadRoadmapBg(file);
    updateConfig((c) => ({ ...c, roadmapBgImage: url }));
    return url;
  };

  const makeMilestoneImageUploader = useCallback(
    (idx: number) => async (file: File): Promise<string> => {
      const url = await makeUploader(templateId, "journey")(file);
      updateConfig((c) => {
        const events = [...(c.timeline?.events || [])] as any[];
        events[idx] = { ...events[idx], image: url };
        return { ...c, timeline: { ...c.timeline, events } };
      });
      return url;
    },
    [templateId, updateConfig],
  );

  return (
    <>
      <InspectorHeader title="Wedding Route" subtitle="Animated wedding-day route map" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Content">
          <TextField
            label="Section Label"
            value={cfg.roadmapSmallTitle ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, roadmapSmallTitle: v }))}
            placeholder="WEDDING ROUTE"
          />
          <TextField
            label="Section Heading"
            value={cfg.roadmapHeading ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, roadmapHeading: v }))}
            placeholder="Your Wedding Day Roadmap"
          />
          <TextareaField
            label="Subtitle"
            value={cfg.roadmapSubtitle ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, roadmapSubtitle: v }))}
            rows={2}
            placeholder="Follow the route from the first stop to the final celebration."
          />
          <TextField
            label="Scroll Instruction"
            value={cfg.routeInstruction ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, routeInstruction: v }))}
            placeholder="Scroll to follow the route"
          />
          <ToggleField
            label="Show stop numbers (01, 02…)"
            value={cfg.showStopNumbers ?? true}
            onChange={(v) => updateConfig((c) => ({ ...c, showStopNumbers: v }))}
          />
        </FieldGroup>
        <FieldGroup label="Background Image">
          {cfg.roadmapBgImage && (
            <div style={{ position: "relative", marginBottom: "8px" }}>
              <img
                src={cfg.roadmapBgImage}
                alt="Roadmap background"
                style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "6px", border: "1px solid #374151" }}
              />
              <button
                type="button"
                onClick={() => updateConfig((c) => ({ ...c, roadmapBgImage: "" }))}
                style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "4px", color: "#EF4444", cursor: "pointer", padding: "2px 6px", fontSize: "0.65rem" }}
              >
                ✕ Remove
              </button>
            </div>
          )}
          <UploadImageButton onUpload={handleRoadmapBgUpload} label="Upload Section Background" />
          <TextField
            label="Or paste image URL"
            value={cfg.roadmapBgImage ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, roadmapBgImage: v }))}
            placeholder="https://…"
            monospace
          />
        </FieldGroup>
        <FieldGroup label="Route Stops">
          <InfoNote>
            Add route stops in order. Each stop can have an address and a map link.
          </InfoNote>
          <MilestoneEditor
            milestones={milestones}
            onChange={(updated) =>
              updateConfig((c) => ({
                ...c,
                timeline: { ...c.timeline, events: updated },
              }))
            }
            onImageUpload={makeMilestoneImageUploader}
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
            placeholder="We can't wait to celebrate with you!"
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
      <InspectorHeader title="Wedding Notes" subtitle="Logistical info cards" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Section Label">
          <TextField
            label="Small Label"
            value={cfg.detailsSmallTitle ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, detailsSmallTitle: v }))}
            placeholder="WEDDING NOTES"
          />
          <TextField
            label="Section Title"
            value={cfg.locations?.sectionTitle ?? ""}
            onChange={(v) =>
              updateConfig((c) => ({
                ...c,
                locations: { ...c.locations, sectionTitle: v },
              }))
            }
            placeholder="WEDDING NOTES"
          />
        </FieldGroup>
        <FieldGroup label="Info Cards">
          <InfoNote>
            Logistical info cards — dress code, parking, gifts, RSVP deadline, etc.
          </InfoNote>
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

// ─── 5. Venue Inspector ───────────────────────────────────────────────────────
export function VenueInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;
  const templateId = state.templateId;

  const upload = useCallback(makeUploader(templateId, "venue"), [templateId]);

  const handleVenueUpload = async (file: File) => {
    const url = await upload(file);
    updateConfig((c) => ({ ...c, venueImage: url }));
    return url;
  };

  return (
    <>
      <InspectorHeader title="Venue" subtitle="Split-layout venue showcase" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Content">
          <TextField
            label="Section Label"
            value={cfg.venueSubtitle ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, venueSubtitle: v }))}
            placeholder="THE VENUE"
          />
          <TextField
            label="Venue Name"
            value={cfg.venueTitle ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, venueTitle: v }))}
            placeholder="Villa Cimbrone"
          />
          <TextField
            label="Location (city / region)"
            value={cfg.venueAddress ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, venueAddress: v }))}
            placeholder="Ravello, Amalfi Coast"
          />
          <TextareaField
            label="Description"
            value={cfg.venueDescription ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, venueDescription: v }))}
            rows={3}
            placeholder="A timeless Italian villa..."
          />
          <TextField
            label="CTA Label"
            value={cfg.venueCtaLabel ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, venueCtaLabel: v }))}
            placeholder="EXPLORE THE VENUE"
          />
          <TextField
            label="Map URL"
            value={cfg.venueMapUrl ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, venueMapUrl: v }))}
            placeholder="https://maps.google.com/…"
            monospace
          />
        </FieldGroup>
        <FieldGroup label="Venue Image">
          {cfg.venueImage && (
            <div style={{ position: "relative", marginBottom: "8px" }}>
              <img
                src={cfg.venueImage}
                alt="Venue"
                style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "6px", border: "1px solid #374151" }}
              />
              <button
                type="button"
                onClick={() => updateConfig((c) => ({ ...c, venueImage: "" }))}
                style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "4px", color: "#EF4444", cursor: "pointer", padding: "2px 6px", fontSize: "0.65rem" }}
              >
                ✕ Remove
              </button>
            </div>
          )}
          <UploadImageButton onUpload={handleVenueUpload} label="Upload Venue Image" />
          <TextField
            label="Or paste image URL"
            value={cfg.venueImage ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, venueImage: v }))}
            placeholder="https://…"
            monospace
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
  const uploadBg = useCallback(makeUploader(templateId, "gallery-bg"), [templateId]);

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

  const handleGalleryBgUpload = async (file: File) => {
    const url = await uploadBg(file);
    updateConfig((c) => ({ ...c, galleryBgImage: url }));
    return url;
  };

  const galleryImages: string[] = cfg.photos?.galleryImages || [];

  return (
    <>
      <InspectorHeader title="Gallery" subtitle="Image grid section" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Content">
          <TextField
            label="Section Label"
            value={cfg.gallerySubtitle ?? cfg.photos?.description ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, gallerySubtitle: v }))}
            placeholder="OUR MOMENTS"
          />
          <TextField
            label="Gallery Title"
            value={cfg.galleryTitle ?? cfg.photos?.title ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, galleryTitle: v }))}
            placeholder="A Collection of Memories"
          />
          <TextField
            label="Navigation Hint"
            value={cfg.galleryHint ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, galleryHint: v }))}
            placeholder="DRAG OR SCROLL TO EXPLORE"
          />
        </FieldGroup>
        <FieldGroup label="Background Tint">
          {cfg.galleryBgImage && (
            <div style={{ position: "relative", marginBottom: "8px" }}>
              <img
                src={cfg.galleryBgImage}
                alt="Gallery background"
                style={{ width: "100%", height: "60px", objectFit: "cover", borderRadius: "6px", border: "1px solid #374151" }}
              />
              <button
                type="button"
                onClick={() => updateConfig((c) => ({ ...c, galleryBgImage: "" }))}
                style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "4px", color: "#EF4444", cursor: "pointer", padding: "2px 6px", fontSize: "0.65rem" }}
              >
                ✕ Remove
              </button>
            </div>
          )}
          <UploadImageButton onUpload={handleGalleryBgUpload} label="Upload Background Image" />
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
          <InfoNote>Upload multiple images — each will appear as a gallery tile.</InfoNote>
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
      <InspectorHeader title="RSVP" subtitle="Glass panel form over image" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Content">
          <TextField
            label="Section Title"
            value={cfg.rsvp?.title ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, rsvp: { ...c.rsvp, title: v } }))}
            placeholder="JOIN US"
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
            <div style={{ position: "relative", marginBottom: "8px" }}>
              <img
                src={cfg.rsvpBgImage}
                alt="RSVP background"
                style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "6px", border: "1px solid #374151" }}
              />
              <button
                type="button"
                onClick={() => updateConfig((c) => ({ ...c, rsvpBgImage: "" }))}
                style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "4px", color: "#EF4444", cursor: "pointer", padding: "2px 6px", fontSize: "0.65rem" }}
              >
                ✕ Remove
              </button>
            </div>
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
            placeholder="SEND RSVP"
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
          <InfoNote>RSVP submission is handled automatically via the platform API. Edit the template ID and form labels above.</InfoNote>
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

// ─── 8. Footer Inspector ──────────────────────────────────────────────────────
export function FooterInspector() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig as any;

  return (
    <>
      <InspectorHeader title="Footer" subtitle="Closing section with social links" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Content">
          <TextField
            label="Footer Tagline"
            value={cfg.footerTagline ?? cfg.footer?.thankYouMessage ?? ""}
            onChange={(v) => updateConfig((c) => ({ ...c, footerTagline: v }))}
            placeholder="FOREVER BEGINS HERE"
          />
          <TextField
            label="Name Separator"
            value={cfg.footer?.separator ?? "&"}
            onChange={(v) => updateConfig((c) => ({ ...c, footer: { ...c.footer, separator: v } }))}
            placeholder="&"
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
