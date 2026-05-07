/**
 * Florence Eternal — V2 Builder Manifest
 *
 * Registers Florence Eternal with the generic V2 builder engine.
 * This is the ONLY file that needs to change when Florence sections or elements change.
 *
 * ── Template authoring contract (copy this pattern for new templates) ─────────
 *   1. Template component  → FlorenceTemplate.tsx   (receives config + optional templateId props)
 *   2. Default config      → config.ts              (exports defaultConfig: WeddingConfig)
 *   3. This manifest       → manifest.ts            (define sections + elements + register)
 *   4. JSX attributes      → FlorenceTemplate.tsx   (data-v2-section, data-v2-element, data-v2-type)
 *   5. Registration index  → client/src/templates/v2-templates.ts  (one import line)
 *
 * ── data-v2 attribute contract ────────────────────────────────────────────────
 *   data-v2-section="flo-hero"          → selects the section (matches V2SectionManifest.id)
 *   data-v2-element="hero-title"        → selects the element (matches V2ElementManifest.id)
 *   data-v2-type="text"                 → enables inline editing on double-click
 */

import type {
  V2TemplateManifest,
  V2SectionManifest,
  V2ElementManifest,
} from "../../pages/builder-v2/manifest-types";
import { registerV2Manifest } from "../../pages/builder-v2/manifest-registry";
import { FLORENCE_PALETTES, FLORENCE_COLOR_ROLE_MAP } from "./palettes";
import {
  HeroInspector,
  StoryInspector,
  CountdownInspector,
  JourneyInspector,
  DetailsInspector,
  VenueInspector,
  GalleryInspector,
  RsvpInspector,
  FooterInspector,
} from "./inspectors";

