// Aurelia — Default Configuration
// Cinematic warm luxury editorial wedding template

import type { WeddingConfig } from "../types";

export const defaultConfig: WeddingConfig = {
  couple: {
    groomName: "Matteo",
    brideName: "Sophia",
    combinedNames: "Matteo & Sophia",
  },

  wedding: {
    date: "2026-09-20T17:00:00",
    displayDate: "20 • 09 • 2026",
    month: "September",
    day: "20",
  },

  hero: {
    invitation: "TOGETHER WITH THEIR FAMILIES",
    welcomeMessage: "REQUEST THE HONOUR OF YOUR PRESENCE",
    images: [],
    musicButton: "Play Music",
    playIcon: "▶",
    pauseIcon: "⏸",
  },

  countdown: {
    subtitle: "UNTIL WE SAY I DO",
    labels: {
      days: "DAYS",
      hours: "HOURS",
      minutes: "MINUTES",
      seconds: "SECONDS",
    },
  },

  calendar: {
    title: "Save the Date",
    description: "September 20, 2026",
    monthTitle: "September 2026",
    dayLabels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },

  locations: {
    sectionTitle: "WEDDING DETAILS",
    venues: [
      {
        id: "ceremony",
        title: "CEREMONY",
        name: "5:00 PM",
        description: "Villa Cimbrone\nRavello, Amalfi Coast",
        mapButton: "View on Map",
        mapIcon: "📍",
        address: "Villa Cimbrone, Ravello, SA 84010, Italy",
      },
      {
        id: "cocktail",
        title: "COCKTAIL HOUR",
        name: "6:30 PM",
        description: "Garden Terrace\nCanapés & Prosecco",
        mapButton: "View on Map",
        mapIcon: "📍",
        address: "Villa Cimbrone Gardens, Ravello, Italy",
      },
      {
        id: "reception",
        title: "RECEPTION",
        name: "8:00 PM",
        description: "Grand Ballroom\nDinner & Dancing",
        mapButton: "View on Map",
        mapIcon: "📍",
        address: "Villa Cimbrone, Ravello, Italy",
      },
      {
        id: "dresscode",
        title: "DRESS CODE",
        name: "Black Tie Optional",
        description: "We look forward to\ncelebrating with you!",
        mapButton: "",
        mapIcon: "👗",
        address: "",
      },
    ],
  },

  timeline: {
    title: "OUR JOURNEY",
    events: [
      {
        id: "2020",
        time: "2020",
        title: "First Meeting",
        description: "A chance encounter in Rome that changed everything",
      },
      {
        id: "2021",
        time: "2021",
        title: "First Trip Together",
        description: "Wandering the streets of Positano hand in hand",
      },
      {
        id: "2023",
        time: "2023",
        title: "The Proposal",
        description: "A sunset over the Amalfi Coast — she said yes",
      },
      {
        id: "2026",
        time: "2026",
        title: "Forever Begins",
        description: "Our greatest adventure starts here",
      },
    ],
    afterMessage: {
      thankYou: "Thank you for being part of our journey",
      notes: "",
    },
  },

  rsvp: {
    title: "JOIN US",
    description: "Kindly reply by August 1st, 2026.\nWe cannot wait to celebrate with you.",
    form: {
      firstName: "FIRST NAME",
      firstNamePlaceholder: "First name",
      lastName: "LAST NAME",
      lastNamePlaceholder: "Last name",
      email: "EMAIL ADDRESS",
      emailPlaceholder: "your@email.com",
      guestCount: "GUESTS",
      guestCountPlaceholder: "1",
      guestNames: "DIETARY REQUIREMENTS",
      guestNamesPlaceholder: "Please let us know",
      attendance: "WILL YOU ATTEND?",
      attendingYes: "Joyfully accepts",
      attendingNo: "Regretfully declines",
      submitButton: "SEND RSVP",
      submittingButton: "Sending...",
    },
    guestOptions: [
      { value: "1", label: "1 Guest" },
      { value: "2", label: "2 Guests" },
      { value: "3", label: "3 Guests" },
      { value: "4", label: "4 Guests" },
    ],
    messages: {
      success: "Thank you! We look forward to celebrating with you.",
      error: "Something went wrong. Please try again.",
      loading: "Sending your RSVP...",
      required: "This field is required",
    },
  },

  photos: {
    title: "OUR MOMENTS",
    description: "A collection of memories from our journey",
    downloadButton: "Download",
    uploadButton: "Upload Photo",
    comingSoonMessage: "Gallery coming soon",
    images: [],
    galleryImages: [],
  },

  navigation: {
    home: "HOME",
    countdown: "WEDDING",
    calendar: "DETAILS",
    locations: "DETAILS",
    timeline: "JOURNEY",
    rsvp: "RSVP",
    photos: "GALLERY",
  },

  footer: {
    thankYouMessage: "FOREVER BEGINS HERE",
    separator: "&",
  },

  email: {
    recipients: [],
    senderName: "Matteo & Sophia",
  },

  maintenance: {
    enabled: false,
    password: "",
    title: "Coming Soon",
    subtitle: "Our wedding website is being prepared",
    message: "Please check back later",
    countdownText: "Days until the wedding",
    passwordPrompt: "Enter password to preview",
    wrongPassword: "Incorrect password",
    enterPassword: "Enter password",
  },

  music: {
    enabled: false,
  },

  ui: {
    icons: {
      heart: "♥",
      infinity: "∞",
      music: "♪",
      calendar: "📅",
      location: "📍",
      clock: "⏰",
      camera: "📷",
      email: "✉",
      phone: "📞",
    },
    buttons: {
      loading: "Loading...",
      close: "Close",
      cancel: "Cancel",
      save: "Save",
      back: "Back",
      next: "Next",
    },
    messages: {
      loading: "Loading...",
      error: "Something went wrong",
      success: "Success!",
      notFound: "Not found",
      offline: "You are offline",
    },
  },

  mapModal: {
    title: "Location",
    closeButton: "Close",
    loadingMessage: "Loading map...",
    errorMessage: "Failed to load map",
  },

  sections: {
    hero: { enabled: true, order: 0 },
    countdown: { enabled: true, order: 1 },
    locations: { enabled: true, order: 2 },
    timeline: { enabled: true, order: 3 },
    rsvp: { enabled: true, order: 4 },
    photos: { enabled: true, order: 5 },
    calendar: { enabled: false },
  },

  theme: {
    colors: {
      primary: "#D7B777",
      secondary: "#0C1412",
      accent: "#D7B777",
      background: "#081212",
      textColor: "#FFF7EA",
    },
    fonts: {
      heading: "Cormorant Garamond, Georgia, serif",
      body: "Montserrat, Inter, sans-serif",
    },
  },
} as WeddingConfig;

// Extended config fields for Aurelia template (optional, stored as flat JSONB keys)
export interface AureliaExtendedConfig {
  heroTagline?: string;           // e.g. "A Love Story Written in the Stars"
  heroLocation?: string;          // e.g. "Amalfi Coast, Italy"
  storyHeading?: string;          // e.g. "How It All Began"
  storyHeadingEmphasis?: string;  // e.g. "Began" — rendered in champagne italic
  storyBody?: string;             // Story paragraph
  storyCtaLabel?: string;         // e.g. "OUR FULL STORY"
  storyImage?: string;            // Single editorial image URL
  roadmapHeading?: string;        // e.g. "The Road That Led Us Here"
  venueTitle?: string;            // e.g. "Villa Cimbrone"
  venueSubtitle?: string;         // e.g. "THE VENUE"
  venueDescription?: string;
  venueCtaLabel?: string;
  venueAddress?: string;
  venueMapUrl?: string;
  venueImage?: string;
  galleryTitle?: string;
  gallerySubtitle?: string;
  footerTagline?: string;
  nameSeparator?: string;
  rsvpBgImage?: string;
  rsvpNote?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialEmail?: string;
  venueLocation?: string;
}
