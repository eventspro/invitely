// Wedding Website Configuration
// Edit this file to customize all text content on your website

export const weddingConfig = {
  // Couple Information
  couple: {
    groomName: "Հարութ",
    brideName: "Տաթև",
    combinedNames: "Հարութ & Տաթև",
  },

  // Wedding Date & Time
  wedding: {
    date: "2025-10-10T00:00:00", // Format: YYYY-MM-DDTHH:MM:SS
    displayDate: "10 Հոկտեմբեր 2025",
    month: "10 Հոկտեմբեր 2025",
    day: "10",
  },

  // Hero Section
  hero: {
    // title: "Հարսանեկան հրավիրատոմս",
    welcomeMessage: "",
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
      "Սիրով հրավիրում ենք Ձեզ ներկա գտնվելու մեր հարսանյաց արարողությանը։ Ծանոթացեք օրակարգին և հաստատեք Ձեր ներկայությունը մինչև Հոկտեմբերի 1-ը։",
    monthTitle: "10 Հոկտեմբեր 2025",
    dayLabels: ["ԿՐԿ", "ԵՐԿ", "ԵՐՔ", "ՉՈՐ", "ՀՆԳ", "ՈՒՐ", "ՇԲԹ"],
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
    title: "Timeline",
    events: [
      {
        time: "14:30",
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
  },

  // Photo Section
  photos: {
    title: "Մեր հիշարժան օրվա լուսանկարները կգտնեք այստեղ։",
    description:
      "Կիսվեք ձեր հարսանեկան նկարներով մեզ հետ: Բոլոր հարսանեկան նկարները հասանելի կլինեն արարողությունից հետո",
    downloadButton: "Ներբեռնել նկարները",
    uploadButton: "Ավելացնել նկարներ",
    comingSoonMessage: "Նկարների հղումը կհասանելի լինի հարսանիքից հետո",
  },

  // Navigation
  navigation: {
    home: "Գլխավոր",
    countdown: "Հարսանիքին մնացել է․․․",
    calendar: "Օրացույց",
    locations: "Վայրեր",
    timeline: "Ծրագիր",
    rsvp: "Հաստատում",
  },

  // Footer
  footer: {
    thankYouMessage: "",
  },

  // Email Configuration (for admin use)
  email: {
    recipients: ["harutavetisyan0@gmail.com", "tatevhovsepyan22@gmail.com"],
  },

  // Maintenance Mode Configuration
  maintenance: {
    enabled: false, // Toggle this to enable/disable maintenance mode
    password: "haruttev2025", // Password to bypass maintenance mode
    title: "Շուտով գալիս ենք",
    subtitle: "Հարությունի և Տաթևի հարսանեկան կայք",
    message: "Մենք պատրաստում ենք մեր հատուկ օրը Ձեզ համար։ Շուտով կվերադառնանք գեղեցիկ նորությունների հետ։",
    countdownText: "Մինչև հարսանիքը",
    passwordPrompt: "Ներմուծեք գաղտնի կոդը նախադիտման համար",
    wrongPassword: "Սխալ գաղտնի կոդ",
    enterPassword: "Մուտքագրել կոդ",
  },
};
