import type { HomepageContent } from "./homepageContentTypes";

/**
 * Default homepage content — ALL Armenian (hy) values use Unicode U+0531–U+058A only.
 * Sourced from homepage-prototype.tsx via programmatic extraction.
 */
export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  navigation: {
    items: [
      { id: "nav-templates",  label: { hy: "Կաղապարներ",  en: "Templates",        ru: "Шаблоны"          }, href: "#templates",        visible: true },
      { id: "nav-advantages", label: { hy: "Առավելություններ", en: "Advantages",       ru: "Преимущества"     }, href: "#features",         visible: true },
      { id: "nav-howitworks", label: { hy: "Գործընթաց", en: "How It Works",     ru: "Как это работает" }, href: "#how-it-works",     visible: true },
      { id: "nav-guest",      label: { hy: "Հյուրերի փորձ", en: "Guest Experience", ru: "Опыт гостей"      }, href: "#guest-experience", visible: true },
      { id: "nav-contact",    label: { hy: "Կապ", en: "Contact",          ru: "Контакт"          }, href: "#contact",          visible: true },
      { id: "nav-planner",    label: { hy: "Wedding Planner", en: "Wedding Planner",  ru: "Wedding Planner"  }, href: "/planner-prototype", visible: true },
    ],
    loginLabel: { hy: "Դեմո",  en: "Demo",        ru: "Демо"  },
    startLabel: { hy: "Փորձել", en: "Get started", ru: "Начать" },
  },

  hero: {
    eyebrow:        { hy: "ՍԻՐԱՀԱՐ ԶՈՒՅԳԵՐԻ ՀԱՄԱՐ",   en: "FOR LOVING COUPLES",           ru: "ДЛЯ ВЛЮБЛЁННЫХ ПАР"          },
    title:          { hy: "Ստեղծեք հիշվող հարսանեկան կայք",      en: "Create a",                     ru: "Создайте"                    },
    titleHighlight: { hy: "ձեր հատուկ օրվա",  en: "memorable wedding website",    ru: "незабываемый свадебный сайт" },
    titleSuffix:    { hy: "համար",     en: "for your special day",         ru: "для вашего особенного дня"   },
    subtitle: {
      hy: "Հրավեր, լուսանկարներ, վայր, ժամանակացույց, RSVP պատասխաններ և բոլոր մանրամասները՝ մեկ նուրբ հղումով։",
      en: "Invitations, photos, venue, schedule, RSVP responses and all the details — in one elegant link.",
      ru: "Приглашение, фотографии, место, расписание, ответы на RSVP и все детали — в одной изящной ссылке.",
    },
    primaryCta:   { label: { hy: "Փորձել դեմոն",   en: "Try the demo",   ru: "Попробовать демо"  }, href: "/demo/david-rose-romantic", visible: true },
    secondaryCta: { label: { hy: "Դիտել կաղապարները", en: "View templates", ru: "Смотреть шаблоны" }, href: "#templates",               visible: true },
    chips: [
      { id: "chip-rsvp",   label: { hy: "RSVP",          en: "RSVP",     ru: "RSVP"            }, visible: true },
      { id: "chip-map",    label: { hy: "Քարտեզ",    en: "Map",      ru: "Карта"         }, visible: true },
      { id: "chip-photos", label: { hy: "Լուսանկարներ", en: "Photos",   ru: "Фотографии"  }, visible: true },
      { id: "chip-link",   label: { hy: "Մեկ հղում",  en: "One link", ru: "Одна ссылка" }, visible: true },
    ],
    backgroundImage: "/attached_assets/couple11.jpg",
    phonePreviewUrl: "/david-rose-romantic",
  },

  templates: {
    eyebrow: { hy: "ՊՐԵՄԻՈՒՄ ԿԱՂԱՊԱՐՆԵՐ", en: "PREMIUM TEMPLATES",  ru: "ПРЕМИУМ ШАБЛОНЫ"     },
    title:   { hy: "ԸՆՏՐԵՔ ՁԵՐ ՈՃԸ", en: "CHOOSE YOUR STYLE",  ru: "ВЫБЕРИТЕ СВОЙ СТИЛЬ" },
    items: [
      { id: "tpl-1", name: { hy: "Դավիթ և Ռոզա", en: "Golden Classic", ru: "Золотая классика"   }, description: { hy: "Նուրբ վոչին և հանդիսավոր", en: "Elegant and ceremonious", ru: "Элегантный и торжественный" }, tag: { hy: "նուրբ և հանդիսավոր", en: "Elegant & Grand",    ru: "Элегантный и торжественный" }, price: { hy: "25,000 ֏", en: "֏25,000", ru: "֏25 000" }, image: "/template_previews/img1.webp", href: "/david-rose-romantic",        buttonLabel: { hy: "Դիտել", en: "Preview", ru: "Просмотр" }, visible: true },
      { id: "tpl-2", name: { hy: "Աուրելիա", en: "Forest Love",    ru: "Лесная любовь"      }, description: { hy: "Հանգիստ և բնական", en: "Peaceful and natural",    ru: "Спокойный и природный"      }, tag: { hy: "խաղաղ և բնական", en: "Peaceful & Natural", ru: "Тихий и природный"          }, price: { hy: "25,000 ֏", en: "֏25,000", ru: "֏25 000" }, image: "/template_previews/img3.webp", href: "/forest-lily-nature",         buttonLabel: { hy: "Դիտել", en: "Preview", ru: "Просмотр" }, visible: true },
      { id: "tpl-3", name: { hy: "Ֆլորենս Էթերնալ", en: "White Light",    ru: "Белый свет"          }, description: { hy: "Մաքուր և քնքուշ", en: "Clean and soft",          ru: "Чистый и нежный"            }, tag: { hy: "մաքուր և քնքուշ", en: "Clean & Soft",       ru: "Чистый и нежный"            }, price: { hy: "25,000 ֏", en: "֏25,000", ru: "֏25 000" }, image: "/template_previews/img4.webp", href: "/michael-sarah-classic",      buttonLabel: { hy: "Դիտել", en: "Preview", ru: "Просмотр" }, visible: true },
      { id: "tpl-4", name: { hy: "Ամալֆի", en: "Coastal Luxe",   ru: "Прибрежная роскошь" }, description: { hy: "Լուսավոր և բարդզրակարգ", en: "Bright and upscale",      ru: "Светлый и изысканный"       }, tag: { hy: "լուսավոր և Պրեմիում", en: "Bright & Upscale", ru: "Светлый и изысканный"       }, price: { hy: "25,000 ֏", en: "֏25,000", ru: "֏25 000" }, image: "/template_previews/img5.webp", href: "/alexander-isabella-elegant", buttonLabel: { hy: "Դիտել", en: "Preview", ru: "Просмотр" }, visible: true },
      { id: "tpl-5", name: { hy: "Դասական", en: "Rose Evening",   ru: "Розовый вечер"       }, description: { hy: "Ռոմանտիկ և տակ", en: "Romantic and warm",       ru: "Романтичный и тёплый"       }, tag: { hy: "ռոմանտիկ և տակ", en: "Romantic & Warm",    ru: "Романтичный и тёплый"       }, price: { hy: "20,000 ֏", en: "֏20,000", ru: "֏20 000" }, image: "/template_previews/img1.webp", href: "/david-rose-romantic",        buttonLabel: { hy: "Դիտել", en: "Preview", ru: "Просмотр" }, visible: true },
      { id: "tpl-6", name: { hy: "Մինիմալ", en: "Minimal",        ru: "Минимал"                }, description: { hy: "Պարզ և նուրբ", en: "Simple and delicate",     ru: "Простой и нежный"           }, tag: { hy: "պարզ և նուրբ", en: "Simple & Elegant",   ru: "Простой и элегантный"   }, price: { hy: "20,000 ֏", en: "֏20,000", ru: "֏20 000" }, image: "/template_previews/img4.webp", href: "/michael-sarah-classic",      buttonLabel: { hy: "Դիտել", en: "Preview", ru: "Просмотр" }, visible: true },
    ],
  },

  howItWorks: {
    eyebrow: { hy: "ՊԱՐԲ ԳՈՐԾԸՆԹԱՑ", en: "SIMPLE PROCESS", ru: "ПРОСТОЙ ПРОЦЕСС"  },
    title:   { hy: "ԻՆՉՊԵՍ Է ԱՇԽԱՏՈՒՄ", en: "HOW IT WORKS",   ru: "КАК ЭТО РАБОТАЕТ" },
    steps: [
      { id: "step-1", number: "01", icon: "smartphone", title: { hy: "Ընտրեք կաղապար", en: "Choose a template", ru: "Выберите шаблон"      }, text: { hy: "Ընտրեք ձեր ոճին համապատասխան դիզայն։", en: "Choose a design that matches your personal style.", ru: "Выберите дизайн, соответствующий вашему стилю."        }, visible: true },
      { id: "step-2", number: "02", icon: "edit",       title: { hy: "Ավելացրեք տվյալները", en: "Add your details",  ru: "Добавьте детали"      }, text: { hy: "Ավելացրեք անունները, ամսաթիվը, վայրը և լուսանկարները։", en: "Add the names, date, venue and your photos.",       ru: "Добавьте имена, дату, место проведения и фотографии." }, visible: true },
      { id: "step-3", number: "03", icon: "share",      title: { hy: "Կիսվեք հյուրերի հետ", en: "Share with guests", ru: "Поделитесь с гостями" }, text: { hy: "Ուղարկեք մեկ հղում և հավաքեք RSVP պատասխանները։", en: "Send one link and collect RSVP responses.",        ru: "Отправьте одну ссылку и собирайте ответы на RSVP."    }, visible: true },
    ],
  },

  features: {
    eyebrow: { hy: "ՀՅՈՐԵՐԻ ՀԱՄԱՐ", en: "FOR YOUR GUESTS",             ru: "ДЛЯ ВАШИХ ГОСТЕЙ"           },
    title:   { hy: "ԱՄԵՆ ԻՆՉ՝ ԻՆՉ ՊԵՏՔ Է ՁԵՐ ՀՅՈՐԵՐԻՆ", en: "EVERYTHING YOUR GUESTS NEED", ru: "ВСЁ, ЧТО НУЖНО ВАШИМ ГОСТЯМ" },
    items: [
      { id: "ft-1", icon: "calendar", title: { hy: "Հրավերի մանրամասներ", en: "Event details",  ru: "Детали мероприятия" }, visible: true },
      { id: "ft-2", icon: "map",      title: { hy: "Քարտեզ և վայր", en: "Map & Venue",    ru: "Карта и место"      }, visible: true },
      { id: "ft-3", icon: "check",    title: { hy: "RSVP պատասխաններ", en: "RSVP responses", ru: "Ответы RSVP"        }, visible: true },
      { id: "ft-4", icon: "camera",   title: { hy: "Լուսանկարների բաժին", en: "Photo gallery",  ru: "Фотогалерея"        }, visible: true },
      { id: "ft-5", icon: "heart",    title: { hy: "Սիրո պատմություն", en: "Love story",     ru: "История любви"      }, visible: true },
      { id: "ft-6", icon: "message",  title: { hy: "Հյուրերի մաղթանքներ", en: "Guest wishes",   ru: "Пожелания гостей"   }, visible: true },
    ],
  },

  benefits: [
    { id: "bn-1", icon: "smartphone", title: { hy: "Հեռախոսի համար", en: "Mobile-friendly",          ru: "Удобно на телефоне"             }, text: { hy: "Գեղեցիկ տեսք բոլոր էկրաններին", en: "Beautiful on every screen",        ru: "Красиво на любом экране"           }, visible: true },
    { id: "bn-2", icon: "check",      title: { hy: "RSVP պատասխաններ", en: "RSVP included",            ru: "RSVP включено"                  }, text: { hy: "Հյուրերի պատասխանները մեկ տեղում", en: "All responses in one place",       ru: "Все ответы в одном мեсте"          }, visible: true },
    { id: "bn-3", icon: "share",      title: { hy: "Մեկ գեղեցիկ հղում", en: "One link",                 ru: "Одна ссылка"                    }, text: { hy: "Հեշտ ուղարկում բոլոր հյուրերին", en: "Easy to share with all guests",    ru: "Легко отправить всем гостям"       }, visible: true },
    { id: "bn-4", icon: "palette",    title: { hy: "Պրեմիում կաղապարներ", en: "Premium templates",        ru: "Премиум шаблоны"                }, text: { hy: "Նուրբ ոգ առանց դիզայների", en: "Elegant style without a designer", ru: "Элегантный стиль без дизайнера"   }, visible: true },
  ],

  mobileExperience: {
    eyebrow:  { hy: "ՀԱՐՄԱՐ Է ՀԵՌԱԽՈՍՈՒՄ ԴԻՏԵԼՈՒ ՀԱՄԱՐ",  en: "PERFECT ON MOBILE", ru: "УДОБНО НА ТЕЛЕФОНЕ" },
    title:    { hy: "Գեղեցիկ փորձառություն յուրաքանչյուր հյուրի հեռախոսում",    en: "A beautiful experience on every guest’s phone", ru: "Красивый опыт на телефоне каждого гостя" },
    subtitle: { hy: "Հյուրերը բացում են հրավերը, տեսնում են բոլոր մանրամասները, գտնում են վայրը և անմիջապես ուղարկում իրենց պատասխանը։", en: "Guests open the invitation, see all the details and immediately send their RSVP.", ru: "Гости открывают приглашение, видят все детали и сразу отправляют ответ." },
    actions: [
      { id: "ac-1", icon: "share",   label: { hy: "Կիսվել հղումով", en: "Share by link", ru: "Поделиться ссылкой" }, visible: true },
      { id: "ac-2", icon: "camera",  label: { hy: "Դիտել լուսանկարները", en: "View photos",   ru: "Смотреть фото"      }, visible: true },
      { id: "ac-3", icon: "message", label: { hy: "Ուղարկել պատասխան", en: "Send RSVP",     ru: "Отправить RSVP"     }, visible: true },
    ],
  },

  faq: {
    eyebrow: { hy: "ՀԱՐՑԵՐ", en: "FAQ",              ru: "ВОПРОСЫ И ОТВЕТЫ"         },
    title:   { hy: "Հաճախ տրվող հարցեր", en: "Common questions", ru: "Часто задаваемые вопросы" },
    items: [
      { id: "faq-1", question: { hy: "Ի՞նչ է հարսանեկան կայքը", en: "What is a wedding website?",       ru: "Что такое свадебный сайт?"           }, answer: { hy: "Սա գեղեցիկ առցանց հրավիրատոմս է, որտեղ հյուրերը կարող են տեսնել հարսանիքի բոլոր մանրամասները՝ ամսաթիվը, վայրը, ծրագիրը, լուսանկարները և RSVP ձևը։", en: "It's a beautiful online invitation where guests can see all wedding details.", ru: "Это красивое онлайн-приглашение со всеми деталями свадьбы."     }, visible: true },
      { id: "faq-2", question: { hy: "Կարո՞ղ եմ օգտագործել այն հեռախոսով", en: "Can I use it on my phone?",        ru: "Могу ли я использовать на телефоне?" }, answer: { hy: "Այո, կայքը ստեղծված է հատկապես հեռախոսով դիտելու համար և գեղեցիկ է աշխատում բոլոր սարքերում։", en: "Yes, the site is designed especially for mobile viewing.",                  ru: "Да, сайт специально создан для просмотра на телефоне."           }, visible: true },
      { id: "faq-3", question: { hy: "Կարո՞ղ եմ փոխել նկարները և տեքստերը", en: "Can I change photos and text?",    ru: "Могу ли я изменить фото и тексты?"   }, answer: { hy: "Այո, մեր թիմը կօգնի փոխել նկարները, անունները, ամսաթիվը, վայրերը, տեքստերը և մյուս մանրամասները։", en: "Yes, our team will help you change all content.",                           ru: "Да, наша команда поможет изменить все детали."                   }, visible: true },
      { id: "faq-4", question: { hy: "Ինչպևս են հյուրերը ուղարկում RSVP", en: "How do guests send their RSVP?",   ru: "Как гости отправляют RSVP?"          }, answer: { hy: "Հյուրերը լրացնում են RSVP ձևը կայքում, իսկ պատասխանները հավաքվում են մեկ տեղում։", en: "Guests fill in the RSVP form on the site.",                                 ru: "Гости заполняют форму RSVP на сайте."                            }, visible: true },
      { id: "faq-5", question: { hy: "Որքա՞ն ժամանակում կստանամ կայքը", en: "How soon will I get the website?", ru: "Как скоро я получу сайт?"            }, answer: { hy: "Սովորաբար կայքը պատրաստվում է կարճ ժամկետում՝ կախված անհրաժեշտ փոփոխություններից։", en: "Usually the site is ready quickly.",                                         ru: "Обычно сайт готовится быстро."                                   }, visible: true },
      { id: "faq-6", question: { hy: "Ինչպևս կարող եմ սկսել", en: "How can I get started?",           ru: "Как начать?"                         }, answer: { hy: "Սեղմեք «Փորձել դեմոն» կամ կապ հաստատեք մեզ հետ, և մենք կօգնենք ընտրել ու պատրաստել ձեր կայքը։", en: "Click 'Try the demo' or contact us.",                                         ru: "Нажмите 'Попробовать демо' или свяжитесь с нами."                }, visible: true },
    ],
  },

  contact: {
    eyebrow:  { hy: "ԿԱՊ",  en: "CONTACT",    ru: "КОНТАКТ"    },
    title:    { hy: "Կապ հաստատեք մեզ հետ",    en: "Contact us", ru: "Свяжитесь с нами" },
    subtitle: { hy: "Ունե՞ք հարցեր։ Գրեք մեզ, և մենք կօգնենք ընտրել լավագույն տարբերակը ձեր հարսանիքի համար։", en: "Have questions? Write to us and we'll help you choose the best option for your wedding.", ru: "Есть вопросы? Напишите нам, и мы поможем выбрать лучший вариант для вашей свадьбы." },
    buttons: [
      { id: "cta-demo",      label: { hy: "Փորձել դեմոն", en: "Try the demo", ru: "Попробовать демо" }, href: "/demo/david-rose-romantic",     icon: "arrow",     visible: true },
      { id: "cta-instagram", label: { hy: "Instagram",       en: "Instagram",    ru: "Instagram"        }, href: "https://instagram.com/4ever.am", icon: "instagram", visible: true },
      { id: "cta-telegram",  label: { hy: "Telegram",        en: "Telegram",     ru: "Telegram"         }, href: "https://t.me/4everam",           icon: "telegram",  visible: true },
      { id: "cta-phone",     label: { hy: "Զանգահարել", en: "Call us",      ru: "Позвонить" }, href: "tel:+37400000000",               icon: "phone",     visible: true },
    ],
  },

  footer: {
    email:     "info@4ever.am",
    phone:     "+374 77 000 000",
    copyright: {
      hy: "© 2026 4ever.am — Բոլոր իրավունքները պաշտպանված են",
      en: "\u00A9 2026 4ever.am, all rights reserved",
      ru: "\u00A9 2026 4ever.am, \u0432\u0441\u0435 \u043f\u0440\u0430\u0432\u0430 \u0437\u0430\u0449\u0438\u0449\u0435\u043d\u044b",
    },
    trustItems: [
      { id: "tr-1", icon: "users", title: { hy: "Հայ զույգերի համար", en: "For Armenian couples",              ru: "Для армянских пар"              }, text: { hy: "Մտածված յուրաքանչյուր մանրուքի շուրիի", en: "Designed with every detail in mind",          ru: "Продумано до мелочей"                  }, visible: true },
      { id: "tr-2", icon: "lock",  title: { hy: "Անվտանգ և անձնական", en: "Secure & private",                  ru: "Безопасно и приватно"           }, text: { hy: "Հղումը կիսվում է միայն ձեր հյուրերի հետ", en: "Link shared only with your guests",            ru: "Ссылка только для ваших гостей"        }, visible: true },
      { id: "tr-3", icon: "clock", title: { hy: "Արագ պատրաստում", en: "Quick setup",                       ru: "Быстрая настройка"              }, text: { hy: "Պարզ ընթացք առանց բարդ քայլերի", en: "Simple flow without complex steps",            ru: "Простой процесс без лишних шагов"      }, visible: true },
      { id: "tr-4", icon: "star",  title: { hy: "Պրեմիում տեսք", en: "Premium look",                      ru: "Премиум дизайн"                 }, text: { hy: "Սիրով ստեղծված հիշվող հրավեր", en: "Lovingly crafted, memorable invitation",      ru: "Созданный с любовью незабываемый сайт" }, visible: true },
    ],
  },
};
