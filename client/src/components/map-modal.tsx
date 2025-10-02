import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { weddingConfig } from "@/config/wedding-config";
import type { WeddingConfig } from "@/templates/types";

interface MapModalProps {
  config?: WeddingConfig;
}

export default function MapModal({ config = weddingConfig }: MapModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [venueId, setVenueId] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenMap = (event: CustomEvent) => {
      setVenueId(event.detail.location);
      setIsOpen(true);
    };

    window.addEventListener('openMap', handleOpenMap as EventListener);
    return () => window.removeEventListener('openMap', handleOpenMap as EventListener);
  }, []);

  const getLocationInfo = () => {
    const venues = config.locations?.venues || [];
    
    // Find venue by ID or handle legacy church/restaurant IDs
    let venue = venues.find(v => v.id === venueId);
    
    // Handle legacy support for old church/restaurant system
    if (!venue && venueId) {
      if (venueId === 'church' || venueId === 'ceremony') {
        venue = venues.find(v => 
          v.title.toLowerCase().includes('ceremony') || 
          v.title.toLowerCase().includes('եկեղեցի') || 
          v.title.toLowerCase().includes('church')
        ) || venues[0];
      } else if (venueId === 'restaurant' || venueId === 'reception') {
        venue = venues.find(v => 
          v.title.toLowerCase().includes('reception') || 
          v.title.toLowerCase().includes('ճաշարան') || 
          v.title.toLowerCase().includes('restaurant')
        ) || venues[1];
      } else {
        // Find by index if venueId is a number string
        const index = parseInt(venueId);
        if (!isNaN(index) && venues[index]) {
          venue = venues[index];
        }
      }
    }

    if (!venue) {
      return { title: '', mapUrl: '', directUrl: '' };
    }

    // Default coordinates - Yerevan city center if no GPS coordinates provided
    const lat = venue.latitude || 40.1776121;
    const lng = venue.longitude || 44.512199;
    
    return {
      title: venue.name || venue.title,
      mapUrl: `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.1!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${lat},${lng}!5e0!3m2!1sen!2sam!4v${Date.now()}!5m2!1sen!2sam`,
      directUrl: `https://www.google.com/maps?q=${lat},${lng}`
    };
  };

  const locationInfo = getLocationInfo();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="map-modal">
        <DialogHeader>
          <DialogTitle data-testid="map-modal-title">
            {locationInfo.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="h-96" data-testid="map-container">
            <iframe
              src={locationInfo.mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-lg"
            ></iframe>
          </div>
          <div className="flex justify-center">
            <a
              href={locationInfo.directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-softGold hover:bg-softGold/90 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300 flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{config.mapModal?.closeButton || "Open in Google Maps"}</span>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

