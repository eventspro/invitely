import express from 'express';
import { db } from '../db.js';
import { managementUsers, orders, userAdminPanels, templates } from '../../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { hashPassword, generateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all Ultimate customers
router.get('/ultimate-customers', async (req, res) => {
  try {
    const customers = await db.select({
      id: managementUsers.id,
      email: managementUsers.email,
      firstName: managementUsers.firstName,
      lastName: managementUsers.lastName,
      templateId: userAdminPanels.templateId,
      templateSlug: userAdminPanels.templateSlug,
      createdAt: managementUsers.createdAt,
      isActive: userAdminPanels.isActive
    })
    .from(managementUsers)
    .leftJoin(userAdminPanels, eq(managementUsers.id, userAdminPanels.userId))
    .where(eq(userAdminPanels.isActive, true))
    .orderBy(desc(managementUsers.createdAt));

    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
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

    // Create user
    const [user] = await db.insert(managementUsers).values({
      email,
      firstName,
      lastName,
      passwordHash: hashedPassword,
      status: 'active',
      emailVerified: true // Skip email verification for admin-created users
    }).returning();

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order record
    const [order] = await db.insert(orders).values({
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
    await db.insert(userAdminPanels).values({
      userId: user.id,
      templateId,
      templateSlug,
      orderId: order.id,
      isActive: true
    });

    res.json({
      success: true,
      message: 'Ultimate customer created successfully',
      customer: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
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
      isActive: userAdminPanels.isActive
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
    const { firstName, lastName, email, isActive } = req.body;

    // Update user
    await db.update(managementUsers)
      .set({ firstName, lastName, email })
      .where(eq(managementUsers.id, customerId));

    // Update admin panel status
    await db.update(userAdminPanels)
      .set({ isActive })
      .where(eq(userAdminPanels.userId, customerId));

    res.json({ success: true, message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

export default router;