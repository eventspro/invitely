import { useEffect, useState, type CSSProperties, type ElementType } from "react";
import { CheckCircle, Clock, Heart, Lock, Sparkles, Star, Users } from "lucide-react";
import {
  fetchHomepageContentFromServer,
  loadHomepageContent,
  saveHomepageContent,
} from "@/content/homepage/homepageContentStorage";
import type { FooterSection } from "@/content/homepage/homepageContentTypes";

const serifStyle: CSSProperties = { fontFamily: "var(--armenian-serif, serif)" };

const FOOTER_ICON_MAP: Record<string, ElementType> = {
  check: CheckCircle,
  clock: Clock,
  heart: Heart,
  lock: Lock,
  sparkles: Sparkles,
  star: Star,
  users: Users,
};

function FooterIcon({ name, className }: { name: string; className?: string }) {
  const Icon = FOOTER_ICON_MAP[name] ?? Sparkles;
  return <Icon className={className} />;
}

export default function MainSiteFooter({ footer: providedFooter }: { footer?: FooterSection }) {
  const [footer, setFooter] = useState<FooterSection>(() => providedFooter ?? loadHomepageContent().footer);

  useEffect(() => {
    if (providedFooter) {
      setFooter(providedFooter);
      return;
    }

    let cancelled = false;

    fetchHomepageContentFromServer().then((serverContent) => {
      if (cancelled || !serverContent) return;
      setFooter(serverContent.footer);
      saveHomepageContent(serverContent);
    });

    const refresh = () => setFooter(loadHomepageContent().footer);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "homepage_content_prototype_v1") refresh();
    };

    window.addEventListener("homepage-content-updated", refresh);
    window.addEventListener("storage", handleStorage);

    return () => {
      cancelled = true;
      window.removeEventListener("homepage-content-updated", refresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, [providedFooter]);

  const trustItems = footer.trustItems
    .filter((item) => item.visible)
    .map((item) => ({
      icon: item.icon,
      title: item.title.hy,
      text: item.text.hy,
    }));

  return (
    <footer className="border-t border-[#d8b66a]/20 bg-[#fff8ef] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map(({ icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-[#e4d1b1] bg-white/70 p-4">
              <FooterIcon name={icon} className="mb-3 h-5 w-5 text-[#c9a85a]" />
              <p className="text-sm font-semibold text-[#14251d]">{title}</p>
              <p className="mt-1 text-xs leading-5 text-[#71685f]">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-[#d8b66a]/20 pt-6 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-2.5">
            <Heart className="h-4 w-4 fill-[#c9a85a] text-[#c9a85a]" />
            <span className="font-semibold text-[#14251d]" style={serifStyle}>
              4ever.am
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-[#71685f]">
            <span>{footer.email}</span>
            <span>{footer.phone}</span>
          </div>
          <p className="text-xs text-[#71685f]">{footer.copyright.hy}</p>
        </div>
      </div>
    </footer>
  );
}
