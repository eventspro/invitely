import React from 'react';
import type { WeddingConfig } from '@/templates/types';

interface SEOMetadataProps {
  config: WeddingConfig;
  templateName?: string;
  isMainPage?: boolean;
}

export default function SEOMetadata({ config, templateName, isMainPage = false }: SEOMetadataProps) {
  const couple = config.couple || {};
  const wedding = config.wedding || {};
  const locations = config.locations?.venues || [];
  
  // Generate structured data for wedding event
  const weddingEvent: any = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": `${couple.groomName || "Groom"} & ${couple.brideName || "Bride"} Wedding`,
    "description": `Wedding celebration for ${couple.groomName || "Groom"} and ${couple.brideName || "Bride"}${wedding.displayDate ? ` on ${wedding.displayDate}` : ''}`,
    "startDate": wedding.date || "2025-10-10T16:00:00",
    "endDate": wedding.date ? new Date(new Date(wedding.date).getTime() + 6 * 60 * 60 * 1000).toISOString() : "2025-10-10T22:00:00",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "eventStatus": "https://schema.org/EventScheduled",
    "organizer": [
      {
        "@type": "Person",
        "name": couple.groomName || "Groom"
      },
      {
        "@type": "Person", 
        "name": couple.brideName || "Bride"
      }
    ],
    "url": `https://4ever.am/${templateName || ''}`,
    "image": config.hero?.images?.[0] || "https://4ever.am/attached_assets/default-wedding-couple.jpg"
  };

  // Add location if available
  if (locations.length > 0) {
    const primaryLocation = locations[0];
    weddingEvent.location = {
      "@type": "Place",
      "name": primaryLocation.name || "Wedding Venue",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": primaryLocation.address || "Wedding Location"
      }
    };
  }

  // Generate page-specific metadata
  const pageTitle = isMainPage 
    ? "4ever.am - Armenian Wedding Invitations & Templates"
    : `${couple.groomName || "Groom"} & ${couple.brideName || "Bride"} Wedding - ${wedding.displayDate || "Wedding Day"}`;
    
  const pageDescription = isMainPage
    ? "Create beautiful Armenian wedding invitations with our elegant templates. RSVP management, photo galleries, and multilingual support."
    : `Join ${couple.groomName || "Groom"} and ${couple.brideName || "Bride"} for their wedding celebration${wedding.displayDate ? ` on ${wedding.displayDate}` : ''}. RSVP and view wedding details.`;

  const openGraphData = {
    title: pageTitle,
    description: pageDescription,
    url: isMainPage ? "https://4ever.am" : `https://4ever.am/${templateName || ''}`,
    type: isMainPage ? "website" : "event",
    image: config.hero?.images?.[0] || "https://4ever.am/attached_assets/default-wedding-couple.jpg",
    site_name: "4ever.am",
    locale: "hy_AM"
  };

  React.useEffect(() => {
    // Update page title
    document.title = pageTitle;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', pageDescription);
    } else {
      const newMeta = document.createElement('meta');
      newMeta.name = 'description';
      newMeta.content = pageDescription;
      document.head.appendChild(newMeta);
    }

    // Update Open Graph tags
    Object.entries(openGraphData).forEach(([key, value]) => {
      const property = key === 'title' || key === 'description' || key === 'url' || key === 'type' 
        ? `og:${key}` 
        : `og:${key}`;
      
      let existingTag = document.querySelector(`meta[property="${property}"]`);
      if (!existingTag) {
        existingTag = document.createElement('meta');
        existingTag.setAttribute('property', property);
        document.head.appendChild(existingTag);
      }
      existingTag.setAttribute('content', String(value));
    });

    // Add Twitter Card tags
    const twitterCards = {
      'twitter:card': 'summary_large_image',
      'twitter:title': pageTitle,
      'twitter:description': pageDescription,
      'twitter:image': openGraphData.image
    };

    Object.entries(twitterCards).forEach(([name, content]) => {
      let existingTag = document.querySelector(`meta[name="${name}"]`);
      if (!existingTag) {
        existingTag = document.createElement('meta');
        existingTag.setAttribute('name', name);
        document.head.appendChild(existingTag);
      }
      existingTag.setAttribute('content', content);
    });

  }, [pageTitle, pageDescription, openGraphData.image, templateName]);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(weddingEvent)
        }}
      />
      
      {/* Additional Wedding Schema for Main Page */}
      {isMainPage && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "4ever.am",
              "description": "Armenian Wedding Invitation Platform",
              "url": "https://4ever.am",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://4ever.am/templates?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "inLanguage": ["hy", "en"],
              "audience": {
                "@type": "Audience",
                "audienceType": "Couples planning weddings"
              }
            })
          }}
        />
      )}
    </>
  );
}