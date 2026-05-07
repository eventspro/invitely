/**
 * V2 Template Manifest Registry
 *
 * Central registry for all V2 template manifests.
 * Templates register themselves as a side-effect of being imported.
 *
 * Usage (template manifest file):
 *   import { registerV2Manifest } from "../../pages/builder-v2/manifest-registry";
 *   registerV2Manifest(myManifest);
 *
 * Usage (consumer):
 *   import { getV2Manifest } from "../manifest-registry";
 *   const manifest = getV2Manifest("florence"); // → V2TemplateManifest | null
 */

import type { V2TemplateManifest } from "./manifest-types";

const _registry: Record<string, V2TemplateManifest> = {};

/** Register a V2 template manifest. Idempotent — re-registering overwrites. */
export function registerV2Manifest(manifest: V2TemplateManifest): void {
  _registry[manifest.templateKey] = manifest;
}

/**
 * Get a registered manifest by templateKey.
 * Returns null if the templateKey has not been registered yet.
 */
export function getV2Manifest(templateKey: string): V2TemplateManifest | null {
  return _registry[templateKey] ?? null;
}

/** Returns a snapshot of all registered manifests (read-only copy). */
export function getV2TemplateRegistry(): Record<string, V2TemplateManifest> {
  return { ..._registry };
}
