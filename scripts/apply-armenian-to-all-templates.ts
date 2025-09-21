import { config } from 'dotenv';
import { db } from '../server/db';
import { templates } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Load environment variables
config();

// Complete Armenian configuration to apply to all templates
const armenianConfig = {
  couple: {
    groomName: "Հարութ",
    brideName: "Տաթև", 
    combinedNames: "Հարութ & Տաթև"
  },
  wedding: {
    date: "2024-08-18T15:00:00",
    displayDate: "18 ՕԳՈՍՏՈՍ 2024",
    month: "Օգոստոս 2024",
    day: "18"
  },
  hero: {
    title: "Հրավիրում ենք մեր հարսանիքին",
    invitation: "Հրավիրում ենք մեր հարսանիքին",
    welcomeMessage: "Բարի գալուստ մեր հարսանիք",
    musicButton: "Երաժշտություն"
  },
  countdown: {
    subtitle: "Մինչև հարսանիքի ծանուցում",
    labels: {
      days: "օր",
      hours: "ժամ", 
      minutes: "րոպ",
      seconds: "վայրկ"
    }
  },
  navigation: {
    home: "Գլխավոր",
    countdown: "Հաշվարկ",
    calendar: "Օրացույց",
    locations: "Վայրեր",
    timeline: "Ծրագիր",
    rsvp: "Հաստատում",
    photos: "Նկարներ"
  },
  timeline: {
    title: "Ծրագիր",
    events: [
      {
        time: "13:00",
        title: "Պսակադրություն",
        description: "Սուրբ Գրիգոր Լուսավորիչ Եկեղեցի",
        icon: "💒"
      },
      {
        time: "14:30", 
        title: "Նկարահանում",
        description: "Զույգի նկարահանում",
        icon: "📸"
      },
      {
        time: "16:00",
        title: "Ընդունելություն",
        description: "Հանդիսավոր ընթրիք",
        icon: "🍽️"
      },
      {
        time: "19:00",
        title: "Պար և զվարճություն",
        description: "Երաժշտություն և պարեր",
        icon: "💃"
      }
    ],
    afterMessage: {
      thankYou: "Շնորհակալություն մեր հետ լինելու համար",
      notes: "Ձեր ներկայությունը մեր օրը կատարյալ է դարձնում"
    }
  },
  locations: {
    sectionTitle: "Վայրեր",
    church: {
      title: "Եկեղեցի",
      name: "Սուրբ Գրիգոր Լուսավորիչ Եկեղեցի",
      description: "Պսակադրության արարողություն",
      mapButton: "Քարտեզ"
    },
    restaurant: {
      title: "Ռեստորան", 
      name: "Արարատ Ռեստորան",
      description: "Ընդունելության և տոնակատարության վայր",
      mapButton: "Քարտեզ"
    }
  },
  rsvp: {
    title: "Հաստատել մասնակցությունը",
    description: "Խնդրում ենք հաստատել ձեր մասնակցությունը մինչև մարտի 1-ը",
    form: {
      firstName: "Անուն",
      firstNamePlaceholder: "Ձեր անունը",
      lastName: "Ազգանուն", 
      lastNamePlaceholder: "Ձեր ազգանունը",
      email: "Էլ․ հասցե",
      emailPlaceholder: "your@email.com",
      guestCount: "Հյուրերի թիվ",
      guestCountPlaceholder: "Ընտրեք թիվը",
      guestNames: "Հյուրերի անուններ",
      guestNamesPlaceholder: "Բոլոր մասնակիցների անուններ",
      attendance: "Մասնակցություն",
      attendingYes: "Այո, կգամ",
      attendingNo: "Ոչ, չեմ կարող գալ",
      submitButton: "Հաստատել",
      submittingButton: "Ուղարկվում է..."
    },
    guestOptions: [
      { value: "1", label: "1 հյուր" },
      { value: "2", label: "2 հյուր" },
      { value: "3", label: "3 հյուր" },
      { value: "4", label: "4 հյուր" },
      { value: "5", label: "5+ հյուր" }
    ],
    messages: {
      success: "Շնորհակալություն! Ձեր պատասխանը ստացվել է",
      error: "Սխալ է տեղի ունեցել։ Խնդրում ենք կրկին փորձել",
      loading: "Ուղարկվում է...",
      required: "Այս դաշտը պարտադիր է"
    }
  },
  photos: {
    title: "Նկարներ",
    description: "Կիսվեք մեր հիշողություններով",
    uploadButton: "Ավելացնել նկար",
    downloadButton: "Ներբեռնել",
    comingSoonMessage: "Նկարները շուտով"
  },
  calendar: {
    title: "Նշեք Ձեր Օրացույցում",
    dayLabels: ["Կիր", "Երկ", "Երք", "Չոր", "Հնգ", "Ուր", "Շբթ"],
    monthTitle: "Հարսանեկան Ամսաթիվ",
    description: "Պահպանեք ամսաթիվը մեր հարսանեկան համար"
  },
  footer: {
    thankYouMessage: "Շնորհակալություն մեր սիրո պատմության մաս լինելու համար։ Անհամբեր սպասում ենք այս նոր գլուխը սկսել ձեր բոլորի հետ։"
  },
  theme: {
    fonts: {
      heading: "Noto Serif Armenian",
      body: "Noto Sans Armenian"
    },
    colors: {
      primary: "#1e3a8a",
      secondary: "#3b82f6", 
      accent: "#f59e0b",
      background: "#ffffff"
    }
  },
  email: {
    recipients: [
      "harutavetisyan0@gmail.com",
      "tatevhovsepyan22@gmail.com"
    ]
  },
  sections: {
    hero: { enabled: true },
    countdown: { enabled: true },
    calendar: { enabled: true },
    locations: { enabled: true },
    timeline: { enabled: true },
    rsvp: { enabled: true },
    photos: { enabled: true }
  }
};

async function applyArmenianToAllTemplates() {
  try {
    console.log('🔄 Applying Armenian configuration to all templates...');
    
    // Get all templates
    const allTemplates = await db.select().from(templates);
    
    console.log(`📋 Found ${allTemplates.length} templates to update`);
    
    for (const template of allTemplates) {
      console.log(`\n🔧 Updating template: ${template.name} (${template.slug})`);
      
      // Merge Armenian config with existing config
      const existingConfig = (template.config as any) || {};
      const updatedConfig = {
        ...existingConfig,
        ...armenianConfig,
        // Preserve template-specific theme colors if they exist
        theme: {
          ...armenianConfig.theme,
          ...existingConfig?.theme,
          fonts: armenianConfig.theme.fonts // Always use Armenian fonts
        }
      };
      
      // Update the template
      await db.update(templates)
        .set({ 
          config: updatedConfig,
          updatedAt: new Date()
        })
        .where(eq(templates.id, template.id));
      
      console.log(`✅ Updated ${template.name} with Armenian content`);
    }
    
    console.log('\n🎉 All templates updated with Armenian configuration!');
    console.log('\n📝 Armenian content applied:');
    console.log('• Navigation in Armenian');
    console.log('• Hero section with Armenian invitation text');
    console.log('• Timeline events in Armenian');
    console.log('• RSVP form with Armenian labels');
    console.log('• Location details in Armenian');
    console.log('• Calendar with Armenian day labels');
    console.log('• Armenian-compatible fonts (Noto Sans/Serif Armenian)');
    console.log('• Countdown timer in Armenian');
    
  } catch (error) {
    console.error('❌ Error applying Armenian configuration:', error);
  }
}

// Run the update
applyArmenianToAllTemplates().then(() => {
  console.log('\n🚀 Armenian configuration complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});