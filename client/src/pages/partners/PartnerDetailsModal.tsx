import { useEffect, type CSSProperties } from "react";
import { ExternalLink, Instagram, MapPin, MessageCircle, Phone, Send, Star, X } from "lucide-react";
import type { PartnerCategory, PartnerVendor } from "./partnersTypes";
import { formatPartnerPrice } from "./PartnerCard";
import { sanitizeContactHref, sanitizeImageSrc } from "./partnersValidation";

const serifStyle: CSSProperties = { fontFamily: "var(--armenian-serif, serif)" };

export default function PartnerDetailsModal({
  partner,
  category,
  onClose,
}: {
  partner: PartnerVendor;
  category?: PartnerCategory;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const contactButtons = [
    { label: "Phone", href: partner.phone ? `tel:${partner.phone}` : "", Icon: Phone },
    { label: "Message", href: partner.messageLink, Icon: MessageCircle },
    { label: "Telegram", href: partner.telegramLink, Icon: Send },
    { label: "WhatsApp", href: partner.whatsappLink, Icon: MessageCircle },
    { label: "Instagram", href: partner.instagramLink, Icon: Instagram },
    { label: "Website", href: partner.websiteLink, Icon: ExternalLink },
  ]
    .map((item) => ({ ...item, href: sanitizeContactHref(item.href) }))
    .filter((item): item is { label: string; href: string; Icon: typeof Phone } => Boolean(item.href));

  const gallery = [partner.mainImage, ...partner.galleryImages]
    .filter(Boolean)
    .map((image) => sanitizeImageSrc(image));

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-[#1F1B18]/55 px-3 py-4 backdrop-blur-sm sm:px-6 sm:py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="partner-details-title"
    >
      <button type="button" className="fixed inset-0 cursor-default" aria-label="Close details" onClick={onClose} />

      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-lg border border-[#E9DDD6] bg-[#FFFDF9] shadow-[0_32px_90px_rgba(31,27,24,0.25)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E9DDD6] bg-white text-[#1F1B18] shadow-sm transition hover:border-[#C98F8B] hover:text-[#B46A67]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <div className="bg-[#F2E8E1]">
            <div className="aspect-[4/3] overflow-hidden lg:h-full lg:min-h-[520px]">
              <img
                src={sanitizeImageSrc(partner.mainImage)}
                alt={partner.name}
                width={920}
                height={690}
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="p-5 sm:p-7 lg:p-8">
            <span className="inline-flex rounded-full border border-[#E9DDD6] bg-white px-3 py-1 text-xs font-semibold text-[#6F6863]">
              {category?.label ?? partner.categoryId}
            </span>

            <h3 id="partner-details-title" className="mt-4 text-[clamp(1.55rem,5vw,2.35rem)] font-semibold leading-tight text-[#1F1B18]" style={serifStyle}>
              {partner.name || "Unnamed vendor"}
            </h3>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#6F6863]">
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-[#B46A67] text-[#B46A67]" />
                {partner.rating.toFixed(1)} · {partner.reviewCount} կարծիք
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#B46A67]" />
                {partner.city || "Location not set"}
              </span>
            </div>

            <p className="mt-5 text-[15px] leading-7 text-[#6F6863]">
              {partner.fullDescription || partner.shortDescription}
            </p>

            {partner.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {partner.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-[#E9DDD6] bg-white px-3 py-1 text-xs font-semibold text-[#6F6863]">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 rounded-lg border border-[#E9DDD6] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9E938C]">Փաթեթներ</p>
              <p className="mt-1 text-xl font-semibold text-[#1F1B18]">{formatPartnerPrice(partner)}</p>
              <div className="mt-4 grid gap-2">
                {partner.packages.length > 0 ? (
                  partner.packages.map((item) => (
                    <div key={item.id} className="rounded-lg border border-[#F0E7E1] bg-[#FAF7F2] px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-[#1F1B18]">{item.name || "Package"}</span>
                        {item.price && <span className="text-xs font-semibold text-[#B46A67]">{item.price}</span>}
                      </div>
                      {item.description && <p className="mt-1 text-xs leading-5 text-[#6F6863]">{item.description}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#6F6863]">Փաթեթները կավելացվեն շուտով:</p>
                )}
              </div>
            </div>

            {gallery.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9E938C]">Օրինակներ</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {gallery.slice(0, 6).map((image, index) => (
                    <img
                      key={`${image}-${index}`}
                      src={image}
                      alt=""
                      width={180}
                      height={135}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/3] rounded-lg border border-[#E9DDD6] object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {contactButtons.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("https:") ? "_blank" : undefined}
                  rel={href.startsWith("https:") ? "noreferrer" : undefined}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#E9DDD6] bg-white px-4 py-2 text-sm font-semibold text-[#1F1B18] transition hover:border-[#C98F8B] hover:bg-[#FFF5F3] hover:text-[#B46A67]"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
