import { useState, lazy, Suspense, type ReactNode } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ArmenianFontProvider } from "@/components/ArmenianFontProvider";
import HomepagePrototype from "@/pages/homepage-prototype";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BootstrapProvider } from "@/contexts/BootstrapContext";

// ─── Bootstrap data contract (shared with main.tsx via export) ────────────────
export interface BootstrapData {
  translations: Record<string, any>;
  templates: any[];           // kept for legacy consumers; not fetched during homepage bootstrap
  maintenanceEnabled: boolean;
  maintenanceBypassed: boolean;
  initialLanguage: string;   // preferred-language from localStorage, resolved before React mounts
}

const LazyTranslationsPrototype = lazy(() => import("@/pages/translations-prototype/TranslationsPrototypePage"));
const LazyMaintenanceMode = lazy(() => import("@/components/maintenance-mode").then((m) => ({ default: m.MaintenanceMode })));
const LazyPlannerPrototype = lazy(() => import("@/pages/planner-prototype/PlannerPrototypePage"));
const LazyPlannerDemo = lazy(() => import("@/pages/planner-demo/PlannerDemoPage"));
const LazyPlannerLoginPage = lazy(() => import("@/pages/planner/PlannerLoginPage"));
const LazyPlannerPage = lazy(() => import("@/pages/planner/PlannerPage"));
const LazyTemplatesPage = lazy(() => import("@/pages/templates"));
const LazyPlatformDashboard = lazy(() => import("@/pages/platform-dashboard"));
const LazyPlatformTranslations = lazy(() => import("@/pages/platform-translations"));
const LazyBuilderV2Page = lazy(() => import("@/pages/builder-v2/BuilderV2Page"));
const LazyTemplateAdminPanel = lazy(() => import("@/components/template-admin-panel"));
const LazyTemplateRenderer = lazy(() => import("@/components/template-renderer"));
const LazyTemplateIdentifierGuard = lazy(() => import("@/components/TemplateIdentifierGuard"));
const LazyPhotosPage = lazy(() => import("@/pages/photos"));
const LazyNotFound = lazy(() => import("@/pages/not-found"));
const LazyAdminPanel = lazy(() => import("@/components/admin-panel").then((m) => ({ default: m.AdminPanel })));
const LazyAdminAccess = lazy(() => import("@/components/admin/AdminAccess").then((m) => ({ default: m.AdminAccess })));
const LazyPlatformAdminPanel = lazy(() => import("@/components/platform-admin/PlatformAdminPanel").then((m) => ({ default: m.PlatformAdminPanel })));
const LazyPlatformAdminLogin = lazy(() => import("@/components/platform-admin/PlatformAdminLogin").then((m) => ({ default: m.PlatformAdminLogin })));
const LazyTemplateAdminLogin = lazy(() => import("@/components/admin/TemplateAdminLogin").then((m) => ({ default: m.TemplateAdminLogin })));
const LazyTemplateAdminDashboard = lazy(() => import("@/components/admin/TemplateAdminDashboard").then((m) => ({ default: m.TemplateAdminDashboard })));
const LazyDemoLandingPage = lazy(() => import("@/pages/demo/DemoLandingPage"));
const LazyDemoSetupPage = lazy(() => import("@/pages/demo/DemoSetupPage"));
const LazyDemoEditorPage = lazy(() => import("@/pages/demo/DemoEditorPage"));
const LazyDemoFinalPage = lazy(() => import("@/pages/demo/DemoFinalPage"));
const LazyAdminLoginRoute = lazy(async () => {
  const [{ AdminProvider }, { LoginForm }] = await Promise.all([
    import("@/components/admin/AdminContext"),
    import("@/components/admin/LoginForm"),
  ]);
  return {
    default: function AdminLoginRoute() {
      return (
        <AdminProvider>
          <LoginForm onLogin={() => {}} />
        </AdminProvider>
      );
    },
  };
});
const LazyAdminDashboardRoute = lazy(async () => {
  const [{ AdminProvider }, { ProtectedRoute }, { AdminDashboard }] = await Promise.all([
    import("@/components/admin/AdminContext"),
    import("@/components/admin/ProtectedRoute"),
    import("@/components/admin/AdminDashboard"),
  ]);
  return {
    default: function AdminDashboardRoute() {
      return (
        <AdminProvider>
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        </AdminProvider>
      );
    },
  };
});

function RouteLoading({
  label = "Loading...",
  background = "#fff8ef",
  color = "#173c2d",
}: {
  label?: string;
  background?: string;
  color?: string;
}) {
  return (
    <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background, color }}>
      {label}
    </div>
  );
}

function LazyRoute({
  children,
  label,
  background,
  color,
}: {
  children: ReactNode;
  label?: string;
  background?: string;
  color?: string;
}) {
  return (
    <Suspense fallback={<RouteLoading label={label} background={background} color={color} />}>
      {children}
    </Suspense>
  );
}

