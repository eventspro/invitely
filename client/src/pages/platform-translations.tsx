import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, Save, Heart, UserCheck, Smartphone, Palette, 
  Camera, Shield, Plus, Trash2, Edit2, Globe, Settings,
  Check, X, ArrowRight, Eye, Crown, Sparkles, Gift,
  Calendar, Music, MapPin, Mail, Download, Upload, QrCode,
  ArrowUpDown
} from "lucide-react";
import { defaultContentConfig, type PricingPlan as ConfigPricingPlan, getEnabledItems } from "@shared/content-config";
import PricingPlanEditor from "@/components/admin/PricingPlanEditor";
import PricingPlanReorder from "@/components/admin/PricingPlanReorder";
import AddPricingPlan from "@/components/admin/AddPricingPlan";

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface TranslationPricingPlan {
  name: string;
  price: string;
  description: string;
  badge: string;
  features: { name: string; included: boolean }[];
}

interface TranslationSections {
  common: {
    viewMore: string;
    learnMore: string;
    getStarted: string;
  };
  hero: {
    title: string;
    subtitle: string;
    ctaButton: string;
    viewTemplatesButton: string;
  };
  features: {
    title: string;
    subtitle: string;
    items: FeatureItem[];
  };
  templates: {
    title: string;
    subtitle: string;
    loadingText: string;
    viewDemoButton: string;
    templateLabel: string;
    cardSubtitle: string;
    featuresLabel: string;
    items: Array<{
      name: string;
    }>;
    commonFeatures: {
      natureTheme: string;
      greenColors: string;
      romanticDesign: string;
      pinkTheme: string;
      elegantStyle: string;
      classicDesign: string;
      armenianFonts: string;
      rsvp: string;
      mobileResponsive: string;
      photoGallery: string;
      timeline: string;
      musicPlayer: string;
      loveStory: string;
    };
  };
  pricing: {
    title: string;
    subtitle: string;
    plans: TranslationPricingPlan[];
  };
  faq: {
    title: string;
    items: FAQItem[];
  };
  contact: {
    title: string;
    subtitle: string;
    ctaButton: string;
  };
  footer: {
    about: string;
    services: { title: string; items: string[] };
    contact: { title: string; items: string[] };
    copyright: string;
  };
}

