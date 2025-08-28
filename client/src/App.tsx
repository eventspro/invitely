import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MaintenanceMode } from "@/components/maintenance-mode";
import { AdminPanel } from "@/components/admin-panel";
import { weddingConfig } from "@/config/wedding-config";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminPanel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [maintenanceBypassed, setMaintenanceBypassed] = useState(false);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check maintenance status from server and bypass conditions
  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const response = await fetch("/api/maintenance");
        const data = await response.json();
        setMaintenanceEnabled(data.enabled);

        // Check bypass conditions
        const bypassKey = localStorage.getItem("maintenance-bypass");
        const urlParams = new URLSearchParams(window.location.search);
        const previewParam = urlParams.get("preview");
        
        // Allow bypass with URL parameter or localStorage
        if (bypassKey === "true" || previewParam === "true") {
          setMaintenanceBypassed(true);
        }
      } catch (error) {
        console.error("Failed to check maintenance status:", error);
        // Fallback to config if API fails
        setMaintenanceEnabled(weddingConfig.maintenance.enabled);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceStatus();
  }, []);

  const handlePasswordCorrect = () => {
    setMaintenanceBypassed(true);
    localStorage.setItem("maintenance-bypass", "true");
  };

  // Show maintenance mode if enabled and not bypassed
  const shouldShowMaintenance = maintenanceEnabled && !maintenanceBypassed;

  // Show loading state while checking maintenance status
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100 to-gold-50 flex items-center justify-center">
        <div className="text-gold-600 text-lg">...</div>
      </div>
    );
  }

  if (shouldShowMaintenance) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <MaintenanceMode onPasswordCorrect={handlePasswordCorrect} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
