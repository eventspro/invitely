// Wedding Website Configuration
// Edit this file to customize all text content on your website

export const weddingConfig = {
  // Couple Information
  couple: {
    groomName: "Հարություն",
    brideName: "Տաթև",
    combinedNames: "Հարություն & Տաթև"
  },

  // Wedding Date & Time
  wedding: {
    date: "2024-08-18T15:00:00", // Format: YYYY-MM-DDTHH:MM:SS
    displayDate: "18 ՕԳՈՍՏՈՍ 2024",
    month: "Օգոստոս 2024",
    day: "18"
  },

  // Hero Section
  hero: {
    title: "Հարսանեկան հրավիրատոմս",
    welcomeMessage: "Մեզ համար մեծ պատիվ կլինի տեսնել ձեզ մեր կյանքի այս կարևոր օրվա կիսելիս: Գալիս ենք միասին տոնել սերն ու երջանկությունը:",
    musicButton: "Երաժշտություն"
  },

  // Countdown Section
  countdown: {
    subtitle: "Ֆցր հարսանիքի ծանուցում ծանծգն է",
    labels: {
      days: "օր",
      hours: "ժամ", 
      minutes: "րոպ",
      seconds: "վայրկ"
    }
  },

  // Calendar Section
  calendar: {
    title: "Հարցանյի հիմքեր",
    description: "Նուրա ունիցանունն եմք Մեր նիվգե ցարենք\nԶցր հարցանիքտ ճագիրձտռն\nՆուայեմությւմ ծրագիրների Ն հարցանիքի Մեր\nհարցանյիկով տ քիքուր ծագիրառն 15։",
    monthTitle: "Օգոստոս 2024",
    dayLabels: ["ԿՐՆ", "ԵՐԿ", "ԵՐՔ", "ՉՈՐ", "ՀՆԳ", "ՈՒՐ", "ՇԲՏ"]
  },

  // Locations
  locations: {
    sectionTitle: "Վայրեր",
    church: {
      title: "Եկեղեցի",
      name: "Սուրբ Գրիգոր Լուսավորիչ Եկեղեցի",
      description: "Պսակադրության արարողություն",
      mapButton: "Քարտեզ"
    },
    restaurant: {
      title: "Ռեստորան", 
      name: "Արարատ Ռեստորան",
      description: "Ընդունելության և տոնակատարության վայր",
      mapButton: "Քարտեզ"
    }
  },

  // Timeline Events
  timeline: {
    title: "Ծրագիր",
    events: [
      {
        time: "13:00",
        title: "Պսակադրություն",
        description: "Նուր Նարգիզ ծետալթեր"
      },
      {
        time: "17:00",
        title: "Հանդիսական խանութարկարգ", 
        description: "Hannah Garden Hall"
      },
      {
        time: "21:30",
        title: "Հանդիսական ընդունելություն",
        description: ""
      },
      {
        time: "23:00",
        title: "Ակտիվ",
        description: ""
      }
    ]
  },

  // RSVP Section
  rsvp: {
    title: "Հաստատել մասնակցությունը",
    description: "Խնդրում ենք հաստատել ձեր մասնակցությունը մինչև մարտի 1-ը",
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
      submittingButton: "Ուղարկվում է..."
    },
    guestOptions: [
      { value: "1", label: "1 հյուր" },
      { value: "2", label: "2 հյուր" },
      { value: "3", label: "3 հյուր" },
      { value: "4", label: "4 հյուր" },
      { value: "5+", label: "5+ հյուր" }
    ]
  },

  // Photo Section
  photos: {
    title: "Նկարների հավաքածու",
    description: "Բոլոր հարսանեկան նկարները հասանելի կլինեն արարողությունից հետո",
    downloadButton: "Ներբեռնել նկարները",
    comingSoonMessage: "Նկարների հղումը կհասանելի լինի հարսանիքից հետո"
  },

  // Navigation
  navigation: {
    home: "Գլխավոր",
    countdown: "Հաշվարկ", 
    calendar: "Օրացույց",
    locations: "Վայրեր",
    timeline: "Ծրագիր",
    rsvp: "Հաստատում"
  },

  // Footer
  footer: {
    thankYouMessage: "Շնորհակալություն մեզ հետ այս հատուկ օրը կիսելու համար"
  },

  // Email Configuration (for admin use)
  email: {
    recipients: [
      "harutavetisyan0@gmail.com",
      "tatevhovsepyan22@gmail.com"
    ]
  }
};