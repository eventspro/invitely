// Update default template with complete config
import "dotenv/config";
import { db } from "../server/db.js";
import { templates } from "../shared/schema.js";
import { eq } from "drizzle-orm";

async function updateDefaultTemplate() {
  try {
    console.log("🔄 Updating default template with complete config...");
    
    const completeConfig = {
      couple: {
        groomName: "Harut",
        brideName: "Tatev",
        combinedNames: "Harut & Tatev"
      },
      wedding: {
        date: "2025-10-15T16:00:00",
        displayDate: "15 Հոկտեմբեր 2025",
        month: "Հոկտեմբեր",
        day: "15"
      },
      hero: {
        welcomeMessage: "Բարի գալուստ մեր հարսանիք",
        invitation: "Հրավիրում ենք մեր հարսանիքին",
        musicButton: "Երաժշտություն"
      },
      countdown: {
        subtitle: "Մնացել է",
        labels: {
          days: "Օր",
          hours: "Ժամ", 
          minutes: "Րոպե",
          seconds: "Վայրկյան"
        }
      },
      calendar: {
        title: "Պատրաստվեք մեր հարսանիքին",
        description: "Միացրեք ձեր օրացույցին",
        monthTitle: "Հոկտեմբեր 2025",
        dayLabels: ["Կիր", "Երկ", "Երք", "Չոր", "Հնգ", "Ուրբ", "Շբթ"]
      },
      locations: {
        sectionTitle: "Վայրեր",
        church: {
          title: "Եկեղեցի",
          name: "Սուրբ Անն Եկեղեցի",
          description: "Հարսանեկան արարողությունը կտեղի ունենա Սուրբ Անն եկեղեցում",
          mapButton: "Բացել քարտեզում"
        },
        restaurant: {
          title: "Ճաշարան",
          name: "Արարատ Ռեստորան",
          description: "Հարսանեկան խնջույքը կտեղի ունենա Արարատ ռեստորանում",
          mapButton: "Բացել քարտեզում"
        }
      },
      timeline: {
        title: "Ծրագիր",
        events: [
          {
            time: "16:00",
            icon: "💒",
            title: "Հարսանեկան արարողություն",
            description: "Սուրբ Անն Եկեղեցում"
          },
          {
            time: "18:00",
            icon: "🍾", 
            title: "Ընդունելություն",
            description: "Արարատ Ռեստորանում"
          }
        ],
        afterMessage: {
          thankYou: "Շնորհակալություն մեր հետ մասնակցելու համար",
          notes: "Ձեր ներկայությունը մեր ամենամեծ նվերն է"
        }
      },
      rsvp: {
        title: "Հաստատեք ձեր մասնակցությունը",
        description: "Խնդրում ենք հաստատել ձեր ներկայությունը մինչև 1 Հոկտեմբեր",
        form: {
          firstName: "Անուն",
          firstNamePlaceholder: "Ձեր անունը",
          lastName: "Ազգանուն", 
          lastNamePlaceholder: "Ձեր ազգանունը",
          email: "Էլ․ հասցե",
          emailPlaceholder: "example@email.com",
          guestCount: "Հյուրերի քանակ",
          guestCountPlaceholder: "Ընտրեք քանակը",
          guestNames: "Հյուրերի անուններ",
          guestNamesPlaceholder: "Նշեք բոլոր մասնակիցների անունները",
          attendance: "Մասնակցություն",
          attendingYes: "Կմասնակցեմ",
          attendingNo: "Չեմ մասնակցի",
          submitButton: "Հաստատել",
          submittingButton: "Ուղարկվում է..."
        },
        guestOptions: [
          { value: "1", label: "1 մարդ" },
          { value: "2", label: "2 մարդ" }
        ]
      },
      photos: {
        title: "Նկարներ",
        description: "Կիսվեք ձեր նկարներով",
        downloadButton: "Ներբեռնել նկարները",
        uploadButton: "Ավելացնել նկար",
        comingSoonMessage: "Շուտով այստեղ կլինեն մեր հարսանեկան նկարները"
      },
      navigation: {
        home: "Գլխավոր",
        countdown: "Հաշվարկ",
        calendar: "Օրացույց",
        locations: "Վայրեր",
        timeline: "Ծրագիր",
        rsvp: "RSVP"
      },
      footer: {
        thankYouMessage: "Շնորհակալություն մեր հետ մասնակցելու համար"
      },
      email: {
        recipients: ["harut@example.com", "tatev@example.com"]
      },
      maintenance: {
        enabled: false,
        password: "wedding2025",
        title: "Կայք բարելավվում է",
        subtitle: "Մենք կվերադառնանք շուտով",
        message: "Մեր հարսանեկան կայքը բարելավվում է",
        countdownText: "Ենթադրյալ ավարտը՝",
        passwordPrompt: "Մուտքագրեք գաղտնաբառը՝",
        wrongPassword: "Սխալ գաղտնաբառ",
        enterPassword: "Մուտք"
      },
      sections: {
        hero: { enabled: true },
        countdown: { enabled: true },
        calendar: { enabled: true },
        locations: { enabled: true },
        timeline: { enabled: true },
        rsvp: { enabled: true },
        photos: { enabled: true }
      },
      theme: {
        colors: {
          primary: "var(--soft-gold)",
          secondary: "var(--sage-green)",
          accent: "var(--charcoal)",
          background: "var(--cream)"
        },
        fonts: {
          heading: "Playfair Display, serif",
          body: "Inter, sans-serif"
        }
      }
    };
    
    // Update the default template
    const result = await db
      .update(templates)
      .set({
        config: completeConfig,
        updatedAt: new Date()
      })
      .where(eq(templates.id, 'default-harut-tatev'))
      .returning();
    
    console.log("✅ Default template updated successfully!");
    console.log("Updated template:", result[0].name);
    
  } catch (error) {
    console.error("❌ Error updating template:", error);
  }
}

updateDefaultTemplate();
