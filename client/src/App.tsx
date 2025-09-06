import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MaintenanceMode } from "@/components/maintenance-mode";
import { AdminPanel } from "@/components/admin-panel";
import { weddingConfig } from "@/config/wedding-config";
import Home from "@/pages/home";
import PhotosPage from "@/pages/photos";
import NotFound from "@/pages/not-found";
import LoadingScreen from "@/components/loading-screen";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/photos" component={PhotosPage} />
      <Route path="/admin" component={AdminPanel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const [maintenanceBypassed, setMaintenanceBypassed] = useState(false);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check maintenance status from server and bypass conditions
  useEffect(() => {
    const checkMaintenanceStatus = async (retryCount = 0) => {
      try {
        const response = await fetch("/api/maintenance");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        setMaintenanceEnabled(data.enabled);
        console.log("🔧 Maintenance status loaded:", data.enabled);

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
        
        // Retry once after 2 seconds if first attempt fails
        if (retryCount === 0) {
          console.log("🔄 Retrying maintenance status check...");
          setTimeout(() => checkMaintenanceStatus(1), 2000);
          return;
        }
        
        // Don't change maintenance state on API failure to prevent automatic turn-off
        console.warn("⚠️ Keeping current maintenance state due to API failure");
      } finally {
        if (retryCount > 0) setLoading(false);
      }
    };

    checkMaintenanceStatus();
    setTimeout(() => setLoading(false), 5000); // Failsafe timeout
  }, []);

  const handlePasswordCorrect = () => {
    setMaintenanceBypassed(true);
    localStorage.setItem("maintenance-bypass", "true");
  };

  // Show maintenance mode if enabled and not bypassed, but allow admin panel access
  const isAdminRoute = location === "/admin";
  const shouldShowMaintenance = maintenanceEnabled && !maintenanceBypassed && !isAdminRoute;

  // Show loading state while checking maintenance status
  if (loading) {
    return <LoadingScreen />;
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
