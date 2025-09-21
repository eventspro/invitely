import { Church, Utensils, MapPin, Calendar, Music, Camera, Heart, Users, Star, Home } from "lucide-react";
import { weddingConfig } from "@/config/wedding-config";
import { WeddingConfig } from "@/templates/types";
import { getHeadingFont, getBodyFont } from "@/utils/font-utils";
import churchPhoto from "@assets/3_1755890746399.jpg";
import restaurantPhoto from "@assets/11_1755890922505.jpg";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

interface LocationsSectionProps {
  config?: WeddingConfig;
}

export default function LocationsSection({ config = weddingConfig }: LocationsSectionProps) {
  const openMap = (venueId: string) => {
    const event = new CustomEvent('openMap', { detail: { location: venueId } });
    window.dispatchEvent(event);
  };

  const getVenueIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('ceremony') || lowerTitle.includes('եկեղեցի') || lowerTitle.includes('church')) {
      return <Church className="text-2xl mr-3" />;
    } else if (lowerTitle.includes('reception') || lowerTitle.includes('ճաշարան') || lowerTitle.includes('restaurant') || lowerTitle.includes('dinner')) {
      return <Utensils className="text-2xl mr-3" />;
    } else if (lowerTitle.includes('cocktail') || lowerTitle.includes('drinks')) {
      return <Star className="text-2xl mr-3" />;
    } else if (lowerTitle.includes('party') || lowerTitle.includes('dance')) {
      return <Music className="text-2xl mr-3" />;
    } else if (lowerTitle.includes('photo') || lowerTitle.includes('pictures')) {
      return <Camera className="text-2xl mr-3" />;
    } else if (lowerTitle.includes('accommodation') || lowerTitle.includes('hotel')) {
      return <Home className="text-2xl mr-3" />;
    } else {
      return <Heart className="text-2xl mr-3" />;
    }
  };

  const getDefaultImage = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('ceremony') || lowerTitle.includes('եկեղեցի') || lowerTitle.includes('church')) {
      return churchPhoto;
    } else {
      return restaurantPhoto;
    }
  };
  
  const titleRef = useScrollAnimation('animate-slide-up');
  const venues = config.locations?.venues || [];

  return (
    <section id="locations" className="py-20" style={{
      background: `linear-gradient(to right, ${config.theme?.colors?.secondary || '#7c8471'}10 0%, ${config.theme?.colors?.background || '#faf5f0'}20 100%)`
    }}>
      <div className="max-w-6xl mx-auto px-4">
        <div ref={titleRef} className="text-center mb-16 animate-on-scroll">
          <h2 className="text-5xl md:text-6xl mb-8" 
              style={{ 
                fontFamily: getHeadingFont(config.theme?.fonts), 
                fontWeight: '300',
                color: config.theme?.colors?.primary || '#333333'
              }}
              data-testid="text-locations-title">
            {config.locations?.sectionTitle}
          </h2>
          <div className="w-24 h-0.5 mx-auto" style={{
            backgroundColor: config.theme?.colors?.accent || '#e8d5b7'
          }}></div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {venues.map((venue, index) => {
            const venueRef = useScrollAnimation(index % 2 === 0 ? 'animate-slide-in-left' : 'animate-slide-in-right');
            
            return (
              <div 
                key={venue.id || index} 
                ref={venueRef}
                className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 animate-on-scroll" 
                data-testid={`card-venue-${venue.id || index}`}
              >
                <img 
                  src={venue.image || getDefaultImage(venue.title)} 
                  alt={venue.title} 
                  className="w-full h-48 object-cover" 
                  data-testid={`img-venue-${venue.id || index}`}
                />
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div style={{ color: config.theme?.colors?.accent || '#e8d5b7' }}>
                      {getVenueIcon(venue.title)}
                    </div>
                    <h3 className="text-xl font-serif font-bold" style={{
                      color: config.theme?.colors?.primary || '#333333'
                    }} data-testid={`text-venue-title-${venue.id || index}`}>
                      {venue.title}
                    </h3>
                  </div>
                  <p className="mb-4" style={{
                    color: `${config.theme?.colors?.primary || '#333333'}70`
                  }} data-testid={`text-venue-name-${venue.id || index}`}>
                    {venue.name}
                  </p>
                  <p className="text-sm mb-4" style={{
                    color: `${config.theme?.colors?.primary || '#333333'}60`
                  }} data-testid={`text-venue-description-${venue.id || index}`}>
                    {venue.description}
                  </p>
                  {venue.address && (
                    <p className="text-xs mb-4" style={{
                      color: `${config.theme?.colors?.primary || '#333333'}50`
                    }} data-testid={`text-venue-address-${venue.id || index}`}>
                      📍 {venue.address}
                    </p>
                  )}
                  <button 
                    onClick={() => openMap(venue.id || index.toString())}
                    className="text-white px-4 py-2 rounded-lg transition-colors duration-300 flex items-center hover:opacity-90"
                    style={{
                      backgroundColor: config.theme?.colors?.accent || '#e8d5b7'
                    }}
                    data-testid={`button-venue-map-${venue.id || index}`}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {venue.mapButton}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {venues.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: config.theme?.colors?.primary || '#333333' }}>
              No venues configured yet.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
