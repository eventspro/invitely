// Envelope Romance — Default Configuration
// Luxury bright envelope opening animated wedding template

import type { WeddingConfig } from "../types";

export const defaultConfig: WeddingConfig = {
  couple: {
    groomName: "Alexander",
    brideName: "Isabella",
    combinedNames: "Alexander & Isabella",
  },

  wedding: {
    date: "2026-10-04T16:00:00",
    displayDate: "October 4, 2026",
    month: "October",
    day: "4",
  },

  hero: {
    invitation: "TOGETHER WITH THEIR FAMILIES",
    welcomeMessage: "REQUEST THE PLEASURE OF YOUR COMPANY",
    images: [],
    musicButton: "Play Music",
    playIcon: "▶",
    pauseIcon: "⏸",
  },

  countdown: {
    subtitle: "UNTIL WE SAY I DO",
    labels: {
      days: "DAYS",
      hours: "HRS",
      minutes: "MIN",
      seconds: "SEC",
    },
  },

  calendar: {
    title: "Save the Date",
    description: "October 4, 2026",
    monthTitle: "October 2026",
    dayLabels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },

  locations: {
    sectionTitle: "WEDDING DETAILS",
    venues: [
      {
        id: "ceremony",
        title: "CEREMONY",
        name: "4:00 PM",
        description: "Grand Estate Chapel\nHillside Gardens",
        mapButton: "View on Map",
        mapIcon: "📍",
        address: "Grand Estate Chapel, 1 Chapel Lane",
      },
      {
        id: "cocktail",
        title: "COCKTAIL HOUR",
        name: "5:30 PM",
        description: "Garden Terrace\nChampagne & Canapés",
        mapButton: "View on Map",
        mapIcon: "📍",
        address: "Garden Terrace, Grand Estate",
      },
      {
        id: "reception",
        title: "RECEPTION",
        name: "7:00 PM",
        description: "The Grand Ballroom\nDinner & Dancing",
        mapButton: "View on Map",
        mapIcon: "📍",
        address: "Grand Ballroom, Grand Estate",
      },
      {
        id: "dresscode",
        title: "DRESS CODE",
        name: "Formal Attire",
        description: "We look forward to\ncelebrating with you.",
        mapButton: "",
        mapIcon: "✨",
        address: "",
      },
    ],
  },

  timeline: {
    title: "OUR STORY",
    events: [
      {
        id: "meet",
        time: "2021",
        title: "The Beginning",
        description: "A serendipitous introduction that sparked something beautiful",
      },
      {
        id: "love",
        time: "2022",
        title: "Falling in Love",
        description: "Adventures across continents and quiet evenings at home",
      },
      {
        id: "proposal",
        time: "2024",
        title: "He Asked",
        description: "Beneath a canopy of stars — she said yes",
      },
      {
        id: "forever",
        time: "2026",
        title: "Forever Begins",
        description: "Our greatest chapter starts here",
      },
    ],
    afterMessage: {
      thankYou: "Thank you for being part of our love story",
      notes: "",
    },
  },

  rsvp: {
    title: "KINDLY REPLY",
    description: "Please respond by September 1st, 2026.\nWe can't wait to celebrate with you.",
    form: {
      firstName: "FIRST NAME",
      firstNamePlaceholder: "First name",
      lastName: "LAST NAME",
      lastNamePlaceholder: "Last name",
      email: "EMAIL",
      emailPlaceholder: "your@email.com",
      guestCount: "GUESTS",
      guestCountPlaceholder: "1",
      guestNames: "DIETARY NOTES",
      guestNamesPlaceholder: "Please let us know",
      attendance: "WILL YOU JOIN US?",
      attendingYes: "Joyfully accepts",
      attendingNo: "Regretfully declines",
      submitButton: "CONFIRM RSVP",
      submittingButton: "Sending…",
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
      loading: "Sending your RSVP…",
      required: "This field is required",
    },
  },

  photos: {
    title: "OUR MOMENTS",
    description: "A collection of memories from our journey together",
    downloadButton: "Download",
    uploadButton: "Upload Photo",
    comingSoonMessage: "Gallery coming soon",
    images: [],
    galleryImages: [
      "https://images.unsplash.com/photo-1519741497674-4a7e8b4f2c76?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511285560929-6c40022e24c3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1529636444744-adffc9135a5e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80",
    ],
  },

  navigation: {
    home: "HOME",
    countdown: "WEDDING",
    calendar: "DETAILS",
    locations: "DETAILS",
    timeline: "STORY",
    rsvp: "RSVP",
    photos: "GALLERY",
  },

  footer: {
    thankYouMessage: "WITH LOVE & GRATITUDE",
    separator: "∞",
  },

  email: {
    recipients: [],
    senderName: "Alexander & Isabella",
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
      primary: "#C9A45C",
      secondary: "#2F2A24",
      accent: "#D7B56D",
      background: "#FBFAF7",
      textColor: "#1F2933",
    },
    fonts: {
      heading: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      body: "'Montserrat', 'Inter', system-ui, sans-serif",
    },
  },
} as WeddingConfig;

// Extended config fields specific to Envelope Romance template
export interface EnvelopeExtendedConfig {
  // Envelope screen
  envelopeTitle?: string;        // "You are cordially invited"
  envelopeSubtitle?: string;     // Displayed on closed envelope
  envelopeOpenCta?: string;      // "Open Your Invitation"
  envelopeInitials?: string;     // Wax seal initials, e.g. "A & I"
  envelopeBgColor?: string;      // Envelope background
  envelopePaperColor?: string;   // Paper / card color
  envelopeGoldColor?: string;    // Wax seal / gold accent color
  envelopeSkipLabel?: string;    // "Skip" button label
  animationStyle?: "elegant" | "minimal" | "cinematic";
  animationEnabled?: boolean;

  // Hero section extras
  heroTagline?: string;
  heroLocation?: string;
  heroSubtitle?: string;

  // Story section
  storyHeading?: string;
  storyBody?: string;
  storyImage?: string;

  // Venue showcase
  venueTitle?: string;
  venueSubtitle?: string;
  venueDescription?: string;
  venueAddress?: string;
  venueMapUrl?: string;
  venueImage?: string;

  // Gallery
  galleryTitle?: string;
  gallerySubtitle?: string;

  // RSVP extras
  rsvpBgImage?: string;

  // Footer
  footerTagline?: string;
  footerNote?: string;

  // Socials
  socialInstagram?: string;
  socialFacebook?: string;
  socialEmail?: string;
}
