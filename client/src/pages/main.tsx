import { useState, useEffect } from "react";
import { 
  Heart, 
  Star, 
  CheckCircle, 
  ArrowRight, 
  Eye, 
  Globe, 
  Palette, 
  Users, 
  Smartphone, 
  Lock,
  Check, 
  X, 
  Crown, 
  Sparkles, 
  Gift,
  Camera,
  Music,
  MapPin,
  Calendar,
  Mail,
  Download,
  Upload,
  QrCode,
  Settings,
  Send,
  MessageCircle
} from "lucide-react";
import { SiInstagram, SiTelegram, SiFacebook } from "react-icons/si";
import { Link } from "wouter";
import { useTranslation, useLocaleFormat } from "@/hooks/useLanguage";
import LanguageSelector from "@/components/LanguageSelector";

// Template interface based on database schema
interface Template {
  id: string;
  name: string;
  slug: string;
  templateKey: string;
  ownerEmail: string | null;
  config: any;
  maintenance: boolean;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
}

// Display template interface
interface DisplayTemplate {
  id: string;
  name: string;
  preview: string;
  demoUrl: string;
  features: string[];
}

interface TemplateFeature {
  name: string;
  icon: React.ReactNode;
  included: boolean;
  description?: string;
}

interface TemplatePlan {
  id: string;
  name: string;
  price: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  features: TemplateFeature[];
  templateRoute: string;
  popular?: boolean;
}

