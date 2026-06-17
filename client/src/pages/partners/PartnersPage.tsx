import { useEffect, useState, type CSSProperties } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import MainSiteFooter from "@/components/MainSiteFooter";
import { DEFAULT_PARTNERS_CONTENT } from "./partnersData";
import PartnersMarketplaceSection from "./PartnersMarketplaceSection";
import { fetchPublishedPartnersContent } from "./partnersStorage";
import type { PartnersContent } from "./partnersTypes";

const serifStyle: CSSProperties = { fontFamily: "var(--armenian-serif, serif)" };

export default function PartnersPage() {
  const [content, setContent] = useState<PartnersContent>(DEFAULT_PARTNERS_CONTENT);

  useEffect(() => {
    let cancelled = false;
    fetchPublishedPartnersContent().then((publishedContent) => {
      if (!cancelled && publishedContent) setContent(publishedContent);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F1B18]">
      <header className="sticky top-0 z-50 border-b border-[#E9DDD6] bg-[#FFFDF9]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2.5 text-[#1F1B18]" aria-label="4ever.am">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E9DDD6] bg-white text-[#B46A67]">
              <Heart className="h-4 w-4 fill-[#B46A67]" />
            </span>
            <span className="text-lg font-semibold tracking-wide" style={serifStyle}>
              4ever.am
            </span>
          </a>

          <a
            href="/"
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#E9DDD6] bg-white px-4 py-2 text-sm font-semibold text-[#1F1B18] transition hover:border-[#C98F8B] hover:bg-[#FFF5F3] hover:text-[#B46A67]"
          >
            <ArrowLeft className="h-4 w-4" />
            Գլխավոր
          </a>
        </div>
      </header>

      <main>
        <PartnersMarketplaceSection content={content} />
      </main>
      <MainSiteFooter />
    </div>
  );
}
