// Template system type definitions
export interface WeddingConfig {
  // Couple Information
  couple: {
    groomName: string;
    brideName: string;
    combinedNames: string;
  };

  // Wedding Date & Time
  wedding: {
    date: string; // ISO format: YYYY-MM-DDTHH:MM:SS
    displayDate: string;
    month: string;
    day: string;
  };

  // Hero Section
  hero: {
    invitation: string; // Main invitation text
    welcomeMessage: string;
    musicButton: string;
    playIcon: string; // Icon or text for play
    pauseIcon: string; // Icon or text for pause
    images?: string[]; // Array of image URLs for hero background
    currentImageIndex?: number; // For admin interface
  };

  // Countdown Section
  countdown: {
    subtitle: string;
    labels: {
      days: string;
      hours: string;
      minutes: string;
      seconds: string;
    };
  };

  // Calendar Section
  calendar: {
    title: string;
    description: string;
    monthTitle: string;
    dayLabels: string[];
  };

  // Locations
  locations: {
    sectionTitle: string;
    venues: Array<{
      id: string; // Unique identifier for each location
      title: string; // e.g., "Ceremony", "Reception", "Cocktail Hour"
      name: string;
      description: string;
      mapButton: string;
      mapIcon: string; // Configurable map icon text/symbol
      image?: string; // Location image URL
      latitude?: number; // GPS coordinates
      longitude?: number; // GPS coordinates
      address?: string; // Full address for display
    }>;
  };

  // Timeline Events
  timeline: {
    title: string;
    events: Array<{
      id?: string; // Unique identifier for each event
      time: string;
      title: string;
      description?: string;
      icon?: string; // Custom icon for the event
    }>;
    afterMessage: {
      thankYou: string;
      notes: string;
    };
  };

  // RSVP Section
  rsvp: {
    title: string;
    description: string;
    form: {
      firstName: string;
      firstNamePlaceholder: string;
      lastName: string;
      lastNamePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      guestCount: string;
      guestCountPlaceholder: string;
      guestNames: string;
      guestNamesPlaceholder: string;
      attendance: string;
      attendingYes: string;
      attendingNo: string;
      submitButton: string;
      submittingButton: string;
    };
    guestOptions: Array<{
      value: string;
      label: string;
    }>;
    messages: {
      success: string;
      error: string;
      loading: string;
      required: string;
    };
  };

  // Photo Section
  photos: {
    title: string;
    description: string;
    downloadButton: string;
    uploadButton: string;
    comingSoonMessage: string;
    images?: string[]; // Array of love story image URLs
    galleryImages?: string[]; // Array of gallery image URLs
  };

  // Navigation
  navigation: {
    home: string;
    countdown: string;
    calendar: string;
    locations: string;
    timeline: string;
    rsvp: string;
    photos: string;
  };

  // Footer
  footer: {
    thankYouMessage: string;
  };

  // Email Configuration
  email: {
    recipients: string[];
  };

  // Maintenance Mode Configuration
  maintenance: {
    enabled: boolean;
    password: string;
    title: string;
    subtitle: string;
    message: string;
    countdownText: string;
    passwordPrompt: string;
    wrongPassword: string;
    enterPassword: string;
  };

  // Template-specific sections control
  sections?: {
    hero?: { enabled: boolean; order?: number };
    countdown?: { enabled: boolean; order?: number };
    calendar?: { enabled: boolean; order?: number };
    locations?: { enabled: boolean; order?: number };
    timeline?: { enabled: boolean; order?: number };
    rsvp?: { enabled: boolean; order?: number };
    photos?: { enabled: boolean; order?: number };
  };

  // UI Elements & Icons
  ui: {
    icons: {
      heart: string; // Heart symbol/icon
      infinity: string; // Infinity symbol between names
      music: string; // Music related symbols
      calendar: string; // Calendar icon
      location: string; // Location/map icon
      clock: string; // Clock/time icon
      camera: string; // Photo/camera icon
      email: string; // Email icon
      phone: string; // Phone icon
    };
    buttons: {
      loading: string; // Generic loading text
      close: string; // Close button text
      cancel: string; // Cancel button text
      save: string; // Save button text
      back: string; // Back button text
      next: string; // Next button text
    };
    messages: {
      loading: string; // Generic loading message
      error: string; // Generic error message
      success: string; // Generic success message
      notFound: string; // Not found message
      offline: string; // Offline message
    };
  };

  // Map Modal Configuration
  mapModal: {
    title: string;
    closeButton: string;
    loadingMessage: string;
    errorMessage: string;
  };

  // Theme configuration
  theme?: {
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      background?: string;
    };
    fonts?: {
      heading?: string;
      body?: string;
    };
  };
}