function Router() {
  return (
    <Switch>
      {/* Main landing page */}
      <Route path="/" component={HomepagePrototype} />

      {/* Legacy homepage (kept for reference) */}
      <Route path="/homepage-prototype" component={HomepagePrototype} />
      
      {/* Templates showcase page */}
      <Route path="/templates" component={() => (
        <LazyRoute label="Loading templates...">
          <LazyTemplatesPage />
        </LazyRoute>
      )} />
      
      {/* Platform Owner Admin Panel */}
      <Route path="/platform-admin/login" component={() => (
        <LazyRoute label="Loading admin...">
          <LazyPlatformAdminLogin />
        </LazyRoute>
      )} />
      <Route path="/platform-admin" component={() => (
        <LazyRoute label="Loading admin...">
          <LazyPlatformAdminPanel />
        </LazyRoute>
      )} />
      
      {/* User Management System for Ultimate Customers */}
      <Route path="/admin/access" component={() => (
        <LazyRoute label="Loading admin...">
          <LazyAdminAccess />
        </LazyRoute>
      )} />
      <Route path="/admin/login" component={() => (
        <LazyRoute label="Loading admin...">
          <LazyAdminLoginRoute />
        </LazyRoute>
      )} />
      <Route path="/admin/dashboard" component={() => (
        <LazyRoute label="Loading admin...">
          <LazyAdminDashboardRoute />
        </LazyRoute>
      )} />
      
      {/* Template-specific admin routes - must come before other catch-all routes */}
      <Route path="/:templateSlug/admin/dashboard">
        {(params) => (
          <LazyRoute label="Loading admin...">
            <LazyTemplateAdminDashboard templateSlug={params.templateSlug} />
          </LazyRoute>
        )}
      </Route>
      <Route path="/:templateSlug/admin">
        {(params) => (
          <LazyRoute label="Loading admin...">
            <LazyTemplateAdminLogin templateSlug={params.templateSlug} />
          </LazyRoute>
        )}
      </Route>
      
      {/* Platform admin routes */}
      <Route path="/platform" component={() => (
        <LazyRoute label="Loading platform...">
          <LazyPlatformDashboard />
        </LazyRoute>
      )} />
      <Route path="/platform/translations" component={() => (
        <LazyRoute label="Loading translations...">
          <LazyPlatformTranslations />
        </LazyRoute>
      )} />
      <Route path="/translations-prototype" component={() => (
        <LazyRoute label="Loading editor..." background="#fff" color="#0D2A20">
          <LazyTranslationsPrototype />
        </LazyRoute>
      )} />
      <Route path="/planner-prototype" component={() => (
        <LazyRoute label="Loading planner...">
          <LazyPlannerPrototype />
        </LazyRoute>
      )} />
      <Route path="/planner-demo" component={() => (
        <LazyRoute label="Loading demo..." background="#FBFAF7" color="#064E3B">
          <LazyPlannerDemo />
        </LazyRoute>
      )} />

      {/* Real customer planner — must be before /:templateIdentifier catch-all */}
      <Route path="/planner/login" component={() => (
        <LazyRoute background="#FBFAF7" color="#064E3B">
          <LazyPlannerLoginPage />
        </LazyRoute>
      )} />
      <Route path="/planner" component={() => (
        <LazyRoute background="#FBFAF7" color="#064E3B">
          <LazyPlannerPage />
        </LazyRoute>
      )} />
      <Route path="/platform/builder-v2/:templateId" component={() => (
        <LazyRoute label="Loading builder..." background="#0F172A" color="#64748B">
          <LazyBuilderV2Page />
        </LazyRoute>
      )} />
      <Route path="/platform/templates/:templateId" component={() => (
        <LazyRoute label="Loading template admin...">
          <LazyTemplateAdminPanel />
        </LazyRoute>
      )} />
      
      {/* Legacy routes for backward compatibility */}
      <Route path="/photos" component={() => (
        <LazyRoute label="Loading photos...">
          <LazyPhotosPage />
        </LazyRoute>
      )} />
      <Route path="/admin" component={() => (
        <LazyRoute label="Loading admin...">
          <LazyAdminPanel />
        </LazyRoute>
      )} />
      
      {/* Dynamic template routes */}
      <Route path="/template/:templateId" component={() => (
        <LazyRoute label="Loading template...">
          <LazyTemplateRenderer />
        </LazyRoute>
      )} />
      
      {/* Demo editor routes – must be before the catch-all /:templateIdentifier */}
      <Route path="/demo/david-rose-romantic/edit/:editId/done" component={() => (
        <LazyRoute label="Loading demo...">
          <LazyDemoFinalPage />
        </LazyRoute>
      )} />
      <Route path="/demo/david-rose-romantic/edit/:editId" component={() => (
        <LazyRoute label="Loading demo...">
          <LazyDemoEditorPage />
        </LazyRoute>
      )} />
      <Route path="/demo/david-rose-romantic/edit" component={() => (
        <LazyRoute label="Loading demo...">
          <LazyDemoEditorPage />
        </LazyRoute>
      )} />
      <Route path="/demo/david-rose-romantic/setup" component={() => (
        <LazyRoute label="Loading demo...">
          <LazyDemoSetupPage />
        </LazyRoute>
      )} />
      <Route path="/demo/david-rose-romantic" component={() => (
        <LazyRoute label="Loading demo...">
          <LazyDemoLandingPage />
        </LazyRoute>
      )} />

      {/* Template identifier route (clean URLs without prefix) */}
      <Route path="/:templateIdentifier" component={() => (
        <LazyRoute label="Loading template...">
          <LazyTemplateIdentifierGuard />
        </LazyRoute>
      )} />
      
      {/* Catch-all */}
      <Route component={() => (
        <LazyRoute>
          <LazyNotFound />
        </LazyRoute>
      )} />
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
      <LazyRoute>
        <LazyMaintenanceMode
          onPasswordCorrect={() => {
            setMaintenanceBypassed(true);
            localStorage.setItem("maintenance-bypass", "true");
          }}
        />
      </LazyRoute>
    );
  }

  return <Router />;
}

// App receives fully-resolved bootstrap data from main.tsx.
// By the time this component mounts, translations + maintenance are already loaded.
function App({ bootstrapData }: { bootstrapData: BootstrapData }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ArmenianFontProvider>
        <BootstrapProvider data={bootstrapData}>
          <LanguageProvider
            initialLanguage={bootstrapData.initialLanguage}
            prefetchedData={bootstrapData.translations}
          >
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
