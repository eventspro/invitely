import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileUp,
  Plus,
  Save,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { DEFAULT_PARTNERS_CONTENT, PARTNER_ICON_OPTIONS } from "@/pages/partners/partnersData";
import { PARTNER_ICON_COMPONENTS } from "@/pages/partners/partnerIcons";
import MainSiteFooter from "@/components/MainSiteFooter";
import PartnerCard from "@/pages/partners/PartnerCard";
import PartnerDetailsModal from "@/pages/partners/PartnerDetailsModal";
import PartnersMarketplaceSection from "@/pages/partners/PartnersMarketplaceSection";
import {
  exportPartnersContent,
  fetchAdminPartnersContent,
  parsePartnersContentJson,
  publishPartnersContent,
} from "@/pages/partners/partnersStorage";
import {
  hasBlockingValidationErrors,
  slugifyPartnerId,
  validatePartnersContent,
} from "@/pages/partners/partnersValidation";
import type {
  PartnerCategory,
  PartnerPackage,
  PartnerStatus,
  PartnerVendor,
  PartnersContent,
  PartnersValidationIssue,
} from "@/pages/partners/partnersTypes";

type BuilderTab = "page" | "categories" | "vendors" | "preview";
type VendorSortMode = "updated" | "name" | "price" | "rating" | "popularity";

const serifStyle: CSSProperties = { fontFamily: "var(--armenian-serif, serif)" };
const inputClass =
  "min-h-[42px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 disabled:bg-slate-50";
const textareaClass =
  "min-h-[96px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-100";
const buttonSecondary =
  "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";
const buttonPrimary =
  "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";
const buttonDanger =
  "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50";

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function sortedByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

function reorderByOrder<T extends { id: string; order: number }>(items: T[], id: string, direction: "up" | "down"): T[] {
  const ordered = sortedByOrder(items);
  const index = ordered.findIndex((item) => item.id === id);
  if (index < 0) return items;
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= ordered.length) return items;
  const next = [...ordered];
  [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  return next.map((item, itemIndex) => ({ ...item, order: (itemIndex + 1) * 10 }));
}

function reorderFeaturedVendors(items: PartnerVendor[], id: string, direction: "up" | "down"): PartnerVendor[] {
  const featured = [...items].filter((item) => item.featured).sort((a, b) => a.featuredOrder - b.featuredOrder);
  const index = featured.findIndex((item) => item.id === id);
  if (index < 0) return items;
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= featured.length) return items;
  [featured[index], featured[swapIndex]] = [featured[swapIndex], featured[index]];
  const orderById = new Map(featured.map((item, itemIndex) => [item.id, (itemIndex + 1) * 10]));
  return items.map((item) => (orderById.has(item.id) ? { ...item, featuredOrder: orderById.get(item.id)! } : item));
}

function Panel({ title, description, children, action }: { title: string; description?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>}
    </div>
  );
}

