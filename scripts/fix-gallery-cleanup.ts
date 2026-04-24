/**
 * fix-gallery-cleanup.ts
 * 
 * One-time script to remove misclassified images from the gallery (photos.images)
 * JSONB config for all templates.
 *
 * A "misclassified" gallery image is any URL that exists in the `images` DB table
 * under a non-gallery category (e.g. location-church, hero, etc.).
 *
 * Run LOCALLY against production DB only if you intend to clean prod data:
 *   tsx scripts/fix-gallery-cleanup.ts
 *
 * Run with --dry-run to preview changes without writing:
 *   tsx scripts/fix-gallery-cleanup.ts --dry-run
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
  console.log(`\n🔍 Gallery cleanup ${isDryRun ? '(DRY RUN — no writes)' : '(LIVE — will write to DB)'}\n`);
  console.log(`📡 Database: ${process.env.DATABASE_URL?.substring(0, 50)}...\n`);

  // 1. Load all DB image records that are NOT gallery
  const allImages = await db.select().from(schema.images);
  const nonGalleryUrlSet = new Set(
    allImages.filter(img => img.category !== 'gallery').map(img => img.url)
  );
  const galleryUrlSet = new Set(
    allImages.filter(img => img.category === 'gallery').map(img => img.url)
  );

  console.log(`📊 DB images: ${allImages.length} total, ${galleryUrlSet.size} gallery, ${nonGalleryUrlSet.size} other categories\n`);

  // 2. Load all templates
  const templates = await db.select().from(schema.templates);
  console.log(`📋 Checking ${templates.length} templates...\n`);

  let totalFixed = 0;

  for (const template of templates) {
    const config = template.config as any;
    const photosImages: string[] = config?.photos?.images || [];

    if (photosImages.length === 0) continue;

    // Find URLs that shouldn't be in the gallery
    const contaminated = photosImages.filter(url => nonGalleryUrlSet.has(url));
    // Also find DB-duplicate URLs (already tracked in DB gallery; safe to keep in JSONB but clean up)
    const cleaned = photosImages.filter(url => !nonGalleryUrlSet.has(url));

    if (contaminated.length > 0) {
      console.log(`⚠️  Template: ${template.name} (${template.id})`);
      console.log(`   Slug: ${template.slug}`);
      console.log(`   Contaminated gallery URLs (${contaminated.length}):`);
      contaminated.forEach(url => console.log(`     ✗ ${url}`));
      console.log(`   Keeping ${cleaned.length} clean URLs`);

      if (!isDryRun) {
        const newConfig = {
          ...config,
          photos: {
            ...config.photos,
            images: cleaned,
          },
        };
        await db
          .update(schema.templates)
          .set({ config: newConfig })
          .where(eq(schema.templates.id, template.id));
        console.log(`   ✅ Config updated`);
        totalFixed++;
      } else {
        console.log(`   🔵 [dry-run] Would update config`);
        totalFixed++;
      }
      console.log('');
    }
  }

  // 3. Also check for DB gallery records that are misclassified — list them for manual review
  const suspectDbRecords = allImages.filter(img =>
    img.category === 'gallery' &&
    (img.name?.toLowerCase().includes('church') ||
     img.name?.toLowerCase().includes('location') ||
     img.url?.toLowerCase().includes('location'))
  );

  if (suspectDbRecords.length > 0) {
    console.log(`\n🔶 Suspect DB gallery records (may need manual deletion):`);
    for (const rec of suspectDbRecords) {
      console.log(`  ID: ${rec.id} | Template: ${rec.templateId} | Name: ${rec.name} | URL: ${rec.url}`);
    }
    console.log(`\n  To delete a suspect record, run:`);
    console.log(`  tsx scripts/fix-gallery-cleanup.ts --delete-id=<id>\n`);
  }

  // Handle --delete-id flag
  const deleteArg = process.argv.find(a => a.startsWith('--delete-id='));
  if (deleteArg) {
    const id = deleteArg.split('=')[1];
    if (!isDryRun) {
      await db.delete(schema.images).where(eq(schema.images.id, id));
      console.log(`🗑️  Deleted DB image record: ${id}`);
    } else {
      console.log(`🔵 [dry-run] Would delete DB image record: ${id}`);
    }
  }

  console.log(`\n✅ Done. ${totalFixed} template(s) ${isDryRun ? 'would be' : 'were'} fixed.\n`);
  await pool.end();
}

main().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
