import { useParams } from "wouter";
import TemplateRenderer from "@/components/template-renderer";
import NotFound from "@/pages/not-found";

/**
 * Guard component that prevents old /t/ URLs from being treated as valid templates
 * Shows 404 if the identifier starts with 't/'
 */
export default function TemplateIdentifierGuard() {
  const params = useParams();
  const templateIdentifier = params.templateIdentifier;
  
  // Block old /t/ style URLs - they should not work anymore
  if (templateIdentifier && templateIdentifier.startsWith('t/')) {
    console.log(`❌ Blocked legacy URL pattern: /${templateIdentifier}`);
    return <NotFound />;
  }
  
  // Allow clean template identifiers
  return <TemplateRenderer />;
}