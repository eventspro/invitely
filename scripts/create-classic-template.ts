// Create Classic Template in Database
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables first
dotenv.config({ path: resolve(__dirname, "../.env") });

// Now import storage after env is loaded
import { storage } from "../server/storage";

async function createClassicTemplate() {
  try {
    console.log("🎨 Creating Classic Wedding Template...");

    // Classic template configuration
    const config = {
      couple: {
        groomName: "Michael",
        brideName: "Sarah",
        combinedNames: "Michael & Sarah"
      },
      wedding: {
        date: "2025-07-20T15:00:00",
        displayDate: "July 20th, 2025",
        month: "July",
        day: "20th"
      },
      hero: {
        welcomeMessage: "Join us as we celebrate our love and begin our journey together as husband and wife.",
        musicButton: "Play Music"
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
        church: {
          title: "Ceremony",
          name: "Garden Chapel",
          description: "Our wedding ceremony will take place in this beautiful garden chapel surrounded by nature.",
          mapButton: "View on Map"
        },
        restaurant: {
          title: "Reception",
          name: "Sunset Terrace",
          description: "Join us for dinner and dancing on the terrace with stunning sunset views.",
          mapButton: "View on Map"
        }
      },
      timeline: {
        title: "Wedding Day Schedule",
        events: [
          {
            time: "3:00 PM",
            title: "Guest Arrival",
            description: "Welcome and seating"
          },
          {
            time: "3:30 PM",
            title: "Wedding Ceremony",
            description: "At Garden Chapel"
          },
          {
            time: "4:30 PM",
            title: "Cocktail Hour",
            description: "Photos and refreshments"
          },
          {
            time: "6:00 PM",
            title: "Reception Dinner",
            description: "At Sunset Terrace"
          },
          {
            time: "8:30 PM",
            title: "Dancing & Celebration",
            description: "Party until late!"
          }
        ],
        afterMessage: {
          thankYou: "Thank you for celebrating with us",
          notes: "Your presence makes our day complete"
        }
      },
      rsvp: {
        title: "Please RSVP",
        description: "We're excited to celebrate with you! Please let us know if you can join us by June 15th, 2025.",
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
          { value: "4", label: "4 Guests" }
        ]
      },
      photos: {
        title: "Our Love Story",
        description: "Share in our memories",
        downloadButton: "Download",
        uploadButton: "Upload Photo",
        comingSoonMessage: "Photos coming soon"
      },
      navigation: {
        home: "Home",
        countdown: "Countdown",
        calendar: "Calendar",
        locations: "Locations",
        timeline: "Schedule",
        rsvp: "RSVP"
      },
      footer: {
        thankYouMessage: "Thank you for being part of our love story. We can't wait to start this new chapter with all of you by our side!"
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
          primary: "#be185d",
          secondary: "#e11d48", 
          accent: "#f59e0b",
          background: "#fef7ff"
        },
        fonts: {
          heading: "Playfair Display",
          body: "Inter"
        }
      }
    };

    // Insert the classic template
    const result = await storage.createTemplate({
      name: "Michael & Sarah Classic Wedding",
      slug: "michael-sarah-classic",
      templateKey: "classic",
      ownerEmail: "demo@classicwedding.com",
      config,
      maintenance: false
    });

    console.log("✅ Classic template created successfully!");
    console.log(`📋 Template ID: ${result.id}`);
    console.log(`🔗 URL: /t/${result.slug}`);
    console.log(`📧 Owner: ${result.ownerEmail}`);

  } catch (error) {
    console.error("❌ Error creating classic template:", error);
    process.exit(1);
  }
}

createClassicTemplate();
