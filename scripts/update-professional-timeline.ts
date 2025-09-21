import { config } from 'dotenv';
import { db } from '../server/db';
import { templates } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Load environment variables
config();

// Professional wedding timeline with realistic icons
const professionalTimelineConfig = {
  timeline: {
    title: "Ծրագիր",
    events: [
      {
        time: "13:00",
        title: "Պսակադրություն",
        description: "Սուրբ Գրիգոր Լուսավորիչ Եկեղեցի",
        icon: "⛪" // Church/Chapel - most realistic for ceremony
      },
      {
        time: "14:30", 
        title: "Նկարահանում",
        description: "Զույգի և ընտանիքի նկարահանում",
        icon: "📸" // Professional camera
      },
      {
        time: "15:30",
        title: "Շարժում դեպի հանդիսավար ծիսակարգ",
        description: "Հյուրերի տեղափոխություն",
        icon: "🚗" // Transportation
      },
      {
        time: "16:00",
        title: "Կոկտեյլ ժամ",
        description: "Նախաճաշ և ընկերական շփում",
        icon: "🥂" // Cocktail/champagne glasses
      },
      {
        time: "17:00",
        title: "Ընդունելության բացում",
        description: "Նորամուսնուների ներկայացում",
        icon: "🎭" // Formal presentation
      },
      {
        time: "17:30",
        title: "Առաջին պար",
        description: "Նորամուսնուների առաջին պարը",
        icon: "💒" // Wedding/marriage symbol
      },
      {
        time: "18:00",
        title: "Ընթրիք",
        description: "Հանդիսավոր ընթրիք և խոսքեր",
        icon: "🍽️" // Fine dining
      },
      {
        time: "19:00",
        title: "Տորթի կտրում",
        description: "Հարսանեկան տորթի ավանդական կտրում",
        icon: "🎂" // Wedding cake
      },
      {
        time: "19:30",
        title: "Պար և տոնակատարություն",
        description: "Երաժշտություն և ընդհանուր պարեր",
        icon: "🎉" // Celebration
      },
      {
        time: "22:00",
        title: "Գիշերային պարեր",
        description: "Շարունակական զվարճություններ",
        icon: "🌙" // Night celebration
      }
    ],
    afterMessage: {
      thankYou: "Շնորհակալություն մեր հետ լինելու համար",
      notes: "Ձեր ներկայությունը մեր օրը կատարյալ է դարձնում"
    }
  }
};

async function updateToRealisticIcons() {
  try {
    console.log('🎨 Updating to professional realistic wedding icons...');
    
    // Get all templates
    const allTemplates = await db.select().from(templates);
    
    console.log(`📋 Found ${allTemplates.length} templates to update`);
    
    for (const template of allTemplates) {
      console.log(`\n🔧 Updating ${template.name} with professional timeline...`);
      
      const existingConfig = (template.config as any) || {};
      
      // Update timeline with professional events
      const updatedConfig = {
        ...existingConfig,
        timeline: professionalTimelineConfig.timeline
      };
      
      // Update the template
      await db.update(templates)
        .set({ 
          config: updatedConfig,
          updatedAt: new Date()
        })
        .where(eq(templates.id, template.id));
      
      console.log(`✅ Updated ${template.name} with professional timeline`);
    }
    
    console.log('\n🎉 All templates updated with professional wedding timeline!');
    console.log('\n🎨 Professional wedding schedule:');
    console.log('⛪ 13:00 - Պսակադրություն (Church Ceremony)');
    console.log('📸 14:30 - Նկարահանում (Professional Photography)');
    console.log('🚗 15:30 - Տեղափոխություն (Transportation)');
    console.log('🥂 16:00 - Կոկտեյլ ժամ (Cocktail Hour)');
    console.log('🎭 17:00 - Ընդունելության բացում (Reception Opening)');
    console.log('💒 17:30 - Առաջին պար (First Dance)');
    console.log('🍽️ 18:00 - Ընթրիք (Formal Dinner)');
    console.log('🎂 19:00 - Տորթի կտրում (Cake Cutting)');
    console.log('🎉 19:30 - Տոնակատարություն (Celebration)');
    console.log('🌙 22:00 - Գիշերային պարեր (Night Dancing)');
    
  } catch (error) {
    console.error('❌ Error updating timeline:', error);
  }
}

// Run the update
updateToRealisticIcons().then(() => {
  console.log('\n🚀 Professional wedding timeline update complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});