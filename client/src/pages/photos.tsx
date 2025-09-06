import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, Heart, Trash2, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoData {
  id: string;
  file: File;
  preview: string;
  uploaded: boolean;
  uploading: boolean;
}

export default function PhotosPage() {
  const [guestName, setGuestName] = useState("");
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUploading, setIsUploading] = useState(false);
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { toast } = useToast();

  const MAX_PHOTOS = 25;
  const uploadedCount = photos.filter(p => p.uploaded).length;
  const remainingPhotos = MAX_PHOTOS - uploadedCount;

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load guest data from localStorage
  useEffect(() => {
    const savedGuestName = localStorage.getItem('wedding-guest-name');
    const savedPhotos = localStorage.getItem('wedding-guest-photos');
    
    if (savedGuestName) {
      setGuestName(savedGuestName);
      setNameSubmitted(true);
    }
    
    if (savedPhotos) {
      try {
        const parsedPhotos = JSON.parse(savedPhotos);
        setPhotos(parsedPhotos.map((p: any) => ({
          ...p,
          file: null, // Files can't be serialized
          uploading: false
        })));
      } catch (error) {
        console.error('Error loading saved photos:', error);
      }
    }
  }, []);

  // Save guest data to localStorage
  useEffect(() => {
    if (guestName) {
      localStorage.setItem('wedding-guest-name', guestName);
    }
    if (photos.length > 0) {
      // Save photos metadata (without file objects)
      const photosToSave = photos.map(p => ({
        id: p.id,
        preview: p.preview,
        uploaded: p.uploaded,
        uploading: false
      }));
      localStorage.setItem('wedding-guest-photos', JSON.stringify(photosToSave));
    }
  }, [guestName, photos]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestName.trim()) {
      setNameSubmitted(true);
      toast({
        title: "Welcome! 🎉",
        description: `Thank you ${guestName}! You can now share your beautiful photos.`,
      });
    }
  };

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please try selecting photos instead.",
        variant: "destructive",
      });
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            addPhotoToGallery(file);
            closeCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(addPhotoToGallery);
    }
  };

  const addPhotoToGallery = (file: File) => {
    if (photos.length >= MAX_PHOTOS) {
      toast({
        title: "Photo limit reached",
        description: `You can only upload up to ${MAX_PHOTOS} photos.`,
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const newPhoto: PhotoData = {
        id: `photo-${Date.now()}-${Math.random()}`,
        file,
        preview: e.target?.result as string,
        uploaded: false,
        uploading: false
      };
      
      setPhotos(prev => [...prev, newPhoto]);
      
      // Auto-upload if online
      if (isOnline) {
        uploadPhoto(newPhoto);
      } else {
        toast({
          title: "Photo Added Offline",
          description: "Photo will be uploaded when you're back online.",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (photo: PhotoData) => {
    if (!photo.file || photo.uploaded || photo.uploading) return;

    setPhotos(prev => prev.map(p => 
      p.id === photo.id ? { ...p, uploading: true } : p
    ));

    try {
      const formData = new FormData();
      formData.append('photo', photo.file);
      formData.append('guestName', guestName);
      formData.append('photoId', photo.id);

      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setPhotos(prev => prev.map(p => 
          p.id === photo.id ? { ...p, uploaded: true, uploading: false } : p
        ));
        toast({
          title: "Photo uploaded! ❤️",
          description: "Your beautiful memory has been shared.",
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { ...p, uploading: false } : p
      ));
      
      if (!isOnline) {
        toast({
          title: "Queued for upload",
          description: "Photo will be uploaded when connection is restored.",
        });
      } else {
        toast({
          title: "Upload failed",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    }
  };

  const deletePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    toast({
      title: "Photo removed",
      description: "Photo has been deleted from your gallery.",
    });
  };

  const uploadAllPhotos = async () => {
    const pendingPhotos = photos.filter(p => !p.uploaded && !p.uploading && p.file);
    
    if (pendingPhotos.length === 0) {
      toast({
        title: "All caught up!",
        description: "All your photos have been uploaded.",
      });
      return;
    }

    setIsUploading(true);
    for (const photo of pendingPhotos) {
      await uploadPhoto(photo);
      // Small delay between uploads to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setIsUploading(false);
  };

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    }
  }, []);

  if (!nameSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-white to-warmBeige/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mb-4">
              <Heart className="w-16 h-16 mx-auto text-softGold animate-heartbeat" />
            </div>
            <CardTitle className="text-2xl" style={{ fontFamily: "Playfair Display, serif" }}>
              Հարություն & Տաթև
            </CardTitle>
            <CardTitle className="text-xl text-softGold mb-2">Wedding Photos 📸</CardTitle>
            <CardDescription>
              Share your beautiful memories from our special day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Your Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                  className="text-center"
                  data-testid="guest-name-input"
                />
              </div>
              <Button type="submit" className="w-full bg-softGold hover:bg-softGold/90">
                Start Sharing Photos 🎉
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-warmBeige/20 p-4">
      {/* Header */}
      <div className="text-center mb-6 pt-4">
        <h1 className="text-3xl font-bold text-charcoal mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
          Հարություն & Տաթև
        </h1>
        <p className="text-softGold text-lg">Wedding Photos 📸</p>
        <p className="text-charcoal/70 mt-2">Welcome, {guestName}!</p>
        
        {/* Connection Status */}
        <div className="flex items-center justify-center gap-2 mt-2">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-600">Offline - photos will sync later</span>
            </>
          )}
        </div>
      </div>

      {/* Photo Counter */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-softGold">
              {uploadedCount} / {MAX_PHOTOS}
            </div>
            <p className="text-sm text-charcoal/70">photos uploaded</p>
            {remainingPhotos > 0 && (
              <p className="text-xs text-charcoal/60 mt-1">
                {remainingPhotos} more photos remaining
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Camera View */}
      {showCamera && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <Button onClick={capturePhoto} size="lg" className="bg-softGold hover:bg-softGold/90">
                  <Camera className="w-6 h-6 mr-2" />
                  Capture
                </Button>
                <Button onClick={closeCamera} variant="outline" size="lg">
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {!showCamera && remainingPhotos > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button
            onClick={openCamera}
            size="lg"
            className="bg-softGold hover:bg-softGold/90 h-16"
          >
            <Camera className="w-6 h-6 mr-2" />
            Take Photo
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="lg"
            variant="outline"
            className="h-16"
          >
            <Upload className="w-6 h-6 mr-2" />
            Choose from Gallery
          </Button>
        </div>
      )}

      {/* Upload All Button */}
      {photos.some(p => !p.uploaded && !p.uploading) && isOnline && (
        <div className="mb-6">
          <Button
            onClick={uploadAllPhotos}
            disabled={isUploading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isUploading ? "Uploading..." : `Upload All Pending Photos (${photos.filter(p => !p.uploaded).length})`}
          </Button>
        </div>
      )}

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Photos</CardTitle>
            <CardDescription>
              {photos.filter(p => p.uploaded).length} uploaded, {photos.filter(p => !p.uploaded).length} pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={photo.preview}
                      alt="Wedding photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Status Overlay */}
                  <div className="absolute top-2 right-2">
                    {photo.uploading ? (
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : photo.uploaded ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">•</span>
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <Button
                    onClick={() => deletePhoto(photo.id)}
                    size="sm"
                    variant="destructive"
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {photos.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Camera className="w-16 h-16 mx-auto text-charcoal/30 mb-4" />
            <h3 className="text-lg font-medium text-charcoal mb-2">No photos yet</h3>
            <p className="text-charcoal/60">Start capturing beautiful memories!</p>
          </CardContent>
        </Card>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
}