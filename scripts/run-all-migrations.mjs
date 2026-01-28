import { config } from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';

config();

async function runAllMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Run migration 007 (translations table) - split into parts
    console.log('🔄 Running migration 007: translations table...');
    
    // Create table without the INSERT
    await client.query(`
      CREATE TABLE IF NOT EXISTS translations (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        language TEXT NOT NULL UNIQUE,
        config JSONB NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      ALTER TABLE templates ADD COLUMN IF NOT EXISTS template_version INTEGER DEFAULT 1;
      
      CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(language);
      CREATE INDEX IF NOT EXISTS idx_translations_active ON translations(is_active);
    `);
    
    // Insert default data only if not exists
    const existingTranslation = await client.query(`SELECT 1 FROM translations WHERE language = 'hy'`);
    if (existingTranslation.rows.length === 0) {
      const migration007Data = readFileSync('migrations/007_add_translations_table.sql', 'utf-8');
      const insertMatch = migration007Data.match(/INSERT INTO translations[\s\S]+?ON CONFLICT[\s\S]+?;/);
      if (insertMatch) {
        await client.query(insertMatch[0]);
      }
    }
    
    console.log('✅ Migration 007 completed\n');

    // Create translation_keys table
    console.log('🔄 Creating translation_keys table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS translation_keys (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT NOT NULL UNIQUE,
        section TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_translation_keys_section ON translation_keys(section);
    `);
    console.log('✅ translation_keys table created\n');

    // Create translation_values table
    console.log('🔄 Creating translation_values table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS translation_values (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        key_id VARCHAR NOT NULL REFERENCES translation_keys(id) ON DELETE CASCADE,
        language TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(key_id, language)
      );
      
      CREATE INDEX IF NOT EXISTS idx_translation_values_key_id ON translation_values(key_id);
      CREATE INDEX IF NOT EXISTS idx_translation_values_language ON translation_values(language);
    `);
    console.log('✅ translation_values table created\n');

    // Check if pricing_plans exists and create if not
    console.log('🔄 Checking pricing_plans table...');
    const pricingExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pricing_plans'
      );
    `);
    
    if (!pricingExists.rows[0].exists) {
      console.log('Creating pricing_plans table...');
      await client.query(`
        CREATE TABLE pricing_plans (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          display_name TEXT NOT NULL,
          description TEXT,
          price_monthly NUMERIC(10,2),
          price_yearly NUMERIC(10,2),
          is_active BOOLEAN DEFAULT TRUE,
          display_order INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ pricing_plans table created\n');
    } else {
      console.log('✅ pricing_plans table already exists\n');
    }

    // Check if plan_feature_associations exists
    console.log('🔄 Checking plan_feature_associations table...');
    const associationsExist = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'plan_feature_associations'
      );
    `);
    
    if (!associationsExist.rows[0].exists) {
      console.log('Creating plan_feature_associations table...');
      await client.query(`
        CREATE TABLE plan_feature_associations (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          plan_id VARCHAR NOT NULL REFERENCES pricing_plans(id) ON DELETE CASCADE,
          feature_id VARCHAR NOT NULL REFERENCES plan_features(id) ON DELETE CASCADE,
          is_included BOOLEAN NOT NULL DEFAULT TRUE,
          value TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(plan_id, feature_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_plan_feature_plan_id ON plan_feature_associations(plan_id);
        CREATE INDEX IF NOT EXISTS idx_plan_feature_feature_id ON plan_feature_associations(feature_id);
      `);
      console.log('✅ plan_feature_associations table created\n');
    } else {
      console.log('✅ plan_feature_associations table already exists\n');
    }

    console.log('🎉 All migrations completed successfully!\n');
    
    // Verify tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('translations', 'translation_keys', 'translation_values', 'pricing_plans', 'plan_features', 'plan_feature_associations', 'platform_settings')
      ORDER BY table_name;
    `);
    
    console.log('📊 Verified tables:');
    tables.rows.forEach(row => console.log(`  ✓ ${row.table_name}`));
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runAllMigrations().catch(console.error);
