import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Shield, Users } from "lucide-react";

export function AdminPanel() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (authenticated) {
      loadData();
    }
  }, [authenticated]);

  const loadData = async () => {
    try {
      const [maintenanceResponse, rsvpResponse] = await Promise.all([
        fetch("/api/maintenance"),
        fetch("/api/rsvps")
      ]);
      
      const maintenanceData = await maintenanceResponse.json();
      const rsvpData = await rsvpResponse.json();
      
      setMaintenanceEnabled(maintenanceData.enabled);
      setRsvpCount(rsvpData.length);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    }
  };

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "haruttev2025admin") {
      setAuthenticated(true);
      toast({
        title: "Authentication successful",
        description: "Welcome to admin panel",
      });
    } else {
      toast({
        title: "Authentication failed",
        description: "Wrong password",
        variant: "destructive",
      });
    }
  };

  const handleMaintenanceToggle = async (enabled: boolean) => {
    setLoading(true);
    try {
      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled,
          password: "haruttev2025admin"
        }),
      });

      if (response.ok) {
        setMaintenanceEnabled(enabled);
        toast({
          title: enabled ? "Maintenance mode enabled" : "Maintenance mode disabled",
          description: enabled 
            ? "Website is now in maintenance mode" 
            : "Website is now accessible to public",
        });
      } else {
        throw new Error("Failed to update maintenance mode");
      }
    } catch (error) {
      console.error("Failed to toggle maintenance mode:", error);
      toast({
        title: "Error",
        description: "Failed to update maintenance mode",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearMaintenanceBypass = () => {
    localStorage.removeItem("maintenance-bypass");
    toast({
      title: "Bypass cleared",
      description: "Maintenance bypass has been cleared",
    });
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100 to-gold-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-gold-500 mx-auto mb-2" />
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>Wedding Website Admin Panel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuthenticate} className="space-y-4">
              <Input
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="admin-password-input"
                autoFocus
              />
              <Button type="submit" className="w-full" data-testid="admin-login-button">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100 to-gold-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-playfair font-bold text-charcoal-900">
            Admin Panel
          </h1>
          <p className="text-charcoal-600">
            Հարություն & Տաթև Wedding Website Control
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RSVP Count</CardTitle>
              <Users className="h-4 w-4 text-gold-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold-600">{rsvpCount}</div>
              <p className="text-xs text-charcoal-500">Total responses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Website Status</CardTitle>
              <Settings className="h-4 w-4 text-gold-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold-600">
                {maintenanceEnabled ? "Maintenance" : "Live"}
              </div>
              <p className="text-xs text-charcoal-500">Current status</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Days Until Wedding</CardTitle>
              <Shield className="h-4 w-4 text-gold-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold-600">
                {Math.ceil((new Date("2025-10-10").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <p className="text-xs text-charcoal-500">October 10, 2025</p>
            </CardContent>
          </Card>
        </div>

        {/* Maintenance Control */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Mode Control</CardTitle>
            <CardDescription>
              Toggle website access for visitors. You can still preview with the password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Maintenance Mode</label>
                <p className="text-sm text-charcoal-500">
                  {maintenanceEnabled 
                    ? "Website is currently hidden from visitors" 
                    : "Website is publicly accessible"
                  }
                </p>
              </div>
              <Switch
                checked={maintenanceEnabled}
                onCheckedChange={handleMaintenanceToggle}
                disabled={loading}
                data-testid="maintenance-toggle"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => window.open("/", "_blank")}
                className="flex-1"
                data-testid="preview-website"
              >
                Preview Website
              </Button>
              <Button
                variant="outline"
                onClick={clearMaintenanceBypass}
                className="flex-1"
                data-testid="clear-bypass"
              >
                Clear Bypass
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              onClick={() => window.open("/api/rsvps", "_blank")}
              className="w-full justify-start"
              data-testid="view-rsvps"
            >
              <Users className="w-4 h-4 mr-2" />
              View All RSVPs
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem("maintenance-bypass");
                window.location.href = "/";
              }}
              className="w-full justify-start"
              data-testid="logout-admin"
            >
              <Shield className="w-4 h-4 mr-2" />
              Exit Admin & Test as Visitor
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}