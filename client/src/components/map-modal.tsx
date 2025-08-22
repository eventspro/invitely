import { useState, useEffect } from "react";
import { X } from "lucide-react";
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
        // TODO: Add actual Google Maps embed URL
        mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3047.3!2d44.5!3d40.2!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDEyJzAwLjAiTiA0NMKwMzAnMDAuMCJF!5e0!3m2!1sen!2sam!4v1234567890123!5m2!1sen!2sam'
      };
    } else if (location === 'restaurant') {
      return {
        title: 'Արարատ Ռեստորան',
        // TODO: Add actual Google Maps embed URL
        mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3047.3!2d44.5!3d40.2!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDEyJzAwLjAiTiA0NMKwMzAnMDAuMCJF!5e0!3m2!1sen!2sam!4v1234567890123!5m2!1sen!2sam'
      };
    }
    return { title: '', mapUrl: '' };
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
        <div className="h-96" data-testid="map-container">
          {/* TODO: Replace with actual Google Maps embed when API is configured */}
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-charcoal/50 rounded-lg">
            <div className="text-center">
              <i className="fas fa-map-marked-alt text-4xl mb-4"></i>
              <p>Google Maps կտեղադրվի այստեղ</p>
              <p className="text-sm mt-2">Առժամանակ մակետային պատկեր</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
