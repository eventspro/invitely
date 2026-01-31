import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useLanguage";
import LanguageSelector from "@/components/LanguageSelector";
import { 
  Check, 
  X, 
  Star, 
  Crown, 
  Sparkles, 
  Gift,
  Eye,
  ArrowRight,
  Camera,
  Music,
  MapPin,
  Calendar,
  Users,
  Heart,
  Mail,
  Download,
  Upload,
  QrCode,
  Palette,
  Settings,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

// Template pricing plans mapped to actual template keys
const getTemplatePricingPlans = (t: any) => ({
  classic: {
    price: "10,000 AMD",
    badge: t.templatePlansSection.planBadges.basic,
    badgeColor: "bg-gray-500",
    description: t.templatePlansSection.planDescriptions.basic,
    planType: "basic"
  },
  elegant: {
    price: "17,000 AMD", 
    badge: t.templatePlansSection.planBadges.standard,
    badgeColor: "bg-blue-500",
    description: t.templatePlansSection.planDescriptions.standard,
    planType: "standard"
  },
  romantic: {
    price: "23,000 AMD",
    badge: t.templatePlansSection.planBadges.premium,
    badgeColor: "bg-green-500",
    description: t.templatePlansSection.planDescriptions.premium,
    planType: "premium",
    popular: true
  },
  pro: {
    price: "31,000 AMD",
    badge: t.templatePlansSection.planBadges.deluxe, 
    badgeColor: "bg-purple-500",
    description: t.templatePlansSection.planDescriptions.deluxe,
    planType: "advanced"
  },
  nature: {
    price: "37,000 AMD",
    badge: "Luxury",
    badgeColor: "bg-orange-500", 
    description: t.templatePlansSection.planDescriptions.deluxe,
    planType: "deluxe"
  }
});

const getFeaturesByPlan = (t: any) => ({
  basic: [
    { name: t.templatePlansSection.features["Wedding Timeline"], icon: <Calendar className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Couple Introduction"], icon: <Heart className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Wedding Locations"], icon: <MapPin className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["RSVP Functionality"], icon: <Users className="w-4 h-4" />, included: false },
    { name: t.templatePlansSection.features["Multiple Photo/Slider"], icon: <Camera className="w-4 h-4" />, included: false },
    { name: t.templatePlansSection.features["Photo Gallery"], icon: <Camera className="w-4 h-4" />, included: false },
    { name: t.templatePlansSection.features["Audio Player"], icon: <Music className="w-4 h-4" />, included: false },
    { name: t.templatePlansSection.features["Admin Panel"], icon: <Settings className="w-4 h-4" />, included: false },
    { name: t.templatePlansSection.features["QR Code Cards"], icon: <QrCode className="w-4 h-4" />, included: false }
  ],
  standard: [
    { name: t.templatePlansSection.features["Wedding Timeline"], icon: <Calendar className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Couple Introduction"], icon: <Heart className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Wedding Locations"], icon: <MapPin className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["RSVP Functionality"], icon: <Users className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Multiple Photo/Slider"], icon: <Camera className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Photo Gallery"], icon: <Camera className="w-4 h-4" />, included: false },
    { name: t.templatePlansSection.features["Audio Player"], icon: <Music className="w-4 h-4" />, included: false },
    { name: t.templatePlansSection.features["Admin Panel"], icon: <Settings className="w-4 h-4" />, included: false },
    { name: t.templatePlansSection.features["QR Code Cards"], icon: <QrCode className="w-4 h-4" />, included: false }
  ],
  premium: [
    { name: t.templatePlansSection.features["Wedding Timeline"], icon: <Calendar className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Couple Introduction"], icon: <Heart className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Wedding Locations"], icon: <MapPin className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["RSVP Functionality"], icon: <Users className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Multiple Photo/Slider"], icon: <Camera className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Audio Player"], icon: <Music className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Photo Gallery"], icon: <Camera className="w-4 h-4" />, included: false },
    { name: t.templatePlansSection.features["Admin Panel"], icon: <Settings className="w-4 h-4" />, included: false },
    { name: t.templatePlansSection.features["QR Code Cards"], icon: <QrCode className="w-4 h-4" />, included: false }
  ],
  // Premium plan (31,000 AMD) - adds Admin Panel with Guest List Export
  advanced: [
    { name: t.templatePlansSection.features["Wedding Timeline"], icon: <Calendar className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Couple Introduction"], icon: <Heart className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Wedding Locations"], icon: <MapPin className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["RSVP Functionality"], icon: <Users className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Multiple Photo/Slider"], icon: <Camera className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Audio Player"], icon: <Music className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Admin Panel (includes Guest List Export)"], icon: <Settings className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Photo Gallery"], icon: <Camera className="w-4 h-4" />, included: false },
    { name: t.templatePlansSection.features["QR Code Cards"], icon: <QrCode className="w-4 h-4" />, included: false }
  ],
  // Ultimate plan (37,000 AMD) - includes everything
  deluxe: [
    { name: t.templatePlansSection.features["Wedding Timeline"], icon: <Calendar className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Couple Introduction"], icon: <Heart className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Wedding Locations"], icon: <MapPin className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["RSVP Functionality"], icon: <Users className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Multiple Photo/Slider"], icon: <Camera className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Audio Player"], icon: <Music className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Admin Panel (includes Guest List Export)"], icon: <Settings className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["Photo Gallery"], icon: <Camera className="w-4 h-4" />, included: true },
    { name: t.templatePlansSection.features["QR Code Cards (100 cards included)"], icon: <QrCode className="w-4 h-4" />, included: true }
  ]
});

