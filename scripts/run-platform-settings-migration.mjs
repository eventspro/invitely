import { config } from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';

config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const migrationSQL = readFileSync('migrations/008_migrate_platform_settings_to_key_value.sql', 'utf-8');
    
    console.log('🔄 Running platform_settings migration...');
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the migration
    const result = await client.query('SELECT key, value FROM platform_settings ORDER BY key');
    console.log('\n📊 Current platform_settings:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);
