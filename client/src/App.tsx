import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
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
import TranslationsPage from "@/pages/platform-translations";
import NotFound from "@/pages/not-found";
import TypingLoader from "@/components/TypingLoader";
import PlatformDashboard from "@/pages/platform-dashboard";
import TemplateRenderer from "@/components/template-renderer";
import TemplateAdminPanel from "@/components/template-admin-panel";
import TemplateIdentifierGuard from "@/components/TemplateIdentifierGuard";
import ComingSoon from "@/pages/coming-soon";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
      <Route path="/platform/translations" component={TranslationsPage} />
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

// AppContent lives inside LanguageProvider so it can use useLanguage().
// It blocks rendering with TypingLoader until BOTH DB translations AND
// the maintenance check are complete — preventing any flash of default text.
function AppContent() {
  const { isLoading: translationsLoading } = useLanguage();
  const [location] = useLocation();
  const [maintenanceBypassed, setMaintenanceBypassed] = useState(false);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceChecked, setMaintenanceChecked] = useState(false);

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const response = await fetch("/api/maintenance");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setMaintenanceEnabled(data.enabled);
        const bypassKey = localStorage.getItem("maintenance-bypass");
        const urlParams = new URLSearchParams(window.location.search);
        if (bypassKey === "true" || urlParams.get("preview") === "true") {
          setMaintenanceBypassed(true);
        }
      } catch (error) {
        console.warn("Maintenance check failed, allowing access:", error);
        setMaintenanceEnabled(false);
      } finally {
        setMaintenanceChecked(true);
      }
    };
    checkMaintenanceStatus();
  }, []);

  // Block until BOTH translations from DB are loaded AND maintenance is checked
  if (translationsLoading || !maintenanceChecked) {
    return <TypingLoader />;
  }

  const isAdminRoute = location === "/admin";
  const shouldShowMaintenance = maintenanceEnabled && !maintenanceBypassed && !isAdminRoute;

  if (shouldShowMaintenance) {
    return (
      <MaintenanceMode
        onPasswordCorrect={() => {
          setMaintenanceBypassed(true);
          localStorage.setItem("maintenance-bypass", "true");
        }}
      />
    );
  }

  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ArmenianFontProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </TooltipProvider>
        </LanguageProvider>
      </ArmenianFontProvider>
    </QueryClientProvider>
  );
}

export default App;
