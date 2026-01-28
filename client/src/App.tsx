import { useState, useEffect, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ArmenianFontProvider } from "@/components/ArmenianFontProvider";
import { MaintenanceMode } from "@/components/maintenance-mode";
import { AdminPanel } from "@/components/admin-panel";
import { AdminProvider, LoginForm, AdminDashboard, ProtectedRoute, AdminAccess } from "@/components/admin";
import { PlatformAdminPanel } from "@/components/platform-admin/PlatformAdminPanel";
import { PlatformAdminLogin } from "@/components/platform-admin/PlatformAdminLogin";
import { TemplateAdminLogin } from "@/components/admin/TemplateAdminLogin";
import { TemplateAdminDashboard } from "@/components/admin/TemplateAdminDashboard";
import { weddingConfig } from "@/config/wedding-config";
import Home from "@/pages/home";
import MainPage from "@/pages/main";
import PhotosPage from "@/pages/photos";
import TemplatesPage from "@/pages/templates";
import NotFound from "@/pages/not-found";
import LoadingScreen from "@/components/loading-screen";
import PlatformDashboard from "@/pages/platform-dashboard";
import PlatformTranslations from "@/pages/platform-translations";
import TemplateRenderer from "@/components/template-renderer";
import TemplateAdminPanel from "@/components/template-admin-panel";
import TemplateIdentifierGuard from "@/components/TemplateIdentifierGuard";

function Router() {
  return (
    <Switch>
      {/* Main landing page */}
      <Route path="/" component={MainPage} />
      
      {/* Templates showcase page */}
      <Route path="/templates" component={TemplatesPage} />
      
      {/* Platform Owner Admin Panel */}
      <Route path="/platform-admin/login" component={PlatformAdminLogin} />
      <Route path="/platform-admin" component={PlatformAdminPanel} />
      
      {/* User Management System for Ultimate Customers */}
      <Route path="/admin/access" component={AdminAccess} />
      <Route path="/admin/login">
        {() => (
          <AdminProvider>
            <LoginForm onLogin={() => {}} />
          </AdminProvider>
        )}
      </Route>
      <Route path="/admin/dashboard">
        {() => (
          <AdminProvider>
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          </AdminProvider>
        )}
      </Route>
      
      {/* Template-specific admin routes - must come before other catch-all routes */}
      <Route path="/:templateSlug/admin/dashboard">
        {(params) => <TemplateAdminDashboard templateSlug={params.templateSlug} />}
      </Route>
      <Route path="/:templateSlug/admin">
        {(params) => <TemplateAdminLogin templateSlug={params.templateSlug} />}
      </Route>
      
      {/* Platform admin routes */}
      <Route path="/platform" component={PlatformDashboard} />
      <Route path="/platform/translations" component={PlatformTranslations} />
      <Route path="/platform/templates/:templateId" component={TemplateAdminPanel} />
      
      {/* Legacy routes for backward compatibility */}
      <Route path="/photos" component={PhotosPage} />
      <Route path="/admin" component={AdminPanel} />
      
      {/* Dynamic template routes */}
      <Route path="/template/:templateId" component={TemplateRenderer} />
      
      {/* Template identifier route (clean URLs without prefix) */}
      <Route path="/:templateIdentifier" component={TemplateIdentifierGuard} />
      
      {/* Catch-all */}
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
    const checkMaintenanceStatus = async () => {
      try {
        const response = await fetch("/api/maintenance");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
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
        // If maintenance check fails, don't block the app - just log and continue
        console.warn("Maintenance check failed, allowing access:", error);
        setMaintenanceEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceStatus();
    // Quick fallback - if API takes too long, don't block the user
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const handlePasswordCorrect = () => {
    setMaintenanceBypassed(true);
    localStorage.setItem("maintenance-bypass", "true");
  };

  // Show maintenance mode if enabled and not bypassed, but allow admin panel access
  const isAdminRoute = location === "/admin";
  const shouldShowMaintenance = maintenanceEnabled && !maintenanceBypassed && !isAdminRoute;

  // Show minimal loading state only if really needed
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
      </div>
    );
  }

  if (shouldShowMaintenance) {
    return (
      <QueryClientProvider client={queryClient}>
        <ArmenianFontProvider>
          <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <MaintenanceMode onPasswordCorrect={handlePasswordCorrect} />
            </TooltipProvider>
          </LanguageProvider>
        </ArmenianFontProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ArmenianFontProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ArmenianFontProvider>
    </QueryClientProvider>
  );
}

export default App;
