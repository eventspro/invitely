import { config } from 'dotenv';
import { db } from '../server/db';
import { templates } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Load environment variables
config();

// Enhanced Armenian timeline configuration with realistic icons
const enhancedTimelineConfig = {
  timeline: {
    title: "Ծրագիր",
    events: [
      {
        time: "13:00",
        title: "Պսակադրություն",
        description: "Սուրբ Գրիգոր Լուսավորիչ Եկեղեցի",
        icon: "⛪" // More realistic church icon
      },
      {
        time: "14:30", 
        title: "Նկարահանում",
        description: "Զույգի և ընտանիքի նկարահանում",
        icon: "📷" // Professional camera icon
      },
      {
        time: "15:30",
        title: "Ծաղկի նվիրում",
        description: "Ծաղկի նվիրման արարողություն",
        icon: "💐" // Wedding bouquet icon
      },
      {
        time: "16:00",
        title: "Ընդունելություն",
        description: "Հանդիսավոր ընթրիք և մատուցում",
        icon: "🍽️" // Fine dining icon
      },
      {
        time: "17:30",
        title: "Առաջին պար",
        description: "Նորամուսնուների առաջին պարը",
        icon: "💃" // Dancing couple icon
      },
      {
        time: "18:00",
        title: "Հյուրերի պարեր",
        description: "Ընդհանուր պարեր և զվարճություններ",
        icon: "🎵" // Music and dancing icon
      },
      {
        time: "19:30",
        title: "Տորթի կտրում",
        description: "Հարսանեկան տորթի կտրման արարողություն",
        icon: "🎂" // Wedding cake icon
      },
      {
        time: "20:00",
        title: "Տոնակատարություն",
        description: "Երաժշտություն և շարունակական զվարճություններ",
        icon: "🎉" // Celebration icon
      }
    ],
    afterMessage: {
      thankYou: "Շնորհակալություն մեր հետ լինելու համար",
      notes: "Ձեր ներկայությունը մեր օրը կատարյալ է դարձնում"
    }
  }
};

async function updateTimelineIcons() {
  try {
    console.log('🎨 Updating timeline with realistic icons...');
    
    // Get all templates
    const allTemplates = await db.select().from(templates);
    
    console.log(`📋 Found ${allTemplates.length} templates to update`);
    
    for (const template of allTemplates) {
      console.log(`\n🔧 Updating timeline for: ${template.name} (${template.slug})`);
      
      const existingConfig = (template.config as any) || {};
      
      // Update only the timeline section with enhanced icons
      const updatedConfig = {
        ...existingConfig,
        timeline: enhancedTimelineConfig.timeline
      };
      
      // Update the template
      await db.update(templates)
        .set({ 
          config: updatedConfig,
          updatedAt: new Date()
        })
        .where(eq(templates.id, template.id));
      
      console.log(`✅ Updated ${template.name} with enhanced timeline icons`);
    }
    
    console.log('\n🎉 All templates updated with realistic timeline icons!');
    console.log('\n🎨 New timeline icons applied:');
    console.log('⛪ Պսակադրություն (Church Wedding)');
    console.log('📷 Նկարահանում (Photography)'); 
    console.log('💐 Ծաղկի նվիրում (Bouquet Ceremony)');
    console.log('🍽️ Ընդունելություն (Reception Dinner)');
    console.log('💃 Առաջին պար (First Dance)');
    console.log('🎵 Հյուրերի պարեր (Guest Dancing)');
    console.log('🎂 Տորթի կտրում (Cake Cutting)');
    console.log('🎉 Տոնակատարություն (Celebration)');
    
  } catch (error) {
    console.error('❌ Error updating timeline icons:', error);
  }
}

// Run the update
updateTimelineIcons().then(() => {
  console.log('\n🚀 Timeline icons update complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});