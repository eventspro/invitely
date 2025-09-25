import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';
import { ImageUploader } from './image-uploader';
import { SafeImage } from './safe-image';

interface SectionImageUploaderProps {
  templateId: string;
  sectionType: 'hero' | 'gallery' | 'background';
  sectionTitle: string;
  existingImages?: string[];
  onImagesUpdate?: (images: string[]) => void;
  maxImages?: number;
  className?: string;
  disabled?: boolean;
}

export default function SectionImageUploader({
  templateId,
  sectionType,
  sectionTitle,
  existingImages = [],
  onImagesUpdate,
  maxImages = 10,
  className,
  disabled = false,
}: SectionImageUploaderProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleImagesUploaded = useCallback((newUrls: string[]) => {
    const updatedImages = [...existingImages, ...newUrls];
    onImagesUpdate?.(updatedImages);
  }, [existingImages, onImagesUpdate]);

  const handleImageRemoved = useCallback((removedUrl: string) => {
    const updatedImages = existingImages.filter(url => url !== removedUrl);
    onImagesUpdate?.(updatedImages);
  }, [existingImages, onImagesUpdate]);

  const nextImage = useCallback(() => {
    setCurrentImageIndex(prev => 
      prev + 1 >= existingImages.length ? 0 : prev + 1
    );
  }, [existingImages.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex(prev => 
      prev - 1 < 0 ? existingImages.length - 1 : prev - 1
    );
  }, [existingImages.length]);

  const ImagePreview = () => {
    if (existingImages.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No images uploaded yet</p>
        </div>
      );
    }

    if (existingImages.length === 1) {
      return (
        <div className="relative">
          <SafeImage
            src={existingImages[0]} 
            alt={`${sectionTitle} image`}
            className="w-full h-64 object-cover rounded-lg"
            showErrorMessage={true}
          />
        </div>
      );
    }

    return (
      <div className="relative">
        <SafeImage
          src={existingImages[currentImageIndex]} 
          alt={`${sectionTitle} image ${currentImageIndex + 1}`}
          className="w-full h-64 object-cover rounded-lg"
          showErrorMessage={true}
        />
        
        {/* Navigation */}
        <Button
          variant="outline"
          size="sm"
          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0"
          onClick={prevImage}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0"
          onClick={nextImage}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        
        {/* Dots indicator */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
          {existingImages.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentImageIndex ? "bg-white" : "bg-white/50"
              )}
              onClick={() => setCurrentImageIndex(index)}
            />
          ))}
        </div>
      </div>
    );
  };

  if (previewMode) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{sectionTitle} Preview</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(false)}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Editor
            </Button>
          </div>
          <ImagePreview />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {existingImages.length} image{existingImages.length !== 1 ? 's' : ''} in {sectionTitle.toLowerCase()}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{sectionTitle} Images</h3>
          {existingImages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}
        </div>

        <ImageUploader
          templateId={templateId}
          category={sectionType}
          maxFiles={maxImages}
          onImagesUploaded={handleImagesUploaded}
          onImageRemoved={handleImageRemoved}
          disabled={disabled}
          existingImages={existingImages}
        />
      </CardContent>
    </Card>
  );
}
