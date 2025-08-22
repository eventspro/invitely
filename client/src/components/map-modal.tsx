import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function MapModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useState<'church' | 'restaurant' | null>(null);

  useEffect(() => {
    const handleOpenMap = (event: CustomEvent) => {
      setLocation(event.detail.location);
      setIsOpen(true);
    };

    window.addEventListener('openMap', handleOpenMap as EventListener);
    return () => window.removeEventListener('openMap', handleOpenMap as EventListener);
  }, []);

  const getLocationInfo = () => {
    if (location === 'church') {
      return {
        title: 'Սուրբ Գրիգոր Լուսավորիչ Եկեղեցի',
        mapUrl: `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.1!2d44.51732572776011!3d40.1723136334379!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDEwJzIwLjMiTiA0NMKwMzEnMDIuNCJF!5e0!3m2!1sen!2sam!4v${Date.now()}!5m2!1sen!2sam`,
        directUrl: `https://www.google.com/maps?q=40.1723136334379,44.51732572776011`
      };
    } else if (location === 'restaurant') {
      return {
        title: 'BAYAZET HALL',
        mapUrl: `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3037.8!2d45.145645997030925!3d40.35985267995858!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDIxJzM1LjUiTiA0NcKwMDgnNDQuMyJF!5e0!3m2!1sen!2sam!4v${Date.now()}!5m2!1sen!2sam`,
        directUrl: `https://www.google.com/maps?q=40.35985267995858,45.145645997030925`
      };
    }
    return { title: '', mapUrl: '', directUrl: '' };
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
              <span>Բացել Google Maps-ում</span>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