function ToggleField({
  id,
  label,
  checked,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <label htmlFor={id} className="flex min-h-[42px] items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-200"
      />
      <span>
        <span className="block text-sm font-semibold text-slate-700">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-5 text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

function getCategoryMap(categories: PartnerCategory[]) {
  return new Map(categories.map((category) => [category.id, category]));
}

function getPublicPartners(content: PartnersContent): PartnerVendor[] {
  const enabledCategoryIds = new Set(content.categories.filter((category) => category.enabled).map((category) => category.id));
  return content.vendors
    .filter((vendor) => vendor.enabled && vendor.status === "published" && enabledCategoryIds.has(vendor.categoryId))
    .sort((a, b) => a.featuredOrder - b.featuredOrder);
}

function createEmptyVendor(categoryId: string): PartnerVendor {
  const id = createId("vendor");
  return {
    id,
    name: "New vendor",
    categoryId,
    shortDescription: "",
    fullDescription: "",
    city: "",
    priceFrom: null,
    currency: "AMD",
    displayPrice: "",
    rating: 0,
    reviewCount: 0,
    popularity: 0,
    mainImage: "/template_previews/img1.webp",
    galleryImages: [],
    phone: "",
    messageLink: "",
    telegramLink: "",
    whatsappLink: "",
    instagramLink: "",
    websiteLink: "",
    packages: [],
    tags: [],
    status: "draft",
    enabled: true,
    featured: false,
    featuredOrder: 999,
    updatedAt: nowIso(),
  };
}

function createEmptyPackage(): PartnerPackage {
  return { id: createId("package"), name: "", price: "", description: "" };
}

export default function PartnersBuilderPage() {
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [authToken, setAuthToken] = useState("");
  const [authChecking, setAuthChecking] = useState(true);
  const [authAllowed, setAuthAllowed] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [content, setContent] = useState<PartnersContent>(DEFAULT_PARTNERS_CONTENT);
  const [activeTab, setActiveTab] = useState<BuilderTab>("vendors");
  const [selectedVendorId, setSelectedVendorId] = useState(DEFAULT_PARTNERS_CONTENT.vendors[0]?.id ?? "");
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorStatusFilter, setVendorStatusFilter] = useState<"all" | PartnerStatus>("all");
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState("all");
  const [vendorSort, setVendorSort] = useState<VendorSortMode>("updated");
  const [notice, setNotice] = useState("");
  const [publishState, setPublishState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [publishError, setPublishError] = useState("");
  const [previewVendor, setPreviewVendor] = useState<PartnerVendor | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    if (!token) {
      setLocation("/platform-admin/login?next=/admin/partners-builder");
      return;
    }

    setAuthToken(token);
    fetchAdminPartnersContent(token)
      .then((serverContent) => {
        const initialContent = serverContent ?? DEFAULT_PARTNERS_CONTENT;
        setContent(initialContent);
        setSelectedVendorId(initialContent.vendors[0]?.id ?? "");
        setAuthAllowed(true);
      })
      .catch((error: Error) => {
        if (error.message === "unauthorized") {
          localStorage.removeItem("admin-token");
          setLocation("/platform-admin/login?next=/admin/partners-builder");
          return;
        }
        setLoadError("Partners builder access could not be verified. Try again after the admin API is reachable.");
      })
      .finally(() => setAuthChecking(false));
  }, [setLocation]);

  const validationIssues = useMemo(() => validatePartnersContent(content), [content]);
  const validationErrors = validationIssues.filter((issue) => issue.severity === "error");
  const categoryMap = useMemo(() => getCategoryMap(content.categories), [content.categories]);
  const selectedVendor = content.vendors.find((vendor) => vendor.id === selectedVendorId) ?? content.vendors[0] ?? null;

  const filteredVendors = useMemo(() => {
    const normalizedQuery = vendorSearch.trim().toLocaleLowerCase("hy-AM");
    return [...content.vendors]
      .filter((vendor) => vendorStatusFilter === "all" || vendor.status === vendorStatusFilter)
      .filter((vendor) => vendorCategoryFilter === "all" || vendor.categoryId === vendorCategoryFilter)
      .filter((vendor) => {
        if (!normalizedQuery) return true;
        const category = categoryMap.get(vendor.categoryId);
        return `${vendor.name} ${category?.label ?? ""} ${vendor.city}`.toLocaleLowerCase("hy-AM").includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (vendorSort === "name") return a.name.localeCompare(b.name, "hy");
        if (vendorSort === "price") return (a.priceFrom ?? Number.MAX_SAFE_INTEGER) - (b.priceFrom ?? Number.MAX_SAFE_INTEGER);
        if (vendorSort === "rating") return b.rating - a.rating;
        if (vendorSort === "popularity") return b.popularity - a.popularity;
        return Date.parse(b.updatedAt || "0") - Date.parse(a.updatedAt || "0");
      });
  }, [categoryMap, content.vendors, vendorCategoryFilter, vendorSearch, vendorSort, vendorStatusFilter]);

  const setDraftContent = (updater: (current: PartnersContent) => PartnersContent) => {
    setContent((current) => ({ ...updater(current), updatedAt: nowIso() }));
    setPublishState("idle");
    setPublishError("");
  };

  const updatePage = <K extends keyof PartnersContent["page"]>(key: K, value: PartnersContent["page"][K]) => {
    setDraftContent((current) => ({ ...current, page: { ...current.page, [key]: value } }));
  };

  const updateCategory = (categoryId: string, updates: Partial<PartnerCategory>) => {
    setDraftContent((current) => ({
      ...current,
      categories: current.categories.map((category) => (category.id === categoryId ? { ...category, ...updates } : category)),
    }));
  };

  const updateCategoryId = (oldId: string, rawValue: string) => {
    const nextId = slugifyPartnerId(rawValue);
    if (!nextId) {
      updateCategory(oldId, { id: "" });
      return;
    }
    if (content.categories.some((category) => category.id === nextId && category.id !== oldId)) {
      setNotice(`Category id "${nextId}" already exists.`);
      return;
    }
    setDraftContent((current) => ({
      ...current,
      categories: current.categories.map((category) => (category.id === oldId ? { ...category, id: nextId } : category)),
      vendors: current.vendors.map((vendor) => (vendor.categoryId === oldId ? { ...vendor, categoryId: nextId, updatedAt: nowIso() } : vendor)),
      examples: current.examples.map((example) => (example.categoryId === oldId ? { ...example, categoryId: nextId } : example)),
    }));
  };

  const addCategory = () => {
    const id = createId("category");
    const category: PartnerCategory = {
      id,
      label: "Նոր կատեգորիա",
      icon: "sparkles",
      enabled: true,
      order: (content.categories.length + 1) * 10,
    };
    setDraftContent((current) => ({ ...current, categories: [...current.categories, category] }));
    setActiveTab("categories");
  };

  const deleteCategory = (categoryId: string) => {
    const dependentVendors = content.vendors.filter((vendor) => vendor.categoryId === categoryId);
    if (dependentVendors.length > 0) {
      setNotice(`Cannot delete this category because ${dependentVendors.length} vendor(s) use it.`);
      return;
    }
    if (!window.confirm("Delete this category?")) return;
    setDraftContent((current) => ({
      ...current,
      categories: current.categories.filter((category) => category.id !== categoryId),
      examples: current.examples.filter((example) => example.categoryId !== categoryId),
    }));
  };

  const updateVendor = (vendorId: string, updates: Partial<PartnerVendor>) => {
    setDraftContent((current) => ({
      ...current,
      vendors: current.vendors.map((vendor) =>
        vendor.id === vendorId ? { ...vendor, ...updates, updatedAt: nowIso() } : vendor,
      ),
    }));
  };

  const addVendor = () => {
    const vendor = createEmptyVendor(content.categories[0]?.id ?? "other");
    setDraftContent((current) => ({ ...current, vendors: [vendor, ...current.vendors] }));
    setSelectedVendorId(vendor.id);
    setActiveTab("vendors");
  };

  const duplicateVendor = (vendor: PartnerVendor) => {
    const duplicated: PartnerVendor = {
      ...vendor,
      id: createId("vendor"),
      name: `${vendor.name} copy`,
      status: "draft",
      featured: false,
      featuredOrder: 999,
      updatedAt: nowIso(),
    };
    setDraftContent((current) => ({ ...current, vendors: [duplicated, ...current.vendors] }));
    setSelectedVendorId(duplicated.id);
  };

  const deleteVendor = (vendor: PartnerVendor) => {
    if (!window.confirm(`Delete vendor "${vendor.name}" from the draft?`)) return;
    setDraftContent((current) => ({
      ...current,
      vendors: current.vendors.filter((item) => item.id !== vendor.id),
      examples: current.examples.map((example) =>
        example.linkedVendorId === vendor.id ? { ...example, linkedVendorId: "" } : example,
      ),
    }));
    if (selectedVendorId === vendor.id) setSelectedVendorId(content.vendors.find((item) => item.id !== vendor.id)?.id ?? "");
  };

  const updateVendorGallery = (vendorId: string, value: string) => {
    updateVendor(vendorId, {
      galleryImages: value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
    });
  };

  const updateVendorTags = (vendorId: string, value: string) => {
    updateVendor(vendorId, {
      tags: value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });
  };

  const updatePackage = (vendorId: string, packageId: string, updates: Partial<PartnerPackage>) => {
    const vendor = content.vendors.find((item) => item.id === vendorId);
    if (!vendor) return;
    updateVendor(vendorId, {
      packages: vendor.packages.map((pkg) => (pkg.id === packageId ? { ...pkg, ...updates } : pkg)),
    });
  };

  const addPackage = (vendorId: string) => {
    const vendor = content.vendors.find((item) => item.id === vendorId);
    if (!vendor) return;
    updateVendor(vendorId, { packages: [...vendor.packages, createEmptyPackage()] });
  };

  const deletePackage = (vendorId: string, packageId: string) => {
    const vendor = content.vendors.find((item) => item.id === vendorId);
    if (!vendor) return;
    updateVendor(vendorId, { packages: vendor.packages.filter((pkg) => pkg.id !== packageId) });
  };

  const moveCategory = (categoryId: string, direction: "up" | "down") => {
    setDraftContent((current) => ({ ...current, categories: reorderByOrder(current.categories, categoryId, direction) }));
  };

  const moveFeaturedVendor = (vendorId: string, direction: "up" | "down") => {
    setDraftContent((current) => ({ ...current, vendors: reorderFeaturedVendors(current.vendors, vendorId, direction) }));
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = parsePartnersContentJson(await file.text());
      setContent({ ...imported, updatedAt: nowIso() });
      setSelectedVendorId(imported.vendors[0]?.id ?? "");
      setNotice("Imported JSON into the current draft. Review validation before publishing.");
      setPublishState("idle");
    } catch {
      setNotice("Import failed. Please choose a valid partners content JSON file.");
    } finally {
      event.target.value = "";
    }
  };

  const handlePublish = async () => {
    setNotice("");
    setPublishError("");
    if (!authToken) {
      setPublishError("Missing platform admin token. Sign in again.");
      setPublishState("error");
      return;
    }
    if (hasBlockingValidationErrors(content)) {
      setPublishError("Fix validation errors before publishing.");
      setPublishState("error");
      return;
    }
    setPublishState("saving");
    try {
      await publishPartnersContent({ ...content, updatedAt: nowIso() }, authToken);
      setPublishState("saved");
    } catch (error) {
      setPublishState("error");
      setPublishError(error instanceof Error ? error.message : "Publish failed.");
    }
  };

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        Checking admin access...
      </div>
    );
  }

  if (!authAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-700">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-950">Partners builder unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {loadError || "Admin access could not be verified."}
          </p>
          <a href="/platform-admin/login?next=/admin/partners-builder" className={`${buttonPrimary} mt-4`}>
            Sign in again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <a href="/platform-admin" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950">
              <ArrowLeft className="h-4 w-4" />
              Platform admin
            </a>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Partners Builder</h1>
            <p className="mt-1 text-sm text-slate-500">Draft, validate, preview, and publish the public /partners marketplace content.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
            <button type="button" className={buttonSecondary} onClick={() => fileInputRef.current?.click()}>
              <FileUp className="h-4 w-4" />
              Import JSON
            </button>
            <button type="button" className={buttonSecondary} onClick={() => exportPartnersContent(content)}>
              <Download className="h-4 w-4" />
              Export JSON
            </button>
            <a href="/partners" target="_blank" rel="noreferrer" className={buttonSecondary}>
              <Eye className="h-4 w-4" />
              View public page
            </a>
            <button type="button" className={buttonPrimary} onClick={handlePublish} disabled={publishState === "saving" || validationErrors.length > 0}>
              <Save className="h-4 w-4" />
              {publishState === "saving" ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-4 pb-3 sm:px-6 lg:px-8">
          {([
            ["page", "Page"],
            ["categories", "Categories"],
            ["vendors", "Vendors"],
            ["preview", "Preview"],
          ] as [BuilderTab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`min-h-[38px] rounded-lg px-3 text-sm font-semibold transition ${
                activeTab === tab ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <div className="space-y-5">
          {loadError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {loadError}
            </div>
          )}
          {notice && (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice("")} className="text-slate-400 hover:text-slate-700" aria-label="Dismiss notice">
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}
          {publishState === "saved" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Partners content published successfully.
            </div>
          )}
          {publishState === "error" && publishError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {publishError}
            </div>
          )}

          {activeTab === "page" && (
            <PagePanel content={content} updatePage={updatePage} />
          )}
          {activeTab === "categories" && (
            <CategoriesPanel
              categories={content.categories}
              vendors={content.vendors}
              onAdd={addCategory}
              onMove={moveCategory}
              onUpdate={updateCategory}
              onUpdateId={updateCategoryId}
              onDelete={deleteCategory}
            />
          )}
          {activeTab === "vendors" && (
            <VendorsPanel
              categories={content.categories}
              vendors={filteredVendors}
              allVendors={content.vendors}
              selectedVendor={selectedVendor}
              search={vendorSearch}
              statusFilter={vendorStatusFilter}
              categoryFilter={vendorCategoryFilter}
              sort={vendorSort}
              onSearch={setVendorSearch}
              onStatusFilter={setVendorStatusFilter}
              onCategoryFilter={setVendorCategoryFilter}
              onSort={setVendorSort}
              onSelect={setSelectedVendorId}
              onAdd={addVendor}
              onUpdate={updateVendor}
              onDuplicate={duplicateVendor}
              onDelete={deleteVendor}
              onMoveFeatured={moveFeaturedVendor}
              onGalleryChange={updateVendorGallery}
              onTagsChange={updateVendorTags}
              onPackageAdd={addPackage}
              onPackageUpdate={updatePackage}
              onPackageDelete={deletePackage}
            />
          )}
          {activeTab === "preview" && (
            <Panel title="Full Draft Preview" description="Uses the same marketplace and footer components as the public /partners page.">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="max-h-[760px] overflow-y-auto bg-[#FAF7F2]">
                  <div className="origin-top scale-[0.96]">
                    <PartnersMarketplaceSection content={content} />
                    <MainSiteFooter />
                  </div>
                </div>
              </div>
            </Panel>
          )}
        </div>

        <PreviewAside
          content={content}
          issues={validationIssues}
          selectedVendor={selectedVendor}
          onOpenModal={(vendor) => setPreviewVendor(vendor)}
        />
      </main>

      {previewVendor && (
        <PartnerDetailsModal
          partner={previewVendor}
          category={categoryMap.get(previewVendor.categoryId)}
          onClose={() => setPreviewVendor(null)}
        />
      )}
    </div>
  );
}

function PagePanel({
  content,
  updatePage,
}: {
  content: PartnersContent;
  updatePage: <K extends keyof PartnersContent["page"]>(key: K, value: PartnersContent["page"][K]) => void;
}) {
  return (
    <Panel title="Page Content" description="Edit the public hero copy and image used by /partners. Top and standard sections are controlled from each vendor card.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="page-eyebrow" label="Eyebrow text">
          <input id="page-eyebrow" className={inputClass} value={content.page.eyebrow} onChange={(event) => updatePage("eyebrow", event.target.value)} />
        </Field>
        <Field id="page-title" label="Main title">
          <input id="page-title" className={inputClass} value={content.page.title} onChange={(event) => updatePage("title", event.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Field id="page-subtitle" label="Subtitle">
            <textarea id="page-subtitle" className={textareaClass} value={content.page.subtitle} onChange={(event) => updatePage("subtitle", event.target.value)} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field id="page-hero-image" label="Hero/background image" hint="Use a safe local media path such as /template_previews/img1.webp or an HTTPS image URL.">
            <input id="page-hero-image" className={inputClass} value={content.page.heroImage} onChange={(event) => updatePage("heroImage", event.target.value)} />
          </Field>
        </div>
      </div>
    </Panel>
  );
}

function CategoriesPanel({
  categories,
  vendors,
  onAdd,
  onMove,
  onUpdate,
  onUpdateId,
  onDelete,
}: {
  categories: PartnerCategory[];
  vendors: PartnerVendor[];
  onAdd: () => void;
  onMove: (categoryId: string, direction: "up" | "down") => void;
  onUpdate: (categoryId: string, updates: Partial<PartnerCategory>) => void;
  onUpdateId: (categoryId: string, rawValue: string) => void;
  onDelete: (categoryId: string) => void;
}) {
  return (
    <Panel
      title="Categories"
      description="Manage labels, safe slugs, predefined icons, order, and category visibility."
      action={
        <button type="button" className={buttonPrimary} onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add category
        </button>
      }
    >
      <div className="space-y-3">
        {sortedByOrder(categories).map((category, index) => {
          const dependentCount = vendors.filter((vendor) => vendor.categoryId === category.id).length;
          const Icon = PARTNER_ICON_COMPONENTS[category.icon];
          return (
            <div key={category.id || index} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 lg:grid-cols-[48px_minmax(160px,0.8fr)_minmax(180px,1fr)_minmax(160px,0.7fr)_120px] lg:items-end">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-rose-600">
                  {Icon ? <Icon className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
                <Field id={`category-id-${index}`} label="ID / slug">
                  <input id={`category-id-${index}`} className={inputClass} value={category.id} onChange={(event) => onUpdateId(category.id, event.target.value)} />
                </Field>
                <Field id={`category-label-${category.id}`} label="Label">
                  <input id={`category-label-${category.id}`} className={inputClass} value={category.label} onChange={(event) => onUpdate(category.id, { label: event.target.value })} />
                </Field>
                <Field id={`category-icon-${category.id}`} label="Icon">
                  <select id={`category-icon-${category.id}`} className={inputClass} value={category.icon} onChange={(event) => onUpdate(category.id, { icon: event.target.value as PartnerCategory["icon"] })}>
                    {PARTNER_ICON_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="flex items-center gap-2">
                  <button type="button" className={buttonSecondary} onClick={() => onMove(category.id, "up")} aria-label={`Move ${category.label} up`}>
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" className={buttonSecondary} onClick={() => onMove(category.id, "down")} aria-label={`Move ${category.label} down`}>
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <ToggleField id={`category-enabled-${category.id}`} label="Enabled" checked={category.enabled} onChange={(checked) => onUpdate(category.id, { enabled: checked })} hint={`${dependentCount} vendor(s) use this category`} />
                <button type="button" className={buttonDanger} onClick={() => onDelete(category.id)} disabled={dependentCount > 0}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function VendorsPanel({
  categories,
  vendors,
  allVendors,
  selectedVendor,
  search,
  statusFilter,
  categoryFilter,
  sort,
  onSearch,
  onStatusFilter,
  onCategoryFilter,
  onSort,
  onSelect,
  onAdd,
  onUpdate,
  onDuplicate,
  onDelete,
  onMoveFeatured,
  onGalleryChange,
  onTagsChange,
  onPackageAdd,
  onPackageUpdate,
  onPackageDelete,
}: {
  categories: PartnerCategory[];
  vendors: PartnerVendor[];
  allVendors: PartnerVendor[];
  selectedVendor: PartnerVendor | null;
  search: string;
  statusFilter: "all" | PartnerStatus;
  categoryFilter: string;
  sort: VendorSortMode;
  onSearch: (value: string) => void;
  onStatusFilter: (value: "all" | PartnerStatus) => void;
  onCategoryFilter: (value: string) => void;
  onSort: (value: VendorSortMode) => void;
  onSelect: (vendorId: string) => void;
  onAdd: () => void;
  onUpdate: (vendorId: string, updates: Partial<PartnerVendor>) => void;
  onDuplicate: (vendor: PartnerVendor) => void;
  onDelete: (vendor: PartnerVendor) => void;
  onMoveFeatured: (vendorId: string, direction: "up" | "down") => void;
  onGalleryChange: (vendorId: string, value: string) => void;
  onTagsChange: (vendorId: string, value: string) => void;
  onPackageAdd: (vendorId: string) => void;
  onPackageUpdate: (vendorId: string, packageId: string, updates: Partial<PartnerPackage>) => void;
  onPackageDelete: (vendorId: string, packageId: string) => void;
}) {
  const categoryMap = getCategoryMap(categories);

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Panel
        title="Vendors"
        description={`${allVendors.length} draft vendor record(s)`}
        action={
          <button type="button" className={buttonPrimary} onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Add vendor
          </button>
        }
      >
        <div className="space-y-3">
          <label className="relative block">
            <span className="sr-only">Search vendors</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={`${inputClass} pl-9`} value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search name, category, city" />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <select className={inputClass} value={statusFilter} onChange={(event) => onStatusFilter(event.target.value as "all" | PartnerStatus)} aria-label="Filter by status">
              <option value="all">All status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="hidden">Hidden</option>
            </select>
            <select className={inputClass} value={categoryFilter} onChange={(event) => onCategoryFilter(event.target.value)} aria-label="Filter by category">
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            <select className={inputClass} value={sort} onChange={(event) => onSort(event.target.value as VendorSortMode)} aria-label="Sort vendors">
              <option value="updated">Updated</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="rating">Rating</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>
          <div className="max-h-[720px] space-y-2 overflow-y-auto pr-1">
            {vendors.map((vendor) => (
              <button
                key={vendor.id}
                type="button"
                onClick={() => onSelect(vendor.id)}
                className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                  selectedVendor?.id === vendor.id ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{vendor.name || "Unnamed vendor"}</p>
                    <p className="mt-1 text-xs text-slate-500">{categoryMap.get(vendor.categoryId)?.label ?? (vendor.categoryId || "No category")}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    vendor.status === "published" ? "bg-emerald-100 text-emerald-700" : vendor.status === "hidden" ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {vendor.status}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                  {vendor.enabled ? <span>enabled</span> : <span>disabled</span>}
                  {vendor.featured && <span>top partner #{vendor.featuredOrder}</span>}
                  <span>{vendor.city || "city not set"}</span>
                </div>
              </button>
            ))}
            {vendors.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">No vendors match the current filters.</p>}
          </div>
        </div>
      </Panel>

      <VendorEditor
        categories={categories}
        vendor={selectedVendor}
        onUpdate={onUpdate}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onMoveFeatured={onMoveFeatured}
        onGalleryChange={onGalleryChange}
        onTagsChange={onTagsChange}
        onPackageAdd={onPackageAdd}
        onPackageUpdate={onPackageUpdate}
        onPackageDelete={onPackageDelete}
      />
    </div>
  );
}

function VendorEditor({
  categories,
  vendor,
  onUpdate,
  onDuplicate,
  onDelete,
  onMoveFeatured,
  onGalleryChange,
  onTagsChange,
  onPackageAdd,
  onPackageUpdate,
  onPackageDelete,
}: {
  categories: PartnerCategory[];
  vendor: PartnerVendor | null;
  onUpdate: (vendorId: string, updates: Partial<PartnerVendor>) => void;
  onDuplicate: (vendor: PartnerVendor) => void;
  onDelete: (vendor: PartnerVendor) => void;
  onMoveFeatured: (vendorId: string, direction: "up" | "down") => void;
  onGalleryChange: (vendorId: string, value: string) => void;
  onTagsChange: (vendorId: string, value: string) => void;
  onPackageAdd: (vendorId: string) => void;
  onPackageUpdate: (vendorId: string, packageId: string, updates: Partial<PartnerPackage>) => void;
  onPackageDelete: (vendorId: string, packageId: string) => void;
}) {
  if (!vendor) {
    return (
      <Panel title="Vendor Editor">
        <p className="text-sm text-slate-500">Add or select a vendor to edit details.</p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Vendor Editor"
      description={vendor.updatedAt ? `Last edited ${new Date(vendor.updatedAt).toLocaleString()}` : undefined}
      action={
        <div className="flex flex-wrap gap-2">
          {vendor.featured && (
            <>
              <button type="button" className={buttonSecondary} onClick={() => onMoveFeatured(vendor.id, "up")} aria-label="Move top partner up">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button type="button" className={buttonSecondary} onClick={() => onMoveFeatured(vendor.id, "down")} aria-label="Move top partner down">
                <ArrowDown className="h-4 w-4" />
              </button>
            </>
          )}
          <button type="button" className={buttonSecondary} onClick={() => onDuplicate(vendor)}>
            <Copy className="h-4 w-4" />
            Duplicate
          </button>
          <button type="button" className={buttonDanger} onClick={() => onDelete(vendor)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="vendor-name" label="Name">
          <input id="vendor-name" className={inputClass} value={vendor.name} onChange={(event) => onUpdate(vendor.id, { name: event.target.value })} />
        </Field>
        <Field id="vendor-category" label="Category">
          <select id="vendor-category" className={inputClass} value={vendor.categoryId} onChange={(event) => onUpdate(vendor.id, { categoryId: event.target.value })}>
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="vendor-status" label="Status">
          <select id="vendor-status" className={inputClass} value={vendor.status} onChange={(event) => onUpdate(vendor.id, { status: event.target.value as PartnerStatus })}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </select>
        </Field>
        <Field id="vendor-city" label="City/location">
          <input id="vendor-city" className={inputClass} value={vendor.city} onChange={(event) => onUpdate(vendor.id, { city: event.target.value })} />
        </Field>
        <ToggleField id="vendor-enabled" label="Enabled" checked={vendor.enabled} onChange={(checked) => onUpdate(vendor.id, { enabled: checked })} />
        <ToggleField id="vendor-featured" label="Top partner" checked={vendor.featured} onChange={(checked) => onUpdate(vendor.id, { featured: checked, featuredOrder: checked ? vendor.featuredOrder : 999 })} hint="Top partners appear above standard partners on /partners." />
        <div className="md:col-span-2">
          <Field id="vendor-short-description" label="Short description">
            <textarea id="vendor-short-description" className={textareaClass} value={vendor.shortDescription} onChange={(event) => onUpdate(vendor.id, { shortDescription: event.target.value })} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field id="vendor-full-description" label="Full description">
            <textarea id="vendor-full-description" className={`${textareaClass} min-h-[140px]`} value={vendor.fullDescription} onChange={(event) => onUpdate(vendor.id, { fullDescription: event.target.value })} />
          </Field>
        </div>
        <Field id="vendor-price-from" label="Starting price">
          <input id="vendor-price-from" type="number" min="0" className={inputClass} value={vendor.priceFrom ?? ""} onChange={(event) => onUpdate(vendor.id, { priceFrom: event.target.value === "" ? null : Math.max(0, Number(event.target.value)) })} />
        </Field>
        <Field id="vendor-currency" label="Currency">
          <input id="vendor-currency" className={inputClass} value={vendor.currency} onChange={(event) => onUpdate(vendor.id, { currency: event.target.value })} />
        </Field>
        <Field id="vendor-display-price" label="Display price">
          <input id="vendor-display-price" className={inputClass} value={vendor.displayPrice} onChange={(event) => onUpdate(vendor.id, { displayPrice: event.target.value })} />
        </Field>
        <Field id="vendor-rating" label="Rating">
          <input id="vendor-rating" type="number" min="0" max="5" step="0.1" className={inputClass} value={vendor.rating} onChange={(event) => onUpdate(vendor.id, { rating: Number(event.target.value) })} />
        </Field>
        <Field id="vendor-review-count" label="Review count">
          <input id="vendor-review-count" type="number" min="0" step="1" className={inputClass} value={vendor.reviewCount} onChange={(event) => onUpdate(vendor.id, { reviewCount: Math.max(0, Math.floor(Number(event.target.value))) })} />
        </Field>
        <Field id="vendor-popularity" label="Popularity score">
          <input id="vendor-popularity" type="number" min="0" step="1" className={inputClass} value={vendor.popularity} onChange={(event) => onUpdate(vendor.id, { popularity: Math.max(0, Number(event.target.value)) })} />
        </Field>
        <div className="md:col-span-2">
          <Field id="vendor-main-image" label="Main image" hint="Safe local media path or HTTPS image URL. Upload integration can be added later if a safe marketplace media flow is approved.">
            <input id="vendor-main-image" className={inputClass} value={vendor.mainImage} onChange={(event) => onUpdate(vendor.id, { mainImage: event.target.value })} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field id="vendor-gallery-images" label="Gallery/example images" hint="One image reference per line.">
            <textarea id="vendor-gallery-images" className={textareaClass} value={vendor.galleryImages.join("\n")} onChange={(event) => onGalleryChange(vendor.id, event.target.value)} />
          </Field>
        </div>
        <Field id="vendor-phone" label="Phone">
          <input id="vendor-phone" className={inputClass} value={vendor.phone} onChange={(event) => onUpdate(vendor.id, { phone: event.target.value })} />
        </Field>
        <Field id="vendor-message-link" label="Message link">
          <input id="vendor-message-link" className={inputClass} value={vendor.messageLink} onChange={(event) => onUpdate(vendor.id, { messageLink: event.target.value })} />
        </Field>
        <Field id="vendor-telegram-link" label="Telegram link">
          <input id="vendor-telegram-link" className={inputClass} value={vendor.telegramLink} onChange={(event) => onUpdate(vendor.id, { telegramLink: event.target.value })} />
        </Field>
        <Field id="vendor-whatsapp-link" label="WhatsApp link">
          <input id="vendor-whatsapp-link" className={inputClass} value={vendor.whatsappLink} onChange={(event) => onUpdate(vendor.id, { whatsappLink: event.target.value })} />
        </Field>
        <Field id="vendor-instagram-link" label="Instagram link">
          <input id="vendor-instagram-link" className={inputClass} value={vendor.instagramLink} onChange={(event) => onUpdate(vendor.id, { instagramLink: event.target.value })} />
        </Field>
        <Field id="vendor-website-link" label="Website link">
          <input id="vendor-website-link" className={inputClass} value={vendor.websiteLink} onChange={(event) => onUpdate(vendor.id, { websiteLink: event.target.value })} />
        </Field>
        <div className="md:col-span-2">
          <Field id="vendor-tags" label="Tags/badges" hint="Comma-separated labels.">
            <input id="vendor-tags" className={inputClass} value={vendor.tags.join(", ")} onChange={(event) => onTagsChange(vendor.id, event.target.value)} />
          </Field>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-950">Packages</h3>
          <button type="button" className={buttonSecondary} onClick={() => onPackageAdd(vendor.id)}>
            <Plus className="h-4 w-4" />
            Add package
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {vendor.packages.map((pkg, index) => (
            <div key={pkg.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_44px]">
                <Field id={`package-name-${pkg.id}`} label={`Package ${index + 1} name`}>
                  <input id={`package-name-${pkg.id}`} className={inputClass} value={pkg.name} onChange={(event) => onPackageUpdate(vendor.id, pkg.id, { name: event.target.value })} />
                </Field>
                <Field id={`package-price-${pkg.id}`} label="Price">
                  <input id={`package-price-${pkg.id}`} className={inputClass} value={pkg.price} onChange={(event) => onPackageUpdate(vendor.id, pkg.id, { price: event.target.value })} />
                </Field>
                <button type="button" className={`${buttonDanger} mt-[26px] px-0`} onClick={() => onPackageDelete(vendor.id, pkg.id)} aria-label="Delete package">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3">
                <Field id={`package-description-${pkg.id}`} label="Description">
                  <textarea id={`package-description-${pkg.id}`} className={textareaClass} value={pkg.description} onChange={(event) => onPackageUpdate(vendor.id, pkg.id, { description: event.target.value })} />
                </Field>
              </div>
            </div>
          ))}
          {vendor.packages.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">No packages yet.</p>}
        </div>
      </div>
    </Panel>
  );
}

function PreviewAside({
  content,
  issues,
  selectedVendor,
  onOpenModal,
}: {
  content: PartnersContent;
  issues: PartnersValidationIssue[];
  selectedVendor: PartnerVendor | null;
  onOpenModal: (vendor: PartnerVendor) => void;
}) {
  const categoryMap = getCategoryMap(content.categories);
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  const publicPartners = getPublicPartners(content);
  const topPartners = publicPartners.filter((partner) => partner.featured);
  const standardPartners = publicPartners.filter((partner) => !partner.featured);

  return (
    <aside className="space-y-5 lg:sticky lg:top-[150px] lg:self-start">
      <Panel title="Validation" description={`${errors.length} error(s), ${warnings.length} warning(s)`}>
        {issues.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            Draft is ready to publish.
          </div>
        ) : (
          <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
            {issues.map((issue) => (
              <div key={issue.id} className={`rounded-lg border px-3 py-2 text-sm ${
                issue.severity === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-800"
              }`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{issue.message}</span>
                </div>
                <p className="mt-1 text-xs opacity-75">{issue.scope}{issue.targetId ? ` · ${issue.targetId}` : ""}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Card Preview" description="Uses the same card component as /partners.">
        {selectedVendor ? (
          <div className="bg-[#FAF7F2] p-3">
            <PartnerCard
              partner={selectedVendor}
              category={categoryMap.get(selectedVendor.categoryId)}
              onOpen={onOpenModal}
            />
          </div>
        ) : (
          <p className="text-sm text-slate-500">Select a vendor for preview.</p>
        )}
      </Panel>

      <Panel title="Page Preview" description="Key page content and public partner totals.">
        <div className="overflow-hidden rounded-lg border border-[#E9DDD6] bg-[#FFFDF9] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B46A67]">{content.page.eyebrow}</p>
          <h3 className="mt-2 text-2xl font-semibold text-[#1F1B18]" style={serifStyle}>{content.page.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#6F6863]">{content.page.subtitle}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
            <span className="rounded-lg bg-slate-100 px-2 py-2">{content.categories.filter((item) => item.enabled).length} categories</span>
            <span className="rounded-lg bg-slate-100 px-2 py-2">{publicPartners.length} public</span>
            <span className="rounded-lg bg-slate-100 px-2 py-2">{topPartners.length} top</span>
            <span className="rounded-lg bg-slate-100 px-2 py-2">{standardPartners.length} standard</span>
          </div>
        </div>
      </Panel>
    </aside>
  );
}
