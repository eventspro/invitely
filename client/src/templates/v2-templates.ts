/**
 * V2 Templates — Registration Index
 *
 * Imports all V2 template manifests so they self-register with the generic
 * V2 builder engine before BuilderV2Page mounts.
 *
 * ── Adding a new V2 template ──────────────────────────────────────────────────
 * 1. Create your template:  client/src/templates/{name}/
 *    ├── {Name}Template.tsx    (React component, receives config + optional templateId)
 *    ├── config.ts             (exports defaultConfig: WeddingConfig)
 *    └── manifest.ts          (exports and registers your V2TemplateManifest)
 *
 * 2. Add data-v2-section and data-v2-element attributes on all editable JSX nodes.
 *
 * 3. Add ONE import line below — that's all that's needed in the builder.
 *
 * No changes are required in BuilderLeftPanel, BuilderCanvas, BuilderRightPanel,
 * or BuilderTopBar unless you introduce a completely new control type.
 */

// ── Registered V2 templates ───────────────────────────────────────────────────
import "./florence/manifest";
import "./aurelia/manifest";
import "./envelope/manifest";

// Future templates — add import lines here as they are created:
// import "./iris/manifest";
// import "./serene/manifest";
