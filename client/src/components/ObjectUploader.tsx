import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (files: File[]) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A simple file upload component for guest photos
 */
export function ObjectUploader({
  maxNumberOfFiles = 10,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Filter to only images and respect file limits
    const imageFiles = files.filter(file => file.type.startsWith('image/')).slice(0, maxNumberOfFiles);
    
    // Check file sizes
    const validFiles = imageFiles.filter(file => file.size <= maxFileSize);
    
    if (validFiles.length !== imageFiles.length) {
      alert('Some files were too large and skipped (max 10MB per file)');
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      const uploadedFiles: File[] = [];
      
      for (const file of validFiles) {
        try {
          const { url } = await onGetUploadParameters();
          
          const uploadResponse = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          });
          
          if (uploadResponse.ok) {
            // After successful upload, register the photo with the backend
            const registerResponse = await fetch('/api/photos', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                photoURL: url,
              }),
            });
            
            if (registerResponse.ok) {
              uploadedFiles.push(file);
            } else {
              console.error('Failed to register photo:', await registerResponse.text());
            }
          }
        } catch (error) {
          console.error('Upload failed for file:', file.name, error);
        }
      }
      
      if (uploadedFiles.length > 0) {
        onComplete?.(uploadedFiles);
      }
    } catch (error) {
      console.error('Upload process failed:', error);
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        disabled={isUploading}
      />
      <Button 
        onClick={handleButtonClick}
        className={buttonClassName} 
        disabled={isUploading}
        data-testid="button-upload-photos"
      >
        {isUploading ? 'Վերբեռնվում է...' : children}
      </Button>
    </div>
  );
}