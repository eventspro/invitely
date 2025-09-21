import { db } from '../server/db';
import { templates } from '../shared/schema';
import { nanoid } from 'nanoid';

async function cloneTemplate() {
  try {
    // Get the "Forest & Lily Nature Wedding" template to clone
    const sourceTemplate = await db.query.templates.findFirst({
      where: (templates, { eq }) => eq(templates.slug, 'forest-lily-nature')
    });

    if (!sourceTemplate) {
      console.log('❌ Source template not found');
      return;
    }

    console.log(`📋 Found source template: ${sourceTemplate.name}`);

    // Generate a unique slug for the clone
    const timestamp = Date.now();
    const newSlug = `${sourceTemplate.slug}-clone-${timestamp}`;
    const newName = `${sourceTemplate.name} (Clone)`;

    // Create the cloned template
    const clonedTemplate = await db.insert(templates).values({
      id: nanoid(),
      name: newName,
      slug: newSlug,
      templateKey: sourceTemplate.templateKey,
      config: sourceTemplate.config,
      ownerEmail: '',
      maintenance: false,
      maintenancePassword: null,
      sourceTemplateId: sourceTemplate.id,
      isMain: false,
    }).returning();

    console.log(`✅ Successfully cloned template!`);
    console.log(`📋 New template ID: ${clonedTemplate[0].id}`);
    console.log(`📋 New template name: ${clonedTemplate[0].name}`);
    console.log(`📋 New template slug: ${clonedTemplate[0].slug}`);
    console.log(`🌐 You can access it at: http://localhost:5173/${clonedTemplate[0].slug}`);
    console.log(`⚙️ Edit it at: http://localhost:5173/admin/${clonedTemplate[0].id}`);

    return clonedTemplate[0];
  } catch (error) {
    console.error('❌ Error cloning template:', error);
  }
}

// Run the clone function
cloneTemplate().then(() => {
  console.log('🎉 Template cloning completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
