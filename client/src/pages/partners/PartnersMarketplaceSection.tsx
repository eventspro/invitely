import { useMemo, useState, type CSSProperties } from "react";
import {
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
} from "lucide-react";
import { DEFAULT_PARTNERS_CONTENT } from "./partnersData";
import { PARTNER_ICON_COMPONENTS } from "./partnerIcons";
import PartnerCard from "./PartnerCard";
import PartnerDetailsModal from "./PartnerDetailsModal";
import type { PartnerCategory, PartnerVendor, PartnersContent } from "./partnersTypes";
import { sanitizeImageSrc } from "./partnersValidation";

type PriceFilter = "all" | "under-200" | "200-500" | "over-500";
type SortMode = "featured" | "popularity" | "rating" | "price-asc" | "price-desc";

const serifStyle: CSSProperties = { fontFamily: "var(--armenian-serif, serif)" };

function priceMatches(price: number | null, filter: PriceFilter) {
  if (filter === "all" || price === null) return true;
  if (filter === "under-200") return price < 200000;
  if (filter === "200-500") return price >= 200000 && price <= 500000;
  if (filter === "over-500") return price > 500000;
  return true;
}

function categoryById(categories: PartnerCategory[]) {
  return new Map(categories.map((category) => [category.id, category]));
}

