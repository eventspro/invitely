// Enhanced Image Display Component for Admin Panel
// Handles missing images gracefully with fallbacks and loading states

import React, { useState, useCallback } from 'react';
import { X, Upload, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SafeImageProps {
  src?: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  onError?: () => void;
  onLoad?: () => void;
  showErrorMessage?: boolean;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallbackSrc = '/attached_assets/default-wedding-couple.jpg',
  className = '',
  onError,
  onLoad,
  showErrorMessage = false
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const handleError = useCallback(() => {
    console.warn(`Image failed to load: ${imgSrc}`);
    setHasError(true);
    setIsLoading(false);
    
    if (retryCount === 0 && imgSrc !== fallbackSrc) {
      // Try fallback image once
      setImgSrc(fallbackSrc);
      setRetryCount(1);
      setHasError(false);
      setIsLoading(true);
    } else {
      onError?.();
    }
  }, [imgSrc, fallbackSrc, retryCount, onError]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // Reset state when src changes
  React.useEffect(() => {
    if (src !== imgSrc && retryCount === 0) {
      setImgSrc(src);
      setHasError(false);
      setIsLoading(true);
      setRetryCount(0);
    }
  }, [src]);

  if (hasError && retryCount > 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-4",
        className
      )}>
        <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm text-gray-500 text-center">
          {showErrorMessage ? `Failed to load: ${alt}` : alt}
        </span>
        {showErrorMessage && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setImgSrc(src);
              setHasError(false);
              setIsLoading(true);
              setRetryCount(0);
            }}
            className="mt-2"
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full object-cover rounded-lg transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        loading="lazy"
      />
    </div>
  );
};

interface ImageGalleryProps {
  images: string[];
  onImageRemove?: (index: number) => void;
  onImageAdd?: () => void;
  title?: string;
  maxImages?: number;
  editable?: boolean;
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images = [],
  onImageRemove,
  onImageAdd,
  title = "Images",
  maxImages = 10,
  editable = false,
  className = ""
}) => {
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<number, boolean>>({});

  const handleImageLoad = (index: number) => {
    setLoadingStates(prev => ({ ...prev, [index]: false }));
    setErrorStates(prev => ({ ...prev, [index]: false }));
  };

  const handleImageError = (index: number) => {
    setLoadingStates(prev => ({ ...prev, [index]: false }));
    setErrorStates(prev => ({ ...prev, [index]: true }));
  };

  const canAddImages = editable && images.length < maxImages;

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-sm text-gray-500">
            {images.length} / {maxImages} images
          </span>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-8">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No images uploaded yet</p>
            {canAddImages && (
              <Button onClick={onImageAdd} variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Add Images
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square">
                    <SafeImage
                      src={image}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full"
                      onLoad={() => handleImageLoad(index)}
                      onError={() => handleImageError(index)}
                      showErrorMessage={true}
                    />
                  </div>
                  
                  {editable && onImageRemove && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onImageRemove(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}

                  {errorStates[index] && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <Alert variant="destructive" className="py-1 px-2">
                        <AlertCircle className="h-3 w-3" />
                        <AlertDescription className="text-xs">
                          Failed to load
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              ))}

              {canAddImages && (
                <button
                  onClick={onImageAdd}
                  className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Add Image</span>
                </button>
              )}
            </div>

            {images.length > 0 && canAddImages && (
              <div className="mt-4 text-center">
                <Button onClick={onImageAdd} variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Add More Images
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageGallery;