import { config } from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

config();

async function checkTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const tables = ['translations', 'translation_keys', 'translation_values', 'pricing_plans', 'plan_feature_associations'];
    
    for (const tableName of tables) {
      const exists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = '${tableName}'
        );
      `);
      
      if (exists.rows[0].exists) {
        console.log(`📊 ${tableName} columns:`);
        const result = await client.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position;
        `);
        console.table(result.rows);
      } else {
        console.log(`❌ ${tableName} does not exist\n`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTables().catch(console.error);
