// Default configuration for Classic Wedding Template
import type { WeddingConfig } from "../types";

export const defaultConfig: WeddingConfig = {
  couple: {
    groomName: "John",
    brideName: "Jane",
    combinedNames: "John & Jane"
  },
  wedding: {
    date: "2025-06-15T16:00:00",
    displayDate: "June 15th, 2025",
    month: "June",
    day: "15th"
  },
  hero: {
    invitation: "You're Invited to Our Wedding",
    welcomeMessage: "We're getting married and we want you to celebrate with us!",
    musicButton: "Play Music",
    playIcon: "▶️",
    pauseIcon: "⏸️",
    images: [
      "/attached_assets/default-wedding-couple.jpg",
      "/attached_assets/couple11.jpg"
    ]
  },
  countdown: {
    subtitle: "Until our big day",
    labels: {
      days: "Days",
      hours: "Hours", 
      minutes: "Minutes",
      seconds: "Seconds"
    }
  },
  calendar: {
    title: "Mark Your Calendar",
    description: "Save the date for our wedding",
    monthTitle: "Wedding Date",
    dayLabels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  },
  locations: {
    sectionTitle: "Wedding Locations",
    venues: [
      {
        id: "ceremony",
        title: "Ceremony",
        name: "St. Mary's Church",
        description: "Join us for our wedding ceremony at this beautiful historic church.",
        mapButton: "View on Map",
        mapIcon: "📍"
      },
      {
        id: "reception",
        title: "Reception",
        name: "Grand Ballroom",
        description: "Celebrate with us at our reception with dinner and dancing.",
        mapButton: "View on Map",
        mapIcon: "📍"
      }
    ]
  },
  timeline: {
    title: "Wedding Day Schedule",
    events: [
      {
        time: "4:00 PM",
        title: "Wedding Ceremony",
        description: "At St. Mary's Church"
      },
      {
        time: "5:30 PM",
        title: "Cocktail Hour",
        description: "Photos and drinks"
      },
      {
        time: "7:00 PM",
        title: "Reception Dinner",
        description: "At Grand Ballroom"
      },
      {
        time: "9:00 PM",
        title: "Dancing",
        description: "Party the night away!"
      }
    ],
    afterMessage: {
      thankYou: "Thank you for celebrating with us",
      notes: "Your presence is the greatest gift"
    }
  },
  rsvp: {
    title: "Please RSVP",
    description: "We hope you can join us on our special day. Please respond by May 1st, 2025.",
    form: {
      firstName: "First Name",
      firstNamePlaceholder: "Your first name",
      lastName: "Last Name",
      lastNamePlaceholder: "Your last name",
      email: "Email Address",
      emailPlaceholder: "your@email.com",
      guestCount: "Number of Guests",
      guestCountPlaceholder: "Select number",
      guestNames: "Guest Names",
      guestNamesPlaceholder: "Names of all attendees",
      attendance: "Will you attend?",
      attendingYes: "Yes, I'll be there!",
      attendingNo: "Sorry, can't make it",
      submitButton: "Send RSVP",
      submittingButton: "Sending..."
    },
    guestOptions: [
      { value: "1", label: "1 Guest" },
      { value: "2", label: "2 Guests" },
      { value: "3", label: "3 Guests" },
      { value: "4", label: "4 Guests" },
      { value: "5", label: "5 Guests" },
      { value: "6", label: "6 Guests" }
    ],
    messages: {
      success: "Thank you! Your RSVP has been received.",
      error: "There was an error submitting your RSVP. Please try again.",
      loading: "Submitting your RSVP...",
      required: "This field is required."
    }
  },
  photos: {
    title: "Our Photos",
    description: "Share in our memories",
    downloadButton: "Download",
    uploadButton: "Upload Photo",
    comingSoonMessage: "Photos coming soon",
    images: ["/api/assets/default-wedding-couple.jpg"]
  },
  navigation: {
    home: "Home",
    countdown: "Countdown",
    calendar: "Calendar",
    locations: "Locations",
    timeline: "Schedule",
    rsvp: "RSVP",
    photos: "Photos"
  },
  footer: {
    thankYouMessage: "Thank you for being part of our love story. We can't wait to celebrate with you!"
  },
  email: {
    recipients: []
  },
  maintenance: {
    enabled: false,
    password: "admin123",
    title: "Under Maintenance",
    subtitle: "We'll be back soon",
    message: "Website under maintenance",
    countdownText: "Estimated time",
    passwordPrompt: "Enter password",
    wrongPassword: "Incorrect password",
    enterPassword: "Submit"
  },
  ui: {
    icons: {
      heart: "🤍",
      infinity: "∞",
      music: "🎵",
      calendar: "📅",
      location: "📍",
      clock: "🕒",
      camera: "📷",
      email: "📧",
      phone: "📞"
    },
    buttons: {
      loading: "Loading...",
      close: "Close",
      cancel: "Cancel",
      save: "Save",
      back: "Back",
      next: "Next"
    },
    messages: {
      loading: "Loading...",
      error: "An error occurred",
      success: "Successfully saved",
      notFound: "Not found",
      offline: "No internet connection"
    }
  },
  mapModal: {
    title: "Location",
    closeButton: "Close",
    loadingMessage: "Loading map...",
    errorMessage: "Failed to load map"
  },
  sections: {
    hero: { enabled: true },
    countdown: { enabled: true },
    calendar: { enabled: true },
    locations: { enabled: true },
    timeline: { enabled: true },
    rsvp: { enabled: true },
    photos: { enabled: true }
  },
  theme: {
    colors: {
      primary: "#831843",      // Deep burgundy
      secondary: "#be185d",    // Muted rose  
      accent: "#6366f1",       // Soft indigo
      background: "#fef7ff"    // Very light lavender
    },
    fonts: {
      heading: "Playfair Display",
      body: "Inter"
    }
  }
};
