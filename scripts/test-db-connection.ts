import { storage } from '../server/storage.js';

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    const templates = await storage.getAllTemplates();
    console.log(`✅ Success! Found ${templates.length} templates`);
    console.log('Templates:', templates.map(t => ({ id: t.id, name: t.name, slug: t.slug, isMain: t.isMain })));
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

testConnection();
