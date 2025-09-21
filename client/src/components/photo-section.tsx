import { Download, Camera, Upload } from "lucide-react";
import { weddingConfig } from "@/config/wedding-config";
import { WeddingConfig } from "@/templates/types";
import weddingPhoto from "@assets/IMG_5671_1755890386133.jpeg";
import { ObjectUploader } from "./ObjectUploader";
import { useState } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface PhotoSectionProps {
  config?: WeddingConfig;
}

export default function PhotoSection({ config = weddingConfig }: PhotoSectionProps) {
  const [uploadStatus, setUploadStatus] = useState<string>("");

  // Get love story images - use uploaded images if available, fallback to default
  const loveStoryImages = config.photos?.images && config.photos.images.length > 0 
    ? config.photos.images 
    : [weddingPhoto];

  const openPhotoGallery = () => {
    // TODO: Open Google Drive or Yandex Disk link when available
    alert(config.photos.comingSoonMessage);
  };

  const handleGetUploadParameters = async () => {
    try {
      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'photos' }),
      });
      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error('Failed to get upload URL:', error);
      throw error;
    }
  };

  const handleUploadComplete = async (files: File[]) => {
    try {
      setUploadStatus(`${files.length} նկար(ներ) հաջողությամբ ավելացվեցին! Շնորհակալություն:`);
      setTimeout(() => setUploadStatus(""), 4000);
    } catch (error) {
      console.error('Failed to complete upload:', error);
      setUploadStatus("Սխալ վերբեռնելիս: Խնդրում ենք կրկին փորձել:");
      setTimeout(() => setUploadStatus(""), 3000);
    }
  };

  const LoveStoryGallery = () => {
    if (loveStoryImages.length <= 1) {
      return (
        <div className="relative group overflow-hidden rounded-xl">
          <img 
            src={loveStoryImages[0]} 
            alt="Հարսանեկան նկարներ" 
            className="w-full h-64 sm:h-80 object-cover transition-transform duration-500 group-hover:scale-105" 
            data-testid="img-wedding-collage"
          />
          <div className="absolute inset-0 bg-gradient-to-t transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{
            background: `linear-gradient(to top, ${config.theme?.colors?.accent || '#e8d5b7'}20 0%, transparent 100%)`
          }}></div>
        </div>
      );
    }

    return (
      <div className="relative overflow-hidden rounded-xl">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={30}
          slidesPerView={1}
          navigation={{
            enabled: true,
            hideOnClick: false,
          }}
          pagination={{ clickable: true }}
          autoplay={{ 
            delay: 4000, 
            disableOnInteraction: false,
            pauseOnMouseEnter: true 
          }}
          loop={true}
          breakpoints={{
            // Hide navigation on mobile, show on tablet and up
            768: {
              navigation: {
                enabled: true,
              },
            },
          }}
          className="h-64 sm:h-80 rounded-xl"
        >
          {loveStoryImages.map((imageUrl, index) => (
            <SwiperSlide key={index}>
              <img 
                src={imageUrl} 
                alt={`Love story image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    );
  };

  return (
    <section className="py-12 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-6 sm:mb-8 leading-tight" 
            style={{ 
              fontFamily: 'Playfair Display, serif', 
              fontWeight: '300',
              color: config.theme?.colors?.primary || '#333333'
            }}
            data-testid="text-photo-title">
          {config.photos.title}
        </h2>
        <div className="w-16 sm:w-24 h-0.5 mx-auto mb-8 sm:mb-12" style={{
          backgroundColor: config.theme?.colors?.accent || '#e8d5b7'
        }}></div>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8" style={{
          borderColor: `${config.theme?.colors?.accent || '#e8d5b7'}20`
        }} data-testid="photo-gallery-container">
          <LoveStoryGallery />
          
          <p className="mb-6 mt-4 px-2 text-sm sm:text-base" style={{
            color: `${config.theme?.colors?.primary || '#333333'}70`
          }} data-testid="text-photo-description">
            {config.photos.description}
          </p>
          
          {/* Upload Status Message */}
          {uploadStatus && (
            <div className="mb-6 p-4 rounded-lg border" style={{
              backgroundColor: `${config.theme?.colors?.accent || '#e8d5b7'}20`,
              borderColor: `${config.theme?.colors?.accent || '#e8d5b7'}30`
            }}>
              <p className="font-medium" style={{
                color: config.theme?.colors?.primary || '#333333'
              }}>{uploadStatus}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <ObjectUploader
              maxNumberOfFiles={10}
              maxFileSize={10485760} // 10MB
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium transition-colors duration-300 transform hover:scale-105 flex items-center text-sm sm:text-base hover:opacity-90"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {config.photos.uploadButton}
            </ObjectUploader>
            
            <button 
              onClick={openPhotoGallery}
              className="text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium transition-colors duration-300 transform hover:scale-105 flex items-center text-sm sm:text-base hover:opacity-90"
              style={{
                backgroundColor: config.theme?.colors?.secondary || '#7c8471'
              }}
              data-testid="button-download-photos"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {config.photos.downloadButton}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
