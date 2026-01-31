/**
 * Seed Script: Populate Configurable Pricing Plans from content-config.ts
 * 
 * This script migrates the default pricing plans from content-config.ts into the database.
 * Run once to populate the configurable_pricing_plans table on first deployment.
 * 
 * Usage: npx tsx scripts/seed-configurable-pricing.ts
 */

import "dotenv/config";
import { db } from '../server/db.js';
import { configurablePricingPlans, configurablePlanFeatures } from '../shared/schema.js';
import { defaultContentConfig } from '../shared/content-config.js';
import { eq } from 'drizzle-orm';

async function seedPricingPlans() {
  console.log('🌱 Starting pricing plans seeding...');

  try {
    // Check if plans already exist
    const existingPlans = await db.select().from(configurablePricingPlans);
    
    if (existingPlans.length > 0) {
      console.log(`✅ Database already has ${existingPlans.length} pricing plans. Skipping seed.`);
      console.log('   To re-seed, delete existing plans first via admin panel or database.');
      return;
    }

    console.log('📋 No existing plans found. Seeding from content-config.ts...');

    // Seed each plan from defaultContentConfig
    for (const plan of defaultContentConfig.pricingPlans) {
      console.log(`\n📦 Processing plan: ${plan.id}`);

      // Insert the plan
      const [insertedPlan] = await db.insert(configurablePricingPlans).values({
        planKey: plan.id,
        enabled: plan.enabled,
        orderIndex: plan.order,
        price: plan.price,
        currency: 'AMD', // Default currency
        badgeKey: plan.badgeKey || null,
        badgeColor: plan.badgeColor || null,
        popular: plan.popular,
        templateRoute: plan.templateRoute,
      }).returning();

      console.log(`   ✅ Inserted plan: ${insertedPlan.id}`);

      // Insert features for this plan
      const featuresToInsert = plan.features.map((feature, index) => ({
        planId: insertedPlan.id,
        featureKey: feature.translationKey,
        icon: feature.icon,
        included: feature.included,
        orderIndex: index, // Preserve order from config
      }));

      await db.insert(configurablePlanFeatures).values(featuresToInsert);
      console.log(`   ✅ Inserted ${featuresToInsert.length} features`);
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log(`   Total plans seeded: ${defaultContentConfig.pricingPlans.length}`);

    // Verify final state
    const finalPlans = await db.select().from(configurablePricingPlans);
    const finalFeatures = await db.select().from(configurablePlanFeatures);
    console.log(`\n📊 Database state:`);
    console.log(`   Plans: ${finalPlans.length}`);
    console.log(`   Features: ${finalFeatures.length}`);

  } catch (error) {
    console.error('❌ Error seeding pricing plans:', error);
    throw error;
  }
}

// Run the seed script
seedPricingPlans()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
