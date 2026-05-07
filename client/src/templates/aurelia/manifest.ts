/**
 * Aurelia — V2 Builder Manifest
 *
 * Registers Aurelia with the generic V2 builder engine.
 * This is the ONLY file that changes when Aurelia sections or elements change.
 *
 * ── Template authoring contract ───────────────────────────────────────────────
 *   1. Template component  → AureliaTemplate.tsx
 *   2. Default config      → config.ts
 *   3. This manifest       → manifest.ts
 *   4. JSX attributes      → AureliaTemplate.tsx (data-v2-section, data-v2-element)
 *   5. Registration index  → client/src/templates/v2-templates.ts
 */

import type {
  V2TemplateManifest,
  V2SectionManifest,
  V2ElementManifest,
} from "../../pages/builder-v2/manifest-types";
import { registerV2Manifest } from "../../pages/builder-v2/manifest-registry";
import { AURELIA_PALETTES, AURELIA_COLOR_ROLE_MAP } from "./palettes";
import {
  HeroInspector,
  StoryInspector,
  RoadmapInspector,
  DetailsInspector,
  VenueInspector,
  GalleryInspector,
  RsvpInspector,
  FooterInspector,
} from "./inspectors";

// ─── Section definitions ───────────────────────────────────────────────────────
const AURELIA_SECTIONS: V2SectionManifest[] = [
  {
    id: "aur-hero", label: "Hero", icon: "◻",
    hideable: true, configKey: "hero",
    children: [
      { id: "aur-hero-tagline",  label: "Tagline",       icon: "T",  sectionId: "aur-hero", elementId: "aur-hero-tagline" },
      { id: "aur-hero-names",    label: "Couple Names",  icon: "T",  sectionId: "aur-hero", elementId: "aur-hero-names" },
      { id: "aur-hero-date",     label: "Date",          icon: "T",  sectionId: "aur-hero", elementId: "aur-hero-date" },
      { id: "aur-hero-location", label: "Location",      icon: "T",  sectionId: "aur-hero", elementId: "aur-hero-location" },
      { id: "aur-hero-bg",       label: "Background",    icon: "🖼", sectionId: "aur-hero" },
    ],
  },
  {
    id: "aur-story", label: "Our Story", icon: "◻",
    hideable: true, configKey: "story",
    children: [
      { id: "aur-story-heading", label: "Heading",    icon: "T",  sectionId: "aur-story", elementId: "aur-story-heading" },
      { id: "aur-story-body",    label: "Story Text", icon: "T",  sectionId: "aur-story", elementId: "aur-story-body" },
      { id: "aur-story-cta",     label: "CTA Label",  icon: "▶",  sectionId: "aur-story", elementId: "aur-story-cta" },
      { id: "aur-story-image",   label: "Image",      icon: "🖼", sectionId: "aur-story" },
    ],
  },
  {
    id: "aur-roadmap", label: "Our Journey", icon: "◻",
    hideable: true, configKey: "timeline",
    children: [
      { id: "aur-roadmap-heading",    label: "Section Heading", icon: "T", sectionId: "aur-roadmap", elementId: "aur-roadmap-heading" },
      { id: "aur-roadmap-milestones", label: "Milestones",      icon: "≡", sectionId: "aur-roadmap" },
    ],
  },
  {
    id: "aur-details", label: "Wedding Details", icon: "◻",
    hideable: true, configKey: "locations",
    children: [
      { id: "aur-details-label", label: "Section Label", icon: "T",  sectionId: "aur-details" },
      { id: "aur-details-cards", label: "Detail Cards",  icon: "≡",  sectionId: "aur-details" },
    ],
  },
  {
    id: "aur-venue", label: "Venue", icon: "◻",
    hideable: true, configKey: "venue",
    children: [
      { id: "aur-venue-subtitle", label: "Section Label", icon: "T",  sectionId: "aur-venue", elementId: "aur-venue-subtitle" },
      { id: "aur-venue-title",    label: "Venue Name",    icon: "T",  sectionId: "aur-venue", elementId: "aur-venue-title" },
      { id: "aur-venue-desc",     label: "Description",   icon: "T",  sectionId: "aur-venue", elementId: "aur-venue-desc" },
      { id: "aur-venue-image",    label: "Venue Image",   icon: "🖼", sectionId: "aur-venue" },
    ],
  },
  {
    id: "aur-gallery", label: "Gallery", icon: "◻",
    hideable: true, configKey: "photos",
    children: [
      { id: "aur-gallery-title",  label: "Title",  icon: "T",  sectionId: "aur-gallery", elementId: "aur-gallery-title" },
      { id: "aur-gallery-images", label: "Images", icon: "🖼", sectionId: "aur-gallery" },
    ],
  },
  {
    id: "aur-rsvp", label: "RSVP", icon: "◻",
    hideable: true, configKey: "rsvp",
    children: [
      { id: "aur-rsvp-title",  label: "Title",        icon: "T",  sectionId: "aur-rsvp", elementId: "aur-rsvp-title" },
      { id: "aur-rsvp-desc",   label: "Description",  icon: "T",  sectionId: "aur-rsvp", elementId: "aur-rsvp-desc" },
      { id: "aur-rsvp-logic",  label: "Submit Logic", icon: "🔒", sectionId: "aur-rsvp", locked: true },
    ],
  },
  {
    id: "aur-footer", label: "Footer", icon: "◻",
    hideable: true, configKey: "footer",
    children: [
      { id: "aur-footer-tagline", label: "Tagline",   icon: "T",  sectionId: "aur-footer", elementId: "aur-footer-tagline" },
      { id: "aur-footer-socials", label: "Socials",   icon: "↗",  sectionId: "aur-footer" },
      { id: "aur-footer-copy",    label: "Copyright", icon: "🔒", sectionId: "aur-footer", locked: true },
    ],
  },
];

