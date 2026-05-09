/**
 * V2 Template Authoring Example — Manifest Stub
 *
 * This file demonstrates how to create a new V2 template that works with the
 * generic V2 builder engine WITHOUT any changes to builder internals.
 *
 * ── Steps to make this template live ─────────────────────────────────────────
 * 1. Implement IrisTemplate.tsx
 * 2. Implement config.ts (defaultConfig)
 * 3. Rename this file from manifest.example.ts → manifest.ts
 * 4. Add the following line to client/src/templates/v2-templates.ts:
 *      import "./iris/manifest";
 * 5. Create the template in the database (run your seed script)
 *
 * ── data-v2 attributes required in IrisTemplate.tsx ─────────────────────────
 *   data-v2-section="iris-hero"         → on the hero <section>
 *   data-v2-element="iris-hero-title"   → on the hero title <h1>
 *   data-v2-type="text"                 → on any inline-editable text node
 *
 * ── Custom inspector (optional) ──────────────────────────────────────────────
 * If you want a custom right-panel inspector for a section, add it to
 * sectionInspectors in your manifest. Otherwise the builder uses the generic
 * inspector based on element types. Example below uses generic inspectors.
 */

import type {
  V2TemplateManifest,
  V2SectionManifest,
  V2ElementManifest,
} from "../../pages/builder-v2/manifest-types";
import { registerV2Manifest } from "../../pages/builder-v2/manifest-registry";

// ─── Sections ─────────────────────────────────────────────────────────────────
const IRIS_SECTIONS: V2SectionManifest[] = [
  {
    id: "iris-hero", label: "Hero", icon: "◻",
    hideable: true, configKey: "hero",
    children: [
      { id: "iris-hero-intro",    label: "Intro Line",    icon: "T", sectionId: "iris-hero", elementId: "iris-hero-intro" },
      { id: "iris-hero-title",    label: "Couple Names",  icon: "T", sectionId: "iris-hero", elementId: "iris-hero-title" },
      { id: "iris-hero-subtitle", label: "Date / Place",  icon: "T", sectionId: "iris-hero", elementId: "iris-hero-subtitle" },
      { id: "iris-hero-bg",       label: "Background",    icon: "🖼", sectionId: "iris-hero" },
    ],
  },
  {
    id: "iris-story", label: "Our Story", icon: "◻",
    hideable: true, configKey: "story",
    children: [
      { id: "iris-story-title", label: "Heading",    icon: "T", sectionId: "iris-story", elementId: "iris-story-title" },
      { id: "iris-story-body",  label: "Body Text",  icon: "T", sectionId: "iris-story", elementId: "iris-story-body" },
    ],
  },
  {
    id: "iris-rsvp", label: "RSVP", icon: "◻",
    hideable: true, configKey: "rsvp",
    children: [
      { id: "iris-rsvp-title", label: "Title",        icon: "T",  sectionId: "iris-rsvp", elementId: "iris-rsvp-title" },
      { id: "iris-rsvp-logic", label: "Submit Logic", icon: "🔒", sectionId: "iris-rsvp", locked: true },
    ],
  },
];

// ─── Elements ─────────────────────────────────────────────────────────────────
// Using configPath (dot-path) instead of custom getValue/setValue — fully generic.
const IRIS_ELEMENTS: Record<string, V2ElementManifest> = {
  "iris-hero-intro": {
    id: "iris-hero-intro", sectionId: "iris-hero", label: "Intro Line", type: "text",
    configPath: "hero.introLine",
  },
  "iris-hero-title": {
    id: "iris-hero-title", sectionId: "iris-hero", label: "Couple Names", type: "text",
    configPath: "couple.combinedNames",
  },
  "iris-hero-subtitle": {
    id: "iris-hero-subtitle", sectionId: "iris-hero", label: "Date / Place", type: "text",
    configPath: "wedding.displayDate",
  },
  "iris-story-title": {
    id: "iris-story-title", sectionId: "iris-story", label: "Story Heading", type: "text",
    configPath: "story.heading",
  },
  "iris-story-body": {
    id: "iris-story-body", sectionId: "iris-story", label: "Story Body", type: "textarea",
    configPath: "story.body",
  },
  "iris-rsvp-title": {
    id: "iris-rsvp-title", sectionId: "iris-rsvp", label: "RSVP Title", type: "text",
    configPath: "rsvp.title",
  },
};

// ─── Manifest ─────────────────────────────────────────────────────────────────
const irisManifest: V2TemplateManifest = {
  templateKey:  "iris",
  displayName:  "Iris",
  sections:     IRIS_SECTIONS,
  elements:     IRIS_ELEMENTS,
  // Uncomment when IrisTemplate.tsx is implemented:
  // getComponent: () => import("@/templates/iris/IrisTemplate"),
  getComponent: () => Promise.reject(new Error("Iris template not yet implemented")),

  // ── Optional: custom right-panel inspector per section ──────────────────────
  // Create client/src/templates/iris/inspectors.tsx that exports one React
  // component per section you want to customise. Import them at the top of
  // this file, then add the map below. Any section NOT listed here falls back
  // to the generic element-type inspector — so this is fully opt-in.
  //
  // sectionInspectors: {
  //   "iris-hero":  HeroInspector,
  //   "iris-story": StoryInspector,
  //   "iris-rsvp":  RsvpInspector,
  // },
};

// ── NOTE: This file is intentionally NOT auto-executed / registered. ──────────
// When the template is ready, rename this file to manifest.ts and run:
//   registerV2Manifest(irisManifest);
// Or just uncomment the line below:
// registerV2Manifest(irisManifest);

export { irisManifest };
