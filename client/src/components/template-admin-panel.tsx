// Template Admin Panel - Per-template configuration and management
import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Settings, 
  Users, 
  Download, 
  Mail, 
  Eye, 
  CheckCircle, 
  XCircle,
  Save,
  ExternalLink,
  Palette,
  Type,
  Camera,
  Layout,
  Plus,
  Trash2,
  Clock,
  ChevronUp,
  ChevronDown,
  Copy,
  Calendar,
  Music
} from "lucide-react";
import type { WeddingConfig } from "@/templates/types";
import { ImageUploader } from "@/components/ui/image-uploader";
import { SectionManager } from "@/components/ui/section-manager";
import SectionImageUploader from "@/components/ui/section-image-uploader";
import LocationImageUploader from "@/components/ui/location-image-uploader";

interface Template {
  id: string;
  name: string;
  slug: string;
  templateKey: string;
  config: WeddingConfig;
  maintenance: boolean;
  stats: {
    totalRsvps: number;
    attending: number;
    notAttending: number;
  };
}

interface Rsvp {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  guestCount: string;
  guestNames?: string | null;
  attendance: string;
  createdAt: string;
}

export default function TemplateAdminPanel() {
  const params = useParams();
  const templateId = params.templateId;
  
  const [template, setTemplate] = useState<Template | null>(null);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedRsvp, setSelectedRsvp] = useState<Rsvp | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (authenticated && templateId) {
      loadTemplateData();
    }
  }, [authenticated, templateId]);

  const checkAuthentication = async () => {
    const token = localStorage.getItem("admin-token");
    if (!token) {
      // No token, redirect to platform dashboard for login
      window.location.href = "/platform";
      return;
    }

    // Verify token is valid by making a test API call
    try {
      const response = await fetch("/api/admin/templates", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setAuthenticated(true);
      } else if (response.status === 401) {
        // Token is invalid or expired
        localStorage.removeItem("admin-token");
        window.location.href = "/platform";
      } else {
        // Other error, but token might be valid
        setAuthenticated(true);
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      // Network error, assume token is valid for now
      setAuthenticated(true);
    }
  };

  const loadTemplateData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin-token");
      
      // Load template info with enriched configuration (includes images)
      const templateResponse = await fetch(`/api/templates/${templateId}/config`);
      
      if (templateResponse.ok) {
        const templateConfig = await templateResponse.json();
        
        // Get additional template metadata from admin endpoint
        const adminResponse = await fetch(`/api/admin/templates`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (adminResponse.ok) {
          const allTemplates = await adminResponse.json();
          const adminTemplate = allTemplates.find((t: Template) => t.id === templateConfig.templateId);
          
          if (adminTemplate) {
            // Merge enriched config with admin metadata
            const enrichedTemplate = {
              ...adminTemplate,
              config: templateConfig.config // Use enriched config with images
            };
            setTemplate(enrichedTemplate);
          } else {
            toast({ title: "Template not found", variant: "destructive" });
            return;
          }
        } else if (adminResponse.status === 401) {
          // Authentication failed - redirect to login
          localStorage.removeItem("admin-token");
          window.location.href = "/platform";
          return;
        }
      } else {
        // Try to get error message from response
        let errorMessage = "Failed to load template data";
        try {
          const errorData = await templateResponse.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use default message
        }
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
        return;
      }
      
      // Load RSVPs for this template
      const rsvpResponse = await fetch(`/api/templates/${templateId}/rsvps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (rsvpResponse.ok) {
        const rsvpData = await rsvpResponse.json();
        setRsvps(rsvpData);
      }
      
    } catch (error) {
      console.error("Failed to load template data:", error);
      
      // Check if this is a JSON parsing error
      if (error instanceof SyntaxError && error.message.includes("Unexpected token")) {
        toast({ 
          title: "Authentication Error", 
          description: "Please log in again", 
          variant: "destructive" 
        });
        localStorage.removeItem("admin-token");
        window.location.href = "/platform";
      } else {
        toast({ 
          title: "Error", 
          description: `Failed to load template data: ${error instanceof Error ? error.message : 'Unknown error'}`, 
          variant: "destructive" 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!template) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem("admin-token");
      
      const response = await fetch(`/api/admin/templates/${template.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: template.name,
          config: template.config,
          maintenance: template.maintenance,
        }),
      });
      
      if (response.ok) {
        const updatedTemplate = await response.json();
        setTemplate({ ...template, ...updatedTemplate });
        toast({ title: "Saved", description: "Template configuration has been saved" });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save template", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const exportRsvpsToCSV = async () => {
    try {
      const token = localStorage.getItem("admin-token");
      const response = await fetch(`/api/admin/templates/${templateId}/export/csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `${template?.slug}-rsvps.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({ title: "Export successful", description: "RSVPs have been exported to CSV" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to export RSVPs", variant: "destructive" });
    }
  };

  const updateConfig = (path: string, value: any) => {
    if (!template) return;
    
    const newConfig = { ...template.config };
    const keys = path.split('.');
    let current: any = newConfig;
    
    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    // Set the value
    current[keys[keys.length - 1]] = value;
    
    setTemplate({ ...template, config: newConfig });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Template Not Found</h1>
          <Link href="/platform">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/platform">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
                <p className="text-gray-600">/{template.slug}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/${template.slug}`}>
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Live
                </Button>
              </Link>
              <Button onClick={saveTemplate} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="rsvps">RSVPs ({template.stats.totalRsvps})</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Edit the main content and details for this wedding</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="groomName">Groom's Name</Label>
                  <Input
                    id="groomName"
                    value={template.config.couple?.groomName || ""}
                    onChange={(e) => updateConfig("couple.groomName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="brideName">Bride's Name</Label>
                  <Input
                    id="brideName"
                    value={template.config.couple?.brideName || ""}
                    onChange={(e) => updateConfig("couple.brideName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="weddingDate">Wedding Date</Label>
                  <Input
                    id="weddingDate"
                    type="datetime-local"
                    value={template.config.wedding?.date || ""}
                    onChange={(e) => updateConfig("wedding.date", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="displayDate">Display Date</Label>
                  <Input
                    id="displayDate"
                    value={template.config.wedding?.displayDate || ""}
                    onChange={(e) => updateConfig("wedding.displayDate", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Hero Section */}
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>Configure the main header section of your wedding site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="heroInvitation">Invitation Text</Label>
                  <Input
                    id="heroInvitation"
                    value={template.config.hero?.invitation || ""}
                    onChange={(e) => updateConfig("hero.invitation", e.target.value)}
                    placeholder="Հրավիրում ենք մեր հարսանիքին"
                  />
                </div>
                <div>
                  <Label htmlFor="heroWelcome">Welcome Message</Label>
                  <Textarea
                    id="heroWelcome"
                    value={template.config.hero?.welcomeMessage || ""}
                    onChange={(e) => updateConfig("hero.welcomeMessage", e.target.value)}
                    placeholder="Enter a welcome message for your guests..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="musicButton">Music Button Text</Label>
                  <Input
                    id="musicButton"
                    value={template.config.hero?.musicButton || ""}
                    onChange={(e) => updateConfig("hero.musicButton", e.target.value)}
                    placeholder="Երաժշտություն"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Countdown Section */}
            <Card>
              <CardHeader>
                <CardTitle>Countdown Section</CardTitle>
                <CardDescription>Configure the wedding countdown timer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="countdownSubtitle">Countdown Subtitle</Label>
                  <Input
                    id="countdownSubtitle"
                    value={template.config.countdown?.subtitle || ""}
                    onChange={(e) => updateConfig("countdown.subtitle", e.target.value)}
                    placeholder="Հարսանիքին մնացել է"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="daysLabel">Days Label</Label>
                    <Input
                      id="daysLabel"
                      value={template.config.countdown?.labels?.days || ""}
                      onChange={(e) => updateConfig("countdown.labels.days", e.target.value)}
                      placeholder="օր"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hoursLabel">Hours Label</Label>
                    <Input
                      id="hoursLabel"
                      value={template.config.countdown?.labels?.hours || ""}
                      onChange={(e) => updateConfig("countdown.labels.hours", e.target.value)}
                      placeholder="ժամ"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minutesLabel">Minutes Label</Label>
                    <Input
                      id="minutesLabel"
                      value={template.config.countdown?.labels?.minutes || ""}
                      onChange={(e) => updateConfig("countdown.labels.minutes", e.target.value)}
                      placeholder="ռոպե"
                    />
                  </div>
                  <div>
                    <Label htmlFor="secondsLabel">Seconds Label</Label>
                    <Input
                      id="secondsLabel"
                      value={template.config.countdown?.labels?.seconds || ""}
                      onChange={(e) => updateConfig("countdown.labels.seconds", e.target.value)}
                      placeholder="վայրկյան"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calendar Section */}
            <Card>
              <CardHeader>
                <CardTitle>Calendar Section</CardTitle>
                <CardDescription>Configure the calendar display</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="calendarTitle">Calendar Title</Label>
                  <Input
                    id="calendarTitle"
                    value={template.config.calendar?.title || ""}
                    onChange={(e) => updateConfig("calendar.title", e.target.value)}
                    placeholder="Պատրաստվեք մեր հարսանիքին"
                  />
                </div>
                <div>
                  <Label htmlFor="calendarDescription">Calendar Description</Label>
                  <Input
                    id="calendarDescription"
                    value={template.config.calendar?.description || ""}
                    onChange={(e) => updateConfig("calendar.description", e.target.value)}
                    placeholder="Միացրեք ձեր օրացույցին"
                  />
                </div>
                <div>
                  <Label htmlFor="monthTitle">Month Title</Label>
                  <Input
                    id="monthTitle"
                    value={template.config.calendar?.monthTitle || ""}
                    onChange={(e) => updateConfig("calendar.monthTitle", e.target.value)}
                    placeholder="Հոկտեմբեր 2025"
                  />
                </div>
                <div>
                  <Label>Day Labels (7 days of the week)</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                      <Input
                        key={dayIndex}
                        value={template.config.calendar?.dayLabels?.[dayIndex] || ""}
                        onChange={(e) => {
                          const newDayLabels = [...(template.config.calendar?.dayLabels || [])];
                          newDayLabels[dayIndex] = e.target.value;
                          updateConfig("calendar.dayLabels", newDayLabels);
                        }}
                        placeholder={['Կիր', 'Երկ', 'Երք', 'Չոր', 'Հնգ', 'Ուրբ', 'Շբթ'][dayIndex]}
                        className="text-center text-sm"
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wedding Locations */}
            <Card>
              <CardHeader>
                <CardTitle>Wedding Locations</CardTitle>
                <CardDescription>Configure all wedding venues - ceremony, reception, and more</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="locationsSectionTitle">Locations Section Title</Label>
                  <Input
                    id="locationsSectionTitle"
                    value={template.config.locations?.sectionTitle || ""}
                    onChange={(e) => updateConfig("locations.sectionTitle", e.target.value)}
                    placeholder="Վայրեր"
                  />
                </div>
                
                {/* Dynamic Locations */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">Wedding Venues</h4>
                    <Button
                      onClick={() => {
                        const newLocation = {
                          id: Date.now().toString(),
                          title: "New Location",
                          name: "",
                          description: "",
                          mapButton: "Open in Map",
                          mapIcon: "📍"
                        };
                        const currentVenues = template.config.locations?.venues || [];
                        updateConfig("locations.venues", [...currentVenues, newLocation]);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      + Add Location
                    </Button>
                  </div>

                  {(template.config.locations?.venues || []).map((venue, index) => (
                    <div key={venue.id || index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Location {index + 1}: {venue.title}</h5>
                        <Button
                          onClick={() => {
                            const currentVenues = template.config.locations?.venues || [];
                            const updatedVenues = currentVenues.filter((_, i) => i !== index);
                            updateConfig("locations.venues", updatedVenues);
                          }}
                          variant="destructive"
                          size="sm"
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <LocationImageUploader
                        templateId={template.id}
                        locationName={`venue-${venue.id || index}`}
                        currentImage={venue.image}
                        currentLatitude={venue.latitude}
                        currentLongitude={venue.longitude}
                        currentAddress={venue.address}
                        onImageUpdate={(imageUrl) => {
                          const currentVenues = [...(template.config.locations?.venues || [])];
                          currentVenues[index] = { ...currentVenues[index], image: imageUrl };
                          updateConfig("locations.venues", currentVenues);
                        }}
                        onCoordinatesUpdate={(lat, lng) => {
                          const currentVenues = [...(template.config.locations?.venues || [])];
                          currentVenues[index] = { 
                            ...currentVenues[index], 
                            latitude: lat, 
                            longitude: lng 
                          };
                          updateConfig("locations.venues", currentVenues);
                        }}
                        onAddressUpdate={(address) => {
                          const currentVenues = [...(template.config.locations?.venues || [])];
                          currentVenues[index] = { ...currentVenues[index], address };
                          updateConfig("locations.venues", currentVenues);
                        }}
                        onImageRemove={() => {
                          const currentVenues = [...(template.config.locations?.venues || [])];
                          currentVenues[index] = { ...currentVenues[index], image: "" };
                          updateConfig("locations.venues", currentVenues);
                        }}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`location-title-${index}`}>Location Title</Label>
                          <Input
                            id={`location-title-${index}`}
                            value={venue.title}
                            onChange={(e) => {
                              const currentVenues = [...(template.config.locations?.venues || [])];
                              currentVenues[index] = { ...currentVenues[index], title: e.target.value };
                              updateConfig("locations.venues", currentVenues);
                            }}
                            placeholder="e.g., Ceremony, Reception, Cocktail Hour"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`location-name-${index}`}>Venue Name</Label>
                          <Input
                            id={`location-name-${index}`}
                            value={venue.name}
                            onChange={(e) => {
                              const currentVenues = [...(template.config.locations?.venues || [])];
                              currentVenues[index] = { ...currentVenues[index], name: e.target.value };
                              updateConfig("locations.venues", currentVenues);
                            }}
                            placeholder="e.g., St. Ann Church"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor={`location-description-${index}`}>Description</Label>
                        <Textarea
                          id={`location-description-${index}`}
                          value={venue.description}
                          onChange={(e) => {
                            const currentVenues = [...(template.config.locations?.venues || [])];
                            currentVenues[index] = { ...currentVenues[index], description: e.target.value };
                            updateConfig("locations.venues", currentVenues);
                          }}
                          placeholder="Brief description of the location"
                          rows={2}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`location-map-button-${index}`}>Map Button Text</Label>
                          <Input
                            id={`location-map-button-${index}`}
                            value={venue.mapButton}
                            onChange={(e) => {
                              const currentVenues = [...(template.config.locations?.venues || [])];
                              currentVenues[index] = { ...currentVenues[index], mapButton: e.target.value };
                              updateConfig("locations.venues", currentVenues);
                            }}
                            placeholder="Open in Map"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`location-map-icon-${index}`}>Map Icon</Label>
                          <Input
                            id={`location-map-icon-${index}`}
                            value={venue.mapIcon}
                            onChange={(e) => {
                              const currentVenues = [...(template.config.locations?.venues || [])];
                              currentVenues[index] = { ...currentVenues[index], mapIcon: e.target.value };
                              updateConfig("locations.venues", currentVenues);
                            }}
                            placeholder="📍"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!template.config.locations?.venues || template.config.locations.venues.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No locations added yet. Click "Add Location" to create your first venue.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Wedding Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Wedding Timeline</CardTitle>
                <CardDescription>Schedule of events for your wedding day - Add, edit, or remove timeline cards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="timelineTitle">Timeline Section Title</Label>
                  <Input
                    id="timelineTitle"
                    value={template.config.timeline?.title || ""}
                    onChange={(e) => updateConfig("timeline.title", e.target.value)}
                    placeholder="Ծրագիր"
                  />
                </div>

                {/* Timeline Events */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Timeline Events</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const currentEvents = template.config.timeline?.events || [];
                          const quickEvents = [
                            { time: "14:00", title: "Guest Arrival", description: "Welcome drinks and mingling" },
                            { time: "15:00", title: "Ceremony", description: "Wedding ceremony begins" },
                            { time: "16:00", title: "Photography", description: "Wedding photos with family and friends" },
                            { time: "18:00", title: "Reception", description: "Dinner and celebration" },
                            { time: "22:00", title: "Dancing", description: "Music and dancing" },
                            { time: "24:00", title: "End", description: "Thank you for celebrating with us" }
                          ];
                          updateConfig("timeline.events", [...currentEvents, ...quickEvents]);
                        }}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        title="Add Common Timeline"
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Quick Template
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentEvents = template.config.timeline?.events || [];
                          const newEvent = {
                            id: `event-${Date.now()}`,
                            time: "",
                            title: "",
                            description: "",
                            icon: "🕒"
                          };
                          updateConfig("timeline.events", [...currentEvents, newEvent]);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Event
                      </Button>
                    </div>
                  </div>

                  {(template.config.timeline?.events || []).map((event, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Event {index + 1}</span>
                        <div className="flex items-center gap-2">
                          {/* Move Up Button */}
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentEvents = [...(template.config.timeline?.events || [])];
                                const temp = currentEvents[index];
                                currentEvents[index] = currentEvents[index - 1];
                                currentEvents[index - 1] = temp;
                                updateConfig("timeline.events", currentEvents);
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Move Up"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {/* Move Down Button */}
                          {index < (template.config.timeline?.events?.length || 0) - 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentEvents = [...(template.config.timeline?.events || [])];
                                const temp = currentEvents[index];
                                currentEvents[index] = currentEvents[index + 1];
                                currentEvents[index + 1] = temp;
                                updateConfig("timeline.events", currentEvents);
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Move Down"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {/* Duplicate Button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentEvents = template.config.timeline?.events || [];
                              const duplicatedEvent = { ...event };
                              const newEvents = [...currentEvents];
                              newEvents.splice(index + 1, 0, duplicatedEvent);
                              updateConfig("timeline.events", newEvents);
                            }}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Duplicate Event"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          
                          {/* Delete Button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentEvents = template.config.timeline?.events || [];
                              const updatedEvents = currentEvents.filter((_, i) => i !== index);
                              updateConfig("timeline.events", updatedEvents);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor={`eventTime${index}`}>Time</Label>
                          <Input
                            id={`eventTime${index}`}
                            value={event.time || ""}
                            onChange={(e) => updateConfig(`timeline.events.${index}.time`, e.target.value)}
                            placeholder="e.g., 16:00"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`eventTitle${index}`}>Event Title</Label>
                          <Input
                            id={`eventTitle${index}`}
                            value={event.title || ""}
                            onChange={(e) => updateConfig(`timeline.events.${index}.title`, e.target.value)}
                            placeholder="e.g., Wedding Ceremony"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`eventDescription${index}`}>Description</Label>
                          <Input
                            id={`eventDescription${index}`}
                            value={event.description || ""}
                            onChange={(e) => updateConfig(`timeline.events.${index}.description`, e.target.value)}
                            placeholder="e.g., At St. Ann Church"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`eventIcon${index}`}>Icon</Label>
                          <select
                            id={`eventIcon${index}`}
                            value={event.icon || "🕒"}
                            onChange={(e) => updateConfig(`timeline.events.${index}.icon`, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="🕒">🕒 Clock</option>
                            <option value="💒">💒 Church</option>
                            <option value="🍾">🍾 Cocktails</option>
                            <option value="🍽️">🍽️ Dinner</option>
                            <option value="💃">💃 Dancing</option>
                            <option value="📸">📸 Photos</option>
                            <option value="🎉">🎉 Celebration</option>
                            <option value="💐">💐 Bouquet</option>
                            <option value="💍">💍 Rings</option>
                            <option value="🎵">🎵 Music</option>
                            <option value="🌸">🌸 Flowers</option>
                            <option value="⭐">⭐ Special</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!template.config.timeline?.events || template.config.timeline.events.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No timeline events yet. Click "Add Event" to create your first timeline card.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4 border-t pt-6">
                  <h4 className="font-semibold">Thank You Message</h4>
                  <div>
                    <Label htmlFor="thankYouMessage">Thank You Text</Label>
                    <Input
                      id="thankYouMessage"
                      value={template.config.timeline?.afterMessage?.thankYou || ""}
                      onChange={(e) => updateConfig("timeline.afterMessage.thankYou", e.target.value)}
                      placeholder="Thank you for celebrating with us"
                    />
                  </div>
                  <div>
                    <Label htmlFor="thankYouNotes">Additional Notes</Label>
                    <Textarea
                      id="thankYouNotes"
                      value={template.config.timeline?.afterMessage?.notes || ""}
                      onChange={(e) => updateConfig("timeline.afterMessage.notes", e.target.value)}
                      placeholder="Your presence is our greatest gift"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RSVP Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>RSVP Settings</CardTitle>
                <CardDescription>Configure the RSVP form for your guests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rsvpTitle">RSVP Section Title</Label>
                  <Input
                    id="rsvpTitle"
                    value={template.config.rsvp?.title || ""}
                    onChange={(e) => updateConfig("rsvp.title", e.target.value)}
                    placeholder="Հարցաթերթիկ"
                  />
                </div>
                <div>
                  <Label htmlFor="rsvpDescription">RSVP Description</Label>
                  <Textarea
                    id="rsvpDescription"
                    value={template.config.rsvp?.description || ""}
                    onChange={(e) => updateConfig("rsvp.description", e.target.value)}
                    placeholder="Խնդրում ենք հաստատել ձեր մասնակցությունը մինչև Հոկտեմբերի 1-ը"
                    rows={2}
                  />
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Form Field Labels</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstNameLabel">First Name Label</Label>
                      <Input
                        id="firstNameLabel"
                        value={template.config.rsvp?.form?.firstName || ""}
                        onChange={(e) => updateConfig("rsvp.form.firstName", e.target.value)}
                        placeholder="Անուն"
                      />
                    </div>
                    <div>
                      <Label htmlFor="firstNamePlaceholder">First Name Placeholder</Label>
                      <Input
                        id="firstNamePlaceholder"
                        value={template.config.rsvp?.form?.firstNamePlaceholder || ""}
                        onChange={(e) => updateConfig("rsvp.form.firstNamePlaceholder", e.target.value)}
                        placeholder="Ձեր անունը"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastNameLabel">Last Name Label</Label>
                      <Input
                        id="lastNameLabel"
                        value={template.config.rsvp?.form?.lastName || ""}
                        onChange={(e) => updateConfig("rsvp.form.lastName", e.target.value)}
                        placeholder="Ազգանուն"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastNamePlaceholder">Last Name Placeholder</Label>
                      <Input
                        id="lastNamePlaceholder"
                        value={template.config.rsvp?.form?.lastNamePlaceholder || ""}
                        onChange={(e) => updateConfig("rsvp.form.lastNamePlaceholder", e.target.value)}
                        placeholder="Ձեր ազգանունը"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emailLabel">Email Label</Label>
                      <Input
                        id="emailLabel"
                        value={template.config.rsvp?.form?.email || ""}
                        onChange={(e) => updateConfig("rsvp.form.email", e.target.value)}
                        placeholder="Էլ․ հասցե"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emailPlaceholder">Email Placeholder</Label>
                      <Input
                        id="emailPlaceholder"
                        value={template.config.rsvp?.form?.emailPlaceholder || ""}
                        onChange={(e) => updateConfig("rsvp.form.emailPlaceholder", e.target.value)}
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestCountLabel">Guest Count Label</Label>
                      <Input
                        id="guestCountLabel"
                        value={template.config.rsvp?.form?.guestCount || ""}
                        onChange={(e) => updateConfig("rsvp.form.guestCount", e.target.value)}
                        placeholder="Հյուրերի քանակ"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestCountPlaceholder">Guest Count Placeholder</Label>
                      <Input
                        id="guestCountPlaceholder"
                        value={template.config.rsvp?.form?.guestCountPlaceholder || ""}
                        onChange={(e) => updateConfig("rsvp.form.guestCountPlaceholder", e.target.value)}
                        placeholder="Ընտրեք հյուրերի քանակը"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestNamesLabel">Guest Names Label</Label>
                      <Input
                        id="guestNamesLabel"
                        value={template.config.rsvp?.form?.guestNames || ""}
                        onChange={(e) => updateConfig("rsvp.form.guestNames", e.target.value)}
                        placeholder="Հյուրերի անունները և ազգանունները"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestNamesPlaceholder">Guest Names Placeholder</Label>
                      <Input
                        id="guestNamesPlaceholder"
                        value={template.config.rsvp?.form?.guestNamesPlaceholder || ""}
                        onChange={(e) => updateConfig("rsvp.form.guestNamesPlaceholder", e.target.value)}
                        placeholder="Նշեք բոլոր հյուրերի անունները և ազգանունները"
                      />
                    </div>
                    <div>
                      <Label htmlFor="attendanceLabel">Attendance Label</Label>
                      <Input
                        id="attendanceLabel"
                        value={template.config.rsvp?.form?.attendance || ""}
                        onChange={(e) => updateConfig("rsvp.form.attendance", e.target.value)}
                        placeholder="Մասնակցություն"
                      />
                    </div>
                    <div>
                      <Label htmlFor="attendingYes">Yes Attendance Text</Label>
                      <Input
                        id="attendingYes"
                        value={template.config.rsvp?.form?.attendingYes || ""}
                        onChange={(e) => updateConfig("rsvp.form.attendingYes", e.target.value)}
                        placeholder="Սիրով կմասնակցեմ 🤍"
                      />
                    </div>
                    <div>
                      <Label htmlFor="attendingNo">No Attendance Text</Label>
                      <Input
                        id="attendingNo"
                        value={template.config.rsvp?.form?.attendingNo || ""}
                        onChange={(e) => updateConfig("rsvp.form.attendingNo", e.target.value)}
                        placeholder="Ցավոք, չեմ կարող"
                      />
                    </div>
                    <div>
                      <Label htmlFor="submitButton">Submit Button Text</Label>
                      <Input
                        id="submitButton"
                        value={template.config.rsvp?.form?.submitButton || ""}
                        onChange={(e) => updateConfig("rsvp.form.submitButton", e.target.value)}
                        placeholder="Ուղարկել հաստատումը"
                      />
                    </div>
                    <div>
                      <Label htmlFor="submittingButton">Submitting Button Text</Label>
                      <Input
                        id="submittingButton"
                        value={template.config.rsvp?.form?.submittingButton || ""}
                        onChange={(e) => updateConfig("rsvp.form.submittingButton", e.target.value)}
                        placeholder="Ուղարկվում է..."
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photos Section */}
            <Card>
              <CardHeader>
                <CardTitle>Photos Section</CardTitle>
                <CardDescription>Configure the photo gallery section</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="photosTitle">Photos Section Title</Label>
                  <Input
                    id="photosTitle"
                    value={template.config.photos?.title || ""}
                    onChange={(e) => updateConfig("photos.title", e.target.value)}
                    placeholder="Նկարներ"
                  />
                </div>
                <div>
                  <Label htmlFor="photosDescription">Photos Description</Label>
                  <Input
                    id="photosDescription"
                    value={template.config.photos?.description || ""}
                    onChange={(e) => updateConfig("photos.description", e.target.value)}
                    placeholder="Կիսվեք ձեր նկարներով"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="uploadButton">Upload Button Text</Label>
                    <Input
                      id="uploadButton"
                      value={template.config.photos?.uploadButton || ""}
                      onChange={(e) => updateConfig("photos.uploadButton", e.target.value)}
                      placeholder="Ավելացնել նկար"
                    />
                  </div>
                  <div>
                    <Label htmlFor="downloadButton">Download Button Text</Label>
                    <Input
                      id="downloadButton"
                      value={template.config.photos?.downloadButton || ""}
                      onChange={(e) => updateConfig("photos.downloadButton", e.target.value)}
                      placeholder="Ներբեռնել նկարները"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="comingSoonMessage">Coming Soon Message</Label>
                  <Input
                    id="comingSoonMessage"
                    value={template.config.photos?.comingSoonMessage || ""}
                    onChange={(e) => updateConfig("photos.comingSoonMessage", e.target.value)}
                    placeholder="Նկարների հղումը կհասանելի լինի հարսանիքից հետո"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>Navigation Menu</CardTitle>
                <CardDescription>Configure the navigation menu items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="navHome">Home</Label>
                    <Input
                      id="navHome"
                      value={template.config.navigation?.home || ""}
                      onChange={(e) => updateConfig("navigation.home", e.target.value)}
                      placeholder="Գլխավոր"
                    />
                  </div>
                  <div>
                    <Label htmlFor="navCountdown">Countdown</Label>
                    <Input
                      id="navCountdown"
                      value={template.config.navigation?.countdown || ""}
                      onChange={(e) => updateConfig("navigation.countdown", e.target.value)}
                      placeholder="Հարսանիքին մնացել է․․․"
                    />
                  </div>
                  <div>
                    <Label htmlFor="navCalendar">Calendar</Label>
                    <Input
                      id="navCalendar"
                      value={template.config.navigation?.calendar || ""}
                      onChange={(e) => updateConfig("navigation.calendar", e.target.value)}
                      placeholder="Օրացույց"
                    />
                  </div>
                  <div>
                    <Label htmlFor="navLocations">Locations</Label>
                    <Input
                      id="navLocations"
                      value={template.config.navigation?.locations || ""}
                      onChange={(e) => updateConfig("navigation.locations", e.target.value)}
                      placeholder="Վայրեր"
                    />
                  </div>
                  <div>
                    <Label htmlFor="navTimeline">Timeline</Label>
                    <Input
                      id="navTimeline"
                      value={template.config.navigation?.timeline || ""}
                      onChange={(e) => updateConfig("navigation.timeline", e.target.value)}
                      placeholder="Ծրագիր"
                    />
                  </div>
                  <div>
                    <Label htmlFor="navRsvp">RSVP</Label>
                    <Input
                      id="navRsvp"
                      value={template.config.navigation?.rsvp || ""}
                      onChange={(e) => updateConfig("navigation.rsvp", e.target.value)}
                      placeholder="Հաստատում"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Footer Settings</CardTitle>
                <CardDescription>Configure the footer message and content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="footerThankYou">Footer Thank You Message</Label>
                  <Textarea
                    id="footerThankYou"
                    value={template.config.footer?.thankYouMessage || ""}
                    onChange={(e) => updateConfig("footer.thankYouMessage", e.target.value)}
                    placeholder="Thank you for being part of our special day"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Theme Tab */}
          <TabsContent value="theme" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Palette className="w-5 h-5 inline mr-2" />
                  Colors & Styling
                </CardTitle>
                <CardDescription>Customize the look and feel of your wedding site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Primary Colors</h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={template.config.theme?.colors?.primary }
                            onChange={(e) => updateConfig("theme.colors.primary", e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            value={template.config.theme?.colors?.primary }
                            onChange={(e) => updateConfig("theme.colors.primary", e.target.value)}
                            placeholder="#1e3a8a"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={template.config.theme?.colors?.secondary }
                            onChange={(e) => updateConfig("theme.colors.secondary", e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            value={template.config.theme?.colors?.secondary }
                            onChange={(e) => updateConfig("theme.colors.secondary", e.target.value)}
                            placeholder="#ec4899"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="accentColor">Accent Color</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="accentColor"
                            type="color"
                            value={template.config.theme?.colors?.accent }
                            onChange={(e) => updateConfig("theme.colors.accent", e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            value={template.config.theme?.colors?.accent }
                            onChange={(e) => updateConfig("theme.colors.accent", e.target.value)}
                            placeholder="#f59e0b"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="backgroundColor">Background Color</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="backgroundColor"
                            type="color"
                            value={template.config.theme?.colors?.background }
                            onChange={(e) => updateConfig("theme.colors.background", e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            value={template.config.theme?.colors?.background }
                            onChange={(e) => updateConfig("theme.colors.background", e.target.value)}
                            placeholder="#ffffff"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Typography</h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="bodyFont">Body Font</Label>
                        <select
                          id="bodyFont"
                          value={template.config.theme?.fonts?.body || "Noto Sans Armenian"}
                          onChange={(e) => updateConfig("theme.fonts.body", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <optgroup label="Armenian Fonts">
                            <option value="Noto Sans Armenian">Noto Sans Armenian (Modern)</option>
                            <option value="Noto Serif Armenian">Noto Serif Armenian (Classic)</option>
                          </optgroup>
                          <optgroup label="Armenian-Compatible Fonts">
                            <option value="Roboto">Roboto (Clean & Modern)</option>
                            <option value="Open Sans">Open Sans (Highly Readable)</option>
                            <option value="Lato">Lato (Friendly & Professional)</option>
                            <option value="Montserrat">Montserrat (Geometric & Clean)</option>
                            <option value="Source Sans Pro">Source Sans Pro (Clean & Simple)</option>
                            <option value="PT Sans">PT Sans (Humanist & Warm)</option>
                            <option value="Ubuntu">Ubuntu (Modern & Rounded)</option>
                          </optgroup>
                          <optgroup label="Standard Fonts">
                            <option value="Inter">Inter (UI-Optimized)</option>
                            <option value="Playfair Display">Playfair Display (Elegant)</option>
                            <option value="Merriweather">Merriweather (Classic)</option>
                          </optgroup>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="headingFont">Heading Font</Label>
                        <select
                          id="headingFont"
                          value={template.config.theme?.fonts?.heading || "Noto Serif Armenian"}
                          onChange={(e) => updateConfig("theme.fonts.heading", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <optgroup label="Armenian Fonts">
                            <option value="Noto Serif Armenian">Noto Serif Armenian (Elegant)</option>
                            <option value="Noto Sans Armenian">Noto Sans Armenian (Modern)</option>
                          </optgroup>
                          <optgroup label="Armenian-Compatible Serif Fonts">
                            <option value="Playfair Display">Playfair Display (Elegant & Sophisticated)</option>
                            <option value="Merriweather">Merriweather (Classic & Readable)</option>
                          </optgroup>
                          <optgroup label="Armenian-Compatible Sans-Serif Fonts">
                            <option value="Montserrat">Montserrat (Bold & Geometric)</option>
                            <option value="Roboto">Roboto (Modern & Clean)</option>
                            <option value="Open Sans">Open Sans (Friendly & Professional)</option>
                            <option value="Lato">Lato (Warm & Humanist)</option>
                            <option value="Source Sans Pro">Source Sans Pro (Clean & Simple)</option>
                            <option value="PT Sans">PT Sans (Warm & Readable)</option>
                            <option value="Ubuntu">Ubuntu (Modern & Approachable)</option>
                          </optgroup>
                          <optgroup label="Standard Options">
                            <option value="Inter">Inter (UI-Optimized)</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-4">Preview</h4>
                  <div className="p-6 border rounded-lg" style={{
                    backgroundColor: template.config.theme?.colors?.background ,
                    fontFamily: `${template.config.theme?.fonts?.body || "Noto Sans Armenian"}, sans-serif`
                  }}>
                    <h3 
                      className="text-2xl font-bold mb-2"
                      style={{ 
                        color: template.config.theme?.colors?.primary ,
                        fontFamily: `${template.config.theme?.fonts?.heading || "Noto Serif Armenian"}, serif`
                      }}
                    >
                      {template.config.couple?.groomName || "Groom"} & {template.config.couple?.brideName || "Bride"}
                    </h3>
                    <p className="mb-4 text-gray-500">
                      Welcome to our wedding website! We're excited to celebrate with you.
                    </p>
                    <button
                      className="px-6 py-2 text-white font-medium rounded-lg"
                      style={{
                        backgroundColor: template.config.theme?.colors?.secondary 
                      }}
                    >
                      RSVP Now
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sections Tab */}
          <TabsContent value="sections" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Layout className="w-5 h-5" />
                  <CardTitle>Section Management</CardTitle>
                </div>
                <CardDescription>
                  Manage which sections appear on your wedding website and their order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SectionManager
                  config={template.config}
                  onConfigChange={(newConfig) => {
                    setTemplate(prev => prev ? { ...prev, config: newConfig } : null);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Music Tab */}
          <TabsContent value="music" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  <CardTitle>Background Music</CardTitle>
                </div>
                <CardDescription>
                  Upload and configure background music for your wedding website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Music Enable/Disable */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium">Enable Background Music</h4>
                    <p className="text-sm text-muted-foreground">
                      Allow guests to play background music on your wedding website
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={template.config.music?.enabled !== false}
                      onChange={(e) => {
                        const newConfig = {
                          ...template.config,
                          music: {
                            ...template.config.music,
                            enabled: e.target.checked,
                          }
                        };
                        setTemplate(prev => prev ? { ...prev, config: newConfig } : null);
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                  </label>
                </div>

                {/* Music Upload */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="music-upload">Upload Music (MP3)</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload a background music file in MP3 format (max 10MB)
                    </p>
                    <input
                      id="music-upload"
                      type="file"
                      accept="audio/mp3,audio/mpeg"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // Validate file size (10MB max)
                        if (file.size > 10 * 1024 * 1024) {
                          alert('File size must be less than 10MB');
                          return;
                        }

                        // Validate file type
                        if (!file.type.includes('audio')) {
                          alert('Please upload an audio file (MP3)');
                          return;
                        }

                        try {
                          const formData = new FormData();
                          formData.append('music', file);

                          const response = await fetch(`/api/templates/${template.id}/music/upload`, {
                            method: 'POST',
                            body: formData,
                          });

                          if (!response.ok) {
                            throw new Error('Upload failed');
                          }

                          const data = await response.json();
                          
                          // Update config with new music URL
                          const newConfig = {
                            ...template.config,
                            music: {
                              ...template.config.music,
                              audioUrl: data.url,
                              enabled: true,
                            }
                          };
                          setTemplate(prev => prev ? { ...prev, config: newConfig } : null);

                          alert('Music uploaded successfully!');
                        } catch (error) {
                          console.error('Music upload error:', error);
                          alert('Failed to upload music. Please try again.');
                        }
                      }}
                    />
                  </div>

                  {/* Current Music Display */}
                  {template.config.music?.audioUrl && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Music className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <h5 className="font-medium text-green-900">Music Uploaded</h5>
                          <p className="text-sm text-green-700">
                            {template.config.music.audioUrl.split('/').pop()}
                          </p>
                        </div>
                        <audio controls className="h-10">
                          <source src={template.config.music.audioUrl} type="audio/mpeg" />
                        </audio>
                      </div>
                    </div>
                  )}
                </div>

                {/* Music Settings */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="music-volume">Volume Level ({Math.round((template.config.music?.volume || 0.3) * 100)}%)</Label>
                    <input
                      id="music-volume"
                      type="range"
                      min="0"
                      max="100"
                      value={(template.config.music?.volume || 0.3) * 100}
                      onChange={(e) => {
                        const newConfig = {
                          ...template.config,
                          music: {
                            enabled: template.config.music?.enabled ?? true,
                            ...template.config.music,
                            volume: parseInt(e.target.value) / 100,
                          }
                        };
                        setTemplate(prev => prev ? { ...prev, config: newConfig } : null);
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={saveTemplate} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Music Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6">
            {/* Hero Banner Images */}
            <SectionImageUploader
              templateId={template.id}
              sectionType="hero"
              sectionTitle="Hero Banner"
              existingImages={template.config.hero?.images || []}
              onImagesUpdate={(images) => {
                // Update local state immediately for UI responsiveness
                const newConfig = {
                  ...template.config,
                  hero: {
                    ...template.config.hero,
                    images: images,
                  }
                };
                setTemplate(prev => prev ? { ...prev, config: newConfig } : null);
              }}
              maxImages={5}
            />

            {/* Love Story / Photo Section Images */}
            <SectionImageUploader
              templateId={template.id}
              sectionType="gallery"
              sectionTitle="Love Story Gallery"
              existingImages={template.config.photos?.images || []}
              onImagesUpdate={(images) => {
                // Update local state immediately for UI responsiveness
                const newConfig = {
                  ...template.config,
                  photos: {
                    ...template.config.photos,
                    images: images,
                  }
                };
                setTemplate(prev => prev ? { ...prev, config: newConfig } : null);
              }}
              maxImages={20}
            />

            {/* Image Gallery Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Gallery Settings</CardTitle>
                <CardDescription>
                  Configure how images are displayed on your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gallery-title">Gallery Title</Label>
                    <Input
                      id="gallery-title"
                      value={template.config.photos?.title || ""}
                      onChange={(e) => {
                        const newConfig = {
                          ...template.config,
                          photos: {
                            ...template.config.photos,
                            title: e.target.value,
                          }
                        };
                        setTemplate(prev => prev ? { ...prev, config: newConfig } : null);
                      }}
                      placeholder="Photo Gallery Title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gallery-description">Gallery Description</Label>
                    <Textarea
                      id="gallery-description"
                      value={template.config.photos?.description || ""}
                      onChange={(e) => {
                        const newConfig = {
                          ...template.config,
                          photos: {
                            ...template.config.photos,
                            description: e.target.value,
                          }
                        };
                        setTemplate(prev => prev ? { ...prev, config: newConfig } : null);
                      }}
                      placeholder="Describe your photo gallery..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={saveTemplate} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Gallery Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RSVPs Tab */}
          <TabsContent value="rsvps" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>RSVP Responses</CardTitle>
                    <CardDescription>Manage guest responses for this wedding</CardDescription>
                  </div>
                  <Button onClick={exportRsvpsToCSV} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{template.stats.totalRsvps}</div>
                    <div className="text-sm text-blue-600">Total Responses</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{template.stats.attending}</div>
                    <div className="text-sm text-green-600">Attending</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{template.stats.notAttending}</div>
                    <div className="text-sm text-red-600">Not Attending</div>
                  </div>
                </div>

                {/* RSVPs Table */}
                {rsvps.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Guests</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rsvps.map((rsvp) => (
                          <TableRow key={rsvp.id}>
                            <TableCell className="font-medium">
                              {rsvp.firstName} {rsvp.lastName}
                            </TableCell>
                            <TableCell>{rsvp.email}</TableCell>
                            <TableCell>{rsvp.guestCount}</TableCell>
                            <TableCell>
                              {rsvp.attendance === "attending" ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Attending
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Not Attending
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(rsvp.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No RSVP responses yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Email Settings */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Mail className="w-5 h-5 inline mr-2" />
                  Email Settings
                </CardTitle>
                <CardDescription>Configure email notifications and customization for this template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="ownerEmail">Owner Email Address</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={template.config.email?.ownerEmail || ""}
                    onChange={(e) => updateConfig("email.ownerEmail", e.target.value)}
                    placeholder="owner@4ever.am"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Primary email address to receive RSVP notifications. This overrides the default notification recipients.
                  </p>
                </div>

                <div>
                  <Label htmlFor="additionalRecipients">Additional Recipients (Optional)</Label>
                  <Textarea
                    id="additionalRecipients"
                    value={template.config.email?.recipients?.join(", ") || ""}
                    onChange={(e) => {
                      const emails = e.target.value
                        .split(",")
                        .map(email => email.trim())
                        .filter(email => email.length > 0);
                      updateConfig("email.recipients", emails);
                    }}
                    placeholder="email1@example.com, email2@example.com"
                    rows={2}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Additional email addresses to receive RSVP notifications. Separate multiple emails with commas.
                  </p>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-4">Email Branding</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="senderName">Sender Name</Label>
                      <Input
                        id="senderName"
                        value={template.config.email?.senderName || ""}
                        onChange={(e) => updateConfig("email.senderName", e.target.value)}
                        placeholder="Wedding Invitation"
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        The name that appears as the email sender (e.g., "John & Jane Wedding")
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="replyToEmail">Reply-To Email (Optional)</Label>
                      <Input
                        id="replyToEmail"
                        type="email"
                        value={template.config.email?.replyTo || ""}
                        onChange={(e) => updateConfig("email.replyTo", e.target.value)}
                        placeholder="contact@4ever.am"
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Email address where guests can reply to notifications
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-4">RSVP Notification Email</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="notificationSubject">Email Subject</Label>
                      <Input
                        id="notificationSubject"
                        value={template.config.email?.templates?.notification?.subject || ""}
                        onChange={(e) => updateConfig("email.templates.notification.subject", e.target.value)}
                        placeholder="New RSVP Response - {guestName}"
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Available variables: {"{guestName}"}, {"{weddingDate}"}, {"{coupleNames}"}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="notificationHeader">Header Message</Label>
                      <Textarea
                        id="notificationHeader"
                        value={template.config.email?.templates?.notification?.header || ""}
                        onChange={(e) => updateConfig("email.templates.notification.header", e.target.value)}
                        placeholder="You have a new RSVP response for your wedding!"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="notificationFooter">Footer Message</Label>
                      <Textarea
                        id="notificationFooter"
                        value={template.config.email?.templates?.notification?.footer || ""}
                        onChange={(e) => updateConfig("email.templates.notification.footer", e.target.value)}
                        placeholder="Manage your wedding responses at your admin dashboard."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-4">Guest Confirmation Email</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="confirmationSubject">Email Subject</Label>
                      <Input
                        id="confirmationSubject"
                        value={template.config.email?.templates?.confirmation?.subject || ""}
                        onChange={(e) => updateConfig("email.templates.confirmation.subject", e.target.value)}
                        placeholder="Thank you for your RSVP - {coupleNames} - {weddingDate}"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmationGreeting">Greeting Message</Label>
                      <Textarea
                        id="confirmationGreeting"
                        value={template.config.email?.templates?.confirmation?.greeting || ""}
                        onChange={(e) => updateConfig("email.templates.confirmation.greeting", e.target.value)}
                        placeholder="Dear {guestName}, thank you for your RSVP!"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="attendingMessage">Message for Attending Guests</Label>
                      <Textarea
                        id="attendingMessage"
                        value={template.config.email?.templates?.confirmation?.attendingMessage || ""}
                        onChange={(e) => updateConfig("email.templates.confirmation.attendingMessage", e.target.value)}
                        placeholder="We're so excited that you'll be joining us for our special day! 💕"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="notAttendingMessage">Message for Non-Attending Guests</Label>
                      <Textarea
                        id="notAttendingMessage"
                        value={template.config.email?.templates?.confirmation?.notAttendingMessage || ""}
                        onChange={(e) => updateConfig("email.templates.confirmation.notAttendingMessage", e.target.value)}
                        placeholder="We're sorry you can't make it, but we understand. We'll be thinking of you! 💙"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmationFooter">Footer Message</Label>
                      <Textarea
                        id="confirmationFooter"
                        value={template.config.email?.templates?.confirmation?.footer || ""}
                        onChange={(e) => updateConfig("email.templates.confirmation.footer", e.target.value)}
                        placeholder="If you have any questions, feel free to contact us."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-4">Email Theme</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emailPrimaryColor">Primary Email Color</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="emailPrimaryColor"
                          type="color"
                          value={template.config.email?.theme?.primaryColor || template.config.theme?.colors?.primary || "#E4A5B8"}
                          onChange={(e) => updateConfig("email.theme.primaryColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={template.config.email?.theme?.primaryColor || template.config.theme?.colors?.primary || "#E4A5B8"}
                          onChange={(e) => updateConfig("email.theme.primaryColor", e.target.value)}
                          placeholder="#E4A5B8"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="emailSecondaryColor">Secondary Email Color</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="emailSecondaryColor"
                          type="color"
                          value={template.config.email?.theme?.secondaryColor || template.config.theme?.colors?.secondary || "#666666"}
                          onChange={(e) => updateConfig("email.theme.secondaryColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={template.config.email?.theme?.secondaryColor || template.config.theme?.colors?.secondary || "#666666"}
                          onChange={(e) => updateConfig("email.theme.secondaryColor", e.target.value)}
                          placeholder="#666666"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="emailFont">Email Font Family</Label>
                    <select
                      id="emailFont"
                      value={template.config.email?.theme?.fontFamily || "Arial"}
                      onChange={(e) => updateConfig("email.theme.fontFamily", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="Arial">Arial (Universal)</option>
                      <option value="Helvetica">Helvetica (Clean)</option>
                      <option value="Georgia">Georgia (Elegant)</option>
                      <option value="Times">Times (Classic)</option>
                      <option value="Verdana">Verdana (Readable)</option>
                      <option value="Tahoma">Tahoma (Modern)</option>
                    </select>
                    <p className="text-sm text-gray-600 mt-1">
                      Choose a web-safe font that works across all email clients
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Template Settings</CardTitle>
                <CardDescription>Configure general settings for this template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance">Maintenance Mode</Label>
                    <p className="text-sm text-gray-600">Temporarily disable public access to this template</p>
                  </div>
                  <Switch
                    id="maintenance"
                    checked={template.maintenance}
                    onCheckedChange={(checked) => setTemplate({ ...template, maintenance: checked })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    value={template.name}
                    onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

