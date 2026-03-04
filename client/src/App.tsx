import { useState } from "react";
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
import Home from "@/pages/home";
import MainPage from "@/pages/main";
import PhotosPage from "@/pages/photos";
import TemplatesPage from "@/pages/templates";
import TranslationsPage from "@/pages/platform-translations";
import NotFound from "@/pages/not-found";
import PlatformDashboard from "@/pages/platform-dashboard";
import TemplateRenderer from "@/components/template-renderer";
import TemplateAdminPanel from "@/components/template-admin-panel";
import TemplateIdentifierGuard from "@/components/TemplateIdentifierGuard";
import ComingSoon from "@/pages/coming-soon";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BootstrapProvider } from "@/contexts/BootstrapContext";

// ─── Bootstrap data contract (shared with main.tsx via export) ────────────────
export interface BootstrapData {
  translations: Record<string, any>;
  templates: any[];           // raw /api/templates payload pre-fetched at boot
  maintenanceEnabled: boolean;
  maintenanceBypassed: boolean;
}

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

// AppContent receives pre-fetched maintenance data — no async gap, no null flash.
function AppContent({
  maintenanceEnabled,
  maintenanceBypassed: initialBypassed,
}: {
  maintenanceEnabled: boolean;
  maintenanceBypassed: boolean;
}) {
  const [location] = useLocation();
  const [maintenanceBypassed, setMaintenanceBypassed] = useState(initialBypassed);

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

// App receives fully-resolved bootstrap data from main.tsx.
// By the time this component mounts, translations + maintenance + templates are already loaded.
function App({ bootstrapData }: { bootstrapData: BootstrapData }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ArmenianFontProvider>
        <BootstrapProvider data={bootstrapData}>
          <LanguageProvider prefetchedData={bootstrapData.translations}>
            <TooltipProvider>
              <Toaster />
              <ErrorBoundary>
                <AppContent
                  maintenanceEnabled={bootstrapData.maintenanceEnabled}
                  maintenanceBypassed={bootstrapData.maintenanceBypassed}
                />
              </ErrorBoundary>
            </TooltipProvider>
          </LanguageProvider>
        </BootstrapProvider>
      </ArmenianFontProvider>
    </QueryClientProvider>
  );
}

export default App;
