// Script to create Romantic Pink template in database

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { templates } from '../shared/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const romanticTemplateConfig = {
  hero: {
    musicButton: "Play Music",
    welcomeMessage: "Join us as we celebrate our love and begin our journey together as husband and wife."
  },
  rsvp: {
    form: {
      email: "Email Address",
      lastName: "Last Name", 
      firstName: "First Name",
      attendance: "Will you attend?",
      guestCount: "Number of Guests",
      guestNames: "Guest Names",
      attendingNo: "Sorry, can't make it",
      attendingYes: "Yes, I'll be there!",
      submitButton: "Send RSVP",
      emailPlaceholder: "your@email.com",
      submittingButton: "Sending...",
      lastNamePlaceholder: "Your last name",
      firstNamePlaceholder: "Your first name",
      guestCountPlaceholder: "Select number",
      guestNamesPlaceholder: "Names of all attendees"
    },
    title: "Please RSVP",
    description: "We're excited to celebrate with you! Please let us know if you can join us by June 15th, 2025.",
    guestOptions: [
      { label: "1 Guest", value: "1" },
      { label: "2 Guests", value: "2" },
      { label: "3 Guests", value: "3" },
      { label: "4 Guests", value: "4" }
    ]
  },
  email: {
    recipients: []
  },
  theme: {
    fonts: {
      body: "Inter",
      heading: "Playfair Display"
    },
    colors: {
      primary: "#be185d",
      secondary: "#e11d48",
      accent: "#f59e0b", 
      background: "#fdf2f8"
    }
  },
  couple: {
    brideName: "Rose",
    groomName: "David",
    combinedNames: "David & Rose"
  },
  footer: {
    thankYouMessage: "Thank you for being part of our love story. We can't wait to start this new chapter with all of you by our side!"
  },
  photos: {
    title: "Our Love Story",
    description: "Share in our memories",
    uploadButton: "Upload Photo",
    downloadButton: "Download",
    comingSoonMessage: "Photos coming soon"
  },
  wedding: {
    day: "22nd",
    date: "2025-09-22T15:30:00",
    month: "September",
    displayDate: "September 22nd, 2025"
  },
  calendar: {
    title: "Mark Your Calendar",
    dayLabels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    monthTitle: "Wedding Date",
    description: "Save the date for our wedding"
  },
  sections: {
    hero: { enabled: true },
    rsvp: { enabled: true },
    photos: { enabled: true },
    calendar: { enabled: true },
    timeline: { enabled: true },
    countdown: { enabled: true },
    locations: { enabled: true }
  },
  timeline: {
    title: "Wedding Day Schedule",
    events: [
      { time: "3:30 PM", title: "Guest Arrival", description: "Welcome and seating" },
      { time: "4:00 PM", title: "Wedding Ceremony", description: "At Rose Garden Chapel" },
      { time: "5:00 PM", title: "Cocktail Hour", description: "Photos and refreshments" },
      { time: "6:30 PM", title: "Reception Dinner", description: "At Garden Pavilion" },
      { time: "9:00 PM", title: "Dancing & Celebration", description: "Party until late!" }
    ],
    afterMessage: {
      notes: "Your presence makes our day complete",
      thankYou: "Thank you for celebrating with us"
    }
  },
  countdown: {
    labels: {
      days: "Days",
      hours: "Hours", 
      minutes: "Minutes",
      seconds: "Seconds"
    },
    subtitle: "Until our big day"
  },
  locations: {
    church: {
      name: "Rose Garden Chapel",
      title: "Ceremony",
      mapButton: "View on Map",
      description: "Our wedding ceremony will take place in this beautiful rose garden chapel surrounded by blooming flowers."
    },
    restaurant: {
      name: "Garden Pavilion",
      title: "Reception", 
      mapButton: "View on Map",
      description: "Join us for dinner and dancing in the romantic garden pavilion."
    },
    sectionTitle: "Wedding Locations"
  },
  navigation: {
    home: "Home",
    rsvp: "RSVP",
    calendar: "Calendar",
    timeline: "Schedule",
    countdown: "Countdown",
    locations: "Locations"
  },
  maintenance: {
    title: "Under Maintenance",
    enabled: false,
    message: "Website under maintenance",
    password: "admin123",
    subtitle: "We'll be back soon",
    countdownText: "Estimated time",
    enterPassword: "Submit",
    wrongPassword: "Incorrect password",
    passwordPrompt: "Enter password"
  }
};

async function createRomanticTemplate() {
  try {
    const newTemplate = await db.insert(templates).values({
      name: "David & Rose Romantic Wedding",
      slug: "david-rose-romantic",
      templateKey: "romantic",
      config: romanticTemplateConfig,
      maintenance: false,
    }).returning();

    console.log("✅ Romantic template created successfully!");
    console.log("Template ID:", newTemplate[0].id);
    console.log("Template URL: /david-rose-romantic");
    
  } catch (error) {
    console.error("❌ Error creating romantic template:", error);
  }
}

createRomanticTemplate();