// ─── Element definitions ───────────────────────────────────────────────────────
const AURELIA_ELEMENTS: Record<string, V2ElementManifest> = {
  "aur-hero-tagline": {
    id: "aur-hero-tagline", sectionId: "aur-hero", label: "Tagline", type: "text",
    getValue: (c) => (c as any).heroTagline ?? "",
    setValue: (c, v) => ({ ...c, heroTagline: v }),
  },
  "aur-hero-names": {
    id: "aur-hero-names", sectionId: "aur-hero", label: "Couple Names", type: "text",
    getValue: (c) => c.couple?.combinedNames ?? "",
    setValue: (c, v) => ({ ...c, couple: { ...c.couple, combinedNames: v } }),
  },
  "aur-hero-date": {
    id: "aur-hero-date", sectionId: "aur-hero", label: "Wedding Date", type: "text",
    getValue: (c) => c.wedding?.displayDate ?? "",
    setValue: (c, v) => ({ ...c, wedding: { ...c.wedding, displayDate: v } }),
  },
  "aur-hero-location": {
    id: "aur-hero-location", sectionId: "aur-hero", label: "Location", type: "text",
    getValue: (c) => (c as any).heroLocation ?? "",
    setValue: (c, v) => ({ ...c, heroLocation: v }),
  },
  "aur-story-heading": {
    id: "aur-story-heading", sectionId: "aur-story", label: "Story Heading", type: "text",
    getValue: (c) => (c as any).storyHeading ?? "",
    setValue: (c, v) => ({ ...c, storyHeading: v }),
  },
  "aur-story-body": {
    id: "aur-story-body", sectionId: "aur-story", label: "Story Body", type: "textarea",
    getValue: (c) => (c as any).storyBody ?? "",
    setValue: (c, v) => ({ ...c, storyBody: v }),
  },
  "aur-story-cta": {
    id: "aur-story-cta", sectionId: "aur-story", label: "CTA Label", type: "text",
    getValue: (c) => (c as any).storyCtaLabel ?? "",
    setValue: (c, v) => ({ ...c, storyCtaLabel: v }),
  },
  "aur-roadmap-heading": {
    id: "aur-roadmap-heading", sectionId: "aur-roadmap", label: "Roadmap Heading", type: "text",
    getValue: (c) => (c as any).roadmapHeading ?? "",
    setValue: (c, v) => ({ ...c, roadmapHeading: v }),
  },
  "aur-venue-subtitle": {
    id: "aur-venue-subtitle", sectionId: "aur-venue", label: "Section Label", type: "text",
    getValue: (c) => (c as any).venueSubtitle ?? "",
    setValue: (c, v) => ({ ...c, venueSubtitle: v }),
  },
  "aur-venue-title": {
    id: "aur-venue-title", sectionId: "aur-venue", label: "Venue Name", type: "text",
    getValue: (c) => (c as any).venueTitle ?? "",
    setValue: (c, v) => ({ ...c, venueTitle: v }),
  },
  "aur-venue-desc": {
    id: "aur-venue-desc", sectionId: "aur-venue", label: "Description", type: "textarea",
    getValue: (c) => (c as any).venueDescription ?? "",
    setValue: (c, v) => ({ ...c, venueDescription: v }),
  },
  "aur-gallery-title": {
    id: "aur-gallery-title", sectionId: "aur-gallery", label: "Gallery Title", type: "text",
    getValue: (c) => (c as any).galleryTitle ?? c.photos?.title ?? "",
    setValue: (c, v) => ({ ...c, galleryTitle: v }),
  },
  "aur-rsvp-title": {
    id: "aur-rsvp-title", sectionId: "aur-rsvp", label: "RSVP Title", type: "text",
    getValue: (c) => c.rsvp?.title ?? "",
    setValue: (c, v) => ({ ...c, rsvp: { ...c.rsvp, title: v } }),
  },
  "aur-rsvp-desc": {
    id: "aur-rsvp-desc", sectionId: "aur-rsvp", label: "RSVP Description", type: "textarea",
    getValue: (c) => c.rsvp?.description ?? "",
    setValue: (c, v) => ({ ...c, rsvp: { ...c.rsvp, description: v } }),
  },
  "aur-footer-tagline": {
    id: "aur-footer-tagline", sectionId: "aur-footer", label: "Footer Tagline", type: "text",
    getValue: (c) => (c as any).footerTagline ?? c.footer?.thankYouMessage ?? "",
    setValue: (c, v) => ({ ...c, footerTagline: v }),
  },
};

// ─── Manifest registration ─────────────────────────────────────────────────────
const aureliaManifest: V2TemplateManifest = {
  templateKey:  "aurelia",
  displayName:  "Aurelia",
  sections:     AURELIA_SECTIONS,
  elements:     AURELIA_ELEMENTS,
  getComponent: () => import("@/templates/aurelia/AureliaTemplate"),
  sectionInspectors: {
    "aur-hero":    HeroInspector,
    "aur-story":   StoryInspector,
    "aur-roadmap": RoadmapInspector,
    "aur-details": DetailsInspector,
    "aur-venue":   VenueInspector,
    "aur-gallery": GalleryInspector,
    "aur-rsvp":    RsvpInspector,
    "aur-footer":  FooterInspector,
  },
  themePalettes:        AURELIA_PALETTES,
  colorRoleConfigPaths: AURELIA_COLOR_ROLE_MAP,
};

registerV2Manifest(aureliaManifest);
