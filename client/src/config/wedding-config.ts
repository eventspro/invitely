// Wedding Website Configuration
// Edit this file to customize all text content on your website

export const weddingConfig = {
  // Couple Information
  couple: {
    groomName: "Groom",
    brideName: "Bride",
    combinedNames: "Groom & Bride",
  },

  // Wedding Date & Time
  wedding: {
    date: "2025-10-11T16:00:00", // Format: YYYY-MM-DDTHH:MM:SS (11/10/2025 04:00 PM)
    displayDate: "11 Հոկտեմբեր 2025",
    month: "11 Հոկտեմբեր 2025",
    day: "11",
  },

  // Hero Section
  hero: {
    invitation: "Հրավիրում ենք մեր հարսանիքին",
    welcomeMessage: "Պատրաստվեք մեր հարսանիքին",
    musicButton: "Երաժշտություն",
    playIcon: "▶️",
    pauseIcon: "⏸️",
    images: [
      "/attached_assets/default-wedding-couple.jpg",
      "/attached_assets/couple11.jpg"
    ], // Hero background images array
  },

  // Countdown Section
  countdown: {
    subtitle: "Հարսանիքին մնացել է",
    backgroundImage: "/attached_assets/image_1755881009663.png", // Romantic couple background for Armenian template
    labels: {
      days: "օր",
      hours: "ժամ",
      minutes: "րոպե",
      seconds: "վայրկյան",
    },
  },

  // Calendar Section
  calendar: {
    title: "Պատրաստվեք մեր հարսանիքին",
    description: "Միացրեք ձեր օրացույցին",
    monthTitle: "Հոկտեմբեր 2025",
    dayLabels: ["Երկ", "Երք", "Չոր", "Հնգ", "Ուրբ", "Շբթ", "Կիր"],
  },

  // Locations
  locations: {
    sectionTitle: "Վայրեր",
    venues: [
      {
        id: "ceremony",
        title: "Եկեղեցի",
        name: "Սուրբ Գրիգոր Լուսավորիչ Եկեղեցի",
        description: "Պսակադրության արարողություն",
        mapButton: "Բացել քարտեզում",
        mapIcon: "🗺️",
      },
      {
        id: "reception",
        title: "Ճաշարան",
        name: "Բայազետ Հոլլ",
        description: "Ընդունելության և տոնակատարության վայր",
        mapButton: "Բացել քարտեզում",
        mapIcon: "🗺️",
      },
    ],
  },

  // Timeline Events
  timeline: {
    title: "Ծրագիր",
    events: [
      {
        time: "14:30",
        title: "Պսակադրության արարողություն",
      },
      {
        time: "17:30",
        title: "Հարսանյաց սրահ",
        description: "Bayazet Hall",
      },

      {
        time: "24:00",
        title: "Ավարտ",
        description: "",
      },
    ],
    afterMessage: {
      thankYou: "Շնորհակալություն մեզ հետ այս հատուկ օրը կիսելու համար",
      notes:
        "Ձեզ հետ բերեք ՍԵՐ, ժպիտներ ու անսահման դրական էմոցիաներ, ինչպես նաև հարմարավետ կոշիկներ՝ պարելու համար։\nԹույլ տանք, որ այդ օրը սպիտակ զգեստով լինի միայն հարսնացուն 🤍",
    },
  },

  // RSVP Section
  rsvp: {
    title: "Հարցաթերթիկ",
    description:
      "Խնդրում ենք հաստատել ձեր մասնակցությունը մինչև Հոկտեմբերի 1-ը",
    form: {
      firstName: "Անուն",
      firstNamePlaceholder: "Ձեր անունը",
      lastName: "Ազգանուն",
      lastNamePlaceholder: "Ձեր ազգանունը",
      email: "Էլ․ հասցե",
      emailPlaceholder: "your@email.com",
      guestCount: "Հյուրերի քանակ",
      guestCountPlaceholder: "Ընտրեք հյուրերի քանակը",
      guestNames: "Հյուրերի անունները և ազգանունները",
      guestNamesPlaceholder: "Նշեք բոլոր հյուրերի անունները և ազգանունները",
      attendance: "Մասնակցություն",
      attendingYes: "Սիրով կմասնակցեմ 🤍",
      attendingNo: "Ցավոք, չեմ կարող",
      submitButton: "Ուղարկել հաստատումը",
      submittingButton: "Ուղարկվում է...",
    },
    guestOptions: [
      { value: "1", label: "1 հյուր" },
      { value: "2", label: "2 հյուր" },
      { value: "3", label: "3 հյուր" },
      { value: "4", label: "4 հյուր" },
      { value: "5+", label: "5+ հյուր" },
    ],
    messages: {
      success: "Ձեր հաստատումը ուղարկվեց",
      error: "Սխալ է տեղի ունեցել",
      loading: "Ուղարկվում է...",
      required: "Պարտադիր դաշտ",
    },
  },

  // Photo Section
  photos: {
    title: "Նկարներ",
    description: "Կիսվեք ձեր նկարներով",
    downloadButton: "Ներբեռնել նկարները",
    uploadButton: "Ավելացնել նկար",
    comingSoonMessage: "Նկարների հղումը կհասանելի լինի հարսանիքից հետո",
    images: [
      "/attached_assets/default-wedding-couple.jpg",
      "/attached_assets/Blog_Banner_Left_Hand_Story_1755890185205.webp",
      "/attached_assets/heart-tattoo.jfif"
    ], // Gallery images array
  },

  // Photo Sharing Configuration (Guest Photo Upload)
  photoSharing: {
    enabled: true,
    pageTitle: "", // Computed at runtime from couple.groomName & couple.brideName
    pageSubtitle: "Wedding Photos 📸",
    welcomeCard: {
      title: "", // Computed at runtime from couple.groomName & couple.brideName
      subtitle: "Wedding Photos 📸",
      description: "Share your beautiful memories from our special day",
      nameLabel: "Your Name / Ձեր անունը",
      namePlaceholder: "Enter your name",
      submitButton: "Start Sharing Photos 🎉",
    },
    uploadSection: {
      welcomeMessage: "Welcome, {guestName}!",
      backButton: "Back to Wedding Site",
      progressTitle: "Upload Progress",
      progressDescription: "{uploadedCount} of {maxPhotos} photos uploaded",
      maxPhotosLabel: "Photos Uploaded",
      uploadCompleteMessage: "🎉 Thank you! You've reached the maximum of {maxPhotos} photos. Your memories have been saved!",
      uploadSuccessMessage: "{count} նկար(ներ) հաջողությամբ ավելացվեցին! Շնորհակալություն {guestName}! (Ընդամենը: {totalCount})",
      uploadErrorMessage: "Սխալ վերբեռնելիս: Խնդրում ենք կրկին փորձել:",
      uploadInstructions: "Click or drag photos to upload. You can upload up to {maxPhotos} photos.",
    },
    limits: {
      maxPhotos: 25,
      maxFileSize: 10, // MB
    },
  },

  // Navigation
  navigation: {
    home: "Գլխավոր",
    countdown: "Հարսանիքին մնացել է․․․",
    calendar: "Օրացույց",
    locations: "Վայրեր",
    timeline: "Ծրագիր",
    rsvp: "Հաստատում",
    photos: "Նկարներ",
  },

  // Footer
  footer: {
    thankYouMessage: "",
  },

  // UI Elements & Icons
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
      phone: "📞",
    },
    buttons: {
      loading: "Բեռնվում է...",
      close: "Փակել",
      cancel: "Չեղարկել",
      save: "Պահպանել",
      back: "Վերադառնալ",
      next: "Հաջորդ",
    },
    messages: {
      loading: "Բեռնվում է...",
      error: "Սխալ է տեղի ունեցել",
      success: "Հաջողությամբ պահպանվեց",
      notFound: "Չի գտնվել",
      offline: "Ինտերնետ կապ չկա",
    },
  },

  // Map Modal Configuration
  mapModal: {
    title: "Տեղամաս",
    closeButton: "Փակել",
    loadingMessage: "Քարտեզը բեռնվում է...",
    errorMessage: "Քարտեզը բեռնել չվստահվեց",
  },

  // Email Configuration (for admin use)
  email: {
    recipients: ["harutavetisyan0@gmail.com", "tatevhovsepyan22@gmail.com"],
  },

  // Maintenance Mode Configuration
  maintenance: {
    enabled: false, // Toggle this to enable/disable maintenance mode
    password: "haruttev2025", // Password to bypass maintenance mode
    title: "Coming Soon",
    subtitle: "",
    message: "",
    countdownText: "Մինչև հարսանիքը",
    passwordPrompt: "",
    wrongPassword: "Սխալ գաղտնի կոդ",
    enterPassword: "Մուտքագրել կոդը",
  },
};
