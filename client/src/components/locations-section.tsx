import { Church, Utensils, MapPin } from "lucide-react";
import { weddingConfig } from "@/config/wedding-config";
import churchPhoto from "@assets/3_1755890746399.jpg";
import restaurantPhoto from "@assets/11_1755890922505.jpg";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

export default function LocationsSection() {
  const openMap = (location: 'church' | 'restaurant') => {
    const event = new CustomEvent('openMap', { detail: { location } });
    window.dispatchEvent(event);
  };
  
  const titleRef = useScrollAnimation('animate-slide-up');
  const churchRef = useScrollAnimation('animate-slide-in-left');
  const restaurantRef = useScrollAnimation('animate-slide-in-right');

  return (
    <section id="locations" className="py-20 bg-gradient-to-r from-sageGreen/10 to-warmBeige/20">
      <div className="max-w-6xl mx-auto px-4">
        <div ref={titleRef} className="text-center mb-16 animate-on-scroll">
          <h2 className="text-5xl md:text-6xl text-charcoal mb-8" 
              style={{ 
                fontFamily: 'Playfair Display, serif', 
                fontWeight: '300'
              }}
              data-testid="text-locations-title">
            {weddingConfig.locations.sectionTitle}
          </h2>
          <div className="w-24 h-0.5 bg-softGold mx-auto"></div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Church Location */}
          <div ref={churchRef} className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 animate-on-scroll" data-testid="card-church">
            <img 
              src={churchPhoto} 
              alt="Եկեղեցի" 
              className="w-full h-48 object-cover" 
              data-testid="img-church"
            />
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Church className="text-softGold text-2xl mr-3" />
                <h3 className="text-xl font-serif font-bold text-charcoal" data-testid="text-church-title">
                  {weddingConfig.locations.church.title}
                </h3>
              </div>
              <p className="text-charcoal/70 mb-4" data-testid="text-church-name">
                {weddingConfig.locations.church.name}
              </p>
              <p className="text-charcoal/60 text-sm mb-4" data-testid="text-church-description">
                {weddingConfig.locations.church.description}
              </p>
              <button 
                onClick={() => openMap('church')}
                className="bg-softGold hover:bg-softGold/90 text-white px-4 py-2 rounded-lg transition-colors duration-300 flex items-center"
                data-testid="button-church-map"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {weddingConfig.locations.church.mapButton}
              </button>
            </div>
          </div>
          
          {/* Restaurant Location */}
          <div ref={restaurantRef} className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 animate-on-scroll" data-testid="card-restaurant">
            <img 
              src={restaurantPhoto} 
              alt="Ռեստորան" 
              className="w-full h-48 object-cover" 
              data-testid="img-restaurant"
            />
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Utensils className="text-softGold text-2xl mr-3" />
                <h3 className="text-xl font-serif font-bold text-charcoal" data-testid="text-restaurant-title">
                  {weddingConfig.locations.restaurant.title}
                </h3>
              </div>
              <p className="text-charcoal/70 mb-4" data-testid="text-restaurant-name">
                {weddingConfig.locations.restaurant.name}
              </p>
              <p className="text-charcoal/60 text-sm mb-4" data-testid="text-restaurant-description">
                {weddingConfig.locations.restaurant.description}
              </p>
              <button 
                onClick={() => openMap('restaurant')}
                className="bg-softGold hover:bg-softGold/90 text-white px-4 py-2 rounded-lg transition-colors duration-300 flex items-center"
                data-testid="button-restaurant-map"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {weddingConfig.locations.restaurant.mapButton}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
