import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function migrateTranslationsTable() {
  const client = new pg.Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✓ Connected to database');
    
    // Add new columns if they don't exist
    await client.query(`
      ALTER TABLE translations 
      ADD COLUMN IF NOT EXISTS translation_key TEXT,
      ADD COLUMN IF NOT EXISTS value TEXT,
      ADD COLUMN IF NOT EXISTS category TEXT;
    `);
    console.log('✓ Added new columns (translation_key, value, category)');
    
    // Drop old columns that are no longer needed
    await client.query(`
      ALTER TABLE translations 
      DROP COLUMN IF EXISTS config,
      DROP COLUMN IF EXISTS is_active,
      DROP COLUMN IF EXISTS version;
    `);
    console.log('✓ Removed old columns (config, is_active, version)');
    
    console.log('\n✅ Translations table migration complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrateTranslationsTable();