const defaultTranslations: TranslationSections = {
  common: {
    viewMore: "Տեսնել Ավելին",
    learnMore: "Իմանալ Ավելին",
    getStarted: "Սկսել"
  },
  hero: {
    title: "Ստեղծեք Ձեր Կատարյալ Հարսանեկան Կայքը",
    subtitle: "Գեղեցիկ, հարմարեցվող հարսանեկան հրավիրատոմսերի կայքեր, որոնք արտահայտում են ձեր սիրո պատմությունը",
    ctaButton: "Տեսնել Բոլոր Ձևանմուշները",
    viewTemplatesButton: "Տեսնել Ավելին"
  },
  features: {
    title: "Ամեն Ինչ, Ինչ Անհրաժեշտ Է Ձեր Հարսանեկան Կայքի Համար",
    subtitle: "Մասնագիտական գործառույթներ ձեր հատուկ օրը անմոռանալի դարձնելու համար",
    items: [
      { icon: "heart", title: "Գեղեցիկ Ձևանմուշներ", description: "Ընտրեք գրավիչ, մասնագիտորեն նախագծված ձևանմուշներից" },
      { icon: "userCheck", title: "RSVP Կառավարում", description: "Հեշտությամբ հավաքեք և կառավարեք հյուրերի պատասխանները" },
      { icon: "smartphone", title: "Բջջային Հարմարեցված", description: "Կատարյալ ցուցադրում բոլոր սարքերում" },
      { icon: "palette", title: "Հեշտ Հարմարեցում", description: "Անհատականացրեք գույները, տառատեսակները և բովանդակությունը" },
      { icon: "camera", title: "Լուսանկարների Պատկերասրահներ", description: "Վերբեռնեք և ցուցադրեք գեղեցիկ հարսանեկան լուսանկարներ" },
      { icon: "shield", title: "Անվտանգ և Արագ", description: "Կառուցված է ժամանակակից տեխնոլոգիաներով" }
    ]
  },
  templates: {
    title: "Գեղեցիկ Հարսանեկան Ձևանմուշներ",
    subtitle: "Ընտրեք մեր հավաքածուից գրավիչ, մասնագիտորեն նախագծված ձևանմուշները",
    loadingText: "Ձևանմուշները բեռնվում են...",
    viewDemoButton: "Դիտել Օրինակը",
    templateLabel: "Ձևանմուշ",
    cardSubtitle: "Կենդանի Նախադիտում Հասանելի է • Բջջային Հարմարեցված",
    featuresLabel: "Հնարավորություններ",
    items: [
      { name: "Ձևանմուշ 1" },
      { name: "Ձևանմուշ 2" },
      { name: "Ձևանմուշ 3" },
      { name: "Ձևանմուշ 4" },
      { name: "Ձևանմուշ 5" }
    ],
    commonFeatures: {
      natureTheme: "Nature Theme",
      greenColors: "Green Colors",
      romanticDesign: "Romantic Design",
      pinkTheme: "Pink Theme",
      elegantStyle: "Elegant Style",
      classicDesign: "Classic Design",
      armenianFonts: "Armenian Fonts",
      rsvp: "RSVP",
      mobileResponsive: "Mobile Responsive",
      photoGallery: "Photo Gallery",
      timeline: "Timeline",
      musicPlayer: "Music Player",
      loveStory: "Love Story"
    }
  },
  pricing: {
    title: "Ընտրեք Կատարյալ Հարսանեկան Կայքը",
    subtitle: "Ինտիմ հարսանիքներից մինչև վեհ տոնակատարությունները՝ գտիր այն դիզայնը, որը համապատասխանում է քո սիրո պատմությանը:",
    plans: [
      {
        name: "Հիմնական",
        price: "10,000 դրամ",
        description: "Կատարյալ է ինտիմ հարսանիքների համար հիմնական գործառույթներով",
        badge: "",
        features: [
          { name: "Հարսանեկան Ժամանակացույց", included: true },
          { name: "Զույգի Ներկայացում", included: true },
          { name: "Հարսանեկան Վայրեր", included: true },
          { name: "RSVP Ֆունկցիոնալություն", included: true },
          { name: "Հյուրերի Ցանկի Արտահանում", included: true },
          { name: "Լուսանկարների Պատկերասրահ", included: false }
        ]
      },
      {
        name: "Հիմնարար",
        price: "17,000 դրամ",
        description: "Ընդլայնված գործառույթներ ժամանակակից զույգերի համար",
        badge: "Լավագույն Արժեք",
        features: [
          { name: "Հարսանեկան Ժամանակացույց", included: true },
          { name: "Զույգի Ներկայացում", included: true },
          { name: "Հարսանեկան Վայրեր", included: true },
          { name: "RSVP Ֆունկցիոնալություն", included: true },
          { name: "Հյուրերի Ցանկի Արտահանում", included: true },
          { name: "Լուսանկարների Պատկերասրահ", included: true }
        ]
      },
      {
        name: "Մասնագիտական",
        price: "23,000 դրամ",
        description: "Ամբողջական հարսանեկան կայքի լուծում",
        badge: "Ամենաշատ Ընտրված",
        features: [
          { name: "Հարսանեկան Ժամանակացույց", included: true },
          { name: "Զույգի Ներկայացում", included: true },
          { name: "Հարսանեկան Վայրեր", included: true },
          { name: "RSVP Ֆունկցիոնալություն", included: true },
          { name: "Հյուրերի Ցանկի Արտահանում", included: true },
          { name: "Լուսանկարների Պատկերասրահ", included: true }
        ]
      },
      {
        name: "Պրեմիում",
        price: "31,000 դրամ",
        description: "Պրեմիում գործառույթներ շքեղ հարսանիքների համար",
        badge: "Առաջադեմ",
        features: [
          { name: "Հարսանեկան Ժամանակացույց", included: true },
          { name: "Զույգի Ներկայացում", included: true },
          { name: "Հարսանեկան Վայրեր", included: true },
          { name: "RSVP Ֆունկցիոնալություն", included: true },
          { name: "Հյուրերի Ցանկի Արտահանում", included: true },
          { name: "Լուսանկարների Պատկերասրահ", included: true }
        ]
      },
      {
        name: "Վերջնական",
        price: "37,000 դրամ",
        description: "Ամբողջական շքեղ հարսանեկան փորձառություն",
        badge: "Շքեղություն",
        features: [
          { name: "Հարսանեկան Ժամանակացույց", included: true },
          { name: "Զույգի Ներկայացում", included: true },
          { name: "Հարսանեկան Վայրեր", included: true },
          { name: "RSVP Ֆունկցիոնալություն", included: true },
          { name: "Հյուրերի Ցանկի Արտահանում", included: true },
          { name: "Լուսանկարների Պատկերասրահ", included: true }
        ]
      }
    ]
  },
  faq: {
    title: "Հաճախ Տրվող Հարցեր",
    items: [
      {
        question: "Ինչ է ներառված յուրաքանչյուր պլանում?",
        answer: "Յուրաքանչյուր պլան ներառում է գեղեցիկ նախագծված հարսանեկան կայքի ձևանմուշ, RSVP ֆունկցիոնալություն և հյուրերի կառավարում: Բարձր մակարդակների պլանները ավելացնում են պրեմիում հնարավորություններ:"
      },
      {
        question: "Կարող եմ հարմարեցնել իմ ձևանմուշը?",
        answer: "Բոլորովին! Բոլոր ձևանմուշները լիովին հարմարեցվող են: Դուք կարող եք փոխել գույները, տառատեսակները, բովանդակությունը, լուսանկարները և դասավորության տարրերը:"
      },
      {
        question: "Ինչ են QR Կոդի Քարտերը?",
        answer: "QR Կոդի Քարտերը ֆիզիկական քարտեր են QR կոդերով, որոնք ուղղակիորեն կապվում են ձեր հարսանեկան կայքի հետ: Կատարյալ է հարսանեկան հրավիրատոմսերի համար:"
      },
      {
        question: "Ինչպե՞ս կառավարել RSVP-ները?",
        answer: "Բոլոր պլանները ներառում են RSVP ֆունկցիոնալություն, որտեղ հյուրերը կարող են հաստատել ներկայությունը: Դուք կարող եք արտահանել հյուրերի ցանկերը իրական ժամանակում:"
      }
    ]
  },
  contact: {
    title: "Պատրա՞ստ ստեղծել ձեր հարսանեկան կայքը:",
    subtitle: "Սկսեք այսօր և ստեղծեք գեղեցիկ կայք ձեր հատուկ օրվա համար",
    ctaButton: "Սկսել Կառուցել Հիմա"
  },
  footer: {
    about: "Գեղեցիկ հարսանեկան կայքեր ձեր հատուկ օրվա համար",
    services: {
      title: "Ծառայություններ",
      items: ["Հարսանեկան Կայքեր", "Ձևանմուշների Դիզայն", "Անհատական Մշակում", "Աջակցություն"]
    },
    contact: {
      title: "Կապ",
      items: ["Էլ. փոստ: info@weddingsites.com", "Հեռախոս: +1 (555) 123-4567", "Աջակցություն: support@weddingsites.com"]
    },
    copyright: "© 2025 WeddingSites. Բոլոր իրավունքները պաշտպանված են."
  }
};

const iconMap: Record<string, any> = {
  heart: Heart,
  userCheck: UserCheck,
  smartphone: Smartphone,
  palette: Palette,
  camera: Camera,
  shield: Shield,
  Calendar,
  Music,
  MapPin,
  Mail,
  Download,
  Upload,
  QrCode,
  Settings
};

// Helper function to get icon component from icon name
const getIconComponent = (iconName: string) => {
  const icons: Record<string, any> = {
    Calendar, Heart, MapPin, Mail, Camera, Music, Settings, QrCode, Download, Upload
  };
  return icons[iconName] || Calendar;
};

