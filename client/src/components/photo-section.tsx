import { Download } from "lucide-react";
import { weddingConfig } from "@/config/wedding-config";
import weddingPhoto from "@assets/IMG_5671_1755890386133.jpeg";

export default function PhotoSection() {
  const openPhotoGallery = () => {
    // TODO: Open Google Drive or Yandex Disk link when available
    alert(weddingConfig.photos.comingSoonMessage);
  };

  return (
    <section className="py-12 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-charcoal mb-6 sm:mb-8 leading-tight" 
            style={{ 
              fontFamily: 'Playfair Display, serif', 
              fontStyle: 'italic',
              fontWeight: '300'
            }}
            data-testid="text-photo-title">
          {weddingConfig.photos.title}
        </h2>
        <div className="w-16 sm:w-24 h-0.5 bg-softGold mx-auto mb-8 sm:mb-12"></div>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-softGold/20" data-testid="photo-gallery-container">
          <div className="relative group overflow-hidden rounded-xl">
            <img 
              src={weddingPhoto} 
              alt="Հարսանեկան նկարներ" 
              className="w-full h-64 sm:h-80 object-cover transition-transform duration-500 group-hover:scale-105" 
              data-testid="img-wedding-collage"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-softGold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          
          <p className="text-charcoal/70 mb-6 mt-4 px-2 text-sm sm:text-base" data-testid="text-photo-description">
            {weddingConfig.photos.description}
          </p>
          
          <button 
            onClick={openPhotoGallery}
            className="bg-sageGreen hover:bg-sageGreen/90 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium transition-colors duration-300 transform hover:scale-105 flex items-center mx-auto text-sm sm:text-base"
            data-testid="button-download-photos"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            {weddingConfig.photos.downloadButton}
          </button>
        </div>
      </div>
    </section>
  );
}
