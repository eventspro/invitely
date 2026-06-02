/**
 * Envelope Romance — V2 Builder Manifest
 *
 * Registers the Envelope Romance template with the generic V2 builder engine.
 *
 * ── Template authoring contract ───────────────────────────────────────────────
 *   1. Template component  → EnvelopeTemplate.tsx
 *   2. Default config      → config.ts
 *   3. This manifest       → manifest.ts
 *   4. JSX attributes      → EnvelopeTemplate.tsx (data-v2-section, data-v2-element)
 *   5. Registration index  → client/src/templates/v2-templates.ts
 */

import type {
  V2TemplateManifest,
  V2SectionManifest,
  V2ElementManifest,
} from "../../pages/builder-v2/manifest-types";
import { registerV2Manifest } from "../../pages/builder-v2/manifest-registry";
import { ENVELOPE_PALETTES, ENVELOPE_COLOR_ROLE_MAP } from "./palettes";
import {
  EnvelopeInspector,
  HeroInspector,
  CountdownInspector,
  DetailsInspector,
  StoryInspector,
  ScheduleInspector,
  JourneyMapInspector,
  DressCodeInspector,
  GalleryInspector,
  RsvpInspector,
  FooterInspector,
} from "./inspectors";

// ─── Section definitions ───────────────────────────────────────────────────────
const ENVELOPE_SECTIONS: V2SectionManifest[] = [
  {
    id: "env-envelope", label: "Opening Envelope", icon: "◻",
    hideable: false, configKey: "envelope",
    children: [
      { id: "env-envelope-title",    label: "Invitation Text", icon: "T", sectionId: "env-envelope" },
      { id: "env-envelope-initials", label: "Wax Seal Text",   icon: "T", sectionId: "env-envelope" },
      { id: "env-envelope-cta",      label: "Open Button",     icon: "▶", sectionId: "env-envelope" },
    ],
  },
  {
    id: "env-hero", label: "Hero", icon: "◻",
    hideable: true, configKey: "hero",
    children: [
      { id: "env-hero-names",    label: "Couple Names", icon: "T",  sectionId: "env-hero", elementId: "env-hero-names" },
      { id: "env-hero-tagline",  label: "Tagline",      icon: "T",  sectionId: "env-hero", elementId: "env-hero-tagline" },
      { id: "env-hero-date",     label: "Wedding Date", icon: "T",  sectionId: "env-hero", elementId: "env-hero-date" },
      { id: "env-hero-location", label: "Location",     icon: "T",  sectionId: "env-hero", elementId: "env-hero-location" },
      { id: "env-hero-bg",       label: "Background",   icon: "🖼", sectionId: "env-hero" },
    ],
  },
  {
    id: "env-countdown", label: "Countdown", icon: "◻",
    hideable: true, configKey: "countdown",
    children: [
      { id: "env-countdown-subtitle", label: "Subtitle", icon: "T", sectionId: "env-countdown", elementId: "env-countdown-subtitle" },
    ],
  },
  {
    id: "env-details", label: "Wedding Details", icon: "◻",
    hideable: true, configKey: "locations",
    children: [
      { id: "env-details-label", label: "Section Label", icon: "T",  sectionId: "env-details" },
      { id: "env-details-cards", label: "Detail Cards",  icon: "≡",  sectionId: "env-details" },
    ],
  },
  {
    id: "env-story", label: "Our Story", icon: "◻",
    hideable: true, configKey: "timeline",
    children: [
      { id: "env-story-heading",    label: "Heading",    icon: "T",  sectionId: "env-story", elementId: "env-story-heading" },
      { id: "env-story-body",       label: "Story Text", icon: "T",  sectionId: "env-story", elementId: "env-story-body" },
      { id: "env-story-milestones", label: "Timeline",   icon: "≡",  sectionId: "env-story" },
    ],
  },
  {
    id: "env-schedule", label: "Day-of Schedule", icon: "◻",
    hideable: true, configKey: "timeline",
    children: [
      { id: "env-schedule-title", label: "Section Title",  icon: "T", sectionId: "env-schedule" },
      { id: "env-schedule-items", label: "Schedule Items", icon: "≡", sectionId: "env-schedule" },
    ],
  },
  {
    id: "env-journey", label: "Journey Map", icon: "◻",
    hideable: true, configKey: "timeline",
    children: [
      { id: "env-journey-title",    label: "Section Title", icon: "T", sectionId: "env-journey" },
      { id: "env-journey-subtitle", label: "Subtitle",      icon: "T", sectionId: "env-journey" },
      { id: "env-journey-stops",    label: "Map Stops",     icon: "≡", sectionId: "env-journey" },
    ],
  },
  {
    id: "env-gallery", label: "Gallery", icon: "◻",
    hideable: true, configKey: "photos",
    children: [
      { id: "env-gallery-title",  label: "Title",  icon: "T",  sectionId: "env-gallery", elementId: "env-gallery-title" },
      { id: "env-gallery-images", label: "Images", icon: "🖼", sectionId: "env-gallery" },
    ],
  },
  {
    id: "env-dresscode", label: "Dress Code", icon: "◻",
    hideable: true, configKey: "timeline",
    children: [
      { id: "env-dresscode-text",   label: "Instructions", icon: "T", sectionId: "env-dresscode" },
      { id: "env-dresscode-colors", label: "Color Swatches", icon: "≡", sectionId: "env-dresscode" },
    ],
  },
  {
    id: "env-rsvp", label: "RSVP", icon: "◻",
    hideable: true, configKey: "rsvp",
    children: [
      { id: "env-rsvp-title",  label: "Title",        icon: "T",  sectionId: "env-rsvp", elementId: "env-rsvp-title" },
      { id: "env-rsvp-desc",   label: "Description",  icon: "T",  sectionId: "env-rsvp", elementId: "env-rsvp-desc" },
      { id: "env-rsvp-logic",  label: "Submit Logic", icon: "🔒", sectionId: "env-rsvp", locked: true },
    ],
  },
  {
    id: "env-footer", label: "Footer", icon: "◻",
    hideable: true, configKey: "footer",
    children: [
      { id: "env-footer-tagline", label: "Tagline",   icon: "T",  sectionId: "env-footer", elementId: "env-footer-tagline" },
      { id: "env-footer-socials", label: "Socials",   icon: "↗",  sectionId: "env-footer" },
      { id: "env-footer-copy",    label: "Copyright", icon: "🔒", sectionId: "env-footer", locked: true },
    ],
  },
];

