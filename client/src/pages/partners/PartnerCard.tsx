import type { CSSProperties, ReactNode } from "react";
import { Heart, Instagram, MapPin, MessageCircle, Phone, Send, Star } from "lucide-react";
import type { PartnerCategory, PartnerVendor } from "./partnersTypes";
import { sanitizeContactHref, sanitizeImageSrc } from "./partnersValidation";

const serifStyle: CSSProperties = { fontFamily: "var(--armenian-serif, serif)" };

export function formatPartnerPrice(partner: PartnerVendor): string {
  if (partner.displayPrice.trim()) return partner.displayPrice.trim();
  if (partner.priceFrom === null) return "Գինը՝ հարցմամբ";
  const formatted = new Intl.NumberFormat("hy-AM").format(partner.priceFrom);
  return partner.currency === "AMD" ? `սկսած ${formatted} ֏` : `սկսած ${formatted} ${partner.currency}`;
}

function ContactIconLink({
  href,
  label,
  children,
}: {
  href?: string;
  label: string;
  children: ReactNode;
}) {
  const safeHref = href ? sanitizeContactHref(href) : undefined;

  if (!safeHref) {
    return (
      <span
        aria-label={`${label} unavailable`}
        title={`${label} unavailable`}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E9DDD6] bg-[#FAF7F2] text-[#B8AEA7]"
      >
        {children}
      </span>
    );
  }

  const external = safeHref.startsWith("https:");

  return (
    <a
      href={safeHref}
      aria-label={label}
      title={label}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E9DDD6] bg-white text-[#1F1B18] transition hover:border-[#C98F8B] hover:bg-[#FFF5F3] hover:text-[#B46A67]"
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </a>
  );
}

export default function PartnerCard({
  partner,
  category,
  favorite = false,
  onToggleFavorite,
  onOpen,
}: {
  partner: PartnerVendor;
  category?: PartnerCategory;
  favorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onOpen: (partner: PartnerVendor) => void;
}) {
  const contactHref = partner.telegramLink || partner.whatsappLink || partner.instagramLink || partner.messageLink;
  const categoryLabel = category?.label ?? partner.categoryId;
  const mainImage = sanitizeImageSrc(partner.mainImage);

  return (
    <article className="group overflow-hidden rounded-lg border border-[#E9DDD6] bg-white shadow-[0_14px_38px_rgba(31,27,24,0.06)] transition hover:-translate-y-1 hover:border-[#D8C5BD] hover:shadow-[0_22px_50px_rgba(31,27,24,0.09)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F2E8E1]">
        <img
          src={mainImage}
          alt={partner.name}
          width={640}
          height={480}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
          <span className="rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#6F6863] shadow-sm backdrop-blur">
            {categoryLabel}
          </span>
          <button
            type="button"
            aria-label={favorite ? "Remove from saved partners" : "Save partner"}
            title={favorite ? "Remove from saved partners" : "Save partner"}
            onClick={() => onToggleFavorite?.(partner.id)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-sm backdrop-blur transition ${
              favorite
                ? "border-[#C98F8B] bg-[#FFF5F3] text-[#B46A67]"
                : "border-white/80 bg-white/90 text-[#6F6863] hover:border-[#C98F8B] hover:text-[#B46A67]"
            }`}
          >
            <Heart className={`h-4 w-4 ${favorite ? "fill-[#B46A67]" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[17px] font-semibold leading-snug text-[#1F1B18]" style={serifStyle}>
              {partner.name || "Unnamed vendor"}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-[#6F6863]">
              <MapPin className="h-3.5 w-3.5 text-[#B46A67]" />
              {partner.city || "Location not set"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#FFF5F3] px-2.5 py-1 text-xs font-semibold text-[#1F1B18]">
            <Star className="h-3.5 w-3.5 fill-[#B46A67] text-[#B46A67]" />
            {partner.rating.toFixed(1)}
          </div>
        </div>

        <p className="mt-3 min-h-[42px] text-sm leading-6 text-[#6F6863]">{partner.shortDescription}</p>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#F0E7E1] pt-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9E938C]">Գին</p>
            <p className="mt-1 text-base font-semibold text-[#1F1B18]">{formatPartnerPrice(partner)}</p>
          </div>
          <p className="text-xs text-[#6F6863]">{partner.reviewCount} կարծիք</p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ContactIconLink href={partner.phone ? `tel:${partner.phone}` : undefined} label="Phone">
              <Phone className="h-4 w-4" />
            </ContactIconLink>
            <ContactIconLink href={partner.messageLink} label="Message">
              <MessageCircle className="h-4 w-4" />
            </ContactIconLink>
            <ContactIconLink href={contactHref} label="Social contact">
              {partner.telegramLink ? (
                <Send className="h-4 w-4" />
              ) : partner.instagramLink ? (
                <Instagram className="h-4 w-4" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
            </ContactIconLink>
          </div>
          <button
            type="button"
            onClick={() => onOpen(partner)}
            className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-[#1F1B18] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3A302A]"
          >
            Մանրամասներ
          </button>
        </div>
      </div>
    </article>
  );
}
