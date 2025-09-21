import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Camera, Heart, Home, Upload } from "lucide-react";
import { Link } from "wouter";
import { ObjectUploader } from "@/components/ObjectUploader";
import { ImageUploader } from "@/components/ui/image-uploader";

export default function PhotosPage() {
  const [guestName, setGuestName] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [uploadedPhotosCount, setUploadedPhotosCount] = useState(0);
  const MAX_PHOTOS = 25;

  // Get upload parameters using existing API
  const handleGetUploadParameters = async () => {
    try {
      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const newCount = uploadedPhotosCount + files.length;
      setUploadedPhotosCount(newCount);
      
      // Store the count in localStorage for persistence
      localStorage.setItem(`wedding-photos-count-${guestName}`, newCount.toString());
      
      setUploadStatus(`${files.length} նկար(ներ) հաջողությամբ ավելացվեցին! Շնորհակալություն ${guestName}! (Ընդամենը: ${newCount})`);
      setTimeout(() => setUploadStatus(""), 5000);
    } catch (error) {
      console.error('Failed to complete upload:', error);
      setUploadStatus("Սխալ վերբեռնելիս: Խնդրում ենք կրկին փորձել:");
      setTimeout(() => setUploadStatus(""), 4000);
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestName.trim()) {
      setNameSubmitted(true);
      
      // Load existing photo count for this guest
      const savedCount = localStorage.getItem(`wedding-photos-count-${guestName}`);
      if (savedCount) {
        setUploadedPhotosCount(parseInt(savedCount));
      }
    }
  };


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
                  Your Name / Ձեր անունը
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
        
        {/* Back to Main Site */}
        <Link href="/">
          <Button variant="outline" size="sm" className="mt-2">
            <Home className="w-4 h-4 mr-1" />
            Back to Wedding Site
          </Button>
        </Link>
      </div>

      {/* Upload Progress Bar */}
      <Card className="mb-6">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-lg">Upload Progress</CardTitle>
          <CardDescription>
            {uploadedPhotosCount} of {MAX_PHOTOS} photos uploaded
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-charcoal/70">
              <span>Photos Uploaded</span>
              <span>{uploadedPhotosCount}/{MAX_PHOTOS}</span>
            </div>
            <Progress 
              value={(uploadedPhotosCount / MAX_PHOTOS) * 100} 
              className="h-3"
            />
          </div>
          
          {uploadedPhotosCount >= MAX_PHOTOS ? (
            <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium">
                🎉 Maximum photos reached! Thank you for sharing your memories!
              </p>
            </div>
          ) : (
            <div className="text-center text-sm text-charcoal/60">
              {MAX_PHOTOS - uploadedPhotosCount} more photos remaining
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Status Message */}
      {uploadStatus && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="text-center">
              <p className="text-charcoal font-medium">{uploadStatus}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Upload Section */}
      <Card className="mb-6">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Share Your Beautiful Photos</CardTitle>
          <CardDescription>
            Upload your favorite moments from our special day
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Component */}
          <div className="flex justify-center">
            {uploadedPhotosCount >= MAX_PHOTOS ? (
              <div className="text-center py-4">
                <p className="text-charcoal/70 mb-4">You've reached the maximum number of photos!</p>
                <Button disabled className="opacity-50">
                  <Camera className="w-5 h-5 mr-2" />
                  Maximum Reached
                </Button>
              </div>
            ) : (
              <div className="w-full space-y-6">
                {/* Enhanced Image Uploader */}
                <ImageUploader
                  maxFiles={Math.min(25, MAX_PHOTOS - uploadedPhotosCount)}
                  maxFileSize={10485760} // 10MB
                  onFilesUploaded={(files) => {
                    const newCount = uploadedPhotosCount + files.length;
                    setUploadedPhotosCount(newCount);
                    localStorage.setItem(`wedding-photos-count-${guestName}`, newCount.toString());
                    setUploadStatus(`${files.length} նկար(ներ) հաջողությամբ ավելացվեցին! Շնորհակալություն ${guestName}! (Ընդամենը: ${newCount})`);
                    setTimeout(() => setUploadStatus(""), 5000);
                  }}
                  onFileRemoved={() => {
                    // Handle file removal if needed
                  }}
                />
                
                {/* Alternative: Original Uploader */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-charcoal/60 mb-4 text-center">Or use the simple uploader:</p>
                  <div className="flex justify-center">
                    <ObjectUploader
                      maxNumberOfFiles={Math.min(25, MAX_PHOTOS - uploadedPhotosCount)}
                      maxFileSize={10485760} // 10MB
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleUploadComplete}
                      buttonClassName="bg-softGold hover:bg-softGold/90 text-white px-8 py-4 rounded-lg font-medium transition-colors duration-300 transform hover:scale-105 flex items-center text-lg"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Ավելացնել նկարներ
                    </ObjectUploader>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Instructions */}
          <div className="text-center text-sm text-charcoal/70 space-y-2">
            <p>• You can upload up to {MAX_PHOTOS} photos total</p>
            <p>• You can upload {Math.min(25, MAX_PHOTOS - uploadedPhotosCount)} photos in one batch</p>
            <p>• Maximum file size: 10MB per photo</p>
            <p>• Supported formats: JPG, PNG, GIF</p>
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Share Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-charcoal/70">
          <div className="flex items-start gap-3">
            <span className="bg-softGold text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
            <p>Click "Ավելացնել նկարներ" button above</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-softGold text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
            <p>Choose photos from your gallery or take new ones</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-softGold text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
            <p>Your photos will be automatically uploaded to our wedding gallery</p>
          </div>
          <div className="mt-4 p-3 bg-softGold/10 rounded-lg">
            <p className="text-charcoal font-medium">Thank you for helping us capture our special day! ❤️</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}