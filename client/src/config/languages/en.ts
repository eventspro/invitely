export type LanguageConfig = typeof en;

export const en = {
  // Navigation
  navigation: {
    home: "Home",
    features: "Features",
    templates: "Designs",
    pricing: "Pricing",
    contact: "Contact"
  },

  // Hero Section
  hero: {
    title: "Your Love, Your Story, Your Website",
    subtitle: "Elegant wedding websites that celebrate your journey together",
    cta: "Start Today",
    viewTemplates: "Explore All Designs"
  },

  // Features Section
  features: {
    title: "Everything Your Wedding Website Needs",
    subtitle: "Romantic details and modern tools to make your day unforgettable",
    items: [
      {
        title: "Elegant Designs",
        description: "Choose from layouts created with love and artistry"
      },
      {
        title: "RSVP Management",
        description: "Effortlessly gather and manage guest responses"
      },
      {
        title: "Mobile Friendly",
        description: "A beautiful experience across every device"
      },
      {
        title: "Personal Touch",
        description: "Customize colors, fonts, and photos to reflect your style"
      },
      {
        title: "Memories Gallery",
        description: "Share your favorite moments in a secure photo space"
      },
      {
        title: "Fast & Reliable",
        description: "Built with modern technology for speed and security"
      }
    ]
  },

  // Templates Section
  templates: {
    title: "Beautiful Template Designs",
    subtitle: "Choose from our collection of stunning wedding website templates",
    loading: "Loading templates...",
    error: "Unable to load templates. Showing default templates.",
    viewDemo: "View Demo",
    livePreview: "Live Preview Available",
    mobileResponsive: "Mobile Responsive",
    featuresLabel: "Features",
    cardSubtitle: "Live Preview Available • Mobile Responsive",
    templateLabel: "Template",
    items: [
      {
        name: "Elegant Armenian Wedding",
        features: {
          0: "Armenian Fonts",
          1: "Timeline",
          2: "RSVP",
          3: "Photo Gallery"
        }
      },
      {
        name: "Nature Wedding Theme",
        features: {
          0: "Nature Theme",
          1: "Green Colors",
          2: "RSVP",
          3: "Calendar"
        }
      },
      {
        name: "Classic Romantic Wedding",
        features: {
          0: "Classic Design",
          1: "Elegant Style",
          2: "RSVP",
          3: "Mobile Responsive"
        }
      },
      {
        name: "Luxury Elegant Wedding",
        features: {
          0: "Premium Features",
          1: "Admin Panel",
          2: "Blue Theme",
          3: "Full Gallery"
        }
      },
      {
        name: "Romantic Pink Wedding",
        features: {
          0: "Romantic Design",
          1: "Pink Theme",
          2: "Music Player",
          3: "Love Story"
        }
      }
    ]
  },

  // Template Plans
  templatePlans: {
    badge: "Wedding Designs & Pricing",
    title: "Choose the Perfect Wedding Website",
    subtitle: "From intimate gatherings to grand celebrations, find the design that matches your love story.",
    featuresHeader: "Features",
    plans: [
      {
        name: "Basic",
        description: "For small weddings with essential features",
        badge: ""
      },
      {
        name: "Essential",
        description: "Enhanced features for modern couples",
        badge: "Best Value"
      },
      {
        name: "Professional",
        description: "Complete wedding website solution",
        badge: "Most Popular"
      },
      {
        name: "Premium",
        description: "Luxury features for unforgettable weddings",
        badge: "Premium"
      },
      {
        name: "Ultimate",
        description: "The full luxury wedding experience",
        badge: "Luxury"
      }
    ],
    features: {
      "Wedding Timeline": "Wedding Timeline",
      "Couple Introduction": "Couple Introduction",
      "Wedding Locations": "Wedding Locations",
      "RSVP Functionality": "RSVP Functionality",
      "Guest List Export": "Guest List Export",
      "Photo Gallery": "Photo Gallery",
      "Audio Player": "Music Player",
      "Admin Panel": "Admin Panel",
      "QR Code Cards": "QR Code Cards"
    },
    viewTemplate: "View Design",
    comparisonTitle: "Detailed Feature Comparison",
    comparisonSubtitle: "See what each plan includes"
  },

  // FAQ Section
  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        question: "What's included in each plan?",
        answer: "Each plan includes a beautifully designed wedding website template, RSVP functionality, and guest management. Higher tiers add premium features like photo galleries, music integration, admin panels, and physical QR code cards."
      },
      {
        question: "Can I customize my template?",
        answer: "Absolutely! All templates are fully customizable. You can change colors, fonts, content, photos, and layout elements to match your wedding style. Professional and higher plans include an admin panel for easy customization."
      },
      {
        question: "What are QR Code Cards?",
        answer: "QR Code Cards are physical cards with QR codes that link directly to your wedding website. Perfect for wedding invitations, table settings, or save-the-dates. Premium includes 50 cards, Ultimate includes 100 cards."
      },
      {
        question: "How do I manage RSVPs?",
        answer: "All plans include RSVP functionality where guests can confirm attendance and meal preferences. You can export guest lists and track responses in real-time through your website dashboard."
      }
    ]
  },

  // Contact Section
  contact: {
    title: "Ready to Create Your Wedding Website?",
    subtitle: "Start today and design a website as special as your love",
    cta: "Start Building Now"
  },

  // Templates Page
  templatesPage: {
    title: "Wedding Website Templates",
    subtitle: "Choose the perfect template for your special day. From simple elegance to full-featured luxury, we have everything you need to create your dream wedding website.",
    features: {
      responsive: "Mobile Responsive",
      customization: "Easy Customization", 
      setup: "Quick Setup"
    },
    loading: "Loading templates...",
    errorTitle: "Error Loading Templates",
    errorMessage: "We're having trouble loading the templates. Please try refreshing the page.",
    errorRetry: "Try Again",
    faqTitle: "Frequently Asked Questions",
    faqItems: [
      {
        question: "Can I upgrade my plan later?",
        answer: "Yes! You can upgrade to a higher tier at any time. We'll only charge the difference."
      },
      {
        question: "How long does setup take?",
        answer: "Most templates can be set up and customized within 24-48 hours after payment."
      },
      {
        question: "What's included in the QR cards?",
        answer: "20 beautifully designed physical cards with QR codes linking to your photo gallery for easy guest photo sharing."
      },
      {
        question: "Is technical support included?",
        answer: "Yes! All plans include email support, with phone support available for Premium and above."
      }
    ]
  },

  // Template Plans Section (used on main page and templates page)
  templatePlansSection: {
    badge: "Wedding Templates & Pricing",
    title: "Choose Your Perfect Wedding Website", 
    subtitle: "Professional wedding invitation websites with comprehensive features. From intimate ceremonies to grand celebrations, we have the perfect template for your special day.",
    planDescriptions: {
      basic: "Perfect for simple, elegant weddings with essential features",
      standard: "Enhanced features with image slider and more venues", 
      premium: "Complete wedding solution with music and email features",
      deluxe: "Advanced features with photo gallery and guest management"
    },
    planBadges: {
      basic: "Simple & Elegant",
      standard: "Enhanced", 
      premium: "Popular",
      deluxe: "Advanced"
    },
    features: {
      "Wedding Timeline": "Wedding Timeline",
      "Couple Introduction": "Couple Introduction",
      "Wedding Locations": "Wedding Locations",
      "RSVP Functionality": "RSVP Functionality",
      "Multiple Photo/Slider": "Multiple Photo/Slider",
      "Photo Gallery": "Photo Gallery",
      "Audio Player": "Audio Player",
      "Admin Panel": "Admin Panel",
      "Admin Panel (includes Guest List Export)": "Admin Panel (includes Guest List Export)",
      "QR Code Cards": "QR Code Cards",
      "QR Code Cards (100 cards included)": "QR Code Cards (100 cards included)"
    }
  },

  // Social Media Links - For Contact & Payment
  socialMedia: {
    instagram: {
      url: "https://www.instagram.com/weddingsites_am",
      label: "Instagram"
    },
    telegram: {
      url: "https://t.me/weddingsites_am",
      label: "Telegram"
    },
    facebook: {
      url: "https://www.facebook.com/weddingsites.am",
      label: "Facebook"
    }
  },

  // Contact & Social Section
  contactSocial: {
    title: "Ready to Create Your Perfect Wedding Website?",
    subtitle: "Join hundreds of couples who chose us for their special day",
    description: "Contact us on social media to get started",
    brandName: "WeddingSites"
  },

  // Footer Section
  footer: {
    tagline: "Beautiful wedding websites for your special day",
    services: {
      title: "Services",
      items: {
        0: "Wedding Websites",
        1: "Template Design",
        2: "Custom Development",
        3: "Support"
      }
    },
    features: {
      title: "Features",
      items: {
        0: "Armenian Support",
        1: "RSVP Management",
        2: "Photo Galleries",
        3: "Mobile Responsive"
      }
    },
    contact: {
      title: "Contact Us",
      description: "Reach out on social media"
    },
    copyright: "© 2025 WeddingSites. All rights reserved."
  },

  // Contact Section
  contactSection: {
    title: "Ready to Create Your Wedding Website?",
    subtitle: "Get started today and create a beautiful website for your special day",
    startNow: "Start Now"
  },

  // Pricing Plans Section
  pricing: {
    comparisonTitle: "Detailed Feature Comparison",
    comparisonSubtitle: "Compare all features across our wedding website plans",
    // Feature Status
    included: "✓",
    notIncluded: "✗",
    featuresHeader: "Features"
  },

  // Common
  common: {
    currency: "AMD",
    learnMore: "Learn More",
    getStarted: "Get Started",
    viewMore: "View More",
    included: "Included",
    notIncluded: "Not Included"
  }
};