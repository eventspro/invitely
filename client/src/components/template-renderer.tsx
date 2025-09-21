// Template Renderer Component
// Dynamically loads and renders templates based on URL parameters

import { useState, useEffect, Suspense } from "react";
import { useParams } from "wouter";
import { getTemplate } from "@/templates";
import { MaintenanceMode } from "@/components/maintenance-mode";
import LoadingScreen from "@/components/loading-screen";
import type { WeddingConfig } from "@/templates/types";

interface TemplateConfig {
  templateId: string;
  templateKey: string;
  config: WeddingConfig;
  maintenance: boolean;
}

export default function TemplateRenderer() {
  const params = useParams();
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceBypassed, setMaintenanceBypassed] = useState(false);

  // Get template identifier from URL (either templateId, slug, or templateIdentifier)
  const identifier = params.templateId || params.slug || params.templateIdentifier;

  useEffect(() => {
    if (!identifier) {
      setError("Template identifier is required");
      setLoading(false);
      return;
    }

    loadTemplateConfig();
  }, [identifier]);

  const loadTemplateConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch template configuration from API
      const response = await fetch(`/api/templates/${identifier}/config`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Template not found");
        } else {
          setError("Failed to load template");
        }
        return;
      }

      const data = await response.json();
      setTemplateConfig(data);

      // Check for maintenance mode bypass
      const bypassKey = localStorage.getItem(`template-bypass-${data.templateId}`);
      const urlParams = new URLSearchParams(window.location.search);
      const previewParam = urlParams.get("preview");
      
      if (bypassKey === "true" || previewParam === "true") {
        setMaintenanceBypassed(true);
      }

    } catch (error) {
      setError("Failed to load template");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordCorrect = () => {
    setMaintenanceBypassed(true);
    if (templateConfig) {
      localStorage.setItem(`template-bypass-${templateConfig.templateId}`, "true");
    }
  };

  // Show minimal loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
      </div>
    );
  }

  // Show error state
  if (error || !templateConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Template Not Found</h1>
          <p className="text-gray-600 mb-4">{error || "The requested template could not be found."}</p>
          <a 
            href="/" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  // Show maintenance mode if enabled and not bypassed
  if (templateConfig.maintenance && !maintenanceBypassed) {
    return <MaintenanceMode onPasswordCorrect={handlePasswordCorrect} />;
  }

  // Get the template definition
  const templateDef = getTemplate(templateConfig.templateKey);
  
  if (!templateDef) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Template Type Not Supported</h1>
          <p className="text-gray-600 mb-4">Template type "{templateConfig.templateKey}" is not available.</p>
        </div>
      </div>
    );
  }

  // Render the template component
  const TemplateComponent = templateDef.component;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <TemplateComponent config={templateConfig.config} />
    </Suspense>
  );
}
