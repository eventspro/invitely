import { Download } from "lucide-react";
import { weddingConfig } from "@/config/wedding-config";

export default function PhotoSection() {
  const openPhotoGallery = () => {
    // TODO: Open Google Drive or Yandex Disk link when available
    alert(weddingConfig.photos.comingSoonMessage);
  };

  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-5xl md:text-6xl text-charcoal mb-8" 
            style={{ 
              fontFamily: 'Playfair Display, serif', 
              fontStyle: 'italic',
              fontWeight: '300'
            }}
            data-testid="text-photo-title">
          {weddingConfig.photos.title}
        </h2>
        <div className="w-24 h-0.5 bg-softGold mx-auto mb-12"></div>
        
        <div className="bg-white rounded-xl shadow-xl p-8" data-testid="photo-gallery-container">
          <img 
            src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
            alt="Հարսանեկան նկարներ" 
            className="w-full h-64 object-cover rounded-lg mb-6" 
            data-testid="img-wedding-collage"
          />
          
          <p className="text-charcoal/70 mb-6" data-testid="text-photo-description">
            {weddingConfig.photos.description}
          </p>
          
          <button 
            onClick={openPhotoGallery}
            className="bg-sageGreen hover:bg-sageGreen/90 text-white px-8 py-4 rounded-lg font-medium transition-colors duration-300 transform hover:scale-105 flex items-center mx-auto"
            data-testid="button-download-photos"
          >
            <Download className="w-5 h-5 mr-2" />
            {weddingConfig.photos.downloadButton}
          </button>
        </div>
      </div>
    </section>
  );
}