export default function PartnersMarketplaceSection({
  content = DEFAULT_PARTNERS_CONTENT,
}: {
  content?: PartnersContent;
}) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("featured");
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
  const [selectedPartner, setSelectedPartner] = useState<PartnerVendor | null>(null);

  const categories = useMemo(
    () => content.categories.filter((category) => category.enabled).sort((a, b) => a.order - b.order),
    [content.categories],
  );
  const categoryMap = useMemo(() => categoryById(categories), [categories]);

  const publicPartners = useMemo(
    () =>
      content.vendors
        .filter((partner) => partner.enabled && partner.status === "published" && categoryMap.has(partner.categoryId))
        .sort((a, b) => a.featuredOrder - b.featuredOrder),
    [categoryMap, content.vendors],
  );

  const cityOptions = useMemo(
    () => Array.from(new Set(publicPartners.map((partner) => partner.city).filter(Boolean))).sort((a, b) => a.localeCompare(b, "hy")),
    [publicPartners],
  );

  const filteredPartners = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("hy-AM");

    return publicPartners
      .filter((partner) => activeCategory === "all" || partner.categoryId === activeCategory)
      .filter((partner) => cityFilter === "all" || partner.city === cityFilter)
      .filter((partner) => priceMatches(partner.priceFrom, priceFilter))
      .filter((partner) => {
        if (!normalizedQuery) return true;
        const category = categoryMap.get(partner.categoryId);
        const haystack = `${partner.name} ${category?.label ?? ""} ${partner.shortDescription} ${partner.city}`.toLocaleLowerCase("hy-AM");
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (sortMode === "rating") return b.rating - a.rating || b.reviewCount - a.reviewCount;
        if (sortMode === "price-asc") return (a.priceFrom ?? Number.MAX_SAFE_INTEGER) - (b.priceFrom ?? Number.MAX_SAFE_INTEGER);
        if (sortMode === "price-desc") return (b.priceFrom ?? 0) - (a.priceFrom ?? 0);
        if (sortMode === "popularity") return b.popularity - a.popularity || b.rating - a.rating;
        return Number(b.featured) - Number(a.featured) || a.featuredOrder - b.featuredOrder || b.popularity - a.popularity;
      });
  }, [activeCategory, categoryMap, cityFilter, priceFilter, publicPartners, query, sortMode]);

  const topPartners = useMemo(() => filteredPartners.filter((partner) => partner.featured), [filteredPartners]);
  const standardPartners = useMemo(() => filteredPartners.filter((partner) => !partner.featured), [filteredPartners]);

  const toggleFavorite = (partnerId: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(partnerId)) next.delete(partnerId);
      else next.add(partnerId);
      return next;
    });
  };

  const heroImage = sanitizeImageSrc(content.page.heroImage);

  const renderPartnerGrid = (partners: PartnerVendor[], columnsClass = "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4") => (
    <div className={`mt-5 grid gap-4 ${columnsClass}`}>
      {partners.map((partner) => (
        <PartnerCard
          key={partner.id}
          partner={partner}
          category={categoryMap.get(partner.categoryId)}
          favorite={favorites.has(partner.id)}
          onToggleFavorite={toggleFavorite}
          onOpen={setSelectedPartner}
        />
      ))}
    </div>
  );

  return (
    <section id="partners" className="scroll-mt-16 bg-[#FAF7F2] px-4 pb-14 pt-8 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-lg border border-[#E9DDD6] bg-[#FFFDF9] px-5 py-12 shadow-[0_18px_55px_rgba(31,27,24,0.06)] sm:px-8 lg:px-12">
          <img
            src={heroImage}
            alt=""
            width={1200}
            height={700}
            decoding="async"
            className="absolute inset-y-0 right-0 hidden h-full w-[46%] object-cover opacity-20 lg:block"
          />
          <div className="relative max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B46A67] sm:text-[11px]">
              {content.page.eyebrow}
            </p>
            <h1 className="mt-3 text-[clamp(2rem,7vw,4.4rem)] font-semibold leading-[1.03] text-[#1F1B18]" style={serifStyle}>
              {content.page.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#6F6863] sm:text-lg">
              {content.page.subtitle}
            </p>
          </div>
        </div>

        <div className="sticky top-16 z-30 mt-6 overflow-hidden rounded-lg border border-[#E9DDD6] bg-[#FFFDF9]/95 p-2 shadow-[0_16px_45px_rgba(31,27,24,0.07)] backdrop-blur">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Partner categories">
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
              className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                activeCategory === "all"
                  ? "border-[#C98F8B] bg-[#FFF0EF] text-[#1F1B18] shadow-sm"
                  : "border-[#E9DDD6] bg-white text-[#6F6863] hover:border-[#D8C5BD] hover:text-[#1F1B18]"
              }`}
            >
              <Sparkles className={`h-4 w-4 ${activeCategory === "all" ? "text-[#B46A67]" : "text-[#9E938C]"}`} />
              <span className="whitespace-nowrap">Բոլորը</span>
            </button>
            {categories.map((category) => {
              const selected = activeCategory === category.id;
              const Icon = PARTNER_ICON_COMPONENTS[category.icon] ?? Sparkles;
              return (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveCategory(category.id)}
                  className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    selected
                      ? "border-[#C98F8B] bg-[#FFF0EF] text-[#1F1B18] shadow-sm"
                      : "border-[#E9DDD6] bg-white text-[#6F6863] hover:border-[#D8C5BD] hover:text-[#1F1B18]"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${selected ? "text-[#B46A67]" : "text-[#9E938C]"}`} />
                  <span className="whitespace-nowrap">{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-[#E9DDD6] bg-white p-3 shadow-[0_12px_36px_rgba(31,27,24,0.04)] sm:p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.35fr)_repeat(3,minmax(160px,0.65fr))]">
            <label className="relative block">
              <span className="sr-only">Search vendors</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E938C]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Որոնել գործընկեր"
                className="min-h-[46px] w-full rounded-full border border-[#E9DDD6] bg-[#FFFDF9] pl-10 pr-4 text-sm text-[#1F1B18] outline-none transition placeholder:text-[#9E938C] focus:border-[#C98F8B] focus:bg-white"
              />
            </label>

            <label className="relative block">
              <span className="sr-only">Price</span>
              <select
                value={priceFilter}
                onChange={(event) => setPriceFilter(event.target.value as PriceFilter)}
                className="min-h-[46px] w-full appearance-none rounded-full border border-[#E9DDD6] bg-[#FFFDF9] px-4 pr-9 text-sm font-semibold text-[#1F1B18] outline-none transition focus:border-[#C98F8B] focus:bg-white"
              >
                <option value="all">Ցանկացած գին</option>
                <option value="under-200">մինչև 200k ֏</option>
                <option value="200-500">200k-500k ֏</option>
                <option value="over-500">500k ֏+</option>
              </select>
              <SlidersHorizontal className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E938C]" />
            </label>

            <label className="relative block">
              <span className="sr-only">Location</span>
              <select
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                className="min-h-[46px] w-full appearance-none rounded-full border border-[#E9DDD6] bg-[#FFFDF9] px-4 pr-9 text-sm font-semibold text-[#1F1B18] outline-none transition focus:border-[#C98F8B] focus:bg-white"
              >
                <option value="all">Բոլոր քաղաքները</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <MapPin className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E938C]" />
            </label>

            <label className="relative block">
              <span className="sr-only">Sort</span>
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="min-h-[46px] w-full appearance-none rounded-full border border-[#E9DDD6] bg-[#FFFDF9] px-4 pr-9 text-sm font-semibold text-[#1F1B18] outline-none transition focus:border-[#C98F8B] focus:bg-white"
              >
                <option value="featured">Առաջարկվող</option>
                <option value="popularity">Հանրաճանաչ</option>
                <option value="rating">Վարկանիշ</option>
                <option value="price-asc">Գինը՝ ցածր</option>
                <option value="price-desc">Գինը՝ բարձր</option>
              </select>
              <Star className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E938C]" />
            </label>
          </div>
        </div>

        {topPartners.length > 0 && (
          <section className="mt-8" aria-labelledby="top-partners-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B46A67]">Top partners</p>
                <h2 id="top-partners-heading" className="mt-2 text-2xl font-semibold text-[#1F1B18]" style={serifStyle}>
                  Featured partner selection
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#6F6863]">
                <span>{filteredPartners.length} partners found</span>
                <span className="inline-flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-[#B46A67]" />
                  {favorites.size} saved
                </span>
              </div>
            </div>
            {renderPartnerGrid(topPartners, "sm:grid-cols-2 lg:grid-cols-3")}
          </section>
        )}

        {standardPartners.length > 0 && (
          <section className={topPartners.length > 0 ? "mt-12" : "mt-8"} aria-labelledby="standard-partners-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B46A67]">Standard partners</p>
                <h2 id="standard-partners-heading" className="mt-2 text-2xl font-semibold text-[#1F1B18]" style={serifStyle}>
                  All standard partners
                </h2>
              </div>
              {topPartners.length === 0 && (
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#6F6863]">
                  <span>{filteredPartners.length} partners found</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-[#B46A67]" />
                    {favorites.size} saved
                  </span>
                </div>
              )}
            </div>
            {renderPartnerGrid(standardPartners)}
          </section>
        )}

        {filteredPartners.length === 0 && (
          <div className="mt-8 rounded-lg border border-[#E9DDD6] bg-white px-5 py-8 text-center text-sm text-[#6F6863]">
            Գործընկեր չի գտնվել։
          </div>
        )}

      </div>

      {selectedPartner && (
        <PartnerDetailsModal
          partner={selectedPartner}
          category={categoryMap.get(selectedPartner.categoryId)}
          onClose={() => setSelectedPartner(null)}
        />
      )}
    </section>
  );
}
