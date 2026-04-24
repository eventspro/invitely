/**
 * fix-local-only-images.ts
 * 
 * Removes DB gallery records and JSONB config entries whose URLs start with
 * /api/images/serve/ — these only exist on the local machine and return 404
 * on production Vercel.
 *
 *   tsx scripts/fix-local-only-images.ts --dry-run   (preview, no writes)
 *   tsx scripts/fix-local-only-images.ts             (apply fix)
 */

import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../shared/schema.js';

const isDryRun = process.argv.includes('--dry-run');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});
const db = drizzle({ client: pool, schema });

async function main() {
  console.log(`\n🔧 Local-only image cleanup ${isDryRun ? '(DRY RUN)' : '(LIVE)'}\n`);

  // 1. Find all DB image records with local-only URLs
  const allImages = await db.select().from(schema.images);
  const localOnlyRecords = allImages.filter(img =>
    typeof img.url === 'string' && img.url.startsWith('/api/images/serve/')
  );

  if (localOnlyRecords.length === 0) {
    console.log('✅ No local-only image records found in DB.\n');
  } else {
    console.log(`⚠️  Found ${localOnlyRecords.length} local-only DB image records:`);
    for (const r of localOnlyRecords) {
      console.log(`  ID: ${r.id} | Template: ${r.templateId} | Category: ${r.category} | ${r.url}`);
      if (!isDryRun) {
        await db.delete(schema.images).where(eq(schema.images.id, r.id));
        console.log(`  🗑️  Deleted`);
      }
    }
    console.log('');
  }

  // 2. Find all templates whose JSONB config.photos.images or config.hero.images
  //    contain local-only URLs and clean them out
  const templates = await db.select().from(schema.templates);
  let configsFixed = 0;

  for (const template of templates) {
    const config = template.config as any;
    const photosImages: string[] = config?.photos?.images || [];
    const heroImages: string[] = config?.hero?.images || [];

    const cleanPhotos = photosImages.filter((u: string) => !u.startsWith('/api/images/serve/'));
    const cleanHero = heroImages.filter((u: string) => !u.startsWith('/api/images/serve/'));

    const photosChanged = cleanPhotos.length !== photosImages.length;
    const heroChanged = cleanHero.length !== heroImages.length;

    if (photosChanged || heroChanged) {
      console.log(`⚠️  Template: ${template.name} (${template.id}) [${template.slug}]`);
      if (photosChanged) {
        console.log(`   photos.images: ${photosImages.length} → ${cleanPhotos.length} (removed ${photosImages.length - cleanPhotos.length})`);
        photosImages.filter(u => u.startsWith('/api/images/serve/')).forEach(u => console.log(`     ✗ ${u}`));
      }
      if (heroChanged) {
        console.log(`   hero.images: ${heroImages.length} → ${cleanHero.length} (removed ${heroImages.length - cleanHero.length})`);
        heroImages.filter(u => u.startsWith('/api/images/serve/')).forEach(u => console.log(`     ✗ ${u}`));
      }

      if (!isDryRun) {
        const newConfig = { ...config };
        if (photosChanged) newConfig.photos = { ...config.photos, images: cleanPhotos };
        if (heroChanged) newConfig.hero = { ...config.hero, images: cleanHero };
        await db.update(schema.templates).set({ config: newConfig }).where(eq(schema.templates.id, template.id));
        console.log(`   ✅ Config updated`);
      } else {
        console.log(`   🔵 [dry-run] Would update config`);
      }
      console.log('');
      configsFixed++;
    }
  }

  console.log(`✅ Done. ${localOnlyRecords.length} DB records and ${configsFixed} template configs ${isDryRun ? 'would be' : 'were'} cleaned.\n`);
  await pool.end();
}

main().catch(e => { console.error('❌ Script failed:', e); process.exit(1); });
