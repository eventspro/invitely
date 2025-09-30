import { Download, Camera, Upload } from "lucide-react";
import { weddingConfig } from "@/config/wedding-config";
import { WeddingConfig } from "@/templates/types";
import weddingPhoto from "@assets/IMG_5671_1755890386133.jpeg";
import { useState } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface PhotoSectionProps {
  config?: WeddingConfig;
  templateId?: string;
}

export default function PhotoSection({ config = weddingConfig, templateId }: PhotoSectionProps) {
  const [uploadStatus, setUploadStatus] = useState<string>("");

  // Get love story images - use uploaded images if available, fallback to default
  const loveStoryImages = config.photos?.images && config.photos.images.length > 0 
    ? config.photos.images 
    : [weddingPhoto];

  const openPhotoGallery = () => {
    // TODO: Open Google Drive or Yandex Disk link when available
    alert(config.photos.comingSoonMessage);
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      if (!templateId) {
        console.error('Template ID is required for photo upload');
        setUploadStatus("Սխալ: Template ID չի գտնվել");
        return;
      }

      setUploadStatus(`Վերբեռնում է ${files.length} նկար...`);

      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error(`Չսպասարկվող ֆայլի տեսակ: ${file.type}`);
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error(`Ֆայլը չափազանց մեծ է: ${file.name}`);
        }

        const formData = new FormData();
        formData.append('image', file);
        formData.append('category', 'gallery');
        formData.append('templateId', templateId);

        const response = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || 'Վերբեռնման սխալ');
        }

        return await response.json();
      });

      const results = await Promise.all(uploadPromises);
      console.log('Gallery upload results:', results);
      
      setUploadStatus(`${files.length} նկար(ներ) հաջողությամբ ավելացվեցին! Շնորհակալություն:`);
      setTimeout(() => setUploadStatus(""), 4000);
      
    } catch (error) {
      console.error('Failed to upload gallery photos:', error);
      setUploadStatus(`Սխալ վերբեռնելիս: ${error instanceof Error ? error.message : 'Անհայտ սխալ'}`);
      setTimeout(() => setUploadStatus(""), 5000);
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
        <style dangerouslySetInnerHTML={{
          __html: `
            .photo-swiper .swiper-button-next,
            .photo-swiper .swiper-button-prev {
              color: ${config.theme?.colors?.primary || '#3b82f6'} !important;
              background: rgba(255, 255, 255, 0.9) !important;
              width: 40px !important;
              height: 40px !important;
              border-radius: 50% !important;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
              transition: all 0.3s ease !important;
            }
            .photo-swiper .swiper-button-next:hover,
            .photo-swiper .swiper-button-prev:hover {
              background: ${config.theme?.colors?.primary || '#3b82f6'} !important;
              color: white !important;
              transform: scale(1.1) !important;
            }
            .photo-swiper .swiper-button-next:after,
            .photo-swiper .swiper-button-prev:after {
              font-size: 16px !important;
              font-weight: bold !important;
            }
            .photo-swiper .swiper-pagination-bullet {
              background: ${config.theme?.colors?.primary || '#3b82f6'} !important;
              opacity: 0.5 !important;
              width: 10px !important;
              height: 10px !important;
            }
            .photo-swiper .swiper-pagination-bullet-active {
              background: ${config.theme?.colors?.primary || '#3b82f6'} !important;
              opacity: 1 !important;
              transform: scale(1.3) !important;
            }
            @media (max-width: 767px) {
              .photo-swiper .swiper-button-next,
              .photo-swiper .swiper-button-prev {
                display: none !important;
              }
            }
          `
        }} />
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
          className="h-64 sm:h-80 rounded-xl photo-swiper"
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
            <label 
              htmlFor="gallery-upload"
              className="text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium transition-colors duration-300 transform hover:scale-105 flex items-center text-sm sm:text-base hover:opacity-90 cursor-pointer"
              style={{
                backgroundColor: config.theme?.colors?.primary || '#333333'
              }}
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {config.photos.uploadButton}
            </label>
            <input
              id="gallery-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) {
                  handleFileUpload(files);
                }
              }}
              className="hidden"
            />
            
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
