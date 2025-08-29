import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Settings, Shield, Users, Download, Mail, Calendar, CheckCircle, XCircle } from "lucide-react";

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

export function AdminPanel() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [attendingCount, setAttendingCount] = useState(0);
  const [notAttendingCount, setNotAttendingCount] = useState(0);
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
      setRsvps(rsvpData);
      setRsvpCount(rsvpData.length);
      
      // Calculate attendance statistics
      const attending = rsvpData.filter((rsvp: Rsvp) => rsvp.attendance === "attending").length;
      const notAttending = rsvpData.filter((rsvp: Rsvp) => rsvp.attendance === "not-attending").length;
      
      setAttendingCount(attending);
      setNotAttendingCount(notAttending);
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

  const exportToCSV = () => {
    if (rsvps.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no RSVP responses to export",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "First Name",
      "Last Name", 
      "Email",
      "Guest Count",
      "Guest Names",
      "Attendance",
      "Submitted Date"
    ];

    const csvContent = [
      headers.join(","),
      ...rsvps.map(rsvp => [
        `"${rsvp.firstName}"`,
        `"${rsvp.lastName}"`,
        `"${rsvp.email}"`,
        `"${rsvp.guestCount}"`,
        `"${rsvp.guestNames || ''}"`,
        `"${rsvp.attendance === 'attending' ? 'Attending' : 'Not Attending'}"`,
        `"${new Date(rsvp.createdAt).toLocaleDateString()}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wedding-rsvps-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Exported ${rsvps.length} RSVP responses to CSV`,
    });
  };

  const sendEmailReminders = async () => {
    const emailList = rsvps.map(rsvp => rsvp.email).join(', ');
    
    // Copy to clipboard for now - real email integration would require more setup
    try {
      await navigator.clipboard.writeText(emailList);
      toast({
        title: "Email addresses copied",
        description: `${rsvps.length} email addresses copied to clipboard. You can use these to send reminders via your preferred email service.`,
      });
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = emailList;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Email addresses copied",
        description: `${rsvps.length} email addresses copied to clipboard`,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total RSVPs</CardTitle>
              <Users className="h-4 w-4 text-gold-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold-600">{rsvpCount}</div>
              <p className="text-xs text-charcoal-500">Total responses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attending</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{attendingCount}</div>
              <p className="text-xs text-charcoal-500">Will attend</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Not Attending</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{notAttendingCount}</div>
              <p className="text-xs text-charcoal-500">Cannot attend</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Days Until Wedding</CardTitle>
              <Calendar className="h-4 w-4 text-gold-500" />
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

        {/* RSVP Management */}
        <Card>
          <CardHeader>
            <CardTitle>RSVP Responses</CardTitle>
            <CardDescription>
              Manage wedding guest responses and send reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={exportToCSV}
                disabled={rsvps.length === 0}
                className="flex-1"
                data-testid="export-csv"
              >
                <Download className="w-4 h-4 mr-2" />
                Export to CSV ({rsvps.length})
              </Button>
              <Button
                variant="outline"
                onClick={sendEmailReminders}
                disabled={rsvps.length === 0}
                className="flex-1"
                data-testid="copy-emails"
              >
                <Mail className="w-4 h-4 mr-2" />
                Copy Email Addresses
              </Button>
            </div>

            {/* RSVP Table */}
            {rsvps.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Guest Names</TableHead>
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
                        <TableCell className="text-sm text-charcoal-600">
                          {rsvp.email}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gold-100 text-gold-800">
                            {rsvp.guestCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm max-w-48 truncate">
                          {rsvp.guestNames || "-"}
                        </TableCell>
                        <TableCell>
                          {rsvp.attendance === "attending" ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Attending
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Not Attending
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-charcoal-600">
                          {formatDate(rsvp.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-charcoal-300 mx-auto mb-2" />
                <p className="text-charcoal-500">No RSVP responses yet</p>
                <p className="text-sm text-charcoal-400">Guest responses will appear here</p>
              </div>
            )}
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
              onClick={() => window.open("/", "_blank")}
              className="w-full justify-start"
              data-testid="preview-website"
            >
              <Shield className="w-4 h-4 mr-2" />
              Preview Website
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
              <Settings className="w-4 h-4 mr-2" />
              Exit Admin & Test as Visitor
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}