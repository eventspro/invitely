import express from 'express';
import { db } from '../db.js';
import { managementUsers, orders, userAdminPanels, templates, platformSettings } from '../../shared/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { hashPassword } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// ─── Auth middleware (reuses the same JWT_SECRET as admin.ts) ─────────────────
const authenticatePlatformAdmin = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

router.use(authenticatePlatformAdmin);

// ─── GET all customers (active + inactive) with template name ─────────────────
router.get('/ultimate-customers', async (req, res) => {
  try {
    const customers = await db
      .select({
        id: managementUsers.id,
        email: managementUsers.email,
        firstName: managementUsers.firstName,
        lastName: managementUsers.lastName,
        templateId: userAdminPanels.templateId,
        templateSlug: userAdminPanels.templateSlug,
        templateName: templates.name,
        createdAt: managementUsers.createdAt,
        isActive: userAdminPanels.isActive,
        panelId: userAdminPanels.id,
        role: userAdminPanels.role,
      })
      .from(managementUsers)
      .leftJoin(userAdminPanels, eq(managementUsers.id, userAdminPanels.userId))
      .leftJoin(templates, eq(userAdminPanels.templateId, templates.id))
      .orderBy(desc(managementUsers.createdAt));

    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// ─── GET all templates grouped by main / cloned ───────────────────────────────
router.get('/templates', async (req, res) => {
  try {
    const allTemplates = await db
      .select({
        id: templates.id,
        name: templates.name,
        slug: templates.slug,
        templateKey: templates.templateKey,
        ownerEmail: templates.ownerEmail,
        isMain: templates.isMain,
        sourceTemplateId: templates.sourceTemplateId,
        maintenance: templates.maintenance,
        createdAt: templates.createdAt,
      })
      .from(templates)
      .orderBy(desc(templates.createdAt));

    res.json({
      mainTemplates: allTemplates.filter(t => t.isMain),
      clonedTemplates: allTemplates.filter(t => !t.isMain),
      all: allTemplates,
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create new Ultimate customer
router.post('/create-ultimate-customer', async (req, res) => {
  try {
    const { email, firstName, lastName, password, templateId, templateSlug } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName || !password || !templateId || !templateSlug) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email already exists
    const [existingUser] = await db.select().from(managementUsers).where(eq(managementUsers.email, email));
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check if template slug is already taken
    const [existingSlug] = await db.select().from(userAdminPanels).where(eq(userAdminPanels.templateSlug, templateSlug));
    if (existingSlug) {
      return res.status(400).json({ error: 'Template slug is already taken' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // All three inserts in a single transaction — if any step fails, everything rolls back
    let createdUser: typeof managementUsers.$inferSelect;
    await db.transaction(async (tx) => {
      // Create user
      const [user] = await tx.insert(managementUsers).values({
        email,
        firstName,
        lastName,
        passwordHash: hashedPassword,
        status: 'active',
        emailVerified: true // Skip email verification for admin-created users
      }).returning();
      createdUser = user;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create order record
      const [order] = await tx.insert(orders).values({
        orderNumber,
        userId: user.id,
        templateId,
        templatePlan: 'ultimate',
        amount: '37000.00',
        paymentMethod: 'cash',
        status: 'completed',
        adminAccessGranted: true
      }).returning();

      // Create admin panel access
      await tx.insert(userAdminPanels).values({
        userId: user.id,
        templateId,
        templateSlug,
        orderId: order.id,
        isActive: true
      });
    });

    res.json({
      success: true,
      message: 'Ultimate customer created successfully',
      customer: {
        id: createdUser!.id,
        email: createdUser!.email,
        firstName: createdUser!.firstName,
        lastName: createdUser!.lastName,
        templateSlug,
        adminUrl: `/${templateSlug}/admin`
      }
    });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Get customer details
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const [customer] = await db.select({
      id: managementUsers.id,
      email: managementUsers.email,
      firstName: managementUsers.firstName,
      lastName: managementUsers.lastName,
      status: managementUsers.status,
      createdAt: managementUsers.createdAt,
      templateId: userAdminPanels.templateId,
      templateSlug: userAdminPanels.templateSlug,
      isActive: userAdminPanels.isActive,
      role: userAdminPanels.role,
    })
    .from(managementUsers)
    .leftJoin(userAdminPanels, eq(managementUsers.id, userAdminPanels.userId))
    .where(eq(managementUsers.id, customerId));

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Update customer
router.put('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { firstName, lastName, email, isActive, role } = req.body;

    // Update user details
    await db.update(managementUsers)
      .set({ firstName, lastName, email })
      .where(eq(managementUsers.id, customerId));

    // Update role explicitly (typed, so Drizzle can map camelCase→snake_case)
    if (role === 'customer' || role === 'super_admin') {
      const updated = await db.update(userAdminPanels)
        .set({ role: role as string })
        .where(eq(userAdminPanels.userId, customerId))
        .returning({ id: userAdminPanels.id });
      if (updated.length === 0) {
        console.warn(`[platform-admin] PUT /customer/${customerId}: role update matched 0 panel rows`);
      }
    }

    // Update isActive explicitly
    if (typeof isActive === 'boolean') {
      const updated = await db.update(userAdminPanels)
        .set({ isActive })
        .where(eq(userAdminPanels.userId, customerId))
        .returning({ id: userAdminPanels.id });
      if (updated.length === 0) {
        console.warn(`[platform-admin] PUT /customer/${customerId}: isActive update matched 0 panel rows`);
      }
    }

    res.json({ success: true, message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// ─── PATCH deactivate / activate ─────────────────────────────────────────────
router.patch('/customer/:customerId/deactivate', async (req, res) => {
  try {
    const { customerId } = req.params;
    const updated = await db.update(userAdminPanels)
      .set({ isActive: false })
      .where(eq(userAdminPanels.userId, customerId))
      .returning({ id: userAdminPanels.id });
    if (updated.length === 0) {
      console.warn(`[platform-admin] deactivate: no panel row found for userId=${customerId}`);
      return res.status(404).json({ error: 'No admin panel found for this customer' });
    }
    res.json({ success: true, message: 'Customer deactivated' });
  } catch (error) {
    console.error('Deactivate error:', error);
    res.status(500).json({ error: 'Failed to deactivate customer' });
  }
});

router.patch('/customer/:customerId/activate', async (req, res) => {
  try {
    const { customerId } = req.params;
    const updated = await db.update(userAdminPanels)
      .set({ isActive: true })
      .where(eq(userAdminPanels.userId, customerId))
      .returning({ id: userAdminPanels.id });
    if (updated.length === 0) {
      console.warn(`[platform-admin] activate: no panel row found for userId=${customerId}`);
      return res.status(404).json({ error: 'No admin panel found for this customer' });
    }
    res.json({ success: true, message: 'Customer activated' });
  } catch (error) {
    console.error('Activate error:', error);
    res.status(500).json({ error: 'Failed to activate customer' });
  }
});

router.delete('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    await db.delete(userAdminPanels).where(eq(userAdminPanels.userId, customerId));
    await db.delete(managementUsers).where(eq(managementUsers.id, customerId));
    res.json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// ─── PUT /site-settings — update social_links (and other site-level settings) ─
router.put('/site-settings', async (req, res) => {
  try {
    const { instagram, telegram, facebook } = req.body as {
      instagram?: string;
      telegram?: string;
      facebook?: string;
    };

    const value = { instagram: instagram ?? '', telegram: telegram ?? '', facebook: facebook ?? '' };

    const [existing] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, 'social_links'))
      .limit(1);

    if (existing) {
      await db
        .update(platformSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(platformSettings.key, 'social_links'));
    } else {
      await db.insert(platformSettings).values({
        key: 'social_links',
        value,
        description: 'Social media links displayed on the homepage contact section',
      });
    }

    res.json({ success: true, value });
  } catch (error) {
    console.error('Update site settings error:', error);
    res.status(500).json({ error: 'Failed to update site settings' });
  }
});

export default router;