// ─── Element definitions ───────────────────────────────────────────────────────
const ENVELOPE_ELEMENTS: Record<string, V2ElementManifest> = {
  "env-hero-names": {
    id: "env-hero-names", sectionId: "env-hero", label: "Couple Names", type: "text",
    getValue: (c) => c.couple?.combinedNames ?? "",
    setValue: (c, v) => ({ ...c, couple: { ...c.couple, combinedNames: v } }),
  },
  "env-hero-tagline": {
    id: "env-hero-tagline", sectionId: "env-hero", label: "Tagline", type: "text",
    getValue: (c) => (c as any).heroTagline ?? "",
    setValue: (c, v) => ({ ...c, heroTagline: v }),
  },
  "env-hero-date": {
    id: "env-hero-date", sectionId: "env-hero", label: "Wedding Date", type: "text",
    getValue: (c) => c.wedding?.displayDate ?? "",
    setValue: (c, v) => ({ ...c, wedding: { ...c.wedding, displayDate: v } }),
  },
  "env-hero-location": {
    id: "env-hero-location", sectionId: "env-hero", label: "Location", type: "text",
    getValue: (c) => (c as any).heroLocation ?? "",
    setValue: (c, v) => ({ ...c, heroLocation: v }),
  },
  "env-countdown-subtitle": {
    id: "env-countdown-subtitle", sectionId: "env-countdown", label: "Countdown Subtitle", type: "text",
    getValue: (c) => c.countdown?.subtitle ?? "",
    setValue: (c, v) => ({ ...c, countdown: { ...c.countdown, subtitle: v } }),
  },
  "env-story-heading": {
    id: "env-story-heading", sectionId: "env-story", label: "Story Heading", type: "text",
    getValue: (c) => (c as any).storyHeading ?? c.timeline?.title ?? "",
    setValue: (c, v) => ({ ...c, storyHeading: v }),
  },
  "env-story-body": {
    id: "env-story-body", sectionId: "env-story", label: "Story Body", type: "textarea",
    getValue: (c) => (c as any).storyBody ?? "",
    setValue: (c, v) => ({ ...c, storyBody: v }),
  },
  "env-gallery-title": {
    id: "env-gallery-title", sectionId: "env-gallery", label: "Gallery Title", type: "text",
    getValue: (c) => (c as any).galleryTitle ?? c.photos?.title ?? "",
    setValue: (c, v) => ({ ...c, galleryTitle: v }),
  },
  "env-rsvp-title": {
    id: "env-rsvp-title", sectionId: "env-rsvp", label: "RSVP Title", type: "text",
    getValue: (c) => c.rsvp?.title ?? "",
    setValue: (c, v) => ({ ...c, rsvp: { ...c.rsvp, title: v } }),
  },
  "env-rsvp-desc": {
    id: "env-rsvp-desc", sectionId: "env-rsvp", label: "RSVP Description", type: "textarea",
    getValue: (c) => c.rsvp?.description ?? "",
    setValue: (c, v) => ({ ...c, rsvp: { ...c.rsvp, description: v } }),
  },
  "env-footer-tagline": {
    id: "env-footer-tagline", sectionId: "env-footer", label: "Footer Tagline", type: "text",
    getValue: (c) => (c as any).footerTagline ?? c.footer?.thankYouMessage ?? "",
    setValue: (c, v) => ({ ...c, footerTagline: v }),
  },
};

// ─── Manifest registration ─────────────────────────────────────────────────────
const envelopeManifest: V2TemplateManifest = {
  templateKey:  "envelope",
  displayName:  "Envelope Romance",
  sections:     ENVELOPE_SECTIONS,
  elements:     ENVELOPE_ELEMENTS,
  getComponent: () => import("@/templates/envelope/EnvelopeTemplate"),
  sectionInspectors: {
    "env-envelope": EnvelopeInspector,
    "env-hero":     HeroInspector,
    "env-countdown": CountdownInspector,
    "env-details":  DetailsInspector,
    "env-story":    StoryInspector,
    "env-schedule": ScheduleInspector,
    "env-journey":  JourneyMapInspector,
    "env-gallery":  GalleryInspector,
    "env-dresscode": DressCodeInspector,
    "env-rsvp":     RsvpInspector,
    "env-footer":   FooterInspector,
  },
  themePalettes:        ENVELOPE_PALETTES,
  colorRoleConfigPaths: ENVELOPE_COLOR_ROLE_MAP,
};

registerV2Manifest(envelopeManifest);
