import pkg from 'pg';
const { Client } = pkg;

async function cleanup() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    console.log('🔌 Connected to database');
    
    await client.query('DROP TABLE IF EXISTS translations CASCADE');
    console.log('✅ Dropped translations table');
    
    await client.query('DROP TABLE IF EXISTS platform_settings CASCADE');
    console.log('✅ Dropped platform_settings table');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('🔌 Disconnected from database');
  }
}

cleanup();