// ─── Section definitions (mirrors former V2_FLORENCE_LAYERS) ─────────────────
const FLORENCE_SECTIONS: V2SectionManifest[] = [
  {
    id: "flo-hero", label: "Hero Section", icon: "◻",
    hideable: true, configKey: "hero",
    children: [
      { id: "hero-intro",    label: "Top Intro",    icon: "T", sectionId: "flo-hero", elementId: "hero-intro" },
      { id: "hero-title",    label: "Main Title",   icon: "T", sectionId: "flo-hero", elementId: "hero-title" },
      { id: "hero-date",     label: "Date",         icon: "T", sectionId: "flo-hero", elementId: "hero-date" },
      { id: "hero-location", label: "Location",     icon: "T", sectionId: "flo-hero", elementId: "hero-location" },
      { id: "hero-bg",       label: "Background",   icon: "🖼", sectionId: "flo-hero" },
    ],
  },
  {
    id: "flo-story", label: "Our Story", icon: "◻",
    hideable: true, configKey: "story",
    children: [
      { id: "story-title", label: "Heading",    icon: "T", sectionId: "flo-story", elementId: "story-title" },
      { id: "story-text",  label: "Story Text", icon: "T", sectionId: "flo-story", elementId: "story-text" },
      { id: "story-cta",   label: "CTA Button", icon: "▶", sectionId: "flo-story", elementId: "story-cta" },
      { id: "story-img",   label: "Images",     icon: "🖼", sectionId: "flo-story" },
    ],
  },
  {
    id: "flo-countdown", label: "Countdown", icon: "◻",
    hideable: true, configKey: "countdown",
    children: [
      { id: "countdown-title", label: "Heading", icon: "T", sectionId: "flo-countdown", elementId: "countdown-title" },
      { id: "countdown-nums",  label: "Numbers", icon: "#", sectionId: "flo-countdown" },
    ],
  },
  {
    id: "flo-journey", label: "Our Journey", icon: "◻",
    hideable: true, configKey: "journey",
    children: [
      { id: "journey-label",      label: "Section Label", icon: "T", sectionId: "flo-journey" },
      { id: "journey-heading",    label: "Subheading",    icon: "T", sectionId: "flo-journey" },
      { id: "journey-milestones", label: "Milestones",    icon: "≡", sectionId: "flo-journey" },
    ],
  },
  {
    id: "flo-details", label: "Wedding Details", icon: "◻",
    hideable: true, configKey: "details",
    children: [
      { id: "details-label", label: "Section Label", icon: "T", sectionId: "flo-details" },
      { id: "details-card1", label: "Card 1",         icon: "◻", sectionId: "flo-details" },
      { id: "details-card2", label: "Card 2",         icon: "◻", sectionId: "flo-details" },
      { id: "details-card3", label: "Card 3",         icon: "◻", sectionId: "flo-details" },
      { id: "details-card4", label: "Card 4",         icon: "◻", sectionId: "flo-details" },
    ],
  },
  {
    id: "flo-venue", label: "Venue", icon: "◻",
    hideable: true, configKey: "venue",
    children: [
      { id: "venue-subtitle", label: "Section Label", icon: "T", sectionId: "flo-venue", elementId: "venue-subtitle" },
      { id: "venue-title",    label: "Venue Name",    icon: "T", sectionId: "flo-venue", elementId: "venue-title" },
      { id: "venue-desc",     label: "Description",   icon: "T", sectionId: "flo-venue", elementId: "venue-desc" },
      { id: "venue-map",      label: "Address / Map", icon: "📍", sectionId: "flo-venue" },
    ],
  },
  {
    id: "flo-gallery", label: "Gallery", icon: "◻",
    hideable: true, configKey: "gallery",
    children: [
      { id: "gallery-title",  label: "Title",  icon: "T",  sectionId: "flo-gallery" },
      { id: "gallery-images", label: "Images", icon: "🖼", sectionId: "flo-gallery" },
    ],
  },
  {
    id: "flo-rsvp", label: "RSVP", icon: "◻",
    hideable: true, configKey: "rsvp",
    children: [
      { id: "rsvp-title",  label: "Title",        icon: "T",  sectionId: "flo-rsvp" },
      { id: "rsvp-desc",   label: "Description",  icon: "T",  sectionId: "flo-rsvp" },
      { id: "rsvp-form",   label: "Form Labels",  icon: "≡",  sectionId: "flo-rsvp" },
      { id: "rsvp-logic",  label: "Submit Logic", icon: "🔒", sectionId: "flo-rsvp", locked: true },
    ],
  },
  {
    id: "flo-footer", label: "Footer", icon: "◻",
    hideable: true, configKey: "footer",
    children: [
      { id: "footer-tagline", label: "Tagline",      icon: "T",  sectionId: "flo-footer", elementId: "footer-tagline" },
      { id: "footer-socials", label: "Social Links", icon: "↗",  sectionId: "flo-footer" },
      { id: "footer-copy",    label: "Copyright",    icon: "🔒", sectionId: "flo-footer", locked: true },
    ],
  },
];

