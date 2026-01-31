/**
 * Centralized Content Configuration
 * 
 * This file defines the structure of all configurable content on the main page.
 * All content supports:
 * - enable/disable
 * - ordering
 * - per-language text (via translation keys)
 * 
 * NO hardcoded user-visible text allowed - everything must reference translation keys.
 */

export interface ConfigurableItem {
  id: string;
  enabled: boolean;
  order: number;
  translationKey: string; // e.g. "features.items.0.title"
}

export interface PricingFeature {
  id: string;
  translationKey: string; // e.g. "templatePlans.features.Wedding Timeline"
  icon: string; // Icon name from lucide-react
  included: boolean;
  description?: string; // Optional translation key
}

export interface PricingPlan {
  id: string;
  enabled: boolean;
  order: number;
  nameKey: string; // e.g. "templatePlans.plans.0.name"
  price: string; // Actual price like "10,000 AMD"
  badgeKey?: string; // e.g. "templatePlansSection.planBadges.basic"
  badgeColor?: string; // CSS class
  descriptionKey: string; // e.g. "templatePlans.plans.0.description"
  features: PricingFeature[];
  templateRoute: string;
  popular: boolean;
}

export interface SocialLink {
  id: string;
  enabled: boolean;
  order: number;
  platform: string; // "instagram" | "telegram" | "facebook" | "email" | "phone"
  icon: string; // Icon name
  url: string; // Full URL or contact info
  label: string; // Display label
}

export interface FAQItem {
  id: string;
  enabled: boolean;
  order: number;
  questionKey: string; // e.g. "faq.items.0.question"
  answerKey: string; // e.g. "faq.items.0.answer"
}

export interface Feature {
  id: string;
  enabled: boolean;
  order: number;
  icon: string; // Icon name from lucide-react
  titleKey: string; // e.g. "features.items.0.title"
  descriptionKey: string; // e.g. "features.items.0.description"
}

export interface FooterLink {
  id: string;
  enabled: boolean;
  order: number;
  textKey: string; // e.g. "footer.services.items.0"
  href?: string;
}

export interface FooterSection {
  id: string;
  enabled: boolean;
  order: number;
  titleKey: string; // e.g. "footer.services.title"
  links: FooterLink[];
}

export interface TemplateDisplay {
  id: string;
  enabled: boolean;
  order: number;
  nameKey: string; // e.g. "templates.items.0.name"
  preview: string; // Image path
  demoUrl: string;
  featuresKeys: string[]; // e.g. ["templates.items.0.features.0", ...]
}

export interface ContentConfig {
  features: Feature[];
  pricingPlans: PricingPlan[];
  templates: TemplateDisplay[];
  socialLinks: SocialLink[];
  faq: {
    enabled: boolean;
    titleKey: string;
    subtitleKey: string;
    items: FAQItem[];
  };
  footer: {
    sections: FooterSection[];
    copyrightKey: string;
    brandName: string;
    showSocialLinks: boolean;
  };
}

/**
 * Default Content Configuration
 * This is the single source of truth for all homepage content structure.
 */
