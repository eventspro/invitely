// Wedding Website Configuration
// Edit this file to customize all text content on your website

export const weddingConfig = {
  // Couple Information
  couple: {
    groomName: "Հարություն",
    brideName: "Տաթև",
    combinedNames: "Հարություն & Տաթև",
  },

  // Wedding Date & Time
  wedding: {
    date: "2025-09-10T15:00:00", // Format: YYYY-MM-DDTHH:MM:SS
    displayDate: "Հոկտեմբեր 2025",
    month: "10 Հոկտեմբեր 2025",
    day: "10",
  },

  // Hero Section
  hero: {
    title: "Հարսանեկան հրավիրատոմս",
    welcomeMessage:
      "Սիրով հրավիրում ենք մեր հարսանյաց հանդեսին: Գալիս ենք միասին տոնելու սերն ու երջանկությունը:",
    musicButton: "Երաժշտություն",
  },

  // Countdown Section
  countdown: {
    subtitle: "Հարսանիքին մնացել է",
    labels: {
      days: "օր",
      hours: "ժամ",
      minutes: "րոպե",
      seconds: "վայրկյան",
    },
  },

  // Calendar Section
  calendar: {
    title: "Հարգելի հյուրեր",
    description:
      "Սիրով հրավիրում ենք Ձեզ ներկա գտնվելու մեր հարսանյաց արարողությանը։ Ծանոթացեք ծրագրին և հաստատեք Ձեր ներկայությունը մինչև Հոկտեմբերի 1-ը։",
    monthTitle: "10 Հոկտեմբեր 2025",
    dayLabels: ["ԿՐՆ", "ԵՐԿ", "ԵՐՔ", "ՉՈՐ", "ՀՆԳ", "ՈՒՐ", "ՇԲՏ"],
  },

  // Locations
  locations: {
    sectionTitle: "Location",
    church: {
      title: "Եկեղեցի",
      name: "Սուրբ Գրիգոր Լուսավորիչ Եկեղեցի",
      description: "Պսակադրության արարողություն",
      mapButton: "Քարտեզ",
    },
    restaurant: {
      title: "Հարսանյաց սրահ",
      name: "Բայազետ Հոլլ",
      description: "Ընդունելության և տոնակատարության վայր",
      mapButton: "Քարտեզ",
    },
  },

  // Timeline Events
  timeline: {
    title: "Ծրագիր",
    events: [
      {
        time: "14:00",
        title: "Պսակադրության արարողություն",
      },
      {
        time: "17:00",
        title: "Հարսանյաց սրահ",
        description: "Bayazet Hall",
      },

      {
        time: "24:00",
        title: "Ավարտ",
        description: "",
      },
    ],
  },

  // RSVP Section
  rsvp: {
    title: "Հաստատել մասնակցությունը",
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
      attendingYes: "Մասնակցում եմ",
      attendingNo: "Չեմ մասնակցում",
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
  },

  // Photo Section
  photos: {
    title: "Հիշարժան պահեր",
    description:
      "Բոլոր հարսանեկան նկարները հասանելի կլինեն արարողությունից հետո",
    downloadButton: "Ներբեռնել նկարները",
    comingSoonMessage: "Նկարների հղումը կհասանելի լինի հարսանիքից հետո",
  },

  // Navigation
  navigation: {
    home: "Գլխավոր",
    countdown: "Հաշվարկ",
    calendar: "Օրացույց",
    locations: "Վայրեր",
    timeline: "Ծրագիր",
    rsvp: "Հաստատում",
  },

  // Footer
  footer: {
    thankYouMessage: "Շնորհակալություն մեզ հետ այս հատուկ օրը կիսելու համար",
  },

  // Email Configuration (for admin use)
  email: {
    recipients: ["harutavetisyan0@gmail.com", "tatevhovsepyan22@gmail.com"],
  },
};
