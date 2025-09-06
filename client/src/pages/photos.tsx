import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Heart, Home } from "lucide-react";
import { Link } from "wouter";
import { ObjectUploader } from "@/components/ObjectUploader";

export default function PhotosPage() {
  const [guestName, setGuestName] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");

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
      setUploadStatus(`${files.length} նկար(ներ) հաջողությամբ ավելացվեցին! Շնորհակալություն ${guestName}:`);
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
            <ObjectUploader
              maxNumberOfFiles={25}
              maxFileSize={10485760} // 10MB
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="bg-softGold hover:bg-softGold/90 text-white px-8 py-4 rounded-lg font-medium transition-colors duration-300 transform hover:scale-105 flex items-center text-lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              Ավելացնել նկարներ
            </ObjectUploader>
          </div>
          
          {/* Instructions */}
          <div className="text-center text-sm text-charcoal/70 space-y-2">
            <p>• You can upload up to 25 photos</p>
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