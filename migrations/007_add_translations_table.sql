-- Create translations table for multi-language support
CREATE TABLE IF NOT EXISTS translations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT NOT NULL UNIQUE,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add template_version column to templates table if it doesn't exist
ALTER TABLE templates ADD COLUMN IF NOT EXISTS template_version INTEGER DEFAULT 1;

-- Create index on language for faster lookups
CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(language);
CREATE INDEX IF NOT EXISTS idx_translations_active ON translations(is_active);

-- Insert default Armenian translation (from production data)
INSERT INTO translations (id, language, config, is_active, version, created_at, updated_at)
VALUES (
  '9b81501f-071e-4b5b-ac0a-fba0fb8a4f6a',
  'hy',
  '{"faq": {"items": [{"answer": "Յուրաքանչյուր պլան ներառում է գեղեցիկ նախագծված հարսանեկան կայքի ձևանմուշ, RSVP ֆունկցիոնալություն և հյուրերի կառավարում: Բարձր մակարդակների պլանները ավելացնում են պրեմիում հնարավորություններ, ինչպիսիք են լուսանկարների պատկերասրահները, երաժշտական ինտեգրումը, ադմին վահանակները և ֆիզիկական QR կոդի քարտերը:", "question": "Ինչ է ներառված յուրաքանչյուր պլանում?"}, {"answer": "Բոլորովին! Բոլոր ձևանմուշները լիովին հարմարեցվող են: Դուք կարող եք փոխել գույները, տառատեսակները, բովանդակությունը, լուսանկարները և դասավորության տարրերը ձեր հարսանեկան ոճին համապատասխան: Մասնագիտական և ավելի բարձր պլանները ներառում են ադմին վահանակ հեշտ հարմարեցման համար:", "question": "Կարող եմ հարմարեցնել իմ ձևանմուշը?"}, {"answer": "QR Կոդի Քարտերը ֆիզիկական քարտեր են QR կոդերով, որոնք ուղղակիորեն կապվում են ձեր հարսանեկան կայքի հետ: Կատարյալ է հարսանեկան հրավիրատոմսերի, սեղանի դեկորների կամ save-the-dates-ի համար: Պրեմիումը ներառում է 50 քարտ, Վերջնականը ներառում է 100 քարտ:", "question": "Ինչ են QR Կոդի Քարտերը?"}, {"answer": "Բոլոր պլանները ներառում են RSVP ֆունկցիոնալություն, որտեղ հյուրերը կարող են հաստատել ներկայությունը և կերակրի նախապատվությունները: Դուք կարող եք արտահանել հյուրերի ցանկերը և հետևել պատասխաններին իրական ժամանակում ձեր կայքի վահանակի միջոցով:", "question": "Ինչպե՞ս կառավարել RSVP-ները?"}], "title": "Հաճախ Տրվող Հարցեր"}, "hero": {"cta": "Սկսել Այսօր", "title": "Ստեղծեք Ձեր Կատարյալ Հարսանեկան Կայքը", "subtitle": "Գեղեցիկ հարսանեկան հրավիրատոմսեր, որոնք արտահայտում են ձեր սիրո պատմությունը", "viewTemplates": "Տեսնել Բոլոր Ձևանմուշները"}, "common": {"currency": "դրամ", "included": "Ներառված", "viewMore": "Տեսնել Ավելին", "learnMore": "Իմանալ Ավելին", "getStarted": "Սկսել", "notIncluded": "Չի ներառվում"}, "footer": {"contact": {"email": "Էլ. փոստ: info@weddingsites.com", "phone": "Հեռախոս: +1 (555) 123-4567", "title": "Կապ", "support": "Աջակցություն: support@weddingsites.com"}, "tagline": "Գեղեցիկ հարսանեկան կայքեր ձեր հատուկ օրվա համար", "features": {"title": "Հնարավորություններ", "photoGalleries": "Լուսանկարների Պատկերասրահներ", "rsvpManagement": "RSVP Կառավարում", "armenianSupport": "Հայերեն Աջակցություն", "mobileResponsive": "Բջջային Հարմարեցված"}, "services": {"title": "Ծառայություններ", "support": "Աջակցություն", "templateDesign": "Ձևանմուշների Դիզայն", "weddingWebsites": "Հարսանեկան Կայքեր", "customDevelopment": "Անհատական Մշակում"}, "copyright": "© 2025 WeddingSites: Բոլոր իրավունքները պաշտպանված են:"}, "contact": {"cta": "Սկսել Կառուցել Հիմա", "title": "Պատրա՞ստ եք ստեղծել ձեր հարսանեկան կայքը:", "subtitle": "Սկսեք այսօր և ստեղծեք գեղեցիկ կայք ձեր հատուկ օրվա համար"}, "features": {"items": [{"title": "Գեղեցիկ Ձևանմուշներ", "description": "Ընտրեք գրավիչ, մասնագիտորեն նախագծված ձևանմուշներից"}, {"title": "RSVP Կառավարում", "description": "Հեշտությամբ հետևեք և կառավարեք հյուրերի պատասխանները մեր ներկառուցված RSVP համակարգով"}, {"title": "Բջջային Հարմարեցված", "description": "Կատարյալ ցուցադրում բոլոր սարքերում -սմարթֆոն, համակարգիչ, պլանշետ և այլն․"}, {"title": "Հեշտ Հարմարեցում", "description": "Անհատականացրեք գույները, տառատեսակները և բովանդակությունը ըստ ձեր ցանկության"}, {"title": "Լուսանկարներ", "description": "Վերբեռնեք և ցուցադրեք գեղեցիկ հարսանեկան լուսանկարներ, որը հնարավորություն կտա հյուրերին տեսնել հարսանեկան լուսանկարները"}, {"title": "Անվտանգ և Արագ", "description": "Կառուցված է ժամանակակից տեխնոլոգիաներով արագության, անվտանգության և հուսալիության համար"}], "title": "Ամեն Ինչ, Ինչ Անհրաժեշտ Է Ձեր Հարսանեկան Կայքի Համար", "subtitle": "Արագ և հեշտ"}}',
  TRUE,
  8,
  NOW(),
  NOW()
)
ON CONFLICT (language) DO NOTHING;
