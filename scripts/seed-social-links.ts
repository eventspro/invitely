import { db } from '../server/db.js';
import { platformSettings } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const val = {
  instagram: 'https://www.instagram.com/weddingsites_am',
  telegram: 'https://t.me/weddingsites_am',
  facebook: 'https://www.facebook.com/weddingsites.am',
};

const [existing] = await db
  .select()
  .from(platformSettings)
  .where(eq(platformSettings.key, 'social_links'))
  .limit(1);

if (existing) {
  console.log('social_links already exists:', JSON.stringify(existing.value));
} else {
  const [row] = await db
    .insert(platformSettings)
    .values({
      key: 'social_links',
      value: val,
      description: 'Social media links displayed on the homepage contact section',
    })
    .returning();
  console.log('Inserted social_links:', JSON.stringify(row.value));
}

process.exit(0);
