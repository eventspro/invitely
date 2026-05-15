/**
 * Demo Editor – default config for David & Rose Romantic template.
 * This is a DEMO-ONLY copy; it does NOT affect the live /david-rose-romantic page.
 */
import type { WeddingConfig } from "@/templates/types";

export const DEMO_STORAGE_KEY = "demo_david_rose_romantic_v1";

/** Sensible English starter values for a first-time customer */
export const DEMO_DEFAULT_CONFIG: WeddingConfig = {
  couple: {
    groomName: "David",
    brideName: "Rose",
    combinedNames: "David & Rose",
  },
  wedding: {
    date: "2025-10-11T16:00:00",
    displayDate: "October 11, 2025",
    month: "October 2025",
    day: "11",
  },
  hero: {
    invitation: "Together with their families",
    welcomeMessage: "You are cordially invited to celebrate the marriage of",
    musicButton: "Play Music",
    playIcon: "▶️",
    pauseIcon: "⏸️",
    images: ["/attached_assets/couple11.jpg"],
  },
  countdown: {
    subtitle: "Until our wedding day",
    backgroundImage: "",
    labels: {
      days: "Days",
      hours: "Hours",
      minutes: "Minutes",
      seconds: "Seconds",
    },
  },
  calendar: {
    title: "Save the Date",
    description: "Add to your calendar",
    monthTitle: "October 2025",
    dayLabels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  locations: {
    sectionTitle: "Where & When",
    venues: [
      {
        id: "ceremony",
        title: "Ceremony",
        name: "St. Mary's Church",
        description: "Wedding ceremony",
        mapButton: "Open in Maps",
        mapIcon: "🗺️",
        address: "",
        latitude: undefined,
        longitude: undefined,
        image: "",
        imagePositionX: 50,
        imagePositionY: 50,
      },
      {
        id: "reception",
        title: "Reception",
        name: "The Grand Ballroom",
        description: "Dinner & celebration",
        mapButton: "Open in Maps",
        mapIcon: "🗺️",
        address: "",
        latitude: undefined,
        longitude: undefined,
        image: "",
        imagePositionX: 50,
        imagePositionY: 50,
      },
    ],
  },
  timeline: {
    title: "Schedule",
    events: [
      { id: "1", time: "4:00 PM", title: "Ceremony", description: "Wedding ceremony begins" },
      { id: "2", time: "5:30 PM", title: "Cocktail Hour", description: "Drinks & canapés" },
      { id: "3", time: "7:00 PM", title: "Reception", description: "Dinner & dancing" },
      { id: "4", time: "11:00 PM", title: "End of Evening", description: "" },
    ],
    afterMessage: {
      thankYou: "Thank you for celebrating with us",
      notes: "Please bring comfortable shoes for dancing!",
    },
  },
  rsvp: {
    title: "RSVP",
    description: "Please let us know if you can join us",
    form: {
      firstName: "First Name",
      firstNamePlaceholder: "Your first name",
      lastName: "Last Name",
      lastNamePlaceholder: "Your last name",
      email: "Email",
      emailPlaceholder: "your@email.com",
      guestCount: "Number of Guests",
      guestCountPlaceholder: "How many guests?",
      guestNames: "Guest Names",
      guestNamesPlaceholder: "Names of all guests",
      attendance: "Will you attend?",
      attendingYes: "Happily Attending",
      attendingNo: "Regretfully Declining",
      submitButton: "Send RSVP",
      submittingButton: "Sending…",
    },
    guestOptions: [
      { value: "1", label: "1 guest" },
      { value: "2", label: "2 guests" },
      { value: "3", label: "3 guests" },
      { value: "4", label: "4 guests" },
    ],
    messages: {
      success: "Thank you! Your RSVP has been received.",
      error: "Something went wrong. Please try again.",
      loading: "Sending your RSVP…",
      required: "Please fill in all required fields.",
    },
  },
  photos: {
    title: "Our Photos",
    description: "Captured moments from our journey",
    downloadButton: "Download",
    uploadButton: "Upload Photo",
    comingSoonMessage: "Photos will be shared after the wedding",
    images: [],
    galleryImages: [],
  },
  navigation: {
    home: "Home",
    countdown: "Countdown",
    calendar: "Calendar",
    locations: "Venues",
    timeline: "Schedule",
    rsvp: "RSVP",
    photos: "Photos",
  },
  footer: {
    thankYouMessage: "Thank you for being part of our story",
    separator: "💕",
  },
  email: {
    recipients: [],
  },
  maintenance: {
    enabled: false,
    password: "",
    title: "Coming Soon",
    subtitle: "",
    message: "",
    countdownText: "Until the wedding",
    passwordPrompt: "Enter password",
    wrongPassword: "Wrong password",
    enterPassword: "Enter password",
  },
  sections: {
    hero: { enabled: true },
    countdown: { enabled: true },
    calendar: { enabled: true },
    locations: { enabled: true },
    timeline: { enabled: true },
    rsvp: { enabled: true },
    photos: { enabled: true },
  },
  ui: {
    icons: {
      heart: "♥",
      infinity: "∞",
      music: "🎵",
      calendar: "📅",
      location: "📍",
      clock: "🕐",
      camera: "📷",
      email: "✉️",
      phone: "📞",
    },
    buttons: {
      loading: "Loading…",
      close: "Close",
      cancel: "Cancel",
      save: "Save",
      back: "Back",
      next: "Next",
    },
    messages: {
      loading: "Loading…",
      error: "Something went wrong",
      success: "Done!",
      notFound: "Not found",
      offline: "You appear to be offline",
    },
  },
  mapModal: {
    title: "Location",
    closeButton: "Close",
    loadingMessage: "Loading map…",
    errorMessage: "Unable to load map",
  },
  theme: {
    colors: {
      primary: "#9f1239",
      secondary: "#be123c",
      accent: "#a855f7",
      background: "#fdf2f8",
      textColor: "#3c1a3c",
      buttonColor: "#9f1239",
    },
    fonts: {
      heading: "Playfair Display, serif",
      body: "Inter, sans-serif",
    },
  },
};

// ─── Colour palette presets ───────────────────────────────────────────────────
export interface PalettePreset {
  id: string;
  name: string;
  colors: Required<NonNullable<WeddingConfig["theme"]>>["colors"];
}

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: "rose",
    name: "Rose",
    colors: { primary: "#9f1239", secondary: "#be123c", accent: "#a855f7", background: "#fdf2f8", textColor: "#3c1a3c", buttonColor: "#9f1239" },
  },
  {
    id: "blush",
    name: "Blush",
    colors: { primary: "#c2848a", secondary: "#e8a0a6", accent: "#d4a0a6", background: "#fdf6f6", textColor: "#5c3a3c", buttonColor: "#c2848a" },
  },
  {
    id: "ivory",
    name: "Ivory & Gold",
    colors: { primary: "#b8860b", secondary: "#d4a520", accent: "#8b6914", background: "#fdfaf0", textColor: "#3c3020", buttonColor: "#b8860b" },
  },
  {
    id: "sage",
    name: "Sage Garden",
    colors: { primary: "#5f7a61", secondary: "#7a9e7c", accent: "#a0b8a0", background: "#f4f8f4", textColor: "#2c3e2e", buttonColor: "#5f7a61" },
  },
  {
    id: "midnight",
    name: "Midnight Blue",
    colors: { primary: "#1e3a5f", secondary: "#2d5a8e", accent: "#c9a84c", background: "#f0f4fa", textColor: "#1a2540", buttonColor: "#1e3a5f" },
  },
  {
    id: "lavender",
    name: "Lavender",
    colors: { primary: "#7c6b9e", secondary: "#9b8abf", accent: "#e8d5f5", background: "#f9f5ff", textColor: "#3d2d5c", buttonColor: "#7c6b9e" },
  },
];
