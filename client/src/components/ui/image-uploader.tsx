import React, { useState, useRef, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from './button';
import { Alert, AlertDescription } from './alert';

interface ImageFile {
  id: string;
  filename: string;
  url: string;
}

interface ImageUploaderProps {
  templateId: string;
  category: string;
  onImagesUploaded?: (imageUrls: string[]) => void;
  onImageRemoved?: (imageUrl: string) => void;
  existingImages?: string[];
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  templateId,
  category,
  onImagesUploaded,
  onImageRemoved,
  existingImages = [],
  maxFiles = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  className = '',
  disabled = false
}) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const loadImages = async () => {
      try {
        const response = await fetch(`/api/templates/${templateId}/images?category=${category}`);
        if (response.ok) {
          const imageData = await response.json();
          setImages(imageData);
        }
      } catch (err) {
        console.error('Failed to load images:', err);
      }
    };

    if (templateId) {
      loadImages();
    }
  }, [templateId, category]);

  const uploadFiles = useCallback(async (files: FileList) => {
    if (!files.length) return;

    if (existingImages.length + files.length > maxFiles) {
      setError(`Կարող եք ավելացնել ամենաշատը ${maxFiles} նկար`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!acceptedTypes.includes(file.type)) {
          throw new Error(`Չսպասարկվող ֆայլի տեսակ: ${file.type}`);
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`Ֆայլը չափազանց մեծ է: ${file.name}`);
        }

        const formData = new FormData();
        formData.append('image', file);
        formData.append('category', category);

        const response = await fetch(`/api/templates/${templateId}/photos/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Վերբեռնման սխալ');
        }

        return await response.json();
      });

      const results = await Promise.all(uploadPromises);
      const newImages = [...images, ...results];
      setImages(newImages);
      
      // Notify parent component with image URLs
      const newUrls = results.map(img => img.url);
      onImagesUploaded?.(newUrls);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Վերբեռնման սխալ');
    } finally {
      setUploading(false);
    }
  }, [images, templateId, category, maxFiles, acceptedTypes, onImagesUploaded]);

  const removeImage = useCallback(async (imageId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const newImages = images.filter(img => img.id !== imageId);
        setImages(newImages);
        
        // Find the removed image and notify parent
        const removedImage = images.find(img => img.id === imageId);
        if (removedImage) {
          onImageRemoved?.(removedImage.url);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ջնջման սխալ');
      }
    } catch (err) {
      setError('Ջնջման սխալ');
    }
  }, [images, templateId, onImageRemoved]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }, [uploadFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  }, [uploadFiles]);

  return (
    <div className={`w-full ${className}`}>
      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 w-6 p-0"
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className={`h-8 w-8 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          <div className="text-sm text-gray-600">
            <span className="font-medium">Սեղմեք ֆայլ ընտրելու համար</span> կամ քաշեք և թողեք այստեղ
          </div>
          <div className="text-xs text-gray-500">
            PNG, JPG, WEBP մինչև 5MB ({maxFiles - existingImages.length} նկար մնացել է)
          </div>
        </div>

        {uploading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
              <div className="text-sm text-gray-600">Վերբեռնում...</div>
            </div>
          </div>
        )}
      </div>

      {existingImages.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {existingImages.map((imageUrl, index) => {
            // Find the corresponding image data if available
            const imageData = images.find(img => img.url === imageUrl);
            
            return (
              <div key={imageData?.id || `existing-${index}`} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={imageUrl}
                    alt={imageData?.filename || `Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (imageData) {
                      removeImage(imageData.id);
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