export const defaultContentConfig: ContentConfig = {
  features: [
    {
      id: "elegant-designs",
      enabled: true,
      order: 0,
      icon: "Globe",
      titleKey: "features.items.0.title",
      descriptionKey: "features.items.0.description"
    },
    {
      id: "rsvp-management",
      enabled: true,
      order: 1,
      icon: "Users",
      titleKey: "features.items.1.title",
      descriptionKey: "features.items.1.description"
    },
    {
      id: "mobile-friendly",
      enabled: true,
      order: 2,
      icon: "Smartphone",
      titleKey: "features.items.2.title",
      descriptionKey: "features.items.2.description"
    },
    {
      id: "personal-touch",
      enabled: true,
      order: 3,
      icon: "Palette",
      titleKey: "features.items.3.title",
      descriptionKey: "features.items.3.description"
    },
    {
      id: "memories-gallery",
      enabled: true,
      order: 4,
      icon: "Camera",
      titleKey: "features.items.4.title",
      descriptionKey: "features.items.4.description"
    },
    {
      id: "fast-reliable",
      enabled: true,
      order: 5,
      icon: "Lock",
      titleKey: "features.items.5.title",
      descriptionKey: "features.items.5.description"
    }
  ],

  pricingPlans: [
    {
      id: "basic",
      enabled: true,
      order: 0,
      nameKey: "templatePlans.plans.0.name",
      price: "10,000 AMD",
      descriptionKey: "templatePlans.plans.0.description",
      features: [
        { id: "f1", translationKey: "templatePlans.features.Wedding Timeline", icon: "Calendar", included: true },
        { id: "f2", translationKey: "templatePlans.features.Couple Introduction", icon: "Heart", included: true },
        { id: "f3", translationKey: "templatePlans.features.Wedding Locations", icon: "MapPin", included: true },
        { id: "f4", translationKey: "templatePlans.features.RSVP Functionality", icon: "Mail", included: true },
        { id: "f5", translationKey: "templatePlans.features.Multiple Photo/Slider", icon: "Camera", included: false },
        { id: "f6", translationKey: "templatePlans.features.Photo Gallery", icon: "Camera", included: false },
        { id: "f7", translationKey: "templatePlans.features.Audio Player", icon: "Music", included: false },
        { id: "f8", translationKey: "templatePlans.features.Admin Panel", icon: "Settings", included: false },
        { id: "f9", translationKey: "templatePlans.features.QR Code Cards", icon: "QrCode", included: false }
      ],
      templateRoute: "/classic",
      popular: false
    },
    {
      id: "standard",
      enabled: true,
      order: 1,
      nameKey: "templatePlans.plans.1.name",
      price: "17,000 AMD",
      badgeKey: "templatePlansSection.planBadges.standard",
      badgeColor: "bg-blue-500",
      descriptionKey: "templatePlans.plans.1.description",
      features: [
        { id: "f1", translationKey: "templatePlans.features.Wedding Timeline", icon: "Calendar", included: true },
        { id: "f2", translationKey: "templatePlans.features.Couple Introduction", icon: "Heart", included: true },
        { id: "f3", translationKey: "templatePlans.features.Wedding Locations", icon: "MapPin", included: true },
        { id: "f4", translationKey: "templatePlans.features.RSVP Functionality", icon: "Mail", included: true },
        { id: "f5", translationKey: "templatePlans.features.Multiple Photo/Slider", icon: "Camera", included: true },
        { id: "f6", translationKey: "templatePlans.features.Photo Gallery", icon: "Camera", included: false },
        { id: "f7", translationKey: "templatePlans.features.Audio Player", icon: "Music", included: false },
        { id: "f8", translationKey: "templatePlans.features.Admin Panel", icon: "Settings", included: false },
        { id: "f9", translationKey: "templatePlans.features.QR Code Cards", icon: "QrCode", included: false }
      ],
      templateRoute: "/elegant",
      popular: false
    },
    {
      id: "premium",
      enabled: true,
      order: 2,
      nameKey: "templatePlans.plans.2.name",
      price: "23,000 AMD",
      badgeKey: "templatePlansSection.planBadges.premium",
      badgeColor: "bg-emerald-500",
      descriptionKey: "templatePlans.plans.2.description",
      features: [
        { id: "f1", translationKey: "templatePlans.features.Wedding Timeline", icon: "Calendar", included: true },
        { id: "f2", translationKey: "templatePlans.features.Couple Introduction", icon: "Heart", included: true },
        { id: "f3", translationKey: "templatePlans.features.Wedding Locations", icon: "MapPin", included: true },
        { id: "f4", translationKey: "templatePlans.features.RSVP Functionality", icon: "Mail", included: true },
        { id: "f5", translationKey: "templatePlans.features.Multiple Photo/Slider", icon: "Camera", included: true },
        { id: "f6", translationKey: "templatePlans.features.Audio Player", icon: "Music", included: true },
        { id: "f7", translationKey: "templatePlans.features.Photo Gallery", icon: "Camera", included: false },
        { id: "f8", translationKey: "templatePlans.features.Admin Panel", icon: "Settings", included: false },
        { id: "f9", translationKey: "templatePlans.features.QR Code Cards", icon: "QrCode", included: false }
      ],
      templateRoute: "/romantic",
      popular: true
    },
    {
      id: "deluxe",
      enabled: true,
      order: 3,
      nameKey: "templatePlans.plans.3.name",
      price: "31,000 AMD",
      badgeKey: "templatePlansSection.planBadges.deluxe",
      badgeColor: "bg-purple-500",
      descriptionKey: "templatePlans.plans.3.description",
      features: [
        { id: "f1", translationKey: "templatePlans.features.Wedding Timeline", icon: "Calendar", included: true },
        { id: "f2", translationKey: "templatePlans.features.Couple Introduction", icon: "Heart", included: true },
        { id: "f3", translationKey: "templatePlans.features.Wedding Locations", icon: "MapPin", included: true },
        { id: "f4", translationKey: "templatePlans.features.RSVP Functionality", icon: "Mail", included: true },
        { id: "f5", translationKey: "templatePlans.features.Multiple Photo/Slider", icon: "Camera", included: true },
        { id: "f6", translationKey: "templatePlans.features.Audio Player", icon: "Music", included: true },
        { id: "f7", translationKey: "templatePlans.features.Admin Panel", icon: "Settings", included: true },
        { id: "f8", translationKey: "templatePlans.features.Photo Gallery", icon: "Camera", included: false },
        { id: "f9", translationKey: "templatePlans.features.QR Code Cards", icon: "QrCode", included: false }
      ],
      templateRoute: "/pro",
      popular: false
    },
    {
      id: "ultimate",
      enabled: true,
      order: 4,
      nameKey: "templatePlans.plans.4.name",
      price: "37,000 AMD",
      badgeKey: "templatePlansSection.planBadges.ultimate",
      badgeColor: "bg-gradient-to-r from-purple-500 to-pink-500",
      descriptionKey: "templatePlans.plans.4.description",
      features: [
        { id: "f1", translationKey: "templatePlans.features.Wedding Timeline", icon: "Calendar", included: true },
        { id: "f2", translationKey: "templatePlans.features.Couple Introduction", icon: "Heart", included: true },
        { id: "f3", translationKey: "templatePlans.features.Wedding Locations", icon: "MapPin", included: true },
        { id: "f4", translationKey: "templatePlans.features.RSVP Functionality", icon: "Mail", included: true },
        { id: "f5", translationKey: "templatePlans.features.Multiple Photo/Slider", icon: "Camera", included: true },
        { id: "f6", translationKey: "templatePlans.features.Audio Player", icon: "Music", included: true },
        { id: "f7", translationKey: "templatePlans.features.Admin Panel", icon: "Settings", included: true },
        { id: "f8", translationKey: "templatePlans.features.Photo Gallery", icon: "Camera", included: true },
        { id: "f9", translationKey: "templatePlans.features.QR Code Cards", icon: "QrCode", included: true }
      ],
      templateRoute: "/nature",
      popular: false
    }
  ],

  templates: [
    {
      id: "harut-tatev",
      enabled: true,
      order: 0,
      nameKey: "templates.items.0.name",
      preview: "/template_previews/template-preview-1.jpg",
      demoUrl: "/harut-tatev",
      featuresKeys: [
        "templates.items.0.features.0",
        "templates.items.0.features.1",
        "templates.items.0.features.2",
        "templates.items.0.features.3"
      ]
    },
    {
      id: "forest-lily",
      enabled: true,
      order: 1,
      nameKey: "templates.items.1.name",
      preview: "/template_previews/template-preview-2.jpg",
      demoUrl: "/forest-lily-nature",
      featuresKeys: [
        "templates.items.1.features.0",
        "templates.items.1.features.1",
        "templates.items.1.features.2",
        "templates.items.1.features.3"
      ]
    },
    {
      id: "classic-wedding",
      enabled: true,
      order: 2,
      nameKey: "templates.items.2.name",
      preview: "/template_previews/template-preview-3.jpg",
      demoUrl: "/michael-sarah-classic",
      featuresKeys: [
        "templates.items.2.features.0",
        "templates.items.2.features.1",
        "templates.items.2.features.2",
        "templates.items.2.features.3"
      ]
    },
    {
      id: "luxury-wedding",
      enabled: true,
      order: 3,
      nameKey: "templates.items.3.name",
      preview: "/template_previews/template-preview-4.jpg",
      demoUrl: "/alexander-isabella-elegant",
      featuresKeys: [
        "templates.items.3.features.0",
        "templates.items.3.features.1",
        "templates.items.3.features.2",
        "templates.items.3.features.3"
      ]
    },
    {
      id: "modern-wedding",
      enabled: true,
      order: 4,
      nameKey: "templates.items.4.name",
      preview: "/template_previews/template-preview-5.jpg",
      demoUrl: "/david-rose-romantic",
      featuresKeys: [
        "templates.items.4.features.0",
        "templates.items.4.features.1",
        "templates.items.4.features.2",
        "templates.items.4.features.3"
      ]
    }
  ],

  // Social Media Links
  socialLinks: [
    {
      id: "instagram",
      enabled: true,
      order: 0,
      platform: "instagram",
      icon: "SiInstagram",
      url: "https://instagram.com/weddingsites",
      label: "Instagram"
    },
    {
      id: "telegram",
      enabled: true,
      order: 1,
      platform: "telegram",
      icon: "SiTelegram",
      url: "https://t.me/weddingsites",
      label: "Telegram"
    },
    {
      id: "facebook",
      enabled: true,
      order: 2,
      platform: "facebook",
      icon: "SiFacebook",
      url: "https://facebook.com/weddingsites",
      label: "Facebook"
    },
    {
      id: "email",
      enabled: true,
      order: 3,
      platform: "email",
      icon: "Mail",
      url: "mailto:contact@weddingsites.am",
      label: "Email"
    },
    {
      id: "phone",
      enabled: true,
      order: 4,
      platform: "phone",
      icon: "Phone",
      url: "tel:+37412345678",
      label: "+374 12 345 678"
    }
  ],

  // FAQ Section
  faq: {
    enabled: true,
    titleKey: "faq.title",
    subtitleKey: "faq.subtitle",
    items: [
      {
        id: "faq1",
        enabled: true,
        order: 0,
        questionKey: "faq.items.0.question",
        answerKey: "faq.items.0.answer"
      },
      {
        id: "faq2",
        enabled: true,
        order: 1,
        questionKey: "faq.items.1.question",
        answerKey: "faq.items.1.answer"
      },
      {
        id: "faq3",
        enabled: true,
        order: 2,
        questionKey: "faq.items.2.question",
        answerKey: "faq.items.2.answer"
      },
      {
        id: "faq4",
        enabled: true,
        order: 3,
        questionKey: "faq.items.3.question",
        answerKey: "faq.items.3.answer"
      },
      {
        id: "faq5",
        enabled: true,
        order: 4,
        questionKey: "faq.items.4.question",
        answerKey: "faq.items.4.answer"
      },
      {
        id: "faq6",
        enabled: true,
        order: 5,
        questionKey: "faq.items.5.question",
        answerKey: "faq.items.5.answer"
      }
    ]
  },

  footer: {
    brandName: "WeddingSites",
    copyrightKey: "footer.copyright",
    showSocialLinks: true,
    sections: [
      {
        id: "services",
        enabled: true,
        order: 0,
        titleKey: "footer.services.title",
        links: [
          { id: "l1", enabled: true, order: 0, textKey: "footer.services.items.0" },
          { id: "l2", enabled: true, order: 1, textKey: "footer.services.items.1" },
          { id: "l3", enabled: true, order: 2, textKey: "footer.services.items.2" },
          { id: "l4", enabled: true, order: 3, textKey: "footer.services.items.3" }
        ]
      },
      {
        id: "features",
        enabled: true,
        order: 1,
        titleKey: "footer.features.title",
        links: [
          { id: "l1", enabled: true, order: 0, textKey: "footer.features.items.0" },
          { id: "l2", enabled: true, order: 1, textKey: "footer.features.items.1" },
          { id: "l3", enabled: true, order: 2, textKey: "footer.features.items.2" },
          { id: "l4", enabled: true, order: 3, textKey: "footer.features.items.3" }
        ]
      },
      {
        id: "contact",
        enabled: true,
        order: 2,
        titleKey: "footer.contact.title",
        links: [
          { id: "l1", enabled: true, order: 0, textKey: "footer.contact.description" }
        ]
      }
    ]
  }
};

/**
 * Get enabled and sorted items from a configuration array
 */
export function getEnabledItems<T extends { enabled: boolean; order: number }>(items: T[]): T[] {
  return items
    .filter(item => item.enabled)
    .sort((a, b) => a.order - b.order);
}
