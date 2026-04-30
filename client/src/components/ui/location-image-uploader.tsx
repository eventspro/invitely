import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, MapPin, Trash2, Image as ImageIcon, Move } from 'lucide-react';

interface LocationImageUploaderProps {
  templateId: string;
  locationName: string;
  currentImage?: string;
  currentPositionX?: number;
  currentPositionY?: number;
  currentLatitude?: number;
  currentLongitude?: number;
  currentAddress?: string;
  onImageUpdate: (imageUrl: string) => void;
  onPositionUpdate: (x: number, y: number) => void;
  onCoordinatesUpdate: (latitude: number, longitude: number) => void;
  onAddressUpdate: (address: string) => void;
  onImageRemove: () => void;
}

export default function LocationImageUploader({
  templateId,
  locationName,
  currentImage,
  currentPositionX,
  currentPositionY,
  currentLatitude,
  currentLongitude,
  currentAddress,
  onImageUpdate,
  onPositionUpdate,
  onCoordinatesUpdate,
  onAddressUpdate,
  onImageRemove
}: LocationImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 50, startPosY: 50 });

  const posX = currentPositionX ?? 50;
  const posY = currentPositionY ?? 50;

  const onDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragRef.current = { startX: clientX, startY: clientY, startPosX: posX, startPosY: posY };
    setIsDragging(true);
    e.preventDefault();
  }, [posX, posY]);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      const container = containerRef.current;
      if (!container) return;

      const { startX, startY, startPosX, startPosY } = dragRef.current;
      const cW = container.offsetWidth;
      const cH = container.offsetHeight;

      // Drag right → image moves right → see left side → posX decreases
      const newX = Math.max(0, Math.min(100, startPosX - ((clientX - startX) / cW) * 100 * 1.5));
      const newY = Math.max(0, Math.min(100, startPosY - ((clientY - startY) / cH) * 100 * 1.5));
      onPositionUpdate(Math.round(newX), Math.round(newY));
    };

    const onUp = () => setIsDragging(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging, onPositionUpdate]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category', `location-${locationName}`);

      const token = localStorage.getItem('templateAdminToken') || localStorage.getItem('admin-token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/templates/${templateId}/photos/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload image');

      const data = await response.json();
      onImageUpdate(data.url);
    } catch (error) {
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImage) return;
    try {
      await fetch('/api/images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, url: currentImage }),
      });
      onImageRemove();
    } catch {
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
          <div className="space-y-1">
            {/* Drag-to-reposition preview */}
            <div
              ref={containerRef}
              className={`relative overflow-hidden rounded-md border select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ height: '192px' }}
              onMouseDown={onDragStart}
              onTouchStart={onDragStart}
            >
              <img
                src={currentImage}
                alt={`${locationName} location`}
                className="w-full h-full object-cover pointer-events-none"
                style={{ objectPosition: `${posX}% ${posY}%` }}
                draggable={false}
              />
              {/* Center crosshair target */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-8 h-8 opacity-60">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white bg-white/30" />
                </div>
              </div>
              {/* Hint label */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none">
                <Move className="w-3 h-3" /> Drag to reposition
              </div>
              {/* Delete button */}
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
            <p className="text-xs text-gray-400">Position: {posX}% {posY}%</p>
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
              onCoordinatesUpdate(lat, currentLongitude || 0);
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
              onCoordinatesUpdate(currentLatitude || 0, lng);
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
