// Script to create Florence Eternal template in database
// Usage: npx tsx scripts/create-florence-template.ts
// Adds to "Main Templates v2" (templateVersion: 2, isMain: true)

import { config } from "dotenv";
import { resolve } from "path";

// Load .env from project root (supports running from any directory)
config({ path: resolve(process.cwd(), ".env") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { templates } from "../shared/schema";
import { eq } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found. Make sure .env exists in the project root.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const florenceTemplateConfig = {
  couple: {
    groomName: "Alexander",
    brideName: "Rosalie",
    combinedNames: "Alexander & Rosalie",
  },

  wedding: {
    date: "2025-07-12T16:00:00",
    displayDate: "12 • 07 • 2025",
    month: "July",
    day: "12",
  },

  hero: {
    invitation: "TOGETHER WITH THEIR FAMILIES",
    welcomeMessage: "INVITE YOU TO CELEBRATE THEIR WEDDING",
    images: [],
    musicButton: "Play Music",
    playIcon: "▶",
    pauseIcon: "⏸",
  },

  // Extended Florence-specific fields (flat in JSONB)
  heroLocation: "FLORENCE, ITALY",
  heroIntro: "TOGETHER WITH THEIR FAMILIES",
  heroSub: "INVITE YOU TO CELEBRATE THEIR WEDDING",

  storyTitle: "Two paths. One forever.",
  storyTitleEmphasis: "forever.",
  storyText:
    "We met on a rainy afternoon in a small bookstore. What started as a simple conversation turned into a beautiful journey we now get to continue — together.",
  storyCtaLabel: "READ OUR STORY",

  journeyHeading: "Every moment led us here.",

  venueTitle: "Villa di Maiano",
  venueSubtitle: "THE VENUE",
  venueDescription:
    "A timeless Italian villa surrounded by cypress trees and rolling hills, where history and beauty converge.",
  venueCtaLabel: "VIEW VENUE",
  venueAddress: "Via del Salviatino, 6\n50137 Florence, Italy",
  venueMapUrl: "https://www.google.com/maps/search/Villa+di+Maiano+Florence",

  countdown: {
    subtitle: "COUNTDOWN TO OUR BIG DAY",
    labels: {
      days:    "DAYS",
      hours:   "HOURS",
      minutes: "MINUTES",
      seconds: "SECONDS",
    },
  },

  calendar: {
    title:       "Save the Date",
    description: "July 12, 2025",
    monthTitle:  "July 2025",
    dayLabels:   ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },

  locations: {
    sectionTitle: "WEDDING DETAILS",
    venues: [
      {
        id:          "ceremony",
        title:       "CEREMONY",
        name:        "4:30 PM",
        description: "Basilica di San Miniato\nal Monte, Florence",
        mapButton:   "View on Map",
        mapIcon:     "📍",
        address:     "Basilica di San Miniato al Monte, Florence",
      },
      {
        id:          "cocktail",
        title:       "COCKTAIL HOUR",
        name:        "5:30 PM",
        description: "Giardino della Villa\nCocktail & Canapés",
        mapButton:   "View on Map",
        mapIcon:     "📍",
        address:     "Giardino della Villa, Florence",
      },
      {
        id:          "reception",
        title:       "RECEPTION",
        name:        "7:00 PM",
        description: "Villa di Maiano\nDinner & Dancing",
        mapButton:   "View on Map",
        mapIcon:     "📍",
        address:     "Villa di Maiano, Florence",
      },
      {
        id:          "dresscode",
        title:       "DRESS CODE",
        name:        "Black Tie",
        description: "We can't wait to celebrate\nwith you!",
        mapButton:   "",
        mapIcon:     "👗",
        address:     "",
      },
    ],
  },

  timeline: {
    title: "THE JOURNEY",
    events: [
      { id: "2017", time: "2017", title: "We Met",        description: "A rainy afternoon in a small bookstore" },
      { id: "2019", time: "2019", title: "First Trip",    description: "An adventure that changed everything" },
      { id: "2021", time: "2021", title: "She Said Yes",  description: "The most beautiful yes" },
      { id: "2025", time: "2025", title: "Forever Starts", description: "Our journey continues together" },
    ],
    afterMessage: {
      thankYou: "Thank you for being part of our journey",
      notes:    "",
    },
  },

  rsvp: {
    title:       "RSVP",
    description: "Please RSVP by October 1st, 2025.\nWe can't wait to celebrate with you!",
    form: {
      firstName:              "FIRST NAME",
      firstNamePlaceholder:   "First name",
      lastName:               "LAST NAME",
      lastNamePlaceholder:    "Last name",
      email:                  "EMAIL ADDRESS",
      emailPlaceholder:       "your@email.com",
      guestCount:             "GUESTS",
      guestCountPlaceholder:  "1",
      guestNames:             "DIETARY RESTRICTIONS",
      guestNamesPlaceholder:  "Please let us know",
      attendance:             "WILL YOU ATTEND?",
      attendingYes:           "Accepts with pleasure",
      attendingNo:            "Declines with regret",
      submitButton:           "SEND RSVP",
      submittingButton:       "Sending...",
    },
    guestOptions: [
      { value: "1", label: "1 Guest" },
      { value: "2", label: "2 Guests" },
      { value: "3", label: "3 Guests" },
      { value: "4", label: "4 Guests" },
    ],
    messages: {
      success:  "Thank you for your RSVP! We look forward to celebrating with you.",
      error:    "Something went wrong. Please try again.",
      loading:  "Sending your RSVP...",
      required: "This field is required",
    },
  },

  photos: {
    title:             "A FEW OF OUR FAVORITE MOMENTS",
    description:       "Captured memories from our journey together",
    downloadButton:    "Download",
    uploadButton:      "Upload Photo",
    comingSoonMessage: "Photos coming soon",
    images:            [],
    galleryImages:     [],
  },

  navigation: {
    home:      "HOME",
    countdown: "WEDDING",
    calendar:  "DETAILS",
    locations: "DETAILS",
    timeline:  "OUR STORY",
    rsvp:      "RSVP",
    photos:    "GALLERY",
  },

  footer: {
    thankYouMessage: "FOREVER STARTS HERE",
    separator:       "&",
  },

  email: {
    recipients: [],
    senderName: "Alexander & Rosalie",
  },

  maintenance: {
    enabled:         false,
    password:        "",
    title:           "Coming Soon",
    subtitle:        "Our wedding website is being prepared",
    message:         "Please check back later",
    countdownText:   "Days until the wedding",
    passwordPrompt:  "Enter password to preview",
    wrongPassword:   "Incorrect password",
    enterPassword:   "Enter password",
  },

  music: {
    enabled: false,
  },

  sections: {
    hero:      { enabled: true, order: 0 },
    countdown: { enabled: true, order: 1 },
    locations: { enabled: true, order: 2 },
    timeline:  { enabled: true, order: 3 },
    rsvp:      { enabled: true, order: 4 },
    photos:    { enabled: true, order: 5 },
    calendar:  { enabled: false },
  },

  theme: {
    colors: {
      primary:    "#C9A86A",
      secondary:  "#2E3427",
      accent:     "#C9A86A",
      background: "#F5F1EA",
      textColor:  "#252B1F",
    },
    fonts: {
      heading: "Playfair Display, Georgia, serif",
      body:    "Montserrat, Inter, sans-serif",
    },
  },

  ui: {
    icons: {
      heart:    "♥",
      infinity: "∞",
      music:    "♪",
      calendar: "📅",
      location: "📍",
      clock:    "⏰",
      camera:   "📷",
      email:    "✉",
      phone:    "📞",
    },
    buttons: {
      loading: "Loading...",
      close:   "Close",
      cancel:  "Cancel",
      save:    "Save",
      back:    "Back",
      next:    "Next",
    },
    messages: {
      loading:  "Loading...",
      error:    "Something went wrong",
      success:  "Success!",
      notFound: "Not found",
      offline:  "You are offline",
    },
  },

  mapModal: {
    title:          "Location",
    closeButton:    "Close",
    loadingMessage: "Loading map...",
    errorMessage:   "Failed to load map",
  },
};

const SLUG = "florence-eternal";

async function createFlorenceTemplate() {
  try {
    // Check if already exists to keep script idempotent
    const existing = await db
      .select({ id: templates.id })
      .from(templates)
      .where(eq(templates.slug, SLUG))
      .limit(1);

    if (existing.length > 0) {
      console.log(`ℹ️  Florence Eternal template already exists (slug: "${SLUG}", id: ${existing[0].id})`);
      console.log("   Run with --force to update the config.");
      process.exit(0);
    }

    const [created] = await db.insert(templates).values({
      name:            "Florence Eternal",
      slug:            SLUG,
      templateKey:     "florence",
      config:          florenceTemplateConfig,
      maintenance:     false,
      isMain:          true,
      templateVersion: 2,
    }).returning();

    console.log("✅ Florence Eternal template created successfully!");
    console.log("   Template ID:  ", created.id);
    console.log("   Template URL: ", `/${SLUG}`);
    console.log("   Version:      ", "v2 (Main Templates v2)");
    console.log("   Admin URL:    ", `/platform-admin → Templates V2 - Main`);

  } catch (error) {
    console.error("❌ Error creating Florence Eternal template:", error);
    process.exit(1);
  }
}

createFlorenceTemplate();
