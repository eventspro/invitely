import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, MapPin, Trash2, Image as ImageIcon } from 'lucide-react';

interface LocationImageUploaderProps {
  templateId: string;
  locationName: string; // 'church' or 'restaurant'
  currentImage?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  currentAddress?: string;
  onImageUpdate: (imageUrl: string) => void;
  onCoordinatesUpdate: (latitude: number, longitude: number) => void;
  onAddressUpdate: (address: string) => void;
  onImageRemove: () => void;
}

export default function LocationImageUploader({
  templateId,
  locationName,
  currentImage,
  currentLatitude,
  currentLongitude,
  currentAddress,
  onImageUpdate,
  onCoordinatesUpdate,
  onAddressUpdate,
  onImageRemove
}: LocationImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('templateId', templateId);
      formData.append('category', `location-${locationName}`);

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      onImageUpdate(data.url);
      
      console.log(`📸 Location image uploaded for ${locationName}:`, data.url);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImage) return;

    try {
      await fetch('/api/images', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          url: currentImage,
        }),
      });

      onImageRemove();
      console.log(`🗑️ Location image removed for ${locationName}`);
    } catch (error) {
      console.error('Error removing image:', error);
      setUploadError('Failed to remove image. Please try again.');
    }
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
      <h5 className="font-medium flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        {locationName === 'church' ? 'Ceremony' : 'Reception'} Details
      </h5>

      {/* Image Upload Section */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Location Image</Label>
        
        {currentImage ? (
          <div className="relative">
            <img
              src={currentImage}
              alt={`${locationName} location`}
              className="w-full h-32 object-cover rounded-md border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-2">No image uploaded</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : currentImage ? 'Change Image' : 'Upload Image'}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploadError && (
          <p className="text-sm text-red-600">{uploadError}</p>
        )}
      </div>

      {/* Address Section */}
      <div className="space-y-2">
        <Label htmlFor={`${locationName}Address`} className="text-sm font-medium">
          Full Address
        </Label>
        <Input
          id={`${locationName}Address`}
          value={currentAddress || ''}
          onChange={(e) => onAddressUpdate(e.target.value)}
          placeholder="Enter the full address"
          className="text-sm"
        />
      </div>

      {/* GPS Coordinates Section */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${locationName}Latitude`} className="text-sm font-medium">
            Latitude
          </Label>
          <Input
            id={`${locationName}Latitude`}
            type="number"
            step="any"
            value={currentLatitude || ''}
            onChange={(e) => {
              const lat = parseFloat(e.target.value) || 0;
              const lng = currentLongitude || 0;
              onCoordinatesUpdate(lat, lng);
            }}
            placeholder="e.g., 40.7128"
            className="text-sm"
          />
        </div>
        <div>
          <Label htmlFor={`${locationName}Longitude`} className="text-sm font-medium">
            Longitude
          </Label>
          <Input
            id={`${locationName}Longitude`}
            type="number"
            step="any"
            value={currentLongitude || ''}
            onChange={(e) => {
              const lng = parseFloat(e.target.value) || 0;
              const lat = currentLatitude || 0;
              onCoordinatesUpdate(lat, lng);
            }}
            placeholder="e.g., -74.0060"
            className="text-sm"
          />
        </div>
      </div>

      <div className="text-xs text-gray-500">
        💡 Tip: You can find GPS coordinates on Google Maps by right-clicking on a location
      </div>
    </div>
  );
}