// ─── Element definitions (mirrors former V2_FLORENCE_ELEMENTS) ────────────────
const FLORENCE_ELEMENTS: Record<string, V2ElementManifest> = {
  "hero-intro": {
    id: "hero-intro", sectionId: "flo-hero", label: "Top Intro", type: "text",
    getValue: (c) => (c as any).heroIntro    || "",
    setValue: (c, v) => ({ ...c, heroIntro: v }),
  },
  "hero-title": {
    id: "hero-title", sectionId: "flo-hero", label: "Couple Names", type: "text",
    getValue: (c) => c.couple?.groomName     ?? "",
    setValue: (c, v) => ({ ...c, couple: { ...c.couple, groomName: v } }),
  },
  "hero-date": {
    id: "hero-date", sectionId: "flo-hero", label: "Wedding Date", type: "text",
    getValue: (c) => c.wedding?.displayDate  || "",
    setValue: (c, v) => ({ ...c, wedding: { ...c.wedding, displayDate: v } }),
  },
  "hero-location": {
    id: "hero-location", sectionId: "flo-hero", label: "Location", type: "text",
    getValue: (c) => (c as any).heroLocation || "",
    setValue: (c, v) => ({ ...c, heroLocation: v }),
  },
  "story-title": {
    id: "story-title", sectionId: "flo-story", label: "Story Heading", type: "text",
    getValue: (c) => (c as any).storyTitle   || "",
    setValue: (c, v) => ({ ...c, storyTitle: v }),
  },
  "story-text": {
    id: "story-text", sectionId: "flo-story", label: "Story Paragraph", type: "text",
    getValue: (c) => (c as any).storyText    || "",
    setValue: (c, v) => ({ ...c, storyText: v }),
  },
  "story-cta": {
    id: "story-cta", sectionId: "flo-story", label: "Story CTA", type: "button",
    getValue: (c) => (c as any).storyCtaLabel || "",
    setValue: (c, v) => ({ ...c, storyCtaLabel: v }),
  },
  "countdown-title": {
    id: "countdown-title", sectionId: "flo-countdown", label: "Countdown Heading", type: "text",
    getValue: (c) => c.countdown?.subtitle   || "",
    setValue: (c, v) => ({ ...c, countdown: { ...c.countdown, subtitle: v } }),
  },
  "venue-subtitle": {
    id: "venue-subtitle", sectionId: "flo-venue", label: "Venue Label", type: "text",
    getValue: (c) => (c as any).venueSubtitle || "",
    setValue: (c, v) => ({ ...c, venueSubtitle: v }),
  },
  "venue-title": {
    id: "venue-title", sectionId: "flo-venue", label: "Venue Name", type: "text",
    getValue: (c) => (c as any).venueTitle   || "",
    setValue: (c, v) => ({ ...c, venueTitle: v }),
  },
  "venue-desc": {
    id: "venue-desc", sectionId: "flo-venue", label: "Venue Desc", type: "text",
    getValue: (c) => (c as any).venueDescription || "",
    setValue: (c, v) => ({ ...c, venueDescription: v }),
  },
  "footer-tagline": {
    id: "footer-tagline", sectionId: "flo-footer", label: "Footer Tagline", type: "text",
    getValue: (c) => c.footer?.thankYouMessage || "",
    setValue: (c, v) => ({ ...c, footer: { ...c.footer, thankYouMessage: v } }),
  },
};

// ─── Manifest definition ──────────────────────────────────────────────────────
export const florenceManifest: V2TemplateManifest = {
  templateKey:  "florence",
  displayName:  "Florence Eternal",
  sections:     FLORENCE_SECTIONS,
  elements:     FLORENCE_ELEMENTS,
  getComponent: () => import("@/templates/florence/FlorenceTemplate"),
  /**
   * Florence provides a custom inspector for every section.
   * BuilderRightPanel will render manifest.sectionInspectors[selectedSection]
   * when a section is selected — no Florence-specific code remains in the
   * generic builder. New V2 templates follow the same pattern.
   */
  sectionInspectors: {
    "flo-hero":      HeroInspector,
    "flo-story":     StoryInspector,
    "flo-countdown": CountdownInspector,
    "flo-journey":   JourneyInspector,
    "flo-details":   DetailsInspector,
    "flo-venue":     VenueInspector,
    "flo-gallery":   GalleryInspector,
    "flo-rsvp":      RsvpInspector,
    "flo-footer":    FooterInspector,
  },
  /**
   * Compound elements that need a full inspector rather than the generic
   * single-text-field editor. Clicking these elements in the canvas shows
   * the section inspector instead.
   */
  elementInspectors: {
    "hero-title": HeroInspector,
  },
  themePalettes:        FLORENCE_PALETTES,
  colorRoleConfigPaths: FLORENCE_COLOR_ROLE_MAP,
};

// ─── Self-registration (side-effect import) ───────────────────────────────────
// Importing this file registers Florence with the generic V2 builder engine.
registerV2Manifest(florenceManifest);
