/**
 * editableRegistry.ts
 * Maps config paths to editor metadata for the click-to-edit system.
 */

export type EditableType = "text" | "textarea" | "date" | "image" | "icon" | "button" | "section";

export interface EditableRegistryEntry {
  path: string;           // dot-notation path in WeddingConfig
  type: EditableType;
  label: string;          // Tooltip/popover label
  section: string;        // Which UI section this belongs to
  multiline?: boolean;    // For text type: use textarea
  placeholder?: string;
}

export const EDITABLE_REGISTRY: EditableRegistryEntry[] = [
  // ── Couple ─────────────────────────────────────────────────────
  { path: "couple.groomName",     type: "text",     label: "Groom's Name",      section: "Invitation" },
  { path: "couple.brideName",     type: "text",     label: "Bride's Name",      section: "Invitation" },
  { path: "couple.combinedNames", type: "text",     label: "Combined Names",    section: "Invitation" },

  // ── Hero ────────────────────────────────────────────────────────
  { path: "hero.invitation",    type: "textarea", label: "Invitation Text",   section: "Invitation", multiline: true },
  { path: "hero.welcomeMessage",type: "textarea", label: "Welcome Message",   section: "Invitation", multiline: true },
  { path: "hero.musicButton",   type: "text",     label: "Music Button Text", section: "Invitation" },
  { path: "hero.images",        type: "image",    label: "Hero Background",   section: "Invitation" },

  // ── Countdown ───────────────────────────────────────────────────
  { path: "countdown.subtitle",          type: "text", label: "Countdown Subtitle",  section: "Invitation" },
  { path: "countdown.labels.days",       type: "text", label: '"Days" label',        section: "Invitation" },
  { path: "countdown.labels.hours",      type: "text", label: '"Hours" label',       section: "Invitation" },
  { path: "countdown.labels.minutes",    type: "text", label: '"Minutes" label',     section: "Invitation" },
  { path: "countdown.labels.seconds",    type: "text", label: '"Seconds" label',     section: "Invitation" },
  { path: "countdown.backgroundImage",   type: "image",label: "Countdown Background",section: "Invitation" },

  // ── Wedding date ─────────────────────────────────────────────────
  { path: "wedding.date",        type: "date",     label: "Wedding Date",      section: "Invitation" },
  { path: "wedding.displayDate", type: "text",     label: "Displayed Date",    section: "Invitation" },

  // ── Calendar ─────────────────────────────────────────────────────
  { path: "calendar.title",       type: "text",    label: "Calendar Title",     section: "Invitation" },
  { path: "calendar.description", type: "text",    label: "Calendar Description", section: "Invitation" },
  { path: "calendar.monthTitle",  type: "text",    label: "Month Label",        section: "Invitation" },

  // ── Locations ────────────────────────────────────────────────────
  { path: "locations.sectionTitle", type: "text",  label: "Venues Title",       section: "Venues" },

  // ── Timeline ─────────────────────────────────────────────────────
  { path: "timeline.title",                   type: "text",     label: "Schedule Title",     section: "Schedule" },
  { path: "timeline.afterMessage.thankYou",   type: "text",     label: "Thank You Line",     section: "Schedule" },
  { path: "timeline.afterMessage.notes",      type: "textarea", label: "Notes / Reminders",  section: "Schedule", multiline: true },

  // ── RSVP ────────────────────────────────────────────────────────
  { path: "rsvp.title",                 type: "text",     label: "RSVP Title",          section: "RSVP" },
  { path: "rsvp.description",           type: "textarea", label: "RSVP Description",    section: "RSVP", multiline: true },
  { path: "rsvp.form.firstName",        type: "text",     label: "First Name Label",    section: "RSVP" },
  { path: "rsvp.form.lastName",         type: "text",     label: "Last Name Label",     section: "RSVP" },
  { path: "rsvp.form.email",            type: "text",     label: "Email Label",         section: "RSVP" },
  { path: "rsvp.form.attendance",       type: "text",     label: "Attendance Label",    section: "RSVP" },
  { path: "rsvp.form.attendingYes",     type: "text",     label: '"Attending" Text',    section: "RSVP" },
  { path: "rsvp.form.attendingNo",      type: "text",     label: '"Declining" Text',    section: "RSVP" },
  { path: "rsvp.form.submitButton",     type: "button",   label: "Submit Button Text",  section: "RSVP" },

  // ── Photos ────────────────────────────────────────────────────────
  { path: "photos.title",              type: "text",  label: "Gallery Title",       section: "Gallery" },
  { path: "photos.description",        type: "text",  label: "Gallery Description", section: "Gallery" },
  { path: "photos.comingSoonMessage",  type: "text",  label: "Coming Soon Text",    section: "Gallery" },

  // ── Navigation ──────────────────────────────────────────────────
  { path: "navigation.home",      type: "text", label: "Nav: Home",      section: "Footer" },
  { path: "navigation.countdown", type: "text", label: "Nav: Countdown", section: "Footer" },
  { path: "navigation.calendar",  type: "text", label: "Nav: Calendar",  section: "Footer" },
  { path: "navigation.locations", type: "text", label: "Nav: Venues",    section: "Footer" },
  { path: "navigation.timeline",  type: "text", label: "Nav: Schedule",  section: "Footer" },
  { path: "navigation.rsvp",      type: "text", label: "Nav: RSVP",      section: "Footer" },
  { path: "navigation.photos",    type: "text", label: "Nav: Photos",    section: "Footer" },

  // ── Footer ──────────────────────────────────────────────────────
  { path: "footer.thankYouMessage", type: "textarea", label: "Footer Message",  section: "Footer", multiline: true },
  { path: "footer.separator",       type: "text",     label: "Separator Symbol", section: "Footer" },
];

export function getEntryByPath(path: string): EditableRegistryEntry | undefined {
  return EDITABLE_REGISTRY.find((e) => e.path === path);
}

/** Resolve a dot-notation path in an object */
export function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}
