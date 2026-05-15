/**
 * Live preview pane — renders the RomanticTemplate with the current demo config.
 * DEMO ONLY: templateId="demo" prevents any real RSVP submissions.
 */
import { Suspense, lazy } from "react";
import { useDemoEditor } from "./DemoEditorContext";
import type { PreviewMode } from "./DemoEditorContext";

const RomanticTemplate = lazy(() => import("@/templates/romantic/RomanticTemplate"));

interface DemoPreviewProps {
  mode?: PreviewMode;
}

export default function DemoPreview({ mode }: DemoPreviewProps) {
  const { config, previewMode } = useDemoEditor();
  const effectiveMode = mode ?? previewMode;

  return (
    <div
      className={`relative overflow-hidden bg-white ${
        effectiveMode === "mobile"
          ? "w-[390px] mx-auto rounded-3xl shadow-2xl border-4 border-gray-800"
          : "w-full"
      }`}
      style={{
        ...(effectiveMode === "mobile" ? { maxHeight: "calc(100vh - 200px)" } : undefined),
        transform: "translate(0)",   // Creates a new containing block for fixed children
      }}
    >
      <div
        className="overflow-y-auto"
        style={effectiveMode === "mobile" ? { maxHeight: "calc(100vh - 208px)" } : undefined}
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              Loading preview…
            </div>
          }
        >
          <RomanticTemplate config={config} templateId="demo" />
        </Suspense>
      </div>
    </div>
  );
}
