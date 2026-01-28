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

    // Check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'plan_features'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Table plan_features does not exist in production');
      return;
    }

    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'plan_features'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 Current plan_features columns:');
    console.table(result.rows);
    
    const data = await client.query('SELECT * FROM plan_features LIMIT 3');
    console.log('\n📄 Sample data:');
    console.table(data.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema().catch(console.error);