export default function MainPage() {
  const { translations: t } = useTranslation();
  const { formatPrice } = useLocaleFormat();
  const [selectedPlan, setSelectedPlan] = useState<string>("standard");
  const [templates, setTemplates] = useState<DisplayTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates from API
  useEffect(() => {
    const fetchTemplates = async (retryCount = 0) => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/templates', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch templates: ${response.status} ${response.statusText}`);
        }
        
        const apiTemplates: Template[] = await response.json();
        
        // Filter only main templates for display
        const mainTemplates = apiTemplates.filter(template => template.isMain);
        
        // Convert API templates to display format - USE ACTUAL TEMPLATE DATA
        const displayTemplates = mainTemplates.map((template, index) => {
          // Map template previews based on template name or slug - preserve order from database
          let previewImage = `/template_previews/template-preview-${Math.min(index + 1, 5)}.jpg`;
          
          // Try to match specific templates to their preview images based on actual slugs
          if (template.slug.includes('harut')) {
            previewImage = '/template_previews/img1.jpg';
          } else if (template.slug.includes('forest') || template.slug.includes('lily')) {
            previewImage = '/template_previews/img2.jpg';
          } else if (template.slug.includes('michael') || template.slug.includes('sarah')) {
            previewImage = '/template_previews/img4.jpg';
          } else if (template.slug.includes('alexander') || template.slug.includes('isabella')) {
            previewImage = '/template_previews/img4.avif';
          } else if (template.slug.includes('david') || template.slug.includes('rose')) {
            previewImage = '/template_previews/img5.jpeg';
          }
          
          return {
            id: template.slug,
            name: template.name, // USE ACTUAL TEMPLATE NAME FROM DATABASE
            preview: previewImage,
            demoUrl: `/${template.slug}`,
            features: getTemplateFeatures(template)
          };
        });
        
        setTemplates(displayTemplates);
      } catch (err) {
        console.error('Error fetching templates:', err);
        
        // Retry logic for network errors
        if (retryCount < 2 && (err instanceof TypeError || (err as any).name === 'AbortError')) {
          console.log(`Retrying template fetch (attempt ${retryCount + 1})`);
          setTimeout(() => fetchTemplates(retryCount + 1), 1000);
          return;
        }
        
        setError('Failed to load templates');
        // Fall back to hardcoded templates if API fails
        setTemplates(fallbackTemplates);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Extract features from template config - use actual template data
  const getTemplateFeatures = (template: Template) => {
    const features = [];
    
    // Try to extract features from template config if available
    if (template.config) {
      // Check if config has specific features
      if (template.config.features) {
        return template.config.features;
      }
      
      // Check for specific configuration properties
      if (template.config.hasTimeline) features.push('Timeline');
      if (template.config.hasGallery) features.push('Photo Gallery');
      if (template.config.hasMusic) features.push('Music Player');
      if (template.config.theme) features.push(`${template.config.theme} Theme`);
    }
    
    // Add features based on template slug patterns (fallback)
    if (template.slug.includes('harut') || template.name.toLowerCase().includes('armenian')) {
      features.push('Armenian Fonts');
    }
    if (template.slug.includes('forest') || template.slug.includes('lily') || template.name.toLowerCase().includes('nature')) {
      features.push('Nature Theme', 'Green Colors');
    }
    if (template.slug.includes('classic') || template.name.toLowerCase().includes('classic')) {
      features.push('Classic Design');
    }
    if (template.slug.includes('elegant') || template.name.toLowerCase().includes('elegant')) {
      features.push('Elegant Style');
    }
    if (template.slug.includes('romantic') || template.name.toLowerCase().includes('romantic')) {
      features.push('Romantic Design');
    }
    
    // Add common features that all templates should have
    features.push('RSVP', 'Mobile Responsive');
    
    return features;
  };

  // Fallback templates in case API fails
  const fallbackTemplates: DisplayTemplate[] = [
    {
      id: "harut-tatev",
      name: "Elegant Armenian Wedding",
      preview: "/template_previews/template-preview-1.jpg",
      demoUrl: "/harut-tatev",
      features: ["Armenian Fonts", "Timeline", "RSVP", "Photo Gallery"]
    },
    {
      id: "forest-lily",
      name: "Nature Wedding Theme",
      preview: "/template_previews/template-preview-2.jpg", 
      demoUrl: "/forest-lily-nature",
      features: ["Nature Theme", "Green Colors", "RSVP", "Calendar"]
    },
    {
      id: "classic-wedding",
      name: "Classic Romantic Wedding",
      preview: "/template_previews/template-preview-3.jpg",
      demoUrl: "/michael-sarah-classic",
      features: ["Classic Design", "Elegant Style", "RSVP", "Mobile Responsive"]
    },
    {
      id: "luxury-wedding",
      name: "Luxury Elegant Wedding",
      preview: "/template_previews/template-preview-4.jpg",
      demoUrl: "/alexander-isabella-elegant",
      features: ["Premium Features", "Admin Panel", "Blue Theme", "Full Gallery"]
    },
    {
      id: "modern-wedding",
      name: "Romantic Pink Wedding",
      preview: "/template_previews/template-preview-5.jpg",
      demoUrl: "/david-rose-romantic",
      features: ["Romantic Design", "Pink Theme", "Music Player", "Love Story"]
    }
  ];

  const features = [
    {
      icon: Globe,
      title: t.features.items[0].title,
      description: t.features.items[0].description
    },
    {
      icon: Palette,
      title: t.features.items[3].title,
      description: t.features.items[3].description
    },
    {
      icon: Smartphone,
      title: t.features.items[2].title,
      description: t.features.items[2].description
    },
    {
      icon: Users,
      title: t.features.items[1].title,
      description: t.features.items[1].description
    },
    {
      icon: Camera,
      title: t.features.items[4].title,
      description: t.features.items[4].description
    },
    {
      icon: Lock,
      title: t.features.items[5].title,
      description: t.features.items[5].description
    }
  ];

  const templatePlans: TemplatePlan[] = [
    {
      id: "basic",
      name: "Basic",
      price: "10,000 AMD",
      description: "Perfect for intimate weddings with essential features",
      templateRoute: "/michael-sarah-classic",
      features: [
        { name: "Wedding Timeline", icon: <Calendar className="w-4 h-4" />, included: true },
        { name: "Couple Introduction", icon: <Heart className="w-4 h-4" />, included: true },
        { name: "Wedding Locations", icon: <MapPin className="w-4 h-4" />, included: true },
        { name: "RSVP Functionality", icon: <Mail className="w-4 h-4" />, included: true },
        { name: "Guest List Export", icon: <Download className="w-4 h-4" />, included: true },
        { name: "Photo Gallery", icon: <Camera className="w-4 h-4" />, included: false },
        { name: "Audio Player", icon: <Music className="w-4 h-4" />, included: false },
        { name: "Admin Panel", icon: <Settings className="w-4 h-4" />, included: false },
        { name: "QR Code Cards", icon: <QrCode className="w-4 h-4" />, included: false }
      ]
    },
    {
      id: "essential",
      name: "Essential",
      price: "17,000 AMD",
      badge: "Great Value",
      badgeColor: "bg-blue-500",
      description: "Enhanced features for modern couples",
      templateRoute: "/forest-lily-nature",
      features: [
        { name: "Wedding Timeline", icon: <Calendar className="w-4 h-4" />, included: true },
        { name: "Couple Introduction", icon: <Heart className="w-4 h-4" />, included: true },
        { name: "Wedding Locations", icon: <MapPin className="w-4 h-4" />, included: true },
        { name: "RSVP Functionality", icon: <Mail className="w-4 h-4" />, included: true },
        { name: "Guest List Export", icon: <Download className="w-4 h-4" />, included: true },
        { name: "Photo Gallery", icon: <Camera className="w-4 h-4" />, included: true },
        { name: "Audio Player", icon: <Music className="w-4 h-4" />, included: true },
        { name: "Admin Panel", icon: <Settings className="w-4 h-4" />, included: false },
        { name: "QR Code Cards", icon: <QrCode className="w-4 h-4" />, included: false }
      ]
    },
    {
      id: "professional",
      name: "Professional",
      price: "23,000 AMD",
      badge: "Most Popular",
      badgeColor: "bg-green-500",
      popular: true,
      description: "Complete wedding website solution",
      templateRoute: "/david-rose-romantic",
      features: [
        { name: "Wedding Timeline", icon: <Calendar className="w-4 h-4" />, included: true },
        { name: "Couple Introduction", icon: <Heart className="w-4 h-4" />, included: true },
        { name: "Wedding Locations", icon: <MapPin className="w-4 h-4" />, included: true },
        { name: "RSVP Functionality", icon: <Mail className="w-4 h-4" />, included: true },
        { name: "Guest List Export", icon: <Download className="w-4 h-4" />, included: true },
        { name: "Photo Gallery", icon: <Camera className="w-4 h-4" />, included: true },
        { name: "Audio Player", icon: <Music className="w-4 h-4" />, included: true },
        { name: "Admin Panel", icon: <Settings className="w-4 h-4" />, included: true },
        { name: "QR Code Cards", icon: <QrCode className="w-4 h-4" />, included: false }
      ]
    },
    {
      id: "premium",
      name: "Premium",
      price: "31,000 AMD",
      badge: "Advanced",
      badgeColor: "bg-purple-500",
      description: "Premium features for luxury weddings",
      templateRoute: "/alexander-isabella-elegant",
      features: [
        { name: "Wedding Timeline", icon: <Calendar className="w-4 h-4" />, included: true },
        { name: "Couple Introduction", icon: <Heart className="w-4 h-4" />, included: true },
        { name: "Wedding Locations", icon: <MapPin className="w-4 h-4" />, included: true },
        { name: "RSVP Functionality", icon: <Mail className="w-4 h-4" />, included: true },
        { name: "Guest List Export", icon: <Download className="w-4 h-4" />, included: true },
        { name: "Photo Gallery", icon: <Camera className="w-4 h-4" />, included: true },
        { name: "Audio Player", icon: <Music className="w-4 h-4" />, included: true },
        { name: "Admin Panel", icon: <Settings className="w-4 h-4" />, included: true },
        { name: "QR Code Cards", icon: <QrCode className="w-4 h-4" />, included: true, description: "50 cards included" }
      ]
    },
    {
      id: "ultimate",
      name: "Ultimate",
      price: "37,000 AMD",
      badge: "Luxury",
      badgeColor: "bg-gradient-to-r from-yellow-400 to-orange-500",
      description: "The complete luxury wedding experience",
      templateRoute: "/harut-tatev",
      features: [
        { name: "Wedding Timeline", icon: <Calendar className="w-4 h-4" />, included: true },
        { name: "Couple Introduction", icon: <Heart className="w-4 h-4" />, included: true },
        { name: "Wedding Locations", icon: <MapPin className="w-4 h-4" />, included: true },
        { name: "RSVP Functionality", icon: <Mail className="w-4 h-4" />, included: true },
        { name: "Guest List Export", icon: <Download className="w-4 h-4" />, included: true },
        { name: "Photo Gallery", icon: <Camera className="w-4 h-4" />, included: true },
        { name: "Audio Player", icon: <Music className="w-4 h-4" />, included: true },
        { name: "Admin Panel", icon: <Settings className="w-4 h-4" />, included: true },
        { name: "QR Code Cards", icon: <QrCode className="w-4 h-4" />, included: true, description: "100 cards included" }
      ]
    }
  ];

  const pricingPlans = [
    {
      id: "basic",
      name: "Basic",
      price: "$99",
      description: "Perfect for simple weddings",
      features: [
        "1 Template Design",
        "Basic Customization",
        "RSVP Collection",
        "Mobile Responsive",
        "1 Month Support"
      ],
      popular: false
    },
    {
      id: "standard",
      name: "Standard",
      price: "$199",
      description: "Most popular choice",
      features: [
        "2 Template Options",
        "Full Customization",
        "Photo Gallery",
        "RSVP Management",
        "Armenian Font Support",
        "3 Months Support"
      ],
      popular: true
    },
    {
      id: "premium",
      name: "Premium",
      price: "$299",
      description: "Complete wedding solution",
      features: [
        "All Templates",
        "Custom Design",
        "Unlimited Photos",
        "Advanced RSVP",
        "Custom Domain",
        "6 Months Support",
        "Priority Support"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-lightGold/20">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-softGold mr-3" />
              <span className="text-xl font-bold text-charcoal">WeddingSites</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-charcoal hover:text-softGold transition-colors">{t.navigation.features}</a>
              <Link to="/templates" className="text-charcoal hover:text-softGold transition-colors">{t.navigation.templates}</Link>
              <a href="#pricing" className="text-charcoal hover:text-softGold transition-colors">{t.navigation.pricing}</a>
              <a href="#contact" className="text-charcoal hover:text-softGold transition-colors">{t.navigation.contact}</a>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <a 
                href="#contact" 
                className="bg-softGold hover:bg-softGold/90 text-white px-4 py-2 rounded-lg transition-colors"
                data-testid="button-start-today"
              >
                {t.hero.cta}
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-softGold/10 via-transparent to-sageGreen/10"></div>
        <div className="absolute top-20 left-10 w-32 h-32 bg-softGold/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-sageGreen/10 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-charcoal mb-6 animate-slide-up">
              {t.hero.title}
            </h1>
            <p className="text-xl text-charcoal/70 mb-8 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {t.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <Link 
                to="/templates"
                className="bg-softGold hover:bg-softGold/90 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center"
              >
                {t.hero.viewTemplates} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a 
                href="#templates"
                className="border-2 border-charcoal text-charcoal hover:bg-charcoal hover:text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center"
              >
                {t.common.viewMore} <Eye className="ml-2 h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
              {t.features.title}
            </h2>
            <p className="text-xl text-charcoal/70 max-w-3xl mx-auto">
              {t.features.subtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-br from-cream/50 to-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <feature.icon className="h-12 w-12 text-softGold mb-4" />
                <h3 className="text-xl font-semibold text-charcoal mb-2">{feature.title}</h3>
                <p className="text-charcoal/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section id="templates" className="py-20 bg-gradient-to-br from-lightGold/10 to-cream/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
              Beautiful Template Designs
            </h2>
            <p className="text-xl text-charcoal/70 max-w-3xl mx-auto">
              Choose from our collection of stunning wedding website templates
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-softGold"></div>
              <p className="mt-4 text-charcoal/60">Loading templates...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <p className="text-charcoal/60">Showing default templates</p>
            </div>
          ) : null}
          
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {templates.map((template, index) => (
              <div 
                key={template.id} 
                className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative aspect-video overflow-hidden bg-gray-100">
                  <img 
                    src={template.preview} 
                    alt={`${template.name} preview`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    onLoad={(e) => {
                      // Image loaded successfully
                      const target = e.target as HTMLImageElement;
                      target.style.opacity = '1';
                      target.parentElement!.classList.remove('bg-gray-100');
                    }}
                    style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                  />
                  {/* Overlay with demo button */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                    <Link 
                      to={template.demoUrl}
                      className="inline-flex items-center bg-white hover:bg-gray-100 text-charcoal px-6 py-3 rounded-lg transition-all duration-300 font-semibold shadow-lg transform translate-y-4 group-hover:translate-y-0"
                    >
                      View Live Demo <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                  {/* Template label */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-sm text-charcoal px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                      Template
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-charcoal mb-2">{template.name}</h3>
                  <p className="text-charcoal/60 mb-4 text-sm">Live Preview Available • Mobile Responsive</p>
                  <h4 className="font-semibold text-charcoal mb-3 text-sm">Features:</h4>
                  <div className="flex flex-wrap gap-2">
                    {template.features.map((feature: string, idx: number) => (
                      <span key={idx} className="bg-softGold/10 text-softGold px-3 py-1 rounded-full text-sm font-medium border border-softGold/20">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wedding Templates & Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-medium mb-6">
              <Crown className="w-4 h-4 mr-2" />
              {t.templatePlansSection.badge}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal mb-6">
              {t.templatePlansSection.title}
            </h2>
            <p className="text-xl text-charcoal/70 max-w-4xl mx-auto leading-relaxed">
              {t.templatePlansSection.subtitle}
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16">
            {templatePlans.map((plan, index) => (
              <div 
                key={plan.id}
                className={`relative rounded-2xl p-6 transition-all duration-300 hover:scale-105 ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl ring-4 ring-emerald-200 scale-105' 
                    : 'bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold text-white ${
                      plan.badgeColor?.includes('gradient') 
                        ? plan.badgeColor 
                        : plan.badgeColor || 'bg-blue-500'
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-charcoal'}`}>
                    {plan.name}
                  </h3>
                  <div className="mb-3">
                    <span className={`text-3xl font-bold ${plan.popular ? 'text-white' : 'text-charcoal'}`}>
                      {plan.price}
                    </span>
                  </div>
                  <p className={`text-sm ${plan.popular ? 'text-white/90' : 'text-charcoal/70'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      {feature.included ? (
                        <Check className={`w-4 h-4 mr-3 flex-shrink-0 ${plan.popular ? 'text-white' : 'text-emerald-500'}`} />
                      ) : (
                        <X className={`w-4 h-4 mr-3 flex-shrink-0 ${plan.popular ? 'text-white/40' : 'text-gray-400'}`} />
                      )}
                      <div className="flex items-center">
                        {feature.icon}
                        <span className={`ml-2 ${
                          feature.included 
                            ? (plan.popular ? 'text-white' : 'text-charcoal') 
                            : (plan.popular ? 'text-white/40' : 'text-gray-400')
                        }`}>
                          {feature.name}
                          {feature.description && (
                            <span className="text-xs ml-1">({feature.description})</span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <Link 
                  to={plan.templateRoute}
                  className={`block w-full py-3 px-4 rounded-lg font-medium text-center transition-all duration-200 ${
                    plan.popular
                      ? 'bg-white text-emerald-600 hover:bg-gray-50 shadow-lg'
                      : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 shadow-md'
                  }`}
                >
                  View Template
                </Link>
              </div>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
              <h3 className="text-2xl font-bold text-center">Detailed Feature Comparison</h3>
              <p className="text-center text-slate-300 mt-2">Compare all features across our wedding website plans</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-charcoal">Features</th>
                    {templatePlans.map((plan) => (
                      <th key={plan.id} className="text-center p-4 font-semibold text-charcoal min-w-[120px]">
                        <div className="flex flex-col items-center">
                          <span>{plan.name}</span>
                          <span className="text-sm font-normal text-slate-600">{plan.price}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {templatePlans[0].features.map((featureTemplate, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-4 font-medium text-charcoal">
                        <div className="flex items-center">
                          {featureTemplate.icon}
                          <span className="ml-2">{featureTemplate.name}</span>
                        </div>
                      </td>
                      {templatePlans.map((plan) => {
                        const feature = plan.features[idx];
                        return (
                          <td key={plan.id} className="p-4 text-center">
                            <div className="flex justify-center">
                              {feature.included ? (
                                <Check className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <X className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            {feature.description && (
                              <div className="text-xs text-slate-600 mt-1">{feature.description}</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <h3 className="text-3xl font-bold text-center text-charcoal mb-12">Frequently Asked Questions</h3>
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-charcoal mb-3 flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-rose-500" />
                  What's included in each plan?
                </h4>
                <p className="text-charcoal/70">
                  Each plan includes a beautifully designed wedding website template, RSVP functionality, and guest management. 
                  Higher tiers add premium features like photo galleries, music integration, admin panels, and physical QR code cards.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-charcoal mb-3 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-rose-500" />
                  Can I customize my template?
                </h4>
                <p className="text-charcoal/70">
                  Absolutely! All templates are fully customizable. You can change colors, fonts, content, photos, and layout elements 
                  to match your wedding style. Professional and higher plans include an admin panel for easy customization.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-charcoal mb-3 flex items-center">
                  <QrCode className="w-5 h-5 mr-2 text-rose-500" />
                  What are QR Code Cards?
                </h4>
                <p className="text-charcoal/70">
                  QR Code Cards are physical cards with QR codes that link directly to your wedding website. Perfect for wedding invitations, 
                  table settings, or save-the-dates. Premium includes 50 cards, Ultimate includes 100 cards.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-charcoal mb-3 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-rose-500" />
                  How do I manage RSVPs?
                </h4>
                <p className="text-charcoal/70">
                  All plans include RSVP functionality where guests can confirm attendance and meal preferences. 
                  You can export guest lists and track responses in real-time through your website dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-charcoal to-charcoal/90 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t.contactSection.title}
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
              {t.contactSection.subtitle}
            </p>
            <p className="text-lg text-white/70 mb-6">Contact us on social media to get started</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
              <a 
                href="https://www.instagram.com/weddingsites_am" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all flex items-center gap-3"
                data-testid="link-instagram-contact"
              >
                <SiInstagram className="w-6 h-6" />
                Instagram
              </a>
              <a 
                href="https://t.me/weddingsites_am" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#0088cc] hover:bg-[#0088cc]/90 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors flex items-center gap-3"
                data-testid="link-telegram-contact"
              >
                <SiTelegram className="w-6 h-6" />
                Telegram
              </a>
              <a 
                href="https://www.facebook.com/weddingsites.am" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#1877f2] hover:bg-[#1877f2]/90 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors flex items-center gap-3"
                data-testid="link-facebook-contact"
              >
                <SiFacebook className="w-6 h-6" />
                Facebook
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Heart className="h-6 w-6 text-softGold mr-2" />
                <span className="text-lg font-bold">WeddingSites</span>
              </div>
              <p className="text-white/70">
                Beautiful wedding websites for your special day
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t.footer.services.title}</h4>
              <ul className="space-y-2 text-white/70">
                <li>Wedding Websites</li>
                <li>Template Design</li>
                <li>Custom Development</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-white/70">
                <li>Armenian Support</li>
                <li>RSVP Management</li>
                <li>Photo Galleries</li>
                <li>Mobile Responsive</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <p className="text-white/70 mb-4">Reach out on social media</p>
              <div className="flex gap-4">
                <a 
                  href="https://www.instagram.com/weddingsites_am" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                  data-testid="link-instagram-footer"
                  aria-label="Instagram"
                >
                  <SiInstagram className="w-6 h-6" />
                </a>
                <a 
                  href="https://t.me/weddingsites_am" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                  data-testid="link-telegram-footer"
                  aria-label="Telegram"
                >
                  <SiTelegram className="w-6 h-6" />
                </a>
                <a 
                  href="https://www.facebook.com/weddingsites.am" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                  data-testid="link-facebook-footer"
                  aria-label="Facebook"
                >
                  <SiFacebook className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/70">
            <p>{t.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}