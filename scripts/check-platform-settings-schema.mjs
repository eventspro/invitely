import { config } from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

config();

async function checkSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'platform_settings'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 Current platform_settings columns:');
    console.table(result.rows);
    
    const data = await client.query('SELECT * FROM platform_settings LIMIT 1');
    console.log('\n📄 Sample data:');
    console.log(data.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema().catch(console.error);
