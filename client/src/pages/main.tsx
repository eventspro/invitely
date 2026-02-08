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
import { useTranslation, useLocaleFormat, useLanguage } from "@/hooks/useLanguage";
import LanguageSelector from "@/components/LanguageSelector";
import { defaultContentConfig, getEnabledItems } from "@shared/content-config";

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
  const { isLoading: translationsLoading } = useLanguage();
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
        
        // Filter only Template 1-5 (main templates that exist)
        const allowedTemplateNames = ['Template 1', 'Template 2', 'Template 3', 'Template 4', 'Template 5'];
        const mainTemplates = apiTemplates.filter(template => 
          template.isMain && allowedTemplateNames.includes(template.name)
        );
        
        console.log('📋 Filtered templates:', mainTemplates.map(t => ({ name: t.name, slug: t.slug, isMain: t.isMain })));
        
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
      if (template.config.theme?.name) features.push(`${template.config.theme.name} Theme`);
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
      name: t.templates?.items?.[0]?.name || "",
      preview: "/template_previews/template-preview-1.jpg",
      demoUrl: "/harut-tatev",
      features: [
        t.templates?.items?.[0]?.features?.["0"] || "",
        t.templates?.items?.[0]?.features?.["1"] || "",
        t.templates?.items?.[0]?.features?.["2"] || "",
        t.templates?.items?.[0]?.features?.["3"] || ""
      ].filter(f => f) // Remove empty strings
    },
    {
      id: "forest-lily",
      name: t.templates?.items?.[1]?.name || "",
      preview: "/template_previews/template-preview-2.jpg", 
      demoUrl: "/forest-lily-nature",
      features: [
        t.templates?.items?.[1]?.features?.["0"] || "",
        t.templates?.items?.[1]?.features?.["1"] || "",
        t.templates?.items?.[1]?.features?.["2"] || "",
        t.templates?.items?.[1]?.features?.["3"] || ""
      ].filter(f => f)
    },
    {
      id: "classic-wedding",
      name: t.templates?.items?.[2]?.name || "",
      preview: "/template_previews/template-preview-3.jpg",
      demoUrl: "/michael-sarah-classic",
      features: [
        t.templates?.items?.[2]?.features?.["0"] || "",
        t.templates?.items?.[2]?.features?.["1"] || "",
        t.templates?.items?.[2]?.features?.["2"] || "",
        t.templates?.items?.[2]?.features?.["3"] || ""
      ].filter(f => f)
    },
    {
      id: "luxury-wedding",
      name: t.templates?.items?.[3]?.name || "",
      preview: "/template_previews/template-preview-4.jpg",
      demoUrl: "/alexander-isabella-elegant",
      features: [
        t.templates?.items?.[3]?.features?.["0"] || "",
        t.templates?.items?.[3]?.features?.["1"] || "",
        t.templates?.items?.[3]?.features?.["2"] || "",
        t.templates?.items?.[3]?.features?.["3"] || ""
      ].filter(f => f)
    },
    {
      id: "modern-wedding",
      name: t.templates?.items?.[4]?.name || "",
      preview: "/template_previews/template-preview-5.jpg",
      demoUrl: "/david-rose-romantic",
      features: [
        t.templates?.items?.[4]?.features?.["0"] || "",
        t.templates?.items?.[4]?.features?.["1"] || "",
        t.templates?.items?.[4]?.features?.["2"] || "",
        t.templates?.items?.[4]?.features?.["3"] || ""
      ].filter(f => f)
    }
  ].filter(t => t.name); // Only include templates that have names

  const features = [
    {
      icon: Globe,
      title: t.features?.items?.[0]?.title,
      description: t.features?.items?.[0]?.description
    },
    {
      icon: Palette,
      title: t.features?.items?.[3]?.title,
      description: t.features?.items?.[3]?.description
    },
    {
      icon: Smartphone,
      title: t.features?.items?.[2]?.title,
      description: t.features?.items?.[2]?.description
    },
    {
      icon: Users,
      title: t.features?.items?.[1]?.title,
      description: t.features?.items?.[1]?.description
    },
    {
      icon: Camera,
      title: t.features?.items?.[4]?.title,
      description: t.features?.items?.[4]?.description
    },
    {
      icon: Lock,
      title: t.features?.items?.[5]?.title,
      description: t.features?.items?.[5]?.description
    }
  ].filter(f => f.title && f.description); // Only include if both title and description exist

  // Helper function to get icon component from icon name
  const getIcon = (iconName: string, size = "w-4 h-4") => {
    const icons: Record<string, any> = {
      Calendar, Heart, MapPin, Mail, Camera, Music, Settings, QrCode, Download, Upload
    };
    const IconComponent = icons[iconName] || Calendar;
    return <IconComponent className={size} />;
  };

  // Build template plans from centralized config + translations
  const templatePlans: TemplatePlan[] = getEnabledItems(defaultContentConfig.pricingPlans).map(plan => {
    // Extract the feature name from translation key (e.g., "templatePlans.features.Wedding Timeline" -> "Wedding Timeline")
    const getFeatureName = (translationKey: string) => {
      const parts = translationKey.split('.');
      return parts[parts.length - 1]; // Get last part
    };

    return {
      id: plan.id,
      name: t.templatePlans?.plans?.[plan.order]?.name || plan.id,
      price: plan.price,
      badge: plan.badgeKey ? (t.templatePlansSection?.planBadges as any)?.[plan.id] : undefined,
      badgeColor: plan.badgeColor,
      description: t.templatePlans?.plans?.[plan.order]?.description || "",
      templateRoute: plan.templateRoute,
      popular: plan.popular,
      features: plan.features.map(f => {
        const featureName = getFeatureName(f.translationKey);
        return {
          name: (t.templatePlans?.features as any)?.[featureName] || featureName,
          icon: getIcon(f.icon),
          included: f.included
        };
      })
    };
  });

  // Show loading state while translations are being fetched
  if (translationsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-white to-lightGold/20 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-softGold mb-4"></div>
          <p className="text-charcoal/60">Loading translations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-lightGold/20 relative">
      {/* Fixed Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/attached_assets/floral-background1.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Content wrapper with relative positioning */}
      <div className="relative z-10">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-softGold mr-3" />
              {t.contactSocial?.brandName && (
                <span className="text-xl font-bold text-charcoal" data-i18n-key="contactSocial.brandName">
                  {t.contactSocial.brandName}
                </span>
              )}
            </div>
            <div className="hidden md:flex space-x-8">
              {t.navigation?.features && (
                <a href="#features" className="text-charcoal hover:text-softGold transition-colors">
                  <span data-i18n-key="navigation.features">{t.navigation.features}</span>
                </a>
              )}
              {t.navigation?.templates && (
                <Link to="/templates" className="text-charcoal hover:text-softGold transition-colors">
                  <span data-i18n-key="navigation.templates">{t.navigation.templates}</span>
                </Link>
              )}
              {t.navigation?.pricing && (
                <a href="#pricing" className="text-charcoal hover:text-softGold transition-colors">
                  <span data-i18n-key="navigation.pricing">{t.navigation.pricing}</span>
                </a>
              )}
              {t.navigation?.contact && (
                <a href="#contact" className="text-charcoal hover:text-softGold transition-colors">
                  <span data-i18n-key="navigation.contact">{t.navigation.contact}</span>
                </a>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              {t.hero?.cta && (
                <a 
                  href="#contact" 
                  className="bg-softGold hover:bg-softGold/90 text-white px-4 py-2 rounded-lg transition-colors"
                  data-testid="button-start-today"
                >
                  <span data-i18n-key="hero.cta">{t.hero.cta}</span>
                </a>
              )}
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
            {t.hero?.title && t.hero.title.trim() && (
              <h1 
                className="text-4xl md:text-6xl font-bold text-charcoal mb-6 animate-slide-up"
                data-i18n-key="hero.title"
              >
                {t.hero.title}
              </h1>
            )}
            {t.hero?.subtitle && t.hero.subtitle.trim() && (
              <p 
                className="text-xl text-charcoal/70 mb-8 max-w-3xl mx-auto animate-slide-up" 
                style={{ animationDelay: '0.2s' }}
                data-i18n-key="hero.subtitle"
              >
                {t.hero.subtitle}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
              {t.hero?.viewTemplates && t.hero.viewTemplates.trim() && (
                <Link 
                  to="/templates"
                  className="bg-softGold hover:bg-softGold/90 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center"
                >
                  <span data-i18n-key="hero.viewTemplates">{t.hero.viewTemplates}</span> <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              )}
              {t.common?.viewMore && t.common.viewMore.trim() && (
                <a 
                  href="#templates"
                  className="border-2 border-charcoal text-charcoal hover:bg-charcoal hover:text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center"
                >
                  <span data-i18n-key="common.viewMore">{t.common.viewMore}</span> <Eye className="ml-2 h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            {t.features?.title && (
              <h2 
                className="text-3xl md:text-4xl font-bold text-charcoal mb-4"
                data-i18n-key="features.title"
              >
                {t.features.title}
              </h2>
            )}
            {t.features?.subtitle && (
              <p 
                className="text-xl text-charcoal/70 max-w-3xl mx-auto"
                data-i18n-key="features.subtitle"
              >
                {t.features.subtitle}
              </p>
            )}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <feature.icon className="h-12 w-12 text-softGold mb-4" />
                <h3 
                  className="text-xl font-semibold text-charcoal mb-2"
                  data-i18n-key={`features.items.${index}.title`}
                >
                  {feature.title}
                </h3>
                <p 
                  className="text-charcoal/70"
                  data-i18n-key={`features.items.${index}.description`}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section id="templates" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            {t.templates?.title && (
              <h2 
                className="text-3xl md:text-4xl font-bold text-charcoal mb-4"
                data-i18n-key="templates.title"
              >
                {t.templates.title}
              </h2>
            )}
            {t.templates?.subtitle && (
              <p 
                className="text-xl text-charcoal/70 max-w-3xl mx-auto"
                data-i18n-key="templates.subtitle"
              >
                {t.templates.subtitle}
              </p>
            )}
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-softGold"></div>
              <p 
                className="mt-4 text-charcoal/60"
                data-i18n-key="templates.loading"
              >
                {t.templates?.loading || 'Loading templates...'}
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4" data-i18n-key="templates.error">{error}</p>
              <p 
                className="text-charcoal/60"
                data-i18n-key="templates.error"
              >
                {t.templates?.error || 'Failed to load templates'}
              </p>
            </div>
          ) : null}
          
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {templates.map((template, index) => (
              <div 
                key={template.id} 
                className="rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
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
                      <span data-i18n-key="templates.viewDemo">{t.templates?.viewDemo || 'View Live Demo'}</span> <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                  {/* Template label */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-sm text-charcoal px-3 py-1 rounded-full text-sm font-medium shadow-lg" data-i18n-key="templates.templateLabel">
                      {t.templates?.templateLabel || 'Template'}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-charcoal mb-2" data-i18n-key={`templates.items.${index}.name`}>{t.templates?.items?.[index]?.name || template.name}</h3>
                  <p className="text-charcoal/60 mb-4 text-sm" data-i18n-key="templates.cardSubtitle">{t.templates?.cardSubtitle}</p>
                  {/* <h4 className="font-semibold text-charcoal mb-3 text-sm" data-i18n-key="templates.featuresLabel">{t.templates?.featuresLabel}:</h4> */}
                  {/* <div className="flex flex-wrap gap-2">
                    {template.features.map((feature: string, idx: number) => (
                      <span key={idx} className="bg-softGold/10 text-softGold px-3 py-1 rounded-full text-sm font-medium border border-softGold/20" data-i18n-key={`templates.feature.${idx}`}>
                        {feature}
                      </span>
                    ))}
                  </div> */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wedding Templates & Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-medium mb-6">
              <Crown className="w-4 h-4 mr-2" />
              {t.templatePlansSection?.badge && (
                <span data-i18n-key="templatePlansSection.badge">{t.templatePlansSection.badge}</span>
              )}
            </div>
            {t.templatePlansSection?.title && (
              <h2 
                className="text-4xl md:text-5xl font-bold text-charcoal mb-6"
                data-i18n-key="templatePlansSection.title"
              >
                {t.templatePlansSection.title}
              </h2>
            )}
            {t.templatePlansSection?.subtitle && (
              <p 
                className="text-xl text-charcoal/70 max-w-4xl mx-auto leading-relaxed"
                data-i18n-key="templatePlansSection.subtitle"
              >
                {t.templatePlansSection.subtitle}
              </p>
            )}
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16">
            {templatePlans.map((plan, index) => (
              <div 
                key={plan.id}
                className={`relative rounded-2xl p-6 transition-all duration-300 hover:scale-105 ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl ring-4 ring-emerald-200 scale-105' 
                    : 'backdrop-blur-sm border-2 border-gray-200 shadow-lg hover:shadow-xl'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <span className={`px-5 py-2 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-sm border border-white/20 ${
                      plan.badgeColor?.includes('gradient') 
                        ? plan.badgeColor 
                        : plan.badgeColor || 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`} data-i18n-key={`templatePlans.plans.${index}.badge`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-charcoal'}`} data-i18n-key={`templatePlans.plans.${index}.name`}>
                    {plan.name}
                  </h3>
                  <div className="mb-3">
                    <span className={`text-3xl font-bold ${plan.popular ? 'text-white' : 'text-charcoal'}`} data-i18n-key={`templatePlans.plans.${index}.price`}>
                      {plan.price}
                    </span>
                  </div>
                  <p className={`text-sm ${plan.popular ? 'text-white/90' : 'text-charcoal/70'}`} data-i18n-key={`templatePlans.plans.${index}.description`}>
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
                        }`} data-i18n-key={`templatePlans.features.${feature.name}`}>
                          {feature.name}
                          {feature.description && (
                            <span className="text-xs ml-1" data-i18n-key={`templatePlans.features.${feature.name}.description`}>({feature.description})</span>
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
                  <span data-i18n-key="templatePlans.viewTemplate">{t.templatePlans?.viewTemplate || 'View Template'}</span>
                </Link>
              </div>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <div className="bg-white/30 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-sm text-white p-6">
              <h3 className="text-2xl font-bold text-center" data-i18n-key="templatePlans.comparisonTitle">{t.templatePlans?.comparisonTitle}</h3>
              <p className="text-center text-slate-300 mt-2" data-i18n-key="templatePlans.comparisonSubtitle">{t.templatePlans?.comparisonSubtitle}</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/20 backdrop-blur-sm">
                  <tr>
                    <th className="text-left p-4 font-semibold text-charcoal" data-i18n-key="templatePlans.featuresHeader">{t.templatePlans?.featuresHeader}</th>
                    {templatePlans.map((plan, planIdx) => (
                      <th key={plan.id} className="text-center p-4 font-semibold text-charcoal min-w-[120px]">
                        <div className="flex flex-col items-center">
                          <span data-i18n-key={`templatePlans.plans.${planIdx}.name`}>{plan.name}</span>
                          <span className="text-sm font-normal text-slate-600" data-i18n-key={`templatePlans.plans.${planIdx}.price`}>{plan.price}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {templatePlans[0].features.map((featureTemplate, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white/10' : 'bg-slate-50/10'}>
                      <td className="p-4 font-medium text-charcoal">
                        <div className="flex items-center">
                          {featureTemplate.icon}
                          <span className="ml-2" data-i18n-key={`templatePlans.features.${featureTemplate.name}`}>{featureTemplate.name}</span>
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
                              <div className="text-xs text-slate-600 mt-1" data-i18n-key={`templatePlans.features.${feature.name}.description`}>{feature.description}</div>
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
            <h3 className="text-3xl font-bold text-center text-charcoal mb-12" data-i18n-key="faq.title">
              {t.faq?.title || "Frequently Asked Questions"}
            </h3>
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-charcoal mb-3 flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-rose-500" />
                  <span data-i18n-key="faq.items.0.question">
                    {t.faq?.items?.[0]?.question || "What's included in each plan?"}
                  </span>
                </h4>
                <p className="text-charcoal/70" data-i18n-key="faq.items.0.answer">
                  {t.faq?.items?.[0]?.answer || "Each plan includes a beautifully designed wedding website template, RSVP functionality, and guest management. Higher tiers add premium features like photo galleries, music integration, admin panels, and physical QR code cards."}
                </p>
              </div>
              
              <div className="backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-charcoal mb-3 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-rose-500" />
                  <span data-i18n-key="faq.items.1.question">
                    {t.faq?.items?.[1]?.question || "Can I customize my template?"}
                  </span>
                </h4>
                <p className="text-charcoal/70" data-i18n-key="faq.items.1.answer">
                  {t.faq?.items?.[1]?.answer || "Absolutely! All templates are fully customizable. You can change colors, fonts, content, photos, and layout elements to match your wedding style. Professional and higher plans include an admin panel for easy customization."}
                </p>
              </div>
              
              <div className="backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-charcoal mb-3 flex items-center">
                  <QrCode className="w-5 h-5 mr-2 text-rose-500" />
                  <span data-i18n-key="faq.items.2.question">
                    {t.faq?.items?.[2]?.question || "What are QR Code Cards?"}
                  </span>
                </h4>
                <p className="text-charcoal/70" data-i18n-key="faq.items.2.answer">
                  {t.faq?.items?.[2]?.answer || "QR Code Cards are physical cards with QR codes that link directly to your wedding website. Perfect for wedding invitations, table settings, or save-the-dates. Premium includes 50 cards, Ultimate includes 100 cards."}
                </p>
              </div>
              
              <div className="backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-charcoal mb-3 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-rose-500" />
                  <span data-i18n-key="faq.items.3.question">
                    {t.faq?.items?.[3]?.question || "How do I manage RSVPs?"}
                  </span>
                </h4>
                <p className="text-charcoal/70" data-i18n-key="faq.items.3.answer">
                  {t.faq?.items?.[3]?.answer || "All plans include RSVP functionality where guests can confirm attendance and meal preferences. You can export guest lists and track responses in real-time through your website dashboard."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {t.contactSection?.title && (
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-charcoal" data-i18n-key="contactSection.title">
                {t.contactSection.title}
              </h2>
            )}
            {t.contactSection?.subtitle && (
              <p className="text-xl text-charcoal/80 mb-8 max-w-3xl mx-auto" data-i18n-key="contactSection.subtitle">
                {t.contactSection.subtitle}
              </p>
            )}
            {t.contactSocial?.description && (
              <p className="text-lg text-charcoal/70 mb-6" data-i18n-key="contactSocial.description">
                {t.contactSocial.description}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
              <a 
                href="https://www.instagram.com/weddingsites_am" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all flex items-center gap-3"
                data-testid="link-instagram-contact"
              >
                <SiInstagram className="w-6 h-6" />
                <span data-i18n-key="socialMedia.instagram.label">{t.socialMedia?.instagram?.label}</span>
              </a>
              <a 
                href="https://t.me/weddingsites_am" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#0088cc] hover:bg-[#0088cc]/90 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors flex items-center gap-3"
                data-testid="link-telegram-contact"
              >
                <SiTelegram className="w-6 h-6" />
                <span data-i18n-key="socialMedia.telegram.label">{t.socialMedia?.telegram?.label}</span>
              </a>
              <a 
                href="https://www.facebook.com/weddingsites.am" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#1877f2] hover:bg-[#1877f2]/90 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors flex items-center gap-3"
                data-testid="link-facebook-contact"
              >
                <SiFacebook className="w-6 h-6" />
                <span data-i18n-key="socialMedia.facebook.label">{t.socialMedia?.facebook?.label}</span>
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
                <span className="text-lg font-bold" data-i18n-key="contactSocial.brandName">{t.contactSocial?.brandName}</span>
              </div>
              <p 
                className="text-white/70"
                data-i18n-key="footer.tagline"
              >
                {t.footer?.tagline}
              </p>
            </div>
            <div>
              <h4 
                className="font-semibold mb-4"
                data-i18n-key="footer.services.title"
              >
                {t.footer?.services?.title}
              </h4>
              <ul className="space-y-2 text-white/70">
                <li data-i18n-key="footer.services.items.0">{t.footer?.services?.items?.[0]}</li>
                <li data-i18n-key="footer.services.items.1">{t.footer?.services?.items?.[1]}</li>
                <li data-i18n-key="footer.services.items.2">{t.footer?.services?.items?.[2]}</li>
                <li data-i18n-key="footer.services.items.3">{t.footer?.services?.items?.[3]}</li>
              </ul>
            </div>
            <div>
              <h4 
                className="font-semibold mb-4"
                data-i18n-key="footer.features.title"
              >
                {t.footer?.features?.title}
              </h4>
              <ul className="space-y-2 text-white/70">
                <li data-i18n-key="footer.features.items.0">{t.footer?.features?.items?.[0]}</li>
                <li data-i18n-key="footer.features.items.1">{t.footer?.features?.items?.[1]}</li>
                <li data-i18n-key="footer.features.items.2">{t.footer?.features?.items?.[2]}</li>
                <li data-i18n-key="footer.features.items.3">{t.footer?.features?.items?.[3]}</li>
              </ul>
            </div>
            <div>
              <h4 
                className="font-semibold mb-4"
                data-i18n-key="footer.contact.title"
              >
                {t.footer?.contact?.title}
              </h4>
              <p 
                className="text-white/70 mb-4"
                data-i18n-key="footer.contact.description"
              >
                {t.footer?.contact?.description}
              </p>
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
            {t.footer?.copyright && (
              <p data-i18n-key="footer.copyright">{t.footer.copyright}</p>
            )}
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}