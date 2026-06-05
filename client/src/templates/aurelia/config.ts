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
    sectionTitle: "WEDDING NOTES",
    venues: [
      {
        id: "dresscode",
        title: "DRESS CODE",
        name: "Black Tie Optional",
        description: "We kindly ask guests to dress elegantly.",
        mapButton: "",
        mapIcon: "hanger",
        address: "",
      },
      {
        id: "gifts",
        title: "GIFTS",
        name: "Your Presence",
        description: "Your presence is the greatest gift. A gift table will be available.",
        mapButton: "",
        mapIcon: "gift",
        address: "",
      },
      {
        id: "parking",
        title: "PARKING",
        name: "Available On-Site",
        description: "Complimentary parking is available for all guests.",
        mapButton: "",
        mapIcon: "car",
        address: "",
      },
      {
        id: "rsvpdate",
        title: "RSVP BY",
        name: "August 1st, 2026",
        description: "Kindly confirm your attendance by this date.",
        mapButton: "",
        mapIcon: "calendar",
        address: "",
      },
    ],
  },

  timeline: {
    title: "WEDDING ROUTE",
    events: [
      {
        id: "stop-1",
        time: "11:00 AM",
        title: "Bride's House",
        description: "Family gathering and preparation.",
        address: "",
        mapUrl: "",
        buttonText: "Open in Maps",
      },
      {
        id: "stop-2",
        time: "12:00 PM",
        title: "Groom's House",
        description: "Traditional visit and departure.",
        address: "",
        mapUrl: "",
        buttonText: "Open in Maps",
      },
      {
        id: "stop-3",
        time: "2:00 PM",
        title: "Ceremony",
        description: "Wedding ceremony location.",
        address: "",
        mapUrl: "",
        buttonText: "Open in Maps",
      },
      {
        id: "stop-4",
        time: "4:00 PM",
        title: "Photo Session",
        description: "Photoshoot with family and friends.",
        address: "",
        mapUrl: "",
        buttonText: "Open in Maps",
      },
      {
        id: "stop-5",
        time: "6:00 PM",
        title: "Restaurant",
        description: "Reception and dinner.",
        address: "",
        mapUrl: "",
        buttonText: "Open in Maps",
      },
    ],
    afterMessage: {
      thankYou: "We can't wait to celebrate with you!",
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
    timeline: "ROUTE",
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
  heroInvitationLine?: string;    // e.g. "WE'RE GETTING MARRIED"
  heroCta?: string;               // e.g. "RSVP NOW"
  storyHeading?: string;          // e.g. "How It All Began"
  storyHeadingEmphasis?: string;  // e.g. "Began" — rendered in champagne italic
  storyBody?: string;             // Story paragraph
  storyCtaLabel?: string;         // e.g. "OUR FULL STORY"
  storyImage?: string;            // Single editorial image URL
  storySmallTitle?: string;       // e.g. "OUR STORY" — small label above story heading
  roadmapHeading?: string;        // e.g. "Your Wedding Day Roadmap"
  roadmapSmallTitle?: string;     // e.g. "WEDDING ROUTE" — small label above roadmap heading
  roadmapSubtitle?: string;       // e.g. "Follow the route from the first stop to the final celebration."
  roadmapBgImage?: string;        // Route section background image URL
  routeInstruction?: string;      // e.g. "Scroll to follow the route"
  venueTitle?: string;            // e.g. "Villa Cimbrone"
  venueSubtitle?: string;         // e.g. "THE VENUE"
  venueDescription?: string;
  venueCtaLabel?: string;
  venueAddress?: string;
  venueMapUrl?: string;
  venueImage?: string;
  venueLocation?: string;         // deprecated alias for venueAddress
  detailsSmallTitle?: string;     // e.g. "JOIN US" — small label above details section title
  galleryTitle?: string;
  gallerySubtitle?: string;       // e.g. "OUR MOMENTS" — small label above gallery title
  galleryBgImage?: string;        // Gallery section tinted background image URL
  galleryHint?: string;           // e.g. "DRAG OR SCROLL TO EXPLORE"
  footerTagline?: string;
  nameSeparator?: string;
  rsvpBgImage?: string;
  rsvpNote?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialEmail?: string;
  showStopNumbers?: boolean;  // show/hide 01 02 03 labels on route stop cards (default: true)
}
