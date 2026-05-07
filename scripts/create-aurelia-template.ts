// Script to create Aurelia template in database
// Usage: npx tsx scripts/create-aurelia-template.ts
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

const aureliaTemplateConfig = {
  couple: {
    groomName: "Matteo",
    brideName: "Isabelle",
    combinedNames: "Matteo & Isabelle",
  },

  wedding: {
    date: "2026-09-20T17:00:00",
    displayDate: "20 • 09 • 2026",
    month: "September",
    day: "20",
  },

  hero: {
    invitation: "TOGETHER WITH THEIR FAMILIES",
    welcomeMessage: "INVITE YOU TO CELEBRATE THEIR WEDDING",
    images: [],
    musicButton: "Play Music",
    playIcon: "▶",
    pauseIcon: "⏸",
  },

  // Extended Aurelia-specific fields (flat in JSONB)
  heroTagline:   "JOIN US AS WE SAY I DO",
  heroLocation:  "Amalfi Coast, Italy",
  nameSeparator: "&",

  storyHeading:          "How It All Began",
  storyHeadingEmphasis:  "Began",
  storyBody:
    "We crossed paths on a warm summer evening in Rome — a chance encounter that neither of us expected. What started as a brief conversation turned into hours, then days, then years of shared adventure and quiet joy.",
  storyCtaLabel: "OUR FULL STORY",
  storyImage:    "",

  roadmapHeading: "The Road That Led Us Here",

  venueSubtitle:    "THE VENUE",
  venueTitle:       "Villa Cimbrone",
  venueDescription:
    "A timeless Italian villa perched on the clifftops above the Amalfi Coast, surrounded by ancient gardens and breathtaking sea views.",
  venueCtaLabel:    "EXPLORE THE VENUE",
  venueAddress:     "Via Santa Chiara, 26\nRavello, SA 84010, Italy",
  venueMapUrl:      "https://www.google.com/maps/search/Villa+Cimbrone+Ravello+Italy",
  venueImage:       "",

  galleryTitle:    "Our Favorite Moments",
  gallerySubtitle: "A GLIMPSE INTO OUR JOURNEY",

  footerTagline:    "FOREVER BEGINS HERE",

  socialInstagram: "",
  socialFacebook:  "",
  socialEmail:     "",

  countdown: {
    subtitle: "UNTIL WE SAY I DO",
    labels: {
      days:    "DAYS",
      hours:   "HOURS",
      minutes: "MINUTES",
      seconds: "SECONDS",
    },
  },

  calendar: {
    title:       "Save the Date",
    description: "September 20, 2026",
    monthTitle:  "September 2026",
    dayLabels:   ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },

  locations: {
    sectionTitle: "WEDDING DETAILS",
    venues: [
      {
        id:          "ceremony",
        title:       "CEREMONY",
        name:        "5:00 PM",
        description: "Villa Cimbrone Chapel\nRavello, Amalfi Coast",
        mapButton:   "View on Map",
        mapIcon:     "💒",
        address:     "Villa Cimbrone, Ravello, Italy",
      },
      {
        id:          "cocktail",
        title:       "COCKTAIL HOUR",
        name:        "6:00 PM",
        description: "The Belvedere Terrace\nChampagne & Aperitivo",
        mapButton:   "View on Map",
        mapIcon:     "🥂",
        address:     "Villa Cimbrone Terrace, Ravello, Italy",
      },
      {
        id:          "reception",
        title:       "RECEPTION",
        name:        "7:30 PM",
        description: "Villa Cimbrone Gardens\nDinner & Dancing",
        mapButton:   "View on Map",
        mapIcon:     "🌹",
        address:     "Villa Cimbrone Gardens, Ravello, Italy",
      },
      {
        id:          "dresscode",
        title:       "DRESS CODE",
        name:        "Black Tie",
        description: "Evening attire required.\nWe look forward to celebrating with you!",
        mapButton:   "",
        mapIcon:     "👔",
        address:     "",
      },
    ],
  },

  timeline: {
    title: "THE ROAD THAT LED US HERE",
    events: [
      {
        id:          "2019",
        time:        "Summer 2019",
        title:       "First Meeting",
        description: "A chance encounter in Rome that neither of us expected",
      },
      {
        id:          "2020",
        time:        "Winter 2020",
        title:       "First Adventure",
        description: "A weekend in the Dolomites that changed everything",
      },
      {
        id:          "2022",
        time:        "Spring 2022",
        title:       "The Question",
        description: "Under the stars on the Amalfi cliffs — she said yes",
      },
      {
        id:          "2026",
        time:        "September 2026",
        title:       "Forever",
        description: "Our journey continues — together, always",
      },
    ],
    afterMessage: {
      thankYou: "Thank you for being part of our story",
      notes:    "",
    },
  },

  rsvp: {
    title:       "RSVP",
    description: "Please RSVP by July 1st, 2026.\nWe look forward to celebrating with you!",
    form: {
      firstName:             "FIRST NAME",
      firstNamePlaceholder:  "First name",
      lastName:              "LAST NAME",
      lastNamePlaceholder:   "Last name",
      email:                 "EMAIL ADDRESS",
      emailPlaceholder:      "your@email.com",
      guestCount:            "NUMBER OF GUESTS",
      guestCountPlaceholder: "1",
      guestNames:            "DIETARY RESTRICTIONS",
      guestNamesPlaceholder: "Please let us know of any dietary requirements",
      attendance:            "WILL YOU ATTEND?",
      attendingYes:          "Accepts with pleasure",
      attendingNo:           "Declines with regret",
      submitButton:          "SEND RSVP",
      submittingButton:      "Sending...",
    },
    guestOptions: [
      { value: "1", label: "1 Guest" },
      { value: "2", label: "2 Guests" },
      { value: "3", label: "3 Guests" },
      { value: "4", label: "4 Guests" },
    ],
    messages: {
      success:  "Thank you for your RSVP! We can't wait to celebrate with you.",
      error:    "Something went wrong. Please try again.",
      loading:  "Sending your RSVP...",
      required: "This field is required",
    },
  },

  photos: {
    title:             "Our Favorite Moments",
    description:       "A GLIMPSE INTO OUR JOURNEY",
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
    timeline:  "JOURNEY",
    rsvp:      "RSVP",
    photos:    "GALLERY",
  },

  footer: {
    thankYouMessage: "FOREVER BEGINS HERE",
    separator:       "&",
  },

  email: {
    recipients: [],
    senderName: "Matteo & Isabelle",
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
    story:     { enabled: true, order: 1 },
    timeline:  { enabled: true, order: 2 },
    locations: { enabled: true, order: 3 },
    venue:     { enabled: true, order: 4 },
    photos:    { enabled: true, order: 5 },
    rsvp:      { enabled: true, order: 6 },
    countdown: { enabled: true,  order: 0 },
    calendar:  { enabled: false },
  },

  theme: {
    colors: {
      primary:         "#C4A97D",
      secondary:       "#1C1917",
      accent:          "#C4A97D",
      background:      "#FAF8F4",
      textColor:       "#44403C",
      mutedText:       "#78716C",
      lightText:       "#FAFAF9",
      cardBackground:  "#EDE8DF",
      cardBorder:      "#D4C5A9",
    },
    fonts: {
      heading: "Cormorant Garamond, Georgia, serif",
      body:    "Raleway, Inter, sans-serif",
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

const SLUG = "aurelia";

async function createAureliaTemplate() {
  try {
    // Check if already exists to keep script idempotent
    const existing = await db
      .select({ id: templates.id })
      .from(templates)
      .where(eq(templates.slug, SLUG))
      .limit(1);

    if (existing.length > 0) {
      console.log(`ℹ️  Aurelia template already exists (slug: "${SLUG}", id: ${existing[0].id})`);
      console.log("   Delete it first or change the SLUG constant to create a fresh instance.");
      process.exit(0);
    }

    const [created] = await db.insert(templates).values({
      name:            "Aurelia",
      slug:            SLUG,
      templateKey:     "aurelia",
      config:          aureliaTemplateConfig,
      maintenance:     false,
      isMain:          true,
      templateVersion: 2,
    }).returning();

    console.log("✅ Aurelia template created successfully!");
    console.log("   Template ID:  ", created.id);
    console.log("   Template URL: ", `/${SLUG}`);
    console.log("   Version:      ", "v2 (Main Templates v2)");
    console.log("   Builder URL:  ", `/platform/builder-v2/${created.id}`);
    console.log("   Admin URL:    ", `/platform-admin → Templates V2 - Main`);

  } catch (error) {
    console.error("❌ Error creating Aurelia template:", error);
    process.exit(1);
  }
}

createAureliaTemplate();