export default function PlatformTranslations() {
  const [mainTab, setMainTab] = useState("translations"); // Top-level: translations vs configurable-content
  const [currentLanguage, setCurrentLanguage] = useState("hy");
  const [activeSection, setActiveSection] = useState("hero");
  const [translations, setTranslations] = useState<TranslationSections>(defaultTranslations);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingPricing, setEditingPricing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Phase 2.1: Plan editor state
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  // Phase 3.1: Plan reordering state
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  
  // Phase 3.2: Add plan state
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);

  // Fetch pricing plans from database with fallback to config
  const { data: dbPricingPlans, isLoading: plansLoading } = useQuery<any[]>({
    queryKey: ['/api/configurable-pricing-plans'],
    staleTime: 30000, // Cache for 30 seconds
  });

  // Use database plans if available, otherwise fall back to config
  const pricingPlans = (dbPricingPlans && dbPricingPlans.length > 0) 
    ? dbPricingPlans 
    : getEnabledItems(defaultContentConfig.pricingPlans);

  // Load translations from API
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/api/translations`);
        if (response.ok) {
          const data = await response.json();
          console.log('API response:', data);
          // The API returns { en: {...}, hy: {...}, ru: {...} }
          const langData = data[currentLanguage];
          console.log('Language data structure:', JSON.stringify(langData, null, 2));
          if (langData) {
            // Ensure structure exists with empty strings for missing fields
            // Preserve ALL values from API (including empty strings) without overwriting
            const ensureStructure = (base: any, data: any) => {
              if (!data) return base;
              const result = { ...base };
              for (const key in data) {
                if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
                  result[key] = ensureStructure(result[key] || {}, data[key]);
                } else {
                  result[key] = data[key]; // Preserve original value including ""
                }
              }
              return result;
            };
            
            const mergedConfig = {
              common: ensureStructure({ viewMore: '', learnMore: '', getStarted: '' }, langData.common),
              hero: ensureStructure({ title: '', subtitle: '', ctaButton: '', viewTemplatesButton: '' }, langData.hero),
              features: {
                title: langData.features?.title ?? '',
                subtitle: langData.features?.subtitle ?? '',
                items: langData.features?.items || []
              },
              templates: {
                title: langData.templates?.title ?? '',
                subtitle: langData.templates?.subtitle ?? '',
                loadingText: langData.templates?.loadingText ?? '',
                viewDemoButton: langData.templates?.viewDemoButton ?? '',
                templateLabel: langData.templates?.templateLabel ?? '',
                cardSubtitle: langData.templates?.cardSubtitle ?? '',
                featuresLabel: langData.templates?.featuresLabel ?? '',
                items: langData.templates?.items || [],
                commonFeatures: langData.templates?.commonFeatures || {}
              },
              pricing: {
                title: langData.pricing?.title ?? '',
                subtitle: langData.pricing?.subtitle ?? '',
                plans: langData.pricing?.plans || []
              },
              faq: {
                title: langData.faq?.title ?? '',
                items: langData.faq?.items || []
              },
              contact: ensureStructure({ title: '', subtitle: '', ctaButton: '' }, langData.contact),
              footer: {
                about: langData.footer?.about ?? '',
                services: {
                  title: langData.footer?.services?.title ?? '',
                  items: langData.footer?.services?.items || []
                },
                contact: {
                  title: langData.footer?.contact?.title ?? '',
                  items: langData.footer?.contact?.items || []
                },
                copyright: langData.footer?.copyright ?? ''
              }
            };
            setTranslations(mergedConfig);
          } else {
            console.log('No translation data for language:', currentLanguage);
            // Only use defaults if API has no data at all
            setTranslations(defaultTranslations);
          }
        } else {
          console.log('API returned non-OK status, using defaults');
          setTranslations(defaultTranslations);
        }
      } catch (error) {
        console.log('Using default translations due to error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    loadTranslations();
  }, [currentLanguage]);

  const updateSection = (section: keyof TranslationSections, field: string, value: any) => {
    setTranslations(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const updateNestedSection = (section: keyof TranslationSections, path: string, value: any) => {
    const keys = path.split('.');
    setTranslations(prev => {
      const updated = { ...prev };
      let current: any = updated[section];
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
    setHasChanges(true);
  };

  const addFeature = () => {
    setTranslations(prev => ({
      ...prev,
      features: {
        ...prev.features,
        items: [...prev.features.items, { icon: "heart", title: "", description: "" }]
      }
    }));
    setHasChanges(true);
  };

  const removeFeature = (index: number) => {
    setTranslations(prev => ({
      ...prev,
      features: {
        ...prev.features,
        items: prev.features.items.filter((_, i) => i !== index)
      }
    }));
    setHasChanges(true);
  };

  const updateFeature = (index: number, field: keyof FeatureItem, value: string) => {
    setTranslations(prev => ({
      ...prev,
      features: {
        ...prev.features,
        items: prev.features.items.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
    setHasChanges(true);
  };

  const addFAQ = () => {
    setTranslations(prev => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: [...prev.faq.items, { question: "", answer: "" }]
      }
    }));
    setHasChanges(true);
  };

  const removeFAQ = (index: number) => {
    setTranslations(prev => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: prev.faq.items.filter((_, i) => i !== index)
      }
    }));
    setHasChanges(true);
  };

  const updateFAQ = (index: number, field: keyof FAQItem, value: string) => {
    setTranslations(prev => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: prev.faq.items.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
    setHasChanges(true);
  };

  const saveAllChanges = async () => {
    try {
      // Flatten the nested translations object into key-value pairs
      const flattenObject = (obj: any, prefix = ''): Record<string, string> => {
        const result: Record<string, string> = {};
        
        for (const key in obj) {
          const value = obj[key];
          const newKey = prefix ? `${prefix}.${key}` : key;
          
          if (typeof value === 'string') {
            result[newKey] = value;
          } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(result, flattenObject(value, newKey));
          } else if (Array.isArray(value)) {
            // Handle arrays (like features or FAQ items)
            value.forEach((item, index) => {
              if (typeof item === 'string') {
                result[`${newKey}.${index}`] = item;
              } else if (typeof item === 'object') {
                Object.assign(result, flattenObject(item, `${newKey}.${index}`));
              }
            });
          }
        }
        
        return result;
      };

      const updates = flattenObject(translations);

      console.log(`Saving ${Object.keys(updates).length} translation keys...`);
      console.log('🔍 DEBUG: Checking common section:', {
        'translations.common': translations.common,
        'updates["common.viewMore"]': updates['common.viewMore']
      });

      const response = await fetch(`/api/translations/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          language: currentLanguage, 
          updates 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save translations');
      }

      const result = await response.json();
      console.log('Save result:', result);

      toast({ 
        title: "✅ Saved Successfully!", 
        description: "Translations saved. This page will reload. Refresh other tabs to see changes.",
        duration: 3000
      });
      setHasChanges(false);
      
      // Reload translations from database to confirm changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: "Error", description: "Failed to save translations", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-rose-500 border-r-transparent mb-4"></div>
            <p className="text-gray-600">Loading translations...</p>
          </div>
        </div>
      ) : (
        <>
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">{" "}
            <div className="flex items-center gap-4">
              <Link href="/platform">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Globe className="w-6 h-6 text-rose-500" />
                  Platform Content Manager
                </h1>
                <p className="text-sm text-gray-600">Manage translations and configurable content</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {mainTab === "translations" && (
                <>
                  <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hy">AM Հայերեն</SelectItem>
                      <SelectItem value="en">EN English</SelectItem>
                      <SelectItem value="ru">RU Русский</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={saveAllChanges} disabled={!hasChanges} className="bg-rose-500 hover:bg-rose-600">
                    <Save className="w-4 h-4 mr-2" />
                    Save & Deploy
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top-level tabs: Translations vs Configurable Content */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
          <TabsList className="bg-white border-2">
            <TabsTrigger value="translations" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
              <Globe className="w-4 h-4 mr-2" />
              Translations
            </TabsTrigger>
            <TabsTrigger value="configurable-content" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              Configurable Content
            </TabsTrigger>
          </TabsList>

          {/* Translations Tab - Existing Content (UNTOUCHED) */}
          <TabsContent value="translations" className="space-y-0">
        <Tabs value={activeSection} onValueChange={setActiveSection}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
          </TabsList>

          <TabsContent value="hero" className="mt-6">
            <Card className="p-8">
              <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Click any text below to edit it
              </div>
              
              <div className="text-center max-w-4xl mx-auto py-12">
                <div 
                  contentEditable 
                  suppressContentEditableWarning
                  onBlur={(e) => updateSection('hero', 'title', e.currentTarget.textContent || '')}
                  className="text-4xl md:text-5xl font-bold text-charcoal mb-4 text-center block w-full cursor-pointer hover:bg-blue-50 hover:outline hover:outline-2 hover:outline-blue-300 rounded transition-all relative group outline-none"
                >
                  {translations.hero.title}
                  <Edit2 className="w-4 h-4 absolute -right-6 top-1/2 -translate-y-1/2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div 
                  contentEditable 
                  suppressContentEditableWarning
                  onBlur={(e) => updateSection('hero', 'subtitle', e.currentTarget.textContent || '')}
                  className="text-xl text-charcoal/70 mb-8 block cursor-pointer hover:bg-blue-50 hover:outline hover:outline-2 hover:outline-blue-300 rounded transition-all relative group outline-none"
                >
                  {translations.hero.subtitle}
                  <Edit2 className="w-4 h-4 absolute -right-6 top-1/2 -translate-y-1/2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <div className="bg-softGold hover:bg-softGold/90 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center cursor-pointer hover:outline hover:outline-2 hover:outline-blue-300 relative group">
                    <span 
                      contentEditable 
                      suppressContentEditableWarning
                      onBlur={(e) => updateSection('hero', 'ctaButton', e.currentTarget.textContent || '')}
                      className="outline-none"
                    >
                      {translations.hero.ctaButton}
                    </span>
                    <ArrowRight className="ml-2 h-5 w-5" />
                    <Edit2 className="w-4 h-4 absolute -right-6 top-1/2 -translate-y-1/2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="border-2 border-charcoal text-charcoal hover:bg-charcoal hover:text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center cursor-pointer hover:outline hover:outline-2 hover:outline-blue-300 relative group">
                    <span 
                      contentEditable 
                      suppressContentEditableWarning
                      onBlur={(e) => updateSection('common', 'viewMore', e.currentTarget.textContent || '')}
                      className="outline-none"
                    >
                      {translations.common.viewMore}
                    </span>
                    <Eye className="ml-2 h-5 w-5" />
                    <Edit2 className="w-4 h-4 absolute -right-6 top-1/2 -translate-y-1/2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="mt-6">
            <Card className="p-8">
              <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Click any text below to edit features
              </p>
              
              <div contentEditable suppressContentEditableWarning
                onBlur={(e) => updateSection('features', 'title', e.currentTarget.textContent || '')}
                className="text-3xl font-bold text-center mb-4 p-4 border-2 border-transparent hover:border-blue-300 rounded outline-none cursor-text"
              >
                {translations.features.title}
              </div>
              <div contentEditable suppressContentEditableWarning
                onBlur={(e) => updateSection('features', 'subtitle', e.currentTarget.textContent || '')}
                className="text-lg text-gray-600 text-center mb-8 p-4 border-2 border-transparent hover:border-blue-300 rounded outline-none cursor-text"
              >
                {translations.features.subtitle}
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                {translations.features.items.map((feature, index) => {
                  const IconComponent = iconMap[feature.icon] || Heart;
                  return (
                    <Card key={index} className="p-6 relative group">
                      <button
                        onClick={() => removeFeature(index)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                      <IconComponent className="w-12 h-12 text-rose-500 mb-4" />
                      <div contentEditable suppressContentEditableWarning
                        onBlur={(e) => updateFeature(index, 'title', e.currentTarget.textContent || '')}
                        className="font-bold mb-2 p-2 border-2 border-transparent hover:border-blue-300 rounded outline-none cursor-text"
                      >
                        {feature.title}
                      </div>
                      <div contentEditable suppressContentEditableWarning
                        onBlur={(e) => updateFeature(index, 'description', e.currentTarget.textContent || '')}
                        className="text-sm text-gray-600 p-2 border-2 border-transparent hover:border-blue-300 rounded outline-none cursor-text"
                      >
                        {feature.description}
                      </div>
                    </Card>
                  );
                })}
              </div>

              <Button onClick={addFeature} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Feature
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <div className="bg-gradient-to-br from-yellow-50/50 to-orange-50/30 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Click any text to edit it directly
              </p>
            </div>
            
            {/* Live Preview - Exact replica of templates section */}
            <section className="py-20 bg-gradient-to-br from-yellow-50/10 to-orange-50/30 rounded-xl">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <input
                    type="text"
                    value={translations.templates.title}
                    onChange={(e) => updateSection('templates', 'title', e.target.value)}
                    className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 text-center w-full bg-transparent border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded px-4 py-2 transition-colors"
                    placeholder="Section Title"
                  />
                  <input
                    type="text"
                    value={translations.templates.subtitle}
                    onChange={(e) => updateSection('templates', 'subtitle', e.target.value)}
                    className="text-xl text-gray-600 max-w-3xl mx-auto block text-center bg-transparent border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded px-4 py-2 transition-colors"
                    placeholder="Section Subtitle"
                  />
                </div>
                
                <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                  {/* Template 1 */}
                  <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                    <div className="relative aspect-video overflow-hidden bg-gray-100">
                      <img 
                        src="/template_previews/img2.jpg" 
                        alt="Template 1 preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 flex items-end justify-center pb-6">
                        <div className="inline-flex items-center bg-white text-gray-800 px-6 py-3 rounded-lg font-semibold shadow-lg">
                          <input
                            type="text"
                            value={translations.templates.viewDemoButton}
                            onChange={(e) => updateSection('templates', 'viewDemoButton', e.target.value)}
                            className="bg-transparent border-b-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none text-center min-w-[120px]"
                          />
                        </div>
                      </div>
                      <div className="absolute top-4 left-4">
                        <input
                          type="text"
                          value={translations.templates.templateLabel}
                          onChange={(e) => updateSection('templates', 'templateLabel', e.target.value)}
                          className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-lg border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="p-6">
                      <input
                        type="text"
                        value={translations.templates.items?.[0]?.name || 'Template 1'}
                        onChange={(e) => {
                          const newItems = [...(translations.templates.items || [])];
                          if (!newItems[0]) newItems[0] = { name: '' };
                          newItems[0].name = e.target.value;
                          updateSection('templates', 'items', newItems);
                        }}
                        className="text-xl font-bold text-gray-800 mb-2 w-full bg-transparent border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        value={translations.templates.cardSubtitle}
                        onChange={(e) => updateSection('templates', 'cardSubtitle', e.target.value)}
                        className="text-gray-600 mb-4 text-sm w-full bg-transparent border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        value={translations.templates.featuresLabel}
                        onChange={(e) => updateSection('templates', 'featuresLabel', e.target.value)}
                        className="font-semibold text-gray-800 mb-3 text-sm bg-transparent border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded px-2 py-1"
                      />
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          value={translations.templates.commonFeatures.natureTheme}
                          onChange={(e) => updateNestedSection('templates', 'commonFeatures.natureTheme', e.target.value)}
                          className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={translations.templates.commonFeatures.greenColors}
                          onChange={(e) => updateNestedSection('templates', 'commonFeatures.greenColors', e.target.value)}
                          className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={translations.templates.commonFeatures.rsvp}
                          onChange={(e) => updateNestedSection('templates', 'commonFeatures.rsvp', e.target.value)}
                          className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={translations.templates.commonFeatures.mobileResponsive}
                          onChange={(e) => updateNestedSection('templates', 'commonFeatures.mobileResponsive', e.target.value)}
                          className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Template 2 */}
                  <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                    <div className="relative aspect-video overflow-hidden bg-gray-100">
                      <img 
                        src="/template_previews/img5.jpeg" 
                        alt="Template 2 preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 flex items-end justify-center pb-6">
                        <div className="inline-flex items-center bg-white text-gray-800 px-6 py-3 rounded-lg font-semibold shadow-lg">
                          <input
                            type="text"
                            value={translations.templates.viewDemoButton}
                            onChange={(e) => updateSection('templates', 'viewDemoButton', e.target.value)}
                            className="bg-transparent border-b-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none text-center min-w-[120px]"
                          />
                        </div>
                      </div>
                      <div className="absolute top-4 left-4">
                        <input
                          type="text"
                          value={translations.templates.templateLabel}
                          onChange={(e) => updateSection('templates', 'templateLabel', e.target.value)}
                          className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-lg border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="p-6">
                      <input
                        type="text"
                        value={translations.templates.items?.[1]?.name || 'Template 2'}
                        onChange={(e) => {
                          const newItems = [...(translations.templates.items || [])];
                          if (!newItems[1]) newItems[1] = { name: '' };
                          newItems[1].name = e.target.value;
                          updateSection('templates', 'items', newItems);
                        }}
                        className="text-xl font-bold text-gray-800 mb-2 w-full bg-transparent border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        value={translations.templates.cardSubtitle}
                        onChange={(e) => updateSection('templates', 'cardSubtitle', e.target.value)}
                        className="text-gray-600 mb-4 text-sm w-full bg-transparent border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        value={translations.templates.featuresLabel}
                        onChange={(e) => updateSection('templates', 'featuresLabel', e.target.value)}
                        className="font-semibold text-gray-800 mb-3 text-sm bg-transparent border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded px-2 py-1"
                      />
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          value={translations.templates.commonFeatures.romanticDesign}
                          onChange={(e) => updateNestedSection('templates', 'commonFeatures.romanticDesign', e.target.value)}
                          className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={translations.templates.commonFeatures.rsvp}
                          onChange={(e) => updateNestedSection('templates', 'commonFeatures.rsvp', e.target.value)}
                          className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={translations.templates.commonFeatures.mobileResponsive}
                          onChange={(e) => updateNestedSection('templates', 'commonFeatures.mobileResponsive', e.target.value)}
                          className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Template 3 */}
                  <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                    <div className="relative aspect-video overflow-hidden bg-gray-100">
                      <img 
                        src="/template_previews/img4.avif" 
                        alt="Template 3 preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 flex items-end justify-center pb-6">
                        <div className="inline-flex items-center bg-white text-gray-800 px-6 py-3 rounded-lg font-semibold shadow-lg">
                          <input
                            type="text"
                            value={translations.templates.viewDemoButton}
                            onChange={(e) => updateSection('templates', 'viewDemoButton', e.target.value)}
                            className="bg-transparent border-b-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none text-center min-w-[120px]"
                          />
                        </div>
                      </div>
                      <div className="absolute top-4 left-4">
                        <input
                          type="text"
                          value={translations.templates.templateLabel}
                          onChange={(e) => updateSection('templates', 'templateLabel', e.target.value)}
                          className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-lg border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="p-6">
                      <input
                        type="text"
                        value={translations.templates.items?.[2]?.name || 'Template 3'}
                        onChange={(e) => {
                          const newItems = [...(translations.templates.items || [])];
                          if (!newItems[2]) newItems[2] = { name: '' };
                          newItems[2].name = e.target.value;
                          updateSection('templates', 'items', newItems);
                        }}
                        className="text-xl font-bold text-gray-800 mb-2 w-full bg-transparent border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        value={translations.templates.cardSubtitle}
                        onChange={(e) => updateSection('templates', 'cardSubtitle', e.target.value)}
                        className="text-gray-600 mb-4 text-sm w-full bg-transparent border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        value={translations.templates.featuresLabel}
                        onChange={(e) => updateSection('templates', 'featuresLabel', e.target.value)}
                        className="font-semibold text-gray-800 mb-3 text-sm bg-transparent border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded px-2 py-1"
                      />
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          value={translations.templates.commonFeatures.elegantStyle}
                          onChange={(e) => updateNestedSection('templates', 'commonFeatures.elegantStyle', e.target.value)}
                          className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={translations.templates.commonFeatures.rsvp}
                          onChange={(e) => updateNestedSection('templates', 'commonFeatures.rsvp', e.target.value)}
                          className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={translations.templates.commonFeatures.mobileResponsive}
                          onChange={(e) => updateNestedSection('templates', 'commonFeatures.mobileResponsive', e.target.value)}
                          className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Template 4 */}
                  <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                    <div className="relative aspect-video overflow-hidden bg-gray-100">
                      <img 
                        src="/template_previews/img4.jpg" 
                        alt="Template 4 preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 flex items-end justify-center pb-6">
                        <div className="inline-flex items-center bg-white text-gray-800 px-6 py-3 rounded-lg font-semibold shadow-lg">
                          <input
                            type="text"
                            value={translations.templates.viewDemoButton}
                            onChange={(e) => updateSection('templates', 'viewDemoButton', e.target.value)}
                            className="bg-transparent border-b-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none text-center min-w-[120px]"
                          />
                        </div>
                      </div>
                      <div className="absolute top-4 left-4">
                        <input
                          type="text"
                          value={translations.templates.templateLabel}
                          onChange={(e) => updateSection('templates', 'templateLabel', e.target.value)}
                          className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-lg border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="p-6">
                      <input
                        type="text"
                        value={translations.templates.items?.[3]?.name || 'Template 4'}
                        onChange={(e) => {
                          const newItems = [...(translations.templates.items || [])];
                          if (!newItems[3]) newItems[3] = { name: '' };
                          newItems[3].name = e.target.value;
                          updateSection('templates', 'items', newItems);
                        }}
                        className="text-xl font-bold text-gray-800 mb-2 w-full bg-transparent border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        value={translations.templates.cardSubtitle}
                        onChange={(e) => updateSection('templates', 'cardSubtitle', e.target.value)}
                        className="text-gray-600 mb-4 text-sm w-full bg-transparent border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        value={translations.templates.featuresLabel}
                        onChange={(e) => updateSection('templates', 'featuresLabel', e.target.value)}
                        className="font-semibold text-gray-800 mb-3 text-sm bg-transparent border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded px-2 py-1"
                      />
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          value={translations.templates.commonFeatures.classicDesign}
                          onChange={(e) => updateNestedSection('templates', 'commonFeatures.classicDesign', e.target.value)}
                          className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={translations.templates.commonFeatures.rsvp}
                          onChange={(e) => updateNestedSection('templates', 'commonFeatures.rsvp', e.target.value)}
                          className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={translations.templates.commonFeatures.mobileResponsive}
                          onChange={(e) => updateNestedSection('templates', 'commonFeatures.mobileResponsive', e.target.value)}
                          className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Template 5 */}
                  <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                    <div className="relative aspect-video overflow-hidden bg-gray-100">
                      <img 
                        src="/template_previews/img1.jpg" 
                        alt="Template 5 preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 flex items-end justify-center pb-6">
                        <div className="inline-flex items-center bg-white text-gray-800 px-6 py-3 rounded-lg font-semibold shadow-lg">
                          <input
                            type="text"
                            value={translations.templates.viewDemoButton}
                            onChange={(e) => updateSection('templates', 'viewDemoButton', e.target.value)}
                            className="bg-transparent border-b-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none text-center min-w-[120px]"
                          />
                        </div>
                      </div>
                      <div className="absolute top-4 left-4">
                        <input
                          type="text"
                          value={translations.templates.templateLabel}
                          onChange={(e) => updateSection('templates', 'templateLabel', e.target.value)}
                          className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-lg border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="p-6">
                      <input
                        type="text"
                        value={translations.templates.items?.[4]?.name || 'Template 5'}
                        onChange={(e) => {
                          const newItems = [...(translations.templates.items || [])];
                          if (!newItems[4]) newItems[4] = { name: '' };
                          newItems[4].name = e.target.value;
                          updateSection('templates', 'items', newItems);
                        }}
                        className="text-xl font-bold text-gray-800 mb-2 w-full bg-transparent border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        value={translations.templates.cardSubtitle}
                        onChange={(e) => updateSection('templates', 'cardSubtitle', e.target.value)}
                        className="text-gray-600 mb-4 text-sm w-full bg-transparent border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        value={translations.templates.featuresLabel}
                        onChange={(e) => updateSection('templates', 'featuresLabel', e.target.value)}
                        className="font-semibold text-gray-800 mb-3 text-sm bg-transparent border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded px-2 py-1"
                      />
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          value={translations.templates.commonFeatures.armenianFonts}
                          onChange={(e) => updateNestedSection('templates', 'commonFeatures.armenianFonts', e.target.value)}
                          className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={translations.templates.commonFeatures.rsvp}
                          onChange={(e) => updateNestedSection('templates', 'commonFeatures.rsvp', e.target.value)}
                          className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={translations.templates.commonFeatures.mobileResponsive}
                          onChange={(e) => updateNestedSection('templates', 'commonFeatures.mobileResponsive', e.target.value)}
                          className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Click any text below to edit pricing plans
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setEditingPricing(!editingPricing);
                    toast({
                      title: editingPricing ? "View Mode" : "Edit Mode",
                      description: editingPricing ? "Now viewing pricing plans" : "You can now edit plan details"
                    });
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {editingPricing ? "Done Editing" : "Manage Plans"}
                </Button>
              </div>

              <Card className="p-8">
                <div 
                  contentEditable 
                  suppressContentEditableWarning
                  onBlur={(e) => updateSection('pricing', 'title', e.currentTarget.textContent || '')}
                  className="text-3xl font-bold text-center mb-4 p-4 cursor-pointer hover:bg-blue-50 hover:outline hover:outline-2 hover:outline-blue-300 rounded transition-all relative group outline-none"
                >
                  {translations?.pricing?.title || 'Pricing Title'}
                  <Edit2 className="w-4 h-4 absolute -right-6 top-1/2 -translate-y-1/2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div 
                  contentEditable 
                  suppressContentEditableWarning
                  onBlur={(e) => updateSection('pricing', 'subtitle', e.currentTarget.textContent || '')}
                  className="text-lg text-gray-600 text-center mb-8 p-4 cursor-pointer hover:bg-blue-50 hover:outline hover:outline-2 hover:outline-blue-300 rounded transition-all relative group outline-none"
                >
                  {translations?.pricing?.subtitle || 'Pricing Subtitle'}
                  <Edit2 className="w-4 h-4 absolute -right-6 top-1/2 -translate-y-1/2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="grid grid-cols-5 gap-4 mb-8">
                  {translations.pricing.plans.map((plan, index) => (
                    <Card key={index} className={`p-4 ${index === 2 ? 'ring-2 ring-green-500 scale-105' : ''} ${editingPricing ? 'bg-blue-50/30' : ''}`}>
                      {plan.badge && (
                        <div className="text-center mb-2">
                          <span 
                            contentEditable={editingPricing}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const newPlans = [...translations.pricing.plans];
                              newPlans[index] = { ...plan, badge: e.currentTarget.textContent || '' };
                              updateSection('pricing', 'plans', newPlans);
                            }}
                            className={`inline-block px-3 py-1 bg-blue-500 text-white text-xs rounded-full ${editingPricing ? 'cursor-pointer hover:outline hover:outline-2 hover:outline-blue-300' : ''} outline-none`}
                          >
                            {plan.badge}
                          </span>
                        </div>
                      )}
                      <h3 
                        contentEditable={editingPricing}
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const newPlans = [...translations.pricing.plans];
                          newPlans[index] = { ...plan, name: e.currentTarget.textContent || '' };
                          updateSection('pricing', 'plans', newPlans);
                        }}
                        className={`text-lg font-bold text-center mb-2 ${editingPricing ? 'cursor-pointer hover:bg-blue-50 hover:outline hover:outline-2 hover:outline-blue-300 rounded p-1' : ''} outline-none`}
                      >
                        {plan.name}
                      </h3>
                      <p 
                        contentEditable={editingPricing}
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const newPlans = [...translations.pricing.plans];
                          newPlans[index] = { ...plan, price: e.currentTarget.textContent || '' };
                          updateSection('pricing', 'plans', newPlans);
                        }}
                        className={`text-2xl font-bold text-center mb-2 ${editingPricing ? 'cursor-pointer hover:bg-blue-50 hover:outline hover:outline-2 hover:outline-blue-300 rounded p-1' : ''} outline-none`}
                      >
                        {plan.price}
                      </p>
                      <p 
                        contentEditable={editingPricing}
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const newPlans = [...translations.pricing.plans];
                          newPlans[index] = { ...plan, description: e.currentTarget.textContent || '' };
                          updateSection('pricing', 'plans', newPlans);
                        }}
                        className={`text-sm text-gray-600 text-center mb-4 ${editingPricing ? 'cursor-pointer hover:bg-blue-50 hover:outline hover:outline-2 hover:outline-blue-300 rounded p-1' : ''} outline-none`}
                      >
                        {plan.description}
                      </p>
                      <div className="space-y-2">
                        {plan.features.slice(0, 6).map((feature, fIndex) => (
                          <div key={fIndex} className="flex items-center gap-2 text-xs">
                            {editingPricing && (
                              <button
                                onClick={() => {
                                  const newPlans = [...translations.pricing.plans];
                                  newPlans[index].features[fIndex].included = !feature.included;
                                  updateSection('pricing', 'plans', newPlans);
                                }}
                                className="flex-shrink-0"
                              >
                                {feature.included ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-gray-400" />}
                              </button>
                            )}
                            {!editingPricing && (
                              feature.included ? <Check className="w-4 h-4 text-green-500 flex-shrink-0" /> : <X className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                            <span 
                              contentEditable={editingPricing}
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const newPlans = [...translations.pricing.plans];
                                newPlans[index].features[fIndex].name = e.currentTarget.textContent || '';
                                updateSection('pricing', 'plans', newPlans);
                              }}
                              className={`${feature.included ? '' : 'text-gray-400'} ${editingPricing ? 'cursor-pointer hover:bg-blue-50 hover:outline hover:outline-1 hover:outline-blue-300 rounded px-1' : ''} outline-none`}
                            >
                              {feature.name}
                            </span>
                          </div>
                        ))}
                      </div>
                      <Button className="w-full mt-4 bg-rose-500 hover:bg-rose-600 text-white text-xs pointer-events-none">
                        Տեսնել Ձևանմուշը
                      </Button>
                    </Card>
                  ))}
                </div>

                <div className="bg-gray-900 text-white p-8 rounded-lg text-center">
                  <h3 
                    contentEditable 
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      // This would update comparison title if you add it to the state
                      setHasChanges(true);
                    }}
                    className="text-2xl font-bold mb-2 cursor-pointer hover:bg-gray-800 hover:outline hover:outline-2 hover:outline-blue-300 rounded p-2 outline-none"
                  >
                    Մանրամասն Հնարավորությունների Համեմատություն
                  </h3>
                  <p 
                    contentEditable 
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      // This would update comparison subtitle if you add it to the state
                      setHasChanges(true);
                    }}
                    className="text-gray-400 cursor-pointer hover:bg-gray-800 hover:outline hover:outline-2 hover:outline-blue-300 rounded p-2 outline-none"
                  >
                    Համեմատեք բոլոր հնարավորությունները մեր հարսանեկան կայքերի պլանների միջև
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="faq" className="mt-6">
            <Card className="p-8">
              <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Click any text below to edit FAQ items
              </p>
              
              <div contentEditable suppressContentEditableWarning
                onBlur={(e) => updateSection('faq', 'title', e.currentTarget.textContent || '')}
                className="text-3xl font-bold text-center mb-8 p-4 border-2 border-transparent hover:border-blue-300 rounded outline-none cursor-text"
              >
                {translations.faq.title}
              </div>

              <div className="space-y-4 mb-6">
                {translations.faq.items.map((item, index) => (
                  <Card key={index} className="p-6 relative group">
                    <button onClick={() => removeFAQ(index)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                    <div contentEditable suppressContentEditableWarning
                      onBlur={(e) => updateFAQ(index, 'question', e.currentTarget.textContent || '')}
                      className="font-bold mb-3 p-2 border-2 border-transparent hover:border-blue-300 rounded outline-none cursor-text"
                    >
                      {item.question}
                    </div>
                    <div contentEditable suppressContentEditableWarning
                      onBlur={(e) => updateFAQ(index, 'answer', e.currentTarget.textContent || '')}
                      className="text-gray-600 p-2 border-2 border-transparent hover:border-blue-300 rounded outline-none cursor-text"
                    >
                      {item.answer}
                    </div>
                  </Card>
                ))}
              </div>

              <Button onClick={addFAQ} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add FAQ Item
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="mt-6">
            <Card className="p-8">
              <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Click any text below to edit it
              </p>
              
              <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-12 rounded-lg text-center space-y-6">
                <div contentEditable suppressContentEditableWarning
                  onBlur={(e) => updateSection('contact', 'title', e.currentTarget.textContent || '')}
                  className="text-3xl font-bold p-4 border-2 border-transparent hover:border-blue-300 rounded outline-none cursor-text"
                >
                  {translations.contact.title}
                </div>
                <div contentEditable suppressContentEditableWarning
                  onBlur={(e) => updateSection('contact', 'subtitle', e.currentTarget.textContent || '')}
                  className="text-lg p-4 border-2 border-transparent hover:border-blue-300 rounded outline-none cursor-text"
                >
                  {translations.contact.subtitle}
                </div>
                <Button className="bg-white text-gray-900 hover:bg-gray-100">
                  <span contentEditable suppressContentEditableWarning
                    onBlur={(e) => updateSection('contact', 'ctaButton', e.currentTarget.textContent || '')}
                    className="outline-none"
                  >
                    {translations.contact.ctaButton}
                  </span>
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="footer" className="mt-6">
            <Card className="p-8">
              <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Click any text below to edit footer content
              </p>
              
              <div className="bg-gray-900 text-white p-8 rounded-lg">
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                  <div>
                    <h4 className="font-bold mb-4">About</h4>
                    <div contentEditable suppressContentEditableWarning
                      onBlur={(e) => updateSection('footer', 'about', e.currentTarget.textContent || '')}
                      className="text-gray-300 p-2 border-2 border-transparent hover:border-blue-300 rounded outline-none cursor-text"
                    >
                      {translations.footer.about}
                    </div>
                  </div>
                  <div>
                    <div contentEditable suppressContentEditableWarning
                      onBlur={(e) => updateSection('footer', 'services', { ...translations.footer.services, title: e.currentTarget.textContent || '' })}
                      className="font-bold mb-4 p-2 border-2 border-transparent hover:border-blue-300 rounded outline-none cursor-text"
                    >
                      {translations.footer?.services?.title || 'Services'}
                    </div>
                    <ul className="space-y-2">
                      {(translations.footer?.services?.items || []).map((item, index) => (
                        <li key={index} contentEditable suppressContentEditableWarning
                          onBlur={(e) => {
                            const newItems = [...(translations.footer?.services?.items || [])];
                            newItems[index] = e.currentTarget.textContent || '';
                            updateSection('footer', 'services', { ...translations.footer.services, items: newItems });
                          }}
                          className="text-gray-300 p-2 border-2 border-transparent hover:border-blue-300 rounded outline-none cursor-text"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div contentEditable suppressContentEditableWarning
                      onBlur={(e) => updateSection('footer', 'contact', { ...translations.footer.contact, title: e.currentTarget.textContent || '' })}
                      className="font-bold mb-4 p-2 border-2 border-transparent hover:border-blue-300 rounded outline-none cursor-text"
                    >
                      {translations.footer?.contact?.title || 'Contact'}
                    </div>
                    <ul className="space-y-2">
                      {(translations.footer?.contact?.items || []).map((item, index) => (
                        <li key={index} contentEditable suppressContentEditableWarning
                          onBlur={(e) => {
                            const newItems = [...(translations.footer?.contact?.items || [])];
                            newItems[index] = e.currentTarget.textContent || '';
                            updateSection('footer', 'contact', { ...translations.footer.contact, items: newItems });
                          }}
                          className="text-gray-300 p-2 border-2 border-transparent hover:border-blue-300 rounded outline-none cursor-text"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-6 text-center">
                  <div contentEditable suppressContentEditableWarning
                    onBlur={(e) => updateSection('footer', 'copyright', e.currentTarget.textContent || '')}
                    className="text-gray-400 p-2 border-2 border-transparent hover:border-blue-300 rounded outline-none cursor-text"
                  >
                    {translations.footer.copyright}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
          </TabsContent>

          {/* Configurable Content Tab - NEW */}
          <TabsContent value="configurable-content" className="space-y-6">
            <Card className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                  <Settings className="w-6 h-6 text-rose-500" />
                  Configurable Content
                </h2>
                <p className="text-gray-600">
                  Manage structured content that appears on the homepage (pricing plans, features, etc.)
                </p>
              </div>

              {/* Pricing Plans Section */}
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Pricing Plans</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure pricing plans exactly as they appear on the homepage
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => setIsReorderOpen(true)}
                      disabled={!pricingPlans || pricingPlans.length <= 1}
                    >
                      <ArrowUpDown className="w-4 h-4" />
                      Reorder Plans
                    </Button>
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => setIsAddPlanOpen(true)}
                    >
                      <Plus className="w-4 h-4" />
                      Add Plan
                    </Button>
                  </div>
                </div>

                {/* Pricing Plans Display - Pixel-perfect mirror of homepage */}
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-8">
                  <div className="text-center mb-12">
                    <div className="inline-flex items-center bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-medium mb-6">
                      <Crown className="w-4 h-4 mr-2" />
                      <span>Premium Plans</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-charcoal mb-6">
                      Choose Your Perfect Plan
                    </h2>
                    <p className="text-xl text-charcoal/70 max-w-4xl mx-auto leading-relaxed">
                      Find the right plan for your wedding
                    </p>
                  </div>

                  {/* Pricing Cards Grid - Pixel-perfect mirror from homepage */}
                  <div className="grid lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {plansLoading ? (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        Loading pricing plans...
                      </div>
                    ) : pricingPlans.length === 0 ? (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        No pricing plans configured. Click "Add Plan" to create one.
                      </div>
                    ) : (
                      pricingPlans.map((plan: any, index: number) => {
                        // Handle both database format (planKey) and config format (id)
                        const planId = plan.planKey || plan.id;
                        const planName = plan.nameKey || `templatePlans.plans.${index}.name`;
                        const planBadge = plan.badge || (plan.badgeKey ? planId : null);
                        const isPopular = plan.popular || false;
                        
                        return (
                          <div 
                            key={plan.id || planId}
                            className={`relative rounded-2xl p-6 transition-all duration-300 hover:scale-105 cursor-pointer ${
                              isPopular 
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl ring-4 ring-emerald-200 scale-105' 
                                : 'bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl'
                            }`}
                            onClick={() => {
                              setEditingPlan(plan);
                              setIsEditorOpen(true);
                            }}
                          >
                            {planBadge && (
                              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold text-white ${
                                  plan.badgeColor?.includes('gradient') 
                                    ? plan.badgeColor 
                                    : plan.badgeColor || 'bg-blue-500'
                                }`}>
                                  {planId.charAt(0).toUpperCase() + planId.slice(1)}
                                </span>
                              </div>
                            )}

                            <div className="text-center mb-6">
                              <h3 className={`text-xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-charcoal'}`}>
                                {planName.split('.').pop() || planId}
                              </h3>
                              <div className="mb-3">
                                <span className={`text-3xl font-bold ${isPopular ? 'text-white' : 'text-charcoal'}`}>
                                  {plan.price} {plan.currency || ''}
                                </span>
                              </div>
                              <p className={`text-sm ${isPopular ? 'text-white/90' : 'text-charcoal/70'}`}>
                                {plan.descriptionKey || plan.description || ''}
                              </p>
                            </div>

                            <div className="space-y-3 mb-6">
                              {(plan.features || []).map((feature: any, idx: number) => {
                                const FeatureIcon = getIconComponent(feature.icon || 'Check');
                                const featureName = feature.translationKey?.split('.').pop() || feature.featureKey || 'Feature';
                                const isIncluded = feature.included !== undefined ? feature.included : feature.isEnabled;
                                
                                return (
                                  <div key={idx} className="flex items-center text-sm">
                                    {isIncluded ? (
                                      <Check className={`w-4 h-4 mr-3 flex-shrink-0 ${isPopular ? 'text-white' : 'text-emerald-500'}`} />
                                    ) : (
                                      <X className={`w-4 h-4 mr-3 flex-shrink-0 ${isPopular ? 'text-white/40' : 'text-gray-400'}`} />
                                    )}
                                    <div className="flex items-center">
                                      <FeatureIcon className="w-4 h-4 mr-2" />
                                      <span className={`${
                                        isIncluded 
                                          ? (isPopular ? 'text-white' : 'text-charcoal') 
                                          : (isPopular ? 'text-white/40' : 'text-gray-400')
                                      }`}>
                                        {featureName}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-8 text-center text-sm text-gray-500">
                    <p>👆 This section mirrors the exact appearance of the homepage pricing section</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {hasChanges && mainTab === "translations" && (
          <div className="fixed bottom-8 right-8">
            <Button onClick={saveAllChanges} size="lg" className="bg-rose-500 hover:bg-rose-600 shadow-lg">
              <Save className="w-5 h-5 mr-2" />
              Save All Changes
            </Button>
          </div>
        )}

        {/* Phase 2.1: Pricing Plan Editor Modal */}
        {editingPlan && (
          <PricingPlanEditor
            plan={editingPlan}
            isOpen={isEditorOpen}
            onClose={() => {
              setIsEditorOpen(false);
              setEditingPlan(null);
            }}
          />
        )}

        {/* Phase 3.1: Pricing Plan Reorder Modal */}
        <PricingPlanReorder
          plans={pricingPlans}
          isOpen={isReorderOpen}
          onClose={() => setIsReorderOpen(false)}
        />

        {/* Phase 3.2: Add Pricing Plan Modal */}
        <AddPricingPlan
          existingPlans={pricingPlans}
          isOpen={isAddPlanOpen}
          onClose={() => setIsAddPlanOpen(false)}
        />
      </div>
        </>
      )}
    </div>
  );
}