interface Template {
  id: string;
  name: string;
  slug: string;
  templateKey: string;
  config: any;
}

export default function TemplatesPage() {
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { translations: t } = useTranslation();

  // Fetch templates from API
  const { data: templates, isLoading, error } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handlePreview = (slug: string) => {
    navigate(slug);
  };

  const handleSelectPlan = (templateId: string) => {
    setSelectedPlan(templateId);
    // Here you would integrate with payment/booking system
    console.log('Selected template:', templateId);
  };

  // Create template plans from fetched data
  const templatePlans = templates?.map(template => {
    const templatePricingPlans = getTemplatePricingPlans(t);
    const pricingPlan = templatePricingPlans[template.templateKey as keyof typeof templatePricingPlans];
    const featuresByPlan = getFeaturesByPlan(t);
    const features = featuresByPlan[pricingPlan?.planType as keyof typeof featuresByPlan] || [];
    
    return {
      id: template.id,
      name: template.name,
      slug: template.slug,
      templateKey: template.templateKey,
      price: pricingPlan?.price || "Price TBD",
      badge: pricingPlan?.badge,
      badgeColor: pricingPlan?.badgeColor,
      description: pricingPlan?.description || template.name,
      templateRoute: `/${template.slug}`,
      popular: (pricingPlan as any)?.popular || false,
      features
    };
  }) || [];

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Templates</h1>
          <p className="text-gray-600 mb-4">Unable to load wedding templates. Please try again later.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-rose-500 mr-3" />
              <Link to="/" className="text-xl font-bold text-gray-900 hover:text-rose-500 transition-colors">
                WeddingSites
              </Link>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="/#features" className="text-gray-700 hover:text-rose-500 transition-colors">
                {t.navigation.features}
              </a>
              <Link to="/templates" className="text-rose-500 font-medium">
                {t.navigation.templates}
              </Link>
              <a href="/#pricing" className="text-gray-700 hover:text-rose-500 transition-colors">
                {t.navigation.pricing}
              </a>
              <a href="/#contact" className="text-gray-700 hover:text-rose-500 transition-colors">
                {t.navigation.contact}
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <Link 
                to="/"
                className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {t.hero.cta}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-rose-600 via-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
            {t.templatesPage.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {t.templatesPage.subtitle}
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>{t.templatesPage.features.responsive}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>{t.templatesPage.features.customization}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>{t.templatesPage.features.setup}</span>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* Loading State */}
      {isLoading && (
        <section className="pb-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
              <span className="ml-3 text-lg text-gray-600">{t.templatesPage.loading}</span>
            </div>
          </div>
        </section>
      )}

      {/* Templates Grid */}
      {!isLoading && templatePlans.length > 0 && (
        <section className="pb-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-8">
              {templatePlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-300 hover:shadow-xl ${
                  plan.popular ? 'ring-2 ring-blue-500 shadow-lg scale-105' : 'hover:scale-105'
                }`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-white text-sm font-medium ${plan.badgeColor}`}>
                    {plan.badge}
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="mb-4">
                    {plan.id === 'ultimate' && <Crown className="w-12 h-12 mx-auto text-gold" />}
                    {plan.id === 'deluxe' && <Sparkles className="w-12 h-12 mx-auto text-purple-500" />}
                    {plan.id === 'premium' && <Star className="w-12 h-12 mx-auto text-blue-500" />}
                    {plan.id === 'standard' && <Heart className="w-12 h-12 mx-auto text-pink-500" />}
                    {plan.id === 'basic' && <Calendar className="w-12 h-12 mx-auto text-gray-500" />}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-gray-900 mt-2">{plan.price}</div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features List */}
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                          feature.included ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {feature.included ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        </div>
                        <div className="flex-1">
                          <div className={`flex items-center gap-2 text-sm ${
                            feature.included ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {feature.icon}
                            <span>{feature.name}</span>
                          </div>
                          {(feature as any).description && (
                            <p className="text-xs text-gray-500 mt-1">{(feature as any).description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    <Button
                      onClick={() => handlePreview(plan.templateRoute)}
                      variant="outline"
                      className="w-full flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Preview Template
                    </Button>
                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full flex items-center gap-2 ${
                        plan.popular 
                          ? 'bg-blue-500 hover:bg-blue-600' 
                          : plan.id === 'ultimate'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                          : ''
                      }`}
                    >
                      Choose Plan
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Feature Comparison Table */}
      {!isLoading && templatePlans.length > 0 && (
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Feature Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-lg shadow-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-4 text-left font-semibold">Features</th>
                  {templatePlans.map((plan) => (
                    <th key={plan.id} className="p-4 text-center font-semibold min-w-[150px]">
                      {plan.name}
                      <div className="text-sm font-normal text-gray-500 mt-1">{plan.price}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Get all unique features */}
                {Array.from(new Set(templatePlans.flatMap(plan => plan.features.map(f => f.name)))).map((featureName, index) => (
                  <tr key={featureName} className={index % 2 === 0 ? 'bg-gray-25' : 'bg-white'}>
                    <td className="p-4 font-medium">{featureName}</td>
                    {templatePlans.map((plan) => {
                      const feature = plan.features.find(f => f.name === featureName);
                      return (
                        <td key={plan.id} className="p-4 text-center">
                          {feature?.included ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 mx-auto" />
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
      </section>
      )}

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12">{t.templatesPage.faqTitle}</h2>
          
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="space-y-6">
              {t.templatesPage.faqItems?.[0] && (
                <div>
                  <h3 className="text-xl font-semibold mb-2">{t.templatesPage.faqItems[0].question}</h3>
                  <p className="text-gray-600">{t.templatesPage.faqItems[0].answer}</p>
                </div>
              )}
              
              {t.templatesPage.faqItems?.[1] && (
                <div>
                  <h3 className="text-xl font-semibold mb-2">{t.templatesPage.faqItems[1].question}</h3>
                  <p className="text-gray-600">{t.templatesPage.faqItems[1].answer}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              {t.templatesPage.faqItems?.[2] && (
                <div>
                  <h3 className="text-xl font-semibold mb-2">{t.templatesPage.faqItems[2].question}</h3>
                  <p className="text-gray-600">{t.templatesPage.faqItems[2].answer}</p>
                </div>
              )}
              
              {t.templatesPage.faqItems?.[3] && (
                <div>
                  <h3 className="text-xl font-semibold mb-2">{t.templatesPage.faqItems[3].question}</h3>
                  <p className="text-gray-600">{t.templatesPage.faqItems[3].answer}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}