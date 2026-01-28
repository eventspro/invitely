import { config } from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

config();

async function alignSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Rename translation_keys columns
    console.log('🔄 Aligning translation_keys table...');
    await client.query(`
      ALTER TABLE translation_keys RENAME COLUMN category TO section;
      ALTER TABLE translation_keys DROP COLUMN IF EXISTS default_value;
    `);
    console.log('✅ translation_keys aligned\n');

    // Rename plan_features columns (from earlier db:push)
    console.log('🔄 Aligning plan_features table...');
    await client.query(`
      ALTER TABLE plan_features RENAME COLUMN feature_key TO name;
      ALTER TABLE plan_features RENAME COLUMN name_key TO display_name;
      ALTER TABLE plan_features RENAME COLUMN description_key TO description;
      ALTER TABLE plan_features DROP COLUMN IF EXISTS icon;
      ALTER TABLE plan_features DROP COLUMN IF EXISTS display_order;
      ALTER TABLE plan_features DROP COLUMN IF EXISTS is_active;
    `);
    console.log('✅ plan_features aligned\n');

    // Rename pricing_plans columns
    console.log('🔄 Aligning pricing_plans table...');
    await client.query(`
      ALTER TABLE pricing_plans RENAME COLUMN plan_key TO name;
      ALTER TABLE pricing_plans RENAME COLUMN name_key TO display_name;
      ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS price_monthly NUMERIC(10,2);
      ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS price_yearly NUMERIC(10,2);
      
      -- Migrate price to price_monthly if not already done
      UPDATE pricing_plans SET price_monthly = price WHERE price_monthly IS NULL AND price IS NOT NULL;
      
      -- Drop old columns
      ALTER TABLE pricing_plans DROP COLUMN IF EXISTS description_key;
      ALTER TABLE pricing_plans DROP COLUMN IF EXISTS price;
      ALTER TABLE pricing_plans DROP COLUMN IF EXISTS currency;
      ALTER TABLE pricing_plans DROP COLUMN IF EXISTS badge;
      ALTER TABLE pricing_plans DROP COLUMN IF EXISTS badge_color_class;
      ALTER TABLE pricing_plans DROP COLUMN IF EXISTS is_popular;
      ALTER TABLE pricing_plans DROP COLUMN IF EXISTS template_route;
      
      -- Add description column
      ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    console.log('✅ pricing_plans aligned\n');

    // Rename plan_feature_associations columns
    console.log('🔄 Aligning plan_feature_associations table...');
    await client.query(`
      ALTER TABLE plan_feature_associations RENAME COLUMN limit_value TO value;
      ALTER TABLE plan_feature_associations DROP COLUMN IF EXISTS display_order;
      ALTER TABLE plan_feature_associations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);
    console.log('✅ plan_feature_associations aligned\n');

    // Clean up translation_values
    console.log('🔄 Aligning translation_values table...');
    await client.query(`
      ALTER TABLE translation_values DROP COLUMN IF EXISTS is_active;
      ALTER TABLE translation_values DROP COLUMN IF EXISTS last_modified_by;
    `);
    console.log('✅ translation_values aligned\n');

    console.log('🎉 All schema alignments completed successfully!\n');
    
    // Verify the changes
    console.log('📊 Verifying plan_features columns:');
    const planFeatures = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'plan_features'
      ORDER BY ordinal_position;
    `);
    planFeatures.rows.forEach(row => console.log(`  ✓ ${row.column_name}`));
    
    console.log('\n📊 Verifying pricing_plans columns:');
    const pricingPlans = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'pricing_plans'
      ORDER BY ordinal_position;
    `);
    pricingPlans.rows.forEach(row => console.log(`  ✓ ${row.column_name}`));
    
  } catch (error) {
    console.error('❌ Schema alignment failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

alignSchema().catch(console.error);
